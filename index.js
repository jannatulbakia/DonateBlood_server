const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRequestRoutes = require('./routes/donationRequests');
const fundingRoutes = require('./routes/fundings');

// Initialize express app
const app = express();

// ==================== SIMPLE CORS ====================
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basic middleware
app.use(express.json());

// ==================== ROUTES ====================
// ROOT ROUTE - MUST BE FIRST!
app.get('/', (req, res) => {
  console.log('✅ Root route accessed');
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('✅ Health check accessed');
  res.json({
    success: true,
    message: 'Server is healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donation-requests', donationRequestRoutes);
app.use('/api/fundings', fundingRoutes);

// Test route
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint accessed');
  res.json({
    success: true,
    message: 'Test endpoint works'
  });
});

// ==================== 404 HANDLER ====================
// This MUST be last
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// ==================== DATABASE ====================
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donation-platform';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
  }
};

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Root: http://localhost:${PORT}/`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Test: http://localhost:${PORT}/api/test`);
  });
};

startServer();