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
} from "../Services/EmployeeOnboardingService";


const EmployeeOnboarding = () => {
  const toast = useRef(null);
  const puidn = useSelector((state) => state.Commonreducer.puidn);

  const [employees, setEmployees] = useState([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [documents, setDocuments] = useState([]);

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
  };

  const openNew = () => {
    resetForm();
    setDocuments([]);
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
    setDialogVisible(true);
  };

  const fetchEmployees = async () => {
    try {
      const response = await getOnboardingTemp(puidn || 0);

      if (response?.Data) {
        // Filter data strictly by selected puidn
        const filtered = response.Data.filter(
          (emp) => Number(emp.PropertyId) === (Number(puidn) || 0)
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

  const saveEmployee = async () => {
    try {
      if (
        !formData.Name ||
        !formData.Designation ||
        !formData.Gender ||
        !formData.AadharCard ||
        !formData.PanCard ||
        !formData.DateOfJoining ||
        !formData.BankAccountNumber ||
        !formData.BankIFSCCode ||
        !formData.UANNumber
      ) {
        toast.current.show({
          severity: "warn",
          summary: "Validation",
          detail: "Please fill all required fields",
        });
        return;
      }

      const payload = {
        PropertyId: puidn || 0,

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
      // UPDATE
      // =========================
      if (isEditMode && formData.TempId) {
        response = await updateOnboardingTemp(
          formData.TempId,
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
      // CREATE
      // =========================
      else {
        response = await saveOnboardingTemp(payload, documents);
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: response || "Employee saved successfully",
        });
      }

      fetchEmployees();

      setDialogVisible(false);

      resetForm();
      setDocuments([]);

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
      accept: () => {
        setEmployees(employees.filter(e => e.TempId !== emp.TempId));
        toast.current.show({ severity: "success", summary: "Deleted", detail: "Employee removed" });
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

  return (
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
                    header="Actions"
                    body={(rowData) => (
                      <div className="d-flex gap-2">
                        <Button icon="pi pi-pencil" className="p-button-text p-button-info p-0" onClick={() => editEmployee(rowData)} />
                        <Button icon="pi pi-trash" className="p-button-text p-button-danger p-0" onClick={() => confirmDelete(rowData)} />
                      </div>
                    )}
                    style={{ minWidth: '100px' }}
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
              <Button label="Save Details" icon="pi pi-check" onClick={saveEmployee} />
            </div>
          }
        >
          <TabView>
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
                  <InputText value={formData.Designation} onChange={(e) => setFormData({ ...formData, Designation: e.target.value })} />
                </div>
                <div className="col-12 md:col-4 mb-3">
                  <label>Department</label>
                  <InputText value={formData.Department} onChange={(e) => setFormData({ ...formData, Department: e.target.value })} />
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
              </div>
            </TabPanel>

            <TabPanel header="Documents">
              <div className="p-fluid grid mt-2">

                {/* PROFILE */}
                <div className="col-12 md:col-4 mb-3">
                  <label>Profile Photo (only once)</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={documents.some(d => d.type === "Profile")}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      if (documents.some(d => d.type === "Profile")) return;

                      setDocuments(prev => [...prev, { type: "Profile", file }]);
                    }}
                  />
                  {documents.find(d => d.type === "Profile" && d.fileName) && (
                    <small style={{ display: "block" }}>
                      Existing: {documents.find(d => d.type === "Profile").fileName}
                    </small>
                  )}
                </div>

                {/* RESUME */}
                <div className="col-12 md:col-4 mb-3">
                  <label>Resume (only once)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={documents.some(d => d.type === "Resume")}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      if (documents.some(d => d.type === "Resume")) return;

                      setDocuments(prev => [...prev, { type: "Resume", file }]);
                    }}
                  />
                  {documents.find(d => d.type === "Resume" && d.fileName) && (
                    <small>
                      Existing: {documents.find(d => d.type === "Resume").fileName}
                    </small>
                  )}
                </div>

                {/* AADHAR */}
                <div className="col-12 md:col-4 mb-3">
                  <label>Aadhar Document</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      if (documents.some(d => d.type === "Aadhar")) return;
                      setDocuments(prev => [...prev, { type: "Aadhar", file }]);
                    }}
                  />
                </div>

                {/* PAN */}
                <div className="col-12 md:col-4 mb-3">
                  <label>PAN Document</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      if (documents.some(d => d.type === "PAN")) return;
                      setDocuments(prev => [...prev, { type: "PAN", file }]);
                    }}
                  />
                </div>

                {/* BANK PASSBOOK */}
                <div className="col-12 md:col-4 mb-3">
                  <label>Bank Passbook</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      if (documents.some(d => d.type === "Bank Passbook")) return;
                      setDocuments(prev => [...prev, { type: "Bank Passbook", file }]);
                    }}
                  />
                </div>

                {/* PREVIEW */}
                <div className="col-12">
                  {documents.map((doc, i) => (
                    <div key={i}>
                      <b>{doc.type}</b>: {doc.file?.name}
                    </div>
                  ))}
                </div>

              </div>
            </TabPanel>

          </TabView>
        </Dialog>
      </div>
    </PrimeReactProvider>
  );
};

export default EmployeeOnboarding;
