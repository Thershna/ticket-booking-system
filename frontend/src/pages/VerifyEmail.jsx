import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    const verificationStarted = useRef(false);

    useEffect(() => {
        // Prevent React development mode from
        // sending the verification request twice.
        if (verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const verify = async () => {
            try {
                const API_BASE_URL =
                    `http://${window.location.hostname}:5000/api`;

                const response = await fetch(
                    `${API_BASE_URL}/auth/verify-email/${token}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Unable to verify your email."
                    );
                }

                setStatus("success");

                setMessage(
                    data.message ||
                    "Email verified successfully. You can now log in."
                );

            } catch (error) {
                setStatus("error");

                setMessage(
                    error.message ||
                    "Unable to verify your email."
                );
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="auth-page">

            <div className="auth-card">

                {status === "loading" && (
                    <>
                        <div className="success-modal-icon">
                            ...
                        </div>

                        <p className="eyebrow">
                            EMAIL VERIFICATION
                        </p>

                        <h1>
                            Verifying your email...
                        </h1>

                        <p>
                            Please wait while we verify
                            your email address.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="success-modal-icon">
                            ✓
                        </div>

                        <p className="eyebrow">
                            EMAIL VERIFIED
                        </p>

                        <h1>
                            Success!
                        </h1>

                        <p>
                            {message}
                        </p>

                        <button
                            className="primary-button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Go to Login →
                        </button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="modal-icon">
                            !
                        </div>

                        <p className="eyebrow">
                            VERIFICATION FAILED
                        </p>

                        <h1>
                            We couldn't verify your email.
                        </h1>

                        <p>
                            {message}
                        </p>

                        <button
                            className="primary-button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Go to Login →
                        </button>
                    </>
                )}

            </div>

        </div>
    );
}

export default VerifyEmail;