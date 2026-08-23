const express = require("express");

const {
    generateEventSeats,
    getEventSeats
} = require("../controllers/eventSeatController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/events/:eventId/seats",
    authenticate,
    authorizeRoles("ORGANISER"),
    generateEventSeats
);

router.get(
    "/events/:eventId/seats",
    getEventSeats
);

module.exports = router;