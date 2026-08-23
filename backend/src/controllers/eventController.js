const { updateEventLifecycle } = require("../services/eventLifecycleService");
const pool = require("../config/database");

const getEvents = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                e.id,
                e.title,
                e.description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status,
                v.id AS venue_id,
                v.name AS venue_name,
                v.location AS venue_location
             FROM events e
             JOIN venues v ON v.id = e.venue_id
             WHERE e.status <> 'CANCELLED'
             ORDER BY e.start_time ASC`
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Get events error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENTS_FETCH_FAILED",
            message: "Unable to load events right now."
        });
    }
};


const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }
        await updateEventLifecycle(id);

        const result = await pool.query(
            `SELECT
                e.id,
                e.title,
                e.description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status,
                v.id AS venue_id,
                v.name AS venue_name,
                v.location AS venue_location
             FROM events e
             JOIN venues v ON v.id = e.venue_id
             WHERE e.id = $1`,
           
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "EVENT_NOT_FOUND",
                message: "The requested event could not be found."
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Get event error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_FETCH_FAILED",
            message: "Unable to load this event right now."
        });
    }
};

const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            eventType,
            venueId,
            startTime,
            endTime
        } = req.body;

        // ---------- REQUIRED FIELDS ----------

        if (
            !title ||
            !eventType ||
            !venueId ||
            !startTime ||
            !endTime
        ) {
            return res.status(400).json({
                success: false,
                code: "MISSING_EVENT_FIELDS",
                message: "Title, event type, venue, start time and end time are required."
            });
        }

        const trimmedTitle = title.trim();

        if (trimmedTitle.length < 2) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_TITLE",
                message: "Event title must contain at least 2 characters."
            });
        }

        // ---------- EVENT TYPE ----------

        const allowedTypes = ["MOVIE", "CONCERT", "OTHER"];

        if (!allowedTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_TYPE",
                message: "Event type must be MOVIE, CONCERT or OTHER."
            });
        }

        // ---------- VENUE ID ----------

        if (!/^\d+$/.test(String(venueId))) {
            return res.status(400).json({
                success: false,
                code: "INVALID_VENUE_ID",
                message: "The venue ID is invalid."
            });
        }

        // ---------- DATE VALIDATION ----------

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_TIME",
                message: "Please provide valid start and end times."
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                code: "INVALID_TIME_RANGE",
                message: "Event end time must be later than the start time."
            });
        }

        // Don't allow events to start in the past.
        const now = new Date();

        if (start <= now) {
            return res.status(400).json({
                success: false,
                code: "EVENT_START_IN_PAST",
                message: "An event cannot start in the past."
            });
        }

        // ---------- VENUE CHECK ----------

        const venueResult = await pool.query(
            `SELECT id, name
             FROM venues
             WHERE id = $1`,
            [venueId]
        );

        if (venueResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "VENUE_NOT_FOUND",
                message: "The selected venue does not exist."
            });
        }

        // ---------- VENUE CONFLICT CHECK ----------

        const conflictResult = await pool.query(
            `SELECT id, title, start_time, end_time
             FROM events
             WHERE venue_id = $1
             AND status <> 'CANCELLED'
             AND start_time < $3
             AND end_time > $2`,
            [
                venueId,
                start.toISOString(),
                end.toISOString()
            ]
        );

        if (conflictResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "VENUE_TIME_CONFLICT",
                message: "This venue is already occupied during the selected time."
            });
        }

        // ---------- CREATE EVENT ----------

        const result = await pool.query(
            `INSERT INTO events (
                organiser_id,
                venue_id,
                title,
                description,
                event_type,
                start_time,
                end_time,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT')
            RETURNING
                id,
                organiser_id,
                venue_id,
                title,
                description,
                event_type,
                start_time,
                end_time,
                status,
                created_at`,
            [
                req.user.id,
                venueId,
                trimmedTitle,
                description ? description.trim() : null,
                eventType,
                start.toISOString(),
                end.toISOString()
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Create event error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_CREATION_FAILED",
            message: "Unable to create the event right now."
        });
    }
};

const openEvent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        const eventResult = await pool.query(
            `SELECT
                id,
                organiser_id,
                venue_id,
                title,
                start_time,
                end_time,
                status
             FROM events
             WHERE id = $1`,
            [id]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "EVENT_NOT_FOUND",
                message: "The requested event does not exist."
            });
        }

        const event = eventResult.rows[0];

        // Only the organiser who owns the event can open it
        if (String(event.organiser_id) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                code: "EVENT_ACCESS_DENIED",
                message: "You can only manage events created by you."
            });
        }

        // Event must still be in DRAFT
        if (event.status !== "DRAFT") {
            return res.status(409).json({
                success: false,
                code: "INVALID_EVENT_STATUS",
                message: "Only draft events can be opened for booking."
            });
        }

        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        // Defensive time validation
        if (endTime <= startTime) {
            return res.status(400).json({
                success: false,
                code: "INVALID_TIME_RANGE",
                message: "Event end time must be later than the start time."
            });
        }

        // Do not allow an event that has already started
        if (startTime <= now) {
            return res.status(400).json({
                success: false,
                code: "EVENT_ALREADY_STARTED",
                message: "This event has already started and cannot be opened for booking."
            });
        }

        // Make sure event seats exist
        const seatResult = await pool.query(
            `SELECT COUNT(*)::int AS seat_count
             FROM event_seats
             WHERE event_id = $1`,
            [id]
        );

        if (seatResult.rows[0].seat_count === 0) {
            return res.status(409).json({
                success: false,
                code: "EVENT_HAS_NO_SEATS",
                message: "Seats must be configured before the event can be opened for booking."
            });
        }

        // Check whether another active event occupies the venue
        const conflictResult = await pool.query(
            `SELECT id, title
             FROM events
             WHERE venue_id = $1
             AND id <> $2
             AND status IN ('OPEN_FOR_BOOKING', 'ONGOING')
             AND start_time < $4
             AND end_time > $3`,
            [
                event.venue_id,
                id,
                event.start_time,
                event.end_time
            ]
        );

        if (conflictResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "VENUE_TIME_CONFLICT",
                message: "Another active event is already scheduled at this venue during this time."
            });
        }

        // Open the event
        const result = await pool.query(
            `UPDATE events
             SET status = 'OPEN_FOR_BOOKING'
             WHERE id = $1
             RETURNING
                id,
                title,
                start_time,
                end_time,
                status`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Event is now open for booking.",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Open event error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_OPEN_FAILED",
            message: "Unable to open the event right now."
        });
    }
};

const cancelEvent = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        await client.query("BEGIN");

        const eventResult = await client.query(
            `SELECT
                id,
                organiser_id,
                status,
                start_time
             FROM events
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                code: "EVENT_NOT_FOUND",
                message: "The requested event does not exist."
            });
        }

        const event = eventResult.rows[0];

        // Only the organiser who created the event can cancel it
        if (String(event.organiser_id) !== String(req.user.id)) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                code: "EVENT_ACCESS_DENIED",
                message: "You can only cancel events created by you."
            });
        }

        // Only DRAFT or OPEN_FOR_BOOKING can be cancelled
        if (
            event.status !== "DRAFT" &&
            event.status !== "OPEN_FOR_BOOKING"
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_CANNOT_BE_CANCELLED",
                message: "This event cannot be cancelled in its current status."
            });
        }

        // If an OPEN event has already started, don't allow cancellation
        if (event.status === "OPEN_FOR_BOOKING") {
            const now = new Date();
            const startTime = new Date(event.start_time);

            if (now >= startTime) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "EVENT_ALREADY_STARTED",
                    message: "An event that has already started cannot be cancelled."
                });
            }
        }

        // Cancel event
        const result = await client.query(
            `UPDATE events
             SET status = 'CANCELLED'
             WHERE id = $1
             RETURNING
                id,
                title,
                status`,
            [id]
        );

        // Release all temporary seat holds
        await client.query(
            `UPDATE event_seats
             SET
                status = 'AVAILABLE',
                held_by = NULL,
                hold_expires_at = NULL,
                updated_at = NOW()
             WHERE event_id = $1
             AND status = 'HELD'`,
            [id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Event cancelled successfully.",
            data: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Cancel event error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_CANCELLATION_FAILED",
            message: "Unable to cancel the event right now."
        });

    } finally {
        client.release();
    }
};

