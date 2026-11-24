const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {createReview, getListingReviews, replyToReview, editReview} = require("../controllers/reviewController")

router.post("/listing/:listingId", authMiddleware, createReview );
router.get("/listing/:listingId", getListingReviews);
router.patch("/:reviewId/reply", authMiddleware, replyToReview);
router.patch("/:reviewId", authMiddleware, editReview);

module.exports = router;