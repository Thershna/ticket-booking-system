const express = require("express");

const {
    getEvents,
    getEventById,
    createEvent,
    openEvent,
    cancelEvent,
    getMyEvents
} = require("../controllers/eventController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// Public event browsing
router.get("/", getEvents);

router.get(
    "/organiser/my-events",
    authenticate,
    authorizeRoles("ORGANISER"),
    getMyEvents
);

router.get("/:id", getEventById);


// Organiser event creation
router.post(
    "/",
    authenticate,
    authorizeRoles("ORGANISER"),
    createEvent
);

router.patch(
    "/:id/open",
    authenticate,
    authorizeRoles("ORGANISER"),
    openEvent
);

router.patch(
    "/:id/cancel",
    authenticate,
    authorizeRoles("ORGANISER"),
    cancelEvent
);

module.exports = router;