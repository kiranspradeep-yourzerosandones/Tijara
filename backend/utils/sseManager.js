// backend/utils/sseManager.js

/**
 * SSE Manager
 * Manages all connected admin SSE clients and broadcasts events to them.
 */

// Map of adminId -> Set of response objects
// One admin can have multiple browser tabs open
const clients = new Map();

/**
 * Add a new SSE client connection
 * @param {string} adminId
 * @param {object} res - Express response object
 */
const addClient = (adminId, res) => {
  if (!clients.has(adminId)) {
    clients.set(adminId, new Set());
  }
  clients.get(adminId).add(res);
  // console.log(`📡 SSE client connected: admin=${adminId}, total connections=${getTotalConnections()}`);
};

/**
 * Remove an SSE client connection
 * @param {string} adminId
 * @param {object} res - Express response object
 */
const removeClient = (adminId, res) => {
  if (clients.has(adminId)) {
    clients.get(adminId).delete(res);
    // Clean up empty sets
    if (clients.get(adminId).size === 0) {
      clients.delete(adminId);
    }
  }
  // console.log(`📡 SSE client disconnected: admin=${adminId}, total connections=${getTotalConnections()}`);
};

/**
 * Get total number of active SSE connections
 */
const getTotalConnections = () => {
  let total = 0;
  for (const set of clients.values()) {
    total += set.size;
  }
  return total;
};

/**
 * Send an SSE event to a single response object
 * @param {object} res
 * @param {string} event - event name
 * @param {object} data - payload
 */
const sendEvent = (res, event, data) => {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error("SSE write error:", err.message);
  }
};

/**
 * Broadcast an event to ALL connected admin clients
 * (regardless of which admin)
 * @param {string} event - event name
 * @param {object} data - payload
 */
const broadcastToAllAdmins = (event, data) => {
  let sent = 0;
  for (const [adminId, resSet] of clients.entries()) {
    for (const res of resSet) {
      sendEvent(res, event, data);
      sent++;
    }
  }
  console.log(`📡 SSE broadcast: event="${event}", sent to ${sent} connection(s)`);
};

module.exports = {
  addClient,
  removeClient,
  broadcastToAllAdmins,
  getTotalConnections,
};