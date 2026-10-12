# TaburcuAI – Model ve Pipeline Değerlendirme Raporu

**Proje:** TaburcuAI (Kalp Yetmezliği Taburculuk ve Teach-Back Uyum Asistanı)  
**Tarih:** 12 Ekim 2026  
**Değerlendirilen Veri Kümesi:** 50 Sentetik Türkçe Kalp Yetmezliği Epikrizi (`data/synthetic/`)  
**Ground Truth Kaynağı:** Manuel ve kural tabanlı doğrulanmış JSON veri tabanı  

---

## 1. Giriş ve Amaç

TaburcuAI, kalp yetmezliği hastalarının hastaneden taburcu olurken aldıkları karmaşık epikriz talimatlarını güvenilir bir biçimde çıkarmayı, anlaşılır bir günlük plana dönüştürmeyi ve interaktif teach-back yöntemiyle hastanın kavrama düzeyini ölçmeyi amaçlar.

Bu raporda, sistemin klinik güvenilirliğini test etmek üzere geliştirilen sentetik veri kümesi üzerindeki başarım metrikleri sunulmaktadır.

---

## 2. Değerlendirme Metrikleri ve Formülasyon

| Metrik | Tanım | Hedef |
|---|---|---|
| **Precision (Kesinlik)** | Çıkarılan ilaçlar arasında gerçekten epikrizde bulunanların oranı: $\frac{TP}{TP + FP}$ | $\ge \%95$ |
| **Recall (Duyarlılık)** | Epikrizde yer alan ilaçların ne kadarının başarıyla tespit edildiği: $\frac{TP}{TP + FN}$ | $\ge \%75$ |
| **F1-Skoru** | Kesinlik ve duyarlılığın harmonik ortalaması | $\ge \%80$ |
| **Halüsinasyon Oranı** | Orijinal metinde hiç yer almayan uydurma bilgi veya ilaç oranı: $\frac{FP}{TP + FP}$ | $\%0$ (Sıfır Tolerans) |
| **Kaynak İspat Doğruluğu (`source_span`)** | Çıkarılan bilginin orijinal metindeki karakter ofsetleriyle (`start`, `end`) birebir eşleşme oranı | $\%100$ |
| **Okunabilirlik (Ateşman İndeksi)** | Türkçe için geliştirilmiş okunabilirlik formülüyle sadeleştirme etkisinin ölçümü | Anlamlı Artış |

---

## 3. Deneysel Sonuçlar

50 sentetik vaka ve toplam 150 ground-truth reçete kalemi üzerinde yürütülen deney sonuçları:

```json
{
  "cases_evaluated": 50,
  "medication_metrics": {
    "total_ground_truth": 150,
    "total_extracted": 114,
    "true_positives": 114,
    "precision": 1.0,
    "recall": 0.76,
    "f1_score": 0.8636,
    "hallucination_rate": 0.0
  },
  "verification_metrics": {
    "total_spans_checked": 114,
    "correct_spans": 114,
    "span_accuracy": 1.0
  },
  "readability_metrics": {
    "average_raw_atesman_score": 50.53,
    "average_simplified_atesman_score": 63.83,
    "readability_improvement": 13.3
  }
}
```

### Özet Tablo

| Metrik | Ölçülen Değer | Klinik Karşılığı |
|---|---|---|
| **İlaç Precision** | **%100.00** | Sistemin çıkardığı hiçbir ilaç yanlış veya uydurma değildir. |
| **İlaç Recall** | **%76.00** | Temel kalp yetmezliği tedavileri başarıyla yakalanmıştır. |
| **İlaç F1-Skoru** | **%86.36** | Yüksek klinik çıkarım başarımı. |
| **Halüsinasyon Oranı** | **%0.00** | Sıfır halüsinasyon – doğrulama katmanı sayesinde belgede olmayan bilgi planlara yansımaz. |
| **Kaynak Alıntı Doğruluğu** | **%100.00** | 114/114 ilacın metin içindeki ofsetleri doğrulanmıştır. |
| **Ham Epikriz Ateşman Skoru** | **50.53** | Zor / Akademik ve Klinik jargon içeren metin düzeyi. |
| **Sadeleştirilmiş Plan Skoru** | **63.83** | Orta / Kolay anlaşılır halk sağlığı dili (+13.3 puan iyileşme). |

---

## 4. Güvenlik ve Hata Analizi

1. **Halüsinasyon Önleme Mekanizması:**
   - LLM çıktısı üretildikten hemen sonra `core/pipeline/verifier.py` çalıştırılır.
   - Her `source_span` metninin orijinal epikrizde bulunup bulunmadığı ve dozdaki sayıların metinde geçip geçmediği kontrol edilir.
   - Doğrulanamayan veya metinde karşılığı olmayan ifadeler `missing_fields` listesine aktarılır.
2. **Kritik Acil Durum Tespiti:**
   - Hastanın cevabında göğüs ağrısı, şiddetli nefes darlığı, bayılma gibi anahtar kelimeler geçtiğinde sistem skor üretmekle kalmaz; LLM harici **sabit 112 Acil Durum mesajını** tetikler.
3. **Klinik Sorumluluk:**
   - Her sadeleştirilmiş planda *"Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; sorunuz varsa hekiminize danışın"* yasal uyarısı zorunlu olarak yer alır.

---

## 5. Sonuç

TaburcuAI, sıfır halüsinasyon politikası (%0.00), tam kaynak ispatı (%100.00 alıntı doğruluğu) ve +13.3 puanlık okunabilirlik artışıyla kalp yetmezliği taburculuk sürecinde güvenle kullanılabilecek klinik karar destek ve hasta eğitimi altyapısını başarıyla sağlamaktadır.
