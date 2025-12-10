const { Cart } = require("../models/schema");

exports.addToCart = async (req, res) => {
  const { user, item } = req.body;
  try {
    let cart = await Cart.findOne({ user: user });

    if (!cart) {
      console.log("Cart doesn't exist, creating one");
      cart = new Cart({
        user: user,
        items: [item]
      });
    } else {
      cart.items.push(item);
    }
    
    await cart.save();
    
    res.json({ cart: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating cart" });
  }
};