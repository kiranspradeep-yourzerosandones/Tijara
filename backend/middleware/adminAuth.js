// Check if user is admin
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - Please login"
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied - Admin only"
    });
  }

  next();
};

// Check if user is admin or the resource owner
const adminOrOwner = (ownerIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Please login"
      });
    }

    // Admin can access everything
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user owns the resource
    const ownerId = req.params[ownerIdField] || req.body[ownerIdField];
    
    if (ownerId && ownerId.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  };
};

module.exports = { adminOnly, adminOrOwner };