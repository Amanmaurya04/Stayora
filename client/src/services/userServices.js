// import api from "./api";

// export const getMyProfile = async () =>{
// const response = await api.get("/user/me");
// return response.data;

// };


// export const getMyBookings = async () => {
//     const response = await  api.get("/user/my-bookings");
//     return response.data;
// }















import api from "./api";

export const getMyProfile = async () => {
    const response = await api.get("/user/me");
    return response.data;
};

export const getMyBookings = async () => {
    const response = await api.get("/user/my-bookings");
    return response.data;
};

// Cancel a stay booking
export const cancelStayBooking = async (bookingId) => {
    const response = await api.patch(
        `/bookings/${bookingId}/cancel`
    );

    return response.data;
};

// Cancel an experience booking
export const cancelExperienceBooking = async (bookingId) => {
    const response = await api.patch(
        `/experience-bookings/${bookingId}/cancel`
    );

    return response.data;
};
