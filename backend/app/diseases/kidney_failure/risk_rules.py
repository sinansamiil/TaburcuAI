"""Kidney failure risk scoring rules and weight configurations."""

from typing import Any

KIDNEY_FAILURE_CRITICAL_ITEMS = {
    "warning_signs": 1.0,
    "medications": 0.95,
    "fluid_restriction": 0.85,
    "sodium_restriction": 0.8,
    "follow_ups": 0.6,
}


def get_kidney_failure_risk_rules() -> list[dict[str, Any]]:
    """Return risk calculation rules for kidney failure."""
    return [
        {
            "rule_id": "rule_kf_critical_warning_sign_miss",
            "description": "Nefroloji uyarı belirtilerinde (idrar durması, nefes darlığı, ritim bozukluğu) yanlış anlama varsa risk doğrudan HIGH seviyesine çıkar.",
            "target_item": "warning_signs",
            "trigger_verdicts": ["incorrect"],
            "force_level": "high",
            "staff_action": "Hastaya nefroloji acil durum belirtileri (üremi, hiperkalemi, akciğer ödemi) ve 112 acil protokolü hemşire tarafından yüz yüze tekrar anlatılmalıdır.",
        },
        {
            "rule_id": "rule_kf_nsaid_miss",
            "description": "Yasaklı ağrı kesiciler (NSAİİ nefrotoksisitesi) konusunda yanlış veya eksik anlama varsa risk HIGH seviyesine yükseltilir.",
            "target_item": "warning_signs",
            "trigger_verdicts": ["incorrect", "partial"],
            "force_level": "high",
            "staff_action": "Böbreğe toksik ilaçlar (NSAİİ grubu; ibuprofen vb.) kesinlikle yasaklanmalı, hasta ve yakınına yazılı yasaklı ilaç listesi verilmelidir.",
        },
        {
            "rule_id": "rule_kf_phosphate_timing_miss",
            "description": "Fosfat bağlayıcı ilaçların yemekle alınması kuralında yanlış anlama varsa en az MEDIUM seviyesine çıkar.",
            "target_item": "medications",
            "trigger_verdicts": ["incorrect", "partial"],
            "min_level": "medium",
            "staff_action": "Fosfat bağlayıcıların yemekle ilk lokmada alınması kuralı ve fosfor kısıtlı diyet eğitimi pekiştirilmelidir.",
        },
        {
            "rule_id": "rule_kf_fluid_restriction_miss",
            "description": "Sıvı ve potasyum kısıtlamasında yanlış anlama varsa en az MEDIUM seviyesine çıkar.",
            "target_item": "fluid_restriction",
            "trigger_verdicts": ["incorrect"],
            "min_level": "medium",
            "staff_action": "Günlük maksimum sıvı sınırı ve yüksek potasyumlu gıdalardan kaçınma talimatı hasta yakınıyla birlikte gözden geçirilmelidir.",
        },
    ]
