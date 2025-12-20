const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/new', orderController.createOrder);
router.get('/myorders', orderController.getMyOrders);
module.exports = router;
