require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const { z } = require('zod')
const rateLimit = require('express-rate-limit')

const app = express()
app.disable('x-powered-by')
const createColorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 create-color requests per windowMs
})

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

// Strict regex: allows spaces, but REQUIRES at least one letter or number
const STRICT_NAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9 +]*[a-zA-Z0-9])?$/
const STRICT_NAME_MSG =
  'name must contain alphanumeric characters and spaces only, and at least one alphanumeric character'

const colorZodSchema = z
  .object({
    name: z.string({ required_error: 'name is required' }).regex(STRICT_NAME_REGEX, STRICT_NAME_MSG),
    hex: z
      .string({ required_error: 'hex is required' })
      .regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format (e.g., #1abc9c)')
  })
  .strict()

const updateColorZodSchema = z
  .object({
    name: z.string().regex(STRICT_NAME_REGEX, STRICT_NAME_MSG).optional(),
    hex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'hex must be a valid 6-digit hex format')
      .optional()
  })
  .strict()
  .refine((data) => data.name !== undefined || data.hex !== undefined, {
    message: 'At least one field to update must be provided'
  })

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors()) // Enable CORS for all origins
app.use(express.json()) // Parse incoming JSON request bodies

// Middleware to catch JSON parsing errors and return a JSON response instead of HTML
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON', details: err.message })
  }
  next()
})

// ---------------------------------------------------------------------------
// Swagger / OpenAPI configuration
// ---------------------------------------------------------------------------

// Swagger metadata configuration, not business logic
/** @type {import('swagger-jsdoc').Options} */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Colors API',
      version: '1.0.0',
      description:
        'A simple CRUD API for managing colors, backed by MongoDB. ' +
        'This API is used by the Test Automation Best Practices demo application.'
    },
    servers: [
      {
        url: 'https://test-automation-best-practices.vercel.app',
        description: 'Vercel Production Server'
      },
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
        description: 'Local development server'
      }
    ]
  },
  // Scan this and api/index.js for JSDoc @swagger annotations
  apis: [__filename, 'api/index.js']
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

// Serve Swagger UI at /api-docs (with 405 handler)
app.all('/api-docs', (req, res, next) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: `Method ${req.method} not allowed on /api-docs` })
  }
  next()
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Serve OpenAPI spec as JSON at /openapi.json (with 405 handler)
app.all('/openapi.json', (req, res, next) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: `Method ${req.method} not allowed on /openapi.json` })
  }
  next()
})
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// ---------------------------------------------------------------------------
// Swagger component schemas (reusable across endpoints)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * components:
 *   schemas:
 *     Color:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - name
 *         - hex
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\x20+]*[a-zA-Z0-9])?$'
 *           description: Human-readable color name
 *           example: Turquoise
 *         hex:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           description: Hex color code including the leading #
 *           example: "#1abc9c"
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *     UpdateColor:
 *       type: object
 *       additionalProperties: false
 *       anyOf:
 *         - required: [name]
 *         - required: [hex]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\x20+]*[a-zA-Z0-9])?$'
 *           description: New name for the color
 *           example: Turquoise
 *         hex:
 *           type: string
 *           pattern: '^#[0-9A-Fa-f]{6}$'
 *           description: New hex code for the color
 *           example: "#1abc9c"
 */

// ---------------------------------------------------------------------------
// MongoDB connection
// ---------------------------------------------------------------------------

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/colorsdb'

// Define Color Schema
const colorSchema = new mongoose.Schema({
  name: String,
  hex: String
})

const Color = mongoose.model('Color', colorSchema)

// ---------------------------------------------------------------------------
// Seed initial data
// ---------------------------------------------------------------------------

/**
 * Populates the database with a default set of colors.
 * Runs on every server startup to ensure a clean, predictable state.
 */
const seedDatabase = async () => {
  const defaultColors = [
    { name: 'Turquoise', hex: '#1abc9c' },
    { name: 'Red', hex: '#e74c3c' },
    { name: 'Yellow', hex: '#f1c40f' }
  ]

  try {
    // Clear and re-seed the DB on startup
    await Color.deleteMany({})
    await Color.insertMany(defaultColors)
    console.log('Database seeded with default colors')
  } catch (error) {
    // Stryker disable next-line all: error logging only
    console.error('Error seeding database:', error)
  }
}

// Stryker disable all: infrastructure-only code, not testable in unit tests
// Connect to MongoDB (only when run directly, not when imported by tests)
if (require.main === module) {
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log(`Connected to MongoDB at ${MONGO_URI}`)
      await seedDatabase()
    })
    .catch((err) => console.error('Could not connect to MongoDB:', err))
}
// Stryker restore all

// ===========================================================================
// API Endpoints
// ===========================================================================

// ---------------------------------------------------------------------------
// GET /api/colors – List all colors
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/colors:
 *   get:
 *     summary: Retrieve all colors
 *     description: Returns the full list of colors stored in the database.
 *     tags: [Colors]
 *     responses:
 *       200:
 *         description: A list of colors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Color'
 *       500:
 *         description: Server error
 */
app.get('/api/colors', async (req, res) => {
  try {
    // Return all colors, hiding internal MongoDB __v and _id
    const colors = await Color.find({}, { _id: 0, __v: 0 })
    res.json(colors)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching colors' })
  }
})

// ---------------------------------------------------------------------------
// GET /api/colors/:name – Get a single color by name
// ---------------------------------------------------------------------------
/**
 * @swagger
 * /api/colors/{name}:
 *   get:
 *     summary: Retrieve a single color by name
 *     description: Looks up a color by its name (case-sensitive).
 *     tags: [Colors]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\x20+]*[a-zA-Z0-9])?$'
 *         description: The color name to look up
 *         example: Red
 *     responses:
 *       200:
 *         description: The matching color
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Color'
 *       400:
 *         description: Invalid color name format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 */

