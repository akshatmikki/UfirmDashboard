export const resolveEmployeeName = (employees, facilityMemberId) => {
  if (!employees?.length || !facilityMemberId) return "Unknown";
  const emp = employees.find(
    (e) => Number(e?.FacilityMember?.FacilityMemberId) === Number(facilityMemberId)
  );
  return emp?.Profile?.EmployeeName || "Unknown";
};

export const resolveShiftName = (shifts, shiftId) => {
  if (!shifts?.length || !shiftId) return "Unknown";
  const shift = shifts.find((s) => Number(s.ShiftId) === Number(shiftId));
  return shift?.ShiftName || "Unknown";
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Applies all three filters together (AND logic)
export const qFilter = (rows, filters) => {
  return rows.filter((row) => {
    const matchQuery =
      !filters.query ||
      row._employeeName?.toLowerCase().includes(filters.query.toLowerCase()) ||
      row._shiftName?.toLowerCase().includes(filters.query.toLowerCase());

    const matchEmployee =
      !filters.employeeId ||
      Number(row.EmployeeId) === Number(filters.employeeId);

    const matchShift =
      !filters.shiftId ||
      Number(row.ShiftId) === Number(filters.shiftId);

    return matchQuery && matchEmployee && matchShift;
  });
};

// Returns error string or null
export const validateForm = (form) => {
  if (!form.employeeId) return "Please select an employee.";
  if (!form.shiftId) return "Please select a shift.";
  if (!form.effectiveFrom) return "Please enter the Effective From date.";
  if (
    form.effectiveTo &&
    new Date(form.effectiveTo) < new Date(form.effectiveFrom)
  )
    return "Effective To date cannot be before Effective From date.";
  return null;
};

// Same employee + same shift already exists (excluding current record on edit)
export const checkDuplicate = (mappings, form) => {
  return mappings.some(
    (m) =>
      Number(m.EmployeeId) === Number(form.employeeId) &&
      Number(m.ShiftId) === Number(form.shiftId) &&
      Number(m.Id) !== Number(form.id)
  );
};

// Same employee with TIME-BASED collision (same date + overlapping shift times)
export const checkOverlap = (mappings, form, shifts = []) => {
  const newFrom = new Date(form.effectiveFrom);
  const newTo = form.effectiveTo ? new Date(form.effectiveTo) : null;

  // Get new shift's time period
  const newShift = shifts.find((s) => Number(s.ShiftId) === Number(form.shiftId));
  const newTimeFrom = newShift?.TimeFrom ? timeToMinutes(newShift.TimeFrom) : 0;
  const newTimeTo = newShift?.TimeTo ? timeToMinutes(newShift.TimeTo) : 1440;

  return mappings.some((m) => {
    // Only check for same employee
    if (Number(m.EmployeeId) !== Number(form.employeeId)) return false;
    if (Number(m.Id) === Number(form.id)) return false; // skip self on edit

    const existFrom = new Date(m.EffectiveFrom);
    const existTo = m.EffectiveTo ? new Date(m.EffectiveTo) : null;

    // Check if date ranges overlap
    const dateStartOverlaps = !existTo || newFrom <= existTo;
    const dateEndOverlaps = !newTo || newTo >= existFrom;
    
    if (!dateStartOverlaps || !dateEndOverlaps) return false; // dates don't overlap, so no conflict

    // Dates overlap — now check if shift TIMES actually collide
    const existShift = shifts.find((s) => Number(s.ShiftId) === Number(m.ShiftId));
    const existTimeFrom = existShift?.TimeFrom ? timeToMinutes(existShift.TimeFrom) : 0;
    const existTimeTo = existShift?.TimeTo ? timeToMinutes(existShift.TimeTo) : 1440;

    // Time collision: newTimeFrom < existTimeTo AND newTimeTo > existTimeFrom
    const timeOverlaps = newTimeFrom < existTimeTo && newTimeTo > existTimeFrom;
    return timeOverlaps;
  });
};

// Helper: convert "HH:MM:SS" string to minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").slice(0, 2);
  return Number(h) * 60 + Number(m);
};