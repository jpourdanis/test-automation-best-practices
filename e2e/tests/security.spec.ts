import { test, expect } from '@playwright/test'

/**
 * Test Suite: Security
 *
 * Covers XSS prevention, injection attacks, input validation,
 * security headers, rate limiting, and HTTP method restrictions.
 * The server uses Zod strict schemas + an alphanumeric-only regex,
 * so most attack payloads are rejected at the validation layer.
 *
 * Tests are serialized so that the rate-limit group (which exhausts
 * the POST quota) always runs last and doesn't affect other groups.
 */
test.describe.configure({ mode: 'serial' })

test.describe('Security', () => {
  const createdRateLimitColors: string[] = []

  test.afterAll(async ({ request }) => {
    await Promise.all(createdRateLimitColors.map((name) => request.delete(`/api/colors/${name}`).catch(() => {})))
  })

  // ---------------------------------------------------------------------------
  // XSS Prevention
  // ---------------------------------------------------------------------------

  test.describe('XSS Prevention', () => {
    test('POST with HTML tag in name is rejected (400)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: '<img src=x onerror=alert(1)>', hex: '#ff0000' }
      })
      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toBeTruthy()
    })

    test('POST with script tag in name is rejected (400)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: '<script>alert(1)</script>', hex: '#ff0000' }
      })
      expect(res.status()).toBe(400)
    })

    test('POST with javascript: URI in name is rejected (400)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: 'javascript:alert(1)', hex: '#ff0000' }
      })
      expect(res.status()).toBe(400)
    })

    test('color names rendered in the UI do not trigger script execution', async ({ page }) => {
      // Navigate to the live app and confirm no dialog fires from rendered content
      let alerted = false
      page.on('dialog', () => {
        alerted = true
      })
      await page.goto('/')
      await page.waitForTimeout(1000)
      expect(alerted).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Injection Prevention
  // ---------------------------------------------------------------------------

  test.describe('Injection Prevention', () => {
    test('NoSQL injection object in name is rejected (400)', async ({ request }) => {
      // Zod rejects non-string types before they reach MongoDB
      const res = await request.post('/api/colors', {
        data: { name: { $gt: '' }, hex: '#ffffff' }
      })
      expect(res.status()).toBe(400)
    })

    test('NoSQL $where operator in name is rejected (400)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: { $where: 'sleep(1000)' }, hex: '#ffffff' }
      })
      expect(res.status()).toBe(400)
    })

    test('SQL injection characters in name are rejected (400)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: "'; DROP TABLE colors; --", hex: '#ff0000' }
      })
      expect(res.status()).toBe(400)
    })

    test('NoSQL operator in GET path param is rejected (400 or 404)', async ({ request }) => {
      const res = await request.get('/api/colors/%24gt')
      expect([400, 404]).toContain(res.status())
    })
  })

  // ---------------------------------------------------------------------------
  // Input Validation
  // ---------------------------------------------------------------------------

  test.describe('Input Validation', () => {
    test('unknown extra fields in POST body are rejected (400)', async ({ request }) => {
      // Zod .strict() rejects any key not in the schema
      const res = await request.post('/api/colors', {
        data: { name: 'Purple', hex: '#800080', injected: 'payload' }
      })
      expect(res.status()).toBe(400)
    })

    test('oversized payload is rejected (413)', async ({ request }) => {
      // Express.json() default limit is 100 kb; this body is ~150 kb
      const res = await request.post('/api/colors', {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ name: 'A'.repeat(150_000), hex: '#ff0000' })
      })
      expect(res.status()).toBe(413)
    })

    test('malformed JSON body returns 400', async ({ request }) => {
      const res = await request.post('/api/colors', {
        headers: { 'Content-Type': 'application/json' },
        data: '{invalid json'
      })
      expect(res.status()).toBe(400)
    })

    test('empty body on POST returns 400', async ({ request }) => {
      const res = await request.post('/api/colors', {
        headers: { 'Content-Type': 'application/json' },
        data: '{}'
      })
      expect(res.status()).toBe(400)
    })

    test('array body on POST returns 400', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: [{ name: 'Purple', hex: '#800080' }]
      })
      expect(res.status()).toBe(400)
    })
  })

  // ---------------------------------------------------------------------------
  // Security Headers
  // ---------------------------------------------------------------------------

  test.describe('Security Headers', () => {
    test('X-Powered-By header is not exposed', async ({ request }) => {
      const res = await request.get('/api/colors')
      expect(res.headers()['x-powered-by']).toBeUndefined()
    })

    test('error responses return JSON, not HTML (no info leakage)', async ({ request }) => {
      const res = await request.post('/api/colors', {
        data: { name: '<xss>', hex: '#000000' }
      })
      expect(res.headers()['content-type']).toContain('application/json')
    })
  })

  // ---------------------------------------------------------------------------
  // HTTP Method Restrictions
  // ---------------------------------------------------------------------------

  test.describe('HTTP Method Restrictions', () => {
    test('PATCH /api/colors returns 405', async ({ request }) => {
      const res = await request.patch('/api/colors')
      expect(res.status()).toBe(405)
      expect(res.headers()['allow']).toContain('GET')
    })

    test('DELETE /api/colors (collection) returns 405', async ({ request }) => {
      const res = await request.delete('/api/colors')
      expect(res.status()).toBe(405)
    })

    test('PATCH /api/colors/:name returns 405', async ({ request }) => {
      const res = await request.patch('/api/colors/Turquoise')
      expect(res.status()).toBe(405)
      expect(res.headers()['allow']).toContain('PUT')
    })

    test('POST /api-docs returns 405', async ({ request }) => {
      const res = await request.post('/api-docs')
      expect(res.status()).toBe(405)
      expect(res.headers()['allow']).toBe('GET')
    })

    test('PUT /openapi.json returns 405', async ({ request }) => {
      const res = await request.put('/openapi.json')
      expect(res.status()).toBe(405)
    })
  })

  // ---------------------------------------------------------------------------
  // Rate Limiting — runs last to avoid exhausting the POST quota for other groups
  // ---------------------------------------------------------------------------

  test.describe('Rate Limiting', () => {
    test('POST /api/colors returns 429 after exceeding the rate limit', async ({ request }) => {
      // The limiter allows 100 POST requests per IP per 15-min window.
      // Fire 101 requests concurrently — at least one must be rate-limited.
      const names = Array.from({ length: 101 }, (_, i) => `RateLimit${i}`)
      const responses = await Promise.all(
        names.map((name) => request.post('/api/colors', { data: { name, hex: '#aabbcc' } }))
      )

      const statuses = responses.map((r) => r.status())
      responses.forEach((r, i) => {
        if (r.status() === 201) createdRateLimitColors.push(names[i])
      })

      expect(statuses).toContain(429)
    })
  })
})
