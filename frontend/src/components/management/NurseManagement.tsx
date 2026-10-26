import React, { useEffect, useState } from "react";
import { getNurses, createNurse, updateNurse, deleteNurse } from "../../api/client";
import type { Nurse, NurseCreate } from "../../types";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Phone,
  Clock,
  Building,
  Filter,
  AlertCircle,
} from "lucide-react";

export function NurseManagement() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [wardFilter, setWardFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [formData, setFormData] = useState<NurseCreate>({
    name: "",
    title: "Servis Hemşiresi",
    ward: "Nefroloji Servisi",
    shift: "Gündüz (08:00 - 16:00)",
    phone: "",
    is_active: true,
  });

  const loadNurses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNurses();
      setNurses(data);
    } catch (err: any) {
      setError(err.message || "Hemşireler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNurses();
  }, []);

  const openAddModal = () => {
    setEditingNurse(null);
    setFormData({
      name: "",
      title: "Servis Hemşiresi",
      ward: "Nefroloji Servisi",
      shift: "Gündüz (08:00 - 16:00)",
      phone: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (nurse: Nurse) => {
    setEditingNurse(nurse);
    setFormData({
      name: nurse.name,
      title: nurse.title,
      ward: nurse.ward,
      shift: nurse.shift,
      phone: nurse.phone || "",
      is_active: nurse.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNurse) {
        await updateNurse(editingNurse.id, formData);
      } else {
        await createNurse(formData);
      }
      setIsModalOpen(false);
      loadNurses();
    } catch (err: any) {
      alert(err.message || "Kaydetme başarısız oldu.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} isimli hemşireyi silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteNurse(id);
      loadNurses();
    } catch (err: any) {
      alert(err.message || "Silme başarısız oldu.");
    }
  };

  const handleToggleStatus = async (nurse: Nurse) => {
    try {
      await updateNurse(nurse.id, { is_active: !nurse.is_active });
      loadNurses();
    } catch (err: any) {
      alert("Durum güncellenemedi.");
    }
  };

  const wards = Array.from(new Set(nurses.map((n) => n.ward))).filter(Boolean);

  const filteredNurses = nurses.filter((nurse) => {
    const matchSearch =
      nurse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nurse.ward.toLowerCase().includes(searchQuery.toLowerCase());
    const matchWard = wardFilter === "all" || nurse.ward === wardFilter;
    return matchSearch && matchWard;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Hemşire Kadrosu Yönetimi</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {nurses.length} Hemşire Kayıtlı
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Taburculuk eğitimi ve klinik takip sürecini yürüten servis ve sorumlu hemşireler.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Hemşire Ekle</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hemşire adı veya servis ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
          <Filter size={15} className="text-slate-400" />
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="all">Tüm Servisler ({wards.length})</option>
            {wards.map((ward) => (
              <option key={ward} value={ward}>
                {ward}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Hemşire listesi yükleniyor...</div>
      ) : filteredNurses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
          Aramanızla eşleşen hemşire bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNurses.map((nurse) => (
            <div
              key={nurse.id}
              className={`p-5 rounded-2xl border bg-white space-y-3.5 card-shadow transition hover:border-emerald-300 ${
                nurse.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{nurse.name}</h3>
                    <div className="text-[11px] font-bold text-emerald-700 mt-0.5">{nurse.title}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(nurse)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                    nurse.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {nurse.is_active ? "Aktif" : "Pasif"}
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-2 font-medium">
                  <Building size={13} className="text-slate-400" />
                  <span className="font-bold text-slate-800">{nurse.ward}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Clock size={13} className="text-slate-400" />
                  <span>{nurse.shift}</span>
                </div>
                {nurse.phone && (
                  <div className="flex items-center gap-2 font-medium">
                    <Phone size={13} className="text-slate-400" />
                    <span>{nurse.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(nurse)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  title="Düzenle"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(nurse.id, nurse.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingNurse ? "Hemşire Bilgilerini Güncelle" : "Yeni Hemşire Kaydı"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Hemşire Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Hemşire Elif Kaya"
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Unvan / Görev</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Diyaliz Hemşiresi"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Klinik / Servis *</label>
                  <input
                    type="text"
                    required
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    placeholder="Nefroloji Servisi"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Çalışma Vardiyası</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="Gündüz (08:00 - 16:00)">Gündüz (08:00 - 16:00)</option>
                    <option value="Nöbetçi (16:00 - 08:00)">Nöbetçi (16:00 - 08:00)</option>
                    <option value="Gece Vardiyası">Gece Vardiyası</option>
                    <option value="Sorumlu Hemşire">Sorumlu Hemşire (Sabit)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Telefon</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0532 ..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="nurse_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor="nurse_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Aktif görevde (Takip eğitimleri ataması alabilir)
                </label>
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingNurse ? "Güncelle" : "Hemşireyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
