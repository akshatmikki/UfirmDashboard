// src/services/clientService.js

const API_BASE = "https://api.urest.in:8096/api/clientmaster";

// --------------------------------------------------
// GET ALL CLIENTS
// --------------------------------------------------
export const getAllClients = async () => {
  const response = await fetch(`${API_BASE}/all`);
  if (!response.ok) throw new Error("Failed to fetch clients");
  return response.json();
};

// --------------------------------------------------
// CREATE CLIENT
// --------------------------------------------------
export const createClient = async (data) => {
  const response = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create client");
  }
  return response.json();
};

// --------------------------------------------------
// UPDATE CLIENT
// --------------------------------------------------
export const updateClient = async (id, data) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update client");
  }
  return response.json();
};

// --------------------------------------------------
// DELETE CLIENT (Soft Delete)
// --------------------------------------------------
export const deleteClient = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) throw new Error("Failed to delete client");
  return response.json();
};

// --------------------------------------------------
// GET SINGLE CLIENT BY ID (Optional)
// --------------------------------------------------
export const getClientById = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch client");
  return response.json();
};

// --------------------------------------------------
// GET CLIENT (UNIT) BY PROPERTY ID
// --------------------------------------------------
export const getClientByPropertyId = async (propertyId) => {
  const response = await fetch(
    `${API_BASE}/api/client/basic/getbyproperty/${propertyId}`
  );

  if (!response.ok) throw new Error("Failed to fetch client by property");
  return response.json();
};

// --------------------------------------------------
// GET PROPERTIES BY CLIENT (UNIT)
// --------------------------------------------------
export const getPropertiesByClientId = async (clientId) => {
  const response = await fetch(
    `https://api.urest.in:8096/api/propertymaster/getbyclient/${clientId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch properties by client");
  }

  return response.json();
};

// --------------------------------------------------
// GET ALL DEPARTMENTS
// --------------------------------------------------
export const getAllDepartments = async () => {
  const response = await fetch(`${API_BASE}/allDepartment`);

  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }

  return response.json();
};

// --------------------------------------------------
// DELETE SALARY GROUP (Soft Delete)
// --------------------------------------------------
export const deleteSalaryGroup = async (salaryGroupId) => {
  const response = await fetch(
    `https://api.urest.in:8096/api/salaryallowances/${salaryGroupId}`,
    {
      method: "DELETE",
      headers: {
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete salary group");
  }

  return response.json();
};