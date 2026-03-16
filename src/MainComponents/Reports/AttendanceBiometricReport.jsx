"use client";

import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";
import * as XLSX from "xlsx";

import { fetchDevices, fetchDeviceLogs, fetchDeviceLogsinBetween } from "../../Services/ReportService";

const AttendanceBiometricReport = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedDeviceName, setSelectedDeviceName] = useState("");
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        const loadDevices = async () => {
            try {
                const data = await fetchDevices();

                const mapped = data.map((d) => ({
                    label: d.DeviceName,
                    value: d.DeviceId,
                }));

                setDevices(mapped);
            } catch (error) {
                console.error(error);
            }
        };

        loadDevices();
    }, []);

    // ================= FORMAT DATE =================
    const formatDate = (date) => {
        if (!date) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // ================= LOAD LOGS =================
    const handleSearch = async () => {
        if (!selectedDevice || !fromDate || !toDate) return;

        try {
            setLoading(true);

            const data = await fetchDeviceLogsinBetween(
                selectedDevice,
                formatDate(fromDate),
                formatDate(toDate)
            );

            // Add DeviceName in each row
            const enriched = data.map((row) => ({
                DeviceName: selectedDeviceName,
                ...row,
            }));

            setLogs(enriched);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ================= DOWNLOAD EXCEL =================
    const downloadExcel = () => {
        if (!logs.length) return;

        const worksheet = XLSX.utils.json_to_sheet(logs);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Device Logs");

        XLSX.writeFile(
            workbook,
            `Device_${selectedDeviceName}_${formatDate(fromDate)}_${formatDate(toDate)}.xlsx`
        );
    };

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">

                    {/* HEADER WITH BUTTON */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="m-0">Attendance Biometric Report</h3>

                        <Button
                            label="Download Excel"
                            icon="pi pi-file-excel"
                            className="p-button-success"
                            onClick={downloadExcel}
                            disabled={!logs.length}
                        />
                    </div>

                    {/* WHITE WRAPPER */}
                    <Card className="mb-4">

                        {/* FILTERS */}
                        <div className="row align-items-end mb-4">
                            <div className="col-md-4">
                                <label>Device</label>
                                <Dropdown
                                    value={selectedDevice}
                                    options={devices}
                                    onChange={(e) => {
                                        setSelectedDevice(e.value);
                                        const selected = devices.find(d => d.value === e.value);
                                        setSelectedDeviceName(selected?.label || "");
                                    }}
                                    placeholder="Select Device"
                                    className="w-100"
                                />
                            </div>

                            <div className="col-md-4">
                                <label>From Date</label>
                                <Calendar
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.value)}
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    className="w-100"
                                />
                            </div>

<div className="col-md-4">
                                <label>To Date</label>
                                <Calendar
                                    value={toDate}
                                    onChange={(e) => setToDate(e.value)}
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    className="w-100"
                                />
                            </div>
                            <div className="col-md-4">
                                <Button
                                    label="Search"
                                    icon="pi pi-search"
                                    className="p-button-primary"
                                    onClick={handleSearch}
                                />
                            </div>
                        </div>

                        {/* LOADING */}
                        {loading && (
                            <div className="d-flex justify-content-center mt-4">
                                <ProgressSpinner />
                            </div>
                        )}

                        {/* TABLE */}
                        {!loading && logs.length > 0 && (
                            <DataTable
                                value={logs}
                                paginator
                                rows={10}
                                stripedRows
                                showGridlines
                                responsiveLayout="scroll"
                            >
                                <Column field="DeviceName" header="Device Name" />
                                <Column field="EmployeeCode" header="Employee Code" />
                                <Column field="LogDate" header="Log Date" />
                                <Column field="MinTime" header="Min Time" />
                                <Column field="MaxTime" header="Max Time" />
                            </DataTable>
                        )}
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default AttendanceBiometricReport;