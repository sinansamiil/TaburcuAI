import { useEffect, useState } from "react";
import { getCaseReview, getStaffCases, submitCaseAction } from "../api/client";
import type { StaffCaseReview, StaffCaseSummary } from "../types";
import { DoctorManagement } from "../components/management/DoctorManagement";
import { NurseManagement } from "../components/management/NurseManagement";
import { PatientManagement } from "../components/management/PatientManagement";
import { DiseaseManagement } from "../components/management/DiseaseManagement";
import { HospitalBrandingSettings } from "../components/management/HospitalBrandingSettings";
import { useHospital } from "../components/HospitalContext";
import {
  Users,
  FileCheck2,
  TrendingUp,
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  Clock,
  HeartPulse,
  PhoneCall,
  GraduationCap,
  CheckSquare,
  RotateCcw,
  Send,
  Sparkles,
  FileText,
  HelpCircle,
  XCircle,
  AlertCircle,
  Pill,
  Activity,
  Check,
  X,
  Settings,
  UserCheck,
} from "lucide-react";

export function PersonelPage() {
  const { config } = useHospital();
  const [mainTab, setMainTab] = useState<"cases" | "doctors" | "nurses" | "patients" | "diseases" | "settings">("cases");

  const [cases, setCases] = useState<StaffCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected case & deep review state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [review, setReview] = useState<StaffCaseReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | "high" | "medium" | "low" | "pending">("all");
  const [filterDisease, setFilterDisease] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "score">("newest");

  // Right panel subtabs: 'overview' | 'gdmt' | 'transcript' | 'diff' | 'actions'
  const [detailTab, setDetailTab] = useState<"overview" | "gdmt" | "transcript" | "diff" | "actions">("overview");

  // Action form state
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Responsive mobile drawer / detail view toggle
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [staffInfo, setStaffInfo] = useState({
    name: "Dr. Michael Carter",
    title: "Kardiyoloji Uzmanı",
    role: "hekim",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("personel_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStaffInfo(parsed);
      } catch (e) {
        // default
      }
    }

    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["cases", "doctors", "nurses", "patients", "diseases", "settings"].includes(tab)) {
      setMainTab(tab as any);
    }
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffCases();
      setCases(data.cases);
      if (data.cases.length > 0 && !selectedCaseId) {
        handleSelectCase(data.cases[0].case_id);
      }
    } catch (err: any) {
      setError(err.message || "Vakalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setReviewLoading(true);
    setMobileDetailOpen(true);
    try {
      const revData = await getCaseReview(caseId);
      setReview(revData);
    } catch (err: any) {
      alert("Vaka detayları yüklenemedi: " + err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedCaseId) return;
    setActionLoading(true);
    try {
      const updatedWf = await submitCaseAction(selectedCaseId, {
        action,
        note: noteText.trim() ? noteText.trim() : undefined,
        author: `${staffInfo.name} (${staffInfo.title})`,
      });
      setNoteText("");
      // Update current review
      if (review) {
        setReview({ ...review, workflow: updatedWf });
      }
      // Update item in case list
      setCases((prev) =>
        prev.map((c) =>
          c.case_id === selectedCaseId
            ? { ...c, workflow_status: updatedWf.status }
            : c
        )
      );
    } catch (err: any) {
      alert("Aksiyon uygulanamadı: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredCases = cases
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.protocol_no?.toLowerCase().includes(q) ||
        c.patient_display?.toLowerCase().includes(q) ||
        c.ward?.toLowerCase().includes(q) ||
        c.reasons.some((r) => r.toLowerCase().includes(q)) ||
        c.case_id.toLowerCase().includes(q);

      let matchesLevel = true;
      if (filterLevel === "pending") {
        matchesLevel = !c.has_risk_report || c.level === null;
      } else if (filterLevel !== "all") {
        matchesLevel = c.level === filterLevel;
      }

      let matchesDisease = true;
      if (filterDisease !== "all") {
        matchesDisease = c.disease === filterDisease;
      }

      return matchesSearch && matchesLevel && matchesDisease;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "score") {
        return (b.overall_score ?? 0) - (a.overall_score ?? 0);
      }
      return 0;
    });

  const highRiskCount = cases.filter((c) => c.level === "high" || c.emergency_triggered).length;
  const mediumRiskCount = cases.filter((c) => c.level === "medium").length;
  const lowRiskCount = cases.filter((c) => c.level === "low").length;
  const pendingCount = cases.filter((c) => !c.has_risk_report || c.level === null).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Doctor Profile & Greeting Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center text-3xl shadow-md ${
                staffInfo.role === "hekim" ? "bg-[#1e5ba3]" : "bg-emerald-600"
              }`}>
                {staffInfo.role === "hekim" ? "👨‍⚕️" : "👩‍⚕️"}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Günaydın, {staffInfo.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  staffInfo.role === "hekim"
                    ? "bg-blue-50 text-[#1e5ba3] border-blue-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  {staffInfo.role === "hekim" ? "Uzman Hekim" : "Servis Sorumlu Hemşiresi"}
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Kardiyoloji Servisi • Teach-Back Uyum, Epikriz Doğrulama ve Klinik Triyaj Masası
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadCases}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Verileri Yenile</span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Bugün</div>
              <div className="text-xs font-extrabold text-slate-700">
                {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Modular Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 card-shadow flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMainTab("cases")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "cases"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "cases" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <Activity size={15} />
            <span>Klinik Vaka & Risk Takibi</span>
          </button>

          <button
            onClick={() => setMainTab("doctors")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "doctors"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "doctors" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <Stethoscope size={15} />
            <span>Doktor Kadrosu</span>
          </button>

          <button
            onClick={() => setMainTab("nurses")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "nurses"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "nurses" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <Users size={15} />
            <span>Hemşire Kadrosu</span>
          </button>

          <button
            onClick={() => setMainTab("patients")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "patients"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "patients" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <UserCheck size={15} />
            <span>Hasta Kayıt & Geçmiş</span>
          </button>

          <button
            onClick={() => setMainTab("diseases")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "diseases"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "diseases" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <Sparkles size={15} />
            <span>Hastalık Modülleri</span>
          </button>

          <button
            onClick={() => setMainTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              mainTab === "settings"
                ? "text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={mainTab === "settings" ? { backgroundColor: config.primary_color || "#1e5ba3" } : {}}
          >
            <Settings size={15} />
            <span>Hastane & Kurumsal Kimlik</span>
          </button>
        </div>

        {/* Modular Management Sub-Pages */}
        {mainTab === "doctors" && <DoctorManagement />}
        {mainTab === "nurses" && <NurseManagement />}
        {mainTab === "patients" && <PatientManagement />}
        {mainTab === "diseases" && <DiseaseManagement />}
        {mainTab === "settings" && <HospitalBrandingSettings />}

        {/* Main Tab 1: Clinical Case List & Deep Review */}
        {mainTab === "cases" && (
          <>
            {/* 4 Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 card-shadow flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Toplam Taburculuk</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">{cases.length}</div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                <FileCheck2 size={13} className="text-[#1e5ba3]" />
                İncelenen Vaka
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1e5ba3] flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-red-200 card-shadow flex items-center justify-between bg-red-50/20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Yüksek / Acil Risk</span>
              <div className="text-3xl font-black text-red-700 mt-1">{highRiskCount}</div>
              <span className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                <AlertOctagon size={13} />
                Öncelikli Geri Arama
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 card-shadow flex items-center justify-between bg-amber-50/20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Orta Risk Takip</span>
              <div className="text-3xl font-black text-amber-800 mt-1">{mediumRiskCount}</div>
              <span className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-1">
                <Clock size={13} />
                24 Saat İçinde Kontrol
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HeartPulse size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 card-shadow flex items-center justify-between bg-emerald-50/20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tam Uyum / Düşük Risk</span>
              <div className="text-3xl font-black text-emerald-800 mt-1">{lowRiskCount}</div>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 size={13} />
                Rutin Poliklinik Takibi
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 card-shadow flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Protokol No (PRT-2026-...), Hasta Adı veya Gerekçe..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1e5ba3] font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mr-1">
              <Filter size={13} />
              <span>Durum:</span>
            </div>
            {(["all", "high", "medium", "low", "pending"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterLevel === lvl
                    ? "bg-[#0e2038] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {lvl === "all"
                  ? "Tümü"
                  : lvl === "high"
                  ? `Yüksek (${highRiskCount})`
                  : lvl === "medium"
                  ? `Orta (${mediumRiskCount})`
                  : lvl === "low"
                  ? `Düşük (${lowRiskCount})`
                  : `Bekliyor (${pendingCount})`}
              </button>
            ))}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <select
              value={filterDisease}
              onChange={(e) => setFilterDisease(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
            >
              <option value="all">Tüm Hastalıklar</option>
              <option value="kidney_failure">🫘 Böbrek Yetmezliği (KBY)</option>
              <option value="heart_failure">❤️ Kalp Yetmezliği</option>
              <option value="diabetes_type2">🩺 Tip 2 Diyabet</option>
              <option value="copd_respiratory">🫁 KOAH</option>
              <option value="hypertension">🩸 Hipertansiyon</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
            >
              <option value="newest">En Yeni Tarih</option>
              <option value="oldest">En Eski Tarih</option>
              <option value="score">Skor (Yüksekten Düşüğe)</option>
            </select>
          </div>
        </div>

        {/* Main Content: Split Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Cases Flow List */}
          <div className={`lg:col-span-6 space-y-3 ${mobileDetailOpen ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>Hasta Akışı ({filteredCases.length})</span>
              <span>Protokol & Teach-Back Durumu</span>
            </div>

            {filteredCases.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 card-shadow">
                <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-2xl">
                  📋
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Eşleşen Vaka Bulunamadı</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Arama kriterlerinize uygun hasta taburculuğu veya teach-back kaydı bulunmuyor.
                </p>
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCaseId === c.case_id;
                const isHigh = c.level === "high" || c.emergency_triggered;
                const isMed = c.level === "medium";
                const isLow = c.level === "low";

                // Format Turkish date
                const formattedDate = new Date(c.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={c.case_id}
                    onClick={() => handleSelectCase(c.case_id)}
                    className={`p-5 rounded-2xl border transition cursor-pointer card-shadow-hover relative ${
                      isSelected
                        ? "bg-white border-[#1e5ba3] ring-2 ring-blue-100"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Header: Protocol No, Patient Name, Date */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1e5ba3] border border-blue-200">
                            {c.protocol_no || `PRT-2026-${c.case_id.slice(0, 4).toUpperCase()}`}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {c.patient_display || "Ahmet Y."}
                          </span>
                          {c.disease && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {c.disease === "kidney_failure"
                                ? "🫘 Böbrek Yetmezliği"
                                : c.disease === "diabetes_type2"
                                ? "🩺 Tip 2 Diyabet"
                                : c.disease === "copd_respiratory"
                                ? "🫁 KOAH"
                                : c.disease === "hypertension"
                                ? "🩸 Hipertansiyon"
                                : "❤️ Kalp Yetmezliği"}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          {c.ward || "Servis"} • {formattedDate}
                        </div>
                      </div>

                      {/* Risk Level Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {c.emergency_triggered && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                            🚨 ACİL KIRMIZI BAYRAK
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                            isHigh
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isMed
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isLow
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {c.level ? `${c.level} Risk (${c.overall_score}/100)` : "Bekliyor"}
                        </span>
                      </div>
                    </div>

                    {/* Teach-Back Verdict Badges (Doğru, Eksik, Hatalı) */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] font-bold">
                      <span className="text-slate-400 font-medium text-[10px] uppercase">Teach-Back:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> {c.verdict_counts.correct} Başarılı
                      </span>
                      {c.verdict_counts.partial > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle size={12} /> {c.verdict_counts.partial} Eksik
                        </span>
                      )}
                      {c.verdict_counts.incorrect > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={12} /> {c.verdict_counts.incorrect} Hatalı
                        </span>
                      )}
                      {c.verdict_counts.unanswered > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          <HelpCircle size={12} /> {c.verdict_counts.unanswered} Yanıtlanmadı
                        </span>
                      )}

                      {/* Workflow state badge */}
                      <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {c.workflow_status === "closed"
                          ? "✓ Kapandı"
                          : c.workflow_status === "contacted"
                          ? "📞 Arandı"
                          : c.workflow_status === "education_planned"
                          ? "📅 Eğitim Planlandı"
                          : c.workflow_status === "education_done"
                          ? "🎓 Eğitim Tamam"
                          : "⏳ Bekliyor"}
                      </span>
                    </div>

                    {/* Suggested staff action */}
                    {c.suggested_staff_action && (
                      <div className="mt-2.5 text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-800 font-medium">
                        <span className="text-[#1e5ba3] font-bold">Önerilen Aksiyon:</span> {c.suggested_staff_action}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Case Deep Review Desk */}
          <div className={`lg:col-span-6 ${mobileDetailOpen ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sticky top-24 card-shadow space-y-5">
              
              {/* Header with Mobile Back Button */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 mr-1"
                  >
                    ←
                  </button>
                  <Stethoscope size={20} className="text-[#1e5ba3]" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Klinik Vaka İnceleme Masası
                    </h3>
                    {review && (
                      <span className="text-xs text-slate-500 font-semibold">
                        {review.workflow.protocol_no} • {review.workflow.patient_display}
                      </span>
                    )}
                  </div>
                </div>

                {review?.workflow && (
                  <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase ${
                    review.workflow.status === "closed"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-blue-50 text-[#1e5ba3] border border-blue-200"
                  }`}>
                    {review.workflow.status === "closed" ? "Vaka Kapatıldı" : "Aktif İnceleme"}
                  </span>
                )}
              </div>

              {/* Subtabs: Genel Bakış | ESC 4'lü Kılavuz (GDMT) | Teach-Back Transkripti | İlaç Doğrulama (Diff) | Aksiyonlar */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => setDetailTab("overview")}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                    detailTab === "overview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Genel Bakış
                </button>
                <button
                  onClick={() => setDetailTab("gdmt")}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    detailTab === "gdmt" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <HeartPulse size={13} className="text-[#d92d20]" />
                  <span>ESC 4'lü GDMT Kılavuzu</span>
                  {review?.gdmt && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        review.gdmt.pillars_met === 4
                          ? "bg-emerald-100 text-emerald-800"
                          : review.gdmt.pillars_met >= 2
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {review.gdmt.pillars_met}/4
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDetailTab("transcript")}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    detailTab === "transcript" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText size={13} />
                  <span>Hasta Cevapları ({review?.transcript?.length ?? 0})</span>
                </button>
                <button
                  onClick={() => setDetailTab("diff")}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    detailTab === "diff" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Epikriz & İlaç Doğrulama</span>
                </button>
                <button
                  onClick={() => setDetailTab("actions")}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    detailTab === "actions" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Klinik İş Akışı</span>
                </button>
              </div>

              {reviewLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs font-medium space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-[#1e5ba3]" />
                  <p>Vaka detayları ve transkript inceleniyor...</p>
                </div>
              ) : review ? (
                <div className="text-xs space-y-4 max-h-[600px] overflow-y-auto pr-1">

                  {/* ── TAB 1: OVERVIEW ────────────────────────────────────────── */}
                  {detailTab === "overview" && (
                    <div className="space-y-4">
                      {/* Emergency Banner */}
                      {review.emergency_triggered && (
                        <div className="p-4 rounded-2xl bg-red-600 text-white font-bold space-y-1 shadow-md">
                          <div className="flex items-center gap-2 text-sm uppercase">
                            <AlertOctagon size={18} />
                            <span>Kırmızı Bayrak / Acil Triyaj Uyarısı</span>
                          </div>
                          <p className="text-xs font-normal text-red-100">
                            {review.emergency_message || "Hasta teach-back sırasında acil müdahale gerektiren semptom bildirdi."}
                          </p>
                        </div>
                      )}

                      {/* Clinical Diagnosis & HF Phenotype Box */}
                      <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[#1e5ba3] text-[10px] block">
                            Klinik Tanı & Kardiyolojik Profil
                          </span>
                          {review.phenotype?.phenotype_code && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase">
                              {review.phenotype.phenotype_code}
                            </span>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {review.case.discharge_info.diagnosis_text}
                        </p>

                        {/* Phenotype badges (EF, NYHA, Kuru Kilo) */}
                        {review.phenotype && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-100/60">
                            {review.phenotype.ejection_fraction && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 text-[11px] font-extrabold shadow-2xs">
                                <Activity size={12} className="text-[#1e5ba3]" />
                                EF: {review.phenotype.ejection_fraction}
                              </span>
                            )}
                            {review.phenotype.nyha_class && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 text-[11px] font-extrabold shadow-2xs">
                                <HeartPulse size={12} className="text-[#d92d20]" />
                                {review.phenotype.nyha_class}
                              </span>
                            )}
                            {review.phenotype.dry_weight && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-slate-800 text-[11px] font-extrabold shadow-2xs">
                                ⚖️ Hedef Kuru Kilo: {review.phenotype.dry_weight}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* GDMT 4-Pillar Quick Summary Card */}
                      {review.gdmt && (
                        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 card-shadow-hover">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HeartPulse size={16} className="text-[#d92d20]" />
                              <span className="font-extrabold text-slate-900 text-xs">
                                ESC/AHA 4'lü Kılavuz (GDMT) Uyumu
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                                review.gdmt.pillars_met === 4
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : review.gdmt.pillars_met >= 2
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {review.gdmt.pillars_met}/4 Sütun Reçeteli (%{review.gdmt.score_percent})
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {review.gdmt.pillars.map((p, idx) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-1 text-[11px] ${
                                  p.status === "prescribed"
                                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                    : "bg-rose-50/60 border-rose-200 text-rose-900"
                                }`}
                              >
                                <div>
                                  <div className="font-extrabold">{p.short_name}</div>
                                  <div className="text-[10px] opacity-80 truncate max-w-[140px]">
                                    {p.matched_drug || "Eksik Sütun"}
                                  </div>
                                </div>
                                {p.status === "prescribed" ? (
                                  <Check size={14} className="text-emerald-700 shrink-0" />
                                ) : (
                                  <X size={14} className="text-rose-600 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailTab("gdmt")}
                            className="w-full py-1.5 text-center text-xs font-bold text-[#1e5ba3] hover:bg-blue-50 rounded-lg transition border border-dashed border-blue-200 cursor-pointer"
                          >
                            Kılavuz Detaylarını ve Titrasyon Notlarını İncele →
                          </button>
                        </div>
                      )}

                      {/* Risk Score & Reasons */}
                      {review.risk_report && (
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Risk Skoru:</span>
                            <span className="text-sm font-black text-slate-900">{review.risk_report.overall_score} / 100</span>
                          </div>
                          <div className="text-xs font-bold text-[#1e5ba3]">
                            Önerilen Aksiyon: {review.risk_report.suggested_staff_action}
                          </div>
                          {review.risk_report.reasons.length > 0 && (
                            <ul className="text-xs text-slate-600 space-y-1 pt-1 list-disc list-inside">
                              {review.risk_report.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Quick Meds Summary */}
                      <div>
                        <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1.5">
                          Çıkarılan İlaçlar ({review.case.discharge_info.medications.length})
                        </span>
                        <div className="space-y-1.5">
                          {review.case.discharge_info.medications.map((m, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">{m.name}</span>
                                <span className="text-[11px] text-slate-500 ml-2">{m.dose_text} • {m.frequency_text}</span>
                              </div>
                              {m.timing_text && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-[#1e5ba3] font-bold">
                                  {m.timing_text}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: ESC 4'LÜ GDMT KILAVUZU (DEEP CARDIOLOGY ENGINE) ─────── */}
                  {detailTab === "gdmt" && (
                    <div className="space-y-4">
                      {/* Clinical Guideline Header */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e5ba3] text-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                            ESC 2021/2023 & AHA Kılavuz Standartları
                          </span>
                          <span className="text-xs font-bold text-blue-200">
                            Hedef: Mortalite & Morbidite Azaltımı
                          </span>
                        </div>
                        <h3 className="text-base font-black">
                          Düşük Ejeksiyon Fraksiyonlu Kalp Yetmezliği (HFrEF) 4'lü Sütun Tedavisi
                        </h3>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          ESC kılavuzlarına göre HFrEF tanılı her hastada kontrendikasyon olmadıkça bu 4 temel ilaç sınıfı taburculuk öncesi veya erken takipte başlanmalı ve hedef dozlara titre edilmelidir.
                        </p>
                      </div>

                      {/* Compliance Banner */}
                      {review.gdmt && (
                        <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase">Kılavuz Uyum Seviyesi:</div>
                              <div className="text-sm font-black text-slate-900">{review.gdmt.compliance_level}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-[#1e5ba3]">
                                {review.gdmt.pillars_met}/4
                              </span>
                              <span className="text-xs text-slate-400 block font-bold">Tamamlanan Sütun</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                review.gdmt.pillars_met === 4
                                  ? "bg-emerald-500"
                                  : review.gdmt.pillars_met >= 2
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${review.gdmt.score_percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 4 Pillar Cards */}
                      {review.gdmt?.pillars.map((pillar, idx) => {
                        const isPrescribed = pillar.status === "prescribed";
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition ${
                              isPrescribed
                                ? "bg-emerald-50/30 border-emerald-200 hover:border-emerald-300"
                                : "bg-rose-50/30 border-rose-200 hover:border-rose-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                                      isPrescribed ? "bg-emerald-600" : "bg-rose-600"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <h4 className="font-extrabold text-slate-900 text-xs">
                                    {pillar.name}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                                  {pillar.guideline_class} • {pillar.target}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  isPrescribed
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-100 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {isPrescribed ? "✓ Reçeteli" : "✗ Eksik Sütun"}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-white/80 border border-slate-200/60 text-xs text-slate-700 space-y-1">
                              <p className="font-medium leading-relaxed">
                                {pillar.clinical_note}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Diuretic & Decongestion Section */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <Pill size={14} className="text-[#1e5ba3]" />
                            Konjesyon & Kıvrım Diüretiği Değerlendirmesi
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                              review.gdmt?.loop_diuretic_prescribed
                                ? "bg-blue-100 text-[#1e5ba3]"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {review.gdmt?.loop_diuretic_prescribed ? "Diüretik Mevcut" : "Diüretik Yok"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {review.gdmt?.loop_diuretic_drug
                            ? `Hastaya ${review.gdmt.loop_diuretic_drug} reçete edilmiştir. Sıvı yükü ve ödem takibi için sabah aç karnına kullanımı ve kuru kilo takibi şarttır.`
                            : "Reçetede kıvrım diüretiği (Lasix/Furosemid vb.) bulunmamaktadır. Hastanın ödem ve konjesyonsuz (övolemik) olduğu doğrulanmalıdır."}
                        </p>
                      </div>

                      {/* Recommendations for Staff */}
                      {review.gdmt?.clinical_recommendations && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                          <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                            <AlertCircle size={13} />
                            Hekim & Hemşire Takip Önerileri
                          </span>
                          <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                            {review.gdmt.clinical_recommendations.map((rec, i) => (
                              <li key={i} className="leading-relaxed">
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 2: TRANSCRIPT (HASTA CEVAPLARI KARŞILAŞTIRMASI) ─────── */}
                  {detailTab === "transcript" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700">
                        <strong>Teach-Back Karşılaştırması:</strong> Hastanın Teach-Back sırasında verdiği yanıt ile beklenen doğru klinik maddeler yan yana eşleştirilmiştir.
                      </div>

                      {review.transcript.length === 0 ? (
                        <p className="text-center py-8 text-slate-400">Bu vaka için henüz soru yanıtlanmadı.</p>
                      ) : (
                        review.transcript.map((item, idx) => {
                          const isCorrect = item.verdict === "correct";
                          const isPartial = item.verdict === "partial";
                          const isIncorrect = item.verdict === "incorrect";

                          return (
                            <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-[#1e5ba3] text-white flex items-center justify-center text-[10px]">
                                    {idx + 1}
                                  </span>
                                  <span>{item.question_text}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                  isCorrect
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPartial
                                    ? "bg-amber-100 text-amber-800"
                                    : isIncorrect
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}>
                                  {item.verdict === "correct"
                                    ? "✓ Başarılı"
                                    : item.verdict === "partial"
                                    ? "⚠️ Kısmi Anlama"
                                    : item.verdict === "incorrect"
                                    ? "✗ Hatalı Kavrama"
                                    : "Cevaplanmadı"}
                                </span>
                              </div>

                              {/* Patient Answer */}
                              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Hastanın Gerçek Cevabı:
                                </span>
                                <p className="text-xs font-mono text-slate-800 italic">
                                  {item.patient_answer ? `"${item.patient_answer}"` : "(Cevap verilmedi)"}
                                </p>
                              </div>

                              {/* Expected Points vs Matched */}
                              <div className="space-y-1 text-[11px]">
                                <span className="font-bold text-slate-500 uppercase text-[10px] block">
                                  Beklenen Doğru Noktalar:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {item.expected_points.map((pt, i) => {
                                    const isMatched = item.matched_points?.includes(pt);
                                    return (
                                      <span
                                        key={i}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          isMatched
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                      >
                                        {isMatched ? "✓" : "✗"} {pt}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* ── TAB 3: EPİKRİZ & İLAÇ DOĞRULAMA (DIFF VIEW) ─────────────── */}
                  {detailTab === "diff" && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700">
                        <strong>Epikriz ve İlaç Uzlaştırma (Reconciliation):</strong> Orijinal epikriz metnindeki ilaçlar ile sisteme aktarılan ve hastaya anlatılan ilaçların doğrulaması.
                      </div>

                      {/* Verified items */}
                      <div className="space-y-2">
                        <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                          Doğrulanan İlaç Eşleşmeleri ({review.reconciliation.items.length})
                        </span>
                        {review.reconciliation.items.map((m, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">{m.name} ({m.dose_text})</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                m.status === "verified"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {m.status === "verified" ? "✓ Epikrizde Birebir Doğrulandı" : "Kısmi Eşleşme"}
                              </span>
                            </div>
                            {m.source_text && (
                              <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200">
                                <strong>Metin Alıntısı:</strong> "{m.source_text}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Unextracted drugs mentioned in text */}
                      {review.reconciliation.unextracted.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                          <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            Epikrizde Geçen Ancak Plana Alınmayan İlaçlar:
                          </span>
                          {review.reconciliation.unextracted.map((u, i) => (
                            <div key={i} className="text-[11px] text-amber-950 font-medium">
                              • <strong>{u.generic}</strong> ("{u.matched_alias}"): {u.context}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Raw text viewer */}
                      <div>
                        <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1">
                          Ham Epikriz Belge Metni:
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                          {review.case.raw_text}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* ── TAB 4: CLINICAL ACTIONS & WORKFLOW ──────────────────────── */}
                  {detailTab === "actions" && (
                    <div className="space-y-4">
                      {/* Action buttons */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                            {staffInfo.role === "hekim" ? "Hekim Klinik Onay & Karar Masası:" : "Hemşirelik Teach-Back & Hasta Takip Aksiyonları:"}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            staffInfo.role === "hekim" ? "bg-blue-50 text-[#1e5ba3]" : "bg-emerald-50 text-emerald-800"
                          }`}>
                            {staffInfo.role === "hekim" ? "Medikal Karar Yetkisi" : "Eğitim & Arama Yetkisi"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={actionLoading}
                            onClick={() => handleAction("contacted")}
                            className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1e5ba3] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <PhoneCall size={14} />
                            <span>Hasta/Yakını Arandı</span>
                          </button>

                          <button
                            disabled={actionLoading}
                            onClick={() => handleAction("education_planned")}
                            className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Clock size={14} />
                            <span>Yüz Yüze Eğitim Planla</span>
                          </button>

                          <button
                            disabled={actionLoading}
                            onClick={() => handleAction("education_done")}
                            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <GraduationCap size={14} />
                            <span>Teach-Back Tamamlandı</span>
                          </button>

                          {/* Close/Reopen Case: Strictly Doctor-only */}
                          {staffInfo.role === "hekim" ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleAction(review.workflow.closed ? "reopened" : "closed")}
                              className="p-2.5 rounded-xl border border-slate-300 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              {review.workflow.closed ? <RotateCcw size={14} /> : <CheckSquare size={14} />}
                              <span>{review.workflow.closed ? "Vakayı Yeniden Aç" : "Vakayı Onayla / Kapat"}</span>
                            </button>
                          ) : (
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-not-allowed select-none text-center">
                              <span>🔒</span>
                              <span>Kapatma Yetkisi: Yalnızca Hekim</span>
                            </div>
                          )}
                        </div>

                        {staffInfo.role === "hemsire" && (
                          <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
                            <span>ℹ️</span>
                            <span><strong>Hemşirelik Protokolü:</strong> Hastaya gerekli ilaç eğitimi ve telefon görüşmesi sağlandıktan sonra "Teach-Back Tamamlandı" butonuna basarak vakayı uzman hekimin onayına iletiniz.</span>
                          </div>
                        )}

                        {staffInfo.role === "hekim" && (
                          <div className="mt-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-950 flex items-start gap-2">
                            <span>🩺</span>
                            <span><strong>Hekim Direktifi:</strong> Servis hemşiresinin arama ve eğitim kayıtlarını kontrol edip, reçete eşleşmesini doğruladıktan sonra "Vakayı Onayla / Kapat" ile arşive alabilirsiniz.</span>
                          </div>
                        )}
                      </div>

                      {/* Free-text Clinical Note Area with dynamic role label */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="font-bold uppercase tracking-wider text-slate-700 text-[10px] block">
                          {staffInfo.role === "hekim" ? "Hekim Konsültasyon & Tıbbi Direktif Notu:" : "Servis Hemşiresi Hasta Takip & Görüşme Notu:"}
                        </label>
                        <textarea
                          rows={3}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={
                            staffInfo.role === "hekim"
                              ? "Hekim tıbbi değerlendirmesi, doz ayarlaması veya poliklinik kontrol talimatını yazınız..."
                              : "Hasta ile yapılan telefon görüşmesi, yakınına iletilen bilgi veya anlaşılamayan noktaları yazınız..."
                          }
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden"
                        />
                        <div className="flex justify-end">
                          <button
                            disabled={actionLoading || !noteText.trim()}
                            onClick={() => handleAction("note")}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 shadow-xs ${
                              staffInfo.role === "hekim" ? "bg-[#1e5ba3] hover:bg-[#154680]" : "bg-emerald-700 hover:bg-emerald-800"
                            }`}
                          >
                            <Send size={12} />
                            <span>{staffInfo.role === "hekim" ? "Hekim Notunu Kaydet" : "Hemşirelik Notunu Kaydet"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Event Log History */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                          İş Akışı ve Aksiyon Geçmişi ({review.workflow.events.length}):
                        </span>
                        {review.workflow.events.length === 0 ? (
                          <p className="text-slate-400 text-[11px]">Henüz kaydedilmiş bir aksiyon bulunmuyor.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {review.workflow.events.map((ev, i) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800">{ev.label}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {new Date(ev.at).toLocaleString("tr-TR")}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-[10px]">İşlemi Yapan: {ev.author}</div>
                                {ev.note && (
                                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-100 mt-1">
                                    "{ev.note}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs font-medium">
                  Detayını incelemek istediğiniz vakayı soldaki listeden seçiniz.
                </div>
              )}
            </div>
          </div>

        </div>
      </>
    )}

      </div>
    </div>
  );
}
