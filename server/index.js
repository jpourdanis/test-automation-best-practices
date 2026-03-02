const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/colorsdb';

// Define Color Schema
const colorSchema = new mongoose.Schema({
  name: String,
  hex: String
});

const Color = mongoose.model('Color', colorSchema);

// Seed initial data
const seedDatabase = async () => {
  const defaultColors = [
    { name: "Turquoise", hex: "#1abc9c" },
    { name: "Red",       hex: "#e74c3c" },
    { name: "Yellow",    hex: "#f1c40f" }
  ];

  try {
    // Clear and re-seed the DB on startup
    await Color.deleteMany({});
    await Color.insertMany(defaultColors);
    console.log("Database seeded with default colors");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    await seedDatabase();
  })
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// API Endpoint
app.get('/api/colors', async (req, res) => {
  try {
    // Return all colors, hiding internal MongoDB __v and _id
    const colors = await Color.find({}, { _id: 0, __v: 0 });
    res.json(colors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching colors" });
  }
});

// API endpoint to fetch a single color by name
app.get('/api/colors/:name', async (req, res) => {
  try {
    const color = await Color.findOne({ name: req.params.name }, { _id: 0, __v: 0 });
    if (!color) {
      return res.status(404).json({ error: 'Color not found' });
    }
    res.json(color);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch color' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
