// src/Services/PayrollService.js
import axios from "axios";

const API_BASE_URL = "https://api.urest.in:8096/api/allowancedeductions";

export async function getAllowancesDeductions() {
  try {
    const response = await fetch(`${API_BASE_URL}/getall`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching allowance deductions:", error);
    throw error;
  }
}

export async function createAllowanceDeduction(model) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating allowance deduction:", error);
    throw error;
  }
}

export async function updateAllowanceDeduction(id, model) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating allowance deduction:", error);
    throw error;
  }
}

export async function deleteAllowanceDeduction(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting allowance deduction:", error);
    throw error;
  }
}

const SALARY_API_BASE_URL = "https://api.urest.in:8096/api/salaryallowances";

export async function getSalaryAllowancesByProperty(propertyId) {
  try {
    const response = await fetch(
      `${SALARY_API_BASE_URL}/byProperty/${propertyId}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching salary allowances:", error);
    throw error;
  }
}

// CLIENT ✅ NEW
export async function getSalaryAllowancesByClient(clientId) {
  const response = await fetch(
    `${SALARY_API_BASE_URL}/byClient/${clientId}`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) throw new Error("Failed to fetch SG by client");
  return response.json();
}

export async function deleteSalaryAllowance(salaryGroupId) {
  try {
    const response = await fetch(`${SALARY_API_BASE_URL}/${salaryGroupId}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting salary allowance:", error);
    throw error;
  }
}

export async function updateSalaryAllowance(model) {
  try {
    const response = await fetch(
      `${SALARY_API_BASE_URL}/update`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating salary allowance:", error);
    throw error;
  }
}

export async function createSalaryAllowance(model) {
  try {
    const response = await fetch(SALARY_API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating salary allowance:", error);
    throw error;
  }
}

/**
 * Get salary allowances by facility member ID
 * @param {number} facilityMemberId - The facility member ID
 * @returns {Promise<Object>} - Salary allowance data for the facility member
 */
export async function getSalaryAllowancesByFacilityMember(facilityMemberId) {
  try {
    const response = await fetch(
      `${SALARY_API_BASE_URL}/byFacilityMember/${facilityMemberId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "Failed to fetch salary allowances by facility member",
      error
    );
    throw error;
  }
}

export async function getFacilitySalaryConfig(propertyId) {
  try {
    const response = await fetch(
      `${SALARY_API_BASE_URL}/getFacilitySalaryConfig/${propertyId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch facility salary config", error);
    throw error;
  }
}

export async function deleteSalaryGroupFromFacilityMember(
  facilityMemberId,
  salaryGroupId
) {
  try {
    const url = `https://api.urest.in:8096/api/salaryallowances/removeSalaryGroup/${facilityMemberId}/${salaryGroupId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting salary group from facility member:", error);
    throw error;
  }
}

export async function assignSalaryGroupToFacilityMember(model) {
  try {
    const response = await fetch(
      "https://api.urest.in:8096/api/salaryallowances/assignSalaryGroup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error assigning salary group to facility member:", error);
    throw error;
  }
}

// --------------------------------------------------
// GET SALARY GROUPS BY DESIGNATION (Property Based)
// --------------------------------------------------
export async function getSalaryGroupsByDesignation(propertyId, designation) {
  try {
    const encodedDesignation = encodeURIComponent(designation);

    const response = await fetch(
      `https://api.urest.in:8096/api/salaryallowances/byDesignationFull/${propertyId}/${encodedDesignation}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch salary groups by designation:", error);
    throw error;
  }
}

export async function addLoanAdvance(loanAdvanceData) {
  try {
    const response = await fetch(
      `${SALARY_API_BASE_URL}/addLoanAdvance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        withCredentials: false,
        body: JSON.stringify(loanAdvanceData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to save loan advance", error);
    throw error;
  }
}


// Create a new loan for an employee
export async function createEmployeeLoan(requestData) {
  const url = "https://api.urest.in:8096/api/loan/create";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // returns {} on success
    return await response.json();
  } catch (error) {
    console.error("Failed to create loan:", error);
    throw error;
  }
}


// Get loan details for a specific employee
export async function getEmployeeLoan(employeeId) {
  const url = `https://api.urest.in:8096/api/loan/get/${employeeId}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch loan by employee:", error);
    throw error;
  }
}


//Generate Salary API Calls
const EMPLOYEE_API_BASE_URL = "https://api.urest.in:8096/api/employee";

export const getEmployeesByOffice = async (officeId) => {
  try {
    const response = await axios.get(`${EMPLOYEE_API_BASE_URL}/getByOffice/${officeId}`, { withCredentials: false });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch employees by officeId", error);
    throw error;
  }
};


// Location API Calls
export async function getCountries() {
  const response = await fetch("https://api.urest.in:8096/api/location/countries", {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch countries");
  return response.json();
}

export async function getStatesByCountry(countryId) {
  const response = await fetch(`https://api.urest.in:8096/api/location/states/${countryId}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch states");
  return response.json();
}


// Fetch PFT and LWF data
export async function getPftList() {
  const response = await fetch("https://api.urest.in:8096/api/master/pft", {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch PFT data");
  return response.json();
}

export async function getLwfList() {
  const response = await fetch("https://api.urest.in:8096/api/master/lwf", {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch LWF data");
  return response.json();
}

// Delete API
export async function deletePft(id) {
  const response = await fetch(`https://api.urest.in:8096/api/master/pft/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete PFT");
  return response.json();
}

export async function deleteLwf(id) {
  const response = await fetch(`https://api.urest.in:8096/api/master/lwf/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete LWF");
  return response.json();
}

// Create API
export async function addPft(pft) {
  const response = await fetch("https://api.urest.in:8096/api/master/pft/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pft),
  });
  if (!response.ok) throw new Error("Failed to add PFT");
  return response.json();
}

export async function addLwf(lwf) {
  const response = await fetch("https://api.urest.in:8096/api/master/lwf/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lwf),
  });
  if (!response.ok) throw new Error("Failed to add LWF");
  return response.json();
}

// Update API
export async function updatePft(id, pft) {
  const response = await fetch(`https://api.urest.in:8096/api/master/pft/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pft),
  });
  if (!response.ok) throw new Error("Failed to update PFT");
  return response.json();
}

export async function updateLwf(id, lwf) {
  const response = await fetch(`https://api.urest.in:8096/api/master/lwf/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lwf),
  });
  if (!response.ok) throw new Error("Failed to update LWF");
  return response.json();
}


// Get employee generated salaries for a given office ID
export async function getEmployeeGeneratedSalaryByOffice(officeId) {
  const response = await fetch(`https://api.urest.in:8096/api/employee/generatedSalary/${officeId}`, {
    method: "GET",
    headers: { "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch generated salaries");
  return await response.json();
}

// Get employee generated salary
export async function getEmployeeGeneratedSalaries(officeId) {
  const response = await fetch(`https://api.urest.in:8096/api/employee/generatedSalary/${officeId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });
  if (!response.ok) throw new Error("Failed to fetch generated salaries");
  return await response.json();
}

// POST to create generated salary entry
export async function createGeneratedSalary(employees) {
  const response = await fetch(
       "https://api.urest.in:8096/api/employee/generatedSalary",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(employees),
    }
  );

  if (!response.ok) throw new Error("Failed to create generated salary");
  return await response.json();
}

// DELETE to remove a generated salary entry by employee ID (FacilityMemberID)
export async function deleteGeneratedSalary(employeeId) {
  const response = await fetch(`https://api.urest.in:8096/api/employee/generatedSalary/${employeeId}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to delete generated salary');
  return await response.json();
}

export async function updateGeneratedSalary(employeeId, employee) {
  const response = await fetch(
    `https://api.urest.in:8096/api/employee/generatedSalary/${employeeId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(employee),
    }
  );

  if (!response.ok) throw new Error("Failed to update generated salary");
  return await response.json();
}

// ------------------------------
// NEW: Get Ungenerated Salary (Multiple Properties)
// ------------------------------
export const getUngeneratedSalaryByProperties = async (
  propertyIds = [],
  month,
  year
) => {
  if (!propertyIds.length) return [];

  const ids = propertyIds.join(",");

  const response = await fetch(
    `https://api.urest.in:8096/ungeneratedSalary?propertyIds=${ids}&month=${month}&year=${year}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch ungenerated salary");
  }

  return response.json();
};

// ------------------------------
// NEW: Get Generated Salary (Multiple Properties)
// ------------------------------
export const getGeneratedSalaryByProperties = async (
  propertyIds = []
) => {
  if (!propertyIds.length) return [];

  const ids = propertyIds.join(",");

  const response = await fetch(
    `https://api.urest.in:8096/api/employee/generatedSalary?propertyIds=${ids}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch generated salaries");
  }

  return response.json();
};

// Attendance Summary API Calls
const BASE_URL = 'https://api.urest.in:8096/api/attendance-summary';

export const getAttendanceByProperty = async (propertyId) => {
  try {
    const response = await axios.get(`${BASE_URL}/by-property/${propertyId}`, { withCredentials: false });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch attendance by propertyId", error);
    throw error;
  }
};

export const createAttendance = async (model) => {
  try {
    const response = await axios.post(`${BASE_URL}`, model, { withCredentials: false });
    return response.data;
  } catch (error) {
    console.error("Failed to create attendance", error);
    throw error;
  }
};

export const updateAttendance = async (empId, monthyear, model) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/${empId}/${monthyear}`,
      model,
      { withCredentials: false }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update attendance", error);
    throw error;
  }
};

// Delete multiple attendance records
export const deleteMultipleAttendance = async (empIds, monthyear, propertyId) => {
  const response = await axios.delete(`${BASE_URL}/delete-multiple`, {
    params: {
      empIds: empIds.join(","),   // "277,278,300"
      monthyear: monthyear,       // "2025-11"
      propertyId: propertyId      // 🔥 REQUIRED NOW
    },
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });

  return response.data;
};

// Upload Attendance File
export const uploadAttendance = async (
  file,
  propertyId,
  monthyear,
  options = {}
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("propertyId", propertyId);
    formData.append("monthyear", monthyear);
    if (options.forceUpload !== undefined) {
      formData.append("forceUpload", String(!!options.forceUpload));
    }
    if (Array.isArray(options.crossPropertyMappings)) {
      formData.append(
        "crossPropertyMappings",
        JSON.stringify(options.crossPropertyMappings)
      );
    }

    const response = await axios.post(
      `${BASE_URL}/UploadAttendance`,
      formData,
      {
        responseType: "blob", // 🔥 THIS IS THE KEY
        withCredentials: false,
      }
    );

    return response; // 🔥 return full response (NOT response.data)
  } catch (error) {
    console.error("Upload attendance failed:", error);
    throw error;
  }
};


const APIBASE_URL = "https://api.urest.in:8096/api";

export const getPropertyById = async (propertyId) => {
  try {
    const response = await axios.get(`${APIBASE_URL}/property/${propertyId}`, { withCredentials: false });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch property info:", error);
    throw error;
  }
};


// Get employees with ungenerated salary for a given office ID, month, and year
const URL = "https://api.urest.in:8096/api";
export const getUngeneratedSalaryByOffice = async (officeId, month, year) => {
  const url = `${URL}/employee/ungeneratedSalary/${officeId}/${month}/${year}`;
  try {
    const response = await axios.get(url, {
      withCredentials: false,
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error in getUngeneratedSalaryByOffice:", error);
    throw error;
  }
};


// Get facility member salary details
export const getFacilityMemberSalaryDetails = async (facilityMemberIds, month, year) => {
  try {
    const idsString = facilityMemberIds.join(', ');
    const response = await axios.get(
      `https://api.urest.in:8096/get-facilitymember-salary-details`,
      {
        params: {
          FacilityMemberIds: idsString,
          Month: month,
          Year: year
        },
        withCredentials: false,
        headers: {
          Accept: "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching salary details:", error);
    throw error;
  }
};


// Regenerate employee salary entry (POST)
export async function regenerateEmployeeSalary(employees) {
  const response = await fetch(
    "https://api.urest.in:8096/api/employee/regeneratedSalary",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(employees),
    }
  );

  if (!response.ok) throw new Error("Failed to regenerate salary");
  return await response.json();
}


// Update generated salary document
export async function updateGeneratedSalaryDoc({ Emp_ID, Month, Year, SalaryDoc }) {
  const formData = new FormData();
  formData.append("Emp_ID", Emp_ID);
  formData.append("Month", Month);
  formData.append("Year", Year);
  formData.append("SalaryDoc", SalaryDoc); // This should be a File/blob

  const response = await fetch("https://api.urest.in:8096/api/employee/updateGeneratedSalaryDoc", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}


// OT Hours API Calls

export async function getOTHoursByProperty(propertyId) {
  try {
    const response = await fetch(
      `https://api.urest.in:8096/api/othours/get-by-property/${propertyId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch OT Hours");

    return await response.json();
  } catch (error) {
    console.error("OT Hours fetch error:", error);
    return [];
  }
}


// ADD OT Hours
export async function addOTHours(model) {
  try {
    const response = await fetch(
      "https://api.urest.in:8096/api/othours/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );

    if (!response.ok) throw new Error("Failed to add OT Hours");

    return await response.json();
  } catch (error) {
    console.error("Add OT Hours Error:", error);
    return null;
  }
}

// UPDATE OT Hours
export async function updateOTHours(propertyId, dataArray) {
  try {
    const response = await fetch(
      `https://api.urest.in:8096/api/othours/edit-property/${propertyId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(dataArray),
      }
    );

    if (!response.ok) throw new Error("Failed to update OT Hours");

    return await response.json();
  } catch (error) {
    return null;
  }
}

// DELETE OT Hours
export async function deleteOTHours(id) {
  try {
    const response = await fetch(
      `https://api.urest.in:8096/api/othours/delete/${id}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to delete OT Hours");

    return await response.json();
  } catch (error) {
    console.error("Delete OT Hours Error:", error);
    return null;
  }
}

// ================= AD PERCENTAGE =================

const AD_PERCENTAGE_URL = "https://api.urest.in:8096/api/adpercentages";

// GET all AD Percentages
export const getADPercentages = async (propertyId = null) => {
  const url = propertyId
    ? `${AD_PERCENTAGE_URL}?propertyId=${propertyId}`
    : `${AD_PERCENTAGE_URL}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load AD Percentages");
  }

  return await response.json();
};


// CREATE AD Percentage
export async function addADPercentage(model) {
  try {
    const response = await fetch(`${AD_PERCENTAGE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(model),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error adding AD percentage:", error);
    throw error;
  }
}

// UPDATE AD Percentage
export async function updateADPercentage(id, model) {
  try {
    const response = await fetch(
      `https://api.urest.in:8096/api/adpercentages/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating AD percentage:", error);
    throw error;
  }
}

// DELETE AD Percentage
export async function deleteADPercentage(id) {
  try {
    const response = await fetch(
      `https://api.urest.in:8096/api/adpercentages/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error deleting AD percentage:", error);
    throw error;
  }
}

// --------------------------------------------------
// GET SALARY GROUPS BY MULTIPLE PROPERTIES
// --------------------------------------------------
export const getSalaryAllowancesByProperties = async (propertyIds = []) => {
  if (!propertyIds.length) return [];

  const ids = propertyIds.join(",");

  const response = await fetch(
    `https://api.urest.in:8096/api/salaryallowances/byproperties?propertyIds=${ids}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch salary groups by properties");
  }

  return response.json();
};


// ----------------OTReport API Calls------------------- 
// ================= GET MONTHLY OT REPORT =================
export async function getMonthlyOTReport(propertyId, month, year) {
  try {
    const url = `https://api.urest.in:8096/api/otreport/getMonthly?propertyId=${propertyId}&month=${month}&year=${year}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch monthly OT report: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching monthly OT report:", error);
    throw error;
  }
}

// ================= OT REPORT (MONTHLY SAVE) =================
export async function saveMonthlyOTReport(model) {
  try {
    const response = await fetch(
      "https://api.urest.in:8096/api/otreport/saveMonthly",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save monthly OT report: ${response.status}`);
    }

    return await response.json(); // returns {}
  } catch (error) {
    console.error("Error saving monthly OT report:", error);
    throw error;
  }
}

// ================= UPDATE MONTHLY OT REPORT =================
export async function updateMonthlyOTReport(model) {
  try {
    const response = await fetch(
      "https://api.urest.in:8096/api/otreport/updateMonthly",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(model),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update monthly OT report: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating monthly OT report:", error);
    throw error;
  }
}

// ================= DELETE MONTHLY OT REPORT =================
export async function deleteMonthlyOTReport(
  propertyId,
  employeeId,
  month,
  year
) {
  try {
    const url = `https://api.urest.in:8096/api/otreport/deleteMonthly?propertyId=${propertyId}&employeeId=${employeeId}&month=${month}&year=${year}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete monthly OT report: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting monthly OT report:", error);
    throw error;
  }
}

// Get Employee Monthly Total OT
export const getEmployeeMonthlyTotalOT = async (propertyId, month, year) => {
  try {
    const response = await axios.get(
      `https://api.urest.in:8096/api/otreport/getEmployeeMonthlyTotalOT`,
      {
        params: {
          propertyId,
          month,
          year,
        },
        withCredentials: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch monthly OT report:", error);
    throw error;
  }
};

export const getEmployeesByOffices = async (officeIds = []) => {
  if (!officeIds.length) return [];

  try {
    const response = await axios.post(
      `${EMPLOYEE_API_BASE_URL}/getByOffices`,
      {
        OfficeIds: officeIds,
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch employees by offices", error);
    throw error;
  }
};

export const getEmployeesByOfficesWithAttendance = async (
  officeIds = [],
  monthYear = ""
) => {
  if (!officeIds.length) return [];

  try {
    const response = await axios.post(
      `${EMPLOYEE_API_BASE_URL}/getByOfficesWithAttendance`,
      {
        OfficeIds: officeIds,
        MonthYear: monthYear || null,
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch employees by offices with attendance", error);
    throw error;
  }
};

export const getAttendanceByProperties = async (
  propertyIds = [],
  monthYear
) => {
  if (!propertyIds.length || !monthYear) return [];

  try {
    const response = await axios.post(
      `${APIBASE_URL}/attendance-summary/by-properties`,
      {
        PropertyIds: propertyIds,
        MonthYear: monthYear,
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch attendance summary", error);
    throw error;
  }
};

export const saveAttendanceBatch = async (monthyear, employees = []) => {
  if (!monthyear || !employees.length) return;

  try {
    const response = await axios.post(
      `${APIBASE_URL}/attendance-summary/batch`,
      {
        monthyear,
        Employees: employees,
      },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to save attendance batch", error);
    throw error;
  }
};

// ==========================================
// GET PF REPORT DATA BY CLIENT + PROPERTY
// ==========================================
export const getFacilityMemberSalaryDetailsByClientBranch = async (
  clientId,
  propertyId,
  month,
  year
) => {
  try {
    const response = await axios.get(
      "https://api.urest.in:8096/get-facilitymember-salary-details-byclient-branch",
      {
        params: {
          clientId: clientId,
          propertyId: propertyId,
          Month: month,
          Year: year
        },
        headers: {
          Accept: "application/json"
        },
        withCredentials: false
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch PF report data", error);
    throw error;
  }
};

// ================= IMPORT EMPLOYEES =================

export const importEmployees = async (propertyId, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `https://api.urest.in:8096/api/employee/import?propertyId=${propertyId}`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Import failed: ${response.status}`);
    }

    return await response.json(); // { TotalRows, SuccessCount, FailedCount }
  } catch (error) {
    console.error("Employee import failed:", error);
    throw error;
  }
};
