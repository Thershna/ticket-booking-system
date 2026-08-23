const pool = require("../config/database");

const createSeats = async (req, res) => {
    const client = await pool.connect();

    try {
        const { venueId } = req.params;
        const { seats } = req.body;

        // Validate venue ID
        if (!/^\d+$/.test(venueId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VENUE_ID",
                message: "The venue ID is invalid."
            });
        }

        // Validate seats array
        if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({
                success: false,
                code: "INVALID_SEAT_LIST",
                message: "Please provide at least one seat."
            });
        }

        // Keep the request reasonably sized
        if (seats.length > 500) {
            return res.status(400).json({
                success: false,
                code: "TOO_MANY_SEATS",
                message: "A maximum of 500 seats can be created at once."
            });
        }

        // Check venue exists
        const venueResult = await pool.query(
            "SELECT id, name FROM venues WHERE id = $1",
            [venueId]
        );

        if (venueResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "VENUE_NOT_FOUND",
                message: "The requested venue does not exist."
            });
        }

        // Validate every seat before inserting anything
        const seenSeats = new Set();

        for (const seat of seats) {
            if (
                !seat ||
                typeof seat.rowLabel !== "string" ||
                typeof seat.seatNumber !== "number" ||
                typeof seat.category !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_SEAT_DATA",
                    message: "Every seat must have a row, seat number and category."
                });
            }

            const rowLabel = seat.rowLabel.trim().toUpperCase();
            const category = seat.category.trim().toUpperCase();

            if (!/^[A-Z]{1,3}$/.test(rowLabel)) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_ROW_LABEL",
                    message: `Invalid row label: ${seat.rowLabel}`
                });
            }

            if (
                !Number.isInteger(seat.seatNumber) ||
                seat.seatNumber <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_SEAT_NUMBER",
                    message: `Seat number must be a positive whole number.`
                });
            }

            if (!["STANDARD", "PREMIUM"].includes(category)) {
                return res.status(400).json({
                    success: false,
                    code: "INVALID_SEAT_CATEGORY",
                    message: `Invalid seat category: ${seat.category}`
                });
            }

            const seatKey = `${rowLabel}-${seat.seatNumber}`;

            if (seenSeats.has(seatKey)) {
                return res.status(409).json({
                    success: false,
                    code: "DUPLICATE_SEAT",
                    message: `Seat ${seatKey} appears more than once in this request.`
                });
            }

            seenSeats.add(seatKey);
        }

        // Start transaction
        await client.query("BEGIN");

        // Check for seats that already exist
        for (const seat of seats) {
            const rowLabel = seat.rowLabel.trim().toUpperCase();

            const existingSeat = await client.query(
                `SELECT id
                 FROM seats
                 WHERE venue_id = $1
                 AND row_label = $2
                 AND seat_number = $3`,
                [venueId, rowLabel, seat.seatNumber]
            );

            if (existingSeat.rows.length > 0) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "SEAT_ALREADY_EXISTS",
                    message: `Seat ${rowLabel}${seat.seatNumber} already exists in this venue.`
                });
            }
        }

        // Insert all seats
        const createdSeats = [];

        for (const seat of seats) {
            const rowLabel = seat.rowLabel.trim().toUpperCase();
            const category = seat.category.trim().toUpperCase();

            const result = await client.query(
                `INSERT INTO seats (
                    venue_id,
                    row_label,
                    seat_number,
                    category
                )
                VALUES ($1, $2, $3, $4)
                RETURNING id, venue_id, row_label, seat_number, category`,
                [
                    venueId,
                    rowLabel,
                    seat.seatNumber,
                    category
                ]
            );

            createdSeats.push(result.rows[0]);
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: `${createdSeats.length} seats created successfully.`,
            data: createdSeats
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create seats error:", error);

        return res.status(500).json({
            success: false,
            code: "SEAT_CREATION_FAILED",
            message: "Unable to create the seats right now."
        });

    } finally {
        client.release();
    }
};


const getVenueSeats = async (req, res) => {
    try {
        const { venueId } = req.params;

        if (!/^\d+$/.test(venueId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VENUE_ID",
                message: "The venue ID is invalid."
            });
        }

        const result = await pool.query(
            `SELECT
                id,
                venue_id,
                row_label,
                seat_number,
                category
             FROM seats
             WHERE venue_id = $1
             ORDER BY row_label, seat_number`,
            [venueId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Get venue seats error:", error);

        return res.status(500).json({
            success: false,
            code: "SEATS_FETCH_FAILED",
            message: "Unable to load the venue seats right now."
        });
    }
};


module.exports = {
    createSeats,
    getVenueSeats
};