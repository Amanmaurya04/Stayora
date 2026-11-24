import api from "./api";

export const getMyProfile = async () => {
    const response = await api.get("/user/me");
    return response.data;
};

export const getMyBookings = async () => {
    const response = await api.get("/user/my-bookings");
    return response.data;
};

export const cancelStayBooking = async (bookingId) => {
    const response = await api.patch(
        `/bookings/${bookingId}/cancel`
    );

    return response.data;
};

export const cancelExperienceBooking = async (bookingId) => {
    const response = await api.patch(
        `/experience-bookings/${bookingId}/cancel`
    );

    return response.data;
};
