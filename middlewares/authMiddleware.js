const jwt= require("jsonwebtoken")

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function checkForAuthenticationCookie(req,res,next){
    const accessToken = req.cookies?.accessToken;
    const refreshToken =req.cookies?.refreshToken;

    req.user=null;
    if(!accessToken && !refreshToken) return next();
    try{
        const decoded = jwt.verify(accessToken,ACCESS_TOKEN_SECRET);
        req.user = decoded;
        return next();

    }catch(error){
        if(!refreshToken) return next();
        try {
            const decodedRefresh = jwt.verify(refreshToken,REFRESH_TOKEN_SECRET);
            const newAccessToken = jwt.sign({
                _id:decodedRefresh._id, email:decodedRefresh.email, admin:decodedRefresh.admin
            },ACCESS_TOKEN_SECRET,
            {expiresIn:"1d"}
        );
        res.cookie("accessToken",newAccessToken,{
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        req.user =decodedRefresh;
        return next();
        } catch (refreshError) {
            return next();
        }
    }
}

function restrictToLoggedinUserOnly(req, res, next) {
    // Allow read-only GET requests for public endpoints
   // if (req.method === 'GET') return next();

    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized access. Please login." 
        });
    }
    next();
}

module.exports={
    checkForAuthenticationCookie,
  restrictToLoggedinUserOnly,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET
};