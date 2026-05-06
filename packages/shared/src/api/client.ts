import type { components } from './openapi.d.ts'

export type ColorBody = components['schemas']['Color']
export type UpdateColorBody = components['schemas']['UpdateColor']

export interface ApiClientOptions {
  baseUrl?: string
}

export function createApiClient(options: ApiClientOptions = {}) {
  const base = options.baseUrl ?? ''

  return {
    getColors(signal?: AbortSignal): Promise<Response> {
      return fetch(`${base}/api/colors`, { cache: 'no-store', signal })
    },

    getColor(name: string, signal?: AbortSignal): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { cache: 'no-store', signal })
    },

    createColor(body: ColorBody, signal?: AbortSignal): Promise<Response> {
      return fetch(`${base}/api/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
      })
    },

    updateColor(name: string, body: UpdateColorBody, signal?: AbortSignal): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
      })
    },

    deleteColor(name: string, signal?: AbortSignal): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { method: 'DELETE', signal })
    }
  }
}

export const apiClient = createApiClient()
