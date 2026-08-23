const pool = require("../config/database");

const createVenue = async (req, res) => {
    try {
        const { name, location } = req.body;

        // Validate required fields
        if (!name || !location) {
            return res.status(400).json({
                success: false,
                code: "MISSING_VENUE_FIELDS",
                message: "Venue name and location are required."
            });
        }

        const trimmedName = name.trim();
        const trimmedLocation = location.trim();

        if (trimmedName.length < 2) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VENUE_NAME",
                message: "Venue name must contain at least 2 characters."
            });
        }

        if (trimmedLocation.length < 2) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VENUE_LOCATION",
                message: "Venue location must contain at least 2 characters."
            });
        }

        // Prevent duplicate venue names at the same location
        const existingVenue = await pool.query(
            `SELECT id
             FROM venues
             WHERE LOWER(name) = LOWER($1)
             AND LOWER(location) = LOWER($2)`,
            [trimmedName, trimmedLocation]
        );

        if (existingVenue.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "VENUE_ALREADY_EXISTS",
                message: "A venue with this name already exists at this location."
            });
        }

        const result = await pool.query(
            `INSERT INTO venues (name, location)
             VALUES ($1, $2)
             RETURNING id, name, location, created_at`,
            [trimmedName, trimmedLocation]
        );

        return res.status(201).json({
            success: true,
            message: "Venue created successfully.",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Create venue error:", error);

        return res.status(500).json({
            success: false,
            code: "VENUE_CREATION_FAILED",
            message: "Unable to create the venue right now."
        });
    }
};


const getVenues = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                location,
                created_at
             FROM venues
             ORDER BY name ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Get venues error:", error);

        return res.status(500).json({
            success: false,
            code: "VENUES_FETCH_FAILED",
            message: "Unable to load venues right now."
        });
    }
};


module.exports = {
    createVenue,
    getVenues
};