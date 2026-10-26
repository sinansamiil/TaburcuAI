import { NavLink, Link } from 'react-router-dom'
import { Logo } from './Logo'
import { HealthStatus } from './HealthStatus'
import { useHospital } from './HospitalContext'
import { ArrowRight, UserCheck, ShieldCheck, Settings, Phone } from 'lucide-react'

export function Navbar() {
  const { config } = useHospital()
  const primaryCol = config.primary_color || '#1e5ba3'

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link to="/" className="no-underline shrink-0">
          <Logo />
        </Link>

        {/* Center menu links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 p-1.5 rounded-xl">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg text-sm font-bold transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            Ana Sayfa
          </NavLink>

          <NavLink
            to="/hasta-giris"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
            style={({ isActive }) => (isActive ? { color: primaryCol } : {})}
          >
            <UserCheck size={16} />
            Hasta Portalı
          </NavLink>

          <NavLink
            to="/personel-giris"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
            style={({ isActive }) => (isActive ? { color: primaryCol } : {})}
          >
            <ShieldCheck size={16} />
            Personel & Risk
          </NavLink>

          <NavLink
            to="/personel?tab=settings"
            className={({ isActive }) =>
              `px-3.5 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
            style={({ isActive }) => (isActive ? { color: primaryCol } : {})}
          >
            <Settings size={16} />
            Hastane & Yönetim
          </NavLink>
        </nav>

        {/* Right CTA matching hospital config */}
        <div className="flex items-center gap-3">
          {config.emergency_phone && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <Phone size={13} className="text-rose-600" />
              <span>{config.emergency_phone}</span>
            </div>
          )}

          <HealthStatus />

          <Link
            to="/hasta-giris"
            className="hidden sm:inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: config.accent_color || '#d92d20' }}
          >
            <span>Taburculuk Başlat</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </header>
  )
}
