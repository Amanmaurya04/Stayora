
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDb = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const experienceRoutes = require("./routes/experienceRoutes");
const experienceBookingRoutes = require("./routes/experienceBookingRoutes");
const experienceReviewRoutes = require("./routes/experienceReviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const experiencePaymentRoutes = require("./routes/experiencePaymentRoutes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" })
);

app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/experience-payments", experiencePaymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/experience-bookings", experienceBookingRoutes);
app.use("/api/reviews/experience", experienceReviewRoutes);

app.get("/test", (req, res) => {
    res.json({
        message: "Server is working"
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "Stayora API is running..."
    });
});

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await connectDb();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
