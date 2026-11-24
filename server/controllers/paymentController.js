
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

        // A repeat request for the same already-paid transaction is safe.
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

        // Verify the signature generated for this order and payment.
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

        // Verify transaction details directly with Razorpay.
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

        // This assumes Razorpay automatic capture is enabled.
        if (payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment has not been captured yet",
            });
        }

        // Conditional update prevents a cancellation that occurred
        // during verification from being overwritten by confirmation.
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

// const webhook = async (req, res) => {
//     try {
//         // express.raw() must be used on this route.
//         if (!Buffer.isBuffer(req.body)) {
//             return res.status(400).json({
//                 message: "Webhook requires the original raw request body",
//             });
//         }

//         const webhookSignature =
//             req.headers["x-razorpay-signature"];

//         if (
//             typeof webhookSignature !== "string" ||
//             !process.env.RAZORPAY_WEBHOOK_SECRET
//         ) {
//             return res.status(400).json({
//                 message: "Webhook signature or secret is missing",
//             });
//         }

//         const expectedSignature = crypto
//             .createHmac(
//                 "sha256",
//                 process.env.RAZORPAY_WEBHOOK_SECRET
//             )
//             .update(req.body)
//             .digest("hex");

//         if (!signaturesMatch(
//             expectedSignature,
//             webhookSignature
//         )) {
//             return res.status(400).json({
//                 message: "Invalid webhook signature",
//             });
//         }

//         const event = JSON.parse(req.body.toString("utf8"));

//         const payment =
//             event.payload?.payment?.entity;

//         if (!payment) {
//             return res.status(200).json({
//                 message: "Webhook received",
//             });
//         }

//         if (event.event === "payment.captured") {
//             // First, check listing bookings.
//             const booking = await Booking.findOne({
//                 razorpayOrderId: payment.order_id,
//             });

//             if (booking) {
//                 const expectedAmount = Math.round(
//                     Number(booking.totalPrice) * 100
//                 );

//                 if (
//                     Number(payment.amount) !== expectedAmount ||
//                     payment.currency !== "INR"
//                 ) {
//                     console.error(
//                         "Listing webhook amount/currency mismatch:",
//                         booking._id
//                     );

//                     return res.status(400).json({
//                         message: "Payment details do not match booking",
//                     });
//                 }

//                 // Do not turn a cancelled booking into a confirmed one.
//                 // If money was captured after cancellation, reconcile/refund it.
//                 if (booking.status === "Cancelled") {
//                     console.error(
//                         "Payment captured for cancelled booking:",
//                         booking._id
//                     );

//                     return res.status(200).json({
//                         message:
//                             "Payment captured for cancelled booking; reconciliation required",
//                     });
//                 }

//                 await Booking.updateOne(
//                     {
//                         _id: booking._id,
//                         status: { $ne: "Cancelled" },
//                     },
//                     {
//                         $set: {
//                             paymentStatus: "Paid",
//                             status: "Confirmed",
//                             razorpayPaymentId: payment.id,
//                         },
//                     }
//                 );

//                 return res.status(200).json({
//                     message: "Listing payment webhook processed",
//                 });
//             }

//             // Preserve your existing experience payment flow.
//             const experienceBooking =
//                 await ExperienceBooking.findOne({
//                     razorpayOrderId: payment.order_id,
//                 });

//             if (experienceBooking) {
//                 const expectedAmount = Math.round(
//                     Number(experienceBooking.totalPrice) * 100
//                 );

//                 if (
//                     Number(payment.amount) !== expectedAmount ||
//                     payment.currency !== "INR"
//                 ) {
//                     return res.status(400).json({
//                         message:
//                             "Experience payment amount or currency mismatch",
//                     });
//                 }

//                 if (
//                     experienceBooking.status !== "cancelled"
//                 ) {
//                     experienceBooking.paymentStatus = "paid";
//                     experienceBooking.status = "confirmed";
//                     experienceBooking.razorpayPaymentId =
//                         payment.id;

//                     await experienceBooking.save();
//                 }

//                 return res.status(200).json({
//                     message: "Experience payment webhook processed",
//                 });
//             }
//         }

//         if (event.event === "payment.failed") {
//             const booking = await Booking.findOne({
//                 razorpayOrderId: payment.order_id,
//             });

//             if (booking) {
//                 // Never overwrite a successful payment with a late failure.
//                 if (booking.paymentStatus !== "Paid") {
//                     booking.paymentStatus = "Failed";
//                     await booking.save();
//                 }

//                 return res.status(200).json({
//                     message: "Listing payment failure processed",
//                 });
//             }

//             const experienceBooking =
//                 await ExperienceBooking.findOne({
//                     razorpayOrderId: payment.order_id,
//                 });

//             if (experienceBooking) {
//                 if (experienceBooking.paymentStatus !== "paid") {
//                     experienceBooking.paymentStatus = "unpaid";
//                     await experienceBooking.save();
//                 }

//                 return res.status(200).json({
//                     message: "Experience payment failure processed",
//                 });
//             }
//         }

//         return res.status(200).json({
//             message: "Webhook processed successfully",
//         });
//     } catch (error) {
//         console.error("Webhook error:", error);

//         return res.status(500).json({
//             message: "Webhook processing failed",
//         });
//     }
// };

