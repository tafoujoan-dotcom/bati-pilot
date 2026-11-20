import { OfflineQueueItem, UserRole } from '../types';

const QUEUE_KEY = 'bati_pilot_offline_queue_v1';
const LAST_SYNC_KEY = 'bati_pilot_last_sync_v1';

export interface PwaBootstrapPack {
  generatedAt: string;
  projects: {
    id: string;
    code: string;
    name: string;
    city: string;
    progressPercentage: number;
  }[];
  workers: {
    id: string;
    projectId: string;
    matricule: string;
    firstName: string;
    lastName: string;
    specialty: string;
  }[];
  tasks: {
    id: string;
    projectId: string;
    lotName: string;
    title: string;
    progressPercentage: number;
    status: string;
  }[];
}

export function loadOfflineQueue(companyId?: string): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: OfflineQueueItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return companyId ? parsed.filter((i) => i.companyId === companyId) : parsed;
  } catch {
    return [];
  }
}

export function saveOfflineQueue(allItems: OfflineQueueItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(allItems));
    window.dispatchEvent(new CustomEvent('bati-pilot-queue-updated'));
  } catch {
    // ignore storage errors
  }
}

export function enqueueOfflineItem(item: OfflineQueueItem) {
  const all = loadOfflineQueue();
  saveOfflineQueue([item, ...all]);
}

export function updateQueueItemsAfterSync(
  companyId: string,
  receipts: { id: string; status: 'SYNCED' | 'FAILED'; message: string; syncedAt: string }[]
) {
  const map = new Map(receipts.map((r) => [r.id, r]));
  const all = loadOfflineQueue();
  const updated = all.map((item) => {
    if (item.companyId !== companyId) return item;
    const rec = map.get(item.id);
    if (!rec) return item;
    return {
      ...item,
      status: rec.status,
      syncedAt: rec.syncedAt,
      errorMessage: rec.status === 'FAILED' ? rec.message : undefined,
    };
  });
  saveOfflineQueue(updated);
  try {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function removeOfflineQueueItem(id: string) {
  const all = loadOfflineQueue().filter((i) => i.id !== id);
  saveOfflineQueue(all);
}

export function clearSyncedOfflineItems(companyId: string) {
  const all = loadOfflineQueue().filter(
    (i) => !(i.companyId === companyId && i.status === 'SYNCED')
  );
  saveOfflineQueue(all);
}

export function getLastSyncTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function saveCachedBootstrap(companyId: string, pack: PwaBootstrapPack) {
  try {
    localStorage.setItem(`bati_pilot_pwa_pack_${companyId}`, JSON.stringify(pack));
  } catch {
    // ignore
  }
}

export function loadCachedBootstrap(companyId: string): PwaBootstrapPack | null {
  try {
    const raw = localStorage.getItem(`bati_pilot_pwa_pack_${companyId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface SyncQueueOutcome {
  syncedCount: number;
  failedCount: number;
  message: string;
  auto: boolean;
}

let activeSyncPromise: Promise<SyncQueueOutcome | null> | null = null;

export async function syncOfflineQueueNow(params: {
  companyId: string;
  userRole: UserRole;
  authorName: string;
  items?: OfflineQueueItem[];
  auto?: boolean;
}): Promise<SyncQueueOutcome | null> {
  const { companyId, userRole, authorName, items, auto = false } = params;

  if (!companyId || userRole === 'WORKER') {
    return null;
  }

  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  const allCompanyItems = loadOfflineQueue(companyId);
  const targets =
    items ||
    allCompanyItems.filter((i) =>
      auto ? i.status === 'PENDING' : i.status === 'PENDING' || i.status === 'FAILED'
    );

  if (targets.length === 0) {
    return { syncedCount: 0, failedCount: 0, message: '', auto };
  }

  activeSyncPromise = (async () => {
    window.dispatchEvent(new CustomEvent('bati-pilot-sync-start', { detail: { auto } }));
    try {
      const res = await fetch('/api/pwa/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          userRole,
          authorName,
          items: targets,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Échec de synchronisation.');
      }
      updateQueueItemsAfterSync(companyId, json.receipts || []);
      const outcome: SyncQueueOutcome = {
        syncedCount: Number(json.syncedCount) || 0,
        failedCount: Number(json.failedCount) || 0,
        message:
          json.message ||
          `${Number(json.syncedCount) || 0} opération(s) synchronisée(s) avec succès.`,
        auto,
      };
      window.dispatchEvent(new CustomEvent('bati-pilot-sync-complete', { detail: outcome }));
      return outcome;
    } catch (err: any) {
      const errMsg = err?.message || 'Erreur réseau pendant la synchronisation.';
      window.dispatchEvent(
        new CustomEvent('bati-pilot-sync-error', { detail: { message: errMsg, auto } })
      );
      if (!auto) {
        throw err;
      }
      return null;
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}
