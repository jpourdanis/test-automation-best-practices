import type { components } from './openapi.d.ts'

export type ColorBody = components['schemas']['Color']
export type UpdateColorBody = components['schemas']['UpdateColor']

export interface ApiClientOptions {
  baseUrl?: string
}

export function createApiClient(options: ApiClientOptions = {}) {
  const base = options.baseUrl ?? ''

  return {
    getColors(): Promise<Response> {
      return fetch(`${base}/api/colors`)
    },

    getColor(name: string): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { cache: 'no-store' })
    },

    createColor(body: ColorBody): Promise<Response> {
      return fetch(`${base}/api/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    },

    updateColor(name: string, body: UpdateColorBody): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    },

    deleteColor(name: string): Promise<Response> {
      return fetch(`${base}/api/colors/${encodeURIComponent(name)}`, { method: 'DELETE' })
    }
  }
}

export const apiClient = createApiClient()
