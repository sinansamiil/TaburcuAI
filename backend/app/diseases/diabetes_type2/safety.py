"""Diabetes Type 2 safety rules and emergency boundary."""

from typing import Any

EMERGENCY_KEYWORDS = [
    "şekerim çok düştü",
    "şekerim 50",
    "şekerim 40",
    "bayılacak gibiyim",
    "titriyorum konuşamıyorum",
    "şuurumu kaybediyorum",
    "şekerim 450",
    "şekerim 500",
    "ağzımda aseton kokusu",
    "durmadan kusuyorum",
]

FIXED_EMERGENCY_MESSAGE = (
    "DİKKAT: Kan şekeriniz tehlikeli seviyede düşmüş (ağır hipoglisemi) veya aşırı yükselmiş "
    "(diyabetik ketoasidoz / hiperozmolar koma riski) olabilir! Derhal 112 Acil Servis'i arayın "
    "veya en yakın acil servise başvurun."
)


def get_diabetes_safety_rules() -> list[dict[str, Any]]:
    return [
        {
            "id": "rule_dia_no_dose_change",
            "rule": "Sistem asla hekim reçetesi dışında insülin ünite dozu öneremez veya değiştiremez.",
        },
        {
            "id": "rule_dia_emergency_override",
            "rule": "Hipoglisemik şok veya ketoasidoz şüphesinde acil mesajı tetiklenir.",
            "keywords": EMERGENCY_KEYWORDS,
        },
    ]


def get_emergency_message() -> str:
    return FIXED_EMERGENCY_MESSAGE
