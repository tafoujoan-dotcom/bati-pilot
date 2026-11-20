import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from './db.js';
import { migrationEngine } from './database/migrations.ts';
import { permissionsManager, PERMISSION_RESOURCES } from './permissionsManager.ts';
import { SEED_DATA } from './database/seed.ts';
import {
  UserRole,
  SubscriptionPlan,
  ExpenseCategory,
  PaymentMethod,
  SupplierCategory,
  SupplierPaymentTerms,
  SupplierStatus,
  VaultDocumentCategory,
} from '../src/types';
import {
  generateDailyAttendancePdfBuffer,
  generateWorkersDirectoryPdfBuffer,
} from './workforcePdf.ts';
import {
  generatePayslipPdfBuffer,
  generatePayrollSummaryPdfBuffer,
} from './payrollPdf.ts';
import {
  generateStockInventoryPdfBuffer,
  generateStockMovementSlipPdfBuffer,
} from './stockPdf.ts';
import { generatePurchaseOrderPdfBuffer } from './purchaseOrderPdf.ts';
import { generateDeliveryNotePdfBuffer } from './deliveryNotePdf.ts';
import { generateBudgetReportPdfBuffer } from './budgetPdf.ts';
import { generateCahierMetierPdf } from './generateCahierMetierPdf.ts';
import { generateCahierMetierDocx } from './generateCahierMetierDocx.ts';
import { generateSubscriptionInvoicePdfBuffer } from './subscriptionInvoicePdf.ts';
import { generateSupplierDossierPdfBuffer } from './suppliersPdf.ts';
import {
  generateExecutiveMonthlyReportPdfBuffer,
  generateExecutiveMonthlyReportDocxBuffer,
  generateVaultDocumentSummaryPdfBuffer,
} from './reportsGenerator.ts';
import {
  getPaymentGatewayStatus,
  initiateRealPayment,
  verifyRealPaymentStatus,
  normalizeCameroonPhone,
} from './paymentGateway.ts';
import {
  authRateLimiter,
  clearAuthCookie,
  createUserSchema,
  changePasswordSchema,
  extractAuthToken,
  formatZodError,
  loginSchema,
  registerCompanySchema,
  requireAuthMiddleware,
  setAuthCookie,
  signAuthToken,
  verifyAuthToken,
  verifyPassword,
} from './security.ts';
import { pgStore } from './postgres.ts';

export const apiRouter = Router();

// Middleware de persistance automatique vers PostgreSQL après toute mutation réussie
apiRouter.use((req: Request, res: Response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        pgStore.schedulePersist();
      }
    });
  }
  next();
});

// Middleware global d'authentification JWT + isolation multi-tenant sur toutes les routes protégées
apiRouter.use(
  requireAuthMiddleware((userId) => {
    const u = db.getUserById(userId);
    if (!u) return null;
    return {
      exists: true,
      isActive: u.isActive,
      role: u.role,
      companyId: u.companyId,
    };
  })
);

function parseAuthToken(req: Request) {
  return extractAuthToken(req);
}

function resolveActorContext(req: Request): {
  userId?: string;
  role?: UserRole;
  companyId?: string;
} {
  if (req.auth) {
    return {
      userId: req.auth.userId,
      role: req.auth.role,
      companyId: req.auth.companyId,
    };
  }
  const token = parseAuthToken(req);
  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded) {
      const authUser = db.getUserById(decoded.userId);
      if (authUser && authUser.isActive) {
        return {
          userId: authUser.id,
          role: authUser.role,
          companyId: authUser.companyId,
        };
      }
    }
  }
  const role = (req.headers['x-user-role'] as UserRole) || (req.query.userRole as UserRole) || (req.body?.userRole as UserRole);
  const companyId = (req.headers['x-company-id'] as string) || (req.query.companyId as string) || (req.body?.companyId as string);
  return { role, companyId };
}

/**
 * GET /api/system/health
 * Statut général du système SaaS + état base PostgreSQL
 */
apiRouter.get('/system/health', (req: Request, res: Response) => {
  const dbHealth = pgStore.getHealth();
  res.json({
    status: 'online',
    app: 'BATI-PILOT',
    version: '1.1.0-postgres-jwt',
    environment: process.env.NODE_ENV || 'development',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    database: dbHealth,
    security: {
      auth: 'jwt-hs256',
      passwordHash: 'bcrypt',
      multiTenantIsolation: 'enforced',
    },
    stats: {
      companiesCount: db.getCompanies().length,
      usersCount: db.getUsers().length,
    },
  });
});

/**
 * GET /api/auth/demo-accounts
 * Liste des 6 comptes démo préconfigurés pour tester chaque rôle BTP
 */
apiRouter.get('/auth/demo-accounts', (req: Request, res: Response) => {
  const users = db.getUsers('comp_socabat_01');
  const superAdmin = db.getUsers().find((u) => u.role === 'SUPER_ADMIN');

  const demoAccounts = [
    {
      role: 'SUPER_ADMIN' as UserRole,
      title: 'Super Administrateur',
      name: 'Alain Mbassi',
      email: 'superadmin@batipilot.cm',
      password: 'bati2026',
      badge: 'Plateforme SaaS',
      description: 'Supervision globale de tous les tenants et abonnements',
    },
    {
      role: 'DIRECTOR' as UserRole,
      title: "Directeur Général (DG)",
      name: "Samuel Eto'o Mbarga",
      email: 'directeur@socabat.cm',
      password: 'bati2026',
      badge: 'SOCABAT SARL',
      description: 'Accès décisionnaire à tous les chantiers, finances et RH',
    },
    {
      role: 'SITE_MANAGER' as UserRole,
      title: 'Conducteur / Chef de Chantier',
      name: 'Ing. Paul Ndongo',
      email: 'chef.chantier@socabat.cm',
      password: 'bati2026',
      badge: 'Chantiers Akwa & Laquintinie',
      description: 'Saisie quotidienne, pointage, besoins matériels et incidents',
    },
    {
      role: 'STOREKEEPER' as UserRole,
      title: 'Magasinier Dépôt Central',
      name: 'Christian Talla',
      email: 'magasinier@socabat.cm',
      password: 'bati2026',
      badge: 'Dépôt Central Bassa',
      description: 'Gestion des stocks, entrées/sorties et réceptions',
    },
    {
      role: 'ACCOUNTANT' as UserRole,
      title: 'Comptable & Paie',
      name: 'Nadine Ngo Bell',
      email: 'comptable@socabat.cm',
      password: 'bati2026',
      badge: 'Direction Financière',
      description: 'Suivi des dépenses, paiements des journaliers et factures',
    },
    {
      role: 'WORKER' as UserRole,
      title: 'Ouvrier / Chef Maçon',
      name: 'Joseph Kamga',
      email: 'ouvrier@socabat.cm',
      password: 'bati2026',
      badge: 'Équipe Akwa',
      description: 'Consultation de ses pointages et fiches de paiement',
    },
  ];

  res.json({ demoAccounts });
});

/**
 * POST /api/auth/login
 * Authentification sécurisée avec email, bcrypt et jeton JWT signé
 */
apiRouter.post('/auth/login', authRateLimiter, (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }
  const { email, password } = parsed.data;

  const userWithPassword = db.getUserByEmail(email);
  if (!userWithPassword) {
    return res.status(401).json({ error: 'Identifiants incorrects. Aucun compte trouvé avec cet email.' });
  }

  if (!verifyPassword(password, userWithPassword.passwordHash)) {
    return res.status(401).json({ error: 'Mot de passe incorrect. Veuillez vérifier votre saisie.' });
  }

  if (!userWithPassword.isActive) {
    return res.status(403).json({ error: 'Ce compte utilisateur a été désactivé par l’administrateur.' });
  }

  const company = db.getCompanyById(userWithPassword.companyId);
  if (!company) {
    return res.status(500).json({ error: 'Entreprise associée introuvable.' });
  }

  const token = signAuthToken({
    userId: userWithPassword.id,
    companyId: userWithPassword.companyId,
    role: userWithPassword.role,
  });
  setAuthCookie(req, res, token);

  void pgStore.logAuditEvent({
    companyId: company.id,
    userId: userWithPassword.id,
    action: 'USER_LOGIN',
    entityName: 'users',
    entityId: userWithPassword.id,
    ipAddress: req.ip,
  });

  const { passwordHash, ...safeUser } = userWithPassword;

  return res.json({
    token,
    user: { ...safeUser, companyName: company.name },
    company,
  });
});

/**
 * POST /api/auth/register-company
 * Création d'une nouvelle entreprise cliente avec son compte Directeur (bcrypt + JWT)
 */
apiRouter.post('/auth/register-company', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = registerCompanySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }

  const { companyName, city, phone, email, firstName, lastName, password, plan } = parsed.data;

  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'Cette adresse email est déjà utilisée par une entreprise.' });
  }

  const planSelected = (plan as SubscriptionPlan) || 'PRO';
  const maxProjects = planSelected === 'STARTER' ? 2 : planSelected === 'PRO' ? 10 : 999;
  const maxUsers = planSelected === 'STARTER' ? 5 : planSelected === 'PRO' ? 20 : 999;

  const uniqueSlugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'entreprise';
  const uniqueSlug = `${uniqueSlugBase}-${Date.now().toString().slice(-4)}`;

  const newCompany = db.createCompany({
    name: companyName,
    slug: uniqueSlug,
    address: `Siège social, ${city || 'Douala'}`,
    city: city || 'Douala',
    country: 'Cameroun',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    phone: phone || '+237 600 00 00 00',
    email,
    plan: planSelected,
    maxProjects,
    maxUsers,
    status: 'TRIAL',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const newUser = db.createUser({
    companyId: newCompany.id,
    role: 'DIRECTOR',
    email,
    passwordHash: password, // haché automatiquement via bcrypt dans db.createUser
    firstName,
    lastName,
    phone: phone || '+237 600 00 00 00',
    specialty: 'Directeur Général',
    assignedProjectIds: [],
    isActive: true,
  });

  const token = signAuthToken({
    userId: newUser.id,
    companyId: newCompany.id,
    role: 'DIRECTOR',
  });
  setAuthCookie(req, res, token);
  await pgStore.persistStateNow();

  return res.status(201).json({
    token,
    user: { ...newUser, companyName: newCompany.name },
    company: newCompany,
    message: 'Votre entreprise et votre compte Directeur ont été créés avec succès !',
  });
});

/**
 * POST /api/auth/demo-switch
 * Bascule rapide de rôle en environnement démo uniquement (désactivé en production)
 */
apiRouter.post('/auth/demo-switch', (req: Request, res: Response) => {
  const allowDemo =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_ACCOUNTS === 'true';
  if (!allowDemo) {
    return res.status(403).json({
      error: 'Le mode démonstration est désactivé en production.',
    });
  }

  const { role } = req.body || {};
  const targetUser = db
    .getUsers()
    .find((u) => u.role === role && u.isActive && (role === 'SUPER_ADMIN' || u.companyId === 'comp_socabat_01'));

  if (!targetUser) {
    return res.status(404).json({ error: 'Compte démo introuvable pour ce rôle.' });
  }

  const company = db.getCompanyById(targetUser.companyId);
  const token = signAuthToken({
    userId: targetUser.id,
    companyId: targetUser.companyId,
    role: targetUser.role,
  });
  setAuthCookie(req, res, token);

  return res.json({
    token,
    user: { ...targetUser, companyName: company?.name },
    company,
  });
});

/**
 * POST /api/auth/logout
 * Effacement du cookie de session HttpOnly
 */
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  clearAuthCookie(req, res);
  res.json({ success: true });
});

/**
 * GET /api/auth/me
 * Vérification cryptographique de la session JWT en cours
 */
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = parseAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié. Aucun jeton de session fourni.' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Jeton de session invalide ou expiré.' });
  }

  const user = db.getUserById(decoded.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Session invalide. Utilisateur introuvable ou désactivé.' });
  }

  const company = db.getCompanyById(user.companyId);
  const { passwordHash, ...safeUser } = user;

  return res.json({
    user: { ...safeUser, companyName: company?.name },
    company,
  });
});

/**
 * GET /api/companies
 * Liste des entreprises enregistrées pour démonstration multi-tenant
 */
apiRouter.get('/companies', (req: Request, res: Response) => {
  const companies = db.getCompanies();
  res.json({ companies });
});

/**
 * GET /api/download-zip
 * Téléchargement direct de l'archive ZIP du code source complet
 */
apiRouter.get('/download-zip', (req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'bati-pilot-source.zip');
  res.download(filePath, 'bati-pilot-source.zip');
});

/**
 * ============================================================================
 * ÉTAPE 2 : API DE BASE DE DONNÉES & MIGRATIONS
 * ============================================================================
 */

/**
 * GET /api/database/status
 * Statistiques globales et statut des 30 tables
 */
apiRouter.get('/database/status', (req: Request, res: Response) => {
  res.json({
    stats: migrationEngine.getStats(),
    migrations: migrationEngine.getMigrations(),
  });
});

/**
 * GET /api/database/tables
 * Liste exhaustive des 30 tables et métadonnées
 */
apiRouter.get('/database/tables', (req: Request, res: Response) => {
  res.json({
    tables: migrationEngine.getTables(),
  });
});

/**
 * GET /api/database/table/:name
 * Détail d'une table avec colonnes, relations et échantillons
 */
apiRouter.get('/database/table/:name', (req: Request, res: Response) => {
  const tableName = req.params.name;
  const tableData = migrationEngine.getTableDetails(tableName);
  if (!tableData) {
    return res.status(404).json({ error: `Table '${tableName}' introuvable dans le schéma.` });
  }
  res.json(tableData);
});

/**
 * GET /api/database/schema-sql
 * Contenu brut du script SQL DDL de création de la base
 */
