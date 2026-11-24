const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Booking = require('../models/bookingModel');
const ExperienceBooking = require("../models/experienceBookingModel");
const Listing = require("../models/listingModel");
const Experience = require("../models/experienceModel")

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });

  } catch (error) {
    console.log("Get profile error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  } 
};



const getMyBookings = async (req, res) => {
  try {
   
const stayBookings = await Booking.find({
  user:req.user.id,
})
.populate({
  path:"listing",
  select: "title images location propertyType pricePerNight",
})
.sort({createdAt:-1});


const experienceBookings = await ExperienceBooking.find({
  guest:req.user.id,
})
.populate({
  path:"experience",
  select:"title images location category pricePerPerson schedule",
})
.sort({createdAt:-1});


const formattedStay = stayBookings.map((booking) => {
  const listing = booking.listing;

return{
  _id:booking._id,
  type:'stay',

title:listing?.title || "Listing unavailable",
image: listing?.images?.[0] || null,
location: listing?.location || null,
propertyType: listing?.propertyType || null,

checkIn: booking.checkIn,
checkOut: booking.checkOut,
guest: booking.guest,

totalPrice: booking.totalPrice,
status: booking.status.toLowerCase(),
paymentStatus: booking.paymentStatus.toLowerCase(),

createtedAt: booking.createdAt


};


});


const formattedExperiences = experienceBookings.map((booking) => {
  const experience = booking.experience;

const selectedSlot = experience?.schedule?.find((slot) => 
slot._id.toString() === booking?.slotId.toString() 
);

return {
   _id: booking._id,
          type: "experience",

          title: experience?.title || "Experience unavailable",
          image: experience?.images?.[0] || null,
          location: experience?.location || null,
          category: experience?.category || null,

          slot: selectedSlot
            ? {
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                durationMinutes: selectedSlot.durationMinutes,
              }
            : null,

          participants: booking.participants,

          totalPrice: booking.totalPrice,
          status: booking.status.toLowerCase(),
          paymentStatus: booking.paymentStatus.toLowerCase(),

          createdAt: booking.createdAt,
}


})

 return res.status(200).json({
      message: "Bookings fetched successfully",

      stays: formattedStay,
      experiences: formattedExperiences,

      totalBookings:
        formattedStay.length + formattedExperiences.length,
    });





  } catch (error) {
    console.log("Get my bookings error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { username, email, contact } = req.body;

    if (!username || !email || !contact) {
      return res.status(400).json({
        message: "Please provide username, email and contact number",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return (
        res.status(404).json ({
          message: "User not found",
        })
      );
    }

    user.username = username;
    user.email = email;
    user.contact = contact;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.log("Update profile error:", error);
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password length must be atleast 6 charcaters",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Change password error", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  } 
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getMyBookings
};
