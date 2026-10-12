import { useState } from "react";
import { createCase, getCaseQuestions, submitAnswers } from "../api/client";
import type {
  CaseResponse,
  Question,
  SubmitAnswersResponse,
} from "../types";

const SAMPLE_HEART_FAILURE_SUMMARY = `HACETTEPE ÜNİVERSİTESİ HASTANESİ KARDİYOLOJİ ANABİLİM DALI
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: EPK-2026-1042
TARİH: 12.10.2026

KLİNİK TANI:
Düşük Ejeksiyon Fraksiyonlu Kalp Yetmezliği (HFrEF, EF: %30)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Lasix (Furosemid) 40 mg: günde 1 kez, sabah aç karnına alınacak. (Ödem ve sıvı yüklenmesini azaltmak)
- Beloc ZOK (Metoprolol süksinat) 50 mg: günde 1 tablet, sabah tok karnına alınacak. (Kalp hızını ve kan basıncını kontrol etmek)
- Entresto (Sakubitril/Valsartan) 49/51 mg: günde 2 tablet, sabah ve akşam alınacak. (Kalp yetmezliği ilerlemesini yavaşlatmak)

YAŞAM TARZI VE DİYET ÖNERİLERİ:
Kilo Takibi: Her sabah uyanınca, idrar yapıldıktan sonra aç karnına aynı tartı ile tartılınız. 3 günde 2 kg veya 1 günde 1 kg artış olursa hekiminize bildiriniz.
Tuz Kısıtlaması: Günlük tuz tüketimi kesinlikle kısıtlanmalıdır (yemeklere tuz eklenmeyecektir).
Sıvı Kısıtlaması: Günlük sıvı alımı 1.5 litre (1500 ml) ile sınırlandırılmalıdır (su, çorba, çay dahil).

DİKKAT EDİLMESİ GEREKEN UYARI BELİRTİLERİ (KIRMIZI BAYRAKLAR):
- İstirahat halinde veya eforla nefes darlığında belirgin artış
- Geceleri nefes darlığı ile uyanma veya düz yatamama
- Ayak bileklerinde ve bacaklarda belirgin şişlik ve ödem artışı

KONTROL VE RANDEVU:
10 gün sonra Kardiyoloji Polikliniği'ne kan biyokimyası ve EKO kontrolü amacıyla başvurunuz.`;

