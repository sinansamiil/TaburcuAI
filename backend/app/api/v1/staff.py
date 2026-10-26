"""Staff API endpoints: lists cases prioritized by risk level and provides full clinical case review."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas import (
    CaseResponse,
    MedReconciliation,
    MedReconItem,
    StaffActionRequest,
    StaffCaseReview,
    StaffCasesResponse,
    StaffCaseSummary,
    TranscriptItem,
    UnextractedDrug,
    VerdictCounts,
    WorkflowEvent,
    WorkflowInfo,
)
from app.core.schemas.models import DischargeInfo, RiskReport, SimplifiedPlan
from app.core.workflow import (
    apply_action,
    ensure_workflow,
    mask_name,
    reconcile_medications,
)
from app.db.models import CaseModel, QuestionModel, RiskReportModel
from app.db.session import get_db

router = APIRouter(prefix="/staff", tags=["Staff"])

RISK_ORDER = {"high": 0, "medium": 1, "low": 2}


@router.get("/cases", response_model=StaffCasesResponse)
def list_staff_cases(db: Session = Depends(get_db)):
    """
    List all cases for clinical staff, prioritized by risk level:
    HIGH risk cases first, then MEDIUM, then LOW, then unscored.
    """
    cases = db.query(CaseModel).all()

    summaries: list[StaffCaseSummary] = []
    for c in cases:
        rep: RiskReportModel | None = c.risk_report
        wf = ensure_workflow(db, c, commit=False)

        # Count questions / verdicts
        v_counts = VerdictCounts()
        for q in c.questions:
            if not q.patient_answer:
                v_counts.unanswered += 1
            elif q.verdict == "correct":
                v_counts.correct += 1
            elif q.verdict == "partial":
                v_counts.partial += 1
            elif q.verdict == "incorrect":
                v_counts.incorrect += 1
            else:
                v_counts.unclear += 1

        diagnosis = None
        if isinstance(c.discharge_info, dict):
            diagnosis = c.discharge_info.get("diagnosis_text")

        summaries.append(
            StaffCaseSummary(
                case_id=c.id,
                disease=c.disease,
                created_at=c.created_at,
                overall_score=rep.overall_score if rep else None,
                level=rep.level if rep else None,
                reasons=rep.reasons if rep else [],
                suggested_staff_action=rep.suggested_staff_action if rep else None,
                emergency_triggered=rep.emergency_triggered if rep else False,
                has_risk_report=rep is not None,
                protocol_no=wf.protocol_no,
                patient_display=mask_name(wf.patient_name) or "Anonim Hasta",
                ward=wf.ward or "Kardiyoloji Servisi",
                diagnosis_text=diagnosis,
                workflow_status=wf.status,
                verdict_counts=v_counts,
            )
        )

    db.commit()

    # Sort: high first (0), medium (1), low (2), unscored (3)
    summaries.sort(
        key=lambda s: (
            RISK_ORDER.get(s.level, 3) if s.level else 3,
            -s.created_at.timestamp(),
        )
    )

    return StaffCasesResponse(
        total=len(summaries),
        cases=summaries,
    )


@router.get("/cases/{case_id}/review", response_model=StaffCaseReview)
def get_case_review(case_id: str, db: Session = Depends(get_db)):
    """Fetch deep review of a case: case details, patient transcript, medication reconciliation, and workflow."""
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı.")

    wf = ensure_workflow(db, case, commit=True)
    rep: RiskReportModel | None = case.risk_report

    # Build transcript
    transcript_items: list[TranscriptItem] = []
    for q in case.questions:
        transcript_items.append(
            TranscriptItem(
                question_id=q.id,
                question_text=q.text,
                linked_item=q.linked_item,
                criticality=q.criticality,
                expected_points=q.expected_points or [],
                patient_answer=q.patient_answer,
                verdict=q.verdict,
                matched_points=q.matched_points or [],
                missing_points=q.missing_points or [],
                answered_at=q.answered_at,
            )
        )

    # Reconcile medications against raw epikriz text
    meds = (case.discharge_info or {}).get("medications", [])
    recon_raw = reconcile_medications(case.raw_text, meds)
    reconciliation = MedReconciliation(
        items=[MedReconItem(**item) for item in recon_raw["items"]],
        unextracted=[UnextractedDrug(**u) for u in recon_raw["unextracted"]],
    )

    # Format workflow events
    events = []
    for ev in wf.events or []:
        events.append(
            WorkflowEvent(
                action=ev.get("action", "action"),
                label=ev.get("label", "Aksiyon"),
                note=ev.get("note"),
                author=ev.get("author", "Personel"),
                at=ev.get("at"),
            )
        )

    workflow_info = WorkflowInfo(
        protocol_no=wf.protocol_no,
        patient_name=wf.patient_name,
        patient_display=mask_name(wf.patient_name) or "Anonim Hasta",
        ward=wf.ward,
        status=wf.status,
        contacted=wf.contacted,
        education_status=wf.education_status,
        closed=wf.closed,
        events=events,
    )

    phenotype = None
    gdmt = None
    if case.disease == "heart_failure":
        from app.diseases.heart_failure.gdmt import analyze_heart_failure_case
        diag_text = (case.discharge_info or {}).get("diagnosis_text", "")
        analysis = analyze_heart_failure_case(case.raw_text, meds, diag_text)
        phenotype = analysis["phenotype"]
        gdmt = analysis["gdmt"]

    case_res = CaseResponse(
        id=case.id,
        disease=case.disease,
        raw_text=case.raw_text,
        discharge_info=DischargeInfo.model_validate(case.discharge_info),
        simplified_plan=SimplifiedPlan.model_validate(case.simplified_plan) if case.simplified_plan else None,  # type: ignore
        created_at=case.created_at,
        phenotype=phenotype,
        gdmt=gdmt,
    )

    risk_report_obj = None
    if rep:
        risk_report_obj = RiskReport(
            case_id=rep.case_id,
            item_risks=rep.item_risks or [],
            overall_score=rep.overall_score,
            level=rep.level,  # type: ignore
            abstained=rep.abstained,
            reasons=rep.reasons or [],
            suggested_staff_action=rep.suggested_staff_action or "",
        )

    return StaffCaseReview(
        case=case_res,
        workflow=workflow_info,
        transcript=transcript_items,
        reconciliation=reconciliation,
        phenotype=phenotype,
        gdmt=gdmt,
        risk_report=risk_report_obj,
        emergency_triggered=rep.emergency_triggered if rep else False,
        emergency_message=rep.emergency_message if rep else None,
    )


@router.post("/cases/{case_id}/action", response_model=WorkflowInfo)
def perform_case_action(
    case_id: str,
    payload: StaffActionRequest,
    db: Session = Depends(get_db),
):
    """
    Perform workflow action on a case:
    - contacted: Mark patient/relative as contacted
    - education_planned: Set face-to-face education as planned
    - education_done: Mark education completed
    - closed: Close case
    - reopened: Reopen closed case
    - note: Add a clinical free-text note
    """
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı.")

    wf = ensure_workflow(db, case, commit=False)

    try:
        apply_action(
            wf,
            action=payload.action,
            note=payload.note,
            author=payload.author or "Klinik Personel",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    db.commit()
    db.refresh(wf)

    events = [
        WorkflowEvent(
            action=ev.get("action", "action"),
            label=ev.get("label", "Aksiyon"),
            note=ev.get("note"),
            author=ev.get("author", "Personel"),
            at=ev.get("at"),
        )
        for ev in wf.events or []
    ]

    return WorkflowInfo(
        protocol_no=wf.protocol_no,
        patient_name=wf.patient_name,
        patient_display=mask_name(wf.patient_name) or "Anonim Hasta",
        ward=wf.ward,
        status=wf.status,
        contacted=wf.contacted,
        education_status=wf.education_status,
        closed=wf.closed,
        events=events,
    )
