import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../utils/permissions';
import {
  DeliveryNote,
  ExpenseRecord,
  PurchaseOrder,
  SupplierCategory,
  SupplierPaymentTerms,
  SupplierStatus,
  SupplierWithPerformance,
} from '../../types';
import {
  AlertOctagon,
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  Truck,
  X,
} from 'lucide-react';

interface SuppliersOverviewResponse {
  suppliers: SupplierWithPerformance[];
  summary: {
    totalSuppliers: number;
    preferredCount: number;
    underReviewOrBlacklistedCount: number;
    avgConformityPct: number;
    totalOrderedXAF: number;
    totalOutstandingXAF: number;
    activeDisputesCount: number;
  };
}

interface SupplierDossierResponse {
  supplier: SupplierWithPerformance;
  orders: PurchaseOrder[];
  deliveries: DeliveryNote[];
  expenses: ExpenseRecord[];
}

const CATEGORY_LABELS: Record<SupplierCategory, string> = {
  CIMENT_LIANTS: 'Ciments & Liants',
  ACIERS_FERRAILLAGE: 'Aciers & Ferraillage',
  AGREGATS_CARRIERE: 'Agrégats & Carrières',
  QUINCAILLERIE_MEP: 'Quincaillerie & MEP',
  BOIS_COFFRAGE: 'Bois & Coffrage',
  CARBURANT_ENGINS: 'Carburant & Engins',
  BETON_PREFA: 'Béton & Préfabriqués',
};

const PAYMENT_TERMS_LABELS: Record<SupplierPaymentTerms, string> = {
  CASH_ON_DELIVERY: 'Comptant livraison',
  ADVANCE_50: 'Acompte 50% / 50%',
  NET_15: 'Net 15 jours',
  NET_30: 'Net 30 jours',
  NET_45: 'Net 45 jours',
};

const STATUS_META: Record<
  SupplierStatus,
  { label: string; color: string; short: string }
> = {
  PREFERRED: { label: 'Agréé / Préféré', color: 'text-emerald-400', short: 'Agréé' },
  ACTIVE: { label: 'Actif Standard', color: 'text-sky-400', short: 'Actif' },
  UNDER_REVIEW: { label: 'Sous surveillance', color: 'text-amber-400', short: 'Surveillance' },
  BLACKLISTED: { label: 'Suspendu / Bloqué', color: 'text-red-400', short: 'Suspendu' },
};

