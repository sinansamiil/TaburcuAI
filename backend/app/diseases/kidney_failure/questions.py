"""Kidney failure teach-back question templates."""

from typing import Any


def get_kidney_failure_question_templates() -> list[dict[str, Any]]:
    """Return pre-configured teach-back question templates for kidney failure."""
    return [
        {
            "id": "q_kf_potassium_diet",
            "type": "open",
            "linked_item": "sodium_restriction",
            "criticality": "high",
            "text": "Böbrek yetmezliğinde potasyum içeren besinlere (muz, kuru meyve, patates vb.) neden dikkat etmelisiniz ve ne yapmanız önerildi?",
            "expected_points": [
                "Böbrekler fazla potasyumu atamadığı için kanda potasyum birikebilir",
                "Yüksek potasyumun kalpte tehlikeli ritim bozukluğuna yol açabileceği",
                "Yüksek potasyumlu besinleri (muz, salça, kuru meyveler) kısıtlamak",
            ],
        },
        {
            "id": "q_kf_forbidden_nsaids",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "high",
            "text": "Böbrek hastalarının kesinlikle uzak durması gereken ağrı kesici türleri hangileridir ve neden sakıncalıdır?",
            "expected_points": [
                "Romatizmal veya antienflamatuar ağrı kesiciler (NSAİİ; ibuprofen, naproksen, apranax, diklofenak vb.)",
                "Kalan böbrek fonksiyonlarını hızla bozup böbrek yetmezliğini ilerletebileceği",
                "Ağrı durumunda hekime danışarak yalnızca parasetamol tercih edilmesi",
            ],
        },
        {
            "id": "q_kf_phosphate_timing",
            "type": "open",
            "linked_item": "medications",
            "criticality": "high",
            "text": "Fosfat bağlayıcı ilacınızı (Renagel, Velphoro vb.) günün hangi anında almalısınız ve neden?",
            "expected_points": [
                "Yemeklerle birlikte veya ilk lokmada alınması",
                "Yiyeceklerdeki fosforu bağırsakta bağlayıp kana geçmesini önlemek için",
                "Aç karnına alınırsa işe yaramayacağı",
            ],
        },
        {
            "id": "q_kf_fluid_weight",
            "type": "open",
            "linked_item": "fluid_restriction",
            "criticality": "medium",
            "text": "Günlük sıvı tüketiminizi ve tartı/ödem kontrolünüzü nasıl takip edeceksiniz?",
            "expected_points": [
                "Belirtilen günlük sıvı sınırını (su, çorba, çay dahil) aşmamak",
                "Her sabah aç karnına tartılmak ve ani kilo artışlarını takip etmek",
                "İdrar miktarında belirgin azalma veya bacaklarda ödem artışında bildirmek",
            ],
        },
        {
            "id": "q_kf_warning_signs",
            "type": "open",
            "linked_item": "warning_signs",
            "criticality": "high",
            "text": "Hangi belirtiler ortaya çıkarsa vakit kaybetmeden 112'yi aramalı veya Nefroloji acil servisine başvurmalısınız?",
            "expected_points": [
                "İdrarın tamamen kesilmesi veya çok azalması",
                "Şiddetli nefes darlığı, akciğerde su toplanması hissi",
                "Kalpte ritim bozukluğu hissi veya aşırı kas güçsüzlüğü (potasyum yükselmesi)",
                "Bilinç bulanıklığı, aşırı bulantı veya göğüs ağrısı",
            ],
        },
        {
            "id": "q_kf_follow_up",
            "type": "open",
            "linked_item": "follow_ups",
            "criticality": "medium",
            "text": "Taburculuk sonrası kontrol randevunuz ne zaman ve hangi kan tahlilleri kontrol edilecek?",
            "expected_points": [
                "Belirtilen randevu zamanında Nefroloji polikliniğine gitmek",
                "Kreatinin, üre, potasyum ve GFR tahlili yapılması",
            ],
        },
    ]
