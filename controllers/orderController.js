const {Order,Product}=require('../models/schema');
const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = "your_access_token_secret_123";


exports.createOrder = async (req, res) => {
    try {
        // 1. Extract paymentInfo specifically to get the method
        const { items, shippingInfo, paymentInfo } = req.body;
        
        // FIX: Define paymentMethod from the incoming request
        const paymentMethod = paymentInfo.method; 

        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token,ACCESS_TOKEN_SECRET);
        const userId = decoded._id;
        
        let totalAmount = 0;
        const finalItemsList = [];

        for (const item of items) {
            const productDoc = await Product.findById(item.product);
            if (!productDoc) {
                return res.status(404).json({ success: false, message: `Product with ID ${item.product} not found` });
            }
            const cost = productDoc.price * item.quantity;
            totalAmount += cost;
            finalItemsList.push({
                product: productDoc._id,
                quantity: item.quantity,
                priceatpurchase: productDoc.price
            });
        }

        const newOrder = new Order({
            user: userId,
            items: finalItemsList,
            totalAmount: totalAmount,
            shippingInfo: shippingInfo,
            paymentInfo: {
                method: paymentMethod, // Now this variable exists!
                status: paymentMethod === 'COD' ? 'Pending' : 'Paid'
            }
        });

        await newOrder.save();
        
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder._id
        });

    } catch (error) {
        // HINT: Always check your VS Code Terminal when you get a 500 error.
        // It prints the real error details there!
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: "Failed to place order" });
    }
};



exports.getMyOrders = async (req, res) => {
    try {
        // 1. Verify User from Cookie
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please login to view orders"});
        }

        const decoded = jwt.verify(token,ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        // 2. Fetch Orders for this User
        const orders = await Order.find({ user: userId })
            // Populate product details inside the items array
            // We select only 'name' and 'image' to keep the response fast
            .populate({
                path: 'items.product',
                select: 'name image' 
            })
            // Sort by newest first
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch orders" 
        });
    }
};
