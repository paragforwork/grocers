const express = require('express');
const router = express.Router();
const {handleUserLogin,handleUserSignup,} = require('../controllers/authController');
const userController = require('../controllers/userController');
const {restrictToLoggedinUserOnly}=require('../middlewares/authMiddleware');

// Auth Routes
router.post('/login',handleUserLogin);
router.post('/signup',handleUserSignup );

router.get('/check-auth',(req,res)=>{
   // console.log(req.user);
    if(req.user){
        
        return res.status(200).json({
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
router.get('/accounts/profile', restrictToLoggedinUserOnly, userController.getAccount);


router.put('/accounts/profile', restrictToLoggedinUserOnly, userController.updateAccount);

module.exports = router;