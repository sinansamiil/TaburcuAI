import React, { useState } from "react";
import { useHospital } from "../HospitalContext";
import {
  RotateCcw,
  Sparkles,
  Save,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";

const ICON_OPTIONS = [
  { key: "building-2", label: "Hastane Binası (Resmi / Şehir)", icon: "🏥" },
  { key: "heart-pulse", label: "Kardiyo-Renal Dalga", icon: "💓" },
  { key: "shield-plus", label: "Sağlık Kalkanı (Özel Grup)", icon: "🛡️" },
  { key: "graduation-cap", label: "Tıp Fakültesi / Üniversite", icon: "🎓" },
];

const COLOR_PALETTES = [
  { name: "Klinik Medikal Mavi", primary: "#1e5ba3", accent: "#0284c7" },
  { name: "Kurumsal Lacivert & Kırmızı", primary: "#0e2038", accent: "#d92d20" },
  { name: "Akademik Zümrüt & Teal", primary: "#0f766e", accent: "#14b8a6" },
  { name: "Modern İndigo & Menekşe", primary: "#4338ca", accent: "#6366f1" },
  { name: "Sağlık Grubu Bordo & Altın", primary: "#881337", accent: "#f59e0b" },
];

export function HospitalBrandingSettings() {
  const { config, update, reset, applyPreset } = useHospital();

  const [formData, setFormData] = useState({
    hospital_name: config.hospital_name || "",
    hospital_subtitle: config.hospital_subtitle || "",
    logo_icon: config.logo_icon || "building-2",
    primary_color: config.primary_color || "#1e5ba3",
    accent_color: config.accent_color || "#0284c7",
    phone: config.phone || "",
    emergency_phone: config.emergency_phone || "",
    address: config.address || "",
    email: config.email || "",
    active_departments: config.active_departments || [],
    custom_disclaimer: config.custom_disclaimer || "",
  });

  const [departmentInput, setDepartmentInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if config changes from outside (e.g. preset applied)
  React.useEffect(() => {
    setFormData({
      hospital_name: config.hospital_name || "",
      hospital_subtitle: config.hospital_subtitle || "",
      logo_icon: config.logo_icon || "building-2",
      primary_color: config.primary_color || "#1e5ba3",
      accent_color: config.accent_color || "#0284c7",
      phone: config.phone || "",
      emergency_phone: config.emergency_phone || "",
      address: config.address || "",
      email: config.email || "",
      active_departments: config.active_departments || [],
      custom_disclaimer: config.custom_disclaimer || "",
    });
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await update(formData);
      setSuccessMsg("Hastane kurumsal kimlik ayarları başarıyla kaydedildi ve tüm arayüze uygulandı!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Tüm ayarları varsayılan sabit şablona sıfırlamak istediğinize emin misiniz?")) return;
    setSaving(true);
    try {
      await reset();
      setSuccessMsg("Hastane ayarları varsayılan fabrika ayarlarına sıfırlandı!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Sıfırlama başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = async (presetKey: string) => {
    setSaving(true);
    try {
      await applyPreset(presetKey);
      setSuccessMsg("Seçilen hazır hastane teması anında uygulandı!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Şablon uygulanamadı.");
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = () => {
    if (departmentInput.trim() && !formData.active_departments.includes(departmentInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        active_departments: [...prev.active_departments, departmentInput.trim()],
      }));
      setDepartmentInput("");
    }
  };

  const removeDepartment = (dept: string) => {
    setFormData((prev) => ({
      ...prev,
      active_departments: prev.active_departments.filter((d) => d !== dept),
    }));
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1e5ba3] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>White-Label Kurumsal Özelleştirme</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Hastane Kurumsal Kimlik & Arayüz Özelleştirme
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Bu panel sayesinde sistemi satın alan hastane kendi adını, logosunu, kurumsal renklerini,
              aktif kliniklerini ve antet bilgilerini kod değiştirmeden tamamen özelleştirebilir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw size={14} />
            <span>Varsayılana Sıfırla</span>
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mt-6 p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={15} />
              Canlı Önizleme (Navbar & Antet Başlığı)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Primary: {formData.primary_color} • Accent: {formData.accent_color}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md"
                style={{ backgroundColor: formData.primary_color }}
              >
                {formData.logo_icon === "building-2" && "🏥"}
                {formData.logo_icon === "heart-pulse" && "💓"}
                {formData.logo_icon === "shield-plus" && "🛡️"}
                {formData.logo_icon === "graduation-cap" && "🎓"}
              </div>
              <div>
                <div className="text-base font-extrabold text-slate-900 leading-tight">
                  {formData.hospital_name || "Hastane Adı"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formData.hospital_subtitle || "Alt Başlık / Slogan"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs"
                style={{ backgroundColor: formData.accent_color }}
              >
                Buton Rengi
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                style={{
                  backgroundColor: `${formData.primary_color}15`,
                  color: formData.primary_color,
                  borderColor: `${formData.primary_color}30`,
                }}
              >
                Etiket / Rozet
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
            Hızlı Hazır Şablonlar (Tek Tıkla Uygula)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleApplyPreset("sehir_hastanesi")}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1e5ba3] shrink-0" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Şehir Hastanesi</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Sağlık Bakanlığı & Şehir Hastanesi resmi stili
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("ozel_saglik")}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0e2038] shrink-0" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Özel Sağlık Grubu</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Acıbadem / Medicana tarzı koyu lacivert & kırmızı
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("universite_tip")}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0f766e] shrink-0" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700">Üniversite Tıp</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Tıp Fakültesi ve araştırma hastanesi zümrüt teması
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset("butik_klinik")}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#4338ca] shrink-0" />
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Kardiyo-Renal Klinik</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Kalp ve böbrek ihtisas merkezi modern indigo teması
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow space-y-6">
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hospital Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hastane / Kurum Resmi Adı *
            </label>
            <input
              type="text"
              required
              value={formData.hospital_name}
              onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
              placeholder="Örn: Medicana Uluslararası Hastanesi"
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] text-slate-800 font-medium"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Slogan / Kurumsal Alt Başlık
            </label>
            <input
              type="text"
              value={formData.hospital_subtitle}
              onChange={(e) => setFormData({ ...formData, hospital_subtitle: e.target.value })}
              placeholder="Örn: Akıllı Taburculuk ve Klinik Takip Sistemi"
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] text-slate-800 font-medium"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kurumsal Logo İkonu
            </label>
            <select
              value={formData.logo_icon}
              onChange={(e) => setFormData({ ...formData, logo_icon: e.target.value })}
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] text-slate-800 font-medium cursor-pointer"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color Palettes quick pick */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Renk Paleti Seçimi (Veya Özel Renk Girin)
            </label>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_PALETTES.map((cp, idx) => (
                <button
                  key={idx}
                  type="button"
                  title={cp.name}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      primary_color: cp.primary,
                      accent_color: cp.accent,
                    })
                  }
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition hover:scale-110 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${cp.primary} 50%, ${cp.accent} 50%)`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Primary Hex */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Birincil Renk (Primary Hex)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="flex-1 p-3.5 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Accent Hex */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Vurgu / Buton Rengi (Accent Hex)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
              />
              <input
                type="text"
                value={formData.accent_color}
                onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                className="flex-1 p-3.5 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Emergency Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Acil Durum Çağrı Hattı (Navbar'da Görünür)
            </label>
            <input
              type="text"
              value={formData.emergency_phone}
              onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
              placeholder="Örn: 112 Acil Çağrı / +90 212 444 00 12"
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Santral / Danışma Telefonu
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Örn: +90 (212) 444 00 00"
              className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Active Departments / Clinics */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hastanede Aktif Klinikler ve Bölümler
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.active_departments.map((dept, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold"
              >
                <span>{dept}</span>
                <button
                  type="button"
                  onClick={() => removeDepartment(dept)}
                  className="text-blue-500 hover:text-red-600 cursor-pointer ml-1 text-sm font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={departmentInput}
              onChange={(e) => setDepartmentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDepartment();
                }
              }}
              placeholder="Yeni klinik adı ekle (örn: Onkoloji)..."
              className="flex-1 p-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
            />
            <button
              type="button"
              onClick={addDepartment}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ekle
            </button>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Rapor ve Taburculuk Belgesi Yasal Uyarı Metni (Antet Altı)
          </label>
          <textarea
            rows={3}
            value={formData.custom_disclaimer}
            onChange={(e) => setFormData({ ...formData, custom_disclaimer: e.target.value })}
            className="w-full p-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-800 leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1e5ba3] hover:bg-[#154680] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: formData.primary_color }}
          >
            <Save size={16} />
            <span>{saving ? "Kaydediliyor..." : "Özelleştirmeleri Kaydet ve Uygula"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
