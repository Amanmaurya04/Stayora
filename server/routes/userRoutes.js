const express = require("express");
const router = express.Router();

const {getMyProfile, getMyBookings, updateMyProfile, changePassword  } =require("../controllers/userController")
const authMiddleware =require("../middleware/authMiddleware");


router.get("/me", authMiddleware, getMyProfile );
router.patch("/me" , authMiddleware, updateMyProfile);
router.patch("/change-password", authMiddleware, changePassword);
router.get("/my-bookings", authMiddleware, getMyBookings);


module.exports = router;