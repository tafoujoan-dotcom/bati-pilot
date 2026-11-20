import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import type { DatabaseState } from './db.ts';
import type { VaultDocumentRecord, UserRole } from '../src/types';

export interface PostgresHealthStatus {
  mode: 'postgresql' | 'in-memory';
  connected: boolean;
  provider: string;
  schemaTablesCount: number;
  lastPersistedAt: string | null;
  error?: string;
}

class PostgresPersistenceEngine {
  private pool: Pool | null = null;
  private connected = false;
  private lastPersistedAt: string | null = null;
  private lastError: string | undefined;
  private persistTimer: NodeJS.Timeout | null = null;
  private isWriting = false;
  private needsResync = false;

  // Callbacks enregistrés par db & permissionsManager pour éviter dépendances circulaires
  private exportDbStateFn: (() => DatabaseState) | null = null;
  private hydrateDbStateFn: ((state: DatabaseState) => void) | null = null;
  private exportPermsFn: (() => Record<string, any>) | null = null;
  private hydratePermsFn: ((overrides: Record<string, any>) => void) | null = null;

  registerAdapters(adapters: {
    exportDbState: () => DatabaseState;
    hydrateDbState: (state: DatabaseState) => void;
    exportPerms: () => Record<string, any>;
    hydratePerms: (overrides: Record<string, any>) => void;
  }) {
    this.exportDbStateFn = adapters.exportDbState;
    this.hydrateDbStateFn = adapters.hydrateDbState;
    this.exportPermsFn = adapters.exportPerms;
    this.hydratePermsFn = adapters.hydratePerms;
  }

  isPostgresActive(): boolean {
    return this.connected && this.pool !== null;
  }

  getHealth(): PostgresHealthStatus {
    return {
      mode: this.connected ? 'postgresql' : 'in-memory',
      connected: this.connected,
      provider: this.connected ? 'PostgreSQL (pg.Pool)' : 'Mémoire locale (DATABASE_URL non configuré)',
      schemaTablesCount: 30,
      lastPersistedAt: this.lastPersistedAt,
      ...(this.lastError ? { error: this.lastError } : {}),
    };
  }

  async initialize(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      this.connected = false;
      console.log(
        '[BATI-PILOT][DB] Variable DATABASE_URL absente — fonctionnement en mode mémoire locale (idéal pour aperçu). Ajoutez DATABASE_URL pour activer PostgreSQL.'
      );
      return;
    }

