function restrictToAdminOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized access. Please login." 
        });
    }

    if (!req.user.admin) {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Admin privileges required." 
        });
    }

    next();
}

module.exports = {
    restrictToAdminOnly
};
