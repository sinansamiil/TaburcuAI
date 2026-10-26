import { useQuery } from '@tanstack/react-query'
import { api, type HealthResponse } from '../api/client'

/**
 * HealthStatus – queries GET /health and renders the backend connectivity
 * state in a clear, accessible badge.
 */
export function HealthStatus() {
  const { data, isLoading, isError, error } = useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30_000, // re-check every 30 s
    retry: 2,
  })

  if (isLoading) {
    return (
      <div
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold"
        title="Sunucu bağlantısı kontrol ediliyor"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="hidden lg:inline">Bağlanıyor…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold"
        title={error ? error.message : "Sunucuya bağlanılamadı"}
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
        <span>Sunucu Hatası</span>
      </div>
    )
  }

  return (
    <div
      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition hover:bg-emerald-100 cursor-default"
      title={`Klinik API Servisi Aktif • Durum: ${data?.status || 'ok'}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="hidden lg:inline">Sistem Aktif</span>
    </div>
  )
}
