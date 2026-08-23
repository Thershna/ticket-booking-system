const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                code: "AUTHENTICATION_REQUIRED",
                message: "Please log in to continue."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                code: "INVALID_TOKEN",
                message: "Authentication token is missing."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            id: decoded.userId,
            role: decoded.role
        };

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                code: "TOKEN_EXPIRED",
                message: "Your session has expired. Please log in again."
            });
        }

        return res.status(401).json({
            success: false,
            code: "INVALID_TOKEN",
            message: "Your session is invalid. Please log in again."
        });
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                code: "AUTHENTICATION_REQUIRED",
                message: "Please log in to continue."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                code: "ACCESS_DENIED",
                message: "You do not have permission to perform this action."
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorizeRoles
};