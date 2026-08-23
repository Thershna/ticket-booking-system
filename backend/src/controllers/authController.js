const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");


const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                code: "MISSING_FIELDS",
                message: "Name, email and password are required."
            });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                success: false,
                code: "INVALID_NAME",
                message: "Name must contain at least 2 characters."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EMAIL",
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                code: "WEAK_PASSWORD",
                message: "Password must contain at least 8 characters."
            });
        }

        // Check whether the email already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "EMAIL_ALREADY_EXISTS",
                message: "An account with this email already exists."
            });
        }

        // Never store the original password
        const passwordHash = await bcrypt.hash(password, 12);

        // New registrations are always customers
       

const result = await pool.query(
    `INSERT INTO users (
        name,
        email,
        password_hash,
        role
     )
     VALUES (
        $1,
        $2,
        $3,
        'CUSTOMER'
     )
     RETURNING
        id,
        name,
        email,
        role,
        created_at`,
    [
        trimmedName,
        normalizedEmail,
        passwordHash
    ]
);

const user = result.rows[0];

return res.status(201).json({
    success: true,
    message: "Account created successfully. You can now log in.",
    data: {
        user
    }
});



        


    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while creating your account."
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                code: "MISSING_CREDENTIALS",
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
    `SELECT
        id,
        name,
        email,
        password_hash,
        role       
     FROM users
     WHERE LOWER(email) = $1`,
    [normalizedEmail]
);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Invalid email or password."
            });
        }
        


        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong while logging in."
        });
    }
};


module.exports = {
    register,
    login
};