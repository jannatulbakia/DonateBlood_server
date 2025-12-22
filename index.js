const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const paginate = require('mongoose-paginate-v2');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRequestRoutes = require('./routes/donationRequests');
const fundingRoutes = require('./routes/fundings');

// Initialize express app
const app = express();

// Add pagination plugin to mongoose
mongoose.plugin(paginate);

// ==================== MANUAL CORS HANDLING ====================
// Instead of using cors() middleware, handle it manually
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://your-frontend.vercel.app'
];

// Custom CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
// ==================== END CORS CONFIGURATION ====================

// Debug middleware - logs all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ==================== ROUTES ====================
// Root endpoint
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.json({
    success: true,
    message: 'Welcome to the Donation Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      donationRequests: '/api/donation-requests',
      fundings: '/api/fundings',
      health: '/health',
      test: '/api/test'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donation-requests', donationRequestRoutes);
app.use('/api/fundings', fundingRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint accessed');
  res.json({
    success: true,
    message: 'API is working!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ==================== ERROR HANDLERS ====================
// 404 handler
app.use((req, res) => {
  console.log('Global 404 triggered:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableEndpoints: [
      '/',
      '/health',
      '/api/auth',
      '/api/users', 
      '/api/donation-requests',
      '/api/fundings',
      '/api/test'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/donation-platform';
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Tips:');
    console.log('1. Check if MONGODB_URI is set');
    console.log('2. Verify your MongoDB Atlas cluster is running');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Will attempt to reconnect in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌍 Access URLs:`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Network: http://0.0.0.0:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 CORS Allowed Origins:`, allowedOrigins);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Start server
startServer();