"""SQLAlchemy ORM models for cases, discharge plans, questions, evaluations, and risk reports."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class CaseModel(Base):
    """Represents a discharge case."""

    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    disease: Mapped[str] = mapped_column(String(50), default="heart_failure")
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    # JSON-encoded structures
    discharge_info: Mapped[dict] = mapped_column(JSON, nullable=False)
    simplified_plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )

    questions: Mapped[list["QuestionModel"]] = relationship(
        "QuestionModel", back_populates="case", cascade="all, delete-orphan"
    )
    risk_report: Mapped["RiskReportModel | None"] = relationship(
        "RiskReportModel", back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    workflow: Mapped["CaseWorkflowModel | None"] = relationship(
        "CaseWorkflowModel", uselist=False, cascade="all, delete-orphan"
    )


class QuestionModel(Base):
    """Represents a teach-back question generated for a case."""

    __tablename__ = "case_questions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), nullable=False)

    question_type: Mapped[str] = mapped_column(String(20), default="open")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    expected_points: Mapped[list] = mapped_column(JSON, nullable=False)
    linked_item: Mapped[str] = mapped_column(String(50), nullable=False)
    criticality: Mapped[str] = mapped_column(String(20), default="medium")

    patient_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    verdict: Mapped[str | None] = mapped_column(String(20), nullable=True)
    matched_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    missing_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    case: Mapped["CaseModel"] = relationship("CaseModel", back_populates="questions")


class RiskReportModel(Base):
    """Represents the final evaluation and risk assessment for a case."""

    __tablename__ = "case_risk_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), unique=True, nullable=False)

    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)  # low, medium, high
    abstained: Mapped[bool] = mapped_column(Boolean, default=False)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False)
    suggested_staff_action: Mapped[str] = mapped_column(Text, default="")
    item_risks: Mapped[list] = mapped_column(JSON, nullable=False)

    emergency_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    emergency_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )

    case: Mapped["CaseModel"] = relationship("CaseModel", back_populates="risk_report")


class CaseWorkflowModel(Base):
    """
    Patient identity + staff follow-up workflow for a case.

    Kept in a separate table so existing SQLite databases keep working
    (create_all adds new tables but never alters existing ones).
    """

    __tablename__ = "case_workflow"

    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), primary_key=True)

    protocol_no: Mapped[str] = mapped_column(String(40), nullable=False)
    patient_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(80), nullable=True)

    # pending | contacted | education_planned | education_done | closed
    status: Mapped[str] = mapped_column(String(30), default="pending")
    contacted: Mapped[bool] = mapped_column(Boolean, default=False)
    education_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # planned | done
    closed: Mapped[bool] = mapped_column(Boolean, default=False)

    # [{"action": str, "note": str | None, "author": str, "at": iso8601}]
    events: Mapped[list] = mapped_column(JSON, default=list)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class DoctorModel(Base):
    """Represents a physician in the hospital system."""

    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(80), default="Uzman Doktor")
    specialty: Mapped[str] = mapped_column(String(80), nullable=False)  # Nefroloji, Kardiyoloji, etc.
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    room: Mapped[str | None] = mapped_column(String(60), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class NurseModel(Base):
    """Represents a nurse in the hospital system."""

    __tablename__ = "nurses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(80), default="Servis Hemşiresi")
    ward: Mapped[str] = mapped_column(String(80), nullable=False)  # Nefroloji Servisi, Kardiyoloji, etc.
    shift: Mapped[str] = mapped_column(String(60), default="Gündüz (08:00 - 16:00)")
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class PatientModel(Base):
    """Represents a registered patient in the hospital system."""

    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    protocol_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    tc_kimlik: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(80), nullable=True)
    assigned_doctor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    primary_disease: Mapped[str] = mapped_column(String(50), default="kidney_failure")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class HospitalConfigModel(Base):
    """Represents white-label branding and customization settings per hospital."""

    __tablename__ = "hospital_config"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default="default")
    hospital_name: Mapped[str] = mapped_column(String(160), default="Şehir Eğitim ve Araştırma Hastanesi")
    hospital_subtitle: Mapped[str] = mapped_column(String(200), default="Akıllı Taburculuk ve Klinik Takip Sistemi")
    logo_icon: Mapped[str] = mapped_column(String(50), default="building-2")
    logo_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(20), default="#1e5ba3")
    accent_color: Mapped[str] = mapped_column(String(20), default="#0284c7")
    phone: Mapped[str] = mapped_column(String(40), default="+90 (212) 444 00 00")
    emergency_phone: Mapped[str] = mapped_column(String(40), default="112 Acil Çağrı")
    address: Mapped[str] = mapped_column(String(255), default="Merkez Kampüs Sağlık Caddesi No:1")
    email: Mapped[str] = mapped_column(String(100), default="taburcu@hastane.gov.tr")
    active_departments: Mapped[list] = mapped_column(
        JSON,
        default=lambda: [
            "Nefroloji Kliniği",
            "Kardiyoloji Kliniği",
            "Dahiliye (İç Hastalıkları)",
            "Endokrinoloji & Diyabet",
            "Göğüs Hastalıkları",
        ],
    )
    custom_disclaimer: Mapped[str] = mapped_column(
        Text,
        default="Bu belge ve akıllı takip sistemi hekiminizin yazdığı resmi taburculuk talimatlarının anlaşılmasını desteklemek amacıyla sunulmuştur.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )


class DiseaseConfigModel(Base):
    """Dynamic disease definition registry for customization."""

    __tablename__ = "disease_configs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(20), default="🩺")
    status: Mapped[str] = mapped_column(String(20), default="active")
    description: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    guideline_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )
