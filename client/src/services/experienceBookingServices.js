
import api from "./api";

// Create experience booking
export const createExperienceBooking = (bookingData) => {
    return api.post("/experience-bookings", bookingData);
};

// Get logged-in user's experience bookings
export const getMyExperienceBookings = () => {
    return api.get("/experience-bookings/my-bookings");
};

// Get one experience booking
export const getSingleExperienceBooking = (bookingId) => {
    return api.get(`/experience-bookings/my-booking/${bookingId}`);
};

// Cancel experience booking
export const cancelExperienceBooking = (bookingId) => {
    return api.patch(`/experience-bookings/${bookingId}/cancel`);
};
