/* eslint-env jest */
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let app, seedDatabase, Color, mongoServer

describe('Server Unit Tests', () => {
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

    it('returns 400 for invalid name in path (regex check)', async () => {
      const res = await request(app).get('/api/colors/!!Invalid!!')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })
  })

  // =========================================================================
  // POST /api/colors
  // =========================================================================
  describe('POST /api/colors', () => {
    it('creates a new color and returns 201 with correct body', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Blue', hex: '#3498db' })
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
      const res = await request(app).post('/api/colors').send({ name: 'Red', hex: '#ff0000' })
      expect(res.status).toBe(409)
      expect(res.body.error).toBe('Color "Red" already exists')
    })

    it('returns 400 when name is missing', async () => {
      const res = await request(app).post('/api/colors').send({ hex: '#aabbcc' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input: expected string, received undefined')
    })

    it('returns 400 when hex is missing', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Magenta' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input: expected string, received undefined')
    })

    it('returns 400 for invalid hex format (no hash)', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'BadHex', hex: 'aabbcc' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('hex must be a valid 6-digit hex format (e.g., #1abc9c)')
    })

    it('returns 400 for invalid hex format (too short)', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Short', hex: '#abc' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('hex must be a valid 6-digit hex format (e.g., #1abc9c)')
    })

    it('returns 400 for extra unknown fields (strict schema)', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Orange', hex: '#e67e22', extra: 'field' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Unrecognized key: "extra"')
    })

    it('returns 400 for name with only spaces', async () => {
      const res = await request(app).post('/api/colors').send({ name: '   ', hex: '#aabbcc' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })

    it('returns 400 for name with special characters', async () => {
      const res = await request(app).post('/api/colors').send({ name: '@#$!', hex: '#aabbcc' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })

    it('returns 400 for name with whitespace', async () => {
      const res = await request(app).post('/api/colors').send({ name: '  Green  ', hex: '#2ecc71' })
      expect(res.status).toBe(400)
    })

    it('returns 400 for completely empty body', async () => {
      const res = await request(app).post('/api/colors').send({})
      expect(res.status).toBe(400)
      // Name is required should be the first error
      expect(res.body.error).toBe('Invalid input: expected string, received undefined')
    })

    it('accepts names with alphanumeric characters and spaces', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Light Blue 2', hex: '#add8e6' })
      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Light Blue 2')
    })

    it('accepts single alphanumeric characters as names', async () => {
      const res1 = await request(app).post('/api/colors').send({ name: 'A', hex: '#123456' })
      expect(res1.status).toBe(201)
      const res2 = await request(app).post('/api/colors').send({ name: '1', hex: '#654321' })
      expect(res2.status).toBe(201)
    })

    it('accepts names with the + character', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Red+Blue', hex: '#800080' })
      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Red+Blue')
    })

    it('applies the createColorLimiter rate limit headers', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'RateLimitTest', hex: '#123456' })
      expect(res.headers['x-ratelimit-limit']).toBe('100')
      expect(res.headers['x-ratelimit-remaining']).toBeDefined()
    })
  })

  // =========================================================================
  // PUT /api/colors/:name
  // =========================================================================
  describe('PUT /api/colors/:name', () => {
    it('updates the hex of an existing color', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#ff0000' })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Red')
      expect(res.body.hex).toBe('#ff0000')
      expect(res.body).not.toHaveProperty('_id')
      expect(res.body).not.toHaveProperty('__v')

      // Verify the update persisted
      const check = await request(app).get('/api/colors/Red')
      expect(check.body.hex).toBe('#ff0000')
    })

    it('does not change name when updating only hex', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#0000ff' })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Red')
      expect(res.body.hex).toBe('#0000ff')
    })

    it('updates the name of an existing color and preserves hex', async () => {
      const res = await request(app).put('/api/colors/Red').send({ name: 'Crimson' })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Crimson')
      expect(res.body.hex).toBe('#e74c3c') // Original hex for Red

      // Old name should not exist anymore
      const old = await request(app).get('/api/colors/Red')
      expect(old.status).toBe(404)
      // New name should exist
      const newColor = await request(app).get('/api/colors/Crimson')
      expect(newColor.status).toBe(200)
      expect(newColor.body.hex).toBe('#e74c3c')
    })

    it('updates both name and hex simultaneously', async () => {
      const res = await request(app).put('/api/colors/Red').send({ name: 'Scarlet', hex: '#ff2400' })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Scarlet')
      expect(res.body.hex).toBe('#ff2400')
    })

    it('returns 404 for a non-existent color', async () => {
      const res = await request(app).put('/api/colors/NonExistent').send({ hex: '#000000' })
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Color not found')
    })

    it('returns 400 when no fields are provided (empty body)', async () => {
      const res = await request(app).put('/api/colors/Red').send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('At least one field to update must be provided')
    })

    it('returns 400 for invalid hex on update', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: 'badhex' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('hex must be a valid 6-digit hex format')
    })

    it('returns 400 for extra unknown fields (strict schema)', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#ff0000', extra: 'field' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Unrecognized key: "extra"')
    })

    it('returns 400 for invalid name with special characters', async () => {
      const res = await request(app).put('/api/colors/Red').send({ name: '@invalid!' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })

    it('returns 400 for invalid name in path (regex check)', async () => {
      const res = await request(app).put('/api/colors/!!Invalid!!').send({ hex: '#123456' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })

    it('returns 400 for invalid current name format in URL', async () => {
      const res = await request(app).put('/api/colors/invalid!@#').send({ hex: '#000000' })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })
  })

  // =========================================================================
  // DELETE /api/colors/:name
  // =========================================================================
  describe('DELETE /api/colors/:name', () => {
    it('deletes an existing color and returns success message', async () => {
      const res = await request(app).delete('/api/colors/Yellow')
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Color "Yellow" deleted successfully')

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

    it('returns 400 for invalid name in path (regex check)', async () => {
      const res = await request(app).delete('/api/colors/!!Invalid!!')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe(
        'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'
      )
    })
  })

  // =========================================================================
  // 405 Method Not Allowed
  // =========================================================================
  describe('405 Method Not Allowed', () => {
    it('returns 405 for PATCH on /api/colors', async () => {
      const res = await request(app).patch('/api/colors')
      expect(res.status).toBe(405)
      expect(res.body.error).toBe('Method PATCH not allowed on /api/colors')
    })

    it('returns 405 for PATCH on /api/colors/:name', async () => {
      const res = await request(app).patch('/api/colors/Red')
      expect(res.status).toBe(405)
      expect(res.body.error).toBe('Method PATCH not allowed on /api/colors/:name')
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

    it('does not return 405 for allowed GET method on /api/colors', async () => {
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
    })

    it('does not return 405 for allowed POST method on /api/colors', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'AllowedMethod', hex: '#123456' })
      expect(res.status).toBe(201)
    })

    it('does not return 405 for allowed GET method on /api/colors/:name', async () => {
      const res = await request(app).get('/api/colors/Red')
      expect(res.status).toBe(200)
    })

    it('does not return 405 for allowed PUT method on /api/colors/:name', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#123456' })
      expect(res.status).toBe(200)
    })

    it('does not return 405 for allowed DELETE method on /api/colors/:name', async () => {
      const res = await request(app).delete('/api/colors/Red')
      expect(res.status).toBe(200)
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
    it('serves the OpenAPI JSON spec with exact metadata', async () => {
      const res = await request(app).get('/openapi.json')
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toBe('application/json; charset=utf-8')
      expect(res.body.openapi).toBe('3.0.0')
      expect(res.body.info.title).toBe('Colors API')
      expect(res.body.info.version).toBe('1.0.0')
      expect(res.body.info.description).toBe(
        'A simple CRUD API for managing colors, backed by MongoDB. ' +
          'This API is used by the Test Automation Best Practices demo application.'
      )
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

    it('has exact application/json content-type', async () => {
      const res = await request(app).get('/openapi.json')
      expect(res.headers['content-type']).toBe('application/json; charset=utf-8')
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

    it('does not include X-Powered-By header', async () => {
      const res = await request(app).get('/api/colors')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })

    it('handles non-JSON content type gracefully on POST', async () => {
      const res = await request(app).post('/api/colors').set('Content-Type', 'text/plain').send('not json')
      // Should return 400 (validation fails)
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid input: expected object, received undefined')
    })

    it('returns 400 for malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/colors')
        .set('Content-Type', 'application/json')
        .send('{"name": "Broken", "hex": "#123456",}') // Trailing comma makes it invalid JSON
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid JSON')
      expect(res.body.details).toBeDefined()
    })

    it('JSON error middleware passes non-syntax errors to next()', async () => {
      // Create a temporary route that throws a non-syntax error
      app.get('/test-error-next', (req, res, next) => {
        const err = new Error('Normal Error')
        err.status = 400
        next(err)
      })
      const res = await request(app).get('/test-error-next')
      expect(res.status).toBe(400) // Default express handler or no matching route
    })

    it('JSON error middleware ignores SyntaxError with status != 400', async () => {
      app.get('/test-syntax-500', (req, res, next) => {
        const err = new SyntaxError('Syntax but 500')
        err.status = 500
        err.body = {}
        next(err)
      })
      const res = await request(app).get('/test-syntax-500')
      expect(res.status).toBe(500)
    })

    it('JSON error middleware ignores SyntaxError without body', async () => {
      app.get('/test-syntax-no-body', (req, res, next) => {
        const err = new SyntaxError('Syntax but no body')
        err.status = 400
        next(err)
      })
      const res = await request(app).get('/test-syntax-no-body')
      expect(res.status).toBe(400)
    })
  })

  // =========================================================================
  // Error Handling (Catch Blocks)
  // =========================================================================
  describe('Error Handling', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('GET /api/colors returns 500 when database fails', async () => {
      jest.spyOn(Color, 'find').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Error fetching colors')
    })

    it('GET /api/colors/:name returns 500 when database fails', async () => {
      jest.spyOn(Color, 'findOne').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).get('/api/colors/Red')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to fetch color')
    })

    it('POST /api/colors returns 500 when database fails (findOne)', async () => {
      jest.spyOn(Color, 'findOne').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).post('/api/colors').send({ name: 'Purple', hex: '#800080' })
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to create color')
    })

    it('POST /api/colors returns 500 when database fails (create)', async () => {
      jest.spyOn(Color, 'findOne').mockResolvedValue(null)
      jest.spyOn(Color, 'create').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).post('/api/colors').send({ name: 'Purple', hex: '#800080' })
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to create color')
    })

    it('PUT /api/colors/:name returns 500 when database fails', async () => {
      jest.spyOn(Color, 'findOne').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).put('/api/colors/Red').send({ hex: '#ff0000' })
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to update color')
    })

    it('DELETE /api/colors/:name returns 500 when database fails', async () => {
      jest.spyOn(Color, 'findOneAndDelete').mockRejectedValue(new Error('DB Error'))
      const res = await request(app).delete('/api/colors/Red')
      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Failed to delete color')
    })

    it('seedDatabase logs error when database fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(Color, 'deleteMany').mockRejectedValue(new Error('DB Error'))

      await seedDatabase()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error seeding database:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  // =========================================================================
  // Surviving Mutants & Edge Cases
  // =========================================================================
  describe('Surviving Mutants & Edge Cases', () => {
    describe('Logs', () => {
      it('seedDatabase logs success message', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        await seedDatabase()
        expect(consoleLogSpy).toHaveBeenCalledWith('Database seeded with default colors')
        consoleLogSpy.mockRestore()
      })
    })

    describe('Infrastructure', () => {
      it('uses MONGO_URI from environment if available', () => {
        const originalUri = process.env.MONGO_URI
        const testUri = 'mongodb://test-server:27017/testdb'
        process.env.MONGO_URI = testUri
        jest.resetModules()

        const { MONGO_URI } = require('./index')
        expect(MONGO_URI).toBe(testUri)

        // Cleanup
        process.env.MONGO_URI = originalUri
      })

      it('uses default MONGO_URI when process.env.MONGO_URI is missing', () => {
        const originalUri = process.env.MONGO_URI
        delete process.env.MONGO_URI

        // Mock dotenv before requiring to prevent it from loading .env again
        const dotenv = require('dotenv')
        jest.spyOn(dotenv, 'config').mockImplementation(() => ({}))

        jest.resetModules()

        // We need to re-mock dotenv after resetModules for it to affect index.js
        jest.doMock('dotenv', () => ({ config: () => ({}) }))

        const { MONGO_URI } = require('./index')
        expect(MONGO_URI).toBe('mongodb://localhost:27017/colorsdb')

        // Cleanup
        jest.unmock('dotenv')
        process.env.MONGO_URI = originalUri
      })
    })

    describe('Regex & Validation', () => {
      it('STRICT_NAME_REGEX kills mutants on start/end/middle characters', async () => {
        // Mutant: starts with anything (removing ^)
        const res1 = await request(app).post('/api/colors').send({ name: '! Invalid', hex: '#123456' })
        expect(res1.status).toBe(400)

        // Mutant: ends with anything (removing $)
        const res2 = await request(app).post('/api/colors').send({ name: 'Invalid !', hex: '#123456' })
        expect(res2.status).toBe(400)

        // Mutant: first required char is optional
        const res3 = await request(app).post('/api/colors').send({ name: ' ', hex: '#123456' })
        expect(res3.status).toBe(400)

        // Leading space should fail (kills mutants that loosen the regex)
        const res4 = await request(app).post('/api/colors').send({ name: ' Name', hex: '#123456' })
        expect(res4.status).toBe(400)

        // Trailing space should fail
        const res5 = await request(app).post('/api/colors').send({ name: 'Name ', hex: '#123456' })
        expect(res5.status).toBe(400)
      })

      it('STRICT_NAME_REGEX kills mutants by testing multiple spaces and pluses in the middle', async () => {
        const res1 = await request(app).post('/api/colors').send({ name: 'Red  Blue', hex: '#123456' })
        expect(res1.status).toBe(201)
        const res2 = await request(app).post('/api/colors').send({ name: 'Red++Blue', hex: '#123456' })
        expect(res2.status).toBe(201)
        const res3 = await request(app).post('/api/colors').send({ name: 'A + B', hex: '#123456' })
        expect(res3.status).toBe(201)
      })

      it('STRICT_NAME_REGEX is strict on forbidden special characters in the middle', async () => {
        const forbidden = ['Red$Blue', 'Red_Blue', 'Red.Blue', 'Red!Blue']
        for (const name of forbidden) {
          const res = await request(app).post('/api/colors').send({ name, hex: '#123456' })
          expect(res.status).toBe(400)
        }
      })

      it('STRICT_NAME_REGEX kills mutants on optionality and length', async () => {
        // Single char should pass
        const res1 = await request(app).post('/api/colors').send({ name: 'A', hex: '#123456' })
        expect(res1.status).toBe(201)

        // Two chars should pass
        const res2 = await request(app).post('/api/colors').send({ name: 'A1', hex: '#123456' })
        expect(res2.status).toBe(201)

        // Three chars with space should pass
        const res3 = await request(app).post('/api/colors').send({ name: 'A B', hex: '#123456' })
        expect(res3.status).toBe(201)
      })

      it('hex regex kills mutants by testing boundaries and formats', async () => {
        // Missing #
        const res1 = await request(app).post('/api/colors').send({ name: 'ValidName', hex: '123456' })
        expect(res1.status).toBe(400)

        // Too long
        const res2 = await request(app).post('/api/colors').send({ name: 'ValidName', hex: '#1234567' })
        expect(res2.status).toBe(400)

        // Invalid chars
        const res3 = await request(app).post('/api/colors').send({ name: 'ValidName', hex: '#GGGGGG' })
        expect(res3.status).toBe(400)
      })

      it('Zod required_error messages are correct', async () => {
        const res1 = await request(app).post('/api/colors').send({ hex: '#123456' })
        expect(res1.body.error).toBe('Invalid input: expected string, received undefined')

        const res2 = await request(app).post('/api/colors').send({ name: 'Name' })
        expect(res2.body.error).toBe('Invalid input: expected string, received undefined')
      })
    })

    describe('PUT logic', () => {
      it('kills name/hex conditional mutants by providing only one field', async () => {
        // Only hex
        const res1 = await request(app).put('/api/colors/Red').send({ hex: '#0000ff' })
        expect(res1.status).toBe(200)
        expect(res1.body.name).toBe('Red')
        expect(res1.body.hex).toBe('#0000ff')

        // Only name
        const res2 = await request(app)
          .put('/api/colors/Red') // Note: previous test changed Red's hex, but name is still Red here because of beforeEach seed
          .send({ name: 'FireRed' })
        expect(res2.status).toBe(200)
        expect(res2.body.name).toBe('FireRed')
      })
    })

    describe('Allowed Methods', () => {
      it('kills mutants in allowedMethods object', async () => {
        // Use PATCH instead of OPTIONS to avoid CORS middleware interception
        const res1 = await request(app).patch('/api/colors')
        expect(res1.status).toBe(405)
        expect(res1.headers.allow).toBe('GET, POST')

        const res2 = await request(app).patch('/api/colors/Red')
        expect(res2.status).toBe(405)
        expect(res2.headers.allow).toBe('GET, PUT, DELETE')
      })
    })

    describe('OpenAPI Content-Type', () => {
      it('has application/json content-type', async () => {
        const res = await request(app).get('/openapi.json')
        expect(res.headers['content-type']).toBe('application/json; charset=utf-8')
      })
    })

    describe('Security & Infrastructure', () => {
      it('kills mutants by verifying x-powered-by is removed', async () => {
        const res = await request(app).get('/api/colors')
        expect(res.headers['x-powered-by']).toBeUndefined()
      })

      it('kills mutants by verifying x-ratelimit-limit on POST', async () => {
        const res = await request(app).post('/api/colors').send({ name: 'LimitTest', hex: '#123456' })
        expect(res.headers['x-ratelimit-limit']).toBe('100')
        expect(res.headers['x-ratelimit-remaining']).toBeDefined()
      })

      it('kills mutants in Swagger metadata', async () => {
        const res = await request(app).get('/openapi.json')
        expect(res.body.info.title).toBe('Colors API')
        expect(res.body.servers).toHaveLength(2)
        expect(res.body.servers[0].url).toBe('https://test-automation-best-practices.vercel.app')
        expect(res.body.servers[0].description).toBe('Vercel Production Server')
      })
    })

    describe('Port Fallback', () => {
      it('uses default PORT 5001 when process.env.PORT is missing', async () => {
        const originalPort = process.env.PORT
        delete process.env.PORT
        jest.resetModules()
        const { app: localApp } = require('./index')
        const res = await request(localApp).get('/openapi.json')
        expect(res.body.servers[1].url).toBe('http://localhost:5001')
        process.env.PORT = originalPort
      })

      it('reflects process.env.PORT in Swagger servers', async () => {
        const originalPort = process.env.PORT
        process.env.PORT = '9999'
        jest.resetModules()
        const { app: localApp } = require('./index')
        const res = await request(localApp).get('/openapi.json')
        expect(res.body.servers[1].url).toBe('http://localhost:9999')
        process.env.PORT = originalPort
      })
    })

    describe('Swagger Metadata', () => {
      it('has correct title and version', async () => {
        const res = await request(app).get('/openapi.json')
        expect(res.body.info.title).toBe('Colors API')
        expect(res.body.info.version).toBe('1.0.0')
      })

      it('has correct production server URL', async () => {
        const res = await request(app).get('/openapi.json')
        expect(res.body.servers[0].url).toBe('https://test-automation-best-practices.vercel.app')
      })
    })
  })
})
