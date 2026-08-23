import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getOrganiserEvents,
    openEvent
} from "../services/api";

function OrganiserDashboard() {
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadEvents = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getOrganiserEvents();

                if (!cancelled) {
                    setEvents(response.data || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Unable to load organiser dashboard."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadEvents();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalBookings = events.reduce(
        (sum, event) =>
            sum + Number(event.total_bookings || 0),
        0
    );

    const totalRevenue = events.reduce(
        (sum, event) =>
            sum + Number(event.revenue || 0),
        0
    );

    const upcomingEvents = events.filter(
        (event) =>
            event.status === "OPEN_FOR_BOOKING" ||
            event.status === "DRAFT"
    ).length;

    return (
        <div className="organiser-page">

            {/* NAVBAR */}

            <nav className="navbar">

                <div
                    className="navbar-brand"
                    onClick={() =>
                        navigate("/organiser/dashboard")
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

                    <span className="organiser-label">
                        Organiser
                    </span>

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


            <main className="organiser-content">

                {/* HEADER */}

                <section className="organiser-header">

                    <div>
                        <p className="eyebrow">
                            ORGANISER DASHBOARD
                        </p>

                        <h1>
                            Manage your events.
                        </h1>

                        <p>
                            Keep track of events,
                            bookings and revenue
                            in one place.
                        </p>
                    </div>

                    <button
                        className="create-event-button"
                        onClick={() =>
                            navigate("/organiser/events/create")
                        }
                    >
                        + Create event
                    </button>

                </section>


                {/* STATS */}

                <section className="dashboard-stats">

                    <div className="dashboard-stat-card">

                        <span>
                            TOTAL EVENTS
                        </span>

                        <strong>
                            {events.length}
                        </strong>

                    </div>


                    <div className="dashboard-stat-card">

                        <span>
                            UPCOMING EVENTS
                        </span>

                        <strong>
                            {upcomingEvents}
                        </strong>

                    </div>


                    <div className="dashboard-stat-card">

                        <span>
                            TOTAL BOOKINGS
                        </span>

                        <strong>
                            {totalBookings}
                        </strong>

                    </div>


                    <div className="dashboard-stat-card">

                        <span>
                            TOTAL REVENUE
                        </span>

                        <strong>
                            ₹{totalRevenue.toFixed(2)}
                        </strong>

                    </div>

                </section>


                {/* EVENTS */}

                <section className="organiser-events-section">

                    <div className="section-heading">

                        <div>
                            <p className="eyebrow">
                                EVENT MANAGEMENT
                            </p>

                            <h2>
                                Your events
                            </h2>
                        </div>

                        <span>
                            {events.length} events
                        </span>

                    </div>


                    {loading && (
                        <div className="dashboard-message">
                            Loading your events...
                        </div>
                    )}


                    {!loading && error && (
                        <div className="dashboard-error">
                            {error}
                        </div>
                    )}


                    {!loading &&
                        !error &&
                        events.length === 0 && (

                            <div className="dashboard-message">
                                You haven't created any
                                events yet.
                            </div>
                        )}


                    {!loading &&
                        !error &&
                        events.length > 0 && (

                            <div className="organiser-event-list">

                                {events.map((event) => (

                                    <article
                                        className="organiser-event-card"
                                        key={event.id}
                                    >

                                        <div className="event-card-main">

                                            <div className="event-card-top">

                                                <span className="event-type">
                                                    {event.event_type}
                                                </span>

                                                <span
                                                    className={`organiser-status ${event.status
                                                        .toLowerCase()
                                                        .replaceAll(
                                                            "_",
                                                            "-"
                                                        )}`}
                                                >
                                                    {event.status.replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>

                                            </div>


                                            <h3>
                                                {event.title}
                                            </h3>


                                            <p>
                                                {event.venue_name}
                                                {" · "}
                                                {event.venue_location}
                                            </p>

                                        </div>


                                        <div className="event-card-stats">

                                            <div>
                                                <span>
                                                    SEATS
                                                </span>

                                                <strong>
                                                    {event.total_seats}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    AVAILABLE
                                                </span>

                                                <strong>
                                                    {event.available_seats}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    BOOKED
                                                </span>

                                                <strong>
                                                    {event.booked_seats}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    BOOKINGS
                                                </span>

                                                <strong>
                                                    {event.total_bookings}
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    REVENUE
                                                </span>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        event.revenue || 0
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>

                                        </div>
                                        <div className="event-card-actions">

    <button
        className="create-event-button"
        onClick={() =>
            navigate(`/organiser/events/${event.id}/seats`)
        }
    >
        Manage Seats
    </button>

    {event.status === "DRAFT" &&
        Number(event.total_seats) > 0 && (
            <button
                className="create-event-button"
                onClick={async () => {
                    try {
                        await openEvent(event.id);

                        window.location.reload();

                    } catch (error) {
                        setError(
                            error.message ||
                            "Unable to open event."
                        );
                    }
                }}
            >
                Open for booking
            </button>
        )}

</div>

                                    </article>

                                ))}

                            </div>
                        )}

                </section>

            </main>

        </div>
    );
}

export default OrganiserDashboard;