"""Kidney failure / Nephrology specific extraction schema and data models."""

from app.core.schemas.models import DischargeInfo


class KidneyFailureDischargeInfo(DischargeInfo):
    """
    Chronic Kidney Disease (CKD / KBY) specific discharge information schema.

    Inherits core fields:
    - diagnosis_text
    - medications
    - daily_weight_monitoring
    - sodium_restriction
    - fluid_restriction
    - warning_signs
    - follow_ups
    - other_instructions
    - missing_fields

    Adds renal-specific parameters:
    - egfr
    - creatinine
    - potassium_level
    - dialysis_status
    - phosphorus_restriction
    - potassium_restriction
    - fistula_care
    """

    egfr: str | None = None
    creatinine: str | None = None
    potassium_level: str | None = None
    dialysis_status: str | None = None
    phosphorus_restriction: str | None = None
    potassium_restriction: str | None = None
    fistula_care: str | None = None
