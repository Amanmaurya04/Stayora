const mongoose = require("mongoose");
const Experience = require("../models/experienceModel");
const ExperienceBooking = require("../models/experienceBookingModel");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const createExperienceBooking = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { experienceId, slotId, participants } = req.body;

        if (!experienceId || !slotId || participants === undefined) {
            return res.status(400).json({
                message: "Please provide experience id, slot id and participants",
            });
        }

        if (
            !mongoose.isValidObjectId(experienceId) ||
            !mongoose.isValidObjectId(slotId)
        ) {
            return res.status(400).json({
                message: "Invalid experience id or slot id",
            });
        }

        const participantCount = Number(participants);

        if (!Number.isSafeInteger(participantCount) || participantCount < 1) {
            return res.status(400).json({
                message: "Participants must be a positive whole number",
            });
        }

        if (!req.user?.id) {
            return res.status(401).json({
                message: "Please login first",
            });
        }

        let createdBooking;

        await session.withTransaction(async () => {
            const experience = await Experience.findById(experienceId)
                .session(session);

            if (!experience) {
                const error = new Error("Experience not found");
                error.statusCode = 404;
                throw error;
            }

            const slot = experience.schedule.id(slotId);

            if (!slot) {
                const error = new Error("Schedule slot not found");
                error.statusCode = 404;
                throw error;
            }

            if (slot.spotsLeft < participantCount) {
                const error = new Error(
                    `Only ${slot.spotsLeft} spots are available`
                );
                error.statusCode = 400;
                throw error;
            }

            const totalPrice =
                experience.pricePerPerson * participantCount;

            slot.spotsLeft -= participantCount;

            await experience.save({ session });

            const [booking] = await ExperienceBooking.create(
                [
                    {
                        experience: experience._id,
                        slotId: slot._id,
                        guest: req.user.id,
                        host: experience.host,
                        participants: participantCount,
                        totalPrice,
                        status: "pending",
                        paymentStatus: "unpaid",
                    },
                ],
                { session }
            );

            createdBooking = booking;
        });

        return res.status(201).json({
            message: "Experience booking created successfully. Complete payment to confirm it.",
            booking: createdBooking,
        });

    } catch (error) {
        console.log("Create experience booking error:", error);

        return res.status(error.statusCode || 500).json({
            message: error.message || "Failed to create experience booking",
        });

    } finally {
        await session.endSession();
    }
};


const getMyExperienceBookings = async (req, res) => {
    try {
        const bookings = await ExperienceBooking.find({
            guest: req.user.id,
        })
            .populate("experience")
            .populate("guest", "username email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Experience bookings fetched successfully",
            bookings,
        });

    } catch (error) {
        console.log("Get my experience booking error:", error);

        return res.status(500).json({
            message: "Failed to fetch experience bookings",
        });
    }
};


const getSingleBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid booking id",
            });
        }

        const booking = await ExperienceBooking.findById(id)
            .populate("guest", "username email")
            .populate("experience");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.guest._id.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to view this booking",
            });
        }

        return res.status(200).json({
            message: "Booking fetched successfully",
            booking,
        });

    } catch (error) {
        console.log("Get single booking error:", error);

        return res.status(500).json({
            message: "Failed to fetch booking",
        });
    }
};

