"""Type 2 Diabetes specific schema and data models."""

from app.core.schemas.models import DischargeInfo


class DiabetesDischargeInfo(DischargeInfo):
    hba1c: str | None = None
    fasting_glucose_target: str | None = None
    postprandial_glucose_target: str | None = None
    hypoglycemia_plan: str | None = None
    foot_care_instructions: str | None = None
