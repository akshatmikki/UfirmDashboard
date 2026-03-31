//const API_URL = 'http://localhost:62929/';
 const API_URL = 'https://api.urest.in:8096/';

export const getFrequencyList = async (propertyId = null) => {
    try {
        const hasPropertyId = propertyId !== null && propertyId !== undefined && Number(propertyId) > 0;
        const url = hasPropertyId
            ? `${API_URL}api/master/getAllFrequency?propertyId=${encodeURIComponent(Number(propertyId))}`
            : `${API_URL}api/master/getAllFrequency`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Ensures correct response format
            }
        });

        if (!response.ok) {
            // More detailed error message
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid response format: Expected an array');
        }

        return data;
    } catch (error) {
        console.error('Error fetching frequency list:', error.message);
        return []; // Return an empty array to avoid breaking the UI
    }
};

const buildFrequencyPayload = (model = {}) => ({
    Id: Number(model.Id || 0),
    Name: String(model.Name || '').trim(),
    Fvalue: Number(model.Fvalue || 0),
    Funit: String(model.Funit || '').trim(),
    Occurence: model.Occurence ? String(model.Occurence).toUpperCase() : '',
    IsActive: model.IsActive !== false,
    PropertyId: model.PropertyId ?? null
});

const buildScheduleCategoryPayload = (model = {}) => ({
    ScheduleCategoryId: Number(model.ScheduleCategoryId || 0),
    CategoryName: String(model.CategoryName || '').trim(),
    Description: model.Description ?? null,
    IsActive: model.IsActive !== false,
    CreatedBy: Number(model.CreatedBy || 1),
    UpdatedBy: Number(model.UpdatedBy || 1)
});

export const addFrequency = async (model) => {
    const payload = buildFrequencyPayload(model);
    const response = await fetch(`${API_URL}api/master/addFrequency`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};

export const updateFrequency = async (id, model) => {
    const payload = buildFrequencyPayload({ ...model, Id: id });
    const response = await fetch(`${API_URL}api/master/updateFrequency/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};

export const deleteFrequency = async (id) => {
    const response = await fetch(`${API_URL}api/master/deleteFrequency/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};

export const getScheduleCategoryList = async () => {
    try {
        const response = await fetch(`${API_URL}api/scheduleCategory/getAll`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid response format: Expected an array');
        }

        return data;
    } catch (error) {
        console.error('Error fetching schedule category list:', error.message);
        return [];
    }
};

export const addScheduleCategory = async (model) => {
    const payload = buildScheduleCategoryPayload(model);
    const response = await fetch(`${API_URL}api/scheduleCategory/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};

export const updateScheduleCategory = async (id, model) => {
    const payload = buildScheduleCategoryPayload({ ...model, ScheduleCategoryId: id });
    const response = await fetch(`${API_URL}api/scheduleCategory/update/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};

export const deleteScheduleCategory = async (id) => {
    const response = await fetch(`${API_URL}api/scheduleCategory/delete/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${response.statusText}`);
    }

    return response;
};
