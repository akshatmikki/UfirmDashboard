// src/Services/PropertyService.js

const PROPERTY_API = "https://api.urest.in:8096/api/propertymaster";

// --------------------------------------------------
// GET ALL ACTIVE PROPERTIES
// --------------------------------------------------
export async function getAllProperties() {
  try {
    const response = await fetch(`${PROPERTY_API}/getall/active`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
}

// --------------------------------------------------
// GET PROPERTY BY ID (Updated API with Client + Services)
// --------------------------------------------------
export async function getPropertyById(propertyId) {
  try {
    const response = await fetch(`https://api.urest.in:8096/api/property/${propertyId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error("Error fetching property by ID:", error);
    throw error;
  }
}

// --------------------------------------------------
// CREATE PROPERTY
// Body must match PropertyMasterCreateDTO
// --------------------------------------------------
export async function createProperty(model) {
  try {
    const response = await fetch(`${PROPERTY_API}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
}

// --------------------------------------------------
// UPDATE PROPERTY
// Body must match PropertyMasterUpdateDTO
// --------------------------------------------------
export async function updateProperty(propertyId, model) {
  try {
    const response = await fetch(`${PROPERTY_API}/update/${propertyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
}

// --------------------------------------------------
// SOFT DELETE PROPERTY
// --------------------------------------------------
export async function deleteProperty(propertyId, updatedBy = null) {
  try {
    const url = updatedBy
      ? `${PROPERTY_API}/softdelete/${propertyId}?updatedBy=${updatedBy}`
      : `${PROPERTY_API}/softdelete/${propertyId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();

  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
}
