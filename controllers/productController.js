const { Product } = require("../models/schema");

exports.getAllProducts = async (req, res) => {
  try {
    console.log("Fetching products...");
    const products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};