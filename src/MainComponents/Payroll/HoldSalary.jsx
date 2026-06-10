import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
    getFundsApprovalHistorybyProperty,
    holdSalary,
    releaseHoldSalary,
    getHeldEmployees,
    getEmployeesByOffices,
    getCrossUnitEmployeeDetails
} from "../../Services/PayrollService";

export default function HoldSalary() {
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [data, setData] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [heldEmployees, setHeldEmployees] = useState([]);
    const [employeeMap, setEmployeeMap] = useState({});

    // 🔥 FETCH APPROVED EMPLOYEES
    const fetchData = async () => {
        if (!propertyId || !month || !year) {
            setData([]);
            setHeldEmployees([]);
            return;
        }

        try {
            setLoading(true);

            const [approvalRes, holdRes, empRes] = await Promise.all([
                getFundsApprovalHistorybyProperty({
                    propertyId,
                    month,
                    year,
                }),
                getHeldEmployees({
                    propertyId,
                    month,
                    year,
                }),
                getEmployeesByOffices([propertyId]),
            ]);

            // 🔥 HELD IDS
            const heldIds = holdRes.map((h) => String(h.EmployeeId));
            setHeldEmployees(heldIds);

            // 🔥 CREATE EMPLOYEE MAP
            const empMap = {};
            empRes.forEach((emp) => {
                const id = String(emp.FacilityMember?.FacilityMemberId);
                const name = emp.Profile?.EmployeeName;
                if (id && name) empMap[id] = name;
            });

            setEmployeeMap(empMap);

            // 🔥 STEP 1: collect all employee IDs
            let allIds = [];

            approvalRes.forEach((item) => {
                if (item.IsApproved && item.EmployeeIds) {
                    const uniqueIds = [...new Set(item.EmployeeIds.split(","))];
                    uniqueIds.forEach((id) => allIds.push(id.trim()));
                }
            });

            // 🔥 STEP 2: find missing (cross-unit)
            const missingIds = allIds.filter((id) => !empMap[id]);

            // 🔥 STEP 3: call cross-unit API
            let crossUnitMap = {};

            if (missingIds.length) {
                const monthIndex = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ].indexOf(month) + 1;

                const monthYear = `${year}-${String(monthIndex).padStart(2, "0")}`;

                const crossRes = await getCrossUnitEmployeeDetails(missingIds, monthYear);

                crossRes.forEach((emp) => {
                    const id = String(emp.FacilityMemberId);
                    crossUnitMap[id] = emp.Name;
                });
            }

            // 🔥 STEP 4: FINAL DATA BUILD
            let formatted = [];

            approvalRes.forEach((item) => {
                if (item.IsApproved && item.EmployeeIds) {
                    const uniqueIds = [...new Set(item.EmployeeIds.split(","))];

                    uniqueIds.forEach((id) => {
                        const cleanId = id.trim();

                        formatted.push({
                            RequestId: item.RequestId,
                            EmployeeId: cleanId,
                            EmployeeName:
                                empMap[cleanId] ||
                                crossUnitMap[cleanId] ||
                                cleanId, // fallback
                            Month: item.Month,
                            Year: item.Year,
                            RecipientName: item.RecipientName,
                        });
                    });
                }
            });

            setData(formatted);
        } catch (err) {
            console.error(err);
            setData([]);
            setHeldEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [propertyId, month, year]);

    // 🔥 CHECKBOX HANDLER (FIXED TYPE ISSUE)
    const toggleEmployee = (empId) => {
        const id = String(empId);

        setSelectedEmployees((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    // 🔒 HOLD
    const handleHold = async () => {
        if (!selectedEmployees.length) {
            alert("Select employees first");
            return;
        }

        // ✅ ADD THIS HERE
        const activeEmployees = selectedEmployees.filter(
            (id) => !heldEmployees.includes(id)
        );

        if (!activeEmployees.length) {
            alert("All selected employees are already held");
            return;
        }

        try {
            await holdSalary({
                propertyId,
                month,
                year: Number(year),
                employeeIds: activeEmployees, // ✅ USE THIS
                holdReason: "Manual Hold",
                actionBy: "Admin",
            });

            alert("Hold applied");
            setSelectedEmployees([]);
            await fetchData();
        } catch (err) {
            console.error(err);
            alert("Hold failed");
        }
    };

    // 🔓 RELEASE
    const handleRelease = async () => {
        if (!selectedEmployees.length) {
            alert("Select employees first");
            return;
        }

        try {
            await releaseHoldSalary({
                propertyId,
                month,
                year: Number(year),
                employeeIds: selectedEmployees,
                actionBy: "Admin",
            });

            alert("Released successfully");
            setSelectedEmployees([]);
            await fetchData();
        } catch (err) {
            console.error(err);
            alert("Release failed");
        }
    };

    return (
        <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
            <div
                className="card"
                style={{
                    maxWidth: 1300,
                    margin: "0 auto",
                    borderRadius: 10,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    padding: "20px 30px",
                    background: "#f7fafc",
                }}
            >
                <div style={{ marginBottom: 20 }}>

                    {/* 🔥 HEADER + BUTTONS */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 15
                        }}
                    >
                        <h2 style={{ fontWeight: "bold", color: "#2a4365", margin: 0 }}>
                            Hold Salary
                        </h2>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                className="btn btn-danger"
                                style={{
                                    padding: "8px 18px",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    borderRadius: 6
                                }}
                                onClick={handleHold}
                                type="button"
                            >
                                Hold
                            </button>

                            <button
                                className="btn btn-success"
                                style={{
                                    padding: "8px 18px",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    borderRadius: 6
                                }}
                                onClick={handleRelease}
                                type="button"
                            >
                                Release
                            </button>
                        </div>
                    </div>

                    {/* 🔥 FILTERS (LEFT ALIGNED, COMPACT) */}
                    <div
                        style={{
                            display: "flex",
                            gap: 25,
                            alignItems: "flex-end"
                        }}
                    >
                        {/* MONTH */}
                        <div style={{ width: 200 }}>
                            <label style={{ fontWeight: 500, marginBottom: 4 }}>
                                Month
                            </label>
                            <select
                                className="form-control"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            >
                                <option value="">Select</option>
                                {[
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"
                                ].map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* YEAR */}
                        <div style={{ width: 160 }}>
                            <label style={{ fontWeight: 500, marginBottom: 4 }}>
                                Year
                            </label>
                            <select
                                className="form-control"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            >
                                <option value="">Select</option>
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div style={{ marginBottom: 10, color: "#666" }}>
                        Loading data...
                    </div>
                )}

                <div style={{ overflowX: "auto" }}>
                    <table
                        className="table table-bordered"
                        style={{ width: "100%", marginBottom: 40, background: "#fff" }}
                    >
                        <thead style={{ background: "#edf2f7" }}>
                            <tr>
                                <th>Select</th>
                                <th>S.No</th>
                                <th>Employee Name</th>
                                <th>Month</th>
                                <th>Year</th>
                                <th>Recipient</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", color: "#718096" }}>
                                        No Data Available
                                    </td>
                                </tr>
                            ) : (
                                data.map((emp, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(String(emp.EmployeeId))}
                                                onChange={() => toggleEmployee(emp.EmployeeId)}
                                            />
                                        </td>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: 500 }}>{emp.EmployeeName}</td>
                                        <td>{emp.Month}</td>
                                        <td>{emp.Year}</td>
                                        <td>{emp.RecipientName}</td>
                                        <td>
                                            {heldEmployees.includes(String(emp.EmployeeId)) ? (
                                                <span
                                                    style={{
                                                        background: "#ffe5e5",
                                                        color: "#d32f2f",
                                                        padding: "4px 10px",
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Held
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        background: "#e6f4ea",
                                                        color: "#2e7d32",
                                                        padding: "4px 10px",
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}