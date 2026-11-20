import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { setSimulatedOffline, useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { OfflineActionType, OfflineQueueItem } from '../../types';
import {
  clearSyncedOfflineItems,
  enqueueOfflineItem,
  getLastSyncTimestamp,
  loadCachedBootstrap,
  loadOfflineQueue,
  PwaBootstrapPack,
  removeOfflineQueueItem,
  saveCachedBootstrap,
  syncOfflineQueueNow,
  SyncQueueOutcome,
} from '../../utils/offlineStore';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  ClipboardList,
  CloudOff,
  CloudUpload,
  Database,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

export const OfflinePwaView: React.FC = () => {
  const { user, company } = useAuth();
  const { isOnline, browserOnline, simulatedOffline } = useOnlineStatus();
  const { isInstalled, isIOS } = usePWAInstall();

  const [pack, setPack] = useState<PwaBootstrapPack | null>(null);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(() => getLastSyncTimestamp());
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loadingPack, setLoadingPack] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Diagnostics Service Worker & Cache API
  const [swActive, setSwActive] = useState<boolean>(false);
  const [swScope, setSwScope] = useState<string>('');
  const [cacheCount, setCacheCount] = useState<number>(0);

  // Onglets de saisie terrain
  const [activeTab, setActiveTab] = useState<OfflineActionType>('DAILY_LOG');

  // Formulaire Journal Quotidien
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [logWeather, setLogWeather] = useState<'SUNNY' | 'RAINY' | 'CLOUDY' | 'STORMY'>('SUNNY');
  const [logWorkersPresent, setLogWorkersPresent] = useState<string>('18');
  const [logWorkDone, setLogWorkDone] = useState<string>('');
  const [logIncidents, setLogIncidents] = useState<string>('');

  // Formulaire Pointage Rapide
  const [attWorkerId, setAttWorkerId] = useState<string>('');
  const [attStatus, setAttStatus] = useState<'PRESENT' | 'HALF_DAY' | 'ABSENT'>('PRESENT');
  const [attOvertime, setAttOvertime] = useState<string>('0');
  const [attNotes, setAttNotes] = useState<string>('');

  // Formulaire Avancement Lot
  const [taskId, setTaskId] = useState<string>('');
  const [taskProgress, setTaskProgress] = useState<string>('75');

  const canSync =
    user?.role &&
    ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const refreshLocalQueue = () => {
    if (!company) return;
    setQueue(loadOfflineQueue(company.id));
    setLastSync(getLastSyncTimestamp());
  };

  const inspectPwaCapabilities = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        setSwActive(Boolean(reg && (reg.active || reg.installing || reg.waiting)));
        setSwScope(reg?.scope || '/');
      }
      if ('caches' in window) {
        const names = await caches.keys();
        setCacheCount(names.length);
      }
    } catch {
      // ignore diagnostics error
    }
  };

  const fetchBootstrapPack = async () => {
    if (!company) return;
    const cached = loadCachedBootstrap(company.id);
    if (cached) {
      setPack(cached);
      if (!selectedProjectId && cached.projects.length > 0) {
        setSelectedProjectId(cached.projects[0].id);
      }
    }

    if (!isOnline) return;
    setLoadingPack(true);
    try {
      const res = await fetch(`/api/pwa/bootstrap?companyId=${encodeURIComponent(company.id)}`);
      if (!res.ok) throw new Error('Erreur de récupération du pack terrain.');
      const fresh: PwaBootstrapPack = await res.json();
      setPack(fresh);
      saveCachedBootstrap(company.id, fresh);
      if (fresh.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(fresh.projects[0].id);
      }
    } catch {
      // Keep cached pack silently when offline
    } finally {
      setLoadingPack(false);
    }
  };

  useEffect(() => {
    refreshLocalQueue();
    fetchBootstrapPack();
    inspectPwaCapabilities();

    const onQueueUpdate = () => refreshLocalQueue();
    const onSwReady = () => inspectPwaCapabilities();
    const onSyncStart = () => setSyncing(true);
    const onSyncComplete = (e: Event) => {
      setSyncing(false);
      refreshLocalQueue();
      fetchBootstrapPack();
      const detail = (e as CustomEvent<SyncQueueOutcome>).detail;
      if (detail?.auto && detail.syncedCount > 0) {
        showToast(
          `Synchronisation automatique réussie : ${detail.syncedCount} saisie(s) envoyée(s) dès le retour réseau.`
        );
      }
    };
    const onSyncError = (e: Event) => {
      setSyncing(false);
      const detail = (e as CustomEvent<{ message?: string; auto?: boolean }>).detail;
      if (detail?.message && !detail.auto) {
        setErrorMsg(detail.message);
      }
    };

    window.addEventListener('bati-pilot-queue-updated', onQueueUpdate);
    window.addEventListener('bati-pilot-sw-ready', onSwReady);
    window.addEventListener('bati-pilot-sync-start', onSyncStart);
    window.addEventListener('bati-pilot-sync-complete', onSyncComplete);
    window.addEventListener('bati-pilot-sync-error', onSyncError);
    return () => {
      window.removeEventListener('bati-pilot-queue-updated', onQueueUpdate);
      window.removeEventListener('bati-pilot-sw-ready', onSwReady);
      window.removeEventListener('bati-pilot-sync-start', onSyncStart);
      window.removeEventListener('bati-pilot-sync-complete', onSyncComplete);
      window.removeEventListener('bati-pilot-sync-error', onSyncError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Sélectionner automatiquement ouvrier / tâche quand chantier change
  const projectWorkers = useMemo(() => {
    if (!pack || !selectedProjectId) return [];
    return pack.workers.filter((w) => w.projectId === selectedProjectId);
  }, [pack, selectedProjectId]);

  const projectTasks = useMemo(() => {
    if (!pack || !selectedProjectId) return [];
    return pack.tasks.filter((t) => t.projectId === selectedProjectId);
  }, [pack, selectedProjectId]);

  useEffect(() => {
    if (projectWorkers.length > 0 && !projectWorkers.some((w) => w.id === attWorkerId)) {
      setAttWorkerId(projectWorkers[0].id);
    }
    if (projectTasks.length > 0 && !projectTasks.some((t) => t.id === taskId)) {
      setTaskId(projectTasks[0].id);
      setTaskProgress(String(projectTasks[0].progressPercentage));
    }
  }, [projectWorkers, projectTasks, attWorkerId, taskId]);

  const syncPendingItems = async (itemsToSync?: OfflineQueueItem[]) => {
    if (!company || !user) return;
    if (!canSync) {
      setErrorMsg('Accès refusé : le profil Ouvrier ne peut pas synchroniser des écritures chantier.');
      return;
    }
    if (!isOnline) {
      setErrorMsg('Connexion indisponible : désactivez le mode Zone Blanche ou attendez le retour du réseau 4G/Wi-Fi.');
      return;
    }

    const targets = itemsToSync || queue.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');
    if (targets.length === 0) return;

    setSyncing(true);
    setErrorMsg(null);
    try {
      const outcome = await syncOfflineQueueNow({
        companyId: company.id,
        userRole: user.role,
        authorName: `${user.firstName} ${user.lastName}`,
        items: targets,
        auto: false,
      });
      refreshLocalQueue();
      await fetchBootstrapPack();
      if (outcome?.message) {
        showToast(outcome.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau pendant la synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleZoneBlanche = async () => {
    const nextOffline = !simulatedOffline;
    setSimulatedOffline(nextOffline);
    setErrorMsg(null);
    if (nextOffline) {
      showToast('Mode Zone Blanche activé : vos saisies terrain sont stockées localement hors-ligne.');
    } else {
      const pendingCountNow = loadOfflineQueue(company?.id).filter((i) => i.status === 'PENDING').length;
      if (pendingCountNow > 0 && canSync) {
        showToast('Connexion rétablie : synchronisation automatique en cours...');
      } else {
        showToast('Connexion rétablie : la file locale est déjà à jour.');
      }
    }
  };

  const handleSubmitFieldEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user || !pack) return;
    if (!canSync) {
      setErrorMsg('Le profil Ouvrier est en lecture seule sur la saisie terrain.');
      return;
    }

    const project = pack.projects.find((p) => p.id === selectedProjectId);
    if (!project) {
      setErrorMsg('Veuillez sélectionner un chantier.');
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];
    let item: OfflineQueueItem | null = null;

    if (activeTab === 'DAILY_LOG') {
      if (!logWorkDone.trim()) {
        setErrorMsg('Décrivez les travaux réalisés avant d’enregistrer.');
        return;
      }
      item = {
        id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        companyId: company.id,
        actionType: 'DAILY_LOG',
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        summary: `Journal (${logWorkersPresent} ouvriers) : ${logWorkDone.trim().slice(0, 65)}`,
        payload: {
          date: todayDate,
          weather: logWeather,
          workersPresent: Number(logWorkersPresent) || 0,
          workDone: logWorkDone.trim(),
          incidentsOrAlerts: logIncidents.trim() || undefined,
        },
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      setLogWorkDone('');
      setLogIncidents('');
    } else if (activeTab === 'ATTENDANCE') {
      const worker = projectWorkers.find((w) => w.id === attWorkerId);
      if (!worker) {
        setErrorMsg('Aucun ouvrier sélectionné sur ce chantier.');
        return;
      }
      const statusLabels = {
        PRESENT: 'Présent',
        HALF_DAY: 'Demi-journée',
        ABSENT: 'Absent',
      };
      item = {
        id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        companyId: company.id,
        actionType: 'ATTENDANCE',
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        summary: `Pointage ${worker.firstName} ${worker.lastName} (${statusLabels[attStatus]}${
          Number(attOvertime) > 0 ? ` +${attOvertime}h sup` : ''
        })`,
        payload: {
          workerId: worker.id,
          date: todayDate,
          status: attStatus,
          overtimeHours: Number(attOvertime) || 0,
          notes: attNotes.trim(),
        },
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      setAttNotes('');
      setAttOvertime('0');
    } else if (activeTab === 'TASK_PROGRESS') {
      const t = projectTasks.find((tk) => tk.id === taskId);
      if (!t) {
        setErrorMsg('Aucun lot BTP sélectionné sur ce chantier.');
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round(Number(taskProgress) || 0)));
      item = {
        id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        companyId: company.id,
        actionType: 'TASK_PROGRESS',
        projectId: project.id,
        projectCode: project.code,
        projectName: project.name,
        summary: `Avancement « ${t.title} » -> ${pct} %`,
        payload: {
          taskId: t.id,
          progressPercentage: pct,
        },
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
    }

    if (!item) return;
    setErrorMsg(null);
    enqueueOfflineItem(item);
    refreshLocalQueue();

    if (!isOnline) {
      showToast('Enregistré dans la file locale hors-ligne (prêt pour synchronisation au retour réseau).');
    } else {
      await syncPendingItems([item]);
    }
  };

  const pendingItems = queue.filter((i) => i.status === 'PENDING' || i.status === 'FAILED');
  const syncedItems = queue.filter((i) => i.status === 'SYNCED');

  const formatTime = (iso?: string | null) => {
    if (!iso) return 'Jamais';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* En-tête Module 13 (Étape 17) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="text-orange-400 font-semibold">Progressive Web App (PWA) & Cache Chantier</span>
            <span>·</span>
            <span className="text-slate-300 font-medium">{company?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            {isOnline ? (
              <Wifi className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <WifiOff className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <span>Mode Hors-Ligne & Application Mobile Chantier (PWA)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Continuez vos pointages, journaux quotidiens et mises à jour de lots en zone blanche sans 4G : la synchronisation s’exécute automatiquement dès le retour de la connexion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleZoneBlanche}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              simulatedOffline
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {simulatedOffline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Rétablir Connexion</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Mode Hors-Ligne Manuel</span>
              </>
            )}
          </button>

          <button
            onClick={() => syncPendingItems()}
            disabled={!isOnline || pendingItems.length === 0 || syncing || !canSync}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/20 transition-colors tabular-nums"
          >
            <CloudUpload className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
            <span>
              {syncing ? 'Synchronisation...' : `Synchroniser (${pendingItems.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback & Erreurs */}
      {feedbackMsg && (
        <div className="bg-emerald-950/60 border border-emerald-700/70 text-emerald-200 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-300 hover:text-white cursor-pointer">
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
          <button onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Statut Réseau & Service Worker</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <p className={`text-xl font-black ${isOnline ? 'text-emerald-400' : 'text-amber-300'}`}>
            {!browserOnline
              ? 'Hors-Ligne Réel'
              : simulatedOffline
              ? 'Zone Blanche (Simulée)'
              : 'En Ligne (Connecté)'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Service Worker : {swActive ? 'Actif et prêt' : 'En cours d’enregistrement'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>File d'attente locale</span>
            <HardDrive className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white tabular-nums">{pendingItems.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Saisie(s) en attente d'envoi vers le serveur
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Saisies synchronisées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 tabular-nums">{syncedItems.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            Dernière synchro : {formatTime(lastSync)}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Référentiel Terrain en Cache</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-lg font-black text-sky-300 tabular-nums">
            {pack ? `${pack.projects.length} chantiers · ${pack.workers.length} ouvriers` : 'Chargement...'}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400 tabular-nums">
              {pack ? `${pack.tasks.length} lots BTP en cache` : 'Pack non chargé'}
            </span>
            <button
              onClick={fetchBootstrapPack}
              disabled={!isOnline || loadingPack}
              className="text-[11px] text-orange-400 hover:text-orange-300 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingPack ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille principale : Formulaire Saisie Terrain (Gauche) + File & Diagnostics (Droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Saisie Terrain Résiliente */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white">
                Console de Saisie Terrain (Résiliente Hors-Ligne)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOnline
                  ? 'En ligne : vos saisies sont enregistrées puis synchronisées immédiatement.'
                  : 'Hors-ligne : vos saisies sont sécurisées localement dans la file d’attente.'}
              </p>
            </div>
          </div>

          {!canSync ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Le profil Ouvrier dispose uniquement de la consultation. Connectez-vous en Chef de chantier, Magasinier ou DG pour effectuer des saisies terrain hors-ligne.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFieldEntry} className="space-y-4">
              {/* Choix du module terrain */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'DAILY_LOG', label: 'Journal Chantier', Icon: ClipboardList },
                  { id: 'ATTENDANCE', label: 'Pointage Ouvrier', Icon: Users },
                  { id: 'TASK_PROGRESS', label: 'Avancement Lot', Icon: TrendingUp },
                ].map((tab) => {
                  const Icon = tab.Icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as OfflineActionType)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        active
                          ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sélection du Chantier depuis le pack en cache */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chantier (depuis le cache local) *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  {pack?.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'DAILY_LOG' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Météo sur site
                      </label>
                      <select
                        value={logWeather}
                        onChange={(e) => setLogWeather(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="SUNNY">Ensoleillé</option>
                        <option value="CLOUDY">Nuageux</option>
                        <option value="RAINY">Pluie</option>
                        <option value="STORMY">Orage / Fortes pluies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Effectif présent sur chantier
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={logWorkersPresent}
                        onChange={(e) => setLogWorkersPresent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 tabular-nums focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Travaux exécutés aujourd'hui *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={logWorkDone}
                      onChange={(e) => setLogWorkDone(e.target.value)}
                      placeholder="Ex: Coulage poteaux R+2 trame B + pose ferraillage poutres..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Incidents ou remarques (optionnel)
                    </label>
                    <input
                      type="text"
                      value={logIncidents}
                      onChange={(e) => setLogIncidents(e.target.value)}
                      placeholder="Ex: Coupure électrique secteur 2h — groupe électrogène utilisé"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'ATTENDANCE' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ouvrier du chantier *
                    </label>
                    <select
                      value={attWorkerId}
                      onChange={(e) => setAttWorkerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      {projectWorkers.length === 0 ? (
                        <option value="">Aucun ouvrier actif sur ce chantier</option>
                      ) : (
                        projectWorkers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.matricule} — {w.firstName} {w.lastName} ({w.specialty})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Statut de présence
                      </label>
                      <select
                        value={attStatus}
                        onChange={(e) => setAttStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="PRESENT">Présent (Journée complète)</option>
                        <option value="HALF_DAY">Demi-journée (0,5 j)</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Heures supplémentaires
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        step={0.5}
                        value={attOvertime}
                        onChange={(e) => setAttOvertime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 tabular-nums focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Note terrain (optionnel)
                    </label>
                    <input
                      type="text"
                      value={attNotes}
                      onChange={(e) => setAttNotes(e.target.value)}
                      placeholder="Ex: Équipe bétonnage dalle"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}

              {activeTab === 'TASK_PROGRESS' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Lot / Tâche BTP *
                    </label>
                    <select
                      value={taskId}
                      onChange={(e) => {
                        setTaskId(e.target.value);
                        const found = projectTasks.find((tk) => tk.id === e.target.value);
                        if (found) setTaskProgress(String(found.progressPercentage));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      {projectTasks.length === 0 ? (
                        <option value="">Aucun lot enregistré sur ce chantier</option>
                      ) : (
                        projectTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.lotName} — {t.title} (actuel : {t.progressPercentage}%)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Nouveau pourcentage d'avancement (%)</span>
                      <span className="text-orange-400 font-bold tabular-nums">{taskProgress} %</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={taskProgress}
                      onChange={(e) => setTaskProgress(e.target.value)}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors ${
                    isOnline
                      ? 'bg-orange-600 hover:bg-orange-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {isOnline ? <CloudUpload className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                  <span>
                    {isOnline
                      ? 'Enregistrer & Synchroniser maintenant'
                      : 'Stocker en File Locale (Hors-Ligne)'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Colonne Droite : File d'attente + Diagnostics PWA */}
        <div className="lg:col-span-5 space-y-5">
          {/* File d'attente locale */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  File d'Attente Locale & Historique
                </h2>
                <p className="text-xs text-slate-400 tabular-nums">
                  {pendingItems.length} en attente · {syncedItems.length} synchronisée(s)
                </p>
              </div>

              {syncedItems.length > 0 && (
                <button
                  onClick={() => {
                    if (company) {
                      clearSyncedOfflineItems(company.id);
                      refreshLocalQueue();
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                >
                  Purger synchronisés
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 text-center space-y-1.5">
                <HardDrive className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">File d'attente vide</p>
                <p className="text-[11px] text-slate-500">
                  Activez « Mode Hors-Ligne Manuel » ou basculez en zone sans réseau pour continuer à saisir vos journaux et pointages.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border bg-slate-950 space-y-1.5 ${
                      item.status === 'PENDING'
                        ? 'border-amber-700/60'
                        : item.status === 'FAILED'
                        ? 'border-red-700/60'
                        : 'border-emerald-800/50 opacity-85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : item.status === 'FAILED'
                              ? 'bg-red-950 text-red-300 border-red-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          }`}
                        >
                          {item.status === 'PENDING'
                            ? 'En attente'
                            : item.status === 'FAILED'
                            ? 'Échec'
                            : 'Synchronisé'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.projectCode}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          removeOfflineQueueItem(item.id);
                          refreshLocalQueue();
                        }}
                        title="Supprimer de la file"
                        className="text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">{item.summary}</p>

                    <div className="text-[10px] text-slate-400 tabular-nums">
                      Saisi le {formatTime(item.createdAt)}
                      {item.syncedAt ? ` · Synchronisé le ${formatTime(item.syncedAt)}` : ''}
                    </div>

                    {item.errorMessage && (
                      <p className="text-[11px] text-red-400">{item.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostics PWA & Installation Mobile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-orange-400" />
              <span>Conformité PWA & Installation Mobile</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Manifeste Web App (`/manifest.webmanifest`)</span>
                <span className="text-emerald-400 font-bold">Conforme</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Service Worker & Cache Chantier</span>
                <span className={swActive ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                  {swActive ? `Actif (${swScope})` : 'Prêt au chargement'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Espaces Cache API détectés</span>
                <span className="text-slate-200 font-bold tabular-nums">{cacheCount}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Mode d'exécution</span>
                <span className="text-slate-200 font-semibold">
                  {isInstalled ? 'Application Installée (Standalone)' : 'Navigateur Web'}
                </span>
              </div>
            </div>

            {!isInstalled && (
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {isIOS
                  ? 'Sur iPhone / iPad Safari : touchez Partager -> Sur l’écran d’accueil.'
                  : 'Sur Android / Chrome / Edge : ouvrez l’application dans un onglet navigateur puis cliquez sur « Installer App » dans le menu latéral ou « Ajouter à l’écran d’accueil ».'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
