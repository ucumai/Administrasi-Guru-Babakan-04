export type SyncMode = "auto" | "zero_cost" | "realtime";

export const DEFAULT_TTL_MINUTES = 30;

// Specific TTL per collection type to maximize cache hits
export const COLLECTION_TTL_MAP: Record<string, number> = {
  // Static / Master Data: 12 Hours TTL
  "mapel": 720,
  "bank_tp": 720,
  "pengaturan": 720,
  // School Entities: 3 Hours TTL
  "data_siswa": 180,
  "users": 180,
  "jadwal": 180,
  // Curriculum / Bank Soal: 2 Hours TTL
  "bank_soal": 120,
  "kuis_paket": 120,
  "p5_projek": 120,
  "p5_penilaian": 120,
  "p5_portofolio": 120,
  // Dynamic / Activity Logs: 30 Minutes TTL
  "data_nilai": 30,
  "raport_records": 30,
  "log_absensi": 30,
  "presensi_kedatangan": 30,
  "tabungan_kelas": 30,
  "aset_kelas": 60,
  "peminjaman_aset": 60,
  "bhp_kelas": 60,
  "pemakaian_bhp": 60,
  "jurnal_agenda": 60,
  "siswa_bimbingan": 60,
  "bimbingan_wali": 60,
  "buku_induk_siswa": 60,
};

export function getCollectionTTL(collectionName: string): number {
  return COLLECTION_TTL_MAP[collectionName] || DEFAULT_TTL_MINUTES;
}

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

export function markCollectionFresh(collectionName: string, scopeKey?: string): void {
  try {
    const nowStr = Date.now().toString();
    localStorage.setItem(`${FRESHNESS_PREFIX}${collectionName}`, nowStr);
    if (scopeKey) {
      localStorage.setItem(`${FRESHNESS_PREFIX}${collectionName}_${scopeKey}`, nowStr);
    }
  } catch {}
}

export function isCollectionFresh(collectionName: string, customTtl?: number, scopeKey?: string): boolean {
  try {
    const key = scopeKey ? `${FRESHNESS_PREFIX}${collectionName}_${scopeKey}` : `${FRESHNESS_PREFIX}${collectionName}`;
    let timestampStr = localStorage.getItem(key);
    if (!timestampStr && scopeKey) {
      // Fallback to collection-level timestamp if scoped timestamp not yet set
      timestampStr = localStorage.getItem(`${FRESHNESS_PREFIX}${collectionName}`);
    }
    if (!timestampStr) return false;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    const ttl = customTtl !== undefined ? customTtl : getCollectionTTL(collectionName);
    const elapsedMinutes = (Date.now() - timestamp) / (1000 * 60);
    return elapsedMinutes < ttl;
  } catch {
    return false;
  }
}

// Idle Tracking for Auto-Disconnect (10 minutes of inactivity)
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
let isIdleState = false;
let idleTimer: any = null;
const idleListeners = new Set<(isIdle: boolean) => void>();

function handleUserActivity() {
  if (isIdleState) {
    isIdleState = false;
    idleListeners.forEach((fn) => {
      try { fn(false); } catch (e) { console.error(e); }
    });
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    isIdleState = true;
    idleListeners.forEach((fn) => {
      try { fn(true); } catch (e) { console.error(e); }
    });
  }, IDLE_TIMEOUT_MS);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
  events.forEach((evt) => {
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });
  handleUserActivity();
}

export function isUserCurrentlyIdle(): boolean {
  return isIdleState;
}

export function onIdleStateChange(listener: (isIdle: boolean) => void): () => void {
  idleListeners.add(listener);
  listener(isIdleState);
  return () => {
    idleListeners.delete(listener);
  };
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
