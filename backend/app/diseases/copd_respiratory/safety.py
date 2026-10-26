"""COPD risk rules and safety."""

from typing import Any

EMERGENCY_KEYWORDS = [
    "boğuluyorum",
    "nefes alamıyorum",
    "dudaklarım morardı",
    "oksijenim 75",
    "oksijenim 80",
    "konuşurken nefesim tıkanıyor",
    "bilincim bulanık",
]

FIXED_EMERGENCY_MESSAGE = (
    "DİKKAT: Akut solunum yetmezliği veya ağır KOAH atağı belirtileri! "
    "Lütfen derhal 112 Acil Çağrı Merkezi'ni arayın veya en yakın acil servise başvurun."
)


def get_copd_risk_rules() -> list[dict[str, Any]]:
    return [
        {
            "rule_id": "rule_copd_warning_miss",
            "description": "KOAH alevlenme uyarılarında yanlış anlama varsa risk HIGH seviyesine çıkar.",
            "target_item": "warning_signs",
            "trigger_verdicts": ["incorrect"],
            "force_level": "high",
            "staff_action": "Hastaya KOAH alevlenme belirtileri, acil inhaler kullanımı ve 112 kuralları tekrar anlatılmalıdır.",
        },
    ]


def get_copd_safety_rules() -> list[dict[str, Any]]:
    return [
        {
            "id": "rule_copd_emergency_override",
            "rule": "Solunum durması veya ağır hipoksi şüphesinde acil mesajı tetiklenir.",
            "keywords": EMERGENCY_KEYWORDS,
        },
    ]


def get_emergency_message() -> str:
    return FIXED_EMERGENCY_MESSAGE
