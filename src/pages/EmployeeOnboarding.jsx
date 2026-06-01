"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { Calendar } from "primereact/calendar";
import CustomDatePicker from "../ReactComponents/CustomDatePicker/CustomDatePicker";
import { PrimeReactProvider } from "primereact/api";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import "../MainComponents/AssetsMaster/AssetsMaster.css";
import {
  saveOnboardingTemp,
  getOnboardingTemp,
  updateOnboardingTemp,
  approveEmployeeTemp,
  rejectEmployeeTemp,
  deleteOnboardingTemp
} from "../Services/EmployeeOnboardingService";
import { getapitoken } from "../Common/AppCommon";
import { getPropertyById } from "../Services/PropertyService";


const EmployeeOnboarding = () => {
  const toast = useRef(null);
  const history = useHistory();
  const puidn = useSelector((state) => state.Commonreducer.puidn);
  const userData = useSelector(
    (state) => state.Commonreducer.userData
  );

  const [propertyName, setPropertyName] = useState("UFIRM Technologies");

  useEffect(() => {
    const fetchProperty = async () => {
      if (!puidn) return;
      try {
        const property = await getPropertyById(puidn);
        if (property?.PropertyName || property?.Name) {
          setPropertyName(property.PropertyName || property.Name);
        }
      } catch (err) {
        console.error("Failed to fetch property details:", err);
      }
    };
    fetchProperty();
  }, [puidn]);

  const [employees, setEmployees] = useState([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRejectEmployee, setSelectedRejectEmployee] = useState(null);

  const [viewDialog, setViewDialog] = useState(false);
  const [selectedEmployeeView, setSelectedEmployeeView] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxEnabledTab, setMaxEnabledTab] = useState(0);
  const [extraAadharSlots, setExtraAadharSlots] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [viewActiveTab, setViewActiveTab] = useState(0);
  const [reviewDeclarations, setReviewDeclarations] = useState({
    general: false,
    background: false,
    identity: false,
    terms: false
  });

  const userRole = useMemo(() => {
    try {
      const token = getapitoken();
      if (!token) return "Admin";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.lastname; // "HR" or "Admin"
    } catch (e) {
      return "Admin";
    }
  }, []);

  // Form fields state
  const [formData, setFormData] = useState({
    TempId: 0,
    PropertyId: 0,
    Name: "",
    Gender: "",
    MobileNumber: "",
    OtherNumber: "",
    EmploymentType: "",
    Email: "",
    Designation: "",
    Department: "",
    DateOfBirth: "",
    PanCard: "",
    AadharCard: "",
    AddressLine1: "",
    AddressLine2: "",
    City: "",
    State: "",
    FatherName: "",
    MotherName: "",
    SpouseName: "",
    DateOfJoining: "",
    BankAccountNumber: "",
    BankIFSCCode: "",
    BankName: "",
    UANNumber: "",
    PF_Number: "",
    ESINumber: "",
    MedicalHeightFeet: "",
    MedicalHeightInches: "",
    MedicalWeight: "",
    MedicalBloodGroup: "",
    MedicalIdentifications: "",
    EmploymentPreviousOccupation: "",
    EmploymentPreviousCompany: "",
    EmploymentExpYears: "",
    EmploymentExpMonths: "",
    EmploymentComputerKnowledge: "",
    MaritalStatus: ""
  });

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const token = getapitoken();
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        const [desigRes, deptRes] = await Promise.all([
          fetch("https://api.urest.in:8096/api/designations/GetAllDesignations", { headers }),
          fetch("https://api.urest.in:8096/api/clientmaster/allDepartment", { headers })
        ]);

        const desigData = await desigRes.json();
        const deptData = await deptRes.json();

        if (Array.isArray(desigData)) {
          setDesignations(desigData.map(d => ({ label: d.DesignationName, value: d.DesignationName })));
        } else if (desigData?.Data) {
          setDesignations(desigData.Data.map(d => ({ label: d.DesignationName, value: d.DesignationName })));
        }

        if (Array.isArray(deptData)) {
          setDepartments(deptData.map(d => ({ label: d.Name, value: d.Name })));
        } else if (deptData?.Data) {
          setDepartments(deptData.Data.map(d => ({ label: d.Name, value: d.Name })));
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data", error);
      }
    };
    fetchDropdowns();
  }, []);

  const genders = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ];

  const employmentTypes = [
    { label: "Permanent", value: "Permanent" },
    { label: "Contractual", value: "Contractual" },
    { label: "Casual", value: "Casual" },
    { label: "Trainee", value: "Trainee" },
    { label: "Provisional", value: "Provisional" },
  ];

  const indianStates = [
    { label: "Andhra Pradesh", value: "Andhra Pradesh" },
    { label: "Arunachal Pradesh", value: "Arunachal Pradesh" },
    { label: "Assam", value: "Assam" },
    { label: "Bihar", value: "Bihar" },
    { label: "Maharashtra", value: "Maharashtra" },
    { label: "Uttar Pradesh", value: "Uttar Pradesh" },
    { label: "West Bengal", value: "West Bengal" },
    { label: "Tamil Nadu", value: "Tamil Nadu" },
    { label: "Karnataka", value: "Karnataka" },
    { label: "Gujarat", value: "Gujarat" },
    { label: "Rajasthan", value: "Rajasthan" },
    { label: "Punjab", value: "Punjab" },
    { label: "Haryana", value: "Haryana" },
    { label: "Kerala", value: "Kerala" },
    { label: "Odisha", value: "Odisha" },
    { label: "Telangana", value: "Telangana" },
    { label: "Madhya Pradesh", value: "Madhya Pradesh" },
    { label: "Jharkhand", value: "Jharkhand" },
    { label: "Chhattisgarh", value: "Chhattisgarh" },
    { label: "Uttarakhand", value: "Uttarakhand" },
  ];

  const indianBanks = [
    { label: "State Bank of India", value: "State Bank of India" },
    { label: "HDFC Bank", value: "HDFC Bank" },
    { label: "ICICI Bank", value: "ICICI Bank" },
    { label: "Axis Bank", value: "Axis Bank" },
  ];

  const resetForm = () => {
    setFormData({
      TempId: 0,
      PropertyId: 0,
      Name: "",
      Gender: "",
      MobileNumber: "",
      OtherNumber: "",
      EmploymentType: "",
      Email: "",
      Designation: "",
      Department: "",
      DateOfBirth: "",
      PanCard: "",
      AadharCard: "",
      AddressLine1: "",
      AddressLine2: "",
      City: "",
      State: "",
      FatherName: "",
      MotherName: "",
      SpouseName: "",
      DateOfJoining: "",
      BankAccountNumber: "",
      BankIFSCCode: "",
      BankName: "",
      UANNumber: "",
      PF_Number: "",
      ESINumber: "",
      MedicalHeightFeet: "",
      MedicalHeightInches: "",
      MedicalWeight: "",
      MedicalBloodGroup: "",
      MedicalIdentifications: "",
      EmploymentPreviousOccupation: "",
      EmploymentPreviousCompany: "",
      EmploymentExpYears: "",
      EmploymentExpMonths: "",
      EmploymentComputerKnowledge: "",
      MaritalStatus: ""
    });

    setReviewDeclarations({
      general: false,
      background: false,
      identity: false,
      terms: false
    });

    setIsEditMode(false);
    setActiveIndex(0);
    setMaxEnabledTab(0);
    setExtraAadharSlots(0);
  };

  const openNew = () => {
    resetForm();
    setDocuments([]);
    setActiveIndex(0);
    setMaxEnabledTab(0);
    setDialogVisible(true);
  };

  const editEmployee = (emp) => {
    setFormData({
      ...emp,
      DateOfBirth: emp.DateOfBirth ? emp.DateOfBirth.split("T")[0] : "",
      DateOfJoining: emp.DateOfJoining ? emp.DateOfJoining.split("T")[0] : "",
      MedicalHeightFeet: emp.HeightFeet || "",
      MedicalHeightInches: emp.HeightInches || "",
      MedicalWeight: emp.Weight || "",
      MedicalBloodGroup: emp.BloodGroup || "",
      MedicalIdentifications: emp.IdentificationMarks || "",
      EmploymentPreviousOccupation: emp.PreviousOccupation || "",
      EmploymentPreviousCompany: emp.PreviousCompany || "",
      EmploymentExpYears: emp.ExperienceYears || "",

      EmploymentExpMonths: emp.ExperienceMonths || "",

      EmploymentComputerKnowledge:
        emp.ComputerKnowledge === true ? "Yes" : "No",
      MaritalStatus: emp.MaritalStatus || ""
    });

    setReviewDeclarations({
      general: emp.GeneralDeclaration || false,
      background: emp.BackgroundVerification || false,
      identity: emp.IdentityAuthentication || false,
      terms: emp.EmploymentTerms || false
    });

    // 🔥 IMPORTANT: map documents from API
    if (emp.Documents && emp.Documents.length > 0) {
      const mappedDocs = emp.Documents.map((doc) => ({
        type: doc.DocumentType,
        file: null, // no actual file object
        fileName: doc.FileName,
        url: doc.FileUrl,
      }));

      setDocuments(mappedDocs);
    } else {
      setDocuments([]);
    }

    setIsEditMode(true);
    setActiveIndex(0);
    setMaxEnabledTab(5); // All tabs enabled in edit mode (6 tabs now, so index 5 is final)
    setDialogVisible(true);
  };


  const approveEmployee = async (rowData) => {

    try {

      const userId = userData?.UserId || 1;

      console.log("Approving UserId:", userId);

      const response = await approveEmployeeTemp(
        rowData.TempId,
        rowData.PropertyId,
        userId
      );

      toast.current.show({
        severity: "success",
        summary: "Approved",
        detail:
          response?.Message ||
          "Employee approved successfully",
      });

      fetchEmployees();

    } catch (error) {

      console.log(error);

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.Message ||
          error?.message ||
          "Failed to approve employee",
      });
    }
  };

  const rejectEmployee = async () => {

    try {

      const response = await rejectEmployeeTemp({
        TempId: selectedRejectEmployee.TempId,
        PropertyId: selectedRejectEmployee.PropertyId,
        RejectionReason: rejectReason,
        UserId: 1
      });

      toast.current.show({
        severity: "success",
        summary: "Rejected",
        detail: response?.Message || "Employee rejected successfully",
      });

      setRejectDialog(false);
      setRejectReason("");
      setSelectedRejectEmployee(null);

      fetchEmployees();

    } catch (error) {

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.Message ||
          "Failed to reject employee",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await getOnboardingTemp(puidn || 0);

      if (response?.Data) {
        // Filter data strictly by selected puidn
        const filtered = response.Data.filter(
          (emp) =>
            Number(emp.PropertyId) === (Number(puidn) || 0) &&
            !(emp.IsApproved === true || emp.IsApproved === 1 || emp.IsApproved === "1")
        );
        setEmployees(filtered);
      }
    } catch (error) {
      console.log(error);

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch employees",
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [puidn]);

  const filteredEmployees = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    return (employees || []).filter((row) => {
      return (
        !query ||
        [
          row?.Name,
          row?.Designation,
          row?.Department,
          row?.MobileNumber,
          row?.Email,
          row?.City,
          row?.State,
          row?.TempId
        ].some((v) => String(v || "").toLowerCase().includes(query))
      );
    });
  }, [employees, searchTerm]);

  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredEmployees, safeCurrentPage]);

  const getStatusMeta = (rowData) => {
    const isApproved =
      rowData.IsApproved === true ||
      rowData.IsApproved === 1 ||
      rowData.IsApproved === "1";

    const isRejected =
      rowData.IsRejected === true ||
      rowData.IsRejected === 1 ||
      rowData.IsRejected === "1";

    if (isApproved) {
      return { label: "Approved", className: "spare-table-status spare-table-status-running" };
    }
    if (isRejected) {
      return { label: "Rejected", className: "spare-table-status spare-table-status-inactive" };
    }
    return { label: "Pending", className: "spare-table-status spare-table-status-servicing" };
  };

  const saveEmployee = async (stepIndex, isFinal = false) => {
    try {
      // Step-specific validation
      if (stepIndex === 0) {
        if (!formData.Name || !formData.Designation || !formData.Gender || !formData.DateOfJoining) {
          toast.current.show({
            severity: "warn",
            summary: "Validation",
            detail: "Please fill required personal info (Name, Designation, Gender, Date of Joining)",
          });
          return;
        }
      }


      if (stepIndex === 3) {
        if (!formData.AadharCard || !formData.PanCard || !formData.BankAccountNumber || !formData.BankIFSCCode || !formData.UANNumber) {
          toast.current.show({
            severity: "warn",
            summary: "Validation",
            detail: "Please fill required financial details (Aadhar, PAN, Bank Details, UAN)",
          });
          return;
        }
      }

      const payload = {
        PropertyId: puidn || 0,
        TempId: formData.TempId || 0,
        Name: formData.Name,
        Gender: formData.Gender,
        MobileNumber: formData.MobileNumber,
        OtherNumber: formData.OtherNumber,
        EmploymentType: formData.EmploymentType,
        Email: formData.Email,
        Designation: formData.Designation,
        Department: formData.Department,
        DateOfBirth: formData.DateOfBirth ? `${formData.DateOfBirth}T00:00:00` : null,
        PanCard: formData.PanCard,
        AadharCard: formData.AadharCard,
        AddressLine1: formData.AddressLine1,
        AddressLine2: formData.AddressLine2,
        City: formData.City,
        State: formData.State,
        FatherName: formData.FatherName,
        MotherName: formData.MotherName,
        SpouseName: formData.SpouseName,
        DateOfJoining: formData.DateOfJoining ? `${formData.DateOfJoining}T00:00:00` : null,
        BankAccountNumber: formData.BankAccountNumber,
        BankIFSCCode: formData.BankIFSCCode,
        BankName: formData.BankName,
        UANNumber: formData.UANNumber,
        PFNumber: formData.PF_Number,
        ESINumber: formData.ESINumber,
        MaritalStatus: formData.MaritalStatus || null,
        HeightFeet: formData.MedicalHeightFeet
          ? Number(formData.MedicalHeightFeet)
          : null,

        HeightInches: formData.MedicalHeightInches
          ? Number(formData.MedicalHeightInches)
          : null,

        Weight: formData.MedicalWeight
          ? Number(formData.MedicalWeight)
          : null,

        BloodGroup: formData.MedicalBloodGroup || null,

        IdentificationMarks:
          formData.MedicalIdentifications || null,

        GeneralDeclaration:
          reviewDeclarations.general,

        BackgroundVerification:
          reviewDeclarations.background,

        IdentityAuthentication:
          reviewDeclarations.identity,

        EmploymentTerms:
          reviewDeclarations.terms,

        PreviousOccupation: formData.EmploymentPreviousOccupation || null,

        PreviousCompany: formData.EmploymentPreviousCompany || null,

        ExperienceYears: formData.EmploymentExpYears
          ? Number(formData.EmploymentExpYears)
          : null,

        ExperienceMonths: formData.EmploymentExpMonths
          ? Number(formData.EmploymentExpMonths)
          : null,

        ComputerKnowledge:
          formData.EmploymentComputerKnowledge === "Yes",
      };

      let response;
      let activeTempId = formData.TempId || 0;

      // =========================
      // UPDATE (PUT)
      // =========================
      if ((isEditMode || formData.TempId > 0)) {
        const idToUpdate = formData.TempId;
        response = await updateOnboardingTemp(
          idToUpdate,
          payload,
          documents
        );

        toast.current.show({
          severity: "success",
          summary: "Updated",
          detail: response?.Message || "Employee updated successfully",
        });
      }
      // =========================
      // CREATE (POST)
      // =========================
      else {
        response = await saveOnboardingTemp(payload, documents);

        // Robust TempId extraction
        const newId = response?.Data?.TempId || response?.TempId || (typeof response?.Data === 'number' ? response.Data : null);

        if (newId) {
          activeTempId = newId;
          setFormData(prev => ({ ...prev, TempId: newId }));
          setIsEditMode(true); // 🔥 Switch to edit mode to ensure subsequent saves use PUT
        }

        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: response?.Message || "Employee saved successfully",
        });
      }

      // Fetch the updated employee details from the server to refresh the documents list with valid FileUrls
      try {
        const updatedList = await getOnboardingTemp(puidn || 0);
        if (updatedList?.Data) {
          const currentEmp = updatedList.Data.find(e => e.TempId === activeTempId);
          if (currentEmp && currentEmp.Documents) {
            const mappedDocs = currentEmp.Documents.map((doc) => ({
              type: doc.DocumentType,
              file: null, // clear file object
              fileName: doc.FileName,
              url: doc.FileUrl,
            }));
            setDocuments(mappedDocs);
          }
        }
      } catch (err) {
        console.error("Failed to refresh documents after save:", err);
      }

      fetchEmployees();

      if (isFinal) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          setDialogVisible(false);
          resetForm();
          setDocuments([]);
        }, 2000);
      } else {
        // Automatically move to next tab
        const nextStep = stepIndex + 1;
        if (nextStep > maxEnabledTab) {
          setMaxEnabledTab(nextStep);
        }
        setActiveIndex(nextStep);
      }

    } catch (error) {
      console.log(error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to save employee",
      });
    }
  };

  const confirmDelete = (emp) => {

    confirmDialog({
      message: "Are you sure you want to delete this employee?",
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",

      accept: async () => {

        try {

          const response = await deleteOnboardingTemp(emp.TempId);

          toast.current.show({
            severity: "success",
            summary: "Deleted",
            detail: response?.Message || "Employee deleted successfully",
          });

          fetchEmployees();

        } catch (error) {

          toast.current.show({
            severity: "error",
            summary: "Error",
            detail:
              error?.message || "Failed to delete employee",
          });
        }
      }
    });
  };
  const onboardingStyles = `
/* Application Submitted Success Popup */
.onboarding-success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(16, 30, 54, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: overlayFadeIn 0.25s ease;
}
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.onboarding-success-card {
  width: 480px;
  min-height: 342px;
  background: #FAFAFA;
  border: 1px solid rgba(19, 23, 32, 0.15);
  border-radius: 16px;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  box-sizing: border-box;
  animation: cardPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes cardPopIn {
  from { transform: scale(0.82); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}
.onboarding-success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(20, 132, 188, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.onboarding-success-icon-wrap i {
  font-size: 28px;
  color: #1484bc;
}
.onboarding-success-title {
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  color: #1E3143;
  text-align: center;
  margin: 0;
}
.onboarding-success-desc {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.02em;
  color: #1F4E7A;
  text-align: center;
  margin: 0;
  max-width: 400px;
}
/* Custom premium styles matching Spare Master UI */
.asset-master-page {
  padding: 20px 0;
}

.onboarding-action-btn {
  background: transparent !important;
  border: none !important;
  padding: 4px 8px !important;
  cursor: pointer;
  color: #7b8793 !important;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.onboarding-action-btn:hover {
  color: #1f4f82 !important;
  transform: scale(1.15);
}

.onboarding-action-btn-danger:hover {
  color: #eb4b4b !important;
}

.onboarding-action-btn-success:hover {
  color: #078837 !important;
}

/* Modal styling overrides to match Spare Master styling */
.p-dialog {
  border-radius: 12px !important;
  box-shadow: 0 20px 50px rgba(20, 43, 74, 0.12) !important;
  border: 1px solid rgba(19, 23, 32, 0.15) !important;
  overflow: hidden !important;
}

.p-dialog .p-dialog-header {
  background: #edf0f3 !important;
  color: #26384d !important;
  padding: 16px 24px !important;
  border-bottom: 1px solid rgba(19, 23, 32, 0.1) !important;
}

.onboarding-view-dialog .p-dialog-header {
  background: #FAFAFA !important;
  color: #26384d !important;
  padding: 18px 24px !important;
  border-bottom: 1px solid rgba(19, 23, 32, 0.1) !important;
}

.onboarding-view-dialog .p-dialog-content {
  background: #FAFAFA !important;
  padding: 0 !important;
}

.p-dialog .p-dialog-header .p-dialog-title {
  font-size: 18px !important;
  font-weight: 600 !important;
  font-family: Inter, sans-serif !important;
}

.p-dialog .p-dialog-content {
  padding: 24px !important;
  background: #fafafa !important;
}

.onboarding-dialog-popup .p-dialog-content {
  padding: 0 !important;
  background: #ffffff !important;
  overflow: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.onboarding-dialog-popup .p-dialog-content::-webkit-scrollbar {
  display: none !important;
}

.p-dialog .p-dialog-footer {
  background: #edf0f3 !important;
  padding: 12px 24px !important;
  border-top: 1px solid rgba(19, 23, 32, 0.1) !important;
}

/* Form controls matching Spare Master and Figma Specs (Image 1, 2, 3) */
.p-dialog-content .p-inputtext,
.p-dialog-content .p-dropdown,
.p-dialog-content .custom-datepicker-input,
.p-inputtext,
.p-dropdown,
.custom-datepicker-input,
.p-fluid .p-inputtext,
.p-fluid .p-dropdown {
  height: 36px !important;
  border: 1px solid rgba(19, 23, 32, 0.15) !important; /* Hex #131720 at 15% opacity */
  border-radius: 4px !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
  padding: 8px 12px !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
  color: #131720 !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
  line-height: normal !important;
  box-sizing: border-box !important;
  width: 100% !important;
}

.p-dialog-content .p-inputtext:focus,
.p-dialog-content .p-dropdown.p-focus,
.p-dialog-content .custom-datepicker-input:focus,
.p-inputtext:focus,
.p-dropdown.p-focus,
.custom-datepicker-input:focus {
  border-color: #1F4E7A !important;
  background: #ffffff !important;
  background-color: #ffffff !important;
}

/* Dropdown override fixes to match input fields */
.p-dialog-content .p-dropdown,
.p-dropdown {
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  box-sizing: border-box !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
}

.p-dialog-content .p-dropdown .p-dropdown-label,
.p-dropdown .p-dropdown-label {
  padding: 8px 12px !important;
  font-size: 14px !important;
  font-family: 'Inter', sans-serif !important;
  color: #131720 !important;
  line-height: normal !important;
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
}

.p-dialog-content .p-dropdown .p-dropdown-trigger,
.p-dropdown .p-dropdown-trigger {
  width: 32px !important;
  background: transparent !important;
  border: none !important;
  color: #7b8793 !important;
}

/* Dropdown panel overrides */
.p-dropdown-panel {
  border-radius: 8px !important;
  border: 1px solid rgba(19, 23, 32, 0.15) !important;
  box-shadow: 0 10px 30px rgba(20, 43, 74, 0.08) !important;
  background: #ffffff !important;
  padding: 4px 0 !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item {
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
  color: #131720 !important;
  padding: 8px 12px !important;
  transition: all 0.15s ease !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
  background: #d3e6ff !important;
  color: #000000 !important;
  font-weight: 500 !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item:not(.p-highlight):hover {
  background: #eff3f8 !important;
}

/* Custom DatePicker overrides */
.custom-datepicker-container {
  width: 100% !important;
}

.custom-datepicker-input {
  height: 36px !important;
  border: 1px solid rgba(19, 23, 32, 0.15) !important;
  border-radius: 4px !important;
  background: #FFFFFF !important;
  padding: 8px 32px 8px 12px !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
  color: #131720 !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
  line-height: normal !important;
  outline: none !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.custom-datepicker-input:focus {
  border-color: #1F4E7A !important;
  background: #ffffff !important;
}

.custom-datepicker-icon {
  right: 12px !important;
  color: #7b8793 !important;
  font-size: 16px !important;
}

.custom-datepicker-popup {
  background: #ffffff !important;
  border: 1px solid rgba(19, 23, 32, 0.15) !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 30px rgba(20, 43, 74, 0.1) !important;
  padding: 12px !important;
}

.custom-datepicker-date.selected {
  background: #1F4E7A !important;
}

/* Input label typography and layouts matching Figma Image 3 */
.p-fluid label,
.onboarding-fields-grid label {
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  line-height: 20px !important;
  letter-spacing: -0.15px !important;
  color: #131720 !important;
  margin-bottom: 6px !important;
  display: block !important;
}

/* TabView overrides */
.p-tabview .p-tabview-nav {
  display: flex !important;
  gap: 16px !important;
  padding: 16px 20px 10px !important;
  border-bottom: 1px solid rgba(19, 23, 32, 0.1) !important;
  background: transparent !important;
}

.p-tabview .p-tabview-nav li .p-tabview-nav-link {
  border: 0 !important;
  background: transparent !important;
  color: #5a5b5d !important;
  padding: 8px 16px !important;
  border-radius: 4px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  font-family: 'Inter', sans-serif !important;
}

.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
  background: #d3e6ff !important;
  color: #000000 !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
}

/* Button stylings */
.p-button.p-button-primary,
.p-button.p-button-success {
  background: #1f4f82 !important;
  border-color: #1f4f82 !important;
  border-radius: 8px !important;
  padding: 10px 24px !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}

.p-button.p-button-primary:hover,
.p-button.p-button-success:hover {
  background: #2a5f94 !important;
  border-color: #2a5f94 !important;
}

/* Split Layout Container */
.onboarding-split-container {
  display: flex;
  height: 650px;
  min-height: 600px;
  width: 100%;
  margin: 0 !important; /* Reset margin since padding is 0 */
  overflow: hidden;
}

/* Left Sidebar */
.onboarding-sidebar {
  width: 280px;
  background: #1e3143;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
  height: 100%;
}

.onboarding-step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 15px;
}

.onboarding-step-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.onboarding-step-item.active {
  background: #ffffff;
  color: #1e3143 !important;
  font-weight: 600;
}

.onboarding-step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.onboarding-step-item.active .onboarding-step-icon {
  background: #1e3143;
  color: #ffffff;
  border-color: #1e3143;
}

.onboarding-step-item:not(.active) .onboarding-step-icon.completed {
  background: #ffffff !important;
  color: #1F4E7A !important;
  border-color: #ffffff !important;
}

.onboarding-step-icon.completed {
  font-weight: bold !important;
}

/* Right Content Area */
.onboarding-form-pane {
  flex: 1;
  background: #ffffff;
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.onboarding-form-fields-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.onboarding-form-fields-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.onboarding-form-pane-header {
  margin-bottom: 20px;
}

.onboarding-company-meta {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #7b8793;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.onboarding-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}

.onboarding-main-title {
  font-size: 26px;
  font-weight: 700;
  color: #1e3143;
  margin: 0;
  font-family: 'Outfit', 'Inter', sans-serif;
}

.onboarding-progress-indicator {
  font-family: 'Inter', sans-serif;
  text-align: right;
}

.onboarding-progress-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e3143;
  display: block;
}

.onboarding-progress-step {
  font-size: 12px;
  color: #7b8793;
}

/* Dynamic Progress Line */
.onboarding-progress-track {
  width: 100%;
  height: 4px;
  background: #edf0f3;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 24px;
}

.onboarding-progress-fill {
  height: 100%;
  background: #1f4f82;
  transition: width 0.3s ease;
}

/* Section Title matching Figma Specs (Image 4) */
.onboarding-section-title {
  font-family: 'Inter', sans-serif !important;
  font-size: 24px !important;
  font-weight: 500 !important;
  color: #1F4E7A !important;
  line-height: 100% !important;
  letter-spacing: 0% !important;
  border-bottom: none !important;
  padding-bottom: 0 !important;
  margin-bottom: 24px !important;
}

/* Close Icon top right */
.onboarding-close-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  font-size: 18px;
  color: #7b8793;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px;
  z-index: 10;
}

.onboarding-close-icon:hover {
  color: #1e3143;
}

/* Custom form grid columns */
.onboarding-fields-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px 24px;
}

.onboarding-grid-col-12 {
  grid-column: span 12;
}

.onboarding-grid-col-6 {
  grid-column: span 6;
}

.onboarding-grid-col-4 {
  grid-column: span 4;
}

/* Footer layout */
.onboarding-pane-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 24px;
  border-top: 1px solid #edf0f3;
  padding-top: 16px;
}

.onboarding-footer-btn-continue {
  background: #1F4E7A !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 4px !important;
  width: 232px !important;
  height: 44px !important;
  padding: 12px 28px 12px 32px !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  font-size: 15px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  box-sizing: border-box !important;
}

.onboarding-footer-btn-continue:hover {
  background: #2b5f91 !important;
}

/* Document Upload Container */
.onboarding-doc-upload-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 740px;
  width: 100%;
  margin: 0 auto;
}

/* Document Upload Card */
.onboarding-doc-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start !important;
  width: 100%;
  max-width: 740px;
  min-height: 135px !important;
  height: auto !important;
  border-radius: 8px !important;
  padding: 20px 24px !important;
  box-sizing: border-box !important;
  gap: 20px !important;
  transition: all 0.3s ease !important;
  position: relative !important;
}

/* State 1: Document Not Uploaded */
.onboarding-doc-card.not-uploaded {
  background: #F2F4F7 !important;
  border: 1px dashed rgba(19, 23, 32, 0.15) !important;
}

/* State 2: Document Uploaded */
.onboarding-doc-card.uploaded {
  background: #E5F0FF !important;
  border: 1px dashed #1484BC !important;
}

/* Document Icon Column */
.onboarding-doc-icon-col {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.onboarding-doc-icon-col.not-uploaded {
  color: #7b8793;
}

.onboarding-doc-icon-col.uploaded {
  color: #1484BC;
}

.onboarding-doc-icon-col i {
  font-size: 24px !important;
}

/* Document Content Column */
.onboarding-doc-content-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0; /* truncate long text */
}

.onboarding-doc-title {
  font-family: 'Inter', sans-serif !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  color: #1e3143 !important;
  margin: 0 !important;
}

.onboarding-doc-subtitle {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  color: #7b8793 !important;
  margin: 0 !important;
}

/* Document Action Row */
.onboarding-doc-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

/* Choose File Input / Label Button */
.onboarding-doc-choose-btn {
  background: #1F4E7A !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 4px !important;
  padding: 8px 16px !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  transition: background 0.2s !important;
  margin: 0 !important;
}

.onboarding-doc-choose-btn:hover {
  background: #2b5f91 !important;
}

/* Plus button for Aadhar Card/multiple documents */
.onboarding-doc-plus-btn {
  background: #1484BC !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 4px !important;
  width: 32px !important;
  height: 32px !important;
  font-size: 16px !important;
  font-weight: bold !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background 0.2s !important;
  margin: 0 !important;
}

.onboarding-doc-plus-btn:hover {
  background: #1a96d4 !important;
}

/* Uploaded file badge or status */
.onboarding-doc-filename {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #1484BC !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 250px !important;
  display: inline-block !important;
}

.onboarding-doc-filename:hover {
  text-decoration: underline !important;
}

.onboarding-doc-no-file {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  color: #7b8793 !important;
}

/* File list below the main card */
.onboarding-doc-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
  max-width: 740px;
  margin-left: auto;
  margin-right: auto;
}

.onboarding-doc-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff !important;
  border: 1px solid rgba(19, 23, 32, 0.1) !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  box-sizing: border-box !important;
}

.onboarding-doc-file-item-name {
  font-family: 'Inter', sans-serif !important;
  font-size: 13px !important;
  color: #1e3143 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.onboarding-doc-file-item-remove {
  background: transparent !important;
  border: none !important;
  color: #eb4b4b !important;
  cursor: pointer !important;
  padding: 4px !important;
  font-size: 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.onboarding-doc-file-item-remove:hover {
  color: #f76666 !important;
  transform: scale(1.1);
}

.onboarding-fields-grid .onboarding-radio-wrapper {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 14px !important;
  color: #1E3143 !important;
  font-weight: 500 !important;
  margin: 0 !important;
}

.p-fluid .onboarding-radio-input {
  width: 20px !important;
  height: 20px !important;
  cursor: pointer !important;
  accent-color: #1F4E7A !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
  -webkit-appearance: radio !important;
  appearance: radio !important;
}

.p-fluid .onboarding-address-input,
.p-dialog-content .onboarding-address-input {
  height: 68px !important;
  width: 740px !important;
}
`;

  return (
    <>
      <style>{onboardingStyles}</style>
      <PrimeReactProvider>
        <div className="content-wrapper">
          <section className="content mt-3">
            <div className="container-fluid">
              <Toast ref={toast} />
              <ConfirmDialog />

              <div className="asset-master-page">
                <div className="asset-master-breadcrumb">
                  <i
                    className="fa fa-angle-left"
                    aria-hidden="true"
                    style={{ cursor: "pointer" }}
                    onClick={() => history.push("/Account/App/EmployeeOnboarding")}
                  />
                  <span>Employee onboarding</span>
                </div>

                <div className="asset-master-layout">
                  <div className="asset-master-main-card">
                    <div className="asset-master-toolbar">
                      <div className="asset-master-search" onClick={() => searchInputRef.current?.focus()}>
                        <i className="fa fa-search" aria-hidden="true" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search applicant"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="asset-master-toolbar-actions">
                        <button
                          type="button"
                          className="btn btn-primary asset-toolbar-add"
                          onClick={openNew}
                        >
                          <i className="fa fa-plus" aria-hidden="true" />
                          Add applicant
                        </button>
                      </div>
                    </div>

                    <div className="asset-master-table-wrap asset-master-table-wrap-spare">
                      <div className="table-responsive">
                        <table className="table custTable table-hover">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Designation</th>
                              <th>Department</th>
                              <th>Mobile no.</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedEmployees.map((row) => {
                              const statusInfo = getStatusMeta(row);
                              return (
                                <tr key={row.TempId}>
                                  <td>{row.Name || "-"}</td>
                                  <td>{row.Designation || "-"}</td>
                                  <td>{row.Department || "-"}</td>
                                  <td>{row.MobileNumber || "-"}</td>
                                  <td>{row.DateOfJoining ? row.DateOfJoining.split("T")[0] : "-"}</td>
                                  <td>
                                    <span className={statusInfo.className}>{statusInfo.label}</span>
                                  </td>
                                  <td onClick={(e) => e.stopPropagation()}>
                                    <div className="d-flex gap-2 align-items-center">
                                      {userRole === "HR" ? (
                                        <>
                                          {!(row.IsApproved === true || row.IsApproved === 1 || row.IsApproved === "1") &&
                                            !(row.IsRejected === true || row.IsRejected === 1 || row.IsRejected === "1") && (
                                              <button
                                                type="button"
                                                className="onboarding-action-btn onboarding-action-btn-success"
                                                title="Approve"
                                                onClick={() => approveEmployee(row)}
                                              >
                                                <i className="fa fa-check" style={{ fontSize: "16px" }} />
                                              </button>
                                            )}

                                          {!(row.IsApproved === true || row.IsApproved === 1 || row.IsApproved === "1") &&
                                            !(row.IsRejected === true || row.IsRejected === 1 || row.IsRejected === "1") && (
                                              <button
                                                type="button"
                                                className="onboarding-action-btn onboarding-action-btn-danger"
                                                title="Reject"
                                                onClick={() => {
                                                  setSelectedRejectEmployee(row);
                                                  setRejectDialog(true);
                                                }}
                                              >
                                                <i className="fa fa-times" style={{ fontSize: "16px" }} />
                                              </button>
                                            )}
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className="onboarding-action-btn"
                                            title="Edit"
                                            onClick={() => editEmployee(row)}
                                          >
                                            <i className="fa fa-pencil-square-o" style={{ fontSize: "16px" }} />
                                          </button>

                                          <button
                                            type="button"
                                            className="onboarding-action-btn onboarding-action-btn-danger"
                                            title="Delete"
                                            onClick={() => confirmDelete(row)}
                                          >
                                            <i className="fa fa-trash-o" style={{ fontSize: "16px" }} />
                                          </button>
                                        </>
                                      )}

                                      <button
                                        type="button"
                                        className="onboarding-action-btn"
                                        title="View Details"
                                        onClick={() => {
                                          setSelectedEmployeeView(row);
                                          setViewDialog(true);
                                        }}
                                      >
                                        <i className="fa fa-eye" style={{ fontSize: "16px" }} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredEmployees.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "18px" }}>
                                  No employees found.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                      {filteredEmployees.length > ROWS_PER_PAGE ? (
                        <div className="asset-owned-pagination" style={{ borderTop: "1px solid rgba(19, 23, 32, 0.1)" }}>
                          <span>{`Showing ${(safeCurrentPage - 1) * ROWS_PER_PAGE + 1}-${Math.min(safeCurrentPage * ROWS_PER_PAGE, filteredEmployees.length)} of ${filteredEmployees.length}`}</span>
                          <div className="asset-owned-pagination-controls">
                            <button
                              type="button"
                              className="asset-owned-page-btn"
                              disabled={safeCurrentPage === 1}
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            >
                              <i className="fa fa-angle-left" aria-hidden="true" />
                            </button>
                            <span className="asset-owned-page-number">{safeCurrentPage}</span>
                            <button
                              type="button"
                              className="asset-owned-page-btn"
                              disabled={safeCurrentPage === totalPages}
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            >
                              <i className="fa fa-angle-right" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Dialog */}
          <Dialog
            visible={dialogVisible}
            className="onboarding-dialog-popup"
            style={{ width: "95vw", maxWidth: "1100px", padding: 0 }}
            modal
            showHeader={false}
            footer={null}
            onHide={() => setDialogVisible(false)}
          >
            <div className="onboarding-split-container">
              {/* Left Sidebar */}
              <div className="onboarding-sidebar">
                <div
                  className={`onboarding-step-item ${activeIndex === 0 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 0) setActiveIndex(0);
                  }}
                >
                  <span className={`onboarding-step-icon ${maxEnabledTab >= 1 ? "completed" : ""}`}>
                    {maxEnabledTab >= 1 ? (
                      <i className="pi pi-check" />
                    ) : (
                      <i className="fa fa-user" />
                    )}
                  </span>
                  <span>Personal Info</span>
                </div>

                <div
                  className={`onboarding-step-item ${activeIndex === 1 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 1) {
                      setActiveIndex(1);
                    } else {
                      toast.current.show({ severity: 'warn', summary: 'Save Required', detail: 'Please save current section before moving to next.' });
                    }
                  }}
                >
                  <span className={`onboarding-step-icon ${maxEnabledTab >= 2 ? "completed" : ""}`}>
                    {maxEnabledTab >= 2 ? (
                      <i className="pi pi-check" />
                    ) : (
                      <i className="pi pi-briefcase" />
                    )}
                  </span>
                  <span>Employment</span>
                </div>

                <div
                  className={`onboarding-step-item ${activeIndex === 2 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 2) {
                      setActiveIndex(2);
                    } else {
                      toast.current.show({ severity: 'warn', summary: 'Save Required', detail: 'Please save current section before moving to next.' });
                    }
                  }}
                >
                  <span className={`onboarding-step-icon ${maxEnabledTab >= 3 ? "completed" : ""}`}>
                    {maxEnabledTab >= 3 ? (
                      <i className="pi pi-check" />
                    ) : (
                      <i className="pi pi-plus-circle" />
                    )}
                  </span>
                  <span>Medical</span>
                </div>

                <div
                  className={`onboarding-step-item ${activeIndex === 3 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 3) {
                      setActiveIndex(3);
                    } else {
                      toast.current.show({ severity: 'warn', summary: 'Save Required', detail: 'Please save current section before moving to next.' });
                    }
                  }}
                >
                  <span className={`onboarding-step-icon ${maxEnabledTab >= 4 ? "completed" : ""}`}>
                    {maxEnabledTab >= 4 ? (
                      <i className="pi pi-check" />
                    ) : (
                      <i className="fa fa-university" />
                    )}
                  </span>
                  <span>Bank & Financials</span>
                </div>

                <div
                  className={`onboarding-step-item ${activeIndex === 4 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 4) {
                      setActiveIndex(4);
                    } else {
                      toast.current.show({ severity: 'warn', summary: 'Save Required', detail: 'Please save current section before moving to next.' });
                    }
                  }}
                >
                  <span className={`onboarding-step-icon ${maxEnabledTab >= 5 ? "completed" : ""}`}>
                    {maxEnabledTab >= 5 ? (
                      <i className="pi pi-check" />
                    ) : (
                      <i className="fa fa-file-text" />
                    )}
                  </span>
                  <span>Documents</span>
                </div>

                <div
                  className={`onboarding-step-item ${activeIndex === 5 ? "active" : ""}`}
                  onClick={() => {
                    if (maxEnabledTab >= 5) {
                      setActiveIndex(5);
                    } else {
                      toast.current.show({ severity: 'warn', summary: 'Save Required', detail: 'Please save current section before moving to next.' });
                    }
                  }}
                >
                  <span className="onboarding-step-icon">
                    <i className="pi pi-file-edit" />
                  </span>
                  <span>Review</span>
                </div>
              </div>

              {/* Right Content Pane */}
              <div className="onboarding-form-pane">
                {/* Close Button */}
                <button
                  type="button"
                  className="onboarding-close-icon"
                  onClick={() => setDialogVisible(false)}
                  title="Close Dialog"
                >
                  <i className="fa fa-times" />
                </button>

                {/* Pane Header */}
                <div className="onboarding-form-pane-header">
                  <div className="onboarding-company-meta">
                    {propertyName} • {propertyName}
                  </div>
                  <div className="onboarding-title-row">
                    <h2 className="onboarding-main-title">Employee Onboarding</h2>
                    <div className="onboarding-progress-indicator">
                      <span className="onboarding-progress-label">Progress</span>
                      <span className="onboarding-progress-step">Step {activeIndex + 1} of 6</span>
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div className="onboarding-progress-track">
                    <div
                      className="onboarding-progress-fill"
                      style={{ width: `${((activeIndex + 1) / 6) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Form Panels */}
                <div className="onboarding-form-fields-wrapper" style={{ flex: 1 }}>
                  {activeIndex === 0 && (
                    <div>
                      <h3 className="onboarding-section-title">Personal Information</h3>
                      <div className="onboarding-fields-grid p-fluid">
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Full Name *</label>
                          <InputText placeholder="Enter full name" value={formData.Name} onChange={(e) => setFormData({ ...formData, Name: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Father's Name</label>
                          <InputText placeholder="Enter father's name" value={formData.FatherName} onChange={(e) => setFormData({ ...formData, FatherName: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Mother's Name</label>
                          <InputText placeholder="Enter mother's name" value={formData.MotherName} onChange={(e) => setFormData({ ...formData, MotherName: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Spouse's Name</label>
                          <InputText placeholder="Enter spouse's name" value={formData.SpouseName} onChange={(e) => setFormData({ ...formData, SpouseName: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Gender *</label>
                          <Dropdown value={formData.Gender} options={genders} onChange={(e) => setFormData({ ...formData, Gender: e.value })} placeholder="Select Gender" />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Marital Status</label>
                          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', height: '36px' }}>
                            <label className="onboarding-radio-wrapper">
                              <input
                                type="radio"
                                className="onboarding-radio-input"
                                name="maritalStatus"
                                checked={formData.MaritalStatus === "Married"}
                                onChange={() => setFormData({ ...formData, MaritalStatus: "Married" })}
                              />
                              Married
                            </label>
                            <label className="onboarding-radio-wrapper">
                              <input
                                type="radio"
                                className="onboarding-radio-input"
                                name="maritalStatus"
                                checked={formData.MaritalStatus === "Unmarried"}
                                onChange={() => setFormData({ ...formData, MaritalStatus: "Unmarried" })}
                              />
                              Unmarried
                            </label>
                          </div>
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Designation *</label>
                          <Dropdown value={formData.Designation} options={designations} onChange={(e) => setFormData({ ...formData, Designation: e.value })} placeholder="Select Designation" filter />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Department</label>
                          <Dropdown value={formData.Department} options={departments} onChange={(e) => setFormData({ ...formData, Department: e.value })} placeholder="Select Department" filter />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Employment Type</label>
                          <Dropdown value={formData.EmploymentType} options={employmentTypes} onChange={(e) => setFormData({ ...formData, EmploymentType: e.value })} placeholder="Select Employment Type" />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Mobile Number</label>
                          <InputText placeholder="10-digit number" value={formData.MobileNumber} onChange={(e) => setFormData({ ...formData, MobileNumber: e.target.value })} maxLength={10} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Other Number</label>
                          <InputText placeholder="10-digit number" value={formData.OtherNumber} onChange={(e) => setFormData({ ...formData, OtherNumber: e.target.value })} maxLength={10} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Email Address</label>
                          <InputText placeholder="Enter email address" value={formData.Email} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} type="email" />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Date of Birth</label>
                          <CustomDatePicker
                            value={formData.DateOfBirth}
                            onChange={(e) => setFormData({ ...formData, DateOfBirth: e.target.value })}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Date of Joining *</label>
                          <CustomDatePicker
                            value={formData.DateOfJoining}
                            onChange={(e) => setFormData({ ...formData, DateOfJoining: e.target.value })}
                          />
                        </div>

                        <div className="onboarding-grid-col-12 mb-3">
                          <label>Address Line 1</label>
                          <InputText
                            placeholder="Enter Address Line 1"
                            value={formData.AddressLine1}
                            onChange={(e) => setFormData({ ...formData, AddressLine1: e.target.value })}
                            className="onboarding-address-input"
                          />
                        </div>
                        <div className="onboarding-grid-col-12 mb-3">
                          <label>Address Line 2</label>
                          <InputText
                            placeholder="Enter Address Line 2"
                            value={formData.AddressLine2}
                            onChange={(e) => setFormData({ ...formData, AddressLine2: e.target.value })}
                            className="onboarding-address-input"
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>City</label>
                          <InputText placeholder="Enter city" value={formData.City} onChange={(e) => setFormData({ ...formData, City: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>State</label>
                          <Dropdown value={formData.State} options={indianStates} onChange={(e) => setFormData({ ...formData, State: e.value })} placeholder="Select State" filter />
                        </div>
                      </div>
                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => saveEmployee(0)}
                        >
                          Save and Continue <i className="fa fa-angle-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIndex === 1 && (
                    <div>
                      <h3 className="onboarding-section-title">Employment Information</h3>
                      <div className="onboarding-fields-grid p-fluid">
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Previous Occupation</label>
                          <InputText
                            placeholder="Enter role name"
                            value={formData.EmploymentPreviousOccupation}
                            onChange={(e) => setFormData({ ...formData, EmploymentPreviousOccupation: e.target.value })}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Previous Company</label>
                          <InputText
                            placeholder="Enter company name"
                            value={formData.EmploymentPreviousCompany}
                            onChange={(e) => setFormData({ ...formData, EmploymentPreviousCompany: e.target.value })}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Total service experience</label>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <InputText
                                placeholder="Years"
                                value={formData.EmploymentExpYears}
                                onChange={(e) => setFormData({ ...formData, EmploymentExpYears: e.target.value })}
                                type="number"
                                min="0"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <InputText
                                placeholder="Months"
                                value={formData.EmploymentExpMonths}
                                onChange={(e) => setFormData({ ...formData, EmploymentExpMonths: e.target.value })}
                                type="number"
                                min="0"
                                max="11"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Computer Knowledge</label>
                          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', height: '36px' }}>
                            <label className="onboarding-radio-wrapper">
                              <input
                                type="radio"
                                className="onboarding-radio-input"
                                name="computerKnowledge"
                                checked={formData.EmploymentComputerKnowledge === "Yes"}
                                onChange={() => setFormData({ ...formData, EmploymentComputerKnowledge: "Yes" })}
                              />
                              Yes
                            </label>
                            <label className="onboarding-radio-wrapper">
                              <input
                                type="radio"
                                className="onboarding-radio-input"
                                name="computerKnowledge"
                                checked={formData.EmploymentComputerKnowledge === "No"}
                                onChange={() => setFormData({ ...formData, EmploymentComputerKnowledge: "No" })}
                              />
                              No
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => saveEmployee(1)}
                        >
                          Save and Continue <i className="fa fa-angle-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIndex === 2 && (
                    <div>
                      <h3 className="onboarding-section-title">Medical Information</h3>
                      <div className="onboarding-fields-grid p-fluid">

                        {/* Height (Feet & Inches side-by-side) */}
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Height</label>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <InputText
                                placeholder="Feet"
                                value={formData.MedicalHeightFeet}
                                onChange={(e) => setFormData({ ...formData, MedicalHeightFeet: e.target.value })}
                                type="number"
                                min="0"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <InputText
                                placeholder="Inches"
                                value={formData.MedicalHeightInches}
                                onChange={(e) => setFormData({ ...formData, MedicalHeightInches: e.target.value })}
                                type="number"
                                min="0"
                                max="11"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Weight (kg) */}
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Weight <span style={{ fontSize: '12px', color: '#7b8793', fontWeight: 'normal' }}>(kg)</span></label>
                          <InputText
                            placeholder="65"
                            value={formData.MedicalWeight}
                            onChange={(e) => setFormData({ ...formData, MedicalWeight: e.target.value })}
                            type="number"
                            min="0"
                          />
                        </div>

                        {/* Blood Group */}
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Blood Group</label>
                          <InputText
                            placeholder="Enter blood group"
                            value={formData.MedicalBloodGroup}
                            onChange={(e) => setFormData({ ...formData, MedicalBloodGroup: e.target.value })}
                          />
                        </div>

                        {/* Identification Marks */}
                        <div className="onboarding-grid-col-12 mb-3">
                          <label>Identification Marks</label>
                          <InputText
                            placeholder="Any visible marks or scars"
                            value={formData.MedicalIdentifications}
                            onChange={(e) => setFormData({ ...formData, MedicalIdentifications: e.target.value })}
                          />
                        </div>

                      </div>

                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => saveEmployee(2)}
                        >
                          Save and Continue <i className="fa fa-angle-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIndex === 3 && (
                    <div>
                      <h3 className="onboarding-section-title">Bank & Financials</h3>
                      <div className="onboarding-fields-grid p-fluid">
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Aadhar Card Number *</label>
                          <InputText
                            placeholder="12-digit number"
                            value={formData.AadharCard}
                            onChange={(e) => setFormData({ ...formData, AadharCard: e.target.value })}
                            maxLength={12}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>PAN Card Number *</label>
                          <InputText
                            placeholder="PAN card number"
                            value={formData.PanCard}
                            onChange={(e) => setFormData({ ...formData, PanCard: e.target.value.toUpperCase() })}
                            maxLength={10}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Bank Account Number *</label>
                          <InputText placeholder="Bank account number" value={formData.BankAccountNumber} onChange={(e) => setFormData({ ...formData, BankAccountNumber: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>IFSC Code *</label>
                          <InputText placeholder="IFSC Code" value={formData.BankIFSCCode} onChange={(e) => setFormData({ ...formData, BankIFSCCode: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>Bank Name</label>
                          <Dropdown value={formData.BankName} options={indianBanks} onChange={(e) => setFormData({ ...formData, BankName: e.value })} editable placeholder="Select/Type Bank" />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>UAN Number *</label>
                          <InputText
                            placeholder="UAN Number"
                            value={formData.UANNumber}
                            onChange={(e) => setFormData({ ...formData, UANNumber: e.target.value })}
                          />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>PF Number</label>
                          <InputText placeholder="PF Number" value={formData.PF_Number} onChange={(e) => setFormData({ ...formData, PF_Number: e.target.value })} />
                        </div>
                        <div className="onboarding-grid-col-6 mb-3">
                          <label>ESI Number</label>
                          <InputText placeholder="ESI Number" value={formData.ESINumber} onChange={(e) => setFormData({ ...formData, ESINumber: e.target.value })} />
                        </div>
                      </div>
                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => saveEmployee(3)}
                        >
                          Save and Continue <i className="fa fa-angle-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIndex === 4 && (
                    <div>
                      <h3 className="onboarding-section-title">Document Upload</h3>
                      <div className="onboarding-doc-upload-container">
                        {[
                          { label: "Photograph", type: "Profile", accept: "image/*", multiple: false, subtitle: "Upload recent photograph (jpg, png)" },
                          { label: "Aadhar card/ Voter ID", type: "Aadhar", accept: "*", multiple: true, subtitle: "Address proof" },
                          { label: "Pan Card", type: "PAN", accept: "*", multiple: false, subtitle: "If available" },
                          { label: "Bank Passbook", type: "Bank Passbook", accept: "*", multiple: false, subtitle: "First page with account details" },
                          { label: "Resume", type: "Resume", accept: ".pdf,.doc,.docx", multiple: false, subtitle: "Upload resume (.pdf, .doc, .docx)" }
                        ].map((item, index) => {
                          const existingDocs = documents.filter((d) => d.type === item.type);
                          const isUploaded = existingDocs.length > 0;
                          return (
                            <div key={index} className="onboarding-doc-item-wrapper" style={{ width: "100%", maxWidth: "740px", marginLeft: "auto", marginRight: "auto" }}>
                              {/* Main Card */}
                              <div className={`onboarding-doc-card ${isUploaded ? "uploaded" : "not-uploaded"}`} style={{ marginBottom: "16px" }}>
                                {/* Left Icon Column */}
                                <div className={`onboarding-doc-icon-col ${isUploaded ? "uploaded" : "not-uploaded"}`}>
                                  {isUploaded ? (
                                    <i className="pi pi-check-circle" />
                                  ) : (
                                    <i className="pi pi-upload" />
                                  )}
                                </div>

                                {/* Content Column */}
                                <div className="onboarding-doc-content-col">
                                  <h4 className="onboarding-doc-title">{item.label}</h4>
                                  <p className="onboarding-doc-subtitle">{item.subtitle}</p>

                                  {/* Render Populated Slots (Uploaded files next to Choose file button) */}
                                  {existingDocs.map((doc, docIdx) => (
                                    <div key={`pop-${docIdx}`} className="onboarding-doc-action-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginTop: '4px' }}>
                                      <label className="onboarding-doc-choose-btn">
                                        Choose file
                                        <input
                                          type="file"
                                          accept={item.accept}
                                          hidden
                                          onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (!files.length) return;
                                            setDocuments((prev) => {
                                              const updated = [...prev];
                                              const idx = updated.indexOf(doc);
                                              if (idx !== -1) {
                                                updated[idx] = { type: item.type, file: files[0] };
                                              }
                                              return updated;
                                            });
                                            e.target.value = "";
                                          }}
                                        />
                                      </label>

                                      {/* Aadhar Plus Button only on the first slot of Aadhar card */}
                                      {item.multiple && docIdx === 0 && (
                                        <button
                                          type="button"
                                          className="onboarding-doc-plus-btn"
                                          onClick={() => setExtraAadharSlots((prev) => prev + 1)}
                                          title="Add another upload row"
                                        >
                                          +
                                        </button>
                                      )}

                                      {/* Filename next to button */}
                                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                                        {doc.url ? (
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="onboarding-doc-filename"
                                          >
                                            {doc.file?.name || doc.fileName}
                                          </a>
                                        ) : (
                                          <span className="onboarding-doc-filename">
                                            {doc.file?.name || doc.fileName}
                                          </span>
                                        )}
                                        {/* Remove button */}
                                        <button
                                          type="button"
                                          className="onboarding-doc-file-item-remove"
                                          onClick={() => {
                                            setDocuments((prev) => prev.filter((d) => d !== doc));
                                          }}
                                          title="Remove file"
                                          style={{ background: 'transparent', border: 'none', color: '#eb4b4b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                        >
                                          <i className="pi pi-times" style={{ fontSize: '14px' }} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Render Empty Slots */}
                                  {Array.from({ length: existingDocs.length === 0 ? 1 + extraAadharSlots : (item.multiple ? extraAadharSlots : 0) }).map((_, slotIdx) => {
                                    const isFirstDefaultSlot = existingDocs.length === 0 && slotIdx === 0;
                                    return (
                                      <div key={`empty-${slotIdx}`} className="onboarding-doc-action-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginTop: '4px' }}>
                                        <label className="onboarding-doc-choose-btn">
                                          Choose file
                                          <input
                                            type="file"
                                            accept={item.accept}
                                            multiple={item.multiple}
                                            hidden
                                            onChange={(e) => {
                                              const files = Array.from(e.target.files || []);
                                              if (!files.length) return;
                                              if (!item.multiple) {
                                                setDocuments((prev) => {
                                                  const filtered = prev.filter((d) => d.type !== item.type);
                                                  return [...filtered, ...files.map((file) => ({ type: item.type, file }))];
                                                });
                                              } else {
                                                setDocuments((prev) => [...prev, ...files.map((file) => ({ type: item.type, file }))]);
                                                if (extraAadharSlots > 0) {
                                                  setExtraAadharSlots((prev) => prev - 1);
                                                }
                                              }
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>

                                        {/* Aadhar Plus Button only on the first slot of empty Aadhar card */}
                                        {item.multiple && isFirstDefaultSlot && (
                                          <button
                                            type="button"
                                            className="onboarding-doc-plus-btn"
                                            onClick={() => setExtraAadharSlots((prev) => prev + 1)}
                                            title="Add another upload row"
                                          >
                                            +
                                          </button>
                                        )}

                                        <span className="onboarding-doc-no-file" style={{ fontSize: '13px', color: '#7b8793', flex: 1 }}>
                                          No file chosen
                                        </span>

                                        {/* Delete button for extra empty slots (not the first default slot) */}
                                        {item.multiple && !isFirstDefaultSlot && (
                                          <button
                                            type="button"
                                            onClick={() => setExtraAadharSlots((prev) => Math.max(0, prev - 1))}
                                            title="Remove this slot"
                                            style={{ background: 'transparent', border: 'none', color: '#eb4b4b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                                          >
                                            <i className="pi pi-times" style={{ fontSize: '14px' }} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => saveEmployee(4, false)}
                        >
                          Save and Continue <i className="fa fa-angle-right" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeIndex === 5 && (
                    <div>
                      <h3 className="onboarding-section-title">Review and declaration</h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '740px', margin: '0 auto' }}>

                        {/* 1. General Declaration */}
                        <div style={{ background: '#FFFFFF', border: '1px solid rgba(19, 23, 32, 0.15)', borderRadius: '8px', padding: '20px 24px' }}>
                          <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1E3143', margin: '0 0 10px 0' }}>General Declaration</h4>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#7b8793', margin: '0 0 16px 0' }}>
                            I certify that all information provided is true and accurate. I am an Indian citizen with no pending criminal cases. Any false information may result in legal action and termination.
                          </p>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F4E7A', fontWeight: 500, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={reviewDeclarations.general}
                              onChange={(e) => setReviewDeclarations({ ...reviewDeclarations, general: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1F4E7A' }}
                            />
                            I confirm that all information provided is accurate and complete
                          </label>
                        </div>

                        {/* 2. Background Verification */}
                        <div style={{ background: '#FFFFFF', border: '1px solid rgba(19, 23, 32, 0.15)', borderRadius: '8px', padding: '20px 24px' }}>
                          <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1E3143', margin: '0 0 10px 0' }}>Background Verification</h4>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#7b8793', margin: '0 0 16px 0' }}>
                            I authorize the Company to conduct a comprehensive background verification, including but not limited to antecedent verification, address verification, driving record checks, birth record verification, and other relevant checks as required.
                          </p>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F4E7A', fontWeight: 500, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={reviewDeclarations.background}
                              onChange={(e) => setReviewDeclarations({ ...reviewDeclarations, background: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1F4E7A' }}
                            />
                            I consent to comprehensive background verification
                          </label>
                        </div>

                        {/* 3. Identity Authentication */}
                        <div style={{ background: '#FFFFFF', border: '1px solid rgba(19, 23, 32, 0.15)', borderRadius: '8px', padding: '20px 24px' }}>
                          <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1E3143', margin: '0 0 10px 0' }}>Identity Authentication</h4>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '20px', color: '#7b8793', margin: '0 0 16px 0' }}>
                            I hereby consent to the Company collecting and using my Aadhaar / Other ID details, including name and biometric information (fingerprint/iris), for authentication with UIDAI solely for background verification purposes. I understand that my biometric data will not be stored or shared and will only be submitted to CIDR for authentication.
                          </p>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F4E7A', fontWeight: 500, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={reviewDeclarations.identity}
                              onChange={(e) => setReviewDeclarations({ ...reviewDeclarations, identity: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1F4E7A' }}
                            />
                            I consent to Aadhaar authentication for verification
                          </label>
                        </div>

                        {/* 4. Employment Terms */}
                        <div style={{ background: '#FFFFFF', border: '1px solid rgba(19, 23, 32, 0.15)', borderRadius: '8px', padding: '20px 24px' }}>
                          <h4 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1E3143', margin: '0 0 10px 0' }}>Employment Terms</h4>
                          <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '18px', color: '#7b8793', margin: '0 0 16px 0', paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px' }}>I confirm that I have joined Urest, a division of Urest Technologies Pvt. Ltd., as a contract employee of my own free will.</li>
                            <li style={{ marginBottom: '8px' }}>I understand that I will undergo training as part of my engagement and that no remuneration shall be payable during the training period.</li>
                            <li style={{ marginBottom: '8px' }}>I agree to perform my duties at any location assigned by the Company, and I understand that the Company may transfer me to any location as required. I acknowledge that my employment is on a contractual basis and that I will be paid as per my eligibility and the Company's policies and regulations.</li>
                            <li style={{ marginBottom: '8px' }}>I agree to comply with the Company's dress code and workplace policies, including carrying and displaying my company badge, uniform, and identity card during working hours. Any penalties imposed due to sleeping on duty, improper dress code, or policy violations may be deducted from my salary as per Company and client regulations.</li>
                            <li style={{ marginBottom: '8px' }}>I understand that Provident Fund (PF) benefits, if applicable, shall be processed through the relevant PF authorities after separation from employment, and the Company shall not be responsible for any claims or processing thereafter.</li>
                            <li style={{ marginBottom: '8px' }}>I understand that misconduct, misbehavior, or violation of Company policies during my employment may result in disciplinary action, including termination of my services.</li>
                            <li style={{ marginBottom: '8px' }}>I agree to provide at least one month's prior notice before resigning from my services and to continue working during the notice period. In case of failure to provide prior notice, the Company may deduct up to 7 days' salary as per Company policy, and I agree to the same.</li>
                            <li style={{ marginBottom: '8px' }}>I confirm that I have read and understood all the rules, regulations, and policies of Urest, a division of Urest Technologies Pvt. Ltd., and that I accept them voluntarily without any pressure or coercion.</li>
                          </ul>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#1F4E7A', fontWeight: 500, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={reviewDeclarations.terms}
                              onChange={(e) => setReviewDeclarations({ ...reviewDeclarations, terms: e.target.checked })}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1F4E7A' }}
                            />
                            I have read, understood, and agree to the afore-mentioned terms
                          </label>
                        </div>

                      </div>

                      <div className="onboarding-pane-footer">
                        <button
                          type="button"
                          className="onboarding-footer-btn-continue"
                          onClick={() => {
                            if (!reviewDeclarations.general || !reviewDeclarations.background || !reviewDeclarations.identity || !reviewDeclarations.terms) {
                              toast.current.show({
                                severity: "warn",
                                summary: "Validation",
                                detail: "Please accept all declarations to submit.",
                              });
                              return;
                            }
                            saveEmployee(5, true);
                          }}
                          style={{
                            opacity: (reviewDeclarations.general && reviewDeclarations.background && reviewDeclarations.identity && reviewDeclarations.terms) ? 1 : 0.6,
                            cursor: (reviewDeclarations.general && reviewDeclarations.background && reviewDeclarations.identity && reviewDeclarations.terms) ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {formData?.IsRejected ? "Resubmit" : "Save All Details"} <i className="fa fa-check-circle" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog>
          {/* Reject Dialog */}
          <Dialog
            header="Reject Employee"
            visible={rejectDialog}
            style={{ width: "450px" }}
            modal
            onHide={() => setRejectDialog(false)}
            footer={
              <div className="d-flex justify-content-end gap-2">
                <Button
                  label="Cancel"
                  className="p-button-text"
                  onClick={() => setRejectDialog(false)}
                />

                <Button
                  label="Submit"
                  icon="pi pi-check"
                  className="p-button-danger"
                  onClick={rejectEmployee}
                />
              </div>
            }
          >
            <div className="p-fluid">
              <label>Rejection Reason</label>

              <InputText
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason"
              />
            </div>
          </Dialog>

          {/* View Employee Dialog */}
          <Dialog
            header={
              selectedEmployeeView ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1e3143' }}>Applicant details</span>
                  {(() => {
                    const { label, className } = getStatusMeta(selectedEmployeeView);
                    return <span className={className} style={{ fontSize: '13px', padding: '3px 12px', borderRadius: '20px' }}>{label}</span>;
                  })()}
                </div>
              ) : 'Applicant details'
            }
            visible={viewDialog}
            style={{ width: '1024px', borderRadius: '12px' }}
            modal
            onHide={() => { setViewDialog(false); setViewActiveTab(0); }}
            className="onboarding-view-dialog"
            headerStyle={{ background: '#FAFAFA', borderBottom: '1px solid rgba(19,23,32,0.1)', padding: '18px 24px' }}
            contentStyle={{ padding: 0, background: '#FAFAFA', overflowY: 'auto', maxHeight: '75vh' }}
            icons={
              selectedEmployeeView ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                  <button type="button" className="onboarding-action-btn" title="Edit" onClick={() => { setViewDialog(false); editEmployee(selectedEmployeeView); }}>
                    <i className="pi pi-pencil" style={{ fontSize: '16px' }} />
                  </button>
                  <button type="button" className="onboarding-action-btn onboarding-action-btn-danger" title="Delete" onClick={() => { setViewDialog(false); confirmDelete(selectedEmployeeView); }}>
                    <i className="pi pi-trash" style={{ fontSize: '16px' }} />
                  </button>
                </div>
              ) : null
            }
          >
            {selectedEmployeeView && (
              <div>
                {/* Tab bar */}
                <div style={{ display: 'flex', background: '#FAFAFA', padding: '0', gap: '8px' }}>
                  {['Information', 'Documents'].map((tab, i) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setViewActiveTab(i)}
                      style={{
                        flex: 1,
                        height: '40px',
                        padding: '8px',
                        border: viewActiveTab === i ? '1px solid #1F4E7A' : '1px solid #A3B8C2',
                        background: viewActiveTab === i ? '#1F4E7A' : '#EDF0F3',
                        color: viewActiveTab === i ? '#ffffff' : '#1E3143',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '15px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Information Tab */}
                {viewActiveTab === 0 && (
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FAFAFA' }}>

                    {/* 1. Personal Details */}
                    <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>1.&nbsp;&nbsp;Personal Details</div>
                      {[
                        ['Full name', selectedEmployeeView.Name],
                        ['Father\'s Name', selectedEmployeeView.FatherName],
                        ['Mother\'s Name', selectedEmployeeView.MotherName],
                        ['Spouse name', selectedEmployeeView.SpouseName],
                        ['Date of Birth', selectedEmployeeView.DateOfBirth ? selectedEmployeeView.DateOfBirth.split('T')[0] : '-'],
                        ['Mobile no.', selectedEmployeeView.MobileNumber],
                        ['Other Number', selectedEmployeeView.OtherNumber],
                        ['Email', selectedEmployeeView.Email],
                        ['Gender', selectedEmployeeView.Gender],
                        ['Marital Status', selectedEmployeeView.MaritalStatus],
                        ['Employment Type', selectedEmployeeView.EmploymentType],
                        ['Permanent Address', [selectedEmployeeView.AddressLine1, selectedEmployeeView.AddressLine2, selectedEmployeeView.City, selectedEmployeeView.State].filter(Boolean).join(', ')],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '160px' }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#1e3143', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                        </div>
                      ) : null)}
                    </div>

                    {/* 2. Employment Information */}
                    <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>2.&nbsp;&nbsp;Employment Information</div>
                      {[
                        ['Designation', selectedEmployeeView.Designation],
                        ['Department', selectedEmployeeView.Department],
                        ['Date of Joining', selectedEmployeeView.DateOfJoining ? selectedEmployeeView.DateOfJoining.split('T')[0] : '-'],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '160px' }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#1e3143', textAlign: 'right' }}>{value}</span>
                        </div>
                      ) : null)}
                    </div>

                    {/* 3. Past Employment Details */}
                    <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>3.&nbsp;&nbsp;Past Employment Details</div>
                      {[
                        ['Previous Occupation', selectedEmployeeView.PreviousOccupation],

                        ['Previous Company', selectedEmployeeView.PreviousCompany],

                        [
                          'Total service experience',
                          (selectedEmployeeView.ExperienceYears ||
                            selectedEmployeeView.ExperienceMonths)
                            ? `${selectedEmployeeView.ExperienceYears || 0} Years ${selectedEmployeeView.ExperienceMonths || 0
                            } Months`
                            : ''
                        ],

                        [
                          'Computer Knowledge',
                          selectedEmployeeView.ComputerKnowledge === true
                            ? 'Yes'
                            : selectedEmployeeView.ComputerKnowledge === false
                              ? 'No'
                              : ''
                        ],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '160px' }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#1e3143', textAlign: 'right' }}>{value}</span>
                        </div>
                      ) : null)}
                    </div>

                    {/* 4. Medical Details */}
                    <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>4.&nbsp;&nbsp;Medical Details</div>
                      {[
                        ['Height', (selectedEmployeeView.HeightFeet || selectedEmployeeView.HeightInches) ? `${selectedEmployeeView.HeightFeet || 0} Ft ${selectedEmployeeView.HeightInches || 0} In` : ''],
                        ['Weight', selectedEmployeeView.Weight ? `${selectedEmployeeView.Weight} kg` : ''],
                        ['Blood Group', selectedEmployeeView.BloodGroup],
                        ['Identification Marks', selectedEmployeeView.IdentificationMarks],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '160px' }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#1e3143', textAlign: 'right' }}>{value}</span>
                        </div>
                      ) : null)}
                    </div>

                    {/* 5. Banks & Financials */}
                    <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>5.&nbsp;&nbsp;Banks &amp; Financials</div>
                      {[
                        ['Aadhar Card', selectedEmployeeView.AadharCard],
                        ['PAN Card', selectedEmployeeView.PanCard],
                        ['Bank Name', selectedEmployeeView.BankName],
                        ['Account Number', selectedEmployeeView.BankAccountNumber],
                        ['IFSC Code', selectedEmployeeView.BankIFSCCode],
                        ['UAN Number', selectedEmployeeView.UANNumber],
                        ['PF Number', selectedEmployeeView.PF_Number || selectedEmployeeView.PFNumber],
                        ['ESI Number', selectedEmployeeView.ESINumber],
                      ].map(([label, value]) => value ? (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '160px' }}>{label}</span>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#1e3143', textAlign: 'right' }}>{value}</span>
                        </div>
                      ) : null)}
                    </div>

                    {/* 5. Review & Declarations */}
                    {/* <div style={{ background: '#FAFAFA', border: '1px solid rgba(19,23,32,0.1)', borderRadius: '10px', padding: '20px 24px' }}>
                      <div style={{ color: '#1484bc', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>5.&nbsp;&nbsp;Review &amp; Declarations</div>
                      {[
                        ['General Declaration', selectedEmployeeView.GeneralDeclaration ? 'Accepted' : 'Pending'],
                        ['Background Verification', selectedEmployeeView.BackgroundVerification ? 'Accepted' : 'Pending'],
                        ['Identity Authentication', selectedEmployeeView.IdentityAuthentication ? 'Accepted' : 'Pending'],
                        ['Employment Terms', selectedEmployeeView.EmploymentTerms ? 'Accepted' : 'Pending'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(19,23,32,0.05)' }}>
                          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#4b5563', minWidth: '200px' }}>{label}</span>
                          <span style={{
                            fontFamily: 'Inter,sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: value === 'Accepted' ? '#078837' : '#eb4b4b',
                            textAlign: 'right'
                          }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div> */}

                    {selectedEmployeeView.RejectionReason && (
                      <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '10px', padding: '16px 24px' }}>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#c53030', fontWeight: 600 }}>Rejection Reason:&nbsp;</span>
                        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '14px', color: '#742a2a' }}>{selectedEmployeeView.RejectionReason}</span>
                      </div>
                    )}

                  </div>
                )}

                {/* Documents Tab */}
                {viewActiveTab === 1 && (
                  <div style={{ background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
                    {(selectedEmployeeView.Documents || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#7b8793', fontFamily: 'Inter,sans-serif', fontSize: '14px' }}>No documents uploaded.</div>
                    ) : (
                      <div style={{ background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
                        {Object.entries(
                          (selectedEmployeeView.Documents || []).reduce((acc, doc) => {
                            if (!acc[doc.DocumentType]) acc[doc.DocumentType] = [];
                            acc[doc.DocumentType].push(doc);
                            return acc;
                          }, {})
                        ).map(([docType, docs], idx, arr) => (
                          docs.map((doc, di) => {
                            return (
                              <div
                                key={`${idx}-${di}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '20px 24px',
                                  borderBottom: '1px solid rgba(19, 23, 32, 0.15)',
                                  background: '#FAFAFA',
                                }}
                              >
                                <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '20px', letterSpacing: '-0.15px', color: '#1F4E7A' }}>
                                  {docType}{docs.length > 1 ? ` (${di + 1})` : ''}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                  <a
                                    href={doc.FileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontFamily: 'Inter, sans-serif',
                                      fontWeight: 500,
                                      fontSize: '14px',
                                      lineHeight: '17px',
                                      color: '#1F4E7A',
                                      textDecoration: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View
                                  </a>
                                  <a
                                    href={doc.FileUrl}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      fetch(doc.FileUrl)
                                        .then(res => res.blob())
                                        .then(blob => {
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = doc.FileName || doc.DocumentType || 'document';
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          window.URL.revokeObjectURL(url);
                                        })
                                        .catch(() => window.open(doc.FileUrl, '_blank'));
                                    }}
                                    style={{
                                      fontFamily: 'Inter, sans-serif',
                                      fontWeight: 500,
                                      fontSize: '14px',
                                      lineHeight: '17px',
                                      color: '#1F4E7A',
                                      textDecoration: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </Dialog>


          {/* Application Submitted Success Popup */}
          {showSuccessPopup && (
            <div className="onboarding-success-overlay">
              <div className="onboarding-success-card">
                <div className="onboarding-success-icon-wrap">
                  <i className="pi pi-check" />
                </div>
                <p className="onboarding-success-title">Application Submitted</p>
                <p className="onboarding-success-desc">
                  Your onboarding application has been received.<br />
                  Our team will review and contact you within 2-3 business days.
                </p>
              </div>
            </div>
          )}

        </div>

      </PrimeReactProvider>
    </>
  );
};

export default EmployeeOnboarding;
