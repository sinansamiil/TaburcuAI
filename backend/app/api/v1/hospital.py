"""Hospital White-Labeling & Branding Configuration Endpoints."""

from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.schemas import HospitalConfigResponse, HospitalConfigUpdate
from app.db.models import HospitalConfigModel
from app.db.session import get_db

router = APIRouter(prefix="/hospital", tags=["Hospital Configuration"])

PRESETS: dict[str, dict[str, Any]] = {
    "sehir_hastanesi": {
        "hospital_name": "Şehir Eğitim ve Araştırma Hastanesi",
        "hospital_subtitle": "T.C. Sağlık Bakanlığı Klinik Taburculuk ve Akıllı Hasta Takip Sistemi",
        "logo_icon": "building-2",
        "logo_url": None,
        "primary_color": "#1e5ba3",
        "accent_color": "#0284c7",
        "phone": "+90 (212) 444 00 00",
        "emergency_phone": "112 Acil Servis",
        "address": "Merkez Kampüs Sağlık Caddesi No:1, İstanbul",
        "email": "taburcu@sehirhastanesi.gov.tr",
        "active_departments": [
            "Nefroloji Kliniği",
            "Kardiyoloji Kliniği",
            "Dahiliye (İç Hastalıkları)",
            "Endokrinoloji & Diyabet",
            "Göğüs Hastalıkları",
        ],
        "custom_disclaimer": "Bu sistem, hekiminizin düzenlediği epikriz ve taburculuk talimatlarının hasta tarafından en doğru şekilde anlaşılmasını desteklemek amacıyla sunulmuştur.",
    },
    "ozel_saglik": {
        "hospital_name": "Medicana & Acıbadem Uluslararası Sağlık Grubu",
        "hospital_subtitle": "Kişiselleştirilmiş Akıllı Taburculuk ve Klinik Takip Portalı",
        "logo_icon": "shield-plus",
        "logo_url": None,
        "primary_color": "#0e2038",
        "accent_color": "#d92d20",
        "phone": "+90 (850) 444 55 66",
        "emergency_phone": "+90 (850) 444 55 99 (Özel Acil)",
        "address": "Büyükdere Cad. No: 120 Levent, İstanbul",
        "email": "iletisim@saglikgrubu.com",
        "active_departments": [
            "Kardiyoloji & Kalp Damar Cerrahisi",
            "Nefroloji & Diyaliz Merkezi",
            "Endokrinoloji & Obezite Kliniği",
            "Göğüs Hastalıkları & Alerji",
            "Genel Dahiliye",
        ],
        "custom_disclaimer": "Taburculuk sonrası medikal bakımınız ve ilaç takip planınız hastanemiz klinik yapay zeka güvencesiyle takip edilmektedir.",
    },
    "universite_tip": {
        "hospital_name": "Üniversite Tıp Fakültesi Hastaneleri",
        "hospital_subtitle": "Eğitim, Araştırma ve Dijital Taburculuk Platformu",
        "logo_icon": "graduation-cap",
        "logo_url": None,
        "primary_color": "#0f766e",
        "accent_color": "#14b8a6",
        "phone": "+90 (312) 305 10 00",
        "emergency_phone": "+90 (312) 305 11 12",
        "address": "Sıhhiye Yerleşkesi Tıp Fakültesi, Ankara",
        "email": "tip.taburcu@universite.edu.tr",
        "active_departments": [
            "Nefroloji Anabilim Dalı",
            "Kardiyoloji Anabilim Dalı",
            "İç Hastalıkları Anabilim Dalı",
            "Endokrinoloji Bilim Dalı",
            "Göğüs Hastalıkları Anabilim Dalı",
        ],
        "custom_disclaimer": "Fakültemiz öğretim üyeleri tarafından onaylanan klinik kılavuzlara uygun olarak sadeleştirilmiştir.",
    },
    "butik_klinik": {
        "hospital_name": "Kardiyo-Renal Mükemmeliyet Merkezi",
        "hospital_subtitle": "Kalp & Böbrek Hastalıkları Özel Taburculuk ve Yaşam Boyu Takip Kliniği",
        "logo_icon": "heart-pulse",
        "logo_url": None,
        "primary_color": "#4338ca",
        "accent_color": "#6366f1",
        "phone": "+90 (216) 555 40 40",
        "emergency_phone": "112 / +90 (216) 555 40 44",
        "address": "Bağdat Caddesi No: 45 Kadıköy, İstanbul",
        "email": "destek@kardiyorenal.com",
        "active_departments": [
            "Kardiyo-Renal Ortak Takip Kliniği",
            "Nefroloji & Hipertansiyon Ünitesi",
            "Kalp Yetersizliği Polikliniği",
        ],
        "custom_disclaimer": "Kardiyovasküler ve renal sağlığınız için özel olarak hazırlanmış dinamik takip planıdır.",
    },
}


def _get_or_create_config(db: Session) -> HospitalConfigModel:
    cfg = db.query(HospitalConfigModel).filter(HospitalConfigModel.id == "default").first()
    if not cfg:
        cfg = HospitalConfigModel(id="default")
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.get("/config", response_model=HospitalConfigResponse)
def get_hospital_config(db: Session = Depends(get_db)):
    """Retrieve active hospital white-label configuration."""
    return _get_or_create_config(db)


@router.put("/config", response_model=HospitalConfigResponse)
def update_hospital_config(payload: HospitalConfigUpdate, db: Session = Depends(get_db)):
    """Update hospital branding, colors, contact details and active clinics."""
    cfg = _get_or_create_config(db)
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(cfg, field, val)

    cfg.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(cfg)
    return cfg


@router.post("/reset", response_model=HospitalConfigResponse)
def reset_to_factory_defaults(db: Session = Depends(get_db)):
    """Reset configuration back to default blank/standard hospital interface."""
    cfg = _get_or_create_config(db)
    default_data = PRESETS["sehir_hastanesi"]
    for field, val in default_data.items():
        setattr(cfg, field, val)

    cfg.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(cfg)
    return cfg


@router.get("/presets")
def get_presets():
    """List curated hospital theme presets."""
    return {
        "presets": [
            {
                "key": "sehir_hastanesi",
                "title": "Devlet / Şehir Araştırma Hastanesi",
                "preview_color": "#1e5ba3",
                "description": "Resmi Sağlık Bakanlığı ve Şehir Hastanesi kurumsal stili.",
            },
            {
                "key": "ozel_saglik",
                "title": "Özel Sağlık Grubu Zinciri",
                "preview_color": "#0e2038",
                "description": "Acıbadem, Medicana ve Memorial tarzı premium özel hastane kimliği.",
            },
            {
                "key": "universite_tip",
                "title": "Üniversite Tıp Fakültesi",
                "preview_color": "#0f766e",
                "description": "Akademik araştırma ve tıp fakültesi kurumsal tasarımı.",
            },
            {
                "key": "butik_klinik",
                "title": "Kardiyo-Renal İhtisas Kliniği",
                "preview_color": "#4338ca",
                "description": "Kalp ve böbrek yetmezliği üzerine odaklanmış modern butik klinik.",
            },
        ]
    }


@router.post("/presets/{preset_key}/apply", response_model=HospitalConfigResponse)
def apply_preset(preset_key: str, db: Session = Depends(get_db)):
    """Apply a curated theme preset directly to the hospital configuration."""
    if preset_key not in PRESETS:
        raise HTTPException(status_code=400, detail="Geçersiz şablon anahtarı.")

    cfg = _get_or_create_config(db)
    for field, val in PRESETS[preset_key].items():
        setattr(cfg, field, val)

    cfg.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(cfg)
    return cfg
