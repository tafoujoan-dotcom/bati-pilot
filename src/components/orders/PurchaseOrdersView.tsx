import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Clock,
  Building2,
  Truck,
  X,
  Trash2,
  Eye,
  ShieldCheck,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  city: string;
}

interface MaterialOption {
  id: string;
  reference: string;
  designation: string;
  unit: string;
  supplierName: string;
}

interface SupplierOption {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
}

interface POSummary {
  totalOrders: number;
  pendingCount: number;
  pendingAmountXAF: number;
  approvedCount: number;
  approvedAmountXAF: number;
  draftCount: number;
  activeSuppliersCount: number;
}

interface DraftLineItem {
  materialId: string;
  designation: string;
  unit: string;
  quantity: string;
  unitPriceXAF: string; // Toujours saisi manuellement par le Directeur ou Chef de chantier
}

const STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Brouillon',
    className: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  PENDING_APPROVAL: {
    label: 'En attente Visa DG',
    className: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
  },
  APPROVED: {
    label: 'Approuvé DG',
    className: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
  },
  ORDERED: {
    label: 'Transmis Fournisseur',
    className: 'bg-blue-950/70 text-blue-300 border-blue-700/60',
  },
  DELIVERED: {
    label: 'Livré',
    className: 'bg-emerald-950 text-emerald-400 border-emerald-700',
  },
  REJECTED: {
    label: 'Refusé / À revoir',
    className: 'bg-red-950/70 text-red-300 border-red-800/60',
  },
};

