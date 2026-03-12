const axios = require("axios");

const BASE = "https://cpaas.messagecentral.com";

/**
 * Send OTP via Message Central
 * @param {Object} params
 * @param {string} params.authToken - MC auth token
 * @param {string} params.customerId - MC customer ID
 * @param {string} params.mobileNumber - 10 digit mobile number
 * @param {number} params.otpLength - OTP length (default 4)
 * @param {string} params.countryCode - Country code (default 91)
 * @returns {Object} - { verificationId, timeout }
 */
const mcSendOtp = async ({ 
  authToken, 
  customerId, 
  mobileNumber, 
  otpLength = 4, 
  countryCode = "91" 
}) => {
  console.log("🚀 mcSendOtp called");

  if (!authToken) {
    throw new Error("MC auth token required");
  }

  if (!customerId) {
    throw new Error("MC customer ID required");
  }

  if (!mobileNumber) {
    throw new Error("Mobile number required");
  }

  const url = `${BASE}/verification/v3/send`;
  
  const params = {
    customerId,
    mobileNumber,
    flowType: "SMS",
    otpLength,
    countryCode,
  };

  console.log("📡 Making request to:", url);
  console.log("📦 Params:", params);

  try {
    const resp = await axios.post(url, null, {
      params,
      headers: { authToken },
      timeout: 10000,
    });

    console.log("✅ Response status:", resp.status);
    console.log("📥 Response data:", JSON.stringify(resp.data, null, 2));

    if (resp.status !== 200) {
      throw new Error("mcSendOtp failed");
    }

    return resp.data?.data;

  } catch (error) {
    console.error("❌ mcSendOtp error:", error.message);
    console.error("❌ Response data:", error.response?.data);
    console.error("❌ Response status:", error.response?.status);
    throw error;
  }
};

module.exports = { mcSendOtp };