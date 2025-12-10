const { User } = require("../models/schema");

exports.updateAccount = async (req, res) => {
  const { email, name, phone, address } = req.body;
  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to update profile."
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { $set: { name, phone, address } },
      { new: true }
    );

    if (updatedUser) {
      return res.json({
        success: true,
        message: "Profile updated successfully!",
        user: updatedUser
      });
    } else {
      return res.json({
        success: false,
        message: "User not found. Please check the email."
      });
    }
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};