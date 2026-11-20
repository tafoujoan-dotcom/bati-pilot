import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils/permissions';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  Check,
  X,
  Play,
  HardHat,
  Building2,
  Package,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  availableActions: ('read' | 'create' | 'update' | 'delete' | 'approve')[];
}

export const RolePermissionsView: React.FC = () => {
  const { user, company, token } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const inspectableRoles: UserRole[] = isSuperAdmin
    ? ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'WORKER', 'SUPER_ADMIN']
    : ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'WORKER'];

  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator' | 'profiles'>('matrix');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SITE_MANAGER');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [matrix, setMatrix] = useState<Record<UserRole, Record<string, string[]>> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Pour le simulateur
  const [simRole, setSimRole] = useState<UserRole>('SITE_MANAGER');
  const [simScenario, setSimScenario] = useState<string>('approve_purchase_order');
  const [simResult, setSimResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.role ? { 'x-user-role': user.role } : {}),
    ...(company?.id ? { 'x-company-id': company.id } : {}),
  };

  useEffect(() => {
    if (!isSuperAdmin && selectedRole === 'SUPER_ADMIN') {
      setSelectedRole('SITE_MANAGER');
    }
  }, [isSuperAdmin, selectedRole]);

  // Charger la matrice des permissions depuis l'API
  const loadMatrix = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/permissions/matrix?companyId=${company?.id || 'comp_socabat_01'}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setMatrix(data.matrix);
        setResources(data.resources);
      }
    } catch (err) {
      console.error('Erreur chargement matrice des permissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [company?.id, user?.role, token]);

  // Basculer une permission
  const handleTogglePermission = async (role: UserRole, resourceId: string, action: string) => {
    setActionError(null);
    try {
      const res = await fetch('/api/permissions/toggle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          role,
          resource: resourceId,
          action,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadMatrix();
      } else {
        setActionError(data.error || 'Action non autorisée.');
      }
    } catch {
      console.error('Erreur basculement permission');
    }
  };

  // Rétablir les permissions par défaut
  const handleResetDefaults = async () => {
    setActionError(null);
    try {
      const res = await fetch('/api/permissions/reset', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ companyId: company?.id || 'comp_socabat_01' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setActionSuccess(data.message);
        setTimeout(() => setActionSuccess(null), 4000);
        await loadMatrix();
      } else {
        setActionError(data.error || 'Réinitialisation refusée.');
      }
    } catch {
      console.error('Erreur réinitialisation');
    }
  };

  // Exécuter la simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/permissions/simulate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          role: simRole,
          scenario: simScenario,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (e) {
      console.error('Erreur simulation:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const actionLabels: Record<string, { label: string; short: string; color: string }> = {
    read: { label: 'Consulter', short: 'Voir', color: 'text-blue-400' },
    create: { label: 'Créer', short: 'Ajout', color: 'text-emerald-400' },
    update: { label: 'Modifier', short: 'Modif', color: 'text-amber-400' },
    delete: { label: 'Supprimer', short: 'Suppr', color: 'text-rose-400' },
    approve: { label: 'Valider / Signer', short: 'Signer', color: 'text-purple-400' },
  };

  const categories = ['Chantiers', 'RH & Pointage', 'Stocks & Achats', 'Finances', 'Administration'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Étape 4 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Contrôle d'Accès & Séparation des Pouvoirs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestion des Rôles & Permissions Fines BTP
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Matrice de contrôle d'accès dynamique (RBAC) garantissant la séparation des devoirs : le Chef de chantier saisit les besoins, le Directeur valide les dépenses, le Magasinier contrôle les stocks, le Comptable vérifie la paie.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
              title="Rétablir les permissions standard préconisées pour le BTP"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              <span>Rétablir matrice standard BTP</span>
            </button>
          </div>
        </div>

        {/* Message de succès ou erreur */}
        {actionSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Règles d'or de sécurité BTP */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <strong className="text-white block font-semibold mb-0.5">1. Zéro approbation aveugle</strong>
            <span className="text-[11px] text-slate-400">
              Un chef de chantier ne peut jamais s'auto-approuver un bon de commande de matériel.
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <strong className="text-white block font-semibold mb-0.5">2. Traçabilité des stocks</strong>
            <span className="text-[11px] text-slate-400">
              Chaque sac de ciment ou barre de fer qui sort du stock est signé avec motif et bénéficiaire.
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <strong className="text-white block font-semibold mb-0.5">3. Confidentialité salariale</strong>
            <span className="text-[11px] text-slate-400">
              Les tarifs journaliers et acomptes ne sont accessibles qu'à la Direction et à la Comptabilité.
            </span>
          </div>
        </div>
      </div>

      {/* Onglets de navigation Étape 4 */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs sm:text-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matrice Interactive par Rôle</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Simulateur d'Actions Métier</span>
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'profiles'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fiches de Poste & Périmètres</span>
        </button>
      </div>

      {/* ONGLET 1 : MATRICE INTERACTIVE DES PERMISSIONS */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Sélecteur du rôle à configurer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Sélectionnez le rôle à inspecter ou à personnaliser :
              </span>
              <span className="text-[11px] text-slate-400">
                Les modifications s'appliquent immédiatement à tous les utilisateurs de ce rôle dans {company?.name}.
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {inspectableRoles.map((r) => {
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ROLE_LABELS[r].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille des permissions pour le rôle sélectionné */}
          <div className="space-y-6">
            {categories.map((cat) => {
              const catResources = resources.filter((r) => r.category === cat);
              if (catResources.length === 0) return null;

              return (
                <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>{cat}</span>
                  </h3>

                  <div className="border border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 min-w-[220px]">Ressource / Entité Métier</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-center">Consulter</th>
                          <th className="py-2.5 px-3 text-center">Créer</th>
                          <th className="py-2.5 px-3 text-center">Modifier</th>
                          <th className="py-2.5 px-3 text-center">Supprimer</th>
                          <th className="py-2.5 px-3 text-center">Valider / Signer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {catResources.map((res) => {
                          const currentRolePerms = matrix?.[selectedRole]?.[res.id] || [];

                          return (
                            <tr key={res.id} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3">
                                <strong className="text-white block">{res.name}</strong>
                                <span className="text-[10px] text-slate-500 font-mono">{res.id}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">
                                {res.description}
                              </td>

                              {(['read', 'create', 'update', 'delete', 'approve'] as const).map((act) => {
                                const isApplicable = res.availableActions.includes(act);
                                const isAllowed = currentRolePerms.includes(act);

                                if (!isApplicable) {
                                  return (
                                    <td key={act} className="py-2.5 px-3 text-center text-slate-700 text-[11px]">
                                      —
                                    </td>
                                  );
                                }

                                return (
                                  <td key={act} className="py-2.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePermission(selectedRole, res.id, act)}
                                      className={`p-1.5 rounded-md transition-all cursor-pointer inline-flex items-center justify-center ${
                                        isAllowed
                                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                                          : 'bg-slate-950 text-slate-600 hover:bg-slate-800 border border-slate-800'
                                      }`}
                                      title={`Cliquer pour ${isAllowed ? 'révoquer' : 'accorder'} : ${act}`}
                                    >
                                      {isAllowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ONGLET 2 : SIMULATEUR D'ACTIONS MÉTIER */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Panneau de configuration du test */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Simulateur de Droits en Direct</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sélectionnez un rôle et une action concrète de chantier pour vérifier si le système autorise ou bloque l'opération.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  1. Choisir le rôle à vérifier :
                </label>
                <select
                  value={simRole}
                  onChange={(e) => setSimRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="SITE_MANAGER">Chef de chantier (Conducteur de travaux)</option>
                  <option value="STOREKEEPER">Magasinier (Dépôt & Magasins)</option>
                  <option value="ACCOUNTANT">Comptable (Finance & Paie)</option>
                  <option value="WORKER">Ouvrier / Journalier</option>
                  <option value="DIRECTOR">Directeur Général (DG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  2. Choisir l'action opérationnelle à exécuter :
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'approve_purchase_order', label: 'Valider un bon de commande de 2 450 000 FCFA' },
                    { id: 'record_attendance', label: 'Pointer les ouvriers journaliers sur le chantier' },
                    { id: 'record_stock_exit', label: 'Déclarer une sortie de 100 sacs de ciment' },
                    { id: 'manage_payroll', label: 'Valider les acomptes & salaires des ouvriers' },
                    { id: 'create_project', label: 'Ouvrir un nouveau chantier (Nom, Budget FCFA)' },
                    { id: 'delete_worker', label: 'Supprimer définitivement la fiche d\'un ouvrier' },
                  ].map((s) => (
                    <label
                      key={s.id}
                      onClick={() => setSimScenario(s.id)}
                      className={`p-3 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                        simScenario === s.id
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="simScenario"
                        checked={simScenario === s.id}
                        onChange={() => setSimScenario(s.id)}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Tester l'autorisation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panneau de résultat */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Résultat du Contrôle d'Accès</h3>

            {simResult ? (
              <div
                className={`p-5 rounded-xl border animate-fadeIn space-y-3 ${
                  simResult.isAllowed
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-red-950/30 border-red-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                      simResult.isAllowed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {simResult.isAllowed ? '✓' : '✕'}
                  </div>

                  <div>
                    <h4
                      className={`text-base font-bold ${
                        simResult.isAllowed ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {simResult.isAllowed ? 'OPÉRATION AUTORISÉE' : 'ACCÈS STRICTEMENT REFUSÉ'}
                    </h4>
                    <span className="text-xs text-slate-300">
                      Rôle testé : <strong className="text-white">{ROLE_LABELS[simResult.roleName as UserRole]?.label}</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs space-y-2">
                  <p className="text-slate-300 font-medium">{simResult.reason}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Permission requise :</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300">
                      {simResult.requiredPermission}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                Sélectionnez un rôle et une action à gauche, puis cliquez sur <strong>« Tester l'autorisation »</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 3 : FICHES DE POSTE & PÉRIMÈTRES */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              role: 'DIRECTOR' as UserRole,
              title: "Directeur Général (DG)",
              icon: Building2,
              color: 'border-blue-500/30 bg-blue-950/20',
              missions: [
                'Vision globale sur l\'ensemble des chantiers de l\'entreprise',
                'Validation financière obligatoire des bons de commande',
                'Arbitrage des dépassements budgétaires',
                'Création et clôture des chantiers',
                'Gestion de l\'équipe et des rémunérations',
              ],
            },
            {
              role: 'SITE_MANAGER' as UserRole,
              title: 'Chef de Chantier',
              icon: HardHat,
              color: 'border-amber-500/30 bg-amber-950/20',
              missions: [
                'Déclaration quotidienne de l\'avancement des travaux',
                'Pointage matinal des ouvriers journaliers présents',
                'Émission des demandes de matériaux (bons de commande)',
                'Prise de photos de chantier (avant/pendant/après)',
                'Signalement des intempéries (saison des pluies) et incidents',
              ],
            },
            {
              role: 'STOREKEEPER' as UserRole,
              title: 'Magasinier Dépôt',
              icon: Package,
              color: 'border-emerald-500/30 bg-emerald-950/20',
              missions: [
                'Contrôle des réceptions de livraison et constat des casses',
                'Enregistrement de chaque sortie de ciment, fer ou sable',
                'Surveillance des seuils d\'alerte de stock minimum',
                'Réalisation des inventaires physiques périodiques',
                'Gestion des retours de matériaux non consommés',
              ],
            },
            {
              role: 'ACCOUNTANT' as UserRole,
              title: 'Responsable Paie & Finances',
              icon: DollarSign,
              color: 'border-cyan-500/30 bg-cyan-950/20',
              missions: [
                'Calcul des salaires journaliers basés sur le pointage réel',
                'Enregistrement et déduction des acomptes accordés',
                'Génération des fiches de paie et reçus de règlement',
                'Suivi des factures fournisseurs et dépenses de chantier',
                'Rapprochement budget prévisionnel vs dépenses réelles',
              ],
            },
            {
              role: 'WORKER' as UserRole,
              title: 'Ouvrier / Journalier',
              icon: Users,
              color: 'border-slate-700 bg-slate-900',
              missions: [
                'Consultation de sa fiche personnelle et spécialité',
                'Vérification de ses journées pointées (présences/retards)',
                'Consultation de ses acomptes perçus et solde restant',
                'Accès restreint : aucune vue sur les autres ouvriers ou chantiers',
              ],
            },
            {
              role: 'SUPER_ADMIN' as UserRole,
              title: 'Super Administrateur',
              icon: ShieldCheck,
              color: 'border-purple-500/30 bg-purple-950/20',
              missions: [
                'Gestion de l\'infrastructure multi-tenants de la plateforme',
                'Création, activation et suspension des entreprises clientes',
                'Configuration des formules tarifaires et abonnements',
                'Audit global de sécurité et sauvegardes du système',
              ],
            },
          ]
            .filter((profile) => isSuperAdmin || profile.role !== 'SUPER_ADMIN')
            .map((profile) => {
            const Icon = profile.icon;
            return (
              <div key={profile.role} className={`p-5 rounded-xl border ${profile.color} space-y-3`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-orange-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{profile.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{profile.role}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  {profile.missions.map((m, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-orange-400 text-xs shrink-0">•</span>
                      <span className="text-[11px] leading-relaxed">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
