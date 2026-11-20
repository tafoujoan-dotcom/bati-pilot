import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../utils/permissions';
import {
  BillingCycle,
  Company,
  PaymentGatewayStatus,
  PaymentMethod,
  PaymentTransaction,
  SaaSInvoice,
  SaaSPlanCatalog,
} from '../../types';
import {
  AlertOctagon,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  Lock,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

interface TenantBillingRow {
  company: Company;
  activeProjectsCount: number;
  activeUsersCount: number;
  mrrContributionXAF: number;
  lastInvoice: SaaSInvoice | null;
}

interface SubscriptionOverviewResponse {
  company: Company;
  usage: {
    activeProjectsCount: number;
    maxProjects: number;
    activeUsersCount: number;
    maxUsers: number;
    activeWorkersCount: number;
  };
  currentPlanSpec: SaaSPlanCatalog;
  plans: SaaSPlanCatalog[];
  invoices: SaaSInvoice[];
  transactions: PaymentTransaction[];
  paymentGateway: PaymentGatewayStatus;
  platformSummary: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    mrrXAF: number;
    arrXAF: number;
    collectedThisYearXAF: number;
    pendingCollectionXAF: number;
    tenants: TenantBillingRow[];
    allInvoices: SaaSInvoice[];
  } | null;
}

