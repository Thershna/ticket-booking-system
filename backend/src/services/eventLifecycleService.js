const pool = require("../config/database");

const updateEventLifecycle = async (eventId) => {
    const result = await pool.query(
        `SELECT
            id,
            start_time,
            end_time,
            status
         FROM events
         WHERE id = $1`,
        [eventId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const event = result.rows[0];

    // Cancelled events must remain cancelled.
    if (event.status === "CANCELLED") {
        return event;
    }

    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    let newStatus = event.status;

    if (now >= endTime) {
        newStatus = "COMPLETED";
    } else if (now >= startTime) {
        newStatus = "ONGOING";
    }

    if (newStatus !== event.status) {
        const updated = await pool.query(
            `UPDATE events
             SET status = $1
             WHERE id = $2
             RETURNING
                id,
                start_time,
                end_time,
                status`,
            [newStatus, eventId]
        );

        return updated.rows[0];
    }

    return event;
};

module.exports = {
    updateEventLifecycle
};