require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser =require("cookie-parser")
const path = require('path');

const {checkForAuthenticationCookie,restrictToLoggedinUserOnly}= require("./middlewares/authMiddleware");
// Import Routes
const apiRoutes = require('./routes/apiRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

const port = process.env.PORT || 8080;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Clean up FRONTEND_URL (remove trailing slash)
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://localhost:5173',
      'https://grocers-frontend.vercel.app',
      frontendUrl
    ].filter(Boolean);
    
    console.log('=== CORS Debug ===');
    console.log('Request Origin:', origin);
    console.log('Allowed Origins:', allowedOrigins);
    console.log('FRONTEND_URL env:', process.env.FRONTEND_URL);
    
    // Allow requests with no origin (same-origin requests, server-to-server, etc.)
    if (!origin) {
      console.log('✅ No origin header - allowing');
      return callback(null, true);
    }
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Exact match - allowing:', origin);
      return callback(null, true);
    }
    
    // Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) {
      console.log('✅ Vercel domain - allowing:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS BLOCKED:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Initialize Socket.IO with authentication
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Apply Socket.IO Authentication Middleware
const { socketAuthMiddleware } = require('./middlewares/chatAuthMiddleware');
io.use(socketAuthMiddleware);

// Initialize chat socket handler
const chatSocket = require('./sockets/chatSocket');
chatSocket(io);

app.use(checkForAuthenticationCookie);



app.use('/api', apiRoutes);   

// Handles /api/login, /api/signup, /api/accounts

// Admin routes (protected by admin middleware internally)
app.use('/admin', adminRoutes);

// Chat routes
app.use('/chat', chatRoutes);

app.use(restrictToLoggedinUserOnly);

app.use('/products', productRoutes); // Handles /products
app.use('/cart', cartRoutes);     // Handles /cart/add
app.use('/order', orderRoutes); // Handles /orders/new


// Simple test route l)
app.get('/tasks/create', (req, res) => {
  console.log("im here");
  res.send('Hello World!');
});

server.listen(port, () => {
  console.log(`Server with WebSocket listening on port ${port}`);
});