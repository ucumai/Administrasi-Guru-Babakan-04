import { BankTpItem } from "../types";

export const DEFAULT_MAPEL_LIST = [
  "Pendidikan Agama dan Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
  "Seni Budaya dan Prakarya",
  "Bahasa Inggris",
  "Muatan Lokal (Bahasa Daerah)"
];

export const DEFAULT_TP_TEMPLATES: Record<string, string[]> = {
  "Matematika": [
    "Memahami dan menyelesaikan operasi hitung bilangan cacah dan pecahan.",
    "Menyelesaikan masalah kontekstual yang berkaitan dengan operasi aritmatika.",
    "Menganalisis, menyajikan, dan menginterpretasikan data dalam bentuk diagram batang dan tabel.",
    "Mengukur keliling dan luas bangun datar menggunakan satuan baku dengan cermat."
  ],
  "Bahasa Indonesia": [
    "Menyimak dan memahami ide pokok serta gagasan pendukung dalam teks bacaan.",
    "Menyampaikan pendapat dan hasil telaah secara runtut, logis, dan santun dalam diskusi.",
    "Menulis teks deskripsi dan narasi dengan kosakata baku serta tanda baca yang tepat.",
    "Membaca teks dengan lafal, intonasi, dan ekspresi yang tepat serta penuh percaya diri."
  ],
  "Ilmu Pengetahuan Alam dan Sosial (IPAS)": [
    "Menganalisis hubungan antara bentuk serta fungsi bagian tubuh tumbuhan dan hewan.",
    "Mengidentifikasi wujud zat dan perubahan bentuk energi dalam kehidupan sehari-hari.",
    "Menjelaskan keragaman bentang alam serta interaksi manusia dengan lingkungan sekitar.",
    "Melakukan penyelidikan ilmiah sederhana dan mencatat hasil pengamatan secara sistematis."
  ],
  "Pendidikan Pancasila": [
    "Menerapkan nilai-nilai luhur Pancasila dalam interaksi di lingkungan sekolah dan rumah.",
    "Menghargai keragaman suku, agama, dan budaya dalam bingkai Bhinneka Tunggal Ika.",
    "Melaksanakan hak dan kewajiban sebagai warga sekolah dengan penuh tanggung jawab.",
    "Mengenal aturan dan norma sosial yang berlaku di lingkungan sekitar dengan disiplin."
  ],
  "Pendidikan Agama dan Budi Pekerti": [
    "Membaca, menghafal, dan memahami makna ayat-ayat suci serta hadis pilihan.",
    "Meneladani kisah keteladanan tokoh dan nabi dalam kehidupan sehari-hari.",
    "Mempraktikkan tata cara ibadah wajib dan sunah dengan tertib dan benar.",
    "Menunjukkan sikap toleransi, kasih sayang, dan saling menghormati antar sesama."
  ],
  "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)": [
    "Mempraktikkan variasi gerak dasar lokomotor, non-lokomotor, dan manipulatif dalam olahraga.",
    "Menunjukkan sportivitas, disiplin, dan kerjasama dalam aktivitas permainan beregu.",
    "Menerapkan pola hidup bersih dan sehat serta menjaga kebersihan lingkungan secara mandiri."
  ],
  "Seni Budaya dan Prakarya": [
    "Mengeksplorasi unsur rupa (garis, bentuk, warna, tekstur) dalam kreasi seni rupa dua/tiga dimensi.",
    "Membuat karya kerajinan tangan fungsional berbahan alami atau daur ulang secara kreatif.",
    "Menampilkan apresiasi karya seni dengan percaya diri dan santun."
  ],
  "Bahasa Inggris": [
    "Mengidentifikasi dan merespons kosakata instruksi sederhana sehari-hari.",
    "Mendeskripsikan benda, warna, dan aktivitas rutin dalam kalimat sederhana.",
    "Membaca kata dan frasa pendek dalam bahasa Inggris dengan pengucapan yang jelas."
  ],
  "Muatan Lokal (Bahasa Daerah)": [
    "Memahami undak-usuk basa / tingkatan bahasa daerah dalam komunikasi santun.",
    "Menyimak dan mengapresiasi cerita rakyat atau tembang/pupuh daerah.",
    "Menulis kalimat sederhana menggunakan kosa kata bahasa daerah secara santun."
  ]
};

