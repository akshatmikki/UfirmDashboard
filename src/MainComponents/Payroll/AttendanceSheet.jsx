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
  updateAttendance,
  getFacilitySalaryConfig,
  getSalaryAllowancesByProperty,
} from "../../Services/PayrollService";

import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMonthYearString(month, year) {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function parsePositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function parseMonthYear(monthyear) {
  if (!monthyear || typeof monthyear !== "string") return null;
  const [y, m] = monthyear.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

function getAttendanceIdValue(att) {
  const raw = att?.AttendanceId ?? att?.AttendanceID ?? 0;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function safeDate(year, month, day) {
  const clamped = Math.min(Math.max(1, Number(day) || 1), getDaysInMonth(month, year));
  return new Date(Date.UTC(year, month - 1, clamped));
}

function countSundaysInRange(startDate, endDate) {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return 0;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  if (startDate > endDate) return 0;
  let count = 0;
  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) count++;
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

  if (!year || !month) return Math.max(1, getDaysInMonth(fallbackMonth, fallbackYear));

  const excludeSundaysRaw =
    config?.ExcludeSunday ?? config?.excludeSundays ?? config?.excludesundays;
  const excludeSundays =
    excludeSundaysRaw === true ||
    excludeSundaysRaw === 1 ||
    excludeSundaysRaw === "1" ||
    String(excludeSundaysRaw).toLowerCase() === "true";

  const monthSundaysValue = parsePositiveNumber(
    config?.MonthSundays ?? config?.monthSundays ?? config?.monthsundays
  );

  const salaryStartFromRaw =
    config?.SalaryStartFrom ?? config?.salaryStartFrom ?? config?.salarystartfrom ?? 1;
  const salaryEndToRaw =
    config?.SalaryEndTo ?? config?.salaryEndTo ?? config?.salaryendto ?? getDaysInMonth(month, year);

  let salaryStartFrom = Number(salaryStartFromRaw) || 0;
  let salaryEndTo = Number(salaryEndToRaw) || 0;

  const refMonth = month === 1 ? 12 : month - 1;
  const refYear = month === 1 ? year - 1 : year;

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

// ─── Component ───────────────────────────────────────────────────────────────

export default function AttendanceSheet() {
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxPropertyIds = useSelector((state) => state.Commonreducer.puidnlist);

  const [selectedPropertyId, setSelectedPropertyId] = useState([]);

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

  // ── All employee data comes solely from attendance records ──
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [propertyList, setPropertyList] = useState([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  const [departmentList, setDepartmentList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // employeeSGMap: { [empId]: { divideByDays, ...config } }
  const [employeeSGMap, setEmployeeSGMap] = useState({});
  const [dayInputs, setDayInputs] = useState({});

  const today = new Date();
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const [month, setMonth] = useState(prevMonthDate.getMonth() + 1);
  const [year, setYear] = useState(prevMonthDate.getFullYear());

  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictRecords, setConflictRecords] = useState([]);
  const [salaryGroupOptions, setSalaryGroupOptions] = useState([]);
  const [salaryGroupMap, setSalaryGroupMap] = useState({});
  const [conflictSalaryOptionsMap, setConflictSalaryOptionsMap] = useState({});
  const [pendingUpload, setPendingUpload] = useState(null);
  const [confirmingUpload, setConfirmingUpload] = useState(false);

  const attendanceLoadSeqRef = useRef(0);
  const fileInputRef = useRef(null);

  // ── Derived: build employee list from attendance data ──
  const employeeMap = {};
  filteredAttendance.forEach((att) => {
    if (!employeeMap[att.EmpID]) {
      employeeMap[att.EmpID] = {
        EmpID: att.EmpID,
        PropertyID: att.PropertyID,
        EmployeeCode: att.EmployeeCode || "",
        EmployeeName: att.EmployeeName || "",
        Designation: att.Designation || "",
        Department: att.Department || "",
      };
    }
  });
  const allEmployees = Object.values(employeeMap);

  // Global divide-by-days fallback
  const refMonth = month === 1 ? 12 : month - 1;
  const refYear = month === 1 ? year - 1 : year;
  const globalTotalDays = getDaysInMonth(refMonth, refYear);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const filteredEmployees = allEmployees.filter((emp) => {
    const code = (emp.EmployeeCode || "").toLowerCase();
    const name = (emp.EmployeeName || "").toLowerCase();
    const designation = (emp.Designation || "").toLowerCase();
    const department = (emp.Department || "").toLowerCase();

    const matchesSearch =
      code.includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase()) ||
      designation.includes(searchTerm.toLowerCase());

    const matchesDepartment =
      !selectedDepartment || department === selectedDepartment.toLowerCase();

    return matchesSearch && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Row keys:
  // - Saved rows use AttendanceId/AttendanceID as the key (stringified number)
  // - Unsaved rows use "temp:<EmpID>" to keep a stable unique key without "empid_number" formatting
  const makeRowKey = (empId, att) => {
    const attendanceId = getAttendanceIdValue(att);
    return attendanceId > 0 ? String(attendanceId) : `temp:${empId}`;
  };

  const getAttendanceIdFromRowKey = (rowKey) => {
    const key = String(rowKey);
    return /^\d+$/.test(key) ? Number(key) : 0;
  };

  const getEmpIdFromRowKey = (rowKey) => {
    const key = String(rowKey);
    if (key.startsWith("temp:")) return Number(key.slice("temp:".length)) || 0;

    const attendanceId = getAttendanceIdFromRowKey(key);
    if (attendanceId <= 0) return 0;

    const match = filteredAttendance.find((a) => getAttendanceIdValue(a) === attendanceId);
    return Number(match?.EmpID) || 0;
  };

  // Month/year options
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const years = [];
  for (let y = 2021; y <= currentYear; y++) years.push(y);
  const maxMonth = year === currentYear ? currentMonth - 1 : 12;
  const months = [];
  for (let m = 1; m <= maxMonth; m++) months.push(m);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const baseExtraFields = {
    EL: "", CL: "", SL: "",
    nhDays: "", fhDays: "", holidays: "",
    divideByDays: "", otMonthDays: "",
    pfArrear: "", otherArrear: "", incentive: "",
    advanceDed: "", uniformDed: "", bgvDed: "",
    roomDed: "", fineDed: "", joiningKits: "",
    otherDed: "", foodDed: "", status: "",
  };

  // ── Close property dropdown on outside click ──
  useEffect(() => {
    const close = () => setShowPropertyDropdown(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // Reset page on search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedDepartment]);

  // ── Load clients ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllClients();
        setUnitList(res || []);
        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
        } else if (Number(reduxPropertyId) > 0) {
          const clientRes = await getClientByPropertyId(reduxPropertyId);
          setSelectedUnitId(clientRes?.ClientID || null);
        }
      } catch (err) {
        console.error("Failed to load clients", err);
      }
    };
    load();
  }, [reduxClientId, reduxPropertyId]);

  // ── Load properties when client changes ──
  useEffect(() => {
    const load = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId([]);
          return;
        }
        const res = await getPropertiesByClientId(selectedUnitId);
        const properties = res || [];
        setPropertyList(properties);
        const allIds = properties.map((p) => p.PropertyId);
        if (Number(reduxPropertyId) > 0) setSelectedPropertyId([Number(reduxPropertyId)]);
        else setSelectedPropertyId(allIds);
      } catch (err) {
        console.error("Failed to load properties", err);
      }
    };
    load();
  }, [selectedUnitId, reduxPropertyId]);

  // ── Core: load attendance — this is the ONLY source of employee data ──
  useEffect(() => {
    setCurrentPage(1);
    const controller = new AbortController();

    async function loadAttendance() {
      const propertyIds =
        selectedPropertyId.length > 0
          ? selectedPropertyId
          : Number(reduxPropertyId) > 0
            ? [Number(reduxPropertyId)]
            : Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0
              ? reduxPropertyIds
              : [];

      if (!propertyIds.length) {
        setFilteredAttendance([]);
        setDayInputs({});
        setSelectedEmpIds(new Set());
        return;
      }

      const seq = (attendanceLoadSeqRef.current || 0) + 1;
      attendanceLoadSeqRef.current = seq;
      setAttendanceLoading(true);

      try {
        const currMonthYear = getMonthYearString(month, year);

        const [attResponse, otData] = await Promise.allSettled([
          getAttendanceByProperties(propertyIds, currMonthYear, { signal: controller.signal }),
          propertyIds.length === 1
            ? getEmployeeMonthlyTotalOT(propertyIds[0], month, year, { signal: controller.signal })
            : Promise.resolve([]),
        ]);

        const safeData = attResponse.status === "fulfilled" && Array.isArray(attResponse.value)
          ? attResponse.value
          : [];

        const otList =
          otData.status === "fulfilled" && Array.isArray(otData.value) ? otData.value : [];

        setFilteredAttendance(safeData);

        // Derive department list from attendance data
        const departments = [...new Set(safeData.map((a) => a.Department).filter(Boolean))];
        setDepartmentList(departments);
        setSelectedDepartment("");

        // Build dayInputs from attendance records
        const mappedInputs = {};
        safeData.forEach((att) => {
          const key = makeRowKey(att.EmpID, att);
          const otMatch = otList.find((ot) => ot.EmployeeCode === att.EmployeeCode);

          mappedInputs[key] = {
            workingDays: att.WorkingDays ?? "",
            EL: att.EL ?? "",
            CL: att.CL ?? "",
            SL: att.SL ?? "",
            weekDaysOff: att.WeekDaysOff ?? "",
            otDays: att.OtDays ?? (otMatch?.OtDays ?? ""),
            otHours: att.OtHours ?? (otMatch?.OtHours ?? ""),
            totalDays: att.PayableDays ?? "",
            manualTotalDays: false,
            nhDays: att.NHDays ?? "",
            fhDays: att.FHDays ?? "",
            holidays: att.Holidays ?? "",
            divideByDays:
              att.DivideByDays && Number(att.DivideByDays) > 0
                ? att.DivideByDays
                : getDaysInMonth(month, year),
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
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (err?.response?.status === 404) {
          setFilteredAttendance([]);
          setDayInputs({});
          setSelectedEmpIds(new Set());
          setDepartmentList([]);
        } else {
          console.error("Attendance load failed:", err);
          appCommon.ShownotifyError("Failed to load attendance.");
        }
      } finally {
        if (seq === attendanceLoadSeqRef.current) setAttendanceLoading(false);
      }
    }

    loadAttendance();
    return () => controller.abort();
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds, month, year]);

  // ── Load facility salary config (for divideByDays per employee) ──
  useEffect(() => {
    const controller = new AbortController();

    async function loadFacilityConfig() {
      const propertyIds = effectivePropertyIds
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0);

      if (!propertyIds.length || !filteredAttendance.length) {
        setEmployeeSGMap({});
        return;
      }

      const map = {};

      for (const officeId of propertyIds) {
        try {
          const res = await getFacilitySalaryConfig(officeId, { signal: controller.signal });
          const rows = Array.isArray(res) ? res : [];
          rows.forEach((cfg) => {
            const fmId = cfg?.FacilityMemberId;
            if (!fmId) return;
            const normalizedConfig = {
              TotalWorkingDays: cfg?.TotalWorkingDays ?? cfg?.totalWorkingDays ?? cfg?.totalworkingdays ?? null,
              MonthDays: cfg?.MonthDays ?? cfg?.monthDays ?? cfg?.monthdays ?? null,
              ExcludeSunday: cfg?.ExcludeSunday ?? cfg?.excludeSundays ?? cfg?.excludesundays ?? false,
              MonthSundays: cfg?.MonthSundays ?? cfg?.monthSundays ?? cfg?.monthsundays ?? null,
              SalaryStartFrom: cfg?.SalaryStartFrom ?? cfg?.salaryStartFrom ?? cfg?.salarystartfrom ?? null,
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
          if (err?.name === "AbortError") return;
          console.error("Facility salary config load error:", err);
        }
      }

      setEmployeeSGMap(map);
    }

    loadFacilityConfig();
    return () => controller.abort();
  }, [filteredAttendance, month, year, selectedPropertyId, reduxPropertyId]);

  // ── Reload helper ──
  async function reloadAttendanceData() {
    const propertyIds =
      selectedPropertyId.length > 0
        ? selectedPropertyId
        : Number(reduxPropertyId) > 0
          ? [Number(reduxPropertyId)]
          : [];

    if (!propertyIds.length) return;

    const seq = (attendanceLoadSeqRef.current || 0) + 1;
    attendanceLoadSeqRef.current = seq;
    setAttendanceLoading(true);

    try {
      const currMonthYear = getMonthYearString(month, year);
      const response = await getAttendanceByProperties(propertyIds, currMonthYear);
      const safeData = Array.isArray(response) ? response : [];

      setFilteredAttendance(safeData);

      const departments = [...new Set(safeData.map((a) => a.Department).filter(Boolean))];
      setDepartmentList(departments);

      const mappedInputs = {};
      safeData.forEach((att) => {
        const key = makeRowKey(att.EmpID, att);
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
          divideByDays: att.DivideByDays ?? employeeSGMap[att.EmpID]?.divideByDays ?? globalTotalDays,
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
      appCommon.ShownotifyError("Failed to refresh attendance.");
    } finally {
      if (seq === attendanceLoadSeqRef.current) setAttendanceLoading(false);
    }
  }

  // ── Input handling ──
  function handleInputChange(rowKey, field, value) {
    if (field !== "status" && !/^\d*\.?\d*$/.test(value)) return;

    setDayInputs((prev) => {
      const current = prev[rowKey] || {
        ...baseExtraFields,
        workingDays: "", weekDaysOff: "", otDays: "", otHours: "",
        totalDays: globalTotalDays, manualTotalDays: false,
        divideByDays: globalTotalDays,
      };

      const updated = { ...current, [field]: value };

      if (field === "totalDays") updated.manualTotalDays = true;
      if (field === "divideByDays") updated.manualDivideByDays = true;

      const monthDaysLimit = 31;

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

      if (field === "divideByDays" && Number(value) > monthDaysLimit) {
        updated.divideByDays = String(monthDaysLimit);
      }

      const fieldsToCheck = ["workingDays", "EL", "CL", "SL", "weekDaysOff"];
      if (fieldsToCheck.includes(field)) {
        const v = Number(updated[field]) || 0;
        if (v > totalDaysResolved) updated[field] = String(totalDaysResolved);
      }

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

      return { ...prev, [rowKey]: updated };
    });
  }

  // ── Checkbox ──
  function toggleCheckbox(rowKey, att = {}, empId = null) {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);

        setDayInputs((old) => {
          if (old[rowKey]) return old;

          return {
            ...old,
            [rowKey]: {
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

              divideByDays:
                att?.DivideByDays && Number(att.DivideByDays) > 0
                  ? att.DivideByDays
                  : getDaysInMonth(month, year),

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
              manualTotalDays: false,
            },
          };
        });
      }

      return next;
    });
  }

  const paginatedEmpIds = paginatedEmployees.map((e) => {
    const atts = filteredAttendance.filter((a) => a.EmpID === e.EmpID);
    return atts.length > 0
      ? atts.map((a) => makeRowKey(e.EmpID, a))
      : [`temp:${e.EmpID}`];
  }).flat();

  const isAllSelected =
    paginatedEmpIds.length > 0 && paginatedEmpIds.every((k) => selectedEmpIds.has(k));

  function toggleSelectAll(checked) {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      paginatedEmpIds.forEach((k) => (checked ? next.add(k) : next.delete(k)));
      return next;
    });
  }

  function buildAttendanceModel({ empId, emp, inp, currMonthYear }) {
    const n = (v) => (v === "" || v == null ? 0 : Number(v));
    const EL = n(inp.EL), CL = n(inp.CL), SL = n(inp.SL);

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
    const divideByDaysToSave = inputDivideByDays > 0 ? inputDivideByDays : fallbackDivideByDays;

    return {
      EmpID: empId,
      EmployeeName: emp.EmployeeName,
      PropertyID: emp.PropertyID,
      monthyear: currMonthYear,
      IsActive: true,
      CreatedOn: new Date().toISOString(),
      WorkingDays: n(inp.workingDays),
      LeaveDays: EL + CL + SL,
      WeekDaysOff: n(inp.weekDaysOff),
      EL, CL, SL,
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
  }

  // ── Save ──
  async function handleSaveAttendance() {
    if (selectedEmpIds.size === 0) {
      alert("Please select at least one employee.");
      return;
    }
    setSaving(true);
    const currMonthYear = getMonthYearString(month, year);

    try {
      const updatePromises = [];
      const newRecords = [];
      const savedModelsByKey = {};

      selectedEmpIds.forEach((rowKey) => {
        const empId = getEmpIdFromRowKey(rowKey);
        const attendanceId = getAttendanceIdFromRowKey(rowKey);
        const emp = employeeMap[empId];
        if (!emp) return;

        const inp = dayInputs[rowKey] || {};
        const model = buildAttendanceModel({ empId, emp, inp, currMonthYear });

        savedModelsByKey[rowKey] = model;

        const existing = filteredAttendance.find(
          (a) => String(a.EmpID) === String(empId) && String(a.monthyear) === String(currMonthYear)
        );
        const currentAttendanceId = getAttendanceIdValue(existing) || attendanceId;

        if (existing && currentAttendanceId !== -1 && currentAttendanceId !== 0) {
          updatePromises.push(
            updateAttendance(currentAttendanceId, model).catch((err) => {
              if (err?.response?.status === 404) { newRecords.push(model); return null; }
              throw err;
            })
          );
        } else {
          newRecords.push(model);
        }
      });

      if (updatePromises.length > 0) await Promise.all(updatePromises);
      if (newRecords.length > 0) await saveAttendanceBatch(currMonthYear, newRecords);

      // Optimistic update
      setFilteredAttendance((prev) => {
        const merged = [...(Array.isArray(prev) ? prev : [])];
        Object.values(savedModelsByKey).forEach((m) => {
          const idx = merged.findIndex(
            (a) => String(a.EmpID) === String(m.EmpID) && String(a.monthyear) === String(m.monthyear)
          );
          const normalized = {
            ...(idx >= 0 ? merged[idx] : {}),
            EmpID: m.EmpID, monthyear: m.monthyear,
            WorkingDays: m.WorkingDays, EL: m.EL, CL: m.CL, SL: m.SL,
            WeekDaysOff: m.WeekDaysOff, OtDays: m.OtDays, OtHours: m.OtHours,
            PayableDays: m.PayableDays, NHDays: m.NHDays, FHDays: m.FHDays,
            Holidays: m.Holidays, DivideByDays: m.DivideByDays, OtMonthDays: m.OtMonthDays,
            PFArrear: m.PFArrear, OtherArrear: m.OtherArrear, Incentive: m.Incentive,
            AdvanceDed: m.AdvanceDed, UniformDed: m.UniformDed, BGVDed: m.BGVDed,
            RoomDed: m.RoomDed, FineDed: m.FineDed, JoiningKits: m.JoiningKits,
            OtherDed: m.OtherDed, FoodDed: m.FoodDed, Status: m.Status,
          };
          if (idx >= 0) merged[idx] = normalized;
          else merged.push(normalized);
        });
        return merged;
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

  // ── Delete ──
  async function handleBulkDelete() {
    if (!hasSingleEffectiveProperty) {
      alert("Please select exactly ONE unit before deleting attendance.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete selected attendance?")) return;
    setDeleting(true);
    try {
      // Delete is done by AttendanceId(s) only
      const attendanceIds = Array.from(
        new Set(Array.from(selectedEmpIds).map(getAttendanceIdFromRowKey).filter((id) => id > 0))
      );

      if (!attendanceIds.length) {
        alert("No valid attendance records selected for deletion. Unsaved records cannot be deleted.");
        return;
      }
      await deleteMultipleAttendance(attendanceIds);
      await reloadAttendanceData();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Export ──
  function exportToExcel() {
    if (!hasSingleEffectiveProperty) {
      alert("Please select exactly ONE unit before exporting.");
      return;
    }

    const data = filteredEmployees.map((emp, idx) => {
      const saved = filteredAttendance.find((a) => a.EmpID === emp.EmpID) || null;
      const rowKey = makeRowKey(emp.EmpID, saved || {});
      const inp = dayInputs[rowKey] || {};
      const getVal = (val, fallback = 0) =>
        val === "" || val == null ? fallback : Number(val);

      return {
        "S.No.": idx + 1,
        EmpCode: emp.EmployeeCode,
        EmployeeName: emp.EmployeeName,
        Designation: emp.Designation,
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
        Error: saved?.Status || "",
      };
    });

    if (!data.length) { alert("No data to export."); return; }

    const headers = Object.keys(data[0]);
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const selectedProperty = propertyList.find((p) => p.PropertyId === effectiveSinglePropertyId);
    const propertyName = selectedProperty?.PropertyName || "N/A";
    const selectedClient = unitList.find((u) => u.ClientID === selectedUnitId);
    const clientName = selectedClient?.ClientName || "N/A";
    const monthYearDisplay = `${monthNames[month - 1]} ${year}`;

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Client: ${clientName}`],
      [`Property: ${propertyName}`],
      [`Month: ${monthYearDisplay}`],
      [],
    ], { origin: "A1" });

    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5", header: headers });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${propertyName}_${month}_${year}.xlsx`);
  }

  // ── Import ──
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
      if (!effectiveSinglePropertyId) { alert("Invalid property selection."); return; }
      const res = await uploadAttendance(file, effectiveSinglePropertyId, monthyear);
      const handled = await handleUploadResponse(res, file, effectiveSinglePropertyId, monthyear);
      if (!handled?.confirmationNeeded) await reloadAttendanceData();
    } catch (err) {
      const handledError = await handleUploadErrorResponse(err, file, effectiveSinglePropertyId, monthyear);
      if (handledError) return;
      console.error("Upload failed:", err);
      alert("Upload failed.");
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  }

  // ── Conflict modal helpers ──
  const getConflictKey = (record, idx = 0) => {
    const empPart = record?.FacilityMemberId || record?.EmpID || record?.EmpCode || `idx-${idx}`;
    const designationPart = record?.DesignationId ?? record?.DesignationMasterId ?? "no-designation";
    const monthPart = record?.MonthYear || record?.monthyear || "no-month";
    return `${empPart}__${designationPart}__${monthPart}`;
  };

  const normalizeSalaryGroupOptions = (rows = []) => {
    const normalized = [];
    (rows || []).forEach((row) => {
      const id = Number(row?.SalaryGroup_ID || row?.SalaryGroupId || row?.Id || 0);
      if (!Number.isFinite(id) || id <= 0) return;
      normalized.push({ id, name: row?.SalaryGroup || row?.SalaryGroupName || `Salary Group ${id}` });
    });
    const seen = new Set();
    return normalized.filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
  };

  const parseBlobJson = async (blob) => {
    try { const text = await blob.text(); return text ? JSON.parse(text) : null; }
    catch { return null; }
  };

  const openCrossPropertyConflictModal = async (conflicts, propertyId, monthyear, file) => {
    const safeConflicts = Array.isArray(conflicts) ? conflicts : [];
    if (!safeConflicts.length) return;
    let options = [];
    try {
      const sgRows = await getSalaryAllowancesByProperty(propertyId);
      options = normalizeSalaryGroupOptions(sgRows || []);
    } catch { options = []; }
    if (!options.length) {
      alert("Cross-property employees found, but no salary group is available. Please create salary group first.");
      return;
    }
    const defaultMap = {}, optionMap = {};
    safeConflicts.forEach((record, idx) => {
      const key = getConflictKey(record, idx);
      const conflictOptions = normalizeSalaryGroupOptions(record?.SalaryGroupOptions || record?.SalaryGroups || []);
      const mergedOptions = conflictOptions.length ? conflictOptions : options;
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
      const url = window.URL.createObjectURL(new Blob([responseBlob]));
      const link = document.createElement("a");
      link.href = url; link.download = "AttendanceErrors.xlsx"; link.click();
      alert("Some employees were invalid. Error file downloaded.");
      return { handled: true };
    }
    const data = await parseBlobJson(responseBlob);
    if (!data) { alert("Unexpected upload response received."); return { handled: true }; }
    if (data.requiresConfirmation && Array.isArray(data.conflicts)) {
      await openCrossPropertyConflictModal(data.conflicts, propertyId, monthyear, file);
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
        await openCrossPropertyConflictModal(data.conflicts, propertyId, monthyear, file);
        return true;
      }
      if (data.message || data.error) { alert(data.message || data.error); return true; }
      return false;
    } catch { return false; }
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
    if (!pendingUpload || !conflictRecords.length) { closeConflictModal(); return; }
    const missingSelection = conflictRecords.some((record, idx) => {
      const key = getConflictKey(record, idx);
      const selected = Number(salaryGroupMap[key]);
      return !Number.isFinite(selected) || selected <= 0;
    });
    if (missingSelection) { alert("Please select salary group for all conflict rows."); return; }
    const mappings = conflictRecords.map((record, idx) => {
      const key = getConflictKey(record, idx);
      return {
        EmpCode: record?.EmpCode || record?.EmployeeCode || "",
        FacilityMemberId: record?.FacilityMemberId || record?.EmpID || null,
        PropertyId: pendingUpload.propertyId,
        SalaryGroupId: Number(salaryGroupMap[key]),
        DesignationId: record?.DesignationId ?? record?.DesignationMasterId ?? null,
        MonthYear: pendingUpload.monthyear || record?.MonthYear || "",
      };
    });
    setConfirmingUpload(true);
    try {
      const res = await uploadAttendance(pendingUpload.file, pendingUpload.propertyId, pendingUpload.monthyear, { forceUpload: true, crossPropertyMappings: mappings });
      const handled = await handleUploadResponse(res, pendingUpload.file, pendingUpload.propertyId, pendingUpload.monthyear);
      if (!handled?.confirmationNeeded) { closeConflictModal(); await reloadAttendanceData(); }
    } catch (err) {
      const handledError = await handleUploadErrorResponse(err, pendingUpload.file, pendingUpload.propertyId, pendingUpload.monthyear);
      if (handledError) return;
      alert("Upload failed after confirmation.");
    } finally {
      setConfirmingUpload(false);
    }
  };

  // ── Styles ──
  const thStyle = {
    border: "1px solid #cbd5e0", padding: "10px 8px", textAlign: "center",
    fontWeight: 600, fontSize: 14, background: "#f7fafc", whiteSpace: "nowrap",
  };
  const tdStyle = {
    border: "1px solid #e2e8f0", padding: "8px", textAlign: "center", verticalAlign: "middle",
  };
  const inputStyle = {
    width: "90px", textAlign: "center", padding: "4px 6px",
    borderRadius: 4, border: "1px solid #cbd5e0", fontSize: 14,
  };

  // ── Render ──
  return (
    <div style={{ padding: "20px 24px", paddingLeft: "100px", width: "100%", boxSizing: "border-box" }}>

      {/* Loading overlays */}
      {importing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.8)", padding: 30, borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem" }} />
          </div>
        </div>
      )}
      {attendanceLoading && !importing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.85)", padding: "26px 30px", borderRadius: 12, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 14, color: "#111827", fontWeight: 700 }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "2.25rem" }} />
            Refreshing attendance...
          </div>
        </div>
      )}

      {/* Scope selection */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "8px 14px", marginBottom: 20, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Client :</label>
          <select
            value={selectedUnitId || ""}
            onChange={(e) => { setSelectedUnitId(Number(e.target.value)); setSelectedPropertyId([]); }}
            disabled={Number(reduxClientId) > 0}
            style={{ width: 240 }}
          >
            <option value="">-- Select Client --</option>
            {unitList.map((u) => <option key={u.ClientID} value={u.ClientID}>{u.ClientName}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", minWidth: 260 }}>
          <label style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Select Unit :</label>
          <div
            onClick={(e) => { e.stopPropagation(); if (propertyList.length) setShowPropertyDropdown((p) => !p); }}
            style={{ border: "1px solid #cbd5e0", padding: "6px 10px", borderRadius: 6, background: "#fff", cursor: propertyList.length ? "pointer" : "not-allowed", opacity: propertyList.length ? 1 : 0.75 }}
          >
            {selectedPropertyId.length === propertyList.length
              ? "All Units Selected"
              : selectedPropertyId.length === 1
                ? propertyList.find((p) => p.PropertyId === selectedPropertyId[0])?.PropertyName
                : `${selectedPropertyId.length} Units Selected`}
          </div>
          {showPropertyDropdown && (
            <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #cbd5e0", borderRadius: 6, padding: 8, maxHeight: 220, overflowY: "auto", zIndex: 10 }}>
              {propertyList.map((p) => (
                <div key={p.PropertyId}>
                  <input
                    type="checkbox"
                    checked={selectedPropertyId.includes(p.PropertyId)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPropertyId((prev) => [...prev, p.PropertyId]);
                      else setSelectedPropertyId((prev) => prev.filter((id) => id !== p.PropertyId));
                    }}
                  />
                  <span style={{ marginLeft: 8 }}>{p.PropertyName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: "bold", fontSize: "2rem" }}>Employee Attendance Summary</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m) => <option key={m} value={m}>{monthNames[m - 1]}</option>)}
          </select>
          <select value={year} onChange={(e) => { const newY = Number(e.target.value); setYear(newY); if (newY === currentYear && month > currentMonth) setMonth(currentMonth); }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={exportToExcel}
            disabled={!hasSingleEffectiveProperty || attendanceLoading}
            style={{ background: !hasSingleEffectiveProperty || attendanceLoading ? "#ccc" : "#3182ce", color: "#fff", padding: "6px 14px", cursor: !hasSingleEffectiveProperty || attendanceLoading ? "not-allowed" : "pointer" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by Employee Code, Name, or Designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 320, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e0", fontSize: 14 }}
        />
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e0", fontSize: 14 }}
        >
          <option value="">All Departments</option>
          {departmentList.map((dept, i) => <option key={i} value={dept}>{dept}</option>)}
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".csv,.xlsx" onChange={handleFileChange} />
          <button onClick={handleImportClick} disabled={importing || attendanceLoading} style={{ background: importing || attendanceLoading ? "#cbd5e0" : "#6b46c1", color: importing || attendanceLoading ? "#4a5568" : "#fff", padding: "8px 20px", borderRadius: 6, border: "none", cursor: importing || attendanceLoading ? "not-allowed" : "pointer" }}>
            {importing ? "Importing..." : "Import"}
          </button>
          <button disabled={selectedEmpIds.size === 0 || saving || attendanceLoading} onClick={handleSaveAttendance} style={{ background: selectedEmpIds.size === 0 || saving || attendanceLoading ? "#ccc" : "#48bb78", color: "#fff", padding: "8px 20px", borderRadius: 6 }}>
            {saving ? "Saving..." : `Save Attendance (${selectedEmpIds.size})`}
          </button>
          <button onClick={handleBulkDelete} disabled={selectedEmpIds.size === 0 || deleting || attendanceLoading || !hasSingleEffectiveProperty} style={{ background: selectedEmpIds.size === 0 || deleting || attendanceLoading ? "#ccc" : "#e53e3e", color: "#fff", padding: "8px 20px", borderRadius: 6, cursor: selectedEmpIds.size === 0 || deleting || attendanceLoading ? "not-allowed" : "pointer" }}>
            {deleting ? "Deleting..." : `Delete (${selectedEmpIds.size})`}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", maxWidth: "100%", border: "1px solid #e2e8f0", borderRadius: 6 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto", minWidth: "1600px" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...thStyle, width: 50 }}>S.No.</th>
              <th rowSpan={2} style={{ ...thStyle, width: 120 }}>Employee Code</th>
              <th rowSpan={2} style={{ ...thStyle, width: 200, textAlign: "left" }}>Employee Name</th>
              <th rowSpan={2} style={{ ...thStyle, width: 180 }}>Designation</th>
              <th rowSpan={2} style={{ ...thStyle, width: 70 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span>Select</span>
                  <input type="checkbox" checked={isAllSelected} onChange={(e) => toggleSelectAll(e.target.checked)} />
                </div>
              </th>
              <th rowSpan={2} style={{ ...thStyle, width: 130 }}>Working Days</th>
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
            {(() => {
              let serialNo = (currentPage - 1) * recordsPerPage;
              return paginatedEmployees.flatMap((emp) => {
              const empId = emp.EmpID;
              const empAttendances = filteredAttendance.filter((a) => a.EmpID === empId);
              const rows = empAttendances.length > 0 ? empAttendances : [{}];

              return rows.map((att, index) => {
                serialNo += 1;
                const attendanceId = getAttendanceIdValue(att);
                const rowKey = makeRowKey(empId, att);
                const isChecked = selectedEmpIds.has(rowKey);

                const inp = dayInputs[rowKey] ?? {
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
                  divideByDays:
                    att?.DivideByDays && Number(att.DivideByDays) > 0
                      ? att.DivideByDays
                      : getDaysInMonth(month, year),
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

                const mkInput = (field, extraStyle = {}) => (
                  <input
                    type="text"
                    disabled={!isChecked}
                    value={inp[field] ?? ""}
                    onChange={(e) => handleInputChange(rowKey, field, e.target.value)}
                    style={{ ...inputStyle, ...extraStyle }}
                  />
                );

                return (
                  <tr key={rowKey}>
                    <td style={tdStyle}>{serialNo}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{emp.EmployeeCode || "-"}</td>
                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>{emp.EmployeeName || "Unknown"}</td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>{att?.Designation || emp.Designation || "-"}</td>
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheckbox(rowKey, att, empId)}
                      />
                    </td>
                    <td style={tdStyle}>{mkInput("workingDays")}</td>
                    <td style={tdStyle}>{mkInput("EL")}</td>
                    <td style={tdStyle}>{mkInput("CL")}</td>
                    <td style={tdStyle}>{mkInput("SL")}</td>
                    <td style={tdStyle}>{mkInput("totalDays")}</td>
                    <td style={tdStyle}>{mkInput("weekDaysOff")}</td>
                    <td style={tdStyle}>{mkInput("otDays")}</td>
                    <td style={tdStyle}>{mkInput("otHours")}</td>
                    <td style={tdStyle}>{mkInput("nhDays")}</td>
                    <td style={tdStyle}>{mkInput("fhDays")}</td>
                    <td style={tdStyle}>{mkInput("holidays")}</td>
                    <td style={tdStyle}>{mkInput("divideByDays")}</td>
                    <td style={tdStyle}>{mkInput("otMonthDays")}</td>
                    <td style={tdStyle}>{mkInput("pfArrear")}</td>
                    <td style={tdStyle}>{mkInput("otherArrear")}</td>
                    <td style={tdStyle}>{mkInput("incentive")}</td>
                    <td style={tdStyle}>{mkInput("advanceDed")}</td>
                    <td style={tdStyle}>{mkInput("uniformDed")}</td>
                    <td style={tdStyle}>{mkInput("bgvDed")}</td>
                    <td style={tdStyle}>{mkInput("roomDed")}</td>
                    <td style={tdStyle}>{mkInput("fineDed")}</td>
                    <td style={tdStyle}>{mkInput("joiningKits")}</td>
                    <td style={tdStyle}>{mkInput("otherDed")}</td>
                    <td style={tdStyle}>{mkInput("foodDed")}</td>
                    <td style={tdStyle}>{mkInput("status", { width: "120px" })}</td>
                  </tr>
                );
              });
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</button>
        <span style={{ margin: "0 12px" }}>Page {currentPage} / {totalPages || 1}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
      </div>

      {/* Conflict Modal */}
      {showConflictModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "min(980px, 96vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 8, boxShadow: "0 12px 32px rgba(0,0,0,0.2)", padding: 18 }}>
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>Attendance Conflicts Found</h4>
            <p style={{ marginTop: 0, color: "#444", fontSize: 14 }}>Please select salary group for each row before continuing.</p>
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
                    const rowOptions = conflictSalaryOptionsMap[key] || salaryGroupOptions;
                    return (
                      <tr key={key}>
                        <td style={tdStyle}>{record?.EmpCode || record?.EmployeeCode || "-"}</td>
                        <td style={tdStyle}>{record?.EmployeeName || "-"}</td>
                        <td style={tdStyle}>{record?.Designation || "-"}</td>
                        <td style={{ ...tdStyle, color: "#b91c1c", textAlign: "left" }}>{record?.Error || "Employee belongs to another property"}</td>
                        <td style={tdStyle}>
                          <select value={salaryGroupMap[key] || ""} onChange={(e) => setSalaryGroupMap((prev) => ({ ...prev, [key]: e.target.value }))} style={{ minWidth: 220, padding: "5px 7px" }}>
                            <option value="">Select Salary Group</option>
                            {rowOptions.map((sg) => <option key={sg.id} value={String(sg.id)}>{sg.name}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button type="button" className="btn btn-secondary" onClick={closeConflictModal} disabled={confirmingUpload}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmCrossPropertyUpload} disabled={confirmingUpload}>{confirmingUpload ? "Saving..." : "Confirm & Upload"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
