import api from "./api";

export const getAllExperience = (query = {}) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== null &&
      value !== undefined
    ) {
      params.append(key, value);
    }
  });

  const queryString = params.toString();

  return api.get(
    queryString
      ? `/experiences?${queryString}`
      : "/experiences"
  );
};

export const createExperience = async (formData) =>{
  try{
    const response = await api.post("/experiences", formData);
    return response.data;
  }
  catch(error){
    console.error("Error creating experiences:", error);
    throw error;
  }
};


export const getExperience = async (id) => {
  try{
    const response = await api.get(`/experiences/${id}`);
    return response.data;
  }
  catch(error){
    console.error("Error fetching data",error);
    throw error;
  }
}


export const getExperienceById = (experienceId) => {
    return api.get(`/experiences/${experienceId}`);
};

export const editExperience = (experienceId, experienceData) => {
    console.log("Edit URL:", `/experiences/${experienceId}`);

    return api.put(`/experiences/${experienceId}`, experienceData);
};
