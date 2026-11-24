
// const express = require("express");
// const authController = require("../controllers/authController");
// const router = express.Router();



// router.post("/signup" , authController.signup);
// router.post("/login" , authController.login);


// module.exports = router;

const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);

router.get("/test-auth", authMiddleware, (req, res) => {
    res.json({
        message: "Authentication working",
        user: req.user
    });
});

module.exports = router;