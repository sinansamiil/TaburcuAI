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
    patient_name: str | None = Field(default=None, description="Hasta adı soyadı (personel panelinde maskelenir).")
    protocol_no: str | None = Field(default=None, description="Epikriz protokol numarası.")
    ward: str | None = Field(default=None, description="Servis / yatak bilgisi.")


class GDMTItem(BaseModel):
    pillar_id: str
    name: str
    short_name: str
    guideline_class: str
    target: str
    status: str
    matched_drug: str | None = None
    matched_category: str | None = None
    clinical_note: str


class ClinicalPhenotype(BaseModel):
    ejection_fraction: str | None = None
    ef_value: int | None = None
    phenotype: str | None = None
    phenotype_code: str | None = None
    nyha_class: str | None = None
    dry_weight: str | None = None


class GDMTAnalysis(BaseModel):
    pillars_met: int
    total_pillars: int
    score_percent: int
    compliance_level: str
    badge_variant: str
    pillars: list[GDMTItem]
    loop_diuretic_prescribed: bool
    loop_diuretic_drug: str | None = None
    clinical_recommendations: list[str]


class CaseResponse(BaseModel):
    id: str
    disease: str
    raw_text: str
    discharge_info: DischargeInfo
    simplified_plan: SimplifiedPlan
    created_at: datetime
    phenotype: ClinicalPhenotype | None = None
    gdmt: GDMTAnalysis | None = None


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


class VerdictCounts(BaseModel):
    correct: int = 0
    partial: int = 0
    incorrect: int = 0
    unclear: int = 0
    unanswered: int = 0


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
    # Human-readable identity (instead of raw UUID)
    protocol_no: str = ""
    patient_display: str | None = None
    ward: str | None = None
    diagnosis_text: str | None = None
    workflow_status: str = "pending"
    verdict_counts: VerdictCounts = Field(default_factory=VerdictCounts)


class StaffCasesResponse(BaseModel):
    total: int
    cases: list[StaffCaseSummary]


class TranscriptItem(BaseModel):
    question_id: str
    question_text: str
    linked_item: str
    criticality: str
    expected_points: list[str]
    patient_answer: str | None = None
    verdict: str | None = None
    matched_points: list[str] = Field(default_factory=list)
    missing_points: list[str] = Field(default_factory=list)
    answered_at: datetime | None = None


class MedReconItem(BaseModel):
    name: str
    dose_text: str
    frequency_text: str
    timing_text: str | None = None
    source_text: str | None = None
    name_found: bool
    dose_found: bool
    status: str  # verified | partial | not_found


class UnextractedDrug(BaseModel):
    generic: str
    matched_alias: str
    context: str | None = None


class MedReconciliation(BaseModel):
    items: list[MedReconItem]
    unextracted: list[UnextractedDrug]


class WorkflowEvent(BaseModel):
    action: str
    label: str
    note: str | None = None
    author: str
    at: datetime


class WorkflowInfo(BaseModel):
    protocol_no: str
    patient_name: str | None = None
    patient_display: str | None = None
    ward: str | None = None
    status: str
    contacted: bool
    education_status: str | None = None
    closed: bool
    events: list[WorkflowEvent]


class StaffCaseReview(BaseModel):
    case: CaseResponse
    workflow: WorkflowInfo
    transcript: list[TranscriptItem]
    reconciliation: MedReconciliation
    phenotype: ClinicalPhenotype | None = None
    gdmt: GDMTAnalysis | None = None
    risk_report: RiskReport | None = None
    emergency_triggered: bool = False
    emergency_message: str | None = None


class StaffActionRequest(BaseModel):
    action: str = Field(description="contacted | education_planned | education_done | closed | reopened | note")
    note: str | None = None
    author: str | None = None


# ---------------------------------------------------------------------------
# Modular Management & Hospital Customization Schemas
# ---------------------------------------------------------------------------


class DoctorCreate(BaseModel):
    name: str
    title: str = "Uzman Doktor"
    specialty: str
    email: str | None = None
    phone: str | None = None
    room: str | None = None
    is_active: bool = True


class DoctorUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    specialty: str | None = None
    email: str | None = None
    phone: str | None = None
    room: str | None = None
    is_active: bool | None = None


class DoctorResponse(BaseModel):
    id: str
    name: str
    title: str
    specialty: str
    email: str | None = None
    phone: str | None = None
    room: str | None = None
    is_active: bool
    created_at: datetime


class NurseCreate(BaseModel):
    name: str
    title: str = "Servis Hemşiresi"
    ward: str
    shift: str = "Gündüz (08:00 - 16:00)"
    phone: str | None = None
    is_active: bool = True


class NurseUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    ward: str | None = None
    shift: str | None = None
    phone: str | None = None
    is_active: bool | None = None


class NurseResponse(BaseModel):
    id: str
    name: str
    title: str
    ward: str
    shift: str
    phone: str | None = None
    is_active: bool
    created_at: datetime


class PatientCreate(BaseModel):
    protocol_no: str
    tc_kimlik: str
    name: str
    age: int | None = None
    phone: str | None = None
    ward: str | None = None
    assigned_doctor: str | None = None
    primary_disease: str = "kidney_failure"
    notes: str | None = None


class PatientUpdate(BaseModel):
    protocol_no: str | None = None
    tc_kimlik: str | None = None
    name: str | None = None
    age: int | None = None
    phone: str | None = None
    ward: str | None = None
    assigned_doctor: str | None = None
    primary_disease: str | None = None
    notes: str | None = None


class PatientResponse(BaseModel):
    id: str
    protocol_no: str
    tc_kimlik: str
    name: str
    age: int | None = None
    phone: str | None = None
    ward: str | None = None
    assigned_doctor: str | None = None
    primary_disease: str
    notes: str | None = None
    created_at: datetime


class PatientHistoryCaseItem(BaseModel):
    case_id: str
    disease: str
    disease_name: str
    diagnosis_text: str | None = None
    created_at: datetime
    risk_level: str | None = None
    overall_score: int | None = None
    workflow_status: str | None = None


class PatientHistoryResponse(BaseModel):
    patient: PatientResponse | None = None
    cases: list[PatientHistoryCaseItem]


class HospitalConfigResponse(BaseModel):
    id: str = "default"
    hospital_name: str
    hospital_subtitle: str
    logo_icon: str
    logo_url: str | None = None
    primary_color: str
    accent_color: str
    phone: str
    emergency_phone: str
    address: str
    email: str
    active_departments: list[str]
    custom_disclaimer: str
    updated_at: datetime


class HospitalConfigUpdate(BaseModel):
    hospital_name: str | None = None
    hospital_subtitle: str | None = None
    logo_icon: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    phone: str | None = None
    emergency_phone: str | None = None
    address: str | None = None
    email: str | None = None
    active_departments: list[str] | None = None
    custom_disclaimer: str | None = None


class DiseaseConfigCreate(BaseModel):
    id: str
    name: str
    specialty: str
    icon: str = "🩺"
    status: str = "active"
    description: str = ""
    version: str = "1.0.0"
    is_custom: bool = True
    guideline_notes: str | None = None


class DiseaseConfigResponse(BaseModel):
    id: str
    name: str
    specialty: str
    icon: str
    status: str
    description: str
    version: str
    is_custom: bool
    question_count: int = 0
    created_at: datetime | None = None
