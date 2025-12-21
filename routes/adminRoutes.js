const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { restrictToAdminOnly } = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Apply admin middleware to all routes
router.use(restrictToAdminOnly);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getAllUsers);

// Orders
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// Products
router.get('/products', adminController.getAllProducts);
router.post('/products', upload.single('image'), adminController.createProduct);
router.put('/products/:id', upload.single('image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

module.exports = router;
