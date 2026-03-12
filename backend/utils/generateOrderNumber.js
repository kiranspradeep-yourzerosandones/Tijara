/**
 * Generate unique order number
 * Format: TIJ-YYYYMMDD-XXXXX
 * Example: TIJ-20241215-00001
 */
const generateOrderNumber = async (OrderModel) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Get today's start and end
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  // Count orders created today
  const todayOrderCount = await OrderModel.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  // Generate sequential number for today
  const sequenceNumber = String(todayOrderCount + 1).padStart(5, '0');

  return `TIJ-${datePrefix}-${sequenceNumber}`;
};

/**
 * Generate short order reference (for customer communication)
 * Format: #XXXXX (last 5 chars of ObjectId)
 */
const generateShortReference = (orderId) => {
  return `#${orderId.toString().slice(-5).toUpperCase()}`;
};

module.exports = {
  generateOrderNumber,
  generateShortReference
};