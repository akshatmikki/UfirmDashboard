// src/services/FacilityService.js
import axios from "axios";

// Reset Password Service
const API_BASE_URL = "http://localhost:62929/api/facilitymember";

export const resetPassword = async (FacilityMemberId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/reset-password`,
      { FacilityMemberId },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error.response?.data || { Success: false, Message: "Server Error" };
  }
};

const FacilityService = {
  resetPassword,
};

// Facility Member Service
const BASE_URL = "https://api.urest.in:8096/api/UfirmEmployee";

export const FacilityMemberService = {
  getFacilityMembers: async (propertyId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/get-FacilityMembers?propertyId=${propertyId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "omit", // instead of withCredentials: false
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch facility members:", error);
      throw error;
    }
  },

  getFacilityMemberById: async (facilityMemberId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/get-FacilityMembers/${facilityMemberId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "omit",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch facility member:", error);
      throw error;
    }
  },
};

// Employee Services
const EMPLOYEE_API_BASE_URL = "https://api.urest.in:8096/api/employee";

export const createEmployee = async (employeeData) => {
  try {
    const response = await axios.post(
      `${EMPLOYEE_API_BASE_URL}/create`,
      employeeData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

export const getEmployeesByOffice = async (officeId) => {
  try {
    const response = await axios.get(
      `${EMPLOYEE_API_BASE_URL}/getByOffice/${officeId}`,
      {
        headers: { Accept: "application/json" },
        withCredentials: false,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching employees by office:", error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (employeeId, data) => {
  const response = await fetch(`${EMPLOYEE_API_BASE_URL}/update/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update employee");
  return response.json();
};

// Delete employee
export const deleteEmployee = async (employeeId) => {
  const response = await fetch(`${EMPLOYEE_API_BASE_URL}/delete/${employeeId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete employee");
  return response.json();
};

export default FacilityService;
