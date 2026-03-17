const { verifyToken } = require("../utils/jwtUtils");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Protect routes - verify JWT token (for customers)
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - No token provided"
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Invalid token"
      });
    }

    // Get user based on userType
    let user;
    
    if (decoded.userType === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized - Admin not found"
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Admin account has been deactivated"
        });
      }

      req.user = user;
      req.userType = "admin";
    } else {
      // Customer
      user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized - User not found"
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated"
        });
      }

      req.user = user;
      req.userType = "customer";
    }

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized"
    });
  }
};

// Optional auth - attach user if token exists, but don't require it
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      
      if (decoded) {
        let user;
        
        if (decoded.userType === "admin") {
          user = await Admin.findById(decoded.id).select("-password");
          if (user && user.isActive) {
            req.user = user;
            req.userType = "admin";
          }
        } else {
          user = await User.findById(decoded.id).select("-password");
          if (user && user.isActive) {
            req.user = user;
            req.userType = "customer";
          }
        }
      }
    }

    next();

  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = { protect, optionalAuth };