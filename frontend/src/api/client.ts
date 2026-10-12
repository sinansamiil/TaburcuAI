/**
 * Typed API client for TaburcuAI backend.
 * Base URL is resolved from the VITE_API_URL env variable, falling back to an
 * empty string so Vite's dev-server proxy handles it transparently.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export interface HealthResponse {
  status: string
  service: string
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  /** GET /health – liveness probe */
  health: (): Promise<HealthResponse> => fetchJSON<HealthResponse>('/health'),
}
