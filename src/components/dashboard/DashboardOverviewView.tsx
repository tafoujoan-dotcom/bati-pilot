import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Wallet,
  Users,
  AlertTriangle,
  FileCheck,
  Package,
  Calendar,
  CloudSun,
  CloudRain,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  ChevronRight,
  HardHat,
  Truck,
  Sparkles,
} from 'lucide-react';

interface ProjectKpi {
  id: string;
  code: string;
  name: string;
  clientName: string;
  location: string;
  city: string;
  managerName: string;
  progressPercentage: number;
  budgetTotal: number;
  budgetSpent: number;
  budgetRemaining: number;
  spentRate: number;
  status: string;
  workersCount: number;
  expectedEndDate: string;
}

interface MonthlyExpense {
  month: string;
  materiaux: number;
  mainOeuvre: number;
  carburantEngins: number;
  fraisGeneraux: number;
}

interface CostItem {
  label: string;
  percentage: number;
  amountXAF: number;
  color: string;
}

interface StockAlert {
  id: string;
  reference: string;
  designation: string;
  unit: string;
  currentStock: number;
  minimumAlert: number;
  isCritical: boolean;
  unitPriceXAF: number;
  deficit: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  projectName: string;
  supplierName: string;
  totalAmountXAF: number;
  notes: string;
  status: string;
  requestedBy: string;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  badge: string;
  user: string;
}

