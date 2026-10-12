"""Unit tests for the LLM interface, mock client, and factory."""

import pytest

from app.core.llm.base import LLMResponseError
from app.core.llm.factory import get_llm_client
from app.core.llm.mock import MockLLMClient


def test_mock_llm_registered_json() -> None:
    client = MockLLMClient()
    expected_data = {"diagnosis_text": "Kalp yetmezliği"}
    client.register_json_response("epikriz", expected_data)

    res = client.generate_json("Lütfen epikriz özetini çıkar", schema={})
    assert res == expected_data
    assert client.json_call_count == 1


def test_mock_llm_default_json_and_text() -> None:
    client = MockLLMClient(default_json={"status": "default"}, default_text="default text")
    res_json = client.generate_json("Bilinmeyen prompt", schema={})
    res_text = client.generate_text("Bilinmeyen prompt")

    assert res_json == {"status": "default"}
    assert res_text == "default text"


def test_mock_llm_raise_on_unmatched() -> None:
    client = MockLLMClient(raise_on_unmatched=True)
    with pytest.raises(LLMResponseError):
        client.generate_json("Eşleşmeyen metin", schema={})


def test_get_llm_client_factory() -> None:
    client = get_llm_client("mock")
    assert isinstance(client, MockLLMClient)
    assert client.provider_name == "mock"

    with pytest.raises(ValueError, match="Unsupported LLM provider"):
        get_llm_client("non_existent_provider")
