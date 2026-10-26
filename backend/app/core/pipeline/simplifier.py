"""
Simplification pipeline step.

Transforms clinical DischargeInfo into an understandable, structured SimplifiedPlan for the patient:
- Groups medications into schedule slots: sabah, öğle, akşam, gece
- Formulates daily routine tasks (daily morning weight, salt restriction, fluid limit)
- Clarifies warning signs into plain Turkish
- Adds mandatory disclaimer: 'Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; sorunuz varsa hekiminize danışın.'
"""

from app.core.schemas.models import (
    DischargeInfo,
    MedicationScheduleSlot,
    SimplifiedMedication,
    SimplifiedPlan,
)
from app.diseases.heart_failure.safety import CLINICAL_DISCLAIMER


def parse_schedule_slots(frequency_text: str, timing_text: str | None) -> list[MedicationScheduleSlot]:
    """Determine schedule slots (sabah, öğle, akşam, gece) from timing and frequency text."""
    combined = f"{frequency_text} {timing_text or ''}".lower()
    slots: list[MedicationScheduleSlot] = []

    if "sabah" in combined:
        slots.append(MedicationScheduleSlot.MORNING)
    if "öğle" in combined:
        slots.append(MedicationScheduleSlot.NOON)
    if "akşam" in combined:
        slots.append(MedicationScheduleSlot.EVENING)
    if "gece" in combined or "yatarken" in combined:
        slots.append(MedicationScheduleSlot.NIGHT)

    # Fallbacks based on frequency counts if no specific timing keyword
    if not slots:
        if "2 kez" in combined or "2 tablet" in combined or "2x1" in combined:
            slots = [MedicationScheduleSlot.MORNING, MedicationScheduleSlot.EVENING]
        elif "3 kez" in combined or "3x1" in combined:
            slots = [MedicationScheduleSlot.MORNING, MedicationScheduleSlot.NOON, MedicationScheduleSlot.EVENING]
        else:
            # Default to morning
            slots = [MedicationScheduleSlot.MORNING]

    return slots


