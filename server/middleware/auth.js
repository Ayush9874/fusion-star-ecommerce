const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.error('Auth middleware error: No token provided in authorization header:', req.headers.authorization);
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.error('Auth middleware error: User not found for decoded ID:', decoded.id);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    console.log(`Auth middleware success: Authorized user ${req.user.email} for ${req.originalUrl}`);
    next();
  } catch (error) {
    console.error('Auth middleware error caught verify/db error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid', error: error.message });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

module.exports = { protect, adminOnly };
