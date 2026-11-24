const Razorpay = require("razorpay");
const Booking = require("../models/bookingModel");
const ExperienceBooking = require("../models/experienceBookingModel");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Experience = require("../models/experienceModel")

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const signaturesMatch = (expected, received) => {
    if (
        typeof expected !== "string" ||
        typeof received !== "string"
    ) {
        return false;
    }

    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(received, "hex");

    if (
        expectedBuffer.length === 0 ||
        expectedBuffer.length !== receivedBuffer.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
    );
};

const createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: "A valid booking ID is required",
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to pay for this booking",
            });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({
                message: "A cancelled booking cannot be paid for",
            });
        }

        if (booking.paymentStatus === "Paid") {
            return res.status(400).json({
                message: "Booking is already paid",
            });
        }

        if (
            !Number.isFinite(booking.totalPrice) ||
            booking.totalPrice <= 0
        ) {
            return res.status(400).json({
                message: "Invalid booking amount",
            });
        }

        const options = {
            amount: Math.round(booking.totalPrice * 100),
            currency: "INR",
            receipt: `booking_${booking._id}`,
        };

        const order = await razorpay.orders.create(options);

        booking.razorpayOrderId = order.id;
        await booking.save();

        return res.status(200).json({
            message: "Razorpay order created successfully",
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Create Razorpay order error:", error);

        return res.status(500).json({
            message: "Failed to create payment order",
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        if (
            !mongoose.isValidObjectId(bookingId) ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: "Valid booking and payment details are required",
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to verify this payment",
            });
        }

        if (booking.paymentStatus === "Paid") {
            if (
                booking.razorpayOrderId === razorpay_order_id &&
                booking.razorpayPaymentId === razorpay_payment_id
            ) {
                return res.status(200).json({
                    message: "Payment has already been verified",
                    booking,
                });
            }

            return res.status(409).json({
                message: "This booking has already been paid",
            });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({
                message: "Cancelled bookings cannot be confirmed",
            });
        }

        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                message: "Invalid Razorpay order",
            });
        }

        const body =
            `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (!signaturesMatch(
            expectedSignature,
            razorpay_signature
        )) {
            return res.status(400).json({
                message: "Invalid payment signature",
            });
        }

        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (payment.order_id !== booking.razorpayOrderId) {
            return res.status(400).json({
                message: "Payment does not belong to this booking order",
            });
        }

        const expectedAmount = Math.round(
            Number(booking.totalPrice) * 100
        );

        if (
            Number(payment.amount) !== expectedAmount ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                message: "Payment amount or currency does not match",
            });
        }

        if (payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment has not been captured yet",
            });
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            {
                _id: booking._id,
                user: req.user.id,
                status: { $ne: "Cancelled" },
                paymentStatus: { $ne: "Paid" },
                razorpayOrderId: razorpay_order_id,
            },
            {
                $set: {
                    paymentStatus: "Paid",
                    status: "Confirmed",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
            },
            { new: true, runValidators: true }
        );

        if (!updatedBooking) {
            const latestBooking = await Booking.findById(
                booking._id
            );

            if (
                latestBooking &&
                latestBooking.paymentStatus === "Paid" &&
                latestBooking.razorpayPaymentId === razorpay_payment_id
            ) {
                return res.status(200).json({
                    message: "Payment has already been verified",
                    booking: latestBooking,
                });
            }

            return res.status(409).json({
                message:
                    "Booking changed during payment verification. Please check your bookings.",
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

const webhook = async (req, res) => {
    try {
        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                message: "Webhook requires the original raw request body",
            });
        }

        const webhookSignature =
            req.headers["x-razorpay-signature"];

        if (
            typeof webhookSignature !== "string" ||
            !process.env.RAZORPAY_WEBHOOK_SECRET
        ) {
            return res.status(400).json({
                message: "Webhook signature or secret is missing",
            });
        }

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_WEBHOOK_SECRET
            )
            .update(req.body)
            .digest("hex");

        if (!signaturesMatch(expectedSignature, webhookSignature)) {
            return res.status(400).json({
                message: "Invalid webhook signature",
            });
        }

        const event = JSON.parse(req.body.toString("utf8"));

if (event.event?.startsWith("refund.")) {
    const refund = event.payload?.refund?.entity;

    if (!refund || !refund.payment_id || !refund.id) {
        return res.status(200).json({
            message: "Refund webhook received without required details",
        });
    }

    let refundStatus = "processing";

    if (
        event.event === "refund.failed" ||
        refund.status === "failed"
    ) {
        refundStatus = "failed";
    } else if (
        event.event === "refund.processed" ||
        refund.status === "processed"
    ) {
        refundStatus = "processed";
    }

    let booking = await Booking.findOne({
        razorpayPaymentId: refund.payment_id,
    });

    let bookingType = "stay";

    if (!booking) {
        booking = await ExperienceBooking.findOne({
            razorpayPaymentId: refund.payment_id,
        });

        bookingType = "experience";
    }

    if (!booking) {
        console.error(
            "No booking found for refund payment:",
            refund.payment_id
        );

        return res.status(200).json({
            message: "No matching booking found",
        });
    }

    const expectedAmount = Math.round(
        Number(booking.totalPrice) * 100
    );

    if (Number(refund.amount) !== expectedAmount) {
        console.error(
            "Refund amount mismatch:",
            booking._id
        );

        return res.status(200).json({
            message: "Refund amount mismatch; manual reconciliation required",
        });
    }

    if (
        booking.razorpayRefundId &&
        booking.razorpayRefundId !== refund.id
    ) {
        console.error(
            "Different refund ID found for booking:",
            booking._id
        );

        return res.status(200).json({
            message: "Different refund ID already exists; manual reconciliation required",
        });
    }


    if (bookingType === "stay") {
        const filter = {
            _id: booking._id,
            razorpayPaymentId: refund.payment_id,
            $or: [
                { razorpayRefundId: null },
                { razorpayRefundId: refund.id },
            ],
        };

        if (refundStatus === "processing") {
            filter.refundStatus = {
                $nin: ["processed", "failed"],
            };
        } else if (refundStatus === "failed") {
            filter.refundStatus = {
                $ne: "processed",
            };
        } else if (refundStatus === "processed") {
            filter.refundStatus = {
                $ne: "failed",
            };
        }

        const update = {
            $set: {
                refundStatus,
                razorpayRefundId: refund.id,
            },
        };

        if (refundStatus === "processed") {
            update.$set.paymentStatus = "Refunded";
        }

        await Booking.updateOne(filter, update);
    }


    if (bookingType === "experience") {

        if (refundStatus === "processed") {
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    const latestBooking =
                        await ExperienceBooking.findOne({
                            _id: booking._id,
                            razorpayPaymentId: refund.payment_id,
                        }).session(session);

                    if (!latestBooking) {
                        throw new Error(
                            "Experience booking not found during refund processing"
                        );
                    }

                    if (
                        latestBooking.razorpayRefundId &&
                        latestBooking.razorpayRefundId !== refund.id
                    ) {
                        throw new Error(
                            "A different refund ID is already saved"
                        );
                    }

                    if (latestBooking.refundStatus === "failed") {
                        return;
                    }

                    latestBooking.refundStatus = "processed";
                    latestBooking.razorpayRefundId = refund.id;
                    latestBooking.paymentStatus = "refunded";

                    if (latestBooking.status !== "cancelled") {

                        if (latestBooking.status !== "confirmed") {
                            throw new Error(
                                "Unexpected experience booking status during refund"
                            );
                        }

                        const experience = await Experience.findById(
                            latestBooking.experience
                        ).session(session);

                        if (!experience) {
                            throw new Error(
                                "Experience not found during refund processing"
                            );
                        }

                        const slot = experience.schedule.id(
                            latestBooking.slotId
                        );

                        if (!slot) {
                            throw new Error(
                                "Experience schedule slot not found during refund processing"
                            );
                        }

                        slot.spotsLeft += latestBooking.participants;

                        if (slot.spotsLeft > slot.totalSpots) {
                            throw new Error(
                                "Available spots exceed slot capacity"
                            );
                        }

                        latestBooking.status = "cancelled";

                        await experience.save({ session });
                    }

                    await latestBooking.save({ session });
                });

            } finally {
                await session.endSession();
            }

        } else {
            const filter = {
                _id: booking._id,
                razorpayPaymentId: refund.payment_id,
                $or: [
                    { razorpayRefundId: null },
                    { razorpayRefundId: refund.id },
                ],
            };

            if (refundStatus === "processing") {
                filter.refundStatus = {
                    $nin: ["processed", "failed"],
                };
            } else if (refundStatus === "failed") {
                filter.refundStatus = {
                    $ne: "processed",
                };
            }

            await ExperienceBooking.updateOne(
                filter,
                {
                    $set: {
                        refundStatus,
                        razorpayRefundId: refund.id,
                    },
                }
            );
        }
    }

    return res.status(200).json({
        message: "Refund webhook processed",
    });
}


        const payment = event.payload?.payment?.entity;

        if (!payment) {
            return res.status(200).json({
                message: "Webhook received",
            });
        }

        if (event.event === "payment.captured") {

            const booking = await Booking.findOne({
                razorpayOrderId: payment.order_id,
            });

            if (booking) {
                const expectedAmount = Math.round(
                    Number(booking.totalPrice) * 100
                );

                if (
                    Number(payment.amount) !== expectedAmount ||
                    payment.currency !== "INR"
                ) {
                    console.error(
                        "Listing webhook amount/currency mismatch:",
                        booking._id
                    );

                    return res.status(400).json({
                        message: "Payment details do not match booking",
                    });
                }

                if (booking.status === "Cancelled") {
                    console.error(
                        "Payment captured for cancelled stay booking:",
                        booking._id
                    );

                    return res.status(200).json({
                        message: "Payment captured for cancelled booking; reconciliation required",
                    });
                }

                await Booking.updateOne(
                    {
                        _id: booking._id,
                        status: { $ne: "Cancelled" },
                        paymentStatus: { $ne: "Paid" },
                    },
                    {
                        $set: {
                            paymentStatus: "Paid",
                            status: "Confirmed",
                            razorpayPaymentId: payment.id,
                        },
                    }
                );

                return res.status(200).json({
                    message: "Listing payment webhook processed",
                });
            }

            const experienceBooking =
                await ExperienceBooking.findOne({
                    razorpayOrderId: payment.order_id,
                });

            if (experienceBooking) {
                const expectedAmount = Math.round(
                    Number(experienceBooking.totalPrice) * 100
                );

                if (
                    Number(payment.amount) !== expectedAmount ||
                    payment.currency !== "INR"
                ) {
                    console.error(
                        "Experience webhook amount/currency mismatch:",
                        experienceBooking._id
                    );

                    return res.status(400).json({
                        message: "Experience payment amount or currency mismatch",
                    });
                }

                if (experienceBooking.status === "cancelled") {
                    console.error(
                        "Payment captured for cancelled experience booking:",
                        experienceBooking._id
                    );

                    return res.status(200).json({
                        message: "Payment captured for cancelled experience booking; reconciliation required",
                    });
                }

                await ExperienceBooking.findOneAndUpdate(
                    {
                        _id: experienceBooking._id,
                        status: "pending",
                        paymentStatus: "unpaid",
                        razorpayOrderId: payment.order_id,
                    },
                    {
                        $set: {
                            paymentStatus: "paid",
                            status: "confirmed",
                            razorpayPaymentId: payment.id,
                        },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );

                return res.status(200).json({
                    message: "Experience payment webhook processed",
                });
            }
        }

        if (event.event === "payment.failed") {

            const booking = await Booking.findOne({
                razorpayOrderId: payment.order_id,
            });

            if (booking) {
                await Booking.updateOne(
                    {
                        _id: booking._id,
                        status: { $ne: "Cancelled" },
                        paymentStatus: { $ne: "Paid" },
                    },
                    {
                        $set: {
                            paymentStatus: "Failed",
                        },
                    }
                );

                return res.status(200).json({
                    message: "Listing payment failure processed",
                });
            }

            const experienceBooking =
                await ExperienceBooking.findOne({
                    razorpayOrderId: payment.order_id,
                });

            if (experienceBooking) {
                await ExperienceBooking.updateOne(
                    {
                        _id: experienceBooking._id,
                        status: "pending",
                        paymentStatus: { $ne: "paid" },
                    },
                    {
                        $set: {
                            paymentStatus: "unpaid",
                        },
                    }
                );

                return res.status(200).json({
                    message: "Experience payment failure processed",
                });
            }
        }

        return res.status(200).json({
            message: "Webhook processed successfully",
        });

    } catch (error) {
        console.error("Webhook error:", error);

        return res.status(500).json({
            message: "Webhook processing failed",
        });
    }
};


module.exports = {
    createOrder,
    verifyPayment,
    webhook,
};
