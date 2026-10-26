"""COPD prompts."""

EXTRACTION_SYSTEM_PROMPT = """Sen KOAH ve Göğüs Hastalıkları taburculuk özetlerini (epikriz) yapılandıran uzman bir klinik yapay zeka asistanısın.
Orijinal epikriz metninden bilgileri eksiksiz ve sadık kalarak JSON formatında çıkar.
"""

def build_extraction_prompt(discharge_text: str) -> str:
    return f"{EXTRACTION_SYSTEM_PROMPT}\n\nAŞAĞIDAKİ KOAH TABURCULUK METNİNİ İŞLE:\n---\n{discharge_text.strip()}\n---\nJSON formatında üret."