export function HastaPage() {
  const [step, setStep] = useState<"input" | "plan" | "questions" | "result">("input");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentCase, setCurrentCase] = useState<CaseResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitAnswersResponse | null>(null);

  // 1. Submit discharge text
  const handleProcessCase = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      setError("Lütfen taburculuk metnini girin veya örnek metni yükleyin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const caseRes = await createCase(textToProcess);
      setCurrentCase(caseRes);
      setStep("plan");
    } catch (err: any) {
      setError(err.message || "Epikriz işlenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Proceed to questions
  const handleStartQuestions = async () => {
    if (!currentCase) return;
    setLoading(true);
    setError(null);
    try {
      const qRes = await getCaseQuestions(currentCase.id);
      setQuestions(qRes.questions);
      // Initialize answer states
      const initialAns: Record<string, string> = {};
      qRes.questions.forEach((q) => {
        initialAns[q.id] = "";
      });
      setAnswers(initialAns);
      setStep("questions");
    } catch (err: any) {
      setError(err.message || "Sorular yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit patient answers
  const handleSubmitAnswers = async () => {
    if (!currentCase) return;
    setLoading(true);
    setError(null);
    try {
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      const res = await submitAnswers(currentCase.id, answersPayload);
      setResult(res);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Cevaplar değerlendirilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b pb-4 text-sm font-medium">
        <div className={`flex items-center gap-2 ${step === "input" ? "text-blue-600 font-bold" : "text-gray-500"}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center">1</span>
          <span>Epikriz Girişi</span>
        </div>
        <span className="text-gray-300">→</span>
        <div className={`flex items-center gap-2 ${step === "plan" ? "text-blue-600 font-bold" : "text-gray-500"}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center">2</span>
          <span>Sadeleştirilmiş Plan</span>
        </div>
        <span className="text-gray-300">→</span>
        <div className={`flex items-center gap-2 ${step === "questions" ? "text-blue-600 font-bold" : "text-gray-500"}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center">3</span>
          <span>Anlaşılma Kontrolü</span>
        </div>
        <span className="text-gray-300">→</span>
        <div className={`flex items-center gap-2 ${step === "result" ? "text-blue-600 font-bold" : "text-gray-500"}`}>
          <span className="w-6 h-6 rounded-full border flex items-center justify-center">4</span>
          <span>Sonuç & Rapor</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: INPUT */}
      {step === "input" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Taburculuk Özeti (Epikriz) Yükleyin</h2>
            <p className="text-slate-500 text-sm mt-1">
              Hastaneden verilen taburculuk belgesini yapıştırın veya tek tıkla test etmek için hazır kalp yetmezliği örneğini kullanın.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setRawText(SAMPLE_HEART_FAILURE_SUMMARY);
                handleProcessCase(SAMPLE_HEART_FAILURE_SUMMARY);
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition cursor-pointer border border-blue-200"
            >
              ✨ Hazır Kalp Yetmezliği Örneğini Yükle ve Başlat
            </button>
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_HEART_FAILURE_SUMMARY)}
              className="px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition cursor-pointer border border-slate-200"
            >
              Yalnızca Metne Yapıştır
            </button>
          </div>

          <textarea
            rows={12}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Taburculuk özeti metnini buraya yapıştırınız..."
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono text-slate-700 resize-y"
          />

          <div className="flex justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleProcessCase(rawText)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Plan Sadeleştiriliyor..." : "Planı Sadeleştir ve İlerle →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SIMPLIFIED PLAN */}
      {step === "plan" && currentCase && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
            <div className="border-b pb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                {currentCase.disease.replace("_", " ").toUpperCase()}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                {currentCase.discharge_info.diagnosis_text}
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Aşağıdaki plan hekiminizin taburculuk talimatlarına göre sadeleştirilmiştir.
              </p>
            </div>

            {/* Daily Schedule Slots */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>💊</span> Günlük İlaç Kullanım Zaman Çizelgesi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCase.simplified_plan.daily_schedule.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-800">{med.name}</div>
                      <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                        {med.dose_text}
                      </span>
                    </div>
                    {med.purpose && (
                      <p className="text-xs text-slate-600 italic">Amaç: {med.purpose}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {med.slots.map((slot, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize"
                        >
                          ⏰ {slot}
                        </span>
                      ))}
                      {med.timing_text && (
                        <span className="text-xs text-slate-500 px-2 py-0.5">
                          ({med.timing_text})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Routine */}
            {currentCase.simplified_plan.daily_routine.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>⚖️</span> Günlük Takip ve Yaşam Tarzı
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {currentCase.simplified_plan.daily_routine.map((item, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/60 rounded-xl text-sm text-slate-800 border border-blue-100">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Signs */}
            {currentCase.simplified_plan.warning_signs.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                  <span>🚨</span> Kırmızı Bayraklar (Acil Uyarı Belirtileri)
                </h3>
                <ul className="space-y-2">
                  {currentCase.simplified_plan.warning_signs.map((sign, idx) => (
                    <li key={idx} className="p-3 bg-red-50 rounded-xl text-sm text-red-800 border border-red-100 flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up */}
            {currentCase.simplified_plan.follow_ups.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  📅 Randevu ve Kontroller
                </h3>
                {currentCase.simplified_plan.follow_ups.map((fu, idx) => (
                  <div key={idx} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
                    {fu}
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 border text-center">
              {currentCase.simplified_plan.disclaimer}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm hover:bg-slate-50 cursor-pointer"
              >
                ← Metni Değiştir
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleStartQuestions}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-md cursor-pointer"
              >
                {loading ? "Sorular Hazırlanıyor..." : "Anlaşılma Kontrolüne Geç (Teach-Back) →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TEACH-BACK QUESTIONS */}
      {step === "questions" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Anlaşılma Kontrolü (Teach-Back)</h2>
            <p className="text-slate-500 text-sm mt-1">
              Taburculuk talimatlarını kendi kelimelerinizle açıklayın. Sistem, doktorunuzun talimatlarıyla uyumunuzu değerlendirecektir.
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-5 border border-slate-200 rounded-xl space-y-3 bg-slate-50/30">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-slate-800 text-base">
                    {idx + 1}. {q.text}
                  </div>
                  {q.criticality === "high" && (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                      Önemli
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="Cevabınızı kendi cümlelerinizle yazınız..."
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => setStep("plan")}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm hover:bg-slate-50 cursor-pointer"
            >
              ← Plana Geri Dön
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitAnswers}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Cevaplar Değerlendiriliyor..." : "Cevapları Gönder ve Raporu Al →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULT & RISK REPORT */}
      {step === "result" && result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          {/* Emergency Alert Banner */}
          {result.emergency_triggered && (
            <div className="p-6 bg-red-600 text-white rounded-2xl shadow-lg space-y-2 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <h3 className="text-xl font-bold">ACİL TIBBİ UYARI</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {result.emergency_message}
              </p>
            </div>
          )}

          {/* Risk Level Badge */}
          <div className="p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Genel Uyum ve Risk Seviyesi
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`text-2xl font-black px-4 py-1.5 rounded-xl uppercase ${
                    result.risk_report.level === "high"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : result.risk_report.level === "medium"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {result.risk_report.level === "high"
                    ? "YÜKSEK RİSK"
                    : result.risk_report.level === "medium"
                    ? "ORTA RİSK"
                    : "DÜŞÜK RİSK"}
                </span>
                <span className="text-sm text-slate-600 font-medium">
                  Risk Skoru: {result.risk_report.overall_score} / 100
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 max-w-xs text-right">
              {result.risk_report.suggested_staff_action}
            </div>
          </div>

          {/* Question by Question Verdicts */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Cevap Değerlendirmeleri</h3>
            {result.evaluations.map((ev, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">SORU {idx + 1}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${
                      ev.verdict === "correct"
                        ? "bg-emerald-100 text-emerald-800"
                        : ev.verdict === "partial"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ev.verdict === "correct"
                      ? "Doğru Anlaşıldı"
                      : ev.verdict === "partial"
                      ? "Kısmen Anlaşıldı"
                      : ev.verdict === "unclear"
                      ? "Belirsiz"
                      : "Eksik / Yanlış"}
                  </span>
                </div>
                <p className="text-sm text-slate-800 font-medium">
                  Verilen Cevap: "{ev.raw_answer}"
                </p>
                {ev.matched_points.length > 0 && (
                  <div className="text-xs text-emerald-700">
                    ✓ Eşleşen noktalar: {ev.matched_points.join(", ")}
                  </div>
                )}
                {ev.missing_points.length > 0 && (
                  <div className="text-xs text-red-600">
                    ✗ Eksik noktalar: {ev.missing_points.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setRawText("");
                setCurrentCase(null);
                setResult(null);
              }}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer"
            >
              Yeni Epikriz İncele
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
