"""Heart failure teach-back question templates."""

from typing import Any


def get_heart_failure_question_templates() -> list[dict[str, Any]]:
    """Return pre-configured teach-back question templates for heart failure."""
    return [
        {
            "id": "q_hf_daily_weight",
            "type": "open",
            "linked_item": "daily_weight_monitoring",
            "criticality": "high",
            "text": "Kilonuzu ne zaman ve nasıl takip etmeniz gerekiyor, anlatabilir misiniz?",
            "expected_points": [
                "Her sabah aç karnına",
                "Tuvalete çıktıktan sonra",
                "Benzer/hafif giysilerle",
                "Kilo artışını (örneğin 3 günde 2 kg veya günde 1 kg) takip etme",
            ],
        },
        {
            "id": "q_hf_diuretic_timing",
            "type": "open",
            "linked_item": "medications",
            "criticality": "high",
            "text": "İdrar söktürücü ilacınızı günün hangi saatinde almanız önerildi ve neden?",
            "expected_points": [
                "Sabah saatlerinde alınması",
                "Gece idrara kalkmayı ve uykunun bölünmesini önlemek için",
            ],
        },
        {
            "id": "q_hf_sodium_fluid",
            "type": "open",
            "linked_item": "sodium_restriction",
            "criticality": "medium",
            "text": "Tuz ve sıvı tüketiminiz konusunda nelere dikkat etmeniz gerekiyor?",
            "expected_points": [
                "Yemeklere ekstra tuz eklememek / tuzsuz veya az tuzlu beslenmek",
                "Doktorun belirttiği günlük sıvı sınırını aşmamak",
            ],
        },
        {
            "id": "q_hf_warning_signs",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "high",
            "text": "Hangi belirtiler ortaya çıkarsa derhal doktorunuza başvurmalı veya acil servise gitmelisiniz?",
            "expected_points": [
                "Nefes darlığında artış veya istirahatte nefes darlığı",
                "Bacaklarda, ayak bileklerinde veya karında şişlik (ödem)",
                "Ani kilo artışı",
                "Gece nefes darlığı ile uyanma veya düz yatamama",
            ],
        },
        {
            "id": "q_hf_follow_up",
            "type": "open",
            "linked_item": "follow_ups",
            "criticality": "medium",
            "text": "Taburculuk sonrası ilk kontrol randevunuz ne zaman ve nereye olacak?",
            "expected_points": [
                "Belirtilen randevu zamanı",
                "İlgili poliklinik veya hekim",
            ],
        },
    ]
