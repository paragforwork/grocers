const { User } = require("../models/schema");

exports.getAccount = async (req, res) => {
    try {
        // req.user._id comes from the middleware
        const user = await User.findById(req.user._id)
            .select('-password -refreshtoken') // Don't send password
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.updateAccount = async (req, res) => {
    try {
        // 1. Get data from Frontend Body
        const { name, phone, address, city, postalCode } = req.body;

        // 2. Create update object (only include fields that exist)
        const updates = {};
        if (name) updates.name = name;
        if (address) updates.address = address;
        if (city) updates.city = city;
        if (postalCode) updates.postalCode = postalCode;
        
        // Handle Phone: Convert "123" string to Number, or null if empty
        if (phone !== undefined) {
             updates.phone = (phone === "" || phone === 0) ? null : Number(phone);
        }

        // 3. Update Database
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true } // Return the updated document
        ).select('-password -refreshtoken');

        // 4. Send Response
        res.json({ 
            success: true, 
            message: 'Profile updated successfully!', 
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};