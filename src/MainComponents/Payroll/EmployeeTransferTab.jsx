import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";

import { getEmployeesByOffices } from "../../Services/PayrollService";
import { getAllProperties } from "../../Services/PropertyService";
import { transferEmployees } from "../../Services/EmployeeTransfer";

const EmployeeTransferTab = () => {
  const toast = useRef(null);

  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [newProperty, setNewProperty] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  // 🔹 Fetch employees
  useEffect(() => {
    if (!reduxPropertyId) return;
    fetchEmployees();
  }, [reduxPropertyId]);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployeesByOffices([reduxPropertyId]);

      const list = (res || []).map((item) => ({
        FacilityMemberId: item.FacilityMember?.FacilityMemberId,
        Name: item.Profile?.EmployeeName,
        EmployeeCode: item.Profile?.EmployeeCode,
        Designation: item.Profile?.Designation,
      }));

      setEmployees(list);
    } catch {
      setEmployees([]);
    }
  };

  // 🔹 Fetch properties
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const res = await getAllProperties();
      setProperties(res || []);
    } catch {
      setProperties([]);
    }
  };

  // 🔥 Transfer
  const handleTransfer = async () => {
    if (!selectedEmployees.length || !newProperty) {
      toast.current.show({
        severity: "warn",
        summary: "Validation",
        detail: "Select employees and target property",
      });
      return;
    }

    try {
      const ids = selectedEmployees.map((emp) => emp.FacilityMemberId);

      await transferEmployees({
        FacilityMemberIds: ids,
        CurrentPropertyId: reduxPropertyId,
        NewPropertyId: Number(newProperty),
      });

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Employees transferred successfully",
      });

      setSelectedEmployees([]);
      fetchEmployees();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
      });
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <Toast ref={toast} />

        <h2>Employee Transfer</h2>

        {/* 🔽 Property Dropdown */}
        <div style={{ marginBottom: 15 }}>
          <label>Select Target Property</label>
          <select
            value={newProperty}
            onChange={(e) => setNewProperty(e.target.value)}
          >
            <option value="">-- Select Property --</option>
            {properties.map((p) => (
              <option key={p.PropertyId} value={p.PropertyId}>
                {p.Name}
              </option>
            ))}
          </select>
        </div>

        {/* 🔍 Search + Count */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span>
            Total Employees: <b>{employees.length}</b>
          </span>

          <InputText
            placeholder="Search by Name / Code / Designation"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ width: "250px" }}
          />
        </div>

        {/* 📊 Table */}
        <DataTable
          value={employees}
          selection={selectedEmployees}
          onSelectionChange={(e) => setSelectedEmployees(e.value)}
          dataKey="FacilityMemberId"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          globalFilter={globalFilter}
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column field="EmployeeCode" header="Code" />
          <Column field="Name" header="Name" />
          <Column field="Designation" header="Designation" />
        </DataTable>

        <Button
          label="Transfer Selected"
          onClick={handleTransfer}
          style={{ marginTop: 15 }}
        />
      </div>
    </div>
  );
};

export default EmployeeTransferTab;