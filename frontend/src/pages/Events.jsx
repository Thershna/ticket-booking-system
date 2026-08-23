import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    getEvents
} from "../services/api";


function Events() {

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

                const response =
                    await getEvents();

                if (cancelled) {
                    return;
                }

                setEvents(
                    response.data || []
                );

            } catch (err) {

                if (cancelled) {
                    return;
                }

                console.error(
                    "Events loading error:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to fetch events."
                );

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


    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };


    return (

        <div className="events-page">


            {/* NAVBAR */}

            <nav className="navbar">

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
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>

                </div>

            </nav>


            {/* HERO */}

            <section className="events-hero">

                <div>

                    <p className="eyebrow">
                        FIND YOUR NEXT EXPERIENCE
                    </p>


                    <h1>
                        Something worth
                        <br />
                        looking forward to.
                    </h1>


                    <p className="hero-description">
                        Discover movies, shows, events and
                        experiences happening around you.
                    </p>

                </div>

            </section>


            {/* EVENTS */}

            <main className="events-content">

                <div className="section-heading">

                    <div>

                        <p className="eyebrow">
                            EXPLORE
                        </p>

                        <h2>
                            Upcoming events
                        </h2>

                    </div>


                    <span className="event-count">
                        {events.length} events
                    </span>

                </div>


                {loading && (
                    <div className="loading-state">
                        Loading events...
                    </div>
                )}


                {/* Only show error when we have
                    no events to display */}

                {!loading &&
                    error &&
                    events.length === 0 && (

                        <div className="error-message">

                            {error}

                            <button
                                className="retry-button"
                                onClick={() =>
                                    window.location.reload()
                                }
                            >
                                Retry
                            </button>

                        </div>
                    )}


                {!loading &&
                    !error &&
                    events.length === 0 && (

                        <div className="empty-state">

                            <h3>
                                No events available
                            </h3>

                            <p>
                                Check back later for
                                new experiences.
                            </p>

                        </div>
                    )}


                {events.length > 0 && (

                    <div className="events-grid">

                        {events.map((event) => (

                            <article
                                className="event-card"
                                key={event.id}
                                onClick={() =>
                                    navigate(
                                        `/events/${event.id}`
                                    )
                                }
                            >

                                <div className="event-card-top">

                                    <span className="event-type">
                                        {event.event_type}
                                    </span>


                                    <span
                                        className={
                                            event.status ===
                                            "OPEN_FOR_BOOKING"
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


                                <div className="event-card-body">

                                    <h3>
                                        {event.title}
                                    </h3>

                                    <p>
                                        {event.description}
                                    </p>

                                </div>


                                <div className="event-card-footer">

                                    <div>

                                        <span>
                                            DATE
                                        </span>

                                        <strong>
                                            {new Date(
                                                event.start_time
                                            ).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                }
                                            )}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            TIME
                                        </span>

                                        <strong>
                                            {new Date(
                                                event.start_time
                                            ).toLocaleTimeString(
                                                "en-IN",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }
                                            )}
                                        </strong>

                                    </div>


                                    <div className="event-arrow">
                                        →
                                    </div>

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </main>

        </div>
    );
}


export default Events;