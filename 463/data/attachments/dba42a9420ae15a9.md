# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/security.spec.ts >> Security >> Rate Limiting >> POST /api/colors returns 429 after exceeding the rate limit
- Location: e2e/tests/security.spec.ts:199:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 429
Received array: [201, 201, 201, 201, 201, 201, 201, 201, 201, 201, …]
```

# Test source

```ts
  112 |         headers: { 'Content-Type': 'application/json' },
  113 |         data: JSON.stringify({ name: 'A'.repeat(150_000), hex: '#ff0000' })
  114 |       })
  115 |       expect(res.status()).toBe(413)
  116 |     })
  117 | 
  118 |     test('malformed JSON body returns 400', async ({ request }) => {
  119 |       const res = await request.post('/api/colors', {
  120 |         headers: { 'Content-Type': 'application/json' },
  121 |         data: '{invalid json'
  122 |       })
  123 |       expect(res.status()).toBe(400)
  124 |     })
  125 | 
  126 |     test('empty body on POST returns 400', async ({ request }) => {
  127 |       const res = await request.post('/api/colors', {
  128 |         headers: { 'Content-Type': 'application/json' },
  129 |         data: '{}'
  130 |       })
  131 |       expect(res.status()).toBe(400)
  132 |     })
  133 | 
  134 |     test('array body on POST returns 400', async ({ request }) => {
  135 |       const res = await request.post('/api/colors', {
  136 |         data: [{ name: 'Purple', hex: '#800080' }]
  137 |       })
  138 |       expect(res.status()).toBe(400)
  139 |     })
  140 |   })
  141 | 
  142 |   // ---------------------------------------------------------------------------
  143 |   // Security Headers
  144 |   // ---------------------------------------------------------------------------
  145 | 
  146 |   test.describe('Security Headers', () => {
  147 |     test('X-Powered-By header is not exposed', async ({ request }) => {
  148 |       const res = await request.get('/api/colors')
  149 |       expect(res.headers()['x-powered-by']).toBeUndefined()
  150 |     })
  151 | 
  152 |     test('error responses return JSON, not HTML (no info leakage)', async ({ request }) => {
  153 |       const res = await request.post('/api/colors', {
  154 |         data: { name: '<xss>', hex: '#000000' }
  155 |       })
  156 |       expect(res.headers()['content-type']).toContain('application/json')
  157 |     })
  158 |   })
  159 | 
  160 |   // ---------------------------------------------------------------------------
  161 |   // HTTP Method Restrictions
  162 |   // ---------------------------------------------------------------------------
  163 | 
  164 |   test.describe('HTTP Method Restrictions', () => {
  165 |     test('PATCH /api/colors returns 405', async ({ request }) => {
  166 |       const res = await request.patch('/api/colors')
  167 |       expect(res.status()).toBe(405)
  168 |       expect(res.headers()['allow']).toContain('GET')
  169 |     })
  170 | 
  171 |     test('DELETE /api/colors (collection) returns 405', async ({ request }) => {
  172 |       const res = await request.delete('/api/colors')
  173 |       expect(res.status()).toBe(405)
  174 |     })
  175 | 
  176 |     test('PATCH /api/colors/:name returns 405', async ({ request }) => {
  177 |       const res = await request.patch('/api/colors/Turquoise')
  178 |       expect(res.status()).toBe(405)
  179 |       expect(res.headers()['allow']).toContain('PUT')
  180 |     })
  181 | 
  182 |     test('POST /api-docs returns 405', async ({ request }) => {
  183 |       const res = await request.post('/api-docs')
  184 |       expect(res.status()).toBe(405)
  185 |       expect(res.headers()['allow']).toBe('GET')
  186 |     })
  187 | 
  188 |     test('PUT /openapi.json returns 405', async ({ request }) => {
  189 |       const res = await request.put('/openapi.json')
  190 |       expect(res.status()).toBe(405)
  191 |     })
  192 |   })
  193 | 
  194 |   // ---------------------------------------------------------------------------
  195 |   // Rate Limiting — runs last to avoid exhausting the POST quota for other groups
  196 |   // ---------------------------------------------------------------------------
  197 | 
  198 |   test.describe('Rate Limiting', () => {
  199 |     test('POST /api/colors returns 429 after exceeding the rate limit', async ({ request }) => {
  200 |       // The limiter allows 100 POST requests per IP per 15-min window.
  201 |       // Fire 101 requests concurrently — at least one must be rate-limited.
  202 |       const names = Array.from({ length: 101 }, (_, i) => `RateLimit${i}`)
  203 |       const responses = await Promise.all(
  204 |         names.map((name) => request.post('/api/colors', { data: { name, hex: '#aabbcc' } }))
  205 |       )
  206 | 
  207 |       const statuses = responses.map((r) => r.status())
  208 |       responses.forEach((r, i) => {
  209 |         if (r.status() === 201) createdRateLimitColors.push(names[i])
  210 |       })
  211 | 
> 212 |       expect(statuses).toContain(429)
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  213 |     })
  214 |   })
  215 | })
  216 | 
```