const cancelExperienceBooking = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid booking ID",
            });
        }

        const booking = await ExperienceBooking.findById(id);

        if (!booking) {
            return res.status(404).json({
                message: "Experience booking not found",
            });
        }

        if (booking.guest.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You can only cancel your own booking",
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking is already cancelled",
            });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Completed bookings cannot be cancelled",
            });
        }


        if (booking.paymentStatus === "unpaid") {

            await session.withTransaction(async () => {

                const latestBooking = await ExperienceBooking.findOne({
                    _id: id,
                    guest: req.user.id,
                    status: "pending",
                    paymentStatus: "unpaid",
                }).session(session);

                if (!latestBooking) {
                    throw new Error(
                        "Booking status changed. Please refresh and try again."
                    );
                }

                const experience = await Experience.findById(
                    latestBooking.experience
                ).session(session);

                if (!experience) {
                    throw new Error("Experience not found");
                }

                const slot = experience.schedule.id(
                    latestBooking.slotId
                );

                if (!slot) {
                    throw new Error("Schedule slot not found");
                }

                slot.spotsLeft += latestBooking.participants;

                if (slot.spotsLeft > slot.totalSpots) {
                    throw new Error(
                        "Available spots exceed the slot capacity"
                    );
                }

                latestBooking.status = "cancelled";

                await experience.save({ session });
                await latestBooking.save({ session });
            });

            return res.status(200).json({
                message: "Experience booking cancelled successfully",
            });
        }


        if (booking.paymentStatus === "paid") {

            if (!booking.razorpayPaymentId) {
                return res.status(400).json({
                    message: "Razorpay payment ID not found",
                });
            }

            if (
                booking.refundStatus &&
                booking.refundStatus !== "not_requested"
            ) {
                return res.status(409).json({
                    message: "Refund has already been requested or needs reconciliation",
                    refundStatus: booking.refundStatus,
                });
            }

            const refundAmount = Math.round(
                Number(booking.totalPrice) * 100
            );

            if (
                !Number.isSafeInteger(refundAmount) ||
                refundAmount <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid refund amount",
                });
            }

            const reservedBooking =
                await ExperienceBooking.findOneAndUpdate(
                    {
                        _id: id,
                        guest: req.user.id,
                        status: "confirmed",
                        paymentStatus: "paid",
                        refundStatus: "not_requested",
                        razorpayPaymentId: booking.razorpayPaymentId,
                    },
                    {
                        $set: {
                            refundStatus: "processing",
                        },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );

            if (!reservedBooking) {
                return res.status(409).json({
                    message: "Booking has changed or a refund is already being processed. Please refresh.",
                });
            }

            let refund;

            try {
                refund = await razorpay.payments.refund(
                    reservedBooking.razorpayPaymentId,
                    {
                        amount: refundAmount,
                    }
                );

            } catch (refundError) {
                console.error(
                    "Experience refund request error:",
                    refundError
                );


                return res.status(502).json({
                    message: "Refund request could not be confirmed. Please check Razorpay before retrying.",
                    refundStatus: "processing",
                });
            }

            if (refund.status === "failed") {

                await ExperienceBooking.updateOne(
                    {
                        _id: id,
                        refundStatus: "processing",
                    },
                    {
                        $set: {
                            refundStatus: "failed",
                            razorpayRefundId: refund.id,
                        },
                    }
                );

                return res.status(502).json({
                    message: "Refund failed. Please contact support.",
                    refundStatus: "failed",
                });
            }


            await session.withTransaction(async () => {

                const latestBooking =
                    await ExperienceBooking.findById(id).session(session);

                if (!latestBooking) {
                    throw new Error("Experience booking not found");
                }

                if (latestBooking.status === "cancelled") {
                    return;
                }

                if (latestBooking.status !== "confirmed") {
                    throw new Error(
                        "Booking status changed. Manual reconciliation may be required."
                    );
                }

                if (latestBooking.refundStatus === "failed") {
                    throw new Error(
                        "Refund failed. Booking cannot be cancelled automatically."
                    );
                }

                const experience = await Experience.findById(
                    latestBooking.experience
                ).session(session);

                if (!experience) {
                    throw new Error("Experience not found");
                }

                const slot = experience.schedule.id(
                    latestBooking.slotId
                );

                if (!slot) {
                    throw new Error("Schedule slot not found");
                }

                slot.spotsLeft += latestBooking.participants;

                if (slot.spotsLeft > slot.totalSpots) {
                    throw new Error(
                        "Available spots exceed the slot capacity"
                    );
                }

                latestBooking.status = "cancelled";

                latestBooking.razorpayRefundId = refund.id;

                if (refund.status === "processed") {
                    latestBooking.refundStatus = "processed";
                    latestBooking.paymentStatus = "refunded";
                } else if (
                    latestBooking.refundStatus !== "processed"
                ) {
                    latestBooking.refundStatus = "processing";
                }

                await experience.save({ session });
                await latestBooking.save({ session });
            });

            const updatedBooking =
                await ExperienceBooking.findById(id);

            return res.status(200).json({
                message:
                    updatedBooking.refundStatus === "processed"
                        ? "Experience booking cancelled and refund completed"
                        : "Experience booking cancelled. Refund is being processed.",
                refundId: refund.id,
                refundStatus: updatedBooking.refundStatus,
                booking: updatedBooking,
            });
        }

        return res.status(400).json({
            message: "Booking cannot be cancelled",
        });

    } catch (error) {
        console.error(
            "Cancel experience booking error:",
            error
        );

        return res.status(error.statusCode || 500).json({
            message: error.message ||
                "Failed to cancel experience booking",
        });

    } finally {
        await session.endSession();
    }
};

module.exports = {
    createExperienceBooking,
    getMyExperienceBookings,
    getSingleBooking,
    cancelExperienceBooking,
};
