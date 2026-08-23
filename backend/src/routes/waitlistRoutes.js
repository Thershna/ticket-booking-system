const express = require("express");

const {
    joinWaitlist,
    acceptOffer,
    getMyWaitlistOffers
} = require("../controllers/waitlistController");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/events/:eventId/waitlist",
    authenticate,
    authorizeRoles("CUSTOMER"),
    joinWaitlist
);

router.get(
    "/waitlist/my-offers",
    authenticate,
    authorizeRoles("CUSTOMER"),
    getMyWaitlistOffers
);

router.post(
    "/waitlist/offers/:offerId/accept",
    authenticate,
    authorizeRoles("CUSTOMER"),
    acceptOffer
);

module.exports = router;