/**
 * Retrieve Kurikulum Merdeka default template TPs for any subject name with robust alias matching
 */
export function getDefaultTpTemplateForMapel(mapel: string): string[] {
  if (!mapel) return [
    "memahami konsep dasar dan materi pokok pembelajaran",
    "menerapkan pemahaman dalam menyelesaikan tugas kontekstual",
    "berpikir kritis dan menyajikan hasil pemikiran secara mandiri"
  ];

  if (DEFAULT_TP_TEMPLATES[mapel]) {
    return DEFAULT_TP_TEMPLATES[mapel];
  }

  const mLower = mapel.toLowerCase().trim();

  for (const [key, tps] of Object.entries(DEFAULT_TP_TEMPLATES)) {
    const kLower = key.toLowerCase();
    if (kLower === mLower) return tps;
  }

  if (mLower.includes("matematika") || mLower.includes("mtk") || mLower.includes("hitung")) {
    return DEFAULT_TP_TEMPLATES["Matematika"];
  }
  if (mLower.includes("indo") || mLower.includes("bahasa indonesia")) {
    return DEFAULT_TP_TEMPLATES["Bahasa Indonesia"];
  }
  if (mLower.includes("ipas") || mLower.includes("alam") || mLower.includes("ipa") || mLower.includes("ips")) {
    return DEFAULT_TP_TEMPLATES["Ilmu Pengetahuan Alam dan Sosial (IPAS)"];
  }
  if (mLower.includes("pancasila") || mLower.includes("ppkn") || mLower.includes("kewarganegaraan")) {
    return DEFAULT_TP_TEMPLATES["Pendidikan Pancasila"];
  }
  if (mLower.includes("agama") || mLower.includes("paibp") || mLower.includes("pabp") || mLower.includes("islam")) {
    return DEFAULT_TP_TEMPLATES["Pendidikan Agama dan Budi Pekerti"];
  }
  if (mLower.includes("pjok") || mLower.includes("olahraga") || mLower.includes("penjas")) {
    return DEFAULT_TP_TEMPLATES["Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)"];
  }
  if (mLower.includes("seni") || mLower.includes("sbdp") || mLower.includes("prakarya") || mLower.includes("rupa") || mLower.includes("musik")) {
    return DEFAULT_TP_TEMPLATES["Seni Budaya dan Prakarya"];
  }
  if (mLower.includes("inggris") || mLower.includes("english")) {
    return DEFAULT_TP_TEMPLATES["Bahasa Inggris"];
  }
  if (mLower.includes("sunda") || mLower.includes("jawa") || mLower.includes("daerah") || mLower.includes("mulok") || mLower.includes("muatan lokal")) {
    return DEFAULT_TP_TEMPLATES["Muatan Lokal (Bahasa Daerah)"];
  }

  return [
    `memahami konsep dasar dan materi pokok ${mapel}`,
    `menerapkan pemahaman ${mapel} dalam menyelesaikan tugas kontekstual`,
    `berpikir kritis dan menyajikan hasil evaluasi materi ${mapel} secara mandiri`
  ];
}

export function getFaseByClass(kelas: string): string {
  const k = (kelas || "").toLowerCase();
  if (k.includes("1") || k.includes("2") || k.includes("i ") || k.includes("ii ")) return "Fase A";
  if (k.includes("3") || k.includes("4") || k.includes("iii") || k.includes("iv")) return "Fase B";
  if (k.includes("5") || k.includes("6") || k.includes("v") || k.includes("vi")) return "Fase C";
  if (k.includes("7") || k.includes("8") || k.includes("9") || k.includes("vii") || k.includes("viii") || k.includes("ix")) return "Fase D";
  if (k.includes("10") || k.includes("x")) return "Fase E";
  if (k.includes("11") || k.includes("12") || k.includes("xi") || k.includes("xii")) return "Fase F";
  return "Fase B";
}

/**
 * Clean and format TP text so it connects seamlessly to official report card phrases
 * Example: "TP 1.1: Memahami operasi hitung..." -> "memahami operasi hitung..."
 */
