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
      <span className="badge badge--warn" role="status" aria-live="polite">
        ⏳ Bağlantı kontrol ediliyor…
      </span>
    )
  }

  if (isError) {
    return (
      <span className="badge badge--error" role="alert" aria-live="assertive">
        ✗ Sunucuya bağlanılamadı
        {error ? ` – ${error.message}` : ''}
      </span>
    )
  }

  return (
    <span className="badge badge--ok" role="status" aria-live="polite">
      ✓ Sunucu bağlantısı: {data?.status}
    </span>
  )
}
