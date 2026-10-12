"""
Cases API endpoints:
- POST /api/v1/cases: Extract, verify, simplify, and store case.
- GET /api/v1/cases/{case_id}: Fetch case details and simplified plan.
- POST /api/v1/cases/{case_id}/questions: Generate and persist teach-back questions.
- POST /api/v1/cases/{case_id}/answers: Evaluate answers and produce risk report.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas import (
    CaseResponse,
    CreateCaseRequest,
    QuestionsResponse,
    SubmitAnswersRequest,
    SubmitAnswersResponse,
)
from app.core.llm import get_llm_client
from app.core.pipeline import (
    calculate_risk_report,
    check_emergency_symptoms,
    evaluate_single_answer,
    extract_discharge_info,
    generate_questions_for_case,
    simplify_discharge_plan,
)
from app.core.schemas.models import AnswerEvaluation, DischargeInfo, Question, SimplifiedPlan
from app.db.models import CaseModel, QuestionModel, RiskReportModel
from app.db.session import get_db
from app.diseases.heart_failure import HeartFailureModule

router = APIRouter(prefix="/cases", tags=["Cases"])


def get_disease_module(disease_id: str):
    """Retrieve disease module by ID (currently heart_failure)."""
    if disease_id == "heart_failure":
        return HeartFailureModule()
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Desteklenmeyen hastalık modülü: {disease_id}",
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(payload: CreateCaseRequest, db: Session = Depends(get_db)):
    """Extract clinical info from discharge summary, simplify, and store in database."""
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Taburculuk metni boş olamaz.")

    disease_mod = get_disease_module(payload.disease)
    llm = get_llm_client()

    try:
        discharge_info = extract_discharge_info(
            discharge_text=payload.raw_text,
            disease_module=disease_mod,
            llm_client=llm,
            verify=True,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Çıkarma işlemi başarısız oldu: {exc}",
        ) from exc

    simplified = simplify_discharge_plan(discharge_info)

    db_case = CaseModel(
        disease=payload.disease,
        raw_text=payload.raw_text,
        discharge_info=discharge_info.model_dump(),
        simplified_plan=simplified.model_dump(),
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)

    return CaseResponse(
        id=db_case.id,
        disease=db_case.disease,
        raw_text=db_case.raw_text,
        discharge_info=discharge_info,
        simplified_plan=simplified,
        created_at=db_case.created_at,
    )


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    """Fetch case details and simplified plan by ID."""
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı.")

    discharge_info = DischargeInfo.model_validate(db_case.discharge_info)
    simplified_plan = SimplifiedPlan.model_validate(db_case.simplified_plan)

    return CaseResponse(
        id=db_case.id,
        disease=db_case.disease,
        raw_text=db_case.raw_text,
        discharge_info=discharge_info,
        simplified_plan=simplified_plan,
        created_at=db_case.created_at,
    )


@router.post("/{case_id}/questions", response_model=QuestionsResponse)
def generate_questions(case_id: str, db: Session = Depends(get_db)):
    """Generate or retrieve teach-back questions for this case."""
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı.")

    # Return existing questions if already generated
    existing = db.query(QuestionModel).filter(QuestionModel.case_id == case_id).all()
    if existing:
        return QuestionsResponse(
            case_id=case_id,
            questions=[
                Question(
                    id=q.id,
                    type=q.question_type,  # type: ignore
                    text=q.text,
                    expected_points=q.expected_points,
                    linked_item=q.linked_item,
                    criticality=q.criticality,  # type: ignore
                )
                for q in existing
            ],
        )

    disease_mod = get_disease_module(db_case.disease)
    discharge_info = DischargeInfo.model_validate(db_case.discharge_info)
    generated = generate_questions_for_case(discharge_info, disease_mod)

    # Persist questions
    for q in generated:
        q_record = QuestionModel(
            id=f"{case_id}_{q.id}",
            case_id=case_id,
            question_type=q.type.value,
            text=q.text,
            expected_points=q.expected_points,
            linked_item=q.linked_item,
            criticality=q.criticality.value,
        )
        db.add(q_record)

    db.commit()

    return QuestionsResponse(
        case_id=case_id,
        questions=generated,
    )


@router.post("/{case_id}/answers", response_model=SubmitAnswersResponse)
def submit_answers(
    case_id: str,
    payload: SubmitAnswersRequest,
    db: Session = Depends(get_db),
):
    """Evaluate submitted patient answers and compute clinical risk report."""
    db_case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Vaka bulunamadı.")

    questions_db = db.query(QuestionModel).filter(QuestionModel.case_id == case_id).all()
    if not questions_db:
        raise HTTPException(status_code=400, detail="Bu vaka için henüz soru üretilmemiş.")

    disease_mod = get_disease_module(db_case.disease)
    q_map = {q.id: q for q in questions_db}
    # Also support matching by original question template ID (e.g. q_hf_daily_weight)
    for q in questions_db:
        orig_id = q.id.replace(f"{case_id}_", "")
        q_map[orig_id] = q

    evaluations: list[AnswerEvaluation] = []
    questions_list: list[Question] = []
    emergency_triggered = False
    emergency_msg: str | None = None

    now = datetime.now(UTC)

    for item in payload.answers:
        q_record = q_map.get(item.question_id)
        if not q_record:
            continue

        q_obj = Question(
            id=q_record.id,
            type=q_record.question_type,  # type: ignore
            text=q_record.text,
            expected_points=q_record.expected_points,
            linked_item=q_record.linked_item,
            criticality=q_record.criticality,  # type: ignore
        )
        questions_list.append(q_obj)

        # Safety emergency check
        is_emerg, msg = check_emergency_symptoms(item.answer)
        if is_emerg:
            emergency_triggered = True
            emergency_msg = msg

        eval_res = evaluate_single_answer(q_obj, item.answer)
        evaluations.append(eval_res)

        # Update DB question record
        q_record.patient_answer = item.answer
        q_record.verdict = eval_res.verdict.value
        q_record.matched_points = eval_res.matched_points
        q_record.missing_points = eval_res.missing_points
        q_record.answered_at = now

    # Ensure all case questions are represented in evaluation
    for q_record in questions_db:
        if not any(q.id == q_record.id for q in questions_list):
            q_obj = Question(
                id=q_record.id,
                type=q_record.question_type,  # type: ignore
                text=q_record.text,
                expected_points=q_record.expected_points,
                linked_item=q_record.linked_item,
                criticality=q_record.criticality,  # type: ignore
            )
            questions_list.append(q_obj)

    risk_rep = calculate_risk_report(
        case_id=case_id,
        questions=questions_list,
        evaluations=evaluations,
        disease_module=disease_mod,
    )

    if emergency_triggered:
        risk_rep.level = risk_rep.level.__class__.HIGH
        risk_rep.reasons.insert(0, "ACİL DURUM BELİRTİSİ BİLDİRİLDİ: Hasta acil servise yönlendirildi.")

    # Save or update risk report in DB
    existing_rep = db.query(RiskReportModel).filter(RiskReportModel.case_id == case_id).first()
    if existing_rep:
        db.delete(existing_rep)

    db_risk = RiskReportModel(
        case_id=case_id,
        overall_score=risk_rep.overall_score,
        level=risk_rep.level.value,
        abstained=risk_rep.abstained,
        reasons=risk_rep.reasons,
        suggested_staff_action=risk_rep.suggested_staff_action,
        item_risks=[item.model_dump() for item in risk_rep.item_risks],
        emergency_triggered=emergency_triggered,
        emergency_message=emergency_msg,
    )
    db.add(db_risk)
    db.commit()

    return SubmitAnswersResponse(
        case_id=case_id,
        evaluations=evaluations,
        risk_report=risk_rep,
        emergency_triggered=emergency_triggered,
        emergency_message=emergency_msg,
    )
