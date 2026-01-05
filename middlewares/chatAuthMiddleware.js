// Middleware to verify user type from JWT token
// This adds security by not trusting userType from client

const jwt = require('jsonwebtoken');

// REST API: Extract and verify chat user from token
exports.verifyChatUser = (req, res, next) => {
  try {
    // Check for access token in cookies
    const accessToken = req.cookies?.accessToken;
    
    if (!accessToken) {
      req.chatUser = null;
      req.userType = 'user';
      req.isAuthenticated = false;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
    if (decoded) {
      req.chatUser = {
        userId: decoded._id,
        email: decoded.email,
        isAdmin: decoded.admin || false
      };
      req.userType = decoded.admin ? 'admin' : 'user';
      req.isAuthenticated = true;
    } else {
      req.chatUser = null;
      req.userType = 'user';
      req.isAuthenticated = false;
    }
    
    next();
  } catch (error) {
    console.error('Chat auth error:', error.message);
    req.chatUser = null;
    req.userType = 'user';
    req.isAuthenticated = false;
    next();
  }
};

// REST API: Middleware to require authentication for chat
exports.requireChatAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.chatUser) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for chat.'
    });
  }
  next();
};

// REST API: Middleware to check if user is admin
exports.requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated || req.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Socket.IO: Authentication middleware for WebSocket connections
exports.socketAuthMiddleware = (socket, next) => {
  try {
    // Get token from handshake auth or cookies
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie
      ?.split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    if (!token) {
      socket.user = null;
      socket.userType = 'user';
      socket.isAuthenticated = false;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = {
      userId: decoded._id,
      email: decoded.email,
      isAdmin: decoded.admin || false
    };
    socket.userType = decoded.admin ? 'admin' : 'user';
    socket.isAuthenticated = true;
    
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    socket.user = null;
    socket.userType = 'user';
    socket.isAuthenticated = false;
    next();
  }
};
