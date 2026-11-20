import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ExpenseCategory,
  ExpenseRecord,
  ExpenseStatus,
  PaymentMethod,
} from '../../types';
import {
  Wallet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Banknote,
  Edit3,
  RefreshCw,
  X,
  Lock,
  TrendingUp,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface BudgetProjectSummary {
  id: string;
  code: string;
  name: string;
  city: string;
  budgetTotal: number;
  budgetSpent: number;
  remaining: number;
  overrunXAF: number;
  rate: number;
  alertLevel: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
}

interface BudgetCategoryRow {
  lineId?: string;
  category: ExpenseCategory;
  categoryLabel: string;
  allocatedXAF: number;
  spentXAF: number;
  remainingXAF: number;
  rate: number;
}

interface BudgetOverviewData {
  projectSummaries: BudgetProjectSummary[];
  categoryRows: BudgetCategoryRow[];
  totals: {
    totalBudgetXAF: number;
    totalSpentXAF: number;
    totalRemainingXAF: number;
    globalRate: number;
  };
  sourcesBreakdown: {
    stockExitsXAF: number;
    directDeliveriesXAF: number;
    paidPayrollXAF: number;
    manualExpensesPaidOrApprovedXAF: number;
  };
}

interface ExpensesSummary {
  totalBudgetXAF: number;
  totalSpentXAF: number;
  totalRemainingXAF: number;
  globalRate: number;
  pendingAmountXAF: number;
  pendingCount: number;
  totalExpensesCount: number;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'ENGINS_CARBURANT', label: 'Engins, Location & Carburant' },
  { value: 'SOUS_TRAITANCE', label: 'Sous-traitance & Lots Techniques' },
  { value: 'FRAIS_CHANTIER', label: 'Frais Généraux Chantier' },
  { value: 'MATERIAUX', label: 'Matériaux & Agrégats (Achat direct)' },
  { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre & Primes' },
  { value: 'DIVERS', label: 'Menues Dépenses & Divers' },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  CASH: 'Espèces / Caisse',
  BANK_TRANSFER: 'Virement / Chèque',
};

const STATUS_META: Record<ExpenseStatus, { label: string; colorClass: string }> = {
  PENDING: { label: 'En attente validation', colorClass: 'text-amber-400' },
  APPROVED: { label: 'Bon à payer (Validée)', colorClass: 'text-blue-400' },
  PAID: { label: 'Payée & Imputée', colorClass: 'text-emerald-400' },
  REJECTED: { label: 'Refusée', colorClass: 'text-red-400' },
};

export const ExpensesBudgetView: React.FC = () => {
  const { company, user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [budget, setBudget] = useState<BudgetOverviewData>({
    projectSummaries: [],
    categoryRows: [],
    totals: {
      totalBudgetXAF: 0,
      totalSpentXAF: 0,
      totalRemainingXAF: 0,
      globalRate: 0,
    },
    sourcesBreakdown: {
      stockExitsXAF: 0,
      directDeliveriesXAF: 0,
      paidPayrollXAF: 0,
      manualExpensesPaidOrApprovedXAF: 0,
    },
  });
  const [summary, setSummary] = useState<ExpensesSummary>({
    totalBudgetXAF: 0,
    totalSpentXAF: 0,
    totalRemainingXAF: 0,
    globalRate: 0,
    pendingAmountXAF: 0,
    pendingCount: 0,
    totalExpensesCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreateExpense =
    user?.role === 'DIRECTOR' ||
    user?.role === 'ACCOUNTANT' ||
    user?.role === 'SITE_MANAGER' ||
    user?.role === 'SUPER_ADMIN';

  const canApproveOrPay =
    user?.role === 'DIRECTOR' || user?.role === 'ACCOUNTANT' || user?.role === 'SUPER_ADMIN';

  // Modal Nouvelle Dépense (montant vide par défaut)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expProjectId, setExpProjectId] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('FRAIS_CHANTIER');
  const [expTitle, setExpTitle] = useState('');
  const [expBeneficiary, setExpBeneficiary] = useState('');
  const [expAmountXAF, setExpAmountXAF] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<PaymentMethod>('ORANGE_MONEY');
  const [expInvoiceRef, setExpInvoiceRef] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  // Modal Paiement Dépense
  const [payingExpense, setPayingExpense] = useState<ExpenseRecord | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('ORANGE_MONEY');
  const [payRef, setPayRef] = useState('');

  // Modal Ajustement Enveloppe Budgétaire
  const [editingBudgetLine, setEditingBudgetLine] = useState<BudgetCategoryRow | null>(null);
  const [newAllocatedXAF, setNewAllocatedXAF] = useState('');

  const fetchOverview = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/expenses/overview?companyId=${encodeURIComponent(company.id)}&projectId=${encodeURIComponent(projectFilter)}&category=${encodeURIComponent(categoryFilter)}&status=${encodeURIComponent(statusFilter)}`
      );
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setProjects(data.projects || []);
        setBudget(data.budget || {});
        setSummary(data.summary || {});
        if (!expProjectId && data.projects?.length > 0) {
          setExpProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Erreur chargement dépenses & budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, projectFilter, categoryFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const formatXAF = (val: number) => `${Math.round(val).toLocaleString('fr-FR')} FCFA`;

  const openCreateModal = () => {
    setErrorMsg(null);
    setExpProjectId(projectFilter !== 'ALL' ? projectFilter : projects[0]?.id || '');
    setExpCategory('ENGINS_CARBURANT');
    setExpTitle('');
    setExpBeneficiary('');
    setExpAmountXAF(''); // Saisie manuelle obligatoire
    setExpPaymentMethod('ORANGE_MONEY');
    setExpInvoiceRef('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNotes('');
    setShowCreateModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    const amt = Number(expAmountXAF);
    if (!expAmountXAF || isNaN(amt) || amt <= 0) {
      setErrorMsg('Veuillez saisir manuellement un montant positif en FCFA.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          projectId: expProjectId,
          category: expCategory,
          title: expTitle,
          beneficiary: expBeneficiary,
          amountXAF: amt,
          paymentMethod: expPaymentMethod,
          invoiceRef: expInvoiceRef,
          expenseDate: expDate,
          recordedByName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
          notes: expNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de l’enregistrement.');
        return;
      }
      setShowCreateModal(false);
      showToast(data.message);
      await fetchOverview();
    } catch (err) {
      setErrorMsg('Erreur réseau lors de la création de la dépense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (exp: ExpenseRecord) => {
    if (!user) return;
    const res = await fetch(`/api/expenses/${exp.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await fetchOverview();
    } else {
      showToast(data.error || 'Action refusée.');
    }
  };

  const handleReject = async (exp: ExpenseRecord) => {
    if (!user) return;
    const res = await fetch(`/api/expenses/${exp.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverName: `${user.firstName} ${user.lastName}`,
        reason: 'Pièce justificative ou montant à vérifier',
        userRole: user.role,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await fetchOverview();
    } else {
      showToast(data.error || 'Action refusée.');
    }
  };

  const handlePayExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${payingExpense.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: payMethod,
          paymentReference: payRef,
          payerName: `${user.firstName} ${user.lastName}`,
          userRole: user.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayingExpense(null);
        setPayRef('');
        showToast(data.message);
        await fetchOverview();
      } else {
        setErrorMsg(data.error || 'Erreur lors du décaissement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBudgetLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudgetLine?.lineId || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/budget/lines/${editingBudgetLine.lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocatedBudgetXAF: Number(newAllocatedXAF),
          userRole: user.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingBudgetLine(null);
        showToast(data.message);
        await fetchOverview();
      } else {
        setErrorMsg(data.error || 'Modification refusée.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const alertProjects = budget.projectSummaries.filter(
    (p) => p.alertLevel === 'WARNING' || p.alertLevel === 'CRITICAL' || p.alertLevel === 'EXCEEDED'
  );

  const filteredExpenses = expenses.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.reference.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.beneficiary.toLowerCase().includes(q) ||
      (e.invoiceRef || '').toLowerCase().includes(q) ||
      e.projectName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête Module 9 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-orange-400">Contrôle Financier & Budgétaire</span>
            <span aria-hidden="true">·</span>
            <span>{company?.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Dépenses & Suivi Budgétaire Chantier
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pilotage Prévu vs Réalisé en FCFA (Sorties stock, Paies ouvriers, Livraisons directes et Frais généraux).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <a
            href={`/api/expenses/report-pdf?companyId=${encodeURIComponent(company?.id || '')}&projectId=${encodeURIComponent(projectFilter)}`}
            download={`rapport_budgetaire_${company?.slug || 'batipilot'}.pdf`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-orange-500/40 text-xs font-semibold text-orange-400 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rapport Budgétaire PDF</span>
          </a>

          {canCreateExpense ? (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une Dépense</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Saisie réservée Chef / Comptable / DG</span>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerte Budgétaire Chantiers */}
      {alertProjects.length > 0 && (
        <div className="px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Vigilance budgétaire :</strong>{' '}
              {alertProjects.map((p) => `${p.code} (${p.rate}% consommé)`).join(' · ')}
            </span>
          </div>
          <span className="text-[11px] text-amber-300/80">
            Contrôlez les postes ci-dessous avant tout nouvel engagement.
          </span>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Budget Prévu Total</p>
          <p className="text-2xl font-extrabold text-white tabular-nums mt-1">
            {formatXAF(summary.totalBudgetXAF)}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            Périmètre : {budget.projectSummaries.length} chantier(s)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Dépenses Réalisées</p>
          <p className="text-2xl font-extrabold text-orange-400 tabular-nums mt-1">
            {formatXAF(summary.totalSpentXAF)}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            Taux d’exécution global : <strong className="text-white">{summary.globalRate}%</strong>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Reliquat Budgétaire Disponible</p>
          <p className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">
            {formatXAF(summary.totalRemainingXAF)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Marge financière restante</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">À décaisser / En attente</p>
          <p className="text-2xl font-extrabold text-amber-400 tabular-nums mt-1">
            {formatXAF(summary.pendingAmountXAF)}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {summary.pendingCount} fiche(s) de dépense ouverte(s)
          </p>
        </div>
      </div>

      {/* Synthèse Budgétaire par Chantier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {budget.projectSummaries.map((proj) => {
          const barColor =
            proj.rate >= 100
              ? 'bg-red-500'
              : proj.rate >= 85
                ? 'bg-amber-500'
                : 'bg-emerald-500';
          return (
            <div
              key={proj.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-bold text-orange-400">{proj.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.city}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate mt-0.5">{proj.name}</h3>
                </div>
                <span
                  className={`font-mono text-sm font-extrabold tabular-nums shrink-0 ${
                    proj.rate >= 100
                      ? 'text-red-400'
                      : proj.rate >= 85
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {proj.rate}%
                </span>
              </div>

              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${barColor} transition-all duration-300`}
                  style={{ width: `${Math.min(100, proj.rate)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Prévu</span>
                  <span className="font-semibold text-white">{formatXAF(proj.budgetTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Réalisé</span>
                  <span className="font-semibold text-orange-400">{formatXAF(proj.budgetSpent)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Disponible</span>
                  <span className="font-semibold text-emerald-400">{formatXAF(proj.remaining)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tableau Comparatif Prévu vs Réalisé par Poste Budgétaire */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span>Comparatif Prévu vs Réalisé par Poste Budgétaire</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              Agrégation automatique : Sorties Stock ({formatXAF(budget.sourcesBreakdown.stockExitsXAF)}) ·
              Livraisons Directes ({formatXAF(budget.sourcesBreakdown.directDeliveriesXAF)}) ·
              Paies Payées ({formatXAF(budget.sourcesBreakdown.paidPayrollXAF)}) ·
              Frais Saisis ({formatXAF(budget.sourcesBreakdown.manualExpensesPaidOrApprovedXAF)})
            </p>
          </div>
          {projectFilter === 'ALL' && canApproveOrPay && (
            <span className="text-[11px] text-slate-400 shrink-0">
              Sélectionnez un chantier précis ci-dessous pour ajuster ses enveloppes
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Poste Budgétaire</th>
                <th className="py-3 px-4 text-right">Enveloppe Prévue</th>
                <th className="py-3 px-4 text-right">Consommé Tracé</th>
                <th className="py-3 px-4 text-right">Écart / Disponible</th>
                <th className="py-3 px-4 text-right">Exécution</th>
                <th className="py-3 px-4 text-right">Ajustement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {budget.categoryRows.map((row) => (
                <tr key={row.category} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">{row.categoryLabel}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                    {formatXAF(row.allocatedXAF)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-orange-400 font-semibold">
                    {formatXAF(row.spentXAF)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      row.remainingXAF < 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatXAF(row.remainingXAF)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                    <span
                      className={
                        row.rate >= 100
                          ? 'text-red-400'
                          : row.rate >= 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }
                    >
                      {row.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.lineId && canApproveOrPay ? (
                      <button
                        onClick={() => {
                          setEditingBudgetLine(row);
                          setNewAllocatedXAF(String(row.allocatedXAF));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ajuster</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtres Journal des Dépenses */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher réf, libellé, bénéficiaire..."
              className="pl-8 pr-3 py-1.5 w-60 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tous les chantiers</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">Tous les postes</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'PENDING', label: 'En attente' },
            { id: 'APPROVED', label: 'Bon à payer' },
            { id: 'PAID', label: 'Payées' },
            { id: 'REJECTED', label: 'Refusées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau Journal des Dépenses */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Référence & Date</th>
                <th className="py-3 px-4">Libellé & Bénéficiaire</th>
                <th className="py-3 px-4">Chantier & Poste</th>
                <th className="py-3 px-4 text-right">Montant (FCFA)</th>
                <th className="py-3 px-4">Règlement & Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Chargement du journal des dépenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center space-y-2">
                    <p className="text-slate-300 font-medium">
                      Aucune dépense trouvée pour ces critères.
                    </p>
                    {canCreateExpense && (
                      <button
                        onClick={openCreateModal}
                        className="px-3.5 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Saisir la première dépense
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const st = STATUS_META[exp.status];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <span className="font-mono font-bold text-white block">
                          {exp.reference}
                        </span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {exp.expenseDate}
                          {exp.invoiceRef ? ` · Pièce ${exp.invoiceRef}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className="font-semibold text-slate-200 block">{exp.title}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Bénéficiaire : {exp.beneficiary} · Saisi par {exp.recordedByName}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className="text-slate-200 font-medium block truncate max-w-[210px]">
                          {exp.projectCode} · {exp.projectName}
                        </span>
                        <span className="text-[11px] text-orange-400 block mt-0.5">
                          {exp.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top text-right font-mono font-bold text-white tabular-nums">
                        {formatXAF(exp.amountXAF)}
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className={`font-semibold block ${st.colorClass}`}>{st.label}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {PAYMENT_METHOD_LABELS[exp.paymentMethod]}
                          {exp.paymentReference ? ` · ${exp.paymentReference}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top text-right">
                        {canApproveOrPay ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {exp.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(exp)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-600/40 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approuver</span>
                                </button>
                                <button
                                  onClick={() => handleReject(exp)}
                                  className="px-2 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-700 text-red-300 hover:text-white border border-red-800/50 text-[11px] font-medium cursor-pointer"
                                  title="Refuser"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {(exp.status === 'PENDING' || exp.status === 'APPROVED') && (
                              <button
                                onClick={() => {
                                  setErrorMsg(null);
                                  setPayingExpense(exp);
                                  setPayMethod(exp.paymentMethod || 'ORANGE_MONEY');
                                  setPayRef('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-600/40 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>Décaisser</span>
                              </button>
                            )}
                            {exp.status === 'PAID' && (
                              <span className="text-[11px] text-emerald-400 font-medium">
                                Soldée
                              </span>
                            )}
                            {exp.status === 'REJECTED' && (
                              <span className="text-[11px] text-red-400 font-medium">Refusée</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Validation Comptable/DG</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : SAISIR UNE DÉPENSE CHANTIER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-400" />
                  <span>Enregistrer une Dépense Chantier</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saisissez manuellement le montant exact (FCFA) et rattachez la pièce justificative.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chantier concerné *
                  </label>
                  <select
                    required
                    value={expProjectId}
                    onChange={(e) => setExpProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Poste Budgétaire *
                  </label>
                  <select
                    required
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Objet / Libellé de la dépense *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="Ex: Location bétonnière 500L + 300L gasoil chantier Akwa"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bénéficiaire / Fournisseur *
                  </label>
                  <input
                    type="text"
                    required
                    value={expBeneficiary}
                    onChange={(e) => setExpBeneficiary(e.target.value)}
                    placeholder="Ex: Station Total Akwa / Sous-traitant"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Montant réel saisi manuellement (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expAmountXAF}
                    onChange={(e) => setExpAmountXAF(e.target.value)}
                    placeholder="Saisir le montant exact (ex: 150000)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-orange-500/60 text-xs font-mono font-bold text-orange-300 placeholder-slate-500 focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mode de règlement souhaité
                  </label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MTN_MOMO">MTN MoMo</option>
                    <option value="CASH">Espèces / Caisse</option>
                    <option value="BANK_TRANSFER">Virement / Chèque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    N° Facture / Reçu
                  </label>
                  <input
                    type="text"
                    value={expInvoiceRef}
                    onChange={(e) => setExpInvoiceRef(e.target.value)}
                    placeholder="Ex: FAC-2026-084"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Date de dépense *
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Notes justificatives
                </label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Précisions complémentaires pour la Direction Financière..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-orange-600/20 cursor-pointer"
              >
                {submitting ? 'Enregistrement...' : 'Soumettre pour validation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2 : DÉCAISSER / PAYER UNE DÉPENSE */}
      {payingExpense && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handlePayExpense}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span>Décaisser {payingExpense.reference}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayingExpense(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-slate-400">{payingExpense.title}</p>
                <p className="font-bold text-lg text-emerald-400 font-mono tabular-nums">
                  {formatXAF(payingExpense.amountXAF)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Bénéficiaire : {payingExpense.beneficiary}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Canal de paiement *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="MTN_MOMO">MTN MoMo</option>
                  <option value="CASH">Espèces / Caisse</option>
                  <option value="BANK_TRANSFER">Virement / Chèque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Référence transaction / reçu (optionnel)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Ex: OM-CM-992841 (généré si vide)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPayingExpense(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
              >
                {submitting ? 'Décaissement...' : 'Confirmer Paiement & Imputer Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3 : AJUSTER ENVELOPPE BUDGÉTAIRE */}
      {editingBudgetLine && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateBudgetLine}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white">
                Ajuster l’enveloppe budgétaire
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudgetLine(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-300">
                Poste : <strong>{editingBudgetLine.categoryLabel}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nouvelle enveloppe allouée (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newAllocatedXAF}
                  onChange={(e) => setNewAllocatedXAF(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-orange-500/60 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingBudgetLine(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white cursor-pointer"
              >
                Enregistrer l’enveloppe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
