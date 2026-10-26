"""Diabetes Type 2 risk scoring rules."""

from typing import Any


def get_diabetes_risk_rules() -> list[dict[str, Any]]:
    return [
        {
            "rule_id": "rule_dia_hypo_miss",
            "description": "Hipoglisemi acil yönetiminde yanlış anlama varsa risk doğrudan HIGH seviyesine çıkar.",
            "target_item": "warning_signs",
            "trigger_verdicts": ["incorrect"],
            "force_level": "high",
            "staff_action": "Hastaya hipoglisemi 15-15 kuralı ve kesme şeker bulundurma zorunluluğu diyabet eğitim hemşiresi tarafından yüz yüze tekrar anlatılmalıdır.",
        },
        {
            "rule_id": "rule_dia_insulin_miss",
            "description": "İnsülin zamanlamasında veya doz uygulama yerinde eksiklik varsa en az MEDIUM seviyesine çıkar.",
            "target_item": "medications",
            "trigger_verdicts": ["incorrect", "partial"],
            "min_level": "medium",
            "staff_action": "İnsülin kalem kullanımı, saklama koşulları ve yemek zamanlaması gözden geçirilmelidir.",
        },
    ]
