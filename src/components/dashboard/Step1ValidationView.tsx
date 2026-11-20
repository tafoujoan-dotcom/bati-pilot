import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLE_PERMISSIONS, formatFCFA } from '../../utils/permissions';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  CheckCircle,
  Database,
  Building2,
  Users,
  Server,
  Layers,
  ArrowRight,
  RefreshCw,
  Lock,
  Globe,
  Coins,
  Clock,
  Sparkles,
  HelpCircle,
  Activity,
} from 'lucide-react';

export const Step1ValidationView: React.FC = () => {
  const { user, company, permissions, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'architecture' | 'permissions' | 'schema' | 'api-test'>('architecture');
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  if (!user || !company) return null;

  const roleMeta = ROLE_LABELS[user.role];

  const testEndpoint = async (url: string) => {
    setIsTestingApi(true);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch {
      setApiResponse(JSON.stringify({ error: "Impossible de joindre l'API en direct" }, null, 2));
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Bannière de validation de l'Étape 1 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Étape 1 sur 18 — Prête pour vos tests</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Architecture & Authentification Multi-Rôles BTP
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Vous êtes actuellement connecté avec l'entreprise{' '}
              <strong className="text-orange-400 font-semibold">{company.name}</strong> en tant que{' '}
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${roleMeta.badgeColor}`}>
                {roleMeta.label}
              </span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <p className="text-[11px] text-slate-400">Devise active</p>
              <p className="text-sm font-bold text-slate-200">FCFA (XAF)</p>
              <p className="text-[10px] text-slate-400">Fuseau : Douala (UTC+1)</p>
            </div>
          </div>
        </div>

        {/* Mini guide de test pour l'utilisateur */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">1. Tester chaque rôle</strong>
              Basculez entre les 6 rôles ci-dessus pour observer l'adaptation des droits.
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">2. Tester l'isolation</strong>
              Vérifiez que les données sont cloisonnées par entreprise (multi-tenant).
            </div>
          </div>
          <div className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">3. Valider l'étape</strong>
              Donnez votre accord dans le chat pour que nous lancions l'Étape 2 (Base de données & Migrations).
            </div>
          </div>
        </div>
      </div>

      {/* Barre de navigation d'inspection de l'étape 1 */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'architecture'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Architecture Globale</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Matrice des Permissions RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'schema'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Schéma BDD Prévu (Étape 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('api-test')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'api-test'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Console Test API Directe</span>
        </button>
      </div>

      {/* Contenu selon l'onglet sélectionné */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Grille 3 piliers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Multi-Tenant Cloisonné</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chaque entreprise BTP possède son espace étanche (<code>companyId</code>). Un utilisateur de SOCABAT ne verra jamais les chantiers, devis ou budgets d'une entreprise concurrente.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Entreprise active : {company.slug}</span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Contexte Métier Afrique & Cameroun</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tous les flux financiers sont calculés en FCFA (XAF) sans virgule superflue. Adapté aux ouvriers journaliers (pointages à la demi-journée, acomptes en espèces ou Mobile Money, retenues).
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Formatage : {formatFCFA(185000000)}</span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. PWA & Résilience Hors-Ligne</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Architecture conçue pour les chantiers éloignés sans réseau 4G stable : saisie locale du pointage et des rapports d'avancement, puis synchronisation dès le retour de connexion.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>IndexedDB / Service Worker ready</span>
              </div>
            </div>
          </div>

          {/* Arborescence modulaire */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Arborescence Modulaire du Projet BATI-PILOT</span>
            </h3>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 leading-relaxed border border-slate-800/80 overflow-x-auto">
              <pre>{`├── server.ts                   # Serveur Express full-stack + Vite middlewares
├── server/
│   ├── db.ts                   # Magasin de données BTP persistant (multi-tenant)
│   ├── routes.ts               # API REST (/api/auth, /api/projects, /api/stock...)
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx     # Gestion de session, rôles & switch démo
│   ├── types/
│   │   ├── index.ts            # Types stricts TypeScript (Company, User, Project, etc.)
│   ├── utils/
│   │   ├── permissions.ts      # Matrice RBAC et formatage monétaire FCFA
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx   # Écran de connexion & inscription entreprise
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Shell applicatif BTP (sidebar 14 modules, header)
│   │   ├── dashboard/
│   │   │   ├── Step1ValidationView.tsx # Cockpit de test Étape 1
│   ├── App.tsx                 # Routeur & injection des contextes
│   └── main.tsx                # Point d'entrée React 19`}</pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Droits de votre rôle actuel : {roleMeta.label}</h3>
                <p className="text-xs text-slate-400">{roleMeta.description}</p>
              </div>
              <div className="text-xs text-slate-400">
                Cliquez sur un autre rôle pour simuler ses droits en temps réel :
              </div>
            </div>

            {/* Boutons de test rapide des rôles */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'WORKER', 'SUPER_ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchDemoRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    user.role === r
                      ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {ROLE_LABELS[r].label}
                </button>
              ))}
            </div>

            {/* Grille des permissions effectives */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {permissions &&
                Object.entries(permissions).map(([key, val]) => {
                  const labelsMap: Record<string, string> = {
                    canViewAllProjects: 'Voir tous les chantiers',
                    canCreateProjects: 'Créer un nouveau chantier',
                    canEditProjects: 'Modifier fiche chantier & planning',
                    canViewBudgets: 'Consulter les budgets & dépenses',
                    canEditBudgets: 'Allouer et modifier les budgets',
                    canRecordDailyProgress: "Déclarer l'avancement journalier",
                    canRecordAttendance: 'Enregistrer le pointage des ouvriers',
                    canValidateAttendance: 'Valider définitivement les pointages',
                    canManagePayroll: 'Gérer la paie & acomptes',
                    canManageStock: 'Entrées / Sorties de matériaux',
                    canCreatePurchaseOrder: 'Émettre un bon de commande',
                    canApprovePurchaseOrder: 'Valider financièrement un bon de commande',
                    canRecordDelivery: 'Réceptionner une livraison',
                    canRecordExpense: 'Enregistrer une dépense ou facture',
                    canViewReports: 'Générer et consulter les rapports',
                    canManageUsers: 'Gérer les comptes utilisateurs',
                    canManageCompanySubscription: "Gérer l'abonnement SaaS",
                    canManagePlatform: 'Administrer la plateforme BATI-PILOT',
                  };

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                        val
                          ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-200'
                          : 'bg-slate-950/50 border-slate-800/60 text-slate-400'
                      }`}
                    >
                      <span>{labelsMap[key] || key}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          val ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {val ? 'AUTORISÉ' : 'REFUSÉ'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Schéma Relationnel Complet (30 Tables Prévues)</h3>
                <p className="text-xs text-slate-400">
                  Prêt pour l'Étape 2 (Base de données relationnelle, clés étrangères, contraintes multi-tenant et index).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-semibold border border-orange-500/20">
                Étape 2 Prochaine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: 'companies', desc: 'Entreprises BTP clientes (Tenants, devise, fuseau)' },
                { name: 'users', desc: 'Comptes utilisateurs rattachés aux rôles BTP' },
                { name: 'roles & permissions', desc: 'Matrice fine des droits d’accès' },
                { name: 'projects', desc: 'Chantiers (GPS, dates, budget FCFA, statut)' },
                { name: 'project_members', desc: 'Affectation des équipes par chantier' },
                { name: 'project_reports', desc: 'Rapports journaliers chef de chantier (météo, tâches)' },
                { name: 'workers', desc: 'Ouvriers & journaliers (matricule, tarif, fonction)' },
                { name: 'attendance_records', desc: 'Pointages quotidiens (présent, demi-j, retard)' },
                { name: 'payrolls & payments', desc: 'Fiches de paie, acomptes, retenues, soldes' },
                { name: 'materials', desc: 'Catalogue matériaux (ciment, fer, sable, parpaings)' },
                { name: 'stock_movements', desc: 'Entrées, sorties avec motif, transferts de chantier' },
                { name: 'warehouses', desc: 'Dépôts centraux et magasins de chantier' },
                { name: 'suppliers', desc: 'Fournisseurs BTP (contact, évaluation, historique)' },
                { name: 'purchase_orders', desc: 'Bons de commande avec circuit de validation DG' },
                { name: 'deliveries', desc: 'Bons de livraison avec constat d’écarts et photos' },
                { name: 'expenses & categories', desc: 'Dépenses chantiers (carburant, sable, salaires)' },
                { name: 'budgets', desc: 'Budgets prévisionnels vs dépenses réelles FCFA' },
                { name: 'audit_logs', desc: 'Journalisation immuable de toutes les actions' },
              ].map((t) => (
                <div key={t.name} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-mono font-bold text-xs text-slate-200">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api-test' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Console Interactive d'Interrogation API Backend</h3>
              <p className="text-xs text-slate-400">
                Testez en direct les endpoints REST créés pour l'étape 1.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => testEndpoint('/api/system/health')}
                disabled={isTestingApi}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500 text-xs font-mono text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>GET /api/system/health</span>
              </button>

              <button
                onClick={() => testEndpoint('/api/auth/demo-accounts')}
                disabled={isTestingApi}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500 text-xs font-mono text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>GET /api/auth/demo-accounts</span>
              </button>

              <button
                onClick={() => testEndpoint('/api/companies')}
                disabled={isTestingApi}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500 text-xs font-mono text-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>GET /api/companies</span>
              </button>
            </div>

            {apiResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Réponse JSON du serveur :</span>
                  <button
                    onClick={() => setApiResponse(null)}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Effacer
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto max-h-80">
                  <pre>{apiResponse}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
