import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Award, 
  ShieldAlert, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Users, 
  Calendar, 
  FileText, 
  Printer, 
  Download, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Trash2, 
  Clock, 
  UserCheck, 
  Send, 
  Share2, 
  Filter, 
  Settings, 
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Siswa, User, Pengaturan, PointKedisiplinanLog, TataTertibItem } from "../types";
import { KopSuratDinas } from "./KopSuratDinas";
import { 
  saveDocument, 
  deleteDocument, 
  batchSaveDocuments, 
  subscribeCollection, 
  COLLECTIONS 
} from "../lib/firebase";
import { getAllowedClasses, getWaliKelasForClass } from "../lib/accessControl";
import { 
  notifySimpanSuccess, 
  notifySimpanError, 
  confirmDeleteAlert, 
  showToastSuccess 
} from "../lib/swal";
import Swal from "sweetalert2";

interface PointKedisiplinanViewProps {
  siswaList: Siswa[];
  userList?: User[];
  currentUser?: User | null;
  config: Pengaturan;
}

// Master Tata Tertib Bawaan Standar Kurikulum Nasional
export const DEFAULT_TATA_TERTIB: TataTertibItem[] = [
  // Pelanggaran Ringan
  { id: "tt_p_01", kode: "PLG-01", nama: "Seragam tidak lengkap / atribut tidak sesuai tata tertib", jenis: "pelanggaran", kategori: "ringan", pointDefault: 5, keteranganDefault: "Ditegur dan diminta melengkapi atribut seragam" },
  { id: "tt_p_02", kode: "PLG-02", nama: "Datang terlambat masuk sekolah / kelas", jenis: "pelanggaran", kategori: "ringan", pointDefault: 5, keteranganDefault: "Diberi pembinaan disiplin waktu pagi" },
  { id: "tt_p_03", kode: "PLG-03", nama: "Membuang sampah sembarangan di lingkungan sekolah", jenis: "pelanggaran", kategori: "ringan", pointDefault: 5, keteranganDefault: "Diberi tugas memungut dan memilah sampah kelas" },
  { id: "tt_p_04", kode: "PLG-04", nama: "Kuku panjang / rambut tidak rapi / aksesoris terlarang", jenis: "pelanggaran", kategori: "ringan", pointDefault: 5, keteranganDefault: "Diingatkan untuk merapikan kerapian diri" },
  
  // Pelanggaran Sedang
  { id: "tt_p_05", kode: "PLG-05", nama: "Tidak mengerjakan tugas sekolah / PR berulang kali", jenis: "pelanggaran", kategori: "sedang", pointDefault: 10, keteranganDefault: "Bimbingan wali kelas dan penugasan mandiri terstruktur" },
  { id: "tt_p_06", kode: "PLG-06", nama: "Tidak masuk sekolah tanpa keterangan sah (Alpa)", jenis: "pelanggaran", kategori: "sedang", pointDefault: 10, keteranganDefault: "Konfirmasi ke orang tua / wali murid" },
  { id: "tt_p_07", kode: "PLG-07", nama: "Bermain HP / mengganggu ketertiban saat jam pelajaran", jenis: "pelanggaran", kategori: "sedang", pointDefault: 10, keteranganDefault: "HP diamankan sementara sampai jam pulang" },
  { id: "tt_p_08", kode: "PLG-08", nama: "Meninggalkan kelas / lingkungan sekolah tanpa izin (Bolos)", jenis: "pelanggaran", kategori: "sedang", pointDefault: 15, keteranganDefault: "Pembinaan khusus bersama wali kelas dan guru BK" },
  { id: "tt_p_09", kode: "PLG-09", nama: "Berkata kasar, kotor, atau tidak sopan kepada teman/guru", jenis: "pelanggaran", kategori: "sedang", pointDefault: 15, keteranganDefault: "Membuat surat pernyataan dan permohonan maaf santun" },

  // Pelanggaran Berat
  { id: "tt_p_10", kode: "PLG-10", nama: "Melakukan perkelahian / tindak perundungan (Bullying)", jenis: "pelanggaran", kategori: "berat", pointDefault: 30, keteranganDefault: "Panggilan orang tua dan pembinaan intensif kepribadian" },
  { id: "tt_p_11", kode: "PLG-11", nama: "Merusak fasilitas, sarana, atau prasarana sekolah", jenis: "pelanggaran", kategori: "berat", pointDefault: 25, keteranganDefault: "Mengganti/memperbaiki kerusakan dan pembinaan tanggung jawab" },
  { id: "tt_p_12", kode: "PLG-12", nama: "Membawa barang berbahaya / terlarang ke sekolah", jenis: "pelanggaran", kategori: "berat", pointDefault: 35, keteranganDefault: "Penyitaan barang, teguran keras, dan pemanggilan orang tua" },

  // Apresiasi & Prestasi
  { id: "tt_a_01", kode: "APR-01", nama: "Meraih juara lomba akademik / non-akademik (Sekolah/Kec/Kab/Nasional)", jenis: "apresiasi", kategori: "prestasi", pointDefault: 25, keteranganDefault: "Piagam apresiasi dan penambahan poin prestasi" },
  { id: "tt_a_02", kode: "APR-02", nama: "Kehadiran 100% tepat waktu tanpa izin/alpa dalam 1 bulan", jenis: "apresiasi", kategori: "kebiasaan_baik", pointDefault: 15, keteranganDefault: "Penghargaan atas komitmen disiplin kehadiran" },
  { id: "tt_a_03", kode: "APR-03", nama: "Inisiatif membantu guru, teman, atau piket kebersihan kelas", jenis: "apresiasi", kategori: "kebiasaan_baik", pointDefault: 10, keteranganDefault: "Apresiasi keteladanan gotong royong dan kepedulian sosial" },
  { id: "tt_a_04", kode: "APR-04", nama: "Tindakan kejujuran tinggi (menemukan dan mengembalikan barang/uang)", jenis: "apresiasi", kategori: "prestasi", pointDefault: 20, keteranganDefault: "Apresiasi integritas dan kejujuran karakter" },
  { id: "tt_a_05", kode: "APR-05", nama: "Hafalan surat pendek / doa harian / pembiasaan ibadah terbaik", jenis: "apresiasi", kategori: "kebiasaan_baik", pointDefault: 15, keteranganDefault: "Apresiasi karakter religius dan budi pekerti luhur" },
  { id: "tt_a_06", kode: "APR-06", nama: "Peningkatan motivasi & kerapian tugas belajar yang konsisten", jenis: "apresiasi", kategori: "kebiasaan_baik", pointDefault: 10, keteranganDefault: "Apresiasi atas progres belajar yang membanggakan" }
];

