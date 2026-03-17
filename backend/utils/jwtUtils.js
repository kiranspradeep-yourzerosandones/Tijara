const jwt = require("jsonwebtoken");

// Generate Access Token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { 
      id: userId, 
      userType: userType // "admin" or "customer"
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || "30d" 
    }
  );
};

// Verify Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Decode Token (without verification)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};