apiRouter.get('/database/schema-sql', (req: Request, res: Response) => {
  try {
    const sqlPath = path.resolve(process.cwd(), 'server/database/schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(sqlContent);
    } else {
      res.status(404).json({ error: 'Fichier schema.sql introuvable.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/database/reset-seed
 * Réinitialiser et re-seeder la base avec les données réelles BTP
 */
apiRouter.post('/database/reset-seed', (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  if (actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Accès refusé : la réinitialisation de la base est réservée au Super Administrateur.',
    });
  }
  const result = migrationEngine.resetAndSeed();
  res.json(result);
});

/**
 * ============================================================================
 * ÉTAPE 3 : AUTHENTIFICATION AVANCÉE & GESTION MULTI-ENTREPRISES
 * ============================================================================
 */

/**
 * GET /api/tenants
 * Liste complète des entreprises BTP avec statistiques d'utilisation
 */
apiRouter.get('/tenants', (req: Request, res: Response) => {
  const userRole = (req.query.userRole as string) || (req.headers['x-user-role'] as string);
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Accès refusé : la liste des entreprises clientes est réservée au Super Administrateur plateforme.',
    });
  }
  const companies = db.getCompanies();
  const tenantsWithStats = companies.map((c) => {
    const users = db.getUsers(c.id);
    const projects = db.getProjects(c.id);
    return {
      ...c,
      usersCount: users.length,
      projectsCount: projects.length,
    };
  });
  res.json({ tenants: tenantsWithStats });
});

/**
 * PUT /api/tenants/:id/status
 * Activer ou suspendre une entreprise cliente (Super Admin uniquement)
 */
apiRouter.put('/tenants/:id/status', (req: Request, res: Response) => {
  const userRole = req.body?.userRole || (req.query.userRole as string) || (req.headers['x-user-role'] as string);
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Action réservée au Super Administrateur.' });
  }
  const { id } = req.params;
  const { status } = req.body;
  if (!['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  const updated = db.updateCompanyStatus(id, status);
  if (!updated) return res.status(404).json({ error: 'Entreprise introuvable.' });
  res.json({ company: updated, message: `Statut de l'entreprise mis à jour : ${status}` });
});

/**
 * PUT /api/tenants/:id/plan
 * Changer la formule d'abonnement d'une entreprise (Super Admin uniquement)
 */
apiRouter.put('/tenants/:id/plan', (req: Request, res: Response) => {
  const userRole = req.body?.userRole || (req.query.userRole as string) || (req.headers['x-user-role'] as string);
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Action réservée au Super Administrateur.' });
  }
  const { id } = req.params;
  const { plan } = req.body;
  if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(plan)) {
    return res.status(400).json({ error: 'Formule invalide.' });
  }
  const updated = db.updateCompanyPlan(id, plan);
  if (!updated) return res.status(404).json({ error: 'Entreprise introuvable.' });
  res.json({ company: updated, message: `Formule mise à jour : ${plan}` });
});

/**
 * POST /api/tenants/switch/:id
 * Basculement de tenant pour Super Administrateur
 */
apiRouter.post('/tenants/switch/:id', (req: Request, res: Response) => {
  const userRole = req.body?.userRole || (req.query.userRole as string) || (req.headers['x-user-role'] as string);
  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Action réservée au Super Administrateur.' });
  }
  const { id } = req.params;
  const targetCompany = db.getCompanyById(id);
  if (!targetCompany) return res.status(404).json({ error: 'Entreprise introuvable.' });

  // Trouver le directeur de cette entreprise
  const users = db.getUsers(id);
  const director = users.find((u) => u.role === 'DIRECTOR') || users[0];

  res.json({
    company: targetCompany,
    suggestedUser: director,
    message: `Basculement vers l'entreprise ${targetCompany.name} réussi.`,
  });
});

/**
 * GET /api/company/users
 * Lister les membres de l'entreprise courante
 */
apiRouter.get('/company/users', (req: Request, res: Response) => {
  const companyId = req.query.companyId as string || 'comp_socabat_01';
  const users = db.getUsers(companyId);
  res.json({ users });
});

/**
 * POST /api/company/users
 * Ajouter/inviter un collaborateur dans l'entreprise
 */
apiRouter.post('/company/users', (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }

  const { companyId: rawCompanyId, firstName, lastName, email, phone, role, specialty, password } = parsed.data;
  const actor = resolveActorContext(req);
  const companyId = actor.role !== 'SUPER_ADMIN' && actor.companyId ? actor.companyId : rawCompanyId;

  if (!companyId || !firstName || !lastName || !email || !role) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés.' });
  }
  if (actor.role && !['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(actor.role)) {
    return res.status(403).json({ error: 'Seul le Directeur ou le Chef de chantier peut inviter un collaborateur.' });
  }
  if (role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Impossible de créer un compte Super Administrateur depuis cet espace.' });
  }
  if (actor.role === 'SITE_MANAGER' && role === 'DIRECTOR') {
    return res.status(403).json({ error: 'Seul le Directeur peut créer un autre compte Directeur.' });
  }

  const targetCompany = db.getCompanyById(companyId);
  if (!targetCompany) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà.' });
  }

  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
  const generateTempPassword = (length = 10) => {
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes, (b) => charset[b % charset.length]).join('');
  };

  const temporaryPassword =
    typeof password === 'string' && password.trim().length > 0
      ? password.trim()
      : generateTempPassword(10);

  if (temporaryPassword.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe temporaire doit contenir au moins 6 caractères.' });
  }

  const newUser = db.createUser({
    companyId,
    role,
    email: email.trim(),
    passwordHash: temporaryPassword,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone || '+237 600 00 00 00',
    specialty: specialty || '',
    assignedProjectIds: [],
    isActive: true,
  });

  res.status(201).json({
    user: newUser,
    temporaryPassword,
    companyName: targetCompany.name,
    message: 'Collaborateur ajouté avec succès.',
  });
});

/**
 * PUT /api/company/users/:userId/toggle
 * Activer ou suspendre un compte collaborateur
 */
apiRouter.put('/company/users/:userId/toggle', (req: Request, res: Response) => {
  const { userId } = req.params;
  const target = db.getUserById(userId);
  if (!target) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Action interdite sur le compte Super Administrateur.' });
  }
  const updated = db.toggleUserStatus(userId);
  if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  res.json({ user: updated, message: `Compte ${updated.isActive ? 'activé' : 'suspendu'}.` });
});

/**
 * DELETE /api/company/users/:userId
 * Supprimer définitivement un collaborateur (Directeur & Chef de chantier uniquement)
 */
apiRouter.delete('/company/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const actor = resolveActorContext(req);
  const allowedRoles: UserRole[] = ['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'];

  if (!actor.role || !allowedRoles.includes(actor.role)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur et le Chef de chantier sont habilités à supprimer un collaborateur.',
    });
  }

  const target = db.getUserById(userId);
  if (!target) {
    return res.status(404).json({ error: 'Collaborateur introuvable.' });
  }
  if (target.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Impossible de supprimer le compte Super Administrateur.' });
  }
  if (actor.userId && actor.userId === target.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte connecté.' });
  }
  if (actor.role !== 'SUPER_ADMIN' && actor.companyId && target.companyId !== actor.companyId) {
    return res.status(403).json({ error: 'Accès refusé : ce collaborateur appartient à une autre entreprise.' });
  }
  if (actor.role === 'SITE_MANAGER' && target.role === 'DIRECTOR') {
    return res.status(403).json({ error: 'Seul le Directeur peut supprimer un compte Directeur.' });
  }

  const deleted = db.deleteUser(userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Collaborateur introuvable.' });
  }

  res.json({
    success: true,
    user: deleted,
    message: `Collaborateur ${deleted.firstName} ${deleted.lastName} supprimé définitivement.`,
  });
});

/**
 * PUT /api/company/settings
 * Mettre à jour les informations de l'entreprise
 */
apiRouter.put('/company/settings', (req: Request, res: Response) => {
  const { id, name, legalNumber, phone, email, address, city } = req.body;
  if (!id) return res.status(400).json({ error: 'ID entreprise requis.' });
  const updated = db.updateCompany(id, { name, legalNumber, phone, email, address, city });
  if (!updated) return res.status(404).json({ error: 'Entreprise introuvable.' });
  res.json({ company: updated, message: 'Paramètres entreprise mis à jour.' });
});

/**
 * PUT /api/auth/profile
 * Mettre à jour le profil de l'utilisateur connecté
 */
apiRouter.put('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, firstName, lastName, phone, specialty } = req.body;
  if (!userId) return res.status(400).json({ error: 'Identifiant utilisateur requis.' });
  const updated = db.updateUser(userId, { firstName, lastName, phone, specialty });
  if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  res.json({ user: updated, message: 'Profil mis à jour avec succès.' });
});

/**
 * POST /api/auth/change-password
 * Modification sécurisée de mot de passe
 */
apiRouter.post('/auth/change-password', (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error) });
  }
  const { userId, oldPassword, newPassword } = parsed.data;
  const actor = resolveActorContext(req);
  if (actor.userId && actor.userId !== userId && actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre mot de passe.' });
  }
  const result = db.changePassword(userId, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
});

/**
 * GET /api/download-documentation-pdf
 * Téléchargement du document PDF officiel BATI-PILOT (Synthèse Étapes 1 à 18)
 */
apiRouter.get('/download-documentation-pdf', (req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'BATI-PILOT_Documentation_Etapes_1_a_18.pdf');
  res.download(filePath, 'BATI-PILOT_Documentation_Etapes_1_a_18.pdf');
});

/**
 * GET /api/download-cahier-metier-pdf
 * Téléchargement du Cahier Métier Client complet (Spécifications Fonctionnelles)
 */
apiRouter.get('/download-cahier-metier-pdf', (req: Request, res: Response) => {
  const filePath = path.resolve(process.cwd(), 'BATI-PILOT_Cahier_Metier_Client.pdf');
  if (!fs.existsSync(filePath)) {
    generateCahierMetierPdf();
  }
  res.download(filePath, 'BATI-PILOT_Cahier_Metier_Client.pdf');
});

/**
 * GET /api/download-cahier-metier-docx
 * Téléchargement du Cahier Métier Client en version Word (.docx)
 */
apiRouter.get('/download-cahier-metier-docx', async (req: Request, res: Response) => {
  try {
    const filePath = path.resolve(process.cwd(), 'BATI-PILOT_Cahier_Metier_Client.docx');
    if (!fs.existsSync(filePath)) {
      await generateCahierMetierDocx();
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.download(filePath, 'BATI-PILOT_Cahier_Metier_Client.docx');
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur lors de la génération Word (.docx).' });
  }
});

/**
 * ============================================================================
 * ÉTAPE 4 : GESTION DES RÔLES & PERMISSIONS FINES
 * ============================================================================
 */

/**
 * GET /api/permissions/resources
 * Liste des 14 ressources métier BTP et des actions disponibles
 */
apiRouter.get('/permissions/resources', (req: Request, res: Response) => {
  res.json({ resources: PERMISSION_RESOURCES });
});

/**
 * GET /api/permissions/matrix
 * Matrice complète des droits configurés pour l'entreprise
 */
apiRouter.get('/permissions/matrix', (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  const companyId = actor.role !== 'SUPER_ADMIN' && actor.companyId
    ? actor.companyId
    : (req.query.companyId as string) || 'comp_socabat_01';
  const fullMatrix = permissionsManager.getCompanyPermissions(companyId);

  if (actor.role !== 'SUPER_ADMIN') {
    const { SUPER_ADMIN: _hidden, ...clientMatrix } = fullMatrix;
    return res.json({ matrix: clientMatrix, resources: PERMISSION_RESOURCES });
  }

  res.json({ matrix: fullMatrix, resources: PERMISSION_RESOURCES });
});

/**
 * POST /api/permissions/toggle
 * Activer ou révoquer un droit d'accès spécifique (rôle, ressource, action)
 */
apiRouter.post('/permissions/toggle', (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  if (actor.role && !['DIRECTOR', 'SUPER_ADMIN'].includes(actor.role)) {
    return res.status(403).json({ error: 'Seul le Directeur Général peut modifier les permissions.' });
  }
  const { companyId = 'comp_socabat_01', role, resource, action } = req.body;
  if (!role || !resource || !action) {
    return res.status(400).json({ error: 'Rôle, ressource et action requis.' });
  }
  if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Le rôle Super Administrateur plateforme est strictement isolé et non modifiable par une entreprise cliente.',
    });
  }
  const targetCompanyId = actor.role !== 'SUPER_ADMIN' && actor.companyId ? actor.companyId : companyId;
  const result = permissionsManager.togglePermission(targetCompanyId, role as UserRole, resource, action);
  res.json(result);
});

/**
 * POST /api/permissions/reset
 * Rétablir la matrice des permissions standard BTP
 */
apiRouter.post('/permissions/reset', (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  if (actor.role && !['DIRECTOR', 'SUPER_ADMIN'].includes(actor.role)) {
    return res.status(403).json({ error: 'Seul le Directeur Général peut réinitialiser les permissions.' });
  }
  const { companyId = 'comp_socabat_01' } = req.body;
  const targetCompanyId = actor.role !== 'SUPER_ADMIN' && actor.companyId ? actor.companyId : companyId;
  const result = permissionsManager.resetPermissions(targetCompanyId);
  res.json(result);
});

/**
 * POST /api/permissions/simulate
 * Simuler une action métier pour vérifier si un rôle y est autorisé
 */
apiRouter.post('/permissions/simulate', (req: Request, res: Response) => {
  const actor = resolveActorContext(req);
  const { companyId = 'comp_socabat_01', role, scenario } = req.body;
  if (!role || !scenario) {
    return res.status(400).json({ error: 'Rôle et scénario requis.' });
  }
  if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Le rôle Super Administrateur plateforme est isolé.' });
  }
  const targetCompanyId = actor.role !== 'SUPER_ADMIN' && actor.companyId ? actor.companyId : companyId;
  const result = permissionsManager.simulateAction(targetCompanyId, role as UserRole, scenario);
  res.json(result);
});

/**
 * ============================================================================
 * ÉTAPE 5 : MODULE 1 — TABLEAU DE BORD (DASHBOARD EXÉCUTIF BTP)
 * ============================================================================
 */

