import axios from "axios";

//const API_BASE_URL = "http://localhost:62929/api/attendance";

const API_BASE_URL = "https://api.urest.in:8096/api/attendance";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

const handleApiError = (error) => {

    const errorData = error.response?.data;

    if (errorData) {

        const message =
            errorData.message ||
            errorData.Message;

        if (message) {
            throw new Error(message);
        }

        throw new Error(
            JSON.stringify(errorData)
        );
    }

    throw new Error(
        "An unexpected error occurred."
    );
};

// ==============================
// GET DEPARTMENTS
// ==============================

export const fetchDepartments = async (
    propertyId
) => {

    try {

        const response = await api.get(
            `/getDepartments?propertyId=${propertyId}`
        );

        return response.data;

    } catch (error) {

        handleApiError(error);
    }
};

// ==============================
// CREATE DEPARTMENT
// ==============================

export const createDepartment = async (
    data
) => {

    try {

        const response = await api.post(
            `/createDepartment`,
            data
        );

        return response.data;

    } catch (error) {

        handleApiError(error);
    }
};

// ==============================
// UPDATE DEPARTMENT
// ==============================

export const updateDepartment = async (
    data
) => {

    try {

        const response = await api.put(
            `/updateDepartment`,
            data
        );

        return response.data;

    } catch (error) {

        handleApiError(error);
    }
};

// ==============================
// DELETE DEPARTMENT
// ==============================

export const deleteDepartment = async (
    id
) => {

    try {

        const response = await api.delete(
            `/deleteDepartment?id=${id}`
        );

        return response.data;

    } catch (error) {

        handleApiError(error);
    }
};

// ==============================
// GET DEPARTMENT MASTER
// ==============================

export const fetchDepartmentMaster =
    async () => {

        try {

            const response = await api.get(
                `/getVisitorDepartmentMaster`
            );

            return response.data;

        } catch (error) {

            handleApiError(error);
        }
    };

// ==============================
// CREATE NEW MASTER DEPARTMENT
// ==============================

export const createDepartmentMaster =
    async (data) => {

        try {

            const response = await api.post(
                `/createVisitorDepartmentMaster`,
                data
            );

            return response.data;

        } catch (error) {

            handleApiError(error);
        }
    };