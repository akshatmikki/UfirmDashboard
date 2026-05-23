import axios from "axios";

//const API_BASE_URL = "http://localhost:62929/api/inventory";
API_BASE_URL = "https://api.urest.in:8096/api/inventory";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

const handleApiError = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    throw new Error(error.response.data.message);
  } else if (error.response && error.response.data) {
    throw new Error(JSON.stringify(error.response.data));
  } else {
    throw new Error("An unexpected error occurred.");
  }
};

export const getStockLedger = async (propertyId, options = {}) => {
  try {
    const response = await api.get(
      `/stock-ledger/${propertyId}`,
      {
        signal: options.signal,
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      return null;
    }

    console.error("GET_STOCK_LEDGER_ERROR", error);

    handleApiError(error);
  }
};