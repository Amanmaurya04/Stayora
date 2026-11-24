const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperienceBooking",
      required: true,
      unique: true,
    },

    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
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
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },

  {
    timestamps: true,
  },

);

module.exports = mongoose.model("ExperienceReview", reviewSchema);