export const PurchaseOrdersView: React.FC = () => {
  const { company, user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [summary, setSummary] = useState<POSummary>({
    totalOrders: 0,
    pendingCount: 0,
    pendingAmountXAF: 0,
    approvedCount: 0,
    approvedAmountXAF: 0,
    draftCount: 0,
    activeSuppliersCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreateOrEditPrice =
    user?.role === 'DIRECTOR' || user?.role === 'SITE_MANAGER' || user?.role === 'SUPER_ADMIN';
  const canApproveDG = user?.role === 'DIRECTOR' || user?.role === 'SUPER_ADMIN';

  // Modal Nouveau Bon de Commande
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poProjectId, setPoProjectId] = useState('');
  const [poSupplierName, setPoSupplierName] = useState('');
  const [poSupplierContact, setPoSupplierContact] = useState('');
  const [poSupplierPhone, setPoSupplierPhone] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [poPaymentTerms, setPoPaymentTerms] = useState('Chèque à réception');
  const [poIncludeTVA, setPoIncludeTVA] = useState(false);
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<DraftLineItem[]>([
    { materialId: '', designation: '', unit: 'Sac 50kg', quantity: '100', unitPriceXAF: '' },
  ]);

  // Modal Détails / Négociation P.U. / Refus DG
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [editedLinePrices, setEditedLinePrices] = useState<Record<string, string>>({});
  const [rejectingOrder, setRejectingOrder] = useState<PurchaseOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOverview = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/purchase-orders/overview?companyId=${encodeURIComponent(company.id)}&projectId=${encodeURIComponent(projectFilter)}&status=${encodeURIComponent(statusFilter)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setProjects(data.projects || []);
        setMaterials(data.materials || []);
        setSuppliers(data.suppliers || []);
        setSummary(data.summary || {});
        if (!poProjectId && data.projects?.length > 0) {
          setPoProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Erreur chargement bons de commande:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, projectFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const formatXAF = (val: number) => `${Math.round(val).toLocaleString('fr-FR')} FCFA`;

  const openCreateModal = () => {
    setErrorMsg(null);
    setPoProjectId(projects[0]?.id || '');
    const firstSup = suppliers[0];
    setPoSupplierName(firstSup?.name || '');
    setPoSupplierContact(firstSup?.contact_person || '');
    setPoSupplierPhone(firstSup?.phone || '');
    setPoIncludeTVA(false);
    setPoNotes('');
    const firstMat = materials[0];
    setPoItems([
      {
        materialId: firstMat?.id || '',
        designation: firstMat?.designation || '',
        unit: firstMat?.unit || 'Unité',
        quantity: '50',
        unitPriceXAF: '', // Jamais pré-rempli automatiquement
      },
    ]);
    setShowCreateModal(true);
  };

  const handleSelectMaterialOnLine = (idx: number, matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    const updated = [...poItems];
    if (mat) {
      updated[idx] = {
        ...updated[idx],
        materialId: mat.id,
        designation: mat.designation,
        unit: mat.unit,
      };
    } else {
      updated[idx] = { ...updated[idx], materialId: '' };
    }
    setPoItems(updated);
  };

  const addLineItem = () => {
    setPoItems([
      ...poItems,
      { materialId: '', designation: '', unit: 'Unité', quantity: '10', unitPriceXAF: '' },
    ]);
  };

  const removeLineItem = (idx: number) => {
    if (poItems.length <= 1) return;
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const createSubtotal = poItems.reduce((sum, it) => {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPriceXAF) || 0;
    return sum + Math.round(q * p);
  }, 0);
  const createTVA = poIncludeTVA ? Math.round(createSubtotal * 0.1925) : 0;
  const createTotal = createSubtotal + createTVA;

  const handleCreatePO = async (submitImmediately: boolean) => {
    if (!company || !poProjectId || !poSupplierName.trim()) {
      setErrorMsg('Veuillez sélectionner un chantier et renseigner le fournisseur.');
      return;
    }

    for (const line of poItems) {
      if (!line.designation.trim() || !line.quantity || Number(line.quantity) <= 0) {
        setErrorMsg('Chaque ligne doit contenir une désignation et une quantité positive.');
        return;
      }
      if (line.unitPriceXAF === '' || Number(line.unitPriceXAF) < 0) {
        setErrorMsg('Veuillez saisir manuellement le P.U. (FCFA) sur chaque ligne de commande.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          projectId: poProjectId,
          supplierName: poSupplierName,
          supplierContact: poSupplierContact,
          supplierPhone: poSupplierPhone,
          requestedByName: user ? `${user.firstName} ${user.lastName}` : 'Ing. Paul Ndongo',
          requestedByRole: user?.role || 'SITE_MANAGER',
          expectedDeliveryDate: poDeliveryDate,
          paymentTerms: poPaymentTerms,
          includeTVA: poIncludeTVA,
          submitImmediately,
          notes: poNotes,
          items: poItems.map((it) => ({
            materialId: it.materialId || undefined,
            designation: it.designation,
            unit: it.unit,
            quantity: Number(it.quantity),
            unitPriceXAF: Number(it.unitPriceXAF),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur création bon de commande.');
        return;
      }
      setShowCreateModal(false);
      showToast(data.message);
      await fetchOverview();
    } catch {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWorkflowAction = async (
    orderId: string,
    action: 'submit' | 'approve' | 'send'
  ) => {
    setSubmitting(true);
    try {
      const bodyPayload =
        action === 'approve'
          ? {
              approverName: user ? `${user.firstName} ${user.lastName} (DG)` : "Samuel Eto'o Mbarga (DG)",
              userRole: user?.role,
            }
          : {};
      const res = await fetch(`/api/purchase-orders/${encodeURIComponent(orderId)}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Action refusée.');
        return;
      }
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(data.order);
      }
      showToast(data.message);
      await fetchOverview();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${encodeURIComponent(rejectingOrder.id)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason || 'Prix ou quantités à revoir',
          reviewerName: user ? `${user.firstName} ${user.lastName} (DG)` : 'Direction Générale',
          userRole: user?.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Refus impossible.');
        return;
      }
      setRejectingOrder(null);
      setRejectReason('');
      if (selectedOrder?.id === rejectingOrder.id) {
        setSelectedOrder(data.order);
      }
      showToast(data.message);
      await fetchOverview();
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailsModal = (order: PurchaseOrder) => {
    setErrorMsg(null);
    const map: Record<string, string> = {};
    order.items.forEach((it) => {
      map[it.id] = String(it.unitPriceXAF);
    });
    setEditedLinePrices(map);
    setSelectedOrder(order);
  };

  const handleSaveNegotiatedPrices = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const itemsPayload = selectedOrder.items.map((it) => ({
        id: it.id,
        unitPriceXAF: Number(editedLinePrices[it.id] ?? it.unitPriceXAF),
      }));
      const res = await fetch(
        `/api/purchase-orders/${encodeURIComponent(selectedOrder.id)}/prices`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsPayload,
            userRole: user?.role,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Impossible de mettre à jour les prix.');
        return;
      }
      setSelectedOrder(data.order);
      showToast(data.message);
      await fetchOverview();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.supplierName.toLowerCase().includes(q) ||
      o.projectName.toLowerCase().includes(q) ||
      o.items.some((i) => i.designation.toLowerCase().includes(q))
    );
  });

  if (!company) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold uppercase tracking-wider mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>Bons de Commande & Approbation Direction</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Achats Fournisseurs, Devis & Circuit de Validation Direction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {company.name} · Saisie des prix négociés par le Directeur / Chef de chantier · Bons officiels PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {canCreateOrEditPrice ? (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Bon de Commande</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Émission réservée au Directeur / Chef de chantier</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>En attente Visa DG</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 font-mono tabular-nums">
            {formatXAF(summary.pendingAmountXAF)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.pendingCount} bon(s) soumis à la Direction Générale
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Commandes Approuvées / En cours</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {formatXAF(summary.approvedAmountXAF)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.approvedCount} bon(s) validés ou transmis fournisseurs
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Bons Émis</span>
            <ShoppingCart className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xl font-extrabold text-white font-mono tabular-nums">
            {summary.totalOrders} bons
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Dont {summary.draftCount} brouillon(s) en préparation
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Fournisseurs Sollicités</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white font-mono tabular-nums">
            {summary.activeSuppliersCount} partenaires
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            CIMENCAM, GROUPE FOKOU, SOREPCO, Carrières...
          </p>
        </div>
      </div>

      {/* Bannière Visa DG si des bons attendent */}
      {summary.pendingCount > 0 && (
        <div className="bg-amber-950/30 border border-amber-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                {summary.pendingCount} Bon(s) de commande en attente d’approbation DG ({formatXAF(summary.pendingAmountXAF)})
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {canApproveDG
                  ? 'Vous êtes connecté en tant que Direction : vérifiez les prix saisis et approuvez ou refusez en 1 clic.'
                  : 'Seul le Directeur Général peut apposer le visa d’approbation avant transmission au fournisseur.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
          >
            Voir les bons à valider
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher N° BC, fournisseur, matériau..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400 shrink-0 hidden sm:block" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tous les chantiers</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'PENDING_APPROVAL', label: 'Attente DG' },
            { id: 'APPROVED', label: 'Approuvés' },
            { id: 'ORDERED', label: 'Transmis' },
            { id: 'DRAFT', label: 'Brouillons' },
            { id: 'REJECTED', label: 'Refusés' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                statusFilter === st.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des Bons de Commande */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">N° Bon & Date</th>
                <th className="py-3 px-4">Fournisseur & Chantier</th>
                <th className="py-3 px-4">Articles & Demandeur</th>
                <th className="py-3 px-4 text-right">Montant Total</th>
                <th className="py-3 px-4">Statut Circuit</th>
                <th className="py-3 px-4 text-right">Actions & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {filteredOrders.map((po) => {
                const st = STATUS_META[po.status];
                return (
                  <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-orange-400">{po.orderNumber}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Livraison : {new Date(po.expectedDeliveryDate).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{po.supplierName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {po.projectCode} · {po.projectName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">
                        {po.items.length} ligne(s) · {po.items[0]?.designation}
                        {po.items.length > 1 ? ` (+${po.items.length - 1})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Émis par {po.requestedByName} · {po.paymentTerms}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold font-mono tabular-nums text-white">
                        {formatXAF(po.totalAmountXAF)}
                      </div>
                      {po.includeTVA && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          TTC (TVA 19,25% incl.)
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-bold ${st.className}`}
                      >
                        {st.label}
                      </span>
                      {po.approvedByName && po.status !== 'REJECTED' && (
                        <div className="text-[10px] text-emerald-400 mt-1">
                          Visa : {po.approvedByName}
                        </div>
                      )}
                      {po.rejectionReason && po.status === 'REJECTED' && (
                        <div className="text-[10px] text-red-400 mt-1">
                          Motif : {po.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailsModal(po)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-400" />
                          <span>Détails / P.U.</span>
                        </button>

                        {(po.status === 'DRAFT' || po.status === 'REJECTED') && (
                          <button
                            onClick={() => handleWorkflowAction(po.id, 'submit')}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Soumettre DG</span>
                          </button>
                        )}

                        {po.status === 'PENDING_APPROVAL' && canApproveDG && (
                          <>
                            <button
                              onClick={() => handleWorkflowAction(po.id, 'approve')}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approuver</span>
                            </button>
                            <button
                              onClick={() => {
                                setErrorMsg(null);
                                setRejectReason('');
                                setRejectingOrder(po);
                              }}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-semibold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuser</span>
                            </button>
                          </>
                        )}

                        {po.status === 'APPROVED' && (
                          <button
                            onClick={() => handleWorkflowAction(po.id, 'send')}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Transmettre</span>
                          </button>
                        )}

                        <a
                          href={`/api/purchase-orders/${encodeURIComponent(po.id)}/pdf`}
                          download={`bon_commande_${po.orderNumber}.pdf`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Aucun bon de commande trouvé pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1 : NOUVEAU BON DE COMMANDE (SAISIE MANUELLE DES P.U.) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Émettre un Nouveau Bon de Commande BTP
                </h2>
                <p className="text-xs text-slate-400">
                  Le Directeur ou le Chef de chantier saisit librement le P.U. négocié sur chaque ligne.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chantier concerné *
                  </label>
                  <select
                    value={poProjectId}
                    onChange={(e) => setPoProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
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
                    Fournisseur destinataire *
                  </label>
                  <input
                    type="text"
                    list="suppliers-datalist"
                    value={poSupplierName}
                    onChange={(e) => {
                      setPoSupplierName(e.target.value);
                      const found = suppliers.find((s) => s.name === e.target.value);
                      if (found) {
                        setPoSupplierContact(found.contact_person);
                        setPoSupplierPhone(found.phone);
                      }
                    }}
                    placeholder="Ex: CIMENCAM, GROUPE FOKOU..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <datalist id="suppliers-datalist">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Livraison souhaitée
                  </label>
                  <input
                    type="date"
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mode de règlement
                  </label>
                  <select
                    value={poPaymentTerms}
                    onChange={(e) => setPoPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Chèque à réception">Chèque à réception</option>
                    <option value="Virement 30 jours">Virement 30 jours</option>
                    <option value="Mobile Money / Cash livraison">Mobile Money / Cash</option>
                    <option value="Acompte 50% + Solde livraison">Acompte 50% + Solde</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={poIncludeTVA}
                      onChange={(e) => setPoIncludeTVA(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-orange-500"
                    />
                    <span>Appliquer TVA (19,25%)</span>
                  </label>
                </div>
              </div>

              {/* Lignes de commande */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-300 uppercase tracking-wide">
                    Lignes de Matériaux (P.U. saisi manuellement en FCFA)
                  </span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    <span>Ajouter ligne</span>
                  </button>
                </div>

                {poItems.map((line, idx) => {
                  const lineTotal =
                    (Number(line.quantity) || 0) * (Number(line.unitPriceXAF) || 0);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <select
                            value={line.materialId}
                            onChange={(e) => handleSelectMaterialOnLine(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mb-1.5"
                          >
                            <option value="">-- Matériau libre ou catalogue --</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                [{m.reference}] {m.designation}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={line.designation}
                            onChange={(e) => {
                              const arr = [...poItems];
                              arr[idx].designation = e.target.value;
                              setPoItems(arr);
                            }}
                            placeholder="Désignation exacte..."
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 mb-1">Unité</label>
                          <input
                            type="text"
                            value={line.unit}
                            onChange={(e) => {
                              const arr = [...poItems];
                              arr[idx].unit = e.target.value;
                              setPoItems(arr);
                            }}
                            className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 mb-1">Quantité</label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => {
                              const arr = [...poItems];
                              arr[idx].quantity = e.target.value;
                              setPoItems(arr);
                            }}
                            className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-orange-300 font-bold mb-1">
                            P.U. (FCFA) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.unitPriceXAF}
                            onChange={(e) => {
                              const arr = [...poItems];
                              arr[idx].unitPriceXAF = e.target.value;
                              setPoItems(arr);
                            }}
                            placeholder="Saisir P.U."
                            className="w-full px-2 py-2 rounded-lg bg-slate-900 border border-orange-500/40 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end pt-4">
                          {poItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/60 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        Sous-total ligne :{' '}
                        <strong className="text-slate-200">{formatXAF(lineTotal)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instructions de livraison / Notes chantier
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Ex: Déchargement impératif avant 11h sur chantier Akwa..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Récapitulatif Financier */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total H.T. :</span>
                  <span className="font-mono font-bold text-slate-200">{formatXAF(createSubtotal)}</span>
                </div>
                {poIncludeTVA && (
                  <div className="flex justify-between text-slate-400">
                    <span>TVA Cameroun (19,25%) :</span>
                    <span className="font-mono font-bold text-slate-200">{formatXAF(createTVA)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-slate-800">
                  <span className="font-bold text-white">Net à Commander :</span>
                  <span className="font-extrabold font-mono text-orange-400">{formatXAF(createTotal)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCreatePO(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white cursor-pointer"
              >
                Enregistrer Brouillon
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCreatePO(true)}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                {submitting ? 'Envoi...' : 'Soumettre au Visa DG'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : DÉTAILS & AJUSTEMENT P.U. DU BON DE COMMANDE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-orange-400">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_META[selectedOrder.status].className}`}
                  >
                    {STATUS_META[selectedOrder.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedOrder.supplierName} · {selectedOrder.projectName}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div>
                  <span className="text-slate-400 block">Demandeur :</span>
                  <strong className="text-white">{selectedOrder.requestedByName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Règlement & Livraison :</span>
                  <strong className="text-white">
                    {selectedOrder.paymentTerms} · {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString('fr-FR')}
                  </strong>
                </div>
              </div>

              {/* Lignes avec P.U. éditable si non encore transmis et rôle autorisé */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-300">
                  Détail des articles commandés
                </p>
                {selectedOrder.items.map((it) => {
                  const canEditThisOrder =
                    canCreateOrEditPrice &&
                    selectedOrder.status !== 'ORDERED' &&
                    selectedOrder.status !== 'DELIVERED';
                  const currentPU = Number(editedLinePrices[it.id] ?? it.unitPriceXAF);
                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{it.designation}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Qté : {it.quantity} {it.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">P.U. :</span>
                          {canEditThisOrder ? (
                            <input
                              type="number"
                              min="0"
                              value={editedLinePrices[it.id] ?? it.unitPriceXAF}
                              onChange={(e) =>
                                setEditedLinePrices({
                                  ...editedLinePrices,
                                  [it.id]: e.target.value,
                                })
                              }
                              className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-orange-500/40 text-right font-mono text-white text-xs"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-200">
                              {it.unitPriceXAF.toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <div className="w-28 text-right font-mono font-bold text-orange-400">
                          {formatXAF(it.quantity * currentPU)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-300">
                  Total Bon de Commande {selectedOrder.includeTVA ? '(TTC)' : '(HT)'} :
                </span>
                <span className="font-extrabold font-mono text-orange-400">
                  {formatXAF(selectedOrder.totalAmountXAF)}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <a
                href={`/api/purchase-orders/${encodeURIComponent(selectedOrder.id)}/pdf`}
                download={`bon_commande_${selectedOrder.orderNumber}.pdf`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                <span>Télécharger PDF</span>
              </a>

              <div className="flex flex-wrap items-center gap-2">
                {canCreateOrEditPrice &&
                  selectedOrder.status !== 'ORDERED' &&
                  selectedOrder.status !== 'DELIVERED' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSaveNegotiatedPrices}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white cursor-pointer"
                    >
                      Actualiser les P.U.
                    </button>
                  )}

                {selectedOrder.status === 'PENDING_APPROVAL' && canApproveDG && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleWorkflowAction(selectedOrder.id, 'approve')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                  >
                    Approuver (Visa DG)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3 : REFUSER UN BON DE COMMANDE (DG) */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Refuser {rejectingOrder.orderNumber}
                </h2>
                <p className="text-xs text-slate-400">
                  Indiquez le motif au Chef de chantier (ex: prix trop élevé, quantité à ajuster).
                </p>
              </div>
              <button
                onClick={() => setRejectingOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectOrder} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 overflow-y-auto flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motif du renvoi / refus *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Renégocier le prix du fer HA12 avec Fokou ou réduire à 120 barres..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
