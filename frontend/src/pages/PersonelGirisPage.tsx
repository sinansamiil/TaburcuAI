import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Stethoscope } from 'lucide-react'

export function PersonelGirisPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'hekim' | 'hemsire'>('hekim')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      sessionStorage.setItem('personel_auth', JSON.stringify({
        email: email || 'dr.carter@taburcu.ai',
        role: role,
        name: role === 'hekim' ? 'Dr. Michael Carter' : 'Hemşire Sarah Hosten',
        title: role === 'hekim' ? 'Kardiyoloji Uzmanı' : 'Kardiyoloji Servis Hemşiresi'
      }))
      navigate('/personel')
    }, 300)
  }


  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#0e2038]">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 space-y-7 shadow-2xl">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e5ba3] shadow-xs">
            <Stethoscope size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sağlık Personeli Portalı
          </h1>
          <p className="text-xs text-slate-500">
            Klinik risk triyaj paneline ve hasta teach-back raporlarına erişim.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('hekim')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              role === 'hekim'
                ? 'bg-[#1e5ba3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hekim / Kardiyolog
          </button>
          <button
            type="button"
            onClick={() => setRole('hemsire')}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              role === 'hemsire'
                ? 'bg-[#1e5ba3] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Servis Hemşiresi
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Kurumsal E-posta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'hekim' ? "doktor@klinik.org" : "hemsire@klinik.org"}
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Güvenlik Şifresi
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1e5ba3] focus:outline-hidden transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0e2038] hover:bg-[#1b3558] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            {loading ? (
              <span>Bağlanılıyor...</span>
            ) : (
              <>
                <span>{role === 'hekim' ? 'Hekim Paneline Bağlan' : 'Hemşire Paneline Bağlan'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => {
              setRole('hekim')
              setEmail('dr.carter@taburcu.ai')
              setPassword('••••••••••••')
            }}
            className="text-[#1e5ba3] hover:underline cursor-pointer font-bold"
          >
            ⚡ Sunum İçin Doktor Bilgilerini Doldur (Dr. Carter)
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('hemsire')
              setEmail('hemsire.sarah@taburcu.ai')
              setPassword('••••••••••••')
            }}
            className="text-emerald-700 hover:underline cursor-pointer font-bold"
          >
            ⚡ Sunum İçin Hemşire Bilgilerini Doldur (Hemşire Sarah)
          </button>
        </div>

      </div>
    </div>
  )
}
