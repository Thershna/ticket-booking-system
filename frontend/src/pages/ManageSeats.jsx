import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateEventSeats } from "../services/api";

function ManageSeats() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [standardPrice, setStandardPrice] = useState("200");
    const [premiumPrice, setPremiumPrice] = useState("300");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const standard = Number(standardPrice);
        const premium = Number(premiumPrice);

        if (
            Number.isNaN(standard) ||
            Number.isNaN(premium) ||
            standard < 0 ||
            premium < 0
        ) {
            setError("Please enter valid non-negative prices.");
            return;
        }

        try {
            setLoading(true);

            const response = await generateEventSeats(
                eventId,
                {
                    standardPrice: standard,
                    premiumPrice: premium
                }
            );

            setSuccessMessage(
                 response.message ||
                 "Seats configured successfully."
            );

            navigate("/organiser/dashboard");

        } catch (err) {
            setError(
                err.message ||
                "Unable to configure seats."
            );
        } finally {
            setLoading(false);
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
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            navigate("/login");
                        }}
                    >
                        Sign out
                    </button>

                </div>

            </nav>

            {successMessage && (
                <div className="success-modal-overlay">

                    <div className="success-modal">

                        <div className="success-modal-icon">
                           ✓
                        </div>

                        <p className="success-modal-label">
                            SEATS CONFIGURED
                        </p>

                        <h2>
                            You're all set.
                        </h2>

                        <p className="success-modal-message">
                            {successMessage}
                        </p>

                        <button
                            className="success-modal-button"
                            onClick={() =>
                                navigate("/organiser/dashboard")
                            }
                        >
                            Back to dashboard
                        </button>

                    </div>

                </div>
            )}


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
                        SEAT CONFIGURATION
                    </p>

                    <h1>
                        Configure your seats.
                    </h1>

                    <p>
                        Set the ticket prices for the seats
                        available at this venue.
                    </p>

                </div>


                <form
                    className="create-event-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-section">

                        <p className="form-section-title">
                            TICKET PRICING
                        </p>


                        <label>
                            Standard seat price

                            <div className="price-input">
                                <span>₹</span>

                                <input
                                    type="number"
                                    min="0"
                                    value={standardPrice}
                                    onChange={(e) =>
                                        setStandardPrice(
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                        </label>


                        <label>
                            Premium seat price

                            <div className="price-input">
                                <span>₹</span>

                                <input
                                    type="number"
                                    min="0"
                                    value={premiumPrice}
                                    onChange={(e) =>
                                        setPremiumPrice(
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                        </label>

                    </div>


                    <div className="seat-info-card">

                        <div className="seat-info-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                Venue seats will be used
                            </strong>

                            <p>
                                All seats already configured
                                for this venue will be created
                                for this event.
                            </p>

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
                            disabled={loading}
                        >
                            {loading
                                ? "Configuring..."
                                : "Configure seats"}
                        </button>

                    </div>

                </form>

            </main>

        </div>
    );
}

export default ManageSeats;