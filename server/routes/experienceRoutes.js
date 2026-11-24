const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middleware/upload")

const {createExperience , allExperiences, getExperience, editExperience} = require("../controllers/experienceController");

const authMiddleware = require("../middleware/authMiddleware");
const hostMiddleware = require("../middleware/hostMiddleware")
const experienceOwnershipMiddleware = require("../middleware/experienceOwnershipMiddleware")


router.post("/",upload.array("images", 10) , authMiddleware , createExperience);
router.get("/", authMiddleware , allExperiences)
router.get("/:id", authMiddleware, getExperience )
router.put("/:id",authMiddleware,hostMiddleware,experienceOwnershipMiddleware,upload.array("images", 10), editExperience);


module.exports = router;
