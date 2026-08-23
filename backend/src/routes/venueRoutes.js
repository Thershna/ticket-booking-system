const express = require("express");

const {
    createVenue,
    getVenues
} = require("../controllers/venueController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Anyone logged in as ADMIN can create a venue
router.post(
    "/",
    authenticate,
    authorizeRoles("ADMIN"),
    createVenue
);

// Publicly view available venues
router.get("/", getVenues);

module.exports = router;