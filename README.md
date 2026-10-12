# TaburcuAI

**TaburcuAI**, kalp yetmezliği tanısıyla taburcu olan hastaların taburculuk talimatlarını gerçekten anlayıp anlamadığını ölçen bir yapay zeka asistanıdır.

## Nasıl Çalışır?

1. Taburculuk özeti (epikriz metni) sisteme girilir.
2. Sistem metinden yapılandırılmış bilgi çıkarır (ilaçlar, günlük kilo takibi, tuz/sıvı kısıtı, uyarı belirtileri, kontrol randevusu).
3. Hasta için sade Türkçe bir plan ve ilaç takvimi üretilir.
4. Hastaya anlama soruları sorulur (teach-back yöntemi).
5. Cevaplar puanlanır, riskli yanlış anlamalar hemşire/hekim paneline iletilir.

## Kurulum

### Gereksinimler

- Python 3.11+
- Node.js 20+
- Git

### 1. Depoyu Klonla

```bash
git clone <repo-url>
cd taburcuai
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
# .env dosyasını açıp gerekli değerleri doldur
```

### 3. Arka Ucu Başlat

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Arka uç `http://127.0.0.1:8000` adresinde çalışır.
API dokümantasyonu: `http://127.0.0.1:8000/docs`

### 4. Ön Ucu Başlat

```bash
cd frontend
npm install
npm run dev
```

Ön uç `http://localhost:5173` adresinde çalışır.

### 5. Testleri Çalıştır

```bash
cd backend
pytest
```

### 6. Kod Kalitesi (Ruff)

```bash
cd backend
ruff check .
ruff format .
```

## Proje Yapısı

```
taburcuai/
  backend/
    app/
      core/                     # Hastalıktan bağımsız ortak mantık
        llm/                    # LLM istemci arayüzü ve adaptörler
        pipeline/               # Extraction, simplification, questions, scoring, risk
        schemas/                # Ortak Pydantic modelleri
        safety/                 # Güvenlik kuralları ve doğrulayıcılar
      diseases/
        base.py                 # DiseaseModule arayüzü (Protocol)
        heart_failure/          # Kalp yetmezliğine özgü her şey
      api/                      # FastAPI router'ları
      db/
      main.py
    tests/
    scripts/                    # Veri üretimi, değerlendirme betikleri
  frontend/
  data/                         # .gitignore'da; sentetik ve yerel veri
  docs/
  reports/
  README.md
  .env.example
```

## Güvenlik ve Klinik Sınırlar

- Bu sistem **teşhis koymaz**, ilaç veya doz **önermez**, tedaviyi **değiştirmez**.
- Yalnızca hekimin yazdığı talimatı sadeleştirir ve hastanın anlayıp anlamadığını ölçer.
- Repoya **hiçbir gerçek hasta verisi** konmamalıdır.
- API anahtarları yalnızca `.env` dosyasından okunur; `.env` git'e girmez.

## Lisans

Yalnızca akademik kullanım amaçlıdır.
