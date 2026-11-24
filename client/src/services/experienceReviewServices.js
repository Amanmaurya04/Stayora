import api from "./api";

export const getExperienceReviews = (experienceId) => {
    return api.get(`reviews/experience/${experienceId}`);
};

export const createExperienceReview = (experienceId, reviewData) => {
    return api.post(`reviews/experience/${experienceId}`, reviewData);
};
