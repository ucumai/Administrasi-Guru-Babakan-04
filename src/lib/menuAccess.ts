import { Pengaturan, User, RoleUser } from "../types";

export interface ConfigurableMenu {
  id: string;
  label: string;
  group: "MENU UTAMA" | "AKADEMIK" | "KECERDASAN BUATAN (AI)" | "SISTEM & OUTPUT";
  deskripsi: string;
}

export const ALL_CONFIGURABLE_MENUS: ConfigurableMenu[] = [
  // MENU UTAMA
  { 
    id: "dashboard", 
    label: "Dashboard", 
    group: "MENU UTAMA", 
    deskripsi: "Ringkasan statistik kehadiran, nilai, dan aktivitas sekolah" 
  },
  { 
    id: "absen_kedatangan", 
    label: "Absen Kedatangan Pagi", 
    group: "MENU UTAMA", 
    deskripsi: "Pemindaian barcode/QR code presensi kedatangan siswa pagi" 
  },
  { 
    id: "siswa", 
    label: "Kelola Siswa", 
    group: "MENU UTAMA", 
    deskripsi: "Master data siswa, NISN, rombel, dan mutasi kelas" 
  },
  { 
    id: "kartu", 
    label: "Cetak Kartu QR", 
    group: "MENU UTAMA", 
    deskripsi: "Pencetakan kartu pelajar ber-QR Code untuk presensi" 
  },
  { 
    id: "mapel", 
    label: "Kelola Mapel", 
    group: "MENU UTAMA", 
    deskripsi: "Master daftar mata pelajaran sekolah per semester" 
  },

  // AKADEMIK
  { 
    id: "jadwal", 
    label: "Jadwal Mengajar", 
    group: "AKADEMIK", 
    deskripsi: "Jadwal jam pelajaran dan alokasi waktu mengajar guru" 
  },
  { 
    id: "absensi", 
    label: "Input Absensi", 
    group: "AKADEMIK", 
    deskripsi: "Pencatatan presensi harian siswa (Hadir, Sakit, Izin, Alpa)" 
  },
  { 
    id: "penilaian", 
    label: "Input Penilaian", 
    group: "AKADEMIK", 
    deskripsi: "Penginputan nilai formatif, sumatif (UH, PTS, PAS, PAT)" 
  },
  { 
    id: "kuis_interaktif", 
    label: "Kuis & Asesmen Cepat", 
    group: "AKADEMIK", 
    deskripsi: "Kuis digital interaktif, bank soal cepat, dan gamifikasi kelas" 
  },
  { 
    id: "portofolio_p5", 
    label: "Portofolio & Rapor P5", 
    group: "AKADEMIK", 
    deskripsi: "Penilaian dimensi & sub-elemen P5 serta portofolio projek" 
  },
  { 
    id: "bank_tp", 
    label: "Bank TP (Tujuan Pembelajaran)", 
    group: "AKADEMIK", 
    deskripsi: "Katalog Tujuan Pembelajaran Kurikulum Merdeka Fase A-F" 
  },
  { 
    id: "raport", 
    label: "Cetak Raport Siswa", 
    group: "AKADEMIK", 
    deskripsi: "Modul cetak raport resmi Kurikulum Merdeka (F4) & ekspor PDF" 
  },
  { 
    id: "point_kedisiplinan", 
    label: "Point Kedisiplinan Siswa", 
    group: "AKADEMIK", 
    deskripsi: "Pencatatan poin pelanggaran dan apresiasi berbasis saldo 100" 
  },
  { 
    id: "agenda", 
    label: "Agenda Mengajar", 
    group: "AKADEMIK", 
    deskripsi: "Buku jurnal agenda harian KBM dan catatan keterlaksanaan" 
  },
  { 
    id: "bimbingan", 
    label: "Bimbingan Guru Wali", 
    group: "AKADEMIK", 
    deskripsi: "Catatan kasus, konseling, dan pembinaan wali kelas" 
  },
  { 
    id: "tabungan", 
    label: "Tabungan Kelas", 
    group: "AKADEMIK", 
    deskripsi: "Pencatatan setoran, penarikan, dan saldo tabungan siswa" 
  },
  { 
    id: "buku_induk", 
    label: "Buku Induk Kelas", 
    group: "AKADEMIK", 
    deskripsi: "Arsip buku induk riwayat data pribadi dan akademik peserta didik" 
  },
  { 
    id: "aset_kelas", 
    label: "Aset Kelas", 
    group: "AKADEMIK", 
    deskripsi: "Inventarisasi barang, sarana prasarana, dan peminjaman kelas" 
  },
  { 
    id: "stok_bhp", 
    label: "Stok Opname BHP", 
    group: "AKADEMIK", 
    deskripsi: "Pengelolaan Barang Habis Pakai (ATK, spidol, kertas)" 
  },
  { 
    id: "downloadperangkat", 
    label: "Download Perangkat Ajar", 
    group: "AKADEMIK", 
    deskripsi: "Pusat download buku guru, buku siswa, dan modul ajar resmi" 
  },

  // KECERDASAN BUATAN (AI)
  { 
    id: "generator_soal", 
    label: "Generator Soal & Bank Soal", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Pembuat otomatis soal pilihan ganda & esai lengkap dengan kunci" 
  },
  { 
    id: "perangkat_ai", 
    label: "Generator Perangkat Ajar AI", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Generator CP, TP, ATP, Prota, Prosem, dan KKTP terpadu AI" 
  },
  { 
    id: "modulai", 
    label: "Modul Ajar AI", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Penyusun Modul Ajar berdiferensiasi dan RPP Deep Learning" 
  },
  { 
    id: "asistenai", 
    label: "Asisten Guru AI", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Konsultan AI pendamping administrasi guru dan ide pembelajaran" 
  },
  { 
    id: "lkpdai", 
    label: "Generator LKPD AI", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Pembuat Lembar Kerja Peserta Didik tematik & kontekstual" 
  },
  { 
    id: "ailainnya", 
    label: "Generator AI Lainnya", 
    group: "KECERDASAN BUATAN (AI)", 
    deskripsi: "Rubrik asesmen, ice breaking, refleksi, dan media ajar kreatif" 
  },

  // SISTEM & OUTPUT
  { 
    id: "cadangan_sheets", 
    label: "Cadangan Google Sheets", 
    group: "SISTEM & OUTPUT", 
    deskripsi: "Ekspor dan sinkronisasi data tabel ke Google Spreadsheet" 
  },
  { 
    id: "laporan", 
    label: "Pusat Laporan", 
    group: "SISTEM & OUTPUT", 
    deskripsi: "Pusat cetak rekapitulasi, buku penilaian, dan berkas PDF" 
  }
];

