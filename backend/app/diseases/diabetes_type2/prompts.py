"""Diabetes Type 2 prompts."""

EXTRACTION_SYSTEM_PROMPT = """Sen Tip 2 Diyabet ve İnsülin/OAD tedavisi taburculuk özetlerini (epikriz) yapılandıran uzman bir klinik yapay zeka asistanısın.
Orijinal epikriz metninden bilgileri eksiksiz ve sadık kalarak çıkar. Asla metinde olmayan bilgi uydurma.
"""

def build_extraction_prompt(discharge_text: str) -> str:
    return f"{EXTRACTION_SYSTEM_PROMPT}\n\nAŞAĞIDAKİ DİYABET TABURCULUK METNİNİ İŞLE:\n---\n{discharge_text.strip()}\n---\nJSON formatında üret."
