"""Heart failure disease module package."""

from app.diseases.heart_failure.module import HeartFailureModule
from app.diseases.heart_failure.schema import HeartFailureDischargeInfo

__all__ = [
    "HeartFailureDischargeInfo",
    "HeartFailureModule",
]
