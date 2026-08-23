import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBookingById } from "../services/api";

function BookingDetails() {
    const navigate = useNavigate();
    const { bookingId } = useParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadBooking = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getBookingById(bookingId);

                if (!cancelled) {
                    setBooking(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Unable to load booking."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadBooking();

        return () => {
            cancelled = true;
        };
    }, [bookingId]);

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

    if (loading) {
        return (
            <div className="ticket-page">
                <div className="ticket-loading">
                    Loading your ticket...
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="ticket-page">
                <div className="ticket-error">
                    <h2>
                        Unable to load ticket
                    </h2>

                    <p>
                        {error ||
                            "Booking could not be found."}
                    </p>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("/bookings")
                        }
                    >
                        Back to bookings
                    </button>
                </div>
            </div>
        );
    }

    const status =
        booking.booking_status ||
        booking.status;

    const seat =
        booking.seat ||
        booking.seats
            ?.map((seat) => seat.seat)
            .join(", ") ||
        "—";

    return (
        <div className="ticket-page">

            {/* NAVBAR */}

            <nav className="navbar no-print">

                <div
                    className="navbar-brand"
                    onClick={() =>
                        navigate("/events")
                    }
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
                        onClick={() =>
                            navigate("/bookings")
                        }
                    >
                        My bookings
                    </button>

                    <button
                        className="logout-button"
                        onClick={() => {
                            localStorage.removeItem(
                                "token"
                            );

                            localStorage.removeItem(
                                "user"
                            );

                            navigate("/login");
                        }}
                    >
                        Sign out
                    </button>

                </div>

            </nav>


            {/* TICKET */}

            <main className="ticket-content">

                <div className="ticket-card">

                    {/* TOP */}

                    <div className="ticket-top">

                        <div className="ticket-brand">
                            <div className="ticket-logo">
                                TB
                            </div>

                            <span>
                                TICKET BOOKING
                            </span>
                        </div>

                        <div
                            className={
                                status === "CONFIRMED"
                                    ? "ticket-status confirmed"
                                    : "ticket-status cancelled"
                            }
                        >
                            {status}
                        </div>

                    </div>


                    {/* EVENT */}

                    <div className="ticket-event-section">

                        <p className="eyebrow">
                            YOUR TICKET
                        </p>

                        <h1>
                            {booking.event_title}
                        </h1>

                        <p className="ticket-venue">
                            {booking.venue_name}
                            {" · "}
                            {booking.venue_location}
                        </p>

                    </div>


                    {/* PERFORATED LINE */}

                    <div className="ticket-divider">
                        <span></span>
                    </div>


                    {/* DETAILS */}

                    <div className="ticket-info-grid">

                        <div className="ticket-info-item">
                            <span>
                                DATE
                            </span>

                            <strong>
                                {formatDate(
                                    booking.start_time
                                )}
                            </strong>
                        </div>


                        <div className="ticket-info-item">
                            <span>
                                TIME
                            </span>

                            <strong>
                                {formatTime(
                                    booking.start_time
                                )}
                            </strong>
                        </div>


                        <div className="ticket-info-item">
                            <span>
                                SEAT
                            </span>

                            <strong className="seat-highlight">
                                {seat}
                            </strong>
                        </div>


                        <div className="ticket-info-item">
                            <span>
                                TOTAL
                            </span>

                            <strong>
                                ₹{booking.total_amount}
                            </strong>
                        </div>

                    </div>


                    {/* REFERENCE */}

                    <div className="ticket-reference-box">

                        <span>
                            BOOKING REFERENCE
                        </span>

                        <strong>
                            {booking.booking_reference}
                        </strong>

                    </div>


                    {/* SIMPLE TICKET CODE */}

                    <div className="ticket-code-area">

                        <div className="ticket-code">

                            {Array.from(
                                { length: 28 },
                                (_, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            height:
                                                index % 3 === 0
                                                    ? "34px"
                                                    : index % 2 === 0
                                                        ? "25px"
                                                        : "30px"
                                        }}
                                    />
                                )
                            )}

                        </div>

                        <small>
                            {booking.booking_reference}
                        </small>

                    </div>


                    {/* ACTIONS */}

                    <div className="ticket-actions no-print">

                        <button
                            className="ticket-download-button"
                            onClick={() =>
                                window.print()
                            }
                        >
                            ↓&nbsp; Download ticket
                        </button>

                        <button
                            className="ticket-back-button"
                            onClick={() =>
                                navigate("/bookings")
                            }
                        >
                            Back to bookings
                        </button>

                    </div>


                    <p className="ticket-footer">
                        Please present this ticket at the
                        venue entrance.
                    </p>

                </div>

            </main>

        </div>
    );
}

export default BookingDetails;