"""Kidney failure clinical safety rules, emergency triggers, and boundary messages."""

from typing import Any

# Nephrology emergency symptom keywords that trigger immediate emergency redirect
EMERGENCY_KEYWORDS = [
    "idrar yapamıyorum",
    "idrarım kesildi",
    "idrar çıkışı yok",
    "hiç idrara çıkamadım",
    "şiddetli nefes darlığı",
    "nefes alamıyorum",
    "boğulur gibi oluyorum",
    "kalbim duracak gibi",
    "kalp ritmim çok bozuldu",
    "aşırı kas güçsüzlüğü",
    "bacaklarım tutmuyor",
    "şuur kaybı",
    "bilinç bulanıklığı",
    "sürekli kusuyorum",
    "fistülüm durdu",
    "fistülden ses gelmiyor",
    "fistülde şişlik ve kanama",
]

FIXED_EMERGENCY_MESSAGE = (
    "DİKKAT: Bildirdiğiniz şikayetler böbrek yetmezliğinde acil müdahale (akut hiperkalemi, "
    "akciğer ödemi veya üremik kriz) gerektirebilir! Lütfen vakit kaybetmeden 112 Acil Çağrı "
    "Merkezi'ni arayın veya en yakın acil servise / Nefroloji kliniğine başvurun."
)

CLINICAL_DISCLAIMER = (
    "Bu bilgi nefroloji hekiminizin yazdığı resmi taburculuk talimatının sadeleştirilmiş halidir; "
    "sorunuz veya şüpheniz varsa derhal hekiminize danışın."
)

MISSING_INFO_MESSAGE = "Belgede bu bilgi yer almamaktadır; nefroloji hekiminize veya servis hemşirenize danışınız."


def get_kidney_failure_safety_rules() -> list[dict[str, Any]]:
    """Return clinical safety guardrail rules for kidney failure."""
    return [
        {
            "id": "rule_kf_no_dosage_change",
            "rule": "Sistem asla yeni ilaç, doz değişimi veya diyaliz protokolü öneremez.",
        },
        {
            "id": "rule_kf_emergency_override",
            "rule": "Acil durum anahtar kelimesi (idrar durması, nefes darlığı, ritim bozukluğu) tespit edildiğinde derhal sabit acil mesajı verilir.",
            "keywords": EMERGENCY_KEYWORDS,
        },
        {
            "id": "rule_kf_no_hallucination",
            "rule": "Belgede yer almayan laboratuvar veya tedavi parametreleri için asla tahmin yürütülemez.",
            "fallback": MISSING_INFO_MESSAGE,
        },
    ]


def get_emergency_message() -> str:
    """Return the fixed emergency response message."""
    return FIXED_EMERGENCY_MESSAGE
