import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getGeneratedSalaryByPropertiesWithMonthYear, getEmployeesByOffices } from "../../Services/PayrollService";
import {
    getAllClients,
    getClientByPropertyId,
    getPropertiesByClientId,
} from "../../Services/ClientService";

export default function PFReport() {
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

                const [salaryData, employeeData] = await Promise.all([
                    getGeneratedSalaryByPropertiesWithMonthYear(
                        propertyIds,
                        monthName,
                        Number(year)
                    ),
                    getEmployeesByOffices(propertyIds)
                ]);
                const employeeMap = {};

                (employeeData || []).forEach(emp => {
                    const fmId = emp?.FacilityMember?.FacilityMemberId;

                    if (fmId) {
                        employeeMap[fmId] = {
                            EmployeeCode: emp?.Profile?.EmployeeCode,
                            Designation: emp?.Profile?.Designation,
                            UAN: emp?.FinancialInfo?.UANNumber
                        };
                    }
                });

                const mappedData = (salaryData || []).map(emp => {
                    const extra = employeeMap[emp.EmployeeId] || {};

                    const baseWage = emp.PFVariableSum || 0;

                    const pfWage =
                        emp.PFLimit > 0 && emp.PFLimit < baseWage
                            ? emp.PFLimit
                            : baseWage;
                    const eps = Math.round(pfWage * 0.0833);
                    const epf = emp.PF || 0;

                    const workingDays = emp.WorkingDays || 0; // Out of days (30)
                    const dutyDays = emp.DutyDays || 0;       // Actual working days (25)

                    const ncpDays = workingDays - dutyDays;

                    return {
                        FacilityMemberId: emp.EmployeeId,

                        EmployeeCode: extra.EmployeeCode || "-",
                        FacilityMemberName: emp.EmployeeName,
                        Designation: extra.Designation || "-",
                        UAN: extra.UAN || "-",

                        // ✅ FIX HERE
                        WorkingDays: dutyDays,       // show 25 in UI
                        OutOfDays: workingDays,      // optional if you want to use/export later

                        TotalGross: emp.TotalGross || 0,

                        PFWage: pfWage,
                        EPF: epf,
                        EPS: eps,
                        Diff: epf - eps,

                        NCPDays: ncpDays > 0 ? ncpDays : 0,
                        // RefundOfAdvances: emp.Advance || 0
                    };
                });

                setEmployees(mappedData);

            } catch (error) {
                console.error("PF report fetch failed", error);
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };

        loadPFData();
    }, [selectedUnitId, selectedPropertyId, selectedMonth, propertyList]);

    const handleExport = () => {
        if (!selectedMonth || !employees.length) return;

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        let csvContent = "";
        let totalGross = 0;
        let totalPFWage = 0;
        let total12 = 0;
        let total833 = 0;

        // Title
        const selectedUnitName =
            propertyList.find(p => p.PropertyId === selectedPropertyId)?.PropertyName || "All Units";

        csvContent += `PF Report - ${monthName} ${year}\n`;
        csvContent += `Unit: ${selectedUnitName}\n\n`;

        // Headers
        const headers = [
            "S.No",
            "Employee Code",
            "Employee Name",
            "Designation",
            "UAN",
            "Working Days",
            "Gross Wages",
            "EPF Wages",
            "EPS Wages",
            "EDLI Wages",
            "EPF Contri Remitted",
            "EPS Contri Remitted",
            "EPF EPS Diff Remitted",
            "NCP Days",
            "Refund of Advances",
        ];

        csvContent += headers.join(",") + "\n";

        // Data Rows
        employees
            .filter(emp => emp.EPF > 0)
            .forEach((emp, index) => {
                const pfWage = emp.PFWage;
                totalGross += emp.TotalGross || 0;
                totalPFWage += pfWage;
                total12 += emp.EPF || 0;
                total833 += emp.EPS || 0;
                const row = [
                    index + 1,
                    emp.EmployeeCode || "-",
                    emp.FacilityMemberName || "-",
                    emp.Designation || "-",
                    emp.UAN || "-",
                    emp.WorkingDays || 0,
                    emp.TotalGross || 0,
                    pfWage,
                    pfWage,
                    pfWage,
                    emp.EPF,
                    emp.EPS,
                    emp.Diff,
                    emp.NCPDays || 0,
                    emp.RefundOfAdvances || 0,
                ];

                csvContent += row.join(",") + "\n";
            });
        csvContent += "\n";

        const totalRow = [
            "TOTAL",     // S.No
            "",          // Employee Code
            "",          // Employee Name
            "",          // Designation
            "",          // UAN
            "",          // Working Days (optional total)
            totalGross,  // Gross Wages
            totalPFWage, // EPF Wages
            totalPFWage, // EPS Wages
            totalPFWage, // EDLI Wages
            total12,     // EPF Contri
            total833,    // EPS Contri
            total12 - total833, // EPF EPS Diff
            "",          // NCP Days
            ""           // Refund of Advances
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
            `PF_Report_${selectedUnitName}_${monthName}_${year}.csv`
        );

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportTxt = () => {
        if (!selectedMonth || !employees.length) return;

        let txtContent = "";

        employees
            .filter(emp => emp.EPF > 0)
            .forEach((emp) => {
                const pfWage = emp.PFWage;

                const row = [
                    emp.UAN || "0",
                    emp.FacilityMemberName || "",
                    emp.TotalGross || 0,
                    pfWage,
                    pfWage,
                    pfWage,
                    emp.EPF || 0,
                    emp.EPS || 0,
                    emp.Diff || 0,
                    emp.NCPDays || 0,
                    emp.RefundOfAdvances || 0
                ];

                txtContent += row.join("#~#") + "\n";
            });

        const blob = new Blob([txtContent], {
            type: "text/plain;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        const selectedUnitName =
            propertyList.find(p => p.PropertyId === selectedPropertyId)?.PropertyName || "AllUnits";

        const safeUnitName = selectedUnitName.replace(/\s+/g, "_");

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        link.setAttribute(
            "download",
            `${safeUnitName}_PF_Report_${monthName}_${year}.txt`
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

            {/* Month Selector & Export Button & Txt Button */}
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

                {/* Right Side - Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        className="btn btn-success"
                        onClick={handleExport}
                        disabled={!selectedMonth || !employees.length}
                    >
                        Export PF
                    </button>

                    <button
                        className="btn btn-primary"
                        onClick={handleExportTxt}
                        disabled={!selectedMonth || !employees.length}
                    >
                        Export TXT
                    </button>
                </div>
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
                            <th>UAN</th>
                            <th>Working Days</th>
                            <th>Gross Wages</th>
                            <th>EPF Wages</th>
                            <th>EPS Wages</th>
                            <th>EDLI Wages</th>
                            <th>EPF Contri Remitted</th>
                            <th>EPS Contri Remitted</th>
                            <th>EPF EPS Diff Remitted</th>
                            <th>NCP Days</th>
                            <th>Refund of Advances</th>
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
                            employees
                                .filter(emp => emp.EPF > 0)
                                .map((emp, index) => {
                                    const pfWage = emp.PFWage;
                                    return (
                                        <tr key={emp.FacilityMemberId}>
                                            <td>{index + 1}</td>
                                            <td>{emp.EmployeeCode || "-"}</td>
                                            <td>{emp.FacilityMemberName || "-"}</td>
                                            <td>{emp.Designation || "-"}</td>
                                            <td>{emp.UAN || "-"}</td>
                                            <td>{emp.WorkingDays}</td>
                                            <td>{emp.TotalGross}</td>
                                            <td>{pfWage}</td>
                                            <td>{pfWage}</td>
                                            <td>{pfWage}</td>
                                            <td>{emp.EPF}</td>
                                            <td>{emp.EPS}</td>
                                            <td>{emp.Diff}</td>
                                            <td>{emp.NCPDays || 0}</td>
                                            <td>{emp.RefundOfAdvances || 0}</td>
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