// backend/routes/adminSseRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/jwtUtils");
const Admin = require("../models/Admin");
const { addClient, removeClient } = require("../utils/sseManager");

/**
 * @desc    SSE endpoint for admin real-time updates
 * @route   GET /api/admin/sse
 * @access  Private/Admin — token passed via query string
 *          because EventSource does not support custom headers
 */
router.get("/", async (req, res) => {
  try {
    // ── 1. Extract token from query string ──────────────────
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - No token provided",
      });
    }

    // ── 2. Verify token ─────────────────────────────────────
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Invalid token",
      });
    }

    // ── 3. Must be admin ────────────────────────────────────
    if (decoded.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied - Admin only",
      });
    }

    // ── 4. Check admin exists and is active ─────────────────
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - Admin not found or inactive",
      });
    }

    // ── 5. Set SSE headers ──────────────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Accel-Buffering", "no");

    // Flush headers immediately
    res.flushHeaders();

    // ── 6. Register this client ─────────────────────────────
    const adminId = admin._id.toString();
    addClient(adminId, res);

    // ── 7. Send initial connected event ─────────────────────
    res.write(`event: connected\n`);
    res.write(
      `data: ${JSON.stringify({
        message: "SSE connection established",
        adminId,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // ── 8. Heartbeat every 30 seconds to keep connection alive
    // (prevents proxies and browsers from closing idle connections)
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\n`);
        res.write(
          `data: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      } catch (err) {
        console.log(
          `📡 Heartbeat failed for admin=${adminId}:`,
          err.message
        );
        clearInterval(heartbeat);
        removeClient(adminId, res);
      }
    }, 30000);

    // ── 9. Cleanup on client disconnect ─────────────────────
    req.on("close", () => {
      // console.log(
      //   `📡 SSE close event fired for admin=${adminId}, reason: client disconnected`
      // );
      clearInterval(heartbeat);
      removeClient(adminId, res);
    });

  } catch (error) {
    console.error("SSE Route Error:", error);

    // If headers not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "SSE connection failed",
      });
    }
  }
});

module.exports = router;