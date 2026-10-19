export type SyncMode = "auto" | "zero_cost" | "realtime";

export const DEFAULT_TTL_MINUTES = 30;

const SYNC_MODE_KEY = "edadmin_sync_mode";
const FRESHNESS_PREFIX = "edadmin_fresh_";
const STATS_KEY = "edadmin_sync_stats";

type SyncModeListener = (mode: SyncMode) => void;
type RefreshListener = (collectionName?: string) => void;

const syncModeListeners = new Set<SyncModeListener>();
const refreshListeners = new Set<RefreshListener>();

export function getSyncMode(): SyncMode {
  try {
    const saved = localStorage.getItem(SYNC_MODE_KEY);
    if (saved === "zero_cost" || saved === "realtime" || saved === "auto") {
      return saved;
    }
  } catch {}
  return "auto";
}

export function setSyncMode(mode: SyncMode): void {
  try {
    localStorage.setItem(SYNC_MODE_KEY, mode);
  } catch {}
  syncModeListeners.forEach((fn) => {
    try {
      fn(mode);
    } catch (e) {
      console.error(e);
    }
  });
}

export function onSyncModeChange(callback: SyncModeListener): () => void {
  syncModeListeners.add(callback);
  return () => {
    syncModeListeners.delete(callback);
  };
}

export function triggerRefresh(collectionName?: string): void {
  refreshListeners.forEach((fn) => {
    try {
      fn(collectionName);
    } catch (e) {
      console.error(e);
    }
  });
}

export function onRefreshRequest(callback: RefreshListener): () => void {
  refreshListeners.add(callback);
  return () => {
    refreshListeners.delete(callback);
  };
}

export function markCollectionFresh(collectionName: string): void {
  try {
    localStorage.setItem(`${FRESHNESS_PREFIX}${collectionName}`, Date.now().toString());
  } catch {}
}

export function isCollectionFresh(collectionName: string, ttlMinutes = DEFAULT_TTL_MINUTES): boolean {
  try {
    const timestampStr = localStorage.getItem(`${FRESHNESS_PREFIX}${collectionName}`);
    if (!timestampStr) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    const elapsedMinutes = (Date.now() - timestamp) / (1000 * 60);
    return elapsedMinutes < ttlMinutes;
  } catch {
    return false;
  }
}

export function recordCacheHit(count = 1): void {
  updateStats((stats) => {
    stats.cacheHits = (stats.cacheHits || 0) + count;
  });
}

export function recordServerWrite(count = 1): void {
  updateStats((stats) => {
    stats.serverWrites = (stats.serverWrites || 0) + count;
  });
}

export function recordLastSyncTime(): void {
  updateStats((stats) => {
    stats.lastSyncTime = Date.now();
  });
}

export function setQuotaExceededStateInStats(exceeded: boolean): void {
  updateStats((stats) => {
    stats.isQuotaExceeded = exceeded;
    if (exceeded) {
      stats.lastQuotaExceededTime = Date.now();
    }
  });
}

export interface SyncStats {
  cacheHits: number;
  serverWrites: number;
  lastSyncTime: number | null;
  isQuotaExceeded: boolean;
  lastQuotaExceededTime: number | null;
}

export function getStats(): SyncStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  return {
    cacheHits: 0,
    serverWrites: 0,
    lastSyncTime: null,
    isQuotaExceeded: false,
    lastQuotaExceededTime: null,
  };
}

function updateStats(updater: (stats: SyncStats) => void): void {
  try {
    const stats = getStats();
    updater(stats);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}
