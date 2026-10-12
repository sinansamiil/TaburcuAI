import { useEffect, useState } from "react";
import { getCase, getStaffCases } from "../api/client";
import type { CaseResponse, StaffCaseSummary } from "../types";

export function PersonelPage() {
  const [cases, setCases] = useState<StaffCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<CaseResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffCases();
      setCases(data.cases);
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
    setDetailLoading(true);
    try {
      const caseData = await getCase(caseId);
      setSelectedCase(caseData);
    } catch (err: any) {
      alert("Vaka detayı yüklenemedi: " + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sağlık Personeli Risk Takip Paneli</h2>
          <p className="text-slate-500 text-sm mt-1">
            Taburcu edilen hastaların teach-back uyum düzeyleri ve klinik risk önceliklendirmesi (Kırmızı: Acil/Yüksek, Sarı: Orta, Yeşil: Düşük).
          </p>
        </div>
        <button
          onClick={loadCases}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition cursor-pointer self-start"
        >
          🔄 Listeyi Yenile
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Vakalar yükleniyor...</div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="text-4xl">📋</div>
          <h3 className="text-lg font-bold text-slate-700">Henüz Kayıtlı Vaka Yok</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Hasta görünümünden yeni bir taburculuk özeti girip değerlendirmeyi tamamladığınızda vakalar burada risk sırasına göre listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CASES LIST */}
          <div className="lg:col-span-2 space-y-4">
            {cases.map((c) => (
              <div
                key={c.case_id}
                onClick={() => handleSelectCase(c.case_id)}
                className={`p-5 rounded-2xl border transition cursor-pointer hover:shadow-md ${
                  selectedCase?.id === c.case_id
                    ? "border-blue-500 ring-2 ring-blue-100 bg-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {c.case_id.slice(0, 8)}...
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleString("tr-TR")}
                    </span>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex items-center gap-2">
                    {c.emergency_triggered && (
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                        🚨 ACİL DURUM
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        c.level === "high"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : c.level === "medium"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : c.level === "low"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.level ? `${c.level} RİSK (${c.overall_score}/100)` : "DEĞERLENDİRİLMEDİ"}
                    </span>
                  </div>
                </div>

                {c.suggested_staff_action && (
                  <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                    💡 <strong>Önerilen Klinik Aksiyon:</strong> {c.suggested_staff_action}
                  </p>
                )}

                {c.reasons.length > 0 && (
                  <ul className="text-xs text-slate-500 list-disc list-inside mt-2 space-y-0.5">
                    {c.reasons.slice(0, 2).map((r, rIdx) => (
                      <li key={rIdx}>{r}</li>
                    ))}
                    {c.reasons.length > 2 && (
                      <li className="text-slate-400">+{c.reasons.length - 2} gerekçe daha...</li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* DETAIL PANEL */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24 space-y-4">
              <h3 className="font-bold text-slate-800 text-lg border-b pb-3">
                Vaka Detayları
              </h3>

              {detailLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Detaylar yükleniyor...</div>
              ) : selectedCase ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Tanı</span>
                    <p className="font-semibold text-slate-800">
                      {selectedCase.discharge_info.diagnosis_text}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Reçete Edilen İlaçlar</span>
                    <ul className="mt-1 space-y-1">
                      {selectedCase.discharge_info.medications.map((m, idx) => (
                        <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded border">
                          <strong>{m.name}</strong> - {m.dose_text} ({m.frequency_text})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Orijinal Epikriz Metni</span>
                    <pre className="mt-1 p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap border">
                      {selectedCase.raw_text}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Detaylarını incelemek istediğiniz vakayı soldaki listeden seçiniz.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
