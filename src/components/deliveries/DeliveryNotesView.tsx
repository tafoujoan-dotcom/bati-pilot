import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DeliveryDestination,
  DeliveryNote,
  DeliveryStatus,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../../types';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  FileText,
  Eye,
  X,
  Warehouse,
  Building2,
  RefreshCw,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface EligibleOrderItem extends PurchaseOrderItem {
  alreadyDeliveredQuantity: number;
  remainingQuantity: number;
}

interface EligiblePurchaseOrder extends Omit<PurchaseOrder, 'items'> {
  items: EligibleOrderItem[];
  totalRemainingUnits: number;
}

interface DeliverySummary {
  totalDeliveries: number;
  completedCount: number;
  partialCount: number;
  disputedCount: number;
  pendingOrdersToReceive: number;
  totalReceivedValueXAF: number;
}

interface ReceptionLineDraft {
  purchaseOrderItemId: string;
  designation: string;
  unit: string;
  orderedQuantity: number;
  alreadyDeliveredQuantity: number;
  remainingQuantity: number;
  unitPriceXAF: number;
  deliveredQuantity: string;
  damagedOrRejectedQuantity: string;
  conformityNote: string;
}

const STATUS_META: Record<DeliveryStatus, { label: string; badgeClass: string }> = {
  COMPLETED: {
    label: 'Réception complète',
    badgeClass: 'text-emerald-400',
  },
  PARTIAL: {
    label: 'Réception partielle',
    badgeClass: 'text-amber-400',
  },
  DISPUTED: {
    label: 'Litige / Réserves',
    badgeClass: 'text-red-400',
  },
};

