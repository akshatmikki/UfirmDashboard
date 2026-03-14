import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getFacilityMemberSalaryDetailsByClientBranch } from "../../Services/PayrollService";
import {
    getAllClients,
    getClientByPropertyId,
    getPropertiesByClientId,
} from "../../Services/ClientService";

export default function PFReport() {
    const reduxPropertyId = useSelector(
        (state) => state.Commonreducer.puidn
    );

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
                } else {
                    const res = await getAllClients();
                    setUnitList(res || []);
                }
            } catch (err) {
                console.log("Failed to load clients", err);
            }
        };

        loadUnits();
    }, [reduxPropertyId]);

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

                if (reduxPropertyId) {
                    setSelectedPropertyId(reduxPropertyId);
                } else {
                    setSelectedPropertyId(null);
                }
            } catch (err) {
                console.log("Failed to load properties", err);
            }
        };

        loadProperties();
    }, [selectedUnitId]);

    // Load Employees
    // useEffect(() => {
    //     const loadEmployees = async () => {
    //         try {
    //             if (!selectedPropertyId) {
    //                 setEmployees([]);
    //                 return;
    //             }

    //             const data = await getEmployeesByOffices([selectedPropertyId]);
    //             setEmployees(data || []);
    //         } catch (err) {
    //             console.error("Employee load failed", err);
    //             setEmployees([]);
    //         }
    //     };

    //     loadEmployees();
    // }, [selectedPropertyId]);

    useEffect(() => {
    const loadPFData = async () => {
        try {
            if (!selectedUnitId || !selectedPropertyId || !selectedMonth) {
                setEmployees([]);
                return;
            }

            setLoading(true);

            const [year, month] = selectedMonth.split("-");
            const monthName = new Date(year, month - 1).toLocaleString(
                "default",
                { month: "long" }
            );

            const data =
                await getFacilityMemberSalaryDetailsByClientBranch(
                    selectedUnitId,
                    selectedPropertyId,
                    monthName,
                    year
                );

            setEmployees(data || []);
        } catch (error) {
            console.error("PF report fetch failed", error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    loadPFData();
}, [selectedUnitId, selectedPropertyId, selectedMonth]);

    const handleExport = () => {
        if (!selectedMonth || !selectedPropertyId) return;

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        let csvContent = "";

        // Title
        csvContent += `PF Report - ${monthName} ${year}\n\n`;

        // Headers
        const headers = [
            "S.No",
            "Employee Code",
            "Employee Name",
            "Designation",
            "Working Days",
            "Total Gross Earn",
            "PF Wage",
            "Pension Wage",
            "EDLI Wage",
            "12 %",
            "3.67 %",
            "8.33 %",
            "13 %",
            "Emp LWF",
        ];

        csvContent += headers.join(",") + "\n";

        // Data Rows
        employees.forEach((emp, index) => {
            const row = [
                index + 1,
                emp?.Profile?.EmployeeCode || "-",
                emp?.Profile?.EmployeeName || "-",
                emp?.Profile?.Designation || "-",
                "", // Working Days
                "", // Total Gross
                "", // PF Wage
                "", // Pension Wage
                "", // EDLI Wage
                "", // 12%
                "", // 3.67%
                "", // 8.33%
                "", // 13%
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
            `PF_Report_${monthName}_${year}.csv`
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
                PF Report
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
                        <option value="">-- Select Unit --</option>
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
                    disabled={!selectedMonth || !selectedPropertyId}
                >
                    Export PF
                </button>
            </div>

            {loading && <div>Loading PF data...</div>}

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
                            <th>Designation</th>
                            <th>Working Days</th>
                            <th>Total Gross Earn</th>
                            <th>PF Wage</th>
                            <th>Pension Wage</th>
                            <th>EDLI Wage</th>
                            <th>12 %</th>
                            <th>3.67 %</th>
                            <th>8.33 %</th>
                            <th>13 %</th>
                            <th>Emp LWF</th>
                        </tr>
                    </thead>
                    <tbody>
{employees.length === 0 ? (
    <tr>
        <td colSpan="14" style={{ textAlign: "center" }}>
            Select month and unit to view PF report
        </td>
    </tr>
) : (
    employees.map((emp, index) => (
        <tr key={emp.FacilityMemberId}>
            <td>{index + 1}</td>
            <td>{emp.FacilityMemberId}</td>
            <td>{emp.FacilityMemberName}</td>
            <td>{emp.Designation || "-"}</td>
            <td>{emp.WorkingDays}</td>
            <td>{emp.ProratedTotalGross}</td>
            <td>{emp.Basic}</td>
            <td>{emp.Basic}</td>
            <td>{emp.Basic}</td>
            <td>{(emp.Basic * 0.12).toFixed(2)}</td>
            <td>{(emp.Basic * 0.0367).toFixed(2)}</td>
            <td>{(emp.Basic * 0.0833).toFixed(2)}</td>
            <td>{(emp.Basic * 0.13).toFixed(2)}</td>
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