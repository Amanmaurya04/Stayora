const Razorpay = require("razorpay");
const ExperienceBooking = require("../models/experienceBookingModel");
const crypto = require("crypto");
const mongoose = require("mongoose");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createExperienceOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: "Valid booking ID is required",
            });
        }

        const booking = await ExperienceBooking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.guest.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to pay for this booking",
            });
        }

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

        const amount = Math.round(booking.totalPrice * 100);

        if (!Number.isSafeInteger(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Invalid booking amount",
            });
        }

        let order;

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


const verifyExperiencePayment = async (req, res) => {
    try {
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

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

        const booking = await ExperienceBooking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.guest.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to verify this payment",
            });
        }

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

        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                message: "Invalid Razorpay order",
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

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

        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

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

        if (!updatedBooking) {
            const latestBooking = await ExperienceBooking.findById(bookingId);

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