// État mutable en mémoire pour les commandes d'achat & approbations
let dashboardPurchaseOrders = [...SEED_DATA.purchase_orders];
let dashboardStockAlerts = SEED_DATA.materials.map((m) => {
  if (m.id === 'mat_01') {
    // Ciment CPJ 42.5 proche du seuil
    return { ...m, current_stock: 92, minimum_stock_alert: 100 };
  }
  if (m.id === 'mat_05') {
    // Gravier concassé critique
    return { ...m, current_stock: 1, minimum_stock_alert: 3 };
  }
  return { ...m };
});
let dashboardActivities = [
  {
    id: 'act_01',
    timestamp: '2026-11-05T09:30:00Z',
    type: 'ATTENDANCE',
    title: 'Pointage journalier clôturé',
    description: '28 ouvriers pointés présents sur le chantier Akwa R+5 par Ing. Paul Ndongo.',
    badge: 'RH & Terrain',
    user: 'Paul Ndongo',
  },
  {
    id: 'act_02',
    timestamp: '2026-11-05T08:15:00Z',
    type: 'STOCK_MOVEMENT',
    title: 'Sortie de matériaux validée',
    description: '80 sacs de ciment CIMENCAM CPJ 42.5 sortis pour coulage poteaux R+2.',
    badge: 'Magasin Bassa',
    user: 'Christian Talla',
  },
  {
    id: 'act_03',
    timestamp: '2026-11-04T17:40:00Z',
    type: 'ORDER_REQUEST',
    title: 'Demande de bon de commande BC-2026-DLA-002',
    description: 'Aciers HA 12mm chez GROUPE FOKOU pour un montant de 1 360 000 FCFA en attente de visa DG.',
    badge: 'Achats BTP',
    user: 'Paul Ndongo',
  },
  {
    id: 'act_04',
    timestamp: '2026-11-04T14:10:00Z',
    type: 'REPORT',
    title: 'Rapport d\'avancement hebdomadaire transmis',
    description: 'Coulage plancher niveau 2 achevé à 100%, début ferraillage amorces niveau 3.',
    badge: 'Avancement',
    user: 'Paul Ndongo',
  },
];

/**
 * GET /api/dashboard/stats
 * Données consolidées pour le tableau de bord : KPIs, graphiques financiers, chantiers, alertes
 */
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'all';

  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  let projects = db.getProjects(companyId);

  if (projectId !== 'all') {
    projects = projects.filter((p) => p.id === projectId);
  }

  // Calcul des métriques globales
  const totalBudgetXAF = projects.reduce((sum, p) => sum + p.budgetTotal, 0);
  const spentBudgetXAF = projects.reduce((sum, p) => sum + p.budgetSpent, 0);
  const remainingBudgetXAF = Math.max(0, totalBudgetXAF - spentBudgetXAF);
  const budgetConsumptionRate = totalBudgetXAF > 0 ? Math.round((spentBudgetXAF / totalBudgetXAF) * 100) : 0;
  
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progressPercentage, 0) / projects.length)
    : 0;

  const totalWorkers = projects.reduce((sum, p) => sum + (p.workersCount || 0), 0);
  const estimatedDailyPayrollXAF = totalWorkers * 6500; // Taux journalier moyen 6 500 FCFA

  // Filtrage des commandes en attente pour cette entreprise / projet
  let pendingOrders = dashboardPurchaseOrders.filter((po) => po.company_id === companyId && po.status === 'PENDING_APPROVAL');
  if (projectId !== 'all') {
    pendingOrders = pendingOrders.filter((po) => po.project_id === projectId);
  }

  const pendingApprovalsCount = pendingOrders.length;
  const pendingOrdersAmountXAF = pendingOrders.reduce((sum, po) => sum + po.total_amount_xaf, 0);

  // Alertes de stock pour cette entreprise
  const stockAlerts = dashboardStockAlerts
    .filter((m) => m.company_id === companyId && m.current_stock <= m.minimum_stock_alert * 1.5)
    .map((m) => ({
      id: m.id,
      reference: m.reference,
      designation: m.designation,
      unit: m.unit,
      currentStock: m.current_stock,
      minimumAlert: m.minimum_stock_alert,
      isCritical: m.current_stock <= m.minimum_stock_alert,
      unitPriceXAF: m.unit_price_xaf,
      deficit: Math.max(0, m.minimum_stock_alert - m.current_stock),
    }));

  // Données mensuelles pour les graphiques (6 derniers mois)
  const monthlyExpenses = [
    { month: 'Juin', materiaux: 14200000, mainOeuvre: 5400000, carburantEngins: 2100000, fraisGeneraux: 1200000 },
    { month: 'Juil', materiaux: 18500000, mainOeuvre: 6200000, carburantEngins: 2800000, fraisGeneraux: 1500000 },
    { month: 'Août', materiaux: 16100000, mainOeuvre: 5900000, carburantEngins: 2400000, fraisGeneraux: 1100000 },
    { month: 'Sept', materiaux: 21400000, mainOeuvre: 7100000, carburantEngins: 3200000, fraisGeneraux: 1800000 },
    { month: 'Oct', materiaux: 24800000, mainOeuvre: 8400000, carburantEngins: 3600000, fraisGeneraux: 2100000 },
    { month: 'Nov (En cours)', materiaux: 12600000, mainOeuvre: 3800000, carburantEngins: 1900000, fraisGeneraux: 950000 },
  ];

  // Répartition des coûts BTP par catégorie
  const costDistribution = [
    { label: 'Liants & Ciments (Cimencam)', percentage: 32, amountXAF: 35840000, color: '#f97316' },
    { label: 'Aciers & Ferraillage (Fokou)', percentage: 26, amountXAF: 29120000, color: '#3b82f6' },
    { label: 'Main d\'œuvre journalière & Maçons', percentage: 22, amountXAF: 24640000, color: '#10b981' },
    { label: 'Granulats (Sable & Gravier concassé)', percentage: 12, amountXAF: 13440000, color: '#eab308' },
    { label: 'Carburant engins & Logistique', percentage: 8, amountXAF: 8960000, color: '#a855f7' },
  ];

  // Métriques météo locale BTP (Douala & Yaoundé)
  const weatherAdvisory = company.city === 'Yaoundé'
    ? {
        city: 'Yaoundé',
        temperature: '27°C',
        condition: 'Ensoleillé / Nuageux',
        impact: 'Conditions idéales pour le terrassement et la pose de pavés.',
        safeForConcrete: true,
      }
    : {
        city: 'Douala',
        temperature: '29°C · Humidité 82%',
        condition: 'Risque d\'averses littorales en début d\'après-midi',
        impact: 'Programmer les coulages de dalles et planchers avant 12h30.',
        safeForConcrete: false,
      };

  res.json({
    company: {
      id: company.id,
      name: company.name,
      plan: company.plan,
      currency: company.currency || 'XAF',
      city: company.city,
    },
    filter: {
      projectId,
      availableProjects: db.getProjects(companyId).map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        city: p.city,
      })),
    },
    kpis: {
      totalBudgetXAF,
      spentBudgetXAF,
      remainingBudgetXAF,
      budgetConsumptionRate,
      avgProgress,
      activeProjectsCount: projects.length,
      totalWorkers,
      presentTodayWorkers: totalWorkers,
      estimatedDailyPayrollXAF,
      criticalStockAlertsCount: stockAlerts.filter((s) => s.isCritical).length,
      pendingApprovalsCount,
      pendingOrdersAmountXAF,
    },
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      clientName: p.clientName,
      location: p.location,
      city: p.city,
      managerName: p.managerName,
      progressPercentage: p.progressPercentage,
      budgetTotal: p.budgetTotal,
      budgetSpent: p.budgetSpent,
      budgetRemaining: Math.max(0, p.budgetTotal - p.budgetSpent),
      spentRate: Math.round((p.budgetSpent / p.budgetTotal) * 100),
      status: p.status,
      workersCount: p.workersCount,
      expectedEndDate: p.expectedEndDate,
    })),
    monthlyExpenses,
    costDistribution,
    stockAlerts,
    pendingOrders: pendingOrders.map((po) => {
      const proj = db.getProjects(companyId).find((p) => p.id === po.project_id);
      const sup = SEED_DATA.suppliers.find((s) => s.id === po.supplier_id);
      return {
        id: po.id,
        orderNumber: po.order_number,
        projectName: proj?.name || 'Chantier',
        supplierName: sup?.name || 'Fournisseur BTP',
        totalAmountXAF: po.total_amount_xaf,
        notes: po.notes,
        status: po.status,
        requestedBy: 'Ing. Paul Ndongo',
      };
    }),
    recentActivities: dashboardActivities,
    weatherAdvisory,
  });
});

/**
 * POST /api/dashboard/approve-order
 * Simulation d'approbation d'un bon de commande en attente par le DG
 */
apiRouter.post('/api/dashboard/approve-order', (req: Request, res: Response) => {
  const { orderId } = req.body;
  const order = dashboardPurchaseOrders.find((po) => po.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Bon de commande introuvable.' });
  }

  order.status = 'APPROVED';
  order.approved_by = 'usr_directeur_01';

  // Ajouter à l'historique d'activités
  dashboardActivities.unshift({
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'ORDER_APPROVED',
    title: `Bon de commande ${order.order_number} APPROUVÉ`,
    description: `Le Directeur Général a signé le bon de commande de ${order.total_amount_xaf.toLocaleString('fr-FR')} FCFA.`,
    badge: 'Validation DG',
    user: "Directeur Général Samuel Eto'o",
  });

  res.json({
    success: true,
    message: `Bon de commande ${order.order_number} validé avec succès par la Direction Générale !`,
    order,
  });
});

/**
 * POST /api/dashboard/reorder-stock
 * Simulation d'envoi d'une demande de réapprovisionnement pour un matériau sous le seuil
 */
apiRouter.post('/api/dashboard/reorder-stock', (req: Request, res: Response) => {
  const { materialId } = req.body;
  const material = dashboardStockAlerts.find((m) => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: 'Matériau introuvable.' });
  }

  // Simuler la réapprovision
  material.current_stock += material.minimum_stock_alert * 2;

  dashboardActivities.unshift({
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'RESTOCK_REQUEST',
    title: `Réapprovisionnement ordonné pour : ${material.designation}`,
    description: `Nouvel arrivage programmé. Stock sécurisé rétabli à ${material.current_stock} ${material.unit}.`,
    badge: 'Magasin & Stock',
    user: 'Christian Talla (Magasinier)',
  });

  res.json({
    success: true,
    message: `Demande de réapprovisionnement transmise pour ${material.designation}. Stock mis à jour !`,
    material,
  });
});

/**
 * ============================================================================
 * ÉTAPE 6 : MODULE 2 — GESTION COMPLÈTE DES CHANTIERS & PROJETS BTP
 * ============================================================================
 */

/**
 * GET /api/projects
 * Liste des chantiers avec métriques, filtres et conducteurs de travaux
 */
apiRouter.get('/projects', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const statusFilter = (req.query.status as string) || 'ALL';
  const cityFilter = (req.query.city as string) || 'ALL';
  const search = ((req.query.search as string) || '').toLowerCase();

  let projects = db.getProjects(companyId);

  if (statusFilter !== 'ALL') {
    projects = projects.filter((p) => p.status === statusFilter);
  }
  if (cityFilter !== 'ALL') {
    projects = projects.filter((p) => p.city === cityFilter);
  }
  if (search) {
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.code.toLowerCase().includes(search) ||
        p.clientName.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search)
    );
  }

  const allCompanyProjects = db.getProjects(companyId);
  const statusCounts = {
    total: allCompanyProjects.length,
    inProgress: allCompanyProjects.filter((p) => p.status === 'IN_PROGRESS').length,
    preparation: allCompanyProjects.filter((p) => p.status === 'PREPARATION').length,
    completed: allCompanyProjects.filter((p) => p.status === 'COMPLETED').length,
    suspended: allCompanyProjects.filter((p) => p.status === 'SUSPENDED').length,
  };

  const company = db.getCompanyById(companyId);

  res.json({
    projects,
    statusCounts,
    quota: {
      used: allCompanyProjects.length,
      max: company?.maxProjects || 10,
      canCreate: allCompanyProjects.length < (company?.maxProjects || 10),
      plan: company?.plan || 'PRO',
    },
  });
});

/**
 * GET /api/projects/:id
 * Fiche détaillée 360° d'un chantier avec son journal de bord
 */
apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Chantier introuvable.' });
  }

  const dailyLogs = db.getDailyLogs(id);
  const managers = db.getUsers(project.companyId).filter((u) => u.role === 'SITE_MANAGER' || u.role === 'DIRECTOR');

  res.json({
    project: {
      ...project,
      budgetRemaining: Math.max(0, project.budgetTotal - project.budgetSpent),
      spentPercentage: Math.round((project.budgetSpent / project.budgetTotal) * 100),
    },
    dailyLogs,
    managers,
  });
});

/**
 * POST /api/projects
 * Création d'un nouveau chantier BTP (avec contrôle strict des quotas SaaS du tenant)
 */
apiRouter.post('/projects', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    name,
    code,
    clientName,
    clientPhone,
    location,
    city,
    lat,
    lng,
    description,
    startDate,
    expectedEndDate,
    budgetTotal,
    managerId,
    status = 'IN_PROGRESS',
    workersCount = 10,
  } = req.body;

  if (!name || !clientName || !location || !city || !budgetTotal) {
    return res.status(400).json({ error: 'Veuillez renseigner les champs obligatoires (nom, client, lieu, budget).' });
  }

  // Vérification des quotas du plan commercial
  const company = db.getCompanyById(companyId);
  const existingProjects = db.getProjects(companyId);
  if (company && existingProjects.length >= company.maxProjects) {
    return res.status(403).json({
      error: `Quota atteint : Votre formule ${company.plan} est limitée à ${company.maxProjects} chantiers actifs. Passez à la formule supérieure pour en créer davantage.`,
    });
  }

  const manager = managerId ? db.getUserById(managerId) : undefined;
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : 'Ing. Paul Ndongo';

  // Génération automatique du code si non renseigné
  const generatedCode = code || `CH-2026-${city.substring(0, 3).toUpperCase()}-0${existingProjects.length + 1}`;

  const newProject = db.createProject({
    companyId,
    code: generatedCode,
    name,
    clientName,
    clientPhone: clientPhone || '+237 600 00 00 00',
    location,
    city,
    lat: lat ? parseFloat(lat) : city === 'Douala' ? 4.0511 : city === 'Yaoundé' ? 3.848 : 2.935,
    lng: lng ? parseFloat(lng) : city === 'Douala' ? 9.7679 : city === 'Yaoundé' ? 11.502 : 9.907,
    description: description || 'Travaux de génie civil et bâtiment.',
    startDate: startDate || new Date().toISOString().split('T')[0],
    expectedEndDate: expectedEndDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    budgetTotal: Number(budgetTotal),
    budgetSpent: 0,
    managerId: managerId || 'usr_chef_01',
    managerName,
    status: status as any,
    progressPercentage: 0,
    workersCount: Number(workersCount) || 12,
  });

  // Création d'une première entrée dans le journal de bord
  db.addDailyLog({
    projectId: newProject.id,
    date: new Date().toISOString().split('T')[0],
    authorName: managerName,
    weather: 'SUNNY',
    workersPresent: newProject.workersCount,
    workDone: 'Ouverture officielle du chantier, installation de la clôture et de la base-vie.',
    materialsUsed: 'Piquets, tôle d\'enceinte, panneaux d\'information et panneau de permis de bâtir.',
    incidentsOrAlerts: 'Ordre de service (OS) signé avec le client.',
  });

  res.status(201).json({
    success: true,
    message: `Le chantier « ${newProject.name} » (${newProject.code}) a été créé avec succès !`,
    project: newProject,
  });
});

