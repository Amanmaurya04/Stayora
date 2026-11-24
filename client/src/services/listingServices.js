import api from "./api";

export const getAllListings = (query = {}) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            return;
        }

        if (typeof value === "string" && value.trim() === "") {
            return;
        }

        params.append(key, String(value));
    });

    const queryString = params.toString();

    return api.get(
        queryString ? `/listings?${queryString}` : "/listings"
    );
};

export const createListing = async (formData) => {
    try {
        const response = await api.post("/listings", formData);

        return response.data;
    } catch (error) {
        console.error("Error creating listing:", error);
        throw error;
    }
};

export const getListingById = (listingId) => {
    return api.get(`/listings/${listingId}`);
};


export const editListing = (listingId, listingData) => {
    return api.put(`/listings/${listingId}`, listingData);
};
