const { Order, Product } = require('../models/schema');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


const Razorpay = require('razorpay');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ============================================
// STEP 1: Create Order in DB as "Pending"
// ============================================
exports.createPendingOrder = async (req, res) => {
    try {
        const { items, shippingInfo, paymentMethod } = req.body;

        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        // Calculate total and build items list
        let totalAmount = 0;
        const finalItemsList = [];

        for (const item of items) {
            const productDoc = await Product.findById(item.product);
            if (!productDoc) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Product ${item.product} not found` 
                });
            }

            const cost = productDoc.price * item.quantity;
            totalAmount += cost;

            finalItemsList.push({
                product: productDoc._id,
                quantity: item.quantity,
                priceatpurchase: productDoc.price
            });
        }

        // Create order with "Pending" status
        const newOrder = new Order({
            user: userId,
            items: finalItemsList,
            totalAmount: totalAmount,
            shippingInfo: shippingInfo,
            paymentInfo: {
                method: paymentMethod,
                status: 'Pending',
                transactionId: null
            },
            orderStatus: 'Processing'
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            orderId: newOrder._id,
            totalAmount: totalAmount
        });

    } catch (error) {
        console.error("Create Pending Order Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to create order" 
        });
    }
};

// ============================================
// STEP 2: Create Razorpay Order (for Online Payment only)
// ============================================
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body;

        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: orderId.toString(),
            notes: {
                orderId: orderId.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            razorpayOrder: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to create Razorpay order" 
        });
    }
};

// ============================================
// STEP 3: Verify Payment & Update Order Status
// ============================================
exports.confirmPayment = async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentMethod
        } = req.body;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        // If COD, just mark as confirmed
        if (paymentMethod === 'COD') {
            order.paymentInfo.status = 'Pending'; // COD stays pending until delivery
            await order.save();

            return res.status(200).json({
                success: true,
                message: "COD order confirmed"
            });
        }

        // If Online Payment, verify Razorpay signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            // Mark payment as failed
            order.paymentInfo.status = 'Failed';
            await order.save();

            return res.status(400).json({ 
                success: false, 
                message: "Invalid payment signature" 
            });
        }

        // Payment verified successfully
        order.paymentInfo.status = 'Paid';
        order.paymentInfo.transactionId = razorpay_payment_id || 'mock_payment_id';
        await order.save();

        res.status(200).json({
            success: true,
            message: "Payment verified and order confirmed",
            orderId: order._id
        });

    } catch (error) {
        console.error("Payment Confirmation Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Payment confirmation failed" 
        });
    }
};

// ============================================
// Get User's Orders
// ============================================
exports.getMyOrders = async (req, res) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized: Please login to view orders"
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded._id;

        const orders = await Order.find({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name image'
            })
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
