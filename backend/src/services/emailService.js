const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendBookingConfirmationEmail = async ({
    email,
    name,
    bookingReference,
    eventTitle,
    startTime,
    venueName,
    venueLocation,
    seats,
    totalAmount
}) => {

    // QR code contains the booking reference
    const qrCodeDataUrl = await QRCode.toDataURL(
        bookingReference,
        {
            width: 250,
            margin: 2
        }
    );

    const seatList = seats
        .map(seat => `${seat.seat} (${seat.category})`)
        .join(", ");

    const formattedDate = new Date(startTime).toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

    await transporter.sendMail({
        from: `"Ticket Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Booking Confirmed - ${bookingReference}`,

        html: `
            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 650px;
                    margin: auto;
                    color: #263238;
                    line-height: 1.6;
                "
            >

                <div
                    style="
                        background:#5d806f;
                        color:white;
                        padding:20px;
                        border-radius:10px 10px 0 0;
                        text-align:center;
                    "
                >
                    <h1 style="margin:0;">
                        Ticket Booking
                    </h1>

                    <p style="margin:5px 0 0;">
                        Booking Confirmation
                    </p>
                </div>

                <div
                    style="
                        padding:25px;
                        border:1px solid #ddd;
                        border-top:none;
                    "
                >

                    <h2>
                        Hello ${name},
                    </h2>

                    <p>
                        Your booking has been successfully confirmed.
                    </p>

                    <div
                        style="
                            background:#f5f8f6;
                            padding:18px;
                            border-radius:8px;
                            margin:20px 0;
                        "
                    >

                        <h2 style="margin-top:0;">
                            ${eventTitle}
                        </h2>

                        <p>
                            <strong>Booking Reference:</strong>
                            ${bookingReference}
                        </p>

                        <p>
                            <strong>Date & Time:</strong>
                            ${formattedDate}
                        </p>

                        <p>
                            <strong>Venue:</strong>
                            ${venueName}
                        </p>

                        <p>
                            <strong>Location:</strong>
                            ${venueLocation}
                        </p>

                        <p>
                            <strong>Seats:</strong>
                            ${seatList}
                        </p>

                        <p>
                            <strong>Total Amount:</strong>
                            ₹${Number(totalAmount).toFixed(2)}
                        </p>

                    </div>

                    <div style="text-align:center; margin:30px 0;">

                        <h3>
                            Your QR Ticket
                        </h3>

                        <p>
                            Show this QR code at the venue.
                        </p>

                        <img
                            src="cid:ticket-qrcode"
                            alt="Booking QR Code"
                            width="250"
                            height="250"
                        />

                        <p>
                            <strong>
                                ${bookingReference}
                            </strong>
                        </p>

                    </div>

                    <p>
                        Please keep this email for your records.
                    </p>

                    <p>
                        Thank you for using Ticket Booking!
                    </p>

                </div>

            </div>
        `,

        attachments: [
            {
                filename: `${bookingReference}.png`,
                content: qrCodeDataUrl.split("base64,")[1],
                encoding: "base64",
                cid: "ticket-qrcode"
            }
        ]
    });
};

transporter.verify((error) => {
    if (error) {
        console.error("EMAIL CONFIG ERROR:", error);
    } else {
        console.log("EMAIL SERVER READY");
    }
});

module.exports = {
    sendBookingConfirmationEmail
};