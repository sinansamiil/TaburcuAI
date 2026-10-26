"""COPD question templates."""

from typing import Any


def get_copd_question_templates() -> list[dict[str, Any]]:
    return [
        {
            "id": "q_copd_inhaler_technique",
            "type": "open",
            "linked_item": "medications",
            "criticality": "high",
            "text": "Kortizonlu veya bronş genişletici inhaler cihazınızı kullandıktan sonra ağız bakımında ne yapmanız gerekir?",
            "expected_points": [
                "Ağzı bol su ile çalkalamak ve suyu mutlaka dışarı tükürmek",
                "Ağızda pamukçuk (mantar) oluşmasını ve ses kısıklığını engellemek",
            ],
        },
        {
            "id": "q_copd_warning_signs",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "high",
            "text": "KOAH alevlenmesinde (atak) acil servise veya göğüs hastalıklarına gitmenizi gerektiren işaretler nelerdir?",
            "expected_points": [
                "Nefes darlığının istirahatte dahi belirgin artması",
                "Balgam renginin sarı/yeşile dönmesi veya miktarının belirgin artması",
                "Parmak tipi oksijen ölçerde (SpO2) belirgin düşüş veya dudaklarda morarma",
            ],
        },
        {
            "id": "q_copd_oxygen",
            "type": "open",
            "linked_item": "other_instructions",
            "criticality": "medium",
            "text": "Evde oksijen cihazı veya konsantratör kullanırken en önemli güvenlik kuralı nedir?",
            "expected_points": [
                "Doktorun önerdiği akım hızı (L/dakika) sınırını kendi başına artırmamak",
                "Oksijen çalışan odada kesinlikle sigara içilmemesi ve ateş yakılmaması",
            ],
        },
    ]
