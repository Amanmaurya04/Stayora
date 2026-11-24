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
const upload = require("./middleware/upload")

const app = express();
connectDb();

app.use(cors());

app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" })
);


app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/experience-payments", experiencePaymentRoutes);
app.use("/api/auth" , authRoutes);
app.use("/api/listings" , listingRoutes);
app.use("/api/bookings" , bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user" ,userRoutes);
app.use("/api/experiences" , experienceRoutes);
app.use("/api/experience-bookings", experienceBookingRoutes);
app.use("/api/reviews/experience", experienceReviewRoutes);

app.get("/test", (req, res) => {
    res.json({
        message: "Server is working"
    });
});


app.get("/" , (req , res) => {
    res.json({
        message:"Stayora API is running...",
    });
});


const PORT = process.env.PORT  || 8000; 

app.listen(PORT , () => {
    console.log(`Server is running on port ${PORT}`);
});
