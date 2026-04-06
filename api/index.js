const { app, mongoose } = require('../server/index.js')

const MONGO_URI = process.env.MONGO_URI

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas on Vercel'))
    .catch((err) => console.error('MongoDB connection error:', err))
}

module.exports = app
