# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/api.spec.ts >> Backend API Integration >> PUT /api/colors/:name Schema Validation >> should update a color with valid schema
- Location: e2e/tests/api.spec.ts:167:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  75  |     expect(response.status()).toBe(200)
  76  |     const data = await response.json()
  77  |     const names = data.map((c: { name: string }) => c.name)
  78  |     expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  79  |   })
  80  | 
  81  |   /**
  82  |    * Negative Test: GET /api/colors/:name
  83  |    * Verifies that the API correctly handles requests for colors that do not exist.
  84  |    */
  85  |   test('GET /api/colors/:name should return 404 for non-existent color', async ({ request }) => {
  86  |     const response = await request.get(`/api/colors/DoesNotExist`)
  87  |     expect(response.status()).toBe(404)
  88  |     const data = await response.json()
  89  |     expect(data.error).toBe('Color not found')
  90  |   })
  91  | 
  92  |   /**
  93  |    * Test Group: POST /api/colors
  94  |    * Verifies the creation of new colors and strict schema validation for input data.
  95  |    */
  96  |   test.describe('POST /api/colors Schema Validation', () => {
  97  |     /**
  98  |      * Positive Test: Color Creation
  99  |      * Verifies that a valid color object can be successfully created and persisted.
  100 |      */
  101 |     test('should create a new color with valid schema', async ({ request }) => {
  102 |       const uniqueName = faker.string.alphanumeric(15)
  103 |       const newColor = { name: uniqueName, hex: '#ffa500' }
  104 |       createdColorName = uniqueName
  105 |       const response = await request.post(`/api/colors`, { data: newColor })
  106 |       expect(response.status()).toBe(201)
  107 | 
  108 |       const data = await response.json()
  109 |       ColorSchema.parse(data)
  110 |       expect(data).toEqual(expect.objectContaining(newColor))
  111 |     })
  112 | 
  113 |     test('should return 409 for duplicate color creation', async ({ request }) => {
  114 |       const uniqueName = faker.string.alphanumeric(15)
  115 |       const color = { name: uniqueName, hex: '#111111' }
  116 |       createdColorName = uniqueName
  117 |       await request.post(`/api/colors`, { data: color })
  118 | 
  119 |       const response = await request.post(`/api/colors`, { data: color })
  120 |       expect(response.status()).toBe(409)
  121 |       const data = await response.json()
  122 |       expect(data.error).toBe(`Color "${uniqueName}" already exists`)
  123 |     })
  124 | 
  125 |     test('should reject missing name', async ({ request }) => {
  126 |       const response = await request.post(`/api/colors`, { data: { hex: '#ffa500' } })
  127 |       expect(response.status()).toBe(400)
  128 |       const data = await response.json()
  129 |       expect(data.error).toBe('Invalid input: expected string, received undefined')
  130 |     })
  131 | 
  132 |     test('should reject empty name', async ({ request }) => {
  133 |       const response = await request.post(`/api/colors`, { data: { name: '', hex: '#ffa500' } })
  134 |       expect(response.status()).toBe(400)
  135 |       const data = await response.json()
  136 |       expect(data.error).toBe(
  137 |         'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
  138 |       )
  139 |     })
  140 | 
  141 |     test('should reject missing hex', async ({ request }) => {
  142 |       const response = await request.post(`/api/colors`, { data: { name: 'Orange' } })
  143 |       expect(response.status()).toBe(400)
  144 |       const data = await response.json()
  145 |       expect(data.error).toBe('Invalid input: expected string, received undefined')
  146 |     })
  147 | 
  148 |     test('should reject invalid hex format', async ({ request }) => {
  149 |       const response = await request.post(`/api/colors`, {
  150 |         data: { name: 'Orange', hex: 'ffa500' }
  151 |       })
  152 |       expect(response.status()).toBe(400)
  153 |       const data = await response.json()
  154 |       expect(data.error).toContain('hex must be a valid 6-digit hex format')
  155 |     })
  156 |   })
  157 | 
  158 |   /**
  159 |    * Test Group: PUT /api/colors/:name
  160 |    * Verifies that existing colors can be updated and that input validation is enforced.
  161 |    */
  162 |   test.describe('PUT /api/colors/:name Schema Validation', () => {
  163 |     /**
  164 |      * Positive Test: Color Update
  165 |      * Verifies that an existing color's properties can be updated.
  166 |      */
  167 |     test('should update a color with valid schema', async ({ request }) => {
  168 |       const uniqueName = faker.string.alphanumeric(15)
  169 |       const tempColor = { name: uniqueName, hex: '#112233' }
  170 |       createdColorName = uniqueName
  171 |       await request.post(`/api/colors`, { data: tempColor })
  172 | 
  173 |       const updateData = { hex: '#332211' }
  174 |       const response = await request.put(`/api/colors/${tempColor.name}`, { data: updateData })
> 175 |       expect(response.status()).toBe(200)
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  176 | 
  177 |       const data = await response.json()
  178 |       ColorSchema.parse(data)
  179 |       expect(data.hex).toBe(updateData.hex)
  180 |     })
  181 | 
  182 |     test('should reject invalid hex format on update', async ({ request }) => {
  183 |       const response = await request.put(`/api/colors/Turquoise`, { data: { hex: '112233' } })
  184 |       expect(response.status()).toBe(400)
  185 |       const data = await response.json()
  186 |       expect(data.error).toContain('hex must be a valid 6-digit hex format')
  187 |     })
  188 | 
  189 |     test('should reject updating with empty name', async ({ request }) => {
  190 |       const response = await request.put(`/api/colors/Turquoise`, { data: { name: '' } })
  191 |       expect(response.status()).toBe(400)
  192 |       const data = await response.json()
  193 |       expect(data.error).toBe(
  194 |         'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
  195 |       )
  196 |     })
  197 | 
  198 |     test('should reject omitting both name and hex on update', async ({ request }) => {
  199 |       const response = await request.put(`/api/colors/Turquoise`, { data: {} })
  200 |       expect(response.status()).toBe(400)
  201 |       const data = await response.json()
  202 |       expect(data.error).toBe('At least one field to update must be provided')
  203 |     })
  204 | 
  205 |     test('should return 404 when updating non-existent color', async ({ request }) => {
  206 |       const response = await request.put(`/api/colors/DoesNotExist`, { data: { hex: '#222222' } })
  207 |       expect(response.status()).toBe(404)
  208 |       const data = await response.json()
  209 |       expect(data.error).toBe('Color not found')
  210 |     })
  211 |   })
  212 | 
  213 |   /**
  214 |    * Test Group: DELETE /api/colors/:name
  215 |    * Verifies that colors can be removed from the system.
  216 |    */
  217 |   test.describe('DELETE /api/colors/:name', () => {
  218 |     /**
  219 |      * Positive Test: Color Deletion
  220 |      * Verifies that an existing color can be deleted successfully.
  221 |      */
  222 |     test('should delete an existing color', async ({ request }) => {
  223 |       const uniqueName = faker.string.alphanumeric(15)
  224 |       const color = { name: uniqueName, hex: '#333333' }
  225 |       await request.post(`/api/colors`, { data: color })
  226 | 
  227 |       const response = await request.delete(`/api/colors/${color.name}`)
  228 |       expect(response.status()).toBe(200)
  229 |       const data = await response.json()
  230 |       expect(data.message).toBe(`Color "${uniqueName}" deleted successfully`)
  231 |     })
  232 | 
  233 |     test('should return 404 for non-existent color deletion', async ({ request }) => {
  234 |       const response = await request.delete(`/api/colors/DoesNotExist`)
  235 |       expect(response.status()).toBe(404)
  236 |       const data = await response.json()
  237 |       expect(data.error).toBe('Color not found')
  238 |     })
  239 |   })
  240 | })
  241 | 
```