import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Project, ProjectDailyLog, User } from '../../types';
import {
  Building2,
  Plus,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  X,
  Phone,
  HardHat,
  Sun,
  CloudRain,
  Cloud,
  Zap,
  Edit3,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const ProjectManagementView: React.FC = () => {
  const { user, company } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [quota, setQuota] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectLogs, setSelectedProjectLogs] = useState<ProjectDailyLog[]>([]);
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Formulaire nouveau chantier
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    clientName: '',
    clientPhone: '+237 ',
    location: '',
    city: 'Douala',
    budgetTotal: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    managerId: '',
    workersCount: '15',
    description: '',
  });

  // Formulaire nouveau log de chantier
  const [newLogForm, setNewLogForm] = useState({
    weather: 'SUNNY' as 'SUNNY' | 'RAINY' | 'CLOUDY' | 'STORMY',
    workersPresent: 25,
    workDone: '',
    materialsUsed: '',
    incidentsOrAlerts: '',
  });

  // Mise à jour rapide du % d'avancement
  const [quickProgress, setQuickProgress] = useState<number>(0);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const companyId = company?.id || 'comp_socabat_01';
      const params = new URLSearchParams({
        companyId,
        status: statusFilter,
        city: cityFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setStatusCounts(data.statusCounts);
        setQuota(data.quota);
      }
    } catch (err) {
      console.error('Erreur chargement chantiers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [company?.id, statusFilter, cityFilter, searchQuery]);

  // Ouvrir la fiche 360° d'un chantier
  const handleOpenProjectDetail = async (project: Project) => {
    setSelectedProject(project);
    setQuickProgress(project.progressPercentage);
    setNewLogForm((prev) => ({ ...prev, workersPresent: project.workersCount || 20 }));
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProjectLogs(data.dailyLogs || []);
        setAvailableManagers(data.managers || []);
      }
    } catch (e) {
      console.error('Erreur chargement détails chantier:', e);
    }
  };

  // Création d'un chantier
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || 'comp_socabat_01',
          ...newProjectForm,
          budgetTotal: Number(newProjectForm.budgetTotal),
          workersCount: Number(newProjectForm.workersCount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionNotice(data.message);
        setIsCreateModalOpen(false);
        setNewProjectForm({
          name: '',
          clientName: '',
          clientPhone: '+237 ',
          location: '',
          city: 'Douala',
          budgetTotal: '',
          startDate: new Date().toISOString().split('T')[0],
          expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          managerId: '',
          workersCount: '15',
          description: '',
        });
        setTimeout(() => setActionNotice(null), 4000);
        await fetchProjects();
      } else {
        alert(data.error || 'Erreur lors de la création du chantier');
      }
    } catch (err) {
      console.error('Erreur création chantier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enregistrer une entrée au journal de bord
  const handleAddDailyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLogForm,
          authorName: `${user?.firstName} ${user?.lastName} (${user?.role})`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedProjectLogs([data.log, ...selectedProjectLogs]);
        setNewLogForm({
          weather: 'SUNNY',
          workersPresent: selectedProject.workersCount || 20,
          workDone: '',
          materialsUsed: '',
          incidentsOrAlerts: '',
        });
        setActionNotice('Nouvelle note ajoutée au journal de bord avec succès !');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error('Erreur ajout journal:', err);
    }
  };

  // Mettre à jour l'avancement physique (%)
  const handleUpdateProgress = async (newPct: number) => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercentage: newPct }),
      });
      if (res.ok) {
        setSelectedProject({ ...selectedProject, progressPercentage: newPct });
        setQuickProgress(newPct);
        await fetchProjects();
        setActionNotice(`Taux d'avancement mis à jour à ${newPct}% !`);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (e) {
      console.error('Erreur mise à jour avancement:', e);
    }
  };

  const formatFCFA = (val: number) => `${(val || 0).toLocaleString('fr-FR')} FCFA`;

  const weatherIcons: Record<string, React.ReactNode> = {
    SUNNY: (
      <span title="Ensoleillé">
        <Sun className="w-4 h-4 text-amber-400" />
      </span>
    ),
    RAINY: (
      <span title="Pluvieux">
        <CloudRain className="w-4 h-4 text-sky-400" />
      </span>
    ),
    CLOUDY: (
      <span title="Nuageux">
        <Cloud className="w-4 h-4 text-slate-400" />
      </span>
    ),
    STORMY: (
      <span title="Orages violents">
        <Zap className="w-4 h-4 text-rose-400" />
      </span>
    ),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================================================
          EN-TÊTE ÉTAPE 6 (MODULE 2 : GESTION DES CHANTIERS)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-orange-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 font-semibold tracking-wide uppercase">
                <Building2 className="w-3.5 h-3.5" />
                Chantiers & Projets
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400 text-[11px]">
                Quota : <strong className="text-orange-400">{quota.used}</strong> / {quota.max} chantiers ({quota.plan})
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gestion Complète des Chantiers & Projets BTP
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Création de chantiers avec contrôle de quotas SaaS, géolocalisation sur le territoire camerounais, affectation des conducteurs de travaux, suivi budgétaire en FCFA et journal de bord quotidien.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Chantier</span>
            </button>

          </div>
        </div>

        {/* Notification d'action */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Barre de statistiques rapides */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Total Chantiers</span>
            <span className="text-lg font-bold text-white">{statusCounts.total || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">En cours d'exécution</span>
            <span className="text-lg font-bold text-emerald-400">{statusCounts.inProgress || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">En préparation / Études</span>
            <span className="text-lg font-bold text-amber-400">{statusCounts.preparation || 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Livrés / Réceptionnés</span>
            <span className="text-lg font-bold text-blue-400">{statusCounts.completed || 0}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BARRE DE RECHERCHE, FILTRES ET COMMUTATEUR DE VUE
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Recherche texte */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, client ou quartier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none"
            />
          </div>

          {/* Filtre Ville */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">Toutes les villes</option>
            <option value="Douala">Douala</option>
            <option value="Yaoundé">Yaoundé</option>
            <option value="Kribi">Kribi</option>
            <option value="Bafoussam">Bafoussam</option>
          </select>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="PREPARATION">En préparation</option>
            <option value="COMPLETED">Terminé / Réceptionné</option>
            <option value="SUSPENDED">Suspendu</option>
          </select>
        </div>

        {/* Basculeur de vue Grille vs Carte */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vue Grille
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'map' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Vue Carte</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VUE CARTE GÉOGRAPHIQUE & COORDONNÉES GPS CAMEROUN
         ========================================================================= */}
      {viewMode === 'map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>Cartographie des Chantiers (Afrique Centrale / Cameroun)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Géolocalisation précise par coordonnées GPS (Latitude / Longitude) pour le suivi d'approvisionnement
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {projects.length} point(s) d'ancrage actif(s)
            </span>
          </div>

          {/* Visualisation géographique stylisée */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 h-80 flex flex-col justify-between overflow-hidden">
            {/* Grille cartographique de fond */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 flex justify-between items-start text-[11px] text-slate-500">
              <span className="font-mono">Zone : Golfe de Guinée / Bassin du Congo</span>
              <span className="font-mono">Projection WGS84</span>
            </div>

            {/* Villes et marqueurs interactifs */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenProjectDetail(p)}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-orange-500 cursor-pointer transition-all shadow-lg group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                      {p.name}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                    <span className="truncate">{p.location}, {p.city}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                    <span>GPS : {p.lat || 4.051}, {p.lng || 9.708}</span>
                    <span className="text-orange-400 font-bold">{p.progressPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              <span>Points relais logistiques : Bassa (Douala) · Bastos (Yaoundé) · Port Autonome (Kribi)</span>
              <span className="text-slate-400">Cliquez sur un marqueur pour inspecter la fiche</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GRILLE DES CHANTIERS
         ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const spentRate = Math.round((p.budgetSpent / p.budgetTotal) * 100);
            const remaining = Math.max(0, p.budgetTotal - p.budgetSpent);

            return (
              <div
                key={p.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md flex flex-col justify-between transition-all hover:shadow-xl group"
              >
                <div className="space-y-4">
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                          {p.code}
                        </span>
                        <span className="text-[11px] text-slate-400">{p.city}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5 leading-snug group-hover:text-orange-400 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Client : <strong className="text-slate-300">{p.clientName}</strong>
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-[10px] font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {p.status === 'IN_PROGRESS' ? 'En cours' : p.status}
                    </span>
                  </div>

                  {/* Localisation & Conducteur de travaux */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-200 font-medium truncate max-w-[130px]">
                          {p.managerName || 'Ing. Paul Ndongo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>{p.workersCount || 15} ouvriers</span>
                      </div>
                    </div>
                  </div>

                  {/* Jauge d'avancement physique */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Avancement physique</span>
                      <span className="font-bold text-orange-400">{p.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-orange-600 to-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${p.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Budget en FCFA */}
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-800/60">
                    <div className="flex justify-between text-slate-400">
                      <span>Budget consommé :</span>
                      <span className="text-white font-semibold">{formatFCFA(p.budgetSpent)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Budget total alloué :</span>
                      <span>{formatFCFA(p.budgetTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-orange-400/90 font-mono">
                      <span>Reste à engager :</span>
                      <span>{formatFCFA(remaining)} ({100 - spentRate}%)</span>
                    </div>
                  </div>
                </div>

                {/* Bouton pour ouvrir la fiche 360° */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Fin : {new Date(p.expectedEndDate).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <button
                    onClick={() => handleOpenProjectDetail(p)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600 hover:text-white text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Fiche 360° & Journal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1 : FICHE DÉTAILLÉE 360° & JOURNAL DE BORD DU CHANTIER
         ========================================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            {/* En-tête de la modale */}
            <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    {selectedProject.code}
                  </span>
                  <span className="text-xs text-slate-400">{selectedProject.city}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {selectedProject.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client : <strong className="text-slate-200">{selectedProject.clientName}</strong> · Tél : {selectedProject.clientPhone}
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps de la modale avec onglets intégrés */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Synthèse Métriques Chantier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block mb-1">Budget Total Alloué</span>
                  <span className="text-lg font-bold text-white">{formatFCFA(selectedProject.budgetTotal)}</span>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Dépensé : {formatFCFA(selectedProject.budgetSpent)} ({Math.round((selectedProject.budgetSpent / selectedProject.budgetTotal) * 100)}%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block mb-1">Conducteur de Travaux</span>
                  <span className="text-sm font-bold text-slate-200 block truncate">
                    {selectedProject.managerName || 'Ing. Paul Ndongo'}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Effectif : {selectedProject.workersCount} ouvriers affectés
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block mb-1">Livraison Prévisionnelle</span>
                  <span className="text-sm font-bold text-slate-200 block">
                    {new Date(selectedProject.expectedEndDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="text-[11px] text-emerald-400 mt-1">Planning respecté</div>
                </div>
              </div>

              {/* Jauge interactive de mise à jour rapide de l'avancement */}
              <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white text-sm">Mise à jour directe de l'avancement physique</span>
                    <p className="text-[11px] text-slate-400">
                      Ajustez le curseur pour actualiser le pourcentage de réalisation des travaux
                    </p>
                  </div>
                  <span className="text-xl font-extrabold text-orange-400">{quickProgress}%</span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={quickProgress}
                    onChange={(e) => setQuickProgress(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <button
                    onClick={() => handleUpdateProgress(quickProgress)}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold text-white text-xs shrink-0 cursor-pointer transition-colors"
                  >
                    Valider le %
                  </button>
                </div>
              </div>

              {/* Formulaire d'ajout rapide d'une entrée au Cahier de Chantier */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-400" />
                  <span>Consigner une entrée au Journal de Bord (Main courante BTP)</span>
                </h3>

                <form onSubmit={handleAddDailyLog} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Météo du jour</label>
                      <select
                        value={newLogForm.weather}
                        onChange={(e) => setNewLogForm({ ...newLogForm, weather: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="SUNNY">☀️ Ensoleillé (Idéal coulage & terrassement)</option>
                        <option value="CLOUDY">☁️ Nuageux (Conditions normales)</option>
                        <option value="RAINY">🌧️ Pluvieux (Averses littorales / arrêt coulages)</option>
                        <option value="STORMY">⚡ Orages violents (Mise en sécurité matériel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Ouvriers présents sur le chantier</label>
                      <input
                        type="number"
                        value={newLogForm.workersPresent}
                        onChange={(e) => setNewLogForm({ ...newLogForm, workersPresent: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Travaux réalisés aujourd'hui (Obligatoire)</label>
                    <textarea
                      value={newLogForm.workDone}
                      onChange={(e) => setNewLogForm({ ...newLogForm, workDone: e.target.value })}
                      placeholder="Ex: Coulage de la dalle R+3 (22m³ béton B25), ferraillage poteaux, pose des gaines électriques..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                      required
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Matériaux consommés</label>
                      <input
                        type="text"
                        value={newLogForm.materialsUsed}
                        onChange={(e) => setNewLogForm({ ...newLogForm, materialsUsed: e.target.value })}
                        placeholder="Ex: 90 sacs ciment CPJ 42.5, 40 barres HA 12"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Incidents, alertes ou visites</label>
                      <input
                        type="text"
                        value={newLogForm.incidentsOrAlerts}
                        onChange={(e) => setNewLogForm({ ...newLogForm, incidentsOrAlerts: e.target.value })}
                        placeholder="Ex: Visite bureau de contrôle Labogénie, RAS"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ajouter au cahier de chantier</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Historique du Journal de Bord Chronologique */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>Historique des entrées du Journal de Bord</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {selectedProjectLogs.length} entrée(s) archivée(s)
                  </span>
                </h3>

                {selectedProjectLogs.length === 0 ? (
                  <p className="p-4 text-center text-slate-500 bg-slate-950 rounded-xl">
                    Aucune entrée dans le journal pour le moment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedProjectLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            {weatherIcons[log.weather] || weatherIcons.SUNNY}
                            <span className="font-bold text-white">
                              {new Date(log.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">{log.workersPresent} ouvriers actifs</span>
                          </div>
                          <span className="text-[11px] text-slate-500">Auteur : {log.authorName}</span>
                        </div>

                        <p className="text-slate-300 leading-relaxed text-xs">{log.workDone}</p>

                        {(log.materialsUsed || log.incidentsOrAlerts) && (
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/40">
                            {log.materialsUsed && (
                              <div>
                                <strong className="text-slate-300">Matériaux :</strong> {log.materialsUsed}
                              </div>
                            )}
                            {log.incidentsOrAlerts && (
                              <div>
                                <strong className="text-amber-400">Notes / Visites :</strong> {log.incidentsOrAlerts}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pied de la modale */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2 : CRÉATION D'UN NOUVEAU CHANTIER
         ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span>Ouverture d'un Nouveau Chantier BTP</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formule actuelle : <strong className="text-white">{quota.plan}</strong> ({quota.used} / {quota.max} chantiers utilisés)
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nom du chantier / Projet *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Construction Villa Duplex Bonamoussadi"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Client / Maître d'ouvrage *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SCI Les Jardins de Wouri"
                    value={newProjectForm.clientName}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, clientName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Téléphone client
                  </label>
                  <input
                    type="text"
                    placeholder="+237 699 00 11 22"
                    value={newProjectForm.clientPhone}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, clientPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Ville d'implantation *
                  </label>
                  <select
                    value={newProjectForm.city}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Douala">Douala (Littoral)</option>
                    <option value="Yaoundé">Yaoundé (Centre)</option>
                    <option value="Kribi">Kribi (Sud / Océan)</option>
                    <option value="Bafoussam">Bafoussam (Ouest)</option>
                    <option value="Limbe">Limbe (Sud-Ouest)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Adresse / Quartier précis *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rue des Palmiers, Bonamoussadi"
                    value={newProjectForm.location}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Budget total alloué (FCFA) *
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 75000000"
                    value={newProjectForm.budgetTotal}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, budgetTotal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    required
                    min="1000000"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Effectif ouvriers prévisionnel
                  </label>
                  <input
                    type="number"
                    value={newProjectForm.workersCount}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, workersCount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Date de démarrage (Ordre de Service)
                  </label>
                  <input
                    type="date"
                    value={newProjectForm.startDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Date de livraison prévue
                  </label>
                  <input
                    type="date"
                    value={newProjectForm.expectedEndDate}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, expectedEndDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description des travaux et spécifications techniques
                </label>
                <textarea
                  placeholder="Ex: Fondations profondes sur pieux, structure poteaux-poutres béton armé, carrelage importé..."
                  rows={2}
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Création en cours...' : 'Créer et Ouvrir le Chantier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
