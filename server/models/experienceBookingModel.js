 const mongoose = require("mongoose");

const experienceBookingSchema = new mongoose.Schema(
  {
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experience",
      required: true,
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    refundStatus: {
    type: String,
    enum: ["not_requested", "processing", "processed", "failed"],
    default: "not_requested"
},

razorpayRefundId: {
    type: String,
    default: null
},

razorpayOrderId : {
  type:String,
},

razorpayPaymentId:{
  type:String,
},

razorpaySignature:{
  type:String,
},

  },
  { timestamps: true },
);

module.exports = mongoose.model("ExperienceBooking", experienceBookingSchema);
