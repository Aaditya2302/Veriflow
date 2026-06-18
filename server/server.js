const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/uploadRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow Vite dev server
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Create uploads folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Mount API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Database connection
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!dbUri) {
  console.error('CRITICAL ERROR: MongoDB connection URI is missing from .env');
  process.exit(1);
}

mongoose.connect(dbUri)
  .then(() => {
    console.log('Successfully connected to MongoDB database');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed. Express server not started.', err);
    process.exit(1);
  });
