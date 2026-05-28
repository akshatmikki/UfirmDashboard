import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  // getUngeneratedSalaryByOffice,
  createGeneratedSalary,
  // getEmployeeGeneratedSalaries,
  getFacilityMemberSalaryDetailsByClientBranch,
  deleteGeneratedSalary,
  regenerateEmployeeSalary,
  updateGeneratedSalary,
  getAllowancesDeductions,
  getUngeneratedSalaryByProperties,
  getGeneratedSalaryByProperties,
  getApprovedEmployees,
  getEmployeesByOffices
} from "../../Services/PayrollService";
import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const displayNameMap = {
  Basic: "Basic",
  LEAVEWAGES: "Leave Wages",
  HRA: "HRA",
  Gratuity: "Gratuity",
  OTDaysAmount: "OTDaysAmount",
  OTHoursAmount: "OTHoursAmount",
  "AdjAmt/Incentive": "AdjAmt/Incentive",
  PFArrear: "PFArrear",
  OTHALL: "OTHALL",
  Bonus: "Bonus",
  DA: "DA",
  PF: "PF",
  PftAmount: "PFT",
  // LwfEmployeeAmount: "LWF",
  LwfAmount: "LWF",
  Fine: "Fine",
  AdvanceAmount: "Adv.",
  UNIFORM: "Uniform",
  OthDeduction: "OthDed",
  FOOD: "Food",
  MaintDeduction: "Maint",
  AccommodationDeduction: "Acmd",
  IncomeTax: "IncomeTax",
  ABC: "ABC",
  SEPARATEBONUS: "SEPARATEBONUS",
  SEPARATELEAVE: "SEPARATELEAVE",
  OTAmount: "OTAmount",
  BGV: "BGV",
  Room: "Room",
  Joiningkits: "Joining Kits",
  NHAmount: "NHAmount",
  FHAmount: "FHAmount",
  EduAll: "Education Allowance",
  PerfAll: "Performance Allowance",
  SplAll: "Special Allowance",
  Wash: "Washing Allowance",
  LoanEMI: "Loan EMI",
};

