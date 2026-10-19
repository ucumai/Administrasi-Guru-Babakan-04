import { User } from "../types";

/**
 * Returns the array of class names that the current user is allowed to access.
 * - Admin: All existing classes + default standard classes
 * - Guru Kelas: Strictly their single assigned kelasUtama
 * - Guru Mapel: Multi-classes specified in kelasAkses
 */
export function getAllowedClasses(user: User | null, allExistingClasses: (string | undefined)[] = []): string[] {
  const cleanClasses = allExistingClasses.filter((c): c is string => Boolean(c && c.trim()));
  const uniqueExisting = Array.from(new Set(cleanClasses));

  if (!user || user.role === "admin") {
    const standardSchoolClasses = [
      "Kelas 1", "Kelas 2", "Kelas 3A", "Kelas 3B", "Kelas 4", "Kelas 5", "Kelas 6", 
      "VII A", "VII B", "VIII A", "VIII B", "IX A", "IX B"
    ];
    const ekskulClasses = ["Pramuka", "Silat", "Hadroh", "Drumband"];
    
    // Existing classes with actual data placed FIRST, followed by standard classes, then ekskul
    const combined = [
      ...uniqueExisting,
      ...standardSchoolClasses.filter((c) => !uniqueExisting.includes(c)),
      ...ekskulClasses.filter((c) => !uniqueExisting.includes(c))
    ];
    return combined;
  }

  if (user.role === "guru_kelas") {
    return [user.kelasUtama || uniqueExisting[0] || "VII A"];
  }

  if (user.role === "guru_mapel") {
    if (user.kelasAkses && user.kelasAkses.length > 0) {
      return user.kelasAkses;
    }
    return uniqueExisting.length > 0 ? uniqueExisting : ["VII A", "VII B"];
  }

  if (user.role === "guru_ekskul") {
    if (user.kelasAkses && user.kelasAkses.length > 0) {
      return user.kelasAkses;
    }
    if (user.kelasUtama) {
      return [user.kelasUtama];
    }
    const defaultClasses = ["Kelas 1", "Kelas 2", "Kelas 3A", "Kelas 3B", "Kelas 4", "Kelas 5", "Kelas 6", "Pramuka", "Silat", "Hadroh", "Drumband"];
    return Array.from(new Set([...uniqueExisting, ...defaultClasses]));
  }

  return uniqueExisting.length > 0 ? uniqueExisting : ["VII A"];
}

/**
 * Helper to check if a specific record (Siswa, Absensi, Nilai, Agenda, etc.)
 * belongs to a class accessible by the user.
 */
export function isRecordAllowedByClass<T extends { kelas?: string }>(item: T, user: User | null): boolean {
  if (!user || user.role === "admin") return true;
  if (!item.kelas) return true;

  if (user.role === "guru_kelas") {
    return !user.kelasUtama || user.kelasUtama === item.kelas;
  }
  if (user.role === "guru_mapel") {
    if (!user.kelasAkses || user.kelasAkses.length === 0) return true;
    return user.kelasAkses.includes(item.kelas);
  }
  if (user.role === "guru_ekskul") {
    if (user.kelasAkses && user.kelasAkses.length > 0) {
      return user.kelasAkses.includes(item.kelas);
    }
    if (user.kelasUtama) {
      return user.kelasUtama === item.kelas;
    }
    return true;
  }
  return true;
}