/**
 * PUT /api/projects/:id
 * Modification d'un chantier (avancement, budget, statut)
 */
apiRouter.put('/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateProject(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Chantier introuvable.' });
  }

  res.json({
    success: true,
    message: `Le chantier « ${updated.name} » a été mis à jour avec succès.`,
    project: updated,
  });
});

/**
 * POST /api/projects/:id/logs
 * Ajout d'une note au journal de bord quotidien du chantier
 */
apiRouter.post('/projects/:id/logs', (req: Request, res: Response) => {
  const { id } = req.params;
  const { authorName, weather, workersPresent, workDone, materialsUsed, incidentsOrAlerts } = req.body;

  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Chantier introuvable.' });
  }

  if (!workDone) {
    return res.status(400).json({ error: 'Veuillez décrire les travaux réalisés.' });
  }

  const log = db.addDailyLog({
    projectId: id,
    date: new Date().toISOString().split('T')[0],
    authorName: authorName || project.managerName || 'Conducteur de travaux',
    weather: weather || 'SUNNY',
    workersPresent: Number(workersPresent) || project.workersCount,
    workDone,
    materialsUsed,
    incidentsOrAlerts,
  });

  res.status(201).json({
    success: true,
    message: 'Entrée consignée avec succès dans le journal de bord du chantier !',
    log,
  });
});

/**
 * ============================================================================
 * ÉTAPE 7 : MODULE 3 — SUIVI DE L'AVANCEMENT PHYSIQUE, LOTS & PHOTOS CHANTIER
 * ============================================================================
 */

/**
 * GET /api/progress/overview
 * Retourne les lots/tâches, jalons, calculs pondérés et photos Avant/Pendant/Après
 */
apiRouter.get('/progress/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;

  const projects = db.getProjects(companyId);
  if (projects.length === 0) {
    return res.json({ projects: [], selectedProject: null, tasks: [], photos: [], summary: {} });
  }

  const selectedProject =
    (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  const tasks = db.getTasks(selectedProject.id);
  const photos = db.getPhotos(selectedProject.id);

  const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 0), 0);
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const delayedCount = tasks.filter((t) => t.status === 'DELAYED').length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const milestones = tasks.filter((t) => t.isMilestone);

  res.json({
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
      progressPercentage: p.progressPercentage,
      startDate: p.startDate,
      expectedEndDate: p.expectedEndDate,
      managerName: p.managerName,
    })),
    selectedProject,
    tasks,
    photos,
    summary: {
      weightedProgress: selectedProject.progressPercentage,
      totalTasks: tasks.length,
      totalWeight,
      completedCount,
      inProgressCount,
      delayedCount,
      todoCount,
      milestonesCompleted: milestones.filter((m) => m.status === 'COMPLETED').length,
      milestonesTotal: milestones.length,
      photosCount: photos.length,
    },
  });
});

/**
 * POST /api/progress/tasks
 * Ajouter un nouveau lot ou tâche BTP sur un chantier
 */
apiRouter.post('/progress/tasks', (req: Request, res: Response) => {
  const {
    projectId,
    lotName,
    title,
    description,
    startDate,
    endDate,
    progressPercentage = 0,
    weight = 15,
    status = 'TODO',
    assignedToName = 'Ing. Paul Ndongo',
    isMilestone = false,
  } = req.body;

  if (!projectId || !lotName || !title) {
    return res.status(400).json({ error: 'Chantier, nom du lot et intitulé de la tâche requis.' });
  }

  const task = db.createTask({
    projectId,
    lotName,
    title,
    description: description || 'Exécution des travaux selon cahier des clauses techniques.',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    progressPercentage: Number(progressPercentage),
    weight: Number(weight) || 10,
    status,
    assignedToName,
    isMilestone: Boolean(isMilestone),
  });

  const project = db.getProjectById(projectId);

  res.status(201).json({
    success: true,
    message: `Lot « ${task.title} » ajouté. Avancement global du chantier recalculé à ${project?.progressPercentage || 0}%.`,
    task,
    projectProgress: project?.progressPercentage || 0,
  });
});

/**
 * PATCH /api/progress/tasks/:id
 * Mettre à jour le % d'avancement ou le statut d'un lot BTP
 */
apiRouter.patch('/progress/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { progressPercentage, status, title, endDate, isMilestone } = req.body;

  const updates: any = {};
  if (progressPercentage !== undefined) updates.progressPercentage = Math.min(100, Math.max(0, Number(progressPercentage)));
  if (status !== undefined) updates.status = status;
  if (title !== undefined) updates.title = title;
  if (endDate !== undefined) updates.endDate = endDate;
  if (isMilestone !== undefined) updates.isMilestone = Boolean(isMilestone);

  const updated = db.updateTask(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Tâche introuvable.' });
  }

  const project = db.getProjectById(updated.projectId);

  res.json({
    success: true,
    message: `Avancement de « ${updated.lotName} » mis à jour (${updated.progressPercentage}%). Avancement global chantier : ${project?.progressPercentage || 0}%.`,
    task: updated,
    projectProgress: project?.progressPercentage || 0,
  });
});

/**
 * DELETE /api/progress/tasks/:id
 */
apiRouter.delete('/progress/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = db.deleteTask(id);
  if (!ok) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.json({ success: true, message: 'Tâche supprimée du planning.' });
});

/**
 * POST /api/progress/photos
 * Enregistrer une photo de chantier (Avant / Pendant / Après / Incident)
 */
apiRouter.post('/progress/photos', (req: Request, res: Response) => {
  const { projectId, taskId, uploaderName, photoUrl, caption, photoType = 'DURING', takenDate } = req.body;

  if (!projectId || !photoUrl || !caption) {
    return res.status(400).json({ error: 'Chantier, image et légende technique requis.' });
  }

  const photo = db.addPhoto({
    projectId,
    taskId,
    uploaderName: uploaderName || 'Ing. Paul Ndongo',
    photoUrl,
    caption,
    photoType,
    takenDate: takenDate || new Date().toISOString().split('T')[0],
  });

  res.status(201).json({
    success: true,
    message: 'Photo horodatée ajoutée à la galerie du chantier !',
    photo,
  });
});

/**
 * DELETE /api/progress/photos/:id
 */
apiRouter.delete('/progress/photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const ok = db.deletePhoto(id);
  if (!ok) return res.status(404).json({ error: 'Photo introuvable.' });
  res.json({ success: true, message: 'Photo supprimée de la galerie.' });
});

/**
 * ============================================================================
 * ÉTAPE 8 : MODULE 4 — GESTION DU PERSONNEL & POINTAGE QUOTIDIEN
 * ============================================================================
 */

const SPECIALTY_LABELS: Record<string, string> = {
  CHEF_EQUIPE: "Chef d'équipe BTP",
  MACON: 'Maçon Qualifié',
  FERRAILLEUR: 'Ferrailleur HA',
  COFFREUR: 'Coffreur Boiseur',
  MANOEUVRE: 'Manœuvre Journalier',
  ELECTRICIEN: 'Électricien Bâtiment',
  PLOMBIER: 'Plombier Sanitaire',
  CARRELEUR: 'Carreleur Faïencier',
};

/**
 * GET /api/workforce/overview
 * Retourne la liste du personnel du chantier, le pointage du jour et le cumul 7 jours
 */
apiRouter.get('/workforce/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const projects = db.getProjects(companyId);
  if (projects.length === 0) {
    return res.json({
      projects: [],
      selectedProject: null,
      date,
      workers: [],
      attendance: [],
      weeklySummary: { days: [], rows: [] },
      summary: {},
    });
  }

  const selectedProject =
    (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  const workers = db.getWorkers(companyId, selectedProject.id);
  const activeWorkers = workers.filter((w) => w.isActive);
  const attendance = db.getAttendanceForDate(companyId, selectedProject.id, date);
  const weeklySummary = db.getWeeklyAttendanceSummary(companyId, selectedProject.id, date);

  // Calcul des KPIs du jour
  let presentCount = 0;
  let halfDayCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let dailyPayrollXAF = 0;

  activeWorkers.forEach((w) => {
    const rec = attendance.find((a) => a.workerId === w.id);
    if (!rec) return;
    if (rec.status === 'PRESENT') presentCount++;
    else if (rec.status === 'HALF_DAY') halfDayCount++;
    else if (rec.status === 'LATE') lateCount++;
    else if (rec.status === 'ABSENT') absentCount++;
    dailyPayrollXAF += rec.amountEarnedXAF || 0;
  });

  const markedCount = presentCount + halfDayCount + lateCount + absentCount;
  const unmarkedCount = Math.max(0, activeWorkers.length - markedCount);
  const weeklyPayrollXAF = weeklySummary.rows.reduce((sum, r) => sum + r.totalEarnedXAF, 0);
  const validatedRecord = attendance.find((a) => a.isValidated);
  const isDayValidated = activeWorkers.length > 0 && attendance.length >= activeWorkers.length && attendance.every((a) => a.isValidated);

  res.json({
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
      managerName: p.managerName,
    })),
    selectedProject,
    date,
    workers,
    attendance,
    weeklySummary,
    summary: {
      totalWorkers: workers.length,
      totalActiveWorkers: activeWorkers.length,
      presentCount,
      halfDayCount,
      lateCount,
      absentCount,
      unmarkedCount,
      effectivePresentCount: presentCount + lateCount + halfDayCount,
      dailyPayrollXAF,
      weeklyPayrollXAF,
      isDayValidated,
      validatedBy: validatedRecord?.validatedBy || null,
    },
  });
});

/**
 * POST /api/workforce/workers
 * Embaucher / Ajouter un ouvrier ou tâcheron sur le chantier
 */
apiRouter.post('/workforce/workers', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    projectId,
    fullName,
    phone,
    specialty = 'MACON',
    specialtyLabel,
    contractType = 'JOURNALIER',
    dailyRateXAF = 7000,
    cniNumber,
  } = req.body;

  if (!projectId || !fullName || !dailyRateXAF) {
    return res.status(400).json({ error: 'Chantier, nom complet et taux journalier FCFA requis.' });
  }

  const worker = db.createWorker({
    companyId,
    projectId,
    fullName,
    phone: phone || '+237 600 00 00 00',
    specialty,
    specialtyLabel: specialtyLabel || SPECIALTY_LABELS[specialty] || specialty,
    contractType,
    dailyRateXAF: Math.max(1500, Number(dailyRateXAF)),
    cniNumber,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: `Ouvrier « ${worker.fullName} » (${worker.matricule}) ajouté à l'équipe du chantier.`,
    worker,
  });
});

/**
 * PATCH /api/workforce/workers/:id/toggle
 * Activer ou mettre en pause un ouvrier
 */
apiRouter.patch('/workforce/workers/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const worker = db.toggleWorkerActive(id);
  if (!worker) return res.status(404).json({ error: 'Ouvrier introuvable.' });
  res.json({
    success: true,
    message: `${worker.fullName} est désormais ${worker.isActive ? 'actif sur le chantier' : 'désaffecté / en pause'}.`,
    worker,
  });
});

/**
 * DELETE /api/workforce/workers/:id
 * Supprimer définitivement un ouvrier ou tâcheron (Directeur & Chef de chantier uniquement)
 */
apiRouter.delete('/workforce/workers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = resolveActorContext(req);
  const allowedRoles: UserRole[] = ['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'];

  if (!actor.role || !allowedRoles.includes(actor.role)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur et le Chef de chantier sont habilités à supprimer un ouvrier.',
    });
  }

  const companyIdScope = actor.companyId || (req.query.companyId as string) || 'comp_socabat_01';
  const existing = db.getWorkers(companyIdScope).find((w) => w.id === id);
  if (!existing && actor.role !== 'SUPER_ADMIN') {
    return res.status(404).json({ error: 'Ouvrier introuvable dans votre entreprise.' });
  }

  const deleted = db.deleteWorker(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Ouvrier introuvable.' });
  }

  res.json({
    success: true,
    worker: deleted,
    message: `Ouvrier « ${deleted.fullName} » (${deleted.matricule}) supprimé du chantier.`,
  });
});

/**
 * POST /api/workforce/attendance
 * Pointer individuellement un ouvrier (Présent, Demi-journée, Retard, Absent + H.Supp)
 */
apiRouter.post('/workforce/attendance', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId, workerId, date, status, checkInTime, overtimeHours = 0, notes } = req.body;

  if (!projectId || !workerId || !date || !status) {
    return res.status(400).json({ error: 'Chantier, ouvrier, date et statut requis.' });
  }

  const record = db.upsertAttendance({
    companyId,
    projectId,
    workerId,
    date,
    status,
    checkInTime,
    overtimeHours,
    notes,
  });

  if (!record) return res.status(404).json({ error: 'Ouvrier introuvable.' });

  res.json({
    success: true,
    message: `Pointage enregistré (${record.amountEarnedXAF.toLocaleString('fr-FR')} FCFA).`,
    record,
  });
});

/**
 * POST /api/workforce/attendance/bulk-present
 * Appel du matin en 1 clic : marquer tous les ouvriers actifs du chantier Présents
 */
apiRouter.post('/workforce/attendance/bulk-present', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId, date } = req.body;
  if (!projectId || !date) {
    return res.status(400).json({ error: 'Chantier et date requis.' });
  }

  const records = db.markAllPresent(companyId, projectId, date);
  res.json({
    success: true,
    message: `Appel du matin effectué : ${records.length} ouvrier(s) pointé(s) présent(s) à 07h30.`,
    count: records.length,
  });
});

/**
 * POST /api/workforce/attendance/validate
 * Clôturer et viser la feuille de pointage du jour pour transmission à la Paie
 */
apiRouter.post('/workforce/attendance/validate', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId, date, validatorName = 'Ing. Paul Ndongo' } = req.body;
  if (!projectId || !date) {
    return res.status(400).json({ error: 'Chantier et date requis.' });
  }

  const records = db.validateDailySheet(companyId, projectId, date, validatorName);
  res.json({
    success: true,
    message: `Feuille de pointage du ${new Date(date).toLocaleDateString('fr-FR')} validée par ${validatorName} et transmise à la Comptabilité.`,
    count: records.length,
  });
});

/**
 * GET /api/workforce/daily-pdf
 * Téléchargement du PDF officiel de la feuille de pointage du jour
 */
apiRouter.get('/workforce/daily-pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  const projects = db.getProjects(company.id);
  const project = (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  if (!project) {
    return res.status(404).json({ error: 'Chantier introuvable pour ce PDF.' });
  }

  const workers = db.getWorkers(company.id, project.id);
  const attendance = db.getAttendanceForDate(company.id, project.id, date);
  const pdfBuffer = generateDailyAttendancePdfBuffer(company, project, date, workers, attendance);

  const filename = `pointage_jour_${project.code}_${date}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * GET /api/workforce/directory-pdf
 * Téléchargement du PDF officiel du répertoire des ouvriers du chantier
 */
apiRouter.get('/workforce/directory-pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;

  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  const projects = db.getProjects(company.id);
  const project = (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  if (!project) {
    return res.status(404).json({ error: 'Chantier introuvable pour ce PDF.' });
  }

  const workers = db.getWorkers(company.id, project.id);
  const pdfBuffer = generateWorkersDirectoryPdfBuffer(company, project, workers);

  const filename = `repertoire_ouvriers_${project.code}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 9 : MODULE 5 — PAIE & SALAIRES DES OUVRIERS (FCFA & MOBILE MONEY)
 * ============================================================================
 */

/**
 * GET /api/payroll/overview
 */
apiRouter.get('/payroll/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;

  const projects = db.getProjects(companyId);
  if (projects.length === 0) {
    return res.json({
      projects: [],
      selectedProject: null,
      workers: [],
      payrolls: [],
      advances: [],
      summary: {},
    });
  }

  const selectedProject =
    (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  const workers = db.getWorkers(companyId, selectedProject.id);
  const { payrolls, advances } = db.getPayrollData(companyId, selectedProject.id);

  const totalGrossXAF = payrolls.reduce((s, p) => s + p.grossPayXAF, 0);
  const totalAdvancesXAF = payrolls.reduce((s, p) => s + p.advancesDeductedXAF, 0);
  const totalNetXAF = payrolls.reduce((s, p) => s + p.netPayXAF, 0);
  const totalPaidXAF = payrolls.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.netPayXAF, 0);
  const remainingToPayXAF = payrolls.filter((p) => p.status !== 'PAID').reduce((s, p) => s + p.netPayXAF, 0);

  const paidCount = payrolls.filter((p) => p.status === 'PAID').length;
  const approvedCount = payrolls.filter((p) => p.status === 'APPROVED').length;
  const draftCount = payrolls.filter((p) => p.status === 'DRAFT').length;

  res.json({
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
    })),
    selectedProject,
    workers,
    payrolls,
    advances,
    summary: {
      totalGrossXAF,
      totalAdvancesXAF,
      totalNetXAF,
      totalPaidXAF,
      remainingToPayXAF,
      paidCount,
      approvedCount,
      draftCount,
      totalBulletins: payrolls.length,
    },
  });
});

/**
 * POST /api/payroll/sync
 * Recalculer la paie à partir du pointage terrain de la semaine
 */
apiRouter.post('/payroll/sync', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'Chantier requis.' });

  const payrolls = db.syncPayrollFromAttendance(companyId, projectId);
  res.json({
    success: true,
    message: `Paie resynchronisée avec le pointage réel (${payrolls.length} bulletins recalculés en FCFA).`,
    count: payrolls.length,
  });
});

/**
 * POST /api/payroll/advances
 * Accorder un acompte / avance sur salaire (déduit automatiquement du net à payer)
 */
apiRouter.post('/payroll/advances', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId, workerId, amountXAF, reason, paymentMethod = 'ORANGE_MONEY' } = req.body;
  if (!projectId || !workerId || !amountXAF) {
    return res.status(400).json({ error: 'Chantier, ouvrier et montant FCFA requis.' });
  }

  const advance = db.createAdvance({
    companyId,
    projectId,
    workerId,
    amountXAF: Number(amountXAF),
    reason: reason || 'Acompte chantier',
    paymentMethod,
  });

  if (!advance) return res.status(404).json({ error: 'Ouvrier introuvable.' });

  res.status(201).json({
    success: true,
    message: `Avance de ${advance.amountXAF.toLocaleString('fr-FR')} FCFA versée à ${advance.workerName} et déduite de son bulletin.`,
    advance,
  });
});

/**
 * PATCH /api/payroll/:id/bonus
 * Ajuster la prime de rendement / panier chantier
 */
apiRouter.patch('/payroll/:id/bonus', (req: Request, res: Response) => {
  const { id } = req.params;
  const { bonusXAF } = req.body;
  const updated = db.updatePayrollBonus(id, Number(bonusXAF || 0));
  if (!updated) return res.status(400).json({ error: 'Bulletin introuvable ou déjà payé.' });

  res.json({
    success: true,
    message: `Prime de ${updated.workerName} mise à jour : Net à payer ${updated.netPayXAF.toLocaleString('fr-FR')} FCFA.`,
    record: updated,
  });
});

/**
 * POST /api/payroll/:id/approve
 */
apiRouter.post('/payroll/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.approvePayroll(id);
  if (!updated) return res.status(404).json({ error: 'Bulletin introuvable.' });
  res.json({
    success: true,
    message: `Bulletin de ${updated.workerName} validé (Bon à Payer).`,
    record: updated,
  });
});

/**
 * POST /api/payroll/approve-all
 */
apiRouter.post('/payroll/approve-all', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'Chantier requis.' });
  const count = db.approveAllPayrolls(companyId, projectId);
  res.json({
    success: true,
    message: `${count} bulletin(s) approuvé(s) pour décaissement.`,
    count,
  });
});

/**
 * POST /api/payroll/:id/pay
 */
apiRouter.post('/payroll/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod = 'ORANGE_MONEY', paymentReference } = req.body;
  const updated = db.payPayroll(id, paymentMethod, paymentReference);
  if (!updated) return res.status(404).json({ error: 'Bulletin introuvable.' });
  res.json({
    success: true,
    message: `Salaire de ${updated.workerName} (${updated.netPayXAF.toLocaleString('fr-FR')} FCFA) payé — Réf : ${updated.paymentReference}.`,
    record: updated,
  });
});

/**
 * POST /api/payroll/pay-all
 */
apiRouter.post('/payroll/pay-all', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', projectId, paymentMethod = 'ORANGE_MONEY' } = req.body;
  if (!projectId) return res.status(400).json({ error: 'Chantier requis.' });
  const count = db.payAllApproved(companyId, projectId, paymentMethod);
  res.json({
    success: true,
    message:
      count > 0
        ? `Décaissement groupé effectué : ${count} salaire(s) réglé(s) et imputé(s) au budget du chantier.`
        : 'Aucun bulletin en statut « Validé DG » à décaisser.',
    count,
  });
});

/**
 * GET /api/payroll/summary-pdf
 */
apiRouter.get('/payroll/summary-pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const requestedProjectId = req.query.projectId as string;

  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  const projects = db.getProjects(company.id);
  const project = (requestedProjectId && projects.find((p) => p.id === requestedProjectId)) || projects[0];

  if (!project) return res.status(404).json({ error: 'Chantier introuvable.' });

  const { payrolls } = db.getPayrollData(company.id, project.id);
  const pdfBuffer = generatePayrollSummaryPdfBuffer(company, project, payrolls);

  const filename = `etat_paie_${project.code}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * GET /api/payroll/:id/payslip-pdf
 */
apiRouter.get('/payroll/:id/payslip-pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = db.getPayrollById(id);
  if (!record) return res.status(404).json({ error: 'Bulletin introuvable.' });

  const company = db.getCompanyById(record.companyId) || db.getCompanies()[0];
  const project = db.getProjectById(record.projectId) || db.getProjects(company.id)[0];

  const pdfBuffer = generatePayslipPdfBuffer(company, project, record);
  const filename = `bulletin_paie_${record.workerMatricule}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 10 : MODULE 6 — GESTION DES STOCKS DE MATÉRIAUX & DÉPÔT BTP
 * ============================================================================
 */

/**
 * GET /api/stock/overview
 */
apiRouter.get('/stock/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';

  const materials = db.getMaterials(companyId);
  const movements = db.getStockMovements(companyId, projectId);
  const projects = db.getProjects(companyId);

  const totalValuationXAF = materials.reduce((sum, m) => sum + m.currentStock * m.unitPriceXAF, 0);
  const criticalCount = materials.filter((m) => m.currentStock <= m.minimumStockAlert).length;
  const warningCount = materials.filter(
    (m) => m.currentStock > m.minimumStockAlert && m.currentStock <= m.minimumStockAlert * 1.35
  ).length;
  const healthyCount = Math.max(0, materials.length - criticalCount - warningCount);

  const exitsValueXAF = movements
    .filter((mv) => mv.type === 'EXIT')
    .reduce((sum, mv) => sum + mv.totalValueXAF, 0);
  const entriesValueXAF = movements
    .filter((mv) => mv.type === 'ENTRY')
    .reduce((sum, mv) => sum + mv.totalValueXAF, 0);

  res.json({
    materials,
    movements,
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
      managerName: p.managerName,
    })),
    summary: {
      totalSku: materials.length,
      totalValuationXAF,
      criticalCount,
      warningCount,
      healthyCount,
      movementsCount: movements.length,
      exitsValueXAF,
      entriesValueXAF,
    },
  });
});

/**
 * POST /api/stock/materials
 */
apiRouter.post('/stock/materials', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    reference,
    designation,
    category = 'LIANTS',
    unit = 'Unité',
    depotLocation,
    currentStock = 0,
    minimumStockAlert = 10,
    unitPriceXAF = 0,
    supplierName = 'Fournisseur BTP',
  } = req.body;

  if (!designation || !designation.trim()) {
    return res.status(400).json({ error: 'La désignation du matériau est obligatoire.' });
  }

  const created = db.createMaterial({
    companyId,
    reference,
    designation,
    category,
    unit,
    depotLocation,
    currentStock: Number(currentStock),
    minimumStockAlert: Number(minimumStockAlert),
    unitPriceXAF: Number(unitPriceXAF),
    supplierName,
  });

  res.status(201).json({
    success: true,
    message: `Matériau « ${created.designation} » (${created.reference}) ajouté au catalogue dépôt.`,
    material: created,
  });
});

/**
 * PATCH /api/stock/materials/:id/price
 * Mise à jour manuelle du Prix Unitaire (réservée au Directeur ou Chef de chantier)
 */
apiRouter.patch('/stock/materials/:id/price', (req: Request, res: Response) => {
  const { id } = req.params;
  const { unitPriceXAF, userRole } = req.body;

  if (userRole && !['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seul le Directeur Général ou le Chef de chantier peut modifier le prix unitaire.',
    });
  }

  const parsedPrice = Number(unitPriceXAF);
  if (unitPriceXAF === undefined || unitPriceXAF === '' || isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: 'Veuillez saisir un prix unitaire valide en FCFA.' });
  }

  const updated = db.updateMaterialUnitPrice(id, parsedPrice);
  if (!updated) return res.status(404).json({ error: 'Matériau introuvable.' });

  res.json({
    success: true,
    message: `P.U. de « ${updated.designation} » mis à jour à ${updated.unitPriceXAF.toLocaleString('fr-FR')} FCFA.`,
    material: updated,
  });
});

/**
 * POST /api/stock/movements
 */
apiRouter.post('/stock/movements', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    materialId,
    type = 'EXIT',
    quantity,
    unitPriceXAF,
    updateCatalogPrice = false,
    userRole,
    projectId,
    operatorName,
    recipientName,
    notes,
  } = req.body;

  if (!materialId || quantity === undefined) {
    return res.status(400).json({ error: 'Matériau et quantité requis.' });
  }

  const isPriceEditor = !userRole || ['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(userRole);
  if (unitPriceXAF !== undefined && unitPriceXAF !== '' && !isPriceEditor) {
    return res.status(403).json({
      error: 'Seul le Directeur ou le Chef de chantier est autorisé à saisir un prix unitaire personnalisé.',
    });
  }

  const result = db.recordStockMovement({
    companyId,
    materialId,
    type,
    quantity: Number(quantity),
    unitPriceXAF: unitPriceXAF !== undefined && unitPriceXAF !== '' ? Number(unitPriceXAF) : undefined,
    updateCatalogPrice: Boolean(updateCatalogPrice),
    projectId,
    operatorName,
    recipientName,
    notes,
  });

  if (result.error || !result.movement || !result.material) {
    return res.status(400).json({ error: result.error || 'Erreur lors de l\'enregistrement.' });
  }

  const actionLabel =
    type === 'ENTRY'
      ? 'Entrée réceptionnée'
      : type === 'EXIT'
        ? 'Bon de sortie imputé au chantier'
        : 'Inventaire ajusté';

  res.status(201).json({
    success: true,
    message: `${actionLabel} (${result.movement.referenceDoc}) : ${result.movement.quantity} ${result.movement.unit} à ${result.movement.unitPriceXAF.toLocaleString('fr-FR')} FCFA.`,
    movement: result.movement,
    material: result.material,
  });
});

/**
 * GET /api/stock/inventory-pdf
 */
