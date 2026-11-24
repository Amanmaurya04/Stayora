
const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const Listing = require("../models/listingModel");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Accept date-only values from HTML date inputs.
// This prevents server-local timezone differences.
const parseDateOnly = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
};

const createBooking = async (req, res) => {
    try {
        const { listingId, checkIn, checkOut, guests } = req.body;

        if (
            !listingId ||
            !checkIn ||
            !checkOut ||
            guests === undefined ||
            guests === null
        ) {
            return res.status(400).json({
                message:
                    "Please provide listing, check-in, check-out and guests",
            });
        }

        if (!mongoose.isValidObjectId(listingId)) {
            return res.status(400).json({
                message: "Invalid listing ID",
            });
        }

        const guestCount = Number(guests);

        if (
            !Number.isInteger(guestCount) ||
            guestCount < 1
        ) {
            return res.status(400).json({
                message: "Guests must be a positive whole number",
            });
        }

        const startDate = parseDateOnly(checkIn);
        const endDate = parseDateOnly(checkOut);

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "Please provide valid check-in and check-out dates",
            });
        }

        if (startDate < new Date(
            new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"
        )) {
            return res.status(400).json({
                message: "Check-in cannot be in the past",
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                message: "Check-out must be after check-in",
            });
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found",
            });
        }

        if (
            !Number.isInteger(Number(listing.maxGuest)) ||
            guestCount > Number(listing.maxGuest)
        ) {
            return res.status(400).json({
                message: `This listing allows maximum ${listing.maxGuest} guests`,
            });
        }

        
        const existingBooking = await Booking.findOne({
            listing: listingId,
            status: { $in: ["Pending", "Confirmed"] },
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate },
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "Listing is already booked for these dates",
            });
        }

        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const nights = (endDate - startDate) / millisecondsPerDay;

        // The backend is the authority for the price.
        const pricePerNight = Number(listing.pricePerNight);

        if (
            !Number.isFinite(pricePerNight) || 
            pricePerNight < 0
        ) {
            return res.status(400).json({
                message: "Listing price is invalid",
            });
        }

        const totalPrice = nights * pricePerNight;

        const booking = await Booking.create({
            user: req.user.id,
            listing: listing._id,
            checkIn: startDate,
            checkOut: endDate,
            guests: guestCount,
            totalPrice,
            status: "Pending",
            paymentStatus: "Pending",
        });

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while creating the booking",
        });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            user: req.user.id,
        })
            .populate(
                "listing",
                "title images pricePerNight location"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: bookings.length,
            bookings,
        });
    } catch (error) {
        console.error("Get my bookings error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};


const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // 1. Validate booking ID
        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID",
            });
        }

        // 2. Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        // 3. Check booking owner
        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "You can only cancel your own booking",
            });
        }

        // 4. Check whether already cancelled
        if (booking.status === "Cancelled") {
            return res.status(400).json({
                message: "Booking is already cancelled",
            });
        }

        // 5. Handle unpaid booking
        if (booking.paymentStatus === "Pending") {

            // Atomic update prevents a payment race condition
            const cancelledBooking = await Booking.findOneAndUpdate(
                {
                    _id: bookingId,
                    user: req.user.id,
                    status: { $ne: "Cancelled" },
                    paymentStatus: "Pending",
                },
                {
                    $set: {
                        status: "Cancelled",
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!cancelledBooking) {
                return res.status(409).json({
                    message: "Booking payment status changed. Please refresh and try again.",
                });
            }

            return res.status(200).json({
                message: "Booking cancelled successfully",
                booking: cancelledBooking,
            });
        }

        // 6. Handle paid booking and refund
        if (booking.paymentStatus === "Paid") {

            if (!booking.razorpayPaymentId) {
                return res.status(400).json({
                    message: "Razorpay payment ID not found",
                });
            }

            // Check whether a refund has already been requested
            if (
                booking.refundStatus &&
                booking.refundStatus !== "not_requested"
            ) {
                return res.status(409).json({
                    message: "A refund has already been requested or needs reconciliation.",
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

            // 7. Reserve refund request atomically
            // This prevents duplicate refund requests from repeated clicks

            const reservedBooking = await Booking.findOneAndUpdate(
                {
                    _id: bookingId,
                    user: req.user.id,
                    status: "Confirmed",
                    paymentStatus: "Paid",
                    refundStatus: "not_requested",
                    razorpayPaymentId: booking.razorpayPaymentId,
                },
                {
                    $set: {
                        status: "Cancelled",
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

            // 8. Request refund from Razorpay
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
                    "Razorpay refund request error:",
                    refundError
                );

                // Keep processing because a network error may occur
                // even after Razorpay has accepted the refund.
                // Do not automatically retry and risk duplicate refunds.

                return res.status(502).json({
                    message: "Refund request could not be confirmed. Please check the Razorpay dashboard before retrying.",
                    refundStatus: "processing",
                    booking: reservedBooking,
                });
            }

            // 9. Determine actual Razorpay refund status
            let refundStatus = "processing";

            if (refund.status === "processed") {
                refundStatus = "processed";
            } else if (refund.status === "failed") {
                refundStatus = "failed";
            }

            // 10. Save refund details
            const updateFields = {
                razorpayRefundId: refund.id,
                refundStatus,
            };

            // Only mark payment refunded when Razorpay confirms completion
            if (refundStatus === "processed") {
                updateFields.paymentStatus = "Refunded";
            }

            // Do not overwrite a refund webhook that arrived first
            await Booking.updateOne(
                {
                    _id: bookingId,
                    refundStatus: "processing",
                    razorpayPaymentId: reservedBooking.razorpayPaymentId,
                },
                {
                    $set: updateFields,
                }
            );

            const latestBooking = await Booking.findById(bookingId);

            return res.status(200).json({
                message:
                    refundStatus === "processed"
                        ? "Booking cancelled and refund completed successfully"
                        : refundStatus === "failed"
                            ? "Booking cancelled but refund failed. Please contact support."
                            : "Booking cancelled. Refund is being processed.",
                refundId: refund.id,
                refundStatus: latestBooking.refundStatus,
                booking: latestBooking,
            });
        }

        return res.status(400).json({
            message: "Booking cannot be cancelled",
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while cancelling booking",
        });
    }
};


const getHostBookings = async (req, res) => {
    try {
        const listings = await Listing.find({
            host: req.user.id,
        }).select("_id");

        const listingIds = listings.map((listing) => listing._id);

        const bookings = await Booking.find({
            listing: { $in: listingIds },
        })
            .populate("user", "username email contactNum")
            .populate(
                "listing",
                "title images pricePerNight location"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: bookings.length,
            bookings,
        });
    } catch (error) {
        console.error("Get host bookings error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

const getSingleBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID",
            });
        }

        const booking = await Booking.findById(bookingId)
            .populate("user", "username email contactNum")
            .populate(
                "listing",
                "title images pricePerNight location host"
            );

        if (!booking) {
            return res.status(404).json({
                message: "No booking found",
            });
        }

        const userId = req.user.id.toString();

        const isGuest =
            booking.user._id.toString() === userId;

        const isHost =
            booking.listing.host.toString() === userId;

        if (!isGuest && !isHost) {
            return res.status(403).json({
                message: "You are not authorized to view this booking",
            });
        }

        return res.status(200).json({ booking });
    } catch (error) {
        console.error("Get single booking error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    getHostBookings,
    getSingleBooking,
};






























