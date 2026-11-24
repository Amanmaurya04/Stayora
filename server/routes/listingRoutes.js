const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const authMiddleware = require("../middleware/authMiddleware");
const hostMiddleware = require("../middleware/hostMiddleware");
const ownershipMiddleware = require("../middleware/ownershipMiddleware");

const {
    createListing,
    allListings,
    viewListing,
    editListing,
    deleteListing,
    getMyListings,
} = require("../controllers/listingController");


router.post(
    "/",
    authMiddleware,
    upload.array("images", 10),
    createListing
);


router.get("/", allListings);


router.get(
    "/my-listings",
    authMiddleware,
    getMyListings
);

router.get(
    "/:listingId",
    viewListing
);


router.put(
    "/:id",
    authMiddleware,
    hostMiddleware,
    ownershipMiddleware,
    upload.array("images", 10),
    editListing
);


router.delete(
    "/:id",
    authMiddleware,
    hostMiddleware,
    ownershipMiddleware,
    deleteListing
);

module.exports = router;
