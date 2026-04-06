import axios from "axios";

const BASE_URL = "https://api.urest.in:8096/api/designations";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

// Common Error Handler
const handleApiError = (error) => {
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    } else if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data));
    } else {
        throw new Error("Something went wrong");
    }
};

// ✅ GET ALL
export const getAllDesignations = async () => {
    try {
        const res = await api.get("/GetAllDesignations");
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ✅ GET BY ID
export const getDesignationById = async (id) => {
    try {
        const res = await api.get(`/GetDesignationById/${id}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ✅ CREATE
export const createDesignation = async (data) => {
    try {
        const res = await api.post("/CreateDesignation", data);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ✅ UPDATE
export const updateDesignation = async (id, data) => {
    try {
        const res = await api.put(`/UpdateDesignation/${id}`, data);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ✅ DELETE
export const deleteDesignation = async (id) => {
    try {
        const res = await api.delete(`/DeleteDesignation/${id}`);
        return res.data;
    } catch (error) {
        handleApiError(error);
    }
};