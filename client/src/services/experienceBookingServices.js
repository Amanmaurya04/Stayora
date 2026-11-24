import api from "./api";

export const createExperienceBooking = (bookingData) => {
    return api.post("/experience-bookings", bookingData);
};

export const getMyExperienceBookings = () => {
    return api.get("/experience-bookings/my-bookings");
};

export const getSingleExperienceBooking = (bookingId) => {
    return api.get(`/experience-bookings/my-booking/${bookingId}`);
};

export const cancelExperienceBooking = (bookingId) => {
    return api.patch(`/experience-bookings/${bookingId}/cancel`);
};
