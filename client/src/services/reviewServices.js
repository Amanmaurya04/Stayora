// import api from "./api";


// export const getListingReviews = (id) =>{
//     return api.post(`/reviews/listing/${id}`)
// };


// export const createReview = (reviewData) =>{
//     return api.post("/reviews" , reviewData);
// }








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
