"""Unit tests for synthetic dataset generation."""

import json
from pathlib import Path

from app.diseases.heart_failure.schema import HeartFailureDischargeInfo
from scripts.generate_synthetic import generate_dataset, generate_single_case


def test_generate_single_case_structure() -> None:
    text, gt = generate_single_case(case_idx=1, seed=123)

    assert "HACETTEPE ÜNİVERSİTESİ" in text
    assert gt["case_id"] == "synthetic_hf_001"
    assert gt["disease"] == "heart_failure"
    assert len(gt["medications"]) >= 2

    # Verify that ground truth validates against the HeartFailureDischargeInfo model
    validated = HeartFailureDischargeInfo.model_validate(gt)
    assert validated.diagnosis_text == gt["diagnosis_text"]
    assert len(validated.medications) == len(gt["medications"])

    # Check that source_spans actually exist in text
    for med in gt["medications"]:
        span_text = med["source_span"]["text"]
        assert span_text in text
        start = med["source_span"]["start"]
        end = med["source_span"]["end"]
        assert text[start:end] == span_text


def test_generate_dataset_runs_and_creates_files(tmp_path: Path) -> None:
    generate_dataset(output_dir=tmp_path, count=5, seed=99)

    index_file = tmp_path / "index.json"
    assert index_file.exists()

    with index_file.open(encoding="utf-8") as f:
        records = json.load(f)
    assert len(records) == 5

    summaries = list((tmp_path / "summaries").glob("*.txt"))
    ground_truths = list((tmp_path / "ground_truth").glob("*.json"))
    assert len(summaries) == 5
    assert len(ground_truths) == 5
