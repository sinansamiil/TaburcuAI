"""Pydantic API request and response schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.core.schemas.models import (
    AnswerEvaluation,
    DischargeInfo,
    Question,
    RiskReport,
    SimplifiedPlan,
)


class CreateCaseRequest(BaseModel):
    raw_text: str = Field(description="Raw Turkish discharge summary (epikriz metni).")
    disease: str = Field(default="heart_failure", description="Disease identifier.")


class CaseResponse(BaseModel):
    id: str
    disease: str
    raw_text: str
    discharge_info: DischargeInfo
    simplified_plan: SimplifiedPlan
    created_at: datetime


class QuestionsResponse(BaseModel):
    case_id: str
    questions: list[Question]


class SubmitAnswerItem(BaseModel):
    question_id: str
    answer: str


class SubmitAnswersRequest(BaseModel):
    answers: list[SubmitAnswerItem]


class SubmitAnswersResponse(BaseModel):
    case_id: str
    evaluations: list[AnswerEvaluation]
    risk_report: RiskReport
    emergency_triggered: bool
    emergency_message: str | None = None


class StaffCaseSummary(BaseModel):
    case_id: str
    disease: str
    created_at: datetime
    overall_score: int | None = None
    level: str | None = None
    reasons: list[str] = Field(default_factory=list)
    suggested_staff_action: str | None = None
    emergency_triggered: bool = False
    has_risk_report: bool = False


class StaffCasesResponse(BaseModel):
    total: int
    cases: list[StaffCaseSummary]