app.get('/api/colors/:name', async (req, res) => {
  try {
    const { name } = req.params
    if (!STRICT_NAME_REGEX.test(name)) {
      return res.status(400).json({ error: STRICT_NAME_MSG })
    }
    const color = await Color.findOne({ name: String(name) }, { _id: 0, __v: 0 })
    if (!color) {
      return res.status(404).json({ error: 'Color not found' })
    }
    res.json(color)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch color' })
  }
})

// ---------------------------------------------------------------------------
// POST /api/colors – Create a new color
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/colors:
 *   post:
 *     summary: Create a new color
 *     description: >
 *       Adds a new color to the database. Both `name` and `hex` are required.
 *       Returns 409 if a color with the same name already exists.
 *     tags: [Colors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Color'
 *     responses:
 *       201:
 *         description: Color created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Color'
 *       400:
 *         description: Invalid input data (e.g., empty name, invalid hex format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: A color with that name already exists
 *       500:
 *         description: Server error
 */
app.post('/api/colors', createColorLimiter, async (req, res) => {
  try {
    const parseResult = colorZodSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { name, hex } = parseResult.data

    // Prevent duplicate color names
    const existing = await Color.findOne({ name: String(name) })
    if (existing) {
      return res.status(409).json({ error: `Color "${name}" already exists` })
    }

    // Create and persist the new color
    const color = await Color.create({ name: String(name), hex: String(hex) })

    // Return the created color without internal fields
    res.status(201).json({ name: color.name, hex: color.hex })
  } catch (error) {
    // Stryker disable next-line all: error logging only
    console.error('POST /api/colors error:', error)
    res.status(500).json({ error: 'Failed to create color' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/colors/:name – Update an existing color
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/colors/{name}:
 *   put:
 *     summary: Update an existing color
 *     description: >
 *       Updates the hex value (and optionally the name) of an existing color.
 *       The color is identified by its current name in the URL path.
 *     tags: [Colors]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\x20+]*[a-zA-Z0-9])?$'
 *         description: Current name of the color to update
 *         example: Turquoise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateColor'
 *     responses:
 *       200:
 *         description: Color updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Color'
 *       400:
 *         description: Invalid input data (e.g., empty name, invalid hex format)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 */
app.put('/api/colors/:name', async (req, res) => {
  try {
    const currentName = req.params.name
    if (!STRICT_NAME_REGEX.test(currentName)) {
      return res.status(400).json({ error: STRICT_NAME_MSG })
    }
    const parseResult = updateColorZodSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { name, hex } = parseResult.data

    // Find the existing color by its current name
    const color = await Color.findOne({ name: String(currentName) })
    if (!color) {
      return res.status(404).json({ error: 'Color not found' })
    }

    // Apply updates
    if (typeof name === 'string') color.name = name
    if (typeof hex === 'string') color.hex = hex

    // Save and return protected document
    await color.save()
    const result = { name: color.name, hex: color.hex }
    res.json(result)
  } catch (error) {
    // Stryker disable next-line all: error logging only
    console.error('PUT /api/colors/:name error:', error)
    res.status(500).json({ error: 'Failed to update color' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /api/colors/:name – Delete a color
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/colors/{name}:
 *   delete:
 *     summary: Delete a color by name
 *     description: Permanently removes the color with the given name from the database.
 *     tags: [Colors]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]([a-zA-Z0-9\x20+]*[a-zA-Z0-9])?$'
 *         description: Name of the color to delete
 *         example: Yellow
 *     responses:
 *       200:
 *         description: Color deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Color "Yellow" deleted successfully
 *       400:
 *         description: Invalid color name format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 */
app.delete('/api/colors/:name', async (req, res) => {
  try {
    const { name } = req.params
    if (!STRICT_NAME_REGEX.test(name)) {
      return res.status(400).json({ error: STRICT_NAME_MSG })
    }
    const color = await Color.findOneAndDelete({ name: String(name) })

    if (!color) {
      return res.status(404).json({ error: 'Color not found' })
    }

    res.json({ message: `Color "${req.params.name}" deleted successfully` })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete color' })
  }
})

// ---------------------------------------------------------------------------
// 405 Method Not Allowed Handler
// ---------------------------------------------------------------------------

/**
 * Middleware to catch methods that are not explicitly defined on existing routes
 * and return 405 Method Not Allowed instead of 404 Not Found.
 */
const allowedMethods = {
  '/api/colors': ['GET', 'POST'],
  '/api/colors/:name': ['GET', 'PUT', 'DELETE'],
  '/openapi.json': ['GET'],
  '/api-docs': ['GET']
}

app.all('/api/colors', (req, res, next) => {
  if (!allowedMethods['/api/colors'].includes(req.method)) {
    res.setHeader('Allow', allowedMethods['/api/colors'].join(', '))
    return res.status(405).json({ error: `Method ${req.method} not allowed on /api/colors` })
  }
  next()
})

app.all('/api/colors/:name', (req, res, next) => {
  if (!allowedMethods['/api/colors/:name'].includes(req.method)) {
    res.setHeader('Allow', allowedMethods['/api/colors/:name'].join(', '))
    return res.status(405).json({ error: `Method ${req.method} not allowed on /api/colors/:name` })
  }
  next()
})

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

// Stryker disable all: infrastructure-only code, not testable in unit tests
const PORT = process.env.PORT || 5001
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
  })
}
// Stryker restore all

module.exports = { app, seedDatabase, Color, mongoose, MONGO_URI }
