import api from "./api";

export const getListingReviews = (listingId) => {
    return api.get(`/reviews/listing/${listingId}`);
};

export const createReview = async(listingId , reviewData) => {
    const response = await api.post(`/reviews/listing/${listingId}`, reviewData);
return response.data;
};

export const replyToReview = (reviewId, text) => {
    return api.patch(`/reviews/${reviewId}/reply`, { text });
};

export const editReview = (reviewId, reviewData) => {
    return api.patch(`/reviews/${reviewId}`, reviewData);
};
