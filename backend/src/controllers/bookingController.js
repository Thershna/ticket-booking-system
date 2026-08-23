const pool = require("../config/database");

const {
    createWaitlistOffer
} = require("../services/waitlistService");

const HOLD_DURATION_MINUTES = 10;
const MAX_SEATS_PER_HOLD = 6;


const holdSeats = async (req, res) => {
    const client = await pool.connect();

    try {
        const { eventId } = req.params;
        const { eventSeatIds } = req.body;

        // ---------- BASIC VALIDATION ----------

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        if (!Array.isArray(eventSeatIds) || eventSeatIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: "NO_SEATS_SELECTED",
                message: "Please select at least one seat."
            });
        }

        if (eventSeatIds.length > MAX_SEATS_PER_HOLD) {
            return res.status(400).json({
                success: false,
                code: "SEAT_LIMIT_EXCEEDED",
                message: `You can select a maximum of ${MAX_SEATS_PER_HOLD} seats at a time.`
            });
        }

        // Convert IDs to numbers and validate them
        const seatIds = eventSeatIds.map(Number);

        if (
            seatIds.some(
                id => !Number.isInteger(id) || id <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_SEAT_ID",
                message: "One or more selected seat IDs are invalid."
            });
        }

        // Remove duplicate seat IDs
        const uniqueSeatIds = [...new Set(seatIds)];

        if (uniqueSeatIds.length !== seatIds.length) {
            return res.status(400).json({
                success: false,
                code: "DUPLICATE_SEATS",
                message: "The same seat cannot be selected more than once."
            });
        }

        await client.query("BEGIN");

        // ---------- LOCK EVENT ----------

        const eventResult = await client.query(
            `SELECT
                id,
                start_time,
                end_time,
                status
             FROM events
             WHERE id = $1
             FOR UPDATE`,
            [eventId]
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

        // ---------- EVENT STATUS ----------

        if (event.status !== "OPEN_FOR_BOOKING") {
            await client.query("ROLLBACK");

            let message = "This event is not currently open for booking.";

            if (event.status === "CANCELLED") {
                message = "This event has been cancelled.";
            } else if (event.status === "COMPLETED") {
                message = "This event has already been completed.";
            } else if (event.status === "ONGOING") {
                message = "This event has already started.";
            } else if (event.status === "DRAFT") {
                message = "This event is not yet open for booking.";
            }

            return res.status(409).json({
                success: false,
                code: "EVENT_NOT_BOOKABLE",
                message
            });
        }

        // ---------- TIME CHECK ----------

        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        if (now >= startTime) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_ALREADY_STARTED",
                message: "This event has already started. New bookings are not allowed."
            });
        }

        if (now >= endTime) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_ALREADY_COMPLETED",
                message: "This event has already ended."
            });
        }

        // ---------- LOCK SELECTED SEATS ----------

        const seatResult = await client.query(
            `SELECT
                es.id,
                es.event_id,
                es.price,
                es.status,
                es.held_by,
                es.hold_expires_at,
                s.row_label,
                s.seat_number
             FROM event_seats es
             JOIN seats s ON s.id = es.seat_id
             WHERE es.event_id = $1
             AND es.id = ANY($2::bigint[])
             ORDER BY es.id
             FOR UPDATE OF es`,
            [eventId, uniqueSeatIds]
        );

        // Check that every requested seat exists for this event
        if (seatResult.rows.length !== uniqueSeatIds.length) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                code: "SEAT_NOT_FOUND",
                message: "One or more selected seats do not belong to this event."
            });
        }

        const nowTime = new Date();

        // ---------- CHECK SEAT STATUS ----------

        for (const seat of seatResult.rows) {

            // Automatically treat expired holds as available
            if (
                seat.status === "HELD" &&
                seat.hold_expires_at &&
                new Date(seat.hold_expires_at) <= nowTime
            ) {
                await client.query(
                    `UPDATE event_seats
                     SET
                        status = 'AVAILABLE',
                        held_by = NULL,
                        hold_expires_at = NULL,
                        updated_at = NOW()
                     WHERE id = $1`,
                    [seat.id]
                );

                seat.status = "AVAILABLE";
                seat.held_by = null;
                seat.hold_expires_at = null;
            }

            if (seat.status === "BOOKED") {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "SEAT_ALREADY_BOOKED",
                    message: `Seat ${seat.row_label}${seat.seat_number} has already been booked.`
                });
            }

            if (seat.status === "HELD") {

                if (String(seat.held_by) === String(req.user.id)) {
                    await client.query("ROLLBACK");

                    return res.status(409).json({
                        success: false,
                        code: "SEAT_ALREADY_HELD_BY_YOU",
                        message: `Seat ${seat.row_label}${seat.seat_number} is already held by you.`
                    });
                }

                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "SEAT_CURRENTLY_HELD",
                    message: `Seat ${seat.row_label}${seat.seat_number} is currently being held by another customer.`
                });
            }
        }

        // ---------- CREATE HOLD EXPIRY ----------

        const holdExpiresAt = new Date(
            nowTime.getTime() +
            HOLD_DURATION_MINUTES * 60 * 1000
        );

        // ---------- HOLD ALL SEATS ----------

        for (const seat of seatResult.rows) {
            await client.query(
                `UPDATE event_seats
                 SET
                    status = 'HELD',
                    held_by = $1,
                    hold_expires_at = $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [
                    req.user.id,
                    holdExpiresAt,
                    seat.id
                ]
            );
        }

        await client.query("COMMIT");

        const totalAmount = seatResult.rows.reduce(
            (total, seat) => total + Number(seat.price),
            0
        );

        return res.status(200).json({
            success: true,
            message: "Seats held successfully.",
            data: {
                eventId: Number(eventId),
                eventSeatIds: uniqueSeatIds,
                totalAmount: totalAmount.toFixed(2),
                holdExpiresAt: holdExpiresAt.toISOString()
            }
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Hold seats error:", error);

        return res.status(500).json({
            success: false,
            code: "SEAT_HOLD_FAILED",
            message: "Unable to hold the selected seats right now."
        });

    } finally {
        client.release();
    }
};

const confirmBooking = async (req, res) => {
    const client = await pool.connect();

    try {
        const { eventId } = req.params;
        const { eventSeatIds } = req.body;

        // ---------- BASIC VALIDATION ----------

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        if (!Array.isArray(eventSeatIds) || eventSeatIds.length === 0) {
            return res.status(400).json({
                success: false,
                code: "NO_SEATS_SELECTED",
                message: "Please provide the seats you want to confirm."
            });
        }

        if (eventSeatIds.length > MAX_SEATS_PER_HOLD) {
            return res.status(400).json({
                success: false,
                code: "SEAT_LIMIT_EXCEEDED",
                message: `You can confirm a maximum of ${MAX_SEATS_PER_HOLD} seats at a time.`
            });
        }

        const seatIds = eventSeatIds.map(Number);

        if (
            seatIds.some(
                id => !Number.isInteger(id) || id <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                code: "INVALID_SEAT_ID",
                message: "One or more selected seat IDs are invalid."
            });
        }

        const uniqueSeatIds = [...new Set(seatIds)];

        if (uniqueSeatIds.length !== seatIds.length) {
            return res.status(400).json({
                success: false,
                code: "DUPLICATE_SEATS",
                message: "The same seat cannot be confirmed more than once."
            });
        }

        await client.query("BEGIN");

        // ---------- LOCK EVENT ----------

        const eventResult = await client.query(
            `SELECT
                id,
                start_time,
                end_time,
                status
             FROM events
             WHERE id = $1
             FOR UPDATE`,
            [eventId]
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

        // ---------- EVENT STATUS ----------

        if (event.status !== "OPEN_FOR_BOOKING") {
            await client.query("ROLLBACK");

            let message = "This event is not currently bookable.";

            if (event.status === "CANCELLED") {
                message = "This event has been cancelled.";
            } else if (event.status === "COMPLETED") {
                message = "This event has already been completed.";
            } else if (event.status === "ONGOING") {
                message = "This event has already started.";
            } else if (event.status === "DRAFT") {
                message = "This event is not yet open for booking.";
            }

            return res.status(409).json({
                success: false,
                code: "EVENT_NOT_BOOKABLE",
                message
            });
        }

        // ---------- TIME CHECK ----------

        const now = new Date();
        const startTime = new Date(event.start_time);
        const endTime = new Date(event.end_time);

        if (now >= startTime) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_ALREADY_STARTED",
                message: "This event has already started. Booking is not allowed."
            });
        }

        if (now >= endTime) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_ALREADY_COMPLETED",
                message: "This event has already ended."
            });
        }

        // ---------- LOCK SELECTED EVENT SEATS ----------

        const seatResult = await client.query(
            `SELECT
                es.id,
                es.price,
                es.status,
                es.held_by,
                es.hold_expires_at,
                s.row_label,
                s.seat_number
             FROM event_seats es
             JOIN seats s ON s.id = es.seat_id
             WHERE es.event_id = $1
             AND es.id = ANY($2::bigint[])
             ORDER BY es.id
             FOR UPDATE OF es`,
            [eventId, uniqueSeatIds]
        );

        // ---------- VERIFY ALL SEATS EXIST ----------

        if (seatResult.rows.length !== uniqueSeatIds.length) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                code: "SEAT_NOT_FOUND",
                message: "One or more selected seats do not belong to this event."
            });
        }

        // ---------- VERIFY HOLDS ----------

        for (const seat of seatResult.rows) {

            if (seat.status === "BOOKED") {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "SEAT_ALREADY_BOOKED",
                    message: `Seat ${seat.row_label}${seat.seat_number} has already been booked.`
                });
            }

            if (seat.status !== "HELD") {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "SEAT_NOT_HELD",
                    message: `Seat ${seat.row_label}${seat.seat_number} is not currently held.`
                });
            }

            if (String(seat.held_by) !== String(req.user.id)) {
                await client.query("ROLLBACK");

                return res.status(403).json({
                    success: false,
                    code: "HOLD_NOT_OWNED",
                    message: `Seat ${seat.row_label}${seat.seat_number} is held by another customer.`
                });
            }

            if (
                !seat.hold_expires_at ||
                new Date(seat.hold_expires_at) <= now
            ) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    code: "HOLD_EXPIRED",
                    message: `The hold for seat ${seat.row_label}${seat.seat_number} has expired. Please select the seat again.`
                });
            }
        }

        // ---------- CALCULATE TOTAL FROM DATABASE ----------

        const totalAmount = seatResult.rows.reduce(
            (total, seat) => total + Number(seat.price),
            0
        );

        // ---------- GENERATE BOOKING REFERENCE ----------

        const bookingReference =
            `TBS-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()}`;

        // ---------- CREATE BOOKING ----------

        const bookingResult = await client.query(
            `INSERT INTO bookings (
                booking_reference,
                user_id,
                event_id,
                total_amount,
                status
            )
            VALUES ($1, $2, $3, $4, 'CONFIRMED')
            RETURNING
                id,
                booking_reference,
                user_id,
                event_id,
                total_amount,
                status,
                created_at`,
            [
                bookingReference,
                req.user.id,
                eventId,
                totalAmount.toFixed(2)
            ]
        );

        const booking = bookingResult.rows[0];

        // ---------- CREATE BOOKING SEATS ----------

        for (const seat of seatResult.rows) {
            await client.query(
                `INSERT INTO booking_seats (
                    booking_id,
                    event_seat_id,
                    price
                )
                VALUES ($1, $2, $3)`,
                [
                    booking.id,
                    seat.id,
                    seat.price
                ]
            );
        }

        // ---------- MARK SEATS BOOKED ----------

        await client.query(
            `UPDATE event_seats
             SET
                status = 'BOOKED',
                held_by = NULL,
                hold_expires_at = NULL,
                updated_at = NOW()
             WHERE event_id = $1
             AND id = ANY($2::bigint[])`,
            [eventId, uniqueSeatIds]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Booking confirmed successfully.",
            data: {
                bookingId: booking.id,
                bookingReference: booking.booking_reference,
                eventId: booking.event_id,
                totalAmount: Number(booking.total_amount).toFixed(2),
                status: booking.status,
                seats: seatResult.rows.map(seat => ({
                    eventSeatId: seat.id,
                    seat: `${seat.row_label}${seat.seat_number}`,
                    category: seat.category,
                    price: Number(seat.price).toFixed(2)
                })),
                createdAt: booking.created_at
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Confirm booking error:", error);

        return res.status(500).json({
            success: false,
            code: "BOOKING_CONFIRMATION_FAILED",
            message: "Unable to confirm the booking right now."
        });

    } finally {
        client.release();
    }
};

const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT
                b.id,
                b.booking_reference,
                b.event_id,
                e.title AS event_title,
                e.description AS event_description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status AS event_status,
                v.name AS venue_name,
                v.location AS venue_location,
                b.total_amount,
                b.status AS booking_status,
                b.created_at,
                b.cancelled_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'eventSeatId', bs.event_seat_id,
                            'seat', s.row_label || s.seat_number,
                            'category', es.category,
                            'price', bs.price
                        )
                        ORDER BY s.row_label, s.seat_number
                    ) FILTER (WHERE bs.id IS NOT NULL),
                    '[]'
                ) AS seats
             FROM bookings b
             JOIN events e ON e.id = b.event_id
             JOIN venues v ON v.id = e.venue_id
             LEFT JOIN booking_seats bs ON bs.booking_id = b.id
             LEFT JOIN event_seats es ON es.id = bs.event_seat_id
             LEFT JOIN seats s ON s.id = es.seat_id
             WHERE b.user_id = $1
             GROUP BY
                b.id,
                e.id,
                v.id
             ORDER BY b.created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Get my bookings error:", error);

        return res.status(500).json({
            success: false,
            code: "BOOKINGS_FETCH_FAILED",
            message: "Unable to retrieve your bookings right now."
        });
    }
};


const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        if (!/^\d+$/.test(bookingId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_BOOKING_ID",
                message: "The booking ID is invalid."
            });
        }

        const result = await pool.query(
            `SELECT
                b.id,
                b.booking_reference,
                b.event_id,
                b.total_amount,
                b.status AS booking_status,
                b.created_at,
                b.cancelled_at,

                e.title AS event_title,
                e.description AS event_description,
                e.event_type,
                e.start_time,
                e.end_time,
                e.status AS event_status,

                v.id AS venue_id,
                v.name AS venue_name,
                v.location AS venue_location,

                bs.event_seat_id,
                bs.price AS seat_price,
                s.row_label,
                s.seat_number,
                es.category

             FROM bookings b
             JOIN events e
                ON e.id = b.event_id
             JOIN venues v
                ON v.id = e.venue_id
             JOIN booking_seats bs
                ON bs.booking_id = b.id
             JOIN event_seats es
                ON es.id = bs.event_seat_id
             JOIN seats s
                ON s.id = es.seat_id

             WHERE b.id = $1
             AND b.user_id = $2

             ORDER BY bs.event_seat_id`,
            [bookingId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "BOOKING_NOT_FOUND",
                message: "The requested booking was not found."
            });
        }

        const first = result.rows[0];

        const booking = {
            id: first.id,
            booking_reference: first.booking_reference,
            event_id: first.event_id,
            event_title: first.event_title,
            event_description: first.event_description,
            event_type: first.event_type,
            start_time: first.start_time,
            end_time: first.end_time,
            event_status: first.event_status,
            venue_id: first.venue_id,
            venue_name: first.venue_name,
            venue_location: first.venue_location,
            total_amount: first.total_amount,
            booking_status: first.booking_status,
            created_at: first.created_at,
            cancelled_at: first.cancelled_at,
            seats: result.rows.map(row => ({
                eventSeatId: row.event_seat_id,
                seat: `${row.row_label}${row.seat_number}`,
                category: row.category,
                price: Number(row.seat_price)
            }))
        };

        return res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error("Get booking by ID error:", error);

        return res.status(500).json({
            success: false,
            code: "BOOKING_FETCH_FAILED",
            message: "Unable to retrieve the booking right now."
        });
    }
};

const cancelBooking = async (req, res) => {
    const client = await pool.connect();

    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        if (!/^\d+$/.test(bookingId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_BOOKING_ID",
                message: "The booking ID is invalid."
            });
        }

        await client.query("BEGIN");

        const bookingResult = await client.query(
            `SELECT
                b.id,
                b.booking_reference,
                b.user_id,
                b.event_id,
                b.status,
                e.title,
                e.start_time,
                e.status AS event_status
             FROM bookings b
             JOIN events e ON e.id = b.event_id
             WHERE b.id = $1
             FOR UPDATE`,
            [bookingId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                code: "BOOKING_NOT_FOUND",
                message: "The requested booking does not exist."
            });
        }

        const booking = bookingResult.rows[0];

        // Customer can cancel only their own booking
        if (String(booking.user_id) !== String(userId)) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                code: "BOOKING_ACCESS_DENIED",
                message: "You can only cancel your own booking."
            });
        }

        // Already cancelled
        if (booking.status === "CANCELLED") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "BOOKING_ALREADY_CANCELLED",
                message: "This booking has already been cancelled."
            });
        }

        // Event already started
        const now = new Date();
        const startTime = new Date(booking.start_time);

        if (now >= startTime) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "BOOKING_CANCELLATION_CLOSED",
                message: "This booking can no longer be cancelled because the event has started."
            });
        }

        // Get seats belonging to this booking
        const seatsResult = await client.query(
            `SELECT event_seat_id
             FROM booking_seats
             WHERE booking_id = $1`,
            [bookingId]
        );

        const eventSeatIds = seatsResult.rows.map(
            row => row.event_seat_id
        );

        // Cancel booking
        const updateResult = await client.query(
            `UPDATE bookings
             SET
                status = 'CANCELLED',
                cancelled_at = NOW()
             WHERE id = $1
             RETURNING
                id,
                booking_reference,
                event_id,
                total_amount,
                status,
                cancelled_at`,
            [bookingId]
        );

        // Release booked seats
        if (eventSeatIds.length > 0) {
    await client.query(
        `UPDATE event_seats
         SET
            status = 'AVAILABLE',
            held_by = NULL,
            hold_expires_at = NULL,
            updated_at = NOW()
         WHERE id = ANY($1::bigint[])`,
        [eventSeatIds]
        );
       }
       // Create waitlist offers for released seats
       for (const eventSeatId of eventSeatIds) {
          await createWaitlistOffer(client, eventSeatId);
       }

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully.",
            data: updateResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Cancel booking error:", error);

        return res.status(500).json({
            success: false,
            code: "BOOKING_CANCELLATION_FAILED",
            message: "Unable to cancel the booking right now."
        });

    } finally {
        client.release();
    }
};

const getEventBookings = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organiserId = req.user.id;

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_EVENT_ID",
                message: "The event ID is invalid."
            });
        }

        // Verify that this event belongs to the organiser
        const eventResult = await pool.query(
            `SELECT
                id,
                title,
                status
             FROM events
             WHERE id = $1
             AND organiser_id = $2`,
            [eventId, organiserId]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                code: "EVENT_NOT_FOUND",
                message: "The requested event was not found."
            });
        }

        const result = await pool.query(
            `SELECT
                b.id AS booking_id,
                b.booking_reference,
                b.status AS booking_status,
                b.total_amount,
                b.created_at,
                b.cancelled_at,

                u.id AS customer_id,
                u.name AS customer_name,
                u.email AS customer_email,

                es.id AS event_seat_id,
                es.category,
                s.row_label,
                s.seat_number,
                bs.price AS seat_price

             FROM bookings b
             JOIN users u
                ON u.id = b.user_id
             JOIN booking_seats bs
                ON bs.booking_id = b.id
             JOIN event_seats es
                ON es.id = bs.event_seat_id
             JOIN seats s
                ON s.id = es.seat_id

             WHERE b.event_id = $1

             ORDER BY b.created_at DESC, es.id`,
            [eventId]
        );

        return res.status(200).json({
            success: true,
            data: {
                event: eventResult.rows[0],
                bookings: result.rows.map(row => ({
                    booking_id: row.booking_id,
                    booking_reference: row.booking_reference,
                    booking_status: row.booking_status,
                    total_amount: row.total_amount,
                    created_at: row.created_at,
                    cancelled_at: row.cancelled_at,

                    customer: {
                        id: row.customer_id,
                        name: row.customer_name,
                        email: row.customer_email
                    },

                    seat: {
                        eventSeatId: row.event_seat_id,
                        seat: `${row.row_label}${row.seat_number}`,
                        category: row.category,
                        price: Number(row.seat_price)
                    }
                }))
            }
        });

    } catch (error) {
        console.error("Get event bookings error:", error);

        return res.status(500).json({
            success: false,
            code: "EVENT_BOOKINGS_FETCH_FAILED",
            message: "Unable to retrieve event bookings right now."
        });
    }
};


module.exports = {
    holdSeats,
    confirmBooking,
    getMyBookings,
    getBookingById,
    getEventBookings,
    cancelBooking
};