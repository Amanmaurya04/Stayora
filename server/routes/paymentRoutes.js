
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createOrder,
    verifyPayment,
    webhook,
} = require("../controllers/paymentController");

// IMPORTANT: Keep this route before router.use(express.json()).
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    webhook
);

// Parse JSON for the other payment routes.
router.use(express.json());

router.post(
    "/create-order",
    authMiddleware,
    createOrder
);

router.post(
    "/verify-payment",
    authMiddleware,
    verifyPayment
);

module.exports = router;
















// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const { createOrder, verifyPayment, webhook } = require("../controllers/paymentController");

// router.post("/create-order" , authMiddleware , createOrder);
// router.post("/verify-payment" , authMiddleware , verifyPayment);
// router.post("/webhook", webhook);

// module.exports = router;









// const express = require("express");

// const router = express.Router();

// const {
//     createOrder,
//     verifyPayment,
//     webhook,
// } = require("../controllers/paymentController");

// router.post("/create-order", createOrder);

// router.post("/verify", verifyPayment);

// router.post("/webhook", webhook);

// module.exports = router;