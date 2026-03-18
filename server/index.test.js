const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let app, seedDatabase, Color, mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)

  // Import after mongoose is connected so the app uses our in-memory DB
  const server = require('./index')
  app = server.app
  seedDatabase = server.seedDatabase
  Color = server.Color
})

beforeEach(async () => {
  await seedDatabase()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

// =========================================================================
// GET /api/colors
// =========================================================================
describe('GET /api/colors', () => {
  it('returns all seeded colors with correct names and hex values', async () => {
    const res = await request(app).get('/api/colors')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)

    const names = res.body.map((c) => c.name)
    const hexes = res.body.map((c) => c.hex)
    expect(names).toContain('Turquoise')
    expect(names).toContain('Red')
    expect(names).toContain('Yellow')
    expect(hexes).toContain('#1abc9c')
    expect(hexes).toContain('#e74c3c')
    expect(hexes).toContain('#f1c40f')
  })

  it('does not expose _id or __v fields', async () => {
    const res = await request(app).get('/api/colors')
    expect(res.status).toBe(200)
    res.body.forEach((color) => {
      expect(color).not.toHaveProperty('_id')
      expect(color).not.toHaveProperty('__v')
      expect(color).toHaveProperty('name')
      expect(color).toHaveProperty('hex')
    })
  })

  it('returns an empty array when no colors exist', async () => {
    await Color.deleteMany({})
    const res = await request(app).get('/api/colors')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns JSON content type', async () => {
    const res = await request(app).get('/api/colors')
    expect(res.headers['content-type']).toMatch(/json/)
  })
})

// =========================================================================
// GET /api/colors/:name
// =========================================================================
describe('GET /api/colors/:name', () => {
  it('returns a single color by name with correct fields', async () => {
    const res = await request(app).get('/api/colors/Red')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Red')
    expect(res.body.hex).toBe('#e74c3c')
    expect(res.body).not.toHaveProperty('_id')
    expect(res.body).not.toHaveProperty('__v')
  })

  it('returns Turquoise color correctly', async () => {
    const res = await request(app).get('/api/colors/Turquoise')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Turquoise')
    expect(res.body.hex).toBe('#1abc9c')
  })

  it('returns Yellow color correctly', async () => {
    const res = await request(app).get('/api/colors/Yellow')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Yellow')
    expect(res.body.hex).toBe('#f1c40f')
  })

  it('returns 404 for a non-existent color', async () => {
    const res = await request(app).get('/api/colors/NonExistent')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Color not found')
  })

  it('is case-sensitive', async () => {
    const res = await request(app).get('/api/colors/red')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Color not found')
  })
})

// =========================================================================
// POST /api/colors
// =========================================================================
describe('POST /api/colors', () => {
  it('creates a new color and returns 201 with correct body', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Blue', hex: '#3498db' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Blue')
    expect(res.body.hex).toBe('#3498db')
    expect(res.body).not.toHaveProperty('_id')
    expect(res.body).not.toHaveProperty('__v')

    // Verify it was actually persisted
    const check = await request(app).get('/api/colors/Blue')
    expect(check.status).toBe(200)
    expect(check.body.name).toBe('Blue')
    expect(check.body.hex).toBe('#3498db')
  })

  it('returns 409 for a duplicate color name with descriptive error', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Red', hex: '#ff0000' })
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('Red')
    expect(res.body.error).toContain('already exists')
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ hex: '#aabbcc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
    expect(typeof res.body.error).toBe('string')
  })

  it('returns 400 when hex is missing', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Magenta' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
    expect(typeof res.body.error).toBe('string')
  })

  it('returns 400 for invalid hex format (no hash)', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'BadHex', hex: 'aabbcc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('hex')
  })

  it('returns 400 for invalid hex format (too short)', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Short', hex: '#abc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('hex')
  })

  it('returns 400 for extra unknown fields (strict schema)', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Orange', hex: '#e67e22', extra: 'field' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 for name with only spaces', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: '   ', hex: '#aabbcc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 for name with special characters', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: '@#$!', hex: '#aabbcc' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('alphanumeric')
  })

  it('trims whitespace from name and hex', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: '  Green  ', hex: '  #2ecc71  ' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Green')
    expect(res.body.hex).toBe('#2ecc71')
  })

  it('returns 400 for completely empty body', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('accepts names with alphanumeric characters and spaces', async () => {
    const res = await request(app)
      .post('/api/colors')
      .send({ name: 'Light Blue 2', hex: '#add8e6' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Light Blue 2')
  })
})

// =========================================================================
// PUT /api/colors/:name
// =========================================================================
describe('PUT /api/colors/:name', () => {
  it('updates the hex of an existing color', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ hex: '#ff0000' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Red')
    expect(res.body.hex).toBe('#ff0000')
    expect(res.body).not.toHaveProperty('_id')
    expect(res.body).not.toHaveProperty('__v')

    // Verify the update persisted
    const check = await request(app).get('/api/colors/Red')
    expect(check.body.hex).toBe('#ff0000')
  })

  it('updates the name of an existing color', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ name: 'Crimson' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Crimson')

    // Old name should not exist anymore
    const old = await request(app).get('/api/colors/Red')
    expect(old.status).toBe(404)
    // New name should exist
    const newColor = await request(app).get('/api/colors/Crimson')
    expect(newColor.status).toBe(200)
  })

  it('updates both name and hex simultaneously', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ name: 'Scarlet', hex: '#ff2400' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Scarlet')
    expect(res.body.hex).toBe('#ff2400')
  })

  it('returns 404 for a non-existent color', async () => {
    const res = await request(app)
      .put('/api/colors/NonExistent')
      .send({ hex: '#000000' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Color not found')
  })

  it('returns 400 when no fields are provided (empty body)', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('At least one field')
  })

  it('returns 400 for invalid hex on update', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ hex: 'badhex' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('hex')
  })

  it('returns 400 for extra unknown fields (strict schema)', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ hex: '#ff0000', extra: 'field' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 for invalid name with special characters', async () => {
    const res = await request(app)
      .put('/api/colors/Red')
      .send({ name: '@invalid!' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('alphanumeric')
  })
})

