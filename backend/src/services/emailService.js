const nodemailer = require("nodemailer");

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

const sendVerificationEmail = async (
    email,
    name,
    token
) => {
    const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

    const verificationLink =
        `${frontendUrl}/verify-email/${token}`;

    await transporter.sendMail({
        from: `"Ticket Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify your Ticket Booking account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Welcome to Ticket Booking, ${name}!</h2>

                <p>
                    Thank you for creating your account.
                    Please verify your email address to activate your account.
                </p>

                <p style="margin: 30px 0;">
                    <a
                        href="${verificationLink}"
                        style="
                            background:#5d806f;
                            color:white;
                            padding:12px 20px;
                            text-decoration:none;
                            border-radius:8px;
                            display:inline-block;
                        "
                    >
                        Verify Email
                    </a>
                </p>

                <p>
                    This verification link expires in 24 hours.
                </p>

                <p>
                    If you did not create this account, you can ignore this email.
                </p>
            </div>
        `
    });
};

transporter.verify((error, success) => {
    if (error) {
        console.error("EMAIL CONFIG ERROR:", error);
    } else {
        console.log("EMAIL SERVER READY");
    }
});

module.exports = {
    sendVerificationEmail
};