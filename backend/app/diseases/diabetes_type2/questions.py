"""Diabetes Type 2 teach-back question templates."""

from typing import Any


def get_diabetes_question_templates() -> list[dict[str, Any]]:
    return [
        {
            "id": "q_dia_hypo_rule",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "high",
            "text": "Kan şekeriniz düştüğünde (titreme, soğuk terleme, baş dönmesi veya <70 mg/dL) 15-15 kuralını nasıl uygulayacaksınız?",
            "expected_points": [
                "Derhal 3-4 adet kesme şeker veya yarım bardak meyve suyu almak",
                "15 dakika dinlenip kan şekerini tekrar ölçmek",
                "Düzelmezse aynı işlemi tekrarlamak veya 112'ye başvurmak",
            ],
        },
        {
            "id": "q_dia_insulin_timing",
            "type": "open",
            "linked_item": "medications",
            "criticality": "high",
            "text": "İnsülininizi (veya diyabet ilacınızı) yemekle ilişkili olarak ne zaman ve nasıl yapacaksınız?",
            "expected_points": [
                "Hızlı etkili insülini yemekten hemen önce/15 dk önce yapmak",
                "Uzun etkili insülini her gün aynı saatte uygulamak",
                "Enjeksiyon bölgesini dönüşümlü değiştirmek ve buzdolabı kapağında saklamak",
            ],
        },
        {
            "id": "q_dia_blood_sugar_log",
            "type": "open",
            "linked_item": "daily_weight_monitoring",
            "criticality": "medium",
            "text": "Kan şekerinizi gün içinde hangi zamanlarda ölçüp kaydetmeniz gerekiyor?",
            "expected_points": [
                "Sabah aç karnına ölçüm",
                "Yemeklerden 2 saat sonra tokluk şekeri ölçümü",
                "Şeker günlüğüne yazıp kontrole getirmek",
            ],
        },
        {
            "id": "q_dia_foot_care",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "medium",
            "text": "Diyabetik ayak yaralarını önlemek için günlük ayak bakımında nelere dikkat etmelisiniz?",
            "expected_points": [
                "Her akşam ayakları kızarıklık, yara veya çatlak açısından incelemek",
                "Çıplak ayakla yere basmamak, pamuklu dikişsiz çorap giymek",
                "Ayakları ılık suyla yıkamak ve parmak aralarını kurulamak",
            ],
        },
    ]
