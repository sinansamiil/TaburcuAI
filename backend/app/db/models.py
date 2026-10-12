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