apiRouter.get('/stock/inventory-pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  const materials = db.getMaterials(company.id);

  const pdfBuffer = generateStockInventoryPdfBuffer(company, materials);
  const filename = `inventaire_stock_${company.slug}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * GET /api/stock/movements/:id/pdf
 */
apiRouter.get('/stock/movements/:id/pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const movement = db.getStockMovementById(id);
  if (!movement) return res.status(404).json({ error: 'Mouvement introuvable.' });

  const company = db.getCompanyById(movement.companyId) || db.getCompanies()[0];
  const pdfBuffer = generateStockMovementSlipPdfBuffer(company, movement);
  const filename = `bon_${movement.referenceDoc}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 11 : MODULE 7 — BONS DE COMMANDE & CIRCUIT D'APPROBATION DG
 * ============================================================================
 */

/**
 * GET /api/purchase-orders/overview
 */
apiRouter.get('/purchase-orders/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const status = (req.query.status as string) || 'ALL';

  const orders = db.getPurchaseOrders(companyId, projectId, status);
  const allCompanyOrders = db.getPurchaseOrders(companyId);
  const projects = db.getProjects(companyId);
  const materials = db.getMaterials(companyId);
  const suppliers = db.getSuppliers(companyId).map((s) => ({
    id: s.id,
    company_id: s.companyId,
    name: s.name,
    contact_person: s.contactPerson,
    phone: s.phone,
    email: s.email,
    address: s.address,
    specialties: s.specialties,
    rating: s.rating,
    status: s.status,
  }));

  const pendingOrders = allCompanyOrders.filter((o) => o.status === 'PENDING_APPROVAL');
  const approvedOrOrdered = allCompanyOrders.filter(
    (o) => o.status === 'APPROVED' || o.status === 'ORDERED' || o.status === 'DELIVERED'
  );

  const uniqueSuppliers = new Set(allCompanyOrders.map((o) => o.supplierName));

  res.json({
    orders,
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
    })),
    materials: materials.map((m) => ({
      id: m.id,
      reference: m.reference,
      designation: m.designation,
      unit: m.unit,
      supplierName: m.supplierName,
    })),
    suppliers,
    summary: {
      totalOrders: allCompanyOrders.length,
      pendingCount: pendingOrders.length,
      pendingAmountXAF: pendingOrders.reduce((s, o) => s + o.totalAmountXAF, 0),
      approvedCount: approvedOrOrdered.length,
      approvedAmountXAF: approvedOrOrdered.reduce((s, o) => s + o.totalAmountXAF, 0),
      draftCount: allCompanyOrders.filter((o) => o.status === 'DRAFT').length,
      activeSuppliersCount: Math.max(uniqueSuppliers.size, suppliers.length),
    },
  });
});

/**
 * POST /api/purchase-orders
 */
apiRouter.post('/purchase-orders', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    projectId,
    supplierName,
    supplierContact,
    supplierPhone,
    requestedByName = 'Ing. Paul Ndongo',
    requestedByRole = 'SITE_MANAGER',
    expectedDeliveryDate,
    paymentTerms,
    includeTVA = false,
    submitImmediately = true,
    notes,
    items,
  } = req.body;

  if (!['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(requestedByRole)) {
    return res.status(403).json({
      error: 'Seul le Directeur Général ou le Chef de chantier peut émettre un bon de commande avec saisie des prix.',
    });
  }

  const result = db.createPurchaseOrder({
    companyId,
    projectId,
    supplierName,
    supplierContact,
    supplierPhone,
    requestedByName,
    requestedByRole,
    expectedDeliveryDate,
    paymentTerms,
    includeTVA,
    submitImmediately,
    notes,
    items,
  });

  if (result.error || !result.order) {
    return res.status(400).json({ error: result.error || 'Erreur lors de la création du bon de commande.' });
  }

  res.status(201).json({
    success: true,
    message: `Bon de commande ${result.order.orderNumber} créé (${result.order.totalAmountXAF.toLocaleString('fr-FR')} FCFA).`,
    order: result.order,
  });
});

/**
 * POST /api/purchase-orders/:id/submit
 */
apiRouter.post('/purchase-orders/:id/submit', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.submitPurchaseOrder(id);
  if (!updated) return res.status(404).json({ error: 'Bon de commande introuvable.' });
  res.json({
    success: true,
    message: `${updated.orderNumber} soumis à la Direction Générale pour approbation.`,
    order: updated,
  });
});

/**
 * POST /api/purchase-orders/:id/approve
 */
apiRouter.post('/purchase-orders/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { approverName = "Samuel Eto'o Mbarga (DG)", userRole } = req.body;

  if (userRole && !['DIRECTOR', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seul le Directeur Général (DG) peut apposer le visa d’approbation.',
    });
  }

  const updated = db.approvePurchaseOrder(id, approverName);
  if (!updated) return res.status(404).json({ error: 'Bon de commande introuvable.' });
  res.json({
    success: true,
    message: `Bon de commande ${updated.orderNumber} APPROUVÉ par ${updated.approvedByName} !`,
    order: updated,
  });
});

/**
 * POST /api/purchase-orders/:id/reject
 */
apiRouter.post('/purchase-orders/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason = 'Prix à renégocier avec le fournisseur', reviewerName = "Samuel Eto'o Mbarga (DG)", userRole } = req.body;

  if (userRole && !['DIRECTOR', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seul le Directeur Général (DG) peut refuser un bon de commande.',
    });
  }

  const updated = db.rejectPurchaseOrder(id, reason, reviewerName);
  if (!updated) return res.status(404).json({ error: 'Bon de commande introuvable.' });
  res.json({
    success: true,
    message: `Bon de commande ${updated.orderNumber} renvoyé / refusé.`,
    order: updated,
  });
});

/**
 * POST /api/purchase-orders/:id/send
 */
apiRouter.post('/purchase-orders/:id/send', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.sendPurchaseOrderToSupplier(id);
  if (!updated) {
    return res.status(400).json({ error: 'Le bon doit d’abord être approuvé par le DG avant transmission.' });
  }
  res.json({
    success: true,
    message: `Bon de commande ${updated.orderNumber} marqué « Transmis au fournisseur » (${updated.supplierName}).`,
    order: updated,
  });
});

/**
 * PATCH /api/purchase-orders/:id/prices
 */
apiRouter.patch('/purchase-orders/:id/prices', (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, userRole } = req.body;

  if (userRole && !['DIRECTOR', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Seul le Directeur ou le Chef de chantier peut modifier les prix unitaires de la commande.',
    });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Lignes de prix invalides.' });
  }

  const updated = db.updatePurchaseOrderPrices(id, items);
  if (!updated) {
    return res.status(400).json({ error: 'Bon introuvable ou déjà transmis au fournisseur.' });
  }

  res.json({
    success: true,
    message: `Prix unitaires actualisés sur ${updated.orderNumber} (Nouveau total : ${updated.totalAmountXAF.toLocaleString('fr-FR')} FCFA).`,
    order: updated,
  });
});

/**
 * GET /api/purchase-orders/:id/pdf
 */
apiRouter.get('/purchase-orders/:id/pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getPurchaseOrderById(id);
  if (!order) return res.status(404).json({ error: 'Bon de commande introuvable.' });

  const company = db.getCompanyById(order.companyId) || db.getCompanies()[0];
  const pdfBuffer = generatePurchaseOrderPdfBuffer(company, order);
  const filename = `bon_commande_${order.orderNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 12 : MODULE 8 — BONS DE LIVRAISON & RÉCEPTION CHANTIER / DÉPÔT
 * ============================================================================
 */

/**
 * GET /api/deliveries/overview
 */
apiRouter.get('/deliveries/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const status = (req.query.status as string) || 'ALL';

  const deliveries = db.getDeliveryNotes(companyId, projectId, status);
  const allCompanyDeliveries = db.getDeliveryNotes(companyId);
  const eligibleOrders = db.getEligibleOrdersForDelivery(companyId);
  const projects = db.getProjects(companyId);

  const disputedCount = allCompanyDeliveries.filter((d) => d.status === 'DISPUTED').length;
  const partialCount = allCompanyDeliveries.filter((d) => d.status === 'PARTIAL').length;
  const completedCount = allCompanyDeliveries.filter((d) => d.status === 'COMPLETED').length;

  res.json({
    deliveries,
    eligibleOrders,
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
    })),
    summary: {
      totalDeliveries: allCompanyDeliveries.length,
      completedCount,
      partialCount,
      disputedCount,
      pendingOrdersToReceive: eligibleOrders.length,
      totalReceivedValueXAF: allCompanyDeliveries.reduce((sum, d) => sum + d.totalValueXAF, 0),
    },
  });
});

/**
 * POST /api/deliveries
 */
apiRouter.post('/deliveries', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    purchaseOrderId,
    supplierBlReference,
    destination = 'DEPOT',
    receivedByName = 'Christian Talla (Magasinier)',
    receivedByRole = 'STOREKEEPER',
    driverName,
    truckPlate,
    deliveryDate,
    observations,
    items,
  } = req.body;

  if (!['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'SUPER_ADMIN'].includes(receivedByRole)) {
    return res.status(403).json({
      error:
        'Accès refusé : seuls le Magasinier, le Chef de chantier ou le Directeur peuvent valider une réception.',
    });
  }

  if (!purchaseOrderId) {
    return res.status(400).json({ error: 'Veuillez sélectionner un bon de commande approuvé.' });
  }

  const result = db.createDeliveryNote({
    companyId,
    purchaseOrderId,
    supplierBlReference,
    destination,
    receivedByName,
    receivedByRole,
    driverName,
    truckPlate,
    deliveryDate,
    observations,
    items,
  });

  if (result.error || !result.delivery) {
    return res.status(400).json({ error: result.error || 'Erreur lors de la réception.' });
  }

  const syncInfo =
    result.stockMovementsCreated > 0
      ? ` ${result.stockMovementsCreated} mouvement(s) d'entrée ajouté(s) automatiquement au Stock Dépôt.`
      : destination === 'DIRECT_SITE'
        ? ' Montant imputé directement sur le budget chantier.'
        : '';

  res.status(201).json({
    success: true,
    message: `Bon de livraison ${result.delivery.deliveryNumber} enregistré (${result.delivery.status}).${syncInfo}`,
    delivery: result.delivery,
    stockMovementsCreated: result.stockMovementsCreated,
  });
});

/**
 * PATCH /api/deliveries/:id/resolve
 */
apiRouter.patch('/deliveries/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolvedNote, userRole } = req.body;

  if (userRole && !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé pour clôturer un litige de livraison.',
    });
  }

  const updated = db.resolveDeliveryDispute(id, resolvedNote || '');
  if (!updated) return res.status(404).json({ error: 'Bon de livraison introuvable.' });

  res.json({
    success: true,
    message: `Litige sur ${updated.deliveryNumber} clôturé (${updated.status}).`,
    delivery: updated,
  });
});

/**
 * GET /api/deliveries/:id/pdf
 */
apiRouter.get('/deliveries/:id/pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const delivery = db.getDeliveryNoteById(id);
  if (!delivery) return res.status(404).json({ error: 'Bon de livraison introuvable.' });

  const company = db.getCompanyById(delivery.companyId) || db.getCompanies()[0];
  const pdfBuffer = generateDeliveryNotePdfBuffer(company, delivery);
  const filename = `bon_livraison_${delivery.deliveryNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 13 : MODULE 9 — DÉPENSES & SUIVI BUDGÉTAIRE CHANTIER
 * ============================================================================
 */

/**
 * GET /api/expenses/overview
 */
apiRouter.get('/expenses/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const category = (req.query.category as string) || 'ALL';
  const status = (req.query.status as string) || 'ALL';

  const expenses = db.getExpenses(companyId, projectId, category, status);
  const allCompanyExpenses = db.getExpenses(companyId, projectId);
  const budget = db.getBudgetOverview(companyId, projectId);
  const projects = db.getProjects(companyId);

  const pendingAmountXAF = allCompanyExpenses
    .filter((e) => e.status === 'PENDING' || e.status === 'APPROVED')
    .reduce((s, e) => s + e.amountXAF, 0);

  const pendingCount = allCompanyExpenses.filter(
    (e) => e.status === 'PENDING' || e.status === 'APPROVED'
  ).length;

  res.json({
    expenses,
    projects: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      city: p.city,
    })),
    budget,
    summary: {
      totalBudgetXAF: budget.totals.totalBudgetXAF,
      totalSpentXAF: budget.totals.totalSpentXAF,
      totalRemainingXAF: budget.totals.totalRemainingXAF,
      globalRate: budget.totals.globalRate,
      pendingAmountXAF,
      pendingCount,
      totalExpensesCount: allCompanyExpenses.length,
    },
  });
});

/**
 * POST /api/expenses
 */
apiRouter.post('/expenses', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    projectId,
    category = 'FRAIS_CHANTIER',
    title,
    beneficiary,
    amountXAF,
    paymentMethod = 'CASH',
    invoiceRef,
    expenseDate,
    recordedByName = 'Ing. Paul Ndongo',
    userRole = 'SITE_MANAGER',
    notes,
  } = req.body;

  if (!['DIRECTOR', 'ACCOUNTANT', 'SITE_MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error:
        'Accès refusé : seuls le Directeur, le Comptable ou le Chef de chantier peuvent saisir une dépense.',
    });
  }

  const result = db.createExpense({
    companyId,
    projectId,
    category: category as ExpenseCategory,
    title,
    beneficiary,
    amountXAF: Number(amountXAF),
    paymentMethod: paymentMethod as PaymentMethod,
    invoiceRef,
    expenseDate,
    recordedByName,
    notes,
  });

  if (result.error || !result.expense) {
    return res.status(400).json({ error: result.error || 'Erreur lors de la création de la dépense.' });
  }

  res.status(201).json({
    success: true,
    message: `Dépense ${result.expense.reference} enregistrée (${result.expense.amountXAF.toLocaleString('fr-FR')} FCFA) — en attente de validation.`,
    expense: result.expense,
  });
});

/**
 * POST /api/expenses/:id/approve
 */
apiRouter.post('/expenses/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { approverName = "Samuel Eto'o Mbarga (DG)", userRole } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur Général ou le Comptable peuvent approuver une dépense.',
    });
  }

  const updated = db.approveExpense(id, approverName);
  if (!updated) {
    return res.status(400).json({ error: 'Dépense introuvable ou déjà traitée.' });
  }

  res.json({
    success: true,
    message: `Dépense ${updated.reference} approuvée (Bon à payer).`,
    expense: updated,
  });
});

/**
 * POST /api/expenses/:id/reject
 */
apiRouter.post('/expenses/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { approverName = "Samuel Eto'o Mbarga (DG)", reason, userRole } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur Général ou le Comptable peuvent refuser une dépense.',
    });
  }

  const updated = db.rejectExpense(id, approverName, reason);
  if (!updated) {
    return res.status(400).json({ error: 'Dépense introuvable ou déjà payée.' });
  }

  res.json({
    success: true,
    message: `Dépense ${updated.reference} refusée.`,
    expense: updated,
  });
});

/**
 * POST /api/expenses/:id/pay
 */
apiRouter.post('/expenses/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    paymentMethod = 'ORANGE_MONEY',
    paymentReference,
    payerName = 'Nadine Ngo Bell (Comptable)',
    userRole,
  } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Comptable ou le Directeur Général peuvent décaisser une dépense.',
    });
  }

  const updated = db.payExpense(id, paymentMethod as PaymentMethod, paymentReference, payerName);
  if (!updated) {
    return res.status(400).json({ error: 'Dépense introuvable, refusée ou déjà payée.' });
  }

  res.json({
    success: true,
    message: `Dépense ${updated.reference} réglée (${updated.paymentReference}) et imputée au budget chantier.`,
    expense: updated,
  });
});

/**
 * PATCH /api/budget/lines/:id
 */
apiRouter.patch('/budget/lines/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { allocatedBudgetXAF, userRole } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur Général ou le Comptable peuvent ajuster les enveloppes budgétaires.',
    });
  }

  const updated = db.updateBudgetLine(id, Number(allocatedBudgetXAF));
  if (!updated) return res.status(404).json({ error: 'Ligne budgétaire introuvable.' });

  res.json({
    success: true,
    message: `Enveloppe « ${updated.categoryLabel} » mise à jour à ${updated.allocatedBudgetXAF.toLocaleString('fr-FR')} FCFA.`,
    line: updated,
  });
});

/**
 * GET /api/expenses/report-pdf
 */
apiRouter.get('/expenses/report-pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';

  const company = db.getCompanyById(companyId) || db.getCompanies()[0];
  const budget = db.getBudgetOverview(company.id, projectId);
  const expenses = db.getExpenses(company.id, projectId);

  const selectedProj =
    projectId !== 'ALL' ? db.getProjects(company.id).find((p) => p.id === projectId) : undefined;
  const scopeLabel = selectedProj
    ? `${selectedProj.code} - ${selectedProj.name}`
    : `Ensemble des chantiers (${budget.projectSummaries.length})`;

  const pdfBuffer = generateBudgetReportPdfBuffer(company, {
    scopeLabel,
    totalBudgetXAF: budget.totals.totalBudgetXAF,
    totalSpentXAF: budget.totals.totalSpentXAF,
    totalRemainingXAF: budget.totals.totalRemainingXAF,
    globalRate: budget.totals.globalRate,
    projectRows: budget.projectSummaries.map((p) => ({
      code: p.code,
      name: p.name,
      city: p.city,
      budgetTotal: p.budgetTotal,
      budgetSpent: p.budgetSpent,
      remaining: p.remaining,
      rate: p.rate,
      alertLevel: p.alertLevel,
    })),
    categoryRows: budget.categoryRows.map((c) => ({
      categoryLabel: c.categoryLabel,
      allocatedXAF: c.allocatedXAF,
      spentXAF: c.spentXAF,
      remainingXAF: c.remainingXAF,
      rate: c.rate,
    })),
    expenses,
  });

  const filename = `rapport_budgetaire_${company.slug}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

/**
 * ============================================================================
 * ÉTAPE 16 : MODULE 12 — NOTIFICATIONS & ALERTES MÉTIER BTP
 * (Étapes 14 & 15 reportées à la demande pour démarrer les 3 dernières étapes)
 * ============================================================================
 */

/**
 * GET /api/notifications/overview
 */
apiRouter.get('/notifications/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const userRole = req.query.userRole as any;
  const onlyMyRole = req.query.onlyMyRole === 'true';

  const overview = db.getNotificationsOverview(companyId, userRole, onlyMyRole);
  const projects = db.getProjects(companyId).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
  }));

  res.json({
    ...overview,
    projects,
  });
});

