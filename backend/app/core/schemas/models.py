"""
Shared Pydantic models used across the entire pipeline.

These models are disease-agnostic. Disease-specific fields live in
diseases/<disease_id>/schema.py and extend these base models where needed.
"""

from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Common value objects
# ---------------------------------------------------------------------------


class SourceSpan(BaseModel):
    """Exact quote from the original discharge text that supports a value."""

    text: str = Field(description="Verbatim substring from the discharge document.")
    start: int | None = Field(
        default=None,
        description="Character offset of the first character (0-indexed).",
    )
    end: int | None = Field(
        default=None,
        description="Character offset just past the last character (exclusive).",
    )


class Medication(BaseModel):
    """A single medication entry extracted from the discharge document."""

    name: str = Field(description="Drug name (INN preferred, brand acceptable).")
    purpose: str | None = Field(
        default=None,
        description="Brief indication / reason for use, if stated in the document.",
    )
    dose_text: str = Field(description="Dose as written, e.g. '5 mg'.")
    frequency_text: str = Field(description="Frequency as written, e.g. 'günde 1 kez'.")
    timing_text: str | None = Field(
        default=None,
        description="When to take it, e.g. 'sabah aç karnına'.",
    )
    source_span: SourceSpan = Field(
        description="Verbatim quote from the document supporting this entry."
    )


class FollowUp(BaseModel):
    """A scheduled follow-up appointment."""

    when_text: str = Field(description="When, e.g. '2 hafta sonra', '15 Kasım'.")
    with_whom: str | None = Field(
        default=None,
        description="Clinician or department, if specified.",
    )
    purpose: str | None = Field(
        default=None,
        description="Reason for follow-up, if stated.",
    )
    source_span: SourceSpan = Field(
        description="Verbatim quote from the document supporting this entry."
    )


class DischargeInfo(BaseModel):
    """
    Structured information extracted from a discharge summary.

    This is the output of the Extraction step and the input to all
    downstream pipeline steps (Simplification, Question generation, etc.).
    """

    diagnosis_text: str = Field(
        description="Primary diagnosis as stated in the document."
    )
    medications: list[Medication] = Field(
        default_factory=list,
        description="All medications listed in the discharge document.",
    )
    daily_weight_monitoring: str | None = Field(
        default=None,
        description="Instructions for daily weight tracking, if present.",
    )
    sodium_restriction: str | None = Field(
        default=None,
        description="Salt/sodium restriction instructions, if present.",
    )
    fluid_restriction: str | None = Field(
        default=None,
        description="Fluid intake restriction, if present.",
    )
    warning_signs: list[str] = Field(
        default_factory=list,
        description="Symptoms that should prompt the patient to seek care.",
    )
    follow_ups: list[FollowUp] = Field(
        default_factory=list,
        description="Scheduled follow-up appointments.",
    )
    other_instructions: str | None = Field(
        default=None,
        description="Any other clinically relevant instructions not captured above.",
    )
    missing_fields: list[str] = Field(
        default_factory=list,
        description=(
            "Field names that were expected but not found or could not be verified "
            "in the source document."
        ),
    )


# ---------------------------------------------------------------------------
# Simplified patient plan
# ---------------------------------------------------------------------------


class MedicationScheduleSlot(StrEnum):
    MORNING = "sabah"
    NOON = "öğle"
    EVENING = "akşam"
    NIGHT = "gece"


class SimplifiedMedication(BaseModel):
    name: str
    dose_text: str
    slots: list[MedicationScheduleSlot]
    timing_text: str | None = None
    purpose: str | None = None
    source_span: SourceSpan


class SimplifiedPlan(BaseModel):
    """Patient-facing plain-Turkish summary produced by the Simplification step."""

    daily_schedule: list[SimplifiedMedication] = Field(
        default_factory=list,
        description="Medications organised by time-of-day slot.",
    )
    daily_routine: list[str] = Field(
        default_factory=list,
        description="Non-medication daily tasks (weight check, fluid log, etc.).",
    )
    warning_signs: list[str] = Field(
        default_factory=list,
        description="Plain-language warning signs the patient must watch for.",
    )
    follow_ups: list[str] = Field(
        default_factory=list,
        description="Follow-up reminders in plain language.",
    )
    disclaimer: str = Field(
        default=(
            "Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; "
            "sorunuz varsa hekiminize danışın."
        ),
    )


# ---------------------------------------------------------------------------
# Questions & answer evaluation
# ---------------------------------------------------------------------------


class QuestionType(StrEnum):
    OPEN = "open"
    YES_NO = "yes_no"
    MULTIPLE_CHOICE = "multiple_choice"


class Criticality(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Question(BaseModel):
    id: str = Field(description="Unique question identifier, e.g. 'q_weight_monitoring'.")
    type: QuestionType
    text: str = Field(description="The question text shown to the patient (plain Turkish).")
    expected_points: list[str] = Field(
        description="Key concepts that a correct answer should mention."
    )
    linked_item: str = Field(
        description="Which DischargeInfo field this question targets."
    )
    criticality: Criticality = Criticality.MEDIUM


class Verdict(StrEnum):
    CORRECT = "correct"
    PARTIAL = "partial"
    INCORRECT = "incorrect"
    UNCLEAR = "unclear"


class AnswerEvaluation(BaseModel):
    question_id: str
    verdict: Verdict
    matched_points: list[str] = Field(
        description="Which expected_points were present in the patient answer."
    )
    missing_points: list[str] = Field(
        description="Which expected_points were absent."
    )
    raw_answer: str = Field(description="The patient's verbatim answer.")


# ---------------------------------------------------------------------------
# Risk report
# ---------------------------------------------------------------------------


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ItemRisk(BaseModel):
    linked_item: str
    question_id: str
    verdict: Verdict
    criticality: Criticality
    weighted_score: Annotated[float, Field(ge=0.0, le=1.0)]


class RiskReport(BaseModel):
    """Final output of the pipeline – sent to the staff panel."""

    case_id: str
    item_risks: list[ItemRisk] = Field(default_factory=list)
    overall_score: Annotated[int, Field(ge=0, le=100)] = Field(
        description="0 = perfect understanding, 100 = no understanding."
    )
    level: RiskLevel
    abstained: bool = Field(
        default=False,
        description="True when the system cannot reliably score (e.g. too many unclear answers).",
    )
    reasons: list[str] = Field(
        default_factory=list,
        description="Human-readable explanation of the score.",
    )
    suggested_staff_action: str = Field(
        default="",
        description="Recommended next step for the nurse or physician.",
    )