// =========================================================================
// DELETE /api/colors/:name
// =========================================================================
describe('DELETE /api/colors/:name', () => {
  it('deletes an existing color and returns success message', async () => {
    const res = await request(app).delete('/api/colors/Yellow')
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Yellow')
    expect(res.body.message).toContain('deleted successfully')

    // Verify it is actually gone
    const check = await request(app).get('/api/colors/Yellow')
    expect(check.status).toBe(404)

    // Verify other colors still exist
    const all = await request(app).get('/api/colors')
    expect(all.body).toHaveLength(2)
  })

  it('returns 404 for a non-existent color', async () => {
    const res = await request(app).delete('/api/colors/NonExistent')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Color not found')
  })

  it('cannot delete the same color twice', async () => {
    await request(app).delete('/api/colors/Red')
    const res = await request(app).delete('/api/colors/Red')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Color not found')
  })
})

// =========================================================================
// 405 Method Not Allowed
// =========================================================================
describe('405 Method Not Allowed', () => {
  it('returns 405 for PATCH on /api/colors', async () => {
    const res = await request(app).patch('/api/colors')
    expect(res.status).toBe(405)
    expect(res.body.error).toContain('not allowed')
    expect(res.body.error).toContain('PATCH')
    expect(res.body.error).toContain('/api/colors')
  })

  it('returns 405 for PATCH on /api/colors/:name', async () => {
    const res = await request(app).patch('/api/colors/Red')
    expect(res.status).toBe(405)
    expect(res.body.error).toContain('not allowed')
    expect(res.body.error).toContain('PATCH')
    expect(res.body.error).toContain('/api/colors/:name')
  })

  it('sets the Allow header on /api/colors with correct methods', async () => {
    const res = await request(app).patch('/api/colors')
    expect(res.status).toBe(405)
    expect(res.headers.allow).toBe('GET, POST')
  })

  it('sets the Allow header on /api/colors/:name with correct methods', async () => {
    const res = await request(app).patch('/api/colors/Red')
    expect(res.status).toBe(405)
    expect(res.headers.allow).toBe('GET, PUT, DELETE')
  })
})

// =========================================================================
// Seed database
// =========================================================================
describe('seedDatabase', () => {
  it('clears existing colors and re-seeds with 3 defaults', async () => {
    // Add an extra color
    await Color.create({ name: 'Extra', hex: '#ffffff' })
    const before = await Color.countDocuments()
    expect(before).toBe(4)

    // Re-seed
    await seedDatabase()
    const after = await Color.countDocuments()
    expect(after).toBe(3)

    // Verify exact contents
    const colors = await Color.find({}, { _id: 0, __v: 0 }).lean()
    const names = colors.map((c) => c.name)
    expect(names).toContain('Turquoise')
    expect(names).toContain('Red')
    expect(names).toContain('Yellow')
    expect(names).not.toContain('Extra')
  })
})

// =========================================================================
// OpenAPI / Swagger
// =========================================================================
describe('OpenAPI endpoints', () => {
  it('serves the OpenAPI JSON spec with correct metadata', async () => {
    const res = await request(app).get('/openapi.json')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/json/)
    expect(res.body.openapi).toBe('3.0.0')
    expect(res.body.info.title).toBe('Colors API')
    expect(res.body.info.version).toBe('1.0.0')
    expect(res.body.info.description).toBeDefined()
    expect(res.body.paths).toHaveProperty('/api/colors')
    expect(res.body.paths).toHaveProperty('/api/colors/{name}')
  })

  it('serves Swagger UI as HTML', async () => {
    const res = await request(app).get('/api-docs/')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/html/)
  })

  it('spec includes component schemas', async () => {
    const res = await request(app).get('/openapi.json')
    expect(res.body.components.schemas).toHaveProperty('Color')
    expect(res.body.components.schemas).toHaveProperty('UpdateColor')
    expect(res.body.components.schemas).toHaveProperty('Error')
  })
})

// =========================================================================
// Middleware - CORS and JSON parsing
// =========================================================================
describe('Middleware', () => {
  it('includes CORS headers', async () => {
    const res = await request(app).get('/api/colors')
    expect(res.headers['access-control-allow-origin']).toBe('*')
  })

  it('handles non-JSON content type gracefully on POST', async () => {
    const res = await request(app)
      .post('/api/colors')
      .set('Content-Type', 'text/plain')
      .send('not json')
    // Should return 400 (validation fails) rather than 500
    expect(res.status).toBeLessThan(500)
  })
})
