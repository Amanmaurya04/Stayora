const mongoose = require("mongoose");

const scheduleSlotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    totalSpots: { type: Number, required: true, min: 1 },
    spotsLeft: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "adventure",
        "wellness",
        "tour",
        "art",
        "sports",
        "nightlife",
        "other",
      ],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one image is required",
      },
    },
    pricePerPerson: { type: Number, required: true, min: 0 },
    location: {
      address: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      latitude: Number,
      longitude: Number,
    },
    schedule: {
      type: [scheduleSlotSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one schedule slot is required",
      },
    },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

experienceSchema.index({
  title: "text",
  description: "text",
  "location.city": "text",
});

module.exports = mongoose.model("Experience", experienceSchema);
