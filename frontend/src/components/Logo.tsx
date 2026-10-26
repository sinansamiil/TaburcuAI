import { Activity, Building2, HeartPulse, ShieldPlus, GraduationCap } from 'lucide-react'
import { useHospital } from './HospitalContext'

interface LogoProps {
  className?: string
  showSubtitle?: boolean
  light?: boolean
}

export function Logo({ className = '', showSubtitle = true, light = false }: LogoProps) {
  const { config } = useHospital()

  // Dynamic icon based on hospital logo_icon configuration
  const renderIcon = () => {
    switch (config.logo_icon) {
      case 'building-2':
        return <Building2 size={22} className="stroke-[2.2]" />
      case 'heart-pulse':
        return <HeartPulse size={22} className="stroke-[2.2]" />
      case 'shield-plus':
        return <ShieldPlus size={22} className="stroke-[2.2]" />
      case 'graduation-cap':
        return <GraduationCap size={22} className="stroke-[2.2]" />
      default:
        return <Activity size={22} className="stroke-[2.5]" />
    }
  }

  const primaryCol = config.primary_color || '#1e5ba3'
  const hospitalName = config.hospital_name || 'TaburcuAI'
  const nameParts = hospitalName.trim().split(/\s+/)
  const firstWord = nameParts[0] || 'Taburcu'
  const restOfName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (hospitalName === 'TaburcuAI' ? 'AI' : '')

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none min-w-0 ${className}`}>
      {/* Dynamic Hospital Brand Shield */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform shadow-md ${
          light ? 'bg-white text-slate-900 shadow-black/10' : 'text-white'
        }`}
        style={{ backgroundColor: light ? '#ffffff' : primaryCol }}
      >
        {renderIcon()}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 leading-none flex-wrap sm:flex-nowrap">
          <span className={`text-base sm:text-lg font-black tracking-tight leading-tight whitespace-nowrap ${light ? 'text-white' : 'text-slate-900'}`}>
            <span>{firstWord}</span>
            {restOfName && (
              <span style={{ color: light ? '#ffffff' : primaryCol }} className="ml-1.5">
                {restOfName}
              </span>
            )}
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 hidden xs:inline-block"
            style={{
              backgroundColor: light ? 'rgba(255,255,255,0.2)' : `${primaryCol}15`,
              color: light ? '#ffffff' : primaryCol,
              borderColor: light ? 'rgba(255,255,255,0.4)' : `${primaryCol}30`,
            }}
          >
            Modüler Klinik
          </span>
        </div>

        {showSubtitle && (
          <span className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 max-w-xs sm:max-w-sm md:max-w-md truncate ${light ? 'text-slate-200' : 'text-slate-500'}`}>
            {config.hospital_subtitle || 'Akıllı Taburculuk ve Klinik Takip Sistemi'}
          </span>
        )}
      </div>
    </div>
  )
}
