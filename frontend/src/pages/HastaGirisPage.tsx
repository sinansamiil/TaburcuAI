import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Heart, ShieldCheck } from 'lucide-react'

export function HastaGirisPage() {
  const navigate = useNavigate()
  const [tcKimlik, setTcKimlik] = useState('')
  const [protokolNo, setProtokolNo] = useState('EPK-2026-1042')
  const [loading, setLoading] = useState(false)

  const [adSoyad, setAdSoyad] = useState('Ahmet Yılmaz')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      sessionStorage.setItem('hasta_auth', JSON.stringify({
        tcKimlik: tcKimlik || '28491823746',
        protokolNo: protokolNo || 'PRT-2026-1042',
        adSoyad: adSoyad || 'Ahmet Yılmaz',
      }))
      navigate('/hasta')
    }, 300)
  }

  const selectPatientPreset = (preset: { ad: string; tc: string; prt: string }) => {
    setAdSoyad(preset.ad)
    setTcKimlik(preset.tc)
    setProtokolNo(preset.prt)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#f8fafc]">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 space-y-7 card-shadow">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e5ba3] shadow-xs">
            <Heart size={26} className="text-rose-500 fill-rose-50" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hasta Bilgi Girişi
          </h1>
          <p className="text-xs text-slate-500">
            Taburculuk planınızı ve ilaç çizelgenizi görüntülemek için bilgilerinizi giriniz.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hasta Adı Soyadı
            </label>
            <input
              type="text"
              required
              value={adSoyad}
              onChange={(e) => setAdSoyad(e.target.value)}
              placeholder="Adınız ve Soyadınız"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              T.C. Kimlik Numarası
            </label>
            <input
              type="text"
              maxLength={11}
              required
              value={tcKimlik}
              onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, ''))}
              placeholder="11 haneli T.C. kimlik numarası"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Epikriz Protokol No
              </label>
              <span className="text-[11px] text-[#1e5ba3] font-bold">Örn: PRT-2026-1042</span>
            </div>
            <input
              type="text"
              required
              value={protokolNo}
              onChange={(e) => setProtokolNo(e.target.value)}
              placeholder="Taburculuk belgenizdeki numara"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden transition"
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#1e5ba3] shrink-0" />
            <span>Kişisel sağlık verileriniz şifrelenerek korunur.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#d92d20] hover:bg-[#b91c1c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition cursor-pointer"
          >
            {loading ? (
              <span>Doğrulanıyor...</span>
            ) : (
              <>
                <span>Taburculuk Planıma Giriş Yap</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo Patient Presets */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-center">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Hızlı Test / Sunum Hasta Profilleri:
          </span>
          <div className="flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => selectPatientPreset({ ad: 'Ahmet Yılmaz', tc: '28491823746', prt: 'PRT-2026-1042' })}
              className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#1e5ba3] font-bold text-left flex items-center justify-between transition cursor-pointer"
            >
              <span>👤 Ahmet Yılmaz (Kalp Yetmezliği)</span>
              <span className="font-mono text-[10px] text-slate-400">PRT-2026-1042</span>
            </button>
            <button
              type="button"
              onClick={() => selectPatientPreset({ ad: 'Fatma Demir', tc: '49182736451', prt: 'PRT-2026-8956' })}
              className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#1e5ba3] font-bold text-left flex items-center justify-between transition cursor-pointer"
            >
              <span>👤 Fatma Demir (Konjestif KY)</span>
              <span className="font-mono text-[10px] text-slate-400">PRT-2026-8956</span>
            </button>
            <button
              type="button"
              onClick={() => selectPatientPreset({ ad: 'Mehmet Öztürk', tc: '19283746502', prt: 'PRT-2026-9759' })}
              className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-[#1e5ba3] font-bold text-left flex items-center justify-between transition cursor-pointer"
            >
              <span>👤 Mehmet Öztürk (HFrEF NYHA-II)</span>
              <span className="font-mono text-[10px] text-slate-400">PRT-2026-9759</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
