"""
Modular Disease Registry:
Provides extensible catalog and factory for disease modules.
Allows adding new chronic/acute disease protocols (Hypertension, Diabetes, COPD, etc.)
without changing core pipeline logic.
"""

from typing import Any
from fastapi import HTTPException, status
from app.diseases.heart_failure import HeartFailureModule
from app.diseases.kidney_failure import KidneyFailureModule
from app.diseases.diabetes_type2 import DiabetesType2Module
from app.diseases.copd_respiratory import COPDModule

# Global catalog of supported and clinical disease modules
DISEASE_CATALOG: list[dict[str, Any]] = [
    {
        "id": "heart_failure",
        "name": "Kalp Yetmezliği (HFrEF / HFpEF)",
        "specialty": "Kardiyoloji",
        "icon": "❤️",
        "status": "active",
        "description": "Kilo takibi, sıvı/tuz kısıtlaması, GDMT 4 temel sütun ilaç uyumu ve kırmızı bayrak yönetimi.",
        "version": "1.2.0",
    },
    {
        "id": "kidney_failure",
        "name": "Kronik Böbrek Yetmezliği (KBY & Diyaliz)",
        "specialty": "Nefroloji",
        "icon": "🫘",
        "status": "active",
        "description": "Potasyum ve fosfor kısıtlı diyet, idrar ve sıvı dengesi, fosfat bağlayıcı zamanlaması, NSAİİ ilaç yasağı ve GFR takibi.",
        "version": "1.1.0",
    },
    {
        "id": "diabetes_type2",
        "name": "Tip 2 Diyabet & İnsülin Yönetimi",
        "specialty": "Endokrinoloji",
        "icon": "🩺",
        "status": "active",
        "description": "Açlık/tokluk kan şekeri profili, hipoglisemi 15-15 acil eylem planı, insülin tekniği ve ayak muayenesi.",
        "version": "1.0.0",
    },
    {
        "id": "copd_respiratory",
        "name": "KOAH & Kronik Solunum Taburculuğu",
        "specialty": "Göğüs Hastalıkları",
        "icon": "🫁",
        "status": "active",
        "description": "Kortizonlu/bronkodilatör inhaler tekniği, ağız gargarası, oksijen konsantratörü ayarı ve alevlenme işaretleri.",
        "version": "1.0.0",
    },
    {
        "id": "hypertension",
        "name": "Dirençli Hipertansiyon & İnme Önleme",
        "specialty": "Kardiyoloji / Dahiliye",
        "icon": "🩸",
        "status": "active",
        "description": "Günlük tansiyon günlüğü, DASH diyeti, tuzsuz beslenme, ani tansiyon fırlaması (kriz) eşiği ve hedef değer takibi.",
        "version": "1.0.0",
    },
]


class GenericChronicDiseaseModule:
    """Extensible fallback module for generalized chronic discharge protocols."""

    def __init__(self, disease_id: str, name: str):
        self.id = disease_id
        self.name = name
        self.extraction_schema = HeartFailureModule.extraction_schema

    def extraction_prompt(self, discharge_text: str) -> str:
        base_mod = HeartFailureModule()
        return base_mod.extraction_prompt(discharge_text)

    def question_templates(self) -> list[dict[str, Any]]:
        base_mod = HeartFailureModule()
        return base_mod.question_templates()

    def risk_rules(self) -> list[dict[str, Any]]:
        base_mod = HeartFailureModule()
        return base_mod.risk_rules()

    def safety_rules(self) -> list[dict[str, Any]]:
        base_mod = HeartFailureModule()
        return base_mod.safety_rules()

    def emergency_message(self) -> str:
        return (
            "DİKKAT: Bildirdiğiniz şikayetler acil tıbbi müdahale gerektirebilir! "
            "Lütfen vakit kaybetmeden 112 Acil Çağrı Merkezi'ni arayın veya en yakın acil servise başvurun."
        )


def get_disease_module(disease_id: str):
    """Retrieve disease module implementation by ID with modular fallback."""
    low_id = (disease_id or "heart_failure").lower().strip()

    if low_id in ("heart_failure", "hf", "kalp_yetmezligi", "kalp"):
        return HeartFailureModule()

    if low_id in ("kidney_failure", "kby", "ckd", "renal", "bobrek_yetmezligi", "bobrek"):
        return KidneyFailureModule()

    if low_id in ("diabetes_type2", "diabetes", "diyabet", "dm", "seker"):
        return DiabetesType2Module()

    if low_id in ("copd_respiratory", "copd", "koah", "solunum"):
        return COPDModule()

    # Check registered catalog
    cat = next((d for d in DISEASE_CATALOG if d["id"] == low_id), None)
    if cat:
        return GenericChronicDiseaseModule(cat["id"], cat["name"])

    # Fallback to generic chronic
    return GenericChronicDiseaseModule(disease_id, disease_id.capitalize())
