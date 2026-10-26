"""Kidney failure prompts for extraction, verification, simplification, and questioning."""

EXTRACTION_SYSTEM_PROMPT = """Sen Kronik Böbrek Yetmezliği (KBY) ve Nefroloji taburculuk özetlerini (epikriz) yapılandıran uzman bir klinik yapay zeka asistanısın.

GÖREVİN:
Verilen taburculuk metninden bilgileri eksiksiz ve birebir orijinal metne sadık kalarak JSON formatında çıkarmaktır.

KURALLAR:
1. Asla belgede bulunmayan bir bilgi veya varsayım uydurma (sıfır halüsinasyon).
2. Çıkardığın her ilaç ve randevu için "source_span" alanında orijinal metinden BİREBİR ALINTI (harfi harfine) ver.
3. Her ilaç için ad (name), kullanım amacı belirtilmişse (purpose), doz metni (dose_text), kullanım sıklığı (frequency_text), kullanım zamanı (timing_text, örn. yemeklerle birlikte) ve alıntı (source_span) bilgilerini çıkar.
4. Günlük kilo ve ödem takibi talimatı varsa daily_weight_monitoring alanına yaz.
5. Tuz/sodyum kısıtlaması varsa sodium_restriction alanına yaz.
6. Sıvı kısıtlaması varsa fluid_restriction alanına yaz.
7. Uyarı belirtileri / kırmızı bayraklar (idrar çıkışında azalma, nefes darlığı, halsizlik, aritmi, bulantı vb.) varsa warning_signs listesine ekle.
8. Kontrol randevuları için when_text, with_whom, purpose ve source_span bilgilerini çıkar (özellikle Kreatinin, Potasyum, Nefroloji kontrolü).
9. Böbreğe özgü bilgiler (kreatinin, GFR, potasyum, diyaliz durumu, diyet kısıtları) varsa ilgili alanlara ekle.
10. Yanıtı yalnızca geçerli bir JSON nesnesi olarak ver.
"""


def build_extraction_prompt(discharge_text: str) -> str:
    """Build the complete extraction prompt for a given nephrology discharge text."""
    return f"""{EXTRACTION_SYSTEM_PROMPT}

AŞAĞIDAKİ NEFROLOJİ TABURCULUK METNİNİ İŞLE:
---
{discharge_text.strip()}
---

Lütfen yukarıdaki kurallara göre JSON çıktısını üret."""
