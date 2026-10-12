"""Staff API endpoints: lists cases prioritized by risk level."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.schemas import StaffCasesResponse, StaffCaseSummary
from app.db.models import CaseModel, RiskReportModel
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
            )
        )

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
