
const BASE_URL = "https://api.urest.in:8096";
//const BASE_URL = "https://api.urest.in:8096";

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

export const fetchTaskDashboardCount = async ({
    propID,
    dteFr,
    dteTo,
    catID,
    subCatID,
    occurrence,
    assingedtoID,
    taskPriorityId,
} = {}) => {
    const normalizeToISODate = (value) => {
        const raw = String(value || "").trim();
        if (!raw) return "";
        // Already ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
        // Common UI format: DD-MM-YYYY
        const m1 = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
        // Common UI format: DD/MM/YYYY
        const m2 = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
        return raw;
    };

    const params = new URLSearchParams();

    if (propID !== null && propID !== undefined && Number(propID) > 0) params.append("propID", String(propID));
    const dteFrISO = normalizeToISODate(dteFr);
    const dteToISO = normalizeToISODate(dteTo);
    if (dteFrISO) params.append("dteFr", dteFrISO);
    if (dteToISO) params.append("dteTo", dteToISO);

    if (catID !== null && catID !== undefined && Number(catID) > 0) params.append("catID", String(catID));
    if (subCatID !== null && subCatID !== undefined && Number(subCatID) > 0) params.append("subCatID", String(subCatID));
    if (occurrence) params.append("occurrence", String(occurrence));
    if (assingedtoID !== null && assingedtoID !== undefined && Number(assingedtoID) > 0) params.append("assingedtoID", String(assingedtoID));
    if (taskPriorityId !== null && taskPriorityId !== undefined && Number(taskPriorityId) > 0) params.append("taskPriorityId", String(taskPriorityId));

    const url = `${BASE_URL}/TaskDashboardCount?${params.toString()}`;

    try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            console.error(`Failed to fetch task dashboard counts. Status: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching task dashboard counts:", error);
        return null;
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
