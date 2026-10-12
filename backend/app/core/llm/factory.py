"""Factory function for creating an LLMClient instance based on configuration."""

import re
from typing import Any

from app.core.config import settings
from app.core.llm.base import LLMClient
from app.core.llm.mock import MockLLMClient
from app.core.llm.openai_adapter import OpenAILLMClient


def create_heuristic_mock_client() -> MockLLMClient:
    """
    Return a MockLLMClient with dynamic heuristic extraction for development/demo.
    If no registered response matches, it parses heart failure details directly from the text.
    """
    client = MockLLMClient()

    # Dynamic fallback generator for heart failure discharge summaries
    def heuristic_extractor(prompt: str) -> dict[str, Any]:
        # Extract diagnosis
        diag = "Konjestif Kalp Yetmezliği"
        if "tanı:" in prompt.lower():
            match = re.search(r"tanı:\s*([^\n\r]+)", prompt, re.IGNORECASE)
            if match:
                diag = match.group(1).strip()

        # Extract medications
        meds = []
        for line in prompt.splitlines():
            line_str = line.strip()
            if line_str.startswith("-") and any(
                drug in line_str.lower()
                for drug in ["lasix", "desal", "beloc", "concor", "dilatrend", "entresto", "delix", "aldactone"]
            ):
                clean_line = line_str.lstrip("- ").strip()
                # Parse drug name
                name_match = re.match(r"^([A-Za-z0-9\(\)\s/]+?)(?:\s+(\d+(?:[.,/]\d+)?\s*(?:mg|mcg|ml)?))?:", clean_line)
                name = name_match.group(1).strip() if name_match else clean_line.split(":")[0].strip()
                dose = name_match.group(2).strip() if (name_match and name_match.group(2)) else "standart doz"

                # Sıklık ve zamanlama
                freq = "günde 1 kez"
                if "günde 2" in clean_line.lower() or "2 tablet" in clean_line.lower():
                    freq = "günde 2 kez"

                timing = "sabah"
                if "sabah ve akşam" in clean_line.lower():
                    timing = "sabah ve akşam"
                elif "tok" in clean_line.lower():
                    timing = "sabah tok karnına"
                elif "aç" in clean_line.lower():
                    timing = "sabah aç karnına"

                meds.append({
                    "name": name,
                    "purpose": "Kalp yetmezliği medikal tedavisi",
                    "dose_text": dose,
                    "frequency_text": freq,
                    "timing_text": timing,
                    "source_span": {"text": clean_line},
                })

        if not meds:
            # Fallback medication if none regex-matched
            meds.append({
                "name": "Lasix 40 mg",
                "purpose": "Ödem ve sıvı atılımı",
                "dose_text": "40 mg",
                "frequency_text": "günde 1 kez",
                "timing_text": "sabah aç karnına",
                "source_span": {"text": "Lasix 40 mg: günde 1 kez sabah aç karnına."},
            })

        # Extract weight monitoring
        weight = None
        for line in prompt.splitlines():
            if "kilo" in line.lower() or "tartı" in line.lower():
                clean = line.strip().lstrip("- ").strip()
                if "kilo takibi:" in clean.lower():
                    clean = clean.split(":", 1)[1].strip()
                weight = clean
                break

        # Extract fluid & sodium
        fluid = None
        sodium = None
        for line in prompt.splitlines():
            if "sıvı" in line.lower():
                fluid = line.strip().lstrip("- ").strip().split(":", 1)[-1].strip()
            elif "tuz" in line.lower():
                sodium = line.strip().lstrip("- ").strip().split(":", 1)[-1].strip()

        # Warning signs
        warnings = []
        for line in prompt.splitlines():
            line_str = line.strip()
            if line_str.startswith("-") and any(
                w in line_str.lower() for w in ["nefes", "ödem", "şişlik", "kilo artışı", "göğüs"]
            ):
                warnings.append(line_str.lstrip("- ").strip())

        if not warnings:
            warnings = ["İstirahat halinde nefes darlığında artış", "Ayak bileklerinde ve bacaklarda şişlik"]

        # Follow up
        follow_ups = []
        for line in prompt.splitlines():
            if any(term in line.lower() for term in ["randevu", "kontrol", "poliklinik"]):
                clean = line.strip().lstrip("- ").strip()
                if not clean.startswith("KONTROL VE RANDEVU:"):
                    follow_ups.append({
                        "when_text": "10 gün sonra",
                        "with_whom": "Kardiyoloji Polikliniği",
                        "purpose": "EKO ve biyokimya kontrolü",
                        "source_span": {"text": clean},
                    })
                    break

        if not follow_ups:
            follow_ups.append({
                "when_text": "2 hafta sonra",
                "with_whom": "Kardiyoloji Polikliniği",
                "purpose": "Kontrol",
                "source_span": {"text": "2 hafta sonra poliklinik kontrolü."},
            })

        return {
            "diagnosis_text": diag,
            "medications": meds,
            "daily_weight_monitoring": weight,
            "sodium_restriction": sodium,
            "fluid_restriction": fluid,
            "warning_signs": warnings,
            "follow_ups": follow_ups,
            "other_instructions": None,
            "missing_fields": [],
        }

    # Override generate_json to use heuristic fallback when no substring matches
    def smart_generate_json(p: str, schema: dict[str, Any], *, temperature: float = 0.0, max_retries: int = 1):
        for sub, resp in client._json_responses:
            if sub.lower() in p.lower():
                return resp
        if client._default_json:
            return client._default_json
        return heuristic_extractor(p)

    client.generate_json = smart_generate_json  # type: ignore
    return client


def get_llm_client(provider: str | None = None) -> LLMClient:
    """Return an instantiated LLMClient based on provider name or settings."""
    active_provider = (provider or settings.llm_provider).lower()

    if active_provider == "mock":
        return create_heuristic_mock_client()
    elif active_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured in environment/.env")
        return OpenAILLMClient(api_key=settings.openai_api_key)
    else:
        raise ValueError(f"Unsupported LLM provider: {active_provider}")