const boxStyle = {
  textAlign: "center",
  border: "1px solid #b0b8cc",
  borderRadius: 8,
  width: 250,
  minHeight: 250,
  background: "#fff",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export default function GenerateSalary() {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let defaultMonth = today.getMonth(); // previous month
  let defaultYear = today.getFullYear();

  if (defaultMonth === 0) {
    defaultMonth = 12;
    defaultYear = defaultYear - 1;
  }
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxUserId = useSelector((state) => state.Commonreducer.userId);

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState([]);
  const [empCodeMap, setEmpCodeMap] = useState({});
  const [loadingAll, setLoadingAll] = useState(true);

  const officeId =
    selectedPropertyId.length === 1
      ? selectedPropertyId[0]
      : reduxPropertyId || null;
  const effectivePropertyId =
    selectedPropertyId.length === 1
      ? selectedPropertyId[0]
      : reduxPropertyId || null;
  // const officeId = useSelector((state) => state.Commonreducer.puidn);

  // UI state
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [searchText, setSearchText] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingBatchStatus, setGeneratingBatchStatus] = useState("");
  const [creatingPayslipPdf, setCreatingPayslipPdf] = useState(false);
  const [generatedEmployees, setGeneratedEmployees] = useState([]);
  const [loadingGenerated, setLoadingGenerated] = useState(false);
  const [selectedSalaryRows, setSelectedSalaryRows] = useState([]);
  const [viewPayslipHtml, setViewPayslipHtml] = useState("");
  const [viewPayslipOpen, setViewPayslipOpen] = useState(false);
  const [searchGeneratedText, setSearchGeneratedText] = useState("");
  const [selectedRegenEmployees, setSelectedRegenEmployees] = useState([]);

  // Master-driven names (from master API)
  const [masterAllowanceNames, setMasterAllowanceNames] = useState([]); // names (strings)
  const [masterDeductionNames, setMasterDeductionNames] = useState([]);

  // Salary data / pagination
  const [salaryData, setSalaryData] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [loadingSalaryData, setLoadingSalaryData] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const close = () => setUnitDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // years/months arrays
  const years = [];
  for (let y = 2021; y <= currentYear; y++) years.push(y);
  const months = [];
  const maxMonth =
    selectedYear === currentYear
      ? currentMonth === 1
        ? 12
        : currentMonth - 1
      : 12;
  for (let m = 1; m <= maxMonth; m++) months.push(m);

  // ----------------------------
  // Helper: normalize a string for robust matching
  // ----------------------------
  function normalizeKeyName(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  function getEmployeeKey(entity) {
    return Number(entity?.FacilityMemberId ?? entity?.EmployeeId ?? 0);
  }

  const getEmpKey = (emp) =>
    `${emp.EmployeeId}_${emp.DesignationId || 'single'}`;

  function isEmployeeFrozen(entity) {
    const employeeId = getEmployeeKey(entity);
    return generatedEmployees.some(
      (emp) => Number(emp.EmployeeId) === employeeId && emp.IsFreezed
    );
  }

  // Map master 'Name' to the actual key used in salary row
  // Strategy:
  // 1) If exact key exists in row -> return it
  // 2) If case-insensitive match exists -> return that key
  // 3) If normalized match (remove non-alphanum, uppercase) matches -> return that key
  // 4) Fallback: return original master name (may not exist in row)
  function findRowKeyForMasterName(masterName, row) {
    if (!masterName) return masterName;
    const keys = Object.keys(row || {});
    // exact
    if (keys.includes(masterName)) return masterName;
    // case-insensitive
    const lower = masterName.toLowerCase();
    const ci = keys.find((k) => k.toLowerCase() === lower);
    if (ci) return ci;
    // normalized
    const normMaster = normalizeKeyName(masterName);
    const match = keys.find((k) => normalizeKeyName(k) === normMaster);
    if (match) return match;
    // special small heuristics:
    // if masterName contains "PFT" or "PFT Amount", prefer "PftAmount"
    if (/PFT/i.test(masterName)) {
      const pftKey = keys.find((k) => normalizeKeyName(k).includes("PFT"));
      if (pftKey) return pftKey;
    }
    if (/LWF/i.test(masterName)) {
      const lwfKey = keys.find((k) => normalizeKeyName(k).includes("LWF"));
      if (lwfKey) return lwfKey;
    }
    if (/SEPARATEBONUS|SEPARATE BONUS/i.test(masterName)) {
      const sp = keys.find((k) => normalizeKeyName(k).includes("SEPARATEBONUS") || normalizeKeyName(k).includes("SEPARATEBONUS"));
      if (sp) return sp;
    }
    // no match found
    return masterName;
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
        console.log("Failed to load clients", err);
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

        if (Number(reduxPropertyId) > 0) {
          // navbar specific property
          setSelectedPropertyId([Number(reduxPropertyId)]);
        } else if (properties.length === 1) {
          // ✅ ONLY ONE → auto select
          setSelectedPropertyId([properties[0].PropertyId]);
        } else {
          // ❌ MULTIPLE → select none
          setSelectedPropertyId([]);
        }

      } catch (err) {
        console.log("Failed to load properties", err);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId]);

  // ----------------------------
  // Load master allowance/deduction list
  // ----------------------------
  useEffect(() => {
    async function loadMaster() {
      try {
        const list = await getAllowancesDeductions(); // expects [{ ID, Type, Name, ...}, ...]
        const arr = list || [];

        const allowances = arr.filter((x) => x.Type === "A" || x.Type === "OA").map((x) => x.Name);
        const deductions = arr.filter((x) => x.Type === "D" || x.Type === "OD").map((x) => x.Name);

        // Ensure Basic is first if present in master; we'll also always show Basic if present in salary row
        const uniqAllow = Array.from(new Set(allowances));
        const withoutBasic = uniqAllow.filter((n) => n !== "Basic");
        const finalAllow = uniqAllow.includes("Basic") ? ["Basic", ...withoutBasic] : withoutBasic;

        setMasterAllowanceNames(finalAllow);
        setMasterDeductionNames(Array.from(new Set(deductions)));
      } catch (err) {
        console.error("Failed to load master allowance/deduction list:", err);
        setMasterAllowanceNames([]);
        setMasterDeductionNames([]);
      }
    }

    loadMaster();
  }, [officeId]);

  useEffect(() => {
    const loadBaseData = async () => {
      if (!selectedPropertyId.length || !selectedMonth || !selectedYear) return;

      setLoadingAll(true);

      try {
        const monthName = monthNames[selectedMonth - 1];

        const [empList, empCodes] = await Promise.all([
          getUngeneratedSalaryByProperties(
            selectedPropertyId,
            monthName,
            selectedYear
          ),
          getEmployeesByOffices(selectedPropertyId),
        ]);

        // employees
        const employees = empList || [];
        setAllEmployees(employees);

        // departments
        const uniqueDepartments = [
          ...new Set(employees.map(e => e.Department).filter(Boolean))
        ].sort();
        setDepartments(uniqueDepartments);

        // designations
        const uniqueDesignations = [
          ...new Set(
            employees.flatMap(emp =>
              (emp.Designations || []).map(d => d.Designation)
            ).filter(Boolean)
          )
        ].sort();
        setDesignations(uniqueDesignations);

        // employee code map
        const map = {};
        (empCodes || []).forEach(item => {
          const id = item.FacilityMember?.FacilityMemberId;
          const code = item.Profile?.EmployeeCode;
          if (id) map[id] = code;
        });
        setEmpCodeMap(map);

      } catch (err) {
        console.log(err);
        setAllEmployees([]);
        setDepartments([]);
        setDesignations([]);
      } finally {
        setLoadingAll(false);
      }
    };

    loadBaseData();
  }, [selectedPropertyId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedPropertyId.length && selectedMonth && selectedYear) {
      fetchGeneratedEmployees();
    }
  }, [selectedPropertyId, selectedMonth, selectedYear, searchGeneratedText, empCodeMap]);


  useEffect(() => {
    filterEmployees();
  }, [selectedDepartment, selectedDesignation, allEmployees, searchText, generatedEmployees, empCodeMap]);

  useEffect(() => {
    setSelectedEmployees((prev) => prev.filter((emp) => !isEmployeeFrozen(emp)));
    setSelectedRegenEmployees((prev) => prev.filter((emp) => !isEmployeeFrozen(emp)));
  }, [generatedEmployees]);

  useEffect(() => {
    // Whenever property changes → clear regen box + hide grid
    setSelectedRegenEmployees([]);
    setShowGrid(false);
  }, [officeId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".unit-dropdown-wrapper")) {
        setUnitDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let filtered = allEmployees;

    if (selectedDepartment) {
      filtered = filtered.filter(
        (emp) => emp.Department === selectedDepartment
      );
    }

    const uniqueDesignations = [
      ...new Set(
        filtered
          .flatMap((emp) => (emp.Designations || []).map((d) => d.Designation))
          .filter(Boolean)
      ),
    ].sort();

    setDesignations(uniqueDesignations);

    // Optional: reset designation if it no longer exists
    setSelectedDesignation("");
  }, [selectedDepartment, allEmployees]);

  // ----------------------------
  // Fetch helpers
  // ----------------------------
  // const fetchEmployees = async () => {
  //   setLoading(true);
  //   try {
  //     const monthName = monthNames[selectedMonth - 1];
  //     const data = await getUngeneratedSalaryByOffice(officeId, monthName, selectedYear);
  //     setAllEmployees(data || []);
  //     const uniqueDesignations = [...new Set((data || []).map((emp) => emp.Designation).filter(Boolean))].sort();
  //     setDesignations(uniqueDesignations);
  //   } catch (error) {
  //     console.error("Failed to fetch employees:", error);
  //     alert("Failed to fetch employees. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const filterEmployees = () => {
    let filtered = allEmployees.filter((emp) => !isEmployeeFrozen(emp));

    // Filter by Department (if selected)
    if (selectedDepartment) {
      filtered = filtered.filter(
        (emp) => emp.Department === selectedDepartment
      );
    }

    // Filter by Designation (if selected)
    if (selectedDesignation) {
      filtered = filtered.filter(
        (emp) => emp.Designations?.some(
          (d) => d.Designation === selectedDesignation
        )
      );
    }

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();

      filtered = filtered.filter((emp) => {
        const nameMatch =
          emp.EmployeeName &&
          emp.EmployeeName.toLowerCase().includes(search);

        const codeMatch =
          empCodeMap[emp.EmployeeId] &&
          empCodeMap[emp.EmployeeId].toLowerCase().includes(search);

        return nameMatch || codeMatch;
      });
    }

    setFilteredEmployees(filtered);
  };

  const fetchGeneratedEmployees = async () => {
    setLoadingGenerated(true);
    try {
      const data = await getGeneratedSalaryByProperties(
        selectedPropertyId
      );

      const monthName = selectedMonth
        ? monthNames[selectedMonth - 1]
        : null;

      const filtered = data.filter((emp) => {
        const monthMatch = !monthName
          ? emp.Year === selectedYear
          : emp.Month === monthName && emp.Year === selectedYear;

        if (!monthMatch) return false;

        if (searchGeneratedText.trim()) {
          const search = searchGeneratedText.toLowerCase();

          const nameMatch =
            emp.EmployeeName &&
            emp.EmployeeName.toLowerCase().includes(search);

          const codeMatch =
            empCodeMap[emp.EmployeeId] &&
            empCodeMap[emp.EmployeeId].toLowerCase().includes(search);

          return nameMatch || codeMatch;
        }

        return true;
      });

      setGeneratedEmployees(filtered || []);
    } catch (error) {
      console.error("Failed to fetch generated employees:", error);
      setGeneratedEmployees([]);
    } finally {
      setLoadingGenerated(false);
    }
  };

  const fetchSalaryDetails = async (specificIds = null) => {
    setLoadingSalaryData(true);
    try {
      const facilityMemberIds = specificIds && specificIds.length ? specificIds : generatedEmployees.map((emp) => emp.EmployeeId);
      const monthName = selectedMonth ? monthNames[selectedMonth - 1] : null;

      if (!monthName) {
        setSalaryData([]);
        setLoadingSalaryData(false);
        return [];
      }

      if (!effectivePropertyId) {
        setSalaryData([]);
        setShowGrid(false);
        return [];
      }

      const data = await getFacilityMemberSalaryDetailsByClientBranch({
        facilityMemberIds,
        branchId: null,
        clientId: selectedUnitId || reduxClientId || null,
        propertyIds: String(effectivePropertyId),
        month: monthName,
        year: selectedYear,
        requireGeneratedSalary: false,
      });
      setSalaryData(data || []);
      if ((data || []).length === 0) setShowGrid(false);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch salary details:", error);
      setSalaryData([]);
      return [];
    } finally {
      setLoadingSalaryData(false);
    }
  };

  const buildNetSalaryMap = async (facilityMemberIds = []) => {
    const monthName = selectedMonth ? monthNames[selectedMonth - 1] : null;
    if (!monthName || !effectivePropertyId || !facilityMemberIds.length) return { netMap: new Map(), rowDataMap: new Map() };

    try {
      const data = await getFacilityMemberSalaryDetailsByClientBranch({
        facilityMemberIds,
        branchId: null,
        clientId: selectedUnitId || reduxClientId || null,
        propertyIds: String(effectivePropertyId),
        month: monthName,
        year: selectedYear,
        requireGeneratedSalary: false,
      });

      const netMap = new Map();
      const rowDataMap = new Map();
      for (const row of Array.isArray(data) ? data : []) {
        const id = Number(row?.FacilityMemberId ?? row?.EmployeeId ?? 0);
        if (!id) continue;

        const allowanceKeys = getRowAllowanceKeys(row);
        const deductionKeys = getRowDeductionKeys(row);
        const totalAllowance = computeTotalAllowance(row, allowanceKeys);
        const totalDeduction = row.TotalDeduction ?? computeTotalDeduction(row, deductionKeys);
        const net = row.NetSalary ?? (totalAllowance - totalDeduction);

        row.TotalAllowance = totalAllowance;
        row.TotalDeduction = totalDeduction;
        row.NetSalary = net;

        const key = `${id}_${row.DesignationId}`;
        netMap.set(key, Number(net) || 0);
        rowDataMap.set(key, row);
      }
      return { netMap, rowDataMap };
    } catch (error) {
      console.error("Failed to compute net salary amount:", error);
      return { netMap: new Map(), rowDataMap: new Map() };
    }
  };

  // ----------------------------
  // Row-level computed lists
  // - derive effective allowance and deduction field keys for a row
  // - show only >0 (except Basic which is always shown if present)
  // ----------------------------
  function getRowAllowanceKeys(row) {
    const rowKeys = Object.keys(row || {});
    const foundKeys = [];

    // Always include Basic (case-insensitive)
    const basicKey = rowKeys.find(
      (k) => normalizeKeyName(k) === normalizeKeyName("Basic")
    );

    if (basicKey) {
      foundKeys.push(basicKey);
    }

    // Include ONLY master-defined allowances
    for (const masterName of masterAllowanceNames) {
      const mappedKey = findRowKeyForMasterName(masterName, row);

      if (
        mappedKey &&
        row.hasOwnProperty(mappedKey) &&
        Number(row[mappedKey] || 0) > 0 &&
        !foundKeys.includes(mappedKey)
      ) {
        foundKeys.push(mappedKey);
      }
    }

    return foundKeys;
  }

  function getRowDeductionKeys(row) {
    const rowKeys = Object.keys(row || {});
    const found = [];

    // Map master deduction names to actual row keys (if they exist)
    for (const masterName of masterDeductionNames) {
      const mappedKey = findRowKeyForMasterName(masterName, row);
      if (mappedKey && row.hasOwnProperty(mappedKey)) {
        if (Number(row[mappedKey]) > 0) found.push(mappedKey);
      }
    }

    // Also include numeric keys present in row that look like deductions but not already included
    // Common deduction candidates by key substring
    const deductionCandidates = ["PF", "ESI", "PFT", "LWF", "FOOD", "ACCOMMODATION", "UNIFORM", "ABC", "LOAN", "EMI"]; // substring hints
    for (const k of rowKeys) {
      if (found.includes(k)) continue;

      const norm = normalizeKeyName(k);

      // ❌ EXCLUDE NON-DEDUCTION FIELDS
      if (
        norm === "DESIGNATIONID" ||
        norm === "EMPLOYEEID" ||
        norm === "FACILITYMEMBERID" ||
        norm === "LOANID"
      ) {
        continue;
      }

      // 🚫 Do not include system/limit fields
      if (
        norm === "ESINUMBER" ||
        norm === "PFVARIABLESUM" ||
        norm === "PFLIMIT" ||
        norm === "ESIVARIABLESUM" ||
        norm === "ESILIMIT" ||
        norm === "TOTALGROSS" ||
        norm === "OTAMOUNT"
      ) {
        continue;
      }

      const val = Number(row[k]);
      if (!Number.isNaN(val) && val > 0) {
        const isHint = deductionCandidates.some((hint) =>
          norm.includes(normalizeKeyName(hint))
        );
        const isMasterDeduction = masterDeductionNames.some(
          (mn) => normalizeKeyName(mn) === norm
        );

        if (isHint || isMasterDeduction) {
          found.push(k);
        }
      }
    }


    return Array.from(new Set(found));
  }

  function isValidMobile(number) {
    if (!number) return false;

    const str = String(number).replace(/\D/g, "");

    // must be exactly 10 digits
    if (!/^\d{10}$/.test(str)) return false;

    // ❌ all same digits (0000000000, 1111111111)
    if (/^(\d)\1{9}$/.test(str)) return false;

    // ❌ obvious fake patterns
    if (str.startsWith("0000") || str.startsWith("1000")) return false;

    return true;
  }

  // compute total allowance & total deduction for display / payslip
  function computeTotalAllowance(row, allowanceKeysForRow) {
    return allowanceKeysForRow.reduce((s, k) => s + Number(row[k] || 0), 0);
  }
  function computeTotalDeduction(row, deductionKeysForRow) {
    return deductionKeysForRow.reduce((s, k) => s + Number(row[k] || 0), 0);
  }

  // ----------------------------
  // Payslip HTML generation (uses per-row computed lists)
  // ----------------------------
  function generatePayslipHTML(row) {
    const safe = (val, fallback = "-") =>
      val === null || val === undefined || String(val).trim() === "" ? fallback : val;

    const safeDate = (val) =>
      val && val.includes("T") ? val.split("T")[0] : "-";
    const allowanceKeysForRow = getRowAllowanceKeys(row);
    const deductionKeysForRow = getRowDeductionKeys(row);
    const totalAllowance = computeTotalAllowance(row, allowanceKeysForRow);
    const totalDeduction = computeTotalDeduction(row, deductionKeysForRow);

    return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000; font-size: 10px; line-height: 1.1; }
        .co-bold { font-size: 11px; font-weight: 800; }
        .info-table { width: 100%; margin-bottom: 6px; border-collapse: collapse; }
        .info-table td { padding: 1px 3px; border: none; font-size: 11px;}
        table.pay-slip-table {
          width: 100%; border-collapse: collapse; margin-top: 6px;
        }
        table.pay-slip-table th {
          background: #fff; font-weight: bold; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111;
          text-align: left;
          padding: 6px 8px;
          font-size: 11px;
        }
        table.pay-slip-table td {
          font-size: 10.5px; border: none; padding: 3px 6px;
        }
        .v-bold { border-right: 1.5px solid #111 !important; }
        .v-light { border-right: 1px solid #bababa !important; }
        .no-horiz-border td { border-top: none !important; }
        .double-bottom td { border-bottom: 1.5px solid #111 !important; padding-bottom: 4px;}
        .bold-top {
          border-top: 1.5px solid #111 !important;
          font-size: 11px;
          font-weight: 600;
        }
        .leave-title {
          border-top: 1px solid #111 !important;
          border-bottom: 1px solid #111 !important;
          padding-top: 3px;
          padding-bottom: 3px;
        }
      </style>
    </head>
    <body>
      <div style="border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1.5; line-height:1.4;">
            <img src="/Assets/Urest-logo.png" style="height:45px; margin-bottom:4px;" />
            <div class="co-bold" style="white-space: nowrap;">UFIRM TECHNOLOGIES PVT. LTD.</div>
            <div style="font-size:10px;">H-64, SEC-63, NOIDA, UP - 201301</div>
          </div>
          <div style="flex:1; text-align:center; padding-top:5px;">
            <div style="font-size:18px; font-weight:800; letter-spacing:1px;">SALARY SLIP</div>
            <div style="font-size:10px; margin-top:2px; color:#444;">
              For the Month of <b>${safe(row.Month)} ${safe(row.Year)}</b>
            </div>
          </div>
          <div style="flex:1.5; text-align:right; font-size:10px; line-height:1.4;">
            <div style="font-weight:800; font-size:11px;">Establishment:</div>
            <div>${safe(row.PropertyName)} - ${safe(row.Pincode)}</div>
            <div style="font-size:9px;">${safe(row.AddressLine1)}${row.Landmark ? ", " + safe(row.Landmark) : ""}</div>
            <div style="margin-top:2px;"><b>Principal:</b> ${safe(row.ClientName)}</div>
          </div>
        </div>
      </div>          
      <table class="info-table" style="margin-bottom:10px;">
        <tr>
          <td><b>Employee Name:</b></td><td>${safe(row.FacilityMemberName)}</td>
          <td><b>Bank Name:</b></td><td>${safe(row.BankName)}</td>
          <td><b>Acc/Card No.:</b></td><td>${safe(row.BankAccountNumber)}</td>
        </tr>
        <tr>
          <td><b>Emp Code:</b></td><td>${safe(row.EmployeeCode)}</td>
          <td><b>IFSC Code:</b></td><td>${safe(row.BankIFSCCode)}</td>
          <td><b>PF No.:</b></td><td>${safe(row.PF_number)}</td>
        </tr>
        <tr>
          <td><b>Father's Name:</b></td><td>${safe(row.FatherName)}</td>
          <td><b>Pay Mode:</b></td><td>Bank Transfer</td>
          <td><b>UAN No.:</b></td><td>${safe(row.UANNumber)}</td>
        </tr>
        <tr>
          <td><b>Designation:</b></td><td>${safe(row.Designation)}</td>
          <td><b>ESI No.:</b></td><td>${safe(row.ESINumber)}</td>
          <td><b>Mobile No.:</b></td><td>${isValidMobile(row.MobileNumber) ? row.MobileNumber : "-"}</td>
        </tr>
        <tr>
          <td><b>Joining Date:</b></td><td>${safeDate(row.DateOfJoining)}</td>
        </tr>
      </table>
      <table class="pay-slip-table">
        <tr>
          <th>EARNING</th><th class="v-bold">AMOUNT</th>
          <th>DEDUCTION</th><th class="v-light">AMOUNT</th>
          <th>ATTENDANCE</th><th>VALUE</th>
        </tr>
        <tr>
          <td>Basic</td><td class="v-bold">${row.Basic || row.MonthlyBaseSalary || row.MonthlyBase || row.ProRatedSalary || 0}</td>
          <td>PF</td><td class="v-light">${row.PF || 0}</td>
          <td>Working Days</td><td>${row.AttendanceTotalWorkingDays || "0"}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>DA</td><td class="v-bold">${row.DA || 0}</td>
          <td>ESI</td><td class="v-light">${row.ESI || 0}</td>
          <td>Ho.Days</td><td>${row.HoDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>HRA</td><td class="v-bold">${row.HRA || 0}</td>
          <td>LWF</td><td class="v-light">${row.LWF || row.LwfAmount || row.LwfEmployeeAmount || 0}</td>
          <td>Weekly Offs</td><td>${row.WeekDaysOff || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Gratuity</td><td class="v-bold">${row.Gratuity || 0}</td>
          <td>PFT</td><td class="v-light">${row.PftAmount || 0}</td>
          <td>OTDays</td><td>${row.OTDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>OTDaysAmount</td><td class="v-bold">${row.OTDaysAmount || 0}</td>
          <td>Adv.</td><td class="v-light">${row.AdvanceDed || row.AdvanceAmount || row.Advance || row.LoanAdvanceAmount || 0}</td>
          <td>OTHours</td><td>${row.OTHours || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>OTHoursAmount</td><td class="v-bold">${row.OTHoursAmount || 0}</td>
          <td>OthDed</td><td class="v-light">${row.OtherDed || row.OthDed || 0}</td>
          <td>Duty Days</td><td>${row.WorkingDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>AdjAmt/Incentive</td><td class="v-bold">${row.AdjAmt || row.Incentive || 0}</td>
          <td>DocDed</td><td class="v-light">${row.DocDeduction || 0}</td>
          <td>Sal Days</td><td>${row.SalDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>PFArrear</td><td class="v-bold">${row.PFArrear || 0}</td>
          <td>Food</td><td class="v-light">${row.FOOD || row.Food || 0}</td>
          <td>NH Days</td><td>${row.NHDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>NH Amount</td><td class="v-bold">${row.NHAmount || 0}</td>
          <td>Maint.</td><td class="v-light">${row.MaintDeduction || row.Maintenance || 0}</td>
          <td>FH Days</td><td>${row.FHDays || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>FH Amount</td><td class="v-bold">${row.FHAmount || 0}</td>
          <td>Uniform</td><td class="v-light">${row.UNIFORM || row.Uniform || 0}</td>
          <td class="leave-title"><b>LEAVE STATUS</b></td><td class="leave-title"></td>
        </tr>  
        <tr class="no-horiz-border">
          <td>Bonus</td><td class="v-bold">${row.Bonus || row.BONUS || 0}</td>
          <td>Fine</td><td class="v-light">${row.Fine || 0}</td>
          <td>EL</td><td>${row.EL || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Separate Bonus</td><td class="v-bold">${row.SEPARATEBONUS || row.SeparateBonus || 0}</td>
          <td>Acmd.Ded</td><td class="v-light">${row.AccommodationDeduction || row.AcmdDed || 0}</td>
          <td>CL</td><td>${row.CL || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Leave Wages</td><td class="v-bold">${row.LEAVE || row.LEAVEWAGES || row.LeaveWages || 0}</td>
          <td>IncomeTax</td><td class="v-light">${row.INCOMETAX || row.IncomeTax || 0}</td>
          <td>SL</td><td>${row.SL || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Conv</td><td class="v-bold">${row.CONV || row.Conv || 0}</td>
          <td>Loan EMI</td><td class="v-light">${row.LoanEMI || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Edu. All.</td><td class="v-bold">${row.EduAll || row.EducationAllowance || 0}</td>
          <td>Room</td><td class="v-light">${row.RoomDed || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Perf. All.</td><td class="v-bold">${row.PerfAll || row.PerformanceAllowance || 0}</td>
          <td>Joining Kits</td><td class="v-light">${row.JoiningKits || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Spl. All.</td><td class="v-bold">${row.SPLALL || row.SpecialAllowance || 0}</td>
          <td>BGV</td><td class="v-light">${row.BGVDed || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>Wash. All.</td><td class="v-bold">${row.WASH || row.WashingAllowance || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>OthAll</td><td class="v-bold">${row.OTHALL || row.OthAll || 0}</td>
        </tr>
        <tr class="no-horiz-border">
          <td>OthArrear</td><td class="v-bold">${row.OthArrear || row.OtherArrear || 0}</td>
        </tr>
        <tr class="bold-top double-bottom">
          <td><b>Total Earnings</b></td><td class="v-bold"><b>${totalAllowance}</b></td>
          <td><b>Total Deductions</b></td><td class="v-light"><b>${row.TotalDeduction ?? totalDeduction}</b></td>
          <td colspan="2" style="text-align:right;">
            <b>Net Salary: ₹ ${row.NetSalary || (totalAllowance - totalDeduction)}</b>
          </td>
        </tr>
      </table>
      <div style="font-size:9px; margin-top:8px; text-align:center;">This is a computer generated advice and does not require a signature.</div>
    </body>
  </html>
  `;
  }

  // ----------------------------
  // Actions / buttons
  // ----------------------------
  const handleEmployeeClick = (employee) => {
    const isSelected = selectedEmployees.some(
      (emp) => getEmpKey(emp) === getEmpKey(employee)
    );

    if (isSelected) {
      setSelectedEmployees(
        selectedEmployees.filter(
          (emp) => getEmpKey(emp) !== getEmpKey(employee)
        )
      );
    } else {
      setSelectedEmployees([
        ...selectedEmployees,
        employee
      ]);
    }
  };

  const generatePdfBlobForEmployee = async (row) => {
    if (!row) return null;
    const pdfWidthMm = 210;
    const pdfHeightMm = 297;
    const payslipMaxWidthMm = pdfWidthMm * 0.88;
    const payslipMaxHeightMm = pdfHeightMm * 0.45;

    const payslipHtml = generatePayslipHTML(row);
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = `${payslipMaxWidthMm}mm`;
    container.style.padding = "10px";
    container.style.background = "#fff";
    container.style.boxSizing = "border-box";

    container.innerHTML = `
      <style>
        body { font-size: 11px !important; }
        .info-table td { padding: 2px 4px !important; font-size: 11px !important; }
        .pay-slip-table td { padding: 2px 5px !important; font-size: 10.5px !important; }
        .pay-slip-table th { padding: 4px 5px !important; font-size: 11px !important; }
      </style>
      ${payslipHtml}
    `;

    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        scrollY: 0,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const imageAspectRatio = canvas.width / canvas.height;
      let renderWidthMm = payslipMaxWidthMm;
      let renderHeightMm = renderWidthMm / imageAspectRatio;

      if (renderHeightMm > payslipMaxHeightMm) {
        renderHeightMm = payslipMaxHeightMm;
        renderWidthMm = renderHeightMm * imageAspectRatio;
      }

      const xOffsetMm = (pdfWidthMm - renderWidthMm) / 2;
      const yOffsetMm = 10; // Top aligned

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "JPEG", xOffsetMm, yOffsetMm, renderWidthMm, renderHeightMm);
      return pdf.output("blob");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      return null;
    } finally {
      document.body.removeChild(container);
    }
  };

  const loadPdfLib = async () => {
    return await import("pdf-lib");
  };

  const generatePairedPdf = async (row1, row2) => {
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pdfHeight = 297;

    const halfHeight = pdfHeight / 2;
    const padding = 10;

    const createCanvas = async (html) => {
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.width = "180mm"; // CONTROL WIDTH
      container.style.transform = "scale(0.7)"; // 🔥 KEY FIX (shrink BEFORE capture)
      container.style.transformOrigin = "top left";

      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true
      });

      document.body.removeChild(container);

      return canvas;
    };

    const gap = 8;

    // TOP SLIP
    if (row1) {
      const canvas1 = await createCanvas(generatePayslipHTML(row1));
      const img1 = canvas1.toDataURL("image/jpeg", 0.9);

      pdf.addImage(
        img1,
        "JPEG",
        padding,
        padding,
        pdfWidth - 2 * padding,
        halfHeight - padding - gap
      );
    }

    // BOTTOM SLIP (NORMAL, NOT UPSIDE DOWN)
    if (row2) {
      const canvas2 = await createCanvas(generatePayslipHTML(row2));
      const img2 = canvas2.toDataURL("image/jpeg", 0.9);

      pdf.addImage(
        img2,
        "JPEG",
        padding,
        halfHeight,
        pdfWidth - 2 * padding,
        halfHeight - padding - gap
      );
    }

    return pdf.output("blob");
  };

  const handleMoveAllToSelected = () => {
    setSelectedEmployees((prev) => [
      ...prev,
      ...filteredEmployees.filter((emp) => !prev.some((sel) => getEmpKey(sel) === getEmpKey(emp))),
    ]);
  };

  const buildPayload = (emp, row, netMap, key, monthValue, yearValue, effectivePropertyId) => {
    return {
      EmployeeId: emp.EmployeeId,
      EmployeeName: emp.EmployeeName,
      OfficeId: effectivePropertyId || emp.PropertyId,
      CreatedOn: new Date().toISOString(),
      Month: monthValue,
      Year: yearValue,
      is_active: true,
      IsFreezed: false,
      GeneratedAmount: Number(netMap.get(key)) || 0,

      // Earnings
      Basic: Number(row.Basic || row.MonthlyBaseSalary || row.MonthlyBase || row.ProRatedSalary) || 0,
      DA: Number(row.DA) || 0,
      HRA: Number(row.HRA) || 0,
      Gratuity: Number(row.Gratuity) || 0,
      OTDaysAmount: Number(row.OTDaysAmount) || 0,
      OTHoursAmount: Number(row.OTHoursAmount) || 0,
      AdjAmtIncentive: Number(row["AdjAmt/Incentive"]) || Number(row.AdjAmtIncentive) || Number(row.AdjAmt) || Number(row.Incentive) || 0,
      PFArrear: Number(row.PFArrear) || 0,
      OthArrear: Number(row.OthArrear || row.OtherArrear) || 0,
      Bonus: Number(row.Bonus || row.BONUS) || 0,
      SeparateBonus: Number(row.SEPARATEBONUS || row.SeparateBonus) || 0,
      LeaveWages: Number(row.LEAVEWAGES || row.LeaveWages || row.LEAVE) || 0,
      Conv: Number(row.CONV || row.Conv) || 0,
      OthAll: Number(row.OTHALL || row.OthAll) || 0,
      NHAmount: Number(row.NHAmount) || 0,
      FHAmount: Number(row.FHAmount) || 0,
      EducationAllowance: Number(row.EduAll || row.EducationAllowance) || 0,
      PerformanceAllowance: Number(row.PerfAll || row.PerformanceAllowance) || 0,
      SpecialAllowance: Number(row.SPLALL || row.SpecialAllowance) || 0,
      WashingAllowance: Number(row.WASH || row.WashingAllowance) || 0,
      TotalEarning: Number(row.TotalAllowance || row.TotalGross || row.TotalGrossSalary) || 0,

      // Deductions
      PF: Number(row.PF) || 0,
      ESI: Number(row.ESI) || 0,
      LWF: Number(row.LWF || row.LwfAmount || row.LwfEmployeeAmount) || 0,
      PFT: Number(row.PftAmount || row.PFT) || 0,
      Advance: Number(row.AdvanceDed || row.AdvanceAmount || row.Advance || row.LoanAdvanceAmount) || 0,
      OthDed: Number(row.OtherDed || row.OthDed) || 0,
      DocDed: Number(row.DocDeduction || row.DocDed) || 0,
      Food: Number(row.FOOD || row.Food) || 0,
      Maintenance: Number(row.MaintDeduction || row.Maintenance) || 0,
      Fine: Number(row.Fine) || 0,
      AcmdDed: Number(row.AccommodationDeduction || row.AcmdDed) || 0,
      IncomeTax: Number(row.INCOMETAX || row.IncomeTax) || 0,
      Uniform: Number(row.UNIFORM || row.Uniform) || 0,
      BGV: Number(row.BGVDed) || 0,
      Room: Number(row.RoomDed) || 0,
      JoiningKits: Number(row.JoiningKits) || 0,
      LoanEMI: Number(row.LoanEMI) || 0,
      TotalDeduction: Number(row.TotalDeduction) || 0,

      // Attendance
      WorkingDays: Number(row.AttendanceTotalWorkingDays) || 0,
      HoDays: Number(row.HoDays) || 0,
      WeeklyOffs: Number(row.WeeklyOffs || row.WeekDaysOff) || 0,
      OTDays: Number(row.OTDays) || 0,
      OTHours: Number(row.OTHours) || 0,
      DutyDays: Number(row.WorkingDays) || 0,
      SalDays: Number(row.SalDays) || 0,
      NHDays: Number(row.NHDays) || 0,
      FHDays: Number(row.FHDays) || 0,

      // Leave
      EL: Number(row.EL) || 0,
      CL: Number(row.CL) || 0,
      SL: Number(row.SL) || 0,

      // Added Pre-fields
      PFVariableSum: Number(row.PFVariableSum) || 0,
      ESIVariableSum: Number(row.ESIVariableSum) || 0,
      PFLimit: Number(row.PFLimit) || 0,
      ESILimit: Number(row.ESILimit) || 0,
      TotalGross: Number(row.TotalGross) || 0,
      OTAmount: Number(row.OTAmount) || 0,
    };
  };

  const handleGenerateFromGrid = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    setGenerating(true);
    setGeneratingBatchStatus(`Starting...`);

    try {
      const monthValue = selectedMonth
        ? monthNames[selectedMonth - 1]
        : null;
      const yearValue = selectedYear;

      // Directly use selected employees
      const employeesToGenerate = selectedEmployees;

      const idsForNet = employeesToGenerate
        .map((e) => e.EmployeeId)
        .filter(Boolean);

      setGeneratingBatchStatus("Fetching details...");

      const { netMap, rowDataMap } = await buildNetSalaryMap(idsForNet);

      const CHUNK_SIZE = 5;
      const totalEmployees = employeesToGenerate.length;

      for (let i = 0; i < totalEmployees; i += CHUNK_SIZE) {
        const chunk = employeesToGenerate.slice(i, i + CHUNK_SIZE);

        const currentBatch = Math.floor(i / CHUNK_SIZE) + 1;
        const totalBatches = Math.ceil(totalEmployees / CHUNK_SIZE);

        setGeneratingBatchStatus(
          `Batch ${currentBatch}/${totalBatches}: Generating PDFs...`
        );

        for (const emp of chunk) {
          const designations = emp.Designations || [{ DesignationId: emp.DesignationId }];

          for (const d of designations) {

            const key = `${emp.EmployeeId}_${d.DesignationId}`;
            const row = rowDataMap.get(key);

            if (!row) continue;

            // ✅ generate single PDF
            const pdfBlob = await generatePdfBlobForEmployee(row);

            if (!pdfBlob) continue;

            // ✅ build payload
            const payload = {
              ...buildPayload(
                emp,
                row,
                netMap,
                key,
                monthValue,
                yearValue,
                effectivePropertyId
              ),
              DesignationId: d.DesignationId
            };

            const formData = new FormData();

            formData.append("employees", JSON.stringify([payload])); // array of 1
            formData.append(
              "file",
              pdfBlob,
              `Salary_${emp.EmployeeId}_${d.DesignationId}_${monthValue}-${yearValue}.pdf`
            );

            // 🚀 ONE API CALL PER EMPLOYEE
            await createGeneratedSalary(formData);
          }
        }

        console.log("Generated for:", chunk);
      }

      alert(
        `Successfully generated salary for ${employeesToGenerate.length} employee(s)`
      );

      setSelectedEmployees([]);

      await fetchGeneratedEmployees();

      const generatedIds = employeesToGenerate.map(
        (emp) => emp.EmployeeId
      );

      await fetchSalaryDetails(generatedIds);

      setShowGrid(true);

    } catch (error) {
      console.error("Failed to generate salary:", error);
      alert("Failed to generate salary. Please try again.");
    } finally {
      setGenerating(false);
      setGeneratingBatchStatus("");
    }
  };

  const handleViewSelected = async () => {
    if (selectedRegenEmployees.length === 0) {
      alert("No employees selected to view salary.");
      return;
    }
    const ids = selectedRegenEmployees.map((e) => e.EmployeeId);
    await fetchSalaryDetails(ids);
    setShowGrid(true);
  };

  const handleRegenerateSalary = async () => {
    if (selectedRegenEmployees.length === 0) {
      alert("No employees selected to regenerate.");
      return;
    }
    const employeesToRegenerate = selectedRegenEmployees.filter(
      (emp) => !isEmployeeFrozen(emp)
    );
    const frozenEmployees = selectedRegenEmployees.filter((emp) =>
      isEmployeeFrozen(emp)
    );
    if (employeesToRegenerate.length === 0) {
      alert("Freeze salary cannot be regenerated.");
      return;
    }

    setGenerating(true);
    setGeneratingBatchStatus("Starting...");

    try {
      const monthValue = monthNames[selectedMonth - 1];
      const yearValue = selectedYear;

      const idsForNet = employeesToRegenerate
        .map((e) => e.EmployeeId)
        .filter(Boolean);

      setGeneratingBatchStatus("Fetching details...");

      const { netMap, rowDataMap } = await buildNetSalaryMap(idsForNet);

      const CHUNK_SIZE = 5;
      const totalToRegen = employeesToRegenerate.length;

      for (let i = 0; i < totalToRegen; i += CHUNK_SIZE) {
        const chunk = employeesToRegenerate.slice(i, i + CHUNK_SIZE);
        const currentBatch = Math.floor(i / CHUNK_SIZE) + 1;
        const totalBatches = Math.ceil(totalToRegen / CHUNK_SIZE);

        setGeneratingBatchStatus(
          `Batch ${currentBatch}/${totalBatches}: Generating PDFs...`
        );

        for (const emp of chunk) {

          const designations =
            emp.Designations || [{ DesignationId: emp.DesignationId }];

          const payloads = [];
          const formData = new FormData();

          let isFirst = true;

          for (const d of designations) {

            const key = `${emp.EmployeeId}_${d.DesignationId}`;
            const row = rowDataMap.get(key);

            if (!row) {
              console.log("❌ Missing row:", key);
              continue;
            }

            const pdfBlob = await generatePdfBlobForEmployee(row);
            if (!pdfBlob) continue;

            const payload = {
              ...buildPayload(
                emp,
                row,
                netMap,
                key,
                monthValue,
                yearValue,
                effectivePropertyId
              ),
              DesignationId: d.DesignationId,
              IsFirst: isFirst
            };

            payloads.push(payload);

            formData.append(
              "file",
              pdfBlob,
              `Salary_${emp.EmployeeId}_${d.DesignationId}_${monthValue}-${yearValue}.pdf`
            );

            isFirst = false;
          }

          // 🚀 ONE CALL PER EMPLOYEE (THIS WAS YOUR BIGGEST BUG)
          if (payloads.length > 0) {
            formData.append("employees", JSON.stringify(payloads));
            await regenerateEmployeeSalary(formData);
          }
        }
      }

      const ids = employeesToRegenerate.map((e) => e.EmployeeId);

      await fetchGeneratedEmployees();
      await fetchSalaryDetails(ids);

      setShowGrid(true);
      setSelectedRegenEmployees(frozenEmployees);

      alert(
        frozenEmployees.length > 0
          ? `Regeneration done for ${employeesToRegenerate.length} employee(s). ${frozenEmployees.length} freeze employee(s) skipped.`
          : "Regeneration done!"
      );

    } catch (err) {
      console.error("Failed to regenerate salary:", err);
      alert("Failed to regenerate salary.");
    } finally {
      setGenerating(false);
      setGeneratingBatchStatus("");
    }
  };

  const handleDelete = async (employeeId) => {
    const record = generatedEmployees.find(
      (emp) => Number(emp.EmployeeId) === Number(employeeId)
    );
    if (!record) {
      alert("Generated record not found.");
      return;
    }

    if (record.IsFreezed) {
      alert("Freezed salary record cannot be deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this salary record?"))
      return;

    try {
      const generatedId = record.generated_id || record.GeneratedId;
      await deleteGeneratedSalary(generatedId);
      alert("Salary record deleted successfully");
      fetchGeneratedEmployees();
    } catch (error) {
      console.error("Failed to delete salary record:", error);
      alert("Failed to delete salary record. Please try again.");
    }
  };

  const handleCreatePDF = async () => {
    const selectedRows = salaryData.filter((row) =>
      selectedSalaryRows.includes(row.FacilityMemberId)
    );

    if (selectedRows.length === 0) {
      alert("Please select at least one employee to generate PDF.");
      return;
    }

    const monthValue = selectedMonth
      ? monthNames[selectedMonth - 1]
      : null;

    // ✅ Approved employee ids
    const approvedEmployeesData = await getApprovedEmployees(
      effectivePropertyId,
      monthValue,
      selectedYear
    );

    // ✅ Check approval
    const unApprovedEmployees = selectedRows.filter(
      (row) =>
        !approvedEmployeesData.some(
          (x) =>
            Number(x.EmployeeId) ===
            Number(row.FacilityMemberId || row.EmployeeId) &&
            Number(x.PropertyId) === Number(effectivePropertyId)
        )
    );

    if (unApprovedEmployees.length > 0) {
      alert("Funds are not approved for this employee.");
      return;
    }

    setCreatingPayslipPdf(true);

    try {
      const { PDFDocument } = await loadPdfLib();

      // 🔥 FINAL MERGED PDF
      const mergedPdf = await PDFDocument.create();
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));

      for (let i = 0; i < selectedRows.length; i += 2) {
        const current = Math.min(i + 2, selectedRows.length);
        setGeneratingBatchStatus(`Processing ${current}/${selectedRows.length}...`);
        const row1 = selectedRows[i];
        const row2 = selectedRows[i + 1];

        // ✅ generate 2-per-page PDF
        const pdfBlob = await generatePairedPdf(row1, row2);
        await delay(100);
        if (!pdfBlob) continue;

        // ✅ convert blob → arrayBuffer
        const arrayBuffer = await pdfBlob.arrayBuffer();

        const tempPdf = await PDFDocument.load(arrayBuffer);

        const copiedPages = await mergedPdf.copyPages(
          tempPdf,
          tempPdf.getPageIndices()
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // ✅ SAVE FINAL PDF (ONLY ONCE)
      const finalPdfBytes = await mergedPdf.save();

      const finalBlob = new Blob([finalPdfBytes], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(finalBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SalarySlips_${monthValue}_${selectedYear}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to merge PDFs:", err);
      alert("Error: " + err.message);
    } finally {
      setCreatingPayslipPdf(false);
      setGeneratingBatchStatus("");
    }
  };

  const handleFreezeSalary = () => {
    const runFreeze = async () => {
      const selectedIds = Array.from(
        new Set(selectedSalaryRows.map(Number).filter(Boolean))
      );

      if (selectedIds.length === 0) {
        alert("Please select at least one employee to freeze salary.");
        return;
      }

      const selectedGeneratedRecords = generatedEmployees.filter((emp) =>
        selectedIds.includes(Number(emp.EmployeeId))
      );

      const alreadyFrozenRecords = selectedGeneratedRecords.filter(
        (emp) => emp.IsFreezed
      );
      const recordsToFreeze = selectedGeneratedRecords.filter(
        (emp) => !emp.IsFreezed
      );

      if (recordsToFreeze.length === 0) {
        alert("Selected employees are already frozen.");
        return;
      }

      if (
        !window.confirm(
          `Are you sure you want to permanently freeze salary for ${recordsToFreeze.length} selected employee(s)?`
        )
      ) {
        return;
      }

      try {
        await Promise.all(
          recordsToFreeze.map((emp) =>
            updateGeneratedSalary(emp.generated_id || emp.GeneratedId, {
              ...emp,
              IsFreezed: true,
              FreezedOn: new Date().toISOString(),
              FreezedBy: Number(reduxUserId) || 0,
            })
          )
        );

        await fetchGeneratedEmployees();
        setSelectedSalaryRows([]);
        setSelectedRegenEmployees((prev) =>
          prev.filter((emp) =>
            !recordsToFreeze.some(
              (row) => getEmpKey(row) === getEmpKey(emp)
            )
          )
        );

        if (alreadyFrozenRecords.length > 0) {
          alert(
            `${recordsToFreeze.length} employee(s) frozen successfully. ${alreadyFrozenRecords.length} employee(s) were already frozen.`
          );
          return;
        }

        alert(`${recordsToFreeze.length} employee(s) frozen successfully.`);
      } catch (error) {
        console.error("Failed to freeze salary:", error);
        alert("Failed to freeze salary.");
      }
    };

    runFreeze();
  };

  // ----------------------------
  // Pagination and helpers
  // ----------------------------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = salaryData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(salaryData.length / itemsPerPage));

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const filteredGeneratedEmployees = generatedEmployees.filter((emp) => {
    const search = searchGeneratedText.toLowerCase();

    if (!search) return true;

    const nameMatch =
      emp.EmployeeName &&
      emp.EmployeeName.toLowerCase().includes(search);

    const codeMatch =
      empCodeMap[emp.EmployeeId] &&
      empCodeMap[emp.EmployeeId].toLowerCase().includes(search);

    return nameMatch || codeMatch;
  });

  const groupedGeneratedEmployees = Object.values(
    filteredGeneratedEmployees.reduce((acc, emp) => {
      const key = emp.EmployeeId;

      if (!acc[key]) {
        acc[key] = {
          ...emp,
          allRows: [emp]
        };
      } else {
        acc[key].allRows.push(emp);
      }

      return acc;
    }, {})
  );

  const getUnitSummaryText = () => {
    if (selectedPropertyId.length === 0) return "-- Select Unit --";

    if (selectedPropertyId.length === propertyList.length)
      return "All Units Selected";

    if (selectedPropertyId.length === 1) {
      const unit = propertyList.find(
        (p) => p.PropertyId === selectedPropertyId[0]
      );
      return unit ? unit.PropertyName : "1 Unit Selected";
    }

    return `${selectedPropertyId.length} Units Selected`;
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
      <div className="card" style={{ maxWidth: 1400, margin: "0 auto", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: "20px 30px", background: "#f7fafc" }}>
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
            className="unit-dropdown-wrapper"
            style={{ display: "flex", gap: 8, alignItems: "center", position: "relative" }}
          >
            <label style={{ fontWeight: 600 }}>
              Select Unit :
            </label>

            <div style={{ position: "relative" }}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (propertyList.length > 0) {
                    setUnitDropdownOpen((prev) => !prev);
                  }
                }}
                style={{
                  minWidth: 220,
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: propertyList.length ? "#fff" : "#f9fafb",
                  cursor: propertyList.length ? "pointer" : "not-allowed",
                  opacity: propertyList.length ? 1 : 0.75,
                  fontSize: "0.9rem",
                }}
              >
                {getUnitSummaryText()}
              </div>

              {unitDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "105%",
                    left: 0,
                    width: "100%",
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    zIndex: 1000,
                    padding: 8,
                  }}
                >
                  {propertyList.map((p) => (
                    <label
                      key={p.PropertyId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyId.includes(p.PropertyId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPropertyId([
                              ...selectedPropertyId,
                              p.PropertyId,
                            ]);
                          } else {
                            setSelectedPropertyId(
                              selectedPropertyId.filter(
                                (id) => id !== p.PropertyId
                              )
                            );
                          }
                        }}
                      />
                      {p.PropertyName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <h2 style={{ fontWeight: "bold", marginBottom: 20, fontSize: "2rem", color: "#2a4365" }}>Generate Salary</h2>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 30 }}>

          {/* Department */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="form-select"
            style={{ width: 220, fontWeight: 500 }}
          >
            <option value="">-- Select Department --</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Designation */}
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="form-select"
            style={{ width: 220, fontWeight: 500 }}
          >
            <option value="">-- Select Designation --</option>
            {designations.map((desig, i) => (
              <option key={i} value={desig}>
                {desig}
              </option>
            ))}
          </select>

          {/* Month */}
          <select
            value={selectedMonth || ""}
            onChange={(e) =>
              setSelectedMonth(e.target.value ? Number(e.target.value) : null)
            }
            className="form-select"
            style={{ width: 150 }}
          >
            <option value="">-- Whole Year --</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthNames[m - 1]}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => {
              const newYear = Number(e.target.value);
              setSelectedYear(newYear);
            }}
            className="form-select"
            style={{ width: 120 }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Top panes */}
        <div className="d-flex justify-content-center align-items-center" style={{ gap: 60 }}>
          {/* Employee Names */}
          <div style={boxStyle}>
            <div style={{ height: 36, background: "#f0f3fa", textAlign: "center", fontWeight: 600, padding: 8, borderBottom: "1px solid #b0b8cc" }}>Employee Names</div>
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search name or emp code..." style={{ margin: 14, padding: 7, borderRadius: 5, border: "1px solid #b0b8cc", width: "88%", fontSize: 15 }} />
            <div style={{ flex: 1, overflowY: "auto", padding: "0 10px", maxHeight: "150px" }}>
              {loadingAll ? (
                <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>
                  Loading...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>
                  No employees found
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={`${emp.EmployeeId}_${emp.DesignationId || 'single'}`}
                    onClick={() => handleEmployeeClick(emp)}
                    style={{
                      padding: "8px 10px",
                      margin: "5px 0",
                      cursor: "pointer",
                      borderRadius: 4,
                      background: selectedEmployees.some((s) => getEmpKey(s) === getEmpKey(emp))
                        ? "#e0f2fe"
                        : "transparent",
                      border: selectedEmployees.some((s) => getEmpKey(s) === getEmpKey(emp))
                        ? "1px solid #0ea5e9"
                        : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                      {emp.EmployeeName}
                    </div>

                    {/* 👇 OPTIONAL BUT SMART (code display) */}
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>
                      {empCodeMap[emp.EmployeeId] || ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ fontSize: "2.1rem", fontWeight: "bold", color: "#4b6cb7", alignSelf: "center", cursor: "pointer", userSelect: "none" }} title="Move all to Selected" onClick={handleMoveAllToSelected}>→</div>

          {/* Selected Employees */}
          <div style={boxStyle}>
            <div style={{ height: 36, background: "#f0f3fa", textAlign: "center", fontWeight: 600, padding: 8, borderBottom: "1px solid #b0b8cc" }}>Selected Employees</div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px", maxHeight: "170px" }}>
              {selectedEmployees.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>No employees selected</div> :
                selectedEmployees.map((emp) => (
                  <div key={`${emp.EmployeeId}_${emp.DesignationId || 'single'}`} style={{ padding: "8px 10px", margin: "5px 0", borderRadius: 4, background: "#e0f2fe", border: "1px solid #0ea5e9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{emp.EmployeeName}</div>
                    <button onClick={() => handleEmployeeClick(emp)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", padding: 0 }} title="Remove">×</button>
                  </div>
                ))
              }
            </div>
            <button onClick={handleGenerateFromGrid} disabled={generating || selectedEmployees.length === 0} style={{ marginTop: "auto", background: generating ? "#94a3b8" : "#5b9aff", color: "#fff", border: "none", borderRadius: "0 0 8px 8px", width: "100%", padding: "12px 0", fontSize: "1rem", fontWeight: 500, cursor: generating ? "not-allowed" : "pointer" }}>{generating ? generatingBatchStatus || "Generating..." : "Generate"}</button>
          </div>
        </div>

        {/* Divider arrow */}
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4b6cb7", textAlign: "center", margin: "45px 0 24px 0" }}>↓</div>

        {/* Second row: generated salaries */}
        <div className="d-flex justify-content-center align-items-center" style={{ gap: 60 }}>
          <div style={boxStyle}>
            <div style={{ height: 36, background: "#f0f3fa", textAlign: "center", fontWeight: 600, padding: 8, borderBottom: "1px solid #b0b8cc" }}>Generated Salaries</div>
            <input type="text" value={searchGeneratedText} onChange={(e) => setSearchGeneratedText(e.target.value)} placeholder="Search name or emp code..." style={{ margin: 14, padding: 7, borderRadius: 5, border: "1px solid #b0b8cc", width: "88%", fontSize: 15 }} />
            <div style={{ flex: 1, overflowY: "auto", padding: "10px", maxHeight: "170px" }}>
              {loadingAll ? (
                <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>
                  Loading...
                </div>
              ) : generatedEmployees.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>
                  No generated salaries for{" "}
                  {selectedMonth ? monthNames[selectedMonth - 1] : "Whole Year"}{" "}
                  {selectedYear}
                </div>
              ) : (
                groupedGeneratedEmployees.map((emp) => {
                  const isFrozen = isEmployeeFrozen(emp);

                  return (
                    <div
                      key={`${emp.EmployeeId}_${emp.DesignationId || 'single'}`}
                      onClick={() => {
                        const empRows = emp.allRows;

                        const isSelected = empRows.every(row =>
                          selectedRegenEmployees.some(
                            e => getEmpKey(e) === getEmpKey(row)
                          )
                        );

                        if (isSelected) {
                          setSelectedRegenEmployees(prev =>
                            prev.filter(
                              e => !empRows.some(
                                row => getEmpKey(row) === getEmpKey(e)
                              )
                            )
                          );
                        } else {
                          setSelectedRegenEmployees(prev => [
                            ...prev,
                            ...empRows.filter(
                              row => !prev.some(
                                e => getEmpKey(e) === getEmpKey(row)
                              )
                            )
                          ]);
                        }
                      }}
                      style={{
                        padding: "6px 10px",
                        margin: "4px 0",
                        borderRadius: 5,
                        fontWeight: 500,
                        fontSize: "0.92rem",
                        cursor: "pointer",
                        background: selectedRegenEmployees.some(
                          (e) => getEmpKey(e) === getEmpKey(emp)
                        )
                          ? "#e0f2fe"
                          : isFrozen
                            ? "#f8fafc"
                            : "transparent",
                        border: selectedRegenEmployees.some(
                          (e) => getEmpKey(e) === getEmpKey(emp)
                        )
                          ? "1px solid #1e90ff"
                          : isFrozen
                            ? "1px solid #cbd5e1"
                            : "1px solid transparent",
                        transition: "all 0.2s",
                        color: isFrozen ? "#94a3b8" : "#0f172a",
                      }}
                    >
                      {/* 👇 Name */}
                      <div>{emp.EmployeeName}</div>

                      {/* 👇 Code (important for search clarity) */}
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>
                        {empCodeMap[emp.EmployeeId] || ""}
                      </div>

                      {/* 👇 Freeze label */}
                      {isFrozen && (
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          Freeze
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ fontSize: "2.1rem", fontWeight: "bold", color: "#4b6cb7", alignSelf: "center", cursor: "pointer", userSelect: "none" }} title="Move all to Selected" onClick={() => setSelectedRegenEmployees(groupedGeneratedEmployees.flatMap(emp => emp.allRows))}>→</div>

          <div style={boxStyle}>
            <div style={{ height: 36, background: "#f0f3fa", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontWeight: 600, borderBottom: "1px solid #b0b8cc" }}>
              <span>Selected Employees</span>
              <button onClick={handleViewSelected} disabled={selectedRegenEmployees.length === 0} title="View selected salary info" style={{ background: "transparent", border: "none", cursor: selectedRegenEmployees.length === 0 ? "not-allowed" : "pointer", opacity: selectedRegenEmployees.length === 0 ? 0.4 : 1, fontSize: "1.1rem", color: "#2563eb", padding: 4 }}><i className="fa fa-eye" /></button>
            </div>
            <div style={{ flex: 1, padding: "10px", maxHeight: "170px", overflowY: "auto" }}>
              {selectedRegenEmployees.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: "#718096" }}>No employees selected for regeneration</div> :
                selectedRegenEmployees.map((emp) => (
                  <div key={`${emp.EmployeeId}_${emp.DesignationId || 'single'}`} style={{ padding: "8px 10px", margin: "5px 0", borderRadius: 4, background: "#e0f2fe", border: "1px solid #0ea5e9", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.2s" }}>
                    <div onClick={() => setSelectedRegenEmployees(selectedRegenEmployees.filter(e => getEmpKey(e) !== getEmpKey(emp)))} style={{ fontWeight: 500, fontSize: "0.9rem", flex: 1 }} title="Click to mark regenerated (remove from list)">{emp.EmployeeName}</div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedRegenEmployees(selectedRegenEmployees.filter(e => getEmpKey(e) !== getEmpKey(emp))); }} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem", padding: 0 }} title="Remove manually">×</button>
                  </div>
                ))
              }
            </div>
            <button onClick={handleRegenerateSalary} disabled={generating || selectedRegenEmployees.length === 0} style={{ marginTop: "auto", background: generating ? "#94a3b8" : "#5b9aff", color: "#fff", border: "none", borderRadius: "0 0 8px 8px", width: "100%", padding: "12px 0", fontSize: "1rem", fontWeight: 500, cursor: generating ? "not-allowed" : "pointer" }}>{generating ? generatingBatchStatus || "Regenerating..." : "Regenerate"}</button>
          </div>
        </div>

        {/* Salary Grid */}
        {showGrid && (() => {
          // ---------- styling constants ----------
          const thStyle = {
            padding: "12px 8px",
            border: "1px solid #b0b8cc",
            fontWeight: 600,
          };
          const headerAttendance = {
            background: "#e6eefd",
            padding: "12px 8px",
            border: "1px solid #b0b8cc",
            fontWeight: 600,
          };
          const headerAllowance = {
            padding: "12px 8px",
            border: "1px solid #b0b8cc",
            fontWeight: 600,
            background: "#e6f2ff",
          };
          const headerDeduction = {
            padding: "12px 8px",
            border: "1px solid #b0b8cc",
            fontWeight: 600,
            background: "#ffe6e6",
          };
          const subTh = { borderRight: "1.5px solid #b0b8cc", padding: "10px 6px", fontWeight: 600 };
          const dynamicTh = { border: "1px solid #b0b8cc", padding: "10px 6px", textAlign: "center", fontWeight: 600 };
          const loadingTd = { padding: 40, textAlign: "center", color: "#718096" };
          const rowStyle = { borderBottom: "1px solid #e2e8f0" };
          const cellCenter = { padding: "12px 8px", border: "1px solid #b0b8cc", textAlign: "center", verticalAlign: "middle" };
          const cell = { padding: "12px 8px", border: "1px solid #b0b8cc", verticalAlign: "middle" };
          const netCell = { padding: "12px 8px", border: "1px solid #b0b8cc", textAlign: "right", fontWeight: 600 };
          const actionCell = { padding: "12px 8px", border: "1px solid #b0b8cc", textAlign: "center" };
          const viewBtn = { backgroundColor: "#0dcaf0", border: "none", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", marginBottom: "6px", cursor: "pointer" };
          const deleteBtn = { border: "none", width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", background: "#ef4444", color: "#fff", cursor: "pointer" };
          const paginationContainer = { display: "flex", justifyContent: "center", alignItems: "center", marginTop: 20, gap: 10 };
          const paginationBtn = (disabled) => ({
            padding: "8px 16px",
            background: disabled ? "#e2e8f0" : "#3b82f6",
            color: disabled ? "#94a3b8" : "#fff",
            border: "none",
            borderRadius: 4,
            cursor: disabled ? "not-allowed" : "pointer",
          });
          const pageButton = (active) => ({
            padding: "8px 12px",
            background: active ? "#3b82f6" : "#fff",
            color: active ? "#fff" : "#334155",
            border: "1px solid #cbd5e1",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: active ? 600 : 400,
          });

          // ---------- build dynamic header lists from salaryData ----------
          const allAllowanceHeaders = Array.from(
            new Set(
              (salaryData || []).flatMap((row) =>
                getRowAllowanceKeys(row).filter((k) => k === "Basic" || Number(row[k] || 0) > 0)
              )
            )
          );

          let allDeductionHeaders = Array.from(
            new Set(
              (salaryData || []).flatMap((row) =>
                getRowDeductionKeys(row).filter((k) => Number(row[k] || 0) > 0)
              )
            )
          );

          // If no deduction present, keep a dummy column for layout stability
          if (allDeductionHeaders.length === 0) {
            allDeductionHeaders = ["NoDeduction"];
          }

          return (
            <div style={{ marginTop: 50, position: "relative" }}>
              <div style={{ position: "absolute", top: -24, right: 0, zIndex: 2, display: "flex", gap: 10 }}>
                <button
                  onClick={handleFreezeSalary}
                  disabled={selectedSalaryRows.length === 0}
                  style={{
                    background: selectedSalaryRows.length === 0 ? "#fca5a5" : "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 28px",
                    fontWeight: 600,
                    letterSpacing: 1,
                    cursor: selectedSalaryRows.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    marginBottom: "8px",
                  }}
                >
                  Freeze
                </button>
                <button
                  onClick={handleCreatePDF}
                  disabled={selectedSalaryRows.length === 0 || creatingPayslipPdf}
                  style={{
                    background:
                      selectedSalaryRows.length === 0 || creatingPayslipPdf
                        ? "#d1eaff"
                        : "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 28px",
                    fontWeight: 600,
                    letterSpacing: 1,
                    cursor:
                      selectedSalaryRows.length === 0 || creatingPayslipPdf
                        ? "not-allowed"
                        : "pointer",
                    fontSize: "1rem",
                    marginBottom: "8px",
                  }}
                >
                  {creatingPayslipPdf ? generatingBatchStatus || "Creating PDF..." : "Create PDF"}
                </button>
              </div>

              <div style={{ overflowX: "auto", paddingTop: 45 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: 8, overflow: "hidden" }}>
                  <thead>
                    <tr style={{ background: "#f0f3fa" }}>
                      <th rowSpan="2" style={{ width: 30, padding: "0 10px", border: "1px solid #b0b8cc", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={salaryData.length > 0 && salaryData.every((r) => selectedSalaryRows.includes(r.FacilityMemberId))}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSalaryRows(salaryData.map((row) => row.FacilityMemberId));
                            else setSelectedSalaryRows([]);
                          }}
                        />
                      </th>

                      <th rowSpan="2" style={thStyle}>S.No.</th>
                      <th rowSpan="2" style={thStyle}>Name</th>
                      <th rowSpan="2" style={thStyle}>Joining Date</th>

                      <th colSpan={7} style={headerAttendance}>Attendance</th>

                      <th colSpan={allAllowanceHeaders.length} style={headerAllowance}>Allowance</th>
                      <th colSpan={allDeductionHeaders.length} style={headerDeduction}>Deduction</th>

                      <th rowSpan="2" style={thStyle}>Net Salary</th>
                      <th rowSpan="2" style={thStyle}>Actions</th>
                    </tr>

                    <tr style={{ background: "#f0f3fa" }}>
                      <th style={subTh}>Total Working Days</th>
                      <th style={subTh}>Shift Hours</th>
                      <th style={subTh}>Working Days</th>
                      <th style={subTh}>Week Days Off</th>
                      <th style={subTh}>Leave Days</th>
                      <th style={subTh}>OT Days</th>
                      <th style={subTh}>Total OT Hours</th>

                      {allAllowanceHeaders.map((key) => (
                        <th key={key} style={dynamicTh}>{displayNameMap[key] || key}</th>
                      ))}

                      {allDeductionHeaders.map((key) => (
                        <th key={key} style={dynamicTh}>
                          {key === "NoDeduction" ? "Deduction" : displayNameMap[key] || key}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {loadingSalaryData ? (
                      <tr><td colSpan={6 + allAllowanceHeaders.length + allDeductionHeaders.length + 4} style={loadingTd}>Loading salary details...</td></tr>
                    ) : salaryData.length === 0 ? (
                      <tr><td colSpan={6 + allAllowanceHeaders.length + allDeductionHeaders.length + 4} style={loadingTd}>No salary data available. Please generate salary first.</td></tr>
                    ) : (
                      salaryData.map((row, index) => {
                        const allowanceKeys = getRowAllowanceKeys(row);
                        const deductionKeys = getRowDeductionKeys(row);
                        const totalAllowance = computeTotalAllowance(row, allowanceKeys);
                        const totalDeduction = row.TotalDeduction ?? computeTotalDeduction(row, deductionKeys);
                        const net = row.NetSalary ?? (totalAllowance - totalDeduction);

                        return (
                          <tr key={`${row.FacilityMemberId}_${row.DesignationId || 'single'}`} style={rowStyle}>
                            <td style={cellCenter}>
                              <input
                                type="checkbox"
                                checked={selectedSalaryRows.includes(row.FacilityMemberId)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedSalaryRows([...selectedSalaryRows, row.FacilityMemberId]);
                                  else setSelectedSalaryRows(selectedSalaryRows.filter(id => id !== row.FacilityMemberId));
                                }}
                              />
                            </td>

                            <td style={cellCenter}>{index + 1}</td>
                            <td style={cell}>{row.FacilityMemberName}</td>
                            <td style={cell}>{row.DateOfJoining ? row.DateOfJoining.split("T")[0] : "-"}</td>

                            <td style={cellCenter}>{Number(row.AttendanceTotalWorkingDays || 0)}</td>
                            <td style={cellCenter}>{Number(row.ShiftHours || 0)}</td>
                            <td style={cellCenter}>{Number(row.WorkingDays || 0)}</td>
                            <td style={cellCenter}>{Number(row.WeekDaysOff || 0)}</td>
                            <td style={cellCenter}>{Number(row.LeaveDays || 0)}</td>
                            <td style={cellCenter}>{Number(row.OTDays || 0)}</td>
                            <td style={cellCenter}>{Number(row.OTHours || 0)}</td>

                            {allAllowanceHeaders.map((key) => (
                              <td key={key} style={cellCenter}>
                                {Number(row[key] || 0) > 0 ? Number(row[key]).toLocaleString() : ""}
                              </td>
                            ))}

                            {allDeductionHeaders.map((key) => (
                              <td key={key} style={cellCenter}>
                                {key === "NoDeduction"
                                  ? "-"
                                  : Number(row[key] ?? 0) > 0
                                    ? Number(row[key]).toLocaleString()
                                    : ""}
                              </td>
                            ))}

                            <td style={netCell}>₹{net.toLocaleString()}</td>

                            <td style={actionCell}>
                              <button className="btn btn-sm btn-info" title="View" onClick={() => { setViewPayslipHtml(generatePayslipHTML(row)); setViewPayslipOpen(true); }} style={viewBtn}><i className="fa fa-eye" /></button>
                              <br />
                              <button className="btn btn-sm btn-danger" title={isEmployeeFrozen(row) ? "Frozen salary cannot be deleted" : "Delete"} onClick={() => handleDelete(row.FacilityMemberId)} disabled={isEmployeeFrozen(row)} style={{ ...deleteBtn, opacity: isEmployeeFrozen(row) ? 0.5 : 1, cursor: isEmployeeFrozen(row) ? "not-allowed" : "pointer" }}><i className="fa fa-trash" /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {salaryData.length > 0 && (
                    <tfoot style={{ background: "#f8fafc", fontWeight: "bold", borderTop: "2px solid #b0b8cc" }}>
                      <tr>
                        <td colSpan="4" style={{ ...cell, textAlign: "right", paddingRight: 15 }}>Total:</td>

                        {/* Attendance Totals */}
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.AttendanceTotalWorkingDays || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.ShiftHours || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.WorkingDays || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.WeekDaysOff || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.LeaveDays || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.OTDays || 0), 0)}</td>
                        <td style={cellCenter}>{salaryData.reduce((s, r) => s + Number(r.OTHours || 0), 0)}</td>

                        {/* Allowance Totals */}
                        {allAllowanceHeaders.map((key) => (
                          <td key={`total-all-${key}`} style={cellCenter}>
                            {salaryData.reduce((s, r) => s + Number(r[key] || 0), 0).toLocaleString()}
                          </td>
                        ))}

                        {/* Deduction Totals */}
                        {allDeductionHeaders.map((key) => (
                          <td key={`total-ded-${key}`} style={cellCenter}>
                            {key === "NoDeduction" ? "-" : salaryData.reduce((s, r) => s + Number(r[key] || 0), 0).toLocaleString()}
                          </td>
                        ))}

                        {/* Net Salary Total */}
                        <td style={netCell}>
                          ₹{salaryData.reduce((s, r) => {
                            const allowanceKeys = getRowAllowanceKeys(r);
                            const deductionKeys = getRowDeductionKeys(r);
                            const totalAllowance = computeTotalAllowance(r, allowanceKeys);
                            const totalDeduction = r.TotalDeduction ?? computeTotalDeduction(r, deductionKeys);
                            return s + (r.NetSalary ?? (totalAllowance - totalDeduction));
                          }, 0).toLocaleString()}
                        </td>

                        <td style={actionCell}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination removed as requested */}
            </div>
          );
        })()}

      </div>

      {viewPayslipOpen && (
        <div
          onClick={() => setViewPayslipOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 10,
              width: "95vw",
              maxWidth: "1100px",
              maxHeight: "95vh",
              overflowY: "auto",
              boxShadow: "0 0 20px rgba(0,0,0,0.3)",
              cursor: "default",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: viewPayslipHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
