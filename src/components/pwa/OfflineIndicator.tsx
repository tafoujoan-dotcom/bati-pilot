import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { UserRole } from '../../types';
import { loadOfflineQueue, syncOfflineQueueNow, SyncQueueOutcome } from '../../utils/offlineStore';
import { CheckCircle2, CloudUpload, RefreshCw, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  companyId?: string;
  userRole?: UserRole;
  authorName?: string;
  onOpenPwaView?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  companyId,
  userRole,
  authorName,
  onOpenPwaView,
}) => {
  const { isOnline, simulatedOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncToast, setAutoSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const refreshCount = () => {
      const items = loadOfflineQueue(companyId);
      setPendingCount(items.filter((i) => i.status === 'PENDING').length);
    };
    refreshCount();
    window.addEventListener('bati-pilot-queue-updated', refreshCount);
    window.addEventListener('storage', refreshCount);
    return () => {
      window.removeEventListener('bati-pilot-queue-updated', refreshCount);
      window.removeEventListener('storage', refreshCount);
    };
  }, [companyId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onSyncStart = () => setIsSyncing(true);
    const onSyncComplete = (e: Event) => {
      setIsSyncing(false);
      const detail = (e as CustomEvent<SyncQueueOutcome>).detail;
      if (detail?.auto && detail.syncedCount > 0) {
        setAutoSyncToast(
          `Synchro auto : ${detail.syncedCount} saisie(s) envoyée(s) dès le retour réseau`
        );
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => setAutoSyncToast(null), 5000);
      }
    };
    const onSyncError = () => setIsSyncing(false);

    window.addEventListener('bati-pilot-sync-start', onSyncStart);
    window.addEventListener('bati-pilot-sync-complete', onSyncComplete);
    window.addEventListener('bati-pilot-sync-error', onSyncError);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('bati-pilot-sync-start', onSyncStart);
      window.removeEventListener('bati-pilot-sync-complete', onSyncComplete);
      window.removeEventListener('bati-pilot-sync-error', onSyncError);
    };
  }, []);

  // Synchronisation automatique dès le retour de la connexion (4G / Wi-Fi ou fin Zone Blanche)
  useEffect(() => {
    if (!isOnline || !companyId || !userRole || userRole === 'WORKER' || pendingCount === 0) {
      return;
    }
    syncOfflineQueueNow({
      companyId,
      userRole,
      authorName: authorName || 'Équipe Chantier',
      auto: true,
    }).catch(() => {
      // Silencieux en mode auto si le réseau coupe à nouveau pendant l'envoi
    });
  }, [isOnline, companyId, userRole, authorName, pendingCount]);

  if (isOnline && pendingCount === 0 && !isSyncing && !autoSyncToast) {
    return null;
  }

  return (
    <button
      onClick={onOpenPwaView}
      className={`fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xl border cursor-pointer transition-colors ${
        !isOnline
          ? 'bg-amber-950/95 border-amber-500/60 text-amber-200 hover:bg-amber-900'
          : autoSyncToast && pendingCount === 0 && !isSyncing
          ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 hover:bg-emerald-900'
          : 'bg-slate-900/95 border-orange-500/60 text-orange-200 hover:bg-slate-800'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {simulatedOffline ? 'Mode Zone Blanche (Simulé)' : 'Mode Hors-Ligne'} · Données locales actives
            {pendingCount > 0 ? ` · ${pendingCount} en attente` : ''}
          </span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-spin" />
          <span>Synchronisation automatique en cours...</span>
        </>
      ) : autoSyncToast && pendingCount === 0 ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{autoSyncToast}</span>
        </>
      ) : (
        <>
          <CloudUpload className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="tabular-nums">
            {userRole === 'WORKER'
              ? `${pendingCount} saisie(s) en attente (profil Ouvrier lecture seule)`
              : `${pendingCount} saisie(s) chantier prête(s) à synchroniser`}
          </span>
        </>
      )}
    </button>
  );
};
