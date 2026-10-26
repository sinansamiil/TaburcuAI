import React, { useState, useRef, useEffect } from "react";
import { createCase, getCaseQuestions, submitAnswers, uploadCaseDocument, getPatientHistory } from "../api/client";
import { useHospital } from "../components/HospitalContext";
import type {
  CaseResponse,
  PatientHistoryCaseItem,
  Question,
  SubmitAnswersResponse,
} from "../types";
import {
  Upload,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  Activity,
  History,
  Building2,
  Phone,
  ShieldAlert,
} from "lucide-react";

const DISEASE_OPTIONS = [
  {
    id: "kidney_failure",
    name: "Kronik Böbrek Yetmezliği (KBY)",
    specialty: "Nefroloji Kliniği",
    icon: "🫘",
    badge: "Nefroloji",
    color: "bg-amber-50 text-amber-900 border-amber-200",
  },
  {
    id: "heart_failure",
    name: "Kalp Yetmezliği (HFrEF / HFpEF)",
    specialty: "Kardiyoloji Kliniği",
    icon: "❤️",
    badge: "Kardiyoloji",
    color: "bg-rose-50 text-rose-900 border-rose-200",
  },
  {
    id: "diabetes_type2",
    name: "Tip 2 Diyabet & İnsülin",
    specialty: "Endokrinoloji Kliniği",
    icon: "🩺",
    badge: "Endokrinoloji",
    color: "bg-blue-50 text-blue-900 border-blue-200",
  },
  {
    id: "copd_respiratory",
    name: "KOAH & Kronik Solunum",
    specialty: "Göğüs Hastalıkları Kliniği",
    icon: "🫁",
    badge: "Göğüs Hastalıkları",
    color: "bg-cyan-50 text-cyan-900 border-cyan-200",
  },
  {
    id: "hypertension",
    name: "Dirençli Hipertansiyon",
    specialty: "Dahiliye / Kardiyoloji",
    icon: "🩸",
    badge: "Dahiliye",
    color: "bg-purple-50 text-purple-900 border-purple-200",
  },
];

