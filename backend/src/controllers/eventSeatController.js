const pool = require("../config/database");

const generateEventSeats = async (req, res) => {
    const client = await pool.connect();

    try {
        const { eventId } = req.params;
        const { standardPrice, premiumPrice } = req.body;

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        if (
            typeof standardPrice !== "number" ||
            typeof premiumPrice !== "number" ||
            standardPrice < 0 ||
            premiumPrice < 0
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_SEAT_PRICE",
                message: "Seat prices must be valid non-negative numbers."
            });
        }

        const eventResult = await client.query(
            `SELECT
                id,
                venue_id,
                title,
                status,
                start_time
             FROM events
             WHERE id = $1`,
            [eventId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "EVENT_NOT_FOUND",
                message: "The requested event does not exist."
            });
        }

        const event = eventResult.rows[0];

        if (event.status !== "DRAFT") {
            return res.status(409).json({
                success: false,
                code: "EVENT_NOT_EDITABLE",
                message: "Seats can only be configured while the event is in draft status."
            });
        }

        const existingSeats = await client.query(
            `SELECT id
             FROM event_seats
             WHERE event_id = $1
             LIMIT 1`,
            [eventId]
        );

        if (existingSeats.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "EVENT_SEATS_ALREADY_CREATED",
                message: "Seats have already been configured for this event."
            });
        }

        const venueSeats = await client.query(
            `SELECT
                id,
                category
             FROM seats
             WHERE venue_id = $1
             ORDER BY row_label, seat_number`,
            [event.venue_id]
        );

        if (venueSeats.rows.length === 0) {
            return res.status(409).json({
                success: false,
                code: "VENUE_HAS_NO_SEATS",
                message: "The selected venue does not have any seats configured."
            });
        }

        await client.query("BEGIN");

        const createdSeats = [];

        for (const seat of venueSeats.rows) {
            const price =
                seat.category === "PREMIUM"
                    ? premiumPrice
                    : standardPrice;

            const result = await client.query(
                `INSERT INTO event_seats (
                    event_id,
                    seat_id,
                    category,
                    price,
                    status
                )
                VALUES ($1, $2, $3, $4, 'AVAILABLE')
                RETURNING
                    id,
                    event_id,
                    seat_id,
                    category,
                    price,
                    status`,
                [
                    eventId,
                    seat.id,
                    seat.category,
                    price
                ]
            );

            createdSeats.push(result.rows[0]);
        }

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: `${createdSeats.length} event seats created successfully.`,
            data: createdSeats
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Generate event seats error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_SEAT_CREATION_FAILED",
            message: "Unable to configure seats for this event."
        });

    } finally {
        client.release();
    }
};


const getEventSeats = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        const result = await pool.query(
            `SELECT
                es.id,
                es.event_id,
                es.seat_id,
                s.row_label,
                s.seat_number,
                es.category,
                es.price,
                es.status
             FROM event_seats es
             JOIN seats s ON s.id = es.seat_id
             WHERE es.event_id = $1
             ORDER BY s.row_label, s.seat_number`,
            [eventId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Get event seats error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_SEATS_FETCH_FAILED",
            message: "Unable to load event seats right now."
        });
    }
};


module.exports = {
    generateEventSeats,
    getEventSeats
};