const { User } = require("../models/schema"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require("../middlewares/authMiddleware");

async function handleUserSignup(req, res) {

  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            message: "Email already exists" 
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name: fullName, 
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
        success: true,
        message: "Account created successfully! Please login.",
        redirectUrl: "/login"
    });

  } catch (error) {
   // console.error("Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Username or Password" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Username or Password" 
      });
    }

   
    const accessToken = jwt.sign(
      { _id: user._id, email: user.email, admin: user.admin }, 
      ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { _id: user._id, email: user.email, admin: user.admin },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );


    user.refreshtoken = refreshToken; 

    
    await user.save(); 

    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        email: user.email,
        fullName: user.name,
        admin: user.admin
      }
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
};