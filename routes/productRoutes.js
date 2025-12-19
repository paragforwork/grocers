const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { restrictToLoggedinUserOnly } = require('../middlewares/authMiddleware');

router.get('/', productController.getAllProducts); 
router.get('/:id', productController.getProductById);
// Comments
router.get('/:id/comments', productController.getCommentsForProduct);
router.post('/:id/comments', restrictToLoggedinUserOnly, productController.addComment);
module.exports = router;