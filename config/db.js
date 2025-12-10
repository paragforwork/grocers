const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://debnathparag8:k0RkO15mFauWRzwU@cluster0.yha8rs7.mongodb.net/grocers?appName=Cluster0');
    
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;