const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_12345');
    
    const user = await User.findOne({ _id: decoded.userId, status: 'active' });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or account is blocked' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    next();
  };
};

module.exports = { auth, authorize };