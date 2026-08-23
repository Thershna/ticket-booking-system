const createWaitlistOffer = async (client, eventSeatId) => {
    // Lock the event seat so two requests cannot create offers for it
    const seatResult = await client.query(
        `SELECT
            es.id,
            es.event_id,
            es.category,
            es.status
         FROM event_seats es
         WHERE es.id = $1
         FOR UPDATE`,
        [eventSeatId]
    );

    if (seatResult.rows.length === 0) {
        return null;
    }

    const eventSeat = seatResult.rows[0];

    // Only create an offer for an available seat
    if (eventSeat.status !== "AVAILABLE") {
        return null;
    }

    // Find the first waiting customer
    const waitlistResult = await client.query(
        `SELECT
            id,
            event_id,
            user_id,
            category,
            joined_at
         FROM waitlists
         WHERE event_id = $1
         AND category = $2
         AND status = 'WAITING'
         ORDER BY joined_at ASC, id ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [
            eventSeat.event_id,
            eventSeat.category
        ]
    );

    if (waitlistResult.rows.length === 0) {
        return null;
    }

    const waitlist = waitlistResult.rows[0];

    // Create a 10-minute offer
    const offerResult = await client.query(
        `INSERT INTO waitlist_offers (
            waitlist_id,
            event_seat_id,
            expires_at
         )
         VALUES (
            $1,
            $2,
            NOW() + INTERVAL '10 minutes'
         )
         RETURNING
            id,
            waitlist_id,
            event_seat_id,
            offered_at,
            expires_at,
            status`,
        [
            waitlist.id,
            eventSeat.id
        ]
    );

    // Mark the waitlist entry as OFFERED
    await client.query(
        `UPDATE waitlists
         SET status = 'OFFERED'
         WHERE id = $1`,
        [waitlist.id]
    );

    return {
        offer: offerResult.rows[0],
        waitlist
    };
};

module.exports = {
    createWaitlistOffer
};