# Multi-disease patient-friendly drug explanations & class mappings
PATIENT_FRIENDLY_DRUG_INFO = [
    # Cardiology / Heart Failure
    {
        "keywords": ["entresto", "sakubitril", "sacubitril", "arni"],
        "purpose": "Kalp fonksiyonunu destekler ve tansiyonu dengeler",
        "tag": "ARNI",
    },
    {
        "keywords": ["forxiga", "dapagliflozin", "jardiance", "empagliflozin", "sglt2"],
        "purpose": "Kalp ve böbrek koruyucu destek",
        "tag": "SGLT2 İnhibitörü",
    },
    {
        "keywords": ["inspra", "eplerenon", "aldactone", "spironolakton", "mra"],
        "purpose": "Kalp dokusunu korur, vücuttan fazla suyu atar",
        "tag": "MRA",
    },
    {
        "keywords": ["concor", "bisoprolol", "beloc", "metoprolol", "dilatrend", "karvedilol", "carvedilol", "vasoxen", "nebivolol", "beta bloker"],
        "purpose": "Kalp hızını yavaşlatır, ritmi dengeler",
        "tag": "Beta Bloker",
    },
    {
        "keywords": ["lasix", "furosemid", "desal", "torasemid", "torem", "diüretik", "diuretic"],
        "purpose": "Ödem ve fazla sıvıyı vücuttan uzaklaştırır",
        "tag": "İdrar Söktürücü (Diüretik)",
        "timing_warning": "Gece sık tuvalete kalkıp uykunuzun bölünmemesi için sabah erken saatte alınız.",
    },

    # Nephrology / Chronic Kidney Disease (Böbrek Yetmezliği)
    {
        "keywords": ["renagel", "sevelamer", "fosrenol", "velphoro", "kalsiyum asetat", "anti-fosfat"],
        "purpose": "Yiyeceklerdeki fazla fosforu bağlayarak kemik ve damarları korur",
        "tag": "Fosfat Bağlayıcı",
        "timing_warning": "Yemeklerin ilk lokmasıyla veya yemek ortasında alınız; aç karnına alınırsa etkisizdir.",
    },
    {
        "keywords": ["lokelma", "anti-potasyum", "kayexalate", "patiromer"],
        "purpose": "Kandaki tehlikeli potasyum yüksekliğini düşürür",
        "tag": "Potasyum Düşürücü Reçine",
        "timing_warning": "Diğer ilaçlarla arasında en az 2 saat ara bırakarak alınız.",
    },
    {
        "keywords": ["aranesp", "darbepoetin", "eprex", "neorecormon", "eritropoietin"],
        "purpose": "Böbrek yetmezliğine bağlı kansızlığı tedavi eder, alyuvar üretimini uyarır",
        "tag": "Eritropoietin (Kansızlık İğnesi)",
        "timing_warning": "Buzdolabı kapağında (2-8°C) saklayınız, kesinlikle dondurmayınız.",
    },
    {
        "keywords": ["rocaltrol", "kalsitriol", "d-colefor", "alfakalsidol"],
        "purpose": "Böbreklerin üretemediği aktif D vitaminini karşılar",
        "tag": "Aktif D Vitamini",
    },
    {
        "keywords": ["bikarbonat", "karbonat"],
        "purpose": "Kandaki asit yükünü dengeler (metabolik asidozu önler)",
        "tag": "Sodyum Bikarbonat",
    },

    # Endocrinology / Diabetes (Tip 2 Diyabet)
    {
        "keywords": ["glifor", "metformin", "matofin", "diaformin"],
        "purpose": "Kan şekerini dengeler ve insülin direncini azaltır",
        "tag": "Metformin",
        "timing_warning": "Mide rahatsızlığını önlemek için yemek ortasında veya hemen sonrasında alınız.",
    },
    {
        "keywords": ["januvia", "sitagliptin", "galvus", "vildagliptin", "onglyza"],
        "purpose": "Öğün sonrası pankreastan insülin salgısını düzenler",
        "tag": "DPP-4 İnhibitörü",
    },
    {
        "keywords": ["lantus", "toujeo", "levemir", "tresiba"],
        "purpose": "24 saatlik bazal kan şekerini dengede tutar",
        "tag": "Uzun Etkili İnsülin",
        "timing_warning": "Her gün aynı saatte uygulayınız. Enjeksiyon yerini dönüşümlü değiştiriniz.",
    },
    {
        "keywords": ["novorapid", "humalog", "apidra", "fiasp"],
        "purpose": "Yemek sonrası ani kan şekeri yükselmesini önler",
        "tag": "Hızlı Etkili İnsülin",
        "timing_warning": "Yemekten hemen önce (10-15 dk) veya ilk lokmayla uygulayınız.",
    },

    # Pulmonology / COPD (KOAH)
    {
        "keywords": ["foster", "ventolin", "salbutamol", "aircomb", "flutiform", "symbicort", "seretide"],
        "purpose": "Bronşları açarak solunum yollarını rahatlatır",
        "tag": "İnhaler Tedavi",
        "timing_warning": "İlacı çektikten sonra ağzınızı mutlaka bol suyla çalkalayıp tükürünüz (pamukçuk önleme).",
    },
    {
        "keywords": ["spiriva", "tiotropium", "anoro", "trelegy"],
        "purpose": "Solunum yollarını 24 saat boyunca açık tutar",
        "tag": "Uzun Etkili Bronkodilatör",
    },

    # Hypertension (Hipertansiyon)
    {
        "keywords": ["norvasc", "amlodipin", "co-diovan", "delix", "ramipril", "cardura"],
        "purpose": "Damarları gevşeterek kan basıncını kontrol altında tutar",
        "tag": "Antihipertansif",
    },
]

MANDATORY_LAB_FOLLOW_UP_HF = (
    "Taburculuktan 10 gün sonra: Böbrek fonksiyonları (kreatinin) ve potasyum seviyesi kontrolü "
    "için kardiyoloji polikliniğine/laboratuvara kan tahlili verilmelidir."
)

MANDATORY_LAB_FOLLOW_UP_KF = (
    "Taburculuktan 10-14 gün sonra: Kreatinin, potasyum, üre ve eGFR seviyesi kontrolü "
    "için Nefroloji polikliniğine başvurulmalı ve kan tahlili verilmelidir."
)

