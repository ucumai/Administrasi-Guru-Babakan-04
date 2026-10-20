import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Star,
  Save,
  CheckCircle2,
  BookmarkCheck,
  Sparkles,
  RefreshCw,
  Search,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Swal from "sweetalert2";
import { Siswa, Mapel, DataNilai, Pengaturan, User, BankTpItem, RaportRecord } from "../types";
import { batchSaveDocuments, batchSaveToMultipleCollections, saveDocument, COLLECTIONS } from "../lib/firebase";
import { getAllowedClasses, getWaliKelasForClass } from "../lib/accessControl";
import { notifySimpanSuccess, notifySimpanError } from "../lib/swal";
import { DEFAULT_TP_TEMPLATES, cleanTpText, filterBankTpItems, generateDynamicTpDescription } from "../lib/tpUtils";
import { getClassActiveSubjects } from "../lib/classSubjectUtils";

interface InputPenilaianViewProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: DataNilai[];
  bankTpList?: BankTpItem[];
  config: Pengaturan;
  currentUser?: User | null;
  userList?: User[];
}

export const InputPenilaianView: React.FC<InputPenilaianViewProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  bankTpList = [],
  config,
  currentUser = null,
  userList = []
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("edadmin_penilaian_selected_kelas");
      if (saved) return saved;
    } catch {}
    return "";
  });
  const [selectedMapel, setSelectedMapel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("edadmin_penilaian_selected_mapel");
      if (saved) return saved;
    } catch {}
    return "";
  });
  const [jenisPenilaian, setJenisPenilaian] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("edadmin_penilaian_jenis");
      if (saved) return saved;
    } catch {}
    return "Sumatif 1 / UH 1";
  });
  const [selectedTp, setSelectedTp] = useState<string>("");
  const [customTpMode, setCustomTpMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    };
  }, []);

  // Map of student grades: { studentId: number | "" }
  const [gradesMap, setGradesMap] = useState<Record<string, number | "">>({});
  // Maps of customized student descriptions: { studentId: string }
  const [customDescTinggiMap, setCustomDescTinggiMap] = useState<Record<string, string>>({});
  const [customDescBimbinganMap, setCustomDescBimbinganMap] = useState<Record<string, string>>({});
  const [customDescMap, setCustomDescMap] = useState<Record<string, string>>({});
  const [searchStudent, setSearchStudent] = useState<string>("");

  const allowedClasses = getAllowedClasses(currentUser, siswaList.map((s) => s.kelas));
  const isGuruKelas = currentUser?.role === "guru_kelas";

  useEffect(() => {
    if (allowedClasses.length > 0 && (!selectedKelas || !siswaList.some((s) => s.kelas === selectedKelas))) {
      const firstClassWithStudents = siswaList.find((s) => Boolean(s.kelas))?.kelas;
      setSelectedKelas(firstClassWithStudents || allowedClasses[0]);
    }
    if (isGuruKelas && !selectedMapel) {
      setSelectedMapel("Tematik / Guru Kelas");
    }
  }, [allowedClasses, selectedKelas, isGuruKelas, selectedMapel, siswaList]);

  // Persist selections whenever they change
  useEffect(() => {
    if (selectedKelas) {
      try { localStorage.setItem("edadmin_penilaian_selected_kelas", selectedKelas); } catch {}
    }
    if (selectedMapel) {
      try { localStorage.setItem("edadmin_penilaian_selected_mapel", selectedMapel); } catch {}
    }
    if (jenisPenilaian) {
      try { localStorage.setItem("edadmin_penilaian_jenis", jenisPenilaian); } catch {}
    }
  }, [selectedKelas, selectedMapel, jenisPenilaian]);

  const studentsInClass = useMemo(() => {
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Active mapels specifically checked and allowed for selectedKelas
  const classActiveMapels = useMemo(() => {
    const allSystemNames = mapelList.map((m) => m.namaMapel).filter(Boolean);
    return getClassActiveSubjects(selectedKelas, allSystemNames);
  }, [selectedKelas, mapelList]);

  // Sync selectedMapel if it becomes invalid for the newly selected class
  useEffect(() => {
    if (classActiveMapels.length > 0 && !classActiveMapels.includes(selectedMapel) && !isGuruKelas) {
      setSelectedMapel(classActiveMapels[0]);
    }
  }, [classActiveMapels, selectedMapel, isGuruKelas]);

  // Available TPs for selected Mapel & Kelas from Bank TP and Default templates
  const availableTps = useMemo(() => {
    const list: Array<{ id: string; kode?: string; text: string; kategori?: string }> = [];

    // 1. From Bank TP (filtered by mapel, kelas, and active semester)
    const currentSemester = config?.Semester || "Ganjil";
    const filteredBank = filterBankTpItems(bankTpList, selectedMapel, selectedKelas, currentSemester);

    filteredBank.forEach((b) => {
      list.push({
        id: b.id,
        kode: b.kodeTp,
        text: b.tujuanPembelajaran,
        kategori: b.kategori
      });
    });

    // 2. From Default Kurikulum Merdeka templates if Bank TP is empty for this mapel & class
    const templates = DEFAULT_TP_TEMPLATES[selectedMapel] || [];
    templates.forEach((t, idx) => {
      if (!list.some((existing) => existing.text.toLowerCase() === t.toLowerCase())) {
        list.push({
          id: `tpl_${idx}`,
          kode: `TP ${idx + 1}`,
          text: t,
          kategori: idx === 0 ? "Tinggi" : idx === 1 ? "Sedang" : "Bimbingan"
        });
      }
    });

    return list;
  }, [bankTpList, selectedMapel, selectedKelas, config?.Semester]);

  // Set default selected TP when mapel changes
  useEffect(() => {
    if (availableTps.length > 0) {
      setSelectedTp(availableTps[0].text);
      setCustomTpMode(false);
    } else {
      setSelectedTp("");
    }
  }, [availableTps, selectedMapel]);

  // Load existing grade records and saved raport descriptions
  useEffect(() => {
    const effectiveMapel = selectedMapel || (isGuruKelas ? "Tematik / Guru Kelas" : "");
    if (selectedKelas && (effectiveMapel || isGuruKelas) && jenisPenilaian) {
      const existingGrades = nilaiList.filter(
        (n) => n.kelas === selectedKelas && (n.mapel === effectiveMapel || (isGuruKelas && !n.mapel)) && n.jenis === jenisPenilaian
      );

      let savedCachedRaport: Record<string, any> = {};
      try {
        const raw = localStorage.getItem("edadmin_persisted_raport_records");
        if (raw) savedCachedRaport = JSON.parse(raw);
      } catch {}

      const cleanTahun = (config?.Tahun_Ajaran || "2024/2025").replace(/\//g, "-");
      const periode = config?.Semester === "Genap" ? "Semester 2 (Genap)" : "Semester 1 (Ganjil)";

      const mapG: Record<string, number | ""> = {};
      const mapTinggi: Record<string, string> = {};
      const mapBimbingan: Record<string, string> = {};
      const mapD: Record<string, string> = {};

      studentsInClass.forEach((s) => {
        const found = existingGrades.find((g) => g.idSiswa === s.id || g.idSiswa === s.nisn);
        if (found && found.nilai !== "" && found.nilai !== undefined) {
          mapG[s.id] = found.nilai;
        } else {
          mapG[s.id] = "";
        }

        // Check if existing raport record has custom descriptions for this mapel
        const docId = `raport_${s.id}_${cleanTahun}_${periode}`;
        const altDocId = `raport_${s.id}_${periode}_${cleanTahun}`;
        const legacyId = `raport_${s.id}_${periode}`;
        const rRec = savedCachedRaport[docId] || savedCachedRaport[altDocId] || savedCachedRaport[legacyId];
        const matchedMapel = rRec?.nilaiMapel?.find((nm: any) => nm.mapel?.toLowerCase() === effectiveMapel.toLowerCase());

        // Real-time Re-Sync: Generate fresh multi-TP descriptions combining all TPs from Bank TP
        const gradeVal = mapG[s.id] !== "" && !isNaN(Number(mapG[s.id])) ? Number(mapG[s.id]) : 80;
        const currentSemester = config?.Semester || "Ganjil";
        const filteredBank = filterBankTpItems(bankTpList, selectedMapel || effectiveMapel, selectedKelas, currentSemester);
        const fallbackTps = availableTps.map((a) => a.text).filter(Boolean);
        const freshAuto = generateDynamicTpDescription(
          selectedMapel || effectiveMapel,
          gradeVal,
          fallbackTps,
          filteredBank,
          75
        );

        if (matchedMapel && (matchedMapel as any).isManualCustom && matchedMapel.capaianKompetensiTinggi) {
          mapTinggi[s.id] = matchedMapel.capaianKompetensiTinggi;
          mapD[s.id] = matchedMapel.capaianKompetensiTinggi;
          mapBimbingan[s.id] = matchedMapel.capaianKompetensiPerluBimbingan || freshAuto.perluBimbingan;
        } else {
          // Fresh multi-TP auto-concatenation from Bank TP
          mapTinggi[s.id] = freshAuto.tinggi;
          mapD[s.id] = freshAuto.tinggi;
          mapBimbingan[s.id] = freshAuto.perluBimbingan;
        }
      });

      setGradesMap(mapG);
      setCustomDescTinggiMap(mapTinggi);
      setCustomDescBimbinganMap(mapBimbingan);
      setCustomDescMap(mapD);
    }
  }, [selectedKelas, selectedMapel, jenisPenilaian, nilaiList, studentsInClass, isGuruKelas, config?.Tahun_Ajaran, config?.Semester, bankTpList, availableTps]);

  // Helper to generate dynamic TP achievement descriptions (both Tinggi & Bimbingan) based on grade
  const getAutoTpDescriptions = (grade: number | "", tpText: string) => {
    if (grade === "" || isNaN(Number(grade))) {
      return { tinggi: "", perluBimbingan: "" };
    }
    const val = Number(grade);
    const currentSemester = config?.Semester || "Ganjil";
    const filteredBank = filterBankTpItems(bankTpList, selectedMapel, selectedKelas, currentSemester);
    const fallbackTps = availableTps.map((a) => a.text).filter(Boolean);
    return generateDynamicTpDescription(
      selectedMapel,
      val,
      fallbackTps.length > 0 ? fallbackTps : (tpText ? [tpText] : []),
      filteredBank,
      75
    );
  };

  // Helper for grade badge styling & tier
  const getGradeTier = (grade: number | "") => {
    if (grade === "" || isNaN(Number(grade))) return null;
    const num = Number(grade);
    if (num >= 85) {
      return {
        label: "Sangat Baik (Optimal)",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
        icon: "✨"
      };
    } else if (num >= 75) {
      return {
        label: "Baik (Tercapai / KKTP)",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700",
        icon: "✓"
      };
    } else {
      return {
        label: "Perlu Bimbingan (Remedial)",
        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700",
        icon: "⚠️"
      };
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const num = value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setGradesMap((prev) => ({ ...prev, [studentId]: num }));

    // Debounce mass batch save (2.5s) to cloud to minimize writes and prevent network quota congestion
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    setSaveStatus("unsaved");
    autoSaveDebounceRef.current = setTimeout(() => {
      handleSaveNilai(true);
    }, 2500);
  };

  // Quick reset to auto-generated Bank TP description
  const handleResetTpDescription = (studentId: string) => {
    setCustomDescTinggiMap((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setCustomDescBimbinganMap((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    setCustomDescMap((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const handleQuickFillAll = (presetVal: number | "") => {
    const nextMap: Record<string, number | ""> = {};
    studentsInClass.forEach((s) => {
      nextMap[s.id] = presetVal;
    });
    setGradesMap(nextMap);

    // Debounce mass batch save
    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    setSaveStatus("unsaved");
    autoSaveDebounceRef.current = setTimeout(() => {
      handleSaveNilai(true);
    }, 2500);
  };

  const handleResetAllDescriptions = () => {
    setCustomDescTinggiMap({});
    setCustomDescBimbinganMap({});
    setCustomDescMap({});
    Swal.fire({
      icon: "success",
      title: "TP Disesuaikan!",
      text: "Seluruh deskripsi TP siswa berhasil dikembalikan ke pemetaan otomatis Bank TP sesuai nilai.",
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Save Nilai & TP Achievement to Firebase using Single-Commit Batch Operations
  const handleSaveNilai = async (isAutoSave = false) => {
    const mapelToSave = selectedMapel || (isGuruKelas ? "Tematik / Guru Kelas" : "");
    if (!selectedKelas || (!isGuruKelas && !selectedMapel) || !jenisPenilaian) {
      if (!isAutoSave) notifySimpanError("Silakan pilih Kelas, Mapel, dan Jenis Penilaian.");
      return;
    }

    if (studentsInClass.length === 0) {
      if (!isAutoSave) notifySimpanError("Belum ada siswa di kelas ini.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");
    const todayStr = new Date().toISOString().split("T")[0];
    const itemsToSave: DataNilai[] = studentsInClass.map((s) => {
      const docId = `${selectedKelas}_${mapelToSave}_${jenisPenilaian}_${s.id}`;
      const gradeVal = gradesMap[s.id] !== undefined ? gradesMap[s.id] : "";
      const autoDescs = getAutoTpDescriptions(gradeVal, selectedTp);
      const finalTinggi = customDescTinggiMap[s.id] !== undefined ? customDescTinggiMap[s.id] : (customDescMap[s.id] || autoDescs.tinggi);
      const finalBimbingan = customDescBimbinganMap[s.id] !== undefined ? customDescBimbinganMap[s.id] : autoDescs.perluBimbingan;

      return {
        id: docId,
        waktu: todayStr,
        jenis: jenisPenilaian,
        mapel: mapelToSave,
        kelas: selectedKelas,
        idSiswa: s.id,
        namaSiswa: s.nama,
        nilai: gradeVal,
        tp: selectedTp,
        deskripsi: finalTinggi,
        capaianKompetensiTinggi: finalTinggi,
        capaianKompetensiPerluBimbingan: finalBimbingan,
        namaGuru: config.Nama_Guru || "Guru",
        updatedAt: Date.now()
      };
    });

    try {
      // 1. Batch save all grades in single atomic commit
      await batchSaveDocuments(COLLECTIONS.DATA_NILAI, itemsToSave);

      // 2. Automatic Raport Syncing grouped into single multi-collection batch commit
      try {
        let savedCached: Record<string, RaportRecord> = {};
        try {
          const raw = localStorage.getItem("edadmin_persisted_raport_records");
          if (raw) savedCached = JSON.parse(raw);
        } catch {}

        const tahunAjaran = config.Tahun_Ajaran || "2024/2025";
        const periode = config.Semester === "Genap" ? "Semester 2 (Genap)" : "Semester 1 (Ganjil)";
        const cleanTahun = tahunAjaran.replace(/\//g, "-");

        const raportBatchOps: Array<{ collectionName: string; id: string; data: Record<string, any> }> = [];

        for (const s of studentsInClass) {
          const gradeVal = gradesMap[s.id];
          if (typeof gradeVal === "number") {
            const docId = `raport_${s.id}_${cleanTahun}_${periode}`;
            const altDocId = `raport_${s.id}_${periode}_${cleanTahun}`;
            const legacyId = `raport_${s.id}_${periode}`;

            const currentRec: RaportRecord = savedCached[docId] || savedCached[altDocId] || savedCached[legacyId] || {
              id: docId,
              idSiswa: s.id,
              nisn: s.nisn || "",
              nis: s.nis || "",
              namaSiswa: s.nama,
              kelas: s.kelas,
              fase: "Fase A",
              semester: (config.Semester === "Genap" ? "Genap" : "Ganjil") as "Ganjil" | "Genap",
              tahunAjaran: tahunAjaran,
              periode: periode as any,
              periodeNama: periode,
              nilaiMapel: [],
              ekskul: [],
              prestasi: [],
              kehadiran: { sakit: 0, izin: 0, alpa: 0 },
              catatanWaliKelas: "Tingkatkan terus prestasimu.",
              tempatTitimangsa: config.Tempat_Tanda_Tangan || "Kab. Bogor",
              tanggalRaport: new Date().toISOString().split("T")[0],
              namaGuruWali: getWaliKelasForClass(s.kelas, userList, currentUser, config).nama,
              nipGuruWali: getWaliKelasForClass(s.kelas, userList, currentUser, config).nip,
              namaKepsek: config.Nama_Kepsek || "SUBUR, S.Pd.SD.",
              nipKepsek: config.NIP_Kepsek || "197002111993081001"
            };

            const autoDescs = getAutoTpDescriptions(gradeVal, selectedTp);
            const finalTinggi = customDescTinggiMap[s.id] !== undefined ? customDescTinggiMap[s.id] : (customDescMap[s.id] || autoDescs.tinggi);
            const finalBimbingan = customDescBimbinganMap[s.id] !== undefined ? customDescBimbinganMap[s.id] : autoDescs.perluBimbingan;

            const updatedNilaiMapel = [...(currentRec.nilaiMapel || [])];
            const existIdx = updatedNilaiMapel.findIndex(
              (nm) => nm.mapel.toLowerCase() === mapelToSave.toLowerCase()
            );

            if (existIdx >= 0) {
              updatedNilaiMapel[existIdx] = {
                ...updatedNilaiMapel[existIdx],
                nilaiAkhir: gradeVal,
                capaianKompetensiTinggi: finalTinggi,
                capaianKompetensiPerluBimbingan: finalBimbingan,
                deskripsi: finalTinggi
              };
            } else {
              updatedNilaiMapel.push({
                mapel: mapelToSave,
                kktp: 75,
                nilaiAkhir: gradeVal,
                capaianKompetensiTinggi: finalTinggi,
                capaianKompetensiPerluBimbingan: finalBimbingan,
                deskripsi: finalTinggi
              });
            }

            const updatedRec = {
              ...currentRec,
              id: docId,
              nilaiMapel: updatedNilaiMapel,
              updatedAt: Date.now()
            };

            savedCached[docId] = updatedRec;
            savedCached[altDocId] = updatedRec;
            savedCached[legacyId] = updatedRec;

            raportBatchOps.push({ collectionName: COLLECTIONS.RAPORT_RECORDS, id: docId, data: updatedRec });
            raportBatchOps.push({ collectionName: COLLECTIONS.RAPORT_RECORDS, id: altDocId, data: updatedRec });
            raportBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: docId, data: updatedRec });
            raportBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: altDocId, data: updatedRec });
            raportBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: legacyId, data: updatedRec });
          }
        }
        localStorage.setItem("edadmin_persisted_raport_records", JSON.stringify(savedCached));

        // Execute all Raport updates in single batch
        if (raportBatchOps.length > 0) {
          await batchSaveToMultipleCollections(raportBatchOps);
        }
      } catch (e) {
        console.warn("Auto-sync to Raport batch error:", e);
      }

      setSaveStatus("saved");
      if (!isAutoSave) {
        notifySimpanSuccess(
          `Nilai ${jenisPenilaian} kelas ${selectedKelas} (${mapelToSave}) beserta deskripsi TP berhasil disimpan & otomatis disinkronkan ke Raport!`
        );
      }
    } catch (err: any) {
      setSaveStatus("unsaved");
      if (!isAutoSave) {
        notifySimpanError(err.message || "Gagal menyimpan nilai.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Sync to Raport Records
  const handleSyncToRaport = async () => {
    const mapelToSave = selectedMapel || (isGuruKelas ? "Tematik / Guru Kelas" : "");
    if (!selectedKelas || !mapelToSave) {
      Swal.fire("Peringatan", "Pilih kelas dan mata pelajaran terlebih dahulu.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Sinkronkan Nilai ke Raport?",
      text: `Nilai ${jenisPenilaian} dan deskripsi TP yang Anda masukkan akan langsung disinkronkan ke lembar raport untuk mata pelajaran "${mapelToSave}".`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Sinkronkan ke Raport!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb"
    });

    if (!confirm.isConfirmed) return;

    try {
      let savedCached: Record<string, RaportRecord> = {};
      try {
        const raw = localStorage.getItem("edadmin_persisted_raport_records");
        if (raw) savedCached = JSON.parse(raw);
      } catch {}

      const tahunAjaran = config.Tahun_Ajaran || "2024/2025";
      const periode = config.Semester === "Genap" ? "Semester 2 (Genap)" : "Semester 1 (Ganjil)";

      let syncedCount = 0;
      const syncBatchOps: Array<{ collectionName: string; id: string; data: Record<string, any> }> = [];
      for (const s of studentsInClass) {
        const gradeVal = gradesMap[s.id];
        if (typeof gradeVal === "number") {
          const cleanTahun = tahunAjaran.replace(/\//g, "-");
          const docId = `raport_${s.id}_${cleanTahun}_${periode}`;
          const altDocId = `raport_${s.id}_${periode}_${cleanTahun}`;
          const legacyId = `raport_${s.id}_${periode}`;

          const currentRec: RaportRecord = savedCached[docId] || savedCached[altDocId] || savedCached[legacyId] || {
            id: docId,
            idSiswa: s.id,
            nisn: s.nisn || "",
            nis: s.nis || "",
            namaSiswa: s.nama,
            kelas: s.kelas,
            fase: "Fase A",
            semester: (config.Semester === "Genap" ? "Genap" : "Ganjil") as "Ganjil" | "Genap",
            tahunAjaran: tahunAjaran,
            periode: periode as any,
            periodeNama: periode,
            nilaiMapel: [],
            ekskul: [],
            prestasi: [],
            kehadiran: { sakit: 0, izin: 0, alpa: 0 },
            catatanWaliKelas: "Tingkatkan terus prestasimu.",
            tempatTitimangsa: "Kab. Bogor",
            tanggalRaport: new Date().toISOString().split("T")[0],
            namaGuruWali: getWaliKelasForClass(s.kelas, userList, currentUser, config).nama,
            nipGuruWali: getWaliKelasForClass(s.kelas, userList, currentUser, config).nip,
            namaKepsek: config.Nama_Kepala_Sekolah || "SUBUR, S.Pd.SD.",
            nipKepsek: config.NIP_Kepala_Sekolah || "197002111993081001"
          };

          const autoDescs = getAutoTpDescriptions(gradeVal, selectedTp);
          const finalTinggi = customDescTinggiMap[s.id] !== undefined ? customDescTinggiMap[s.id] : (customDescMap[s.id] || autoDescs.tinggi);
          const finalBimbingan = customDescBimbinganMap[s.id] !== undefined ? customDescBimbinganMap[s.id] : autoDescs.perluBimbingan;

          const updatedNilaiMapel = [...currentRec.nilaiMapel];
          const existIdx = updatedNilaiMapel.findIndex(
            (nm) => nm.mapel.toLowerCase() === mapelToSave.toLowerCase()
          );

          if (existIdx >= 0) {
            updatedNilaiMapel[existIdx] = {
              ...updatedNilaiMapel[existIdx],
              nilaiAkhir: gradeVal,
              capaianKompetensiTinggi: finalTinggi,
              capaianKompetensiPerluBimbingan: finalBimbingan,
              deskripsi: finalTinggi
            };
          } else {
            updatedNilaiMapel.push({
              mapel: mapelToSave,
              kktp: 75,
              nilaiAkhir: gradeVal,
              capaianKompetensiTinggi: finalTinggi,
              capaianKompetensiPerluBimbingan: finalBimbingan,
              deskripsi: finalTinggi
            });
          }

          const updatedRec = {
            ...currentRec,
            id: docId,
            nilaiMapel: updatedNilaiMapel,
            updatedAt: Date.now()
          };

          savedCached[docId] = updatedRec;
          savedCached[altDocId] = updatedRec;
          savedCached[legacyId] = updatedRec;

          syncBatchOps.push({ collectionName: COLLECTIONS.RAPORT_RECORDS, id: docId, data: updatedRec });
          syncBatchOps.push({ collectionName: COLLECTIONS.RAPORT_RECORDS, id: altDocId, data: updatedRec });
          syncBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: docId, data: updatedRec });
          syncBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: altDocId, data: updatedRec });
          syncBatchOps.push({ collectionName: COLLECTIONS.BUKU_INDUK, id: legacyId, data: updatedRec });
          syncedCount++;
        }
      }

      if (syncBatchOps.length > 0) {
        await batchSaveToMultipleCollections(syncBatchOps);
      }

      try {
        localStorage.setItem("edadmin_persisted_raport_records", JSON.stringify(savedCached));
      } catch {}

      Swal.fire({
        icon: "success",
        title: "Nilai Berhasil Masuk Raport!",
        text: `Sebanyak ${syncedCount} siswa berhasil disinkronkan ke raport pada mapel "${mapelToSave}".`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e: any) {
      Swal.fire("Gagal", e?.message || "Gagal sinkronisasi raport.", "error");
    }
  };

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return studentsInClass;
    const q = searchStudent.toLowerCase();
    return studentsInClass.filter(
      (s) => s.nama.toLowerCase().includes(q) || (s.nisn && s.nisn.includes(q))
    );
  }, [studentsInClass, searchStudent]);

  // Statistics
  const stats = useMemo(() => {
    const validScores = studentsInClass
      .map((s) => gradesMap[s.id])
      .filter((v): v is number => typeof v === "number");

    if (validScores.length === 0) {
      return { total: studentsInClass.length, filled: 0, avg: 0, max: 0, min: 0 };
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    return {
      total: studentsInClass.length,
      filled: validScores.length,
      avg: Math.round(sum / validScores.length),
      max: Math.max(...validScores),
      min: Math.min(...validScores)
    };
  }, [studentsInClass, gradesMap]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Input Penilaian Akademik & Ketercapaian TP</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Input nilai asesmen formatif / sumatif dan deskripsi Tujuan Pembelajaran (TP) yang otomatis menyesuaikan tingkat perolehan nilai siswa.
            </p>
          </div>

          {/* Sync to Raport Button */}
          <button
            type="button"
            onClick={handleSyncToRaport}
            disabled={stats.filled === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Kirim nilai dan kalimat TP ini langsung ke cetak raport"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>⚡ Sinkronkan ke Lembar Raport</span>
          </button>
        </div>

        {/* Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* 1. Pilih Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pilih Kelas *</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Kelas ({allowedClasses.length} Kelas Akses)</option>
              {allowedClasses.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Pilih Mapel */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              {isGuruKelas ? "Mata Pelajaran (Wali Kelas)" : "Pilih Mata Pelajaran *"}
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isGuruKelas ? (
                <option value="Tematik / Guru Kelas">Tematik / Semua Mapel (Guru Kelas)</option>
              ) : (
                <option value="">Pilih Mapel</option>
              )}
              {classActiveMapels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Jenis Penilaian */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Jenis Penilaian *</label>
            <input
              type="text"
              placeholder="Contoh: UH 1 / Sumatif 1 / UTS"
              value={jenisPenilaian}
              onChange={(e) => setJenisPenilaian(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 4. TP yang Dinilai (from Bank TP) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Tujuan Pembelajaran (TP) *
              </label>
              <button
                type="button"
                onClick={() => setCustomTpMode(!customTpMode)}
                className="text-[10px] text-blue-600 hover:underline cursor-pointer"
              >
                {customTpMode ? "Pilih dari Bank TP" : "+ Tulis Manual"}
              </button>
            </div>

            {customTpMode ? (
              <input
                type="text"
                placeholder="Tuliskan TP yang dinilai..."
                value={selectedTp}
                onChange={(e) => setSelectedTp(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={selectedTp}
                onChange={(e) => setSelectedTp(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 truncate"
              >
                {availableTps.length === 0 ? (
                  <option value="">Belum ada TP di Bank TP untuk mapel ini</option>
                ) : (
                  availableTps.map((tp) => (
                    <option key={tp.id} value={tp.text}>
                      {tp.kode ? `[${tp.kode}] ` : ""}{tp.text}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Selected TP Display Banner */}
        {selectedTp && (
          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
            <BookmarkCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-blue-950 dark:text-blue-200">
                Tujuan Pembelajaran Asesmen Aktif:
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                "{selectedTp}"
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                ⚡ Deskripsi capaian siswa di bawah akan otomatis terisi dan disesuaikan berdasarkan perolehan nilai (Sangat Baik / Baik / Cukup / Remedial).
              </span>
            </div>
          </div>
        )}

        {/* Toolbar: Stats & Quick Grade Fill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Isi Cepat Nilai:</span>
            <button
              type="button"
              onClick={() => handleQuickFillAll(80)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Semua 80
            </button>
            <button
              type="button"
              onClick={() => handleQuickFillAll(85)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Semua 85
            </button>
            <button
              type="button"
              onClick={() => handleQuickFillAll(90)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Semua 90
            </button>
            <button
              type="button"
              onClick={() => handleQuickFillAll("")}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
            >
              Kosongkan
            </button>
            <button
              type="button"
              onClick={handleResetAllDescriptions}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1"
              title="Sesuaikan ulang seluruh deskripsi TP dengan nilai & Bank TP kelas ini"
            >
              <span>⚡</span>
              <span>Sesuaikan Ulang TP Bank</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none w-44"
              />
            </div>

            {/* Counter Badge */}
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <span className="font-semibold">
                Terisi: <strong className="text-blue-600 font-bold">{stats.filled}</strong>/{stats.total}
              </span>
              {stats.filled > 0 && (
                <span className="font-semibold text-emerald-600">
                  • Rata-rata: <strong>{stats.avg}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grade Entry Table with Dynamic TP Description */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 w-52">Nama Lengkap Siswa</th>
                <th className="p-3 text-center w-28">Nilai (0-100)</th>
                <th className="p-3">Auto-Sync & Smart TP Mapping (Capaian Tertinggi & Perlu Bimbingan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {!selectedKelas || !selectedMapel ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 space-y-1">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-600 dark:text-slate-400">Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu.</p>
                  </td>
                </tr>
              ) : studentsInClass.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    Tidak ada siswa terdaftar di Kelas {selectedKelas}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const studentGrade = gradesMap[s.id] !== undefined ? gradesMap[s.id] : "";
                  const tier = getGradeTier(studentGrade);
                  const autoDescs = getAutoTpDescriptions(studentGrade, selectedTp);
                  const currentTinggi = customDescTinggiMap[s.id] !== undefined
                    ? customDescTinggiMap[s.id]
                    : (customDescMap[s.id] || autoDescs.tinggi);
                  const currentBimbingan = customDescBimbinganMap[s.id] !== undefined
                    ? customDescBimbinganMap[s.id]
                    : autoDescs.perluBimbingan;
                  const isCustomized = customDescTinggiMap[s.id] !== undefined || customDescBimbinganMap[s.id] !== undefined;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <strong className="font-bold text-slate-900 dark:text-slate-100 block">
                          {s.nama}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          NISN: {s.nisn || "-"}
                        </span>
                      </td>

                      {/* Score Input */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={studentGrade}
                          onChange={(e) => handleGradeChange(s.id, e.target.value)}
                          className={`w-20 text-center px-2 py-1.5 font-black text-sm border-2 rounded-xl outline-none transition focus:ring-2 focus:ring-blue-500 ${
                            typeof studentGrade === "number" && studentGrade >= 85
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                              : typeof studentGrade === "number" && studentGrade >= 75
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                              : typeof studentGrade === "number"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          }`}
                        />
                      </td>

                      {/* Dynamic Dual TP Achievement Description (Capaian Tertinggi & Perlu Bimbingan) */}
                      <td className="p-3">
                        {tier ? (
                          <div className="space-y-2 py-1">
                            {/* Tier Badge & Status */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tier.badgeClass}`}
                              >
                                <span>{tier.icon}</span>
                                <span>{tier.label}</span>
                              </span>

                              {isCustomized && (
                                <button
                                  type="button"
                                  onClick={() => handleResetTpDescription(s.id)}
                                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Kembalikan kedua kotak ke deskripsi otomatis Bank TP"
                                >
                                  <span>⚡ Reset ke TP Otomatis</span>
                                </button>
                              )}
                            </div>

                            {/* Dual Description Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {/* Capaian Tertinggi */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                  <span>🌟</span>
                                  <span>Capaian Tertinggi:</span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={currentTinggi}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomDescTinggiMap((prev) => ({ ...prev, [s.id]: val }));
                                    setCustomDescMap((prev) => ({ ...prev, [s.id]: val }));
                                  }}
                                  placeholder="Menunjukkan penguasaan sangat baik dalam..."
                                  className="w-full text-[11px] p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed resize-y"
                                />
                              </div>

                              {/* Perlu Peningkatan / Bimbingan */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                  <span>🎯</span>
                                  <span>Perlu Peningkatan / Bimbingan:</span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={currentBimbingan}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomDescBimbinganMap((prev) => ({ ...prev, [s.id]: val }));
                                  }}
                                  placeholder="Perlu peningkatan konsistensi pemahaman dan pendampingan dalam..."
                                  className="w-full text-[11px] p-2 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-y"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Ketik nilai (0-100) untuk otomatis memunculkan deskripsi Capaian Tertinggi dan Perlu Bimbingan dari Bank TP
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Nilai dan deskripsi TP yang Anda simpan akan tersimpan aman ke database Cloud Firebase.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveNilai(false)}
              disabled={studentsInClass.length === 0 || isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md cursor-pointer transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan ke Cloud..." : "Simpan Nilai & Deskripsi TP"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
