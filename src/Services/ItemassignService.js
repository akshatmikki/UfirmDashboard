import axios from 'axios';

const API_BASE_URL = 'http://localhost:62929/api';
//const API_BASE_URL = 'https://api.urest.in:8096/api';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

const handleApiError = (error) => {
    if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
    } else if (error.response && error.response.data) {
        throw new Error(JSON.stringify(error.response.data));
    } else {
        throw new Error('An unexpected error occurred.');
    }
};

export const getItemSpecification = async () => {
    try {
        const response = await api.get(`/itemmaster/getItem`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getItemSpecificationName = async (name) => {
    try {
        const response = await api.get(`/itemmaster/getItemByName/${name}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ✅ Fetch specifications by itemId
export const getItemSpecificationsByItemId = async (itemId) => {
    try {
        const response = await api.get(`/itemmaster/getSpecificationsByItemId/${itemId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createItemSpecification = async (ItemSpecification) => {
    try {
        const response = await api.post('/itemmaster/postitem', ItemSpecification);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getItemAssigned = async (propertyId) => {
    try {
        const response = await api.get(`/itemspecifications/getAll/propertyId/${propertyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createItemAssigned = async (ItemAssigned) => {
    try {
        const response = await api.post('/itemspecifications/createMultiple', ItemAssigned);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateItemAssigned = async (id, ItemAssigned) => {
    try {
        const response = await api.put(`/itemspecifications/update/${id}`, ItemAssigned);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteItemAssigned = async (id) => {
    try {
        const response = await api.delete(`/itemspecifications/delete/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const ApproveItemAssigned = async (id) => {
    try {
        const response = await api.put(`/itemspecifications/approve/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updatePOStatus = async (ids) => {
    try {
        const response = await api.put(
            `/itemspecifications/updatePOStatus`,
            ids
        );

        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};