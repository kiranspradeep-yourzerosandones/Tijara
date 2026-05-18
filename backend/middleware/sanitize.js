// backend/middleware/sanitize.js
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove MongoDB operators from strings
    return value.replace(/\$|\./g, '');
  }
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeValue);
  }
  
  const sanitized = {};
  for (const key in obj) {
    // Remove keys starting with $ or containing .
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = sanitizeValue(obj[key]);
  }
  return sanitized;
};

// ✅ Express 5 compatible - only sanitizes body and params
const mongoSanitize = () => {
  return (req, res, next) => {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    // ✅ DO NOT touch req.query - it's read-only in Express 5
    next();
  };
};

module.exports = mongoSanitize;