export function cleanTpText(text: string, mapelFallback: string = ""): string {
  let t = (text || "").trim();
  // Remove numbering or prefixes such as "1.1 ", "TP 1.1: ", "TP 1 - ", "1. "
  t = t.replace(/^(TP\s*[\d.]*[:\s-]*|\d+[\.\)]\s*)/i, "").trim();
  // Remove common pedagogical prefixes like "Peserta didik mampu/dapat", "Siswa mampu/dapat", "Mampu", "Dapat"
  t = t.replace(/^(peserta didik mampu|peserta didik dapat|siswa mampu|siswa dapat|mampu|dapat)\s+/i, "").trim();
  if (t.endsWith(".")) t = t.slice(0, -1);
  if (!t) return `konsep materi ${mapelFallback}`.trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * Flexible Subject & Class Matching
 * Memperluas logika pencocokan nama mapel dan kelas agar seluruh entri TP yang ada
 * di Bank TP untuk mapel tersebut 100% langsung ditarik dan digabungkan secara lengkap.
 */
export function filterBankTpItems(
  bankTpList: BankTpItem[],
  mapel: string,
  kelas: string,
  semester?: "Ganjil" | "Genap" | string
): BankTpItem[] {
  if (!bankTpList || bankTpList.length === 0) return [];

  const rawMapel = (mapel || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mapelLower = (mapel || "").toLowerCase().trim();
  const kelasLower = (kelas || "").toLowerCase().trim();
  const rawSem = (semester || "").toLowerCase().trim();
  const semLower = rawSem.includes("genap") || rawSem === "2" ? "genap" : rawSem.includes("ganjil") || rawSem === "1" ? "ganjil" : rawSem;
  const targetFase = getFaseByClass(kelas).toLowerCase().trim();

  // Extract class numeric digits if any (e.g. "Kelas 4" -> "4", "IV" -> "4")
  let classDigits = (kelasLower.match(/\d+/) || [""])[0];
  if (!classDigits) {
    if (kelasLower.includes("i ") || kelasLower === "i" || kelasLower.includes("satu")) classDigits = "1";
    else if (kelasLower.includes("ii") || kelasLower.includes("dua")) classDigits = "2";
    else if (kelasLower.includes("iii") || kelasLower.includes("tiga")) classDigits = "3";
    else if (kelasLower.includes("iv") || kelasLower.includes("empat")) classDigits = "4";
    else if (kelasLower.includes("v") || kelasLower.includes("lima")) classDigits = "5";
    else if (kelasLower.includes("vi") || kelasLower.includes("enam")) classDigits = "6";
  }

  // 1. Flexible Subject Matching
  const mapelMatches = bankTpList.filter((item) => {
    const itemMapel = (item.mapel || "").toLowerCase().trim();
    const rawItemMapel = itemMapel.replace(/[^a-z0-9]/g, "");

    if (itemMapel === mapelLower || itemMapel.includes(mapelLower) || mapelLower.includes(itemMapel)) return true;
    if (rawItemMapel && (rawMapel.includes(rawItemMapel) || rawItemMapel.includes(rawMapel))) return true;

    // Subject aliases
    if (mapelLower.includes("matematika") || mapelLower.includes("mtk") || rawMapel.includes("matematika") || rawMapel.includes("mtk")) {
      return itemMapel.includes("matematika") || itemMapel.includes("mtk") || rawItemMapel.includes("matematika") || rawItemMapel.includes("mtk");
    }
    if (mapelLower.includes("indo") || rawMapel.includes("indo")) {
      return itemMapel.includes("indo") || rawItemMapel.includes("indo");
    }
    if (mapelLower.includes("ipas") || mapelLower.includes("ipa") || mapelLower.includes("ips") || rawMapel.includes("ipas")) {
      return itemMapel.includes("ipas") || itemMapel.includes("ipa") || itemMapel.includes("ips") || rawItemMapel.includes("ipas");
    }
    if (mapelLower.includes("pancasila") || mapelLower.includes("ppkn") || mapelLower.includes("pkn") || rawMapel.includes("pancasila") || rawMapel.includes("ppkn")) {
      return itemMapel.includes("pancasila") || itemMapel.includes("ppkn") || itemMapel.includes("pkn") || rawItemMapel.includes("pancasila") || rawItemMapel.includes("ppkn");
    }
    if (mapelLower.includes("agama") || mapelLower.includes("paibp") || mapelLower.includes("pabp") || mapelLower.includes("pai") || mapelLower.includes("islam") || mapelLower.includes("kristen") || mapelLower.includes("katolik")) {
      return itemMapel.includes("agama") || itemMapel.includes("paibp") || itemMapel.includes("pabp") || itemMapel.includes("pai") || itemMapel.includes("islam") || rawItemMapel.includes("agama") || rawItemMapel.includes("paibp") || rawItemMapel.includes("pabp");
    }
    if (mapelLower.includes("pjok") || mapelLower.includes("olahraga") || mapelLower.includes("penjas") || rawMapel.includes("pjok")) {
      return itemMapel.includes("pjok") || itemMapel.includes("olahraga") || itemMapel.includes("penjas") || rawItemMapel.includes("pjok");
    }
    if (mapelLower.includes("seni") || mapelLower.includes("sbdp") || mapelLower.includes("prakarya") || rawMapel.includes("seni") || rawMapel.includes("sbdp")) {
      return itemMapel.includes("seni") || itemMapel.includes("sbdp") || itemMapel.includes("prakarya") || rawItemMapel.includes("seni") || rawItemMapel.includes("sbdp");
    }
    if (mapelLower.includes("inggris") || mapelLower.includes("english") || rawMapel.includes("inggris") || rawMapel.includes("english")) {
      return itemMapel.includes("inggris") || itemMapel.includes("english") || rawItemMapel.includes("inggris") || rawItemMapel.includes("english");
    }
    if (mapelLower.includes("daerah") || mapelLower.includes("mulok") || mapelLower.includes("muatan lokal") || mapelLower.includes("sunda") || mapelLower.includes("jawa")) {
      return itemMapel.includes("daerah") || itemMapel.includes("mulok") || itemMapel.includes("muatan lokal") || itemMapel.includes("sunda") || itemMapel.includes("jawa");
    }
    if (mapelLower.includes("tematik") || mapelLower.includes("guru kelas") || rawMapel.includes("tematik")) {
      return itemMapel.includes("tematik") || itemMapel.includes("guru kelas") || rawItemMapel.includes("tematik");
    }

    return false;
  });

  if (mapelMatches.length === 0) return [];

  // 2. Flexible Semester Matching
  let semesterFiltered = mapelMatches;
  if (semLower && semLower !== "semua") {
    const exactSem = mapelMatches.filter((item) => {
      const itemSem = (item.semester || "").toLowerCase().trim();
      return (
        itemSem === semLower ||
        (semLower === "ganjil" && (itemSem.includes("ganjil") || itemSem === "1")) ||
        (semLower === "genap" && (itemSem.includes("genap") || itemSem === "2"))
      );
    });
    // If exact semester matches exist, include them and any general/all-semester TPs
    if (exactSem.length > 0) {
      const allSemItems = mapelMatches.filter((item) => {
        const itemSem = (item.semester || "").toLowerCase().trim();
        return !item.semester || itemSem === "semua" || itemSem === "semua semester" || itemSem === "";
      });
      semesterFiltered = [...exactSem, ...allSemItems];
    }
  }

  // 3. Strict Class Matching (Sesuai Kelas, Bukan Fase)
  // Memastikan hanya mengambil TP dari kelas yang bersangkutan dan tidak tercampur kelas lain dalam satu fase.
  const classMatches: BankTpItem[] = [];

  semesterFiltered.forEach((item) => {
    const itemK = (item.kelas || "").toLowerCase().trim();
    const itemDigits = (itemK.match(/\d+/) || [""])[0];
    const isSemuaKelas = !item.kelas || itemK === "semua kelas" || itemK === "semua" || itemK === "" || itemK === "semua fase";

    const isExactClass = classDigits && (itemDigits === classDigits || itemK === kelasLower || itemK.includes(kelasLower) || kelasLower.includes(itemK));

    if (isExactClass || isSemuaKelas) {
      if (!classMatches.some((existing) => existing.id === item.id)) {
        classMatches.push(item);
      }
    }
  });

  if (classMatches.length > 0) {
    return classMatches;
  }

  // Fallback to all matching mapel & semester items
  return semesterFiltered;
}

/**
 * Smart Multi-TP Auto-Concatenation
 * Menggabungkan seluruh TP menjadi satu rangkaian kalimat rapi menggunakan konjungsi Bahasa Indonesia:
 * - 1 TP: "...memahami operasi hitung bilangan cacah"
 * - 2 TP: "...memahami operasi hitung bilangan cacah serta menyelesaikan masalah kontekstual pecahan"
 * - 3+ TP: "...memahami operasi hitung bilangan cacah, menyelesaikan masalah kontekstual pecahan, serta mengukur keliling dan luas bangun datar"
 */
export function concatenateTpTexts(tpList: string[], mapelFallback: string = ""): string {
  if (!tpList || tpList.length === 0) {
    const defaultTemplates = getDefaultTpTemplateForMapel(mapelFallback);
    return concatenateTpTexts(defaultTemplates, mapelFallback);
  }

  // Clean each TP and filter empty or duplicate entries
  const cleaned: string[] = [];
  tpList.forEach((text) => {
    const c = cleanTpText(text, mapelFallback);
    if (c && !cleaned.includes(c)) {
      cleaned.push(c);
    }
  });

  if (cleaned.length === 0) {
    return `konsep materi pokok ${mapelFallback}`.trim();
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  if (cleaned.length === 2) {
    return `${cleaned[0]} serta ${cleaned[1]}`;
  }

  // 3 or more TPs
  const allExceptLast = cleaned.slice(0, -1).join(", ");
  const last = cleaned[cleaned.length - 1];
  return `${allExceptLast}, serta ${last}`;
}

/**
 * Simple Multi-TP Auto-Concatenation & KKTP-Based Score Mapping
 *
 * Logika Deskripsi Rapor Berdasarkan Standar Ketuntasan (KKTP = 75):
 * • Nilai >= KKTP (Tuntas):
 *   - Capaian Tertinggi:
 *     "Menunjukkan penguasaan sangat baik dalam [Daftar Seluruh TP dari Bank TP Kelas]."
 *   - Perlu Peningkatan / Bimbingan:
 *     "Pertahankan prestasi dan tingkatkan kemandirian dalam pendalaman [Daftar Seluruh TP dari Bank TP Kelas]."
 * • Nilai < KKTP (Belum Tuntas / Remedial):
 *   - Capaian Tertinggi:
 *     "Menunjukkan kemauan belajar dan pemahaman dasar dalam [Daftar Seluruh TP dari Bank TP Kelas]."
 *   - Perlu Peningkatan / Bimbingan:
 *     "Perlu peningkatan konsistensi pemahaman dan pendampingan dalam [Daftar Seluruh TP dari Bank TP Kelas]."
 */
export function generateDynamicTpDescription(
  mapel: string,
  nilaiNum: number,
  tpTexts?: string[],
  bankItems?: BankTpItem[],
  kktp: number = 75
): { tinggi: string; perluBimbingan: string } {
  // 1. Ambil seluruh TP yang diajarkan pada Mata Pelajaran & Kelas tersebut dari Bank TP
  let rawList: string[] = [];

  if (bankItems && bankItems.length > 0) {
    rawList = bankItems
      .map((b) => b.tujuanPembelajaran)
      .filter((t) => typeof t === "string" && t.trim().length > 0);
  }

  // 2. Smart Fallback: gunakan tpTexts atau template resmi bawaan jika Bank TP belum diisi
  if (rawList.length === 0 && tpTexts && tpTexts.length > 0) {
    rawList = tpTexts.filter((t) => typeof t === "string" && t.trim().length > 0);
  }

  if (rawList.length === 0) {
    rawList = getDefaultTpTemplateForMapel(mapel);
  }

  // 3. Gabungkan seluruh TP secara alami (Smart Concatenation)
  const joinedTps = concatenateTpTexts(rawList, mapel);

  // 4. Standar Ketuntasan (> 75 vs <= 75)
  const num = Number(nilaiNum);

  if (num > 75) {
    return {
      tinggi: `Menunjukkan penguasaan sangat baik dalam ${joinedTps}.`,
      perluBimbingan: `Pertahankan prestasi dan tingkatkan kemandirian dalam pendalaman ${joinedTps}.`
    };
  } else {
    return {
      tinggi: `Perlu peningkatan konsistensi pemahaman dan pendampingan dalam ${joinedTps}.`,
      perluBimbingan: `Perlu peningkatan konsistensi pemahaman dan pendampingan dalam ${joinedTps}.`
    };
  }
}
