/* eslint-env jest */
const request = require('supertest')
const { MongoDBContainer } = require('@testcontainers/mongodb')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

let app, seedDatabase, Color, mongodbContainer

describe('Server Integration Tests (Testcontainers)', () => {
  // Increase timeout for container startup
  jest.setTimeout(60000)

  beforeAll(async () => {
    // Programmatically load DOCKER_HOST from local config if it's not already set in the environment
    if (!process.env.DOCKER_HOST) {
      try {
        const configPath = path.resolve(__dirname, '../.docker-local/config.json')
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          if (config.DOCKER_HOST) {
            process.env.DOCKER_HOST = config.DOCKER_HOST
          }
        }
      } catch (e) {
        // Fallback to default Testcontainers detection
      }
    }

    // Start a real MongoDB container
    mongodbContainer = await new MongoDBContainer('mongo:7.0.5').start()
    const uri = `${mongodbContainer.getConnectionString()}?directConnection=true`
    // Set environment variable for the app to use
    process.env.MONGO_URI = uri

    // Connect mongoose
    await mongoose.connect(uri)

    // Import the app. Since it uses require(index), it will now use our MONGO_URI
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
    if (mongodbContainer) {
      await mongodbContainer.stop()
    }
  })

  // ---------------------------------------------------------------------------
  // GET /api/colors
  // ---------------------------------------------------------------------------

  describe('GET /api/colors', () => {
    it('should retrieve all seeded colors', async () => {
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(3)
      expect(res.body.map((c) => c.name)).toContain('Turquoise')
    })

    it('should not expose _id or __v fields', async () => {
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
      res.body.forEach((color) => {
        expect(color).not.toHaveProperty('_id')
        expect(color).not.toHaveProperty('__v')
      })
    })

    it('should return an empty array after all colors are deleted', async () => {
      await Color.deleteMany({})
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // GET /api/colors/:name
  // ---------------------------------------------------------------------------

  describe('GET /api/colors/:name', () => {
    it.each([
      { name: 'Turquoise', hex: '#1abc9c' },
      { name: 'Red', hex: '#e74c3c' },
      { name: 'Yellow', hex: '#f1c40f' }
    ])('should return correct data for $name', async ({ name, hex }) => {
      const res = await request(app).get(`/api/colors/${name}`)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ name, hex })
    })

    it('should be case-sensitive (lowercase name returns 404)', async () => {
      const res = await request(app).get('/api/colors/red')
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Color not found')
    })

    it('should return 404 for a non-existent color', async () => {
      const res = await request(app).get('/api/colors/GhostColor')
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Color not found')
    })

    it('should return 400 for invalid name format', async () => {
      const res = await request(app).get('/api/colors/<script>')
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('alphanumeric')
    })

    it('should not expose _id or __v fields', async () => {
      const res = await request(app).get('/api/colors/Turquoise')
      expect(res.status).toBe(200)
      expect(res.body).not.toHaveProperty('_id')
      expect(res.body).not.toHaveProperty('__v')
    })
  })

  // ---------------------------------------------------------------------------
  // POST /api/colors
  // ---------------------------------------------------------------------------

  describe('POST /api/colors', () => {
    it('should create a new color and persist it in the real database', async () => {
      const newColor = { name: 'Emerald', hex: '#2ecc71' }
      const res = await request(app).post('/api/colors').send(newColor)

      expect(res.status).toBe(201)
      expect(res.body).toEqual({ name: 'Emerald', hex: '#2ecc71' })

      const dbColor = await Color.findOne({ name: 'Emerald' })
      expect(dbColor).not.toBeNull()
      expect(dbColor.hex).toBe('#2ecc71')
    })

    it('should return 409 when creating a duplicate color name', async () => {
      await request(app).post('/api/colors').send({ name: 'Duplicate', hex: '#111111' })
      const res = await request(app).post('/api/colors').send({ name: 'Duplicate', hex: '#222222' })

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('already exists')
    })

    it('should return 400 when name is missing', async () => {
      const res = await request(app).post('/api/colors').send({ hex: '#ffffff' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('expected string')
    })

    it('should return 400 when hex is missing', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'NoHex' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('expected string')
    })

    it('should return 400 for invalid hex format (missing #)', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'BadHex', hex: 'ffffff' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('hex must be a valid 6-digit hex format')
    })

    it('should return 400 when extra fields are provided', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Teal', hex: '#008080', extra: 'field' })
      expect(res.status).toBe(400)
    })

    it('should accept a color name containing spaces', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Sky Blue', hex: '#87ceeb' })
      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Sky Blue')
    })

    it('should accept a single alphanumeric character as a name', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'A', hex: '#aabbcc' })
      expect(res.status).toBe(201)
      expect(res.body.name).toBe('A')
    })

    it('should not expose _id or __v in the creation response', async () => {
      const res = await request(app).post('/api/colors').send({ name: 'Cobalt', hex: '#0047ab' })
      expect(res.status).toBe(201)
      expect(res.body).not.toHaveProperty('_id')
      expect(res.body).not.toHaveProperty('__v')
    })
  })

  // ---------------------------------------------------------------------------
  // PUT /api/colors/:name
  // ---------------------------------------------------------------------------

  describe('PUT /api/colors/:name', () => {
    it('should update the hex of an existing color and persist it in the real database', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#ff0000' })

      expect(res.status).toBe(200)
      expect(res.body.hex).toBe('#ff0000')

      const updated = await Color.findOne({ name: 'Red' })
      expect(updated.hex).toBe('#ff0000')
    })

    it('should rename a color and make old name return 404', async () => {
      const res = await request(app).put('/api/colors/Yellow').send({ name: 'Gold' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Gold')

      const oldName = await request(app).get('/api/colors/Yellow')
      expect(oldName.status).toBe(404)

      const newName = await request(app).get('/api/colors/Gold')
      expect(newName.status).toBe(200)
      expect(newName.body.hex).toBe('#f1c40f')
    })

    it('should update both name and hex simultaneously', async () => {
      const res = await request(app).put('/api/colors/Turquoise').send({ name: 'Teal', hex: '#008080' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ name: 'Teal', hex: '#008080' })

      const dbColor = await Color.findOne({ name: 'Teal' })
      expect(dbColor).not.toBeNull()
      expect(dbColor.hex).toBe('#008080')
    })

    it('should return 400 when update body is empty', async () => {
      const res = await request(app).put('/api/colors/Red').send({})
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('At least one field to update must be provided')
    })

    it('should return 400 for invalid hex format on update', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: 'notahex' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('hex must be a valid 6-digit hex format')
    })

    it('should return 400 for invalid name in URL path', async () => {
      const res = await request(app).put('/api/colors/<bad>').send({ hex: '#ffffff' })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('alphanumeric')
    })

    it('should return 404 when updating a non-existent color', async () => {
      const res = await request(app).put('/api/colors/DoesNotExist').send({ hex: '#222222' })
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Color not found')
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE /api/colors/:name
  // ---------------------------------------------------------------------------

  describe('DELETE /api/colors/:name', () => {
    it('should delete a color and confirm removal from the real database', async () => {
      const res = await request(app).delete('/api/colors/Yellow')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('deleted successfully')

      const deleted = await Color.findOne({ name: 'Yellow' })
      expect(deleted).toBeNull()
    })

    it('should return 404 on a second delete of the same color', async () => {
      await request(app).delete('/api/colors/Red')
      const res = await request(app).delete('/api/colors/Red')
      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Color not found')
    })

    it('should return 400 for invalid name format', async () => {
      const res = await request(app).delete('/api/colors/<invalid>')
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('alphanumeric')
    })
  })

  // ---------------------------------------------------------------------------
  // seedDatabase
  // ---------------------------------------------------------------------------

  describe('seedDatabase', () => {
    it('should be idempotent — calling twice always yields exactly 3 colors', async () => {
      await seedDatabase()
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(3)
    })

    it('should clear custom colors when re-seeded', async () => {
      await request(app).post('/api/colors').send({ name: 'Custom', hex: '#123456' })
      let res = await request(app).get('/api/colors')
      expect(res.body).toHaveLength(4)

      await seedDatabase()

      res = await request(app).get('/api/colors')
      expect(res.body).toHaveLength(3)
      expect(res.body.map((c) => c.name)).not.toContain('Custom')
    })

    it('should always restore the three default seed colors', async () => {
      await Color.deleteMany({})
      await seedDatabase()

      const names = (await Color.find({})).map((c) => c.name)
      expect(names).toEqual(expect.arrayContaining(['Turquoise', 'Red', 'Yellow']))
    })
  })

  // ---------------------------------------------------------------------------
  // Method Not Allowed
  // ---------------------------------------------------------------------------

  describe('Method Not Allowed', () => {
    it('should return 405 for PATCH /api/colors', async () => {
      const res = await request(app).patch('/api/colors').send({})
      expect(res.status).toBe(405)
      expect(res.headers['allow']).toContain('GET')
      expect(res.headers['allow']).toContain('POST')
    })

    it('should return 405 for PATCH /api/colors/:name', async () => {
      const res = await request(app).patch('/api/colors/Red').send({})
      expect(res.status).toBe(405)
      expect(res.headers['allow']).toContain('GET')
      expect(res.headers['allow']).toContain('PUT')
      expect(res.headers['allow']).toContain('DELETE')
    })
  })

  // ---------------------------------------------------------------------------
  // Concurrent writes
  // ---------------------------------------------------------------------------

  describe('Concurrent writes', () => {
    it('should handle simultaneous POSTs with the same name — exactly one succeeds', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/colors')
            .send({ name: 'RaceColor', hex: `#${String(i).padStart(6, '0')}` })
        )
      )

      const statuses = results.map((r) => r.status)
      const created = statuses.filter((s) => s === 201)
      const conflicts = statuses.filter((s) => s === 409)

      // At least one must succeed, and total created + conflicts = 5
      expect(created.length).toBeGreaterThanOrEqual(1)
      expect(created.length + conflicts.length).toBe(5)
    })

    it('should handle parallel GETs without errors', async () => {
      const results = await Promise.all(
        ['Turquoise', 'Red', 'Yellow'].map((name) => request(app).get(`/api/colors/${name}`))
      )

      results.forEach((res) => {
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('name')
        expect(res.body).toHaveProperty('hex')
      })
    })
  })

  // ---------------------------------------------------------------------------
  // End-to-end CRUD workflow
  // ---------------------------------------------------------------------------

  describe('End-to-end CRUD workflow', () => {
    it('should create, read, update, and delete a color in sequence', async () => {
      // Create
      const createRes = await request(app).post('/api/colors').send({ name: 'Workflow', hex: '#aabbcc' })
      expect(createRes.status).toBe(201)

      // Read
      const getRes = await request(app).get('/api/colors/Workflow')
      expect(getRes.status).toBe(200)
      expect(getRes.body).toEqual({ name: 'Workflow', hex: '#aabbcc' })

      // Update
      const updateRes = await request(app).put('/api/colors/Workflow').send({ hex: '#ddeeff' })
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.hex).toBe('#ddeeff')

      // Verify update persisted
      const getUpdatedRes = await request(app).get('/api/colors/Workflow')
      expect(getUpdatedRes.body.hex).toBe('#ddeeff')

      // Delete
      const deleteRes = await request(app).delete('/api/colors/Workflow')
      expect(deleteRes.status).toBe(200)

      // Verify gone
      const getDeletedRes = await request(app).get('/api/colors/Workflow')
      expect(getDeletedRes.status).toBe(404)
    })
  })
})
