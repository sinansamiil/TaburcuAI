"""
Extractor module combining LLM extraction and verification.

Pipeline Step 1 & 2:
1. Extraction: Calls LLM with disease-specific prompt and validates with Pydantic.
2. Verification: Checks source_spans, numbers, and offsets against the original text.
"""

from typing import Any

from app.core.llm.base import LLMClient
from app.core.pipeline.verifier import verify_discharge_info
from app.core.schemas.models import DischargeInfo
from app.diseases.base import DiseaseModule


class ExtractionError(Exception):
    """Raised when extraction fails or produces invalid data."""


def extract_discharge_info(
    discharge_text: str,
    disease_module: DiseaseModule,
    llm_client: LLMClient,
    *,
    verify: bool = True,
) -> DischargeInfo:
    """
    Extract structured discharge info from raw clinical text using the given disease module and LLM.

    Steps:
    1. Generate JSON using the disease module's extraction prompt and schema.
    2. Validate with the module's extraction_schema (Pydantic).
    3. Run verification against the source document (spans, offsets, numbers).
    """
    if not discharge_text or not discharge_text.strip():
        raise ExtractionError("Taburculuk metni boş olamaz.")

    prompt = disease_module.extraction_prompt(discharge_text)
    schema_cls = disease_module.extraction_schema

    # Convert Pydantic schema class to JSON schema dict if supported
    json_schema: dict[str, Any] = {}
    if hasattr(schema_cls, "model_json_schema"):
        json_schema = schema_cls.model_json_schema()

    try:
        raw_json = llm_client.generate_json(prompt, schema=json_schema, temperature=0.0)
    except Exception as exc:
        raise ExtractionError(f"LLM extraction error: {exc}") from exc

    try:
        parsed_info = schema_cls.model_validate(raw_json)
    except Exception as exc:
        raise ExtractionError(f"Pydantic schema validation error: {exc}") from exc

    if not isinstance(parsed_info, DischargeInfo):
        raise ExtractionError("Extraction schema must produce a DischargeInfo instance.")

    if verify:
        return verify_discharge_info(parsed_info, original_text=discharge_text)

    return parsed_info
