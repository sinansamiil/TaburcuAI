"""Pipeline sub-package – extraction, simplification, questions, scoring, risk."""

from app.core.pipeline.extractor import ExtractionError, extract_discharge_info
from app.core.pipeline.verifier import find_span_offsets, normalize_text, verify_discharge_info

__all__ = [
    "ExtractionError",
    "extract_discharge_info",
    "find_span_offsets",
    "normalize_text",
    "verify_discharge_info",
]
