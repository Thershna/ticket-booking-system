import { useLocation, useNavigate } from "react-router-dom";

function BookingSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    const booking = location.state?.booking;

    if (!booking) {
        return (
            <div className="booking-success-page">
                <div className="success-card">
                    <h1>Booking not found</h1>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("/events")
                        }
                    >
                        Browse events
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-success-page">

            <div className="success-card">

                <div className="success-icon">
                    ✓
                </div>

                <p className="eyebrow">
                    BOOKING CONFIRMED
                </p>

                <h1>
                    You're all set.
                </h1>

                <p className="success-text">
                    Your tickets have been booked
                    successfully.
                </p>

                <div className="booking-reference">
                    <span>
                        BOOKING REFERENCE
                    </span>

                    <strong>
                        {booking.bookingReference}
                    </strong>
                </div>

                <div className="success-details">

                    <div>
                        <span>EVENT</span>
                        <strong>
                            {booking.eventTitle ||
                                `Event #${booking.eventId}`}
                        </strong>
                    </div>

                    <div>
                        <span>SEAT</span>
                        <strong>
                            {booking.seats
                                ?.map(
                                    (seat) =>
                                        seat.seat
                                )
                                .join(", ")}
                        </strong>
                    </div>

                    <div>
                        <span>TOTAL</span>
                        <strong>
                            ₹{booking.totalAmount}
                        </strong>
                    </div>

                </div>

                <button
                    className="primary-button"
                    onClick={() =>
                        navigate("/bookings")
                    }
                >
                    View my bookings
                </button>

                <button
                    className="success-secondary-button"
                    onClick={() =>
                        navigate("/events")
                    }
                >
                    Browse more events
                </button>

            </div>

        </div>
    );
}

export default BookingSuccess;