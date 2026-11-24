import api from "./api";

export const createExperiencePaymentOrder = (bookingId) => {
    return api.post("/experience-payments/create-order", {
        bookingId,
    });
};

export const verifyExperiencePayment = (paymentData) => {
    return api.post("/experience-payments/verify-payment", paymentData);
};