export const SubscriptionsView: React.FC = () => {
  const { user, company, refreshCompany } = useAuth();

  const [overview, setOverview] = useState<SubscriptionOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal paiement réel / virement / confirmation bancaire
  const [checkoutModal, setCheckoutModal] = useState<{
    mode: 'PLAN_CHANGE' | 'PAY_INVOICE' | 'CONFIRM_BANK';
    targetPlan?: SaaSPlanCatalog;
    invoice?: SaaSInvoice;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ORANGE_MONEY');
  const [phoneNumber, setPhoneNumber] = useState<string>('699451280');
  const [bankReference, setBankReference] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [gatewayMissingInfo, setGatewayMissingInfo] = useState<boolean>(false);

  // Transaction réelle en attente de confirmation opérateur (CamPay / CinetPay)
  const [activeTx, setActiveTx] = useState<PaymentTransaction | null>(null);
  const [checkingTx, setCheckingTx] = useState<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canManageBilling =
    user?.role && ['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const fetchOverview = async () => {
    if (!company || !user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/subscriptions/overview?companyId=${encodeURIComponent(company.id)}&userRole=${encodeURIComponent(user.role)}`
      );
      if (!res.ok) throw new Error('Erreur lors du chargement des abonnements SaaS.');
      const data: SubscriptionOverviewResponse = await res.json();
      setOverview(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de charger les données de facturation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, user?.role]);

  const checkTransactionStatus = async (txId: string) => {
    if (!company) return;
    setCheckingTx(true);
    try {
      const res = await fetch(`/api/subscriptions/payments/${encodeURIComponent(txId)}/status`);
      const json = await res.json();
      if (json.transaction) {
        setActiveTx(json.transaction);
      }
      if (json.status === 'SUCCESSFUL') {
        stopPolling();
        if (json.company && json.company.id === company.id) {
          refreshCompany(json.company);
        }
        setCheckoutModal(null);
        setActiveTx(null);
        await fetchOverview();
        showToast(json.message || 'Paiement réel confirmé et facture acquittée.');
      } else if (json.status === 'FAILED') {
        stopPolling();
        setModalError(json.message || 'Paiement refusé ou annulé par l’opérateur.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Impossible de vérifier le statut auprès de la passerelle.');
    } finally {
      setCheckingTx(false);
    }
  };

  const startPollingTransaction = (txId: string) => {
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      checkTransactionStatus(txId);
    }, 3500);
  };

  const closeModal = () => {
    stopPolling();
    setCheckoutModal(null);
    setActiveTx(null);
    setModalError(null);
    setGatewayMissingInfo(false);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal || !company || !user) return;
    setSubmitting(true);
    setModalError(null);
    setGatewayMissingInfo(false);

    try {
      if (checkoutModal.mode === 'CONFIRM_BANK' && checkoutModal.invoice) {
        const res = await fetch(
          `/api/subscriptions/invoices/${checkoutModal.invoice.id}/confirm-bank-transfer`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userRole: user.role,
              bankReference: bankReference.trim(),
              adminName: `${user.firstName} ${user.lastName}`,
            }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Confirmation bancaire refusée.');
        if (json.company && json.company.id === company.id) {
          refreshCompany(json.company);
        }
        closeModal();
        await fetchOverview();
        showToast(json.message);
        return;
      }

      const res = await fetch('/api/subscriptions/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          initiatorName: `${user.firstName} ${user.lastName}`,
          targetPlan: checkoutModal.targetPlan?.id,
          invoiceId: checkoutModal.invoice?.id,
          billingCycle,
          paymentMethod,
          phoneNumber: phoneNumber.trim(),
        }),
      });
      const json = await res.json();

      if (res.status === 503 && json.gatewayConfigured === false) {
        setGatewayMissingInfo(true);
        setModalError(json.error);
        await fetchOverview();
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || 'Impossible d’initier le paiement réel.');
      }

      if (json.mode === 'BANK_TRANSFER_PENDING') {
        closeModal();
        await fetchOverview();
        showToast(json.message);
        return;
      }

      if (json.mode === 'GATEWAY_PENDING' && json.transaction) {
        setActiveTx(json.transaction);
        startPollingTransaction(json.transaction.id);
      }
    } catch (err: any) {
      setModalError(err.message || 'Erreur lors du traitement du paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateRenewal = async () => {
    if (!company || !user || !canManageBilling) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/subscriptions/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          billingCycle,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Impossible de générer la facture.');
      await fetchOverview();
      showToast(json.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de génération.');
    }
  };

  const handleToggleTenantStatus = async (tenant: Company) => {
    if (!user || !isSuperAdmin) return;
    const nextStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/subscriptions/tenants/${tenant.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: user.role,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur de mise à jour du tenant.');
      if (json.company && company && json.company.id === company.id) {
        refreshCompany(json.company);
      }
      await fetchOverview();
      showToast(json.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la modification du statut tenant.');
    }
  };

  const displayedInvoices = useMemo(() => {
    if (!overview) return [];
    const list =
      isSuperAdmin && overview.platformSummary
        ? overview.platformSummary.allInvoices
        : overview.invoices;

    return list.filter((inv) => {
      if (invoiceStatusFilter === 'PAID' && inv.status !== 'PAID') return false;
      if (invoiceStatusFilter === 'PENDING' && inv.status === 'PAID') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.companyName.toLowerCase().includes(q) ||
          inv.plan.toLowerCase().includes(q) ||
          (inv.paymentReference || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [overview, isSuperAdmin, invoiceStatusFilter, searchQuery]);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const getMethodLabel = (m?: PaymentMethod) => {
    switch (m) {
      case 'ORANGE_MONEY':
        return 'Orange Money';
      case 'MTN_MOMO':
        return 'MTN MoMo';
      case 'BANK_TRANSFER':
        return 'Virement bancaire';
      case 'CASH':
        return 'Espèces / Agence';
      default:
        return 'Non réglé';
    }
  };

  const getQuotaPct = (used: number, max: number) => {
    if (max >= 999) return Math.min(100, Math.max(8, used * 5));
    return Math.min(100, Math.round((used / Math.max(1, max)) * 100));
  };

  const activeCompany = overview?.company || company;
  const gw = overview?.paymentGateway;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Module 14 (Étape 18 / 18) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="text-orange-400 font-semibold">Abonnements SaaS & Facturation Entreprise</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-medium">{activeCompany?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-orange-400 shrink-0" />
            <span>Abonnements SaaS, Quotas & Paiement Réel FCFA</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Réglez vos licences BTP par vrai débit Mobile Money (CamPay / CinetPay) ou Virement Bancaire et téléchargez vos factures certifiées TVA 19,25 %.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                billingCycle === 'ANNUAL'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annuel (-2 mois)
            </button>
          </div>

          {canManageBilling && (
            <button
              type="button"
              onClick={handleGenerateRenewal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>Émettre Facture Proforma</span>
            </button>
          )}
        </div>
      </div>

      {/* Statut réel de la passerelle de paiement serveur */}
      {gw && (
        <div
          className={`rounded-xl px-4 py-3 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            gw.configured
              ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200'
              : 'bg-slate-900 border-amber-700/60 text-amber-100'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <Smartphone
              className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${
                gw.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div>
              {gw.configured ? (
                <span>
                  <strong>Passerelle de paiement réelle active :</strong> {gw.activeProvider} ({gw.supportedMethods.join(' · ')}). Aucun faux paiement simulé.
                </span>
              ) : (
                <span>
                  <strong>Mode encaissement réel strict (zéro simulation) :</strong> aucune clé marchande CamPay (`CAMPAY_TOKEN`) ou CinetPay (`CINETPAY_API_KEY` + `CINETPAY_SITE_ID`) n’est configurée sur le serveur. Les paiements par <strong>Virement Bancaire</strong> restent disponibles en attente de validation bancaire.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedbacks */}
      {successMsg && (
        <div className="bg-emerald-950/60 border border-emerald-700/70 text-emerald-200 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/60 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!canManageBilling && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Consultation en lecture seule : seuls le <strong>Directeur Général</strong>, le <strong>Comptable</strong> ou le <strong>Super Administrateur</strong> peuvent initier un paiement SaaS.
          </span>
        </div>
      )}

      {loading && !overview ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : overview ? (
        <>
          {/* KPI Super Admin Multi-Tenant */}
          {isSuperAdmin && overview.platformSummary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Console Revenus SaaS & Multi-Tenant (Super Administrateur)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Suivi consolidé des abonnements de toutes les entreprises BTP clientes
                  </p>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  {overview.platformSummary.totalTenants} entreprises · {overview.platformSummary.activeTenants} actives · {overview.platformSummary.trialTenants} essai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400">MRR Mensuel Récurrent</span>
                  <p className="text-xl font-black text-emerald-400 mt-1 tabular-nums">
                    {formatFCFA(overview.platformSummary.mrrXAF)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Hors taxes · Tenants actifs</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400">ARR Annualisé Projeté</span>
                  <p className="text-xl font-black text-white mt-1 tabular-nums">
                    {formatFCFA(overview.platformSummary.arrXAF)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Sur 12 mois glissants</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400">Total Factures Encaissées</span>
                  <p className="text-xl font-black text-sky-400 mt-1 tabular-nums">
                    {formatFCFA(overview.platformSummary.collectedThisYearXAF)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">TTC vérifié opérateur / banque</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-xs text-slate-400">Reste à Encaisser</span>
                  <p className="text-xl font-black text-amber-400 mt-1 tabular-nums">
                    {formatFCFA(overview.platformSummary.pendingCollectionXAF)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Factures en attente de règlement</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 pr-4 font-semibold">Entreprise Cliente (Tenant)</th>
                      <th className="py-2.5 px-3 font-semibold">Forfait</th>
                      <th className="py-2.5 px-3 font-semibold">Statut</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Chantiers</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Utilisateurs</th>
                      <th className="py-2.5 px-3 font-semibold text-right">MRR</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Action Plateforme</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {overview.platformSummary.tenants.map((t) => (
                      <tr key={t.company.id} className="hover:bg-slate-950/60">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-200">{t.company.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {t.company.city} · {t.company.email}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-semibold text-orange-400">{t.company.plan}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              t.company.status === 'ACTIVE'
                                ? 'text-emerald-400'
                                : t.company.status === 'TRIAL'
                                ? 'text-amber-300'
                                : 'text-red-400'
                            }`}
                          >
                            {t.company.status === 'ACTIVE'
                              ? 'Actif'
                              : t.company.status === 'TRIAL'
                              ? 'Essai 14j'
                              : 'Suspendu'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-200">
                          {t.activeProjectsCount} /{' '}
                          {t.company.maxProjects >= 999 ? '∞' : t.company.maxProjects}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-200">
                          {t.activeUsersCount} /{' '}
                          {t.company.maxUsers >= 999 ? '∞' : t.company.maxUsers}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-200">
                          {formatFCFA(t.mrrContributionXAF)}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleTenantStatus(t.company)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                              t.company.status === 'SUSPENDED'
                                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                                : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-red-700 hover:text-red-300'
                            }`}
                          >
                            {t.company.status === 'SUSPENDED' ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Réactiver</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>Suspendre</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(() => {
                const pendingBankInvoices = overview.platformSummary.allInvoices.filter(
                  (inv) => inv.status !== 'PAID'
                );
                if (pendingBankInvoices.length === 0) return null;
                return (
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        <span>
                          Virements & Factures en attente de rapprochement bancaire ({pendingBankInvoices.length})
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Contrôle Super Admin avant activation de licence
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {pendingBankInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {inv.invoiceNumber} · {inv.companyName}
                            </p>
                            <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                              {inv.plan} · <strong className="text-orange-400">{formatFCFA(inv.amountTTCXAF)}</strong> TTC · {getMethodLabel(inv.paymentMethod)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBankReference('');
                              setModalError(null);
                              setCheckoutModal({ mode: 'CONFIRM_BANK', invoice: inv });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Valider virement
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section 1 : Résumé Licence Actuelle & Jauge Quotas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Formule Active · {overview.company.city}</span>
                  <Building2 className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2">
                  {overview.currentPlanSpec.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Statut :{' '}
                  <strong
                    className={
                      overview.company.status === 'ACTIVE'
                        ? 'text-emerald-400'
                        : overview.company.status === 'TRIAL'
                        ? 'text-amber-300'
                        : 'text-red-400'
                    }
                  >
                    {overview.company.status === 'ACTIVE'
                      ? 'Licence Active'
                      : overview.company.status === 'TRIAL'
                      ? 'Période d’essai 14 jours'
                      : 'Compte Suspendu'}
                  </strong>
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-4 tabular-nums">
                Tarif :{' '}
                <strong className="text-orange-400">
                  {formatFCFA(
                    billingCycle === 'ANNUAL'
                      ? overview.currentPlanSpec.annualPriceXAF
                      : overview.currentPlanSpec.monthlyPriceXAF
                  )}
                </strong>{' '}
                HT / {billingCycle === 'ANNUAL' ? 'an' : 'mois'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Quota Chantiers Actifs</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2 tabular-nums">
                  {overview.usage.activeProjectsCount} /{' '}
                  {overview.usage.maxProjects >= 999 ? 'Illimité' : overview.usage.maxProjects}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Chantiers en préparation ou en cours d’exécution
                </p>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all"
                    style={{
                      width: `${getQuotaPct(
                        overview.usage.activeProjectsCount,
                        overview.usage.maxProjects
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {overview.usage.maxProjects >= 999
                    ? 'Capacité illimitée sur ce forfait'
                    : `${Math.max(
                        0,
                        overview.usage.maxProjects - overview.usage.activeProjectsCount
                      )} chantier(s) disponible(s)`}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Quota Utilisateurs & Effectif</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2 tabular-nums">
                  {overview.usage.activeUsersCount} /{' '}
                  {overview.usage.maxUsers >= 999 ? 'Illimité' : overview.usage.maxUsers}
                </p>
                <p className="text-xs text-slate-400 mt-1 tabular-nums">
                  Comptes actifs · {overview.usage.activeWorkersCount} ouvriers sur chantiers
                </p>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${getQuotaPct(
                        overview.usage.activeUsersCount,
                        overview.usage.maxUsers
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 tabular-nums">
                  {overview.usage.maxUsers >= 999
                    ? 'Comptes utilisateurs illimités'
                    : `${Math.max(
                        0,
                        overview.usage.maxUsers - overview.usage.activeUsersCount
                      )} siège(s) utilisateur restant(s)`}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 : Grille des 3 Formules Commerciales */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-white">
                Formules Commerciales BATI-PILOT (Hors Taxes · TVA Cameroun 19,25 %)
              </h2>
              <span className="text-xs text-slate-400">
                Débit réel vérifié opérateur (CamPay / CinetPay) ou Virement Bancaire
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {overview.plans.map((plan) => {
                const isCurrent = overview.company.plan === plan.id;
                const priceHT =
                  billingCycle === 'ANNUAL' ? plan.annualPriceXAF : plan.monthlyPriceXAF;
                const priceTTC = Math.round(priceHT * 1.1925);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-colors ${
                      isCurrent
                        ? 'bg-slate-900 border-orange-500/70'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-orange-400">
                            {plan.id}
                            {plan.recommended ? ' · Recommandé PME' : ''}
                          </p>
                          <h3 className="text-lg font-extrabold text-white mt-0.5">{plan.name}</h3>
                        </div>
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                            Forfait actuel
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                        {plan.targetAudience}
                      </p>

                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white tabular-nums">
                            {formatFCFA(priceHT)}
                          </span>
                          <span className="text-xs text-slate-400">
                            HT / {billingCycle === 'ANNUAL' ? 'an' : 'mois'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          Soit {formatFCFA(priceTTC)} TTC (TVA 19,25 % incluse)
                        </p>
                      </div>

                      <ul className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5">
                      <button
                        type="button"
                        disabled={!canManageBilling}
                        onClick={() => {
                          setPaymentMethod('ORANGE_MONEY');
                          setModalError(null);
                          setGatewayMissingInfo(false);
                          setActiveTx(null);
                          setCheckoutModal({ mode: 'PLAN_CHANGE', targetPlan: plan });
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isCurrent
                            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm'
                        }`}
                      >
                        {isCurrent
                          ? overview.company.status === 'TRIAL'
                            ? 'Activer par paiement réel'
                            : 'Renouveler ce forfait'
                          : `Souscrire au forfait ${plan.id}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3 : Historique des Factures SaaS & Export PDF */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>
                    {isSuperAdmin
                      ? 'Registre Global des Factures SaaS (Multi-Tenant)'
                      : 'Historique des Factures & Reçus SaaS'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Factures PDF A4 officielles (HT, TVA 19,25 %, Total TTC FCFA)
                  {!isSuperAdmin && (
                    <span className="text-slate-500">
                      {' '}
                      · Le bouton <strong>Valider virement</strong> apparaît uniquement en profil <strong>Super Admin</strong> (sélecteur en haut à droite).
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher N°, entreprise..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  {[
                    { id: 'ALL', label: 'Toutes' },
                    { id: 'PAID', label: 'Payées' },
                    { id: 'PENDING', label: 'En attente' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInvoiceStatusFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        invoiceStatusFilter === tab.id
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={fetchOverview}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="Actualiser"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {displayedInvoices.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                <FileText className="w-7 h-7 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Aucune facture trouvée pour ce filtre
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 pr-3 font-semibold">N° Facture</th>
                      {isSuperAdmin && <th className="py-2.5 px-3 font-semibold">Entreprise</th>}
                      <th className="py-2.5 px-3 font-semibold">Formule & Période</th>
                      <th className="py-2.5 px-3 font-semibold">Émission</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Total TTC</th>
                      <th className="py-2.5 px-3 font-semibold">Règlement</th>
                      <th className="py-2.5 px-3 font-semibold">Statut</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {displayedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-950/60">
                        <td className="py-3 pr-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                            {inv.companyName}
                          </td>
                        )}
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-200">{inv.plan}</p>
                          <p className="text-[11px] text-slate-400">{inv.periodLabel}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                          {formatDate(inv.issuedAt)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                          {formatFCFA(inv.amountTTCXAF)}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-slate-300">{getMethodLabel(inv.paymentMethod)}</p>
                          {inv.paymentReference && (
                            <p className="text-[10px] font-mono text-slate-500">
                              {inv.paymentReference}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              inv.status === 'PAID'
                                ? 'text-emerald-400'
                                : inv.status === 'OVERDUE'
                                ? 'text-red-400'
                                : 'text-amber-300'
                            }`}
                          >
                            {inv.status === 'PAID'
                              ? 'Payée'
                              : inv.status === 'OVERDUE'
                              ? 'En retard'
                              : 'En attente'}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {inv.status !== 'PAID' && canManageBilling && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentMethod('ORANGE_MONEY');
                                  setModalError(null);
                                  setGatewayMissingInfo(false);
                                  setActiveTx(null);
                                  setCheckoutModal({ mode: 'PAY_INVOICE', invoice: inv });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Payer
                              </button>
                            )}
                            {inv.status !== 'PAID' && isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBankReference('');
                                  setModalError(null);
                                  setCheckoutModal({ mode: 'CONFIRM_BANK', invoice: inv });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Valider virement
                              </button>
                            )}
                            <a
                              href={`/api/subscriptions/invoices/${inv.id}/pdf`}
                              download={`${inv.invoiceNumber}.pdf`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold whitespace-nowrap shrink-0"
                              title="Télécharger la facture PDF"
                            >
                              <Download className="w-3 h-3 text-orange-400" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Modal Paiement Réel / Confirmation Bancaire */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {checkoutModal.mode === 'CONFIRM_BANK'
                  ? `Confirmer virement ${checkoutModal.invoice?.invoiceNumber}`
                  : checkoutModal.mode === 'PLAN_CHANGE'
                  ? `Paiement réel — ${checkoutModal.targetPlan?.name}`
                  : `Payer la facture ${checkoutModal.invoice?.invoiceNumber}`}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeTx ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950 border border-orange-500/40 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-400">
                      Transaction en attente ({activeTx.provider})
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{activeTx.id}</span>
                  </div>
                  <p className="text-slate-200 font-bold text-base tabular-nums">
                    {formatFCFA(activeTx.amountXAF)} TTC
                  </p>
                  {activeTx.provider === 'CAMPAY' ? (
                    <div className="space-y-1 text-slate-300">
                      <p>
                        Une demande de débit réel a été envoyée au numéro{' '}
                        <strong className="text-white">{activeTx.phoneNumber}</strong>.
                      </p>
                      <p>
                        Confirmez avec votre code secret sur votre téléphone
                        {activeTx.ussdCode ? (
                          <>
                            {' '}
                            (ou composez <strong className="text-orange-400">{activeTx.ussdCode}</strong>)
                          </>
                        ) : null}
                        .
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-300">
                      <p>
                        Ouvrez le guichet sécurisé CinetPay pour finaliser votre paiement par Orange Money, MTN MoMo ou Carte Visa/Mastercard :
                      </p>
                      {activeTx.paymentUrl && (
                        <a
                          href={activeTx.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Payer sur CinetPay maintenant</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {modalError && (
                  <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200">
                    {modalError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    disabled={checkingTx}
                    onClick={() => checkTransactionStatus(activeTx.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingTx ? 'animate-spin' : ''}`} />
                    <span>Vérifier la confirmation</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                {(() => {
                  const amountHT =
                    checkoutModal.mode === 'PLAN_CHANGE' && checkoutModal.targetPlan
                      ? billingCycle === 'ANNUAL'
                        ? checkoutModal.targetPlan.annualPriceXAF
                        : checkoutModal.targetPlan.monthlyPriceXAF
                      : checkoutModal.invoice?.amountHTXAF || 0;
                  const tva =
                    checkoutModal.mode === 'PLAN_CHANGE'
                      ? Math.round(amountHT * 0.1925)
                      : checkoutModal.invoice?.tvaXAF || 0;
                  const ttc =
                    checkoutModal.mode === 'PLAN_CHANGE'
                      ? amountHT + tva
                      : checkoutModal.invoice?.amountTTCXAF || 0;

                  return (
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Montant Hors Taxes</span>
                        <span className="tabular-nums text-slate-200">{formatFCFA(amountHT)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>TVA Cameroun (19,25 %)</span>
                        <span className="tabular-nums text-slate-200">{formatFCFA(tva)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800 font-extrabold text-sm">
                        <span className="text-white">Net à payer (TTC)</span>
                        <span className="text-orange-400 tabular-nums">{formatFCFA(ttc)}</span>
                      </div>
                    </div>
                  );
                })()}

                {checkoutModal.mode === 'CONFIRM_BANK' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Référence exacte du bordereau bancaire reçu *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      placeholder="Ex: VIR-SGC-2026-88412"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Canal de règlement *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'ORANGE_MONEY', label: 'Orange Money' },
                          { id: 'MTN_MOMO', label: 'MTN MoMo' },
                          { id: 'BANK_TRANSFER', label: 'Virement' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(m.id as PaymentMethod);
                              setModalError(null);
                              setGatewayMissingInfo(false);
                            }}
                            className={`py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                              paymentMethod === m.id
                                ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === 'BANK_TRANSFER' ? (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300 space-y-1">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-sky-400" />
                          <span>Virement Bancaire Proforma</span>
                        </p>
                        <p>
                          Une facture <strong>En attente</strong> sera émise avec PDF téléchargeable. La licence sera activée dès confirmation de réception sur le compte bancaire par l’administrateur.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Numéro Mobile Money Cameroun (+237) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Ex: 699451280 ou 237677301944"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 tabular-nums focus:outline-none focus:border-orange-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Vous recevrez une demande USSD de confirmation PIN directement sur ce numéro.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {modalError && (
                  <div className="rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-200 space-y-1.5">
                    <p className="font-semibold">{modalError}</p>
                    {gatewayMissingInfo && (
                      <p className="text-[11px] text-amber-200">
                        La facture a été créée au statut <strong>En attente</strong> dans votre historique. Dès que vos clés marchandes CamPay ou CinetPay seront ajoutées dans les secrets serveur, le bouton Payer déclenchera le vrai débit.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    {submitting
                      ? 'Traitement...'
                      : checkoutModal.mode === 'CONFIRM_BANK'
                      ? 'Valider l’encaissement'
                      : paymentMethod === 'BANK_TRANSFER'
                      ? 'Émettre Facture Proforma'
                      : 'Lancer le paiement réel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
