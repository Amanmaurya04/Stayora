// const express = require("express");
// const router = express.Router();
// const { createReview, listExperienceReview } = require("../controllers/experienceReviewController")
// const authMiddleware = require("../middleware/authMiddleware");

// router.post("/" , authMiddleware , createReview);
// router.get("/:experienceId", listExperienceReview);
 


// module.exports = router;



const express = require("express");
const router = express.Router();

const {
    createReview,
    listExperienceReview
} = require("../controllers/experienceReviewController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/:experienceId", authMiddleware, createReview);

router.get("/:experienceId", listExperienceReview);

module.exports = router;