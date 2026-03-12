const { getMCAuthToken, clearMCTokenCache } = require("./token");
const { mcSendOtp } = require("./sendOtp");
const { mcValidateOtp } = require("./validateOtp");

module.exports = {
  getMCAuthToken,
  clearMCTokenCache,
  mcSendOtp,
  mcValidateOtp
};