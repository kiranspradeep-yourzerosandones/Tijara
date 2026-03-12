const axios = require("axios");

const BASE = "https://cpaas.messagecentral.com";

/**
 * Validate OTP via Message Central
 * @param {Object} params
 * @param {string} params.authToken - MC auth token
 * @param {string} params.verificationId - Verification ID from sendOtp
 * @param {string} params.code - OTP code entered by user
 * @param {string} params.mobileNumber - 10 digit mobile number
 * @param {string} params.countryCode - Country code (default 91)
 * @param {string} params.customerId - MC customer ID
 * @returns {Object} - Validation result
 */
const mcValidateOtp = async ({
  authToken,
  verificationId,
  code,
  mobileNumber,
  countryCode,
  customerId
}) => {
  console.log("🔍 mcValidateOtp called");

  if (!authToken) {
    throw new Error("MC auth token required");
  }

  if (!verificationId) {
    throw new Error("verificationId required");
  }

  if (!mobileNumber) {
    throw new Error("mobileNumber required");
  }

  if (!code) {
    throw new Error("code required");
  }

  const params = {
    verificationId,
    code,
    mobileNumber,
    countryCode: countryCode || process.env.MC_COUNTRY || "91",
    customerId: customerId || process.env.MC_CUSTOMER,
  };

  const url = `${BASE}/verification/v3/validateOtp`;

  console.log("📡 Making request to:", url);
  console.log("📦 Params:", params);

  try {
    const resp = await axios.get(url, {
      params,
      headers: { authToken },
      timeout: 10000,
    });

    console.log("✅ Response status:", resp.status);
    console.log("📥 Response data:", JSON.stringify(resp.data, null, 2));

    if (resp.status !== 200) {
      throw new Error("mcValidateOtp failed");
    }

    return resp.data?.data;

  } catch (error) {
    console.error("❌ mcValidateOtp error:", error.message);
    console.error("❌ Response data:", error.response?.data);
    console.error("❌ Response status:", error.response?.status);
    throw error;
  }
};

module.exports = { mcValidateOtp };