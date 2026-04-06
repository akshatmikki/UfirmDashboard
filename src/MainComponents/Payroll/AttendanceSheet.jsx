import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  getAttendanceByProperties,
  saveAttendanceBatch,
  deleteMultipleAttendance,
  uploadAttendance,
  getEmployeeMonthlyTotalOT,
  getEmployeesByOffices,
  updateAttendance,
  getFacilitySalaryConfig,
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

function getComputedDivideByDays(config, month, year) {
  const monthDaysValue = parsePositiveNumber(config?.MonthDays);
  if (monthDaysValue > 0) return monthDaysValue;

  const totalWorkingDaysValue = parsePositiveNumber(config?.TotalWorkingDays);
  if (totalWorkingDaysValue > 0) return totalWorkingDaysValue;

  let divideByDays = getDaysInMonth(month, year);
  const monthSundaysValue = parsePositiveNumber(config?.MonthSundays);

  if (monthSundaysValue > 0) {
    divideByDays -= monthSundaysValue;
  } else if (config?.ExcludeSunday) {
    divideByDays -= getSundaysInMonth(month, year);
  }

  return Math.max(1, divideByDays);
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

  const [employees, setEmployees] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  useEffect(() => {
    const close = () => setShowPropertyDropdown(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // { empId: { divideByDays, monthDays, totalWorkingDays, excludeSunday, monthSundays } }
  const [employeeSGMap, setEmployeeSGMap] = useState({});

  const [dayInputs, setDayInputs] = useState({});

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const days = getDaysInMonth(month, year);
    setGlobalTotalDays(days);
  }, [month, year]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const days = getDaysInMonth(month, year);
    setGlobalTotalDays(days);
  }, [month, year]);

  const totalDaysInSelectedMonth = getDaysInMonth(month, year);

  const [globalTotalDays, setGlobalTotalDays] = useState(
    totalDaysInSelectedMonth
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const filteredEmployees = employees.filter((emp) => {
    const code = emp?.Profile?.EmployeeCode?.toLowerCase() || "";
    const name =
      emp?.Profile?.EmployeeName?.toLowerCase() ||
      emp?.FacilityMember?.Name?.toLowerCase() ||
      "";
    const designation =
      emp?.EmployeeList?.Designation?.toLowerCase() ||
      emp?.Profile?.Designation?.toLowerCase() ||
      "";

    return (
      code.includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase()) ||
      designation.includes(searchTerm.toLowerCase())
    );
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

  const maxMonth = year === currentYear ? currentMonth : 12;
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
  async function handleImportClick() {

    if (selectedPropertyId.length !== 1) {
      alert("Please select exactly ONE unit before uploading attendance.");
      return;
    }

    fileInputRef.current.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      const monthyear = getMonthYearString(month, year);
      if (!propertyId) {
        alert("Invalid property selection.");
        return;
      }

      const res = await uploadAttendance(file, propertyId, monthyear);
     
      const contentType = res.headers["content-type"] || "";

      // 🔴 IF ERROR EXCEL RETURNED
      if (contentType.includes("application/vnd.openxmlformats")) {
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "AttendanceErrors.xlsx";
        link.click();

        alert("Some employees were invalid. Error file downloaded.");
      }
      // 🟢 NORMAL SUCCESS (JSON COMES AS BLOB)
      else {
        const text = await res.data.text(); // convert blob → text
        const data = JSON.parse(text);

        alert(data?.message || "Attendance uploaded successfully!");
      }

      await reloadAttendanceData();

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  }

  async function reloadAttendanceData() {
    const currMonthYear = getMonthYearString(month, year);

    let propertyIds =
      selectedPropertyId.length > 0
        ? selectedPropertyId
        : reduxPropertyId
          ? [reduxPropertyId]
          : [];

    if (!propertyIds.length) {
      console.warn("No property selected for reload");
      return;
    }

    const response = await getAttendanceByProperties(
      propertyIds,
      currMonthYear
    );

    const flat = response?.flatMap((p) => p.Employees || []) || [];

    setFilteredAttendance(flat);

    const mappedInputs = {};
    flat.forEach((att) => {
      const configDivideByDays =
        employeeSGMap[att.EmpID]?.divideByDays ?? globalTotalDays;

      mappedInputs[att.EmpID] = {
        workingDays: att.WorkingDays,
        EL: att.EL ?? "",
        CL: att.CL ?? "",
        SL: att.SL ?? "",
        weekDaysOff: att.WeekDaysOff,
        otDays: att.OtDays || "",
        otHours: att.OtHours || "",
        totalDays: att.PayableDays ?? "",
        manualTotalDays: false,
        nhDays: att.NHDays ?? "",
        fhDays: att.FHDays ?? "",
        holidays: att.Holidays ?? "",
        divideByDays: att.DivideByDays ?? configDivideByDays,
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
  }

  useEffect(() => {
    const loadUnits = async () => {
      try {
        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
          return;
        }
        if (Number(reduxPropertyId) > 0) {
          const res = await getClientByPropertyId(reduxPropertyId);
          setUnitList(res ? [res] : []);
          setSelectedUnitId(res?.ClientID || null);
        } else {
          const res = await getAllClients();
          setUnitList(res || []);
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
          return;
        }

        const data = await getEmployeesByOffices(officeIds);
        setEmployees(data || []);
      } catch (err) {
        console.error("Employee load failed", err);
        setEmployees([]);
      }
    };

    loadEmployees();
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds]);

  // ---------------------------------------------------------
  // Load facility salary config
  // ---------------------------------------------------------
  useEffect(() => {
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
          const res = await getFacilitySalaryConfig(officeId);
          const rows = Array.isArray(res) ? res : [];

          rows.forEach((cfg) => {
            const fmId = cfg?.FacilityMemberId;
            if (!fmId) return;

            map[fmId] = {
              divideByDays: getComputedDivideByDays(cfg, month, year),
              monthDays: cfg?.MonthDays ?? null,
              totalWorkingDays: cfg?.TotalWorkingDays ?? null,
              excludeSunday: !!cfg?.ExcludeSunday,
              monthSundays: cfg?.MonthSundays ?? null,
            };
          });
        } catch (err) {
          console.error("Facility salary config load error:", err);
        }
      }

      setEmployeeSGMap(map);
    }

    loadFacilityConfig();
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

    async function loadAttendance() {
      if (!employees.length) return;
      try {
        // 🔹 Decide which properties to use
        const propertyIds =
          selectedPropertyId.length > 0
            ? selectedPropertyId
            : reduxPropertyId
              ? [reduxPropertyId]
              : [];

        if (!propertyIds.length) return;

        const currMonthYear = getMonthYearString(month, year);

        // 🔹 NEW MULTI PROPERTY API
        const response = await getAttendanceByProperties(
          propertyIds,
          currMonthYear
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
              year
            );
          }
        } catch (err) {
          console.error("OT load failed:", err);
        }

        const mappedInputs = {};

        employees.forEach((emp) => {
          const empId = emp?.FacilityMember?.FacilityMemberId;
          const empCode = emp?.Profile?.EmployeeCode;

          if (!empId) return;

          const saved = filtered.find(
            (a) => a.EmpID === empId
          );

          const otMatch = otData?.find(
            (ot) => ot.EmployeeCode === empCode
          );

          mappedInputs[empId] = {
            workingDays: saved?.WorkingDays ?? "",
            EL: saved?.EL ?? "",
            CL: saved?.CL ?? "",
            SL: saved?.SL ?? "",
            weekDaysOff: saved?.WeekDaysOff ?? "",
            otDays: saved?.OtDays ?? "",
            otHours:
              saved?.OtHours !== null &&
                saved?.OtHours !== undefined &&
                saved?.OtHours !== ""
                ? saved.OtHours
                : otMatch?.TotalOTHours ?? "",
            totalDays:
              saved?.PayableDays ?? "",
            manualTotalDays: false,
            nhDays: saved?.NHDays ?? "",
            fhDays: saved?.FHDays ?? "",
            holidays: saved?.Holidays ?? "",
            divideByDays:
              saved?.DivideByDays ??
              employeeSGMap[empId]?.divideByDays ??
              globalTotalDays,
            otMonthDays: saved?.OtMonthDays ?? "",
            pfArrear: saved?.PFArrear ?? "",
            otherArrear: saved?.OtherArrear ?? "",
            incentive: saved?.Incentive ?? "",
            advanceDed: saved?.AdvanceDed ?? "",
            uniformDed: saved?.UniformDed ?? "",
            bgvDed: saved?.BGVDed ?? "",
            roomDed: saved?.RoomDed ?? "",
            fineDed: saved?.FineDed ?? "",
            joiningKits: saved?.JoiningKits ?? "",
            otherDed: saved?.OtherDed ?? "",
            foodDed: saved?.FoodDed ?? "",
            status: saved?.Status ?? "",
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
      }
    }

    loadAttendance();
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
  function toggleCheckbox(empId) {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);

      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);

        if (!dayInputs[empId]) {
          setDayInputs((old) => ({
            ...old,
            [empId]: {
              workingDays: "",
              EL: "",
              CL: "",
              SL: "",
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
  function handleInputChange(empId, field, value) {
    if (field !== "status" && !/^\d*\.?\d*$/.test(value)) return;

    setDayInputs((prev) => {
      const current = prev[empId] || {
        workingDays: "",
        EL: "",
        CL: "",
        SL: "",
        weekDaysOff: "",
        otDays: "",
        otHours: "",
        totalDays: globalTotalDays,
        manualTotalDays: false,
        ...baseExtraFields,
      };

      const updated = { ...current, [field]: value };

      if (field === "totalDays") {
        updated.manualTotalDays = true; // user override!
      }

      const totalDays =
        field === "totalDays"
          ? parseFloat(value) || 0
          : parseFloat(current.totalDays) ||
          globalTotalDays;

      const w = parseFloat(updated.workingDays) || 0;
      const el = parseFloat(updated.EL) || 0;
      const cl = parseFloat(updated.CL) || 0;
      const sl = parseFloat(updated.SL) || 0;
      const l = el + cl + sl;
      const wk = parseFloat(updated.weekDaysOff) || 0;

      if (["workingDays", "EL", "CL", "SL", "weekDaysOff"].includes(field)) {
        if (parseFloat(value) > totalDays) return prev;
      }

      // Only validate when NOT editing totalDays itself
      if (field !== "totalDays") {
        if (w + l + wk > totalDays) return prev;
      }

      return { ...prev, [empId]: updated };
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

      selectedEmpIds.forEach((empId) => {
        const emp = employees.find(
          (e) => e?.FacilityMember?.FacilityMemberId === empId
        );

        if (!emp) return;

        const empName =
          emp?.Profile?.EmployeeName ||
          emp?.EmployeeList?.Designation ||
          emp?.FacilityMember?.Name ||
          "Unknown";

        const inp = dayInputs[empId] || {};

        const EL = n(inp.EL);
        const CL = n(inp.CL);
        const SL = n(inp.SL);

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
          DivideByDays: n(inp.divideByDays),
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

        const existing = filteredAttendance.find(
          (a) =>
            String(a.EmpID) === String(empId) &&
            String(a.monthyear) === String(currMonthYear)
        );

        if (existing) {
          // 🔹 UPDATE using PUT
          updatePromises.push(
            updateAttendance(empId, currMonthYear, model)
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

      alert("Attendance saved successfully!");

      await reloadAttendanceData();

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
    if (selectedPropertyId.length !== 1) {
      alert("Please select exactly ONE unit before deleting attendance.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected attendance?"))
      return;

    setDeleting(true);

    try {
      await deleteMultipleAttendance(
        Array.from(selectedEmpIds),
        getMonthYearString(month, year),
        propertyId
      );

      await reloadAttendanceData();

    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  function exportToExcel() {

    const data = employees.map((emp, idx) => {

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
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });

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
            disabled
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
            style={{
              background: "#3182ce",
              color: "#fff",
              padding: "6px 14px",
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
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontWeight: "bold",
          }}
        >
          <span>Total Number of Days:</span>
          <input
            type="text"
            value={globalTotalDays}
            onChange={(e) => {
              if (!/^\d*$/.test(e.target.value)) return;

              const newVal = Number(e.target.value || 0);
              if (newVal < 1 || newVal > getDaysInMonth(month, year)) return;
              setGlobalTotalDays(newVal);

              setDayInputs((prev) => {
                const out = {};
                Object.keys(prev).forEach((id) => {
                  if (prev[id].manualTotalDays) {
                    out[id] = prev[id];
                  } else {
                    out[id] = { ...prev[id], divideByDays: newVal };
                  }
                });
                return out;
              });
            }}
            style={{
              width: 90,
              textAlign: "center",
              fontWeight: "bold",
              padding: "4px 6px",
              borderRadius: 4,
              border: "1px solid #cbd5e0",
            }}
          />
        </div>

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
            disabled={importing}
            style={{
              background: importing ? "#9f7aea" : "#6b46c1",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              cursor: importing ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {importing ? "Importing..." : "Import"}
          </button>

          <button
            disabled={selectedEmpIds.size === 0 || saving}
            onClick={handleSaveAttendance}
            style={{
              background: selectedEmpIds.size === 0 ? "#ccc" : "#48bb78",
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
              selectedPropertyId.length !== 1
            }
            style={{
              background:
                selectedEmpIds.size === 0 || deleting ? "#ccc" : "#e53e3e",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 6,
              cursor:
                selectedEmpIds.size === 0 || deleting
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
            {paginatedEmployees.map((emp, idx) => {
              const empCode = emp?.Profile?.EmployeeCode || "-";
              if (!emp?.FacilityMember?.FacilityMemberId) return null;
              const empId = emp.FacilityMember.FacilityMemberId;

              const designation =
                emp?.EmployeeList?.Designation ||
                emp?.Profile?.Designation ||
                "-";

              const name =
                emp?.Profile?.EmployeeName ||
                emp?.EmployeeList?.Designation ||
                emp?.FacilityMember?.Name ||
                "Unknown";

              const isChecked = selectedEmpIds.has(empId);

              const inp = dayInputs[empId] || {
                ...baseExtraFields,   // spread first
                workingDays: "",
                EL: "",
                CL: "",
                SL: "",
                weekDaysOff: "",
                otDays: "",
                otHours: "",
                totalDays: "",
                manualTotalDays: false,
                divideByDays:
                  employeeSGMap[empId]?.divideByDays ?? globalTotalDays, // override AFTER spread
              };

              return (
                <tr key={empId}>
                  <td style={tdStyle}>{idx + 1}</td>

                  {/* Employee Code */}
                  <td style={{ ...tdStyle, fontWeight: 500 }}>
                    {empCode}
                  </td>

                  {/* Employee Name */}
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>
                    {name}
                  </td>

                  {/* Designation */}
                  <td style={{ ...tdStyle, textAlign: "left" }}>
                    {designation}
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheckbox(empId)}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.workingDays}
                      onChange={(e) =>
                        handleInputChange(empId, "workingDays", e.target.value)
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
                        handleInputChange(empId, "EL", e.target.value)
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
                        handleInputChange(empId, "CL", e.target.value)
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
                        handleInputChange(empId, "SL", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.totalDays ?? ""}
                      onChange={(e) =>
                        handleInputChange(empId, "totalDays", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.weekDaysOff}
                      onChange={(e) =>
                        handleInputChange(empId, "weekDaysOff", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.otDays}
                      onChange={(e) =>
                        handleInputChange(empId, "otDays", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.otHours}
                      onChange={(e) =>
                        handleInputChange(empId, "otHours", e.target.value)
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
                        handleInputChange(empId, "nhDays", e.target.value)
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
                        handleInputChange(empId, "fhDays", e.target.value)
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
                        handleInputChange(empId, "holidays", e.target.value)
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
                        handleInputChange(empId, "divideByDays", e.target.value)
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
                        handleInputChange(empId, "otMonthDays", e.target.value)
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
                        handleInputChange(empId, "pfArrear", e.target.value)
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
                        handleInputChange(empId, "otherArrear", e.target.value)
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
                        handleInputChange(empId, "incentive", e.target.value)
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
                        handleInputChange(empId, "advanceDed", e.target.value)
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
                        handleInputChange(empId, "uniformDed", e.target.value)
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
                        handleInputChange(empId, "bgvDed", e.target.value)
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
                        handleInputChange(empId, "roomDed", e.target.value)
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
                        handleInputChange(empId, "fineDed", e.target.value)
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
                        handleInputChange(empId, "joiningKits", e.target.value)
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
                        handleInputChange(empId, "otherDed", e.target.value)
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
                        handleInputChange(empId, "foodDed", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      disabled={!isChecked}
                      value={inp.status || ""}
                      onChange={(e) =>
                        handleInputChange(empId, "status", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        width: "120px",
                      }}
                    />
                  </td>

                </tr>
              );
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
    </div>
  );
}
