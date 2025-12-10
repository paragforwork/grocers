const jwt= require("jsonwebtoken")

//later form .env file
const ACCESS_TOKEN_SECRET = "your_access_token_secret_123";
const REFRESH_TOKEN_SECRET = "your_refresh_token_secret_456";

function checkForAuthenticationCookie(req,res,next){
    const accessToken = req.cookies?.accessToken;
    const refreshToken =req.cookies?.refreshToken;

    req.user=null;
    if(!accessToken && !refreshToken) return next();
    try{
        const decoded =jwt.verify(accessToken,ACCESS_TOKEN_SECRET);
        req.user=decoded;
        return next();

    }catch(error){
        if(!refreshToken) return next();
        try {
            const decodedRefresh =jwt.verify(refreshToken,REFRESH_TOKEN_SECRET);
            const newAccessToken =jwt.sign({
                _id:decodedRefresh._id,email:decodedRefresh.email,role:decodedRefresh.role
            },ACCESS_TOKEN_SECRET,
            {expiresIn:"15m"}
        );
        res.cookie("accessToken",newAccessToken,{httpOnly:true});
        req.user =decodedRefresh;
        return next();
        } catch (refreshError) {
            return next();
        }
    }
}

function restrictToLoggedinUserOnly(req,res,next){
    if(!req.user) return res.direct("/login");
    next();
}

module.exports={
    checkForAuthenticationCookie,
  restrictToLoggedinUserOnly,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET
};