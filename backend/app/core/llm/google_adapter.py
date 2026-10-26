"""
GoogleLLMClient – adapter for Google Gemini API via official google-genai SDK.

Provider selection: set LLM_PROVIDER=google in .env.
Requires: GOOGLE_API_KEY in .env.

Resilience:
- Tries a list of models in order. A model that returns 404 (retired / not
  available for this key) is skipped immediately.
- 503 (high demand) and 429 (rate limit) are retried with a short backoff,
  then the next model is tried.
"""

import json
import time
from typing import Any

from app.core.llm.base import LLMClient, LLMResponseError

# Models confirmed available for new API keys (models.list), cheapest first.
DEFAULT_MODEL_CHAIN = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]

DOCUMENT_TRANSCRIPTION_PROMPT = """Sen bir tıbbi belge transkripsiyon asistanısın.

Ekteki belge bir hastane taburculuk özeti (epikriz) veya reçete olabilir; fotoğraf ya da PDF olarak verilmiştir.

GÖREVİN:
Belgedeki metni HARFİ HARFİNE, Türkçe karakterleri koruyarak düz metin olarak yaz.

KURALLAR:
1. Hiçbir şeyi yorumlama, özetleme, düzeltme veya ekleme. Sadece belgede yazanı aktar.
2. Satır düzenini ve başlıkları koru. Madde işaretli listeleri "- " ile başlat.
3. İlaç adları, dozlar (mg, ml), sayılar ve tarihler birebir aynı olmalı.
4. Okunamayan bir kelime varsa yerine [okunamadı] yaz; tahmin etme.
5. Belge bir taburculuk özeti, epikriz veya reçete DEĞİLSE ya da hiç okunamıyorsa yalnızca şunu yaz: BELGE_OKUNAMADI
6. Açıklama, giriş cümlesi veya markdown kullanma. Sadece belge metnini döndür."""

UNREADABLE_MARKER = "BELGE_OKUNAMADI"


def _status_code(exc: Exception) -> int | None:
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    return code if isinstance(code, int) else None


class GoogleLLMClient(LLMClient):
    """LLM adapter for Google Gemini models using the google-genai library."""

    def __init__(
        self,
        api_key: str,
        model: str | None = None,
        retries_per_model: int = 2,
    ) -> None:
        try:
            from google import genai  # noqa: PLC0415
            from google.genai import types  # noqa: PLC0415
        except ImportError as exc:
            raise ImportError(
                "google-genai package is required for GoogleLLMClient. "
                "Run: pip install google-genai"
            ) from exc

        self._client = genai.Client(api_key=api_key)
        self._types = types
        chain = list(DEFAULT_MODEL_CHAIN)
        if model:
            chain = [model] + [m for m in chain if m != model]
        self._models = chain
        self._retries_per_model = retries_per_model

    # ------------------------------------------------------------------
    # Internal: call with model fallback + backoff
    # ------------------------------------------------------------------
    def _generate(self, contents: Any, config: dict[str, Any]) -> str:
        last_error: Exception | None = None
        for model_name in self._models:
            for attempt in range(self._retries_per_model + 1):
                try:
                    response = self._client.models.generate_content(
                        model=model_name, contents=contents, config=config
                    )
                    return response.text or ""
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    code = _status_code(exc)
                    if code == 404:
                        break  # model retired for this key → next model
                    if code in (429, 500, 503) and attempt < self._retries_per_model:
                        time.sleep(1.5 * (attempt + 1))
                        continue
                    break  # other errors or retries exhausted → next model
        raise LLMResponseError(
            "Gemini şu anda yanıt vermiyor (tüm modeller denendi). "
            f"Birkaç saniye sonra tekrar deneyin. Son hata: {last_error}"
        ) from last_error

    # ------------------------------------------------------------------
    # LLMClient interface
    # ------------------------------------------------------------------
    def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        *,
        temperature: float = 0.0,
        max_retries: int = 1,
    ) -> dict[str, Any]:
        config: dict[str, Any] = {
            "temperature": temperature,
            "response_mime_type": "application/json",
        }
        if schema:
            config["response_schema"] = schema

        for attempt in range(max_retries + 1):
            text = self._generate(prompt, config)
            try:
                return json.loads(text or "{}")
            except json.JSONDecodeError as exc:
                if attempt == max_retries:
                    raise LLMResponseError(f"Gemini geçersiz JSON döndürdü: {exc}") from exc
        return {}

    def generate_text(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
    ) -> str:
        return self._generate(prompt, {"temperature": temperature})

    # ------------------------------------------------------------------
    # Multimodal: PDF / image → verbatim text
    # ------------------------------------------------------------------
    def transcribe_document(self, data: bytes, mime_type: str) -> str:
        """
        Transcribe a discharge document (PDF or photo) to plain text.

        Returns the verbatim text. Raises LLMResponseError if the model reports
        the document is unreadable or not a discharge summary.
        """
        part = self._types.Part.from_bytes(data=data, mime_type=mime_type)
        text = self._generate(
            [part, DOCUMENT_TRANSCRIPTION_PROMPT],
            {"temperature": 0.0},
        ).strip()

        # Strip accidental markdown fences
        if text.startswith("```"):
            text = text.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        if not text or UNREADABLE_MARKER in text[:200]:
            raise LLMResponseError(
                "Belge okunamadı veya bir taburculuk özeti/epikriz değil. "
                "Daha net bir fotoğraf ya da PDF yükleyin."
            )
        return text
