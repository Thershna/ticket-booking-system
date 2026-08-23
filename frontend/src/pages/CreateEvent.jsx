import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent, getVenues } from "../services/api";

function CreateEvent() {
    const navigate = useNavigate();

    const [venues, setVenues] = useState([]);
    const [loadingVenues, setLoadingVenues] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "",
        description: "",
        eventType: "MOVIE",
        venueId: "",
        startTime: "",
        endTime: ""
    });

    useEffect(() => {
        const loadVenues = async () => {
            try {
                const response = await getVenues();
                setVenues(response.data || []);
            } catch (err) {
                setError(
                    err.message ||
                    "Unable to load venues."
                );
            } finally {
                setLoadingVenues(false);
            }
        };

        loadVenues();
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (
            !form.title ||
            !form.venueId ||
            !form.startTime ||
            !form.endTime
        ) {
            setError(
                "Please fill in all required fields."
            );
            return;
        }

        if (
            new Date(form.endTime) <=
            new Date(form.startTime)
        ) {
            setError(
                "End time must be after start time."
            );
            return;
        }

        try {
            setSubmitting(true);

            const response = await createEvent({
                title: form.title,
                description: form.description,
                eventType: form.eventType,
                venueId: Number(form.venueId),
                startTime: new Date(
                    form.startTime
                ).toISOString(),
                endTime: new Date(
                    form.endTime
                ).toISOString()
            });

            navigate("/organiser/dashboard", {
                state: {
                    message:
                        response.message ||
                        "Event created successfully."
                }
            });

        } catch (err) {
            setError(
                err.message ||
                "Unable to create event."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="organiser-page">

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


            <main className="create-event-content">

                <button
                    className="back-link"
                    onClick={() =>
                        navigate("/organiser/dashboard")
                    }
                >
                    ← Back to dashboard
                </button>


                <div className="create-event-header">

                    <p className="eyebrow">
                        EVENT MANAGEMENT
                    </p>

                    <h1>
                        Create a new event.
                    </h1>

                    <p>
                        Add the details of your event
                        before configuring its seats.
                    </p>

                </div>


                <form
                    className="create-event-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-section">

                        <p className="form-section-title">
                            EVENT DETAILS
                        </p>


                        <label>
                            Event title
                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. The Last Horizon"
                            />
                        </label>


                        <label>
                            Description
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Tell customers about your event..."
                                rows="4"
                            />
                        </label>


                        <label>
                            Event type

                            <select
                                name="eventType"
                                value={form.eventType}
                                onChange={handleChange}
                            >
                                <option value="MOVIE">
                                    Movie
                                </option>

                                <option value="CONCERT">
                                    Concert
                                </option>

                                <option value="SPORT">
                                    Sport
                                </option>

                                <option value="THEATRE">
                                    Theatre
                                </option>

                                <option value="OTHER">
                                    Other
                                </option>
                            </select>

                        </label>

                    </div>


                    <div className="form-section">

                        <p className="form-section-title">
                            VENUE & SCHEDULE
                        </p>


                        <label>
                            Venue

                            <select
                                name="venueId"
                                value={form.venueId}
                                onChange={handleChange}
                                disabled={loadingVenues}
                            >
                                <option value="">
                                    {loadingVenues
                                        ? "Loading venues..."
                                        : "Select a venue"}
                                </option>

                                {venues.map(
                                    (venue) => (
                                        <option
                                            key={venue.id}
                                            value={venue.id}
                                        >
                                            {venue.name}
                                            {venue.location
                                                ? ` — ${venue.location}`
                                                : ""}
                                        </option>
                                    )
                                )}

                            </select>

                        </label>


                        <div className="form-row">

                            <label>
                                Start date & time

                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                />
                            </label>


                            <label>
                                End date & time

                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={form.endTime}
                                    onChange={handleChange}
                                />
                            </label>

                        </div>

                    </div>


                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}


                    <div className="form-actions">

                        <button
                            type="button"
                            className="ticket-back-button"
                            onClick={() =>
                                navigate(
                                    "/organiser/dashboard"
                                )
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="create-event-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Creating..."
                                : "Create event"}
                        </button>

                    </div>

                </form>

            </main>

        </div>
    );
}

export default CreateEvent;