export const DashboardOverviewView: React.FC = () => {
  const { user, company } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statsData, setStatsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  const fetchDashboardStats = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const companyId = company?.id || 'comp_socabat_01';
      const res = await fetch(`/api/dashboard/stats?companyId=${companyId}&projectId=${selectedProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Erreur chargement statistiques tableau de bord:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [company?.id, selectedProjectId]);

  // Validation d'un bon de commande directement depuis le tableau de bord (rôle DG)
  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/dashboard/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        const result = await res.json();
        setActionNotice(result.message);
        setTimeout(() => setActionNotice(null), 4000);
        await fetchDashboardStats(true);
      }
    } catch (e) {
      console.error("Erreur lors de l'approbation:", e);
    }
  };

  // Réapprovisionnement d'un stock d'urgence
  const handleReorderStock = async (materialId: string) => {
    try {
      const res = await fetch('/api/dashboard/reorder-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId }),
      });
      if (res.ok) {
        const result = await res.json();
        setActionNotice(result.message);
        setTimeout(() => setActionNotice(null), 4000);
        await fetchDashboardStats(true);
      }
    } catch (e) {
      console.error('Erreur réapprovisionnement:', e);
    }
  };

  const formatFCFA = (val: number) => {
    return `${(val || 0).toLocaleString('fr-FR')} FCFA`;
  };

  if (isLoading && !statsData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Calcul des statistiques consolidées BATI-PILOT...
        </p>
      </div>
    );
  }

  const kpis = statsData?.kpis || {};
  const projects: ProjectKpi[] = statsData?.projects || [];
  const monthlyExpenses: MonthlyExpense[] = statsData?.monthlyExpenses || [];
  const costDistribution: CostItem[] = statsData?.costDistribution || [];
  const stockAlerts: StockAlert[] = statsData?.stockAlerts || [];
  const pendingOrders: PendingOrder[] = statsData?.pendingOrders || [];
  const recentActivities: ActivityItem[] = statsData?.recentActivities || [];
  const weather = statsData?.weatherAdvisory;

  // Calcul pour la hauteur relative du graphe
  const maxMonthTotal = Math.max(
    ...monthlyExpenses.map((m) => m.materiaux + m.mainOeuvre + m.carburantEngins + m.fraisGeneraux),
    10000000
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          EN-TÊTE DU TABLEAU DE BORD (ÉTAPE 5)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold tracking-wide uppercase">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Pilotage Opérationnel BTP
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-medium">{company?.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400 text-[11px]">Douala, Cameroun (FCFA / XAF)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tableau de Bord Exécutif & Métriques Chantiers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Supervision consolidée et en temps réel de vos opérations : suivi budgétaire en FCFA, avancement physique des travaux, alertes de réapprovisionnement et visas de la Direction Générale.
            </p>
          </div>

          {/* Filtres et Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sélecteur de Chantier */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="all">Tous les chantiers (Vue consolidée)</option>
                {statsData?.filter?.availableProjects?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bouton Actualiser */}
            <button
              onClick={() => fetchDashboardStats(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Actualiser les métriques en temps réel"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Notification d'action rapide */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Météo BTP & Alerte Opérationnelle Chantier */}
        {weather && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              {weather.city === 'Douala' ? (
                <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-semibold text-white">Météo BTP ({weather.city}) :</span>
              <span className="text-slate-300">{weather.temperature} · {weather.condition}</span>
            </div>
            <div className="text-slate-400 flex items-center gap-2 text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              <span>Recommandation terrain : <strong className="text-slate-200">{weather.impact}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          LES 4 CARTES DE MÉTRIQUES CLÉS (KPIS BTP)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Chantiers & Avancement Global */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Chantiers Actifs</span>
            <Building2 className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{kpis.activeProjectsCount || 0}</span>
            <span className="text-xs text-slate-400">projets en cours</span>
          </div>
          
          <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/60">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Avancement moyen</span>
              <span className="font-bold text-orange-400">{kpis.avgProgress || 0}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-orange-600 to-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${kpis.avgProgress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 2 : Budget Consommé vs Budget Total */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Budget Global Consommé</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-xl font-bold text-white truncate">{formatFCFA(kpis.spentBudgetXAF)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-2">
            sur {formatFCFA(kpis.totalBudgetXAF)} alloués
          </div>

          <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Taux de consommation</span>
              <span className={`font-bold ${kpis.budgetConsumptionRate > 85 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {kpis.budgetConsumptionRate || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  kpis.budgetConsumptionRate > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, kpis.budgetConsumptionRate || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 3 : Main d'œuvre & Pointage Journalier */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Pointage Journalier</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{kpis.presentTodayWorkers || 0}</span>
            <span className="text-xs text-slate-400">ouvriers présents</span>
          </div>

          <div className="space-y-1 text-xs mt-3 pt-3 border-t border-slate-800/60">
            <div className="flex justify-between text-slate-400">
              <span>Masse salariale / jour :</span>
              <span className="text-slate-200 font-semibold">{formatFCFA(kpis.estimatedDailyPayrollXAF)}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Pointages clôturés par les chefs de chantiers
            </div>
          </div>
        </div>

        {/* KPI 4 : Approbations & Stocks d'Urgence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Alertes & Visas DG</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{kpis.pendingApprovalsCount || 0}</span>
            <span className="text-xs text-amber-400 font-semibold">commande(s) à signer</span>
          </div>

          <div className="space-y-1 text-xs mt-3 pt-3 border-t border-slate-800/60">
            <div className="flex justify-between text-slate-400">
              <span>Montant en attente :</span>
              <span className="text-amber-400 font-semibold">{formatFCFA(kpis.pendingOrdersAmountXAF)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Alertes stocks critiques :</span>
              <span className="text-rose-400 font-bold">{kpis.criticalStockAlertsCount || 0} article(s)</span>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          GRAPHIQUES : ÉVOLUTION DES DÉPENSES & RÉPARTITION DES COÛTS BTP
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique 1 : Évolution Mensuelle des Dépenses (2 colonnes) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Évolution Mensuelle des Dépenses BTP (FCFA)</h2>
              <p className="text-xs text-slate-400">Ventilation par poste : Matériaux, Main d'œuvre, Carburant et Frais généraux</p>
            </div>

            {/* Légende sans pilules (Zero-Pill discipline) */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block"></span>
                <span>Matériaux</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
                <span>Main d'œuvre</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                <span>Carburant</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                <span>Frais gén.</span>
              </span>
            </div>
          </div>

          {/* Histogramme SVG / CSS interactif */}
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-4 border-b border-slate-800 px-2">
            {monthlyExpenses.map((m, index) => {
              const totalMonth = m.materiaux + m.mainOeuvre + m.carburantEngins + m.fraisGeneraux;
              const heightPercent = Math.min(100, Math.round((totalMonth / maxMonthTotal) * 100));

              const hMat = (m.materiaux / totalMonth) * heightPercent;
              const hMo = (m.mainOeuvre / totalMonth) * heightPercent;
              const hCarb = (m.carburantEngins / totalMonth) * heightPercent;
              const hFg = (m.fraisGeneraux / totalMonth) * heightPercent;

              const isHovered = hoveredMonthIndex === index;

              return (
                <div
                  key={m.month}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredMonthIndex(index)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                >
                  {/* Tooltip au survol */}
                  {isHovered && (
                    <div className="absolute -top-24 z-20 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 shadow-2xl min-w-[180px] pointer-events-none animate-fadeIn">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
                        {m.month} : {formatFCFA(totalMonth)}
                      </div>
                      <div className="text-[10px] space-y-0.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>Matériaux :</span>
                          <span className="text-orange-400 font-semibold">{formatFCFA(m.materiaux)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Main d'œuvre :</span>
                          <span className="text-blue-400 font-semibold">{formatFCFA(m.mainOeuvre)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carburant :</span>
                          <span className="text-emerald-400 font-semibold">{formatFCFA(m.carburantEngins)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frais généraux :</span>
                          <span className="text-amber-400 font-semibold">{formatFCFA(m.fraisGeneraux)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Barre empilée */}
                  <div className="w-full max-w-[42px] flex flex-col justify-end rounded-t-md overflow-hidden bg-slate-950 transition-all duration-300 group-hover:brightness-125">
                    <div style={{ height: `${hFg}%` }} className="bg-amber-500 w-full" title="Frais généraux"></div>
                    <div style={{ height: `${hCarb}%` }} className="bg-emerald-500 w-full" title="Carburant & Engins"></div>
                    <div style={{ height: `${hMo}%` }} className="bg-blue-500 w-full" title="Main d'œuvre"></div>
                    <div style={{ height: `${hMat}%` }} className="bg-orange-500 w-full" title="Matériaux"></div>
                  </div>

                  {/* Label du mois */}
                  <span className="text-[11px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Échelle : Données réelles consolidées de la base</span>
            <span>Devise officielle : Franc CFA (XAF)</span>
          </div>
        </div>

        {/* Graphique 2 : Structure des Coûts par Catégorie BTP */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Structure des Coûts BTP</h2>
            <p className="text-xs text-slate-400 mb-5">Répartition des charges directes par famille de travaux</p>

            {/* Barres horizontales de répartition */}
            <div className="space-y-4">
              {costDistribution.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[200px]">{item.label}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    {formatFCFA(item.amountXAF)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Contrôle de rentabilité</span>
            <span className="text-emerald-400 font-semibold">Marge prévisionnelle : ~18.5%</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          LISTE DES CHANTIERS EN COURS (OPÉRATIONS TERRAIN)
         ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white">État d'Avancement des Chantiers Actifs</h2>
            <p className="text-xs text-slate-400">Progression physique, budget engagé et dates prévisionnelles de livraison</p>
          </div>
          <span className="text-xs text-slate-400">
            {projects.length} chantier(s) supervisé(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Chantier & Référence</th>
                <th className="py-3 px-3">Localisation</th>
                <th className="py-3 px-3">Conducteur / Chef</th>
                <th className="py-3 px-3">Budget (Dépensé / Total)</th>
                <th className="py-3 px-3">Avancement</th>
                <th className="py-3 px-3">Livraison estimée</th>
                <th className="py-3 px-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-white block text-sm">{proj.name}</span>
                    <span className="text-[11px] font-mono text-orange-400">{proj.code}</span>
                    <span className="text-slate-500 block text-[10px]">Client : {proj.clientName}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div>{proj.location}</div>
                    <div className="text-slate-500 text-[10px]">{proj.city}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-slate-200 font-medium">{proj.managerName}</div>
                    <div className="text-slate-500 text-[10px]">{proj.workersCount} ouvriers affectés</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-slate-200 font-semibold">{formatFCFA(proj.budgetSpent)}</div>
                    <div className="text-slate-500 text-[10px]">sur {formatFCFA(proj.budgetTotal)}</div>
                    <div className="text-[10px] text-orange-400 font-mono mt-0.5">
                      Reste : {formatFCFA(proj.budgetRemaining)} ({100 - proj.spentRate}%)
                    </div>
                  </td>
                  <td className="py-3.5 px-3 min-w-[130px]">
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span className="font-bold text-white">{proj.progressPercentage}%</span>
                      <span className="text-slate-500 text-[10px]">{proj.spentRate}% budget</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${proj.progressPercentage}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(proj.expectedEndDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      En cours
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ACTIONS RAPIDES : VISAS DU DG & ALERTE STOCKS CRITIQUES
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Approbations en attente (Rôle DG - Visa financier) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-orange-400" />
                <span>Bons de Commande en Attente de Visa DG</span>
              </h2>
              <p className="text-xs text-slate-400">Séparation des devoirs : seul le Directeur Général engage la dépense</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold">
              {pendingOrders.length} en attente
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-300">Toutes les commandes sont validées !</p>
              <p className="text-[11px] text-slate-500">Aucun bon de commande en souffrance de visa financier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-xs text-slate-300">{order.projectName}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Fournisseur : <strong className="text-slate-200">{order.supplierName}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 italic">
                        « {order.notes} »
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">
                        {formatFCFA(order.totalAmountXAF)}
                      </div>
                      <div className="text-[10px] text-slate-500">Demandé par {order.requestedBy}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Rôle autorisé : <strong className="text-orange-400">DIRECTEUR GÉNÉRAL (DG)</strong>
                    </span>
                    <button
                      onClick={() => handleApproveOrder(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approuver & Signer (Visa DG)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes de Stock Critique (Rôle Magasinier / Approvisionnement) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-400" />
                <span>Surveillance des Stocks de Chantier</span>
              </h2>
              <p className="text-xs text-slate-400">Matériaux atteignant le seuil critique de rupture</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold">
              {stockAlerts.length} alerte(s)
            </span>
          </div>

          <div className="space-y-3">
            {stockAlerts.map((mat) => (
              <div
                key={mat.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">{mat.designation}</span>
                    {mat.isCritical && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400 text-[10px] font-bold">
                        Critique
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Stock actuel : <strong className="text-rose-400">{mat.currentStock} {mat.unit}</strong> · Seuil min : {mat.minimumAlert} {mat.unit}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReorderStock(mat.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Créer une demande de réapprovisionnement"
                  >
                    <Truck className="w-3 h-3 text-orange-400" />
                    <span>Réapprovisionner</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dépôt principal : Zone Industrielle Bassa</span>
            <span className="text-slate-400">Magasinier : Christian Talla</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          FIL D'ACTIVITÉ EN TEMPS RÉEL (JOURNAL OPÉRATIONNEL BTP)
         ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Journal d'Activité Récente des Chantiers</span>
            </h2>
            <p className="text-xs text-slate-400">Traçabilité des opérations de terrain, pointages et mouvements de stock</p>
          </div>
          <span className="text-[11px] text-slate-400">Dernière mise à jour à l'instant</span>
        </div>

        <div className="space-y-3">
          {recentActivities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0"></div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="text-xs font-bold text-slate-200">{act.title}</div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{act.description}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <span>Par : <strong className="text-slate-300">{act.user}</strong></span>
                  <span>·</span>
                  <span>Catégorie : {act.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
