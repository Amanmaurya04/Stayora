const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },


        propertyType: {
            type: String,
            required: true,
            enum:[
                "House",
                "Apartment",
                "Villa",
                "Hotel",
                "Guesthouse",
                "Hostel",
                "Cabin",
                "Cottage"
            ]
        },

        roomType: {
            type: String,
            required: true,
            enum: [
                "Entire place",
                "Private room",
                "Shared room"
            ]
        },

        location: {
           address:{
            type:String,
            required:true
           },
           city:{
             type:String,
            required:true
           },
           state:{
             type:String,
            required:true
           },
           country:{
             type:String,
            required:true
           },
           latitude:Number,
           longitude:Number

        },

        images: {
            type: [String],
            required: true
        },

        pricePerNight: {
            type: Number,
            required: true,
            min:0,
        },

        maxGuest: {
            type: Number,
            required: true,
            min:1
        },

        bedrooms: {
            type: Number,
            required: true,
            min:1
        },

        amenities: {
            type: [String],
            required: true
        },

        houseRules: {
            type: [String],
            required: true
        },

        

        avgRating: {
            type: Number,
            default: 0
        },

        reviewCount: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },

    {
        timestamps: true
    }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;