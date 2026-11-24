import api from "./api";

// export const getAllListings = (query = {}) => {
//     const params = new URLSearchParams();

//     Object.entries(query).forEach(([key, value]) => {
//         if (value !== "" && value !== null && value !== undefined) {
//             params.append(key, value);
//         }
//     });

//     const queryString = params.toString();

//     return api.get(
//         queryString ? `/listings?${queryString}` : "/listings"
//     );
// };



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


// export const getSingleListing = async (id) => {
//     try {
//         const response = await api.get(`/listings/${id}`);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         throw error;
//     }
// };


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





















































