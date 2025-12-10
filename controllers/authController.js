const User = require("../models/schema");
const bcrypt = require("bcryptjs"); // Import bcryptjs
const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require("../middlewares/authMiddleware");

async function handleUserSignup(req, res) {

  const { fullName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            message: "Email already exists" 
        });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create User
    await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    // 4. Send Success JSON
    return res.status(201).json({
        success: true,
        message: "Account created successfully! Please login.",
        redirectUrl: "/login"
    });

  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    // Error handling: Send JSON with 401 status
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

    // --- Generate Tokens ---
    const accessToken = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Save Refresh Token
    user.refreshToken = refreshToken;
    await User.save();

    // Set Cookies
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    // SUCCESS: Send JSON. Let the frontend handle the redirect.
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        email: user.email,
        fullName: user.fullName
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