import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PayrollRecord,
  PayrollAdvance,
  PaymentMethod,
  Worker,
} from '../../types';
import {
  Coins,
  RefreshCw,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Smartphone,
  Banknote,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Wallet,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface PayrollProjectSummary {
  id: string;
  code: string;
  name: string;
  city: string;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  CASH: 'Espèces Caisse',
  BANK_TRANSFER: 'Virement Bancaire',
};

export const PayrollManagementView: React.FC = () => {
  const { company } = useAuth();

  const [projects, setProjects] = useState<PayrollProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<PayrollProjectSummary | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [advances, setAdvances] = useState<PayrollAdvance[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'bulletins' | 'advances' | 'channels'>('bulletins');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'APPROVED' | 'PAID'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modales
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState<boolean>(false);
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [editingBonusRecord, setEditingBonusRecord] = useState<PayrollRecord | null>(null);

  const [advanceForm, setAdvanceForm] = useState({
    workerId: '',
    amountXAF: 10000,
    reason: 'Acompte quinzaine chantier',
    paymentMethod: 'ORANGE_MONEY' as PaymentMethod,
  });

  const [payForm, setPayForm] = useState({
    paymentMethod: 'ORANGE_MONEY' as PaymentMethod,
    paymentReference: '',
  });

  const [bonusInput, setBonusInput] = useState<number>(0);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const fetchOverview = async (projectOverride?: string) => {
    setIsLoading(true);
    try {
      const companyId = company?.id || 'comp_socabat_01';
      const targetProj = projectOverride !== undefined ? projectOverride : selectedProjectId;
      const params = new URLSearchParams({ companyId });
      if (targetProj) params.set('projectId', targetProj);

      const res = await fetch(`/api/payroll/overview?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setSelectedProject(data.selectedProject || null);
        if (!selectedProjectId && data.selectedProject) {
          setSelectedProjectId(data.selectedProject.id);
        }
        setWorkers(data.workers || []);
        setPayrolls(data.payrolls || []);
        setAdvances(data.advances || []);
        setSummary(data.summary || {});

        if ((data.workers || []).length > 0 && !advanceForm.workerId) {
          setAdvanceForm((prev) => ({ ...prev, workerId: data.workers[0].id }));
        }
      }
    } catch (err) {
      console.error('Erreur chargement module paie:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, selectedProjectId]);

  // Synchroniser avec le pointage réel
  const handleSyncAttendance = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch('/api/payroll/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur synchronisation paie:', err);
    }
  };

  // Approuver 1 bulletin
  const handleApproveOne = async (payrollId: string) => {
    try {
      const res = await fetch(`/api/payroll/${payrollId}/approve`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur approbation bulletin:', err);
    }
  };

  // Tout approuver
  const handleApproveAll = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch('/api/payroll/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur approbation groupée:', err);
    }
  };

  // Payer tous les bulletins validés
  const handlePayAllApproved = async (method: PaymentMethod = 'ORANGE_MONEY') => {
    if (!selectedProject) return;
    try {
      const res = await fetch('/api/payroll/pay-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          paymentMethod: method,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur paiement groupé:', err);
    }
  };

  // Payer 1 bulletin
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord) return;
    try {
      const res = await fetch(`/api/payroll/${payingRecord.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payForm),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setPayingRecord(null);
        setPayForm({ paymentMethod: 'ORANGE_MONEY', paymentReference: '' });
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur décaissement bulletin:', err);
    }
  };

  // Ajuster prime
  const handleBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBonusRecord) return;
    try {
      const res = await fetch(`/api/payroll/${editingBonusRecord.id}/bonus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusXAF: bonusInput }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setEditingBonusRecord(null);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur mise à jour prime:', err);
    }
  };

  // Créer une avance / acompte
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !advanceForm.workerId) return;
    try {
      const res = await fetch('/api/payroll/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          ...advanceForm,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setIsAdvanceModalOpen(false);
        setAdvanceForm((prev) => ({
          ...prev,
          amountXAF: 10000,
          reason: 'Acompte quinzaine chantier',
        }));
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur création avance:', err);
    }
  };

  const filteredPayrolls =
    statusFilter === 'ALL' ? payrolls : payrolls.filter((p) => p.status === statusFilter);

  const paidByChannel = (method: PaymentMethod) => {
    const items = payrolls.filter((p) => p.status === 'PAID' && p.paymentMethod === method);
    return {
      count: items.length,
      totalXAF: items.reduce((s, p) => s + p.netPayXAF, 0),
    };
  };

  if (isLoading && !selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Chargement des états de paie & salaires...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          EN-TÊTE ÉTAPE 9 (MODULE 5 : PAIE & SALAIRES DES OUVRIERS)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold">Paie & Salaires</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedProject?.code || 'CH-2026'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-3xl">
              Paie des Ouvriers, Acomptes & Règlements Mobile Money
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Calcul automatique des bulletins de quinzaine depuis le pointage terrain, déduction des avances perçues, règlement par Orange Money / MTN MoMo / Caisse et génération des bulletins PDF en FCFA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                aria-label="Sélectionner le chantier"
                className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* 4 Indicateurs synthétiques de la paie */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Net total à payer (Période)</span>
              <Coins className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {(summary.totalNetXAF || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold text-orange-400">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              Brut : {(summary.totalGrossXAF || 0).toLocaleString('fr-FR')} F · {summary.totalBulletins || 0} bulletins
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Déjà décaissé (Payé)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {(summary.totalPaidXAF || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              {summary.paidCount || 0} bulletin(s) réglé(s) et imputé(s)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Reste à payer</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {(summary.remainingToPayXAF || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold text-amber-400">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              {summary.approvedCount || 0} validé(s) DG · {summary.draftCount || 0} brouillon(s)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Avances & Acomptes déduits</span>
              <Wallet className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {(summary.totalAdvancesXAF || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold text-sky-400">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              {advances.length} acompte(s) enregistré(s) sur ce chantier
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ONGLETS DE NAVIGATION & ACTIONS DU MODULE 5
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('bulletins')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'bulletins' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>États de Paie & Bulletins ({payrolls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advances')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'advances' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Avances & Acomptes ({advances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'channels' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Canaux Mobile Money & Caisse</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncAttendance}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span>Synchroniser Pointage</span>
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Accorder une avance</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ONGLET 1 : ÉTATS DE PAIE & BULLETINS PAR OUVRIER
         ========================================================================= */}
      {activeTab === 'bulletins' && (
        <div className="space-y-4">
          {/* Barre de filtres et actions groupées */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
              {([
                { id: 'ALL', label: `Tous (${payrolls.length})` },
                { id: 'DRAFT', label: `Brouillons (${summary.draftCount || 0})` },
                { id: 'APPROVED', label: `Validés DG (${summary.approvedCount || 0})` },
                { id: 'PAID', label: `Payés (${summary.paidCount || 0})` },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === f.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedProject && (
                <a
                  href={`/api/payroll/summary-pdf?companyId=${encodeURIComponent(company?.id || 'comp_socabat_01')}&projectId=${encodeURIComponent(selectedProject.id)}`}
                  download={`etat_paie_${selectedProject.code}.pdf`}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>PDF État de Paie</span>
                </a>
              )}

              {(summary.draftCount || 0) > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tout Approuver</span>
                </button>
              )}

              {(summary.approvedCount || 0) > 0 && (
                <button
                  onClick={() => handlePayAllApproved('ORANGE_MONEY')}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Payer Validés (Orange Money)</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Ouvrier & Métier</th>
                    <th className="py-3.5 px-3 text-right font-semibold">Jours / H.Sup</th>
                    <th className="py-3.5 px-3 text-right font-semibold">Base + H.Sup</th>
                    <th className="py-3.5 px-3 text-right font-semibold">Prime</th>
                    <th className="py-3.5 px-3 text-right font-semibold">Avances</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Net à payer</th>
                    <th className="py-3.5 px-3 font-semibold">Statut</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Actions & Bulletin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPayrolls.map((rec) => {
                    const basePlusOt = rec.basePayXAF + rec.overtimePayXAF;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{rec.workerName}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-300">{rec.workerMatricule}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{rec.specialtyLabel}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-300">
                          <div>{rec.daysWorked} j</div>
                          <div className="text-[10px] text-slate-500">+{rec.overtimeHours}h sup</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-200">
                          {basePlusOt.toLocaleString('fr-FR')} F
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {rec.status !== 'PAID' ? (
                            <button
                              onClick={() => {
                                setEditingBonusRecord(rec);
                                setBonusInput(rec.bonusXAF);
                              }}
                              className="text-sky-400 hover:underline cursor-pointer"
                              title="Modifier la prime de chantier"
                            >
                              {rec.bonusXAF > 0 ? `+${rec.bonusXAF.toLocaleString('fr-FR')} F` : '+ Prime'}
                            </button>
                          ) : (
                            <span className="text-slate-400">
                              {rec.bonusXAF > 0 ? `+${rec.bonusXAF.toLocaleString('fr-FR')} F` : '0 F'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-rose-400">
                          {rec.advancesDeductedXAF > 0
                            ? `-${rec.advancesDeductedXAF.toLocaleString('fr-FR')} F`
                            : '0 F'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-extrabold text-white">
                          {rec.netPayXAF.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3.5 px-3">
                          {rec.status === 'PAID' && (
                            <div>
                              <span className="font-semibold text-emerald-400">Payé</span>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                {rec.paymentReference}
                              </div>
                            </div>
                          )}
                          {rec.status === 'APPROVED' && (
                            <span className="font-semibold text-amber-400">Validé DG</span>
                          )}
                          {rec.status === 'DRAFT' && (
                            <span className="font-semibold text-slate-400">Brouillon</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => handleApproveOne(rec.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Approuver
                              </button>
                            )}
                            {rec.status !== 'PAID' && (
                              <button
                                onClick={() => {
                                  setPayingRecord(rec);
                                  setPayForm({ paymentMethod: 'ORANGE_MONEY', paymentReference: '' });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Payer
                              </button>
                            )}
                            <a
                              href={`/api/payroll/${encodeURIComponent(rec.id)}/payslip-pdf`}
                              download={`bulletin_paie_${rec.workerMatricule}.pdf`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                              title="Télécharger le bulletin de paie PDF"
                            >
                              <Download className="w-3 h-3 text-orange-400" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ONGLET 2 : REGISTRE DES AVANCES & ACOMPTES
         ========================================================================= */}
      {activeTab === 'advances' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Historique des Avances & Acomptes sur Chantier
              </h2>
              <p className="text-xs text-slate-400">
                Tout acompte versé en cours de quinzaine est automatiquement retenu sur le net à payer de l'ouvrier.
              </p>
            </div>
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvel acompte</span>
            </button>
          </div>

          {advances.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Aucune avance enregistrée sur ce chantier</p>
              <p className="text-xs text-slate-500">
                Cliquez sur « Accorder une avance » lorsqu'un ouvrier demande un acompte.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {advances.map((adv) => (
                <div
                  key={adv.id}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/40"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">{adv.workerName}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono tabular-nums">
                        {new Date(adv.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{PAYMENT_METHOD_LABELS[adv.paymentMethod]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300">{adv.reason}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-base font-extrabold text-rose-400">
                      -{adv.amountXAF.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-[11px] text-emerald-400 font-sans">
                      {adv.deductedInPayrollId ? 'Déduit du bulletin en cours' : 'En attente de déduction'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ONGLET 3 : VENTILATION DES PAIEMENTS MOBILE MONEY & CAISSE
         ========================================================================= */}
      {activeTab === 'channels' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { id: 'ORANGE_MONEY', label: 'Orange Money CM', icon: Smartphone, accent: 'text-orange-400' },
              { id: 'MTN_MOMO', label: 'MTN Mobile Money', icon: Smartphone, accent: 'text-amber-400' },
              { id: 'CASH', label: 'Espèces Caisse Chantier', icon: Banknote, accent: 'text-emerald-400' },
              { id: 'BANK_TRANSFER', label: 'Virement Bancaire', icon: Building2, accent: 'text-sky-400' },
            ] as const).map((ch) => {
              const Icon = ch.icon;
              const stats = paidByChannel(ch.id);
              return (
                <div key={ch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{ch.label}</span>
                    <Icon className={`w-4 h-4 ${ch.accent}`} />
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {stats.totalXAF.toLocaleString('fr-FR')} <span className="text-xs text-slate-400">FCFA</span>
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {stats.count} transaction(s) confirmée(s)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
              <h2 className="text-sm font-bold text-white">Journal des Règlements Confirmés</h2>
              <p className="text-xs text-slate-400">
                Traçabilité des références Orange Money, MTN MoMo et bordereaux de caisse.
              </p>
            </div>
            <div className="divide-y divide-slate-800">
              {payrolls.filter((p) => p.status === 'PAID').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Aucun décaissement effectué pour le moment sur ce chantier.
                </div>
              ) : (
                payrolls
                  .filter((p) => p.status === 'PAID')
                  .map((p) => (
                    <div
                      key={`tx_${p.id}`}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{p.workerName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-emerald-400">{p.paymentReference}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{p.paymentMethod ? PAYMENT_METHOD_LABELS[p.paymentMethod] : '-'}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono">{p.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono tabular-nums font-bold text-white text-sm">
                          {p.netPayXAF.toLocaleString('fr-FR')} FCFA
                        </span>
                        <a
                          href={`/api/payroll/${encodeURIComponent(p.id)}/payslip-pdf`}
                          download={`bulletin_paie_${p.workerMatricule}.pdf`}
                          className="text-orange-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Reçu PDF</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1 : ACCORDER UNE AVANCE / ACOMPTE
         ========================================================================= */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Accorder une Avance sur Salaire</h2>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdvanceSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ouvrier bénéficiaire *</label>
                  <select
                    value={advanceForm.workerId}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, workerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                    required
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} ({w.matricule} · {w.specialtyLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Montant de l'avance (FCFA) *
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={advanceForm.amountXAF}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, amountXAF: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Mode de versement</label>
                    <select
                      value={advanceForm.paymentMethod}
                      onChange={(e) =>
                        setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value as PaymentMethod })
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                    >
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="MTN_MOMO">MTN MoMo</option>
                      <option value="CASH">Espèces Caisse</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Motif de l'acompte *</label>
                  <input
                    type="text"
                    value={advanceForm.reason}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                    placeholder="Ex: Transport chantier ou urgence familiale"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold cursor-pointer"
                >
                  Enregistrer & Déduire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2 : RÉGLER UN SALAIRE (ORANGE MONEY / MOMO / CAISSE)
         ========================================================================= */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Régler le Salaire</h2>
              <button
                type="button"
                onClick={() => setPayingRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-sm">{payingRecord.workerName}</div>
                  <div className="text-slate-400">
                    {payingRecord.workerMatricule} · {payingRecord.phone}
                  </div>
                  <div className="text-lg font-extrabold text-orange-400 font-mono tabular-nums pt-1">
                    Net à décaisser : {payingRecord.netPayXAF.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Canal de paiement *</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                  >
                    <option value="ORANGE_MONEY">Orange Money Cameroun</option>
                    <option value="MTN_MOMO">MTN Mobile Money (MoMo)</option>
                    <option value="CASH">Espèces (Caisse Chantier)</option>
                    <option value="BANK_TRANSFER">Virement Bancaire</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    N° Transaction / Référence (Optionnel — auto-généré sinon)
                  </label>
                  <input
                    type="text"
                    value={payForm.paymentReference}
                    onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                    placeholder="Ex: OM-CM-987654"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Confirmer le paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3 : AJUSTER PRIME DE CHANTIER
         ========================================================================= */}
      {editingBonusRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Prime Rendement / Panier</h2>
              <button
                type="button"
                onClick={() => setEditingBonusRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBonusSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-3">
                <p className="text-slate-300">
                  Ouvrier : <strong className="text-white">{editingBonusRecord.workerName}</strong>
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Montant de la prime (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={bonusInput}
                    onChange={(e) => setBonusInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBonusRecord(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold cursor-pointer"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
