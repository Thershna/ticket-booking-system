import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent } from "../services/api";

function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadEvent = async () => {
            try {
                const response = await getEvent(id);
                setEvent(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [id]);

    if (loading) {
        return (
            <div className="event-details-state">
                <p>Loading event...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="event-details-state">
                <div className="error-message">
                    {error || "Event not found."}
                </div>

                <button
                    className="secondary-button"
                    onClick={() => navigate("/events")}
                >
                    ← Back to events
                </button>
            </div>
        );
    }

    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    const date = startDate.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    const startTime = startDate.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    const endTime = endDate.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    const isBookable =
        event.status === "OPEN_FOR_BOOKING";

    return (
        <div className="event-details-page">

            {/* NAVBAR */}

            <nav className="navbar">

                <div
                    className="navbar-brand"
                    onClick={() => navigate("/events")}
                >
                    <div className="navbar-logo">
                        TB
                    </div>

                    <span>Ticket Booking</span>
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
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            navigate("/login");
                        }}
                    >
                        Sign out
                    </button>

                </div>

            </nav>


            {/* EVENT HEADER */}

            <main className="event-details-content">

                <button
                    className="back-button"
                    onClick={() => navigate("/events")}
                >
                    ← Back to events
                </button>


                <section className="event-details-card">

                    <div className="event-details-top">

                        <span className="event-type">
                            {event.event_type}
                        </span>

                        <span
                            className={
                                isBookable
                                    ? "status-open"
                                    : "status-other"
                            }
                        >
                            {event.status.replaceAll(
                                "_",
                                " "
                            )}
                        </span>

                    </div>


                    <div className="event-details-main">

                        <p className="eyebrow">
                            EVENT
                        </p>

                        <h1>
                            {event.title}
                        </h1>

                        <p className="event-description">
                            {event.description}
                        </p>

                    </div>


                    <div className="event-info-grid">

                        <div className="event-info-item">
                            <span>DATE</span>
                            <strong>{date}</strong>
                        </div>

                        <div className="event-info-item">
                            <span>TIME</span>
                            <strong>
                                {startTime} – {endTime}
                            </strong>
                        </div>

                        <div className="event-info-item">
                            <span>VENUE</span>
                            <strong>
                                {event.venue_name}
                            </strong>

                            <small>
                                {event.venue_location}
                            </small>
                        </div>

                    </div>


                    <div className="event-details-action">

                        {isBookable ? (
                            <>
                                <div>
                                    <span>
                                        READY TO BOOK?
                                    </span>

                                    <p>
                                        Choose your seats
                                        for this event.
                                    </p>
                                </div>

                                <button
                                    className="primary-button event-book-button"
                                    onClick={() =>
                                        navigate(
                                            `/events/${event.id}/seats`
                                        )
                                    }
                                >
                                    Choose seats →
                                </button>
                            </>
                        ) : (
                            <div className="event-not-bookable">
                                <strong>
                                    Booking is currently
                                    unavailable
                                </strong>

                                <p>
                                    This event is not open
                                    for booking.
                                </p>
                            </div>
                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}

export default EventDetails;