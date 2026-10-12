"""Heart failure clinical safety rules, emergency triggers, and boundary messages."""

from typing import Any

# Emergency symptom keywords that trigger immediate fixed emergency redirect
EMERGENCY_KEYWORDS = [
    "göğüs ağrısı",
    "göğsümde baskı",
    "şiddetli nefes darlığı",
    "nefes alamıyorum",
    "bayılma",
    "bayıldım",
    "bilinç kaybı",
    "dudaklarda morarma",
    "kan tükürme",
    "nabzım çok hızlı",
    "kalbim duracak gibi",
]

FIXED_EMERGENCY_MESSAGE = (
    "DİKKAT: İfade ettiğiniz belirtiler acil tıbbi müdahale gerektirebilir! "
    "Lütfen vakit kaybetmeden 112 Acil Çağrı Merkezi'ni arayın veya en yakın "
    "hastanenin acil servisine başvurun."
)

CLINICAL_DISCLAIMER = (
    "Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; "
    "sorunuz varsa hekiminize danışın."
)

MISSING_INFO_MESSAGE = "Belgede bu bilgi bulunamadı, hemşirenize veya hekiminize danışın."


def get_heart_failure_safety_rules() -> list[dict[str, Any]]:
    """Return clinical safety guardrail rules for heart failure."""
    return [
        {
            "id": "rule_hf_no_dosage_recommendation",
            "rule": "Sistem asla yeni ilaç veya doz öneremez, var olan dozu değiştiremez.",
        },
        {
            "id": "rule_hf_emergency_override",
            "rule": "Acil durum anahtar kelimesi tespit edildiğinde derhal sabit acil mesajı gösterilir.",
            "keywords": EMERGENCY_KEYWORDS,
        },
        {
            "id": "rule_hf_no_hallucination",
            "rule": "Belgede yer almayan talimatlar için asla tahmin yürütülmez.",
            "fallback": MISSING_INFO_MESSAGE,
        },
    ]


def get_emergency_message() -> str:
    """Return the fixed emergency response message."""
    return FIXED_EMERGENCY_MESSAGE
