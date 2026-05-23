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
    const error = Object.assign(new Error(`API Error: ${res.status}`), {
      status: res.status,
      data
    })
    throw error
  }
  return data as T
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<Response>): Promise<T> {
  const controller = new AbortController()
  // Use Promise.race so the timeout wins even if React Native's fetch polyfill
  // doesn't reject when abort() is called (observed on Android emulator in CI).
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      controller.abort()
      reject(new Error('Request timed out'))
    }, 15_000)
  )
  try {
    return await handleResponse<T>(await Promise.race([fn(controller.signal), timeoutPromise]))
  } finally {
    controller.abort()
  }
}

export const api = {
  getColors: (): Promise<Color[]> => withTimeout<Color[]>((signal) => client.getColors(signal)),

  getColor: (name: string): Promise<Color> => withTimeout<Color>((signal) => client.getColor(name, signal)),

  addColor: (name: string, hex: string): Promise<Color> =>
    withTimeout<Color>((signal) => client.createColor({ name, hex }, signal)),

  deleteColor: (name: string): Promise<void> => withTimeout<void>((signal) => client.deleteColor(name, signal))
}
