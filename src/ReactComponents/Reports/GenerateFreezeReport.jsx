import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getEmployeeStatus } from "../../Services/PayrollService";
import { getAllProperties } from "../../Services/PropertyService";
import { getAllClients } from "../../Services/ClientService";

export default function GenerateFreezeReport() {
    const reduxPropertyId = useSelector(
        (state) => state.Commonreducer.puidn
    );

    const [selectedMonth, setSelectedMonth] = useState("");
    const [generationType, setGenerationType] = useState("");
    const [freezeType, setFreezeType] = useState("");

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    const [propertyList, setPropertyList] = useState([]);
    const [clientList, setClientList] = useState([]);

    const [propertyName, setPropertyName] = useState("");
    const [clientName, setClientName] = useState("");

    useEffect(() => {
        const loadData = async () => {
            if (!selectedMonth || !reduxPropertyId) {
                setEmployees([]);
                return;
            }

            try {
                setLoading(true);

                const [year, month] = selectedMonth.split("-");
                const monthName = new Date(year, month - 1).toLocaleString("default", {
                    month: "long",
                });

                const data = await getEmployeeStatus(
                    reduxPropertyId,
                    monthName,
                    Number(year),
                    generationType || null,
                    freezeType || null
                );

                setEmployees(data);
            } catch (err) {
                console.error("Fetch failed", err);
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedMonth, reduxPropertyId, generationType, freezeType]);

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [properties, clients] = await Promise.all([
                    getAllProperties(),
                    getAllClients(),
                ]);

                setPropertyList(properties || []);
                setClientList(clients || []);
            } catch (err) {
                console.error("Meta fetch failed", err);
            }
        };

        loadMeta();
    }, []);

    useEffect(() => {
        if (!propertyList.length || !clientList.length || !reduxPropertyId) return;

        // 🔥 Property Name
        const prop = propertyList.find(
            (p) => Number(p.PropertyId) === Number(reduxPropertyId)
        );

        setPropertyName(prop?.Name || "");

        // 🔥 Client Name
        const client = clientList.find(
            (c) => Number(c.ClientID) === Number(prop?.ClientID)
        );

        setClientName(client?.ClientName || "");

    }, [propertyList, clientList, reduxPropertyId]);

    const handleExport = () => {
        if (!employees.length || !selectedMonth) return;

        const [year, month] = selectedMonth.split("-");
        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        let csv = "";

        // 🔥 HEADER
        csv += `Generate & Freeze Report\n`;
        csv += `Client: ${clientName}\n`;
        csv += `Property: ${propertyName}\n`;
        csv += `Month: ${monthName} ${year}\n\n`;

        // 🔥 TABLE HEADERS
        const headers = [
            "S.No",
            "Employee Code",
            "Employee Name",
            "Father Name",
            "Generated",
            "Freezed",
            "Generated On",
            "Freezed On",
        ];

        csv += headers.join(",") + "\n";

        // 🔥 DATA
        employees.forEach((emp, index) => {
            const row = [
                index + 1,
                emp.EmployeeCode || "-",
                emp.EmployeeName || "-",
                emp.FatherName || "-",
                emp.IsGenerated ? "Yes" : "No",
                emp.IsFreezed ? "Yes" : "No",
                emp.CreatedOn
                    ? new Date(emp.CreatedOn).toLocaleDateString()
                    : "-",
                emp.FreezedOn
                    ? new Date(emp.FreezedOn).toLocaleDateString()
                    : "-",
            ];

            csv += row.join(",") + "\n";
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute(
            "download",
            `Generate_Freeze_${propertyName}_${monthName}_${year}.csv`
        );

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                Generate & Freeze Report
            </h3>

            {/* Filters */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 20,
                    marginBottom: 20,
                }}
            >

                {/* LEFT SIDE FILTERS */}
                <div style={{ display: "flex", gap: 20 }}>

                    {/* Month */}
                    <div>
                        <label>Select Month</label>
                        <input
                            type="month"
                            className="form-control"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    {/* Generation */}
                    <div>
                        <label>Generation</label>
                        <select
                            className="form-control"
                            value={generationType}
                            onChange={(e) => setGenerationType(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="Generated">Generated</option>
                            <option value="Ungenerated">Ungenerated</option>
                        </select>
                    </div>

                    {/* Freeze */}
                    <div>
                        <label>Freeze</label>
                        <select
                            className="form-control"
                            value={freezeType}
                            onChange={(e) => setFreezeType(e.target.value)}
                        >
                            <option value="">All</option>
                            <option value="Freezed">Freezed</option>
                            <option value="Unfreezed">Unfreezed</option>
                        </select>
                    </div>

                </div>

                {/* RIGHT SIDE BUTTON */}
                <div style={{ marginLeft: "auto" }}>
                    <button
                        className="btn btn-success"
                        onClick={handleExport}
                        disabled={!employees.length}
                        style={{
                            height: 38,
                            padding: "0 20px",
                            fontWeight: 500,
                        }}
                    >
                        Export Excel
                    </button>
                </div>

            </div>

            {loading && <div>Loading...</div>}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Emp Code</th>
                            <th>Name</th>
                            <th>Father Name</th>
                            <th>Generated</th>
                            <th>Freezed</th>
                            <th>Generated On</th>
                            <th>Freezed On</th>
                        </tr>
                    </thead>

                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center" }}>
                                    Select filters to load data
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp, index) => (
                                <tr key={emp.EmployeeId}>
                                    <td>{index + 1}</td>
                                    <td>{emp.EmployeeCode}</td>
                                    <td>{emp.EmployeeName}</td>
                                    <td>{emp.FatherName}</td>
                                    <td>{emp.IsGenerated ? "Yes" : "No"}</td>
                                    <td>{emp.IsFreezed ? "Yes" : "No"}</td>
                                    <td>
                                        {emp.CreatedOn
                                            ? new Date(emp.CreatedOn).toLocaleDateString()
                                            : "-"}
                                    </td>
                                    <td>
                                        {emp.FreezedOn
                                            ? new Date(emp.FreezedOn).toLocaleDateString()
                                            : "-"}
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