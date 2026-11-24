const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
        },

        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
            index: true,
        },

        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        ratings: {
            cleanliness: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            accuracy: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            checkIn: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            communication: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            location: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
            value: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
        },

        overallRating: {
            type: Number,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        hostReply: {
            text: {
                type: String,
                trim: true,
                maxlength: 1000,
            },
            repliedAt: Date,
        },
    },
    { timestamps: true }
);

reviewSchema.pre("save", function () {
    const ratings = this.ratings;

    const values = [
        ratings.cleanliness,
        ratings.accuracy,
        ratings.checkIn,
        ratings.communication,
        ratings.location,
        ratings.value,
    ];

    const average = 
        values.reduce((sum, rating) => sum + rating, 0) /
        values.length;

    this.overallRating = Math.round(average * 10) / 10;
});

module.exports = mongoose.model("Review", reviewSchema);