export const DEFAULT_ROLE_MENUS: Record<"guru_kelas" | "guru_mapel" | "guru_ekskul", string[]> = {
  guru_kelas: [
    "dashboard", "absen_kedatangan", "siswa", "kartu", "mapel",
    "jadwal", "absensi", "penilaian", "kuis_interaktif", "portofolio_p5", "bank_tp",
    "raport", "point_kedisiplinan", "agenda", "bimbingan", "tabungan", "buku_induk",
    "aset_kelas", "stok_bhp", "downloadperangkat",
    "generator_soal", "perangkat_ai", "modulai", "asistenai", "lkpdai", "ailainnya",
    "cadangan_sheets", "laporan"
  ],
  guru_mapel: [
    "dashboard", "absen_kedatangan", "siswa", "kartu", "mapel",
    "jadwal", "absensi", "penilaian", "kuis_interaktif", "portofolio_p5", "bank_tp",
    "raport", "point_kedisiplinan", "agenda", "bimbingan", "downloadperangkat",
    "generator_soal", "perangkat_ai", "modulai", "asistenai", "lkpdai", "ailainnya",
    "cadangan_sheets", "laporan"
  ],
  guru_ekskul: [
    "dashboard", "absen_kedatangan", "siswa", "kartu", "mapel",
    "jadwal", "absensi", "penilaian", "kuis_interaktif", "portofolio_p5", "bank_tp",
    "raport", "point_kedisiplinan", "agenda", "cadangan_sheets", "laporan"
  ]
};

/**
 * Checks if a specific menu ID is permitted for the given user.
 * Administrator ALWAYS has access to 100% of menus.
 */
export function isMenuAllowedForUser(
  menuId: string, 
  user?: User | null, 
  config?: Pengaturan
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  // Admin exclusive menus
  if (menuId === "pengaturan" || menuId === "resetdb") {
    return false;
  }

  // 1. User specific custom allowed menus
  if (Array.isArray(user.customAllowedMenus) && user.customAllowedMenus.length > 0) {
    return user.customAllowedMenus.includes(menuId);
  }

  // 2. Role based config overrides from Admin
  const role = user.role as "guru_kelas" | "guru_mapel" | "guru_ekskul";
  if (role && config?.menuAksesGuru && Array.isArray(config.menuAksesGuru[role])) {
    return config.menuAksesGuru[role]!.includes(menuId);
  }

  // 3. System role default
  if (role && DEFAULT_ROLE_MENUS[role]) {
    return DEFAULT_ROLE_MENUS[role].includes(menuId);
  }

  return true;
}
