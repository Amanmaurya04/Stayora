const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createExperienceOrder,
    verifyExperiencePayment,
} = require("../controllers/experiencePaymentcontroller");

router.post("/create-order", authMiddleware, createExperienceOrder);

router.post("/verify-payment", authMiddleware, verifyExperiencePayment);

module.exports = router;
