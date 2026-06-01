export const fetchDmrReport = async (propertyId, fromDate, toDate) => {
  const query = new URLSearchParams({
    propertyId,
    fromDate,
    toDate,
  }).toString();

  const response = await fetch(`https://api.urest.in:8096/api/dmrreport?${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch DMR report");
  }

  return await response.json();
};

export const fetchAttendanceReport = async ({
  propertyId,
  fromDate,
  toDate,
  status,
  employeeName,
}) => {
  const params = new URLSearchParams();

  params.append("propertyId", propertyId);
  params.append("fromDate", fromDate);
  params.append("toDate", toDate);

  if (status) params.append("status", status);
  if (employeeName) params.append("employeeName", employeeName);

  const response = await fetch(
    `https://api.urest.in:8096/api/attendance-report?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch attendance report");
  }

  return await response.json();
};

// ================= DEVICE LIST =================
export const fetchDevices = async () => {
  const response = await fetch(
    "https://api.urest.in:8096/api/device/GetDevice",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch devices");
  }

  return await response.json();
};

// ================= DEVICE LOGS =================
export const fetchDeviceLogs = async (deviceId, date) => {
  const query = new URLSearchParams({
    deviceId,
    date,
  }).toString();

  const response = await fetch(
    `https://api.urest.in:8096/api/device/GetDeviceLogs?${query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch device logs");
  }

  return await response.json();
};

export const fetchDeviceLogsinBetween = async (deviceId, fromDate, toDate) => {
  const query = new URLSearchParams({
    deviceId,
    dateFrom: fromDate,
    dateTo: toDate,
  }).toString();

  const response = await fetch(
    `https://api.urest.in:8096/api/device/GetDeviceLogsInBetween?${query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch device logs");
  }

  return await response.json();
};

// ================= DMR LAYOUT CONFIG =================
export const fetchLayoutConfig = async (propertyId) => {
  const query = new URLSearchParams({ propertyId }).toString();
  const response = await fetch(
    `https://api.urest.in:8096/api/dmrreport/layout-config?${query}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) return null;
  return await response.json();
};

export const saveLayoutConfig = async (propertyId, layoutJson) => {
  const response = await fetch(
    "https://api.urest.in:8096/api/dmrreport/layout-config",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, layoutJson }),
    }
  );
  if (!response.ok) throw new Error("Failed to save layout config");
  return await response.json();
};

// ================= DMR EMAIL CONFIG =================
export const fetchEmailConfig = async (propertyId) => {
  const query = new URLSearchParams({ propertyId }).toString();
  const response = await fetch(
    `https://api.urest.in:8096/api/dmrreport/email-config?${query}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) return null;
  return await response.json();
};

export const saveEmailConfig = async (propertyId, config) => {
  const response = await fetch(
    "https://api.urest.in:8096/api/dmrreport/email-config",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ...config }),
    }
  );
  if (!response.ok) throw new Error("Failed to save email config");
  return await response.json();
};

export const fetchDeviceLogsByMonth = async (deviceId, monthYear) => {
  const query = new URLSearchParams({
    deviceId,
    monthYear,
  }).toString();

  const response = await fetch(
    `https://api.urest.in:8096/api/device/GetDeviceLogsByMonth?${query}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch device logs");
  }

  return await response.json();
};