const SAMPLE_SUMMARIES: Record<string, string> = {
  kidney_failure: `NEFROLOJİ VE DİYALİZ KLİNİĞİ
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: PRT-2026-1042
TARİH: 19.10.2026

KLİNİK TANI:
Kronik Böbrek Yetmezliği (Evre 4 KBY, eGFR: 22 ml/dk, Serum Kreatinin: 3.4 mg/dL, Potasyum: 5.1 mEq/L)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Renagel (Sevelamer) 800 mg: günde 3 kez, ana yemeklerin ilk lokmasıyla birlikte çiğnenmeden yutulacak. (Kandaki fosfor seviyesini düşürmek ve kemik dokusunu korumak)
- Anti-Potasyum granül (Kalsiyum polistiren sülfonat): günde 1 poşet, sabah aç karnına suyla karıştırılarak içilecek. (Kandaki tehlikeli potasyum yüksekliğini kontrol etmek)
- Aranesp (Darbepoetin alfa) 20 mcg: 2 haftada 1 kez, Salı günleri cilt altına uygulanacak. (Böbrek kaynaklı anemiyi tedavi etmek, alyuvar üretimini uyarmak)
- Rocaltrol (Kalsitriol) 0.25 mcg: günde 1 kapsül, akşam tok karnına alınacak. (Böbreklerin üretemediği aktif D vitaminini karşılamak)
- Lasix 40 mg: günde 1 tablet, sabah aç karnına alınacak. (Ödemi ve vücuttaki fazla sıvıyı uzaklaştırmak)

YAŞAM TARZI VE DİYET ÖNERİLERİ:
Potasyum ve Fosfor Kısıtlaması: Muz, kuru kayısı/incir, domates salçası, patates, kuruyemiş, çikolata ve kolalı içecekler kesinlikle kısıtlanacaktır.
Tuz Kısıtlaması: Yemeklere tuz eklenmeyecektir (günlük 2 gr altı tuzsuz diyet).
Sıvı Dengesi: Günlük toplam sıvı alımı 1200 ml (1.2 litre) ile sınırlandırılmalıdır (su, çay, çorba dahil).
İdrar ve Tartı Takibi: Her sabah aç karnına aynı tartı ile tartılınız; idrar miktarında azalma veya 2 günde 1.5 kg artış olursa kliniğe haber veriniz.

DİKKAT EDİLMESİ GEREKEN UYARI BELİRTİLERİ (KIRMIZI BAYRAKLAR):
- İdrar miktarında belirgin azalma veya idrarın tamamen durması (anüri)
- İstirahatte şiddetli nefes darlığı veya göğüste baskı hissi (akciğer ödemi riski)
- Kalpte ritim bozukluğu hissi veya aşırı kas güçsüzlüğü (akut hiperkalemi belirtisi)
- Aşırı bulantı, kusma veya bilinç bulanıklığı

HAYATİ İLAÇ YASAĞI (BÖBREK KORUMA):
Kesinlikle hekiminize danışmadan romatizmal veya antienflamatuar ağrı kesiciler (NSAİİ grubu; ibuprofen, naproksen, apranax, majezik, voltaren vb.) KULLANMAYINIZ. Bu ilaçlar kalan böbrek fonksiyonlarını hızla iflas ettirebilir. Ağrı durumunda sadece hekim onayıyla parasetamol kullanınız.

KONTROL VE RANDEVU:
10 gün sonra Nefroloji Polikliniği'ne üre, kreatinin, potasyum ve GFR kontrol tahlili için başvurunuz.`,

  heart_failure: `KARDİYOLOJİ VE KALP YETERSİZLİĞİ KLİNİĞİ
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: PRT-2026-1042
TARİH: 12.10.2026

KLİNİK TANI:
Düşük Ejeksiyon Fraksiyonlu Kalp Yetmezliği (HFrEF, EF: %30)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Lasix (Furosemid) 40 mg: günde 1 kez, sabah aç karnına alınacak. (Ödem ve sıvı yüklenmesini azaltmak)
- Beloc ZOK (Metoprolol süksinat) 50 mg: günde 1 tablet, sabah tok karnına alınacak. (Kalp hızını ve kan basıncını kontrol etmek)
- Entresto (Sakubitril/Valsartan) 49/51 mg: günde 2 tablet, sabah ve akşam alınacak. (Kalp fonksiyonunu desteklemek ve tansiyonu dengelemek)

YAŞAM TARZI VE DİYET ÖNERİLERİ:
Kilo Takibi: Her sabah uyanınca, idrar yapıldıktan sonra aç karnına aynı tartı ile tartılınız. 3 günde 2 kg veya 1 günde 1 kg artış olursa hekiminize bildiriniz.
Tuz Kısıtlaması: Günlük tuz tüketimi kesinlikle kısıtlanmalıdır (yemeklere tuz eklenmeyecektir).
Sıvı Kısıtlaması: Günlük sıvı alımı 1.5 litre (1500 ml) ile sınırlandırılmalıdır (su, çorba, çay dahil).

DİKKAT EDİLMESİ GEREKEN UYARI BELİRTİLERİ (KIRMIZI BAYRAKLAR):
- İstirahat halinde veya eforla nefes darlığında belirgin artış
- Geceleri nefes darlığı ile uyanma veya düz yatamama
- Bacaklarda ve ayak bileklerinde parmakla basıldığında çukur kalan belirgin şişlik

KONTROL VE RANDEVU:
10 gün sonra Kardiyoloji Polikliniği'ne böbrek fonksiyonları (kreatinin) ve potasyum seviyesi kontrolü için başvurunuz.`,

  diabetes_type2: `ENDOKRİNOLOJİ VE METABOLİZMA KLİNİĞİ
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: PRT-2026-3088
TARİH: 15.10.2026

KLİNİK TANI:
Tip 2 Diabetes Mellitus (HbA1c: %9.4, İnsülin Başlangıcı)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Lantus (İnsülin Glargin) 100 U/ml: günde 1 kez 18 ünite, her gece saat 22:00'de cilt altına yapılacak. (24 saatlik bazal kan şekerini dengelemek)
- Novorapid (İnsülin Aspart): günde 3 kez, ana yemeklerden 10 dakika önce 6'şar ünite cilt altına yapılacak. (Yemek sonrası ani şeker fırlamasını önlemek)
- Glifor (Metformin) 1000 mg: günde 2 kez, sabah ve akşam yemek ortasında alınacak. (İnsülin duyarlılığını artırmak)

YAŞAM TARZI VE DİYET ÖNERİLERİ:
Kan Şekeri Takibi: Sabah aç karnına ve yemeklerden 2 saat sonra tokluk şekerinizi ölçüp günlüğünüze yazınız. Hedef açlık: 80-130 mg/dL, tokluk: <180 mg/dL.
Hipoglisemi Acil Kiti: Yanınızda her zaman 3-4 adet kesme şeker veya meyve suyu bulundurunuz.
Ayak Muayenesi: Her akşam ayaklarınızı kızarıklık, yara, çatlak veya nasır açısından ayna yardımıyla kontrol ediniz.

UYARI BELİRTİLERİ VE HİPOGLİSEMİ KURALI:
- Kan şekeriniz 70 mg/dL altına düşerse veya titreme/soğuk terleme başlarsa 15-15 kuralını uygulayınız (3 kesme şeker yiyip 15 dk sonra tekrar ölçünüz).
- Kan şekeri 400 mg/dL üzeri seyrederse veya ağızda aseton kokusu/kusma olursa derhal acile başvurunuz.

KONTROL:
2 hafta sonra Endokrinoloji Diyabet Polikliniği'ne kan şekeri günlüğünüzle başvurunuz.`,

  copd_respiratory: `GÖĞÜS HASTALIKLARI VE SOLUNUM KLİNİĞİ
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: PRT-2026-4190
TARİH: 14.10.2026

KLİNİK TANI:
KOAH Alevlenmesi (GOLD Evre 3, Şiddetli Hava Yolu Kısıtlılığı)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Foster (Beklometazon/Formoterol) 100/6 mcg: günde 2 kez 2'şer puf, sabah ve akşam solunacak. İlacı çektikten sonra ağzınızı mutlaka bol su ile çalkalayıp tükürünüz.
- Spiriva (Tiotropium) 18 mcg: günde 1 kez, sabah 1 inhalasyon kapsülü cihazla solunacak.
- Ventolin (Salbutamol) inhaler: sadece nefes darlığı atağı olduğunda 2 puf acil solunacak.

YAŞAM TARZI VE DİYET ÖNERİLERİ:
İnhaler Temizliği: Ağızda mantar/pamukçuk oluşmaması için kortizonlu inhaler sonrası suyla gargara yapıp tükürünüz.
Sigara ve Dumandan Uzak Durma: Evde kesinlikle sigara içilmemeli, soba ve kimyasal kokulardan uzak durulmalıdır.
Oksijen Tedavisi: Ev tipi konsantratörü günde 16 saat, 2 L/dakika ayarında kullanınız; ayarı kendi başınıza artırmayınız.

UYARI BELİRTİLERİ:
- İstirahatte nefes darlığının belirgin artması veya konuşurken tıkanma
- Balgam miktarında artış ve rengin sarı/yeşile dönmesi
- Parmak oksimetre değerinin (SpO2) %88 altına düşmesi durumunda derhal acil servise başvurunuz.

KONTROL:
2 hafta sonra Göğüs Hastalıkları Polikliniği'ne solunum fonksiyon testi kontrolü için başvurunuz.`,

  hypertension: `DAHİLİYE VE KARDİYOLOJİ KLİNİĞİ
TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: PRT-2026-5012
TARİH: 18.10.2026

KLİNİK TANI:
Dirençli Esansiyel Hipertansiyon (Evre 2 Hipertansiyon, Hedef Organ Koruması)

TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:
- Co-Diovan 160/12.5 mg: günde 1 tablet, sabah tok karnına alınacak. (Kan basıncını düşürmek ve damarları korumak)
- Norvasc (Amlodipin) 10 mg: günde 1 tablet, akşam tok karnına alınacak. (24 saatlik tansiyon kontrolü sağlamak)
- Delix (Ramipril) 5 mg: günde 1 tablet, sabah alınacak. (Kalp ve böbrek damar yatağını korumak)

YAŞAM TARZI VE DİYET ÖNERİLERİ:
Tansiyon Günlüğü: Her sabah ve akşam dinlenmiş halde tansiyonunuzu ölçüp kaydediniz. Hedef tansiyon: <130/80 mmHg.
DASH Diyeti & Tuzsuz Beslenme: Yemeklere tuz eklenmeyecektir, turşu, şalgam, maden suyu ve işlenmiş etlerden uzak durunuz.
Kilo ve Yürüyüş: Haftada en az 4 gün 30 dakika tempolu düz yol yürüyüşü yapınız.

UYARI BELİRTİLERİ (HİPERTANSİF KRİZ):
- Tansiyon değerinizin 180/120 mmHg üzerine çıkması
- Şiddetli ense ağrısı, görmede bulanıklık, burun kanaması veya göğüs ağrısı durumunda derhal acil servise başvurunuz.

KONTROL:
10 gün sonra Dahiliye/Kardiyoloji Polikliniği'ne tansiyon günlüğünüzle başvurunuz.`,
};

