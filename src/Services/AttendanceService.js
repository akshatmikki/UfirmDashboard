import axios from 'axios';

const API_BASE_URL = 'https://api.urest.in:8096/api/attendance';
//const API_BASE_URL = 'https://api.urest.in:8096/api/attendance';
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

export const getAttendance = async (
    id,
    fromDate,
    toDate,
    type = "PROPERTY" // default keeps backward compatibility
) => {
    try {
        const url =
            type === "CLIENT"
                ? `/monthly-summary-by-client?ClientID=${id}&FromDate=${fromDate}&ToDate=${toDate}`
                : `/monthly-summary?PropertyId=${id}&FromDate=${fromDate}&ToDate=${toDate}`;

        const response = await api.get(url);
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};


const BASE_URL = "https://api.urest.in:8096/api/UfirmEmployee";

export const getFacilityMembers = async (propertyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/get-FacilityMembers`, {
      params: { propertyId, },
      withCredentials: false
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching facility member names:", error);
    throw error;
  }
};

// ✅ Get All Locations
export const getAllLocations = async () => {
  try {
    const response = await axios.get("https://api.urest.in:8096/api/get-AllPropertyNames", { withCredentials: false });
    return response.data.Names || [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
};

// ✅ Save Manual Attendance
export const saveManualAttendance = async (attendanceData) => {
  try {
    const response = await axios.post(
      "https://api.urest.in:8096/api/attendance/manualattendance/add",
      attendanceData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
};

// Get all manual attendance by property
export const getManualAttendanceByProperty = async (propertyId) => {
    try {
        const response = await fetch(
            `https://api.urest.in:8096/api/attendance/manualattendance/getall`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            }
        );
        if (!response.ok) throw new Error("Failed to fetch manual attendance");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getManualAttendanceByProperty:", error);
        return [];
    }
};

// ✅ Approve Attendance
export const processManualAttendance = async ({ id, approve, actionBy }) => {
  try {
    const response = await axios.post(
      `https://api.urest.in:8096/api/attendance/manualattendance/process`,
      {}, // empty body
      {
        params: { id, approve, actionBy },
        headers: { "Content-Type": "application/json" },
        withCredentials: false
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error processing manual attendance:", error);
    throw error;
  }
};

// ✅ Reject Attendance
export const rejectprocessManualAttendance = async ({ id, approve, actionBy, rejectionRemark }) => {
  try {
    const response = await axios.post(
      `https://api.urest.in:8096/api/attendance/manualattendance/process`,
      {}, // empty body
      {
        params: { id, approve, actionBy, rejectionRemark },
        headers: { "Content-Type": "application/json" },
        withCredentials: false
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting manual attendance:", error);
    throw error;
  }
};