NSAID_AVOID_WARNING_HF = (
    "Dikkat: Hekiminize danışmadan romatizmal veya antienflamatuar ağrı kesiciler "
    "(NSAİİ grubu; ibuprofen, naproksen, diklofenak vb.) kullanmayınız. "
    "Bu ilaçlar vücutta su ve tuz tutarak kalp yetmezliğini kötüleştirebilir. "
    "Ağrı durumunda parasetamol grubunu hekiminize danışarak tercih ediniz."
)

NSAID_AVOID_WARNING_KF = (
    "HAYATİ BÖBREK KORUMA UYARISI: Hekiminize danışmadan kesinlikle romatizmal veya "
    "antienflamatuar ağrı kesiciler (NSAİİ grubu; ibuprofen, naproksen, apranax, majezik, "
    "diklofenak vb.) KULLANMAYINIZ! Bu ilaçlar böbrek kanlanmasını düşürüp böbrek fonksiyonunu "
    "hızla bozabilir. Ağrı durumunda hekiminize danışarak yalnızca parasetamol tercih ediniz."
)


def enrich_medication_purpose(med_name: str, existing_purpose: str | None) -> tuple[str, str | None, str | None]:
    """Return (friendly_purpose, class_tag, timing_warning)."""
    low = med_name.lower()
    for entry in PATIENT_FRIENDLY_DRUG_INFO:
        if any(k in low for k in entry["keywords"]):
            purpose = entry["purpose"]
            return purpose, entry.get("tag"), entry.get("timing_warning")
    return existing_purpose or "Hekiminizin reçete ettiği taburculuk tedavisi", None, None


def clean_medical_jargon(text: str) -> str:
    """Replace overly technical clinical jargon with patient-friendly terms."""
    replacements = [
        ("gode bırakan ödem", "parmakla basıldığında çukur kalan belirgin şişlik"),
        ("gode bırakan", "parmakla basıldığında çukur kalan"),
        ("pretibial ödem", "bacaklarda ve ayak bileklerinde belirgin şişlik"),
        ("ödem artışı", "şişlik ve sıvı toplanması"),
        ("oligüri", "idrar miktarında belirgin azalma"),
        ("anüri", "idrarın tamamen kesilmesi"),
        ("hiperkalemi", "kanda tehlikeli potasyum yüksekliği"),
        ("hipoglisemi", "kan şekerinin tehlikeli derecede düşmesi"),
        ("dispne", "nefes darlığı"),
    ]
    cleaned = text
    for old, new in replacements:
        if old in cleaned.lower():
            import re
            cleaned = re.sub(re.escape(old), new, cleaned, flags=re.IGNORECASE)
    return cleaned


