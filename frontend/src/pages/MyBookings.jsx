import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getMyBookings,
    cancelBooking
} from "../services/api";

function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadBookings = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getMyBookings();

                if (!cancelled) {
                    setBookings(response.data || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBookings();

        return () => {
            cancelled = true;
        };
    }, []);

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });

    const handleCancelBooking = async (bookingId) => {
        try {
            setCancellingId(bookingId);
            setError("");

            await cancelBooking(bookingId);

            const response = await getMyBookings();

            setBookings(response.data || []);

        } catch (err) {
            setError(
                err.message ||
                "Unable to cancel booking."
            );
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="bookings-page">

            {/* NAVBAR */}

            <nav className="navbar">

                <div
                    className="navbar-brand"
                    onClick={() => navigate("/events")}
                >
                    <div className="navbar-logo">
                        TB
                    </div>

                    <span>
                        Ticket Booking
                    </span>
                </div>

                <div className="navbar-actions">

                    <button
                        className="nav-link"
                        onClick={() => navigate("/events")}
                    >
                        Browse events
                    </button>

                    <button
                        className="logout-button"
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            navigate("/login");
                        }}
                    >
                        Sign out
                    </button>

                </div>

            </nav>


            {/* MAIN CONTENT */}

            <main className="bookings-content">

                <div className="bookings-heading">

                    <p className="eyebrow">
                        YOUR TICKETS
                    </p>

                    <h1>
                        My bookings
                    </h1>

                    <p>
                        Keep track of your upcoming
                        experiences and past bookings.
                    </p>

                </div>


                {/* LOADING */}

                {loading && (
                    <div className="loading-state">
                        Loading your bookings...
                    </div>
                )}


                {/* ERROR */}

                {!loading && error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                {/* EMPTY */}

                {!loading &&
                    !error &&
                    bookings.length === 0 && (

                        <div className="empty-bookings">

                            <div className="empty-bookings-icon">
                                TB
                            </div>

                            <h2>
                                No bookings yet
                            </h2>

                            <p>
                                Your tickets will appear
                                here after you book an event.
                            </p>

                            <button
                                className="primary-button"
                                onClick={() =>
                                    navigate("/events")
                                }
                            >
                                Explore events →
                            </button>

                        </div>
                    )}


                {/* BOOKINGS */}

                {!loading &&
                    !error &&
                    bookings.length > 0 && (

                        <div className="bookings-list">

                            {bookings.map((booking) => (

                                <article
                                    className="booking-card"
                                    key={booking.id}
                                    onClick={() =>
                                          navigate(`/bookings/${booking.id}`)
                                    }
                                 >

                                    <div className="booking-card-main">

                                        <div className="booking-card-header">

                                            <span className="event-type">
                                                {booking.event_type}
                                            </span>

                                            <span
                                                className={
                                                    (
                                                        booking.booking_status ||
                                                        booking.status
                                                    ) === "CONFIRMED"
                                                        ? "booking-status-confirmed"
                                                        : "booking-status-cancelled"
                                                }
                                            >
                                                {
                                                    booking.booking_status ||
                                                    booking.status
                                                }
                                            </span>

                                        </div>


                                        <h2>
                                            {booking.event_title}
                                        </h2>


                                        <div className="booking-meta">

                                            <div>
                                                <span>
                                                    DATE
                                                </span>

                                                <strong>
                                                    {formatDate(
                                                        booking.start_time
                                                    )}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    TIME
                                                </span>

                                                <strong>
                                                    {formatTime(
                                                        booking.start_time
                                                    )}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    VENUE
                                                </span>

                                                <strong>
                                                    {booking.venue_name}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>


                                    {/* RIGHT SIDE */}

                                    <div className="booking-card-side">

                                        <div>
                                            <span>
                                                SEAT
                                            </span>

                                            <strong>
                                                {booking.seat ||
                                                    booking.seats
                                                        ?.map(
                                                            (seat) =>
                                                                seat.seat
                                                        )
                                                        .join(", ") ||
                                                    "—"}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                TOTAL
                                            </span>

                                            <strong>
                                                ₹
                                                {booking.total_amount}
                                            </strong>
                                        </div>


                                        <div>
                                            <span>
                                                REFERENCE
                                            </span>

                                            <strong className="reference">
                                                {booking.booking_reference}
                                            </strong>
                                        </div>


                                        {/* CANCEL BUTTON */}

                                        {(
                                            booking.booking_status ||
                                            booking.status
                                        ) === "CONFIRMED" && (

                                            <button
                                                className="cancel-booking-button"
                                                disabled={
                                                    cancellingId ===
                                                    booking.id
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBookingToCancel(booking);
                                                }}
                                            
                                            >
                                                {cancellingId ===
                                                booking.id
                                                    ? "Cancelling..."
                                                    : "Cancel booking"}
                                            </button>

                                        )}

                                    </div>

                                </article>

                            ))}

                        </div>
                    )}

            </main>


            {/* =====================================
                CANCEL CONFIRMATION MODAL
            ===================================== */}

            {bookingToCancel && (

                <div
                    className="modal-overlay"
                    onClick={() =>
                        setBookingToCancel(null)
                    }
                >

                    <div
                        className="cancel-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-icon">
                            !
                        </div>


                        <p className="eyebrow">
                            CANCEL BOOKING
                        </p>


                        <h2>
                            Are you sure?
                        </h2>


                        <p className="modal-description">
                            You're about to cancel your
                            booking for{" "}

                            <strong>
                                {bookingToCancel.event_title}
                            </strong>.
                        </p>


                        <p className="modal-note">
                            This action cannot be undone.
                        </p>


                        <div className="modal-actions">

                            <button
                                className="modal-back-button"
                                onClick={() =>
                                    setBookingToCancel(null)
                                }
                            >
                                Keep booking
                            </button>


                            <button
                                className="modal-confirm-button"
                                onClick={async (e) => {
                                    e.stopPropagation();

                                    const id = bookingToCancel.id;

                                    setBookingToCancel(null);

                                    await handleCancelBooking(id);
                                }}
                            >
                                Yes, cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default MyBookings;