
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const donationRequestRoutes = require('./routes/donationRequests');
const fundingRoutes = require('./routes/fundings');

const app = express();
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

connectDB();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());


app.use((req, res, next) => {
  console.log('Request:', req.method, req.url);
  next();
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully!',
    timestamp: new Date().toISOString(),
    tip: 'Welcome to your donation platform backend'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint works perfectly'
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donation-requests', donationRequestRoutes);
app.use('/api/fundings', fundingRoutes);

app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});


if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

module.exports = app;