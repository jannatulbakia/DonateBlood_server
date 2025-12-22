const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

// Debug middleware - logs all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

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
    timestamp: new Date().toISOString()
  });
});

// Routes
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

// FIX: Correct catch-all route for undefined API endpoints
// Option 1: Use a specific pattern
app.use('/api/:undefinedPath', (req, res) => {
  console.log('API catch-all triggered:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

// OR Option 2: Remove the catch-all entirely (simpler)
// Just let the global 404 handler catch everything

// 404 handler - THIS MUST BE LAST (after all other routes)
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

// Error handling middleware - MUST BE AFTER 404
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection - Simplified for Mongoose 7+
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    // Remove the deprecated options for Mongoose 7+
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/donation-platform');
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Tips:');
    console.log('1. Check if your MongoDB Atlas cluster is running');
    console.log('2. Verify your username and password');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    console.log('4. Check network connectivity');
    
    // Don't exit in development, let the server run
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start server
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
      console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

startServer();