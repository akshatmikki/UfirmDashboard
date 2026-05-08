import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import * as appCommon from "../../Common/AppCommon";
import {
  getAttendanceByProperties,
  saveAttendanceBatch,
  deleteMultipleAttendance,
  uploadAttendance,
  getEmployeeMonthlyTotalOT,
  getEmployeesByOfficesWithAttendance,
  updateAttendance,
  getFacilitySalaryConfig,
  getSalaryAllowancesByProperty,
} from "../../Services/PayrollService";

import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";

// Helper: Format month-year as "YYYY-MM"
function getMonthYearString(month, year) {
  const mon = month.toString().padStart(2, "0");
  return `${year}-${mon}`;
}

// Helper: Get days in a month
function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function getSundaysInMonth(month, year) {
  const monthDays = getDaysInMonth(month, year);
  let sundays = 0;

  for (let day = 1; day <= monthDays; day++) {
    if (new Date(year, month - 1, day).getDay() === 0) {
      sundays += 1;
    }
  }

  return sundays;
}

function parsePositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function parseMonthYear(monthyear) {
  if (!monthyear || typeof monthyear !== "string") return null;
  const [y, m] = monthyear.split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

function safeDate(year, month, day) {
  const daysInTargetMonth = getDaysInMonth(month, year);
  const clampedDay = Math.min(Math.max(1, Number(day) || 1), daysInTargetMonth);
  return new Date(Date.UTC(year, month - 1, clampedDay));
}

function countSundaysInRange(startDate, endDate) {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    return 0;
  if (startDate > endDate) return 0;

  let count = 0;
  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if (d.getUTCDay() === 0) count += 1;
  }
  return count;
}

function getComputedDivideByDays(config, monthyear, fallbackMonth, fallbackYear) {
  const parsed = parseMonthYear(monthyear);
  const year = parsed?.year ?? fallbackYear;
  const month = parsed?.month ?? fallbackMonth;

  const totalWorkingDaysValue = parsePositiveNumber(
    config?.TotalWorkingDays ?? config?.totalWorkingDays ?? config?.totalworkingdays
  );
  if (totalWorkingDaysValue > 0) return totalWorkingDaysValue;

  const monthDaysValue = parsePositiveNumber(
    config?.MonthDays ?? config?.monthDays ?? config?.monthdays
  );
  if (monthDaysValue > 0) return monthDaysValue;

  if (!year || !month) {
    return Math.max(1, getDaysInMonth(fallbackMonth, fallbackYear));
  }

  const excludeSundaysRaw =
    config?.ExcludeSunday ??
    config?.excludeSundays ??
    config?.excludesundays;
  const excludeSundays =
    excludeSundaysRaw === true ||
    excludeSundaysRaw === 1 ||
    excludeSundaysRaw === "1" ||
    String(excludeSundaysRaw).toLowerCase() === "true";

  const monthSundaysValue = parsePositiveNumber(
    config?.MonthSundays ?? config?.monthSundays ?? config?.monthsundays
  );

  const salaryStartFromRaw =
    config?.SalaryStartFrom ??
    config?.salaryStartFrom ??
    config?.salarystartfrom ??
    1;
  const salaryEndToRaw =
    config?.SalaryEndTo ??
    config?.salaryEndTo ??
    config?.salaryendto ??
    getDaysInMonth(month, year);

  let salaryStartFrom = Number(salaryStartFromRaw) || 0;
  let salaryEndTo = Number(salaryEndToRaw) || 0;

  // Use the previous month as the reference month for the cycle end
  const refMonth = month === 1 ? 12 : month - 1;
  const refYear = month === 1 ? year - 1 : year;

  // Match backend behavior:
  // If both are <=0, default to full month.
  if (salaryStartFrom <= 0 && salaryEndTo <= 0) {
    salaryStartFrom = 1;
    salaryEndTo = getDaysInMonth(refMonth, refYear);
  }

  let startDate;
  if (salaryStartFrom <= salaryEndTo) {
    startDate = safeDate(refYear, refMonth, salaryStartFrom);
  } else {
    const prevMonth = refMonth === 1 ? 12 : refMonth - 1;
    const prevYear = refMonth === 1 ? refYear - 1 : refYear;
    startDate = safeDate(prevYear, prevMonth, salaryStartFrom);
  }
  const endDate = safeDate(refYear, refMonth, salaryEndTo || getDaysInMonth(refMonth, refYear));

  const totalDays = Math.max(
    1,
    Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1
  );

  let sundayCount = 0;
  if (excludeSundays) {
    sundayCount = countSundaysInRange(startDate, endDate);
  } else if (monthSundaysValue > 0) {
    sundayCount = Math.floor(monthSundaysValue);
  }

  return Math.max(1, totalDays - sundayCount);
}

function clampWorkingDaysToMonth(value, month, year) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return Math.min(num, 31);
}

