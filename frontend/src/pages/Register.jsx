import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await register(name, email, password);

            // Show success popup instead of immediately navigating
            setShowSuccess(true);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">

            <section className="auth-card">

                <div className="brand-mark">
                    TB
                </div>

                <div className="auth-heading">
                    <p className="eyebrow">
                        TICKET BOOKING
                    </p>

                    <h1>Create your account</h1>

                    <p>
                        Join us to discover events and
                        book your next experience.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>

                    <label>Name</label>

                    <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        required
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account?

                    <span
                        onClick={() => navigate("/login")}
                    >
                        Sign in
                    </span>
                </p>

            </section>


            {/* SUCCESS POPUP */}

            {showSuccess && (
                <div className="modal-overlay">

                    <div className="register-success-modal">

                        <div className="register-success-icon">
                            ✓
                        </div>

                        <p className="eyebrow">
                            ACCOUNT CREATED
                        </p>

                        <h2>
                            Check your email
                        </h2>

                        <p className="register-success-text">
                            A verification email has been
                            sent to:
                        </p>

                        <strong className="register-email">
                            {email}
                        </strong>

                        <p className="register-success-note">
                            Please verify your email address
                            before logging in.
                        </p>

                        <button
                            className="primary-button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            OK
                        </button>

                    </div>

                </div>
            )}

        </main>
    );
}

export default Register;