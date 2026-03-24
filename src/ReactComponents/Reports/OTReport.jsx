import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { getEmployeesByOffices, getMonthlyOTReport, saveMonthlyOTReport, updateMonthlyOTReport, deleteMonthlyOTReport, } from "../../Services/PayrollService";
import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";
export default function OTReport() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  //const officeId = useSelector((state) => state.Commonreducer.puidn);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otEntries, setOtEntries] = useState({});
  const [existingOTEmployees, setExistingOTEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentEmployees = employees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(employees.length / itemsPerPage);


  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return 0;

    const [year, month] = selectedMonth.split("-");
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const dateColumns = useMemo(() => {
    if (!selectedMonth) return [];

    const [year, month] = selectedMonth.split("-");

    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const dateObj = new Date(year, month - 1, dayNumber);
      const dayName = dateObj.toLocaleString("default", {
        weekday: "short",
      });

      return {
        dayNumber,
        dayName,
        isSunday: dateObj.getDay() === 0,
      };
    });
  }, [daysInMonth, selectedMonth]);

  const handleRowSelect = (empId) => {
    setSelectedEmployees((prevSelected) =>
      prevSelected.includes(empId)
        ? prevSelected.filter((id) => id !== empId)
        : [...prevSelected, empId]
    );
  };
  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      const allIds = employees.map(
        (emp) => emp?.FacilityMember?.FacilityMemberId
      );
      setSelectedEmployees(allIds);
    }
  };

  const fetchMonthlyOT = async () => {
    if (!selectedMonth) return;

    if (!selectedPropertyId) {
      alert("Please select exactly one unit for OT report.");
      return;
    }

    const propertyId = selectedPropertyId;
    const [year, month] = selectedMonth.split("-");

    try {
      setLoading(true);

      const data = await getMonthlyOTReport(
        propertyId,
        parseInt(month),
        parseInt(year)
      );

      const formattedEntries = {};
      const existingIds = [];

      if (Array.isArray(data)) {
        data.forEach((item) => {
          const empId = item.EmployeeID;

          existingIds.push(empId);

          const day = parseInt(
            item.OTDate.split("T")[0].split("-")[2]
          );

          formattedEntries[empId] = {
            ...formattedEntries[empId],
            [day]: {
              OTHours: item.OTHours || 0,
            },
          };
        });
      }

      setExistingOTEmployees(existingIds);
      setOtEntries(formattedEntries);

    } catch (error) {
      console.error("Failed to fetch OT data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOTChange = (empId, day, value) => {
    setOtEntries((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: {
          OTHours: parseFloat(value) || 0,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedMonth || selectedEmployees.length === 0) return;

    const [year, month] = selectedMonth.split("-");

    try {
      setLoading(true);

      if (!selectedPropertyId) {
        alert("Please select exactly one unit before saving OT.");
        return;
      }

      const propertyId = selectedPropertyId;

      await Promise.all(
        selectedEmployees.map(async (empId) => {
          const entries = otEntries[empId] || {};

          const OTEntries = Object.keys(entries)
            .filter((day) => entries[day]?.OTHours > 0)
            .map((day) => ({
              OTDate: `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`,
              OTHours: entries[day]?.OTHours || 0,
            }));

          if (OTEntries.length === 0) return;

          const model = {
            EmployeeID: empId,
            PropertyID: propertyId,
            Month: parseInt(month),
            Year: parseInt(year),
            OTEntries,
          };

          if (existingOTEmployees.includes(empId)) {
            return updateMonthlyOTReport(model);
          }

          return saveMonthlyOTReport(model);
        })
      );

      alert("OT saved successfully");

      setSelectedEmployees([]);
      setOtEntries({});
      await fetchMonthlyOT();

    } catch (error) {
      console.error("Error saving OT:", error);
      alert("Failed to save OT");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMonth || selectedEmployees.length === 0) return;

    if (!selectedPropertyId) {
      alert("Please select exactly one unit before deleting OT.");
      return;
    }

    const propertyId = selectedPropertyId;
    const [year, month] = selectedMonth.split("-");

    try {
      setLoading(true);

      await Promise.all(
        selectedEmployees.map((empId) =>
          deleteMonthlyOTReport(
            propertyId,
            empId,
            parseInt(month),
            parseInt(year)
          )
        )
      );

      alert("OT deleted successfully");

      setSelectedEmployees([]);
      setOtEntries({});
      await fetchMonthlyOT();

    } catch (error) {
      console.error("Error deleting OT:", error);
      alert("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyOT();
  }, [selectedMonth, selectedPropertyId]);

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

  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId(null);
          return;
        }

        const res = await getPropertiesByClientId(selectedUnitId);
        const properties = res || [];

        setPropertyList(properties);

        // If navbar already selected property
        if (Number(reduxPropertyId) > 0) {
          setSelectedPropertyId(Number(reduxPropertyId));
        } else if (properties.length > 0) {
          setSelectedPropertyId(Number(properties[0].PropertyId) || null);
        } else {
          setSelectedPropertyId(null);
        }
      } catch (err) {
        console.log("Failed to load properties", err);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        if (!selectedPropertyId) {
          setEmployees([]);
          return;
        }

        const data = await getEmployeesByOffices([selectedPropertyId]);
        setEmployees(data || []);
      } catch (err) {
        console.error("Employee load failed", err);
        setEmployees([]);
      }
    };

    loadEmployees();
  }, [selectedPropertyId]);

  const calculateRowTotalHours = (empId) => {
    const entries = otEntries[empId] || {};

    let totalHours = 0;

    Object.values(entries).forEach((entry) => {
      totalHours += parseFloat(entry?.OTHours || 0);
    });

    return totalHours.toFixed(1);
  };

  const handleExport = () => {
    if (!selectedMonth) return;

    const [year, month] = selectedMonth.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });

    let csvContent = "";

    // Title row
    csvContent += `OT Report of ${monthName} ${year}\n\n`;

    // Header row
    const headers = [
      "S.No",
      "Employee Code",
      "Employee Name",
      "Employee ID",
      "Designation",
      ...dateColumns.map(
        ({ dayNumber, dayName }) => `${dayNumber} (${dayName})`
      ),
      "Total OT Hours",
    ];

    csvContent += headers.join(",") + "\n";

    // Data rows (export ALL employees, not paginated)
    employees.forEach((emp, index) => {
      const empId = emp?.FacilityMember?.FacilityMemberId || "-";
      const empCode = emp?.Profile?.EmployeeCode || "-";
      const empName = emp?.Profile?.EmployeeName || "Unknown";
      const designation =
        emp?.EmployeeList?.Designation ||
        emp?.Profile?.Designation ||
        "-";

      const row = [
        index + 1,
        empCode,
        empName,
        empId,
        designation,
      ];

      // Daily values
      dateColumns.forEach(({ dayNumber }) => {
        const hrs = otEntries[empId]?.[dayNumber]?.OTHours || 0;
        row.push(`${hrs} hrs`);
      });

      // Totals
      const totalHours = calculateRowTotalHours(empId);

      row.push(`${totalHours} hrs`);

      csvContent += row.join(",") + "\n";
    });

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `OT_Report_${monthName}_${year}.csv`
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
        OT Report
      </h3>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "8px 14px",
        marginBottom: 20,
        background: "#f9fafb",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}>

        {/* Select Client */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Client :</label>
          <select
            value={selectedUnitId || ""}
            onChange={(e) => {
              const clientId = Number(e.target.value) || null;

              setSelectedUnitId(clientId);
              setSelectedPropertyId(null);

              // Clear previous state to prevent stale data flash
              setEmployees([]);
              setSelectedEmployees([]);
              setOtEntries({});
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

        {/* Select Unit */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>Select Unit :</label>

          <select
            value={selectedPropertyId || ""}
            onChange={(e) => {
              const value = Number(e.target.value) || null;
              setSelectedPropertyId(value);
              setSelectedEmployees([]);
              setEmployees([]);
            }}
            style={{ width: 240 }}
          >
            <option value="">-- Select Unit --</option>
            {propertyList.map((p) => (
              <option key={p.PropertyId} value={p.PropertyId}>
                {p.PropertyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Selector */}
      <div
        style={{
          marginBottom: 25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Side */}
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <label style={{ fontWeight: 500 }}>Select Month:</label>

          <input
            type="month"
            className="form-control"
            style={{ width: 200 }}
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Right Side Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedMonth || selectedEmployees.length === 0}
          >
            Save OT
          </button>

          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!selectedMonth || selectedEmployees.length === 0}
          >
            Delete
          </button>

          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={!selectedMonth}
          >
            Export
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ marginBottom: 10, color: "#2a4365" }}>
          Loading OT data...
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          className="table table-bordered"
          style={{ width: "100%", background: "#fff" }}
        >
          <thead style={{ background: "#edf2f7" }}>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    employees.length > 0 &&
                    selectedEmployees.length === employees.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>S.No.</th>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Designation</th>

              {dateColumns.map(({ dayNumber, dayName, isSunday }) => (
                <th
                  key={dayNumber}
                  style={{
                    background: isSunday ? "#fff0f0" : "#edf2f7",
                    color: isSunday ? "#c53030" : "#000",
                    fontSize: 12,
                    fontWeight: isSunday ? "bold" : "normal",
                    textAlign: "center",
                  }}
                >
                  <div>{dayNumber}</div>
                  <div style={{ fontSize: 10 }}>{dayName}</div>
                </th>
              ))}


              <th>Total OT Hours</th>
            </tr>
          </thead>

          <tbody>
            {!selectedMonth ? (
              <tr>
                <td
                  colSpan={6 + dateColumns.length + 1}
                  style={{ textAlign: "center", color: "#718096" }}
                >
                  Select a month to view OT report
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + dateColumns.length + 1}
                  style={{ textAlign: "center", color: "#718096" }}
                >
                  No employees found
                </td>
              </tr>
            ) : (
              currentEmployees.map((emp, index) => {
                const empCode = emp?.Profile?.EmployeeCode || "-";

                const empId =
                  emp?.FacilityMember?.FacilityMemberId || "-";

                const empName =
                  emp?.Profile?.EmployeeName || "Unknown";

                const designation =
                  emp?.EmployeeList?.Designation ||
                  emp?.Profile?.Designation ||
                  "-";

                return (
                  <tr key={empId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(empId)}
                        onChange={() => handleRowSelect(empId)}
                      />
                    </td>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td>{empCode}</td>
                    <td>{empName}</td>
                    <td>{empId}</td>
                    <td>{designation}</td>

                    {dateColumns.map(({ dayNumber, isSunday }) => (
                      <td key={dayNumber}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            padding: 4,
                            background: isSunday ? "#fff5f5" : "#f8fafc",
                            borderRadius: 6,
                          }}
                        >
                          {/* HOURS */}
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            disabled={!selectedEmployees.includes(empId)}
                            placeholder="Hrs"
                            value={otEntries[empId]?.[dayNumber]?.OTHours || ""}
                            onChange={(e) =>
                              handleOTChange(empId, dayNumber, e.target.value)
                            }
                            style={{
                              width: 75,
                              fontSize: 12,
                              padding: "3px 6px",
                              borderRadius: 4,
                              border: otEntries[empId]?.[dayNumber]?.OTHours
                                ? "1px solid #3182ce"
                                : "1px solid #cbd5e0",
                              background: !selectedEmployees.includes(empId)
                                ? "#edf2f7"
                                : otEntries[empId]?.[dayNumber]?.OTHours
                                  ? "#ebf8ff"
                                  : "#fff",
                            }}
                          />
                        </div>
                      </td>

                    ))}

                    <td>{calculateRowTotalHours(empId)} hrs</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {employees.length > itemsPerPage && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <button
            className="btn btn-sm btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </button>

          <span style={{ padding: "5px 10px" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-sm btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
