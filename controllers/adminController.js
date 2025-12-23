const { User, Order, Product, Comment } = require("../models/schema");

// Get dashboard statistics
async function getDashboardStats(req, res) {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        const totalRevenue = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalOrders,
                totalProducts,
                totalRevenue: totalRevenue[0]?.total || 0,
                recentOrders
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics"
        });
    }
}

// Get all users
async function getAllUsers(req, res) {
    try {
        const users = await User.find().select('-password -refreshtoken');
        
        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
}

// Get all orders with filters
async function getAllOrders(req, res) {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const filter = {};
        if (status) {
            filter.orderStatus = status;
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        const totalOrders = await Order.countDocuments(filter);

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalOrders,
                pages: Math.ceil(totalOrders / limit)
            }
        });
    } catch (error) {
        console.error("Get orders error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
}

// Update order status
async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const validStatuses = ['Processing', 'Shipped', 'Out for deleivery', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus },
            { new: true }
        ).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
}

// Get all products
async function getAllProducts(req, res) {
    try {
        const products = await Product.find();
        
        return res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Get products error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
}

// Create product
async function createProduct(req, res) {
    try {
        const { name, price, description, image, category } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, price, and category are required"
            });
        }

        let imageUrl = image;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const product = await Product.create({
            name,
            price,
            description,
            image: imageUrl,
            category
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("Create product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
}

// Update product
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const { name, price, description, image, category } = req.body;

        let imageUrl = image;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const updateData = { name, price, description, image: imageUrl };
        if (category) {
            updateData.category = category;
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
}

// Delete product
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete product"
        });
    }
}

module.exports = {
    getDashboardStats,
    getAllUsers,
    getAllOrders,
    updateOrderStatus,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
