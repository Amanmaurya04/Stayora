
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createExperienceOrder,
    verifyExperiencePayment,
} = require("../controllers/experiencePaymentcontroller");

// Create Razorpay order
router.post("/create-order", authMiddleware, createExperienceOrder);

// Verify Razorpay payment
router.post("/verify-payment", authMiddleware, verifyExperiencePayment);

module.exports = router;
