const express = require("express");
const router = express.Router();

const {
  createLocation,
  getMyLocations,
  getLocation,
  updateLocation,
  deleteLocation,
  permanentDeleteLocation,
  setDefaultLocation,
  getDefaultLocation,
  updateCoordinates
} = require("../controllers/locationController");

const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Get default location (must be before /:id route)
router.get("/default", getDefaultLocation);

// CRUD Routes
router.post("/", createLocation);
router.get("/", getMyLocations);
router.get("/:id", getLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

// Additional operations
router.delete("/:id/permanent", permanentDeleteLocation);
router.put("/:id/set-default", setDefaultLocation);
router.put("/:id/coordinates", updateCoordinates);

module.exports = router;