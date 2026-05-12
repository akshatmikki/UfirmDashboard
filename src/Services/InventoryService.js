import axios from 'axios';

//const API_BASE_URL = 'http://localhost:62929/api/inventory';
const API_BASE_URL = 'https://api.urest.in:8096/api/inventory';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

const handleApiError = (error) => {
    const errorData = error.response?.data;
    if (errorData) {
        const message = errorData.message || errorData.Message;
        if (message) throw new Error(message);
        throw new Error(JSON.stringify(errorData));
    }
    throw new Error('An unexpected error occurred.');
};
// ========== CATEGORY ==========
export const getCategories = async (propertyId) => {
    try {
        const response = await api.get(`/categories?propertyId=${propertyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getCategoryById = async (id) => {
    try {
        const response = await api.get(`/category/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createCategory = async (category) => {
    try {
        const response = await api.post('/category', category);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateCategory = async (id, category) => {
    try {
        const response = await api.put(`/category/${id}`, category);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await api.delete(`/category/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const PendingApprovalCategory = async (propertyId) => {
    try {
        const response = await api.get(`categories/pendingApproval?propertyId=${propertyId}`);
        return response.data;
    }
    catch (error) {
        handleApiError(error);
    }
}

// ========== ITEM ==========
export const getAllItems = async (propertyId) => {
    try {
        const response = await api.get('/items', { params: { propertyId } });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getItemById = async (id) => {
    try {
        const response = await api.get(`/item/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createItem = async (item) => {
    try {
        const response = await api.post('/item', item);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateItem = async (id, item) => {
    try {
        const response = await api.put(`/item/${id}`, item);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteItem = async (id) => {
    try {
        const response = await api.delete(`/item/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const PendingApprovalItem = async (propertyId) => {
    try {
        const response = await api.get(`items/pendingApproval?propertyId=${propertyId}`);
        return response.data;
    }
    catch (error) {
        handleApiError(error);
    }
};

export const fetchFilteredItems = async (propertyId, CategoryId) => {
    try {
        const response = await api.get(`/items?propertyId=${propertyId}&categoryId=${CategoryId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching items:', error);
    }
};

export const getItemsByCategory = async (propertyId, categoryId) => {
    try {
        const response = await api.get(`/items-by-category?propertyId=${propertyId}&categoryId=${categoryId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// ========== VENDOR ==========
export const getVendors = async (propertyId) => {
    try {
        const response = await api.get(`/vendors?propertyId=${propertyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const getVendorById = async (id) => {
    try {
        const response = await api.get(`/vendor/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createVendor = async (vendor) => {
    try {
        const response = await api.post('/vendor', vendor, {
            headers: {
                // For FormData, let axios/browser handle the Content-Type
                ...(vendor instanceof FormData ? { 'Content-Type': null } : { 'Content-Type': 'application/json' }),
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const updateVendor = async (id, vendor) => {
    try {
        const response = await api.put(`/vendor/${id}`, vendor, {
            headers: {
                ...(vendor instanceof FormData ? { 'Content-Type': undefined } : { 'Content-Type': 'application/json' }),
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const deleteVendor = async (id) => {
    try {
        const response = await api.delete(`/vendor/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const PendingApprovalVendor = async (propertyId) => {
    try {
        const response = await api.get(`vendors/pendingApproval?propertyId=${propertyId}`);
        return response.data;
    }
    catch (error) {
        handleApiError(error);
    }
};

// ========== Rate Card ==========

export const getRateCard = async (propertyId) => {
    try {
        const response = await api.get(`/ratecards?propertyId=${propertyId}`);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const createRateCard = async (ratecard) => {
    try {
        const response = await api.post('/ratecard', ratecard);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const fetchFilteredRate = async (propertyId, CategoryId, ItemId, VendorId) => {
    try {
        const response = await api.get(`ratecards?propertyId=${propertyId}&categoryId=${CategoryId}&itemId=${ItemId}&vendorId=${VendorId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Rate Card:', error);
    }
};

// ========== Purchase Order ==========

export const createPurchaseOrder = async (PurchaseOrder) => {
    try {
        const response = await api.post(`/CreatePurchaseOrders`, PurchaseOrder);
        return response.data;
    } catch (error) {
        console.error('Error fetching Purchase Order:', error);
    }
};

export const getPurchaseOrder = async (propertyId) => {
    try {
        const response = await api.get(`/GetGroupedPurchaseOrderDetails?propertyId=${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Purchase Order:', error);
    }
};

// ========== Stock ==========

export const getStock = async (propertyId) => {
    try {
        const response = await api.get(`/GetStock?propId=${propertyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Purchase Order:', error);
    }
};

// ✅ ADD STOCK QUANTITY (POST API)
export const addStockQuantity = async (payload) => {
    try {
        const response = await api.post('/stock', payload);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const uploadStockExcel = async (formData) => {
    try {
        const response = await api.post('/UploadStockExcel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};
