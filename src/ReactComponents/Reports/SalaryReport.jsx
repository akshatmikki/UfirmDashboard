import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import {
    getAllClients,
    getClientByPropertyId,
    getPropertiesByClientId,
} from "../../Services/ClientService";

import { getFacilityMemberSalaryDetailsByClientBranch } from "../../Services/PayrollService";
import { generateWageSheetPDF } from "./WageSheetPDF";
import { generateWageSheetExcel } from "./WageSheetExcel";

export default function SalaryReport() {
    const reduxPropertyId = useSelector(
        (state) => state.Commonreducer.puidn
    );
    const reduxClientId = useSelector((state) => state.Commonreducer.companyid);

    const [unitList, setUnitList] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    const [propertyList, setPropertyList] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState("");

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    const [logoBase64, setLogoBase64] = useState("");
    const [departmentList, setDepartmentList] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");

    const filteredEmployees = employees.filter((emp) =>
        selectedDepartment
            ? (emp.Department || "").toLowerCase() === selectedDepartment.toLowerCase()
            : true
    );

    // ================================
    // LOAD CLIENTS
    // ================================
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
                console.log("Client load failed", err);
            }
        };

        loadUnits();
    }, [reduxPropertyId, reduxClientId]);

    // ================================
    // LOAD PROPERTIES / UNITS
    // ================================
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
                console.log("Property load failed", err);
            }
        };

        loadProperties();
    }, [selectedUnitId, reduxPropertyId]);

    // ================================
    // FETCH SALARY REPORT DATA
    // ================================
    useEffect(() => {
        const loadSalaryReport = async () => {
            try {
                const propertyIds =
                    Number(selectedPropertyId) > 0
                        ? [Number(selectedPropertyId)]
                        : (propertyList || [])
                            .map((p) => Number(p.PropertyId))
                            .filter((id) => Number.isFinite(id) && id > 0);

                if (!selectedUnitId || !selectedMonth || propertyIds.length === 0) {
                    setEmployees([]);
                    setDepartmentList([]);
                    setSelectedDepartment("");
                    return;
                }

                setLoading(true);

                const [year, month] = selectedMonth.split("-");

                const monthName = new Date(year, month - 1).toLocaleString(
                    "default",
                    { month: "long" }
                );

                const data = await getFacilityMemberSalaryDetailsByClientBranch({
                    clientId: selectedUnitId,
                    propertyIds: propertyIds.join(","),
                    month: monthName,
                    year: Number(year),
                    requireGeneratedSalary: true,
                });

                const flat = Array.isArray(data) ? data : [];
                setEmployees(flat);

                // extract unique departments
                const departments = [
                    ...new Set(
                        flat
                            .map((e) => e.Department)
                            .filter((d) => d && d.trim() !== "")
                    ),
                ];

                setDepartmentList(departments);
            } catch (err) {
                console.log("Salary report fetch failed", err);
                setEmployees([]);
                setDepartmentList([]);
                setSelectedDepartment("");
            } finally {
                setLoading(false);
            }
        };

        loadSalaryReport();
    }, [selectedUnitId, selectedPropertyId, selectedMonth, propertyList]);

    useEffect(() => {
        loadImageAsBase64("/Assets/Urest-logo.png")
            .then(setLogoBase64)
            .catch(() => console.log("Logo load failed"));
    }, []);

    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return `₹${num.toLocaleString("en-IN")}`;
    };

    const totals = filteredEmployees.reduce(
        (acc, emp) => {
            acc.basic += emp.Basic || 0;
            acc.hra += emp.HRA || 0;
            acc.conv += emp.CONV || 0;
            acc.ot += emp.OTAmount || 0;
            acc.allowance += emp.TotalAllowance || 0;
            acc.pf += emp.PF || 0;
            acc.esi += emp.ESI || 0;
            acc.lwf += emp.LwfEmployeeAmount || 0;
            acc.deduction += emp.TotalDeduction || 0;
            acc.net += emp.NetSalary || 0;
            return acc;
        },
        {
            basic: 0,
            hra: 0,
            conv: 0,
            ot: 0,
            allowance: 0,
            pf: 0,
            esi: 0,
            lwf: 0,
            deduction: 0,
            net: 0,
        }
    );

    const exportExcelNew = () => {
        const selectedProperty = propertyList.find(
            p => p.PropertyId === selectedPropertyId
        );

        const [year, monthNum] = selectedMonth.split("-");

        // go to previous month
        const date = new Date(year, monthNum - 1);
        date.setMonth(date.getMonth() - 1);

        const monthName = date.toLocaleString("default", { month: "long" });
        const displayYear = date.getFullYear();

        const filters = {
            unitName: selectedProperty?.PropertyName || "",
            month: `${monthName} - ${displayYear}`,
        };

        generateWageSheetExcel(filteredEmployees, filters, false);
    };

    const exportPDF = async () => {
        if (!logoBase64) return;
        const selectedProperty = propertyList.find(p => p.PropertyId === selectedPropertyId);

        const [year, monthNum] = selectedMonth.split("-");

        // go to previous month
        const date = new Date(year, monthNum - 1);
        date.setMonth(date.getMonth() - 1);

        const monthName = date.toLocaleString("default", { month: "long" });
        const displayYear = date.getFullYear();

        const filters = {
            unitName: selectedProperty?.PropertyName || "",
            month: `${monthName} - ${displayYear}`,
            logo: logoBase64 // 👈 USE STATE (NOT loading again)
        };

        generateWageSheetPDF(filteredEmployees, filters, false);
    };

    const viewPDF = async () => {
        try {
            if (!logoBase64) return;
            const selectedProperty = propertyList.find(
                p => p.PropertyId === selectedPropertyId
            );

            const [year, monthNum] = selectedMonth.split("-");

            // go to previous month
            const date = new Date(year, monthNum - 1);
            date.setMonth(date.getMonth() - 1);

            const monthName = date.toLocaleString("default", { month: "long" });
            const displayYear = date.getFullYear();

            const filters = {
                unitName: selectedProperty?.PropertyName || "",
                month: `${monthName} - ${displayYear}`,
                logo: logoBase64 // 👈 USE STATE
            };

            const url = generateWageSheetPDF(filteredEmployees, filters, true);
            window.open(url);

        } catch (err) {
            console.error("PDF error:", err);
        }
    };

    const loadImageAsBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                resolve(canvas.toDataURL("image/png"));
            };

            img.onerror = reject;
        });
    };

    return (
        <div
            className="card"
            style={{
                maxWidth: 1600,
                margin: "20px auto",
                borderRadius: 10,
                padding: "20px 30px",
                background: "#f7fafc",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
        >
            <h3 style={{ fontWeight: "bold", color: "#2a4365" }}>
                Salary Report
            </h3>

            {/* ================= CLIENT + UNIT ================= */}

            <div
                style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "center",
                    padding: "10px 14px",
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

                            setEmployees([]);
                            setDepartmentList([]);
                            setSelectedDepartment("");
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
                            setDepartmentList([]);
                            setSelectedDepartment("");
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
                {/* Department */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label style={{ fontWeight: 600 }}>Department :</label>

                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        style={{ width: 240 }}
                    >
                        <option value="">All Departments</option>

                        {departmentList.map((dep, index) => (
                            <option key={index} value={dep}>
                                {dep}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ================= MONTH SELECTOR ================= */}

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <label style={{ fontWeight: 600 }}>Select Month :</label>

                <input
                    type="month"
                    className="form-control"
                    style={{ width: 200 }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>

                <button
                    className="btn btn-success"
                    onClick={exportExcelNew}
                    disabled={!employees.length}
                >
                    Download Excel
                </button>

                <button
                    className="btn btn-danger"
                    onClick={exportPDF}
                    disabled={!employees.length}
                >
                    Download PDF
                </button>

                <button
                    className="btn btn-primary"
                    onClick={viewPDF}
                    disabled={!employees.length}
                >
                    Preview PDF
                </button>

            </div>

            {loading && <div>Loading Salary Data...</div>}

            {/* ================= TABLE (TEMP PLACEHOLDER) ================= */}

            <div style={{ overflow: "auto", maxHeight: 500 }}>
                <style>
                    {`
.salary-table thead th {
  position: sticky;
  top: 0;
  background: #edf2f7;
  z-index: 2;
}
`}
                </style>
                <table className="table table-bordered salary-table">
                    <thead style={{ background: "#edf2f7" }}>
                        <tr>
                            <th>S.No</th>
                            <th>Employee</th>
                            <th>Designation</th>
                            <th>Working Days</th>

                            <th>Basic</th>
                            <th>HRA</th>
                            <th>Conveyance</th>
                            <th>OT</th>

                            <th>Total Allowance</th>

                            <th>PF</th>
                            <th>ESI</th>
                            <th>LWF</th>

                            <th>Total Deduction</th>
                            <th>Net Salary</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredEmployees.length === 0 ? (
                            <tr>
                                <td colSpan="14" style={{ textAlign: "center" }}>
                                    Select client and month
                                </td>
                            </tr>
                        ) : (
                            <>
                                {filteredEmployees.map((emp, index) => (
                                    <tr key={emp.FacilityMemberId}>
                                        <td>{index + 1}</td>

                                        <td>{emp.FacilityMemberName || "-"}</td>

                                        <td>{emp.Designation || "-"}</td>

                                        <td>{emp.WorkingDays || 0}</td>

                                        <td>{formatCurrency(emp.Basic)}</td>

                                        <td>{formatCurrency(emp.HRA)}</td>

                                        <td>{formatCurrency(emp.CONV)}</td>

                                        <td>{formatCurrency(emp.OTAmount)}</td>

                                        <td>{formatCurrency(emp.TotalAllowance)}</td>

                                        <td>{formatCurrency(emp.PF)}</td>

                                        <td>{formatCurrency(emp.ESI)}</td>

                                        <td>{formatCurrency(emp.LwfEmployeeAmount)}</td>

                                        <td>{formatCurrency(emp.TotalDeduction)}</td>

                                        <td style={{ fontWeight: "bold" }}>
                                            {formatCurrency(emp.NetSalary)}
                                        </td>
                                    </tr>
                                ))}

                                {/* TOTAL ROW */}

                                <tr style={{ background: "#f1f5f9", fontWeight: "bold" }}>
                                    <td colSpan="4" style={{ textAlign: "right" }}>
                                        TOTAL
                                    </td>

                                    <td>{formatCurrency(totals.basic)}</td>

                                    <td>{formatCurrency(totals.hra)}</td>

                                    <td>{formatCurrency(totals.conv)}</td>

                                    <td>{formatCurrency(totals.ot)}</td>

                                    <td>{formatCurrency(totals.allowance)}</td>

                                    <td>{formatCurrency(totals.pf)}</td>

                                    <td>{formatCurrency(totals.esi)}</td>

                                    <td>{formatCurrency(totals.lwf)}</td>

                                    <td>{formatCurrency(totals.deduction)}</td>

                                    <td>{formatCurrency(totals.net)}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

