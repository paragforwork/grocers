const { Product, Comment } = require("../models/schema");

exports.getAllProducts = async (req, res) => {
  try {
    //console.log("Model Check:", Product); // If this logs 'undefined', your import is wrong
    const products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    console.error("Controller Error:", error); // See the real error in your terminal
    res.status(500).json({ message: "Error fetching products" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product" });
  }
};

// Get comments for a specific product
exports.getCommentsForProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ product: id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

// Add a comment for a product (authenticated users only)
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params; // product id
    const { text, rating } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const parsedRating = rating ? Number(rating) : undefined;
    if (parsedRating && (parsedRating < 1 || parsedRating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const comment = await Comment.create({
      user: req.user._id,
      product: id,
      text,
      rating: parsedRating,
    });

    // Populate user name before returning
    await comment.populate("user", "name");

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding comment" });
  }
};