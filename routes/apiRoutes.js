const express = require('express');
const router = express.Router();
const {handleUserLogin,handleUserSignup,} = require('../controllers/authController');
const userController = require('../controllers/userController');
const {restrictToLoggedinUserOnly}=require('../middlewares/authMiddleware');

// Auth Routes
router.post('/login',handleUserLogin);
router.post('/signup',handleUserSignup );

// Account Routes
router.post('/accounts',restrictToLoggedinUserOnly, userController.updateAccount);

module.exports = router;