export const DeliveryNotesView: React.FC = () => {
  const { company, user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<EligiblePurchaseOrder[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [summary, setSummary] = useState<DeliverySummary>({
    totalDeliveries: 0,
    completedCount: 0,
    partialCount: 0,
    disputedCount: 0,
    pendingOrdersToReceive: 0,
    totalReceivedValueXAF: 0,
  });

  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canReceiveDelivery =
    user?.role === 'STOREKEEPER' ||
    user?.role === 'SITE_MANAGER' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'SUPER_ADMIN';

  // Modal Enregistrement Réception BL
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [supplierBlRef, setSupplierBlRef] = useState('');
  const [destination, setDestination] = useState<DeliveryDestination>('DEPOT');
  const [driverName, setDriverName] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [lineDrafts, setLineDrafts] = useState<ReceptionLineDraft[]>([]);

  // Modal Détails & Clôture litige
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryNote | null>(null);
  const [resolvingDelivery, setResolvingDelivery] = useState<DeliveryNote | null>(null);
  const [resolvedNote, setResolvedNote] = useState('');

  const fetchOverview = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/deliveries/overview?companyId=${encodeURIComponent(company.id)}&projectId=${encodeURIComponent(projectFilter)}&status=${encodeURIComponent(statusFilter)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        setEligibleOrders(data.eligibleOrders || []);
        setProjects(data.projects || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Erreur chargement bons de livraison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, projectFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const formatXAF = (val: number) => `${Math.round(val).toLocaleString('fr-FR')} FCFA`;

  const initLinesFromOrder = (order: EligiblePurchaseOrder | undefined) => {
    if (!order) {
      setLineDrafts([]);
      return;
    }
    setLineDrafts(
      order.items.map((it) => ({
        purchaseOrderItemId: it.id,
        designation: it.designation,
        unit: it.unit,
        orderedQuantity: it.quantity,
        alreadyDeliveredQuantity: it.alreadyDeliveredQuantity,
        remainingQuantity: it.remainingQuantity,
        unitPriceXAF: it.unitPriceXAF,
        deliveredQuantity: String(it.remainingQuantity),
        damagedOrRejectedQuantity: '0',
        conformityNote: '',
      }))
    );
  };

  const openReceptionModal = (preselectedOrderId?: string) => {
    setErrorMsg(null);
    const targetOrder =
      (preselectedOrderId && eligibleOrders.find((o) => o.id === preselectedOrderId)) ||
      eligibleOrders[0];

    setSelectedPoId(targetOrder?.id || '');
    setSupplierBlRef('');
    setDestination('DEPOT');
    setDriverName('');
    setTruckPlate('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setObservations('');
    initLinesFromOrder(targetOrder);
    setShowCreateModal(true);
  };

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    const found = eligibleOrders.find((o) => o.id === poId);
    initLinesFromOrder(found);
  };

  const handleSetAllRemaining = () => {
    setLineDrafts((prev) =>
      prev.map((line) => ({
        ...line,
        deliveredQuantity: String(line.remainingQuantity),
        damagedOrRejectedQuantity: '0',
      }))
    );
  };

  const previewTotalValueXAF = lineDrafts.reduce((sum, l) => {
    const qty = Math.max(0, Number(l.deliveredQuantity) || 0);
    return sum + Math.round(qty * l.unitPriceXAF);
  }, 0);

  const previewHasDispute = lineDrafts.some(
    (l) => Math.max(0, Number(l.damagedOrRejectedQuantity) || 0) > 0
  );
  const previewIsComplete =
    lineDrafts.length > 0 &&
    !previewHasDispute &&
    lineDrafts.every(
      (l) =>
        l.alreadyDeliveredQuantity + Math.max(0, Number(l.deliveredQuantity) || 0) >=
        l.orderedQuantity
    );

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user || !selectedPoId) {
      setErrorMsg('Veuillez sélectionner un bon de commande à réceptionner.');
      return;
    }

    for (const line of lineDrafts) {
      const delQty = Number(line.deliveredQuantity || 0);
      const dmgQty = Number(line.damagedOrRejectedQuantity || 0);
      if (isNaN(delQty) || delQty < 0 || isNaN(dmgQty) || dmgQty < 0) {
        setErrorMsg('Les quantités saisies doivent être positives ou nulles.');
        return;
      }
      if (delQty > line.remainingQuantity) {
        setErrorMsg(
          `Quantité reçue (${delQty}) supérieure au reliquat (${line.remainingQuantity} ${line.unit}) pour ${line.designation}.`
        );
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          purchaseOrderId: selectedPoId,
          supplierBlReference: supplierBlRef,
          destination,
          receivedByName: `${user.firstName} ${user.lastName}`,
          receivedByRole: user.role,
          driverName,
          truckPlate,
          deliveryDate,
          observations,
          items: lineDrafts.map((l) => ({
            purchaseOrderItemId: l.purchaseOrderItemId,
            deliveredQuantity: Number(l.deliveredQuantity || 0),
            damagedOrRejectedQuantity: Number(l.damagedOrRejectedQuantity || 0),
            conformityNote: l.conformityNote,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de la validation du bon de livraison.');
        return;
      }

      setShowCreateModal(false);
      showToast(data.message);
      await fetchOverview();
    } catch (err) {
      setErrorMsg('Erreur réseau lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDelivery || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deliveries/${resolvingDelivery.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolvedNote,
          userRole: user.role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResolvingDelivery(null);
        setResolvedNote('');
        showToast(data.message);
        await fetchOverview();
      } else {
        setErrorMsg(data.error || 'Impossible de clôturer le litige.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.deliveryNumber.toLowerCase().includes(q) ||
      d.supplierBlReference.toLowerCase().includes(q) ||
      d.purchaseOrderNumber.toLowerCase().includes(q) ||
      d.supplierName.toLowerCase().includes(q) ||
      (d.truckPlate || '').toLowerCase().includes(q) ||
      d.projectName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête Module 8 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-orange-400">Logistique & Contrôle Fournisseurs</span>
            <span aria-hidden="true">·</span>
            <span>{company?.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Bons de Livraison & Réception Chantier / Dépôt
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Contrôle des quantités livrées, signalement des avaries et entrée automatique en stock Dépôt.
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

          {canReceiveDelivery ? (
            <button
              onClick={() => openReceptionModal()}
              disabled={eligibleOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer une Réception (BL)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Réception réservée Magasinier / Chef / DG</span>
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
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

      {/* Bandeau Commandes Prêtes à Réceptionner */}
      {eligibleOrders.length > 0 && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>Commandes approuvées en attente de livraison ({eligibleOrders.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sélectionnez un bon de commande ci-dessous pour réceptionner tout ou partie des matériaux.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {eligibleOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      Livraison : {order.expectedDeliveryDate}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{order.supplierName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {order.projectCode} · {order.projectName}
                  </p>
                  <div className="pt-1 text-[11px] text-slate-300 space-y-0.5">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-slate-400">{it.designation}</span>
                        <span className="font-mono text-amber-300 shrink-0 tabular-nums">
                          Reliquat : {it.remainingQuantity} / {it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {canReceiveDelivery && (
                  <button
                    onClick={() => openReceptionModal(order.id)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Réceptionner (BL)</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Bons de Livraison (BL)</p>
          <p className="text-2xl font-extrabold text-white tabular-nums mt-1">
            {summary.totalDeliveries}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {summary.completedCount} complet(s) · {summary.partialCount} partiel(s)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Commandes à réceptionner</p>
          <p className="text-2xl font-extrabold text-amber-400 tabular-nums mt-1">
            {summary.pendingOrdersToReceive}
          </p>
          <p className="text-xs text-slate-400 mt-1">BC approuvés avec reliquat actif</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Litiges & Avaries signalés</p>
          <p
            className={`text-2xl font-extrabold tabular-nums mt-1 ${
              summary.disputedCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {summary.disputedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.disputedCount > 0
              ? 'Écarts ou casses à régulariser'
              : 'Aucune réserve active'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Valeur réceptionnée conforme</p>
          <p className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">
            {formatXAF(summary.totalReceivedValueXAF)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Entrées stock & livraisons directes</p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher N° BL, BC, fournisseur, plaque..."
              className="pl-8 pr-3 py-1.5 w-64 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
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
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'COMPLETED', label: 'Complètes' },
            { id: 'PARTIAL', label: 'Partielles' },
            { id: 'DISPUTED', label: 'Litiges' },
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

      {/* Tableau des Bons de Livraison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">N° BL & Date</th>
                <th className="py-3 px-4">Bon Commande & Fournisseur</th>
                <th className="py-3 px-4">Destination & Chantier</th>
                <th className="py-3 px-4 text-right">Contrôle Quantités</th>
                <th className="py-3 px-4 text-right">Valeur Conforme</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Chargement des bons de livraison...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center space-y-2">
                    <p className="text-slate-300 font-medium">
                      Aucun bon de livraison trouvé pour ces filtres.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Les réceptions enregistrées sur les commandes approuvées apparaîtront ici.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((dn) => {
                  const totalDelivered = dn.items.reduce((s, i) => s + i.deliveredQuantity, 0);
                  const totalDamaged = dn.items.reduce(
                    (s, i) => s + i.damagedOrRejectedQuantity,
                    0
                  );
                  const statusMeta = STATUS_META[dn.status];

                  return (
                    <tr key={dn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <span className="font-mono font-bold text-white block">
                          {dn.deliveryNumber}
                        </span>
                        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          <span>{dn.deliveryDate}</span>
                          <span aria-hidden="true"> · </span>
                          <span>BL Fourn. {dn.supplierBlReference}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className="font-semibold text-slate-200 block">
                          {dn.supplierName}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-orange-400">{dn.purchaseOrderNumber}</span>
                          {dn.truckPlate && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span>Camion {dn.truckPlate}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className="text-slate-200 font-medium block truncate max-w-[230px]">
                          {dn.projectName}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          {dn.destination === 'DEPOT' ? (
                            <>
                              <Warehouse className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400">
                                Dépôt Central (Stock synchronisé)
                              </span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="text-blue-400">Livraison Directe Chantier</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top text-right tabular-nums">
                        <span className="font-bold text-emerald-400 block">
                          +{totalDelivered} unité(s) conforme(s)
                        </span>
                        {totalDamaged > 0 ? (
                          <span className="text-[11px] text-red-400 font-medium">
                            {totalDamaged} avarie(s) refusée(s)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">0 avarie</span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right font-mono font-bold text-white tabular-nums">
                        {formatXAF(dn.totalValueXAF)}
                      </td>

                      <td className="py-3 px-4 align-top">
                        <span className={`font-semibold text-xs block ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Par {dn.receivedByName}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDelivery(dn)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Voir le détail du contrôle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Détails</span>
                          </button>

                          {dn.status === 'DISPUTED' && canReceiveDelivery && (
                            <button
                              onClick={() => {
                                setResolvingDelivery(dn);
                                setResolvedNote('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-600/40 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Clôturer litige
                            </button>
                          )}

                          <a
                            href={`/api/deliveries/${dn.id}/pdf`}
                            download={`bon_livraison_${dn.deliveryNumber}.pdf`}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Télécharger le Bon de Livraison PDF officiel"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : ENREGISTRER UNE RÉCEPTION / BON DE LIVRAISON */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDelivery}
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-orange-400" />
                  <span>Enregistrer une Réception & Bon de Livraison (BL)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contrôlez les quantités reçues conformes et les éventuelles avaries avant mise en stock.
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

            {/* Body Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Choix BC & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Bon de Commande Approuvé / Transmis *
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={(e) => handlePoChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} — {o.supplierName} ({o.projectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Destination de la livraison *
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value as DeliveryDestination)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="DEPOT">
                      Dépôt Central (Entrée automatique en Stock)
                    </option>
                    <option value="DIRECT_SITE">
                      Livraison Directe Chantier (Imputation directe budget chantier)
                    </option>
                  </select>
                </div>
              </div>

              {/* Infos transport & BL fournisseur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    N° BL Papier Fournisseur *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierBlRef}
                    onChange={(e) => setSupplierBlRef(e.target.value)}
                    placeholder="Ex: CIM-BL-99104"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date de réception *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Chauffeur
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Ex: Jean-Claude Mbida"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plaque Camion
                  </label>
                  <input
                    type="text"
                    value={truckPlate}
                    onChange={(e) => setTruckPlate(e.target.value)}
                    placeholder="Ex: LT 740 AB"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Tableau de pointage quantités reçues vs reliquat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Contrôle physique des articles livrés
                  </h4>
                  <button
                    type="button"
                    onClick={handleSetAllRemaining}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                  >
                    Tout solder conforme
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                        <th className="py-2.5 px-3">Matériau</th>
                        <th className="py-2.5 px-3 text-right">Commandé</th>
                        <th className="py-2.5 px-3 text-right">Reliquat</th>
                        <th className="py-2.5 px-3 text-right">Reçu conforme *</th>
                        <th className="py-2.5 px-3 text-right">Avarie / Refus</th>
                        <th className="py-2.5 px-3 text-right">P.U. BC (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {lineDrafts.map((line, idx) => (
                        <tr key={line.purchaseOrderItemId} className="bg-slate-900">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">
                              {line.designation}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Unité : {line.unit} · Déjà livré : {line.alreadyDeliveredQuantity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                            {line.orderedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-amber-400">
                            {line.remainingQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              max={line.remainingQuantity}
                              step="any"
                              value={line.deliveredQuantity}
                              onChange={(e) => {
                                const next = [...lineDrafts];
                                next[idx].deliveredQuantity = e.target.value;
                                setLineDrafts(next);
                              }}
                              className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={line.damagedOrRejectedQuantity}
                              onChange={(e) => {
                                const next = [...lineDrafts];
                                next[idx].damagedOrRejectedQuantity = e.target.value;
                                setLineDrafts(next);
                              }}
                              className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-red-400 font-bold focus:outline-none focus:border-red-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                            {line.unitPriceXAF.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observations & Impact Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observations / Réserves de déchargement
                  </label>
                  <textarea
                    rows={2}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Sacs intacts, stockés sous bâche sèche Dépôt Bassa..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Statut prévu du BL :</span>
                    <span
                      className={`font-bold ${
                        previewHasDispute
                          ? 'text-red-400'
                          : previewIsComplete
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                      }`}
                    >
                      {previewHasDispute
                        ? 'Litige / Réserves signalées'
                        : previewIsComplete
                          ? 'Réception Complète (Solde le BC)'
                          : 'Réception Partielle (Reliquat ouvert)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Valeur conforme réceptionnée :</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatXAF(previewTotalValueXAF)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    {destination === 'DEPOT'
                      ? 'Les quantités conformes liées au catalogue créeront automatiquement des entrées dans Stocks & Dépôt.'
                      : 'Livraison directe sur chantier : la valeur conforme sera imputée sur le budget consommé du chantier.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Pinned */}
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
                {submitting ? 'Validation en cours...' : 'Valider la Réception & Générer BL'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2 : DÉTAILS D'UN BON DE LIVRAISON */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-400" />
                  <span>Détails du Bon de Livraison {selectedDelivery.deliveryNumber}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  BC {selectedDelivery.purchaseOrderNumber} · {selectedDelivery.supplierName} ·{' '}
                  {selectedDelivery.deliveryDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Chantier :</span>
                  <span className="font-semibold text-white">
                    {selectedDelivery.projectCode} — {selectedDelivery.projectName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">BL Papier Fournisseur & Transport :</span>
                  <span className="font-semibold text-white">
                    {selectedDelivery.supplierBlReference}
                    {selectedDelivery.truckPlate ? ` · Camion ${selectedDelivery.truckPlate}` : ''}
                    {selectedDelivery.driverName ? ` (${selectedDelivery.driverName})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Réceptionné par :</span>
                  <span className="font-semibold text-white">
                    {selectedDelivery.receivedByName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Synchronisation Stock / Budget :</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedDelivery.destination === 'DEPOT'
                      ? selectedDelivery.stockSynced
                        ? 'Entrée automatique enregistrée dans Stocks & Dépôt'
                        : 'Destination Dépôt'
                      : 'Livraison Directe (Imputée au budget chantier)'}
                  </span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3 text-right">Cde</th>
                      <th className="py-2.5 px-3 text-right">Conforme</th>
                      <th className="py-2.5 px-3 text-right">Avarie</th>
                      <th className="py-2.5 px-3 text-right">P.U.</th>
                      <th className="py-2.5 px-3 text-right">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {selectedDelivery.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block">{it.designation}</span>
                          {it.conformityNote && (
                            <span className="text-[11px] text-slate-400">{it.conformityNote}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          {it.orderedQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-400">
                          {it.deliveredQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-red-400">
                          {it.damagedOrRejectedQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          {it.unitPriceXAF.toLocaleString('fr-FR')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-white">
                          {formatXAF(it.totalValueXAF)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(selectedDelivery.observations || selectedDelivery.resolvedNote) && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-200 space-y-1">
                  {selectedDelivery.observations && (
                    <p>
                      <strong>Observations :</strong> {selectedDelivery.observations}
                    </p>
                  )}
                  {selectedDelivery.resolvedNote && (
                    <p className="text-emerald-300">
                      <strong>Clôture litige :</strong> {selectedDelivery.resolvedNote}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
              <a
                href={`/api/deliveries/${selectedDelivery.id}/pdf`}
                download={`bon_livraison_${selectedDelivery.deliveryNumber}.pdf`}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white inline-flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Télécharger le BL PDF</span>
              </a>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : CLÔTURER UN LITIGE FOURNISSEUR */}
      {resolvingDelivery && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleResolveDispute}
            className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Clôturer le litige {resolvingDelivery.deliveryNumber}</span>
              </h3>
              <button
                type="button"
                onClick={() => setResolvingDelivery(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-300">
                Fournisseur : <strong>{resolvingDelivery.supplierName}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Décision / Motif de clôture (avoir reçu, remplacement effectué...) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolvedNote}
                  onChange={(e) => setResolvedNote(e.target.value)}
                  placeholder="Ex: Avoir fournisseur N° AV-2026-44 reçu pour les 5 barres PVC endommagées."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setResolvingDelivery(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
              >
                {submitting ? 'Clôture...' : 'Confirmer la clôture du litige'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
