"""Heart failure risk scoring rules and weight configurations."""

from typing import Any

HEART_FAILURE_CRITICAL_ITEMS = {
    "warning_signs": 1.0,
    "daily_weight_monitoring": 0.9,
    "medications": 0.85,
    "fluid_restriction": 0.7,
    "sodium_restriction": 0.6,
    "follow_ups": 0.5,
}


def get_heart_failure_risk_rules() -> list[dict[str, Any]]:
    """Return risk calculation rules for heart failure."""
    return [
        {
            "rule_id": "rule_hf_critical_warning_sign_miss",
            "description": "Uyarı belirtileri veya acil durumlarda yanlış anlama varsa risk doğrudan HIGH seviyesine çıkar.",
            "target_item": "warning_signs",
            "trigger_verdicts": ["incorrect"],
            "force_level": "high",
            "staff_action": "Hastaya uyarı belirtileri ve acil durum eylem planı (112 / acil servis) hemşire tarafından yüz yüze tekrar anlatılmalıdır.",
        },
        {
            "rule_id": "rule_hf_diuretic_timing_miss",
            "description": "Diüretik zamanlamasında veya kritik ilaçta yanlış anlama varsa en az MEDIUM seviyesine çıkar.",
            "target_item": "medications",
            "trigger_verdicts": ["incorrect", "partial"],
            "min_level": "medium",
            "staff_action": "İlaç kullanım zamanları ve idrar söktürücü kullanım amacı hekim/hemşire tarafından gözden geçirilmelidir.",
        },
        {
            "rule_id": "rule_hf_weight_monitoring_miss",
            "description": "Günlük kilo takibinde yanlış anlama varsa en az MEDIUM seviyesine çıkar.",
            "target_item": "daily_weight_monitoring",
            "trigger_verdicts": ["incorrect"],
            "min_level": "medium",
            "staff_action": "Hastaya her sabah aç karnına tartılma ve hedef kilo eşikleri yazılı olarak tekrar verilmelidir.",
        },
    ]