export function HastaPage() {
  const { config } = useHospital();
  const primaryCol = config.primary_color || "#1e5ba3";

  const [step, setStep] = useState<"input" | "plan" | "questions" | "result">("input");
  const [selectedDisease, setSelectedDisease] = useState<string>("kidney_failure");
  const [rawText, setRawText] = useState(SAMPLE_SUMMARIES["kidney_failure"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentCase, setCurrentCase] = useState<CaseResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitAnswersResponse | null>(null);

  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic logged in patient information
  const [patientAuth, setPatientAuth] = useState({
    adSoyad: "Ahmet Yılmaz",
    tcKimlik: "28491823746",
    protokolNo: "PRT-2026-1042",
  });

  const [patientHistory, setPatientHistory] = useState<PatientHistoryCaseItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Read session on mount & fetch patient history
  useEffect(() => {
    const stored = sessionStorage.getItem("hasta_auth");
    let currentAuth = patientAuth;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        currentAuth = {
          adSoyad: parsed.adSoyad || "Ahmet Yılmaz",
          tcKimlik: parsed.tcKimlik || "28491823746",
          protokolNo: parsed.protokolNo || "PRT-2026-1042",
        };
        setPatientAuth(currentAuth);
      } catch (e) {
        // fallback
      }
    }

    // Load past discharge cases for this patient
    setHistoryLoading(true);
    getPatientHistory(currentAuth.protokolNo)
      .then((data) => {
        if (data?.cases) {
          setPatientHistory(data.cases);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleSelectDisease = (diseaseId: string) => {
    setSelectedDisease(diseaseId);
    if (SAMPLE_SUMMARIES[diseaseId]) {
      setRawText(SAMPLE_SUMMARIES[diseaseId]);
    }
  };

  const handleLoadHistoryCase = async (caseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}`);
      if (!res.ok) throw new Error("Kayıtlı taburculuk planı yüklenemedi.");
      const caseData: CaseResponse = await res.json();
      setCurrentCase(caseData);
      setSelectedDisease(caseData.disease);
      setStep("plan");
    } catch (err: any) {
      setError(err.message || "Önceki plan alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCase = async (textToProcess: string) => {
    if (!textToProcess.trim()) {
      setError("Lütfen bir taburculuk metni girin veya hazır örneği yükleyin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const caseRes = await createCase(textToProcess, selectedDisease);
      setCurrentCase(caseRes);
      setStep("plan");
    } catch (err: any) {
      setError(err.message || "Epikriz işlenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
    });
    setUploadingFile(true);
    setError(null);

    try {
      const caseRes = await uploadCaseDocument(file, selectedDisease);
      setCurrentCase(caseRes);
      setRawText(caseRes.raw_text);
      setStep("plan");
    } catch (err: any) {
      setError(err.message || "Belge incelenirken bir hata oluştu.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStartQuestions = async () => {
    if (!currentCase) return;
    setLoading(true);
    setError(null);
    try {
      const qRes = await getCaseQuestions(currentCase.id);
      setQuestions(qRes.questions);
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

  const maskedTc =
    patientAuth.tcKimlik.length === 11
      ? `${patientAuth.tcKimlik.slice(0, 3)}*****${patientAuth.tcKimlik.slice(8)}`
      : patientAuth.tcKimlik;

  const currentDiseaseInfo =
    DISEASE_OPTIONS.find((d) => d.id === (currentCase ? currentCase.disease : selectedDisease)) ||
    DISEASE_OPTIONS[0];

  const isKidney = (currentCase?.disease || selectedDisease) === "kidney_failure";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Clinical Patient Header with DYNAMIC Hospital Name */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: primaryCol }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  {config.hospital_name || "Hasta Taburculuk Masası"}
                </h1>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                  style={{
                    backgroundColor: `${primaryCol}15`,
                    color: primaryCol,
                    borderColor: `${primaryCol}30`,
                  }}
                >
                  Hasta Portalı
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hasta: <strong className="text-slate-800">{patientAuth.adSoyad}</strong> • Protokol No:{" "}
                <strong className="text-slate-800 font-mono">{patientAuth.protokolNo}</strong> • T.C.:{" "}
                <span className="font-mono">{maskedTc}</span>
              </p>
            </div>
          </div>

          {config.emergency_phone && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 self-start sm:self-auto flex items-center gap-1.5">
              <Phone size={13} className="text-rose-600" />
              <span>{config.emergency_phone}</span>
            </div>
          )}
        </div>

        {/* Patient Previous Discharge Records Drawer / Banner */}
        {patientHistory.length > 0 && step === "input" && !currentCase && (
          <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-blue-950 uppercase tracking-wider">
                <History size={16} className={`text-[#1e5ba3] ${historyLoading ? "animate-spin" : ""}`} />
                <span>Geçmiş Taburculuk Kayıtlarınız ({historyLoading ? "..." : patientHistory.length})</span>
              </div>
              <span className="text-[11px] text-blue-700 font-bold">
                Tıklayarak önceki tedavi planınızı anında görüntüleyin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {patientHistory.map((hist) => (
                <div
                  key={hist.case_id}
                  onClick={() => handleLoadHistoryCase(hist.case_id)}
                  className="p-3.5 rounded-2xl bg-white border border-blue-100 hover:border-blue-400 text-left transition cursor-pointer shadow-2xs hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{hist.disease === "kidney_failure" ? "🫘" : "❤️"}</span>
                      <span>{hist.disease_name}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(hist.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  {hist.diagnosis_text && (
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{hist.diagnosis_text}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-[#1e5ba3]">Planı İncele →</span>
                    {hist.risk_level && (
                      <span className="uppercase text-slate-500">{hist.risk_level} Risk (%{hist.overall_score})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 card-shadow">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold ${
                step === "input" ? "text-white shadow-xs" : "text-slate-500 bg-slate-50"
              }`}
              style={step === "input" ? { backgroundColor: primaryCol } : {}}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span className="hidden sm:inline">Hastalık & Epikriz</span>
            </div>
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold ${
                step === "plan" ? "text-white shadow-xs" : "text-slate-500 bg-slate-50"
              }`}
              style={step === "plan" ? { backgroundColor: primaryCol } : {}}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span className="hidden sm:inline">Sade Plan</span>
            </div>
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold ${
                step === "questions" ? "text-white shadow-xs" : "text-slate-500 bg-slate-50"
              }`}
              style={step === "questions" ? { backgroundColor: primaryCol } : {}}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span className="hidden sm:inline">Teach-Back</span>
            </div>
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold ${
                step === "result" ? "text-white shadow-xs" : "text-slate-500 bg-slate-50"
              }`}
              style={step === "result" ? { backgroundColor: primaryCol } : {}}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
              <span className="hidden sm:inline">Sonuç Raporu</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* ── STEP 1: INPUT & UPLOAD ────────────────────────────────────────────── */}
        {step === "input" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 card-shadow">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                Taburculuk Belgesi (Epikriz) ve Hastalık Seçimi
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Yapay zekanın taburcu olduğunuz hastalığa özel (böbrek yetmezliği, kalp yetmezliği, diyabet vb.)
                talimat ve sorular üretmesi için hastalığınızı seçiniz.
              </p>
            </div>

            {/* Disease Selector Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Taburcu Olunan Klinik / Hastalık Seçimi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DISEASE_OPTIONS.map((dis) => {
                  const isSelected = selectedDisease === dis.id;
                  return (
                    <button
                      key={dis.id}
                      type="button"
                      onClick={() => handleSelectDisease(dis.id)}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{dis.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">{dis.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">{dis.specialty}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-7 text-center cursor-pointer transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div
                  className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: primaryCol }}
                >
                  <Upload size={22} />
                </div>
                {uploadingFile ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#1e5ba3] animate-pulse">
                      Yapay Zeka Belgeyi ({currentDiseaseInfo.badge}) İnceliyor...
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Metin ve klinik değerler taranıyor, lütfen bekleyiniz.
                    </p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
                      <FileCheck size={16} className="text-emerald-600" />
                      {selectedFile.name} ({selectedFile.size})
                    </span>
                    <p className="text-[11px] text-emerald-600 font-bold">✓ Belge yüklendi.</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-[#0e2038]">
                      {currentDiseaseInfo.badge} Epikriz Belgesi PDF'ini veya Fotoğrafını Yükleyin
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      PDF, JPG, PNG formatları desteklenir • Çok modlu yapay zeka anında analiz eder
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demo button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const sample = SAMPLE_SUMMARIES[selectedDisease] || SAMPLE_SUMMARIES["kidney_failure"];
                  setRawText(sample);
                  handleProcessCase(sample);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                style={{ backgroundColor: primaryCol }}
              >
                <Sparkles size={14} />
                <span>Hazır {currentDiseaseInfo.name} Örneğini Yükle ve Başlat</span>
              </button>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_SUMMARIES[selectedDisease] || "")}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
              >
                Metin Alanına Yapıştır
              </button>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Epikriz Metin İçeriği ({currentDiseaseInfo.badge})
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedDisease === "kidney_failure" ? "Örnek: Evre 4 KBY / GFR / Renagel" : "Klinik epikriz"}
                </span>
              </div>
              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Taburculuk metnini buraya yapıştırınız..."
                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden text-xs font-mono text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleProcessCase(rawText)}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: config.accent_color || "#d92d20" }}
              >
                {loading ? (
                  <span>Plan Sadeleştiriliyor ({currentDiseaseInfo.badge})...</span>
                ) : (
                  <>
                    <span>Hastalığa Göre Planı Çıkar ve İlerle</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SIMPLIFIED PLAN ────────────────────────────────────────────── */}
        {step === "plan" && currentCase && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 card-shadow">
            {/* Hospital Header on Discharge Document */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 font-bold text-slate-800">
                <Building2 size={16} className="text-[#1e5ba3]" />
                <span>{config.hospital_name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{currentDiseaseInfo.specialty}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Protokol: {patientAuth.protokolNo} • Tarih: {new Date(currentCase.created_at).toLocaleDateString("tr-TR")}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full border uppercase inline-flex items-center gap-1.5 ${currentDiseaseInfo.color}`}
              >
                <span>{currentDiseaseInfo.icon}</span>
                <span>{currentDiseaseInfo.name}</span>
              </span>

              <h2 className="text-2xl font-black text-slate-900 mt-2.5">
                {currentCase.discharge_info.diagnosis_text}
              </h2>

              <p className="text-slate-500 text-xs mt-1.5">
                {config.custom_disclaimer}
              </p>
            </div>

            {/* Special Highlight for Kidney Failure */}
            {isKidney && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center gap-1.5 font-black text-amber-900 uppercase tracking-wider text-[11px]">
                  <span>🫘</span>
                  <span>Kronik Böbrek Yetmezliği Klinik Rehberi</span>
                </div>
                <p className="font-medium leading-relaxed">
                  Fosfat bağlayıcı ilaçlarınızı yemeklerin ilk lokmasıyla alınız. Potasyumdan zengin (muz, patates, kuru meyve vb.)
                  gıdalardan kaçınınız ve hekiminize danışmadan romatizmal ağrı kesici (NSAİİ) kesinlikle almayınız.
                </p>
              </div>
            )}

            {/* Daily Schedule Slots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity size={18} style={{ color: primaryCol }} />
                  Günlük İlaç Kullanım Zaman Çizelgesi
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Hastalığa Özel Sadeleştirilmiş</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentCase.simplified_plan.daily_schedule.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 hover:border-blue-200 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{med.name}</div>
                        {med.purpose && (
                          <div className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                            {med.purpose}
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-[#1e5ba3] font-bold px-2 py-0.5 rounded-md shrink-0">
                        {med.dose_text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5 text-xs font-bold text-[#1e5ba3]">
                      <Clock size={13} />
                      <span>{med.timing_text || med.slots.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Routine Tasks & Lab Follow-up */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-extrabold text-slate-900">Günlük Rutin & Takip Planı</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentCase.simplified_plan.daily_routine.map((task, idx) => {
                  const isLab = task.toLowerCase().includes("laboratuvar");
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl text-xs space-y-1.5 border ${
                        isLab
                          ? "bg-blue-50/80 border-blue-200 text-blue-950"
                          : "bg-amber-50/70 border-amber-200 text-slate-800"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{isLab ? "🧪" : "📋"}</span>
                        <span>{isLab ? "Kontrol & Kan Tahlili" : `Rutin Talimat ${idx + 1}`}</span>
                      </div>
                      <p className="leading-relaxed font-medium">{task}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Signs & Safety Alert */}
            <div className="space-y-3">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d92d20] flex items-center gap-1.5">
                  <AlertTriangle size={16} />
                  Dikkat Edilmesi Gereken Belirtiler (Kırmızı Bayraklar)
                </h4>
                <div className="space-y-1.5">
                  {currentCase.simplified_plan.warning_signs.map((sign, idx) => {
                    const isNsaid = sign.includes("YASAKLI İLAÇ UYARISI");
                    if (isNsaid) {
                      return (
                        <div
                          key={idx}
                          className="mt-3 p-3.5 rounded-xl bg-red-100/90 border border-red-300 text-red-950 font-bold text-xs space-y-1"
                        >
                          <div className="flex items-center gap-1.5 text-red-700 uppercase tracking-wider text-[11px]">
                            <ShieldAlert size={15} />
                            <span>Böbrek & Sağlık Koruma İlaç Yasağı</span>
                          </div>
                          <p className="font-medium text-slate-800 leading-relaxed">
                            {sign.replace("YASAKLI İLAÇ UYARISI: ", "")}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="text-xs text-rose-950 flex items-start gap-2 font-medium">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{sign}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={handleStartQuestions}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                style={{ backgroundColor: config.accent_color || "#d92d20" }}
              >
                {loading ? (
                  <span>Sorular Yükleniyor...</span>
                ) : (
                  <>
                    <span>{currentDiseaseInfo.badge} Sorularına Geç (Teach-Back)</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: QUESTIONS (TEACH-BACK) ────────────────────────────────────── */}
        {step === "questions" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 card-shadow">
            <div className="border-b border-slate-100 pb-4">
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full border uppercase inline-flex items-center gap-1.5 ${currentDiseaseInfo.color}`}
              >
                <span>{currentDiseaseInfo.icon}</span>
                <span>{currentDiseaseInfo.name} • Teach-Back</span>
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Talimatları Anlama Kontrolü
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Yapay zeka asistanı, taburculuk tedavinizi ne kadar anladığınızı ölçmek için sorular hazırladı.
                Lütfen soruları kendi cümlelerinizle yanıtlayınız.
              </p>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: primaryCol }}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {q.text}
                    </h3>
                  </div>

                  <textarea
                    rows={3}
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="Kendi cümlelerinizle yanıtlayınız (örneğin: her sabah aç karnına tartılmalıyım)..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden text-slate-800"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitAnswers}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                style={{ backgroundColor: config.accent_color || "#d92d20" }}
              >
                {loading ? (
                  <span>Değerlendiriliyor...</span>
                ) : (
                  <>
                    <span>Cevapları Gönder ve Değerlendir</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: RESULT & RISK REPORT ──────────────────────────────────────── */}
        {step === "result" && result && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 card-shadow">
            <div className="text-center space-y-2 border-b border-slate-100 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Değerlendirme Tamamlandı
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cevaplarınız puanlanmış ve {config.hospital_name} klinik ekibinin takip paneline aktarılmıştır.
              </p>
            </div>

            {/* Emergency alert if triggered */}
            {result.emergency_triggered && (
              <div className="p-5 rounded-2xl bg-red-100 border border-red-300 text-red-950 font-bold text-xs space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-red-700 text-sm font-black">
                  <AlertTriangle size={18} />
                  <span>ACİL TIBBİ UYARI</span>
                </div>
                <p className="font-medium text-slate-900 leading-relaxed">
                  {result.emergency_message}
                </p>
              </div>
            )}

            {/* Score Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Genel Anlaşılma Skoru</span>
                <div className="text-4xl font-black text-slate-900">{result.risk_report.overall_score} / 100</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Klinik Risk Düzeyi</span>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                    result.risk_report.level === "high"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : result.risk_report.level === "medium"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {result.risk_report.level} Risk
                </span>
              </div>
            </div>

            {result.risk_report.suggested_staff_action && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-800">
                <strong className="text-[#1e5ba3]">Klinik Aksiyon Notu:</strong>{" "}
                {result.risk_report.suggested_staff_action}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-6 py-3 bg-[#0e2038] hover:bg-[#1b3558] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Yeni Epikriz Test Et
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
