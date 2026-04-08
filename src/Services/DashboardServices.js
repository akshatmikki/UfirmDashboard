
const BASE_URL = "https://api.urest.in:8096";
//const BASE_URL = "http://localhost:62929";

export const fetchSubCatTaskCounts = async (propertyId, fromDate, toDate) => {
    const url = `${BASE_URL}/GetAllTaskStatusBySubCat?propId=${propertyId}&dateFrom=${fromDate}&dateTo=${toDate}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch subcategory task counts. Status: ${response.status}`);
            return {};
        }
        return await response.json();  // Returns the dictionary as-is
    } catch (error) {
        console.error(`Error fetching subcategory task counts:`, error);
        return {};
    }
};

export const fetchAssetServiceRecords = async (
    propertyId,
    startDate = null,
    endDate = null,
    category
) => {
    const params = new URLSearchParams();
    params.append("propertyId", propertyId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (category) params.append("category", category);

    const url = `${BASE_URL}/api/assets/service-records?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch ${category} service records. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error fetching ${category} service records:`, error);
        return [];
    }
};