export const PointKedisiplinanView: React.FC<PointKedisiplinanViewProps> = ({
  siswaList,
  userList = [],
  currentUser,
  config
}) => {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "input" | "rekap" | "raport" | "aturan">(() => {
    try {
      const saved = localStorage.getItem("edadmin_point_subtab");
      if (saved && ["dashboard", "input", "rekap", "raport", "aturan"].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return "dashboard";
  });

  const handleSubTabChange = (tab: "dashboard" | "input" | "rekap" | "raport" | "aturan") => {
    setActiveSubTab(tab);
    try { localStorage.setItem("edadmin_point_subtab", tab); } catch {}
  };

  // Class Selection
  const allClassNames = useMemo(() => {
    const fromSiswa = siswaList.map((s) => s.kelas).filter(Boolean);
    return Array.from(new Set(fromSiswa));
  }, [siswaList]);

  const allowedClasses = useMemo(() => {
    return getAllowedClasses(currentUser || null, allClassNames);
  }, [currentUser, allClassNames]);

  const [selectedKelas, setSelectedKelas] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("edadmin_point_selected_kelas");
      if (saved && allowedClasses.includes(saved)) return saved;
    } catch {}
    return allowedClasses[0] || "VII A";
  });

  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.includes(selectedKelas)) {
      setSelectedKelas(allowedClasses[0]);
    }
  }, [allowedClasses, selectedKelas]);

  const handleKelasChange = (newKelas: string) => {
    setSelectedKelas(newKelas);
    setSelectedSiswaMulti([]);
    setSelectedReportSiswaId("");
    try { localStorage.setItem("edadmin_point_selected_kelas", newKelas); } catch {}
  };

  // Filtered Students in Active Class
  const classStudents = useMemo(() => {
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Master Tata Tertib State (synced with localStorage & Firestore)
  const [tataTertibList, setTataTertibList] = useState<TataTertibItem[]>(() => {
    try {
      const saved = localStorage.getItem("edadmin_master_tata_tertib");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TATA_TERTIB;
  });

  // Point Logs State (persisted & synced)
  const [pointLogs, setPointLogs] = useState<PointKedisiplinanLog[]>(() => {
    try {
      const saved = localStorage.getItem("edadmin_point_logs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Subscribe to real-time POINT_KEDISIPLINAN and TATA_TERTIB collections
  useEffect(() => {
    const unsubPoints = subscribeCollection<PointKedisiplinanLog>(
      COLLECTIONS.POINT_KEDISIPLINAN,
      (data) => {
        if (data && data.length > 0) {
          setPointLogs(data);
          try { localStorage.setItem("edadmin_point_logs", JSON.stringify(data)); } catch {}
        }
      }
    );

    const unsubAturan = subscribeCollection<TataTertibItem>(
      COLLECTIONS.TATA_TERTIB,
      (data) => {
        if (data && data.length > 0) {
          setTataTertibList(data);
          try { localStorage.setItem("edadmin_master_tata_tertib", JSON.stringify(data)); } catch {}
        }
      }
    );

    return () => {
      unsubPoints();
      unsubAturan();
    };
  }, []);

  // Filtered logs for active class
  const classLogs = useMemo(() => {
    return pointLogs.filter((log) => log.kelas === selectedKelas);
  }, [pointLogs, selectedKelas]);

  // Calculate Balance Poin for Each Student (Base 100)
  const studentScores = useMemo(() => {
    const map: Record<string, {
      siswa: Siswa;
      basePoint: number;
      totalPengurangan: number;
      totalApresiasi: number;
      finalPoint: number;
      predikat: "Sangat Baik" | "Baik" | "Cukup" | "Kurang";
      pelanggaranCount: number;
      apresiasiCount: number;
      logs: PointKedisiplinanLog[];
    }> = {};

    classStudents.forEach((s) => {
      map[s.id] = {
        siswa: s,
        basePoint: 100,
        totalPengurangan: 0,
        totalApresiasi: 0,
        finalPoint: 100,
        predikat: "Sangat Baik",
        pelanggaranCount: 0,
        apresiasiCount: 0,
        logs: []
      };
    });

    classLogs.forEach((log) => {
      if (map[log.idSiswa]) {
        map[log.idSiswa].logs.push(log);
        if (log.jenis === "pelanggaran") {
          map[log.idSiswa].totalPengurangan += Number(log.point || 0);
          map[log.idSiswa].pelanggaranCount += 1;
        } else {
          map[log.idSiswa].totalApresiasi += Number(log.point || 0);
          map[log.idSiswa].apresiasiCount += 1;
        }
      }
    });

    // Compute final points and predikat
    Object.values(map).forEach((item) => {
      const calc = 100 - item.totalPengurangan + item.totalApresiasi;
      item.finalPoint = calc;
      if (calc >= 90) {
        item.predikat = "Sangat Baik";
      } else if (calc >= 76) {
        item.predikat = "Baik";
      } else if (calc >= 60) {
        item.predikat = "Cukup";
      } else {
        item.predikat = "Kurang";
      }
    });

    return map;
  }, [classStudents, classLogs]);

  // Sorted Array of Student Scores
  const studentScoresList = useMemo(() => {
    return Object.values(studentScores).sort((a, b) => b.finalPoint - a.finalPoint);
  }, [studentScores]);

  // =========================================================================
  // FORM INPUT STATE
  // =========================================================================
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const [inputTanggal, setInputTanggal] = useState<string>(getTodayStr());
  const [inputJenis, setInputJenis] = useState<"pelanggaran" | "apresiasi">("pelanggaran");
  const [selectedAturanId, setSelectedAturanId] = useState<string>("");
  const [customAturanText, setCustomAturanText] = useState<string>("");
  const [inputPoint, setInputPoint] = useState<number>(5);
  const [inputKategori, setInputKategori] = useState<string>("ringan");
  const [inputKeterangan, setInputKeterangan] = useState<string>("");
  const [inputTindakLanjut, setInputTindakLanjut] = useState<string>("");
  const [selectedSiswaMulti, setSelectedSiswaMulti] = useState<string[]>([]);
  const [siswaSearchTerm, setSiswaSearchTerm] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Available rules for selected type
  const filteredAturanList = useMemo(() => {
    return tataTertibList.filter((t) => t.jenis === inputJenis);
  }, [tataTertibList, inputJenis]);

  // When Aturan selection changes, update default point & category
  const handleAturanChange = (aturanId: string) => {
    setSelectedAturanId(aturanId);
    if (aturanId === "manual") {
      setCustomAturanText("");
      setInputPoint(inputJenis === "pelanggaran" ? 5 : 10);
      setInputKategori(inputJenis === "pelanggaran" ? "ringan" : "prestasi");
    } else {
      const found = tataTertibList.find((t) => t.id === aturanId);
      if (found) {
        setInputPoint(found.pointDefault);
        setInputKategori(found.kategori);
        if (found.keteranganDefault && !inputTindakLanjut) {
          setInputTindakLanjut(found.keteranganDefault);
        }
      }
    }
  };

  // Reset Aturan when Jenis changes
  const handleJenisChange = (jenis: "pelanggaran" | "apresiasi") => {
    setInputJenis(jenis);
    setSelectedAturanId("");
    setCustomAturanText("");
    setInputPoint(jenis === "pelanggaran" ? 5 : 10);
    setInputKategori(jenis === "pelanggaran" ? "ringan" : "prestasi");
  };

  // Toggle multi-select student
  const handleToggleSiswa = (siswaId: string) => {
    setSelectedSiswaMulti((prev) => {
      if (prev.includes(siswaId)) {
        return prev.filter((id) => id !== siswaId);
      } else {
        return [...prev, siswaId];
      }
    });
  };

  // Select all or deselect all
  const handleSelectAllSiswa = () => {
    if (selectedSiswaMulti.length === classStudents.length) {
      setSelectedSiswaMulti([]);
    } else {
      setSelectedSiswaMulti(classStudents.map((s) => s.id));
    }
  };

  // Submit Point Entry (Supports Multi-Siswa)
  const handleSubmitPoint = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSiswaMulti.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Siswa Terlebih Dahulu!",
        text: "Silakan centang minimal 1 nama siswa yang akan dicatat poin kedisiplinannya."
      });
      return;
    }

    const namaAturanFinal = selectedAturanId === "manual" 
      ? customAturanText.trim() 
      : (tataTertibList.find((t) => t.id === selectedAturanId)?.nama || customAturanText.trim());

    if (!namaAturanFinal) {
      Swal.fire({
        icon: "warning",
        title: "Pilih / Tuliskan Aturan Tata Tertib!",
        text: "Pilih aturan dari dropdown atau ketikkan nama pelanggaran/apresiasi manual."
      });
      return;
    }

    if (!inputPoint || inputPoint <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Jumlah Poin Harus Lebih Dari 0!",
        text: "Masukkan bobot poin yang valid."
      });
      return;
    }

    setIsSubmitting(true);
    const nowTs = Date.now();
    const newLogs: PointKedisiplinanLog[] = [];

    selectedSiswaMulti.forEach((siswaId, idx) => {
      const s = classStudents.find((st) => st.id === siswaId);
      if (s) {
        const logId = `pt_${nowTs}_${s.id}_${idx}`;
        newLogs.push({
          id: logId,
          idSiswa: s.id,
          namaSiswa: s.nama,
          nisn: s.nisn || "-",
          nis: s.nis || "-",
          kelas: selectedKelas,
          tanggal: inputTanggal,
          jenis: inputJenis,
          kategori: inputKategori,
          aturanTataTertib: namaAturanFinal,
          point: Number(inputPoint),
          keterangan: inputKeterangan.trim(),
          tindakLanjut: inputTindakLanjut.trim(),
          dicatatOleh: currentUser?.nama || currentUser?.name || "Guru Kelas",
          createdAt: nowTs + idx,
          updatedAt: nowTs + idx
        });
      }
    });

    try {
      // 1. Batch save to Cloud Firestore
      await batchSaveDocuments(COLLECTIONS.POINT_KEDISIPLINAN, newLogs);

      // 2. Local State & LocalStorage persistence
      const updatedLogs = [...newLogs, ...pointLogs];
      setPointLogs(updatedLogs);
      try {
        localStorage.setItem("edadmin_point_logs", JSON.stringify(updatedLogs));
      } catch {}

      // Reset form fields
      setSelectedSiswaMulti([]);
      setInputKeterangan("");
      setInputTindakLanjut("");
      if (selectedAturanId === "manual") {
        setCustomAturanText("");
      }

      notifySimpanSuccess(`Poin kedisiplinan berhasil dicatat untuk ${newLogs.length} siswa!`);
      handleSubTabChange("dashboard");
    } catch (err: any) {
      notifySimpanError(err?.message || "Gagal menyimpan poin kedisiplinan ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Log Entry
  const handleDeleteLog = async (logId: string) => {
    const isConfirmed = await confirmDeleteAlert(
      "Hapus Catatan Poin?",
      "Catatan poin kedisiplinan ini akan dihapus dan saldo poin siswa akan dikembalikan secara otomatis."
    );
    if (!isConfirmed) return;

    try {
      await deleteDocument(COLLECTIONS.POINT_KEDISIPLINAN, logId);
      const updated = pointLogs.filter((l) => l.id !== logId);
      setPointLogs(updated);
      try { localStorage.setItem("edadmin_point_logs", JSON.stringify(updated)); } catch {}
      showToastSuccess("Catatan poin berhasil dihapus!");
    } catch (err: any) {
      notifySimpanError("Gagal menghapus catatan poin.");
    }
  };

  // =========================================================================
  // REKAPITULASI STATE (Mingguan, Bulanan, Semester, Tahunan)
  // =========================================================================
  const [rekapPeriodType, setRekapPeriodType] = useState<"mingguan" | "bulanan" | "semester" | "tahunan">("bulanan");
  const [rekapSelectedBulan, setRekapSelectedBulan] = useState<string>(() => {
    const m = new Date().getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  });
  const [rekapSelectedYear, setRekapSelectedYear] = useState<string>(() => String(new Date().getFullYear()));
  const [rekapSelectedSemester, setRekapSelectedSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [rekapSearchText, setRekapSearchText] = useState<string>("");

  // Filtered logs by period
  const periodFilteredLogs = useMemo(() => {
    return classLogs.filter((log) => {
      const logDate = log.tanggal || "";
      if (!logDate) return false;
      const [y, m] = logDate.split("-");

      if (rekapPeriodType === "bulanan") {
        return y === rekapSelectedYear && m === rekapSelectedBulan;
      }
      if (rekapPeriodType === "mingguan") {
        // Last 7 days or current month's latest week
        const diffDays = (Date.now() - new Date(logDate).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (rekapPeriodType === "semester") {
        if (rekapSelectedSemester === "Ganjil") {
          return ["07", "08", "09", "10", "11", "12"].includes(m);
        } else {
          return ["01", "02", "03", "04", "05", "06"].includes(m);
        }
      }
      if (rekapPeriodType === "tahunan") {
        return y === rekapSelectedYear;
      }
      return true;
    });
  }, [classLogs, rekapPeriodType, rekapSelectedBulan, rekapSelectedYear, rekapSelectedSemester]);

  // Recalculate scores for selected period
  const rekapPeriodScores = useMemo(() => {
    const map: Record<string, {
      siswa: Siswa;
      basePoint: number;
      pengurangan: number;
      apresiasi: number;
      saldo: number;
      predikat: string;
      logs: PointKedisiplinanLog[];
    }> = {};

    classStudents.forEach((s) => {
      map[s.id] = {
        siswa: s,
        basePoint: 100,
        pengurangan: 0,
        apresiasi: 0,
        saldo: 100,
        predikat: "Sangat Baik",
        logs: []
      };
    });

    periodFilteredLogs.forEach((log) => {
      if (map[log.idSiswa]) {
        map[log.idSiswa].logs.push(log);
        if (log.jenis === "pelanggaran") {
          map[log.idSiswa].pengurangan += Number(log.point || 0);
        } else {
          map[log.idSiswa].apresiasi += Number(log.point || 0);
        }
      }
    });

    Object.values(map).forEach((item) => {
      const calc = 100 - item.pengurangan + item.apresiasi;
      item.saldo = calc;
      if (calc >= 90) item.predikat = "Sangat Baik";
      else if (calc >= 76) item.predikat = "Baik";
      else if (calc >= 60) item.predikat = "Cukup";
      else item.predikat = "Kurang";
    });

    return Object.values(map).filter((item) => {
      if (!rekapSearchText.trim()) return true;
      const term = rekapSearchText.toLowerCase();
      return (
        item.siswa.nama.toLowerCase().includes(term) ||
        (item.siswa.nisn && item.siswa.nisn.includes(term))
      );
    }).sort((a, b) => b.saldo - a.saldo);
  }, [classStudents, periodFilteredLogs, rekapSearchText]);

  // Export Rekap to Excel
  const handleExportRekapExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const headers = [
        "No",
        "NISN",
        "NIS",
        "Nama Siswa",
        "Kelas",
        "Poin Awal",
        "Total Pelanggaran (-)",
        "Total Apresiasi (+)",
        "Poin Akhir",
        "Predikat Disiplin",
        "Status Pembinaan"
      ];

      const dataRows = rekapPeriodScores.map((item, idx) => [
        idx + 1,
        item.siswa.nisn || "-",
        item.siswa.nis || "-",
        item.siswa.nama,
        item.siswa.kelas,
        item.basePoint,
        item.pengurangan,
        item.apresiasi,
        item.saldo,
        item.predikat,
        item.saldo < 75 ? "Perlu Pembinaan Khusus" : "Disiplin Baik"
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 10 },
        { wch: 28 },
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 18 },
        { wch: 12 },
        { wch: 16 },
        { wch: 24 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, "REKAP_POIN_KEDISIPLINAN");
      const filename = `Rekap_Poin_Kedisiplinan_${selectedKelas.replace(/\s+/g, "_")}_${rekapPeriodType}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToastSuccess("File Excel berhasil diunduh!");
    } catch (err: any) {
      notifySimpanError("Gagal mengekspor data ke Excel.");
    }
  };

  // =========================================================================
  // RAPORT KEDISIPLINAN SISWA (FORMAT CETAK & LAPOR KE ORANG TUA)
  // =========================================================================
  const [selectedReportSiswaId, setSelectedReportSiswaId] = useState<string>(() => {
    return classStudents[0]?.id || "";
  });

  useEffect(() => {
    if (classStudents.length > 0 && !selectedReportSiswaId) {
      setSelectedReportSiswaId(classStudents[0].id);
    }
  }, [classStudents, selectedReportSiswaId]);

  const activeReportStudentData = useMemo(() => {
    if (!selectedReportSiswaId) return null;
    return studentScores[selectedReportSiswaId] || null;
  }, [selectedReportSiswaId, studentScores]);

  // Dynamic Wali Kelas signature
  const waliInfo = useMemo(() => {
    return getWaliKelasForClass(selectedKelas, userList, currentUser, config);
  }, [selectedKelas, userList, currentUser, config]);

  // Option to show or hide Kepala Sekolah signature
  const [showTtdKepsek, setShowTtdKepsek] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("edadmin_point_show_ttd_kepsek");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("edadmin_point_show_ttd_kepsek", JSON.stringify(showTtdKepsek));
    } catch {}
  }, [showTtdKepsek]);

  // Print Report Card via Browser
  const reportPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintRaport = () => {
    window.print();
  };

  // Export Individual Report Card to PDF (jsPDF)
  const handleExportRaportPDF = () => {
    if (!activeReportStudentData) return;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const st = activeReportStudentData.siswa;
      const schoolName = (config.Nama_Sekolah || "SD NEGERI BABAKAN 04").toUpperCase();
      const dinasName = (config.Dinas || "DINAS PENDIDIKAN").toUpperCase();
      const govName = (config.Pemerintah || "PEMERINTAH KABUPATEN BOGOR").toUpperCase();

      // Header Instansi
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(govName, 105, 18, { align: "center" });
      doc.text(dinasName, 105, 23, { align: "center" });
      doc.setFontSize(14);
      doc.text(schoolName, 105, 30, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(config.Alamat_Sekolah || "Kp. Babakan Kulon RT.05/02 Desa Babakan Kec. Ciseeng Kab. Bogor", 105, 35, { align: "center" });
      
      // Double Line Header
      doc.setLineWidth(0.8);
      doc.line(15, 38, 195, 38);
      doc.setLineWidth(0.3);
      doc.line(15, 39, 195, 39);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("RAPORT POIN KEDISIPLINAN & PEMBINAAN KARAKTER SISWA", 105, 48, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Tahun Ajaran ${config.Tahun_Ajaran || "2024/2025"} — Kelas ${st.kelas}`, 105, 53, { align: "center" });

      // Student Info Box
      doc.rect(15, 58, 180, 24);
      doc.setFontSize(9);
      doc.text(`Nama Peserta Didik  : ${st.nama}`, 20, 65);
      doc.text(`NISN / NIS          : ${st.nisn || "-"} / ${st.nis || "-"}`, 20, 71);
      doc.text(`Kelas / Rombel      : ${st.kelas}`, 20, 77);

      doc.text(`Poin Awal           : 100 Poin`, 125, 65);
      doc.text(`Total Pelanggaran   : -${activeReportStudentData.totalPengurangan} Poin`, 125, 71);
      doc.text(`Total Apresiasi     : +${activeReportStudentData.totalApresiasi} Poin`, 125, 77);

      // Score Highlight Box
      doc.setFillColor(activeReportStudentData.finalPoint >= 90 ? 240 : activeReportStudentData.finalPoint >= 76 ? 245 : 255, 245, 245);
      doc.roundedRect(15, 86, 180, 16, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`SALDO POIN KEDISIPLINAN SAAT INI : ${activeReportStudentData.finalPoint} POIN`, 20, 94);
      doc.setFontSize(9.5);
      doc.text(`PREDIKAT : ${activeReportStudentData.predikat.toUpperCase()} (${activeReportStudentData.finalPoint >= 76 ? "MEMENUHI STANDAR TERTIB" : "PERLU PEMBINAAN KHUSUS"})`, 20, 99);

      // Table of Logs
      const tableRows = activeReportStudentData.logs.map((l, idx) => [
        idx + 1,
        l.tanggal,
        l.jenis === "pelanggaran" ? "Pelanggaran (-)" : "Apresiasi (+)",
        l.aturanTataTertib,
        l.jenis === "pelanggaran" ? `-${l.point}` : `+${l.point}`,
        l.keterangan || l.tindakLanjut || "-"
      ]);

      if (tableRows.length === 0) {
        tableRows.push(["1", "-", "Apresiasi (+)", "Siswa selalu tertib, berakhlak mulia, dan belum memiliki catatan pelanggaran", "+0", "Pertahankan kedisiplinan baik ini!"]);
      }

      autoTable(doc, {
        startY: 108,
        head: [["No", "Tanggal", "Jenis Tindakan", "Tata Tertib / Kejadian", "Poin", "Catatan / Tindak Lanjut"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 28 },
          3: { cellWidth: 55 },
          4: { cellWidth: 15, halign: "center" },
          5: { cellWidth: 52 }
        }
      });

      // Signatures
      const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 200;
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      if (showTtdKepsek) {
        // 3 Kolom: Orang Tua (x=35), Kepala Sekolah (x=105), Guru Kelas (x=165)
        // Column 1: Parent
        doc.text("Mengetahui,", 35, finalY, { align: "center" });
        doc.text("Orang Tua / Wali Murid,", 35, finalY + 5, { align: "center" });
        doc.text("( .................................................... )", 35, finalY + 28, { align: "center" });

        // Column 2: Homeroom Teacher
        doc.text(`${config.Tempat_Tanda_Tangan || "Kab. Bogor"}, ${dateStr}`, 165, finalY, { align: "center" });
        doc.text("Guru Kelas / Wali Kelas,", 165, finalY + 5, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.text(waliInfo.nama || "Wali Kelas", 165, finalY + 25, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text(`NIP. ${waliInfo.nip || "-"}`, 165, finalY + 29, { align: "center" });

        // Headmaster Center
        doc.text("Mengetahui,", 105, finalY + 22, { align: "center" });
        doc.text("Kepala Sekolah,", 105, finalY + 27, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.text(config.Nama_Kepsek || config.Nama_Kepala_Sekolah || "SUBUR, S.Pd.SD.", 105, finalY + 45, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text(`NIP. ${config.NIP_Kepsek || config.NIP_Kepala_Sekolah || "197002111993081001"}`, 105, finalY + 49, { align: "center" });
      } else {
        // 2 Kolom Seimbang: Orang Tua (x=45) dan Guru Kelas (x=160)
        // Column 1: Parent
        doc.text("Mengetahui,", 45, finalY, { align: "center" });
        doc.text("Orang Tua / Wali Murid,", 45, finalY + 5, { align: "center" });
        doc.text("( .................................................... )", 45, finalY + 28, { align: "center" });

        // Column 2: Homeroom Teacher
        doc.text(`${config.Tempat_Tanda_Tangan || "Kab. Bogor"}, ${dateStr}`, 160, finalY, { align: "center" });
        doc.text("Guru Kelas / Wali Kelas,", 160, finalY + 5, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.text(waliInfo.nama || "Wali Kelas", 160, finalY + 25, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.text(`NIP. ${waliInfo.nip || "-"}`, 160, finalY + 29, { align: "center" });
      }

      doc.save(`Raport_Kedisiplinan_${st.nama.replace(/\s+/g, "_")}.pdf`);
      showToastSuccess("Raport Kedisiplinan PDF berhasil diunduh!");
    } catch (err: any) {
      notifySimpanError("Gagal mengunduh PDF Raport Kedisiplinan.");
    }
  };

  // Copy WhatsApp Summary
  const handleCopyWhatsAppSummary = () => {
    if (!activeReportStudentData) return;
    const st = activeReportStudentData.siswa;
    const school = config.Nama_Sekolah || "SD Negeri Babakan 04";

    let msg = `*LAPORAN POIN KEDISIPLINAN SISWA*\n`;
    msg += `*${school.toUpperCase()}*\n`;
    msg += `------------------------------------\n`;
    msg += `👤 *Nama:* ${st.nama}\n`;
    msg += `🆔 *NISN:* ${st.nisn || "-"}\n`;
    msg += `🏫 *Kelas:* ${st.kelas}\n\n`;
    msg += `📊 *Poin Awal:* 100 Poin\n`;
    msg += `🔴 *Total Pengurangan:* -${activeReportStudentData.totalPengurangan} Poin\n`;
    msg += `🟢 *Total Apresiasi:* +${activeReportStudentData.totalApresiasi} Poin\n`;
    msg += `⭐ *SALDO POIN AKHIR:* *${activeReportStudentData.finalPoint} Poin*\n`;
    msg += `🏷️ *Predikat:* ${activeReportStudentData.predikat}\n\n`;

    if (activeReportStudentData.logs.length > 0) {
      msg += `*Rincian Catatan Kedisiplinan:*\n`;
      activeReportStudentData.logs.slice(0, 5).forEach((l, idx) => {
        msg += `${idx + 1}. [${l.tanggal}] ${l.jenis === "pelanggaran" ? "🔴" : "🟢"} ${l.aturanTataTertib} (${l.jenis === "pelanggaran" ? `-${l.point}` : `+${l.point}`})\n`;
      });
      if (activeReportStudentData.logs.length > 5) {
        msg += `...dan ${activeReportStudentData.logs.length - 5} catatan lainnya.\n`;
      }
    } else {
      msg += `✨ *Ananda belum memiliki catatan pelanggaran. Terus pertahankan kedisiplinan dan prestasinya!*\n`;
    }

    msg += `\n_Pesan ini dikirim otomatis oleh Wali Kelas melalui Sistem Aplikasi Administrasi Sekolah._`;

    navigator.clipboard.writeText(msg);
    Swal.fire({
      icon: "success",
      title: "Format Pesan Berhasil Disalin!",
      text: "Teks laporan telah disalin ke clipboard dan siap dikirim via WhatsApp ke nomor orang tua siswa.",
      timer: 2500,
      showConfirmButton: false
    });
  };

  // =========================================================================
  // MASTER TATA TERTIB MANAGEMENT
  // =========================================================================
  const [newAturanNama, setNewAturanNama] = useState<string>("");
  const [newAturanJenis, setNewAturanJenis] = useState<"pelanggaran" | "apresiasi">("pelanggaran");
  const [newAturanKategori, setNewAturanKategori] = useState<any>("ringan");
  const [newAturanPoint, setNewAturanPoint] = useState<number>(5);
  const [newAturanKet, setNewAturanKet] = useState<string>("");

  const handleAddAturan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAturanNama.trim()) return;

    const newId = `tt_custom_${Date.now()}`;
    const newItem: TataTertibItem = {
      id: newId,
      kode: newAturanJenis === "pelanggaran" ? `PLG-${tataTertibList.length + 1}` : `APR-${tataTertibList.length + 1}`,
      nama: newAturanNama.trim(),
      jenis: newAturanJenis,
      kategori: newAturanKategori,
      pointDefault: Number(newAturanPoint),
      keteranganDefault: newAturanKet.trim(),
      updatedAt: Date.now()
    };

    try {
      await saveDocument(COLLECTIONS.TATA_TERTIB, newId, newItem as any);
      const updated = [...tataTertibList, newItem];
      setTataTertibList(updated);
      try { localStorage.setItem("edadmin_master_tata_tertib", JSON.stringify(updated)); } catch {}

      setNewAturanNama("");
      setNewAturanKet("");
      notifySimpanSuccess("Aturan tata tertib baru berhasil ditambahkan!");
    } catch (err: any) {
      notifySimpanError("Gagal menambahkan tata tertib.");
    }
  };

  const handleDeleteAturan = async (id: string) => {
    const isConfirmed = await confirmDeleteAlert("Hapus Aturan Ini?", "Aturan ini akan dihapus dari katalog tata tertib.");
    if (!isConfirmed) return;

    try {
      await deleteDocument(COLLECTIONS.TATA_TERTIB, id);
      const updated = tataTertibList.filter((t) => t.id !== id);
      setTataTertibList(updated);
      try { localStorage.setItem("edadmin_master_tata_tertib", JSON.stringify(updated)); } catch {}
      showToastSuccess("Aturan berhasil dihapus!");
    } catch (err) {
      notifySimpanError("Gagal menghapus aturan.");
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="space-y-6 pb-20 print:p-0 print:space-y-0 print:pb-0">
      {/* Top Banner (Hidden in Print) */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-6 rounded-2xl shadow-lg print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-md">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Modul Penguatan Karakter & Tata Tertib Siswa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Point Kedisiplinan & Karakter Siswa
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl">
              Sistem pencatatan poin pelanggaran (-) dan apresiasi (+) berbasis saldo 100 poin, lengkap dengan rekap periodik dan format cetak Raport Kedisiplinan untuk orang tua siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSubTabChange("input")}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Poin Siswa</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={() => handleSubTabChange("dashboard")}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === "dashboard"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard & Rekapitulasi</span>
          </button>

          <button
            onClick={() => handleSubTabChange("input")}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === "input"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Poin (Multi-Siswa)</span>
          </button>

          <button
            onClick={() => handleSubTabChange("rekap")}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === "rekap"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Rekap (Minggu/Bulan/Semester/Tahun)</span>
          </button>

          <button
            onClick={() => handleSubTabChange("raport")}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === "raport"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raport Kedisiplinan Siswa</span>
          </button>

          <button
            onClick={() => handleSubTabChange("aturan")}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === "aturan"
                ? "bg-white text-blue-800 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Katalog Tata Tertib</span>
          </button>
        </div>
      </div>

      {/* Main Filter Toolbar (Class Selector) - Hidden in Print */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pilih Rombongan Belajar (Kelas)
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => handleKelasChange(e.target.value)}
              className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
            >
              {allowedClasses.map((cls) => (
                <option key={cls} value={cls} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800">
                  {cls} ({siswaList.filter((s) => s.kelas === cls).length} Siswa)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 font-semibold">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Siswa: <strong>{classStudents.length} Anak</strong></span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Catatan: <strong>{classLogs.length} Kasus</strong></span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DASHBOARD KEDISIPLINAN */}
      {/* ========================================================================= */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rata-rata Poin Kelas */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rata-rata Poin Kelas</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {classStudents.length > 0
                    ? (studentScoresList.reduce((acc, curr) => acc + curr.finalPoint, 0) / classStudents.length).toFixed(1)
                    : "100.0"}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ 100</span>
                </h3>
              </div>
            </div>

            {/* Siswa Sangat Baik (Teladan) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Siswa Sangat Baik (≥90)</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {studentScoresList.filter((s) => s.finalPoint >= 90).length}
                  <span className="text-xs text-slate-400 font-normal ml-1">Anak</span>
                </h3>
              </div>
            </div>

            {/* Siswa Perlu Perhatian (<76) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perlu Pembinaan (&lt;76)</p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  {studentScoresList.filter((s) => s.finalPoint < 76).length}
                  <span className="text-xs text-slate-400 font-normal ml-1">Anak</span>
                </h3>
              </div>
            </div>

            {/* Total Pelanggaran & Apresiasi */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Apresiasi vs Pelanggaran</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  <span className="text-emerald-600">+{classLogs.filter((l) => l.jenis === "apresiasi").length}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-rose-600">-{classLogs.filter((l) => l.jenis === "pelanggaran").length}</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Grid Leaderboard & Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Siswa Teladan & Siswa Pantauan */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Leaderboard Poin Siswa Tertinggi & Terpantau
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {selectedKelas}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {studentScoresList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">Belum ada siswa di kelas ini.</p>
                ) : (
                  studentScoresList.map((st, idx) => {
                    const isTop = idx < 3;
                    const isLow = st.finalPoint < 76;
                    return (
                      <div
                        key={st.siswa.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition ${
                          isLow
                            ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                            : isTop
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                            : "bg-slate-50 dark:bg-slate-750 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              idx === 0
                                ? "bg-amber-500 text-white shadow-xs"
                                : idx === 1
                                ? "bg-slate-400 text-white"
                                : idx === 2
                                ? "bg-amber-700 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {st.siswa.nama}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              NISN: {st.siswa.nisn || "-"} • {st.pelanggaranCount} Pelanggaran, {st.apresiasiCount} Apresiasi
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-right">
                          <div>
                            <span
                              className={`text-sm font-black ${
                                st.finalPoint >= 90
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : st.finalPoint >= 76
                                  ? "text-blue-600 dark:text-blue-400"
                                  : st.finalPoint >= 60
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {st.finalPoint}
                            </span>
                            <span className="text-[10px] block text-slate-400">Poin</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedReportSiswaId(st.siswa.id);
                              handleSubTabChange("raport");
                            }}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-semibold"
                            title="Buka Raport Kedisiplinan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Riwayat Catatan Poin Terbaru */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Aktivitas & Log Kejadian Terbaru
                  </h3>
                </div>
                <button
                  onClick={() => handleSubTabChange("rekap")}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Lihat Rekap Lengkap &rarr;
                </button>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {classLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="text-xs font-medium">Belum ada catatan pelanggaran maupun apresiasi di kelas {selectedKelas}.</p>
                    <p className="text-[11px] mt-1">Seluruh siswa berada pada saldo sempurna 100 poin.</p>
                  </div>
                ) : (
                  classLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            log.jenis === "pelanggaran"
                              ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {log.jenis === "pelanggaran" ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-800 dark:text-slate-100 font-bold">
                              {log.namaSiswa}
                            </strong>
                            <span className="text-[10px] text-slate-400">• {log.tanggal}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                            {log.aturanTataTertib}
                          </p>
                          {log.keterangan && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              "{log.keterangan}"
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            Oleh: {log.dicatatOleh}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 space-y-1">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                            log.jenis === "pelanggaran"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                          }`}
                        >
                          {log.jenis === "pelanggaran" ? `-${log.point}` : `+${log.point}`}
                        </span>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus catatan ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: INPUT POIN (MULTI-SISWA & BATCH SAVE) */}
      {/* ========================================================================= */}
      {activeSubTab === "input" && (
        <form onSubmit={handleSubmitPoint} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Form Pencatatan Poin Kedisiplinan & Karakter</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Catat pelanggaran atau apresiasi prestasi untuk satu atau banyak siswa sekaligus di kelas {selectedKelas}.
                </p>
              </div>

              {/* Jenis Tindakan Toggle */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleJenisChange("pelanggaran")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    inputJenis === "pelanggaran"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Pelanggaran (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleJenisChange("apresiasi")}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    inputJenis === "apresiasi"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Apresiasi (+)</span>
                </button>
              </div>
            </div>

            {/* Form Fields: Tanggal, Aturan, Poin */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tanggal Kejadian */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Tanggal Kejadian</span>
                </label>
                <input
                  type="date"
                  value={inputTanggal}
                  onChange={(e) => setInputTanggal(e.target.value)}
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Dropdown Aturan Tata Tertib */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Pilih Aturan Tata Tertib / Bentuk Apresiasi</span>
                </label>
                <select
                  value={selectedAturanId}
                  onChange={(e) => handleAturanChange(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih dari Katalog Tata Tertib ({filteredAturanList.length} Aturan) --</option>
                  {filteredAturanList.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.kode || "TATIB"}] {t.nama} ({inputJenis === "pelanggaran" ? `-${t.pointDefault}` : `+${t.pointDefault}`} Poin)
                    </option>
                  ))}
                  <option value="manual">✍️ Tulis Aturan / Pelanggaran Khusus Manual...</option>
                </select>
              </div>
            </div>

            {/* Jika Pilih Input Manual */}
            {selectedAturanId === "manual" && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                  Tuliskan Aturan / Bentuk Kejadian Manual:
                </label>
                <input
                  type="text"
                  value={customAturanText}
                  onChange={(e) => setCustomAturanText(e.target.value)}
                  placeholder="Contoh: Mengikuti kegiatan gotong royong musholla / Terlambat upacara bendera"
                  required={selectedAturanId === "manual"}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Bobot Poin & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jumlah Bobot Poin ({inputJenis === "pelanggaran" ? "Pengurangan" : "Penambahan"})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={inputPoint}
                    onChange={(e) => setInputPoint(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    required
                    className={`w-full text-sm font-black px-3 py-2.5 rounded-xl border ${
                      inputJenis === "pelanggaran"
                        ? "border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
                        : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    } focus:outline-none focus:ring-2`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    Poin
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tingkat / Kategori
                </label>
                <select
                  value={inputKategori}
                  onChange={(e) => setInputKategori(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {inputJenis === "pelanggaran" ? (
                    <>
                      <option value="ringan">Ringan (5-10 Poin)</option>
                      <option value="sedang">Sedang (10-20 Poin)</option>
                      <option value="berat">Berat (&gt;20 Poin)</option>
                    </>
                  ) : (
                    <>
                      <option value="prestasi">Prestasi Lomba / Akademik</option>
                      <option value="kebiasaan_baik">Akhlak / Kebiasaan Baik Harian</option>
                    </>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dicatat Oleh
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser?.nama || currentUser?.name || "Guru Kelas"}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Keterangan & Tindak Lanjut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan Kejadian / Lokasi / Saksi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={inputKeterangan}
                  onChange={(e) => setInputKeterangan(e.target.value)}
                  placeholder="Contoh: Terjadi saat jam istirahat di lapangan sekolah / disaksikan ketua kelas"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tindak Lanjut / Pembinaan yang Diberikan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={inputTindakLanjut}
                  onChange={(e) => setInputTindakLanjut(e.target.value)}
                  placeholder="Contoh: Diberi nasihat santun, membuat komitmen disiplin, atau piagam penghargaan"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* SELEKSI SISWA (MULTI-SELECT CHECKBOX) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Pilih Siswa Kelas {selectedKelas} ({selectedSiswaMulti.length} Siswa Terpilih)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={siswaSearchTerm}
                      onChange={(e) => setSiswaSearchTerm(e.target.value)}
                      placeholder="Cari nama siswa..."
                      className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllSiswa}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                  >
                    {selectedSiswaMulti.length === classStudents.length ? "Batal Semua" : "Pilih Semua"}
                  </button>
                </div>
              </div>

              {/* Grid Checkbox Siswa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[320px] overflow-y-auto p-1">
                {classStudents
                  .filter((s) => s.nama.toLowerCase().includes(siswaSearchTerm.toLowerCase()))
                  .map((s) => {
                    const isChecked = selectedSiswaMulti.includes(s.id);
                    const currentScore = studentScores[s.id]?.finalPoint ?? 100;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleSiswa(s.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition ${
                          isChecked
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-600 shadow-xs ring-1 ring-indigo-500"
                            : "bg-slate-50 dark:bg-slate-750 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {s.nama}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              NISN: {s.nisn || "-"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            currentScore >= 90
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : currentScore >= 76
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                          }`}
                        >
                          {currentScore} pt
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Akan menerapkan {inputJenis === "pelanggaran" ? `-${inputPoint}` : `+${inputPoint}`} poin untuk{" "}
                <strong>{selectedSiswaMulti.length} siswa</strong> terpilih.
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSubTabChange("dashboard")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSiswaMulti.length === 0}
                  className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 cursor-pointer ${
                    inputJenis === "pelanggaran"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? "Menyimpan Poin..." : "Simpan & Terapkan Poin"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: REKAPITULASI (MINGGU, BULAN, SEMESTER, TAHUN) */}
      {/* ========================================================================= */}
      {activeSubTab === "rekap" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Rekapitulasi Poin Kedisiplinan Kelas {selectedKelas}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pantau akumulasi poin siswa secara periodik untuk evaluasi mingguan, bulanan, maupun kenaikan kelas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportRekapExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* Period Filter Selector */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Pilihan Rentang Rekap:</span>

            <div className="inline-flex p-0.5 bg-slate-200 dark:bg-slate-650 rounded-lg">
              <button
                type="button"
                onClick={() => setRekapPeriodType("mingguan")}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  rekapPeriodType === "mingguan"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Mingguan (7 Hari)
              </button>
              <button
                type="button"
                onClick={() => setRekapPeriodType("bulanan")}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  rekapPeriodType === "bulanan"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setRekapPeriodType("semester")}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  rekapPeriodType === "semester"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Semester
              </button>
              <button
                type="button"
                onClick={() => setRekapPeriodType("tahunan")}
                className={`px-3 py-1.5 rounded-md font-bold transition ${
                  rekapPeriodType === "tahunan"
                    ? "bg-white text-blue-700 shadow-2xs dark:bg-slate-800 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                Tahunan
              </button>
            </div>

            {/* Dropdown Bulan if Bulanan */}
            {rekapPeriodType === "bulanan" && (
              <select
                value={rekapSelectedBulan}
                onChange={(e) => setRekapSelectedBulan(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            )}

            {/* Semester Dropdown */}
            {rekapPeriodType === "semester" && (
              <select
                value={rekapSelectedSemester}
                onChange={(e) => setRekapSelectedSemester(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                <option value="Genap">Semester Genap (Jan - Jun)</option>
              </select>
            )}

            <div className="ml-auto relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={rekapSearchText}
                onChange={(e) => setRekapSearchText(e.target.value)}
                placeholder="Cari nama siswa..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabel Rekapitulasi */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Nama Siswa</th>
                  <th className="p-3 text-center">NISN</th>
                  <th className="p-3 text-center">Poin Awal</th>
                  <th className="p-3 text-center text-rose-600">Pelanggaran (-)</th>
                  <th className="p-3 text-center text-emerald-600">Apresiasi (+)</th>
                  <th className="p-3 text-center font-black">Saldo Akhir</th>
                  <th className="p-3 text-center">Predikat</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                {rekapPeriodScores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data siswa ditemukan untuk kriteria ini.
                    </td>
                  </tr>
                ) : (
                  rekapPeriodScores.map((item, idx) => (
                    <tr
                      key={item.siswa.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition"
                    >
                      <td className="p-3 text-center font-semibold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {item.siswa.nama}
                      </td>
                      <td className="p-3 text-center text-slate-500">{item.siswa.nisn || "-"}</td>
                      <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                        100
                      </td>
                      <td className="p-3 text-center font-bold text-rose-600">
                        {item.pengurangan > 0 ? `-${item.pengurangan}` : "0"}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600">
                        {item.apresiasi > 0 ? `+${item.apresiasi}` : "0"}
                      </td>
                      <td className="p-3 text-center font-black text-sm">
                        <span
                          className={`${
                            item.saldo >= 90
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.saldo >= 76
                              ? "text-blue-600 dark:text-blue-400"
                              : item.saldo >= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {item.saldo}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.predikat === "Sangat Baik"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : item.predikat === "Baik"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : item.predikat === "Cukup"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                          }`}
                        >
                          {item.predikat}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedReportSiswaId(item.siswa.id);
                            handleSubTabChange("raport");
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Raport</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: RAPORT KEDISIPLINAN SISWA (CETAK & ORANG TUA) */}
      {/* ========================================================================= */}
      {activeSubTab === "raport" && (
        <div className="space-y-6">
          {/* Controls Bar (Hidden in Print) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase shrink-0">
                Pilih Siswa:
              </label>
              <select
                value={selectedReportSiswaId}
                onChange={(e) => setSelectedReportSiswaId(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[220px]"
              >
                {classStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.nisn || "No NISN"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle TTD Kepala Sekolah */}
              <button
                type="button"
                onClick={() => setShowTtdKepsek(!showTtdKepsek)}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  showTtdKepsek
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400"
                }`}
                title="Klik untuk menampilkan atau menyembunyikan tanda tangan Kepala Sekolah pada raport kedisiplinan"
              >
                {showTtdKepsek ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>TTD Kepala Sekolah:</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${showTtdKepsek ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200"}`}>
                  {showTtdKepsek ? "TAMPIL" : "SEMBUNYI"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppSummary}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                title="Salin ringkasan poin untuk dikirim ke nomor WhatsApp orang tua"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Pesan WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleExportRaportPDF}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF Resmi</span>
              </button>

              <button
                type="button"
                onClick={handlePrintRaport}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak via Browser</span>
              </button>
            </div>
          </div>

          {/* Printable Report Card Sheet */}
          {activeReportStudentData ? (
            <div
              ref={reportPrintRef}
              className="raport-f4-page bg-white text-black p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 mx-auto w-full max-w-[215mm] min-h-[300mm] box-border print:m-0 print:p-0 print:border-none print:shadow-none print:w-full"
            >
              <div className="space-y-4 text-slate-900 font-sans">
                {/* Kop Surat Dinas */}
                <KopSuratDinas config={config} showDoubleLine={true} className="mb-2" />

                {/* Judul Laporan */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider underline">
                    LAPORAN BUKU KEDISIPLINAN & PEMBINAAN KARAKTER SISWA
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Tahun Ajaran {config.Tahun_Ajaran || "2024/2025"} — Semester {config.Semester || "Ganjil"}
                  </p>
                </div>

                {/* Identitas Siswa Box */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 p-3.5 rounded-lg border border-slate-400 bg-slate-50/70 text-xs text-slate-800">
                  <div className="flex">
                    <span className="w-32 font-semibold">Nama Peserta Didik</span>
                    <span className="mr-1.5">:</span>
                    <strong className="uppercase">{activeReportStudentData.siswa.nama}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Poin Modal Awal</span>
                    <span className="mr-1.5">:</span>
                    <span>100 Poin</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">NISN / NIS</span>
                    <span className="mr-1.5">:</span>
                    <span>{activeReportStudentData.siswa.nisn || "-"} / {activeReportStudentData.siswa.nis || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold text-rose-700">Total Pelanggaran (-)</span>
                    <span className="mr-1.5">:</span>
                    <span className="font-bold text-rose-700">-{activeReportStudentData.totalPengurangan} Poin</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold">Kelas / Rombel</span>
                    <span className="mr-1.5">:</span>
                    <span>{activeReportStudentData.siswa.kelas}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-semibold text-emerald-700">Total Apresiasi (+)</span>
                    <span className="mr-1.5">:</span>
                    <span className="font-bold text-emerald-700">+{activeReportStudentData.totalApresiasi} Poin</span>
                  </div>
                </div>

                {/* Saldo Poin Highlight Box */}
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-slate-800 bg-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      SALDO AKUMULASI POIN KEDISIPLINAN SAAT INI
                    </span>
                    <span className="text-xl font-black text-slate-950">
                      {activeReportStudentData.finalPoint} Poin
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      STATUS PREDIKAT
                    </span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-md uppercase inline-block mt-0.5 ${
                        activeReportStudentData.finalPoint >= 90
                          ? "bg-emerald-600 text-white"
                          : activeReportStudentData.finalPoint >= 76
                          ? "bg-blue-600 text-white"
                          : activeReportStudentData.finalPoint >= 60
                          ? "bg-amber-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {activeReportStudentData.predikat}
                    </span>
                  </div>
                </div>

                {/* Tabel Riwayat Kejadian */}
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
                    A. Rincian Kronologis Pelanggaran & Apresiasi Karakter
                  </h4>
                  <table className="w-full text-left text-[10px] border border-collapse border-black">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 border-b border-black">
                        <th className="p-1.5 border border-black text-center w-8">No</th>
                        <th className="p-1.5 border border-black text-center w-24">Tanggal</th>
                        <th className="p-1.5 border border-black text-center w-28">Jenis Tindakan</th>
                        <th className="p-1.5 border border-black">Aturan Tata Tertib / Bentuk Apresiasi</th>
                        <th className="p-1.5 border border-black text-center w-16">Poin</th>
                        <th className="p-1.5 border border-black">Catatan & Pembinaan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeReportStudentData.logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center italic text-slate-600 border border-black">
                            Ananda memiliki rekam jejak kedisiplinan yang sangat baik dan belum memiliki catatan pengurangan poin.
                          </td>
                        </tr>
                      ) : (
                        activeReportStudentData.logs.map((l, idx) => (
                          <tr key={l.id} className="border-b border-black">
                            <td className="p-1.5 border border-black text-center">{idx + 1}</td>
                            <td className="p-1.5 border border-black text-center">{l.tanggal}</td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {l.jenis === "pelanggaran" ? (
                                <span className="text-rose-700">Pelanggaran (-)</span>
                              ) : (
                                <span className="text-emerald-700">Apresiasi (+)</span>
                              )}
                            </td>
                            <td className="p-1.5 border border-black font-semibold text-slate-900">
                              {l.aturanTataTertib}
                            </td>
                            <td className="p-1.5 border border-black text-center font-bold">
                              {l.jenis === "pelanggaran" ? `-${l.point}` : `+${l.point}`}
                            </td>
                            <td className="p-1.5 border border-black text-[9.5px]">
                              {l.keterangan || l.tindakLanjut || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Catatan Khusus Wali Kelas */}
                <div className="p-3 border border-black rounded-sm bg-slate-50 text-[10px] space-y-1">
                  <span className="font-bold uppercase text-slate-900 block">
                    B. Catatan & Rekomendasi Wali Kelas kepada Orang Tua:
                  </span>
                  <p className="text-slate-800 italic leading-relaxed">
                    {activeReportStudentData.finalPoint >= 90
                      ? `Ananda ${activeReportStudentData.siswa.nama} menunjukkan kedisiplinan dan budi pekerti yang sangat membanggakan di sekolah. Mohon orang tua terus memberikan dukungan dan motivasi di rumah.`
                      : activeReportStudentData.finalPoint >= 76
                      ? `Ananda ${activeReportStudentData.siswa.nama} memiliki kedisiplinan yang baik, namun tetap perlu menjaga konsistensi pada pemenuhan tugas dan ketertiban waktu belajar.`
                      : `Ananda ${activeReportStudentData.siswa.nama} memerlukan pembinaan dan pengawasan lebih intensif baik di sekolah maupun di rumah agar dapat meningkatkan kepatuhan terhadap tata tertib sekolah.`}
                  </p>
                </div>

                {/* Tanda Tangan */}
                <div className={`pt-6 ${showTtdKepsek ? "grid grid-cols-3 gap-2" : "flex justify-between px-10"} text-center text-[10.5px] text-slate-900`}>
                  <div className="space-y-12">
                    <div>
                      <p>Mengetahui,</p>
                      <p className="font-semibold">Orang Tua / Wali Siswa</p>
                    </div>
                    <p className="border-b border-black inline-block min-w-[130px] pb-0.5 font-semibold">
                      ( ............................................ )
                    </p>
                  </div>

                  {showTtdKepsek && (
                    <div className="space-y-12">
                      <div>
                        <p>Mengetahui,</p>
                        <p className="font-semibold">Kepala Sekolah</p>
                      </div>
                      <div>
                        <p className="font-bold underline">{config.Nama_Kepsek || config.Nama_Kepala_Sekolah || "SUBUR, S.Pd.SD."}</p>
                        <p className="text-[9.5px]">NIP. {config.NIP_Kepsek || config.NIP_Kepala_Sekolah || "197002111993081001"}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-12">
                    <div>
                      <p>{config.Tempat_Tanda_Tangan || "Kab. Bogor"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="font-semibold">Guru Kelas / Wali Kelas</p>
                    </div>
                    <div>
                      <p className="font-bold underline">{waliInfo.nama || "Wali Kelas"}</p>
                      <p className="text-[9.5px]">NIP. {waliInfo.nip || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Belum ada siswa dipilih atau tidak ada siswa di kelas {selectedKelas}.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: MASTER KATALOG TATA TERTIB */}
      {/* ========================================================================= */}
      {activeSubTab === "aturan" && (
        <div className="space-y-6">
          {/* Add New Rule Card */}
          <form onSubmit={handleAddAturan} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Tambah Aturan Tata Tertib / Kategori Apresiasi Baru</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Aturan / Pelanggaran / Apresiasi
                </label>
                <input
                  type="text"
                  required
                  value={newAturanNama}
                  onChange={(e) => setNewAturanNama(e.target.value)}
                  placeholder="Contoh: Makan di dalam kelas saat jam belajar"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Tindakan
                </label>
                <select
                  value={newAturanJenis}
                  onChange={(e) => {
                    const j = e.target.value as any;
                    setNewAturanJenis(j);
                    setNewAturanKategori(j === "pelanggaran" ? "ringan" : "prestasi");
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pelanggaran">Pelanggaran (-)</option>
                  <option value="apresiasi">Apresiasi (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bobot Poin Default
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newAturanPoint}
                  onChange={(e) => setNewAturanPoint(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan / Saran Pembinaan Default (Opsional)
              </label>
              <input
                type="text"
                value={newAturanKet}
                onChange={(e) => setNewAturanKet(e.target.value)}
                placeholder="Contoh: Ditegur lisan dan merapikan sisa makanan"
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Aturan Baru</span>
              </button>
            </div>
          </form>

          {/* List of Existing Rules */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              <span>Daftar Katalog Tata Tertib & Apresiasi Sekolah ({tataTertibList.length} Aturan)</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3">Nama Aturan / Pelanggaran / Apresiasi</th>
                    <th className="p-3 text-center w-28">Jenis</th>
                    <th className="p-3 text-center w-24">Bobot</th>
                    <th className="p-3">Keterangan / Pembinaan Default</th>
                    <th className="p-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {tataTertibList.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                      <td className="p-3 text-center font-semibold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {t.nama}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.jenis === "pelanggaran"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          }`}
                        >
                          {t.jenis === "pelanggaran" ? "Pelanggaran" : "Apresiasi"}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black">
                        <span className={t.jenis === "pelanggaran" ? "text-rose-600" : "text-emerald-600"}>
                          {t.jenis === "pelanggaran" ? `-${t.pointDefault}` : `+${t.pointDefault}`} Poin
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] italic">
                        {t.keteranganDefault || "-"}
                      </td>
                      <td className="p-3 text-center">
                        {t.id.startsWith("tt_custom_") ? (
                          <button
                            onClick={() => handleDeleteAturan(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus aturan kustom ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