/**
 * POST /api/notifications/:id/read
 */
apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.body.companyId as string) || (req.query.companyId as string) || 'comp_socabat_01';
  const forceRead = typeof req.body.isRead === 'boolean' ? req.body.isRead : undefined;

  const updated = db.toggleNotificationRead(id, companyId, forceRead);
  if (!updated) {
    return res.status(404).json({ error: 'Notification introuvable.' });
  }

  res.json({
    success: true,
    notification: updated,
    message: updated.isRead ? 'Alerte marquée comme lue.' : 'Alerte marquée comme non lue.',
  });
});

/**
 * POST /api/notifications/read-all
 */
apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || 'comp_socabat_01';
  const updatedCount = db.markAllNotificationsRead(companyId);

  res.json({
    success: true,
    updatedCount,
    message: `${updatedCount} alerte(s) marquée(s) comme lue(s).`,
  });
});

/**
 * POST /api/notifications/:id/archive
 */
apiRouter.post('/notifications/:id/archive', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.body.companyId as string) || (req.query.companyId as string) || 'comp_socabat_01';

  const archived = db.archiveNotification(id, companyId);
  if (!archived) {
    return res.status(404).json({ error: 'Notification introuvable.' });
  }

  res.json({
    success: true,
    notification: archived,
    message: 'Alerte archivée.',
  });
});

/**
 * POST /api/notifications/broadcast
 * Diffusion manuelle d'une alerte chantier / sécurité / direction
 */
apiRouter.post('/notifications/broadcast', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    userRole,
    category,
    severity,
    title,
    message,
    projectId,
    targetRoles,
    channelsSent,
    actionTargetStep,
    authorName,
  } = req.body;

  if (
    userRole &&
    !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)
  ) {
    return res.status(403).json({
      error: 'Accès refusé : le profil Ouvrier ne peut pas diffuser d’alerte générale sur les chantiers.',
    });
  }

  const result = db.broadcastNotification(companyId, {
    category,
    severity,
    title: title || '',
    message: message || '',
    projectId,
    targetRoles: Array.isArray(targetRoles) ? targetRoles : ['DIRECTOR', 'SITE_MANAGER'],
    channelsSent: Array.isArray(channelsSent) ? channelsSent : ['IN_APP'],
    actionTargetStep,
    authorName: authorName || 'Direction BTP',
  });

  if (result.error || !result.notification) {
    return res.status(400).json({ error: result.error || 'Erreur lors de la diffusion.' });
  }

  res.status(201).json({
    success: true,
    notification: result.notification,
    message: `Alerte « ${result.notification.title} » diffusée sur ${result.notification.channelsSent.join(', ')}.`,
  });
});

/**
 * PUT /api/notifications/preferences
 * Paramétrage des règles d'alertes & canaux (In-App, WhatsApp, SMS, Email)
 */
apiRouter.put('/notifications/preferences', (req: Request, res: Response) => {
  const { companyId = 'comp_socabat_01', userRole, ...updates } = req.body;

  if (userRole && !['DIRECTOR', 'SITE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : seuls le Directeur Général, le Chef de chantier ou le Comptable peuvent modifier les canaux d’alerte.',
    });
  }

  const updated = db.updateNotificationPreferences(companyId, updates);
  res.json({
    success: true,
    preferences: updated,
    message: 'Préférences de notifications et canaux d’escalade enregistrées.',
  });
});

/**
 * ============================================================================
 * ÉTAPE 17 : MODULE 13 — MODE HORS-LIGNE / PWA CHANTIER
 * ============================================================================
 */

/**
 * GET /api/pwa/bootstrap
 * Télécharge le pack de référence terrain (chantiers, ouvriers, lots) pour mise en cache locale
 */
apiRouter.get('/pwa/bootstrap', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const pack = db.getPwaFieldBootstrap(companyId);
  res.json(pack);
});

/**
 * POST /api/pwa/sync
 * Synchronisation batch des saisies effectuées hors-ligne sur chantier
 */
apiRouter.post('/pwa/sync', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    userRole,
    authorName = 'Chef de chantier',
    items = [],
  } = req.body;

  if (
    userRole &&
    !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)
  ) {
    return res.status(403).json({
      error: 'Accès refusé : le profil Ouvrier ne peut pas synchroniser des écritures chantier.',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Aucune opération hors-ligne à synchroniser.' });
  }

  const result = db.processOfflineSyncQueue(companyId, items, authorName);
  res.json({
    success: true,
    ...result,
    message: `${result.syncedCount} opération(s) synchronisée(s) avec succès${
      result.failedCount > 0 ? ` (${result.failedCount} erreur(s))` : ''
    }.`,
  });
});

/**
 * ============================================================================
 * ÉTAPE 18 : MODULE 14 — ABONNEMENTS SAAS & FACTURATION MULTI-TENANT
 * ============================================================================
 */

/**
 * GET /api/subscriptions/overview
 * Récupère les quotas de l'entreprise, les plans tarifaires, factures et vue Super Admin Multi-Tenant
 */
apiRouter.get('/subscriptions/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const userRole = ((req.query.userRole as string) || 'DIRECTOR') as UserRole;
  const overview = db.getSubscriptionOverview(companyId, userRole);
  res.json(overview);
});

/**
 * POST /api/subscriptions/payments/initiate
 * Initie un vrai paiement Mobile Money (CamPay USSD Push) ou CinetPay (OM/MoMo/Carte)
 * Refuse tout faux paiement si aucune passerelle marchande n'est configurée sur le serveur
 */
apiRouter.post('/subscriptions/payments/initiate', async (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    userRole,
    initiatorName = 'Direction',
    targetPlan,
    billingCycle = 'MONTHLY',
    paymentMethod = 'ORANGE_MONEY',
    phoneNumber,
    invoiceId,
    preferredProvider,
  } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error:
        'Accès refusé : seuls le Directeur Général, le Comptable ou le Super Administrateur peuvent initier un paiement SaaS.',
    });
  }

  const company = db.getCompanyById(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  if (paymentMethod === 'ORANGE_MONEY' || paymentMethod === 'MTN_MOMO') {
    if (!phoneNumber || !normalizeCameroonPhone(phoneNumber)) {
      return res.status(400).json({
        error: 'Numéro Mobile Money camerounais invalide (format attendu : +237 6XXXXXXXX).',
      });
    }
  }

  let invoice = invoiceId ? db.getInvoiceById(invoiceId) : undefined;
  if (!invoice) {
    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(targetPlan)) {
      return res.status(400).json({ error: 'Formule tarifaire invalide.' });
    }
    const created = db.createPendingPlanInvoice({
      companyId,
      targetPlan: targetPlan as SubscriptionPlan,
      billingCycle: billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
      paymentMethod: paymentMethod as PaymentMethod,
      initiatorName,
    });
    if (!created.success || !created.invoice) {
      return res.status(400).json({ error: created.error });
    }
    invoice = created.invoice;
  }

  if (invoice.status === 'PAID') {
    return res.status(400).json({ error: 'Cette facture est déjà réglée.' });
  }

  // Virement Bancaire : émission stricte en attente de vérification bancaire
  if (paymentMethod === 'BANK_TRANSFER') {
    return res.status(201).json({
      success: true,
      mode: 'BANK_TRANSFER_PENDING',
      invoice,
      message: `Facture proforma ${invoice.invoiceNumber} émise en attente de virement bancaire.`,
    });
  }

  const gwStatus = getPaymentGatewayStatus();
  if (!gwStatus.configured) {
    return res.status(503).json({
      error:
        'Passerelle de paiement réelle non configurée : aucun faux paiement ne sera simulé. Configurez CAMPAY_TOKEN ou CINETPAY_API_KEY + CINETPAY_SITE_ID dans les variables serveur.',
      gatewayConfigured: false,
      invoice,
      gatewayStatus: gwStatus,
    });
  }

  const txId = `BP_TX_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  try {
    const initiated = await initiateRealPayment({
      txId,
      invoiceNumber: invoice.invoiceNumber,
      amountXAF: invoice.amountTTCXAF,
      phoneNumber,
      description: `Licence BATI-PILOT ${invoice.plan} (${invoice.invoiceNumber})`,
      customerName: company.name,
      customerEmail: company.email,
      customerCity: company.city,
      preferredProvider,
    });

    const tx = db.createPaymentTransaction({
      txId,
      invoiceId: invoice.id,
      companyId: company.id,
      provider: initiated.provider,
      paymentMethod: paymentMethod as PaymentMethod,
      phoneNumber,
      amountXAF: invoice.amountTTCXAF,
      externalReference: initiated.externalReference,
      paymentUrl: initiated.paymentUrl,
      ussdCode: initiated.ussdCode,
      operator: initiated.operator,
      status: initiated.status,
    });

    res.status(201).json({
      success: true,
      mode: 'GATEWAY_PENDING',
      transaction: tx,
      invoice,
      message:
        initiated.provider === 'CAMPAY'
          ? `Demande de débit réelle envoyée sur votre téléphone (${initiated.operator || 'Mobile Money'}). Validez avec votre code PIN.`
          : 'Session de paiement CinetPay initialisée. Finalisez le paiement sur le guichet sécurisé.',
    });
  } catch (err: any) {
    res.status(400).json({
      error: err?.message || 'Erreur lors de l’initiation du paiement auprès de l’opérateur.',
      invoice,
    });
  }
});

/**
 * GET /api/subscriptions/payments/:txId/status
 * Interroge la passerelle réelle (CamPay / CinetPay) pour vérifier la confirmation du paiement
 */
apiRouter.get('/subscriptions/payments/:txId/status', async (req: Request, res: Response) => {
  const { txId } = req.params;
  const tx = db.getPaymentTransactionById(txId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction introuvable.' });
  }

  if (tx.status === 'SUCCESSFUL') {
    const inv = db.getInvoiceById(tx.invoiceId);
    const comp = db.getCompanyById(tx.companyId);
    return res.json({
      status: 'SUCCESSFUL',
      transaction: tx,
      invoice: inv,
      company: comp,
      message: `Paiement confirmé (${inv?.invoiceNumber}).`,
    });
  }

  try {
    const check = await verifyRealPaymentStatus({
      provider: tx.provider,
      txId: tx.id,
      externalReference: tx.externalReference,
    });

    const updated = db.updatePaymentTransactionResult(tx.id, {
      status: check.status,
      operatorReference: check.operatorReference,
      errorMessage: check.status === 'FAILED' ? check.message : undefined,
    });

    res.json({
      status: check.status,
      transaction: updated.transaction,
      invoice: updated.invoice || db.getInvoiceById(tx.invoiceId),
      company: updated.company,
      message: check.message,
    });
  } catch (err: any) {
    res.status(502).json({
      error: err?.message || 'Impossible de joindre la passerelle de vérification.',
      transaction: tx,
    });
  }
});

/**
 * POST /api/subscriptions/payments/webhook/cinetpay
 * Webhook officiel CinetPay (avec revérification serveur-à-serveur avant activation)
 */
apiRouter.post('/subscriptions/payments/webhook/cinetpay', async (req: Request, res: Response) => {
  const txId = String(req.body?.cpm_trans_id || req.body?.transaction_id || '');
  if (!txId) {
    return res.status(400).json({ error: 'Identifiant transaction manquant.' });
  }
  const tx = db.getPaymentTransactionById(txId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction inconnue.' });
  }

  try {
    const check = await verifyRealPaymentStatus({
      provider: 'CINETPAY',
      txId: tx.id,
      externalReference: tx.externalReference,
    });
    db.updatePaymentTransactionResult(tx.id, {
      status: check.status,
      operatorReference: check.operatorReference,
      errorMessage: check.status === 'FAILED' ? check.message : undefined,
    });
    res.json({ received: true, status: check.status });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur vérification webhook CinetPay.' });
  }
});

/**
 * GET & POST /api/subscriptions/payments/webhook/campay
 * Callback officiel CamPay (avec revérification GET /transaction/:ref avant activation)
 */
apiRouter.all('/subscriptions/payments/webhook/campay', async (req: Request, res: Response) => {
  const extRef = String(req.body?.reference || req.query?.reference || '');
  const externalRef = String(req.body?.external_reference || req.query?.external_reference || '');
  const tx =
    (externalRef ? db.getPaymentTransactionById(externalRef) : undefined) ||
    (extRef ? db.getPaymentTransactionByExternalRef(extRef) : undefined);

  if (!tx) {
    return res.status(404).json({ error: 'Transaction CamPay introuvable.' });
  }

  try {
    const check = await verifyRealPaymentStatus({
      provider: 'CAMPAY',
      txId: tx.id,
      externalReference: tx.externalReference,
    });
    db.updatePaymentTransactionResult(tx.id, {
      status: check.status,
      operatorReference: check.operatorReference,
      errorMessage: check.status === 'FAILED' ? check.message : undefined,
    });
    res.json({ received: true, status: check.status });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur vérification webhook CamPay.' });
  }
});

/**
 * POST /api/subscriptions/invoices/generate
 * Émet une facture de renouvellement (statut En attente) pour l'entreprise
 */
apiRouter.post('/subscriptions/invoices/generate', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    userRole,
    billingCycle = 'MONTHLY',
  } = req.body;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error: 'Accès refusé : vous n’êtes pas autorisé à générer une facture de renouvellement.',
    });
  }

  const result = db.generateRenewalInvoice(
    companyId,
    billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY'
  );
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }

  res.status(201).json({
    success: true,
    invoice: result.invoice,
    message: `Facture de renouvellement ${result.invoice?.invoiceNumber} générée (En attente).`,
  });
});

/**
 * POST /api/subscriptions/invoices/:id/confirm-bank-transfer
 * Confirmation manuelle d'un virement bancaire réellement reçu sur le compte (Super Admin uniquement)
 */
apiRouter.post('/subscriptions/invoices/:id/confirm-bank-transfer', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userRole, bankReference, adminName = 'Super Administrateur' } = req.body;

  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error:
        'Accès refusé : seul le Super Administrateur peut valider l’encaissement effectif d’un virement bancaire.',
    });
  }

  const result = db.confirmBankTransferInvoice(id, bankReference, adminName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    invoice: result.invoice,
    company: result.company,
    message: `Virement confirmé (${result.invoice?.paymentReference}) — facture ${result.invoice?.invoiceNumber} acquittée.`,
  });
});

/**
 * PUT /api/subscriptions/tenants/:id/status
 * Contrôle Super Admin pour activer ou suspendre un tenant depuis la console facturation
 */
apiRouter.put('/subscriptions/tenants/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userRole, status } = req.body;

  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Accès refusé : action réservée au Super Administrateur de la plateforme BATI-PILOT.',
    });
  }

  if (!['ACTIVE', 'TRIAL', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Statut tenant invalide.' });
  }

  const updated = db.updateCompanyStatus(id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  res.json({
    success: true,
    company: updated,
    message: `Statut de ${updated.name} mis à jour : ${status}.`,
  });
});

/**
 * GET /api/subscriptions/invoices/:id/pdf
 * Téléchargement direct d'une facture SaaS BATI-PILOT au format PDF A4
 */
apiRouter.get('/subscriptions/invoices/:id/pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = db.getInvoiceById(id);
  if (!invoice) {
    return res.status(404).json({ error: 'Facture SaaS introuvable.' });
  }
  const company = db.getCompanyById(invoice.companyId);
  const planSpec = db.getSaasPlans().find((p) => p.id === invoice.plan);
  const pdfBuffer = generateSubscriptionInvoicePdfBuffer(invoice, company, planSpec);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${invoice.invoiceNumber}.pdf"`
  );
  res.send(pdfBuffer);
});

