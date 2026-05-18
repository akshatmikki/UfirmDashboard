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
import { PrimeReactProvider } from "primereact/api";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useSelector } from "react-redux";
import {
  saveOnboardingTemp,
  getOnboardingTemp,
  updateOnboardingTemp,
  approveEmployeeTemp,
  rejectEmployeeTemp,
  deleteOnboardingTemp
} from "../Services/EmployeeOnboardingService";
import { getapitoken } from "../Common/AppCommon";


const EmployeeOnboarding = () => {
  const toast = useRef(null);
  const puidn = useSelector((state) => state.Commonreducer.puidn);
  const userData = useSelector(
    (state) => state.Commonreducer.userData
  );

  const [employees, setEmployees] = useState([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [documents, setDocuments] = useState([]);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRejectEmployee, setSelectedRejectEmployee] = useState(null);

  const [viewDialog, setViewDialog] = useState(false);
  const [selectedEmployeeView, setSelectedEmployeeView] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxEnabledTab, setMaxEnabledTab] = useState(0);

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
    ESINumber: ""
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
      ESINumber: ""
    });

    setIsEditMode(false);
    setActiveIndex(0);
    setMaxEnabledTab(0);
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
    setMaxEnabledTab(3); // All tabs enabled in edit mode
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

      if (stepIndex === 2) {
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
      };

      let response;

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
          setFormData(prev => ({ ...prev, TempId: newId }));
          setIsEditMode(true); // 🔥 Switch to edit mode to ensure subsequent saves use PUT
        }

        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: response?.Message || "Employee saved successfully",
        });
      }

      fetchEmployees();

      if (isFinal) {
        setDialogVisible(false);
        resetForm();
        setDocuments([]);
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

  const header = (
    <div className="d-flex justify-content-between align-items-center p-2 flex-wrap gap-2">
      <h5 className="m-0">Employee Onboarding Dashboard</h5>
      <div className="d-flex align-items-center gap-2">
        <InputText value={globalFilterValue} onChange={(e) => setGlobalFilterValue(e.target.value)} placeholder="Search..." />
        <Button label="Add New Employee" icon="pi pi-plus" onClick={openNew} className="p-button-success" />
      </div>
    </div>
  );

  const actionButtonStyles = `
.action-buttons-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  width: 42px !important;
  height: 42px !important;
  border-radius: 12px !important;
  border: none !important;

  display: flex !important;
  align-items: center;
  justify-content: center;

  transition: all 0.25s ease-in-out !important;

  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}

.action-btn .pi {
  font-size: 1rem !important;
  color: #fff !important;
}

.action-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 18px rgba(0,0,0,0.2);
}

.approve-action {
  background: linear-gradient(135deg, #22c55e, #16a34a) !important;
}

.reject-action {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
}

.edit-action {
  background: linear-gradient(135deg, #0ea5e9, #0284c7) !important;
}

.delete-action {
  background: linear-gradient(135deg, #f43f5e, #e11d48) !important;
}

.view-action {
  background: linear-gradient(135deg, #64748b, #475569) !important;
}

.action-btn:focus {
  box-shadow: none !important;
}
`;

  return (

    <>
      <style>{actionButtonStyles}</style>
      <PrimeReactProvider>

        <div className="content-wrapper">
          <section className="content mt-3">
            <div className="container-fluid">
              <Toast ref={toast} />
              <ConfirmDialog />

              <div className="card shadow-sm border-0">
                <div className="p-3">
                  <DataTable
                    value={employees}
                    dataKey="TempId"
                    header={header}
                    paginator rows={10}
                    globalFilter={globalFilterValue}
                    responsiveLayout="scroll"
                    className="p-datatable-sm"
                    emptyMessage="No employees found."
                  >
                    <Column field="Name" header="Name" sortable style={{ minWidth: '150px' }} />
                    <Column field="Designation" header="Designation" sortable style={{ minWidth: '150px' }} />
                    <Column field="Department" header="Department" sortable style={{ minWidth: '120px' }} />
                    <Column field="Gender" header="Gender" style={{ minWidth: '100px' }} />
                    <Column field="MobileNumber" header="Contact" style={{ minWidth: '120px' }} />
                    <Column field="Email" header="Email" style={{ minWidth: '180px' }} />
                    <Column field="DateOfBirth" header="DOB" body={(rowData) => rowData.DateOfBirth ? rowData.DateOfBirth.split("T")[0] : "-"} style={{ minWidth: '120px' }} />
                    <Column field="FatherName" header="Father's Name" style={{ minWidth: '150px' }} />
                    <Column field="AadharCard" header="Aadhar" style={{ minWidth: '150px' }} />
                    <Column field="PanCard" header="PAN" style={{ minWidth: '120px' }} />
                    <Column field="City" header="City" style={{ minWidth: '120px' }} />
                    <Column field="State" header="State" style={{ minWidth: '120px' }} />
                    <Column field="AddressLine1" header="Address" style={{ minWidth: '120px' }} />
                    <Column field="BankName" header="Bank Name" style={{ minWidth: '120px' }} />
                    <Column field="BankAccountNumber" header="Bank Account Number" style={{ minWidth: '120px' }} />
                    <Column field="BankIFSCCode" header="Bank IFSC Code" style={{ minWidth: '120px' }} />
                    <Column field="PFNumber" header="PF Number" style={{ minWidth: '120px' }} />
                    <Column field="ESINumber" header="ESI Number" style={{ minWidth: '120px' }} />
                    <Column field="DateOfJoining" header="Date of Joining" body={(rowData) => rowData.DateOfJoining ? rowData.DateOfJoining.split("T")[0] : "-"} style={{ minWidth: '150px' }} />
                    <Column
                      header="Status"
                      body={(rowData) => {

                        const isApproved =
                          rowData.IsApproved === true ||
                          rowData.IsApproved === 1 ||
                          rowData.IsApproved === "1";

                        const isRejected =
                          rowData.IsRejected === true ||
                          rowData.IsRejected === 1 ||
                          rowData.IsRejected === "1";

                        if (isApproved) {
                          return (
                            <span className="badge bg-success">
                              Approved
                            </span>
                          );
                        }

                        if (isRejected) {
                          return (
                            <span className="badge bg-danger">
                              Rejected
                            </span>
                          );
                        }

                        return (
                          <span className="badge bg-warning text-dark">
                            Pending
                          </span>
                        );
                      }}
                      style={{ minWidth: "120px" }}
                    />
                    <Column
                      header="Actions"
                      body={(rowData) => {

                        const isApproved =
                          rowData.IsApproved === true ||
                          rowData.IsApproved === 1 ||
                          rowData.IsApproved === "1";

                        const isRejected =
                          rowData.IsRejected === true ||
                          rowData.IsRejected === 1 ||
                          rowData.IsRejected === "1";

                        return (
                          <div className="d-flex gap-2">
                            {userRole === "HR" ? (
                              <>
                                {!isApproved && !isRejected && (
                                  <Button
                                    icon="pi pi-check"
                                    className="action-btn approve-action"
                                    tooltip="Approve"
                                    onClick={() => approveEmployee(rowData)}
                                  />
                                )}

                                {!isApproved && !isRejected && (
                                  <Button
                                    icon="pi pi-times"
                                    className="action-btn reject-action"
                                    tooltip="Reject"
                                    onClick={() => {
                                      setSelectedRejectEmployee(rowData);
                                      setRejectDialog(true);
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  icon="pi pi-pencil"
                                  className="action-btn edit-action"
                                  tooltip="Edit"
                                  onClick={() => editEmployee(rowData)}
                                />

                                <Button
                                  icon="pi pi-trash"
                                  className="action-btn delete-action"
                                  tooltip="Delete"
                                  onClick={() => confirmDelete(rowData)}
                                />
                              </>
                            )}

                            <Button
                              icon="pi pi-eye"
                              className="action-btn view-action"
                              tooltip="View Details"
                              onClick={() => {
                                setSelectedEmployeeView(rowData);
                                setViewDialog(true);
                              }}
                            />

                          </div>
                        );
                      }}
                      style={{ minWidth: "220px" }}
                    />
                  </DataTable>
                </div>
              </div>
            </div>
          </section>

          {/* Form Dialog */}
          <Dialog
            header={isEditMode ? "Edit Employee Details" : "New Employee Onboarding"}
            visible={dialogVisible}
            style={{ width: "90vw", maxWidth: "1000px" }}
            modal
            onHide={() => setDialogVisible(false)}
            footer={
              <div className="d-flex justify-content-end gap-2">
                <Button label="Cancel" className="p-button-text" onClick={() => setDialogVisible(false)} />
              </div>
            }
          >
            <TabView activeIndex={activeIndex} onTabChange={(e) => {
              // Allow going back or moving to a tab that is within maxEnabledTab
              if (e.index > maxEnabledTab && !isEditMode) {
                toast.current.show({
                  severity: 'warn',
                  summary: 'Save Required',
                  detail: 'Please save current section before moving to next.'
                });
                return;
              }
              setActiveIndex(e.index);
            }}>
              <TabPanel header="Personal Info">
                <div className="p-fluid grid mt-2">
                  <div className="col-12 md:col-4 mb-3">
                    <label>Full Name *</label>
                    <InputText value={formData.Name} onChange={(e) => setFormData({ ...formData, Name: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Gender *</label>
                    <Dropdown value={formData.Gender} options={genders} onChange={(e) => setFormData({ ...formData, Gender: e.value })} placeholder="Select" />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Designation *</label>
                    <Dropdown value={formData.Designation} options={designations} onChange={(e) => setFormData({ ...formData, Designation: e.value })} placeholder="Select Designation" filter />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Department</label>
                    <Dropdown value={formData.Department} options={departments} onChange={(e) => setFormData({ ...formData, Department: e.value })} placeholder="Select Department" filter />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Employment Type</label>
                    <Dropdown value={formData.EmploymentType} options={employmentTypes} onChange={(e) => setFormData({ ...formData, EmploymentType: e.value })} placeholder="Select" />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Mobile Number</label>
                    <InputText value={formData.MobileNumber} onChange={(e) => setFormData({ ...formData, MobileNumber: e.target.value })} maxLength={10} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Other Number</label>
                    <InputText value={formData.OtherNumber} onChange={(e) => setFormData({ ...formData, OtherNumber: e.target.value })} maxLength={10} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Email Address</label>
                    <InputText value={formData.Email} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} type="email" />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Date of Birth</label>
                    <Calendar
                      value={formData.DateOfBirth ? new Date(formData.DateOfBirth) : null}
                      onChange={(e) => setFormData({ ...formData, DateOfBirth: e.value ? e.value.toLocaleDateString('en-CA') : "" })}
                      showIcon
                      dateFormat="yy-mm-dd"
                    />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Date of Joining *</label>
                    <Calendar
                      value={formData.DateOfJoining ? new Date(formData.DateOfJoining) : null}
                      onChange={(e) => setFormData({ ...formData, DateOfJoining: e.value ? e.value.toLocaleDateString('en-CA') : "" })}
                      showIcon
                      dateFormat="yy-mm-dd"
                    />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Father's Name</label>
                    <InputText value={formData.FatherName} onChange={(e) => setFormData({ ...formData, FatherName: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Mother's Name</label>
                    <InputText value={formData.MotherName} onChange={(e) => setFormData({ ...formData, MotherName: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Spouse's Name</label>
                    <InputText value={formData.SpouseName} onChange={(e) => setFormData({ ...formData, SpouseName: e.target.value })} />
                  </div>
                  <div className="col-12 d-flex justify-content-end mt-2">
                    <Button label="Save Personal Info" icon="pi pi-save" className="p-button-primary" onClick={() => saveEmployee(0)} />
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Personal Address">
                <div className="p-fluid grid mt-2">
                  <div className="col-12 md:col-6 mb-3">
                    <label>Address Line 1</label>
                    <InputText
                      value={formData.AddressLine1}
                      onChange={(e) => setFormData({ ...formData, AddressLine1: e.target.value })}
                    />
                  </div>

                  <div className="col-12 md:col-6 mb-3">
                    <label>Address Line 2</label>
                    <InputText
                      value={formData.AddressLine2}
                      onChange={(e) => setFormData({ ...formData, AddressLine2: e.target.value })}
                    />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>City</label>
                    <InputText value={formData.City} onChange={(e) => setFormData({ ...formData, City: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>State</label>
                    <Dropdown value={formData.State} options={indianStates} onChange={(e) => setFormData({ ...formData, State: e.value })} placeholder="Select State" filter />
                  </div>
                  <div className="col-12 d-flex justify-content-end mt-2">
                    <Button label="Save Address" icon="pi pi-save" className="p-button-primary" onClick={() => saveEmployee(1)} />
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Bank & Financials">
                <div className="p-fluid grid mt-2">
                  <div className="col-12 md:col-4 mb-3">
                    <label>Aadhar Card Number *</label>
                    <InputText
                      value={formData.AadharCard}
                      onChange={(e) => setFormData({ ...formData, AadharCard: e.target.value })}
                      maxLength={12}
                    />
                  </div>

                  <div className="col-12 md:col-4 mb-3">
                    <label>PAN Card Number *</label>
                    <InputText
                      value={formData.PanCard}
                      onChange={(e) => setFormData({ ...formData, PanCard: e.target.value.toUpperCase() })}
                      maxLength={10}
                    />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Bank Account Number *</label>
                    <InputText value={formData.BankAccountNumber} onChange={(e) => setFormData({ ...formData, BankAccountNumber: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>IFSC Code *</label>
                    <InputText value={formData.BankIFSCCode} onChange={(e) => setFormData({ ...formData, BankIFSCCode: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>Bank Name</label>
                    <Dropdown value={formData.BankName} options={indianBanks} onChange={(e) => setFormData({ ...formData, BankName: e.value })} editable placeholder="Select/Type Bank" />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>UAN Number *</label>
                    <InputText
                      value={formData.UANNumber}
                      onChange={(e) => setFormData({ ...formData, UANNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>PF Number</label>
                    <InputText value={formData.PF_Number} onChange={(e) => setFormData({ ...formData, PF_Number: e.target.value })} />
                  </div>
                  <div className="col-12 md:col-4 mb-3">
                    <label>ESI Number</label>
                    <InputText value={formData.ESINumber} onChange={(e) => setFormData({ ...formData, ESINumber: e.target.value })} />
                  </div>
                  <div className="col-12 d-flex justify-content-end mt-2">
                    <Button label="Save Financials" icon="pi pi-save" className="p-button-primary" onClick={() => saveEmployee(2)} />
                  </div>
                </div>
              </TabPanel>

              <TabPanel header="Documents">
                <div className="p-fluid grid mt-2">

                  {[
                    {
                      label: "Profile Photo",
                      type: "Profile",
                      accept: "image/*",
                      multiple: false,
                    },
                    {
                      label: "Resume",
                      type: "Resume",
                      accept: ".pdf,.doc,.docx",
                      multiple: false,
                    },
                    {
                      label: "Aadhar Document",
                      type: "Aadhar",
                      accept: "*",
                      multiple: true,
                    },
                    {
                      label: "PAN Document",
                      type: "PAN",
                      accept: "*",
                      multiple: false,
                    },
                    {
                      label: "Bank Passbook",
                      type: "Bank Passbook",
                      accept: "*",
                      multiple: false,
                    },
                  ].map((item, index) => {

                    const existingDocs = documents.filter(
                      (d) => d.type === item.type
                    );

                    return (
                      <div
                        key={index}
                        className="col-12 mb-4"
                      >
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "16px",
                            background: "#fafafa",
                          }}
                        >

                          {/* HEADER */}
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

                            <div>
                              <label
                                style={{
                                  fontWeight: 600,
                                  fontSize: "15px",
                                  marginBottom: "4px",
                                  display: "block",
                                }}
                              >
                                {item.label}
                              </label>

                              <small style={{ color: "#6b7280" }}>
                                {item.multiple
                                  ? "Multiple files allowed"
                                  : "Single file upload"}
                              </small>
                            </div>

                            <label
                              style={{
                                background: "#0d6efd",
                                color: "#fff",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 500,
                                marginBottom: 0,
                              }}
                            >
                              <i className="pi pi-upload me-2"></i>
                              Upload

                              <input
                                type="file"
                                accept={item.accept}
                                multiple={item.multiple}
                                hidden
                                onChange={(e) => {

                                  const files = Array.from(e.target.files || []);

                                  if (!files.length) return;

                                  // SINGLE FILE TYPES -> replace old file
                                  if (!item.multiple) {

                                    setDocuments((prev) => {

                                      const filtered = prev.filter(
                                        (d) => d.type !== item.type
                                      );

                                      return [
                                        ...filtered,
                                        ...files.map((file) => ({
                                          type: item.type,
                                          file,
                                        })),
                                      ];
                                    });
                                  }

                                  // MULTIPLE FILE TYPES -> append
                                  else {

                                    setDocuments((prev) => [
                                      ...prev,
                                      ...files.map((file) => ({
                                        type: item.type,
                                        file,
                                      })),
                                    ]);
                                  }

                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>

                          {/* FILE LIST */}
                          {existingDocs.length > 0 && (
                            <div className="mt-3 d-flex flex-column gap-2">

                              {existingDocs.map((doc, docIndex) => (

                                <div
                                  key={docIndex}
                                  className="d-flex justify-content-between align-items-center"
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    padding: "10px 14px",
                                  }}
                                >

                                  <div
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "80%",
                                    }}
                                  >
                                    <i className="pi pi-file me-2 text-primary"></i>

                                    {doc.file?.name || doc.fileName}
                                  </div>

                                  <Button
                                    icon="pi pi-times"
                                    className="p-button-rounded p-button-text p-button-danger"
                                    onClick={() => {

                                      setDocuments((prev) =>
                                        prev.filter((_, i) => i !== documents.indexOf(doc))
                                      );
                                    }}
                                  />

                                </div>

                              ))}

                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}

                  {/* SAVE BUTTON */}
                  <div className="col-12 d-flex justify-content-end mt-3">
                    <Button
                      label={
                        formData?.IsRejected
                          ? "Resubmit"
                          : "Save All Details"
                      }
                      icon="pi pi-check-circle"
                      className="p-button-success"
                      onClick={() => saveEmployee(3, true)}
                    />
                  </div>

                </div>
              </TabPanel>

            </TabView>
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

          {/* Reason View Dialog */}
          {/* View Employee Dialog */}
          <Dialog
            header="Employee Details"
            visible={viewDialog}
            style={{ width: "900px" }}
            modal
            maximizable
            onHide={() => setViewDialog(false)}
          >

            {selectedEmployeeView && (

              <div className="grid p-fluid">

                <div className="col-12 md:col-6">
                  <b>Name:</b> {selectedEmployeeView.Name}
                </div>

                <div className="col-12 md:col-6">
                  <b>Gender:</b> {selectedEmployeeView.Gender}
                </div>

                <div className="col-12 md:col-6">
                  <b>Mobile:</b> {selectedEmployeeView.MobileNumber}
                </div>

                <div className="col-12 md:col-6">
                  <b>Email:</b> {selectedEmployeeView.Email}
                </div>

                <div className="col-12 md:col-6">
                  <b>Designation:</b> {selectedEmployeeView.Designation}
                </div>

                <div className="col-12 md:col-6">
                  <b>Department:</b> {selectedEmployeeView.Department}
                </div>

                <div className="col-12 md:col-6">
                  <b>PAN:</b> {selectedEmployeeView.PanCard}
                </div>

                <div className="col-12 md:col-6">
                  <b>Aadhar:</b> {selectedEmployeeView.AadharCard}
                </div>

                <div className="col-12 md:col-6">
                  <b>Bank:</b> {selectedEmployeeView.BankName}
                </div>

                <div className="col-12 md:col-6">
                  <b>IFSC:</b> {selectedEmployeeView.BankIFSCCode}
                </div>

                <div className="col-12 md:col-6">
                  <b>Account Number:</b> {selectedEmployeeView.BankAccountNumber}
                </div>

                <div className="col-12 md:col-6">
                  <b>UAN:</b> {selectedEmployeeView.UANNumber}
                </div>

                <div className="col-12 md:col-6">
                  <b>PF Number:</b> {selectedEmployeeView.PFNumber || "-"}
                </div>

                <div className="col-12 md:col-6">
                  <b>ESI Number:</b> {selectedEmployeeView.ESINumber}
                </div>

                <div className="col-12 md:col-6">
                  <b>Date Of Joining:</b>{" "}
                  {selectedEmployeeView.DateOfJoining
                    ? selectedEmployeeView.DateOfJoining.split("T")[0]
                    : "-"}
                </div>

                <div className="col-12 md:col-6">
                  <b>Status:</b>{" "}

                  {selectedEmployeeView.IsApproved ? (
                    <span className="badge bg-success">
                      Approved
                    </span>
                  ) : selectedEmployeeView.IsRejected ? (
                    <span className="badge bg-danger">
                      Rejected
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark">
                      Pending
                    </span>
                  )}
                </div>

                {selectedEmployeeView.RejectionReason && (
                  <div className="col-12">
                    <b>Rejection Reason:</b>{" "}
                    {selectedEmployeeView.RejectionReason}
                  </div>
                )}

                {/* DOCUMENTS */}

                {/* DOCUMENTS */}

                <div className="col-12 mt-3">
                  <h5>Documents</h5>

                  <div className="d-flex flex-column gap-3">

                    {Object.entries(

                      (selectedEmployeeView.Documents || []).reduce((acc, doc) => {

                        if (!acc[doc.DocumentType]) {
                          acc[doc.DocumentType] = [];
                        }

                        acc[doc.DocumentType].push(doc);

                        return acc;

                      }, {})

                    ).map(([docType, docs], idx) => (

                      <div
                        key={idx}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "14px",
                          background: "#fafafa"
                        }}
                      >

                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: "10px",
                            fontSize: "15px"
                          }}
                        >
                          {docType}
                        </div>

                        <div className="d-flex flex-column gap-2">

                          {docs.map((doc, i) => (

                            <div
                              key={i}
                              className="d-flex justify-content-between align-items-center"
                              style={{
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "10px 12px"
                              }}
                            >

                              <div
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "75%"
                                }}
                              >
                                {doc.FileName}
                              </div>

                              <div className="d-flex gap-3">
                                <a
                                  href={doc.FileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#0d6efd",
                                    textDecoration: "none",
                                    fontWeight: 500
                                  }}
                                >
                                  View
                                </a>
                                <a
                                  href={doc.FileUrl}
                                  download={doc.FileName || "document"}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#16a34a",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                    cursor: "pointer"
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    fetch(doc.FileUrl)
                                      .then(res => res.blob())
                                      .then(blob => {
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = url;
                                        a.download = doc.FileName || "document";
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                      })
                                      .catch(() => {
                                        window.open(doc.FileUrl, '_blank');
                                      });
                                  }}
                                >
                                  Download
                                </a>
                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    ))}

                  </div>
                </div>

              </div>

            )}

          </Dialog>

        </div>

      </PrimeReactProvider>
    </>
  );
};

export default EmployeeOnboarding;
