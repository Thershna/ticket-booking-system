import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

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
                        onClick={() => navigate("/events")}
                    >
                        Browse events
                    </button>
                </div>
            </div>
        );
    }

    const downloadQRCode = () => {
        const canvas = document.getElementById("booking-qr");

        if (!canvas) return;

        const link = document.createElement("a");

        link.download = `${booking.bookingReference}-ticket.png`;
        link.href = canvas.toDataURL("image/png");

        link.click();
    };

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
                    Your tickets have been booked successfully.
                </p>

                <div className="booking-reference">
                    <span>
                        BOOKING REFERENCE
                    </span>

                    <strong>
                        {booking.bookingReference}
                    </strong>
                </div>

                {/* QR TICKET */}
                <div
                    style={{
                        margin: "25px auto",
                        padding: "20px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        textAlign: "center",
                        width: "fit-content",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
                    }}
                >

                    <p
                        style={{
                            fontWeight: "600",
                            marginBottom: "15px"
                        }}
                    >
                        YOUR QR TICKET
                    </p>

                    <QRCodeCanvas
                        id="booking-qr"
                        value={booking.bookingReference}
                        size={220}
                        level="H"
                        includeMargin={true}
                    />

                    <p
                        style={{
                            marginTop: "12px",
                            fontSize: "14px",
                            fontWeight: "600"
                        }}
                    >
                        {booking.bookingReference}
                    </p>

                    <button
                        className="success-secondary-button"
                        onClick={downloadQRCode}
                        style={{
                            marginTop: "10px"
                        }}
                    >
                        Download QR Ticket
                    </button>

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
                    onClick={() => navigate("/bookings")}
                >
                    View my bookings
                </button>

                <button
                    className="success-secondary-button"
                    onClick={() => navigate("/events")}
                >
                    Browse more events
                </button>

            </div>

        </div>
    );
}

export default BookingSuccess;