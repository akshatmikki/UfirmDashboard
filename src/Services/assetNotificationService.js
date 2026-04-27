// services/assetNotificationService.js

const BASE_URL = "https://api.urest.in:8096/api/Asset";
// const BASE_URL = "https://api.urest.in:8096/api/Asset";

export const fetchAssetNotifications = async (propertyId) => {
    if (!propertyId || propertyId === 0) {
        console.warn('Property ID is invalid:', propertyId);
        return [];
    }

    const url = `${BASE_URL}/GetAssetNotifications?propertyId=${propertyId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Asset notification API error:', response.status, response.statusText);
            return [];
        }

        const data = await response.json();

        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.warn('Asset notification data is not an array:', data);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error fetching asset notifications:', error);
        return [];
    }
};

export const sendAssetResponse = async (responseData) => {
    const apiUrl = 'https://api.urest.in:8096/FMAssetResponse';
    // const apiUrl = 'https://api.urest.in:8096/FMAssetResponse';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(responseData),
        });

        if (!response.ok) {
            throw new Error('Failed to send asset response');
        }

        return true;
    } catch (error) {
        console.error('Error sending asset response:', error);
        throw error;
    }
}; 