    const isLocalhost =
      databaseUrl.includes('localhost') ||
      databaseUrl.includes('127.0.0.1') ||
      databaseUrl.includes('sslmode=disable');

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
    });

    this.pool.on('error', (err) => {
      console.error('[BATI-PILOT][PostgreSQL] Erreur pool inattendue:', err.message);
    });

    try {
      await this.pool.query('SELECT 1');
      await this.ensureSchema();
      await this.hydrateOrSeedDatabase();
      this.connected = true;
      this.lastError = undefined;
      console.log('[BATI-PILOT][PostgreSQL] Connexion établie, schéma vérifié et état hydraté avec succès.');
    } catch (err: any) {
      this.connected = false;
      this.lastError = err?.message || 'Erreur de connexion PostgreSQL';
      console.error('[BATI-PILOT][PostgreSQL] Échec initialisation:', this.lastError);
      throw err;
    }
  }

  private async ensureSchema(): Promise<void> {
    if (!this.pool) return;

    // 1. Exécuter le schéma relationnel complet des 30 tables BTP
    const schemaPath = path.resolve(process.cwd(), 'server/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await this.pool.query(schemaSql);
    }

    // 2. Tables de persistance applicative complète & fichiers coffre-fort
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bati_state_store (
        state_key VARCHAR(128) PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bati_vault_files (
        id VARCHAR(64) PRIMARY KEY,
        company_id VARCHAR(64) NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data_base64 TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_bati_vault_company ON bati_vault_files(company_id);
    `);
  }

  private async hydrateOrSeedDatabase(): Promise<void> {
    if (!this.pool || !this.exportDbStateFn || !this.hydrateDbStateFn) return;

    const stateRes = await this.pool.query<{ state_key: string; payload: any }>(
      `SELECT state_key, payload FROM bati_state_store WHERE state_key IN ('domain_state', 'permissions_overrides')`
    );

    const domainRow = stateRes.rows.find((r) => r.state_key === 'domain_state');
    const permsRow = stateRes.rows.find((r) => r.state_key === 'permissions_overrides');

    if (domainRow?.payload) {
      const hydratedState = domainRow.payload as DatabaseState;

      // Réattacher les fichiers binaires/base64 du coffre-fort depuis bati_vault_files
      const filesRes = await this.pool.query<{ id: string; data_base64: string }>(
        `SELECT id, data_base64 FROM bati_vault_files`
      );
      const fileMap = new Map(filesRes.rows.map((r) => [r.id, r.data_base64]));

      if (Array.isArray(hydratedState.vaultDocuments)) {
        hydratedState.vaultDocuments = hydratedState.vaultDocuments.map((doc) => ({
          ...doc,
          ...(fileMap.has(doc.id) ? { dataBase64: fileMap.get(doc.id) } : {}),
        }));
      }

      this.hydrateDbStateFn(hydratedState);

      if (permsRow?.payload && this.hydratePermsFn) {
        this.hydratePermsFn(permsRow.payload);
      }

      console.log(
        `[BATI-PILOT][PostgreSQL] Données restaurées : ${hydratedState.companies?.length || 0} entreprises, ${hydratedState.users?.length || 0} utilisateurs, ${hydratedState.projects?.length || 0} chantiers.`
      );
    } else {
      // Premier démarrage sur une base vierge : persister les données initiales + relier tables relationnelles
      await this.persistStateNow();
      console.log('[BATI-PILOT][PostgreSQL] Base vierge initialisée (seed initial écrit dans PostgreSQL).');
    }
  }

  schedulePersist(): void {
    if (!this.connected || !this.pool) return;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      void this.persistStateNow();
    }, 150);
  }

  async persistStateNow(): Promise<void> {
    if (!this.pool || !this.exportDbStateFn) return;
    if (this.isWriting) {
      this.needsResync = true;
      return;
    }

    this.isWriting = true;
    try {
      const currentState = this.exportDbStateFn();
      const currentPerms = this.exportPermsFn ? this.exportPermsFn() : {};

      // Extraire dataBase64 des documents coffre-fort pour garder le JSONB léger et rapide
      const lightVaultDocs: VaultDocumentRecord[] = (currentState.vaultDocuments || []).map(
        ({ dataBase64, ...meta }) => meta
      );

      const lightState: DatabaseState = {
        ...currentState,
        vaultDocuments: lightVaultDocs,
      };

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          `INSERT INTO bati_state_store (state_key, payload, updated_at)
           VALUES ('domain_state', $1::jsonb, NOW())
           ON CONFLICT (state_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(lightState)]
        );

        await client.query(
          `INSERT INTO bati_state_store (state_key, payload, updated_at)
           VALUES ('permissions_overrides', $1::jsonb, NOW())
           ON CONFLICT (state_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(currentPerms)]
        );

        // Synchroniser également les tables relationnelles clés (companies & users)
        for (const c of currentState.companies || []) {
          await client.query(
            `INSERT INTO companies (id, name, slug, legal_number, address, city, country, currency, timezone, phone, email, plan, max_projects, max_users, status, trial_ends_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               legal_number = EXCLUDED.legal_number,
               address = EXCLUDED.address,
               city = EXCLUDED.city,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               plan = EXCLUDED.plan,
               max_projects = EXCLUDED.max_projects,
               max_users = EXCLUDED.max_users,
               status = EXCLUDED.status,
               updated_at = NOW()`,
            [
              c.id,
              c.name,
              c.slug,
              c.legalNumber || null,
              c.address,
              c.city,
              c.country || 'Cameroun',
              c.currency || 'XAF',
              c.timezone || 'Africa/Douala',
              c.phone,
              c.email,
              c.plan,
              c.maxProjects,
              c.maxUsers,
              c.status,
              c.trialEndsAt || null,
            ]
          );
        }

        const activeUserIds = (currentState.users || []).map((u) => u.id);
        for (const u of currentState.users || []) {
          await client.query(
            `INSERT INTO users (id, company_id, role, email, password_hash, first_name, last_name, phone, specialty, is_active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (id) DO UPDATE SET
               company_id = EXCLUDED.company_id,
               role = EXCLUDED.role,
               email = EXCLUDED.email,
               password_hash = EXCLUDED.password_hash,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               phone = EXCLUDED.phone,
               specialty = EXCLUDED.specialty,
               is_active = EXCLUDED.is_active,
               updated_at = NOW()`,
            [
              u.id,
              u.companyId,
              u.role,
              u.email,
              u.passwordHash,
              u.firstName,
              u.lastName,
              u.phone || '+237 600 00 00 00',
              u.specialty || null,
              u.isActive,
            ]
          );
        }

        if (activeUserIds.length > 0) {
          await client.query(`DELETE FROM users WHERE id != ALL($1::varchar[])`, [activeUserIds]);
        }

        await client.query('COMMIT');
        this.lastPersistedAt = new Date().toISOString();
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.lastError = err?.message;
      console.error('[BATI-PILOT][PostgreSQL] Erreur sauvegarde état:', err?.message);
    } finally {
      this.isWriting = false;
      if (this.needsResync) {
        this.needsResync = false;
        void this.persistStateNow();
      }
    }
  }

  async saveVaultFileToPg(doc: {
    id: string;
    companyId: string;
    fileName: string;
    mimeType: string;
    dataBase64?: string;
  }): Promise<void> {
    if (!this.pool || !this.connected || !doc.dataBase64) return;
    try {
      await this.pool.query(
        `INSERT INTO bati_vault_files (id, company_id, file_name, mime_type, data_base64)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET data_base64 = EXCLUDED.data_base64, file_name = EXCLUDED.file_name`,
        [doc.id, doc.companyId, doc.fileName, doc.mimeType, doc.dataBase64]
      );
    } catch (err: any) {
      console.error('[BATI-PILOT][PostgreSQL] Erreur sauvegarde fichier coffre-fort:', err?.message);
    }
  }

  async removeVaultFileFromPg(id: string): Promise<void> {
    if (!this.pool || !this.connected) return;
    try {
      await this.pool.query(`DELETE FROM bati_vault_files WHERE id = $1`, [id]);
    } catch (err: any) {
      console.error('[BATI-PILOT][PostgreSQL] Erreur suppression fichier coffre-fort:', err?.message);
    }
  }

  async logAuditEvent(params: {
    companyId: string;
    userId?: string;
    action: string;
    entityName: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    if (!this.pool || !this.connected) return;
    try {
      const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await this.pool.query(
        `INSERT INTO audit_logs (id, company_id, user_id, action, entity_name, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          params.companyId,
          params.userId || null,
          params.action,
          params.entityName,
          params.entityId || null,
          params.details || null,
          params.ipAddress || null,
        ]
      );
    } catch {
      // Ne jamais bloquer une requête métier si l'audit log échoue
    }
  }

  async getAuditLogs(companyId: string, role: UserRole, limit = 50): Promise<any[]> {
    if (!this.pool || !this.connected) return [];
    const res =
      role === 'SUPER_ADMIN'
        ? await this.pool.query(
            `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
            [limit]
          )
        : await this.pool.query(
            `SELECT * FROM audit_logs WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2`,
            [companyId, limit]
          );
    return res.rows;
  }
}

export const pgStore = new PostgresPersistenceEngine();
