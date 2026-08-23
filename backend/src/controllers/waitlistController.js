const pool = require("../config/database");

const joinWaitlist = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { category } = req.body;
        const userId = req.user.id;

        if (!category || !["STANDARD", "PREMIUM"].includes(category)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_CATEGORY",
                message: "Category must be STANDARD or PREMIUM."
            });
        }

        // Check event
        const eventResult = await pool.query(
            `SELECT id, title, status
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

        if (event.status !== "OPEN_FOR_BOOKING") {
            return res.status(409).json({
                success: false,
                code: "WAITLIST_NOT_AVAILABLE",
                message: "Waitlist is available only for events open for booking."
            });
        }

        // Check whether seats of this category are actually unavailable
        const seatResult = await pool.query(
            `SELECT COUNT(*) AS available_count
             FROM event_seats
             WHERE event_id = $1
             AND category = $2
             AND status = 'AVAILABLE'`,
            [eventId, category]
        );

        const availableCount = Number(seatResult.rows[0].available_count);

        if (availableCount > 0) {
            return res.status(409).json({
                success: false,
                code: "SEATS_AVAILABLE",
                message: `Seats are currently available in the ${category} category.`
            });
        }

        // Check active waitlist entry
        const existingResult = await pool.query(
            `SELECT id, status
             FROM waitlists
             WHERE event_id = $1
             AND user_id = $2
             AND category = $3
             AND status IN ('WAITING', 'OFFERED')`,
            [eventId, userId, category]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: "ALREADY_ON_WAITLIST",
                message: "You are already on the waitlist for this category."
            });
        }

        const result = await pool.query(
            `INSERT INTO waitlists (
                event_id,
                user_id,
                category,
                status
             )
             VALUES ($1, $2, $3, 'WAITING')
             RETURNING
                id,
                event_id,
                user_id,
                category,
                joined_at,
                status`,
            [eventId, userId, category]
        );
        const positionResult = await pool.query(
            `SELECT COUNT(*) AS position
             FROM waitlists
             WHERE event_id = $1
             AND category = $2
             AND status IN ('WAITING', 'OFFERED')
             AND joined_at <= $3`,
            [
                 eventId,
                 category,
                 result.rows[0].joined_at
            ]
         );

         const position =
             Number(positionResult.rows[0].position);

        return res.status(201).json({
             success: true,
             message: "Joined waitlist successfully.",
             data: {
                 ...result.rows[0],
                 position
             }
        });

    } catch (error) {
        console.error("Join waitlist error:", error);

        return res.status(500).json({
            success: false,
            code: "WAITLIST_JOIN_FAILED",
            message: "Unable to join the waitlist right now."
        });
    }
};

const acceptOffer = async (req, res) => {
    const client = await pool.connect();

    try {
        const { offerId } = req.params;
        const userId = req.user.id;

        if (!/^\d+$/.test(offerId)) {
            return res.status(400).json({
                success: false,
                code: "INVALID_OFFER_ID",
                message: "The offer ID is invalid."
            });
        }

        await client.query("BEGIN");

        // Get the offer and lock it
        const offerResult = await client.query(
            `SELECT
                wo.id,
                wo.waitlist_id,
                wo.event_seat_id,
                wo.offered_at,
                wo.expires_at,
                wo.status AS offer_status,
                w.user_id,
                w.event_id,
                w.category,
                w.status AS waitlist_status,
                es.status AS seat_status,
                es.price,
                e.title AS event_title,
                e.start_time,
                e.status AS event_status
             FROM waitlist_offers wo
             JOIN waitlists w ON w.id = wo.waitlist_id
             JOIN event_seats es ON es.id = wo.event_seat_id
             JOIN events e ON e.id = w.event_id
             WHERE wo.id = $1
             FOR UPDATE`,
            [offerId]
        );

        if (offerResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                code: "OFFER_NOT_FOUND",
                message: "The requested waitlist offer does not exist."
            });
        }

        const offer = offerResult.rows[0];

        // Only the customer who received the offer can accept it
        if (String(offer.user_id) !== String(userId)) {
            await client.query("ROLLBACK");

            return res.status(403).json({
                success: false,
                code: "OFFER_ACCESS_DENIED",
                message: "You can only accept your own waitlist offer."
            });
        }

        // Offer must still be pending
        if (offer.offer_status !== "PENDING") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "OFFER_NOT_PENDING",
                message: "This waitlist offer is no longer pending."
            });
        }

        // Check expiry
        if (new Date() >= new Date(offer.expires_at)) {
            await client.query(
                `UPDATE waitlist_offers
                 SET status = 'EXPIRED'
                 WHERE id = $1`,
                [offerId]
            );

            await client.query(
                `UPDATE waitlists
                 SET status = 'EXPIRED'
                 WHERE id = $1`,
                [offer.waitlist_id]
            );

            await client.query("COMMIT");

            return res.status(409).json({
                success: false,
                code: "OFFER_EXPIRED",
                message: "This waitlist offer has expired."
            });
        }

        // Event must still allow booking
        if (offer.event_status !== "OPEN_FOR_BOOKING") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "EVENT_NOT_BOOKABLE",
                message: "This event is no longer open for booking."
            });
        }

        // Seat must still be available
        if (offer.seat_status !== "AVAILABLE") {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                code: "SEAT_NOT_AVAILABLE",
                message: "The offered seat is no longer available."
            });
        }

        // Create booking reference
        const bookingReference =
            `TBS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Create booking
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
                event_id,
                total_amount,
                status,
                created_at`,
            [
                bookingReference,
                userId,
                offer.event_id,
                offer.price
            ]
        );

        const booking = bookingResult.rows[0];

        // Attach the offered seat to the booking
        await client.query(
            `INSERT INTO booking_seats (
                booking_id,
                event_seat_id,
                price
             )
             VALUES ($1, $2, $3)`,
            [
                booking.id,
                offer.event_seat_id,
                offer.price
            ]
        );

        // Mark seat as booked
        await client.query(
            `UPDATE event_seats
             SET
                status = 'BOOKED',
                held_by = NULL,
                hold_expires_at = NULL,
                updated_at = NOW()
             WHERE id = $1`,
            [offer.event_seat_id]
        );

        // Mark offer accepted
        await client.query(
            `UPDATE waitlist_offers
             SET status = 'ACCEPTED'
             WHERE id = $1`,
            [offerId]
        );

        // Mark waitlist entry fulfilled
        await client.query(
            `UPDATE waitlists
             SET status = 'FULFILLED'
             WHERE id = $1`,
            [offer.waitlist_id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Waitlist offer accepted successfully.",
            data: {
                bookingId: booking.id,
                bookingReference: booking.booking_reference,
                eventId: booking.event_id,
                eventTitle: offer.event_title,
                eventSeatId: offer.event_seat_id,
                price: offer.price,
                status: booking.status,
                createdAt: booking.created_at
            }
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Accept waitlist offer error:", error);

        return res.status(500).json({
            success: false,
            code: "OFFER_ACCEPT_FAILED",
            message: "Unable to accept the waitlist offer right now."
        });

    } finally {
        client.release();
    }
};

const getMyWaitlistOffers = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT
                wo.id AS offer_id,
                wo.event_seat_id,
                wo.offered_at,
                wo.expires_at,
                wo.status AS offer_status,

                w.id AS waitlist_id,
                w.category,
                w.status AS waitlist_status,

                e.id AS event_id,
                e.title AS event_title,
                e.start_time,
                e.end_time,

                es.price,
                s.row_label,
                s.seat_number

             FROM waitlist_offers wo
             JOIN waitlists w
                ON w.id = wo.waitlist_id
             JOIN events e
                ON e.id = w.event_id
             JOIN event_seats es
                ON es.id = wo.event_seat_id
             JOIN seats s
                ON s.id = es.seat_id

             WHERE w.user_id = $1
             AND wo.status = 'PENDING'
             AND wo.expires_at > NOW()

             ORDER BY wo.offered_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error(
            "Get waitlist offers error:",
            error
        );

        return res.status(500).json({
            success: false,
            code: "WAITLIST_OFFERS_FETCH_FAILED",
            message: "Unable to retrieve waitlist offers right now."
        });
    }
};

module.exports = {
    joinWaitlist,
    acceptOffer,
    getMyWaitlistOffers
};