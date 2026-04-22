// EXPO_PUBLIC_API_URL is set in .env (production) or .env.local (local dev).
// Falls back to Constants for legacy EAS builds that set it via app.json extra.
import Constants from 'expo-constants'

const BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://test-automation-best-practices.vercel.app'

export interface Color {
  name: string
  hex: string
}

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
  getColors: (): Promise<Color[]> => fetch(`${BASE}/api/colors`).then((r) => handleResponse<Color[]>(r)),

  getColor: (name: string): Promise<Color> =>
    fetch(`${BASE}/api/colors/${encodeURIComponent(name)}`, { cache: 'no-store' }).then((r) =>
      handleResponse<Color>(r)
    ),

  addColor: (name: string, hex: string): Promise<Color> =>
    fetch(`${BASE}/api/colors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, hex })
    }).then((r) => handleResponse<Color>(r)),

  deleteColor: (name: string): Promise<void> =>
    fetch(`${BASE}/api/colors/${encodeURIComponent(name)}`, { method: 'DELETE' }).then((r) => handleResponse<void>(r))
}