def simplify_discharge_plan(info: DischargeInfo, disease_id: str = "heart_failure") -> SimplifiedPlan:
    """Transform DischargeInfo into patient-facing SimplifiedPlan tailored to disease specialty."""
    low_disease = (disease_id or "heart_failure").lower().strip()
    is_kidney = low_disease in ("kidney_failure", "kby", "ckd", "renal", "bobrek_yetmezligi", "bobrek")
    is_diabetes = low_disease in ("diabetes_type2", "diabetes", "diyabet", "dm")
    is_copd = low_disease in ("copd_respiratory", "copd", "koah")

    daily_schedule: list[SimplifiedMedication] = []

    for med in info.medications:
        slots = parse_schedule_slots(med.frequency_text, med.timing_text)
        friendly_purpose, tag, timing_warn = enrich_medication_purpose(med.name, med.purpose)

        purpose_text = friendly_purpose
        if tag:
            purpose_text = f"{friendly_purpose} ({tag})"
        if timing_warn:
            purpose_text = f"{purpose_text} • UYARI: {timing_warn}"

        daily_schedule.append(
            SimplifiedMedication(
                name=med.name,
                dose_text=med.dose_text,
                slots=slots,
                timing_text=med.timing_text or med.frequency_text,
                purpose=purpose_text,
                source_span=med.source_span,
            )
        )

    daily_routine: list[str] = []

    if is_kidney:
        # Kidney Failure tailored routine
        if info.daily_weight_monitoring:
            daily_routine.append(f"İdrar & Tartı Takibi: {clean_medical_jargon(info.daily_weight_monitoring)}")
        else:
            daily_routine.append("İdrar & Tartı Takibi: Her sabah aç karnına tartılınız ve günlük idrar miktarınızı takip ediniz.")

        if info.sodium_restriction:
            daily_routine.append(f"Tuz Kısıtlaması: {clean_medical_jargon(info.sodium_restriction)}")
        else:
            daily_routine.append("Tuz Kısıtlaması: Yemeklere tuz eklemeyiniz; tuzsuz ekmek ve az tuzlu besleniniz.")

        if info.fluid_restriction:
            daily_routine.append(f"Sıvı Dengesi: {clean_medical_jargon(info.fluid_restriction)}")
        else:
            daily_routine.append("Sıvı Dengesi: Hekiminizin belirlediği günlük sıvı sınırını (su, çorba, çay dahil) aşmayınız.")

        daily_routine.append("Potasyum & Fosfor Kısıtı: Muz, kuru yemiş, kuru meyve, domates salçası ve kolalı içecekleri kısıtlayınız.")
        daily_routine.append(f"Laboratuvar Takibi: {MANDATORY_LAB_FOLLOW_UP_KF}")

    elif is_diabetes:
        daily_routine.append("Kan Şekeri Günlüğü: Sabah aç karnına ve yemeklerden 2 saat sonra tokluk şekerinizi ölçüp kaydediniz.")
        daily_routine.append("Hipoglisemi Kiti: Yanınızda her zaman 3-4 adet kesme şeker veya meyve suyu bulundurunuz.")
        daily_routine.append("Günlük Ayak Bakımı: Her akşam ayaklarınızı kızarıklık, yara ve çatlak yönünden muayene ediniz.")
        if info.sodium_restriction:
            daily_routine.append(f"Beslenme: {clean_medical_jargon(info.sodium_restriction)}")

    elif is_copd:
        daily_routine.append("İnhaler Bakımı: Kortizonlu sprey sonrası ağzınızı bol suyla çalkalayınız.")
        daily_routine.append("Solunum Takibi: İstirahat halinde nefes darlığı ve balgam rengini günlük kontrol ediniz.")
        if info.other_instructions:
            daily_routine.append(f"Cihaz & Tedavi: {clean_medical_jargon(info.other_instructions)}")

    else:
        # Heart Failure routine
        if info.daily_weight_monitoring:
            daily_routine.append(f"Tartı Takibi: {clean_medical_jargon(info.daily_weight_monitoring)}")
        if info.sodium_restriction:
            daily_routine.append(f"Tuz Kısıtlaması: {clean_medical_jargon(info.sodium_restriction)}")
        if info.fluid_restriction:
            daily_routine.append(f"Sıvı Kısıtlaması: {clean_medical_jargon(info.fluid_restriction)}")
        daily_routine.append(f"Laboratuvar Takibi: {MANDATORY_LAB_FOLLOW_UP_HF}")

    # Warning signs tailored
    warning_signs: list[str] = [clean_medical_jargon(w) for w in info.warning_signs]
    if is_kidney:
        warning_signs.append(f"YASAKLI İLAÇ UYARISI: {NSAID_AVOID_WARNING_KF}")
        if not any("idrar" in w.lower() for w in warning_signs):
            warning_signs.append("İdrar çıkışında belirgin azalma veya tamamen durması halinde derhal acil servise başvurunuz.")
    elif is_diabetes:
        warning_signs.append("Kan şekeriniz 70 mg/dL altına düşerse 15-15 kuralını uygulayınız: 3-4 kesme şeker alıp 15 dk sonra tekrar ölçünüz.")
    elif is_copd:
        warning_signs.append("İstirahatte şiddetli nefes darlığı veya dudaklarda morarma durumunda derhal 112'yi arayınız.")
    else:
        warning_signs.append(f"YASAKLI İLAÇ UYARISI: {NSAID_AVOID_WARNING_HF}")

    follow_ups: list[str] = []
    for fu in info.follow_ups:
        detail = fu.when_text
        if fu.with_whom:
            detail += f" ({fu.with_whom})"
        if fu.purpose:
            detail += f" - {fu.purpose}"
        follow_ups.append(clean_medical_jargon(detail))

    return SimplifiedPlan(
        daily_schedule=daily_schedule,
        daily_routine=daily_routine,
        warning_signs=warning_signs,
        follow_ups=follow_ups,
        disclaimer=CLINICAL_DISCLAIMER,
    )