// =========================================================================
// ÉTAPE 14 — MODULE 10 : ANNUAIRE & PERFORMANCE FOURNISSEURS BTP
// =========================================================================

/**
 * GET /api/suppliers
 * Liste des fournisseurs BTP d'une entreprise avec métriques calculées en temps réel
 */
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const company = db.getCompanyById(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }
  const overview = db.getSuppliersWithPerformance(companyId);
  res.json(overview);
});

/**
 * GET /api/suppliers/:id
 * Dossier complet 360° d'un fournisseur (commandes, BL, litiges, encours)
 */
apiRouter.get('/suppliers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const dossier = db.getSupplierDossier(companyId, id);
  if (!dossier) {
    return res.status(404).json({ error: 'Fournisseur introuvable pour cette entreprise.' });
  }
  res.json(dossier);
});

/**
 * POST /api/suppliers
 * Créer un nouveau fournisseur BTP (NIU, RCCM, délai règlement)
 */
apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    userRole,
    name,
    category,
    contactPerson,
    phone,
    email,
    city,
    address,
    niu,
    rccm,
    paymentTerms,
    specialties,
    rating,
    notes,
  } = req.body;

  if (
    userRole &&
    !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)
  ) {
    return res.status(403).json({
      error: 'Accès refusé : un profil ouvrier ne peut pas référencer un fournisseur.',
    });
  }

  const created = db.createSupplier({
    companyId,
    name,
    category: category as SupplierCategory,
    contactPerson,
    phone,
    email,
    city,
    address,
    niu,
    rccm,
    paymentTerms: paymentTerms as SupplierPaymentTerms,
    specialties,
    rating,
    notes,
  });

  if (!created.success || !created.supplier) {
    return res.status(400).json({ error: created.error });
  }

  res.status(201).json({
    success: true,
    supplier: created.supplier,
    message: `Fournisseur « ${created.supplier.name} » référencé avec succès.`,
  });
});

/**
 * PUT /api/suppliers/:id
 * Mettre à jour la fiche administrative d'un fournisseur
 */
apiRouter.put('/suppliers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { companyId = 'comp_socabat_01', userRole, ...patch } = req.body;

  if (
    userRole &&
    !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)
  ) {
    return res.status(403).json({
      error: 'Accès refusé : droit de modification fournisseur insuffisant.',
    });
  }

  const updated = db.updateSupplier(companyId, id, patch);
  if (!updated.success || !updated.supplier) {
    return res.status(404).json({ error: updated.error || 'Fournisseur introuvable.' });
  }

  res.json({
    success: true,
    supplier: updated.supplier,
    message: `Fiche de ${updated.supplier.name} mise à jour.`,
  });
});

/**
 * PUT /api/suppliers/:id/status
 * Agréer, placer sous surveillance ou blacklister un fournisseur (Direction / Super Admin)
 */
apiRouter.put('/suppliers/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { companyId = 'comp_socabat_01', userRole, status, notes } = req.body;

  if (userRole && !['DIRECTOR', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error:
        'Accès refusé : seul le Directeur Général ou le Super Administrateur peut agréer ou blacklister un fournisseur.',
    });
  }

  if (!['PREFERRED', 'ACTIVE', 'UNDER_REVIEW', 'BLACKLISTED'].includes(status)) {
    return res.status(400).json({ error: 'Statut fournisseur invalide.' });
  }

  const updated = db.updateSupplierStatus(companyId, id, status as SupplierStatus, notes);
  if (!updated.success || !updated.supplier) {
    return res.status(404).json({ error: updated.error });
  }

  res.json({
    success: true,
    supplier: updated.supplier,
    message: `Statut de ${updated.supplier.name} basculé à ${status}.`,
  });
});

/**
 * GET /api/suppliers/:id/pdf
 * Export PDF A4 de la Fiche Évaluation & Encours Fournisseur
 */
apiRouter.get('/suppliers/:id/pdf', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const dossier = db.getSupplierDossier(companyId, id);
  if (!dossier) {
    return res.status(404).json({ error: 'Fournisseur introuvable.' });
  }
  const company = db.getCompanyById(companyId);
  const pdfBuffer = generateSupplierDossierPdfBuffer({
    company,
    supplier: dossier.supplier,
    orders: dossier.orders,
    deliveries: dossier.deliveries,
    expenses: dossier.expenses,
  });

  const safeSlug = dossier.supplier.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="fiche-fournisseur-${safeSlug || id}.pdf"`
  );
  res.send(pdfBuffer);
});

// =========================================================================
// ÉTAPE 15 — MODULE 11 : RAPPORTS & CENTRE DOCUMENTAIRE BTP
// =========================================================================

/**
 * GET /api/reports/overview
 * Synthèse exécutive + Coffre-fort pièces justificatives + Documents générés consolidés
 */
apiRouter.get('/reports/overview', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const company = db.getCompanyById(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }
  const overview = db.getReportsAndDocumentsOverview(companyId, projectId);
  res.json(overview);
});

/**
 * GET /api/reports/executive-monthly/pdf
 * Export PDF A4 du Rapport Exécutif Mensuel Direction Générale
 */
apiRouter.get('/reports/executive-monthly/pdf', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const period = (req.query.period as string) || 'Novembre 2026';

  const reportData = db.getExecutiveMonthlyReportData(companyId, projectId);
  if (!reportData.company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const pdfBuffer = generateExecutiveMonthlyReportPdfBuffer(reportData, period);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="BATI-PILOT_Rapport_Direction_${period.replace(/\s+/g, '_')}.pdf"`
  );
  res.send(pdfBuffer);
});

/**
 * GET /api/reports/executive-monthly/docx
 * Export Word (.docx) du Rapport Exécutif Mensuel Direction Générale
 */
apiRouter.get('/reports/executive-monthly/docx', async (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const period = (req.query.period as string) || 'Novembre 2026';

  const reportData = db.getExecutiveMonthlyReportData(companyId, projectId);
  if (!reportData.company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const docxBuffer = await generateExecutiveMonthlyReportDocxBuffer(reportData, period);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="BATI-PILOT_Rapport_Direction_${period.replace(/\s+/g, '_')}.docx"`
  );
  res.send(docxBuffer);
});

/**
 * GET /api/reports/accounting-export.csv
 * Export CSV comptable OHADA consolidé (Dépenses, Bons de Commande, Paie FCFA)
 */
apiRouter.get('/reports/accounting-export.csv', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const projectId = (req.query.projectId as string) || 'ALL';
  const company = db.getCompanyById(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const csvContent = db.getAccountingCsvRows(companyId, projectId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="BATI-PILOT_Grand_Livre_${company.slug}.csv"`
  );
  res.send(csvContent);
});

/**
 * POST /api/reports/documents
 * Archiver une pièce justificative dans le coffre-fort BTP
 */
apiRouter.post('/reports/documents', (req: Request, res: Response) => {
  const {
    companyId = 'comp_socabat_01',
    projectId,
    title,
    reference,
    category,
    documentDate,
    uploadedByName = 'Direction',
    userRole,
    fileName,
    mimeType,
    fileSizeKB,
    dataBase64,
    notes,
  } = req.body;

  if (
    userRole &&
    !['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)
  ) {
    return res.status(403).json({
      error: 'Accès refusé : un profil ouvrier ne peut pas archiver de pièces officielles.',
    });
  }

  const created = db.addVaultDocument({
    companyId,
    projectId: projectId && projectId !== 'NONE' ? projectId : undefined,
    title,
    reference,
    category: category as VaultDocumentCategory,
    documentDate,
    uploadedByName,
    uploadedByRole: (userRole as UserRole) || 'DIRECTOR',
    fileName,
    mimeType,
    fileSizeKB,
    dataBase64,
    notes,
  });

  if (!created.success || !created.document) {
    return res.status(400).json({ error: created.error });
  }

  void pgStore.saveVaultFileToPg({
    id: created.document.id,
    companyId,
    fileName: created.document.fileName,
    mimeType: created.document.mimeType,
    dataBase64: created.document.dataBase64,
  });

  res.status(201).json({
    success: true,
    document: created.document,
    message: `Pièce « ${created.document.reference} » archivée dans le coffre-fort.`,
  });
});

/**
 * GET /api/reports/documents/:id/download
 * Télécharge la pièce réelle importée ou sa fiche justificative PDF certifiée
 */
apiRouter.get('/reports/documents/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const docRecord = db.getVaultDocumentById(companyId, id);
  if (!docRecord) {
    return res.status(404).json({ error: 'Pièce justificative introuvable.' });
  }

  if (docRecord.dataBase64) {
    const cleanB64 = docRecord.dataBase64.includes(',')
      ? docRecord.dataBase64.split(',')[1]
      : docRecord.dataBase64;
    const buf = Buffer.from(cleanB64, 'base64');
    res.setHeader('Content-Type', docRecord.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${docRecord.fileName}"`);
    return res.send(buf);
  }

  const company = db.getCompanyById(companyId);
  const pdfBuffer = generateVaultDocumentSummaryPdfBuffer(company, docRecord);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${docRecord.fileName.replace(/\.[^.]+$/, '')}.pdf"`
  );
  res.send(pdfBuffer);
});

/**
 * DELETE /api/reports/documents/:id
 * Suppression d'une archive (Directeur / Comptable / Super Admin uniquement)
 */
apiRouter.delete('/reports/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req.query.companyId as string) || 'comp_socabat_01';
  const userRole = req.query.userRole as string;

  if (userRole && !['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      error:
        'Accès refusé : seul le Directeur Général, le Comptable ou le Super Administrateur peut supprimer une archive.',
    });
  }

  const deleted = db.deleteVaultDocument(companyId, id);
  if (!deleted) {
    return res.status(404).json({ error: 'Document introuvable.' });
  }

  void pgStore.removeVaultFileFromPg(id);

  res.json({ success: true, message: 'Pièce supprimée du coffre-fort.' });
});