const webhook = async (req, res) => {
    try {
        // 1. Verify that the original raw body is available
        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).json({
                message: "Webhook requires the original raw request body",
            });
        }

        // 2. Verify Razorpay webhook signature
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

        // 3. Parse webhook event
        const event = JSON.parse(req.body.toString("utf8"));

        // 4. Handle refund events first
        // Refund events contain refund.entity and payment.entity
        // if (event.event?.startsWith("refund.")) {
        //     const refund = event.payload?.refund?.entity;

        //     if (!refund || !refund.payment_id || !refund.id) {
        //         return res.status(200).json({
        //             message: "Refund webhook received without required details",
        //         });
        //     }

        //     // Find the booking using its Razorpay payment ID
        //     const updateRefund = async (Model, refundedStatus) => {
        //         const booking = await Model.findOne({
        //             razorpayPaymentId: refund.payment_id,
        //         });

        //         if (!booking) {
        //             return { found: false };
        //         }

        //         // This implementation supports full booking refunds
        //         const expectedAmount = Math.round(
        //             Number(booking.totalPrice) * 100
        //         );

        //         if (Number(refund.amount) !== expectedAmount) {
        //             console.error(
        //                 "Refund amount mismatch for booking:",
        //                 booking._id
        //             );

        //             return {
        //                 found: true,
        //                 mismatch: true,
        //             };
        //         }

        //         // Determine the refund status
        //         let refundStatus = "processing";

        //         if (
        //             event.event === "refund.failed" ||
        //             refund.status === "failed"
        //         ) {
        //             refundStatus = "failed";
        //         } else if (
        //             event.event === "refund.processed" ||
        //             refund.status === "processed"
        //         ) {
        //             refundStatus = "processed";
        //         }

        //         const filter = {
        //             _id: booking._id,
        //             razorpayPaymentId: refund.payment_id,

        //             // Do not let an older refund overwrite a newer one
        //             $or: [
        //                 { razorpayRefundId: null },
        //                 { razorpayRefundId: refund.id },
        //             ],
        //         };

        //         const update = {
        //             $set: {
        //                 refundStatus,
        //                 razorpayRefundId: refund.id,
        //             },
        //         };

        //         // Only mark payment refunded after Razorpay processes it
        //         if (refundStatus === "processed") {
        //             update.$set.paymentStatus = refundedStatus;
        //         }

        //         // Do not downgrade a completed or failed refund
        //         // because of a delayed refund.created event
        //         if (refundStatus === "processing") {
        //             filter.refundStatus = {
        //                 $nin: ["processed", "failed"],
        //             };
        //         }

        //         const result = await Model.updateOne(filter, update);

        //         return {
        //             found: true,
        //             updated: result.modifiedCount > 0,
        //         };
        //     };

        //     // First check stay bookings
        //     let result = await updateRefund(Booking, "Refunded");

        //     // If no stay booking matched, check experience bookings
        //     if (!result.found) {
        //         result = await updateRefund(
        //             ExperienceBooking,
        //             "refunded"
        //         );
        //     }

        //     if (result.mismatch) {
        //         return res.status(200).json({
        //             message: "Refund amount mismatch; manual reconciliation required",
        //         });
        //     }

        //     if (!result.found) {
        //         console.error(
        //             "No booking found for refund payment:",
        //             refund.payment_id
        //         );
        //     }

        //     return res.status(200).json({
        //         message: "Refund webhook processed",
        //     });
        // }


if (event.event?.startsWith("refund.")) {
    const refund = event.payload?.refund?.entity;

    if (!refund || !refund.payment_id || !refund.id) {
        return res.status(200).json({
            message: "Refund webhook received without required details",
        });
    }

    // Determine the latest refund state from the event.
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

    // Find the related booking.
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

    // This implementation supports full refunds only.
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

    // Prevent a different refund from overwriting this booking's refund.
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

    // ==========================================
    // STAY BOOKING REFUND
    // ==========================================

    if (bookingType === "stay") {
        const filter = {
            _id: booking._id,
            razorpayPaymentId: refund.payment_id,
            $or: [
                { razorpayRefundId: null },
                { razorpayRefundId: refund.id },
            ],
        };

        // Prevent older events from downgrading a terminal state.
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

    // ==========================================
    // EXPERIENCE BOOKING REFUND
    // ==========================================

    if (bookingType === "experience") {

        // For a completed refund, restore spots and cancel
        // the booking in the same MongoDB transaction.
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

                    // Never downgrade a failed refund.
                    if (latestBooking.refundStatus === "failed") {
                        return;
                    }

                    // Always update refund details.
                    latestBooking.refundStatus = "processed";
                    latestBooking.razorpayRefundId = refund.id;
                    latestBooking.paymentStatus = "refunded";

                    // If cancellation already restored the spots,
                    // do not restore them a second time.
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

                        // Restore spots exactly once.
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
            // For refund.created or refund.failed, update the
            // refund information without restoring any spots.
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


        // 5. Get payment entity for payment events
        const payment = event.payload?.payment?.entity;

        if (!payment) {
            return res.status(200).json({
                message: "Webhook received",
            });
        }

        // 6. Handle successful payment
        if (event.event === "payment.captured") {

            // First check stay bookings
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

            // If not a stay booking, check experience bookings
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

                // Atomic update prevents cancellation from being overwritten
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

        // 7. Handle failed payment
        if (event.event === "payment.failed") {

            // First check stay bookings
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

            // Check experience bookings
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




























