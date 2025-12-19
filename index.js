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

const port = 8080;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Must be specific string, not '*'
  credentials: true                // Required for cookies/authorization headers
}));
app.use(cookieParser());

app.use(checkForAuthenticationCookie);



app.use('/api', apiRoutes);   

// Handles /api/login, /api/signup, /api/accounts

app.use(restrictToLoggedinUserOnly);

app.use('/products', productRoutes); // Handles /products
app.use('/cart', cartRoutes);     // Handles /cart/add


// Simple test route l)
app.get('/tasks/create', (req, res) => {
  console.log("im here");
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});