const { app, mongoose } = require('./index.js')

// Vercel Serverless Functions spin up and down, so we must ensure
// the database connects when the function wakes up.
const MONGO_URI = process.env.MONGO_URI

if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas on Vercel'))
    .catch((err) => console.error('MongoDB connection error:', err))
}

// Vercel requires the raw Express app as the default export
module.exports = app
