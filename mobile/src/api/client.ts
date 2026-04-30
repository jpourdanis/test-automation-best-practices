// EXPO_PUBLIC_API_URL is set in .env (production) or .env.local (local dev).
// Falls back to Constants for legacy EAS builds that set it via app.json extra.
import Constants from 'expo-constants'

import { createApiClient } from '@color-app/shared'
import type { ColorBody } from '@color-app/shared'

export type Color = ColorBody

const BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://test-automation-best-practices.vercel.app'

const client = createApiClient({ baseUrl: BASE })

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error: any = new Error(`API Error: ${res.status}`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data as T
}

export const api = {
  getColors: (): Promise<Color[]> => client.getColors().then((r) => handleResponse<Color[]>(r)),

  getColor: (name: string): Promise<Color> => client.getColor(name).then((r) => handleResponse<Color>(r)),

  addColor: (name: string, hex: string): Promise<Color> =>
    client.createColor({ name, hex }).then((r) => handleResponse<Color>(r)),

  deleteColor: (name: string): Promise<void> => client.deleteColor(name).then((r) => handleResponse<void>(r))
}
