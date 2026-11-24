const express = require("express");
const router = express.Router();

const { createExperienceBooking, getMyExperienceBookings,getSingleBooking, cancelExperienceBooking } = require("../controllers/experienceBookingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createExperienceBooking);
router.get("/my-booking/:id", authMiddleware ,getSingleBooking)
router.get("/my-bookings", authMiddleware, getMyExperienceBookings);
router.patch("/:id/cancel", authMiddleware, cancelExperienceBooking);

module.exports = router