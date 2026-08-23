import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getEvent,
    getEventSeats,
    holdSeats,
    confirmBooking,
    joinWaitlist,
    getMyWaitlistOffers,
    acceptWaitlistOffer
} from "../services/api";

function SeatSelection() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);

    const [holdData, setHoldData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const [loading, setLoading] = useState(true);
    const [holding, setHolding] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const [error, setError] = useState("");
    const [waitlistCategory, setWaitlistCategory] = useState(null);
    const [joiningWaitlist, setJoiningWaitlist] = useState(false);
    const [waitlistMessage, setWaitlistMessage] = useState("");
    const [waitlistPosition, setWaitlistPosition] = useState(null);
    const [waitlistOffers, setWaitlistOffers] = useState([]);
    const [acceptingOffer, setAcceptingOffer] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [eventResponse, seatsResponse] =
                await Promise.all([
                    getEvent(id),
                    getEventSeats(id)
                ]);

            setEvent(eventResponse.data);
            setSeats(seatsResponse.data || []);
            try {
               const offersResponse =
                   await getMyWaitlistOffers();

               setWaitlistOffers(
                   offersResponse.data || []
               );
            } catch {
    // Waitlist offers are optional.
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /*
     * Countdown for the temporary seat hold.
     */
    useEffect(() => {
        if (!holdData?.holdExpiresAt) {
            return;
        }

        const updateTimer = () => {
            const expiry =
                new Date(
                    holdData.holdExpiresAt
                ).getTime();

            const remaining =
                Math.max(
                    0,
                    Math.floor(
                        (expiry - Date.now()) / 1000
                    )
                );

            setTimeLeft(remaining);

            if (remaining === 0) {
                setHoldData(null);
                setSelectedSeats([]);
                loadData();
            }
        };

        updateTimer();

        const timer = setInterval(
            updateTimer,
            1000
        );

        return () => clearInterval(timer);
    }, [holdData]);

    const toggleSeat = (seat) => {
        if (holdData) {
            return;
        }

        if (seat.status !== "AVAILABLE") {
            return;
        }

        setSelectedSeats((current) => {
            const alreadySelected =
                current.some(
                    (item) =>
                        item.id === seat.id
                );

            if (alreadySelected) {
                return current.filter(
                    (item) =>
                        item.id !== seat.id
                );
            }

            return [...current, seat];
        });
    };

    const handleHoldSeats = async () => {
        if (selectedSeats.length === 0) {
            return;
        }

        try {
            setHolding(true);
            setError("");

            const eventSeatIds =
                selectedSeats.map(
                    (seat) => seat.id
                );

            const response =
                await holdSeats(
                    id,
                    eventSeatIds
                );

            setHoldData(response.data);

        } catch (err) {
            setError(err.message);

            // Refresh seats in case
            // another customer got them.
            await loadData();

        } finally {
            setHolding(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!holdData) {
            return;
        }

        try {
            setConfirming(true);
            setError("");

            const eventSeatIds =
                selectedSeats.map(
                    (seat) => seat.id
                );

            const response =
                await confirmBooking(
                    id,
                    eventSeatIds
                );

            const booking =
                response.data;

            navigate(
                `/booking-success/${booking.bookingId}`,
                {
                    state: {
                        booking
                    }
                }
            );

        } catch (err) {
            setError(err.message);
            await loadData();
        } finally {
            setConfirming(false);
        }
    };

    const handleJoinWaitlist = async (category) => {
        try {
            setJoiningWaitlist(true);
            setError("");

            const response = await joinWaitlist(
                id,
                category
            );

            setWaitlistCategory(category);



             setWaitlistPosition(
                   response.data?.position || null
              );

              setWaitlistMessage(
                  response.message ||
                  `You have joined the ${category} waitlist.`
               );

        } catch (err) {
            setError(err.message);
        } finally {
            setJoiningWaitlist(false);
        }
    };

    const totalAmount =
        selectedSeats.reduce(
            (total, seat) =>
                total + Number(seat.price),
            0
        );

    const groupedSeats =
        seats.reduce(
            (groups, seat) => {
                if (!groups[seat.row_label]) {
                    groups[seat.row_label] = [];
                }

                groups[seat.row_label].push(
                    seat
                );

                return groups;
            },
            {}
        );

    const formatTime = (seconds) => {
        const minutes =
            Math.floor(seconds / 60);

        const secs =
            seconds % 60;

        return `${String(minutes).padStart(
            2,
            "0"
        )}:${String(secs).padStart(2, "0")}`;
    };

    const standardSeats = seats.filter(
        (seat) => seat.category === "STANDARD"
    );

    const premiumSeats = seats.filter(
        (seat) => seat.category === "PREMIUM"
    );

    const standardAvailable = standardSeats.some(
        (seat) => seat.status === "AVAILABLE"
    );

    const premiumAvailable = premiumSeats.some(
        (seat) => seat.status === "AVAILABLE"
    );

    if (loading) {
        return (
            <div className="seat-page-state">
                Loading seats...
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="seat-page-state">
                <div className="error-message">
                    {error}
                </div>

                <button
                    className="secondary-button"
                    onClick={() =>
                        navigate(
                            `/events/${id}`
                        )
                    }
                >
                    ← Back to event
                </button>
            </div>
        );
    }

    return (
        <div className="seat-selection-page">

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
                            navigate(
                                "/bookings"
                            )
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
                {waitlistMessage && (
    <div className="success-modal-overlay">

        <div className="success-modal">

            <div className="success-modal-icon">
                ✓
            </div>

            <p className="success-modal-label">
                WAITLIST JOINED
            </p>

            <h2>
                You're on the list.
            </h2>

            <p className="success-modal-message">
                {waitlistMessage}
            </p>

            {waitlistPosition && (
                <p className="waitlist-position">
                    You are currently{" "}
                    <strong>
                        #{waitlistPosition}
                    </strong>{" "}
                    on the {waitlistCategory} waitlist.
                </p>
             )}

            <button
                className="success-modal-button"
                onClick={() =>
                    setWaitlistMessage("")
                }
            >
                Continue
            </button>

        </div>

    </div>
)}
{waitlistOffers.length > 0 && (
    <div className="waitlist-offer-bar">

        <div className="waitlist-offer-content">

            <div className="waitlist-offer-icon">
                ✓
            </div>

            <div>

                <strong>
                    A seat is available!
                </strong>

                <p>
                    Your waitlist offer for{" "}
                    <strong>
                        {waitlistOffers[0].category}
                        {" · "}
                        {waitlistOffers[0].row_label}
                        {waitlistOffers[0].seat_number}
                    </strong>{" "}
                    is ready.
                </p>

            </div>

        </div>

        <button
            className="waitlist-offer-button"
            disabled={acceptingOffer}
            onClick={async () => {

                try {

                    setAcceptingOffer(true);
                    setError("");

                    const response =
                        await acceptWaitlistOffer(
                            waitlistOffers[0].offer_id
                        );

                    navigate(
                        `/booking-success/${response.data.bookingId}`,
                        {
                            state: {
                                booking:
                                    response.data
                            }
                        }
                    );

                } catch (err) {

                    setError(
                        err.message ||
                        "Unable to accept this offer."
                    );

                    setWaitlistOffers([]);

                } finally {

                    setAcceptingOffer(false);

                }

            }}
        >
            {acceptingOffer
                ? "Accepting..."
                : "Accept offer"}
        </button>

    </div>
)}

            </nav>


            <main className="seat-selection-content">

                <button
                    className="back-button"
                    onClick={() =>
                        navigate(
                            `/events/${id}`
                        )
                    }
                >
                    ← Back to event
                </button>


                <div className="seat-heading">

                    <div>

                        <p className="eyebrow">
                            SELECT YOUR SEATS
                        </p>

                        <h1>
                            {event.title}
                        </h1>

                    </div>

                    <div className="seat-heading-location">
                        {event.venue_name}
                        <br />
                        {event.venue_location}
                    </div>

                </div>


                {error && (
                    <div className="error-message seat-error">
                        {error}
                    </div>
                )}


                {holdData && (
                    <div className="hold-banner">

                        <div>
                            <strong>
                                Your seats are held
                            </strong>

                            <span>
                                Complete your booking
                                before the timer ends.
                            </span>
                        </div>

                        <div className="hold-timer">
                            {formatTime(timeLeft)}
                        </div>

                    </div>
                )}


                <div className="screen-container">

                    <div className="screen">
                        SCREEN
                    </div>

                </div>


                <section className="seat-map">

                    {Object.entries(
                        groupedSeats
                    ).map(
                        ([row, rowSeats]) => (

                            <div
                                className="seat-row"
                                key={row}
                            >

                                <span className="row-label">
                                    {row}
                                </span>

                                <div className="seat-row-items">

                                    {rowSeats.map(
                                        (seat) => {

                                            const selected =
                                                selectedSeats.some(
                                                    (item) =>
                                                        item.id ===
                                                        seat.id
                                                );

                                            let className =
                                                "seat";

                                            if (
                                                seat.status ===
                                                "BOOKED"
                                            ) {
                                                className +=
                                                    " seat-booked";
                                            } else if (
                                                seat.status ===
                                                "HELD"
                                            ) {
                                                className +=
                                                    " seat-held";
                                            } else if (
                                                selected
                                            ) {
                                                className +=
                                                    " seat-selected";
                                            }

                                            return (
                                                <button
                                                    key={seat.id}
                                                    className={
                                                        className
                                                    }
                                                    disabled={
                                                        seat.status !==
                                                            "AVAILABLE" ||
                                                        Boolean(
                                                            holdData
                                                        )
                                                    }
                                                    onClick={() =>
                                                        toggleSeat(
                                                            seat
                                                        )
                                                    }
                                                >
                                                    {
                                                        seat.seat_number
                                                    }
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        )
                    )}

                </section>

                {(standardSeats.length > 0 ||
                   premiumSeats.length > 0) && (
                   <section className="waitlist-section">

                        <div className="waitlist-heading">

                            <div>
                                <span>
                                    CAN'T FIND A SEAT?
                                </span>

                                <p>
                                   Join the waitlist and we'll
                                   notify you when a seat becomes
                                   available.
                               </p>
                             </div>

                          </div>


                          <div className="waitlist-options">

                             {!standardAvailable &&
                                 standardSeats.length > 0 && (
                                    <button
                                        className="waitlist-button"
                                        disabled={
                                            joiningWaitlist ||
                                            waitlistCategory ===
                                                 "STANDARD"
                                        }
                                        onClick={() =>
                                            handleJoinWaitlist(
                                                  "STANDARD"
                                            )
                                         }
                                     >
                                         {waitlistCategory ===
                                         "STANDARD"
                                             ? "✓ On Standard waitlist"
                                             : "Join Standard waitlist"}
                                     </button>
                               )}


                             {!premiumAvailable &&
                                 premiumSeats.length > 0 && (
                                    <button
                                         className="waitlist-button"
                                         disabled={
                                              joiningWaitlist ||
                                              waitlistCategory ===
                                                   "PREMIUM"
                                         }
                                         onClick={() =>
                                              handleJoinWaitlist(
                                                    "PREMIUM"
                                              )
                                          }
                                      >
                                           {waitlistCategory ===
                                           "PREMIUM"
                                               ? "✓ On Premium waitlist"
                                               : "Join Premium waitlist"}
                                      </button>
                                 )}

                      </div>

                  </section>
                )}


                <div className="seat-legend">

                    <div>
                        <span className="legend-dot available"></span>
                        Available
                    </div>

                    <div>
                        <span className="legend-dot selected"></span>
                        Selected
                    </div>

                    <div>
                        <span className="legend-dot booked"></span>
                        Booked
                    </div>

                    <div>
                        <span className="legend-dot held"></span>
                        Held
                    </div>

                </div>
                {selectedSeats.length > 6 && (
                      <div className="error-message seat-error">
                            You can select a maximum of 6 seats per booking.
                       </div>
                 )}


                <section className="seat-summary">

                    <div>

                        <span>
                            SELECTED
                        </span>

                        <strong>
                            {selectedSeats.length === 0
                                ? "No seats selected"
                                : selectedSeats
                                      .map(
                                          (seat) =>
                                              `${seat.row_label}${seat.seat_number}`
                                      )
                                      .join(", ")}
                        </strong>

                    </div>


                    <div>

                        <span>
                            TOTAL
                        </span>

                        <strong>
                            ₹{totalAmount.toFixed(2)}
                        </strong>

                    </div>


                    {!holdData ? (

                        <button
                            className="primary-button seat-continue-button"
                            disabled={
                                selectedSeats.length === 0 ||
                                selectedSeats.length > 6 ||
                                holding
                            }
                            onClick={
                                handleHoldSeats
                            }
                        >
                            {holding
                                ? "Holding..."
                                : "Continue →"}
                        </button>

                    ) : (

                        <button
                            className="primary-button seat-continue-button"
                            disabled={
                                confirming ||
                                timeLeft === 0
                            }
                            onClick={
                                handleConfirmBooking
                            }
                        >
                            {confirming
                                ? "Confirming..."
                                : "Confirm booking"}
                        </button>

                    )}

                </section>

            </main>

        </div>
    );
}

export default SeatSelection;