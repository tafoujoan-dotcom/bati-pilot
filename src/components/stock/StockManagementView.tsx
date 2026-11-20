import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MaterialCategory, MaterialItem, StockMovement, StockMovementType } from '../../types';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  FileText,
  Download,
  Warehouse,
  SlidersHorizontal,
  X,
  RefreshCw,
  Layers,
  Building2,
  Pencil,
  Lock,
} from 'lucide-react';

interface ProjectOption {
  id: string;
  code: string;
  name: string;
  city: string;
  managerName?: string;
}

interface StockSummary {
  totalSku: number;
  totalValuationXAF: number;
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  movementsCount: number;
  exitsValueXAF: number;
  entriesValueXAF: number;
}

const CATEGORY_OPTIONS: { value: MaterialCategory; label: string }[] = [
  { value: 'LIANTS', label: 'Liants & Ciments' },
  { value: 'ACIERS', label: 'Aciers & Ferraillage' },
  { value: 'GRANULATS', label: 'Granulats & Sables' },
  { value: 'MACONNERIE', label: 'Maçonnerie & Agglos' },
  { value: 'PLOMBERIE_ELEC', label: 'Plomberie & Réseaux' },
  { value: 'BOIS_COFFRAGE', label: 'Bois & Coffrage' },
  { value: 'CARBURANT', label: 'Carburant & Engins' },
];

