require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser =require("cookie-parser")

const {checkForAuthenticationCookie,restrictToLoggedinUserOnly}= require("./middlewares/authMiddleware");
// Import Routes
const apiRoutes = require('./routes/apiRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const port = process.env.PORT || 8080;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());

app.use(checkForAuthenticationCookie);



app.use('/api', apiRoutes);   

// Handles /api/login, /api/signup, /api/accounts

// Admin routes (protected by admin middleware internally)
app.use('/admin', adminRoutes);

app.use(restrictToLoggedinUserOnly);

app.use('/products', productRoutes); // Handles /products
app.use('/cart', cartRoutes);     // Handles /cart/add
app.use('/order', orderRoutes); // Handles /orders/new


// Simple test route l)
app.get('/tasks/create', (req, res) => {
  console.log("im here");
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});