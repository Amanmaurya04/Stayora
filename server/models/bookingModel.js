const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
            index: true,
        },

        checkIn: {
            type: Date,
            required: true,
        },

        checkOut: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return this.checkIn && value > this.checkIn;
                },
                message: "Check-out must be after check-in",
            },
        },

        guests: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: "Guests must be a whole number",
            },
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Cancelled"],
            default: "Pending",
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending",
            required: true,
        },

        razorpayOrderId: {
            type: String,
            default: null,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
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

    },
    {
        timestamps: true,
    }
);

bookingSchema.index({
    listing: 1,
    status: 1,
    checkIn: 1,
    checkOut: 1,
});

bookingSchema.index(
    { razorpayOrderId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            razorpayOrderId: { $type: "string" },
        },
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
