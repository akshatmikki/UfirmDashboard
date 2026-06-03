import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getEmployeeOverallSalary } from "../../Services/PayrollService";

export default function EmployeeOverallReport() {
  const reduxPropertyId = useSelector(
    (state) => state.Commonreducer.puidn
  );

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const getMonthRange = (start, end) => {
    const result = [];

    const startDate = new Date(start + "-01");
    const endDate = end
      ? new Date(end + "-01")
      : new Date(start + "-01");

    const current = new Date(startDate);

    while (current <= endDate) {
      result.push({
        year: current.getFullYear(),
        month: current.toLocaleString("default", { month: "long" }),
      });

      current.setMonth(current.getMonth() + 1);
    }

    return result;
  };

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {

      // ✅ Allow employeeCode only
      if (!fromMonth && !employeeCode) {
        setEmployees([]);
        return;
      }

      // ❌ Property selected but no month
      if (!fromMonth && reduxPropertyId && !employeeCode) {
        setEmployees([]);
        return;
      }

      // ❌ Wrong range
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
          // 🔥 employeeCode only case
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

          if (data?.length) {
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

  return (
    <div
      className="card"
      style={{
        maxWidth: 1400,
        margin: "20px auto",
        padding: 20,
        background: "#f7fafc",
      }}
    >
      <h3 style={{ fontWeight: "bold" }}>
        Employee Overall Report
      </h3>

      {/* 🔥 FILTERS */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 20,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
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
              <th>Generated</th>
              <th>Freezed</th>
              <th>Total Earning</th>
              <th>Total Deduction</th>
              <th>Net Salary</th>
              <th>PDF</th>
            </tr>
          </thead>

          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center" }}>
                  No data found
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
                  <td>{emp.is_active ? "Yes" : "No"}</td>
                  <td>{emp.IsFreezed ? "Yes" : "No"}</td>
                  <td>{emp.TotalEarning}</td>
                  <td>{emp.TotalDeduction}</td>
                  <td>{emp.GeneratedAmount}</td>

                  <td>
                    {emp.fileUrl ? (
                      <a
                        href={emp.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}