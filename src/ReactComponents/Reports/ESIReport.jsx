import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import {
  getGeneratedSalaryByPropertiesWithMonthYear,
  getEmployeesByOffices,
  getCrossUnitEmployeeDetails
} from "../../Services/PayrollService";
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
        const monthName = new Date(year, month - 1).toLocaleString("default", {
          month: "long",
        });

        const [salaryData, employeeData] = await Promise.all([
          getGeneratedSalaryByPropertiesWithMonthYear(
            propertyIds,
            monthName,
            Number(year)
          ),
          getEmployeesByOffices(propertyIds),
        ]);

        // 🔥 STEP 1: find cross-unit employees
        const officeEmpIds = new Set(
          (employeeData || []).map(e => e?.FacilityMember?.FacilityMemberId)
        );

        const crossUnitEmpIds = (salaryData || [])
          .filter(emp => !officeEmpIds.has(emp.EmployeeId))
          .map(emp => emp.EmployeeId);

        const crossUnitData = await getCrossUnitEmployeeDetails(
          crossUnitEmpIds,
          selectedMonth
        );

        // 🔗 Map employee data
        const employeeMap = {};

        // 🔹 SAME UNIT
        (employeeData || []).forEach((emp) => {
          const fmId = emp?.FacilityMember?.FacilityMemberId;

          if (fmId) {
            employeeMap[fmId] = {
              EmployeeCode: emp?.Profile?.EmployeeCode,
              ESINumber: emp?.FinancialInfo?.ESINumber,
              EmployeeName: emp?.Profile?.EmployeeName
            };
          }
        });

        // 🔥 CROSS UNIT (THIS WAS MISSING)
        (crossUnitData || []).forEach((emp) => {
          const fmId = emp?.FacilityMemberId;

          if (fmId) {
            employeeMap[fmId] = {
              EmployeeCode: emp?.EmployeeCode,
              ESINumber: emp?.ESINumber,
              EmployeeName: emp?.Name
            };
          }
        });

        // 🔥 Merge + calculate
        const mappedData = (salaryData || []).map((emp) => {
          const extra = employeeMap[emp.EmployeeId] || {};

          const esiBase = emp.ESIVariableSum || 0;

          const esiWage =
            emp.ESILimit > 0 && emp.ESILimit < esiBase
              ? emp.ESILimit
              : esiBase;

          const workingDays = emp.WorkingDays || 0; // Out of days (30)
          const dutyDays = emp.DutyDays || 0;       // Actual working days (25)    

          return {
            FacilityMemberId: emp.EmployeeId,

            EmployeeCode: extra.EmployeeCode || "-",
            FacilityMemberName: emp.EmployeeName || extra.EmployeeName || "-",
            ESINumber: extra.ESINumber || "-",

            WorkingDays: dutyDays,     // show 25
            OutOfDays: workingDays,

            TotalGross: emp.TotalGross || 0,

            ESIWage: esiWage,
            ESI_075: emp.ESI || 0,   // from API (already ceil)
            ESI_325: Math.ceil(esiWage * 0.0325),

            LWF: emp.LWF || 0,
          };
        });

        setEmployees(mappedData);
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
    let totalGross = 0;
    let totalESIWage = 0;
    let total075 = 0;
    let total325 = 0;
    let totalLWF = 0;

    const selectedUnitName =
      propertyList.find(p => p.PropertyId === selectedPropertyId)?.PropertyName || "All Units";

    csvContent += `ESI Report - ${monthName} ${year}\n`;
    csvContent += `Unit: ${selectedUnitName}\n\n`;

    const headers = [
      "S.No",
      "Employee Code",
      "Employee Name",
      "ESI Number",
      "Working Days",
      "Total Gross Earn",
      "ESI Wage",
      "0.75 %",
      "3.25 %",
      "Emp LWF",
    ];

    csvContent += headers.join(",") + "\n";

    employees.filter(emp => emp.ESIWage > 0)
      .forEach((emp, index) => {
        totalGross += emp.TotalGross || 0;
        totalESIWage += emp.ESIWage;
        total075 += emp.ESI_075;
        total325 += emp.ESI_325;
        totalLWF += emp.LWF || 0;
        const row = [
          index + 1,
          emp.EmployeeCode || "-",
          emp.FacilityMemberName || "-",
          `="${emp.ESINumber || "-"}"`,
          emp.WorkingDays || 0,
          emp.TotalGross || 0,
          emp.ESIWage,
          emp.ESI_075,
          emp.ESI_325,
          emp.LwfEmployeeAmount || 0,
        ];

        csvContent += row.join(",") + "\n";
      });

    csvContent += "\n";

    const totalRow = [
      "TOTAL",  // S.No
      "",       // Employee Code
      "",       // Employee Name
      "",       // ESI Number
      "",       // Working Days
      totalGross,
      totalESIWage,
      total075,
      total325,
      totalLWF
    ];

    csvContent += totalRow.join(",") + "\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `ESI_Report_${selectedUnitName}_${monthName}_${year}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUploadFormat = () => {
    if (!selectedMonth || !employees.length) return;

    // 🧾 Header row
    const data = [
      [
        "IP Number\n(10 Digits)",
        "IP Name\n( Only alphabets and space )",
        "No of Days for which wages paid/payable during the month",
        "Total Monthly Wages",
        "Reason Code for Zero workings days\n(numeric only; provide 0 for all other reasons. Click on the link for reference)",
        "Last Working Day\n( Format DD/MM/YYYY or DD-MM-YYYY )"
      ]
    ];

    // 📊 Data rows
    employees
      .filter(emp => emp.ESIWage > 0)
      .forEach(emp => {
        data.push([
          emp.ESINumber || "",
          emp.FacilityMemberName || "",
          emp.WorkingDays || 0,
          emp.ESIWage || 0,
          "",
          ""
        ]);
      });

    // 🧱 Create sheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 📍 Get range
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // 🔵 HEADER STYLING
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });

      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        fill: {
          fgColor: { rgb: "B7DEE8" } // light blue
        },
        font: {
          bold: true,
          color: { rgb: "000000" }
        },
        alignment: {
          wrapText: true,
          vertical: "center",
          horizontal: "center"
        },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }

    // 🧨 FULL TABLE BORDERS (header + data)
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

        if (!ws[cellRef]) continue;

        ws[cellRef].s = {
          ...(ws[cellRef].s || {}),
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }

    // 📏 Column widths
    ws["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 55 },
      { wch: 30 }
    ];

    // 📦 Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ESI Upload");

    // 💾 Download
    XLSX.writeFile(wb, `ESI_Upload_${selectedMonth}.xlsx`);
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

        {/* Right Side - Buttons Group */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={!selectedMonth || !employees.length}
          >
            Export ESI
          </button>

          <button
            className="btn btn-primary"
            onClick={handleExportUploadFormat}
            disabled={!selectedMonth || !employees.length}
          >
            Upload ESI
          </button>
        </div>
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
              <th>ESI Number</th>
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
                <td colSpan="10" style={{ textAlign: "center" }}>
                  Select month to view ESI report
                </td>
              </tr>
            ) : (
              employees
                .filter(emp => emp.ESIWage > 0)
                .map((emp, index) => {

                  return (
                    <tr key={emp.FacilityMemberId}>
                      <td>{index + 1}</td>
                      <td>{emp.EmployeeCode}</td>
                      <td>{emp.FacilityMemberName}</td>
                      <td>{emp.ESINumber}</td>
                      <td>{emp.WorkingDays}</td>
                      <td>{emp.TotalGross}</td>
                      <td>{emp.ESIWage}</td>
                      <td>{emp.ESI_075}</td>
                      <td>{emp.ESI_325}</td>
                      <td>{emp.LWF}</td>
                      {/* <td>{Math.round(emp.ProratedTotalGross * 0.0075)}</td>
                  <td>{Math.round(emp.ProratedTotalGross * 0.0325)}</td> */}
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

