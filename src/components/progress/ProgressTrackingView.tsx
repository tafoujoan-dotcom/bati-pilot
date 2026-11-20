import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProjectTask, ProjectPhoto } from '../../types';
import {
  TrendingUp,
  Plus,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  Calendar,
  FileText,
  Trash2,
  X,
  Upload,
  Eye,
  Layers,
  HardHat,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';

interface ProgressProjectSummary {
  id: string;
  code: string;
  name: string;
  city: string;
  progressPercentage: number;
  startDate: string;
  expectedEndDate: string;
  managerName?: string;
}

export const ProgressTrackingView: React.FC = () => {
  const { user, company } = useAuth();

  const [projects, setProjects] = useState<ProgressProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<ProgressProjectSummary | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'lots' | 'photos' | 'milestones'>('lots');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'BEFORE' | 'DURING' | 'AFTER' | 'INCIDENT'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modales
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<ProjectPhoto | null>(null);

  // Formulaires
  const [taskForm, setTaskForm] = useState({
    lotName: 'Lot 2 : Gros Œuvre & Béton Armé',
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    weight: 15,
    progressPercentage: 0,
    assignedToName: 'Ing. Paul Ndongo',
    isMilestone: false,
  });

  const [photoForm, setPhotoForm] = useState({
    photoType: 'DURING' as 'BEFORE' | 'DURING' | 'AFTER' | 'INCIDENT',
    caption: '',
    takenDate: new Date().toISOString().split('T')[0],
    taskId: '',
    photoUrl: '',
  });

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchOverview = async (projectIdOverride?: string) => {
    setIsLoading(true);
    try {
      const companyId = company?.id || 'comp_socabat_01';
      const targetProj = projectIdOverride !== undefined ? projectIdOverride : selectedProjectId;
      const url = targetProj
        ? `/api/progress/overview?companyId=${companyId}&projectId=${targetProj}`
        : `/api/progress/overview?companyId=${companyId}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setSelectedProject(data.selectedProject || null);
        if (!selectedProjectId && data.selectedProject) {
          setSelectedProjectId(data.selectedProject.id);
        }
        setTasks(data.tasks || []);
        setPhotos(data.photos || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Erreur chargement avancement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [company?.id, selectedProjectId]);

  // Mettre à jour l'avancement ou le statut d'un lot BTP
  const handleUpdateTask = async (taskId: string, updates: Partial<ProjectTask>) => {
    try {
      const res = await fetch(`/api/progress/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
    }
  };

  // Créer une tâche / lot
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const res = await fetch('/api/progress/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          ...taskForm,
          status: taskForm.progressPercentage >= 100 ? 'COMPLETED' : taskForm.progressPercentage > 0 ? 'IN_PROGRESS' : 'TODO',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setIsTaskModalOpen(false);
        setTaskForm({
          lotName: 'Lot 3 : Maçonnerie & Agglos',
          title: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          weight: 15,
          progressPercentage: 0,
          assignedToName: 'Ing. Paul Ndongo',
          isMilestone: false,
        });
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur création tâche:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/progress/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('Lot retiré du planning.');
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur suppression tâche:', err);
    }
  };

  // Gérer l'upload de fichier image depuis l'ordinateur ou smartphone
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showNotice('Image trop volumineuse (max 10 Mo). Veuillez choisir un fichier plus léger.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !photoForm.photoUrl) return;
    try {
      const res = await fetch('/api/progress/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          uploaderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Ing. Paul Ndongo',
          ...photoForm,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showNotice(data.message);
        setIsPhotoModalOpen(false);
        setPhotoForm({
          photoType: 'DURING',
          caption: '',
          takenDate: new Date().toISOString().split('T')[0],
          taskId: '',
          photoUrl: '',
        });
        setActiveTab('photos');
        await fetchOverview();
      } else {
        showNotice('Impossible d’enregistrer la photo (fichier trop lourd ou invalide).');
      }
    } catch (err) {
      console.error('Erreur ajout photo:', err);
      showNotice('Erreur réseau lors de l’envoi de la photo.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/progress/photos/${photoId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotice('Photo supprimée de la galerie.');
        setLightboxPhoto(null);
        await fetchOverview();
      }
    } catch (err) {
      console.error('Erreur suppression photo:', err);
    }
  };

  const statusMeta: Record<string, { label: string; color: string; bar: string }> = {
    COMPLETED: { label: 'Terminé', color: 'text-emerald-400', bar: 'bg-emerald-500' },
    IN_PROGRESS: { label: 'En cours', color: 'text-orange-400', bar: 'bg-orange-500' },
    DELAYED: { label: 'En retard', color: 'text-rose-400', bar: 'bg-rose-500' },
    TODO: { label: 'Planifié', color: 'text-slate-400', bar: 'bg-slate-600' },
  };

  const photoTypeLabels: Record<string, { label: string; accent: string }> = {
    BEFORE: { label: 'Avant travaux', accent: 'text-sky-400' },
    DURING: { label: 'En cours d\'exécution', accent: 'text-orange-400' },
    AFTER: { label: 'Après / Finitions', accent: 'text-emerald-400' },
    INCIDENT: { label: 'Alerte / Incident', accent: 'text-rose-400' },
  };

  const filteredPhotos = photoFilter === 'ALL' ? photos : photos.filter((p) => p.photoType === photoFilter);
  const milestones = tasks.filter((t) => t.isMilestone);
  const beforePhoto = photos.find((p) => p.photoType === 'BEFORE');
  const latestProgressPhoto = photos.find((p) => p.photoType === 'AFTER') || photos.find((p) => p.photoType === 'DURING');

  // Calcul bornes temporelles du Gantt
  const projectStartMs = selectedProject ? new Date(selectedProject.startDate).getTime() : Date.now();
  const projectEndMs = selectedProject ? new Date(selectedProject.expectedEndDate).getTime() : Date.now() + 90 * 86400000;
  const totalSpanMs = Math.max(projectEndMs - projectStartMs, 86400000);

  if (isLoading && !selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Chargement du suivi d'avancement BTP...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          EN-TÊTE ÉTAPE 7 (MODULE 3 : SUIVI AVANCEMENT, LOTS & PHOTOS)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="text-orange-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Avancement & Photos
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedProject?.code || 'CH-2026'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Suivi de l'Avancement Physique, Lots & Galerie Photos
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Découpage technique par corps d'état (Terrassement, Gros œuvre, Maçonnerie, Réseaux, Finitions), recalcul automatique pondéré du chantier et preuves photographiques horodatées Avant / Pendant / Après.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sélecteur de chantier */}
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.progressPercentage}%)
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

        {/* 4 Indicateurs synthétiques d'avancement */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Avancement global pondéré</span>
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{summary.weightedProgress ?? 0}%</span>
              <span className="text-[11px] text-slate-500">calculé sur {summary.totalTasks || 0} lots</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-600 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${summary.weightedProgress ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Lots & Corps d'état</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {summary.completedCount || 0} <span className="text-sm font-normal text-slate-400">/ {summary.totalTasks || 0} achevés</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summary.inProgressCount || 0} en cours · {summary.todoCount || 0} planifié(s)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Points de vigilance / Retards</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className={`text-2xl font-extrabold ${(summary.delayedCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {summary.delayedCount || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {(summary.delayedCount || 0) > 0 ? 'Action corrective terrain requise' : 'Aucun lot en dérive calendaire'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Preuves & Jalons techniques</span>
              <Camera className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {summary.photosCount || 0} <span className="text-sm font-normal text-slate-400">photos</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Jalons validés : {summary.milestonesCompleted || 0} / {summary.milestonesTotal || 0}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ONGLETS DE NAVIGATION & ACTIONS DU MODULE 3
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'lots' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Planning & Lots BTP ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'photos' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Galerie Photos Avant / Après ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'milestones' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Jalons & Contrôles ({milestones.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Ajouter un Lot</span>
          </button>

          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Ajouter une Photo</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ONGLET 1 : PLANNING & LOTS BTP (AVEC COURBE TEMPORELLE GANTT)
         ========================================================================= */}
      {activeTab === 'lots' && (
        <div className="space-y-6">
          {/* Planning visuel Gantt simplifié */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white">Frise Temporelle d'Exécution (Planning Gantt Chantier)</h2>
                <p className="text-xs text-slate-400">
                  Du {selectedProject ? new Date(selectedProject.startDate).toLocaleDateString('fr-FR') : '-'} au{' '}
                  {selectedProject ? new Date(selectedProject.expectedEndDate).toLocaleDateString('fr-FR') : '-'} · Pondération totale : {summary.totalWeight || 0}%
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Terminé</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block"></span> En cours</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> Retard</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {tasks.map((task) => {
                const startMs = Math.max(projectStartMs, new Date(task.startDate).getTime());
                const endMs = Math.min(projectEndMs, Math.max(startMs + 86400000, new Date(task.endDate).getTime()));
                const leftPct = Math.max(0, Math.min(92, ((startMs - projectStartMs) / totalSpanMs) * 100));
                const widthPct = Math.max(8, Math.min(100 - leftPct, ((endMs - startMs) / totalSpanMs) * 100));
                const meta = statusMeta[task.status] || statusMeta.TODO;

                return (
                  <div key={`gantt_${task.id}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                    <div className="md:col-span-4 truncate">
                      <span className="font-semibold text-slate-200 block truncate">{task.lotName}</span>
                      <span className="text-[11px] text-slate-500 truncate block">{task.title}</span>
                    </div>
                    <div className="md:col-span-7 bg-slate-950 border border-slate-800/80 rounded-lg h-7 relative overflow-hidden">
                      <div
                        className="absolute top-1 bottom-1 rounded bg-slate-800 border border-slate-700 overflow-hidden flex items-center"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      >
                        <div
                          className={`${meta.bar} h-full transition-all duration-500`}
                          style={{ width: `${task.progressPercentage}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                          {task.progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className={`md:col-span-1 text-right font-mono text-[11px] font-semibold ${meta.color}`}>
                      {task.weight}% poids
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liste interactive détaillée par lot */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const meta = statusMeta[task.status] || statusMeta.TODO;

              return (
                <div
                  key={task.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-orange-400">{task.lotName}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-400">Pondération : {task.weight}%</span>
                        {task.isMilestone && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Flag className="w-3 h-3" /> Jalon clé
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white">{task.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5 text-slate-500" />
                          <span>Responsable : <strong className="text-slate-200">{task.assignedToName}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(task.startDate).toLocaleDateString('fr-FR')} → {new Date(task.endDate).toLocaleDateString('fr-FR')}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Contrôles d'avancement en direct */}
                    <div className="lg:w-80 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 shrink-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Avancement du lot</span>
                        <span className="text-lg font-extrabold text-white">{task.progressPercentage}%</span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={task.progressPercentage}
                        onChange={(e) => handleUpdateTask(task.id, { progressPercentage: Number(e.target.value) })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task.id, { status: e.target.value as ProjectTask['status'] })}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer flex-1"
                        >
                          <option value="TODO">Planifié</option>
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="DELAYED">En retard</option>
                          <option value="COMPLETED">Terminé (100%)</option>
                        </select>

                        <button
                          onClick={() => handleUpdateTask(task.id, { progressPercentage: 100, status: 'COMPLETED' })}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-semibold cursor-pointer transition-colors"
                          title="Marquer ce lot terminé à 100%"
                        >
                          100%
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/50 text-slate-500 hover:text-red-400 border border-slate-800 cursor-pointer transition-colors"
                          title="Supprimer ce lot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          ONGLET 2 : GALERIE PHOTOS AVANT / PENDANT / APRÈS
         ========================================================================= */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Comparatif Avant / État Actuel */}
          {beforePhoto && latestProgressPhoto && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white">Comparatif Visuel d'Évolution (Avant / État Actuel)</h2>
                  <p className="text-xs text-slate-400">
                    Preuve visuelle directe de la transformation du chantier pour le maître d'ouvrage
                  </p>
                </div>
                <span className="text-xs text-orange-400 font-semibold">
                  Avancement constaté : {selectedProject?.progressPercentage ?? 0}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] relative bg-slate-900 overflow-hidden">
                    <img
                      src={beforePhoto.photoUrl}
                      alt={beforePhoto.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sky-400">AVANT TRAVAUX (État initial)</span>
                      <span className="text-slate-500">{new Date(beforePhoto.takenDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-slate-300">{beforePhoto.caption}</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-orange-500/30 rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] relative bg-slate-900 overflow-hidden">
                    <img
                      src={latestProgressPhoto.photoUrl}
                      alt={latestProgressPhoto.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">
                        {latestProgressPhoto.photoType === 'AFTER' ? 'APRÈS / LIVRAISON' : 'PENDANT EXÉCUTION'}
                      </span>
                      <span className="text-slate-500">{new Date(latestProgressPhoto.takenDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-slate-300">{latestProgressPhoto.caption}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres par type de photo */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {([
                { id: 'ALL', label: 'Toutes' },
                { id: 'BEFORE', label: 'Avant travaux' },
                { id: 'DURING', label: 'Pendant travaux' },
                { id: 'AFTER', label: 'Après / Fini' },
                { id: 'INCIDENT', label: 'Incidents' },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPhotoFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    photoFilter === f.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">{filteredPhotos.length} cliché(s) horodaté(s)</span>
          </div>

          {/* Grille des photos */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <Camera className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Aucune photo dans cette catégorie</p>
              <p className="text-xs text-slate-500">
                Cliquez sur « Ajouter une Photo » pour importer un cliché pris depuis le chantier.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map((photo) => {
                const meta = photoTypeLabels[photo.photoType] || photoTypeLabels.DURING;
                return (
                  <div
                    key={photo.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group"
                  >
                    <div
                      onClick={() => setLightboxPhoto(photo)}
                      className="aspect-[4/3] bg-slate-950 relative overflow-hidden cursor-pointer"
                    >
                      <img
                        src={photo.photoUrl}
                        alt={photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-orange-400" />
                          Agrandir
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${meta.accent}`}>{meta.label}</span>
                          <span className="text-slate-500">{new Date(photo.takenDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{photo.caption}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Par : {photo.uploaderName}</span>
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          ONGLET 3 : JALONS & CONTRÔLES TECHNIQUES
         ========================================================================= */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Jalons Contractuels & Réceptions Techniques</h2>
            <p className="text-xs text-slate-400">
              Points d'arrêt critiques validés avec le bureau de contrôle (Labogénie) et le Maître d'ouvrage
            </p>
          </div>

          <div className="space-y-4">
            {milestones.map((m, idx) => {
              const isDone = m.status === 'COMPLETED';
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone ? 'bg-emerald-950 border border-emerald-700 text-emerald-400' : 'bg-orange-950/60 border border-orange-800 text-orange-400'
                      }`}
                    >
                      J{idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white">{m.lotName}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className={isDone ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                          {isDone ? 'Jalon validé' : `Avancement : ${m.progressPercentage}%`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{m.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Échéance contractuelle : {new Date(m.endDate).toLocaleDateString('fr-FR')} · Responsable : {m.assignedToName}
                      </p>
                    </div>
                  </div>

                  {!isDone ? (
                    <button
                      onClick={() => handleUpdateTask(m.id, { progressPercentage: 100, status: 'COMPLETED' })}
                      className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valider ce Jalon</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Réceptionné conforme
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1 : AJOUTER UN LOT / TÂCHE BTP
         ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Nouveau Lot / Tâche Chantier</h2>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Corps d'état / Lot BTP *</label>
                  <input
                    type="text"
                    value={taskForm.lotName}
                    onChange={(e) => setTaskForm({ ...taskForm, lotName: e.target.value })}
                    placeholder="Ex: Lot 6 : Étanchéité Toiture-Terrasse"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Intitulé des travaux *</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Ex: Pose membrane bitumineuse bicouche et forme de pente"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date début</label>
                    <input
                      type="date"
                      value={taskForm.startDate}
                      onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date fin prévue</label>
                    <input
                      type="date"
                      value={taskForm.endDate}
                      onChange={(e) => setTaskForm({ ...taskForm, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Pondération chantier (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={taskForm.weight}
                      onChange={(e) => setTaskForm({ ...taskForm, weight: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Responsable terrain</label>
                    <input
                      type="text"
                      value={taskForm.assignedToName}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedToName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taskForm.isMilestone}
                    onChange={(e) => setTaskForm({ ...taskForm, isMilestone: e.target.checked })}
                    className="accent-orange-500"
                  />
                  <span>Définir comme jalon contractuel clé</span>
                </label>
              </div>

              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold cursor-pointer"
                >
                  Ajouter au planning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2 : AJOUTER UNE PHOTO DE CHANTIER
         ========================================================================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white">Importer une Photo de Chantier</h2>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phase de prise de vue *</label>
                    <select
                      value={photoForm.photoType}
                      onChange={(e) => setPhotoForm({ ...photoForm, photoType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 cursor-pointer"
                    >
                      <option value="BEFORE">Avant travaux</option>
                      <option value="DURING">Pendant exécution</option>
                      <option value="AFTER">Après / Terminé</option>
                      <option value="INCIDENT">Incident / Anomalie</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date de prise de vue</label>
                    <input
                      type="date"
                      value={photoForm.takenDate}
                      onChange={(e) => setPhotoForm({ ...photoForm, takenDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Sélectionner un fichier photo (PC / Téléphone) *
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-3.5 bg-slate-950 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-orange-400 mb-1" />
                    <span className="text-slate-300 font-medium">
                      {photoForm.photoUrl ? 'Changer l’image sélectionnée' : 'Cliquez pour choisir une image JPG/PNG'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  {/* Prise en main rapide si l'utilisateur n'a pas de photo sous la main */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>Ou tester avec un exemple BTP :</span>
                    <button
                      type="button"
                      onClick={() => setPhotoForm((p) => ({ ...p, photoUrl: '/images/chantiers/pendant.jpg' }))}
                      className="text-orange-400 hover:underline cursor-pointer"
                    >
                      Coulage dalle
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setPhotoForm((p) => ({ ...p, photoUrl: '/images/chantiers/apres.jpg' }))}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Façade finie
                    </button>
                  </div>
                </div>

                {photoForm.photoUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-40 bg-slate-950">
                    <img src={photoForm.photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoForm((p) => ({ ...p, photoUrl: '' }))}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-slate-950/85 hover:bg-slate-900 border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      <span>Retirer</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Légende technique / Observation *</label>
                  <textarea
                    value={photoForm.caption}
                    onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                    placeholder="Ex: Réception ferraillage plancher haut R+3 avant coulage béton B25..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="p-4 sm:px-5 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!photoForm.photoUrl}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ajouter la photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX AGRANDISSEMENT PHOTO
         ========================================================================= */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
          >
            <div className="relative bg-black max-h-[70vh] flex items-center justify-center">
              <img src={lightboxPhoto.photoUrl} alt={lightboxPhoto.caption} className="max-h-[70vh] w-auto object-contain" />
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-slate-900/90 text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-white">{lightboxPhoto.caption}</div>
                <div className="text-slate-400 mt-0.5">
                  Prise le {new Date(lightboxPhoto.takenDate).toLocaleDateString('fr-FR')} · Par {lightboxPhoto.uploaderName}
                </div>
              </div>
              <button
                onClick={() => handleDeletePhoto(lightboxPhoto.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
