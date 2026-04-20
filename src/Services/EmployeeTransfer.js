import axios from "axios";

const BASE_URL = "https://api.urest.in:8096/api/employee";

// 🔹 Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// 🔹 Common Error Handler
const handleApiError = (error) => {
  if (error.response?.data?.Message) {
    throw new Error(error.response.data.Message);
  } else if (error.response?.data) {
    throw new Error(JSON.stringify(error.response.data));
  } else {
    throw new Error("Something went wrong");
  }
};

// ✅ SEARCH EMPLOYEES
export const searchEmployees = async (data) => {
  try {
    const response = await api.post("/search", data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// ✅ TRANSFER EMPLOYEES
export const transferEmployees = async (data) => {
  try {
    if (!data?.FacilityMemberIds?.length) {
      throw new Error("No employees selected");
    }

    const response = await api.post("/transfer", data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};