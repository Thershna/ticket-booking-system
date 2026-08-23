const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const venueRoutes = require("./routes/venueRoutes");
const seatRoutes = require("./routes/seatRoutes");
const eventSeatRoutes = require("./routes/eventSeatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");


const app = express();
// ---------- MIDDLEWARE ----------

app.use(cors());
app.use(express.json());


// ---------- HEALTH CHECK ----------

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "Ticket Booking API is running",
            databaseTime: result.rows[0].now
        });

    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});


// ---------- ROUTES ----------

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api", seatRoutes);
app.use("/api", eventSeatRoutes);
app.use("/api", bookingRoutes);
app.use("/api", waitlistRoutes);


// ---------- SERVER ----------

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});