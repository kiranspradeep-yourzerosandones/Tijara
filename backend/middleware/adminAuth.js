// Check if user is admin
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - Please login"
    });
  }

  if (req.userType !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied - Admin only"
    });
  }

  next();
};

// Check if user is superadmin
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - Please login"
    });
  }

  if (req.userType !== "admin" || req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied - Super Admin only"
    });
  }

  next();
};

// Check admin permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Please login"
      });
    }

    if (req.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied - Admin only"
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Missing permission: ${permission}`
      });
    }

    next();
  };
};

module.exports = { adminOnly, superAdminOnly, checkPermission };