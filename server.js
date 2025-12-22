// server.js - FIXED VERSION
const express = require('express');

// Create app
const app = express();

// Add middleware FIRST
app.use(express.json());

// ROOT ROUTE - SIMPLE
app.get('/', (req, res) => {
  console.log('✅ Root route HIT');
  res.json({ 
    success: true, 
    message: 'API IS WORKING!',
    timestamp: new Date().toISOString()
  });
});

// Health route
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is healthy' 
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test endpoint works' 
  });
});

// CATCH-ALL 404 - WITHOUT WILDCARD
app.use((req, res, next) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.originalUrl}`,
    availableRoutes: ['/', '/health', '/api/test']
  });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`👉 Test: http://localhost:${PORT}/`);
  console.log(`👉 Test: http://localhost:${PORT}/health`);
  console.log(`👉 Test: http://localhost:${PORT}/api/test`);
  console.log(`👉 Test 404: http://localhost:${PORT}/anything`);
});