const getMyEvents = async (req, res) => {
    try {
        const organiserId = req.user.id;

        const result = await pool.query(
            `SELECT
                e.id,
                e.title,
                e.description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status,

                v.name AS venue_name,
                v.location AS venue_location,

                COUNT(es.id) AS total_seats,

                COUNT(es.id) FILTER (
                    WHERE es.status = 'AVAILABLE'
                ) AS available_seats,

                COUNT(es.id) FILTER (
                    WHERE es.status = 'HELD'
                ) AS held_seats,

                COUNT(es.id) FILTER (
                    WHERE es.status = 'BOOKED'
                ) AS booked_seats,

                COUNT(DISTINCT b.id) FILTER (
                    WHERE b.status = 'CONFIRMED'
                ) AS total_bookings,

                COALESCE(
                    SUM(b.total_amount) FILTER (
                        WHERE b.status = 'CONFIRMED'
                    ),
                    0
                ) AS revenue

             FROM events e

             JOIN venues v
                ON v.id = e.venue_id

             LEFT JOIN event_seats es
                ON es.event_id = e.id

             LEFT JOIN booking_seats bs
                ON bs.event_seat_id = es.id

             LEFT JOIN bookings b
                ON b.id = bs.booking_id

             WHERE e.organiser_id = $1

             GROUP BY
                e.id,
                e.title,
                e.description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status,
                v.name,
                v.location

             ORDER BY e.created_at DESC`,
            [organiserId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows.map(event => ({
                id: event.id,
                title: event.title,
                description: event.description,
                event_type: event.event_type,
                start_time: event.start_time,
                end_time: event.end_time,
                status: event.status,

                venue_name: event.venue_name,
                venue_location: event.venue_location,

                total_seats: Number(event.total_seats),
                available_seats: Number(event.available_seats),
                held_seats: Number(event.held_seats),
                booked_seats: Number(event.booked_seats),
                total_bookings: Number(event.total_bookings),
                revenue: Number(event.revenue)
            }))
        });

    } catch (error) {
        console.error("Get organiser events error:", error);

        return res.status(500).json({
            success: false,
            code: "ORGANISER_EVENTS_FETCH_FAILED",
            message: "Unable to retrieve organiser events right now."
        });
    }
};


module.exports = {
    getEvents,
    getEventById,
    createEvent,
    openEvent,
    cancelEvent,
    getMyEvents
};