export const SuppliersView: React.FC = () => {
  const { user, company } = useAuth();

  const [data, setData] = useState<SuppliersOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fiche 360° fournisseur sélectionné
  const [dossier, setDossier] = useState<SupplierDossierResponse | null>(null);
  const [loadingDossier, setLoadingDossier] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<'INFO' | 'ORDERS' | 'DELIVERIES'>('INFO');

  // Modale création fournisseur
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    category: 'CIMENT_LIANTS' as SupplierCategory,
    contactPerson: '',
    phone: '+237 6',
    email: '',
    city: 'Douala',
    address: '',
    niu: '',
    rccm: '',
    paymentTerms: 'NET_30' as SupplierPaymentTerms,
    specialties: '',
    rating: '4',
    notes: '',
  });

  const canRegisterSupplier =
    user?.role &&
    ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);
  const canGovernStatus = user?.role === 'DIRECTOR' || user?.role === 'SUPER_ADMIN';

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const fetchSuppliers = async () => {
    if (!company) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/suppliers?companyId=${encodeURIComponent(company.id)}`);
      if (!res.ok) throw new Error('Erreur lors du chargement de l’annuaire fournisseurs.');
      const json: SuppliersOverviewResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de charger les fournisseurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    setDossier(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const openDossier = async (supplierId: string) => {
    if (!company) return;
    setLoadingDossier(true);
    setDossierTab('INFO');
    try {
      const res = await fetch(
        `/api/suppliers/${encodeURIComponent(supplierId)}?companyId=${encodeURIComponent(company.id)}`
      );
      if (!res.ok) throw new Error('Impossible de charger le dossier fournisseur.');
      const json: SupplierDossierResponse = await res.json();
      setDossier(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          ...formState,
          rating: Number(formState.rating) || 4,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Création fournisseur impossible.');

      setShowCreateModal(false);
      setFormState({
        name: '',
        category: 'CIMENT_LIANTS',
        contactPerson: '',
        phone: '+237 6',
        email: '',
        city: 'Douala',
        address: '',
        niu: '',
        rccm: '',
        paymentTerms: 'NET_30',
        specialties: '',
        rating: '4',
        notes: '',
      });
      await fetchSuppliers();
      showToast(json.message);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (supplierId: string, nextStatus: SupplierStatus) => {
    if (!company || !user || !canGovernStatus) return;
    try {
      const res = await fetch(`/api/suppliers/${encodeURIComponent(supplierId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Modification du statut impossible.');
      await fetchSuppliers();
      if (dossier && dossier.supplier.id === supplierId) {
        await openDossier(supplierId);
      }
      showToast(json.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!data) return [];
    return data.suppliers.filter((sup) => {
      if (categoryFilter !== 'ALL' && sup.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && sup.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sup.name.toLowerCase().includes(q) ||
          sup.niu.toLowerCase().includes(q) ||
          sup.rccm.toLowerCase().includes(q) ||
          sup.city.toLowerCase().includes(q) ||
          sup.specialties.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, categoryFilter, statusFilter, searchQuery]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Module 10 (Étape 14) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="text-orange-400 font-semibold">Annuaire & Performance Fournisseurs BTP</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-medium">{company?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-orange-400 shrink-0" />
            <span>Fournisseurs BTP, Conformité & Encours FCFA</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Référencement fiscal Cameroun (NIU, RCCM), scoring qualité calculé sur vos Bons de Livraison et suivi des encours à payer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSuppliers}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canRegisterSupplier && (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Fournisseur</span>
            </button>
          )}
        </div>
      </div>

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

      {/* KPIs Performance Fournisseurs */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Fournisseurs Référencés</span>
                <Building className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2 tabular-nums">
                {data.summary.totalSuppliers}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 tabular-nums">
                {data.summary.preferredCount} agréé(s) · {data.summary.underReviewOrBlacklistedCount} sous vigilance
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Taux Conformité Livraisons</span>
                <PackageCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 tabular-nums">
                {data.summary.avgConformityPct} %
              </p>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {data.summary.activeDisputesCount} litige(s) BL détecté(s)
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Volume Achats Engagé TTC</span>
                <FileText className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2 tabular-nums">
                {formatFCFA(data.summary.totalOrderedXAF)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Cumul des Bons de Commande validés
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Encours Fournisseurs Estimé</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2 tabular-nums">
                {formatFCFA(data.summary.totalOutstandingXAF)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Commandes engagées moins règlements comptables
              </p>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher raison sociale, NIU, RCCM, ville..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Toutes catégories BTP</option>
                {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Tous statuts</option>
                <option value="PREFERRED">Agréés / Préférés</option>
                <option value="ACTIVE">Actifs Standard</option>
                <option value="UNDER_REVIEW">Sous surveillance</option>
                <option value="BLACKLISTED">Suspendus</option>
              </select>
            </div>
          </div>

          {/* Tableau principal Annuaire & Scoring */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">
                Répertoire & Indicateurs Qualité ({filteredSuppliers.length})
              </h2>
              <span className="text-xs text-slate-400">
                Cliquez sur une fiche pour ouvrir le dossier complet 360° & l’export PDF
              </span>
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Aucun fournisseur ne correspond à vos critères
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 pr-3 font-semibold">Fournisseur & NIU/RCCM</th>
                      <th className="py-2.5 px-3 font-semibold">Catégorie & Ville</th>
                      <th className="py-2.5 px-3 font-semibold">Contact & Délai</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Conformité BL</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Volume TTC</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Encours FCFA</th>
                      <th className="py-2.5 px-3 font-semibold">Statut</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredSuppliers.map((sup) => {
                      const stMeta = STATUS_META[sup.status];
                      return (
                        <tr
                          key={sup.id}
                          onClick={() => openDossier(sup.id)}
                          className="hover:bg-slate-950/70 cursor-pointer transition-colors"
                        >
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{sup.name}</span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-400 tabular-nums">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {sup.rating.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              NIU: {sup.niu} · {sup.rccm}
                            </p>
                          </td>

                          <td className="py-3 px-3">
                            <p className="text-slate-200 font-medium">
                              {CATEGORY_LABELS[sup.category]}
                            </p>
                            <p className="text-[11px] text-slate-400">{sup.city}</p>
                          </td>

                          <td className="py-3 px-3">
                            <p className="text-slate-200">{sup.contactPerson}</p>
                            <p className="text-[11px] text-slate-400 tabular-nums">
                              {sup.phone} · {PAYMENT_TERMS_LABELS[sup.paymentTerms]}
                            </p>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {sup.metrics.conformityRatePct === null ? (
                              <span className="font-semibold text-slate-400">Non évalué</span>
                            ) : (
                              <span
                                className={`font-extrabold tabular-nums ${
                                  sup.metrics.conformityRatePct >= 90
                                    ? 'text-emerald-400'
                                    : sup.metrics.conformityRatePct >= 70
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {sup.metrics.conformityRatePct} %
                              </span>
                            )}
                            <p className="text-[10px] text-slate-500 tabular-nums">
                              {sup.metrics.deliveriesCount} BL · {sup.metrics.disputeDeliveriesCount} litige(s)
                            </p>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-bold text-slate-200 tabular-nums">
                              {formatFCFA(sup.metrics.totalOrderedTTCXAF)}
                            </span>
                            <p className="text-[10px] text-slate-500 tabular-nums">
                              {sup.metrics.ordersCount} BC
                            </p>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-bold tabular-nums ${
                                sup.metrics.outstandingPayableXAF > 0
                                  ? 'text-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatFCFA(sup.metrics.outstandingPayableXAF)}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`font-bold ${stMeta.color}`}>{stMeta.short}</span>
                          </td>

                          <td
                            className="py-3 pl-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openDossier(sup.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                              >
                                Dossier
                              </button>
                              <a
                                href={`/api/suppliers/${sup.id}/pdf?companyId=${encodeURIComponent(
                                  company?.id || ''
                                )}`}
                                download={`fiche-fournisseur-${sup.id}.pdf`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400"
                                title="Exporter Fiche Évaluation PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Modale Dossier 360° Fournisseur */}
      {(dossier || loadingDossier) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            {loadingDossier && !dossier ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Chargement du dossier fournisseur...
              </div>
            ) : dossier ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-orange-400 font-bold">
                        {CATEGORY_LABELS[dossier.supplier.category]}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className={`font-bold ${STATUS_META[dossier.supplier.status].color}`}>
                        {STATUS_META[dossier.supplier.status].label}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">
                      {dossier.supplier.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      NIU : {dossier.supplier.niu} · RCCM : {dossier.supplier.rccm}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/suppliers/${dossier.supplier.id}/pdf?companyId=${encodeURIComponent(
                        company?.id || ''
                      )}`}
                      download={`fiche-fournisseur-${dossier.supplier.id}.pdf`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Fiche Évaluation PDF</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setDossier(null)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Métriques rapides du dossier */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400">Conformité BL</span>
                    <p
                      className={`text-lg font-black tabular-nums mt-0.5 ${
                        dossier.supplier.metrics.conformityRatePct === null
                          ? 'text-slate-400 text-sm pt-1'
                          : dossier.supplier.metrics.conformityRatePct >= 90
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {dossier.supplier.metrics.conformityRatePct === null
                        ? 'Non évalué (0 BL)'
                        : `${dossier.supplier.metrics.conformityRatePct} %`}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400">Litiges Réception</span>
                    <p className="text-lg font-black text-red-400 tabular-nums mt-0.5">
                      {dossier.supplier.metrics.disputeDeliveriesCount}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400">Total Commandé TTC</span>
                    <p className="text-base font-black text-white tabular-nums mt-0.5">
                      {formatFCFA(dossier.supplier.metrics.totalOrderedTTCXAF)}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[11px] text-slate-400">Encours à Payer</span>
                    <p className="text-base font-black text-amber-400 tabular-nums mt-0.5">
                      {formatFCFA(dossier.supplier.metrics.outstandingPayableXAF)}
                    </p>
                  </div>
                </div>

                {/* Onglets du dossier */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
                  {[
                    { id: 'INFO', label: 'Fiche & Gouvernance' },
                    { id: 'ORDERS', label: `Bons de Commande (${dossier.orders.length})` },
                    { id: 'DELIVERIES', label: `Livraisons & Litiges (${dossier.deliveries.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDossierTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        dossierTab === tab.id
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {dossierTab === 'INFO' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="space-y-2">
                        <p className="text-slate-400 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-orange-400" />
                          <span>
                            {dossier.supplier.contactPerson} ·{' '}
                            <strong className="text-slate-200">{dossier.supplier.phone}</strong>
                          </span>
                        </p>
                        <p className="text-slate-400 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-slate-200">
                            {dossier.supplier.email || 'Aucun email renseigné'}
                          </span>
                        </p>
                        <p className="text-slate-400 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-slate-200">
                            {dossier.supplier.address} ({dossier.supplier.city})
                          </span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-400">
                          Conditions :{' '}
                          <strong className="text-white">
                            {PAYMENT_TERMS_LABELS[dossier.supplier.paymentTerms]}
                          </strong>
                        </p>
                        <p className="text-slate-400">
                          Spécialités :{' '}
                          <span className="text-slate-200">{dossier.supplier.specialties}</span>
                        </p>
                        {dossier.supplier.notes && (
                          <p className="text-amber-200/90 bg-amber-950/30 border border-amber-800/50 rounded-lg p-2">
                            {dossier.supplier.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {canGovernStatus && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                        <p className="font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-orange-400" />
                          <span>Décision Direction : Agrément & Statut Fournisseur</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { id: 'PREFERRED', label: 'Agréer / Préféré', Icon: CheckCircle2 },
                              { id: 'ACTIVE', label: 'Actif Standard', Icon: Check },
                              { id: 'UNDER_REVIEW', label: 'Placer sous surveillance', Icon: ShieldAlert },
                              { id: 'BLACKLISTED', label: 'Suspendre / Blacklister', Icon: AlertOctagon },
                            ] as const
                          ).map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              type="button"
                              disabled={dossier.supplier.status === id}
                              onClick={() => handleChangeStatus(dossier.supplier.id, id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors disabled:opacity-40 ${
                                dossier.supplier.status === id
                                  ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {dossierTab === 'ORDERS' && (
                  <div className="space-y-2">
                    {dossier.orders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        Aucun bon de commande rattaché à ce fournisseur.
                      </p>
                    ) : (
                      dossier.orders.map((po) => (
                        <div
                          key={po.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white font-mono">
                              {po.orderNumber} · {po.projectName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Demandé par {po.requestedByName} · Livraison prévue{' '}
                              {formatDate(po.expectedDeliveryDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-orange-400 tabular-nums">
                              {formatFCFA(po.totalAmountXAF)}
                            </p>
                            <p className="text-[10px] text-slate-400">{po.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {dossierTab === 'DELIVERIES' && (
                  <div className="space-y-2">
                    {dossier.deliveries.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        Aucun bon de livraison enregistré pour ce fournisseur.
                      </p>
                    ) : (
                      dossier.deliveries.map((dn) => (
                        <div
                          key={dn.id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white font-mono">
                              {dn.deliveryNumber} (BL Fournisseur : {dn.supplierBlReference})
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {dn.projectName} · Reçu le {formatDate(dn.deliveryDate)} par{' '}
                              {dn.receivedByName}
                            </p>
                            {dn.observations && (
                              <p className="text-[11px] text-amber-300 mt-1">{dn.observations}</p>
                            )}
                          </div>
                          <span
                            className={`font-bold text-[11px] ${
                              dn.status === 'DISPUTED' ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {dn.status === 'DISPUTED' ? 'LITIGE' : 'CONFORME'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Modale Création Fournisseur */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Référencer un Nouveau Fournisseur BTP
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Raison Sociale *
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="Ex: QUIFEROU Cameroun SA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catégorie BTP *</label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value as SupplierCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Délai Règlement *
                  </label>
                  <select
                    value={formState.paymentTerms}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        paymentTerms: e.target.value as SupplierPaymentTerms,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {Object.entries(PAYMENT_TERMS_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">NIU Fiscal *</label>
                  <input
                    type="text"
                    required
                    value={formState.niu}
                    onChange={(e) => setFormState({ ...formState, niu: e.target.value })}
                    placeholder="Ex: M091400048210K"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">N° RCCM</label>
                  <input
                    type="text"
                    value={formState.rccm}
                    onChange={(e) => setFormState({ ...formState, rccm: e.target.value })}
                    placeholder="Ex: RC/DLA/2014/B/901"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Interlocuteur Commercial
                  </label>
                  <input
                    type="text"
                    value={formState.contactPerson}
                    onChange={(e) => setFormState({ ...formState, contactPerson: e.target.value })}
                    placeholder="Ex: Michel Fotso"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="+237 699 00 11 22"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="commandes@fournisseur.cm"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Spécialités & Matériaux fournis
                </label>
                <input
                  type="text"
                  value={formState.specialties}
                  onChange={(e) => setFormState({ ...formState, specialties: e.target.value })}
                  placeholder="Ex: Ciment, fers torsadés HA, étanchéité, menuiserie alu"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer le fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
