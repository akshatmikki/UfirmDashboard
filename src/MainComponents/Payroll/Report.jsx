// Report.jsx
import React, { useState } from "react";

import SalaryReport from "../../ReactComponents/Reports/SalaryReport.jsx";
import OTReport from "../../ReactComponents/Reports/OTReport.jsx";
import PFReport from "../../ReactComponents/Reports/PFReport.jsx";
import ESIReport from "../../ReactComponents/Reports/ESIReport.jsx";
import CompanySalarySummary from "../../ReactComponents/Reports/CompanySalarySummary.jsx";
import GenerateFreezeReport from "../../ReactComponents/Reports/GenerateFreezeReport.jsx";
import EmployeeOverallReport from "../../ReactComponents/Reports/EmployeeOverallReport.jsx";
import DeductionReport from "../../ReactComponents/Reports/DeductionReport.jsx";

export default function Report() {
  const [selectedReport, setSelectedReport] = useState("");

  const renderReportComponent = () => {
    switch (selectedReport) {
      case "SALARY":
        return <SalaryReport />;
      case "PF":
        return <PFReport />;
      case "ESI":
        return <ESIReport />;
      case "GENERATEFREEZE":
        return <GenerateFreezeReport />;
      case "EMPLOYEE_OVERALL":
        return <EmployeeOverallReport />;
      case "DEDUCTION":
        return <DeductionReport />;
      case "SUMMARY":
        return <CompanySalarySummary />;
      case "OT":
        return <OTReport />;
      default:
        return null;
    }
  };

  return (
    <div className="content-wrapper" style={{ padding: 30 }}>

      {/* Page Header */}
      <div
        style={{
          marginBottom: 25,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left Side - Heading */}
        <h2 style={{ fontWeight: "bold", margin: 0 }}>
          Payroll Reports
        </h2>

        {/* Right Side - Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontWeight: 500, margin: 0 }}>
            Select Report Type:
          </label>

          <select
            className="form-control"
            style={{ width: 220 }}
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            <option value="">-- Select Report --</option>

            <option value="SALARY">Salary Report</option>
            <option value="PF">PF Report</option>
            <option value="ESI">ESI Report</option>
            <option value="GENERATEFREEZE">Generate & Freeze Report</option>
            <option value="EMPLOYEE_OVERALL">Employee Overall Report</option>
            <option value="DEDUCTION">Deduction Report</option>
            <option value="SUMMARY">Company Salary Summary</option>
            <option value="OT">OT Report</option>
          </select>
        </div>
      </div>

      {/* Selected Report */}
      {renderReportComponent()}
    </div>
  );
}