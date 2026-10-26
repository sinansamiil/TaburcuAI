import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  UserCheck,
  Stethoscope,
  UploadCloud,
  Sparkles,
} from 'lucide-react'
import { useHospital } from '../components/HospitalContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { config } = useHospital()
  const [fastProtocol, setFastProtocol] = useState('')

  const handleFastStart = (e: React.FormEvent) => {
    e.preventDefault()
    if (fastProtocol.trim()) {
      sessionStorage.setItem('hasta_auth', JSON.stringify({
        tcKimlik: '28491823746',
        protokolNo: fastProtocol.trim(),
        adSoyad: 'Ahmet Yılmaz',
      }))
      navigate('/hasta')
    } else {
      navigate('/hasta-giris')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#1e5ba3] selection:text-white">
      
      {/* ── HERO SECTION ──────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1e5ba3] text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} className="text-[#1e5ba3]" />
                <span>{config.hospital_name || 'TaburcuAI'} • Çoklu Hastalık & Teach-Back Takibi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Daha Sağlıklı Yarınlar İçin{' '}
                <span className="block sm:inline" style={{ color: config.primary_color || '#1e5ba3' }}>
                  Modüler Taburculuk Bakımı
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                {config.hospital_name} bünyesinde taburcu olan hastaların epikriz ve reçetelerini hastanın anlayabileceği sade bir plana dönüştürür.
                <strong> Böbrek Yetmezliği (KBY)</strong>, <strong>Kalp Yetmezliği</strong>, <strong>Diyabet</strong> ve <strong>KOAH</strong> protokollerine özel teach-back ile taburculuk sonrası riskleri sıfırlar.
              </p>

              {/* Supported Diseases Badge Strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
                <span className="text-slate-400 font-semibold">Desteklenen Klinikler:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">🫘 Böbrek Yetmezliği</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">❤️ Kalp Yetmezliği</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">🩺 Tip 2 Diyabet</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">🫁 KOAH</span>
              </div>

              {/* Action Buttons: Red CTA + Navy Outline */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/hasta-giris"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#d92d20] hover:bg-[#b91c1c] text-white font-bold text-sm shadow-lg shadow-red-600/20 transition hover:scale-[1.02]"
                >
                  <UserCheck size={18} />
                  <span>Hasta Girişi ve Planım</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/personel-giris"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#0e2038] hover:bg-[#1b3558] text-white font-bold text-sm shadow-md transition hover:scale-[1.02]"
                >
                  <Stethoscope size={18} className="text-cyan-400" />
                  <span>Personel Risk Paneli</span>
                </Link>
              </div>

              {/* 3 Metric Badges (CardioVanta 20+, 500+, 1K+ style) */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <div className="text-3xl font-extrabold text-[#0e2038]">20+</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">Kardiyak İlaç Kuralı</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#1e5ba3]">%95+</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">Teach-Back Doğruluğu</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-[#d92d20]">1K+</div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">Doğrulanan Talimat</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Doctor Visual & Interactive Quick Request Card */}
            <div className="lg:col-span-5 relative">
              
              {/* Doctor Visual Frame (Matches CardioVanta design) */}
              <div className="relative rounded-3xl bg-gradient-to-b from-blue-50/70 to-slate-100 p-8 border border-slate-200 card-shadow">
                
                {/* Floating Top Badge (100% Patient Satisfaction) */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="text-amber-500">★</span>
                  <span>%100 Klinik Güvenlik</span>
                </div>

                {/* Doctor Avatar Presentation */}
                <div className="text-center py-6 space-y-3">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-[#1e5ba3] text-white flex items-center justify-center text-4xl shadow-xl shadow-blue-900/20">
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Dr. Michael Carter</h3>
                    <p className="text-xs text-[#1e5ba3] font-bold">Kardiyoloji ve Kalp Yetersizliği Uzmanı</p>
                  </div>
                </div>

                {/* Fast Action Box (CardioVanta Request A Service style) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0e2038]">
                      Hızlı Epikriz Doğrulama
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  </div>

                  <form onSubmit={handleFastStart} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Epikriz Protokol Numarası
                      </label>
                      <input
                        type="text"
                        value={fastProtocol}
                        onChange={(e) => setFastProtocol(e.target.value)}
                        placeholder="Örn: EPK-2026-1042"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#d92d20] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                    >
                      <span>Taburculuk Planını Aç</span>
                      <ArrowRight size={15} />
                    </button>
                  </form>

                  {/* Future Multi-Modal PDF / Image note */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-slate-600">
                    <UploadCloud size={16} className="text-[#1e5ba3] shrink-0 mt-0.5" />
                    <span>
                      <strong>Çoklu Ortam Desteği:</strong> Epikriz belgenizi PDF veya fotoğraf olarak da yükleyebilirsiniz.
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4-STEP CARDIOLOGY SERVICE JOURNEY (Exact CardioVanta Red Accent Cards) ── */}
      <section className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1e5ba3] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Klinik Yol Haritası
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kardiyak Taburculuk Süreciniz
            </h2>
            <p className="text-slate-600 text-sm">
              Hastaneden taburcu olurken verilen talimatların eksiksiz uygulanması için geliştirilen 4 aşamalı protokol.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 card-shadow space-y-3 relative overflow-hidden group">
              <span className="text-4xl font-black text-slate-200 absolute top-4 right-4">01</span>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1e5ba3] flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Epikriz Metni Girişi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hastanın taburculuk özeti girilir; ilaçlar, dozlar, tuz/sıvı kısıtları ve kontrol randevusu çıkarılır.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 card-shadow space-y-3 relative overflow-hidden group">
              <span className="text-4xl font-black text-slate-200 absolute top-4 right-4">02</span>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Sadeleştirilmiş Plan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tıbbi terimler sade Türkçe'ye dönüştürülür ve günün saatlerine göre bölünmüş ilaç takvimi üretilir.
              </p>
            </div>

            {/* Step 3: Highlighted CardioVanta Red Card */}
            <div className="bg-[#d92d20] text-white rounded-2xl p-6 shadow-xl shadow-red-600/25 space-y-3 relative overflow-hidden">
              <span className="text-4xl font-black text-red-400/40 absolute top-4 right-4">03</span>
              <div className="w-12 h-12 rounded-xl bg-white text-[#d92d20] flex items-center justify-center font-bold text-xl shadow-md">
                3
              </div>
              <h3 className="font-extrabold text-white text-base">Teach-Back Soruları</h3>
              <p className="text-xs text-red-100 leading-relaxed">
                Hastanın ezberlemesini değil, kriz anında doğru davranıp davranmayacağını ölçen senaryo soruları sorulur.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 card-shadow space-y-3 relative overflow-hidden group">
              <span className="text-4xl font-black text-slate-200 absolute top-4 right-4">04</span>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
                4
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Klinik Triyaj Raporu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cevaplar puanlanır; nefes darlığı, ödem gibi riskli durumlarda hekim paneline anında kırmızı bayrak düşer.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0e2038] text-slate-300 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1e5ba3] text-white flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{config.hospital_name || 'TaburcuAI'}</p>
              <p className="text-slate-400">{config.hospital_subtitle || 'Modüler Taburculuk ve Klinik Takip Sistemi'}</p>
            </div>
          </div>
          <div className="text-slate-400 text-center sm:text-right space-y-1">
            <div>© {new Date().getFullYear()} {config.hospital_name} • Modüler Teach-Back Platformu</div>
            {config.emergency_phone && (
              <div className="text-[11px] text-red-400 font-bold">Acil Çağrı / Destek: {config.emergency_phone}</div>
            )}
          </div>
        </div>
      </footer>

    </div>
  )
}
