
import api from "./api";

export const createPaymentOrder = (bookingId) => {
    if (!bookingId) {
        throw new Error("Booking ID is required");
    }

    return api.post("/payments/create-order", {
        bookingId,
    });
};

export const verifyPayment = (paymentData) => {
    const {
        bookingId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = paymentData || {};

    if (
        !bookingId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    ) {
        throw new Error("Complete payment details are required");
    }

    return api.post("/payments/verify-payment", {
        bookingId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    });
};





















// import api from "./api";

// export const createPaymentOrder = (bookingId) => {
//     return api.post("/payments/create-order", {
//         bookingId,
//     });
// };

// export const verifyPayment = (paymentData) => {
//     return api.post(
//         "/payments/verify-payment",
//         paymentData
//     );
// };