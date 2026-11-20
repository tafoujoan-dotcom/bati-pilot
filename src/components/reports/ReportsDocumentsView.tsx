import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../utils/permissions';
import {
  SystemGeneratedDocument,
  VaultDocumentCategory,
  VaultDocumentRecord,
} from '../../types';
import {
  AlertOctagon,
  Archive,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

interface ReportsOverviewResponse {
  projects: { id: string; code: string; name: string; city: string }[];
  executiveSummary: {
    activeProjectsCount: number;
    totalProjectsCount: number;
    avgProgressPct: number;
    totalBudgetAllocatedXAF: number;
    totalBudgetSpentXAF: number;
    budgetExecutionPct: number;
    totalOrdersCount: number;
    totalOrdersTTCXAF: number;
    totalDeliveriesCount: number;
    disputeDeliveriesCount: number;
    totalPayrollPaidXAF: number;
    totalExpensesPaidXAF: number;
    stockValuationXAF: number;
    criticalStockCount: number;
    suppliersCount: number;
    supplierConformityPct: number;
  };
  vaultDocuments: VaultDocumentRecord[];
  systemDocuments: SystemGeneratedDocument[];
}

const VAULT_CATEGORY_LABELS: Record<VaultDocumentCategory, string> = {
  MARCHE_OS: 'Marchés & Ordres de Service',
  TECHNIQUE_PLANS: 'Plans Béton Armé & Topographie',
  CONTROLE_LABOGENIE: 'PV Labogénie & Contrôles Qualité',
  FACTURE_FOURNISSEUR: 'Factures & Bordereaux Fournisseurs',
  ADMINISTRATIF_CNPS: 'CNPS, DGI & Assurances Chantier',
};

export const ReportsDocumentsView: React.FC = () => {
  const { user, company } = useAuth();

  const [data, setData] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Novembre 2026');
  const [activeTab, setActiveTab] = useState<'VAULT' | 'SYSTEM'>('VAULT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modale d'archivage pièce justificative
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    title: '',
    reference: '',
    category: 'CONTROLE_LABOGENIE' as VaultDocumentCategory,
    projectId: 'NONE',
    documentDate: '2026-11-19',
    fileName: '',
    mimeType: 'application/pdf',
    fileSizeKB: 180,
    dataBase64: '',
    notes: '',
  });

  const canArchive =
    user?.role &&
    ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);
  const canDelete =
    user?.role && ['DIRECTOR', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const fetchOverview = async () => {
    if (!company) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/reports/overview?companyId=${encodeURIComponent(company.id)}&projectId=${encodeURIComponent(
          selectedProjectId
        )}`
      );
      if (!res.ok) throw new Error('Erreur lors du chargement du centre documentaire.');
      const json: ReportsOverviewResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, selectedProjectId]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux (max 4 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDocForm((prev) => ({
        ...prev,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileSizeKB: Math.max(1, Math.round(file.size / 1024)),
        dataBase64: typeof reader.result === 'string' ? reader.result : '',
      }));
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setSubmitting(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/reports/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          uploadedByName: `${user.firstName} ${user.lastName}`,
          ...docForm,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Archivage refusé.');

      setShowUploadModal(false);
      setDocForm({
        title: '',
        reference: '',
        category: 'CONTROLE_LABOGENIE',
        projectId: 'NONE',
        documentDate: '2026-11-19',
        fileName: '',
        mimeType: 'application/pdf',
        fileSizeKB: 180,
        dataBase64: '',
        notes: '',
      });
      await fetchOverview();
      showToast(json.message);
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors de l’archivage.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArchive = async (docId: string) => {
    if (!company || !user || !canDelete) return;
    try {
      const res = await fetch(
        `/api/reports/documents/${encodeURIComponent(docId)}?companyId=${encodeURIComponent(
          company.id
        )}&userRole=${encodeURIComponent(user.role)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Suppression refusée.');
      await fetchOverview();
      showToast(json.message);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredVault = useMemo(() => {
    if (!data) return [];
    return data.vaultDocuments.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.reference.toLowerCase().includes(q) ||
          (d.projectName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, categoryFilter, searchQuery]);

  const filteredSystem = useMemo(() => {
    if (!data) return [];
    return data.systemDocuments.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.reference.toLowerCase().includes(q) ||
          d.projectOrEntity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, categoryFilter, searchQuery]);

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

  const encodedCompany = encodeURIComponent(company?.id || 'comp_socabat_01');
  const encodedProject = encodeURIComponent(selectedProjectId);
  const encodedPeriod = encodeURIComponent(selectedPeriod);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Module 11 (Étape 15 / 18) */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="text-orange-400 font-semibold">Rapports Direction & Centre Documentaire</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-medium">{company?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-orange-400 shrink-0" />
            <span>Rapports Direction Générale & Coffre-Fort BTP</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Édition consolidée des bilans mensuels (PDF / Word / Export OHADA) et archivage centralisé des pièces de chantiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/executive-monthly/pdf?companyId=${encodedCompany}&projectId=${encodedProject}&period=${encodedPeriod}`}
            download={`Rapport_Direction_${selectedPeriod.replace(/\s+/g, '_')}.pdf`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Rapport Direction PDF</span>
          </a>

          <a
            href={`/api/reports/executive-monthly/docx?companyId=${encodedCompany}&projectId=${encodedProject}&period=${encodedPeriod}`}
            download={`Rapport_Direction_${selectedPeriod.replace(/\s+/g, '_')}.docx`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rapport Word (.docx)</span>
          </a>

          <a
            href={`/api/reports/accounting-export.csv?companyId=${encodedCompany}&projectId=${encodedProject}`}
            download="Grand_Livre_BATI-PILOT.csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Comptable CSV</span>
          </a>
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

      {/* Filtre Périmètre Chantier & Période Rapport */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Périmètre Chantier
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tous les chantiers de l’entreprise</option>
              {data?.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Période du Rapport Mensuel
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="Novembre 2026">Novembre 2026</option>
              <option value="Octobre 2026">Octobre 2026</option>
              <option value="T4 2026 Consolidé">T4 2026 Consolidé</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOverview}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canArchive && (
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setShowUploadModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Archiver une pièce</span>
            </button>
          )}
        </div>
      </div>

      {/* Synthèse KPI Exécutive */}
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
              <span className="text-xs text-slate-400">Exécution Budgétaire</span>
              <p className="text-2xl font-black text-white mt-1.5 tabular-nums">
                {data.executiveSummary.budgetExecutionPct} %
              </p>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {formatFCFA(data.executiveSummary.totalBudgetSpentXAF)} /{' '}
                {formatFCFA(data.executiveSummary.totalBudgetAllocatedXAF)}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400">Avancement Physique Moyen</span>
              <p className="text-2xl font-black text-emerald-400 mt-1.5 tabular-nums">
                {data.executiveSummary.avgProgressPct} %
              </p>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {data.executiveSummary.activeProjectsCount} chantier(s) actif(s) ·{' '}
                {data.executiveSummary.totalOrdersCount} BC
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400">Stock Dépôt & Paie Réglée</span>
              <p className="text-xl font-black text-orange-400 mt-1.5 tabular-nums">
                {formatFCFA(data.executiveSummary.stockValuationXAF)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                Paie : {formatFCFA(data.executiveSummary.totalPayrollPaidXAF)} ·{' '}
                {data.executiveSummary.criticalStockCount} alerte(s) stock
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400">Documents Centralisés</span>
              <p className="text-2xl font-black text-sky-400 mt-1.5 tabular-nums">
                {data.vaultDocuments.length + data.systemDocuments.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {data.vaultDocuments.length} archive(s) coffre-fort ·{' '}
                {data.systemDocuments.length} pièce(s) PDF générée(s)
              </p>
            </div>
          </div>

          {/* Centre Documentaire Unifié */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('VAULT');
                    setCategoryFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeTab === 'VAULT'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Coffre-Fort Pièces Justificatives ({data.vaultDocuments.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SYSTEM');
                    setCategoryFilter('ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeTab === 'SYSTEM'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Documents PDF Opérationnels ({data.systemDocuments.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher référence, titre..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Toutes catégories</option>
                  {activeTab === 'VAULT'
                    ? Object.entries(VAULT_CATEGORY_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))
                    : [
                        ['BON_COMMANDE', 'Bons de Commande'],
                        ['BON_LIVRAISON', 'Bons de Livraison'],
                        ['PAIE_OUVRIER', 'Bulletins de Paie'],
                        ['FICHE_FOURNISSEUR', 'Fiches Fournisseurs'],
                        ['FACTURE_SAAS', 'Factures SaaS'],
                      ].map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            {activeTab === 'VAULT' ? (
              filteredVault.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    Aucune pièce justificative archivée pour ce filtre
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 pr-3 font-semibold">Référence & Titre</th>
                        <th className="py-2.5 px-3 font-semibold">Catégorie</th>
                        <th className="py-2.5 px-3 font-semibold">Chantier</th>
                        <th className="py-2.5 px-3 font-semibold">Date & Auteur</th>
                        <th className="py-2.5 px-3 font-semibold">Fichier</th>
                        <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredVault.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-950/60">
                          <td className="py-3 pr-3">
                            <p className="font-bold text-white">{doc.title}</p>
                            <p className="text-[11px] font-mono text-orange-400 mt-0.5">
                              {doc.reference}
                            </p>
                            {doc.notes && (
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {doc.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {VAULT_CATEGORY_LABELS[doc.category]}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                            {doc.projectName}
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-slate-200 tabular-nums">
                              {formatDate(doc.documentDate)}
                            </p>
                            <p className="text-[11px] text-slate-500">{doc.uploadedByName}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-400 tabular-nums">
                            {doc.fileName} ({doc.fileSizeKB} Ko)
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <a
                                href={`/api/reports/documents/${doc.id}/download?companyId=${encodedCompany}`}
                                download={doc.fileName}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                              >
                                <Download className="w-3 h-3 text-orange-400" />
                                <span>Télécharger</span>
                              </a>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteArchive(doc.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 cursor-pointer"
                                  title="Supprimer l’archive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredSystem.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Aucun document généré trouvé pour ce filtre
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 pr-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Référence & Libellé</th>
                      <th className="py-2.5 px-3 font-semibold">Chantier / Tiers</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Montant FCFA</th>
                      <th className="py-2.5 px-3 font-semibold">Statut</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredSystem.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-950/60">
                        <td className="py-3 pr-3 font-semibold text-orange-400 whitespace-nowrap">
                          {doc.categoryLabel}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-white">{doc.title}</p>
                          <p className="text-[11px] font-mono text-slate-500">{doc.reference}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-[200px] truncate">
                          {doc.projectOrEntity}
                        </td>
                        <td className="py-3 px-3 text-slate-300 tabular-nums whitespace-nowrap">
                          {formatDate(doc.date)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white tabular-nums whitespace-nowrap">
                          {doc.amountXAF !== undefined ? formatFCFA(doc.amountXAF) : '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {doc.statusLabel}
                        </td>
                        <td className="py-3 pl-3 text-right whitespace-nowrap">
                          <a
                            href={doc.downloadUrl}
                            download={`${doc.reference}.pdf`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                          >
                            <Download className="w-3 h-3 text-orange-400" />
                            <span>PDF</span>
                          </a>
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

      {/* Modale d'archivage pièce justificative */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Archiver une Pièce Justificative BTP
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitArchive} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Intitulé du document *
                </label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="Ex: PV Essai Béton Dalle R+3 Labogénie"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Référence officielle *
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.reference}
                    onChange={(e) => setDocForm({ ...docForm, reference: e.target.value })}
                    placeholder="Ex: LAB-2026-512"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date pièce *</label>
                  <input
                    type="date"
                    required
                    value={docForm.documentDate}
                    onChange={(e) => setDocForm({ ...docForm, documentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Catégorie *</label>
                  <select
                    value={docForm.category}
                    onChange={(e) =>
                      setDocForm({
                        ...docForm,
                        category: e.target.value as VaultDocumentCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {Object.entries(VAULT_CATEGORY_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Chantier lié</label>
                  <select
                    value={docForm.projectId}
                    onChange={(e) => setDocForm({ ...docForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="NONE">Siège Social / Transverse</option>
                    {data?.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Joindre un fichier (PDF, PNG, JPG, DOCX — optionnel)
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 hover:border-orange-500 text-slate-300 cursor-pointer">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>
                    {docForm.fileName
                      ? `${docForm.fileName} (${docForm.fileSizeKB} Ko)`
                      : 'Sélectionner un fichier depuis cet appareil'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
                    onChange={handleFilePick}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Observations</label>
                <textarea
                  rows={2}
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="Précisions pour la Direction ou le contrôle..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Archivage...' : 'Archiver la pièce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
