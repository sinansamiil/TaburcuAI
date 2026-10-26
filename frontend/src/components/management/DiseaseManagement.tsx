import React, { useEffect, useState } from "react";
import { getDiseases, createDisease, deleteDisease } from "../../api/client";
import type { DiseaseConfig, DiseaseConfigCreate } from "../../types";
import {
  Plus,
  Trash2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export function DiseaseManagement() {
  const [diseases, setDiseases] = useState<DiseaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DiseaseConfigCreate>({
    id: "",
    name: "",
    specialty: "",
    icon: "🩺",
    status: "active",
    description: "",
    version: "1.0.0",
    is_custom: true,
  });

  const loadDiseases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiseases();
      setDiseases(data);
    } catch (err: any) {
      setError(err.message || "Hastalık protokolleri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiseases();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDisease(formData);
      setIsModalOpen(false);
      loadDiseases();
    } catch (err: any) {
      alert(err.message || "Hastalık eklenemedi.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} protokolünü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteDisease(id);
      loadDiseases();
    } catch (err: any) {
      alert(err.message || "Silme başarısız.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Klinik Hastalık Modülleri & Protokoller</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {diseases.length} Aktif Protokol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistemin yapay zeka ile otomatik tanıdığı, teach-back soruları ürettiği ve risk analizi yaptığı hastalıklar.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              id: "",
              name: "",
              specialty: "Dahiliye",
              icon: "🩺",
              status: "active",
              description: "",
              version: "1.0.0",
              is_custom: true,
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#1e5ba3] hover:bg-[#154680] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Hastalık Modülü Tanımla</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Disease Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Protokoller yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {diseases.map((d) => (
            <div
              key={d.id}
              className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 card-shadow hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{d.icon}</span>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">{d.name}</h3>
                      <div className="text-xs font-bold text-[#1e5ba3] mt-0.5">{d.specialty}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                      d.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {d.status === "active" ? "Aktif" : d.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {d.description || "Bu hastalık için klinik taburculuk protokolü yapılandırılmıştır."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <HelpCircle size={14} className="text-[#1e5ba3]" />
                  <span>{d.question_count} Teach-Back Sorusu</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">v{d.version}</span>
                  {d.is_custom && (
                    <button
                      onClick={() => handleDelete(d.id, d.name)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Protokolü Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Yeni Hastalık Modülü Tanımla</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">İkon (Emoji)</label>
                  <input
                    type="text"
                    required
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🩺"
                    className="w-full p-3 text-center text-lg border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Hastalık ID (kod) *</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                    }
                    placeholder="örn: astim_kronik"
                    className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Hastalık Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Kronik Astım & Alerjik Solunum"
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Uzmanlık / Klinik *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Göğüs Hastalıkları"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Durum</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="active">Aktif</option>
                    <option value="beta">Beta Testi</option>
                    <option value="roadmap">Planlanan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Açıklama & Takip Protokolü</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu hastalıkta dikkat edilecek kırmızı bayraklar, diyet ve ilaç uyum hedefleri..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1e5ba3] hover:bg-[#154680] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Protokolü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
