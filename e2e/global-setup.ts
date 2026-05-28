import * as fs from 'node:fs'
import * as path from 'node:path'
import { request } from '@playwright/test'

async function globalSetup() {
  const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output')

  if (fs.existsSync(istanbulCLIOutput)) {
    try {
      fs.rmSync(istanbulCLIOutput, { recursive: true, force: true })
      console.log(`[Global Setup] Deleted existing .nyc_output folder`)
    } catch (err: unknown) {
      console.warn(`[Global Setup] Could not remove .nyc_output: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (!fs.existsSync(istanbulCLIOutput)) {
    fs.mkdirSync(istanbulCLIOutput, { recursive: true })
    console.log(`[Global Setup] Created .nyc_output folder`)
  }

  // Reseed the database once before all tests to guarantee a clean baseline.
  // Individual suites that mutate data add their own beforeEach reseed on top.
  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
  const token = process.env.RESEED_API_TOKEN
  if (token) {
    const context = await request.newContext({ baseURL })
    try {
      const res = await context
        .post('/api/reseed', { headers: { Authorization: `Bearer ${token}` } })
        .catch((err: unknown) => {
          throw new Error(`[Global Setup] Reseed request failed: ${err instanceof Error ? err.message : err}`)
        })
      if (res.ok()) {
        console.log('[Global Setup] Database reseeded successfully')
      } else {
        throw new Error(`[Global Setup] Reseed returned HTTP ${res.status()}`)
      }
    } finally {
      await context.dispose()
    }
  } else {
    console.warn('[Global Setup] RESEED_API_TOKEN not set — skipping database reseed')
  }
}

export default globalSetup
