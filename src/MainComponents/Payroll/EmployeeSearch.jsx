"use client";

import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

import { searchEmployees } from "../../Services/EmployeeTransfer";
import "./EmployeeTransfer.css";

const EmployeeSearch = () => {
  const toast = useRef(null);

  const initialFilters = {
    EmployeeName: "",
    EmployeeCode: "",
    PhoneNumber: "",
    AadhaarCard: "",
    PanCard: "",
    UANNumber: "",
    PFNumber: "",
    ESINumber: "",
    BankAccountNumber: "",
    PropertyId: "",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Clean Payload + Fix PropertyId
  const buildPayload = () => {
    const cleaned = {};

    Object.keys(filters).forEach((key) => {
      let value = filters[key];

      if (value === "") {
        cleaned[key] = null;
      } else if (key === "PropertyId") {
        cleaned[key] = parseInt(value) || null;
      } else {
        cleaned[key] = value;
      }
    });

    return cleaned;
  };

  // ✅ Search API Call
  const handleSearch = async () => {
    try {
      setLoading(true);

      const payload = buildPayload();

      const res = await searchEmployees(payload);

      setData(res?.Data || []);

      if (!res?.Data?.length) {
        toast.current.show({
          severity: "warn",
          summary: "No Results",
          detail: "No employees found for given filters",
        });
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset
  const handleReset = () => {
    setFilters(initialFilters);
    setData([]);
  };

  // ✅ Better Label Formatting
  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  // 🔥 Header
  const header = (
    <div className="header">
      <h2>Employee Search</h2>

      <div className="actions">
        <Button label="Search" icon="pi pi-search" onClick={handleSearch} />
        <Button
          label="Reset"
          icon="pi pi-refresh"
          className="p-button-secondary"
          onClick={handleReset}
        />
      </div>
    </div>
  );

  return (
    <div className="content-wrapper">
      <div className="employee-search-page">
        <Toast ref={toast} />

        <div className="card">
          <div className="card-body">
            {header}

            {/* 🔍 SEARCH GRID */}
            <div className="search-grid">
              {Object.keys(filters).map((key) => (
                <div className="search-field" key={key}>
                  <label>{formatLabel(key)}</label>

                  <InputText
                    name={key}
                    value={filters[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${formatLabel(key)}`}
                    className="p-inputtext-sm"
                  />
                </div>
              ))}
            </div>

            {/* 📊 TABLE */}
            <DataTable
              value={data}
              paginator
              rows={10}
              loading={loading}
              responsiveLayout="scroll"
              stripedRows
              rowHover
              emptyMessage="No employees found."
              className="p-datatable-gridlines p-datatable-sm mt-3"
            >
              <Column
                header="#"
                body={(row, options) => options.rowIndex + 1}
                style={{ width: "60px" }}
              />

              <Column field="Name" header="Name" />
              <Column field="EmployeeCode" header="Code" />
              <Column field="Mobile" header="Mobile" />
              <Column field="Department" header="Department" />
              <Column field="Designation" header="Designation" />
              <Column field="BranchName" header="Branch" />
              <Column field="ClientName" header="Client" />
              <Column field="PropertyName" header="Property" />
              <Column field="DOB" header="DOB" body={(row) => row.DOB ? new Date(row.DOB).toLocaleDateString() : "-"} />
              <Column
                field="DateOfJoining"
                header="DOJ"
                body={(row) =>
                  row.DateOfJoining
                    ? new Date(row.DateOfJoining).toLocaleDateString()
                    : "-"
                }
              />
              <Column field="Aadhaar" header="Aadhaar" />
              <Column field="Pan" header="PAN" />
              <Column field="UAN" header="UAN" />
              <Column field="PF" header="PF Number" />
              <Column field="ESI" header="ESI Number" />
              <Column field="BankAccount" header="Bank Account" />
              <Column field="IFSC" header="IFSC" />
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSearch;