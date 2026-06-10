import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { getBankTransferEmployees } from "../../Services/PayrollService";

export default function BankTransfer() {
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!propertyId || !month || !year) {
            setData([]);
            return;
        }

        try {
            setLoading(true);

            const res = await getBankTransferEmployees({
                propertyId,
                month,
                year,
            });

            setData(res);
        } catch (err) {
            console.error(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [propertyId, month, year]);

    const handleDownloadExcel = () => {
        if (!data.length) {
            alert("No data to export");
            return;
        }

        const formattedData = data.map((emp, index) => ({
            "Employee Code": emp.EmployeeCode || "",
            "Employee Name as per Bank Records": emp.EmployeeName || "",
            "Father's Name": emp.FatherName || "",
            "Account number": emp.BankAccountNumber || "",
            "IFSC Code": emp.IFSCCode || "",
            "Mobile Number": emp.PhoneNumber || "",
            "PAN Number": emp.PANNumber || "",
            "Amount": emp.GeneratedAmount || 0,
            "Additional Notes": "",
            "Client Code": emp.ClientName || "",
            "Onboard At": "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Bank Transfer");

        XLSX.writeFile(workbook, `Bank_Transfer_${month}_${year}.xlsx`);
    };

    return (
        <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
            <div
                className="card"
                style={{
                    maxWidth: 1400,
                    margin: "0 auto",
                    borderRadius: 10,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    padding: "20px 30px",
                    background: "#f7fafc",
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 15,
                    }}
                >
                    <h2 style={{ fontWeight: "bold", color: "#2a4365", margin: 0 }}>
                        Bank Transfer
                    </h2>

                    <button
                        className="btn btn-success"
                        style={{
                            padding: "8px 18px",
                            fontSize: 14,
                            fontWeight: 500,
                            borderRadius: 6,
                        }}
                        onClick={handleDownloadExcel}
                    >
                        Download Excel
                    </button>
                </div>

                {/* FILTERS */}
                <div style={{ display: "flex", gap: 25, marginBottom: 20 }}>
                    <div style={{ width: 200 }}>
                        <label>Month</label>
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

                    <div style={{ width: 160 }}>
                        <label>Year</label>
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

                {loading && <div>Loading...</div>}

                {/* TABLE */}
                <div style={{ overflowX: "auto" }}>
                    <table className="table table-bordered" style={{ background: "#fff" }}>
                        <thead style={{ background: "#edf2f7" }}>
                            <tr>
                                <th>S.No</th>
                                <th>Employee Code</th>
                                <th>Employee Name</th>
                                <th>Father's Name</th>
                                <th>Account Number</th>
                                <th>IFSC Code</th>
                                <th>Mobile Number</th>
                                <th>PAN Number</th>
                                <th>Amount</th>
                                <th>Additional Notes</th>
                                <th>Client Code</th>
                                <th>Onboard At</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={12} style={{ textAlign: "center" }}>
                                        No Data Available
                                    </td>
                                </tr>
                            ) : (
                                data.map((emp, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{emp.EmployeeCode}</td>
                                        <td>{emp.EmployeeName}</td>
                                        <td>{emp.FatherName}</td>
                                        <td>{emp.BankAccountNumber}</td>
                                        <td>{emp.IFSCCode}</td>
                                        <td>{emp.PhoneNumber}</td>
                                        <td>{emp.PANNumber}</td>
                                        <td style={{ fontWeight: "bold" }}>
                                            ₹ {emp.GeneratedAmount}
                                        </td>

                                        {/* empty columns (as you asked) */}
                                        <td></td>
                                        <td>{emp.ClientName}</td>

                                        <td></td>
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