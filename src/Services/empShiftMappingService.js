const BASE_URL = "https://api.urest.in:8096/api";

export const getEmployeesByOffice = async (propertyId) => {
  const res = await fetch(`${BASE_URL}/employee/getByOffice/${propertyId}`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
};

export const getShiftsByProperty = async (propertyId) => {
  const res = await fetch(`${BASE_URL}/ShiftMaster/getbypropertyid=${propertyId}`);
  if (!res.ok) throw new Error("Failed to fetch shifts");
  return res.json();
};

export const getMappingsByProperty = async (propertyId) => {
  const res = await fetch(`${BASE_URL}/EmpShiftMapping/getbypropertyid=${propertyId}`);
  if (!res.ok) throw new Error("Failed to fetch mappings");
  return res.json();
};

export const createMapping = async (payload) => {
  const res = await fetch(`${BASE_URL}/EmpShiftMapping/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create mapping");
  return res;
};

export const updateMapping = async (payload) => {
  const res = await fetch(`${BASE_URL}/EmpShiftMapping/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update mapping");
  return res;
};

export const deleteMapping = async (id) => {
  const res = await fetch(`${BASE_URL}/EmpShiftMapping/delete/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete mapping");
  return res;
};