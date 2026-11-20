import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BtpNotification,
  NotificationCategory,
  NotificationChannel,
  NotificationPreferences,
  NotificationSeverity,
  UserRole,
} from '../../types';
import { ROLE_LABELS } from '../../utils/permissions';
import {
  AlertOctagon,
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Filter,
  Info,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Smartphone,
  X,
} from 'lucide-react';

type StepTarget =
  | 'step6'
  | 'step8'
  | 'step9'
  | 'step10'
  | 'step11'
  | 'step12'
  | 'step13';

interface NotificationsViewProps {
  onNavigateStep?: (step: StepTarget) => void;
}

interface NotificationsOverviewResponse {
  notifications: BtpNotification[];
  preferences: NotificationPreferences;
  stats: {
    totalActive: number;
    unreadCount: number;
    criticalCount: number;
    highCount: number;
    dynamicActionCount: number;
    activeChannelsCount: number;
    categoryCounts: Record<NotificationCategory, number>;
  };
  projects: { id: string; code: string; name: string }[];
}

const CATEGORY_META: Record<NotificationCategory, { label: string; colorClass: string }> = {
  STOCK: {
    label: 'Stocks & Dépôt',
    colorClass: 'bg-amber-950/60 text-amber-300 border-amber-800/70',
  },
  ACHATS_DG: {
    label: 'Achats & Visa DG',
    colorClass: 'bg-orange-950/60 text-orange-300 border-orange-800/70',
  },
  LIVRAISON_LITIGE: {
    label: 'Litiges Réception BL',
    colorClass: 'bg-rose-950/60 text-rose-300 border-rose-800/70',
  },
  BUDGET: {
    label: 'Budget & Dépenses',
    colorClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/70',
  },
  RH_PAIE: {
    label: 'RH & Paie Ouvriers',
    colorClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70',
  },
  SYSTEME: {
    label: 'Terrain & Consignes',
    colorClass: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

const SEVERITY_META: Record<
  NotificationSeverity,
  { label: string; badgeClass: string; borderClass: string; Icon: React.ElementType }
> = {
  CRITICAL: {
    label: 'Critique',
    badgeClass: 'bg-red-950/80 text-red-300 border-red-800',
    borderClass: 'border-l-4 border-l-red-500',
    Icon: AlertOctagon,
  },
  HIGH: {
    label: 'Importante',
    badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-800',
    borderClass: 'border-l-4 border-l-orange-500',
    Icon: AlertTriangle,
  },
  MEDIUM: {
    label: 'Vigilance',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    borderClass: 'border-l-4 border-l-amber-500',
    Icon: BellRing,
  },
  INFO: {
    label: 'Information',
    badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-800/80',
    borderClass: 'border-l-4 border-l-sky-500',
    Icon: Info,
  },
};

const CHANNEL_META: Record<NotificationChannel, { label: string; Icon: React.ElementType }> = {
  IN_APP: { label: 'In-App', Icon: Bell },
  WHATSAPP: { label: 'WhatsApp', Icon: MessageSquare },
  SMS: { label: 'SMS', Icon: Smartphone },
  EMAIL: { label: 'Email', Icon: Mail },
};

const ALL_ROLES: UserRole[] = [
  'DIRECTOR',
  'SITE_MANAGER',
  'STOREKEEPER',
  'ACCOUNTANT',
  'WORKER',
];

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateStep }) => {
  const { user, company } = useAuth();

  const [data, setData] = useState<NotificationsOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filtres UI
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | NotificationCategory>('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'UNREAD'>('ALL');
  const [onlyMyRole, setOnlyMyRole] = useState<boolean>(false);

  // Modales
  const [broadcastModalOpen, setBroadcastModalOpen] = useState<boolean>(false);
  const [prefsModalOpen, setPrefsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Formulaire Diffusion Manuelle
  const [bCategory, setBCategory] = useState<NotificationCategory>('SYSTEME');
  const [bSeverity, setBSeverity] = useState<NotificationSeverity>('HIGH');
  const [bProjectId, setBProjectId] = useState<string>('ALL');
  const [bTitle, setBTitle] = useState<string>('');
  const [bMessage, setBMessage] = useState<string>('');
  const [bTargetRoles, setBTargetRoles] = useState<UserRole[]>(['DIRECTOR', 'SITE_MANAGER']);
  const [bChannels, setBChannels] = useState<NotificationChannel[]>(['IN_APP', 'WHATSAPP']);
  const [bTargetStep, setBTargetStep] = useState<'' | StepTarget>('');

  // Formulaire Préférences
  const [prefsForm, setPrefsForm] = useState<NotificationPreferences | null>(null);

  const canBroadcast =
    user?.role &&
    ['DIRECTOR', 'SITE_MANAGER', 'STOREKEEPER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);
  const canEditPrefs =
    user?.role && ['DIRECTOR', 'SITE_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(user.role);

  const fetchOverview = async (silent = false) => {
    if (!company || !user) return;
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        companyId: company.id,
        userRole: user.role,
        onlyMyRole: String(onlyMyRole),
      });
      const res = await fetch(`/api/notifications/overview?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Impossible de charger le centre de notifications.');
      setData(json);
      setPrefsForm(json.preferences);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, user?.role, onlyMyRole]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleToggleRead = async (notif: BtpNotification) => {
    if (!company) return;
    try {
      const res = await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, isRead: !notif.isRead }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(json.message);
      await fetchOverview(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    if (!company) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(json.message);
      await fetchOverview(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleArchive = async (notif: BtpNotification) => {
    if (!company) return;
    try {
      const res = await fetch(`/api/notifications/${notif.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showToast(json.message);
      await fetchOverview(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSubmitBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          userRole: user.role,
          authorName: `${user.firstName} ${user.lastName}`,
          category: bCategory,
          severity: bSeverity,
          projectId: bProjectId,
          title: bTitle,
          message: bMessage,
          targetRoles: bTargetRoles,
          channelsSent: bChannels,
          actionTargetStep: bTargetStep || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Échec de diffusion.');
      setBroadcastModalOpen(false);
      setBTitle('');
      setBMessage('');
      setBTargetStep('');
      showToast(json.message);
      await fetchOverview(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user || !prefsForm) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prefsForm,
          companyId: company.id,
          userRole: user.role,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur lors de la sauvegarde.');
      setPrefsModalOpen(false);
      showToast(json.message);
      await fetchOverview(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRoleInBroadcast = (role: UserRole) => {
    setBTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleChannelInBroadcast = (ch: NotificationChannel) => {
    setBChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  const filteredNotifications = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.trim().toLowerCase();
    return data.notifications.filter((n) => {
      if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
      if (quickFilter === 'CRITICAL' && n.severity !== 'CRITICAL') return false;
      if (quickFilter === 'HIGH' && n.severity !== 'HIGH' && n.severity !== 'CRITICAL') return false;
      if (quickFilter === 'UNREAD' && n.isRead) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.projectCode && n.projectCode.toLowerCase().includes(q)) ||
        (n.projectName && n.projectName.toLowerCase().includes(q))
      );
    });
  }, [data, searchQuery, selectedCategory, quickFilter]);

  const formatShortDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', {
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
      {/* En-tête Module 12 (Étape 16) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="text-orange-400 font-semibold">Moteur Temps Réel Multi-Modules</span>
            <span>·</span>
            <span className="text-slate-300 font-medium">{company?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-orange-400 shrink-0" />
            <span>Centre de Notifications & Alertes Métier BTP</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Détection automatique des ruptures de stock, visas DG en attente, litiges de livraison, seuils budgétaires et consignes terrain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchOverview(false)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Resynchroniser les règles métier"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Synchroniser</span>
          </button>

          {canEditPrefs && (
            <button
              onClick={() => setPrefsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              <span>Paramètres Canaux</span>
            </button>
          )}

          {canBroadcast ? (
            <button
              onClick={() => setBroadcastModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-600/20 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Diffuser une Alerte</span>
            </button>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span>Diffusion réservée à l'encadrement</span>
            </div>
          )}
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
            <span>Alertes non lues</span>
            <BellRing className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white tabular-nums">
            {data?.stats.unreadCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            Sur {data?.stats.totalActive ?? 0} alertes actives au total
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Alertes Critiques</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400 tabular-nums">
            {data?.stats.criticalCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            +{data?.stats.highCount ?? 0} alertes importantes à traiter
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Actions métier détectées</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 tabular-nums">
            {data?.stats.dynamicActionCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Stocks, Visa DG, Litiges BL, Budgets & Paie
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Canaux d'escalade actifs</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 tabular-nums">
            {data?.stats.activeChannelsCount ?? 0} / 4
          </p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            WhatsApp : {data?.preferences.whatsappNumber || 'Non configuré'}
          </p>
        </div>
      </div>

      {/* Barre de Filtres & Actions Rapides */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Onglets gravité / statut */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: `Toutes (${data?.stats.totalActive ?? 0})` },
                { id: 'CRITICAL', label: `Critiques (${data?.stats.criticalCount ?? 0})` },
                { id: 'HIGH', label: 'Importantes & Critiques' },
                { id: 'UNREAD', label: `Non lues (${data?.stats.unreadCount ?? 0})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setQuickFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  quickFilter === tab.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyMyRole}
                onChange={(e) => setOnlyMyRole(e.target.checked)}
                className="accent-orange-500 rounded"
              />
              <span>Filtrer selon mon rôle ({user ? ROLE_LABELS[user.role].label : ''})</span>
            </label>

            <button
              onClick={handleMarkAllRead}
              disabled={!data || data.stats.unreadCount === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une alerte, un code chantier, un BC, un BL ou un matériau..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Toutes les catégories métier</option>
              {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].label} ({data?.stats.categoryCounts[cat] ?? 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Notifications & Alertes */}
      {loading && !data ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-400">
          Synchronisation des règles métier BTP en cours...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">Aucune alerte ne correspond à vos filtres</p>
          <p className="text-xs text-slate-400">
            Tous les indicateurs filtrés sont sous contrôle ou archivés.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const sev = SEVERITY_META[notif.severity];
            const cat = CATEGORY_META[notif.category];
            const SevIcon = sev.Icon;

            return (
              <div
                key={notif.id}
                className={`bg-slate-900 border border-slate-800 ${sev.borderClass} rounded-2xl p-4 transition-colors ${
                  notif.isRead ? 'opacity-80' : 'ring-1 ring-orange-500/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Badges ligne 1 */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${sev.badgeClass}`}
                      >
                        <SevIcon className="w-3 h-3" />
                        <span>{sev.label}</span>
                      </span>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cat.colorClass}`}
                      >
                        {cat.label}
                      </span>

                      {!notif.isRead && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-600/20 text-orange-300 border border-orange-500/40 text-[10px] font-bold uppercase tracking-wide">
                          Non lue
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        {notif.isDynamic ? 'Détection temps réel' : 'Diffusion manuelle'} · {formatShortDate(notif.createdAt)}
                      </span>
                    </div>

                    {/* Titre & Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {notif.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Métadonnées chantier, destinataires et canaux */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-400">
                      {notif.projectCode && (
                        <span>
                          Chantier :{' '}
                          <strong className="text-slate-200 font-semibold">
                            {notif.projectCode}
                          </strong>{' '}
                          · {notif.projectName}
                        </span>
                      )}

                      <span>
                        Destinataires :{' '}
                        <span className="text-slate-300">
                          {notif.targetRoles.map((r) => ROLE_LABELS[r]?.label || r).join(', ')}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span>Canaux :</span>
                        {notif.channelsSent.map((ch) => {
                          const ChIcon = CHANNEL_META[ch].Icon;
                          return (
                            <span
                              key={ch}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[10px]"
                            >
                              <ChIcon className="w-2.5 h-2.5 text-orange-400" />
                              <span>{CHANNEL_META[ch].label}</span>
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-start gap-2 shrink-0">
                    {notif.actionTargetStep && onNavigateStep && (
                      <button
                        onClick={() => onNavigateStep(notif.actionTargetStep!)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>{notif.actionLabel || 'Ouvrir le module'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRead(notif)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{notif.isRead ? 'Marquer non lue' : 'Marquer lue'}</span>
                      </button>

                      <button
                        onClick={() => handleArchive(notif)}
                        title="Archiver cette alerte"
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE : DIFFUSER UNE ALERTE MANUELLE */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitBroadcast}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-orange-400" />
                  <span>Diffuser une Alerte Terrain ou Direction</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Envoi immédiat aux équipes sélectionnées via In-App, WhatsApp, SMS ou Email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie métier</label>
                  <select
                    value={bCategory}
                    onChange={(e) => setBCategory(e.target.value as NotificationCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {(Object.keys(CATEGORY_META) as NotificationCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Niveau de gravité</label>
                  <select
                    value={bSeverity}
                    onChange={(e) => setBSeverity(e.target.value as NotificationSeverity)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="CRITICAL">Critique (Escalade immédiate)</option>
                    <option value="HIGH">Importante (Action requise)</option>
                    <option value="MEDIUM">Vigilance</option>
                    <option value="INFO">Information terrain</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Chantier concerné</label>
                  <select
                    value={bProjectId}
                    onChange={(e) => setBProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="ALL">Tous les chantiers de l'entreprise</option>
                    {data?.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lien rapide vers un module</label>
                  <select
                    value={bTargetStep}
                    onChange={(e) => setBTargetStep(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Aucun raccourci module</option>
                    <option value="step6">Chantiers & Projets</option>
                    <option value="step8">Personnel & Pointage</option>
                    <option value="step9">Paie & Salaires</option>
                    <option value="step10">Stocks & Dépôt</option>
                    <option value="step11">Bons de Commande</option>
                    <option value="step12">Bons de Livraison</option>
                    <option value="step13">Dépenses & Budgets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Objet de l'alerte *</label>
                <input
                  type="text"
                  required
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="Ex: Arrivée imminente toupie béton B25 — Préparer accès grue"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consigne détaillée *</label>
                <textarea
                  required
                  rows={3}
                  value={bMessage}
                  onChange={(e) => setBMessage(e.target.value)}
                  placeholder="Précisez la consigne opérationnelle ou financière pour les équipes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Rôles destinataires *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => {
                    const active = bTargetRoles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRoleInBroadcast(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                          active
                            ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {ROLE_LABELS[r].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Canaux d'envoi</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CHANNEL_META) as NotificationChannel[]).map((ch) => {
                    const active = bChannels.includes(ch);
                    const ChIcon = CHANNEL_META[ch].Icon;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannelInBroadcast(ch)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                          active
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ChIcon className="w-3.5 h-3.5" />
                        <span>{CHANNEL_META[ch].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Envoi...' : 'Diffuser maintenant'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : PARAMÈTRES CANAUX & RÈGLES MÉTIER */}
      {prefsModalOpen && prefsForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePreferences}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-400" />
                  <span>Règles d'Alertes & Canaux d'Escalade</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configurez les capteurs automatiques et les relais WhatsApp / SMS / Email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrefsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Capteurs automatiques */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Capteurs métier automatiques
                </p>

                {[
                  {
                    key: 'enableCriticalStockAlerts',
                    label: 'Alertes Stocks Critiques & Ruptures',
                  },
                  {
                    key: 'enableDgApprovalAlerts',
                    label: 'Bons de Commande en attente de Visa DG',
                  },
                  {
                    key: 'enableDeliveryDisputeAlerts',
                    label: 'Litiges & Écarts de Réception BL',
                  },
                  {
                    key: 'enableBudgetThresholdAlerts',
                    label: 'Seuils Budgétaires >= 70% & Dépenses à traiter',
                  },
                  {
                    key: 'enablePayrollAlerts',
                    label: 'Fiches de Paie en attente de versement',
                  },
                ].map((rule) => (
                  <label
                    key={rule.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                  >
                    <span className="text-xs font-medium text-slate-200">{rule.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean((prefsForm as any)[rule.key])}
                      onChange={(e) =>
                        setPrefsForm({
                          ...prefsForm,
                          [rule.key]: e.target.checked,
                        })
                      }
                      className="accent-orange-500 w-4 h-4"
                    />
                  </label>
                ))}
              </div>

              {/* Canaux */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Canaux d'escalade multicanal
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'inApp', label: 'Notifications In-App' },
                    { key: 'whatsapp', label: 'Passerelle WhatsApp BTP' },
                    { key: 'sms', label: 'SMS Secours Terrain' },
                    { key: 'email', label: 'Synthèse Email Direction' },
                  ].map((ch) => (
                    <label
                      key={ch.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-200">{ch.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((prefsForm.channels as any)[ch.key])}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            channels: {
                              ...prefsForm.channels,
                              [ch.key]: e.target.checked,
                            },
                          })
                        }
                        className="accent-orange-500 w-4 h-4"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Numéro WhatsApp / SMS DG</span>
                    </label>
                    <input
                      type="text"
                      value={prefsForm.whatsappNumber}
                      onChange={(e) =>
                        setPrefsForm({ ...prefsForm, whatsappNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Email Digest Direction</span>
                    </label>
                    <input
                      type="email"
                      value={prefsForm.digestEmail}
                      onChange={(e) =>
                        setPrefsForm({ ...prefsForm, digestEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setPrefsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer les règles'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
