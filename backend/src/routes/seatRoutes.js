const express = require("express");

const {
    createSeats,
    getVenueSeats
} = require("../controllers/seatController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/venues/:venueId/seats",
    authenticate,
    authorizeRoles("ADMIN"),
    createSeats
);

router.get(
    "/venues/:venueId/seats",
    getVenueSeats
);

module.exports = router;