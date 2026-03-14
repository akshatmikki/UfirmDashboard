import axios from "axios";

const API_BASE_URL = "https://api.urest.in:8096/api/EmployeeAccess";

export const getManagedEmployeesByIdentity = async (userName, userRole) => {
  if (!userName || !userRole) return null;
  const response = await axios.get(
    `${API_BASE_URL}/GetManagedEmployeesByIdentity`,
    {
      params: { userName, userRole },
      headers: { Accept: "application/json" },
      withCredentials: false
    }
  );
  return response?.data;
};
