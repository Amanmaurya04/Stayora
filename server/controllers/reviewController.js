const Review = require("../models/reviewModel");
const Booking = require("../models/bookingModel");
const Listing = require("../models/listingModel");


const createReview = async (req, res) => {
    try {
        const { ratings, comment } = req.body;
        const { listingId } = req.params;

        if (!ratings || !comment?.trim()) {
            return res.status(400).json({
                message: "Please provide ratings and comment",
            });
        }

        const bookings = await Booking.find({
            user: req.user.id,
            listing: listingId,
            status: "Confirmed",
            checkOut: { $lte: new Date() },
        }).sort({ checkOut: -1 });

        if (bookings.length === 0) {
            return res.status(400).json({
                message:
                    "You need a completed booking to review this listing",
            });
        }

        let booking = null;

        for (const currentBooking of bookings) {
            const existingReview = await Review.findOne({
                booking: currentBooking._id,
            });

            if (!existingReview) {
                booking = currentBooking;
                break;
            }
        }

        if (!booking) {
            return res.status(400).json({
                message:
                    "You have already reviewed all your completed bookings for this listing",
            });
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found",
            });
        }

        const review = new Review({ 
            booking: booking._id,
            listing: listing._id,
            guest: req.user.id,
            host: listing.host,
            ratings,
            comment: comment.trim(),
        });

        await review.save();

        await updateListingRating(listing._id);

        return res.status(201).json({
            message: "Review created successfully",
            review,
        });
    } catch (error) {
        console.error("Create review error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: "You have already reviewed this booking",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

const getListingReviews = async (req, res) => {
    try {
        const { listingId } = req.params;

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({
                message: "Listing not found",
            });
        }

        const reviews = await Review.find({
            listing: listingId,
        })
            .populate("guest", "username")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: reviews.length,
            avgRating: listing.avgRating,
            reviewCount: listing.reviewCount,
            reviews,
        });
    } catch (error) {
        console.error("Get reviews error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid listing ID",
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

const replyToReview = async (req, res) => {
    try {
        const { text } = req.body;
        const { reviewId } = req.params;

        if (!text?.trim()) {
            return res.status(400).json({
                message: "Reply text is required",
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        if (review.host.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the host can reply to this review",
            });
        }

        review.hostReply = {
            text: text.trim(),
            repliedAt: new Date(),
        };

        await review.save();

        return res.status(200).json({
            message: "Reply added successfully",
            review,
        });
    } catch (error) {
        console.error("Review reply error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

const editReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { ratings, comment } = req.body;

        if (!ratings || !comment?.trim()) {
            return res.status(400).json({
                message: "Please provide ratings and comment",
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        if (review.guest.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the original reviewer can edit this review",
            });
        }

        review.ratings = ratings;
        review.comment = comment.trim();

        await review.save();

        await updateListingRating(review.listing);

        return res.status(200).json({
            message: "Review updated successfully",
            review,
        });
    } catch (error) {
        console.error("Edit review error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
}; 

const updateListingRating = async (listingId) => {
    const listing = await Listing.findById(listingId);

    if (!listing) {
        return;
    }

    const reviews = await Review.find({
        listing: listingId,
    });

    const totalRating = reviews.reduce(
        (sum, review) => sum + review.overallRating,
        0
    );

    const avgRating =
        reviews.length > 0 ? totalRating / reviews.length : 0;

    listing.avgRating = Math.round(avgRating * 10) / 10;
    listing.reviewCount = reviews.length;

    await listing.save();
};

module.exports = {
    createReview,
    getListingReviews,
    replyToReview,
    editReview,
};
