const jwt = require('jsonwebtoken'); 
const { Cart } = require("../models/schema");
const ACCESS_TOKEN_SECRET = "your_access_token_secret_123";
exports.addToCart = async (req, res) => {
    try {
        
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

      
        const decoded = jwt.verify(token,ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        
        const { productId, quantity } = req.body;

        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            const itemIndex = cart.items.findIndex(p => p.product == productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity: quantity });
            }
        } else {
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity: quantity }]
            });
        }

        await cart.save();
        await cart.populate('items.product');

        res.json({ cart: cart });

    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
             return res.status(401).json({ message: "Invalid Token" });
        }
        res.status(500).json({ message: "Error updating cart" });
    }
};



exports.getCart = async (req, res) => {
    try {
        
        const token = req.cookies.accessToken;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token,ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        
        const cart = await Cart.findOne({ user: userId })
            .populate('items.product'); // <--- CRITICAL: Fills in name/price/image

        if (!cart) {
            return res.json({ items: [] });
        }

        res.json(cart);
    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: "Error fetching cart" });
    }
};

// controller/cartController.js

exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        
        // 1. Get User ID from Cookie
        const token = req.cookies.accessToken; 
     
        const decoded = jwt.verify(token,ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        // 2. Remove the item using $pull
        const cart = await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } }, // Logic: "Remove item where product == productId"
            { new: true } // Return the updated cart after the change
        ).populate('items.product');

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        res.status(200).json({ 
            message: "Item removed", 
            cart: cart 
        });

    } catch (error) {
        console.error("Remove Error:", error);
        res.status(500).json({ message: "Error removing item" });
    }
};