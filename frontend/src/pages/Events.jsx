import {
    useEffect,
    useMemo,
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

    // Filters
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedType, setSelectedType] = useState("ALL");


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


    // Get unique event types
    const eventTypes = useMemo(() => {

        const types = events
            .map(event => event.event_type)
            .filter(Boolean);

        return [...new Set(types)];

    }, [events]);


    // Apply filters
    const filteredEvents = useMemo(() => {

        return events.filter((event) => {

            // Search by title
            const matchesSearch =
                event.title
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase().trim()
                    );

            // Compare date
            const eventDate = new Date(
                event.start_time
            );

            const eventDateString =
                `${eventDate.getFullYear()}-${String(
                    eventDate.getMonth() + 1
                ).padStart(2, "0")}-${String(
                    eventDate.getDate()
                ).padStart(2, "0")}`;

            const matchesDate =
                !selectedDate ||
                eventDateString === selectedDate;


            // Event type
            const matchesType =
                selectedType === "ALL" ||
                event.event_type === selectedType;


            return (
                matchesSearch &&
                matchesDate &&
                matchesType
            );

        });

    }, [
        events,
        search,
        selectedDate,
        selectedType
    ]);


    const clearFilters = () => {

        setSearch("");
        setSelectedDate("");
        setSelectedType("ALL");

    };


    const hasActiveFilters =
        search ||
        selectedDate ||
        selectedType !== "ALL";


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
                        {filteredEvents.length}{" "}
                        {filteredEvents.length === 1
                            ? "event"
                            : "events"}
                    </span>

                </div>


                {/* FILTERS */}

                {!loading && events.length > 0 && (

                    <div
                        className="event-filters"
                        style={{
                            marginBottom: "35px",
                            padding: "20px",
                            border: "1px solid #e5e1dc",
                            borderRadius: "14px",
                            background: "#fff"
                        }}
                    >

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "2fr 1fr 1fr auto",
                                gap: "14px",
                                alignItems: "end"
                            }}
                        >

                            {/* SEARCH */}

                            <div>

                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "11px",
                                        letterSpacing: "1.5px",
                                        marginBottom: "8px",
                                        color: "#6d8178",
                                        fontWeight: "600"
                                    }}
                                >
                                    SEARCH EVENTS
                                </label>

                                <input
                                    type="text"
                                    placeholder="Search by event name..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "12px 14px",
                                        border: "1px solid #ddd",
                                        borderRadius: "9px",
                                        fontSize: "14px",
                                        outline: "none"
                                    }}
                                />

                            </div>


                            {/* DATE */}

                            <div>

                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "11px",
                                        letterSpacing: "1.5px",
                                        marginBottom: "8px",
                                        color: "#6d8178",
                                        fontWeight: "600"
                                    }}
                                >
                                    DATE
                                </label>

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "12px 14px",
                                        border: "1px solid #ddd",
                                        borderRadius: "9px",
                                        fontSize: "14px",
                                        outline: "none"
                                    }}
                                />

                            </div>


                            {/* TYPE */}

                            <div>

                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "11px",
                                        letterSpacing: "1.5px",
                                        marginBottom: "8px",
                                        color: "#6d8178",
                                        fontWeight: "600"
                                    }}
                                >
                                    CATEGORY
                                </label>

                                <select
                                    value={selectedType}
                                    onChange={(e) =>
                                        setSelectedType(
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "12px 14px",
                                        border: "1px solid #ddd",
                                        borderRadius: "9px",
                                        fontSize: "14px",
                                        background: "white",
                                        outline: "none"
                                    }}
                                >

                                    <option value="ALL">
                                        All categories
                                    </option>

                                    {eventTypes.map(
                                        (type) => (
                                            <option
                                                key={type}
                                                value={type}
                                            >
                                                {type}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>


                            {/* CLEAR */}

                            <button
                                onClick={clearFilters}
                                disabled={
                                    !hasActiveFilters
                                }
                                style={{
                                    padding: "12px 18px",
                                    border: "1px solid #d8d8d8",
                                    borderRadius: "9px",
                                    background:
                                        hasActiveFilters
                                            ? "#5d806f"
                                            : "#f3f3f3",
                                    color:
                                        hasActiveFilters
                                            ? "white"
                                            : "#999",
                                    cursor:
                                        hasActiveFilters
                                            ? "pointer"
                                            : "default",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                Clear filters
                            </button>

                        </div>

                    </div>

                )}


                {loading && (
                    <div className="loading-state">
                        Loading events...
                    </div>
                )}


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


                {/* NO FILTER RESULTS */}

                {!loading &&
                    events.length > 0 &&
                    filteredEvents.length === 0 && (

                        <div className="empty-state">

                            <h3>
                                No matching events
                            </h3>

                            <p>
                                Try changing your search
                                or filters.
                            </p>

                            <button
                                className="primary-button"
                                onClick={clearFilters}
                            >
                                Clear filters
                            </button>

                        </div>

                    )}


                {/* FILTERED EVENTS */}

                {!loading &&
                    filteredEvents.length > 0 && (

                    <div className="events-grid">

                        {filteredEvents.map((event) => (

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