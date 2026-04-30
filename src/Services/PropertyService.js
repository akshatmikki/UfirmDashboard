// src/Services/PropertyService.js

const PROPERTY_API = "http://localhost:62929/api/propertymaster";

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
    const response = await fetch(`http://localhost:62929/api/property/${propertyId}`, {
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

    const text = await response.text();

    let message = text;

    // 🔥 TRY TO PARSE JSON RESPONSE
    try {
      const json = JSON.parse(text);
      message = json.Message || text;
    } catch {
      // not JSON → keep text
    }

    if (!response.ok) {
      throw new Error(message); // ✅ CLEAN ERROR
    }

    // 🔥 If success response is JSON, parse it
    try {
      return JSON.parse(text);
    } catch {
      return message;
    }

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

    const text = await response.text();

    let message = text;

    // 🔥 TRY TO PARSE JSON
    try {
      const json = JSON.parse(text);
      message = json.Message || text;
    } catch {
      // not JSON → keep text
    }

    if (!response.ok) {
      throw new Error(message); // ✅ CLEAN MESSAGE ONLY
    }

    return message;

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
