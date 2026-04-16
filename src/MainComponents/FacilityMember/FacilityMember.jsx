"use client";

import React, { useRef, useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { TabView, TabPanel } from "primereact/tabview";
import { Calendar } from "primereact/calendar";
import { PrimeReactProvider } from "primereact/api";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useSelector } from "react-redux";
import { getAllDesignations } from "../../Services/DesignationService";
import { MultiSelect } from "primereact/multiselect";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import {
  // getEmployeesByOffice,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetPassword,
  uploadEmployeeDocuments,
  deleteEmployeeDocument
} from "../../Services/FacilityService";
import { getEmployeesByOffices, getSalaryGroupsByDesignation, importEmployees } from "../../Services/PayrollService";

import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
  getAllDepartments
} from "../../Services/ClientService";

import { getPropertyById } from "../../Services/PropertyService";
import { getBranchById } from "../../Services/BranchMaster";

// Import existing components from old project
import SalaryGroupView from "../../ReactComponents/DataGrid/SalaryGroupView.jsx";
import LoanAdvanceDialog from "../../ReactComponents/DataGrid/LoanAdvances.jsx";

const StaffPage = () => {
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxPropertyIds = useSelector((state) => state.Commonreducer.puidnlist);

  const propertyId = Number(reduxPropertyId) > 0 ? Number(reduxPropertyId) : null;
  const [clientPropertyIds, setClientPropertyIds] = useState([]);
  const [reloadEmployeesToken, setReloadEmployeesToken] = useState(0);

  // Kept for backward-compat with existing page logic; selections are driven from the top navbar (redux).
  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState([]);
  const activePropertyId = Number(selectedPropertyId?.[0]) > 0
    ? Number(selectedPropertyId[0])
    : propertyId;

  const [branchName, setBranchName] = useState("");
  const [clientName, setClientName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [customDesignation, setCustomDesignation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [salaryGroups, setSalaryGroups] = useState([]);
  const [salaryGroupMessage, setSalaryGroupMessage] = useState("");
  const [selectedSalaryGroup, setSelectedSalaryGroup] = useState(null);
  const [showSalaryGroupPopup, setShowSalaryGroupPopup] = useState(false);
  const [salaryGroupDetails, setSalaryGroupDetails] = useState(null);
  const [isLoadingSalaryGroups, setIsLoadingSalaryGroups] = useState(false);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [managerOptions, setManagerOptions] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]); // FacilityMemberIds[]
  // Salary & Loan dialog states
  const [showSalaryGroupView, setShowSalaryGroupView] = useState(false);
  const [selectedFacilityMemberId, setSelectedFacilityMemberId] = useState(null);
  const [selectedFacilityMemberName, setSelectedFacilityMemberName] = useState("");
  const [showLoanAdvanceDialog, setShowLoanAdvanceDialog] = useState(false);
  const [selectedLoanAdvanceId, setSelectedLoanAdvanceId] = useState(null);

  // Form fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [aadharCard, setAadharCard] = useState("");
  const [panCard, setPanCard] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIFSCCode, setBankIFSCCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [uanNumber, setUanNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [pfNumber, setPfNumber] = useState("");
  const [esiNumber, setEsiNumber] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [documents, setDocuments] = useState({
    profileImage: [],
    aadhaar: [],
    pan: [],
    bankPassbook: [],
    others: []
  });
  const [existingDocuments, setExistingDocuments] = useState({
    profileImage: [],
    aadhaar: [],
    pan: [],
    bankPassbook: [],
    others: []
  });
  const [viewDocuments, setViewDocuments] = useState({
    profileImage: [],
    aadhaar: [],
    pan: [],
    bankPassbook: [],
    others: []
  });
  const [family, setFamily] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [workHistories, setWorkHistories] = useState([
    {
      CompanyName: "",
      Role: "",
      StartDate: null,
      EndDate: null,
      ThirdPartyVerification: false,
      UploadResume: null,
      ResumeUrl: "",
    },
  ]);

  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];

  const employmentTypes = [
    { label: "Permanent", value: "Permanent" },
    { label: "Contractual", value: "Contractual" }
  ];

  const mapRowDocuments = (row) => ({
    profileImage: row?.FacilityMember?.ProfileImageUrl ? [row.FacilityMember.ProfileImageUrl] : [],
    aadhaar: Array.isArray(row?.FinancialInfo?.AadhaarImageUrl) ? row.FinancialInfo.AadhaarImageUrl : [],
    pan: Array.isArray(row?.FinancialInfo?.PanCardImageUrl) ? row.FinancialInfo.PanCardImageUrl : [],
    bankPassbook: Array.isArray(row?.FinancialInfo?.BankPassbookImageUrl) ? row.FinancialInfo.BankPassbookImageUrl : [],
    others: Array.isArray(row?.FinancialInfo?.OtherDocImageUrl) ? row.FinancialInfo.OtherDocImageUrl : []
  });

  const getCurrentOfficeIds = () => {
    let officeIds = [];

    if (Number(reduxPropertyId) > 0) {
      officeIds = [Number(reduxPropertyId)];
    } else if (selectedPropertyId.length > 0) {
      officeIds = selectedPropertyId;
    } else if (Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0) {
      officeIds = reduxPropertyIds;
    } else if (clientPropertyIds.length > 0) {
      officeIds = clientPropertyIds;
    }

    return officeIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  };

  const loadEmployeeForDialogs = async (employeeId, fallbackRow) => {
    if (!employeeId) return fallbackRow;

    try {
      const officeIds = getCurrentOfficeIds();
      if (!officeIds.length) return fallbackRow;

      const data = await getEmployeesByOffices(officeIds);
      return (
        (data || []).find(
          (item) =>
            Number(item?.FacilityMember?.FacilityMemberId) === Number(employeeId)
        ) || fallbackRow
      );
    } catch (error) {
      console.error("Failed to load employee details:", error);
      return fallbackRow;
    }
  };

  useEffect(() => {
    const loadUnits = async () => {
      try {
        if (Number(reduxPropertyId) > 0) {
          setSelectedPropertyId([Number(reduxPropertyId)]);
          setClientPropertyIds([]);
        }
        if (Number(reduxPropertyId) > 0) {
          try {
            const res = await getClientByPropertyId(reduxPropertyId);
            setUnitList(res ? [res] : []);
            setSelectedUnitId(Number(res?.ClientID) > 0 ? Number(res.ClientID) : null);
          } catch (propertyClientError) {
            setUnitList([]);
            setSelectedUnitId(null);
            setPropertyList([]);
          }
          return;
        }

        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
          return;
        }

        const res = await getAllClients();
        setUnitList(res || []);
      } catch (err) {
        console.log("Failed to load clients", err);
        setUnitList([]);
        setSelectedUnitId(null);
      }
    };

    loadUnits();
  }, [reduxClientId, reduxPropertyId]);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (Number(reduxPropertyId) > 0 && !selectedUnitId) {
          setPropertyList([]);
          setClientPropertyIds([]);
          setSelectedPropertyId([Number(reduxPropertyId)]);
          return;
        }

        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId([]);
          setClientPropertyIds([]);
          setStaff([]);
          return;
        }

        const res = await getPropertiesByClientId(selectedUnitId);
        const properties = res || [];

        setPropertyList(properties);

        // 🔥 FIX STARTS HERE
        if (Number(reduxPropertyId) > 0) {
          setSelectedPropertyId([Number(reduxPropertyId)]);
          setClientPropertyIds([]);
        } else {
          setSelectedPropertyId([]);

          if (!Array.isArray(reduxPropertyIds) || reduxPropertyIds.length === 0) {
            const ids = properties
              .map((p) => Number(p.PropertyId))
              .filter((id) => Number.isFinite(id) && id > 0);
            setClientPropertyIds(ids);
          } else {
            setClientPropertyIds([]);
          }
        }
        // 🔥 FIX ENDS HERE

      } catch (err) {
        console.log("Failed to load properties", err);
        setPropertyList([]);
        setClientPropertyIds([]);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId, reduxPropertyIds]);

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const data = await getAllDepartments();

        const formatted = Array.isArray(data)
          ? data.map(d => ({
            label: d.Name,
            value: d.Name
          }))
          : [];

        // Add OTHER option
        formatted.push({ label: "OTHER", value: "OTHER" });

        setDepartments(formatted);
      } catch (err) {
        console.error("Department load failed", err);
        toast.current?.show({
          severity: "warn",
          summary: "Warning",
          detail: "Failed to load departments"
        });
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, []);

  useEffect(() => {
    const loadDesignations = async () => {
      setIsLoadingDesignations(true);
      try {
        const data = await getAllDesignations();

        const formatted = Array.isArray(data)
          ? data
            .filter(d => d.IsActive) // optional but smart
            .map(d => ({
              label: d.DesignationName,
              value: d.DesignationName
            }))
          : [];

        formatted.push({ label: "OTHER", value: "OTHER" });

        setDesignations(formatted);
      } catch (err) {
        console.error("Designation load failed", err);
        setDesignations([]);
      } finally {
        setIsLoadingDesignations(false);
      }
    };

    loadDesignations();
  }, []);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        let officeIds = [];

        if (Number(reduxPropertyId) > 0) {
          officeIds = [Number(reduxPropertyId)];
        } else if (selectedPropertyId.length > 0) {
          officeIds = selectedPropertyId;
        } else if (Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0) {
          officeIds = reduxPropertyIds;
        } else if (clientPropertyIds.length > 0) {
          officeIds = clientPropertyIds;
        }

        officeIds = officeIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0);

        if (!officeIds.length) {
          setStaff([]);
          return;
        }

        setLoading(true);

        const data = await getEmployeesByOffices(officeIds);
        setStaff(data || []);

      } catch (err) {
        console.error("Employee load failed", err);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds, clientPropertyIds, reloadEmployeesToken]);

  useEffect(() => {
    const loadBranch = async () => {
      if (!propertyId) {
        setBranchName("");
        setPropertyName("");
        return;
      }

      try {
        // 1️⃣ Get property
        const property = await getPropertyById(propertyId);
        setPropertyName(property?.PropertyName || property?.Name || "");

        if (!property?.BranchCode) {
          setBranchName("");
          return;
        }

        // 2️⃣ Get branch by BranchCode
        const branch = await getBranchById(property.BranchCode);

        setBranchName(branch?.BranchName || "");
      } catch (err) {
        console.error("Branch load failed:", err);
        setBranchName("");
        setPropertyName("");
      }
    };

    loadBranch();
  }, [propertyId]);

  useEffect(() => {
    const loadClient = async () => {
      try {
        if (propertyId) {
          const client = await getClientByPropertyId(propertyId);
          setClientName(client?.ClientName || "");
          return;
        }

        if (Number(reduxClientId) > 0) {
          const clients = await getAllClients();
          const match = (clients || []).find(
            (c) => Number(c?.ClientID) === Number(reduxClientId)
          );
          setClientName(match?.ClientName || "");
          return;
        }

        if (!propertyId) {
          setClientName("");
          return;
        }
      } catch (err) {
        console.error("Client load failed:", err);
        setClientName("");
      }
    };

    loadClient();
  }, [reduxClientId, propertyId]);

  useEffect(() => {
    const managers = staff
      .filter(row =>
        row?.FacilityMember?.FacilityMemberId &&
        row?.FacilityMember?.FacilityMemberId !== selectedFacilityMemberId
      )
      .map(row => ({
        label: row?.Profile?.EmployeeName || "Unknown",
        value: row.FacilityMember.FacilityMemberId
      }));

    setManagerOptions(managers);
  }, [staff, selectedFacilityMemberId]);

  const addDocument = (type, file) => {
    if (!file) return;

    setDocuments(prev => ({
      ...prev,
      [type]: [...prev[type], file]
    }));
  };

  const removeDocument = (type, index) => {
    setDocuments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleDeleteExistingDocument = async (type, documentUrl) => {
    if (!editEmployeeId || !documentUrl) return;

    try {
      await deleteEmployeeDocument(editEmployeeId, documentUrl);
      setExistingDocuments((prev) => ({
        ...prev,
        [type]: (prev[type] || []).filter((url) => url !== documentUrl)
      }));
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Document deleted successfully"
      });
    } catch (error) {
      console.error(`Failed to delete ${type} document:`, error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete document"
      });
    }
  };

  const handleDeleteResumeDocument = async (index, documentUrl) => {
    if (!editEmployeeId || !documentUrl) return;

    try {
      await deleteEmployeeDocument(editEmployeeId, documentUrl);
      setWorkHistories((prev) =>
        prev.map((history, historyIndex) =>
          historyIndex === index
            ? {
              ...history,
              ResumeUrl: "",
              UploadResume: null
            }
            : history
        )
      );
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Document deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete resume document:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete document"
      });
    }
  };

  const getManagerNames = (managerIds = []) => {
    if (!Array.isArray(managerIds) || managerIds.length === 0) return [];

    return staff
      .filter(row =>
        managerIds.includes(row?.FacilityMember?.FacilityMemberId)
      )
      .map(row => row?.Profile?.EmployeeName)
      .filter(Boolean);
  };

  // Salary & Loan actions
  const openSalaryGroupView = (row) => {
    const memberId = String(row.FacilityMember.FacilityMemberId);
    const memberName = row.Profile?.EmployeeName || "";
    setSelectedFacilityMemberId(memberId);
    setSelectedFacilityMemberName(memberName);
    setShowSalaryGroupView(true);
  };

  const closeSalaryGroupView = () => {
    setShowSalaryGroupView(false);
    setSelectedFacilityMemberId(null);
  };
  // Convert JS Date to IST ISO String
  const toISTISOString = (date) => {
    if (!date) return null;
    const dt = new Date(date);
    const offsetIST = 5.5 * 60 * 60 * 1000; // IST offset (+5:30)
    const istTime = new Date(dt.getTime() + offsetIST);
    return istTime.toISOString().slice(0, 19); // remove 'Z'
  };

  const openLoanAdvanceDialog = (row) => {
    const memberId = row.FacilityMember.FacilityMemberId;
    setSelectedLoanAdvanceId(memberId);
    setShowLoanAdvanceDialog(true);
  };

  const closeLoanAdvanceDialog = () => {
    setShowLoanAdvanceDialog(false);
    setSelectedLoanAdvanceId(null);
  };

  const viewStaff = async (row) => {
    const employeeId = row?.FacilityMember?.FacilityMemberId;
    const latestRow = await loadEmployeeForDialogs(employeeId, row);
    setViewData(latestRow);
    setViewDocuments(mapRowDocuments(latestRow));
    setViewDialogVisible(true);
  };

  const openDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const resetForm = () => {
    setEmployeeCode("");
    setEmployeeName("");
    setDesignation("");
    setGender("");
    setMobile("");
    setEmail("");
    setDepartment("");
    setDateOfBirth("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setStateName("");
    setAadharCard("");
    setPanCard("");
    setBankAccountNumber("");
    setBankIFSCCode("");
    setBankName("");
    setUanNumber("");
    setPanNumber("");
    setPfNumber("");
    setEsiNumber("");
    setProfileImage(null);
    setFamily("");
    setWorkHistories([
      {
        CompanyName: "",
        Role: "",
        StartDate: null,
        EndDate: null,
        ThirdPartyVerification: false,
        UploadResume: null,
        ResumeUrl: "",
      },
    ]);
    setIsEditMode(false);
    setEditEmployeeId(null);
    setSalaryGroups([]);
    setSelectedSalaryGroup(null);
    setSalaryGroupMessage("");
    setDocuments({
      profileImage: [],
      aadhaar: [],
      pan: [],
      bankPassbook: [],
      others: []
    });
    setExistingDocuments({
      profileImage: [],
      aadhaar: [],
      pan: [],
      bankPassbook: [],
      others: []
    });
    setViewDocuments({
      profileImage: [],
      aadhaar: [],
      pan: [],
      bankPassbook: [],
      others: []
    });
  };

  const openEditDialog = async (row) => {
    setIsEditMode(true);
    const employeeId = row?.FacilityMember?.FacilityMemberId || "";
    setEditEmployeeId(employeeId);
    const latestRow = await loadEmployeeForDialogs(employeeId, row);

    // Profile Info
    const profile = latestRow?.Profile || {};
    setEmployeeCode(profile.EmployeeCode || "");
    setEmployeeName(profile.EmployeeName || "");
    setDesignation(profile.Designation || "");
    setEmail(profile.Email || "");
    setMobile(profile.PhoneNumber || "");
    setDepartment(profile.Department || "");
    setEmploymentType(profile.EmploymentType || "");
    setGender(profile.Gender || "");
    setDateOfBirth(profile.DateOfBirth ? profile.DateOfBirth.slice(0, 10) : "");
    setPanCard(profile.PanCard || "");
    setAadharCard(profile.AadharCard || "");
    setAddressLine1(profile.AddressLine1 || "");
    setAddressLine2(profile.AddressLine2 || "");
    setCity(profile.City || "");
    setStateName(profile.State || "");
    setSelectedFacilityMemberId(latestRow?.FacilityMember?.FacilityMemberId || "");
    setSelectedManagers(
      latestRow?.FacilityMember?.ManagerIdList || []
    );
    if (profile.Designation) {
      fetchSalaryGroups(profile.Designation);
    }
    const existingSG = latestRow?.FacilityMember?.SG_Link_ID || null;

    setSelectedSalaryGroup(existingSG);
    // Work History - Handle both single and array
    if (latestRow?.WorkHistories && Array.isArray(latestRow.WorkHistories) && latestRow.WorkHistories.length > 0) {
      setWorkHistories(
        latestRow.WorkHistories.map((wh) => ({
          CompanyName: wh.CompanyName || "",
          Role: wh.Role || "",
          StartDate: wh.StartDate ? new Date(wh.StartDate) : null,
          EndDate: wh.EndDate ? new Date(wh.EndDate) : null,
          ThirdPartyVerification: wh.ThirdPartyVerification || false,
          UploadResume: null,
          ResumeUrl: wh.UploadResume || "",
        }))
      );
    } else {
      setWorkHistories([
        {
          CompanyName: "",
          Role: "",
          StartDate: null,
          EndDate: null,
          ThirdPartyVerification: false,
          UploadResume: null,
          ResumeUrl: "",
        },
      ]);
    }

    // Financial Info
    const fin = latestRow?.FinancialInfo || {};
    setBankAccountNumber(fin.BankAccountNumber || "");
    setBankIFSCCode(fin.BankIFSCCode || "");
    setBankName(fin.BankName || "");
    setUanNumber(fin.UANNumber || "");
    setPanNumber(fin.PANNumber || "");
    setPfNumber(fin.PFNumber || "");
    setEsiNumber(fin.ESINumber || "");

    // Employee List
    const empList = latestRow?.EmployeeList || {};
    setFamily(empList.FatherName || "");

    setDocuments({
      profileImage: [],
      aadhaar: [],
      pan: [],
      bankPassbook: [],
      others: []
    });

    setExistingDocuments(mapRowDocuments(latestRow));
    setDialogVisible(true);
  };

  // Work History handlers
  const addWorkHistory = () => {
    setWorkHistories([
      ...workHistories,
      {
        CompanyName: "",
        Role: "",
        StartDate: null,
        EndDate: null,
        ThirdPartyVerification: false,
        UploadResume: null,
        ResumeUrl: "",
      },
    ]);
  };

  const removeWorkHistory = (index) => {
    setWorkHistories(workHistories.filter((_, i) => i !== index));
  };

  const handleWorkHistoryChange = (index, field, value) => {
    const updated = [...workHistories];
    updated[index][field] = value;
    setWorkHistories(updated);
  };

  const sanitizePanValue = (value = "") => value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

  const sanitizeIfscValue = (value = "") => value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 11);

  const downloadSampleTemplate = () => {
    const headers = [
      "EMPCODE",
      "EMP NAME",
      "F/H NAME",
      "DOB",
      "DOJ",
      "GENDER",
      "MOBILE",
      "EMAIL",
      "JOB TYPE",
      "BANK NAME",
      "ACCOUNT NO",
      "IFSC CODE",
      "AADHAAR NO",
      "PF NUMBER",
      "ESI NO",
      "PAN NO",
      "UAN NO",
      "DESIGNATION CODE",
      "DEPT CODE",
      "ADDRESS LINE 1",
      "ADDRESS LINE 2",
      "CITY",
      "STATE"
    ];

    // 👇 create empty row just to generate headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "Employee_Sample_Template.xlsx");
  };

  const exportToExcel = () => {
    if (!staff || staff.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "No Data",
        detail: "No staff available to export",
      });
      return;
    }

    const exportData = staff.map((row) => ({
      "EMPCODE": row?.Profile?.EmployeeCode || "",
      "EMP NAME": row?.Profile?.EmployeeName || "",
      "F/H NAME": row?.EmployeeList?.FatherName || "",
      "DOB": row?.Profile?.DateOfBirth?.slice(0, 10) || "",
      "DOJ": row?.WorkHistories?.[0]?.StartDate
        ? new Date(row.WorkHistories[0].StartDate)
          .toLocaleDateString("en-GB") // 🔥 gives DD/MM/YYYY
          .replace(/\//g, "-")         // convert to DD-MM-YYYY
        : "",
      "GENDER": row?.Profile?.Gender === "Male" ? "M" : "F",
      "MOBILE": row?.Profile?.PhoneNumber || "",
      "EMAIL": row?.Profile?.Email || "",
      "JOB TYPE": row?.Profile?.EmploymentType || "",

      "BANK NAME": row?.FinancialInfo?.BankName || "",
      "ACCOUNT NO": row?.FinancialInfo?.BankAccountNumber || "",
      "IFSC CODE": row?.FinancialInfo?.BankIFSCCode || "",

      "AADHAAR NO": row?.Profile?.AadharCard || "",
      "PF NUMBER": row?.FinancialInfo?.PFNumber || "",
      "ESI NO": row?.FinancialInfo?.ESINumber || "",
      "PAN NO": row?.Profile?.PanCard || "",
      "UAN NO": row?.FinancialInfo?.UANNumber || "",

      "DESIGNATION CODE": row?.Profile?.Designation || "",
      "DEPT CODE": row?.Profile?.Department || "",

      "ADDRESS LINE 1": row?.Profile?.AddressLine1 || "",
      "ADDRESS LINE 2": row?.Profile?.AddressLine2 || "",
      "CITY": row?.Profile?.City || "",
      "STATE": row?.Profile?.State || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 🔥 Styling (this is where we stop being boring)
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F4E78" } }, // dark blue
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Auto column width (so it doesn’t look like garbage)
    worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({
      wch: Math.max(key.length + 5, 15),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    let fileName = "Export.xlsx";

    if (activePropertyId) {
      fileName = `${propertyList.find(p => Number(p.PropertyId) === Number(activePropertyId))?.PropertyName || propertyName || "Unit"} Export.xlsx`;
    } else if (clientName) {
      fileName = `${clientName} Export.xlsx`;
    }

    saveAs(blob, fileName);
  };

  const saveStaff = async () => {
    setIsProcessing(true);
    // 🔒 Ensure unit/property selected
    if (!activePropertyId) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please select a unit first",
      });
      setIsProcessing(false);
      return;
    }
    // ================= VALIDATIONS =================

    const cleanName = employeeName.trim().replace(/\s+/g, " ");
    // Required fields
    if (!cleanName) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Employee Name is required"
      });
    }

    if (!employeeCode?.trim()) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Employee Code is required" });
    }

    if (!designation?.trim()) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Designation is required"
      });
    }

    if (!gender?.trim()) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Gender is required"
      });
    }


    if (designation === "OTHER" && !customDesignation?.trim()) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please enter custom designation"
      });
    }

    if (!/^(Mr\.?|Ms\.?|Mrs\.?)?\s?[A-Za-z]+(\s[A-Za-z]+)*$/.test(cleanName)) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Enter valid name (e.g., Mr. Mudit Sharma)"
      });
    }

    // Mobile (optional, but if entered must be valid)
    if (mobile && !/^\d{10}$/.test(mobile)) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Mobile must be exactly 10 digits"
      });
    }

    // DOB (cannot be future)
    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "DOB cannot be future date" });
    }

    if (!panCard?.trim() && !aadharCard?.trim()) {
      setIsProcessing(false);
      return toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Either PAN Card or Aadhar Card is required"
      });
    }

    // PAN (ABCDE1234F)
    if (panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard.toUpperCase())) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Invalid PAN format" });
    }

    // Aadhaar (12 digits)
    if (aadharCard && !/^\d{12}$/.test(aadharCard)) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Aadhaar must be 12 digits" });
    }

    // Bank Account (9–18 digits)
    if (bankAccountNumber && !/^\d{9,18}$/.test(bankAccountNumber)) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Invalid Bank Account Number" });
    }

    // IFSC (e.g. SBIN0001234)
    if (bankIFSCCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIFSCCode.toUpperCase())) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Invalid IFSC Code" });
    }

    // UAN (12 digits)
    if (uanNumber && !/^\d{12}$/.test(uanNumber)) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "UAN must be 12 digits" });
    }

    // ESI (10–17 digits)
    if (esiNumber && !/^\d{10,17}$/.test(esiNumber)) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Invalid ESI Number" });
    }

    // PF (alphanumeric)
    if (pfNumber && !/^[A-Z0-9\/]{5,20}$/i.test(pfNumber)) {
      setIsProcessing(false);
      return toast.current.show({ severity: "warn", summary: "Validation", detail: "Invalid PF Number" });
    }

    for (let i = 0; i < workHistories.length; i++) {
      if (!workHistories[i]?.StartDate) {
        setIsProcessing(false);
        return toast.current.show({
          severity: "warn",
          summary: "Validation",
          detail: "Start Date is required"
        });
      }
    }

    let profileImageUrl = "";

    // Upload Profile Image if exists
    if (profileImage && profileImage instanceof File) {
      if (!["image/jpeg", "image/png"].includes(profileImage.type)) {
        toast.current.show({
          severity: "warn",
          summary: "Validation",
          detail: "Only JPG or PNG images are allowed",
        });
        setIsProcessing(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("images", profileImage);

        const res = await fetch("http://194.238.18.39:8000/upload/", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.uploaded?.length) throw new Error("Image upload failed");
        profileImageUrl = data.uploaded[0];
      } catch (err) {
        console.error("Image upload error:", err);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to upload profile image",
        });
        setIsProcessing(false);
        return;
      }
    }

    // Upload all resumes
    let updatedWorkHistories = [...workHistories];

    for (let i = 0; i < updatedWorkHistories.length; i++) {
      const item = updatedWorkHistories[i];

      if (item.UploadResume && item.UploadResume instanceof File) {
        try {
          const formData = new FormData();
          formData.append("file", item.UploadResume);

          const res = await fetch("https://api.urest.in:8096/api/employee/upload-resume", {
            method: "POST",
            body: formData,
          });

          const url = await res.json();

          if (!res.ok || typeof url !== "string") {
            throw new Error("Resume upload failed");
          }

          updatedWorkHistories[i] = {
            ...item,
            ResumeUrl: url,
          };
        } catch (err) {
          console.error("Resume upload error:", err);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to upload resume",
          });
          setIsProcessing(false);
          return;
        }
      }
    }

    // Filter valid work histories
    const validWorkHistories = updatedWorkHistories.filter(wh =>
      wh.CompanyName.trim() !== "" ||
      wh.Role.trim() !== "" ||
      wh.StartDate !== null ||
      wh.EndDate !== null
    );

    // Format work histories
    const now = toISTISOString(new Date());
    const formattedWorkHistories = validWorkHistories.map((wh) => ({
      CompanyName: wh.CompanyName,
      Role: wh.Role,
      StartDate: wh.StartDate ? toISTISOString(wh.StartDate) : null,
      EndDate: wh.EndDate ? toISTISOString(wh.EndDate) : null,
      ThirdPartyVerification: wh.ThirdPartyVerification,
      UploadResume: wh.ResumeUrl || "",
      CreatedOn: now,
      UpdatedOn: now,
      IsActive: true,
    }));

    // Determine Facility Master ID based on designation
    let facilityMasterId = 0;
    if (designation === "H.K. SUPERVISOR") facilityMasterId = 19;
    else if (designation === "TECHNICAL SUPERVISOR") facilityMasterId = 34;

    if (!activePropertyId) {
      toast.current.show({
        severity: "warn",
        summary: "Select Property",
        detail: "Please select a property from the top navbar before adding or editing staff."
      });
      return;
    }

    // Build Payload matching backend structure
    const dobValue = dateOfBirth
      ? toISTISOString(dateOfBirth)
      : toISTISOString('1900-01-01');

    const employeeData = {
      Profile: {
        OfficeId: activePropertyId,
        EmployeeCode: employeeCode,
        EmployeeName: cleanName,
        EmploymentType: employmentType,
        CreatedOn: now,
        UpdatedOn: now,
        IsActive: true,
        Email: email || "",
        PhoneNumber: mobile,
        Designation:
          designation === "OTHER"
            ? (customDesignation || "").trim()
            : (designation || "").trim(),

        Department:
          department === "OTHER"
            ? (customDepartment || "").trim()
            : (department || "").trim(),
        Gender: gender,
        DateOfBirth: dobValue,
        PanCard: panCard || "",
        AadharCard: aadharCard || "",
        AddressLine1: addressLine1 || "",
        AddressLine2: addressLine2 || "",
        City: city || "",
        State: stateName || "",
      },

      WorkHistories: formattedWorkHistories,

      ...(formattedWorkHistories.length > 0 && {
        WorkHistory: formattedWorkHistories[0]
      }),

      FinancialInfo: {
        BankAccountNumber: bankAccountNumber || "",
        BankIFSCCode: bankIFSCCode || "",
        BankName: bankName || "",
        UANNumber: uanNumber || "",
        PANNumber: panNumber || "",
        PFNumber: pfNumber || "",
        ESINumber: esiNumber || "",
        CreatedOn: now,
        UpdatedOn: now,
        IsActive: true,
      },

      FacilityMember: {
        Name: cleanName,
        FacilityMemberId: selectedFacilityMemberId || 0,
        PropertyId: activePropertyId || 0,
        Address: (addressLine1 + " " + addressLine2).trim() || "",
        FacilityMasterId: facilityMasterId,
        ProfileImageUrl: profileImageUrl || "",
        IsBlocked: false,
        AccessCode: "",
        IsApproved: true,
        ApprovedOn: now,
        ApprovedBy: 1,
        IsActive: true,
        IsDeleted: false,
        CreatedBy: 1,
        CreatedOn: now,
        UpdatedBy: 1,
        UpdatedOn: now,
        oldID: "0",
        SG_Link_ID: selectedSalaryGroup || "0",
        tax_amount: 0,
        ManagerIdList: selectedManagers
      },

      EmployeeList: {
        FatherName: family?.trim() || null,
        IsDeleted: false,
        Approved: true,
        Designation:
          designation === "OTHER" ? customDesignation : designation,
      },
    };

    try {
      let resultingFacilityMemberId = editEmployeeId;

      if (isEditMode) {
        await updateEmployee(editEmployeeId, employeeData);
        toast.current.show({
          severity: "success",
          summary: "Updated",
          detail: "Staff updated successfully"
        });

      } else {
        const responseData = await createEmployee(employeeData);
        resultingFacilityMemberId = responseData?.FacilityMemberId || 0;
        toast.current.show({
          severity: "success",
          summary: "Added",
          detail: "Staff member added successfully"
        });
      }

      // 🔥 SEQUENTIAL DOCUMENT UPLOAD
      if (resultingFacilityMemberId) {
        const uploadQueue = [];
        const addToQueue = (files, typeName) => {
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const fd = new FormData();
              fd.append("file", files[i]);
              uploadQueue.push({ type: typeName, formData: fd });
            }
          }
        };

        if (profileImage && profileImage instanceof File) {
          const fd = new FormData();
          fd.append("file", profileImage);
          uploadQueue.push({ type: "profile", formData: fd });
        }

        addToQueue(documents.aadhaar, "aadhar");
        addToQueue(documents.pan, "pan");
        addToQueue(documents.bankPassbook, "passbook");
        addToQueue(documents.others, "other");

        for (const doc of uploadQueue) {
          try {
            await uploadEmployeeDocuments(resultingFacilityMemberId, doc.type, activePropertyId, doc.formData);
          } catch (e) {
            console.error(`Failed to upload ${doc.type}:`, e);
          }
        }
      }

      // 🔥 STEP 1: Refresh staff
      const data = await getEmployeesByOffices([activePropertyId]);
      setStaff(data || []);

      // 🔥 STEP 2: Update view dialog (ONLY for edit)
      if (isEditMode) {
        const updatedRow = data.find(
          emp => emp.FacilityMember?.FacilityMemberId === editEmployeeId
        );

        if (updatedRow) {
          setViewData(updatedRow);
        }
      }
      // 🔥 STEP 3: Then close dialog
      setDialogVisible(false);
      resetForm();
      setSelectedRow(null);
    } catch (error) {
      console.error(error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: isEditMode ? "Failed to update employee" : "Failed to create employee",
      });
    } finally {
      setIsProcessing(false); // 🔥 THIS LINE SAVES YOUR LIFE
    }
  };

  const confirmDelete = (row) => {
    confirmDialog({
      message: "Are you sure you want to delete this employee?",
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",

      accept: () => deleteStaff(row),

      reject: () => {
        toast.current.show({
          severity: "info",
          summary: "Cancelled",
          detail: "Delete action cancelled"
        });
      }
    });
  };

  const deleteStaff = async (selectedRow) => {
    if (!selectedRow) return;

    try {
      await deleteEmployee(selectedRow.FacilityMember.FacilityMemberId);
      setStaff(staff.filter(s =>
        s.FacilityMember.FacilityMemberId !== selectedRow.FacilityMember.FacilityMemberId
      ));
      toast.current.show({
        severity: "success",
        summary: "Deleted",
        detail: "Staff deleted successfully"
      });
      setSelectedRow(null);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete staff"
      });
    }
  };

  const handleResetPassword = async () => {
    const facilityMemberId = selectedRow?.FacilityMember?.FacilityMemberId;

    if (!facilityMemberId) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Selected employee id not found"
      });
      return;
    }

    try {
      const response = await resetPassword(facilityMemberId);

      toast.current.show({
        severity: response?.Success === false ? "warn" : "success",
        summary: response?.Success === false ? "Warning" : "Success",
        detail: response?.Message || "Password reset successfully"
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error?.Message || "Failed to reset password"
      });
    }
  };

  const confirmResetPassword = () => {
    if (!selectedRow) return;

    confirmDialog({
      message: `Are you sure you want to reset password for ${selectedRow?.Profile?.EmployeeName || "this employee"}?`,
      header: "Confirm Reset Password",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-warning",
      accept: handleResetPassword
    });
  };

  const handleImportClick = () => {
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];

    if (!file) return;
    if (!activePropertyId) {
      toast.current.show({
        severity: "warn",
        summary: "Select Property",
        detail: "Please select a property from the top navbar before importing."
      });
      return;
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.current.show({
        severity: "warn",
        summary: "Invalid File",
        detail: "Please upload Excel file (.xlsx)"
      });
      event.target.value = null;
      return;
    }

    try {
      setIsProcessing(true); // 🔥 START LOADING

      const result = await importEmployees(activePropertyId, file);

      // Download failed records
      if (result.FailedCount > 0 && result.FailedRecords?.length > 0) {
        downloadFailedExcel(result.FailedRecords);
      }

      // Warning toast
      if (result.FailedCount > 0) {
        toast.current.show({
          severity: "warn",
          summary: "Some Records Failed",
          detail: `${result.FailedCount} employees failed. Excel downloaded.`,
        });
      }

      // Success toast
      toast.current.show({
        severity: "success",
        summary: "Import Complete",
        detail: `Total: ${result.TotalRows} | Success: ${result.SuccessCount} | Failed: ${result.FailedCount}`
      });

      // Reload staff
      const data = await getEmployeesByOffices([activePropertyId]);
      setStaff(data || []);

    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Import Failed",
        detail: "Employee import failed"
      });
    } finally {
      setIsProcessing(false); // 🔥 THIS IS WHAT YOU FORGOT
      event.target.value = null; // reset file input
    }
  };

  const downloadFailedExcel = (failedRecords) => {
    if (!failedRecords || failedRecords.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(failedRecords);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Records");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "Failed_Employees.xlsx");
  };

  const indianStates = [
    { label: "Andhra Pradesh", value: "Andhra Pradesh" },
    { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
    { label: "Assam", value: "Assam" },
    { label: "Bihar", value: "Bihar" },
    { label: "Chhattisgarh", value: "Chhattisgarh" },
    { label: "Goa", value: "Goa" },
    { label: "Gujarat", value: "Gujarat" },
    { label: "Haryana", value: "Haryana" },
    { label: "Himachal Pradesh", value: "Himachal Pradesh" },
    { label: "Jharkhand", value: "Jharkhand" },
    { label: "Karnataka", value: "Karnataka" },
    { label: "Kerala", value: "Kerala" },
    { label: "Madhya Pradesh", value: "Madhya Pradesh" },
    { label: "Maharashtra", value: "Maharashtra" },
    { label: "Manipur", value: "Manipur" },
    { label: "Meghalaya", value: "Meghalaya" },
    { label: "Mizoram", value: "Mizoram" },
    { label: "Nagaland", value: "Nagaland" },
    { label: "Odisha", value: "Odisha" },
    { label: "Punjab", value: "Punjab" },
    { label: "Rajasthan", value: "Rajasthan" },
    { label: "Sikkim", value: "Sikkim" },
    { label: "Tamil Nadu", value: "Tamil Nadu" },
    { label: "Telangana", value: "Telangana" },
    { label: "Tripura", value: "Tripura" },
    { label: "Uttar Pradesh", value: "Uttar Pradesh" },
    { label: "Uttarakhand", value: "Uttarakhand" },
    { label: "West Bengal", value: "West Bengal" },
    { label: "Delhi", value: "Delhi" },
  ];

  const header = (
    <div className="d-flex justify-content-between align-items-center p-2">
      <h5 className="m-0">Facility Member</h5>
      <div className="d-flex align-items-center gap-2">
        {selectedRow && (
          <>
            <Button
              icon="pi pi-pencil"
              className="p-button-text p-button-info"
              onClick={() => openEditDialog(selectedRow)}
              tooltip="Edit Staff"
            />
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger"
              onClick={() => confirmDelete(selectedRow)}
              tooltip="Delete Staff"
            />
            <Button
              icon="pi pi-eye"
              className="p-button-text p-button-help"
              onClick={() => viewStaff(selectedRow)}
              tooltip="View Staff"
            />
            <Button
              icon="pi pi-key"
              className="p-button-text p-button-warning"
              onClick={confirmResetPassword}
              tooltip="Reset Password"
            />
            <Button
              icon="pi pi-wallet"
              className="p-button-text p-button-warning"
              tooltip="View Salary"
              onClick={() => openSalaryGroupView(selectedRow)}
            />
            <Button
              icon="pi pi-credit-card"
              className="p-button-text p-button-secondary"
              tooltip="View Loan Advances"
              onClick={() => openLoanAdvanceDialog(selectedRow)}
            />
          </>
        )}

        <Button
          label="Import"
          icon="pi pi-upload"
          className="p-button-secondary"
          tooltip="Import Staff"
          disabled={!activePropertyId || isProcessing}
          onClick={handleImportClick}
        />
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        <div className="p-input-left">
          <InputText
            value={globalFilterValue}
            onChange={(e) => setGlobalFilterValue(e.target.value)}
            placeholder="Search..."
          />
        </div>

        <Button
          label="Add Staff"
          icon="pi pi-plus"
          disabled={!activePropertyId || isProcessing}
          onClick={openDialog}
          className="p-button-success"
        />

        <Button
          label="Sample Template"
          icon="pi pi-file-excel"
          className="p-button-warning"
          onClick={downloadSampleTemplate}
        />
        <Button
          label="Export"
          icon="pi pi-download"
          className="p-button-primary"
          disabled={!activePropertyId || isProcessing}
          onClick={exportToExcel}
        />
      </div>
    </div>
  );

  // Allow selecting and deselecting a row
  const handleRowSelection = (e) => {
    if (selectedRow?.FacilityMember?.FacilityMemberId === e.value?.FacilityMember?.FacilityMemberId) {
      // clicking same row → DESELECT
      setSelectedRow(null);
    } else {
      setSelectedRow(e.value);
    }
  };

  const fetchSalaryGroups = async (designationValue) => {
    // Clear previous selection first
    setSelectedSalaryGroup(null);
    setSalaryGroupDetails(null);
    setSalaryGroupMessage("");
    if (!designationValue || designationValue === "OTHER" || !activePropertyId) {
      setSalaryGroups([]);
      setSalaryGroupMessage("");
      return;
    }

    setIsLoadingSalaryGroups(true);

    try {
      const data = await getSalaryGroupsByDesignation(activePropertyId, designationValue);

      const formatted = Array.isArray(data)
        ? data.map(sg => ({
          label: sg.SalaryGroup,
          value: sg.SalaryGroup_ID,
          data: sg
        }))
        : [];

      setSalaryGroups(formatted);
      if (formatted.length === 0) {
        setSalaryGroupMessage(
          "No Salary Group available for this designation. You can still create employee without assigning it."
        );
      } else {
        setSalaryGroupMessage("");
      }

      // 🔥 AUTO SELECT IF ONLY ONE
      if (formatted.length === 1) {
        setSelectedSalaryGroup(formatted[0].value);
        setSalaryGroupDetails(formatted[0].data);
        setShowSalaryGroupPopup(true);
      }

    } catch (err) {
      console.error("Salary group fetch failed", err);
      setSalaryGroups([]);
    } finally {
      setIsLoadingSalaryGroups(false);
    }
  };

  const renderDocumentSection = (label, type, accept) => {
    return (
      <div className="border rounded p-3 mb-4 shadow-sm bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="m-0">{label}</h6>
        </div>

        {existingDocuments[type]?.length > 0 && (
          <div className="mb-2">
            <strong className="d-block mb-1 text-primary">Existing Uploads:</strong>
            {existingDocuments[type].map((url, index) => (
              <div key={`exist-${index}`} className="d-flex align-items-center justify-content-between mb-1">
                <div className="d-flex align-items-center">
                  <i className="pi pi-file mr-2 text-primary"></i>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    View {label} {index + 1}
                  </a>
                </div>
                <Button
                  type="button"
                  icon="pi pi-trash"
                  className="p-button-text p-button-danger"
                  onClick={() => handleDeleteExistingDocument(type, url)}
                />
              </div>
            ))}
          </div>
        )}

        {documents[type].map((file, index) => (
          <div key={index} className="d-flex align-items-center justify-content-between mb-2">
            <span>{file.name}</span>
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger"
              onClick={() => removeDocument(type, index)}
            />
          </div>
        ))}

        <div className="mt-2">
          <label className="p-button p-button-text p-button-success">
            <i className="pi pi-plus mr-2"></i> Add
            <input
              type="file"
              accept={accept}
              hidden
              onChange={(e) => {
                addDocument(type, e.target.files[0]);
                e.target.value = null;
              }}
            />
          </label>
        </div>
      </div>
    );
  };

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(255, 255, 255, 0.2)", // light glass effect
    backdropFilter: "blur(6px)", // 🔥 THIS is the magic
    WebkitBackdropFilter: "blur(6px)", // safari being annoying as usual
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const boxStyle = {
    background: "rgba(255,255,255,0.8)",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    backdropFilter: "blur(10px)",
  };

  return (
    <PrimeReactProvider>
      <style>{`
        .required-asterisk {
          color: red;
        }
      `}</style>
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            {isProcessing && (
              <div style={overlayStyle}>
                <div style={boxStyle}>
                  <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem", color: "#333" }}></i>
                </div>
              </div>
            )}
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="card">
              <div className="p-3">
                <div
                  className="d-flex align-items-center justify-content-between mb-3"
                  style={{ gap: 16, flexWrap: "wrap" }}
                >
                  <div>
                    <strong>Client:</strong>{" "}
                    {clientName || "-"}
                  </div>
                  <div>
                    <strong>Property:</strong>{" "}
                    {propertyId ? (propertyName || `#${propertyId}`) : "All Properties"}
                  </div>
                  {!reduxClientId && !propertyId && (
                    <div className="text-danger" style={{ fontWeight: 600 }}>
                      Select a client from the top navbar to view staff.
                    </div>
                  )}
                </div>
                <DataTable
                  value={staff}
                  dataKey="FacilityMember.FacilityMemberId"
                  header={header}
                  paginator
                  rows={10}
                  loading={loading}
                  responsiveLayout="scroll"
                  emptyMessage="No staff found."
                  selection={selectedRow}
                  onSelectionChange={handleRowSelection}
                  globalFilter={globalFilterValue}
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                  currentPageReportTemplate="{first}–{last} of {totalRecords}"
                  globalFilterFields={[
                    "Profile.EmployeeCode",
                    "Profile.EmployeeName",
                    "Profile.Gender",
                    "Profile.PhoneNumber",
                    "Profile.AadharCard",
                    "FinancialInfo.UANNumber",
                    "FinancialInfo.PFNumber",
                    "FinancialInfo.ESINumber",
                    "FinancialInfo.BankAccountNumber"
                  ]}
                >
                  <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                  <Column header="Employee Code" body={(row) => row.Profile?.EmployeeCode || "-"} />
                  <Column header="Name" body={(row) => row.Profile?.EmployeeName || "-"} />
                  <Column header="Department" body={(row) => row.Profile?.Department || "-"} />
                  <Column header="Designation" body={(row) => row.Profile?.Designation || "-"} />
                  <Column header="Gender" body={(row) => row.Profile?.Gender || "-"} />
                  <Column header="Contact" body={(row) => row.Profile?.PhoneNumber || "-"} />
                  <Column header="Approved" body={(row) => row.FacilityMember?.IsApproved ? "Yes" : "No"} />
                </DataTable>
              </div>

              {showSalaryGroupView && (
                <SalaryGroupView
                  propertyId={activePropertyId}
                  facilityMemberId={String(selectedFacilityMemberId)}
                  employeeName={selectedFacilityMemberName}
                  onClose={closeSalaryGroupView}
                />
              )}

              {showLoanAdvanceDialog && (
                <LoanAdvanceDialog
                  show={showLoanAdvanceDialog}
                  onClose={closeLoanAdvanceDialog}
                  facilityMemberId={selectedLoanAdvanceId}
                  employeeName={selectedRow?.Profile?.EmployeeName}
                />
              )}
            </div>
          </div>
        </section>

        {/* Add/Edit Dialog */}
        <Dialog
          header={isEditMode ? "Edit Facility Member" : "Add Facility Member"}
          visible={dialogVisible}
          style={{ width: "800px" }}
          modal
          onHide={() => {
            setDialogVisible(false);
            resetForm();
          }}
          footer={
            <div className="d-flex justify-content-end gap-2">
              <Button
                label="Cancel"
                className="p-button-text"
                onClick={() => {
                  setDialogVisible(false);
                  resetForm();
                }}
              />
              <Button
                label={isProcessing ? "Processing..." : (isEditMode ? "Update" : "Save")}
                icon={isProcessing ? "pi pi-spin pi-spinner" : "pi pi-check"}
                onClick={saveStaff}
                disabled={!activePropertyId || isProcessing}
              />
            </div>
          }
        >
          <TabView>
            {/* Personal Details */}
            <TabPanel header="Personal Details">
              <div className="p-fluid">
                <label>Branch Name</label>
                <InputText
                  value={branchName}
                  readOnly
                  className="mb-3"
                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                />
                <label>Client Name</label>
                <InputText
                  value={clientName}
                  readOnly
                  className="mb-3"
                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                />
                <label>Employee Code <span className="required-asterisk">*</span></label>
                <InputText
                  placeholder="Employee Code"
                  value={employeeCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z0-9]/g, "");
                      if (val.length <= 13) {
                    setEmployeeCode(val);
                      }
                  }}
                  className="mb-3"
                />

                <label>Employee Name <span className="required-asterisk">*</span></label>
                <InputText
                  placeholder="Employee Name"
                  value={employeeName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z\s.'-]/g, "");
                    setEmployeeName(val);
                  }}
                  className="mb-3"
                />

                <label>Employment Type</label>
                <Dropdown
                  placeholder="Select Employment Type"
                  value={employmentType}
                  options={employmentTypes}
                  onChange={(e) => setEmploymentType(e.value)}
                  className="mb-3"
                />

                <label>Email</label>
                <InputText
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mb-3"
                />

                <label>Mobile</label>
                <InputText
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) setMobile(val);
                  }}
                  className="mb-3"
                />

                <label>Department</label>
                <Dropdown
                  placeholder={isLoadingDepartments ? "Loading..." : "Select Department"}
                  value={department}
                  options={departments || []}
                  onChange={(e) => setDepartment(e.value)}
                  className="mb-3"
                  disabled={isLoadingDepartments}
                  emptyMessage="No departments available"
                />

                {department === "OTHER" && (
                  <InputText
                    placeholder="Enter Custom Department"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="mb-3"
                  />
                )}

                <label>Designation <span className="required-asterisk">*</span></label>
                <Dropdown
                  placeholder={isLoadingDesignations ? "Loading..." : "Select Designation"}
                  value={designation}
                  options={designations || []}
                  onChange={(e) => {
                    setDesignation(e.value);
                    fetchSalaryGroups(e.value);
                  }}
                  className="mb-3"
                  disabled={isLoadingDesignations}
                  emptyMessage="No designations available"
                />

                {designation === "OTHER" && (
                  <InputText
                    placeholder="Enter Custom Designation"
                    value={customDesignation}
                    onChange={(e) => setCustomDesignation(e.target.value)}
                    className="mb-3"
                  />
                )}

                {salaryGroups.length > 0 && (
                  <>
                    <label>Salary Group</label>
                    <Dropdown
                      placeholder={isLoadingSalaryGroups ? "Loading..." : "Select Salary Group"}
                      value={selectedSalaryGroup}
                      options={salaryGroups}
                      onChange={(e) => {
                        setSelectedSalaryGroup(e.value);

                        const selected = salaryGroups.find(
                          sg => sg.value === e.value
                        );

                        if (selected) {
                          setSalaryGroupDetails(selected.data);
                          setShowSalaryGroupPopup(true);
                        }
                      }}
                      className="mb-3"
                      disabled={isLoadingSalaryGroups}
                    />
                  </>
                )}
                {salaryGroupMessage && (
                  <small style={{ color: "red" }}>
                    {salaryGroupMessage}
                  </small>
                )}
                <label>Reporting Managers</label>
                <MultiSelect
                  value={selectedManagers}
                  options={managerOptions}
                  onChange={(e) => setSelectedManagers(e.value)}
                  placeholder="Select Managers"
                  className="mb-3 w-full"
                  display="chip"
                  filter
                />

                <label>Gender <span className="required-asterisk">*</span></label>
                <Dropdown
                  placeholder="Select Gender"
                  value={gender}
                  options={genders}
                  onChange={(e) => setGender(e.value)}
                  className="mb-3"
                />

                <label>Date of Birth</label>
                <InputText
                  type="date"
                  value={dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mb-3"
                />

                <label>Father's Name</label>
                <InputText
                  placeholder="Father's Name"
                  value={family}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z\s.'-]/g, "");
                    setFamily(val);
                  }}
                  className="mb-3"
                />

                <label>Pan Card <span className="required-asterisk">*</span></label>
                <InputText
                  placeholder="ABCDE1234F"
                  value={panCard}
                  onChange={(e) => {
                    const val = sanitizePanValue(e.target.value);
                    setPanCard(val);
                    setPanNumber(val);
                  }}
                  maxLength={10}
                  className="mb-3 pan-placeholder-light"
                />

                <label>Aadhar Card <span className="required-asterisk">*</span></label>
                <InputText
                  placeholder="12 digit Aadhaar number"
                  className="mb-3 pan-placeholder-light"
                  value={aadharCard}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 12) setAadharCard(val);
                  }}
                />

                <label>Address Line 1</label>
                <InputText
                  placeholder="Address Line 1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="mb-3"
                />

                <label>Address Line 2</label>
                <InputText
                  placeholder="Address Line 2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="mb-3"
                />

                <label>City</label>
                <InputText
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mb-3"
                />

                <label>State</label>
                <Dropdown
                  placeholder="Select State"
                  value={stateName}
                  options={indianStates}
                  onChange={(e) => setStateName(e.value)}
                  className="mb-3"
                />
              </div>
            </TabPanel>

            {/* Bank Details */}
            <TabPanel header="Bank Details">
              <div className="p-fluid">
                <label>Bank Account Number</label>
                <InputText
                  placeholder="9–18 digit account number"
                  className="mb-3 pan-placeholder-light"
                  value={bankAccountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 18) setBankAccountNumber(val);
                  }}
                />

                <label>Bank IFSC Code</label>
                <InputText
                  placeholder="SBIN0123456"
                  value={bankIFSCCode}
                  onChange={(e) => {
                    const val = sanitizeIfscValue(e.target.value);
                    setBankIFSCCode(val);
                  }}
                  maxLength={11}
                  className="mb-3 pan-placeholder-light"
                />

                <label>Bank Name</label>
                <InputText
                  placeholder="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mb-3"
                />

                <label>UAN Number</label>
                <InputText
                  placeholder="12 digit UAN"
                  className="mb-3 pan-placeholder-light"
                  value={uanNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 12) setUanNumber(val);
                  }}
                />

                <label>PAN Number</label>
                <InputText
                  placeholder="ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => {
                    const val = sanitizePanValue(e.target.value);
                    setPanNumber(val);
                    setPanCard(val);
                  }}
                  maxLength={10}
                  className="pan-placeholder-light"
                />

                <label>PF Number</label>
                <InputText
                  placeholder="e.g. DL/12345/67890"
                  className="mb-3 pan-placeholder-light"
                  value={pfNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9/]/g, "");
                    setPfNumber(val);
                  }}
                />

                <label>ESI Number</label>
                <InputText
                  placeholder="10–17 digit ESI"
                  className="mb-3 pan-placeholder-light"
                  value={esiNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 17) setEsiNumber(val);
                  }}
                />
              </div>
            </TabPanel>

            {/* Work History */}
            <TabPanel header="Work History">
              <div className="p-fluid">
                {workHistories.map((history, index) => (
                  <div key={index} className="border rounded p-3 mb-3 shadow-sm bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="m-0">Work History #{index + 1}</h6>
                      {workHistories.length > 1 && (
                        <Button
                          icon="pi pi-times"
                          className="p-button-text p-button-danger"
                          onClick={() => removeWorkHistory(index)}
                          tooltip="Remove this record"
                        />
                      )}
                    </div>

                    <label>Company Name</label>
                    <InputText
                      placeholder="Company Name"
                      value={history.CompanyName}
                      onChange={(e) =>
                        handleWorkHistoryChange(index, "CompanyName", e.target.value)
                      }
                      className="mb-3"
                    />

                    <label>Role</label>
                    <InputText
                      placeholder="Role"
                      value={history.Role}
                      onChange={(e) =>
                        handleWorkHistoryChange(index, "Role", e.target.value)
                      }
                      className="mb-3"
                    />

                    <label>Start Date <span className="required-asterisk">*</span></label>
                    <Calendar
                      placeholder="Start Date"
                      value={history.StartDate}
                      onChange={(e) =>
                        handleWorkHistoryChange(index, "StartDate", e.value)
                      }
                      className="mb-3 w-full"
                      dateFormat="dd-mm-yy"
                      showIcon
                    />

                    <label>End Date</label>
                    <Calendar
                      placeholder="End Date"
                      value={history.EndDate}
                      onChange={(e) =>
                        handleWorkHistoryChange(index, "EndDate", e.value)
                      }
                      className="mb-3 w-full"
                      dateFormat="dd-mm-yy"
                      showIcon
                    />

                    <div className="flex align-items-center mb-3">
                      <Checkbox
                        inputId={`tpv-${index}`}
                        checked={history.ThirdPartyVerification}
                        onChange={(e) =>
                          handleWorkHistoryChange(index, "ThirdPartyVerification", e.checked)
                        }
                      />
                      <label htmlFor={`tpv-${index}`} className="ml-2">
                        Third Party Verification
                      </label>
                    </div>

                    <div className="mb-2">
                      <label className="block mb-1">Upload Resume</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          handleWorkHistoryChange(index, "UploadResume", e.target.files[0])
                        }
                        className="form-control"
                      />
                      {history.ResumeUrl && (
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <small className="text-success d-block">
                            Previously uploaded: {history.ResumeUrl.split('/').pop()}
                          </small>
                          <Button
                            type="button"
                            icon="pi pi-trash"
                            className="p-button-text p-button-danger"
                            onClick={() => handleDeleteResumeDocument(index, history.ResumeUrl)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  label="Add Another Company"
                  icon="pi pi-plus"
                  className="p-button-text p-button-success mt-2"
                  onClick={addWorkHistory}
                />
              </div>
            </TabPanel>
            <TabPanel header="Upload Documents">
              <div className="p-fluid">

                <div className="border rounded p-3 mb-4 shadow-sm bg-light">
                  <h6>Profile Image</h6>

                  {existingDocuments?.profileImage?.length > 0 && !profileImage && (
                    <div className="mb-2">
                      <strong className="d-block mb-1 text-primary">Existing Upload:</strong>
                      <div className="d-flex align-items-center mb-1">
                        <i className="pi pi-image mr-2 text-primary"></i>
                        <a href={existingDocuments.profileImage[0]} target="_blank" rel="noopener noreferrer">
                          View Profile Image
                        </a>
                      </div>
                    </div>
                  )}

                  {profileImage && (
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>{profileImage.name}</span>
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger"
                        onClick={() => setProfileImage(null)}
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files[0])}
                    className="form-control"
                  />
                </div>
                {renderDocumentSection("Aadhaar Card", "aadhaar", "image/*,.pdf")}
                {renderDocumentSection("Pan Card", "pan", "image/*,.pdf")}
                {renderDocumentSection("Bank Passbook", "bankPassbook", "image/*,.pdf")}
                {renderDocumentSection("Others", "others", "*")}

              </div>
            </TabPanel>
          </TabView>
        </Dialog>

        {/* View Dialog */}
        <Dialog
          header="View Facility Member"
          visible={viewDialogVisible}
          style={{ width: "800px" }}
          modal
          onHide={() => setViewDialogVisible(false)}
        >
          {viewData && (
            <TabView>
              <TabPanel header="Personal Details">
                <div className="p-fluid">
                  <label>Branch Name</label>
                  <InputText
                    value={branchName}
                    readOnly
                    className="mb-3"
                  />
                  <label>Client Name</label>
                  <InputText
                    value={clientName}
                    readOnly
                    className="mb-3"
                  />
                  <label>Employee Code</label>
                  <InputText
                    value={viewData.Profile?.EmployeeCode || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Employee Name</label>
                  <InputText
                    value={viewData.Profile?.EmployeeName || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Employment Type</label>
                  <InputText
                    value={viewData.Profile?.EmploymentType || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Email</label>
                  <InputText
                    value={viewData.Profile?.Email || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Mobile</label>
                  <InputText
                    value={viewData.Profile?.PhoneNumber || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Department</label>
                  <InputText
                    value={viewData.Profile?.Department || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Designation</label>
                  <InputText
                    value={viewData.Profile?.Designation || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Reporting Managers</label>
                  <InputText
                    value={
                      getManagerNames(viewData?.FacilityMember?.ManagerIdList).join(", ")
                    }
                    readOnly
                    className="mb-3"
                  />

                  <label>Gender</label>
                  <InputText
                    value={viewData.Profile?.Gender || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Date of Birth</label>
                  <InputText
                    value={viewData.Profile?.DateOfBirth ? viewData.Profile.DateOfBirth.slice(0, 10) : ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Father's Name</label>
                  <InputText
                    value={viewData.EmployeeList?.FatherName || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Pan Card</label>
                  <InputText
                    value={viewData.Profile?.PanCard || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Aadhar Card</label>
                  <InputText
                    value={viewData.Profile?.AadharCard || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Address Line 1</label>
                  <InputText
                    value={viewData.Profile?.AddressLine1 || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Address Line 2</label>
                  <InputText
                    value={viewData.Profile?.AddressLine2 || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>City</label>
                  <InputText
                    value={viewData.Profile?.City || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>State</label>
                  <InputText
                    value={viewData.Profile?.State || ""}
                    readOnly
                    className="mb-3"
                  />
                </div>
              </TabPanel>

              <TabPanel header="Bank Details">
                <div className="p-fluid">
                  <label>Bank Account Number</label>
                  <InputText
                    value={viewData?.FinancialInfo?.BankAccountNumber || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Bank IFSC Code</label>
                  <InputText
                    value={viewData?.FinancialInfo?.BankIFSCCode || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>Bank Name</label>
                  <InputText
                    value={viewData?.FinancialInfo?.BankName || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>UAN Number</label>
                  <InputText
                    value={viewData?.FinancialInfo?.UANNumber || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>PAN Number</label>
                  <InputText
                    value={viewData?.FinancialInfo?.PANNumber || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>PF Number</label>
                  <InputText
                    value={viewData?.FinancialInfo?.PFNumber || ""}
                    readOnly
                    className="mb-3"
                  />

                  <label>ESI Number</label>
                  <InputText
                    value={viewData?.FinancialInfo?.ESINumber || ""}
                    readOnly
                    className="mb-3"
                  />
                </div>
              </TabPanel>


              <TabPanel header="Work History">
                <div className="p-fluid">
                  {(() => {
                    // detect multiple or single history
                    const histories = Array.isArray(viewData?.WorkHistories)
                      ? viewData.WorkHistories
                      : viewData?.WorkHistory
                        ? [viewData.WorkHistory]
                        : [];

                    return histories.length > 0 ? (
                      histories.map((wh, index) => (
                        <div key={index} className="border rounded p-3 mb-3 bg-light">
                          <h6>Work History #{index + 1}</h6>

                          <label>Company Name</label>
                          <InputText value={wh.CompanyName || ""} readOnly className="mb-3" />

                          <label>Role</label>
                          <InputText value={wh.Role || ""} readOnly className="mb-3" />

                          <label>Start Date</label>
                          <InputText
                            value={wh.StartDate ? wh.StartDate.slice(0, 10) : ""}
                            readOnly
                            className="mb-3"
                          />

                          <label>End Date</label>
                          <InputText
                            value={wh.EndDate ? wh.EndDate.slice(0, 10) : ""}
                            readOnly
                            className="mb-3"
                          />

                          <div className="mb-3">
                            <Checkbox checked={!!wh.ThirdPartyVerification} readOnly disabled />
                            <span className="ml-2">Third Party Verification</span>
                          </div>

                          {wh.UploadResume && (
                            <div className="mb-2">
                              <label>Resume</label>
                              <div>
                                <a href={wh.UploadResume} target="_blank" rel="noopener noreferrer">
                                  View Resume
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No work history available</p>
                    );
                  })()}
                </div>
              </TabPanel>
              <TabPanel header="Upload Documents">
                <div className="p-fluid">
                  <div className="mb-3">
                    <h6>Profile Image</h6>
                    {viewDocuments?.profileImage?.length > 0 ? (
                      viewDocuments.profileImage.map((url, i) => <div key={i}><a href={url} target="_blank" rel="noopener noreferrer">View Profile Image {i + 1}</a></div>)
                    ) : <p className="text-muted">No profile image uploaded.</p>}
                  </div>
                  <div className="mb-3">
                    <h6>Aadhaar Card</h6>
                    {viewDocuments?.aadhaar?.length > 0 ? (
                      viewDocuments.aadhaar.map((url, i) => <div key={i}><a href={url} target="_blank" rel="noopener noreferrer">View Aadhaar {i+1}</a></div>)
                    ) : <p className="text-muted">No Aadhaar document uploaded.</p>}
                  </div>
                  <div className="mb-3">
                    <h6>Pan Card</h6>
                    {viewDocuments?.pan?.length > 0 ? (
                      viewDocuments.pan.map((url, i) => <div key={i}><a href={url} target="_blank" rel="noopener noreferrer">View PAN {i+1}</a></div>)
                    ) : <p className="text-muted">No PAN document uploaded.</p>}
                  </div>
                  <div className="mb-3">
                    <h6>Bank Passbook</h6>
                    {viewDocuments?.bankPassbook?.length > 0 ? (
                      viewDocuments.bankPassbook.map((url, i) => <div key={i}><a href={url} target="_blank" rel="noopener noreferrer">View Bank Passbook {i+1}</a></div>)
                    ) : <p className="text-muted">No Bank Passbook uploaded.</p>}
                  </div>
                  <div className="mb-3">
                    <h6>Others</h6>
                    {viewDocuments?.others?.length > 0 ? (
                      viewDocuments.others.map((url, i) => <div key={i}><a href={url} target="_blank" rel="noopener noreferrer">View Other Document {i+1}</a></div>)
                    ) : <p className="text-muted">No other documents uploaded.</p>}
                  </div>
                </div>
              </TabPanel>
            </TabView>
          )}
        </Dialog>
        {/* Salary Group Details Popup */}
        <Dialog
          header={`Salary Group → ${salaryGroupDetails?.SalaryGroup || 'Details'}`}
          visible={showSalaryGroupPopup}
          style={{ width: "900px" }}
          modal
          onHide={() => {
            setShowSalaryGroupPopup(false);
            setSalaryGroupDetails(null);
          }}
          footer={
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={() => {
                setShowSalaryGroupPopup(false);
                setSalaryGroupDetails(null);
              }}
              className="p-button-primary"
            />
          }
        >
          {salaryGroupDetails && (
            <div className="row">
              {/* Allowances Section */}
              <div className="col-md-6">
                <div className="p-3 mb-3" style={{ backgroundColor: '#d4edda', borderRadius: '8px' }}>
                  <h5 className="text-center mb-3">Allowance</h5>
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Base Salary</td>
                        <td className="text-end">₹{salaryGroupDetails.BaseSalary?.toLocaleString()}</td>
                      </tr>
                      {salaryGroupDetails.AllowancesDeductions
                        ?.filter(ad => ad.Type === 'A')
                        .map((allowance, idx) => (
                          <tr key={idx}>
                            <td>{allowance.Name}</td>
                            <td className="text-end">₹{allowance.FixedAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      <tr className="border-top border-dark">
                        <td><strong>Total Allowance:</strong></td>
                        <td className="text-end">
                          <strong>
                            ₹{(
                              salaryGroupDetails.BaseSalary +
                              (salaryGroupDetails.AllowancesDeductions
                                ?.filter(ad => ad.Type === 'A')
                                .reduce((sum, ad) => sum + (ad.FixedAmount || 0), 0) || 0)
                            ).toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="col-md-6">
                <div className="p-3 mb-3" style={{ backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                  <h5 className="text-center mb-3">Deduction</h5>
                  <table className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryGroupDetails.AllowancesDeductions
                        ?.filter(ad => ad.Type === 'D')
                        .map((deduction, idx) => (
                          <tr key={idx}>
                            <td>{deduction.Name}</td>
                            <td className="text-end">₹{deduction.CalculatedAmount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      <tr className="border-top border-dark">
                        <td><strong>Total Deduction:</strong></td>
                        <td className="text-end">
                          <strong>
                            ₹{salaryGroupDetails.AllowancesDeductions
                              ?.filter(ad => ad.Type === 'D')
                              .reduce((sum, ad) => sum + (ad.CalculatedAmount || 0), 0)
                              .toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </PrimeReactProvider>
  );
};

export default StaffPage;
