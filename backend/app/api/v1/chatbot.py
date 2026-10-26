"""Clinical FAQ and Assistant Chatbot Router.

Provides categorized clinical Q&A and intelligent query matching
for Kidney Failure, Heart Failure, Diabetes, COPD, Emergency Red Flags,
and Hospital TaburcuAI operational guides.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

from app.core.llm import get_llm_client

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class FAQItem(BaseModel):
    id: str
    category: str
    category_title: str
    disease_id: Optional[str] = None
    question: str
    answer: str
    warning_level: str = Field(default="info", description="info, warning, danger")
    tags: List[str] = Field(default_factory=list)
    action_link: Optional[str] = None
    action_text: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    disease: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    answer: str
    matched_faq_id: Optional[str] = None
    warning_level: str = "info"
    category: Optional[str] = None
    emergency_detected: bool = False
    suggested_questions: List[str] = Field(default_factory=list)
    action_link: Optional[str] = None
    action_text: Optional[str] = None


# Comprehensive Structured Clinical Knowledge Base
CLINICAL_FAQ_DATABASE: List[FAQItem] = [
    # ── KRONİK BÖBREK YETMEZLİĞİ (KBY) ──────────────────────────────────
    FAQItem(
        id="kby-nsaid-warning",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Böbrek hastasıyım, başım veya dişim ağrırsa hangi ağrı kesicileri kullanabilirim? (NSAİİ Yasağı)",
        answer="⚠️ KESİNLİKLE DİKKAT: Kronik böbrek yetmezliği olan hastalar romatizmal ağrı kesicileri (NSAİİ grubu: Majezik, Apranax, Voltaren, Diklofenak, İbuprofen vb.) KESİNLİKLE KULLANMAMALIDIR! Bu ilaçlar böbrek kan akımını keserek akut böbrek yetmezliğine ve acil diyaliz ihtiyacına sebep olabilir. Ağrı durumunda hekiminize danışarak yalnızca kontrollü dozda Parasetamol (Parol vb.) tercih edilmelidir.",
        warning_level="danger",
        tags=["ağrı kesici", "nsaii", "parol", "majezik", "apranax", "voltaren", "diklofenak", "böbrek"],
        action_link="/hasta",
        action_text="Hasta Planına Git"
    ),
    FAQItem(
        id="kby-phosphate-binder",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Fosfat bağlayıcı ilaçlarımı (Renagel, Sevelamer vb.) ne zaman ve nasıl almalıyım?",
        answer="Fosfat bağlayıcı ilaçlar (Renagel, Fosrenol, Kalsiyum Asetat vb.) mutlaka YEMEKLERİN TAM İLK LOKMASIYLA birlikte alınmalıdır. Aç karnına veya yemekten saatler sonra içilirse besindeki fosfatı bağlayamaz ve hiçbir fayda sağlamaz. Eğer o öğünde yemek yemediyseniz ilacı da almayınız.",
        warning_level="warning",
        tags=["fosfat", "renagel", "sevelamer", "fosrenol", "yemek", "ilaç zamanı"],
    ),
    FAQItem(
        id="kby-potassium-diet",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Potasyum kısıtlaması nedir? Hangi yiyeceklerden uzak durmalıyım?",
        answer="Böbrekler fazla potasyumu atamadığında kanda potasyum birikir (Hiperkalemi) ve bu durum ani, ölümcül kalp durmasına yol açabilir. ❌ Kısıtlanması gerekenler: Muz, patates, kavun, kuru kayısı/incir, domates salçası, çikolata, kuruyemiş ve maden suları. Sebzeleri haşlayıp ilk suyunu dökerek pişirmek potasyum miktarını azaltır.",
        warning_level="danger",
        tags=["potasyum", "muz", "patates", "diyet", "hiperkalemi", "beslenme"],
    ),
    FAQItem(
        id="kby-fluid-intake",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Günde ne kadar su ve sıvı tüketmeliyim? (Sıvı Dengesi)",
        answer="İleri evre böbrek yetmezliği ve diyaliz hastalarında genel kural: 'Günlük çıkarılan idrar miktarı + 500 ml' kadardır. Fazla sıvı akciğerde su toplanmasına (akciğer ödemi) ve nefes darlığına neden olur. Çorba, çay, karpuz gibi sulu gıdaların da sıvı hesabına dahil olduğunu unutmayınız.",
        warning_level="warning",
        tags=["sıvı", "su", "ödem", "idrar", "kısıtlama"],
    ),
    FAQItem(
        id="kby-dry-weight",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Diyaliz hastalarında 'Hedef Kuru Kilo' ne anlama gelir?",
        answer="Kuru kilo; vücudunuzda tansiyonu yükseltecek veya nefes darlığı yapacak fazla su ve ödem bulunmadığı andaki gerçek kilonuzdur. İki diyaliz seansı arasında 1.5 - 2 kg'dan fazla kilo almamaya özen göstermelisiniz.",
        warning_level="info",
        tags=["kuru kilo", "diyaliz", "ödem", "tartı"],
    ),
    FAQItem(
        id="kby-fistula-care",
        category="kidney_failure",
        category_title="🫘 Kronik Böbrek Yetmezliği",
        disease_id="kidney_failure",
        question="Diyaliz fistülü bulunan kolumda nelere dikkat etmeliyim?",
        answer="Fistüllü koldan kesinlikle tansiyon ölçülmemeli, kan alınmamalı ve damar yolu açılmamalıdır. O kolla ağır yük taşınmamalı, sıkı saat/bileklik takılmamalı ve üzerine yatılmamalıdır. Fistüldeki titreşimi (thrill) günde bir kez elinizle kontrol ediniz.",
        warning_level="warning",
        tags=["fistül", "diyaliz", "kol", "tansiyon", "damar"],
    ),

    # ── KALP YETMEZLİĞİ (KY) ─────────────────────────────────────────────
    FAQItem(
        id="ky-gdmt-pillars",
        category="heart_failure",
        category_title="❤️ Kalp Yetmezliği",
        disease_id="heart_failure",
        question="ESC 4'lü Kılavuz (GDMT) İlaç Tedavisi nedir ve neden hayati önem taşır?",
        answer="Avrupa Kardiyoloji Derneği (ESC) kılavuzlarına göre kalp yetmezliğinde kalbi güçlendiren ve ölüm riskini %50'den fazla azaltan 4 temel ilaç sütunu vardır: 1) ARNI/ACEi (Entresto, Ramipril vb.), 2) Beta Bloker (Beloc ZOK, Dilatrend vb.), 3) MRA (Spironolakton/Aldactone vb.), 4) SGLT2 İnhibitörü (Forxiga, Jardiance vb.). Bu ilaçlar tansiyon düşse bile doktor kontrolünde bırakılmamalıdır.",
        warning_level="info",
        tags=["gdmt", "kılavuz", "entresto", "forxiga", "beloc", "aldactone", "kalp"],
    ),
    FAQItem(
        id="ky-daily-weight",
        category="heart_failure",
        category_title="❤️ Kalp Yetmezliği",
        disease_id="heart_failure",
        question="Her gün aynı saatte tartılmak neden zorunludur?",
        answer="Kalp yetersizliğinde kalbin pompa gücü azalınca vücut su ve tuz tutar. Her sabah aç karnına, tuvalete çıktıktan sonra tartılmalısınız. 2-3 günde 1.5 - 2 kg ve üzeri ani kilo artışı yağ değil, vücutta biriken sıvıdır (akciğer ödemi riski) ve acilen hekime haber verilmelidir.",
        warning_level="warning",
        tags=["tartı", "kilo", "ödem", "sıvı", "alevlenme"],
    ),
    FAQItem(
        id="ky-salt-restriction",
        category="heart_failure",
        category_title="❤️ Kalp Yetmezliği",
        disease_id="heart_failure",
        question="Kalp yetmezliğinde günlük ne kadar tuz tüketilebilir?",
        answer="Günlük tuz tüketimi 2 - 3 gramı (silme bir çay kaşığı) geçmemelidir. Sofradan tuzluk kaldırılmalı, salça, turşu, şalgam, salamura zeytin, bulyon ve maden sularından kaçınılmalıdır.",
        warning_level="info",
        tags=["tuz", "sodyum", "turşu", "tansiyon"],
    ),
    FAQItem(
        id="ky-shortness-of-breath",
        category="heart_failure",
        category_title="❤️ Kalp Yetmezliği",
        disease_id="heart_failure",
        question="Geceleri nefes darlığı ile uyanırsam veya yastık sayımı artırmam gerekirse ne yapmalıyım?",
        answer="Geceleri boğulma hissiyle uyanmak (Paroksismal Noktürnal Dispne) veya düz yatamayıp 2-3 yastıkla uyumak (Ortopne), kalbin akciğere sıvı göllendirdiğini gösterir. Bu durumda derhal dik pozisyona geçilmeli ve vakit kaybetmeden en yakın acil servise başvurulmalıdır.",
        warning_level="danger",
        tags=["nefes darlığı", "yastık", "ortopne", "gece", "dispne", "acil"],
        action_link="tel:112",
        action_text="112 Acil Servis"
    ),

    # ── TİP 2 DİYABET ────────────────────────────────────────────────────
    FAQItem(
        id="dm-15-15-rule",
        category="diabetes_type2",
        category_title="🩺 Tip 2 Diyabet",
        disease_id="diabetes_type2",
        question="Kan şekerim 70'in altına düşerse (Hipoglisemi) ne yapmalıyım? (15-15 Kuralı)",
        answer="Kan şekeriniz 70 mg/dL altına düşerse veya titreme/soğuk terleme başlarsa '15-15 Kuralı'nı uygulayınız: Hemen 15 gram hızlı karbonhidrat (3-4 adet kesme şeker veya yarım bardak meyve suyu) içiniz. Çikolata veya yağlı gıda yemeyiniz (yağ emilimi geciktirir). 15 dakika bekleyip şekerinizi yeniden ölçünüz. Hâlâ 70 altındaysa işlemi tekrarlayınız.",
        warning_level="danger",
        tags=["hipoglisemi", "15-15", "şeker düşmesi", "kesme şeker", "terleme", "titreme"],
    ),
    FAQItem(
        id="dm-insulin-storage",
        category="diabetes_type2",
        category_title="🩺 Tip 2 Diyabet",
        disease_id="diabetes_type2",
        question="Açılmış insülin kalemini buzdolabına koymalı mıyım?",
        answer="❌ HAYIR: Kullanılmakta olan açılmış insülin kalemi ODA SICAKLIĞINDA (25°C altında) 28 güne kadar saklanmalıdır. Soğuk insülin enjekte edilirse ağrı yapar ve emilimi bozulur. Yalnızca henüz açılmamış yedek insülinler buzdolabında (2-8°C, raf kapaklarında) tutulmalıdır.",
        warning_level="warning",
        tags=["insülin", "saklama", "oda sıcaklığı", "buzdolabı", "kalem"],
    ),
    FAQItem(
        id="dm-foot-care",
        category="diabetes_type2",
        category_title="🩺 Tip 2 Diyabet",
        disease_id="diabetes_type2",
        question="Diyabetik ayak bakımı nasıl yapılmalıdır?",
        answer="Diyabette his kaybı (nöropati) olabileceğinden yaralar fark edilmeyebilir. Her gün ayaklarınızı ve parmak aralarınızı ılık suyla yıkayıp iyice kurulayınız. Ayna yardımıyla tabanında kızarıklık, su toplaması veya yara var mı kontrol ediniz. Asla çıplak ayakla yere basmayınız ve tırnaklarınızı düz kesiniz.",
        warning_level="info",
        tags=["ayak", "yara", "tırnak", "hissizlik", "diyabetik ayak"],
    ),

    # ── KOAH & SOLUNUM ───────────────────────────────────────────────────
    FAQItem(
        id="copd-mouth-rinse",
        category="copd_respiratory",
        category_title="🫁 KOAH & Solunum",
        disease_id="copd_respiratory",
        question="Kortizon içeren inhaler (fısfıs) kullandıktan sonra ne yapmalıyım?",
        answer="Kortizonlu fısfıs veya toz cihazı kullandıktan hemen sonra ağzınızı MUTLAKA bol su ile gargara yapıp tükürmelisiniz (suyu yutmayınız). Bu uygulama ağız içinde mantar (pamukçuk) oluşmasını ve ses kısıklığını engeller.",
        warning_level="warning",
        tags=["inhaler", "fısfıs", "gargara", "pamukçuk", "ağız", "ses kısıklığı"],
    ),
    FAQItem(
        id="copd-oxygen-flow",
        category="copd_respiratory",
        category_title="🫁 KOAH & Solunum",
        disease_id="copd_respiratory",
        question="Evde oksijen konsantratörü cihazını kendi isteğime göre artırabilir miyim?",
        answer="❌ KESİNLİKLE HAYIR: KOAH hastalarında yüksek akımlı oksijen kandaki karbondioksit gazının atılamayıp birikmesine (karbondioksit narkozu/koma) neden olabilir. Oksijen cihazı yalnızca hekiminizin reçete ettiği debide (genellikle 1-2 Litre/dakika) kullanılmalıdır.",
        warning_level="danger",
        tags=["oksijen", "konsantratör", "litre", "koma", "karbondioksit"],
    ),

    # ── ACİL DURUMLAR & KIRMIZI BAYRAKLAR ────────────────────────────────
    FAQItem(
        id="emergency-red-flags",
        category="emergency",
        category_title="🚨 Acil Durumlar & Kırmızı Bayrak",
        question="Hangi belirtilerde vakit kaybetmeden 112 Acil Servis aranmalıdır?",
        answer="Aşağıdaki durumlarda ASLA beklemeyiniz, derhal 112 Acil Servis'i arayınız:\n1) Göğüste baskı, sıkışma veya sol kola/çeneye yayılan ağrı,\n2) İstirahat halinde ani başlayan şiddetli nefes darlığı,\n3) Dudaklarda, yüzde veya tırnaklarda morarma,\n4) Bayılma, şuur bulanıklığı veya konuşma bozukluğu,\n5) Katran rengi siyah veya kanlı dışkılama,\n6) 12 saat boyunca hiç idrara çıkamama,\n7) Kan şekerinin 50 mg/dL altına düşmesi ve bilincin kapanması.",
        warning_level="danger",
        tags=["acil", "112", "kırmızı bayrak", "göğüs ağrısı", "bayılma", "morarma"],
        action_link="tel:112",
        action_text="112 Acil Servis'i Ara"
    ),

    # ── SİSTEM & TABURCUAI REHBERİ ───────────────────────────────────────
    FAQItem(
        id="system-teach-back",
        category="system",
        category_title="📋 TaburcuAI Sistemi & Rehber",
        question="Teach-Back yöntemi nedir ve sistem hastaya neden soru soruyor?",
        answer="Teach-Back; sağlık personelinin anlattığı tedavi bilgilerinin hasta tarafından doğru anlaşılıp anlaşılmadığını ölçen altın standart tıp yöntemidir. TaburcuAI, taburculuk sonrası kriz anında hastanın doğru davranıp davranmayacağını senaryo sorularıyla test eder; eksik veya riskli yanıtları anında doktor ve hemşire paneline 'Kırmızı Bayrak' olarak iletir.",
        warning_level="info",
        tags=["teach-back", "nedir", "soru", "sistem", "yapay zeka"],
    ),
    FAQItem(
        id="system-hospital-customization",
        category="system",
        category_title="📋 TaburcuAI Sistemi & Rehber",
        question="Hastanemizin adını, logosunu, temasını ve acil numarasını nasıl değiştirebilirim?",
        answer="Yönetici veya hekim yetkisiyle 'Personel Risk Paneli'ne giderek 'Hastane & Kurumsal Kimlik' sekmesine tıklayınız. Buradan hastane adını, logo ikonunu, kurumsal renk paletini ve acil telefonunu tek tıkla özelleştirebilir veya hazır temalardan birini seçebilirsiniz.",
        warning_level="info",
        tags=["özelleştirme", "hastane adı", "logo", "tema", "renk", "yönetim"],
        action_link="/personel?tab=settings",
        action_text="Hastane Ayarlarına Git"
    ),
    FAQItem(
        id="system-past-records",
        category="system",
        category_title="📋 TaburcuAI Sistemi & Rehber",
        question="Hastanın önceki taburculuk epikrizleri ve geçmiş hastalık kayıtları nerede görülür?",
        answer="Hem Hasta Portalı'nda hem de Personel Paneli'ndeki 'Hasta Kayıt & Geçmiş' sekmesinde protokol numarası veya T.C. kimlik numarası ile arama yaparak hastanın daha önce hangi hastalıktan taburcu olduğunu, geçmiş tedavi planlarını ve teach-back skorlarını tek tıkla inceleyebilirsiniz.",
        warning_level="info",
        tags=["geçmiş", "arşiv", "önceki epikriz", "protokol"],
        action_link="/personel?tab=patients",
        action_text="Hasta Kayıtlarını Gör"
    ),
]


EMERGENCY_KEYWORDS = [
    "göğüs ağrısı", "kalp krizi", "sol kolum uyuşuyor", "nefes alamıyorum", "boğuluyorum",
    "morarma", "bayıldım", "şuur kaybı", "kan kusma", "siyah dışkı", "idrarım tamamen durdu",
    "hiç idrar yapamıyorum", "112", "ölüyorum", "aşırı nefes darlığı"
]


@router.get("/faq", response_model=List[FAQItem])
def get_faq_items(
    category: Optional[str] = Query(None, description="Filter by category (kidney_failure, heart_failure, diabetes_type2, copd_respiratory, emergency, system)"),
    search: Optional[str] = Query(None, description="Search term in questions, answers or tags")
):
    """Retrieve categorized clinical and platform FAQ items."""
    results = CLINICAL_FAQ_DATABASE
    if category and category != "all":
        results = [f for f in results if f.category == category or f.disease_id == category]
    
    if search:
        s = search.lower().strip()
        results = [
            f for f in results
            if s in f.question.lower() or s in f.answer.lower() or any(s in t.lower() for t in f.tags)
        ]
    return results


@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(payload: ChatRequest):
    """Ask a question to the clinical assistant chatbot.
    
    Matches against validated clinical FAQ database and clinical safety rules.
    If an emergency keyword is detected, immediately flags emergency triage.
    """
    raw_query = payload.query.strip()
    lower_query = raw_query.lower()

    # 1. Emergency detection
    is_emergency = any(kw in lower_query for kw in EMERGENCY_KEYWORDS)
    if is_emergency:
        return ChatResponse(
            answer=(
                "🚨 **DİKKAT: ACİL TIBBİ DURUM BELİRTİSİ SAPTANDI!**\n\n"
                "Belirttiğiniz semptomlar (şiddetli nefes darlığı, göğüs ağrısı, morarma veya şuur bulanıklığı) "
                "hayatı tehdit eden acil bir tabloyu işaret edebilir.\n\n"
                "Lütfen VAKİT KAYBETMEDEN **112 Acil Servis**'i arayınız veya en yakın acil servise başvurunuz."
            ),
            matched_faq_id="emergency-red-flags",
            warning_level="danger",
            category="emergency",
            emergency_detected=True,
            suggested_questions=[
                "Ne zaman hemen 112 aranmalıdır?",
                "Kalp yetmezliğinde acil nefes darlığı belirtileri nelerdir?",
                "Böbrek yetmezliğinde acil durum belirtileri nelerdir?"
            ],
            action_link="tel:112",
            action_text="112 Acil Çağrı Başlat"
        )

    # 2. Score match against knowledge base
    best_match: Optional[FAQItem] = None
    best_score = 0

    query_tokens = set(lower_query.replace("?", "").replace(",", "").replace(".", "").split())

    for item in CLINICAL_FAQ_DATABASE:
        score = 0
        # Check tag matches
        for tag in item.tags:
            if tag in lower_query:
                score += 5
            elif any(tok in tag for tok in query_tokens):
                score += 2

        # Check question matches
        question_lower = item.question.lower()
        if lower_query in question_lower or question_lower in lower_query:
            score += 15

        for tok in query_tokens:
            if len(tok) >= 3 and tok in question_lower:
                score += 3
            if len(tok) >= 4 and tok in item.answer.lower():
                score += 1

        # Disease match bonus
        if payload.disease and item.disease_id == payload.disease:
            score += 4

        if score > best_score:
            best_score = score
            best_match = item

    # If good match found (threshold >= 6)
    if best_match and best_score >= 6:
        # Related questions from same category
        related = [
            f.question for f in CLINICAL_FAQ_DATABASE
            if f.category == best_match.category and f.id != best_match.id
        ][:3]

        return ChatResponse(
            answer=best_match.answer,
            matched_faq_id=best_match.id,
            warning_level=best_match.warning_level,
            category=best_match.category,
            emergency_detected=best_match.warning_level == "danger",
            suggested_questions=related,
            action_link=best_match.action_link,
            action_text=best_match.action_text,
        )

    # 3. Intelligent fallback generator with clinical disclaimer
    llm_client = get_llm_client()
    try:
        system_prompt = (
            "Sen TaburcuAI Akıllı Klinik Asistanısın. Hastane taburculuk sonrası hasta ve personel sorularını yanıtlarsın. "
            "Özellikle Kronik Böbrek Yetmezliği (KBY), Kalp Yetmezliği, Tip 2 Diyabet ve KOAH konularında uzmansın. "
            "Kural 1: Böbrek yetmezliğinde NSAİİ (romatizma ağrı kesici) kesinlikle yasaktır.\n"
            "Kural 2: Fosfat bağlayıcılar yemeklerin ilk lokmasıyla alınmalıdır.\n"
            "Kural 3: Diyabette şeker 70 altına inerse 15-15 kuralı uygulanır.\n"
            "Kural 4: Yanıtların net, şefkatli, tıbbi açıdan güvenli ve sade Türkçe olmalıdır. "
            "Kural 5: Mutlaka hastaya hekimine veya servis hemşiresine danışması gerektiğini hatırlat."
        )
        llm_response = await llm_client.generate_text(
            prompt=f"Kullanıcı Sorusu: {raw_query}\nHastanın Hastalığı: {payload.disease or 'Genel'}\n\nLütfen anlaşılır ve güvenli bir klinik yanıt ver.",
            system_instruction=system_prompt,
            temperature=0.2
        )
        answer_text = llm_response.strip()
    except Exception:
        answer_text = (
            f"Sorunuzla ilgili klinik kayıtlarımız incelendi: '{raw_query}'.\n\n"
            "Taburculuk sürecinizde ilaç dozlarınız, diyet kısıtlamalarınız ve kontrol randevularınız "
            "epikriz raporunuzda belirtildiği şekilde titizlikle uygulanmalıdır. "
            "Beklenmeyen bir semptom, ödem, tansiyon veya şeker dengesizliği durumunda "
            "lütfen hekiminizle veya servis hemşirenizle iletişime geçiniz."
        )

    return ChatResponse(
        answer=answer_text,
        warning_level="info",
        category="general",
        emergency_detected=False,
        suggested_questions=[
            "Böbrek hastasıyım, hangi ağrı kesicileri kullanabilirim?",
            "Fosfat bağlayıcı ilaçlar ne zaman alınır?",
            "Kalp yetmezliğinde günlük tuz kısıtlaması ne kadar?",
            "Ne zaman 112 Acil Servis aranmalıdır?"
        ]
    )
