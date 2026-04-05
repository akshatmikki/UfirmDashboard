import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getFacilityMemberSalaryDetailsByClientBranch } from "../../Services/PayrollService";
import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";

export default function ESIReport() {
  const reduxPropertyId = useSelector(
    (state) => state.Commonreducer.puidn
  );
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load Clients
  useEffect(() => {
    const loadUnits = async () => {
      try {
        if (Number(reduxPropertyId) > 0) {
          const res = await getClientByPropertyId(reduxPropertyId);
          setUnitList(res ? [res] : []);
          setSelectedUnitId(res?.ClientID || null);
          return;
        }

        const res = await getAllClients();
        setUnitList(res || []);
        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
        }
      } catch (err) {
        console.log("Failed to load clients", err);
      }
    };

    loadUnits();
  }, [reduxPropertyId, reduxClientId]);

  // Load Properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId(null);
          return;
        }

        const res = await getPropertiesByClientId(selectedUnitId);
        setPropertyList(res || []);

        if (Number(reduxPropertyId) > 0) {
          setSelectedPropertyId(Number(reduxPropertyId));
        } else {
          setSelectedPropertyId(null);
        }
      } catch (err) {
        console.log("Failed to load properties", err);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId]);

  // Load Employees
  useEffect(() => {
    const loadESIData = async () => {
      try {
        const propertyIds =
          Number(selectedPropertyId) > 0
            ? [Number(selectedPropertyId)]
            : (propertyList || [])
              .map((p) => Number(p.PropertyId))
              .filter((id) => Number.isFinite(id) && id > 0);

        if (!selectedUnitId || !selectedMonth || propertyIds.length === 0) {
          setEmployees([]);
          return;
        }

        setLoading(true);

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString(
          "default",
          { month: "long" }
        );

        const results = await Promise.all(
          propertyIds.map((pid) =>
            getFacilityMemberSalaryDetailsByClientBranch(
              selectedUnitId,
              pid,
              monthName,
              year
            )
          )
        );

        const flat = results.flatMap((r) => (Array.isArray(r) ? r : []));
        setEmployees(flat);
      } catch (error) {
        console.error("ESI report fetch failed", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadESIData();
  }, [selectedUnitId, selectedPropertyId, selectedMonth, propertyList]);

  const handleExport = () => {
    if (!selectedMonth || !employees.length) return;

    const [year, month] = selectedMonth.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });

    let csvContent = "";

    csvContent += `ESI Report - ${monthName} ${year}\n\n`;

    const headers = [
      "S.No",
      "Employee Code",
      "Employee Name",
      "Working Days",
      "Total Gross Earn",
      "ESI Wage",
      "0.75 %",
      "3.25 %",
      "Emp LWF",
    ];

    csvContent += headers.join(",") + "\n";

    employees.forEach((emp, index) => {
      const row = [
        index + 1,
        emp?.Profile?.EmployeeCode || "-",
        emp?.Profile?.EmployeeName || "-",
        "", // Working Days
        "", // Gross
        "", // ESI Wage
        "", // 0.75%
        "", // 3.25%
        "", // LWF
      ];

      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `ESI_Report_${monthName}_${year}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: 1600,
        margin: "20px auto",
        borderRadius: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        padding: "20px 30px",
        background: "#f7fafc",
      }}
    >
      <h3 style={{ fontWeight: "bold", color: "#2a4365" }}>
        ESI Report
      </h3>

      {/* Client + Unit Selection */}
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
        {/* Client */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Client :</label>
          <select
            value={selectedUnitId || ""}
            onChange={(e) => {
              const clientId = Number(e.target.value) || null;
              setSelectedUnitId(clientId);
              setSelectedPropertyId(null);

              // Clear old data
              setEmployees([]);
            }}
            disabled={Number(reduxClientId) > 0 || Number(reduxPropertyId) > 0}
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

        {/* Unit */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Unit :</label>
          <select
            value={selectedPropertyId || ""}
            onChange={(e) => {
              const value = Number(e.target.value) || null;
              setSelectedPropertyId(value);
              setEmployees([]);
            }}
            style={{ width: 240 }}
          >
            <option value="">All Units</option>
            {propertyList.map((p) => (
              <option key={p.PropertyId} value={p.PropertyId}>
                {p.PropertyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Selector & Export Button */}
      <div
        style={{
          marginBottom: 25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Side - Month */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontWeight: 600 }}>Select Month:</label>
          <input
            type="month"
            className="form-control"
            style={{ width: 200 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        {/* Right Side - Export Button */}
        <button
          className="btn btn-success"
          onClick={handleExport}
          disabled={!selectedMonth || !employees.length}
        >
          Export ESI
        </button>
      </div>

      {loading && <div>Loading ESI data...</div>}

      {/* Table Placeholder */}
      <div style={{ overflowX: "auto" }}>
        <table
          className="table table-bordered"
          style={{ background: "#fff" }}
        >
          <thead style={{ background: "#edf2f7" }}>
            <tr>
              <th>S.No.</th>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Working Days</th>
              <th>Total Gross Earn</th>
              <th>ESI Wage</th>
              <th>0.75 %</th>
              <th>3.25 %</th>
              <th>Emp LWF</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  Select month to view ESI report
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={emp.FacilityMemberId}>
                  <td>{index + 1}</td>
                  <td>{emp.FacilityMemberId}</td>
                  <td>{emp.FacilityMemberName}</td>
                  <td>{emp.WorkingDays}</td>
                  <td>{emp.ProratedTotalGross}</td>
                  <td>{emp.ProratedTotalGross}</td>
                  <td>{Math.ceil(emp.ProratedTotalGross * 0.0075)}</td>
                  <td>{Math.ceil(emp.ProratedTotalGross * 0.0325)}</td>
                  {/* <td>{Math.round(emp.ProratedTotalGross * 0.0075)}</td>
                  <td>{Math.round(emp.ProratedTotalGross * 0.0325)}</td> */}
                  <td>{emp.LwfEmployeeAmount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
