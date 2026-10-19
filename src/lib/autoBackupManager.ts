/**
 * Auto Backup & Fallback Manager
 * Provides graceful data recovery and fallback to local snapshot/cached storage
 * when Firestore quota is exhausted or connection is offline.
 */

export function autoFallbackFromGoogleSheetsOrSnapshot(): void {
  try {
    console.warn("[AutoBackupManager] Quota exceeded or network offline: activating local snapshot fallback mode.");
    
    // Ensure all critical collections in localStorage cache are preserved
    const collections = [
      "users",
      "data_siswa",
      "mapel",
      "jadwal",
      "log_absensi",
      "data_nilai",
      "pengaturan",
      "jurnal_agenda",
      "tabungan_kelas",
      "bank_soal"
    ];

    collections.forEach((col) => {
      const cacheKey = `edadmin_cache_${col}`;
      if (!localStorage.getItem(cacheKey)) {
        // Attempt to check if an emergency snapshot exists
        const snapshot = localStorage.getItem(`edadmin_snapshot_${col}`);
        if (snapshot) {
          localStorage.setItem(cacheKey, snapshot);
        }
      }
    });
  } catch (err) {
    console.warn("[AutoBackupManager] Error during fallback:", err);
  }
}

export function createEmergencySnapshot(collectionName: string, data: any[]): void {
  try {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(`edadmin_snapshot_${collectionName}`, JSON.stringify(data));
    }
  } catch {}
}
