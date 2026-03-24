// Phone number validation (Indian)
export const validatePhone = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required' };
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return { isValid: false, message: 'Phone number must be 10 digits' };
  }
  
  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, message: 'Phone number must start with 6-9' };
  }
  
  return { isValid: true, message: '' };
};

// Email validation
export const validateEmail = (email) => {
  if (!email) return { isValid: true, message: '' }; // Email is optional
  
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true, message: '' };
};

// Name validation
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: 'Name cannot exceed 50 characters' };
  }
  
  return { isValid: true, message: '' };
};

// OTP validation
export const validateOtp = (otp, length = 4) => {
  if (!otp) return { isValid: false, message: 'OTP is required' };
  
  if (otp.length !== length) {
    return { isValid: false, message: `OTP must be ${length} digits` };
  }
  
  if (!/^\d+$/.test(otp)) {
    return { isValid: false, message: 'OTP must contain only numbers' };
  }
  
  return { isValid: true, message: '' };
};

// Pincode validation
export const validatePincode = (pincode) => {
  if (!pincode) return { isValid: false, message: 'Pincode is required' };
  
  if (!/^\d{6}$/.test(pincode)) {
    return { isValid: false, message: 'Please enter a valid 6-digit pincode' };
  }
  
  return { isValid: true, message: '' };
};

// GST number validation
export const validateGST = (gst) => {
  if (!gst) return { isValid: true, message: '' }; // GST is optional
  
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gst.toUpperCase())) {
    return { isValid: false, message: 'Please enter a valid GST number' };
  }
  
  return { isValid: true, message: '' };
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
};

// Registration form validation
export const validateRegistrationForm = (data) => {
  const errors = {};
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) errors.name = nameValidation.message;
  
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) errors.phone = phoneValidation.message;
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) errors.email = emailValidation.message;
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) errors.password = passwordValidation.message;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Location form validation
export const validateLocationForm = (data) => {
  const errors = {};
  
  if (!data.shopName?.trim()) errors.shopName = 'Shop name is required';
  
  const phoneValidation = validatePhone(data.contactPhone);
  if (!phoneValidation.isValid) errors.contactPhone = phoneValidation.message;
  
  if (!data.address?.line1?.trim()) errors.line1 = 'Address line 1 is required';
  if (!data.address?.city?.trim()) errors.city = 'City is required';
  if (!data.address?.state?.trim()) errors.state = 'State is required';
  
  const pincodeValidation = validatePincode(data.address?.pincode);
  if (!pincodeValidation.isValid) errors.pincode = pincodeValidation.message;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};