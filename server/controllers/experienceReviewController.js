
const ExperienceReview = require("../models/experienceReviewModel");
const ExperienceBooking = require("../models/experienceBookingModel");
const Experience = require("../models/experienceModel");

// CREATE EXPERIENCE REVIEW
const createReview = async (req, res) => {
    try {
        const { ratings, comment } = req.body;
        const { experienceId } = req.params;

        // 1. Validate the input
        const rating = Number(ratings);

        if (
            ratings === undefined ||
            ratings === null ||
            ratings === "" ||
            !Number.isFinite(rating) ||
            rating < 1 ||
            rating > 5 ||
            !Number.isInteger(rating) ||
            typeof comment !== "string" ||
            !comment.trim()
        ) {
            return res.status(400).json({
                message: "Please provide a valid rating (1-5) and comment",
            });
        }

        // 2. Find the experience
        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

    
        const bookings = await ExperienceBooking.find({
    guest: req.user.id,
    experience: experienceId,
    status: { $in: ["confirmed", "completed"] },
}).sort({ createdAt: -1 });

        if (bookings.length === 0) {
            return res.status(400).json({
                message:
                    "You need a confirmed booking to review this experience",
            });
        }

        // 4. Find a booking that has not been reviewed
        let booking = null;

        for (const currentBooking of bookings) {
            const existingReview = await ExperienceReview.findOne({
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
                    "You have already reviewed all your confirmed bookings for this experience",
            });
        }

        // 5. Create the review
        const review = new ExperienceReview({
            booking: booking._id,
            experience: experience._id,
            guest: req.user.id,
            host: experience.host,
            ratings: rating,
            comment: comment.trim(),
        });

        await review.save();

        // 6. Update the experience's average rating
        await updateExperienceRating(experience._id);

        // 7. Send the response
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

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};


// LIST EXPERIENCE REVIEWS
const listExperienceReview = async (req, res) => {
    try {
        const { experienceId } = req.params;

        if (!experienceId) {
            return res.status(400).json({
                message: "Please provide experienceId",
            });
        }

        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found",
            });
        }

        const allReviews = await ExperienceReview.find({
            experience: experienceId,
        })
            .populate("guest", "username")
            .sort({ createdAt: -1 });

        // An experience with no reviews is still valid
        return res.status(200).json({
            allReviews,
            reviewCount: allReviews.length,
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid experience ID",
            });
        }

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};


// UPDATE EXPERIENCE AVERAGE RATING
const updateExperienceRating = async (experienceId) => {
    const experience = await Experience.findById(experienceId);

    if (!experience) {
        return;
    }

    const reviews = await ExperienceReview.find({
        experience: experienceId,
    });

    const totalRating = reviews.reduce(
        (sum, review) => sum + Number(review.ratings),
        0
    );

    const avgRating =
        reviews.length > 0 ? totalRating / reviews.length : 0;

    experience.avgRating = Math.round(avgRating * 10) / 10;
    experience.reviewCount = reviews.length;

    await experience.save();
};


module.exports = {
    createReview,
    listExperienceReview,
    updateExperienceRating,
};
