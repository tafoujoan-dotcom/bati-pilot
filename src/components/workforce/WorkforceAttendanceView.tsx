import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Worker,
  AttendanceRecord,
  AttendanceStatus,
  WorkerSpecialty,
  WorkerContractType,
} from '../../types';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Search,
  Check,
  X,
  FileText,
  Download,
  Lock,
  ShieldCheck,
  Phone,
  SlidersHorizontal,
  Coins,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';

interface WorkforceProjectSummary {
  id: string;
  code: string;
  name: string;
  city: string;
  managerName?: string;
}

interface WeeklyRow {
  worker: Worker;
  dayStatuses: {
    date: string;
    status: AttendanceStatus | null;
    overtimeHours: number;
    amountEarnedXAF: number;
    isValidated: boolean;
  }[];
  daysWorked: number;
  overtimeTotal: number;
  totalEarnedXAF: number;
}

const SPECIALTY_OPTIONS: { value: WorkerSpecialty; label: string }[] = [
  { value: 'CHEF_EQUIPE', label: "Chef d'équipe BTP" },
  { value: 'MACON', label: 'Maçon Qualifié' },
  { value: 'FERRAILLEUR', label: 'Ferrailleur HA' },
  { value: 'COFFREUR', label: 'Coffreur Boiseur' },
  { value: 'MANOEUVRE', label: 'Manœuvre Journalier' },
  { value: 'ELECTRICIEN', label: 'Électricien Bâtiment' },
  { value: 'PLOMBIER', label: 'Plombier Sanitaire' },
  { value: 'CARRELEUR', label: 'Carreleur Faïencier' },
];

