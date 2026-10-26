"""COPD / Respiratory specific schema."""

from app.core.schemas.models import DischargeInfo


class COPDDischargeInfo(DischargeInfo):
    gold_stage: str | None = None
    fev1_percent: str | None = None
    oxygen_flow_rate: str | None = None
    inhaler_devices: list[str] = []
