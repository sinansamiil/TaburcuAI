"""Unit tests for evaluation script."""

from pathlib import Path

from scripts.evaluate import calculate_atesman_readability, evaluate_dataset


def test_calculate_atesman_readability() -> None:
    easy_text = "Ali topu at. Ayşe eve gel. Bugün hava çok güzel."
    hard_text = (
        "Miyokardiyal kontraktilite disfonksiyonuna ikincil hemodinamik dekompansasyon "
        "tablosunda kardiyorespiratuvar parametrelerin optimizasyonu esastır."
    )

    score_easy = calculate_atesman_readability(easy_text)
    score_hard = calculate_atesman_readability(hard_text)

    # Easy Turkish text should have a higher readability score than dense medical jargon
    assert score_easy > score_hard
    assert score_easy > 60.0
    assert score_hard < 60.0


def test_evaluate_dataset_runs() -> None:
    data_dir = Path(__file__).parents[2] / "data" / "synthetic"
    if not (data_dir / "summaries").exists():
        return

    # Run on a subset of 3 cases
    results = evaluate_dataset(data_dir, max_cases=3)
    assert results["cases_evaluated"] == 3
    assert "medication_metrics" in results
    assert results["medication_metrics"]["precision"] >= 0.9
    assert results["medication_metrics"]["hallucination_rate"] == 0.0
    assert results["verification_metrics"]["span_accuracy"] == 1.0
