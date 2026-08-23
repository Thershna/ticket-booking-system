const express = require("express");

const {
    holdSeats,
    confirmBooking,
    getMyBookings,
    getBookingById,
    getEventBookings,
    cancelBooking
} = require("../controllers/bookingController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/my",
    authenticate,
    authorizeRoles("CUSTOMER"),
    getMyBookings
);

router.get(
    "/events/:eventId/bookings",
    authenticate,
    authorizeRoles("ORGANISER"),
    getEventBookings
);

router.get(
    "/:bookingId",
    authenticate,
    authorizeRoles("CUSTOMER"),
    getBookingById
);

router.patch(
    "/:bookingId/cancel",
    authenticate,
    authorizeRoles("CUSTOMER"),
    cancelBooking
);

router.post(
    "/events/:eventId/hold",
    authenticate,
    authorizeRoles("CUSTOMER"),
    holdSeats
);

router.post(
    "/events/:eventId/confirm",
    authenticate,
    authorizeRoles("CUSTOMER"),
    confirmBooking
);

module.exports = router;