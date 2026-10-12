"""Heart failure specific extraction schema and data models."""

from app.core.schemas.models import DischargeInfo


class HeartFailureDischargeInfo(DischargeInfo):
    """
    Heart failure specific discharge information schema.

    Inherits all core extraction fields:
    - diagnosis_text
    - medications (name, purpose, dose_text, frequency_text, timing_text, source_span)
    - daily_weight_monitoring
    - sodium_restriction
    - fluid_restriction
    - warning_signs
    - follow_ups
    - other_instructions
    - missing_fields
    """

    pass
