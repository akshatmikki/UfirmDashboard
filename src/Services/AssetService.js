import axios from "axios";
const API_URL = 'https://api.urest.in:8096/';
 //const API_URL = 'https://api.urest.in:8096/';
export  const fetchAssets = async (propertyId = 0) => {
    try {
        const response = await fetch(`${API_URL}GetAssets?propertyId=${propertyId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching assets:', error);
        throw error;
    }
};

export const saveServiceRecord = async (formData) => {
  try {
    const response = await fetch(`${API_URL}api/Asset/SaveServiceRecord`, {
      method: "POST",
      body: formData, // <-- pass the form data directly
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving service record:", error);
    throw error;
  }
};

export const getServiceHistory=async (assetId)=>{
    try {
        const response = await fetch(`${API_URL}api/Asset/GetServiceHistory?assetId=${assetId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }catch (error) {
        console.error('Error getting service record:', error);
        throw error;
    }
}

export const saveAssetAMC = async (model) => {
  try {
    const response = await fetch(`${API_URL}ManageAssetAMC`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(model),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving asset AMC:", error);
    throw error;
  }
};
