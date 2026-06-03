import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getEmployeeOverallSalary } from "../../Services/PayrollService";
import * as XLSX from "xlsx";

export default function DeductionReport() {
  const reduxPropertyId = useSelector(
    (state) => state.Commonreducer.puidn
  );

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Helper to get months between range
  const getMonthRange = (start, end) => {
    const result = [];

    const startDate = new Date(start + "-01");
    const endDate = end
      ? new Date(end + "-01")
      : new Date(start + "-01"); // ✅ FIX: new object

    const current = new Date(startDate); // ✅ separate iterator

    while (current <= endDate) {
      result.push({
        year: current.getFullYear(),
        month: current.toLocaleString("default", { month: "long" }),
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      // ✅ CASE 1: EmployeeCode ONLY → allow
      if (employeeCode && !fromMonth) {
        // allowed, continue
      }

      // ❌ CASE 2: Property selected but no month → block
      else if (!fromMonth && reduxPropertyId) {
        setEmployees([]);
        return;
      }

      // ❌ CASE 3: nothing provided → block
      else if (!employeeCode && !reduxPropertyId) {
        setEmployees([]);
        return;
      }

      // ✅ RANGE VALIDATION
      if (toMonth && new Date(toMonth) < new Date(fromMonth)) {
        alert("To Month cannot be earlier than From Month");
        setEmployees([]);
        return;
      }

      try {
        setLoading(true);

        let months = [];

        if (fromMonth) {
          months = getMonthRange(fromMonth, toMonth);
        } else {
          // 🔥 employeeCode only case → no month filter
          months = [{ month: null, year: null }];
        }

        let allData = [];

        for (let m of months) {
          const data = await getEmployeeOverallSalary({
            propertyIds: reduxPropertyId ? [reduxPropertyId] : [],
            employeeCode: employeeCode || "",
            month: m.month,
            year: m.year,
          });

          if (data && data.length) {
            allData = [...allData, ...data];
          }
        }

        setEmployees(allData);
      } catch (err) {
        console.error("Fetch failed", err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reduxPropertyId, fromMonth, toMonth, employeeCode]);

  // 🔥 EXCEL EXPORT
  const handleExport = () => {
    if (!employees.length) return;

    const data = employees.map((emp, index) => ({
      SNo: index + 1,
      EmpCode: emp.EmployeeCode,
      Name: emp.EmployeeName,
      Month: emp.Month,
      Year: emp.Year,
      PF: emp.PF,
      ESI: emp.ESI,
      LWF: emp.LWF,
      PFT: emp.PFT,
      Advance: emp.Advance,
      OthDed: emp.OthDed,
      DocDed: emp.DocDed,
      Food: emp.Food,
      Maintenance: emp.Maintenance,
      Fine: emp.Fine,
      AcmdDed: emp.AcmdDed,
      IncomeTax: emp.IncomeTax,
      Uniform: emp.Uniform,
      BGV: emp.BGV,
      Room: emp.Room,
      JoiningKits: emp.JoiningKits,
      LoanEMI: emp.LoanEMI,
      TotalDeduction: emp.TotalDeduction,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deduction Report");

    XLSX.writeFile(wb, "Deduction_Report.xlsx");
  };

  return (
    <div className="card" style={{ maxWidth: 1600, margin: "20px auto", padding: 20, background: "#f7fafc" }}>
      <h3>Employee Deduction Report</h3>

      {/* 🔥 FILTERS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div>
          <label>From Month</label>
          <input
            type="month"
            className="form-control"
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
          />
        </div>

        <div>
          <label>To Month</label>
          <input
            type="month"
            className="form-control"
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
          />
        </div>

        <div>
          <label>Employee Code</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Employee Code"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
          />
        </div>

        {/* 🔥 EXPORT BUTTON */}
        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={!employees.length}
          >
            Export Excel
          </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}

      {/* 🔥 TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Month</th>
              <th>Year</th>
              <th>PF</th>
              <th>ESI</th>
              <th>LWF</th>
              <th>PFT</th>
              <th>Advance</th>
              <th>OthDed</th>
              <th>DocDed</th>
              <th>Food</th>
              <th>Maintenance</th>
              <th>Fine</th>
              <th>AcmdDed</th>
              <th>IncomeTax</th>
              <th>Uniform</th>
              <th>BGV</th>
              <th>Room</th>
              <th>JoiningKits</th>
              <th>LoanEMI</th>
              <th>Total Deduction</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="22" style={{ textAlign: "center" }}>
                  Select filters to load data
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={emp.GeneratedId}>
                  <td>{index + 1}</td>
                  <td>{emp.EmployeeCode}</td>
                  <td>{emp.EmployeeName}</td>
                  <td>{emp.Month}</td>
                  <td>{emp.Year}</td>
                  <td>{emp.PF}</td>
                  <td>{emp.ESI}</td>
                  <td>{emp.LWF}</td>
                  <td>{emp.PFT}</td>
                  <td>{emp.Advance}</td>
                  <td>{emp.OthDed}</td>
                  <td>{emp.DocDed}</td>
                  <td>{emp.Food}</td>
                  <td>{emp.Maintenance}</td>
                  <td>{emp.Fine}</td>
                  <td>{emp.AcmdDed}</td>
                  <td>{emp.IncomeTax}</td>
                  <td>{emp.Uniform}</td>
                  <td>{emp.BGV}</td>
                  <td>{emp.Room}</td>
                  <td>{emp.JoiningKits}</td>
                  <td>{emp.LoanEMI}</td>
                  <td>{emp.TotalDeduction}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}