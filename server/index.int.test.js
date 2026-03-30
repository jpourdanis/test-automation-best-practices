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
    await mongodbContainer.stop()
  })

  describe('CRUD Operations with Real MongoDB', () => {
    it('should retrieve all seeded colors', async () => {
      const res = await request(app).get('/api/colors')
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(3)
      expect(res.body.map((c) => c.name)).toContain('Turquoise')
    })

    it('should create a new color in the real database', async () => {
      const newColor = { name: 'Emerald', hex: '#2ecc71' }
      const res = await request(app).post('/api/colors').send(newColor)

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Emerald')

      // Verify persistence in real DB
      const dbColor = await Color.findOne({ name: 'Emerald' })
      expect(dbColor).toBeDefined()
      expect(dbColor.hex).toBe('#2ecc71')
    })

    it('should update an existing color', async () => {
      const res = await request(app).put('/api/colors/Red').send({ hex: '#ff0000' })

      expect(res.status).toBe(200)
      expect(res.body.hex).toBe('#ff0000')

      const updated = await Color.findOne({ name: 'Red' })
      expect(updated.hex).toBe('#ff0000')
    })

    it('should delete a color', async () => {
      const res = await request(app).delete('/api/colors/Yellow')
      expect(res.status).toBe(200)

      const deleted = await Color.findOne({ name: 'Yellow' })
      expect(deleted).toBeNull()
    })
  })

  describe('Error Handling & Constraints', () => {
    it('should return 409 when creating a duplicate color name', async () => {
      await request(app).post('/api/colors').send({ name: 'Duplicate', hex: '#111111' })
      const res = await request(app).post('/api/colors').send({ name: 'Duplicate', hex: '#222222' })

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('already exists')
    })

    it('should return 404 for non-existent color lookup', async () => {
      const res = await request(app).get('/api/colors/GhostColor')
      expect(res.status).toBe(404)
    })
  })
})
