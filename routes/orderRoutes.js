const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// New flow routes
router.post('/create-pending', orderController.createPendingOrder);
router.post('/create-razorpay-order', orderController.createRazorpayOrder);
router.post('/confirm-payment', orderController.confirmPayment);
router.get('/myorders', orderController.getMyOrders);

module.exports = router;
