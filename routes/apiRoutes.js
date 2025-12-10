const express = require('express');
const router = express.Router();
const {handleUserLogin,handleUserSignup,} = require('../controllers/authController');
const userController = require('../controllers/userController');
const {restrictToLoggedinUserOnly}=require('../middlewares/authMiddleware');

// Auth Routes
router.post('/login',handleUserLogin);
router.post('/signup',handleUserSignup );

router.get('/check-auth',(req,res)=>{
    if(req.user){
        return req.status(200).json({
            isAuthenticated:true,
            user: req.user
        });
    }
    else{
        return res.status(401).json({
            isAuthenticated:false
        })
    }
});
// Account Routes
router.post('/accounts',restrictToLoggedinUserOnly, userController.updateAccount);

module.exports = router;