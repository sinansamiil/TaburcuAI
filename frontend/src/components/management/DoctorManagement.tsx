import React, { useEffect, useState } from "react";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../../api/client";
import type { Doctor, DoctorCreate } from "../../types";
import {
  Stethoscope,
  Plus,
  Trash2,
  Edit2,
  Search,
  Mail,
  Phone,
  DoorOpen,
  Filter,
  AlertCircle,
} from "lucide-react";

export function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState<DoctorCreate>({
    name: "",
    title: "Uzman Doktor",
    specialty: "Nefroloji",
    email: "",
    phone: "",
    room: "",
    is_active: true,
  });

  const loadDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err: any) {
      setError(err.message || "Doktorlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData({
      name: "",
      title: "Uzman Doktor",
      specialty: "Nefroloji",
      email: "",
      phone: "",
      room: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormData({
      name: doc.name,
      title: doc.title,
      specialty: doc.specialty,
      email: doc.email || "",
      phone: doc.phone || "",
      room: doc.room || "",
      is_active: doc.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, formData);
      } else {
        await createDoctor(formData);
      }
      setIsModalOpen(false);
      loadDoctors();
    } catch (err: any) {
      alert(err.message || "Kaydetme başarısız oldu.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} isimli hekimi silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteDoctor(id);
      loadDoctors();
    } catch (err: any) {
      alert(err.message || "Silme başarısız oldu.");
    }
  };

  const handleToggleStatus = async (doc: Doctor) => {
    try {
      await updateDoctor(doc.id, { is_active: !doc.is_active });
      loadDoctors();
    } catch (err: any) {
      alert("Durum güncellenemedi.");
    }
  };

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty))).filter(Boolean);

  const filteredDoctors = doctors.filter((doc) => {
    const matchSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpec = specialtyFilter === "all" || doc.specialty === specialtyFilter;
    return matchSearch && matchSpec;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Doktor Kadrosu Yönetimi</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1e5ba3] font-bold border border-blue-200">
              {doctors.length} Hekim Kayıtlı
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hastane bünyesindeki uzman hekimleri, poliklinik odalarını ve branşları yönetin.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#1e5ba3] hover:bg-[#154680] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Yeni Doktor Ekle</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Doktor adı veya uzmanlık alanı ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#1e5ba3]"
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
          <Filter size={15} className="text-slate-400" />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
          >
            <option value="all">Tüm Branşlar ({specialties.length})</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Hekim listesi yükleniyor...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
          Aramanızla eşleşen hekim bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className={`p-5 rounded-2xl border bg-white space-y-3.5 card-shadow transition hover:border-blue-300 ${
                doc.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#1e5ba3] flex items-center justify-center font-bold text-sm shrink-0">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{doc.name}</h3>
                    <div className="text-[11px] font-bold text-[#1e5ba3] mt-0.5">{doc.title}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(doc)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                    doc.is_active
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {doc.is_active ? "Aktif" : "Pasif"}
                </button>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-slate-400">Branş:</span>
                  <span className="font-bold text-slate-800">{doc.specialty}</span>
                </div>
                {doc.room && (
                  <div className="flex items-center gap-2 font-medium">
                    <DoorOpen size={13} className="text-slate-400" />
                    <span>{doc.room}</span>
                  </div>
                )}
                {doc.phone && (
                  <div className="flex items-center gap-2 font-medium">
                    <Phone size={13} className="text-slate-400" />
                    <span>{doc.phone}</span>
                  </div>
                )}
                {doc.email && (
                  <div className="flex items-center gap-2 font-medium truncate">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(doc)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                  title="Düzenle"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
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
                {editingDoctor ? "Doktor Bilgilerini Güncelle" : "Yeni Doktor Kaydı"}
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
                <label className="text-xs font-bold text-slate-700 uppercase">Doktor Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Prof. Dr. Deniz Aksoy"
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Unvan</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Doç. Dr. / Uzm. Dr."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Uzmanlık / Branş *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Örn: Nefroloji, Kardiyoloji"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Oda / Poliklinik</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Poliklinik B-204"
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hekim@hastane.gov.tr"
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="doc_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="doc_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Aktif hekim kadrosunda (Hasta ataması yapılabilir)
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
                  className="px-5 py-2.5 rounded-xl bg-[#1e5ba3] hover:bg-[#154680] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingDoctor ? "Güncelle" : "Doktoru Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
