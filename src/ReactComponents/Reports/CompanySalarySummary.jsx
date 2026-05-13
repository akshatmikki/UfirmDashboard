import React, { useState, useEffect } from "react";
import { getCompanySalarySummary } from "../../Services/PayrollService";
import { getAllProperties } from "../../Services/PropertyService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function CompanySalarySummary() {
    const [selectedMonth, setSelectedMonth] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [propertyList, setPropertyList] = useState([]);
    const [pendingUnits, setPendingUnits] = useState([]);

    // 🔹 Load Properties
    useEffect(() => {
        const loadProperties = async () => {
            try {
                const res = await getAllProperties();
                setPropertyList(res || []);
            } catch (err) {
                console.error("Property fetch failed", err);
            }
        };
        loadProperties();
    }, []);

    // 🔹 Fetch Summary
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                if (!selectedMonth) {
                    setData([]);
                    return;
                }

                setLoading(true);

                const [year, month] = selectedMonth.split("-");
                const monthName = new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                });

                const result = await getCompanySalarySummary(monthName, Number(year));

                const mappedData = (result || [])
                    .map((item) => {
                        const property = propertyList.find(
                            (p) => p.PropertyId === item.OfficeId
                        );

                        return {
                            ...item,
                            UnitName: property?.Name || "Unknown Unit",
                        };
                    })
                    .filter(
                        (item) =>
                            !item.UnitName?.toLowerCase().includes("test") &&
                            !item.UnitName?.toLowerCase().includes("demo")
                    );

                const generatedIds = mappedData.map((d) => d.OfficeId);

                const pending = propertyList
                    .filter(
                        (p) =>
                            !generatedIds.includes(p.PropertyId) &&
                            !p.Name?.toLowerCase().includes("test") &&
                            !p.Name?.toLowerCase().includes("demo")
                    )
                    .map((p) => ({
                        PropertyId: p.PropertyId,
                        Name: p.Name,
                        Address: `${(p.AddressLine1 || "").replace(/"/g, "")}, ${p.State || ""
                            }`,
                    }));

                setData(mappedData);
                setPendingUnits(pending);
            } catch (err) {
                console.error("Summary fetch failed", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [selectedMonth, propertyList]);

    // 🔹 Format numbers
    const format = (num) =>
        num ? Number(num).toLocaleString("en-IN") : "0";

    const handleDownloadPDF = () => {
        if (!selectedMonth || data.length === 0) return;

        const doc = new jsPDF("landscape");

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        // 🔹 HEADER
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("UFIRM TECHNOLOGIES PVT. LTD.", 14, 15);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("H-64, SEC-63", 14, 22);
        doc.text("NOIDA, UP", 14, 27);

        doc.setFontSize(12);
        doc.text(
            `Salary Summary for the month of ${monthName} ${year}`,
            14,
            35
        );

        // 🔹 TABLE HEAD
        const tableColumn = [
            "S.No",
            "Unit Code",
            "Unit Name",
            "PF Wage",
            "ESI Wage",
            "Gross Earn",
            "PF (13%)",
            "ESI (3.25%)",
            "Total CTC",
            "PF (12%)",
            "ESI (0.75%)",
            "LWF",
            "PTax",
            "Adv",
            "Unf",
            "Food",
            "Maint.",
            "Fine",
            "Other Ded",
            "Total Deduction",
            "Net Salary",
        ];

        const totals = data.reduce(
            (acc, item) => {
                const pfWage = item.TotalPFVariableSum || 0;
                const esiWage = item.TotalESIVariableSum || 0;
                const gross = item.TotalEarning || 0;

                const pf13 = Math.round(pfWage * 0.13);
                const esi325 = Math.ceil(esiWage * 0.0325);

                const totalCTC = gross + pf13 + esi325;

                acc.pfWage += pfWage;
                acc.esiWage += esiWage;
                acc.gross += gross;
                acc.pf13 += pf13;
                acc.esi325 += esi325;
                acc.ctc += totalCTC;

                acc.pf12 += item.TotalPF || 0;
                acc.esi075 += item.TotalESI || 0;
                acc.lwf += item.TotalLWF || 0;
                acc.ptax += item.TotalPFT || 0;
                acc.adv += item.TotalAdvance || 0;
                acc.unf += item.TotalUniform || 0;
                acc.food += item.TotalFood || 0;
                acc.maint += item.TotalMaintenance || 0;
                acc.fine += item.TotalFine || 0;
                acc.other += item.TotalOthDed || 0;

                acc.totalDeduction += item.TotalDeduction || 0;
                acc.net += item.TotalGeneratedAmount || 0;

                return acc;
            },
            {
                pfWage: 0,
                esiWage: 0,
                gross: 0,
                pf13: 0,
                esi325: 0,
                ctc: 0,
                pf12: 0,
                esi075: 0,
                lwf: 0,
                ptax: 0,
                adv: 0,
                unf: 0,
                food: 0,
                maint: 0,
                fine: 0,
                other: 0,
                totalDeduction: 0,
                net: 0,
            }
        );

        // 🔹 TABLE DATA
        const tableRows = data.map((item, index) => {
            const pfWage = item.TotalPFVariableSum || 0;
            const esiWage = item.TotalESIVariableSum || 0;
            const gross = item.TotalEarning || 0;

            const pf13 = Math.round(pfWage * 0.13);
            const esi325 = Math.ceil(esiWage * 0.0325);

            const totalCTC = gross + pf13 + esi325;

            const pf12 = item.TotalPF || 0;
            const esi075 = item.TotalESI || 0;

            const lwf = item.TotalLWF || 0;
            const ptax = item.TotalPFT || 0;
            const adv = item.TotalAdvance || 0;
            const unf = item.TotalUniform || 0;
            const food = item.TotalFood || 0;
            const maint = item.TotalMaintenance || 0;
            const fine = item.TotalFine || 0;
            const other = item.TotalOthDed || 0;

            const totalDeduction = item.TotalDeduction || 0;

            const net = item.TotalGeneratedAmount || 0;

            return [
                index + 1,
                item.OfficeId,
                item.UnitName,
                pfWage,
                esiWage,
                gross,
                pf13,
                esi325,
                totalCTC,
                pf12,
                esi075,
                lwf,
                ptax,
                adv,
                unf,
                food,
                maint,
                fine,
                other,
                totalDeduction,
                net,
            ];
        });

        tableRows.push([
            "Total",
            "",
            "",
            totals.pfWage,
            totals.esiWage,
            totals.gross,
            totals.pf13,
            totals.esi325,
            totals.ctc,
            totals.pf12,
            totals.esi075,
            totals.lwf,
            totals.ptax,
            totals.adv,
            totals.unf,
            totals.food,
            totals.maint,
            totals.fine,
            totals.other,
            totals.totalDeduction,
            totals.net,
        ]);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            styles: {
                fontSize: 7,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [230, 230, 230],
            },
            didParseCell: function (data) {
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            },
        });

        doc.save(`Unit_Wise_Salary_Summary_${monthName}_${year}.pdf`);
    };

    const handlePendingPDF = () => {
        if (!selectedMonth || pendingUnits.length === 0) return;

        const doc = new jsPDF("portrait");

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        // HEADER
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Ufirm Technologies Pvt. Ltd.", 14, 15);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("H-64, Sec-63", 14, 22);
        doc.text("Noida, UP", 14, 27);

        doc.setFontSize(11);
        doc.text(
            `Salary are not created of the unit(s) for the month of ${monthName} ${year}`,
            14,
            35
        );

        // TABLE
        const tableColumn = ["SrNo.", "Unitcode", "UnitName", "Location", "Status"];

        const tableRows = pendingUnits.map((item, index) => [
            index + 1,
            item.PropertyId,
            item.Name,
            item.Address,
            "ACTIVE",
        ]);

        autoTable(doc, {
            startY: 40,
            head: [tableColumn],
            body: tableRows,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [220, 220, 220],
            },
        });

        doc.save(`Pending_Units_${monthName}_${year}.pdf`);
    };

    return (
        <div
            style={{
                maxWidth: 1550,
                margin: "20px auto",
                padding: "25px 30px",
                borderRadius: 14,
                background: "#f4f7fb",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 25,
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontWeight: 700 }}>
                        Company Salary Summary
                    </h2>
                    <span style={{ fontSize: 13, color: "#718096" }}>
                        Overview of all units
                    </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 200 }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />

                    <button
                        className="btn btn-success"
                        onClick={handleDownloadPDF}
                        disabled={!data.length}
                    >
                        Download PDF
                    </button>

                    <button
                        className="btn btn-danger"
                        onClick={handlePendingPDF}
                        disabled={!pendingUnits.length}
                    >
                        Pending Units PDF
                    </button>
                </div>
            </div>

            {loading && <div style={{ marginBottom: 10 }}>Loading data...</div>}

            {/* MAIN TABLE */}
            <div style={{ overflowX: "auto" }}>
                <table
                    className="table"
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        overflow: "hidden",
                    }}
                >
                    <thead style={{ background: "#edf2f7" }}>
                        <tr>
                            <th>Unit</th>
                            <th>Gross</th>
                            <th>Earning</th>
                            <th>Deduction</th>
                            <th>Net</th>
                            <th>PF Wage</th>
                            <th>ESI Wage</th>
                            <th>PF</th>
                            <th>ESI</th>
                            <th>LWF</th>
                            <th>PFT</th>
                            <th>Advance</th>
                            <th>Food</th>
                            <th>Maintenance</th>
                            <th>Uniform</th>
                            <th>Fine</th>
                            <th>Other Ded</th>
                            <th>OT</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="18" style={{ textAlign: "center", padding: 20 }}>
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: 600 }}>{item.UnitName}</td>

                                    <td style={{ textAlign: "right" }}>{format(item.TotalGross)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalEarning)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalDeduction)}</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                                        {format(item.TotalGeneratedAmount)}
                                    </td>

                                    <td style={{ textAlign: "right" }}>{format(item.TotalPFVariableSum)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalESIVariableSum)}</td>

                                    <td style={{ textAlign: "right" }}>{format(item.TotalPF)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalESI)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalLWF)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalPFT)}</td>

                                    <td style={{ textAlign: "right" }}>{format(item.TotalAdvance)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalFood)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalMaintenance)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalUniform)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalFine)}</td>
                                    <td style={{ textAlign: "right" }}>{format(item.TotalOthDed)}</td>

                                    <td style={{ textAlign: "right" }}>{format(item.TotalOTAmount)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PENDING SECTION */}
            {pendingUnits.length > 0 && (
                <div
                    style={{
                        marginTop: 35,
                        padding: 20,
                        borderRadius: 12,
                        background: "#fff5f5",
                        border: "1px solid #fed7d7",
                    }}
                >
                    <h4 style={{ color: "#e53e3e", marginBottom: 15 }}>
                        ⚠ Pending Salary Units
                    </h4>

                    <table className="table">
                        <thead style={{ background: "#fed7d7" }}>
                            <tr>
                                <th>S.No</th>
                                <th>ID</th>
                                <th>Unit Name</th>
                                <th>Address</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pendingUnits.map((unit, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{unit.PropertyId}</td>
                                    <td style={{ fontWeight: 600 }}>{unit.Name}</td>
                                    <td>{unit.Address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}