export const WorkforceAttendanceView: React.FC = () => {
  const { user, company, token } = useAuth();
  const canDeleteWorker =
    user?.role === 'DIRECTOR' || user?.role === 'SITE_MANAGER' || user?.role === 'SUPER_ADMIN';

  const [projects, setProjects] = useState<WorkforceProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<WorkforceProjectSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<{ days: string[]; rows: WeeklyRow[] }>({
    days: [],
    rows: [],
  });
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'daily' | 'directory' | 'weekly'>('daily');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [isDeletingWorker, setIsDeletingWorker] = useState<boolean>(false);

  // Modal embauche ouvrier
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState<boolean>(false);
  const [workerForm, setWorkerForm] = useState({
    fullName: '',
    phone: '+237 6',
    specialty: 'MACON' as WorkerSpecialty,
    contractType: 'JOURNALIER' as WorkerContractType,
    dailyRateXAF: 7500,
    cniNumber: '',
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const fetchOverview = async (projectOverride?: string, dateOverride?: string) => {
    setIsLoading(true);
    try {
      const companyId = company?.id || 'comp_socabat_01';
      const targetProj = projectOverride !== undefined ? projectOverride : selectedProjectId;
      const targetDate = dateOverride !== undefined ? dateOverride : selectedDate;

      const params = new URLSearchParams({ companyId, date: targetDate });
      if (targetProj) params.set('projectId', targetProj);

      const res = await fetch(`/api/workforce/overview?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setSelectedProject(data.selectedProject || null);
        if (!selectedProjectId && data.selectedProject) {
          setSelectedProjectId(data.selectedProject.id);
        }
        setWorkers(data.workers || []);
        setAttendance(data.attendance || []);
        setWeeklySummary(data.weeklySummary || { days: [], rows: [] });
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Erreur chargement personnel et pointage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, selectedProjectId, selectedDate]);

  // Pointer un ouvrier individuellement
  const handleMarkAttendance = async (
    workerId: string,
    status: AttendanceStatus,
    overtimeHours?: number
  ) => {
    if (!selectedProject) return;
    const existing = attendance.find((a) => a.workerId === workerId);
    const nextOvertime = overtimeHours !== undefined ? overtimeHours : existing?.overtimeHours || 0;

    try {
      const res = await fetch('/api/workforce/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          workerId,
          date: selectedDate,
          status,
          overtimeHours: status === 'ABSENT' ? 0 : nextOvertime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur enregistrement pointage:', err);
    }
  };

  // Appel du matin en 1 clic
  const handleBulkPresent = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch('/api/workforce/attendance/bulk-present', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur appel collectif:', err);
    }
  };

  // Clôturer et valider la feuille du jour
  const handleValidateDay = async () => {
    if (!selectedProject) return;
    const validatorName = user
      ? `${user.firstName} ${user.lastName}`
      : selectedProject.managerName || 'Ing. Paul Ndongo';

    try {
      const res = await fetch('/api/workforce/attendance/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          date: selectedDate,
          validatorName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur validation feuille:', err);
    }
  };

  // Embaucher / Ajouter un ouvrier
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !workerForm.fullName.trim()) return;
    try {
      const res = await fetch('/api/workforce/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          projectId: selectedProject.id,
          ...workerForm,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setIsWorkerModalOpen(false);
        setWorkerForm({
          fullName: '',
          phone: '+237 6',
          specialty: 'MACON',
          contractType: 'JOURNALIER',
          dailyRateXAF: 7500,
          cniNumber: '',
        });
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur ajout ouvrier:', err);
    }
  };

  // Activer / Désaffecter un ouvrier
  const handleToggleWorker = async (workerId: string) => {
    try {
      const res = await fetch(`/api/workforce/workers/${workerId}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur bascule statut ouvrier:', err);
    }
  };

  // Supprimer définitivement un ouvrier (Directeur & Chef de chantier uniquement)
  const handleConfirmDeleteWorker = async () => {
    if (!workerToDelete) return;
    setIsDeletingWorker(true);
    try {
      const headers: Record<string, string> = {
        'x-user-role': user?.role || '',
        'x-company-id': company?.id || '',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/workforce/workers/${encodeURIComponent(workerToDelete.id)}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        showNotice(data.message || 'Ouvrier supprimé du chantier.');
        setWorkerToDelete(null);
        await fetchOverview();
      } else {
        showNotice(data.error || 'Suppression refusée.');
        setWorkerToDelete(null);
      }
    } catch (err) {
      console.error('Erreur suppression ouvrier:', err);
    } finally {
      setIsDeletingWorker(false);
    }
  };

  // Export CSV de la feuille hebdomadaire pour la comptabilité / paie
  const handleExportWeeklyCsv = () => {
    if (!selectedProject || weeklySummary.rows.length === 0) return;
    const headers = [
      'Matricule',
      'Nom Complet',
      'Corps de Metier',
      'Contrat',
      'Taux Journalier (FCFA)',
      ...weeklySummary.days,
      'Jours Travailles',
      'Heures Supp',
      'Total Gagne (FCFA)',
    ];

    const lines = [headers.join(';')];
    weeklySummary.rows.forEach((row) => {
      const dayCells = row.dayStatuses.map((d) => {
        if (d.status === 'PRESENT') return 'P';
        if (d.status === 'HALF_DAY') return '0.5';
        if (d.status === 'LATE') return 'R';
        if (d.status === 'ABSENT') return 'A';
        return '-';
      });
      lines.push(
        [
          row.worker.matricule,
          `"${row.worker.fullName}"`,
          `"${row.worker.specialtyLabel}"`,
          row.worker.contractType,
          row.worker.dailyRateXAF,
          ...dayCells,
          row.daysWorked,
          row.overtimeTotal,
          row.totalEarnedXAF,
        ].join(';')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointage_${selectedProject.code}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Feuille hebdomadaire exportée au format CSV pour la paie.');
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      !searchQuery.trim() ||
      w.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.specialtyLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = specialtyFilter === 'ALL' || w.specialty === specialtyFilter;
    return matchesSearch && matchesSpec;
  });

  const activeFilteredWorkers = filteredWorkers.filter((w) => w.isActive);

  const contractLabels: Record<WorkerContractType, string> = {
    JOURNALIER: 'Journalier',
    TACHERON: 'Tâcheron',
    MENSUEL: 'Mensuel',
  };

  const statusConfig: Record<
    AttendanceStatus,
    { label: string; short: string; activeClass: string; textClass: string }
  > = {
    PRESENT: {
      label: 'Présent',
      short: 'P',
      activeClass: 'bg-emerald-600 text-white border-emerald-500',
      textClass: 'text-emerald-400',
    },
    HALF_DAY: {
      label: 'Demi-J',
      short: '½',
      activeClass: 'bg-sky-600 text-white border-sky-500',
      textClass: 'text-sky-400',
    },
    LATE: {
      label: 'Retard',
      short: 'R',
      activeClass: 'bg-amber-600 text-white border-amber-500',
      textClass: 'text-amber-400',
    },
    ABSENT: {
      label: 'Absent',
      short: 'A',
      activeClass: 'bg-rose-600 text-white border-rose-500',
      textClass: 'text-rose-400',
    },
  };

  if (isLoading && !selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Chargement du registre personnel & pointage...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          EN-TÊTE ÉTAPE 8 (MODULE 4 : PERSONNEL & POINTAGE QUOTIDIEN)
         ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold">Personnel & Pointage</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{selectedProject?.code || 'CH-2026'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight max-w-3xl">
              Gestion du Personnel & Pointage Quotidien
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Répertoire des maçons, ferrailleurs, coffreurs et manœuvres par chantier, appel du matin horodaté, suivi des heures supplémentaires et calcul automatique des gains journaliers en FCFA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sélecteur de chantier */}
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

            {/* Sélecteur de date de pointage */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Date de pointage"
                className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* 4 Indicateurs synthétiques du personnel & pointage */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Effectif présent du jour</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white tabular-nums">
              {summary.effectivePresentCount ?? 0}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {summary.totalActiveWorkers ?? 0} actifs
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
              {summary.presentCount || 0} pleines · {summary.halfDayCount || 0} demi-j · {summary.unmarkedCount || 0} non pointé(s)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Masse salariale du jour</span>
              <Coins className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
              {(summary.dailyPayrollXAF || 0).toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-semibold text-orange-400">FCFA</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
              Cumul 7 jours : {(summary.weeklyPayrollXAF || 0).toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Absences & Retards</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white tabular-nums">
              <span className={(summary.absentCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {summary.absentCount || 0}
              </span>{' '}
              <span className="text-sm font-normal text-slate-400">
                absent(s) · {summary.lateCount || 0} retard(s)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Décompte automatique sur la fiche du jour
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Validation feuille de paie</span>
              <ShieldCheck
                className={`w-3.5 h-3.5 ${summary.isDayValidated ? 'text-emerald-400' : 'text-slate-500'}`}
              />
            </div>
            <div
              className={`text-base font-bold mt-1 ${
                summary.isDayValidated ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {summary.isDayValidated ? 'Feuille validée & clôturée' : 'Pointage en cours de saisie'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              {summary.isDayValidated
                ? `Visée par ${summary.validatedBy || 'Chef de chantier'}`
                : 'Prête à être clôturée pour la comptabilité'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ONGLETS DE NAVIGATION & ACTIONS DU MODULE 4
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'daily' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pointage du jour ({summary.totalActiveWorkers || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'directory' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Répertoire des ouvriers ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'weekly' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Feuille hebdomadaire (7 jours)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsWorkerModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Embaucher un ouvrier</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BARRE DE RECHERCHE & FILTRES CORPS DE MÉTIER (POUR ONGLETS 1 & 2)
         ========================================================================= */}
      {activeTab !== 'weekly' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, matricule (SOC-...) ou métier..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              aria-label="Filtrer par corps de métier"
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 cursor-pointer focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Tous les corps de métier</option>
              {SPECIALTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* =========================================================================
          ONGLET 1 : FEUILLE D'APPEL & POINTAGE QUOTIDIEN
         ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Appel du {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-xs text-slate-400">
                Cliquez sur le statut de chaque ouvrier pour enregistrer la présence et calculer automatiquement le dû journalier en FCFA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedProject && (
                <a
                  href={`/api/workforce/daily-pdf?companyId=${encodeURIComponent(company?.id || 'comp_socabat_01')}&projectId=${encodeURIComponent(selectedProject.id)}&date=${encodeURIComponent(selectedDate)}`}
                  download={`pointage_jour_${selectedProject.code}_${selectedDate}.pdf`}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  title="Télécharger la feuille de pointage du jour au format PDF"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>PDF Pointage du jour</span>
                </a>
              )}

              <button
                onClick={handleBulkPresent}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pointer tous présents</span>
              </button>

              <button
                onClick={handleValidateDay}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  summary.isDayValidated
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                }`}
              >
                {summary.isDayValidated ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Feuille validée</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Valider la feuille</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {activeFilteredWorkers.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Aucun ouvrier actif trouvé sur ce filtre</p>
              <p className="text-xs text-slate-500">
                Ajoutez un nouvel ouvrier sur ce chantier ou modifiez votre recherche.
              </p>
              <button
                onClick={() => setIsWorkerModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer"
              >
                Embaucher un ouvrier
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {activeFilteredWorkers.map((worker) => {
                const record = attendance.find((a) => a.workerId === worker.id);
                const currentStatus = record?.status;
                const overtime = record?.overtimeHours || 0;
                const earned = record?.amountEarnedXAF || 0;

                return (
                  <div
                    key={worker.id}
                    className="p-4 sm:px-5 hover:bg-slate-950/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Identité & Métadata sans pilules */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {worker.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{worker.fullName}</span>
                          {record?.isValidated && (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Visé
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-slate-300 tabular-nums">{worker.matricule}</span>
                          <span aria-hidden="true">·</span>
                          <span>{worker.specialtyLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{contractLabels[worker.contractType]}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-300">
                            {worker.dailyRateXAF.toLocaleString('fr-FR')} FCFA/j
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contrôles de pointage & Heures Supp */}
                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 shrink-0">
                      {/* Boutons segmentés de statut */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {(['PRESENT', 'HALF_DAY', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((st) => {
                          const cfg = statusConfig[st];
                          const isSelected = currentStatus === st;
                          return (
                            <button
                              key={st}
                              onClick={() => handleMarkAttendance(worker.id, st)}
                              className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? cfg.activeClass
                                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                              }`}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Sélecteur Heures Supp */}
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500">H.Supp :</span>
                        <select
                          value={overtime}
                          disabled={!currentStatus || currentStatus === 'ABSENT'}
                          onChange={(e) =>
                            handleMarkAttendance(
                              worker.id,
                              currentStatus || 'PRESENT',
                              Number(e.target.value)
                            )
                          }
                          aria-label={`Heures supplémentaires pour ${worker.fullName}`}
                          className="bg-slate-950 border border-slate-800 disabled:opacity-40 text-slate-200 rounded-lg px-2 py-1.5 font-mono tabular-nums cursor-pointer focus:outline-none focus:border-orange-500"
                        >
                          <option value={0}>0h</option>
                          <option value={1}>+1h</option>
                          <option value={2}>+2h</option>
                          <option value={3}>+3h</option>
                          <option value={4}>+4h</option>
                        </select>
                      </div>

                      {/* Montant dû du jour */}
                      <div className="w-28 text-right font-mono tabular-nums">
                        <div className={`text-sm font-bold ${earned > 0 ? 'text-white' : 'text-slate-500'}`}>
                          {earned.toLocaleString('fr-FR')} F
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {record?.checkInTime ? `Arrivée ${record.checkInTime}` : currentStatus ? 'Absent' : 'À pointer'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ONGLET 2 : RÉPERTOIRE COMPLET DES OUVRIERS & TÂCHERONS
         ========================================================================= */}
      {activeTab === 'directory' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Répertoire Nominatif des Ouvriers & Tâcherons
              </h2>
              <p className="text-xs text-slate-400">
                Liste complète du personnel affecté au chantier, contrats, numéros CNI et taux journaliers en FCFA.
              </p>
            </div>

            {selectedProject && (
              <a
                href={`/api/workforce/directory-pdf?companyId=${encodeURIComponent(company?.id || 'comp_socabat_01')}&projectId=${encodeURIComponent(selectedProject.id)}`}
                download={`repertoire_ouvriers_${selectedProject.code}.pdf`}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                title="Télécharger le répertoire complet des ouvriers en PDF"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>PDF Répertoire des ouvriers</span>
              </a>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Matricule & Ouvrier</th>
                  <th className="py-3.5 px-4 font-semibold">Corps de métier</th>
                  <th className="py-3.5 px-4 font-semibold">Contrat</th>
                  <th className="py-3.5 px-4 font-semibold">Téléphone</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Taux journalier</th>
                  <th className="py-3.5 px-4 font-semibold">Situation</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{w.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {w.matricule}
                        {w.cniNumber ? ` · CNI ${w.cniNumber}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{w.specialtyLabel}</td>
                    <td className="py-3 px-4 text-slate-300">{contractLabels[w.contractType]}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {w.phone}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-white">
                      {w.dailyRateXAF.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${w.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {w.isActive ? 'Actif sur site' : 'En pause'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleWorker(w.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
                        >
                          {w.isActive ? (
                            <>
                              <UserX className="w-3 h-3 text-amber-400" />
                              <span>Désaffecter</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Réactiver</span>
                            </>
                          )}
                        </button>

                        {canDeleteWorker && (
                          <button
                            onClick={() => setWorkerToDelete(w)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/70 text-red-300 text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1"
                            title="Supprimer définitivement cet ouvrier"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          ONGLET 3 : FEUILLE HEBDOMADAIRE (CUMUL 7 JOURS & EXPORT CSV PAIE)
         ========================================================================= */}
      {activeTab === 'weekly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Récapitulatif Hebdomadaire de Main d'Œuvre (7 jours glissants)
              </h2>
              <p className="text-xs text-slate-400">
                Légende : <strong className="text-emerald-400">P</strong> = Présent ·{' '}
                <strong className="text-sky-400">½</strong> = Demi-journée ·{' '}
                <strong className="text-amber-400">R</strong> = Retard ·{' '}
                <strong className="text-rose-400">A</strong> = Absent
              </p>
            </div>

            <button
              onClick={handleExportWeeklyCsv}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Exporter CSV Paie</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ouvrier</th>
                  {weeklySummary.days.map((d) => (
                    <th key={d} className="py-3 px-2 text-center font-mono tabular-nums font-semibold">
                      {new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: '2-digit',
                      })}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right font-semibold">Jours</th>
                  <th className="py-3 px-3 text-right font-semibold">H.Supp</th>
                  <th className="py-3 px-4 text-right font-semibold">Total semaine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {weeklySummary.rows.map((row) => (
                  <tr key={row.worker.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{row.worker.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {row.worker.matricule} · {row.worker.specialtyLabel}
                      </div>
                    </td>
                    {row.dayStatuses.map((ds) => {
                      const cfg = ds.status ? statusConfig[ds.status] : null;
                      return (
                        <td key={ds.date} className="py-3 px-2 text-center font-mono tabular-nums">
                          {cfg ? (
                            <span className={`font-bold ${cfg.textClass}`}>{cfg.short}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-200">
                      {row.daysWorked} j
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-400">
                      {row.overtimeTotal}h
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-orange-400">
                      {row.totalEarnedXAF.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 border-t border-slate-800 font-bold text-xs">
                <tr>
                  <td colSpan={weeklySummary.days.length + 3} className="py-3.5 px-4 text-slate-300">
                    Total masse salariale hebdomadaire du chantier
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm text-white">
                    {(summary.weeklyPayrollXAF || 0).toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL : EMBAUCHER / AJOUTER UN OUVRIER SUR LE CHANTIER
         ========================================================================= */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Embaucher / Ajouter un Ouvrier BTP</h2>
              <button
                type="button"
                onClick={() => setIsWorkerModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nom & Prénom complet *</label>
                  <input
                    type="text"
                    value={workerForm.fullName}
                    onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })}
                    placeholder="Ex: Blaise Nkodo"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Corps de métier *</label>
                    <select
                      value={workerForm.specialty}
                      onChange={(e) =>
                        setWorkerForm({ ...workerForm, specialty: e.target.value as WorkerSpecialty })
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                    >
                      {SPECIALTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Type de contrat *</label>
                    <select
                      value={workerForm.contractType}
                      onChange={(e) =>
                        setWorkerForm({ ...workerForm, contractType: e.target.value as WorkerContractType })
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                    >
                      <option value="JOURNALIER">Journalier</option>
                      <option value="TACHERON">Tâcheron</option>
                      <option value="MENSUEL">Mensuel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Taux journalier (FCFA) *
                    </label>
                    <input
                      type="number"
                      min={1500}
                      step={500}
                      value={workerForm.dailyRateXAF}
                      onChange={(e) =>
                        setWorkerForm({ ...workerForm, dailyRateXAF: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Téléphone Mobile</label>
                    <input
                      type="text"
                      value={workerForm.phone}
                      onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                      placeholder="+237 6XX XX XX XX"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    N° CNI (Facultatif — recommandé chantier)
                  </label>
                  <input
                    type="text"
                    value={workerForm.cniNumber}
                    onChange={(e) => setWorkerForm({ ...workerForm, cniNumber: e.target.value })}
                    placeholder="Ex: 119283745"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold cursor-pointer"
                >
                  Enregistrer sur le chantier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL : CONFIRMATION SUPPRESSION OUVRIER */}
      {workerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-red-800/70 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer cet ouvrier ?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Vous allez supprimer définitivement{' '}
                  <strong className="text-white">{workerToDelete.fullName}</strong> ({workerToDelete.matricule} ·{' '}
                  {workerToDelete.specialtyLabel}) ainsi que ses pointages associés sur ce chantier.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWorkerToDelete(null)}
                disabled={isDeletingWorker}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWorker}
                disabled={isDeletingWorker}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingWorker ? 'Suppression...' : 'Confirmer la suppression'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
