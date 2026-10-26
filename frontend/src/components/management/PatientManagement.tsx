import React, { useEffect, useState } from "react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
} from "../../api/client";
import type { Patient, PatientCreate, PatientHistoryResponse } from "../../types";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  History,
  AlertCircle,
} from "lucide-react";

const DISEASE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  kidney_failure: { label: "Kronik Böbrek Yetmezliği (KBY)", icon: "🫘", color: "bg-amber-50 text-amber-800 border-amber-200" },
  heart_failure: { label: "Kalp Yetmezliği (HFrEF/HFpEF)", icon: "❤️", color: "bg-rose-50 text-rose-800 border-rose-200" },
  diabetes_type2: { label: "Tip 2 Diyabet", icon: "🩺", color: "bg-blue-50 text-blue-800 border-blue-200" },
  copd_respiratory: { label: "KOAH & Solunum", icon: "🫁", color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  hypertension: { label: "Hipertansiyon", icon: "🩸", color: "bg-purple-50 text-purple-800 border-purple-200" },
};

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientCreate>({
    protocol_no: "",
    tc_kimlik: "",
    name: "",
    age: 60,
    phone: "",
    ward: "Nefroloji Servisi",
    assigned_doctor: "Prof. Dr. Deniz Aksoy",
    primary_disease: "kidney_failure",
    notes: "",
  });

  // History Drawer
  const [historyTarget, setHistoryTarget] = useState<Patient | null>(null);
  const [historyData, setHistoryData] = useState<PatientHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadPatients = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients(query);
      setPatients(data);
    } catch (err: any) {
      setError(err.message || "Hastalar listelenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(searchQuery.trim() || undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openAddModal = () => {
    setEditingPatient(null);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      protocol_no: `PRT-2026-${randNum}`,
      tc_kimlik: "",
      name: "",
      age: 60,
      phone: "",
      ward: "Nefroloji Servisi",
      assigned_doctor: "Prof. Dr. Deniz Aksoy",
      primary_disease: "kidney_failure",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      protocol_no: p.protocol_no,
      tc_kimlik: p.tc_kimlik,
      name: p.name,
      age: p.age || undefined,
      phone: p.phone || "",
      ward: p.ward || "",
      assigned_doctor: p.assigned_doctor || "",
      primary_disease: p.primary_disease,
      notes: p.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, formData);
      } else {
        await createPatient(formData);
      }
      setIsModalOpen(false);
      loadPatients(searchQuery.trim() || undefined);
    } catch (err: any) {
      alert(err.message || "Kaydetme başarısız.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} isimli hastayı ve kayıtlarını silmek istediğinize emin misiniz?`)) return;
    try {
      await deletePatient(id);
      loadPatients(searchQuery.trim() || undefined);
    } catch (err: any) {
      alert(err.message || "Silme başarısız.");
    }
  };

  const openHistoryDrawer = async (p: Patient) => {
    setHistoryTarget(p);
    setHistoryLoading(true);
    try {
      const hist = await getPatientHistory(p.protocol_no);
      setHistoryData(hist);
    } catch (err: any) {
      alert("Geçmiş kayıtlar alınamadı.");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Hasta Kayıt & Takip Yönetimi</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1e5ba3] font-bold border border-blue-200">
              {patients.length} Hasta Listelendi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Taburcu edilen hastaların kimlik bilgileri, primer tanıları ve geçmiş taburculuk kayıtları.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#1e5ba3] hover:bg-[#154680] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Hasta Kaydet</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hasta adı, T.C. kimlik numarası veya Protokol No ile ara (örn: PRT-2026-1042)..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#1e5ba3]"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Protokol / Hasta</th>
                <th className="py-3.5 px-4">T.C. Kimlik</th>
                <th className="py-3.5 px-4">Tanı / Hastalık</th>
                <th className="py-3.5 px-4">Servis & Sorumlu Hekim</th>
                <th className="py-3.5 px-4">İletişim</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Hastalar yükleniyor...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Kayıtlı hasta bulunamadı.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const diseaseMeta = DISEASE_LABELS[p.primary_disease] || {
                    label: p.primary_disease,
                    icon: "🩺",
                    color: "bg-slate-50 text-slate-700 border-slate-200",
                  };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                        <div className="text-[11px] font-mono text-[#1e5ba3] font-bold mt-0.5">
                          {p.protocol_no} {p.age ? `• ${p.age} yaş` : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">{p.tc_kimlik}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${diseaseMeta.color}`}
                        >
                          <span>{diseaseMeta.icon}</span>
                          <span>{diseaseMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{p.ward || "Belirtilmemiş"}</div>
                        <div className="text-[11px] text-slate-500">{p.assigned_doctor || "Hekim Atanmadı"}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {p.phone || <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openHistoryDrawer(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-[#1e5ba3] hover:bg-blue-100 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Geçmiş Taburculukları Görüntüle"
                          >
                            <History size={13} />
                            <span>Geçmiş</span>
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-slate-100 cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <History size={18} className="text-[#1e5ba3]" />
                  <span>Hastanın Taburculuk ve Tanı Geçmişi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hasta: <strong className="text-slate-800">{historyTarget.name}</strong> • Protokol:{" "}
                  <strong className="text-slate-800 font-mono">{historyTarget.protocol_no}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Geçmiş kayıtlar taranıyor...</div>
            ) : !historyData || historyData.cases.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                Bu hasta için henüz işlenmiş taburculuk epikrizi kaydı bulunmamaktadır.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kayıtlı Taburculuk Olayları ({historyData.cases.length})
                </div>

                {historyData.cases.map((c) => (
                  <div
                    key={c.case_id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-200 transition space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {c.disease === "kidney_failure" ? "🫘" : c.disease === "heart_failure" ? "❤️" : "🩺"}
                        </span>
                        <div className="font-extrabold text-sm text-slate-900">{c.disease_name}</div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          {new Date(c.created_at).toLocaleDateString("tr-TR")}
                        </span>
                        {c.risk_level && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                              c.risk_level === "high"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : c.risk_level === "medium"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {c.risk_level} Risk (%{c.overall_score})
                          </span>
                        )}
                      </div>
                    </div>

                    {c.diagnosis_text && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {c.diagnosis_text}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] font-mono text-slate-500">
                      <span>Vaka Kodu: {c.case_id.slice(0, 8)}...</span>
                      <span className="capitalize font-bold text-slate-700">Durum: {c.workflow_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingPatient ? "Hasta Bilgilerini Güncelle" : "Yeni Hasta Kaydı"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Protokol No *</label>
                  <input
                    type="text"
                    required
                    value={formData.protocol_no}
                    onChange={(e) => setFormData({ ...formData, protocol_no: e.target.value })}
                    placeholder="PRT-2026-1042"
                    className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">T.C. Kimlik No *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={formData.tc_kimlik}
                    onChange={(e) => setFormData({ ...formData, tc_kimlik: e.target.value })}
                    placeholder="11 haneli T.C."
                    className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Hasta Adı Soyadı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Yaş</label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || undefined })}
                    placeholder="65"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tanı / Primer Hastalık *</label>
                <select
                  value={formData.primary_disease}
                  onChange={(e) => setFormData({ ...formData, primary_disease: e.target.value })}
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white cursor-pointer font-bold text-slate-800"
                >
                  <option value="kidney_failure">🫘 Kronik Böbrek Yetmezliği (KBY & Diyaliz)</option>
                  <option value="heart_failure">❤️ Kalp Yetmezliği (HFrEF / HFpEF)</option>
                  <option value="diabetes_type2">🩺 Tip 2 Diyabet & İnsülin Yönetimi</option>
                  <option value="copd_respiratory">🫁 KOAH & Kronik Solunum</option>
                  <option value="hypertension">🩸 Dirençli Hipertansiyon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Klinik / Servis</label>
                  <input
                    type="text"
                    value={formData.ward || ""}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    placeholder="Nefroloji Servisi"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Sorumlu Hekim</label>
                  <input
                    type="text"
                    value={formData.assigned_doctor || ""}
                    onChange={(e) => setFormData({ ...formData, assigned_doctor: e.target.value })}
                    placeholder="Prof. Dr. Deniz Aksoy"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Telefon Numarası</label>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0532 ..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Klinik Takip Notları</label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Örn: Evre 4 KBY, potasyum hassasiyeti..."
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
                  {editingPatient ? "Güncelle" : "Hastayı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
