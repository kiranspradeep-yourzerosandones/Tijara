const axios = require("axios");

const BASE = "https://cpaas.messagecentral.com";

// In-memory cache for auth token
let cache = { token: null, expiresAt: 0 };

/**
 * Fetch and cache MessageCentral auth token.
 * Uses in-memory cache; replace with Redis if you run multiple instances.
 */
const getMCAuthToken = async (customerId, password) => {
  if (!customerId || !password) {
    throw new Error("MC credentials missing");
  }

  // Return cached token if still valid (with 5 second buffer)
  if (cache.token && Date.now() < cache.expiresAt - 5000) {
    console.log("📦 Using cached MC auth token");
    return cache.token;
  }

  const key = password;
  const url = `${BASE}/auth/v1/authentication/token`;

  console.log("🔐 Fetching new MC auth token...");

  try {
    const resp = await axios.get(url, {
      params: { customerId, key, scope: "NEW" },
      headers: { accept: "*/*" },
      timeout: 10000,
    });

    if (!resp?.data) {
      throw new Error("Failed to fetch MC token");
    }

    console.log("📥 MC Token Response:", JSON.stringify(resp.data, null, 2));

    // Extract auth token from response (handle different response formats)
    const authToken =
      resp.data?.data?.authToken ||
      resp.data?.authToken ||
      resp.data?.token;

    if (!authToken) {
      throw new Error("Auth token missing in MC response");
    }

    // Conservative TTL (25 minutes)
    cache = { 
      token: authToken, 
      expiresAt: Date.now() + 25 * 60 * 1000 
    };

    console.log("✅ MC auth token cached successfully");
    return authToken;

  } catch (error) {
    console.error("❌ MC Token Error:", error.response?.data || error.message);
    throw error;
  }
};

// Clear cache (useful for testing or token refresh issues)
const clearMCTokenCache = () => {
  cache = { token: null, expiresAt: 0 };
  console.log("🗑️ MC token cache cleared");
};

module.exports = {
  getMCAuthToken,
  clearMCTokenCache
};