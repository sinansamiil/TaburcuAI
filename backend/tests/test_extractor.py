"""Unit tests for extractor module (end-to-end extraction with Mock LLM)."""

import pytest

from app.core.llm.mock import MockLLMClient
from app.core.pipeline.extractor import ExtractionError, extract_discharge_info
from app.diseases.heart_failure import HeartFailureModule


def test_extract_discharge_info_success() -> None:
    source_text = """
    TANI: Konjestif Kalp Yetmezliği
    TEDAVİ:
    - Lasix 40 mg tablet, sabah 1 adet aç karnına.
    ÖNERİLER:
    - Her gün sabah aç karnına tartılınız.
    - Günlük 1.5 litreden fazla sıvı tüketmeyiniz.
    - Nefes darlığı artarsa hemen acile başvurunuz.
    - 2 hafta sonra kardiyoloji poliklinik kontrolü.
    """

    mock_llm = MockLLMClient()
    mock_data = {
        "diagnosis_text": "Konjestif Kalp Yetmezliği",
        "medications": [
            {
                "name": "Lasix",
                "purpose": "Ödem tedavisi",
                "dose_text": "40 mg",
                "frequency_text": "günde 1",
                "timing_text": "sabah aç karnına",
                "source_span": {"text": "Lasix 40 mg tablet, sabah 1 adet aç karnına."},
            }
        ],
        "daily_weight_monitoring": "Her gün sabah aç karnına tartılınız.",
        "fluid_restriction": "Günlük 1.5 litreden fazla sıvı tüketmeyiniz.",
        "warning_signs": ["Nefes darlığı artarsa hemen acile başvurunuz."],
        "follow_ups": [
            {
                "when_text": "2 hafta sonra",
                "with_whom": "kardiyoloji poliklinik kontrolü",
                "purpose": "kontrol",
                "source_span": {"text": "2 hafta sonra kardiyoloji poliklinik kontrolü."},
            }
        ],
    }

    mock_llm.register_json_response("kalp yetmezliği", mock_data)
    module = HeartFailureModule()

    result = extract_discharge_info(source_text, module, mock_llm)

    assert result.diagnosis_text == "Konjestif Kalp Yetmezliği"
    assert len(result.medications) == 1
    assert result.medications[0].name == "Lasix"
    assert result.medications[0].source_span.start is not None
    assert result.medications[0].source_span.end is not None
    assert len(result.follow_ups) == 1
    assert result.follow_ups[0].source_span.start is not None


def test_extract_discharge_info_empty_text_error() -> None:
    mock_llm = MockLLMClient()
    module = HeartFailureModule()

    with pytest.raises(ExtractionError, match="boş olamaz"):
        extract_discharge_info("   ", module, mock_llm)


def test_extract_discharge_info_invalid_schema_error() -> None:
    mock_llm = MockLLMClient(default_json={"invalid_field": 123})
    module = HeartFailureModule()

    with pytest.raises(ExtractionError, match="validation error"):
        extract_discharge_info("Kalp yetmezliği taburculuk özeti", module, mock_llm)
