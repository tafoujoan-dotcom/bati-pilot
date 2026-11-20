import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Database,
  Table as TableIcon,
  Layers,
  Key,
  ShieldCheck,
  CheckCircle,
  Download,
  RefreshCw,
  Search,
  ExternalLink,
  Code2,
  FileCode,
  AlertCircle,
  Copy,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ColumnDef {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  references?: {
    table: string;
    column: string;
  };
  description?: string;
}

interface TableDef {
  name: string;
  category: string;
  description: string;
  columns: ColumnDef[];
  rowCount: number;
  columnsCount: number;
  foreignKeysCount: number;
}

export const DatabaseExplorerView: React.FC = () => {
  const { company } = useAuth();

  const [activeTab, setActiveTab] = useState<'tables' | 'mcd' | 'sql'>('tables');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('projects');
  const [tableDetails, setTableDetails] = useState<any>(null);
  const [tablesList, setTablesList] = useState<TableDef[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Charger les données de la base au montage
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [resTables, resStatus, resSql] = await Promise.all([
        fetch('/api/database/tables'),
        fetch('/api/database/status'),
        fetch('/api/database/schema-sql'),
      ]);

      if (resTables.ok) {
        const data = await resTables.json();
        setTablesList(data.tables || []);
      }

      if (resStatus.ok) {
        const data = await resStatus.json();
        setStats(data.stats || null);
      }

      if (resSql.ok) {
        const text = await resSql.text();
        setSqlContent(text);
      }
    } catch (err) {
      console.error('Erreur chargement base de données:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Charger le détail de la table sélectionnée
  useEffect(() => {
    if (!selectedTable) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/database/table/${selectedTable}`);
        if (res.ok) {
          const data = await res.json();
          setTableDetails(data);
        }
      } catch (e) {
        console.error('Erreur chargement détails table:', e);
      }
    };
    fetchDetails();
  }, [selectedTable]);

  // Réinitialiser / Re-seeder
  const handleResetSeed = async () => {
    try {
      const res = await fetch('/api/database/reset-seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message || 'Données réinitialisées avec succès.');
        setTimeout(() => setActionMessage(null), 4000);
        await loadDatabaseData();
        // Recharger table sélectionnée
        const resDet = await fetch(`/api/database/table/${selectedTable}`);
        if (resDet.ok) setTableDetails(await resDet.json());
      }
    } catch {
      setActionMessage('Erreur lors du re-seeding.');
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'ALL', label: 'Toutes les tables (30)' },
    { id: 'Multi-Tenant', label: 'Multi-Tenant (4)' },
    { id: 'Chantiers', label: 'Chantiers (5)' },
    { id: 'RH & Pointage', label: 'RH & Pointage (4)' },
    { id: 'Stocks & Achats', label: 'Stocks & Achats (9)' },
    { id: 'Finances', label: 'Finances (3)' },
    { id: 'Sécurité & Système', label: 'Sécurité (5)' },
  ];

  const filteredTables = tablesList.filter((t) => {
    const matchCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Bannière de l'Étape 2 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
              <Database className="w-4 h-4" />
              <span>Étape 2 sur 18 — Prête pour vos tests</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Base de Données Relationnelle & Migrations BTP
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Architecture relationnelle complète composée de <strong>30 tables normalisées</strong>, avec clés étrangères, contraintes d'intégrité, index de performance et isolation multi-tenant stricte par <code>company_id</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetSeed}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
              title="Réinitialiser et ré-injecter les données BTP démo"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              <span>Réinitialiser les données démo</span>
            </button>

            <a
              href="/api/database/schema-sql"
              download="bati-pilot-schema.sql"
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-orange-600/20"
              title="Télécharger le script SQL DDL complet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger schema.sql</span>
            </a>
          </div>
        </div>

        {/* Message de confirmation action */}
        {actionMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Cartes de statistiques globales */}
        {stats && (
          <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Tables créées</span>
              <strong className="text-xl font-extrabold text-white">{stats.totalTables}</strong>
              <span className="text-[10px] text-emerald-400 block mt-0.5">30 tables 100% migrées</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Colonnes modélisées</span>
              <strong className="text-xl font-extrabold text-white">{stats.totalColumns}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">Typées & contraintes</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Clés étrangères (FK)</span>
              <strong className="text-xl font-extrabold text-orange-400">{stats.totalForeignKeys}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">Relations & intégrité</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-slate-400 block text-[11px]">Enregistrements démo</span>
              <strong className="text-xl font-extrabold text-blue-400">{stats.totalRows}</strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">Chantiers, ouvriers, stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Barre de navigation interne Étape 2 */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'tables'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Explorateur des 30 Tables</span>
        </button>

        <button
          onClick={() => setActiveTab('mcd')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'mcd'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Diagramme des Relations (MCD)</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'sql'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Script SQL DDL Brut</span>
        </button>
      </div>

      {/* ONGLET 1 : EXPLORATEUR DES 30 TABLES */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne gauche : Liste filtrable des tables */}
          <div className="lg:col-span-5 space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une table..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Filtre de catégories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    categoryFilter === c.id
                      ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Liste des tables */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTables.map((table) => {
                const isSelected = selectedTable === table.name;
                return (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-600/15 border-orange-500/50 shadow-md'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-200 truncate">
                          {table.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                          {table.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {table.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                        {table.rowCount} lignes
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonne droite : Fiche détaillée de la table sélectionnée */}
          <div className="lg:col-span-7 space-y-4">
            {tableDetails ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-mono font-bold text-white">
                        {tableDetails.definition.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {tableDetails.definition.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {tableDetails.definition.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300 block">
                      {tableDetails.rowCount} enregistrements
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {tableDetails.definition.columns.length} colonnes
                    </span>
                  </div>
                </div>

                {/* Structure des colonnes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-orange-400" />
                    Structure des Colonnes & Contraintes
                  </h4>

                  <div className="border border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Nom de la colonne</th>
                          <th className="py-2 px-3">Type SQL</th>
                          <th className="py-2 px-3">Clé / Contrainte</th>
                          <th className="py-2 px-3">Description / Référence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {tableDetails.definition.columns.map((col: ColumnDef) => (
                          <tr key={col.name} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 text-white font-semibold flex items-center gap-1.5">
                              {col.isPrimary && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                              <span>{col.name}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">{col.type}</td>
                            <td className="py-2 px-3">
                              {col.isPrimary && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  PRIMARY KEY
                                </span>
                              )}
                              {col.references && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                  FK → {col.references.table}.{col.references.column}
                                </span>
                              )}
                              {!col.isPrimary && !col.references && (
                                <span className="text-slate-500 font-sans text-[11px]">
                                  {col.isNullable === false ? 'NOT NULL' : 'NULLABLE'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-400 font-sans text-xs">
                              {col.description || (col.references ? `Liaison avec ${col.references.table}` : '—')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Échantillon des données réelles stockées */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      Données en Base ({tableDetails.sampleRows.length} lignes)
                    </h4>
                  </div>

                  {tableDetails.sampleRows.length > 0 ? (
                    <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] sticky top-0">
                          <tr>
                            {Object.keys(tableDetails.sampleRows[0]).map((key) => (
                              <th key={key} className="py-2 px-3 whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-[11px]">
                          {tableDetails.sampleRows.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              {Object.values(row).map((val: any, valIdx: number) => (
                                <td key={valIdx} className="py-2 px-3 whitespace-nowrap text-slate-300">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-600 italic">null</span>
                                  ) : typeof val === 'object' ? (
                                    JSON.stringify(val)
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                      Aucune ligne dans cette table pour le moment.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Sélectionnez une table à gauche pour inspecter ses champs et ses relations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 2 : DIAGRAMME DES RELATIONS (MCD) */}
      {activeTab === 'mcd' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              <span>Modèle Conceptuel de Données (MCD) & Clés Étrangères</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Visualisation des 5 blocs relationnels centraux et des flux de clés étrangères reliant le multi-tenant, les chantiers, les ouvriers, les stocks et les finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Bloc 1 : Multi-Tenant & Utilisateurs */}
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300">1. Cœur Multi-Tenant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">Plaque tournante</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-purple-900/40">
                  <strong className="text-white block">companies</strong>
                  <span className="text-[10px] text-slate-400">PK: id (UUID) · Devise XAF · Africa/Douala</span>
                </div>
                <div className="text-center text-slate-500">↓ 1:N (company_id)</div>
                <div className="p-2 rounded bg-slate-900 border border-purple-900/40">
                  <strong className="text-white block">users & subscriptions</strong>
                  <span className="text-[10px] text-slate-400">FK: company_id · Rôles RBAC (DG, Chef, Magasinier...)</span>
                </div>
              </div>
            </div>

            {/* Bloc 2 : Chantiers & Avancement */}
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300">2. Chantiers & Suivi</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300">Opérations</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-blue-900/40">
                  <strong className="text-white block">projects</strong>
                  <span className="text-[10px] text-slate-400">FK: company_id, manager_id (users)</span>
                </div>
                <div className="text-center text-slate-500">↓ 1:N (project_id)</div>
                <div className="p-2 rounded bg-slate-900 border border-blue-900/40">
                  <strong className="text-white block">project_reports, tasks & photos</strong>
                  <span className="text-[10px] text-slate-400">Rapports journaliers, avancement %, photos chantier</span>
                </div>
              </div>
            </div>

            {/* Bloc 3 : RH, Ouvriers & Paie */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">3. Ouvriers & Pointage</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">Journaliers</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-amber-900/40">
                  <strong className="text-white block">workers</strong>
                  <span className="text-[10px] text-slate-400">FK: company_id · Tarif journalier FCFA</span>
                </div>
                <div className="text-center text-slate-500">↓ 1:N (worker_id, project_id)</div>
                <div className="p-2 rounded bg-slate-900 border border-amber-900/40">
                  <strong className="text-white block">attendance_records → payrolls</strong>
                  <span className="text-[10px] text-slate-400">Pointage quotidien, brut, acomptes, solde net</span>
                </div>
              </div>
            </div>

            {/* Bloc 4 : Matériaux & Stocks */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300">4. Stocks & Dépôts</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">Matériaux</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-emerald-900/40">
                  <strong className="text-white block">materials & warehouses</strong>
                  <span className="text-[10px] text-slate-400">Ciment, Fer, Sable, Dépôts de stockage</span>
                </div>
                <div className="text-center text-slate-500">↓ 1:N (material_id, warehouse_id)</div>
                <div className="p-2 rounded bg-slate-900 border border-emerald-900/40">
                  <strong className="text-white block">stock_movements (Immuable)</strong>
                  <span className="text-[10px] text-slate-400">Entrées, sorties avec justification & bénéficiaire</span>
                </div>
              </div>
            </div>

            {/* Bloc 5 : Achats & Fournisseurs */}
            <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-300">5. Commandes & Livraisons</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950 text-orange-300">Achats BTP</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-orange-900/40">
                  <strong className="text-white block">suppliers → purchase_orders</strong>
                  <span className="text-[10px] text-slate-400">Fokou, Sorepco · Validation obligatoire DG</span>
                </div>
                <div className="text-center text-slate-500">↓ 1:N (order_id)</div>
                <div className="p-2 rounded bg-slate-900 border border-orange-900/40">
                  <strong className="text-white block">deliveries & delivery_items</strong>
                  <span className="text-[10px] text-slate-400">Réception sur site, constat d’écarts & casses</span>
                </div>
              </div>
            </div>

            {/* Bloc 6 : Finances & Audit */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300">6. Finances & Audit</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">Contrôle</span>
              </div>
              <div className="font-mono space-y-1.5 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-rose-900/40">
                  <strong className="text-white block">budgets vs expenses</strong>
                  <span className="text-[10px] text-slate-400">Suivi budget prévisionnel vs dépenses FCFA</span>
                </div>
                <div className="text-center text-slate-500">↓ Journalisation</div>
                <div className="p-2 rounded bg-slate-900 border border-rose-900/40">
                  <strong className="text-white block">audit_logs & notifications</strong>
                  <span className="text-[10px] text-slate-400">Traçabilité immuable de chaque opération</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 3 : SCRIPT SQL DDL BRUT */}
      {activeTab === 'sql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-400" />
                <span>Script DDL SQL Complet (PostgreSQL / MySQL compatible)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Fichier source : <code>server/database/schema.sql</code> (contient les 30 tables, clés primaires, clés étrangères et index)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copySqlToClipboard}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-orange-400" />
                <span>{copied ? 'Copié !' : 'Copier le SQL'}</span>
              </button>

              <a
                href="/api/database/schema-sql"
                download="schema.sql"
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs text-white flex items-center gap-1.5 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger .sql</span>
              </a>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-[600px] leading-relaxed">
            <pre>{sqlContent || 'Chargement du script SQL...'}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
