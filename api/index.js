// api/index.js
const express = require('express');
const mongoose = require('mongoose');

// Create a new Express app specifically for the API route
const app = express();

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

connectDB();

// ==================== CORS ====================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// ==================== MIDDLEWARE ====================
app.use(express.json());

// ==================== ROUTES ====================

// Root route - for Vercel
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully on Vercel!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint works perfectly'
  });
});

// Import and use your routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const donationRequestRoutes = require('../routes/donationRequests');
const fundingRoutes = require('../routes/fundings');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/donation-requests', donationRequestRoutes);
app.use('/fundings', fundingRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Export the Express app as a serverless function
module.exports = app;