export default function AttendanceSheet() {
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxPropertyIds = useSelector((state) => state.Commonreducer.puidnlist);
  const [selectedPropertyId, setSelectedPropertyId] = useState([]);
  const propertyId =
    selectedPropertyId.length === 1
      ? selectedPropertyId[0]
      : reduxPropertyId || null;
  const effectivePropertyIds =
    selectedPropertyId.length > 0
      ? selectedPropertyId
      : Number(reduxPropertyId) > 0
        ? [Number(reduxPropertyId)]
        : [];
  const hasSingleEffectiveProperty = effectivePropertyIds.length === 1;
  const effectiveSinglePropertyId = hasSingleEffectiveProperty
    ? Number(effectivePropertyIds[0])
    : null;

  const [employees, setEmployees] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  useEffect(() => {
    const close = () => setShowPropertyDropdown(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // { empId: { divideByDays, monthDays, totalWorkingDays, excludeSunday, monthSundays } }
  const [employeeSGMap, setEmployeeSGMap] = useState({});

  const [dayInputs, setDayInputs] = useState({});

  const today = new Date();

  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const [month, setMonth] = useState(prevMonthDate.getMonth() + 1);
  const [year, setYear] = useState(prevMonthDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictRecords, setConflictRecords] = useState([]);
  const [salaryGroupOptions, setSalaryGroupOptions] = useState([]);
  const [salaryGroupMap, setSalaryGroupMap] = useState({});
  const [conflictSalaryOptionsMap, setConflictSalaryOptionsMap] = useState({});
  const [pendingUpload, setPendingUpload] = useState(null);
  const [confirmingUpload, setConfirmingUpload] = useState(false);

  const lastValidationToastAtRef = useRef({});
  const notifyValidation = (key, message) => {
    const now = Date.now();
    const last = Number(lastValidationToastAtRef.current?.[key]) || 0;
    if (now - last < 1200) return; // throttle to avoid popup spam while typing
    lastValidationToastAtRef.current = {
      ...(lastValidationToastAtRef.current || {}),
      [key]: now,
    };
    try {
      appCommon.ShownotifyError(message);
    } catch {
      alert(message);
    }
  };
const allEmployeesMap = {};

employees.forEach((emp) => {
  const id = emp?.FacilityMember?.FacilityMemberId;
  if (id) allEmployeesMap[id] = emp;
});

filteredAttendance.forEach((att) => {
  if (!allEmployeesMap[att.EmpID]) {
    allEmployeesMap[att.EmpID] = {
      FacilityMember: {
        FacilityMemberId: att.EmpID,
        PropertyId: att.PropertyID,
      },
      Profile: {
        EmployeeCode: att.EmployeeCode,
        EmployeeName: att.EmployeeName,
      },
      EmployeeList: {
        Designation: att.Designation,
      },
    };
  }
});

const finalEmployees = Object.values(allEmployeesMap);
const totalDaysInSelectedMonth = getDaysInMonth(
  month === 1 ? 12 : month - 1,
  month === 1 ? year - 1 : year
);

const [globalTotalDays, setGlobalTotalDays] = useState(
  totalDaysInSelectedMonth
);

useEffect(() => {
  const refMonth = month === 1 ? 12 : month - 1;
  const refYear = month === 1 ? year - 1 : year;
  const days = getDaysInMonth(refMonth, refYear);
  setGlobalTotalDays(days);
}, [month, year]);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const attendanceLoadSeqRef = useRef(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const filteredEmployees = finalEmployees.filter((emp) => {
    const code = emp?.Profile?.EmployeeCode?.toLowerCase() || "";
    const name =
      emp?.Profile?.EmployeeName?.toLowerCase() ||
      emp?.FacilityMember?.Name?.toLowerCase() ||
      "";
    const designation =
      emp?.EmployeeList?.Designation?.toLowerCase() ||
      emp?.Profile?.Designation?.toLowerCase() ||
      "";

    const department =
      emp?.Profile?.Department?.toLowerCase() || "";

    const matchesSearch =
      code.includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase()) ||
      designation.includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !selectedDepartment ||
      department === selectedDepartment.toLowerCase();

    return matchesSearch && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Current system date
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Month-year dropdowns
  const years = [];
  for (let y = 2021; y <= currentYear; y++) years.push(y);

  const maxMonth = year === currentYear ? currentMonth - 1 : 12;
  const months = [];
  for (let m = 1; m <= maxMonth; m++) months.push(m);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const baseExtraFields = {
    EL: "",
    CL: "",
    SL: "",
    nhDays: "",
    fhDays: "",
    holidays: "",
    divideByDays: "",
    otMonthDays: "",
    pfArrear: "",
    otherArrear: "",
    incentive: "",
    advanceDed: "",
    uniformDed: "",
    bgvDed: "",
    roomDed: "",
    fineDed: "",
    joiningKits: "",
    otherDed: "",
    foodDed: "",
    status: "",
  };

  const fileInputRef = React.useRef(null);

  const getConflictKey = (record, idx = 0) => {
    const empPart =
      record?.FacilityMemberId ||
      record?.EmpID ||
      record?.FMId ||
      record?.EmpCode ||
      record?.EmployeeCode ||
      `idx-${idx}`;
    const designationPart =
      record?.DesignationId ??
      record?.Designation_ID ??
      record?.DesignationMasterId ??
      "no-designation";
    const monthPart = record?.MonthYear || record?.monthyear || "no-month";
    return `${empPart}__${designationPart}__${monthPart}`;
  };

  const normalizeSalaryGroupOptions = (rows = []) => {
    const normalized = [];
    (rows || []).forEach((row) => {
      const fallbackIds = Array.isArray(row?.SalaryGroup_IDs)
        ? row.SalaryGroup_IDs
        : [];
      const primaryId =
        row?.SalaryGroup_ID ||
        row?.SalaryGroupId ||
        fallbackIds[0] ||
        row?.Id ||
        0;
      const id = Number(primaryId);
      if (!Number.isFinite(id) || id <= 0) return;

      normalized.push({
        id,
        name:
          row?.SalaryGroup ||
          row?.SalaryGroupName ||
          row?.Name ||
          `Salary Group ${id}`,
      });
    });

    const seen = new Set();
    return normalized.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const parseBlobJson = async (blob) => {
    try {
      const text = await blob.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const openCrossPropertyConflictModal = async (
    conflicts,
    propertyId,
    monthyear,
    file
  ) => {
    const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
    if (!safeConflicts.length) return;

    let options = [];
    try {
      const sgRows = await getSalaryAllowancesByProperty(propertyId);
      options = normalizeSalaryGroupOptions(sgRows || []);
    } catch (err) {
      console.error("Failed to load salary groups for conflict resolution:", err);
      options = [];
    }

    if (!options.length) {
      alert(
        "Cross-property employees found, but no salary group is available for this property. Please create salary group first."
      );
      return;
    }

    const defaultMap = {};
    const optionMap = {};
    safeConflicts.forEach((record, idx) => {
      const key = getConflictKey(record, idx);
      const conflictSpecificOptions = normalizeSalaryGroupOptions(
        record?.SalaryGroupOptions ||
        record?.SalaryGroups ||
        record?.AvailableSalaryGroups ||
        []
      );
      const mergedOptions = conflictSpecificOptions.length
        ? conflictSpecificOptions
        : options;
      optionMap[key] = mergedOptions;
      defaultMap[key] = mergedOptions.length ? String(mergedOptions[0].id) : "";
    });

    setSalaryGroupOptions(options);
    setConflictSalaryOptionsMap(optionMap);
    setSalaryGroupMap(defaultMap);
    setConflictRecords(safeConflicts);
    setPendingUpload({ file, propertyId, monthyear });
    setShowConflictModal(true);
  };

  const handleUploadResponse = async (res, file, propertyId, monthyear) => {
    const contentType = res?.headers?.["content-type"] || "";
    const responseBlob = res?.data;

    if (contentType.includes("application/vnd.openxmlformats")) {
      const blob = new Blob([responseBlob]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "AttendanceErrors.xlsx";
      link.click();
      alert("Some employees were invalid. Error file downloaded.");
      return { handled: true };
    }

    const data = await parseBlobJson(responseBlob);
    if (!data) {
      alert("Unexpected upload response received.");
      return { handled: true };
    }

    if (data.requiresConfirmation && Array.isArray(data.conflicts)) {
      await openCrossPropertyConflictModal(
        data.conflicts,
        propertyId,
        monthyear,
        file
      );
      return { handled: true, confirmationNeeded: true };
    }

    alert(data?.message || "Attendance uploaded successfully!");
    return { handled: true };
  };

  const handleUploadErrorResponse = async (err, file, propertyId, monthyear) => {
    try {
      const errorBlob = err?.response?.data;
      if (!errorBlob || typeof errorBlob.text !== "function") return false;
      const data = await parseBlobJson(errorBlob);
      if (!data) return false;

      if (data.requiresConfirmation && Array.isArray(data.conflicts)) {
        await openCrossPropertyConflictModal(
          data.conflicts,
          propertyId,
          monthyear,
          file
        );
        return true;
      }

      if (data.message || data.error) {
        alert(data.message || data.error);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const closeConflictModal = () => {
    if (confirmingUpload) return;
    setShowConflictModal(false);
    setConflictRecords([]);
    setSalaryGroupOptions([]);
    setSalaryGroupMap({});
    setConflictSalaryOptionsMap({});
    setPendingUpload(null);
  };

  const confirmCrossPropertyUpload = async () => {
    if (!pendingUpload || !conflictRecords.length) {
      closeConflictModal();
      return;
    }

    const missingSelection = conflictRecords.some((record, idx) => {
      const key = getConflictKey(record, idx);
      const selected = Number(salaryGroupMap[key]);
      return !Number.isFinite(selected) || selected <= 0;
    });

    if (missingSelection) {
      alert("Please select salary group for all conflict rows.");
      return;
    }

    const mappings = conflictRecords.map((record, idx) => {
      const key = getConflictKey(record, idx);
      const salaryGroupId = Number(salaryGroupMap[key]);
      return {
        EmpCode: record?.EmpCode || record?.EmployeeCode || "",
        FacilityMemberId:
          record?.FacilityMemberId ||
          record?.EmpID ||
          record?.FMId ||
          null,
        PropertyId: pendingUpload.propertyId,
        SalaryGroupId: salaryGroupId,
        DesignationId:
          record?.DesignationId ??
          record?.Designation_ID ??
          record?.DesignationMasterId ??
          null,
        MonthYear:
          pendingUpload.monthyear ||
          record?.MonthYear ||
          record?.monthyear ||
          "",
      };
    });

    setConfirmingUpload(true);
    try {
      const res = await uploadAttendance(
        pendingUpload.file,
        pendingUpload.propertyId,
        pendingUpload.monthyear,
        {
          forceUpload: true,
          crossPropertyMappings: mappings,
        }
      );

      const handled = await handleUploadResponse(
        res,
        pendingUpload.file,
        pendingUpload.propertyId,
        pendingUpload.monthyear
      );

      if (!handled?.confirmationNeeded) {
        closeConflictModal();
        await reloadAttendanceData();
      }
    } catch (err) {
      const handledError = await handleUploadErrorResponse(
        err,
        pendingUpload.file,
        pendingUpload.propertyId,
        pendingUpload.monthyear
      );
      if (handledError) return;
      console.error("Confirmed upload failed:", err);
      alert("Upload failed after confirmation.");
    } finally {
      setConfirmingUpload(false);
    }
  };

  async function handleImportClick() {
    if (!hasSingleEffectiveProperty) {
      alert("Please select exactly ONE unit before uploading attendance.");
      return;
    }

    fileInputRef.current.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const monthyear = getMonthYearString(month, year);

    setImporting(true);

    try {
      if (!effectiveSinglePropertyId) {
        alert("Invalid property selection.");
        return;
      }

      const res = await uploadAttendance(file, effectiveSinglePropertyId, monthyear);
      const handled = await handleUploadResponse(
        res,
        file,
        effectiveSinglePropertyId,
        monthyear
      );
      if (!handled?.confirmationNeeded) {
        await reloadAttendanceData();
      }
    } catch (err) {
      const handledError = await handleUploadErrorResponse(
        err,
        file,
        effectiveSinglePropertyId,
        monthyear
      );
      if (handledError) return;
      console.error("Upload failed:", err);
      alert("Upload failed.");
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  }
  async function reloadAttendanceData() {
    const seq = (attendanceLoadSeqRef.current || 0) + 1;
    attendanceLoadSeqRef.current = seq;
    setAttendanceLoading(true);

    try {
      const currMonthYear = getMonthYearString(month, year);

      const propertyIds =
        selectedPropertyId.length > 0
          ? selectedPropertyId
          : reduxPropertyId
            ? [reduxPropertyId]
            : [];

      if (!propertyIds.length) {
        console.warn("No property selected for reload");
        return;
      }

      const response = await getAttendanceByProperties(propertyIds, currMonthYear);
      const flat = response?.flatMap((p) => p.Employees || []) || [];

      setFilteredAttendance(flat);

      const mappedInputs = {};
      flat.forEach((att) => {
        const configDivideByDays =
          employeeSGMap[att.EmpID]?.divideByDays ?? globalTotalDays;

        const key = `${att.EmpID}_${att.AttendanceID}`;

        mappedInputs[key] = {
          workingDays: clampWorkingDaysToMonth(att.WorkingDays, month, year),
          EL: att.EL ?? "",
          CL: att.CL ?? "",
          SL: att.SL ?? "",
          weekDaysOff: att.WeekDaysOff ?? "",
          otDays: att.OtDays ?? "",
          otHours: att.OtHours ?? "",
          totalDays: att.PayableDays ?? "",
          manualTotalDays: false,
          nhDays: att.NHDays ?? "",
          fhDays: att.FHDays ?? "",
          holidays: att.Holidays ?? "",
          divideByDays:
            att.DivideByDays ??
            configDivideByDays ??
            globalTotalDays,
          otMonthDays: att.OtMonthDays ?? "",
          pfArrear: att.PFArrear ?? "",
          otherArrear: att.OtherArrear ?? "",
          incentive: att.Incentive ?? "",
          advanceDed: att.AdvanceDed ?? "",
          uniformDed: att.UniformDed ?? "",
          bgvDed: att.BGVDed ?? "",
          roomDed: att.RoomDed ?? "",
          fineDed: att.FineDed ?? "",
          joiningKits: att.JoiningKits ?? "",
          otherDed: att.OtherDed ?? "",
          foodDed: att.FoodDed ?? "",
          status: att.Status ?? "",
        };
      });

      setDayInputs(mappedInputs);
      setSelectedEmpIds(new Set());
    } catch (err) {
      console.error("Attendance refresh failed:", err);
      try {
        appCommon.ShownotifyError("Failed to refresh attendance.");
      } catch {
        alert("Failed to refresh attendance.");
      }
    } finally {
      if (seq === attendanceLoadSeqRef.current) {
        setAttendanceLoading(false);
      }
    }
  }

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const res = await getAllClients();
        const clients = res || [];
        setUnitList(clients);

        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
        } else if (Number(reduxPropertyId) > 0) {
          const clientRes = await getClientByPropertyId(reduxPropertyId);
          setSelectedUnitId(clientRes?.ClientID || null);
        }
      } catch (err) {
        console.log("Failed to load units", err);
      }
    };

    loadUnits();
  }, [reduxClientId, reduxPropertyId]);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId([]);
          return;
        }

        const res = await getPropertiesByClientId(selectedUnitId);
        const properties = res || [];

        setPropertyList(properties);

        // ✅ Select ALL properties by default
        const allIds = properties.map((p) => p.PropertyId);
        if (Number(reduxPropertyId) > 0) setSelectedPropertyId([Number(reduxPropertyId)]);
        else setSelectedPropertyId(allIds);
      } catch (err) {
        console.log("Failed to load properties", err);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId]);

  // ---------------------------------------------------------
  // Load Employees
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    const loadEmployees = async () => {
      try {
        let officeIds = [];

        if (selectedPropertyId.length > 0) {
          officeIds = selectedPropertyId;
        } else if (Number(reduxPropertyId) > 0) {
          officeIds = [Number(reduxPropertyId)];
        } else if (Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0) {
          officeIds = reduxPropertyIds;
        }

        officeIds = officeIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0);

        if (!officeIds.length) {
          setEmployees([]);
          setDepartmentList([]);
          setSelectedDepartment("");
          return;
        }

        const monthYearForEmployees = getMonthYearString(month, year);
        const data = await getEmployeesByOfficesWithAttendance(
          officeIds,
          monthYearForEmployees,
          { signal: controller.signal }
        );
        setEmployees(data || []);
        setSelectedDepartment("");
        const departments = [
          ...new Set(
            (data || [])
              .map((emp) => emp?.Profile?.Department)
              .filter(Boolean)
          ),
        ];

        setDepartmentList(departments);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        console.error("Employee load failed", err);
        setEmployees([]);
      }
    };

    loadEmployees();
    return () => controller.abort();
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds, month, year]);

  // ---------------------------------------------------------
  // Load facility salary config
  // ---------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    async function loadFacilityConfig() {
      const propertyIds =
        selectedPropertyId.length > 0
          ? selectedPropertyId
          : Number(reduxPropertyId) > 0
            ? [Number(reduxPropertyId)]
            : Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0
              ? reduxPropertyIds
              : [];

      const cleanedPropertyIds = propertyIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (!cleanedPropertyIds.length || !employees.length) {
        setEmployeeSGMap({});
        return;
      }

      const map = {};

      for (const officeId of cleanedPropertyIds) {
        try {
          const res = await getFacilitySalaryConfig(officeId, { signal: controller.signal });
          const rows = Array.isArray(res) ? res : [];

          rows.forEach((cfg) => {
            const fmId = cfg?.FacilityMemberId;
            if (!fmId) return;

            const normalizedConfig = {
              TotalWorkingDays:
                cfg?.TotalWorkingDays ?? cfg?.totalWorkingDays ?? cfg?.totalworkingdays ?? null,
              MonthDays: cfg?.MonthDays ?? cfg?.monthDays ?? cfg?.monthdays ?? null,
              ExcludeSunday:
                cfg?.ExcludeSunday ?? cfg?.excludeSundays ?? cfg?.excludesundays ?? false,
              MonthSundays:
                cfg?.MonthSundays ?? cfg?.monthSundays ?? cfg?.monthsundays ?? null,
              SalaryStartFrom:
                cfg?.SalaryStartFrom ?? cfg?.salaryStartFrom ?? cfg?.salarystartfrom ?? null,
              SalaryEndTo: cfg?.SalaryEndTo ?? cfg?.salaryEndTo ?? cfg?.salaryendto ?? null,
            };

            map[fmId] = {
              ...normalizedConfig,
              divideByDays: getComputedDivideByDays(
                normalizedConfig,
                getMonthYearString(month, year),
                month,
                year
              ),
            };
          });
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Facility salary config load error:", err);
        }
      }

      setEmployeeSGMap(map);
    }

    loadFacilityConfig();
    return () => controller.abort();
  }, [
    employees,
    month,
    year,
    selectedPropertyId,
    reduxPropertyId,
    reduxPropertyIds,
  ]);

  // ---------------------------------------------------------
  // Load attendance (ALL records), then filter current month
  // ---------------------------------------------------------
  useEffect(() => {
    setCurrentPage(1);
    const controller = new AbortController();

    async function loadAttendance() {
      if (!employees.length) return;
      let seq = 0;
      try {
        // 🔹 Decide which properties to use
        const propertyIds =
          selectedPropertyId.length > 0
            ? selectedPropertyId
            : reduxPropertyId
              ? [reduxPropertyId]
              : [];

        if (!propertyIds.length) return;

        seq = (attendanceLoadSeqRef.current || 0) + 1;
        attendanceLoadSeqRef.current = seq;
        setAttendanceLoading(true);

        const currMonthYear = getMonthYearString(month, year);

        // 🔹 NEW MULTI PROPERTY API
        const response = await getAttendanceByProperties(
          propertyIds,
          currMonthYear,
          { signal: controller.signal }
        );

        // 🔥 Flatten structure
        const safeData =
          response?.flatMap((p) => p.Employees || []) || [];

        setFilteredAttendance(safeData);
        const filtered = safeData;

        // 🔹 Fetch OT hours (still single property based if needed)
        let otData = [];
        try {
          if (propertyIds.length === 1) {
            otData = await getEmployeeMonthlyTotalOT(
              propertyIds[0],
              month,
              year,
              { signal: controller.signal }
            );
          }
        } catch (err) {
          if (err.name === "CanceledError" || err.name === "AbortError") return;
          console.error("OT load failed:", err);
        }


       const mappedInputs = {};

filtered.forEach((att) => {
  const empId = att.EmpID;
  const key = `${att.EmpID}_${att.AttendanceID}`;

  const emp = employees.find(
    (e) => e?.FacilityMember?.FacilityMemberId === empId
  );

  const empCode = emp?.Profile?.EmployeeCode;

  const otMatch = otData?.find(
    (ot) => ot.EmployeeCode === empCode
  );

  mappedInputs[key] = {
    workingDays: att.WorkingDays ?? "",
    EL: att.EL ?? "",
    CL: att.CL ?? "",
    SL: att.SL ?? "",
    weekDaysOff: att.WeekDaysOff ?? "",
    otDays: att.OtDays ?? "",
    otHours: att.OtHours ?? "",
    totalDays: att.PayableDays ?? "",
    manualTotalDays: false,
    nhDays: att.NHDays ?? "",
    fhDays: att.FHDays ?? "",
    holidays: att.Holidays ?? "",
    divideByDays: att.DivideByDays ?? "",
    otMonthDays: att.OtMonthDays ?? "",
    pfArrear: att.PFArrear ?? "",
    otherArrear: att.OtherArrear ?? "",
    incentive: att.Incentive ?? "",
    advanceDed: att.AdvanceDed ?? "",
    uniformDed: att.UniformDed ?? "",
    bgvDed: att.BGVDed ?? "",
    roomDed: att.RoomDed ?? "",
    fineDed: att.FineDed ?? "",
    joiningKits: att.JoiningKits ?? "",
    otherDed: att.OtherDed ?? "",
    foodDed: att.FoodDed ?? "",
    status: att.Status ?? "",
  };
});

        setDayInputs(mappedInputs);
        setSelectedEmpIds(new Set());
      } catch (err) {
        if (err?.response?.status === 404) {
          setFilteredAttendance([]);
          setDayInputs({});
          setSelectedEmpIds(new Set());
        } else {
          console.error("Attendance load failed:", err);
        }
      } finally {
        if (seq && seq === attendanceLoadSeqRef.current) {
          setAttendanceLoading(false);
        }
      }
    }

    loadAttendance();
    return () => controller.abort();
  }, [
    selectedPropertyId,
    reduxPropertyId,
    month,
    year,
    employees,
    employeeSGMap,
  ]);

  // ---------------------------------------------------------
  // Checkbox toggle
  // ---------------------------------------------------------
 function toggleCheckbox(rowKey) {
  setSelectedEmpIds((prev) => {
    const next = new Set(prev);

    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);

      if (!dayInputs[rowKey]) {
        setDayInputs((old) => ({
          ...old,
          [rowKey]: {
            ...baseExtraFields,
            workingDays: "",
            weekDaysOff: "",
            otDays: "",
            otHours: "",
            totalDays: "",
            manualTotalDays: false,
          },
        }));
      }
    }

    return next;
  });
}

  // ---------------------------------------------------------
  // Handle per-employee input (manual override supported)
  // ---------------------------------------------------------
 function handleInputChange(rowKey, field, value) {
  if (field !== "status" && !/^\d*\.?\d*$/.test(value)) return;

  setDayInputs((prev) => {
    const current = prev[rowKey] || {
      ...baseExtraFields,
      workingDays: "",
      weekDaysOff: "",
      otDays: "",
      otHours: "",
      totalDays: globalTotalDays,
      manualTotalDays: false,
      divideByDays: globalTotalDays,
    };

    const updated = { ...current, [field]: value };

    if (field === "totalDays") {
      updated.manualTotalDays = true;
    }
    if (field === "divideByDays") {
      updated.manualDivideByDays = true;
    }

    const refMonth = month === 1 ? 12 : month - 1;
    const refYear = month === 1 ? year - 1 : year;
    
    // 🔥 We allow up to 31 days to account for cross-month cycles like 21 Jan to 20 Feb (31 days).
    // The exact cycle days could be computed per employee, but 31 is the absolute max days in a cycle.
    const monthDaysLimit = 31;

    // 🔥 VALIDATION (same logic, just no empId dependency)

    const totalDaysInputNum =
      field === "totalDays" ? Number(value) : Number(updated.totalDays);

    let totalDaysResolved =
      Number.isFinite(totalDaysInputNum) && totalDaysInputNum > 0
        ? totalDaysInputNum
        : Number(current.totalDays) || globalTotalDays;

    if (totalDaysResolved > monthDaysLimit) {
      updated.totalDays = String(monthDaysLimit);
      totalDaysResolved = monthDaysLimit;
    }

    if (field === "divideByDays") {
      const dbdNum = Number(value);
      if (dbdNum > monthDaysLimit) {
        updated.divideByDays = String(monthDaysLimit);
      }
    }

    const fieldsToCheck = ["workingDays", "EL", "CL", "SL", "weekDaysOff"];

    if (fieldsToCheck.includes(field)) {
      const v = Number(updated[field]) || 0;

      if (v > totalDaysResolved) {
        updated[field] = String(totalDaysResolved);
      }
    }

    // 🔥 SUM VALIDATION
    const w = parseFloat(updated.workingDays) || 0;
    const el = parseFloat(updated.EL) || 0;
    const cl = parseFloat(updated.CL) || 0;
    const sl = parseFloat(updated.SL) || 0;
    const wk = parseFloat(updated.weekDaysOff) || 0;

    const total = w + el + cl + sl + wk;

    if (total > totalDaysResolved) {
      const sumOther = total - (Number(updated[field]) || 0);
      const remaining = Math.max(0, totalDaysResolved - sumOther);
      updated[field] = String(remaining);
    }

    return {
      ...prev,
      [rowKey]: updated, // ✅ IMPORTANT
    };
  });
}

  // ---------------------------------------------------------
  // Save Attendance
  // ---------------------------------------------------------
  async function handleSaveAttendance() {
    if (selectedEmpIds.size === 0) {
      alert("Please select at least one employee.");
      return;
    }

    setSaving(true);

    const currMonthYear = getMonthYearString(month, year);
    const n = (v) =>
      v === "" || v === null || v === undefined ? 0 : Number(v);

    try {
      const updatePromises = [];
      const newEmployees = [];
      const savedModelsByEmpId = {};

      selectedEmpIds.forEach((rowKey) => {
  const [empId, attendanceId] = rowKey.split("_").map(Number);
        const emp = employees.find(
          (e) => e?.FacilityMember?.FacilityMemberId === empId
        );

        if (!emp) return;

        const empName =
          emp?.Profile?.EmployeeName ||
          emp?.EmployeeList?.Designation ||
          emp?.FacilityMember?.Name ||
          "Unknown";

        const inp = dayInputs[rowKey] || {};

        const EL = n(inp.EL);
        const CL = n(inp.CL);
        const SL = n(inp.SL);

        const expectedDivideByDays = getComputedDivideByDays(
          employeeSGMap?.[empId] || null,
          currMonthYear,
          month,
          year
        );
        const fallbackDivideByDays =
          Number.isFinite(expectedDivideByDays) && expectedDivideByDays > 0
            ? expectedDivideByDays
            : globalTotalDays;

        const inputDivideByDays = n(inp.divideByDays);
        const divideByDaysToSave =
          inputDivideByDays > 0
            ? inputDivideByDays
            : fallbackDivideByDays;

        const model = {
          EmpID: empId,
          EmployeeName: empName,
          PropertyID: emp?.FacilityMember?.PropertyId,
          monthyear: currMonthYear,
          IsActive: true,
          CreatedOn: new Date().toISOString(),

          WorkingDays: n(inp.workingDays),
          LeaveDays: EL + CL + SL,
          WeekDaysOff: n(inp.weekDaysOff),

          EL,
          CL,
          SL,

          NHDays: n(inp.nhDays),
          FHDays: n(inp.fhDays),
          Holidays: n(inp.holidays),
          DivideByDays: divideByDaysToSave,
          OtMonthDays: n(inp.otMonthDays),

          PFArrear: n(inp.pfArrear),
          OtherArrear: n(inp.otherArrear),
          Incentive: n(inp.incentive),

          AdvanceDed: n(inp.advanceDed),
          UniformDed: n(inp.uniformDed),
          BGVDed: n(inp.bgvDed),
          RoomDed: n(inp.roomDed),
          FineDed: n(inp.fineDed),
          JoiningKits: n(inp.joiningKits),
          OtherDed: n(inp.otherDed),
          FoodDed: n(inp.foodDed),

          OtDays: n(inp.otDays),
          OtHours: n(inp.otHours),
          PayableDays: n(inp.totalDays),
          Status: inp.status || "",
        };
        savedModelsByEmpId[empId] = model;

        const existing = filteredAttendance.find(
          (a) =>
            String(a.EmpID) === String(empId) &&
            String(a.monthyear) === String(currMonthYear)
        );

        const currentAttendanceId = existing?.AttendanceID || attendanceId;

        if (existing && currentAttendanceId !== -1) {
          // 🔹 UPDATE using PUT
          updatePromises.push(
            updateAttendance(currentAttendanceId, model).catch((err) => {
              const status = err?.response?.status;
              if (status === 404) {
                newEmployees.push(model);
                return null;
              }
              throw err;
            })
          );
        } else {
          // 🔹 CREATE using batch
          newEmployees.push(model);
        }
      });

      // 🔹 Execute updates
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      // 🔹 Execute batch create for new ones
      if (newEmployees.length > 0) {
        await saveAttendanceBatch(currMonthYear, newEmployees);
      }

      // Keep UI in sync immediately (without needing full page refresh)
      setFilteredAttendance((prev) => {
        const merged = [...(Array.isArray(prev) ? prev : [])];
        Object.values(savedModelsByEmpId).forEach((m) => {
          const idx = merged.findIndex(
            (a) =>
              String(a.EmpID) === String(m.EmpID) &&
              String(a.monthyear) === String(m.monthyear)
          );

          const normalized = {
            ...(idx >= 0 ? merged[idx] : {}),
            EmpID: m.EmpID,
            monthyear: m.monthyear,
            WorkingDays: m.WorkingDays,
            EL: m.EL,
            CL: m.CL,
            SL: m.SL,
            WeekDaysOff: m.WeekDaysOff,
            OtDays: m.OtDays,
            OtHours: m.OtHours,
            PayableDays: m.PayableDays,
            NHDays: m.NHDays,
            FHDays: m.FHDays,
            Holidays: m.Holidays,
            DivideByDays: m.DivideByDays,
            OtMonthDays: m.OtMonthDays,
            PFArrear: m.PFArrear,
            OtherArrear: m.OtherArrear,
            Incentive: m.Incentive,
            AdvanceDed: m.AdvanceDed,
            UniformDed: m.UniformDed,
            BGVDed: m.BGVDed,
            RoomDed: m.RoomDed,
            FineDed: m.FineDed,
            JoiningKits: m.JoiningKits,
            OtherDed: m.OtherDed,
            FoodDed: m.FoodDed,
            Status: m.Status,
          };

          if (idx >= 0) merged[idx] = normalized;
          else merged.push(normalized);
        });
        return merged;
      });

      setDayInputs((prev) => {
        const next = { ...prev };
        Object.values(savedModelsByEmpId).forEach((m) => {
          const existing = next[m.EmpID] || {};
          next[m.EmpID] = {
            ...existing,
            workingDays: m.WorkingDays ?? "",
            EL: m.EL ?? "",
            CL: m.CL ?? "",
            SL: m.SL ?? "",
            weekDaysOff: m.WeekDaysOff ?? "",
            otDays: m.OtDays ?? "",
            otHours: m.OtHours ?? "",
            totalDays: m.PayableDays ?? "",
            nhDays: m.NHDays ?? "",
            fhDays: m.FHDays ?? "",
            holidays: m.Holidays ?? "",
            divideByDays: m.DivideByDays ?? existing.divideByDays ?? globalTotalDays,
            otMonthDays: m.OtMonthDays ?? "",
            pfArrear: m.PFArrear ?? "",
            otherArrear: m.OtherArrear ?? "",
            incentive: m.Incentive ?? "",
            advanceDed: m.AdvanceDed ?? "",
            uniformDed: m.UniformDed ?? "",
            bgvDed: m.BGVDed ?? "",
            roomDed: m.RoomDed ?? "",
            fineDed: m.FineDed ?? "",
            joiningKits: m.JoiningKits ?? "",
            otherDed: m.OtherDed ?? "",
            foodDed: m.FoodDed ?? "",
            status: m.Status ?? "",
            manualTotalDays: existing.manualTotalDays ?? false,
          };
        });
        return next;
      });
      setSelectedEmpIds(new Set());

      alert("Attendance saved successfully!");

    } catch (err) {
      console.error("Batch save failed:", err);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------
  // Bulk Delete
  // ---------------------------------------------------------
  async function handleBulkDelete() {
    if (!hasSingleEffectiveProperty) {
      alert("Please select exactly ONE unit before deleting attendance.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected attendance?"))
      return;

    setDeleting(true);

    try {
      const attendanceIds = Array.from(selectedEmpIds)
        .map(rowKey => {
          const parts = String(rowKey).split("_");
          return parts.length > 1 ? Number(parts[1]) : 0;
        })
        .filter(id => id > 0);

      if (attendanceIds.length > 0) {
        await deleteMultipleAttendance(attendanceIds);
      } else {
        alert("No valid attendance records selected for deletion. Unsaved records cannot be deleted.");
        setDeleting(false);
        return;
      }

      await reloadAttendanceData();

    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  function exportToExcel() {

    if (!hasSingleEffectiveProperty) {
      alert("Please select exactly ONE unit before exporting.");
      return;
    }

    const data = filteredEmployees.map((emp, idx) => {

      const empId = emp?.FacilityMember?.FacilityMemberId ?? idx;

      const empCode = emp?.Profile?.EmployeeCode || "";
      const empName =
        emp?.Profile?.EmployeeName ||
        emp?.FacilityMember?.Name ||
        "";

      const inp = dayInputs[empId] || {};
      const saved =
        filteredAttendance.find(a => a.EmpID === empId) || null;

      const getVal = (val, fallback = 0) => {
        if (val === "" || val === null || val === undefined) return fallback;
        return Number(val);
      };

      return {
        "S.No.": idx + 1,
        EmpCode: empCode,
        EmployeeName: empName,

        Designation:
          emp?.EmployeeList?.Designation ||
          emp?.Profile?.Designation ||
          "",

        WeeklyOff: getVal(inp.weekDaysOff, getVal(saved?.WeekDaysOff)),
        WorkingDays: getVal(inp.workingDays, getVal(saved?.WorkingDays)),

        EL: getVal(inp.EL, getVal(saved?.EL)),
        CL: getVal(inp.CL, getVal(saved?.CL)),
        SL: getVal(inp.SL, getVal(saved?.SL)),

        PayableDays: getVal(inp.totalDays, getVal(saved?.PayableDays)),

        OTDays: getVal(inp.otDays, getVal(saved?.OtDays)),
        OTHrs: getVal(inp.otHours, getVal(saved?.OtHours)),

        NHDays: getVal(inp.nhDays, getVal(saved?.NHDays)),
        FHDays: getVal(inp.fhDays, getVal(saved?.FHDays)),
        HoliDays: getVal(inp.holidays, getVal(saved?.Holidays)),

        // 🔥 IMPORTANT FIX
        "Divide by Days": saved ? getVal(saved?.DivideByDays) : 0,

        "Ot Month Days": getVal(inp.otMonthDays, getVal(saved?.OtMonthDays)),

        "PF Arrear": getVal(inp.pfArrear, getVal(saved?.PFArrear)),
        "Other Arrear": getVal(inp.otherArrear, getVal(saved?.OtherArrear)),

        Incentive: getVal(inp.incentive, getVal(saved?.Incentive)),

        AdvanceDed: getVal(inp.advanceDed, getVal(saved?.AdvanceDed)),
        UniformDed: getVal(inp.uniformDed, getVal(saved?.UniformDed)),
        BGVDed: getVal(inp.bgvDed, getVal(saved?.BGVDed)),
        RoomDed: getVal(inp.roomDed, getVal(saved?.RoomDed)),
        FineDed: getVal(inp.fineDed, getVal(saved?.FineDed)),
        JoiningKits: getVal(inp.joiningKits, getVal(saved?.JoiningKits)),
        OtherDed: getVal(inp.otherDed, getVal(saved?.OtherDed)),
        FoodDed: getVal(inp.foodDed, getVal(saved?.FoodDed)),

        Error: saved?.Status || ""
      };
    });

    const headers = Object.keys(data[0]);
    // 1. Create worksheet WITHOUT data first
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // 2. Get names (IMPORTANT)
    const selectedProperty = propertyList.find(
      (p) => p.PropertyId === effectiveSinglePropertyId
    );

    const propertyName = selectedProperty?.PropertyName || "N/A";

    const selectedClient = unitList.find(
      (u) => u.ClientID === selectedUnitId
    );

    const clientName = selectedClient?.ClientName || "N/A";

    // 3. Month-Year display
    const monthYearDisplay = `${monthNames[month - 1]} ${year}`;

    // 4. Add TOP INFO rows
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Client: ${clientName}`],
      [`Property: ${propertyName}`],
      [`Month: ${monthYearDisplay}`],
      [] // empty row for spacing
    ], { origin: "A1" });

    // 5. Add actual table (IMPORTANT OFFSET)
    XLSX.utils.sheet_add_json(worksheet, data, {
      origin: "A5", // 👈 data starts from row 5
      header: headers,
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(blob, `attendance_${month}_${year}.xlsx`);
  }

  const allEmpIds = paginatedEmployees
    .map((emp) => emp?.FacilityMember?.FacilityMemberId)
    .filter(Boolean);

  const isAllSelected =
    allEmpIds.length > 0 &&
    allEmpIds.every((id) => selectedEmpIds.has(id));

  const uniqueEmployees = Object.values(
    paginatedEmployees.reduce((acc, emp) => {
      const id = emp?.FacilityMember?.FacilityMemberId;
      if (!acc[id]) acc[id] = emp;
      return acc;
    }, {})
  );

  function toggleSelectAll(checked) {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);

      if (checked) {
        allEmpIds.forEach((id) => {
          next.add(id);

          // ensure inputs exist
          if (!dayInputs[id]) {
            next.add(id);
          }
        });
      } else {
        allEmpIds.forEach((id) => next.delete(id));
      }

      return next;
    });
  }

  // ---------------------------------------------------------
  // RENDER UI (unchanged)
  // ---------------------------------------------------------

  const thStyle = {
    border: "1px solid #cbd5e0",
    padding: "10px 8px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 14,
    background: "#f7fafc",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    border: "1px solid #e2e8f0",
    padding: "8px",
    textAlign: "center",
    verticalAlign: "middle",
  };

  const inputStyle = {
    width: "90px",
    textAlign: "center",
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid #cbd5e0",
    fontSize: 14,
  };
  return (
    <div
      style={{
        padding: "20px 24px",
        paddingLeft: "100px", // 👈 sidebar width
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {importing && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "rgba(255,255,255,0.8)",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
          }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem" }}></i>
          </div>
        </div>
      )}
      {attendanceLoading && !importing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(6px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              padding: "26px 30px",
              borderRadius: "12px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#111827",
              fontWeight: 700,
            }}
          >
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "2.25rem" }} />
            Refreshing attendance...
          </div>
        </div>
      )}
      {/* ===== Attendance Scope Selection ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "8px 14px",
          marginBottom: 20,
          background: "#f9fafb",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Select Client */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Client :</label>
          <select
            value={selectedUnitId || ""}
            onChange={(e) => {
              setSelectedUnitId(Number(e.target.value));
              setSelectedPropertyId([]);
            }}
            disabled={Number(reduxClientId) > 0}
            style={{ width: 240 }}
          >
            <option value="">-- Select Client --</option>
            {unitList.map((u) => (
              <option key={u.ClientID} value={u.ClientID}>
                {u.ClientName}
              </option>
            ))}
          </select>
        </div>

        {/* Select Unit */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            position: "relative",
            minWidth: 260,
          }}
        >
          <label style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
            Select Unit :
          </label>

          {/* Display Box */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (propertyList.length > 0) {
                setShowPropertyDropdown((prev) => !prev);
              }
            }}
            style={{
              border: "1px solid #cbd5e0",
              padding: "6px 10px",
              borderRadius: 6,
              background: "#fff",
              cursor: propertyList.length ? "pointer" : "not-allowed",
              opacity: propertyList.length ? 1 : 0.75,
            }}
          >
            {selectedPropertyId.length === propertyList.length
              ? "All Units Selected"
              : selectedPropertyId.length === 1
                ? propertyList.find(
                  (p) => p.PropertyId === selectedPropertyId[0]
                )?.PropertyName
                : `${selectedPropertyId.length} Units Selected`}
          </div>

          {/* Dropdown */}
          {showPropertyDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #cbd5e0",
                borderRadius: 6,
                padding: 8,
                maxHeight: 220,
                overflowY: "auto",
                zIndex: 10,
              }}
            >
              {propertyList.map((p) => (
                <div key={p.PropertyId}>
                  <input
                    type="checkbox"
                    checked={selectedPropertyId.includes(p.PropertyId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPropertyId((prev) => [
                          ...prev,
                          p.PropertyId,
                        ]);
                      } else {
                        setSelectedPropertyId((prev) =>
                          prev.filter((id) => id !== p.PropertyId)
                        );
                      }
                    }}
                  />
                  <span style={{ marginLeft: 8 }}>
                    {p.PropertyName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          maxWidth: "100%",
        }}
      >
        <h2 style={{ fontWeight: "bold", fontSize: "2rem" }}>
          Employee Attendance Summary
        </h2>

        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthNames[m - 1]}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => {
              const newY = Number(e.target.value);
              setYear(newY);
              if (newY === currentYear && month > currentMonth) {
                setMonth(currentMonth);
              }
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={exportToExcel}
            disabled={!hasSingleEffectiveProperty || attendanceLoading}
            style={{
              background:
                !hasSingleEffectiveProperty || attendanceLoading ? "#ccc" : "#3182ce",
              color: "#fff",
              padding: "6px 14px",
              cursor:
                !hasSingleEffectiveProperty || attendanceLoading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Total Days (Left) + Actions (Right) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Left: Total Days */}
       

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search by Employee Code, Name, or Designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: 320,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e0",
              fontSize: 14,
            }}
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #cbd5e0",
            fontSize: 14,
          }}
        >
          <option value="">All Departments</option>
          {departmentList.map((dept, i) => (
            <option key={i} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Push actions to right */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            disabled={importing || attendanceLoading}
            style={{
              background: importing || attendanceLoading ? "#cbd5e0" : "#6b46c1",
              color: importing || attendanceLoading ? "#4a5568" : "#fff",
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              cursor: importing || attendanceLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {importing ? "Importing..." : "Import"}
          </button>

          <button
            disabled={selectedEmpIds.size === 0 || saving || attendanceLoading}
            onClick={handleSaveAttendance}
            style={{
              background:
                selectedEmpIds.size === 0 || saving || attendanceLoading
                  ? "#ccc"
                  : "#48bb78",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 6,
            }}
          >
            {saving
              ? "Saving..."
              : `Save Attendance (${selectedEmpIds.size})`}
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={
              selectedEmpIds.size === 0 ||
              deleting ||
              attendanceLoading ||
              !hasSingleEffectiveProperty
            }
            style={{
              background:
                selectedEmpIds.size === 0 || deleting || attendanceLoading
                  ? "#ccc"
                  : "#e53e3e",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 6,
              cursor:
                selectedEmpIds.size === 0 || deleting || attendanceLoading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {deleting ? "Deleting..." : `Delete (${selectedEmpIds.size})`}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          maxWidth: "100%",
          border: "1px solid #e2e8f0",
          borderRadius: 6,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "auto", // ✅ IMPORTANT
            minWidth: "1600px",  // ensures columns don’t crush
          }}
        >
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...thStyle, width: 50 }}>S.No.</th>
              <th rowSpan={2} style={{ ...thStyle, width: 120 }}>
                Employee Code
              </th>

              <th rowSpan={2} style={{ ...thStyle, width: 200, textAlign: "left" }}>
                Employee Name
              </th>
              <th rowSpan={2} style={{ ...thStyle, width: 180 }}>
                Designation
              </th>
              <th
                rowSpan={2}
                style={{
                  ...thStyle,
                  width: 70,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span>Select</span>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </div>
              </th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Working Days</th>

              {/* Leave group */}
              <th colSpan={3} style={thStyle}>Leave</th>
              <th rowSpan={2} style={{ ...thStyle, width: 180 }}>Payable Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Weekly Off</th>
              <th rowSpan={2} style={{ ...thStyle, width: 100 }}>OT Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 110 }}>OT Hours</th>
              <th rowSpan={2} style={{ ...thStyle, width: 100 }}>NH Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 100 }}>FH Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 100 }}>Holidays</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Divide By Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>OT Month Days</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>PF Arrear</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Other Arrear</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Incentive</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Advance Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Uniform Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>BGV Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Room Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Fine Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Joining Kits</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Other Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Food Ded</th>
              <th rowSpan={2} style={{ ...thStyle, width: 100 }}>Status</th>
            </tr>

            <tr>
              <th style={{ ...thStyle, width: 90 }}>EL</th>
              <th style={{ ...thStyle, width: 90 }}>CL</th>
              <th style={{ ...thStyle, width: 90 }}>SL</th>
            </tr>
          </thead>

          <tbody>
            {uniqueEmployees.flatMap((emp, idx) => {
              if (!emp?.FacilityMember?.FacilityMemberId) return [];

              const empId = emp.FacilityMember.FacilityMemberId;
              const empCode = emp?.Profile?.EmployeeCode || "-";

              const name =
                emp?.Profile?.EmployeeName ||
                emp?.FacilityMember?.Name ||
                "Unknown";

              // 🔥 GET ALL ATTENDANCE ROWS
              const empAttendances = filteredAttendance.filter(
                (a) => a.EmpID === empId
              );

              const rows = empAttendances.length > 0 ? empAttendances : [{}];

              return rows.map((att, index) => {
                const attendanceId = att.AttendanceID || 0;

const rowKey = `${empId}_${attendanceId}`;
                const isChecked = selectedEmpIds.has(rowKey);

                const inp = dayInputs[rowKey] || {
                  ...baseExtraFields,

                  workingDays: att?.WorkingDays ?? "",
                  EL: att?.EL ?? "",
                  CL: att?.CL ?? "",
                  SL: att?.SL ?? "",
                  weekDaysOff: att?.WeekDaysOff ?? "",
                  otDays: att?.OtDays ?? "",
                  otHours: att?.OtHours ?? "",
                  totalDays: att?.PayableDays ?? "",

                  nhDays: att?.NHDays ?? "",
                  fhDays: att?.FHDays ?? "",
                  holidays: att?.Holidays ?? "",
                  divideByDays: att?.AttendanceID
                    ? att.DivideByDays ?? ""
                    : employeeSGMap[empId]?.divideByDays ?? globalTotalDays,

                  otMonthDays: att?.OtMonthDays ?? "",
                  pfArrear: att?.PFArrear ?? "",
                  otherArrear: att?.OtherArrear ?? "",
                  incentive: att?.Incentive ?? "",

                  advanceDed: att?.AdvanceDed ?? "",
                  uniformDed: att?.UniformDed ?? "",
                  bgvDed: att?.BGVDed ?? "",
                  roomDed: att?.RoomDed ?? "",
                  fineDed: att?.FineDed ?? "",
                  joiningKits: att?.JoiningKits ?? "",
                  otherDed: att?.OtherDed ?? "",
                  foodDed: att?.FoodDed ?? "",

                  status: att?.Status ?? "",
                };

                return (
                  <tr key={rowKey}>
                    <td style={tdStyle}>
                      {(currentPage - 1) * recordsPerPage + idx + 1}.{index + 1}
                    </td>

                    <td style={{ ...tdStyle, fontWeight: 500 }}>
                      {empCode}
                    </td>

                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>
                      {name}
                    </td>

                    {/* ✅ DESIGNATION FROM ATTENDANCE */}
                    <td style={{ ...tdStyle, textAlign: "left" }}>
                      {att?.Designation || "-"}
                    </td>

                    {/* Checkbox */}
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheckbox(rowKey)}
                      />
                    </td>

                    {/* Working Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.workingDays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "workingDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* EL */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.EL}
                        onChange={(e) =>
                          handleInputChange(rowKey, "EL", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* CL */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.CL}
                        onChange={(e) =>
                          handleInputChange(rowKey, "CL", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* SL */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.SL}
                        onChange={(e) =>
                          handleInputChange(rowKey, "SL", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Payable Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.totalDays ?? ""}
                        onChange={(e) =>
                          handleInputChange(rowKey, "totalDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Weekly Off */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.weekDaysOff}
                        onChange={(e) =>
                          handleInputChange(rowKey, "weekDaysOff", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* OT Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.otDays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "otDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* OT Hours */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.otHours}
                        onChange={(e) =>
                          handleInputChange(rowKey, "otHours", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* NH Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.nhDays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "nhDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* FH Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.fhDays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "fhDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Holidays */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.holidays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "holidays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Divide By Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.divideByDays ?? ""}
                        onChange={(e) =>
                          handleInputChange(rowKey, "divideByDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* OT Month Days */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.otMonthDays}
                        onChange={(e) =>
                          handleInputChange(rowKey, "otMonthDays", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* PF Arrear */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.pfArrear}
                        onChange={(e) =>
                          handleInputChange(rowKey, "pfArrear", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Other Arrear */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.otherArrear}
                        onChange={(e) =>
                          handleInputChange(rowKey, "otherArrear", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Incentive */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.incentive}
                        onChange={(e) =>
                          handleInputChange(rowKey, "incentive", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Advance Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.advanceDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "advanceDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Uniform Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.uniformDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "uniformDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* BGV Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.bgvDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "bgvDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Room Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.roomDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "roomDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Fine Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.fineDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "fineDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Joining Kits */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.joiningKits}
                        onChange={(e) =>
                          handleInputChange(rowKey, "joiningKits", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Other Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.otherDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "otherDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Food Ded */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.foodDed}
                        onChange={(e) =>
                          handleInputChange(rowKey, "foodDed", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <input
                        type="text"
                        disabled={!isChecked}
                        value={inp.status || ""}
                        onChange={(e) =>
                          handleInputChange(rowKey, "status", e.target.value)
                        }
                        style={{ ...inputStyle, width: "120px" }}
                      />
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>

        <span style={{ margin: "0 12px" }}>
          Page {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      {showConflictModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(980px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
              padding: 18,
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>
              Attendance Conflicts Found
            </h4>
            <p style={{ marginTop: 0, color: "#444", fontSize: 14 }}>
              Please select salary group for each employee/designation row before continuing.
            </p>

            <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Emp Code</th>
                    <th style={thStyle}>Employee Name</th>
                    <th style={thStyle}>Designation</th>
                    <th style={thStyle}>Error</th>
                    <th style={thStyle}>Salary Group</th>
                  </tr>
                </thead>
                <tbody>
                  {conflictRecords.map((record, idx) => {
                    const key = getConflictKey(record, idx);
                    return (
                      <tr key={key}>
                        <td style={tdStyle}>{record?.EmpCode || record?.EmployeeCode || "-"}</td>
                        <td style={tdStyle}>{record?.EmployeeName || "-"}</td>
                        <td style={tdStyle}>{record?.Designation || "-"}</td>
                        <td style={{ ...tdStyle, color: "#b91c1c", textAlign: "left" }}>
                          {record?.Error || "Employee belongs to another property"}
                        </td>
                        <td style={tdStyle}>
                          {(() => {
                            const rowOptions =
                              conflictSalaryOptionsMap[key] || salaryGroupOptions;
                            return (
                              <select
                                value={salaryGroupMap[key] || ""}
                                onChange={(e) =>
                                  setSalaryGroupMap((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                style={{ minWidth: 220, padding: "5px 7px" }}
                              >
                                <option value="">Select Salary Group</option>
                                {rowOptions.map((sg) => (
                                  <option key={sg.id} value={String(sg.id)}>
                                    {sg.name}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeConflictModal}
                disabled={confirmingUpload}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmCrossPropertyUpload}
                disabled={confirmingUpload}
              >
                {confirmingUpload ? "Saving..." : "Confirm & Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

