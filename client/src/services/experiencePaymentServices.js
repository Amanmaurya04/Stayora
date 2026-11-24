
import api from "./api";

// Create Razorpay order for experience booking
export const createExperiencePaymentOrder = (bookingId) => {
    return api.post("/experience-payments/create-order", {
        bookingId,
    });
};

// Verify experience payment
export const verifyExperiencePayment = (paymentData) => {
    return api.post("/experience-payments/verify-payment", paymentData);
};
