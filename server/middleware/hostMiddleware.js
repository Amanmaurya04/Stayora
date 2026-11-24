const User = require("../models/userModel");

const hostMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

console.log("Host middleware:");
console.log("User ID:", user._id);
console.log("isHost:", user.isHost);




        if (!user.isHost) {
            return res.status(403).json({
                message: "Only host can perform this action"
            });
        }

        next();

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};



module.exports = hostMiddleware;