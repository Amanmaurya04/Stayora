const Experience = require("../models/experienceModel")
const experienceOwnershipMiddleware = async (req, res, next) => {
  try {
    const experience = await Experience.findById(req.params.id);

    if (!experience) {
      return res.status(404).json({
        message: "Experience not found",
      });
    }

    if (!experience.host) {
      return res.status(500).json({
        message: "Experience has no host",
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

console.log("Ownership middleware:");
console.log("Experience host:", experience.host.toString());
console.log("Logged-in user:", req.user.id);



    if (experience.host.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You don't own this experience",
      });
    }

    req.experience = experience;

    next();
  } catch (error) {
    console.log("Ownership authorization error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};



module.exports = experienceOwnershipMiddleware;
