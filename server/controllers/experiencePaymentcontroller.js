
const Razorpay = require("razorpay");
const ExperienceBooking = require("../models/experienceBookingModel");
const crypto = require("crypto");
const mongoose = require("mongoose");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// CREATE RAZORPAY ORDER
const createExperienceOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        // 1. Validate booking ID
        if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: "Valid booking ID is required",
            });
        }

        // 2. Find booking
        const booking = await ExperienceBooking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        // 3. Check booking owner
        if (booking.guest.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to pay for this booking",
            });
        }

        // 4. Check booking status
        if (booking.status !== "pending") {
            return res.status(400).json({
                message: "This booking is not available for payment",
            });
        }

        if (booking.paymentStatus === "paid") {
            return res.status(400).json({
                message: "Booking is already paid",
            });
        }

        // 5. Calculate amount in paise
        const amount = Math.round(booking.totalPrice * 100);

        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Invalid booking amount",
            });
        }

        let order;

        // 6. Reuse an existing usable Razorpay order
        if (booking.razorpayOrderId) {
            order = await razorpay.orders.fetch(booking.razorpayOrderId);

            if (
                order.amount !== amount ||
                order.currency !== "INR"
            ) {
                return res.status(400).json({
                    message: "Existing payment order does not match this booking",
                });
            }

            if (order.status === "paid") {
                return res.status(409).json({
                    message: "This Razorpay order is already paid. Please contact support if your booking is not confirmed.",
                });
            }
        } else {
            // 7. Create new Razorpay order
            order = await razorpay.orders.create({
                amount,
                currency: "INR",
                receipt: `experience_${booking._id}`,
            });

            booking.razorpayOrderId = order.id;
            await booking.save();
        }

        return res.status(200).json({
            message: "Razorpay order ready",
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.log("Create Razorpay order error:", error);

        return res.status(500).json({
            message: "Failed to create Razorpay order",
        });
    }
};


// VERIFY RAZORPAY PAYMENT
const verifyExperiencePayment = async (req, res) => {
    try {
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        // 1. Validate required fields
        if (
            !bookingId ||
            !mongoose.isValidObjectId(bookingId) ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Valid payment details are required",
            });
        }

        // 2. Find booking
        const booking = await ExperienceBooking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        // 3. Check owner
        if (booking.guest.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to verify this payment",
            });
        }

        // 4. Make verification idempotent
        if (booking.paymentStatus === "paid") {
            if (
                booking.razorpayPaymentId === razorpay_payment_id &&
                booking.razorpayOrderId === razorpay_order_id
            ) {
                return res.status(200).json({
                    message: "Payment has already been verified",
                    booking,
                });
            }

            return res.status(409).json({
                message: "This booking has already been paid using another payment",
            });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({
                message: "This booking cannot be confirmed",
            });
        }

        // 5. Check order ID
        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                message: "Invalid Razorpay order",
            });
        }

        // 6. Generate expected signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        // 7. Compare signatures safely
        const expectedBuffer = Buffer.from(expectedSignature, "hex");
        const receivedBuffer = Buffer.from(razorpay_signature, "hex");

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            return res.status(400).json({
                message: "Invalid Razorpay signature",
            });
        }

        // 8. Fetch payment directly from Razorpay
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        // 9. Verify payment details
        const expectedAmount = Math.round(booking.totalPrice * 100);

        if (
            payment.order_id !== razorpay_order_id ||
            payment.amount !== expectedAmount ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                message: "Payment details do not match the booking",
            });
        }

        if (payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment has not been captured yet",
            });
        }

        // 10. Atomically update booking after successful verification
        const updatedBooking = await ExperienceBooking.findOneAndUpdate(
            {
                _id: bookingId,
                guest: req.user.id,
                status: "pending",
                paymentStatus: "unpaid",
                razorpayOrderId: razorpay_order_id,
            },
            {
                $set: {
                    status: "confirmed",
                    paymentStatus: "paid",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        // 11. Handle cases where booking changed during verification
        if (!updatedBooking) {
            const latestBooking = await ExperienceBooking.findById(bookingId);

            // Same payment was already verified
            if (
                latestBooking &&
                latestBooking.paymentStatus === "paid" &&
                latestBooking.razorpayPaymentId === razorpay_payment_id &&
                latestBooking.razorpayOrderId === razorpay_order_id
            ) {
                return res.status(200).json({
                    message: "Payment has already been verified",
                    booking: latestBooking,
                });
            }

            return res.status(409).json({
                message: "Booking status has changed. Payment requires reconciliation.",
            });
        }

        return res.status(200).json({
            message: "Payment verified successfully",
            booking: updatedBooking,
        });

    } catch (error) {
        console.error("Payment verification error:", error);

        return res.status(500).json({
            message: "Payment verification failed",
        });
    }
};


module.exports = {
    createExperienceOrder,
    verifyExperiencePayment,
};
