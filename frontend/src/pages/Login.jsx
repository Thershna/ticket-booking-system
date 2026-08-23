import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await login(email, password);

            const token = response.data?.token;

            if (!token) {
                throw new Error("Login token was not received.");
            }

            localStorage.setItem("token", token);

            const user = response.data?.user;

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );

            if (user?.role === "ORGANISER") {
                navigate("/organiser/dashboard");
            } else {
                navigate("/events");
            }

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
                    <p className="eyebrow">TICKET BOOKING</p>

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to discover events and manage
                        your bookings.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                    />

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter your password"
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
                            ? "Signing in..."
                            : "Sign in"}
                    </button>

                </form>

                <p className="auth-footer">
                    Don't have an account?
                    <span
                        onClick={() => navigate("/register")}
                    >
                        Create one
                    </span>
                </p>

            </section>

        </main>
    );
}

export default Login;