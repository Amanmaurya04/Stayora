const Listing = require("../models/listingModel");

const ownershipMiddleware = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    if (!listing.host) {
      return res.status(500).json({
        message: "Listing has no host",
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

console.log("Ownership middleware:");
console.log("Listing host:", listing.host.toString());
console.log("Logged-in user:", req.user.id);

    if (listing.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You don't own this listing",
      });
    }

    req.listing = listing;

    next();
  } catch (error) {
    console.log("Ownership authorization error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = ownershipMiddleware;
