const { app, mongoose } = require('../server/index.js')

const MONGO_URI = process.env.MONGO_URI

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas on Vercel'))
    .catch((err) => console.error('MongoDB connection error:', err))
}

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
 *           pattern: '^[a-zA-Z0-9 ]*[a-zA-Z0-9][a-zA-Z0-9 ]*$'
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

module.exports = app
