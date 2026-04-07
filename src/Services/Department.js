import axios from "axios";

const BASE_URL = "https://api.urest.in:8096/api/clientmaster";

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
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.response?.data) {
    throw new Error(JSON.stringify(error.response.data));
  } else {
    throw new Error("Something went wrong");
  }
};

//
// ✅ GET ALL DEPARTMENTS
//
export const getAllDepartments = async () => {
  try {
    const response = await api.get("/allDepartment");
    return response.data || [];
  } catch (error) {
    handleApiError(error);
  }
};

//
// ✅ CREATE DEPARTMENT
//
export const createDepartment = async (data) => {
  try {
    const response = await api.post("/department", data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

//
// ✅ UPDATE DEPARTMENT
//
export const updateDepartment = async (id, data) => {
  try {
    const response = await api.put(`/department/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

//
// ✅ DELETE DEPARTMENT
//
export const deleteDepartment = async (id) => {
  try {
    const response = await api.delete(`/department/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};