export const StockManagementView: React.FC = () => {
  const { company, user } = useAuth();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    totalSku: 0,
    totalValuationXAF: 0,
    criticalCount: 0,
    warningCount: 0,
    healthyCount: 0,
    movementsCount: 0,
    exitsValueXAF: 0,
    entriesValueXAF: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MOVEMENTS' | 'CATEGORIES'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [movementProjectFilter, setMovementProjectFilter] = useState<string>('ALL');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canEditPrice =
    user?.role === 'DIRECTOR' || user?.role === 'SITE_MANAGER' || user?.role === 'SUPER_ADMIN';

  // Modal Mouvement (Entrée / Sortie / Ajustement)
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [mvtType, setMvtType] = useState<StockMovementType>('EXIT');
  const [mvtMaterialId, setMvtMaterialId] = useState('');
  const [mvtProjectId, setMvtProjectId] = useState('');
  const [mvtQuantity, setMvtQuantity] = useState('');
  const [mvtUnitPrice, setMvtUnitPrice] = useState('');
  const [mvtUpdateCatalogPrice, setMvtUpdateCatalogPrice] = useState(true);
  const [mvtRecipient, setMvtRecipient] = useState('');
  const [mvtNotes, setMvtNotes] = useState('');

  // Modal Modification P.U. Catalogue
  const [editingPriceMat, setEditingPriceMat] = useState<MaterialItem | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');

  // Modal Nouveau Matériau
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatForm, setNewMatForm] = useState({
    reference: '',
    designation: '',
    category: 'LIANTS' as MaterialCategory,
    unit: 'Sac 50kg',
    depotLocation: 'Dépôt Central Bassa (Douala)',
    currentStock: '100',
    minimumStockAlert: '30',
    unitPriceXAF: '',
    supplierName: 'CIMENCAM Douala',
  });

  const fetchOverview = async () => {
    if (!company) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stock/overview?companyId=${encodeURIComponent(company.id)}&projectId=${encodeURIComponent(movementProjectFilter)}`
      );
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
        setMovements(data.movements || []);
        setProjects(data.projects || []);
        setSummary(data.summary || {});
        if (!mvtMaterialId && data.materials?.length > 0) {
          setMvtMaterialId(data.materials[0].id);
        }
        if (!mvtProjectId && data.projects?.length > 0) {
          setMvtProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Erreur chargement stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, movementProjectFilter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const formatXAF = (val: number) => `${Math.round(val).toLocaleString('fr-FR')} FCFA`;

  const openMovementModal = (type: StockMovementType, materialId?: string) => {
    setErrorMsg(null);
    setMvtType(type);
    const targetId = materialId || materials[0]?.id || '';
    setMvtMaterialId(targetId);
    const selectedMat = materials.find((m) => m.id === targetId);
    const defaultProj = projects[0];
    setMvtProjectId(defaultProj?.id || '');
    setMvtQuantity(type === 'ADJUSTMENT' && selectedMat ? String(selectedMat.currentStock) : type === 'ENTRY' ? '50' : '10');
    // Le P.U. n'est jamais forcé automatiquement : le Directeur ou Chef de chantier le saisit librement
    setMvtUnitPrice('');
    setMvtUpdateCatalogPrice(type === 'ENTRY');
    setMvtRecipient(
      type === 'ENTRY'
        ? selectedMat?.supplierName || ''
        : defaultProj?.managerName || 'Conducteur de travaux'
    );
    setMvtNotes('');
    setShowMovementModal(true);
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !mvtMaterialId || !mvtQuantity) return;
    if (canEditPrice && (mvtUnitPrice === '' || Number(mvtUnitPrice) < 0)) {
      setErrorMsg('Veuillez saisir le Prix Unitaire (P.U.) en FCFA auquel le matériau est pris.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          materialId: mvtMaterialId,
          type: mvtType,
          quantity: Number(mvtQuantity),
          unitPriceXAF: canEditPrice && mvtUnitPrice !== '' ? Number(mvtUnitPrice) : undefined,
          updateCatalogPrice: canEditPrice ? mvtUpdateCatalogPrice : false,
          userRole: user?.role,
          projectId: mvtType === 'EXIT' ? mvtProjectId : undefined,
          operatorName: user ? `${user.firstName} ${user.lastName}` : 'Christian Talla',
          recipientName: mvtRecipient,
          notes: mvtNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Impossible d’enregistrer ce mouvement.');
        return;
      }
      setShowMovementModal(false);
      showToast(data.message);
      await fetchOverview();
    } catch {
      setErrorMsg('Erreur réseau lors de l’enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCatalogPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceMat || editPriceValue === '') return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/stock/materials/${encodeURIComponent(editingPriceMat.id)}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPriceXAF: Number(editPriceValue),
          userRole: user?.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur lors de la mise à jour du P.U.');
        return;
      }
      setEditingPriceMat(null);
      setEditPriceValue('');
      showToast(data.message);
      await fetchOverview();
    } catch {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !newMatForm.designation.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/stock/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          ...newMatForm,
          currentStock: Number(newMatForm.currentStock),
          minimumStockAlert: Number(newMatForm.minimumStockAlert),
          unitPriceXAF: newMatForm.unitPriceXAF === '' ? 0 : Number(newMatForm.unitPriceXAF),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur création matériau.');
        return;
      }
      setShowAddMaterialModal(false);
      setNewMatForm({
        reference: '',
        designation: '',
        category: 'LIANTS',
        unit: 'Sac 50kg',
        depotLocation: 'Dépôt Central Bassa (Douala)',
        currentStock: '100',
        minimumStockAlert: '30',
        unitPriceXAF: '',
        supplierName: 'CIMENCAM Douala',
      });
      showToast(data.message);
      await fetchOverview();
    } catch {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const criticalMaterials = materials.filter((m) => m.currentStock <= m.minimumStockAlert);

  const filteredMaterials = materials.filter((m) => {
    const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;
    const isAlert = m.currentStock <= m.minimumStockAlert * 1.35;
    const matchesAlert = !alertsOnly || isAlert;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.designation.toLowerCase().includes(q) ||
      m.reference.toLowerCase().includes(q) ||
      m.supplierName.toLowerCase().includes(q) ||
      m.depotLocation.toLowerCase().includes(q);
    return matchesCat && matchesAlert && matchesSearch;
  });

  const filteredMovements = movements.filter((mv) => {
    return movementTypeFilter === 'ALL' || mv.type === movementTypeFilter;
  });

  const categoryBreakdown = CATEGORY_OPTIONS.map((cat) => {
    const items = materials.filter((m) => m.category === cat.value);
    const valuation = items.reduce((s, m) => s + m.currentStock * m.unitPriceXAF, 0);
    const alerts = items.filter((m) => m.currentStock <= m.minimumStockAlert).length;
    const sharePct =
      summary.totalValuationXAF > 0 ? Math.round((valuation / summary.totalValuationXAF) * 100) : 0;
    return {
      ...cat,
      count: items.length,
      valuation,
      alerts,
      sharePct,
    };
  }).filter((c) => c.count > 0);

  const selectedModalMaterial = materials.find((m) => m.id === mvtMaterialId);
  const effectiveUnitPrice =
    canEditPrice && mvtUnitPrice !== ''
      ? Number(mvtUnitPrice)
      : selectedModalMaterial?.unitPriceXAF || 0;
  const estimatedMovementValue =
    selectedModalMaterial && Number(mvtQuantity) > 0
      ? Number(mvtQuantity) * effectiveUnitPrice
      : 0;

  if (!company) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* En-tête du module */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Gestion des Stocks & Dépôt BTP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Magasin Central, Matériaux & Bons de Sortie Chantier
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {company.name} · {company.city} · Valorisation en temps réel & imputation directe aux chantiers (FCFA)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/stock/inventory-pdf?companyId=${encodeURIComponent(company.id)}`}
            download={`inventaire_stock_${company.slug}.pdf`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>PDF Inventaire</span>
          </a>

          <button
            onClick={() => openMovementModal('ENTRY')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Entrée / Réception</span>
          </button>

          <button
            onClick={() => openMovementModal('EXIT')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer shadow-lg shadow-orange-600/20 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Bon de Sortie Chantier</span>
          </button>

          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddMaterialModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Nouveau Matériau</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Valeur Totale en Dépôt</span>
            <Warehouse className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xl font-extrabold text-white font-mono tabular-nums">
            {formatXAF(summary.totalValuationXAF)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.totalSku} références valorisées au coût unitaire
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Alertes Rupture / Seuil</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-red-400 font-mono tabular-nums">
              {summary.criticalCount} critique{summary.criticalCount > 1 ? 's' : ''}
            </p>
            <span className="text-xs text-amber-400 font-mono tabular-nums">
              · {summary.warningCount} vigilance
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.healthyCount} articles à niveau sécurisé
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Sorties Imputées Chantiers</span>
            <ArrowUpRight className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xl font-extrabold text-orange-400 font-mono tabular-nums">
            {formatXAF(summary.exitsValueXAF)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Consommation déduite et affectée au budget réel
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Réceptions & Mouvements</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 font-mono tabular-nums">
            {formatXAF(summary.entriesValueXAF)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.movementsCount} bons d'entrée / sortie tracés
          </p>
        </div>
      </div>

      {/* Bannière Alerte Critique si articles sous le seuil */}
      {criticalMaterials.length > 0 && (
        <div className="bg-red-950/30 border border-red-800/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-300 uppercase tracking-wide">
                Alerte Seuil Critique Dépôt ({criticalMaterials.length} matériau{criticalMaterials.length > 1 ? 'x' : ''})
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {criticalMaterials
                  .map((m) => `${m.designation} (${m.currentStock}/${m.minimumStockAlert} ${m.unit})`)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => openMovementModal('ENTRY', criticalMaterials[0].id)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Réapprovisionner maintenant
          </button>
        </div>
      )}

      {/* Onglets de navigation du module */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'CATALOG'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Catalogue & Niveaux de Stock ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'MOVEMENTS'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Journal Entrées / Sorties ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'CATEGORIES'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Valorisation par Catégorie
          </button>
        </div>

        <button
          onClick={fetchOverview}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : CATALOGUE */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          {/* Barre de filtres */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher ciment, fer HA12, référence, fournisseur..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Toutes catégories BTP</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setAlertsOnly(!alertsOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  alertsOnly
                    ? 'bg-red-600/20 border-red-500/50 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Alertes seuil uniquement
              </button>
            </div>
          </div>

          {/* Tableau des matériaux */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Réf & Matériau</th>
                    <th className="py-3 px-4">Catégorie & Dépôt</th>
                    <th className="py-3 px-4 text-right">Stock Actuel</th>
                    <th className="py-3 px-4 text-right">Seuil Alerte</th>
                    <th className="py-3 px-4 text-right">P.U. (FCFA)</th>
                    <th className="py-3 px-4 text-right">Valeur Stock</th>
                    <th className="py-3 px-4 text-right">Actions Magasin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredMaterials.map((m) => {
                    const isCritical = m.currentStock <= m.minimumStockAlert;
                    const isWarning =
                      !isCritical && m.currentStock <= m.minimumStockAlert * 1.35;
                    const ratioPct = Math.min(
                      100,
                      Math.round((m.currentStock / Math.max(1, m.minimumStockAlert * 3)) * 100)
                    );
                    const totalVal = m.currentStock * m.unitPriceXAF;

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{m.designation}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono text-orange-400">{m.reference}</span> ·{' '}
                            {m.supplierName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium">{m.categoryLabel}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{m.depotLocation}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`font-extrabold font-mono tabular-nums ${
                                isCritical
                                  ? 'text-red-400'
                                  : isWarning
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                              }`}
                            >
                              {m.currentStock.toLocaleString('fr-FR')} {m.unit}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical
                                    ? 'bg-red-500'
                                    : isWarning
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${ratioPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-400">
                          {m.minimumStockAlert.toLocaleString('fr-FR')} {m.unit}
                          {isCritical && (
                            <span className="block text-[10px] font-bold text-red-400">
                              RUPTURE PROCHE
                            </span>
                          )}
                          {isWarning && (
                            <span className="block text-[10px] font-bold text-amber-400">
                              VIGILANCE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <span>{m.unitPriceXAF.toLocaleString('fr-FR')}</span>
                            {canEditPrice && (
                              <button
                                onClick={() => {
                                  setErrorMsg(null);
                                  setEditingPriceMat(m);
                                  setEditPriceValue('');
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-orange-600/20 text-slate-400 hover:text-orange-400 cursor-pointer transition-colors"
                                aria-label="Modifier le P.U."
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-mono tabular-nums text-white">
                          {formatXAF(totalVal)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openMovementModal('ENTRY', m.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                            >
                              + Entrée
                            </button>
                            <button
                              onClick={() => openMovementModal('EXIT', m.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-[11px] font-semibold cursor-pointer"
                            >
                              - Sortie
                            </button>
                            <button
                              onClick={() => openMovementModal('ADJUSTMENT', m.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              aria-label="Ajuster inventaire"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMaterials.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun matériau ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : JOURNAL DES MOUVEMENTS */}
      {activeTab === 'MOVEMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <select
                value={movementProjectFilter}
                onChange={(e) => setMovementProjectFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Tous les chantiers & Dépôt</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>

              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Tous types de bons</option>
                <option value="ENTRY">Entrées Dépôt (BE)</option>
                <option value="EXIT">Sorties Chantier (BS)</option>
                <option value="ADJUSTMENT">Ajustements (ADJ)</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              {filteredMovements.length} mouvement(s) enregistré(s)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">N° Bon & Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Matériau</th>
                    <th className="py-3 px-4">Chantier / Tiers</th>
                    <th className="py-3 px-4 text-right">Quantité</th>
                    <th className="py-3 px-4 text-right">Valeur (FCFA)</th>
                    <th className="py-3 px-4 text-right">Bon PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredMovements.map((mv) => {
                    const isEntry = mv.type === 'ENTRY';
                    const isExit = mv.type === 'EXIT';
                    return (
                      <tr key={mv.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white">{mv.referenceDoc}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(mv.createdAt).toLocaleDateString('fr-FR')} · {mv.operatorName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              isEntry
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isExit
                                  ? 'bg-orange-950 text-orange-300 border border-orange-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isEntry ? 'Entrée Dépôt' : isExit ? 'Sortie Chantier' : 'Ajustement'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{mv.materialDesignation}</div>
                          {mv.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{mv.notes}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">
                            {mv.projectName || 'Dépôt Central Entreprise'}
                          </div>
                          <div className="text-[11px] text-slate-400">{mv.recipientName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={isEntry ? 'text-emerald-400' : isExit ? 'text-orange-400' : 'text-slate-300'}>
                            {isEntry ? '+' : isExit ? '-' : '='}
                            {mv.quantity.toLocaleString('fr-FR')} {mv.unit}
                          </span>
                          <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                            P.U. {mv.unitPriceXAF.toLocaleString('fr-FR')} FCFA
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-white">
                          {formatXAF(mv.totalValueXAF)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <a
                            href={`/api/stock/movements/${encodeURIComponent(mv.id)}/pdf`}
                            download={`bon_${mv.referenceDoc}.pdf`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5 text-orange-400" />
                            <span>Bon PDF</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun mouvement enregistré pour ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : VALORISATION PAR CATÉGORIE */}
      {activeTab === 'CATEGORIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdown.map((cat) => (
            <div
              key={cat.value}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">{cat.label}</h3>
                <span className="text-xs font-mono font-bold text-orange-400">
                  {cat.sharePct}% du stock
                </span>
              </div>

              <p className="text-lg font-extrabold text-white font-mono tabular-nums">
                {formatXAF(cat.valuation)}
              </p>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${Math.max(4, cat.sharePct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{cat.count} référence(s)</span>
                {cat.alerts > 0 ? (
                  <span className="text-red-400 font-semibold">
                    {cat.alerts} alerte(s) critique(s)
                  </span>
                ) : (
                  <span className="text-emerald-400">Niveau optimal</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1 : ENREGISTRER UN MOUVEMENT (ENTRÉE / SORTIE / AJUSTEMENT) */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {mvtType === 'ENTRY'
                    ? 'Réception Fournisseur / Entrée en Dépôt'
                    : mvtType === 'EXIT'
                      ? 'Bon de Sortie Matériaux vers Chantier'
                      : 'Ajustement d’Inventaire Physique'}
                </h2>
                <p className="text-xs text-slate-400">
                  {mvtType === 'EXIT'
                    ? 'Déduit du dépôt et imputé automatiquement au budget du chantier.'
                    : 'Mise à jour immédiate de la quantité disponible en magasin.'}
                </p>
              </div>
              <button
                onClick={() => setShowMovementModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Sélecteur Type */}
                <div className="grid grid-cols-3 gap-2">
                  {(['EXIT', 'ENTRY', 'ADJUSTMENT'] as StockMovementType[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setMvtType(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                        mvtType === t
                          ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'EXIT' ? 'Sortie Chantier' : t === 'ENTRY' ? 'Entrée Dépôt' : 'Ajustement'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Matériau concerné *
                  </label>
                  <select
                    value={mvtMaterialId}
                    onChange={(e) => setMvtMaterialId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.reference}] {m.designation} — Dispo: {m.currentStock} {m.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {mvtType === 'EXIT' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Chantier bénéficiaire *
                    </label>
                    <select
                      value={mvtProjectId}
                      onChange={(e) => {
                        setMvtProjectId(e.target.value);
                        const proj = projects.find((p) => p.id === e.target.value);
                        if (proj?.managerName) setMvtRecipient(proj.managerName);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      required
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {mvtType === 'ADJUSTMENT' ? 'Nouveau stock réel *' : 'Quantité *'} (
                      {selectedModalMaterial?.unit || 'Unité'})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={mvtQuantity}
                      onChange={(e) => setMvtQuantity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {mvtType === 'ENTRY' ? 'Fournisseur / N° BL' : 'Récepteur / Chef d’équipe'}
                    </label>
                    <input
                      type="text"
                      value={mvtRecipient}
                      onChange={(e) => setMvtRecipient(e.target.value)}
                      placeholder={mvtType === 'ENTRY' ? 'Ex: CIMENCAM BL #441' : 'Ex: Chef Maçon Kamga'}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Saisie manuelle du Prix Unitaire (Directeur / Chef de chantier) */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-orange-300">
                      Prix Unitaire réel — P.U. (FCFA) *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Dernier P.U. : {selectedModalMaterial ? formatXAF(selectedModalMaterial.unitPriceXAF) : '-'}
                    </span>
                  </div>

                  {canEditPrice ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={mvtUnitPrice}
                        onChange={(e) => setMvtUnitPrice(e.target.value)}
                        placeholder={`Saisir le prix négocié en FCFA (ex: ${selectedModalMaterial?.unitPriceXAF || 4900})`}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-orange-500/40 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        required
                      />
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mvtUpdateCatalogPrice}
                          onChange={(e) => setMvtUpdateCatalogPrice(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-orange-500"
                        />
                        <span>Mettre à jour le P.U. de référence du catalogue avec ce prix</span>
                      </label>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Saisie du P.U. réservée au Directeur Général ou Chef de chantier (P.U. appliqué :{' '}
                        <strong className="text-slate-200 font-mono">
                          {selectedModalMaterial ? formatXAF(selectedModalMaterial.unitPriceXAF) : '-'}
                        </strong>
                        ).
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Observation / Affectation technique
                  </label>
                  <input
                    type="text"
                    value={mvtNotes}
                    onChange={(e) => setMvtNotes(e.target.value)}
                    placeholder="Ex: Coulage poutres plancher haut R+2..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {selectedModalMaterial && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Valorisation ({mvtQuantity || 0} ×{' '}
                      {effectiveUnitPrice.toLocaleString('fr-FR')} FCFA) :
                    </span>
                    <span className="font-extrabold font-mono text-orange-400">
                      {formatXAF(estimatedMovementValue)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : 'Valider le mouvement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2 : AJOUTER UN MATÉRIAU AU CATALOGUE */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Nouveau Matériau au Catalogue Dépôt
                </h2>
                <p className="text-xs text-slate-400">
                  Créez une référence avec seuil d’alerte rupture et prix unitaire FCFA.
                </p>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Référence (optionnel)
                    </label>
                    <input
                      type="text"
                      value={newMatForm.reference}
                      onChange={(e) => setNewMatForm({ ...newMatForm, reference: e.target.value })}
                      placeholder="MAT-FER-HA10"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Désignation complète *
                    </label>
                    <input
                      type="text"
                      value={newMatForm.designation}
                      onChange={(e) => setNewMatForm({ ...newMatForm, designation: e.target.value })}
                      placeholder="Ex: Fer à béton HA 10mm (Barre 12m)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Catégorie BTP *
                    </label>
                    <select
                      value={newMatForm.category}
                      onChange={(e) =>
                        setNewMatForm({ ...newMatForm, category: e.target.value as MaterialCategory })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Unité de mesure *
                    </label>
                    <input
                      type="text"
                      value={newMatForm.unit}
                      onChange={(e) => setNewMatForm({ ...newMatForm, unit: e.target.value })}
                      placeholder="Sac 50kg, Barre 12m, m³..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Stock Initial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newMatForm.currentStock}
                      onChange={(e) => setNewMatForm({ ...newMatForm, currentStock: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Seuil Alerte *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMatForm.minimumStockAlert}
                      onChange={(e) =>
                        setNewMatForm({ ...newMatForm, minimumStockAlert: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      P.U. FCFA (Saisi) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newMatForm.unitPriceXAF}
                      onChange={(e) => setNewMatForm({ ...newMatForm, unitPriceXAF: e.target.value })}
                      placeholder="Saisir P.U."
                      disabled={!canEditPrice}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-orange-500 disabled:opacity-50"
                      required={canEditPrice}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Fournisseur principal
                    </label>
                    <input
                      type="text"
                      value={newMatForm.supplierName}
                      onChange={(e) => setNewMatForm({ ...newMatForm, supplierName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Emplacement / Dépôt
                    </label>
                    <input
                      type="text"
                      value={newMatForm.depotLocation}
                      onChange={(e) => setNewMatForm({ ...newMatForm, depotLocation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  {submitting ? 'Création...' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : MODIFIER LE P.U. CATALOGUE (DIRECTEUR / CHEF DE CHANTIER) */}
      {editingPriceMat && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Saisir le Prix Unitaire (P.U.)
                </h2>
                <p className="text-xs text-slate-400">
                  {editingPriceMat.designation} · {editingPriceMat.unit}
                </p>
              </div>
              <button
                onClick={() => setEditingPriceMat(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCatalogPrice} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}
                <div className="text-xs text-slate-400">
                  P.U. actuel enregistré :{' '}
                  <strong className="text-white font-mono">
                    {formatXAF(editingPriceMat.unitPriceXAF)}
                  </strong>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nouveau Prix Unitaire en FCFA *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editPriceValue}
                    onChange={(e) => setEditPriceValue(e.target.value)}
                    placeholder={`Saisir le nouveau P.U. (ex: ${editingPriceMat.unitPriceXAF})`}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-orange-500/40 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingPriceMat(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer le P.U.'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
