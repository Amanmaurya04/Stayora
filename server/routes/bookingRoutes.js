
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createBooking,
    getMyBookings,
    cancelBooking,
    getHostBookings,
    getSingleBooking,
} = require("../controllers/bookingController");

router.post("/", authMiddleware, createBooking);

router.get("/host", authMiddleware, getHostBookings);

router.get("/my-bookings", authMiddleware, getMyBookings);

router.patch(
    "/:bookingId/cancel",
    authMiddleware,
    cancelBooking
);

router.get("/:bookingId", authMiddleware, getSingleBooking);

module.exports = router;






















// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   createBooking,
//   getMyBookings,
//   cancelBooking,
//   getHostBookings,
//   getSingleBooking,
// } = require("../controllers/bookingController");

// router.post("/", authMiddleware, createBooking);

// router.get("/host" , authMiddleware , getHostBookings);

// router.get("/my-bookings", authMiddleware, getMyBookings);

// router.patch("/:bookingId/cancel", authMiddleware, cancelBooking);

// router.get("/:bookingId" , authMiddleware , getSingleBooking);

// module.exports = router;
