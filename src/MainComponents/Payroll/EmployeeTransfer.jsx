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

  const [filters, setFilters] = useState({
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
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await searchEmployees(filters);
      setData(res?.Data || []);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
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
    });
    setData([]);
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
                  <label>
                    {key.replace(/([A-Z])/g, " $1")}
                  </label>

                  <InputText
                    name={key}
                    value={filters[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${key}`}
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

              <Column
                field="DateOfJoining"
                header="DOJ"
                body={(row) =>
                  row.DateOfJoining
                    ? new Date(row.DateOfJoining).toLocaleDateString()
                    : "-"
                }
              />
            </DataTable>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSearch;