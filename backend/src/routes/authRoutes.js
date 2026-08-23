const express = require("express");

const {
    register,
    login
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);



router.get("/me", authenticate, (req, res) => {
    res.json({
        success: true,
        message: "Authenticated user information retrieved.",
        data: {
            userId: req.user.id,
            role: req.user.role
        }
    });
});

module.exports = router;