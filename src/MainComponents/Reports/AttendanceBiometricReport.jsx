"use client";

import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { Card } from "primereact/card";

import { fetchDevices, fetchDeviceLogsinBetween } from "../../Services/ReportService";

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

    const getDatesInRange = (start, end) => {
        const dates = [];
        const current = new Date(start);
        current.setHours(0, 0, 0, 0);
        const last = new Date(end);
        last.setHours(0, 0, 0, 0);

        while (current <= last) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    };

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const normalizeLogDate = (value) => {
        if (!value) return "";
        if (value instanceof Date) return formatDate(value);
        const stringValue = String(value);
        const match = stringValue.match(/\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
        const parsed = new Date(stringValue);
        return Number.isNaN(parsed.getTime()) ? "" : formatDate(parsed);
    };

    const parseTimeToMinutes = (value) => {
        if (!value) return null;
        const match = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return null;
        return Number(match[1]) * 60 + Number(match[2]);
    };

    const hasOtForDay = (dayLog) => {
        if (!dayLog?.MinTime || !dayLog?.MaxTime) return false;
        const minMinutes = parseTimeToMinutes(dayLog.MinTime);
        const maxMinutes = parseTimeToMinutes(dayLog.MaxTime);
        if (minMinutes == null || maxMinutes == null || maxMinutes <= minMinutes) return false;
        return (maxMinutes - minMinutes) >= 9 * 60;
    };

    const buildAttendanceWorkbookHtml = () => {
        const dateRange = getDatesInRange(fromDate, toDate);
        const dateKeys = new Set(dateRange.map((date) => formatDate(date)));
        const monthLabel = fromDate.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
        });

        const employeeMap = new Map();

        logs.forEach((row, index) => {
            const employeeCode = String(row?.EmployeeCode || "").trim();
            const employeeName = String(row?.EmployeeName || "").trim();
            const employeeKey = `${employeeCode}__${employeeName || index}`;
            const logDate = normalizeLogDate(row?.LogDate);

            if (!dateKeys.has(logDate)) return;

            if (!employeeMap.has(employeeKey)) {
                employeeMap.set(employeeKey, {
                    employeeCode,
                    employeeName,
                    designation: String(row?.Designation || "").trim(),
                    sortIndex: index,
                    days: {},
                });
            }

            const employee = employeeMap.get(employeeKey);
            const existingDay = employee.days[logDate];

            if (!existingDay) {
                employee.days[logDate] = {
                    MinTime: row?.MinTime || "",
                    MaxTime: row?.MaxTime || "",
                };
                return;
            }

            const existingMin = parseTimeToMinutes(existingDay.MinTime);
            const incomingMin = parseTimeToMinutes(row?.MinTime);
            const existingMax = parseTimeToMinutes(existingDay.MaxTime);
            const incomingMax = parseTimeToMinutes(row?.MaxTime);

            if (incomingMin != null && (existingMin == null || incomingMin < existingMin)) {
                existingDay.MinTime = row?.MinTime || existingDay.MinTime;
            }

            if (incomingMax != null && (existingMax == null || incomingMax > existingMax)) {
                existingDay.MaxTime = row?.MaxTime || existingDay.MaxTime;
            }
        });

        const employees = Array.from(employeeMap.values()).sort((a, b) => {
            const designationCompare = a.designation.localeCompare(b.designation);
            if (designationCompare !== 0) return designationCompare;
            const nameCompare = a.employeeName.localeCompare(b.employeeName);
            if (nameCompare !== 0) return nameCompare;
            return a.sortIndex - b.sortIndex;
        });

        const groupsMap = new Map();
        employees.forEach((employee) => {
            const groupName = employee.designation || "Others";
            if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
            groupsMap.get(groupName).push(employee);
        });

        const groups = Array.from(groupsMap.entries()).map(([name, items]) => ({
            name,
            items,
        }));

        const totalColumns = 4 + dateRange.length + 5;

        const getEmployeeMetrics = (employee) => {
            const normalWorkingDays = dateRange.length;
            let otDays = 0;
            let weeklyOffDays = 0;
            let totalAbsent = 0;
            let totalPresent = 0;

            const dayStatuses = dateRange.map((date) => {
                const dateKey = formatDate(date);
                const dayLog = employee.days[dateKey];
                const isPresent = !!dayLog;
                const isWeeklyOff = date.getDay() === 0;
                const otMark = "";

                if (isPresent) {
                    totalPresent += 1;
                    if (isWeeklyOff) weeklyOffDays += 1;
                } else {
                    totalAbsent += 1;
                }

                return {
                    presentMark: isPresent ? "P" : "A",
                    otMark,
                };
            });

            return {
                dayStatuses,
                normalWorkingDays,
                otDays,
                weeklyOffDays,
                totalAbsent,
                totalPresent: totalPresent + otDays,
            };
        };

        const groupSummaries = groups.map((group) => {
            const dayTotals = dateRange.map((date) => {
                const dateKey = formatDate(date);
                return group.items.reduce(
                    (count, employee) => count + (employee.days[dateKey] ? 1 : 0),
                    0
                );
            });

            const totals = group.items.reduce(
                (acc, employee) => {
                    const metrics = getEmployeeMetrics(employee);
                    acc.normalWorkingDays += metrics.normalWorkingDays;
                    acc.otDays += metrics.otDays;
                    acc.weeklyOffDays += metrics.weeklyOffDays;
                    acc.totalAbsent += metrics.totalAbsent;
                    acc.totalPresent += metrics.totalPresent;
                    return acc;
                },
                {
                    normalWorkingDays: 0,
                    otDays: 0,
                    weeklyOffDays: 0,
                    totalAbsent: 0,
                    totalPresent: 0,
                }
            );

            return {
                ...group,
                dayTotals,
                totals,
            };
        });

        const overallTotals = groupSummaries.reduce(
            (acc, group) => {
                acc.totalAttendance += group.totals.totalPresent;
                return acc;
            },
            { totalAttendance: 0 }
        );

        const renderSummaryRow = (label, values, totals = null) => {
            const valueCells = values
                .map(
                    (value) =>
                        `<td class="summary-cell">${escapeHtml(value || "")}</td>`
                )
                .join("");

            const totalCells = totals
                ? `
                    <td class="summary-cell">${escapeHtml(totals.normalWorkingDays)}</td>
                    <td class="summary-cell">${escapeHtml(totals.otDays)}</td>
                    <td class="summary-cell">${escapeHtml(totals.weeklyOffDays)}</td>
                    <td class="summary-cell">${escapeHtml(totals.totalAbsent)}</td>
                    <td class="summary-cell">${escapeHtml(totals.totalPresent)}</td>
                `
                : `<td class="summary-cell" colspan="5"></td>`;

            return `
                <tr>
                    <td class="summary-label" colspan="4">${escapeHtml(label)}</td>
                    ${valueCells}
                    ${totalCells}
                </tr>
            `;
        };

        const employeeRows = groupSummaries
            .map((group) => {
                const rows = group.items
                    .map((employee, index) => {
                        const metrics = getEmployeeMetrics(employee);
                        const presentCells = metrics.dayStatuses
                            .map(
                                (status) =>
                                    `<td class="body-cell">${escapeHtml(status.presentMark)}</td>`
                            )
                            .join("");
                        const otCells = metrics.dayStatuses
                            .map(
                                (status) =>
                                    `<td class="body-cell">${escapeHtml(status.otMark)}</td>`
                            )
                            .join("");

                        return `
                            <tr>
                                <td class="body-cell" rowspan="2">${escapeHtml(index + 1)}</td>
                                <td class="body-cell text-left" rowspan="2">${escapeHtml(employee.employeeName || "-")}</td>
                                <td class="body-cell" rowspan="2">${escapeHtml(employee.employeeCode || "-")}</td>
                                <td class="body-cell">P/A</td>
                                ${presentCells}
                                <td class="body-cell">${escapeHtml(metrics.normalWorkingDays)}</td>
                                <td class="body-cell">${escapeHtml(metrics.otDays)}</td>
                                <td class="body-cell">${escapeHtml(metrics.weeklyOffDays)}</td>
                                <td class="body-cell">${escapeHtml(metrics.totalAbsent)}</td>
                                <td class="body-cell">${escapeHtml(metrics.totalPresent)}</td>
                            </tr>
                            <tr>
                                <td class="body-cell">OT</td>
                                ${otCells}
                                <td class="body-cell"></td>
                                <td class="body-cell"></td>
                                <td class="body-cell"></td>
                                <td class="body-cell"></td>
                                <td class="body-cell"></td>
                            </tr>
                        `;
                    })
                    .join("");

                return `${rows}${renderSummaryRow(group.name, group.dayTotals, group.totals)}`;
            })
            .join("");

        const dayNumberHeaders = dateRange
            .map((date) => `<th class="header-cell day-cell">${date.getDate()}</th>`)
            .join("");

        const dayNameHeaders = dateRange
            .map((date) =>
                `<th class="header-cell day-cell">${date.toLocaleString("en-US", { weekday: "short" })}</th>`
            )
            .join("");

        const summaryTextRows = groupSummaries
            .map(
                (group) => `
                    <tr>
                        <td class="blank-cell" colspan="4"></td>
                        <td class="summary-text-cell" colspan="${dateRange.length + 5}">
                            ${escapeHtml(`${group.name} Attendance - ${group.totals.totalPresent}`)}
                        </td>
                    </tr>
                `
            )
            .join("");

        return `
            <html xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:x="urn:schemas-microsoft-com:office:excel"
                  xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8" />
                    <style>
                        table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; }
                        .company-title {
                            font-size: 16pt;
                            font-weight: 700;
                            text-align: center;
                            border: 1px solid #000;
                            padding: 8px;
                        }
                        .report-title {
                            background: #FFE699;
                            font-size: 13pt;
                            font-weight: 700;
                            text-align: center;
                            border: 1px solid #000;
                            padding: 8px;
                        }
                        .header-cell {
                            background: #C5E0B4;
                            border: 1px solid #000;
                            text-align: center;
                            font-weight: 700;
                            padding: 6px 4px;
                            vertical-align: middle;
                        }
                        .body-cell {
                            border: 1px solid #000;
                            text-align: center;
                            padding: 4px;
                            vertical-align: middle;
                        }
                        .text-left {
                            text-align: left;
                            padding-left: 8px;
                        }
                        .summary-label {
                            background: #5B9BD5;
                            color: #FFF;
                            font-weight: 700;
                            border: 1px solid #000;
                            text-align: left;
                            padding: 6px 8px;
                        }
                        .summary-cell {
                            background: #D9EAF7;
                            border: 1px solid #000;
                            text-align: center;
                            font-weight: 700;
                            padding: 4px;
                        }
                        .summary-text-cell {
                            border: 1px solid #000;
                            text-align: left;
                            font-weight: 700;
                            padding: 6px 8px;
                        }
                        .blank-cell {
                            border: 1px solid #000;
                            padding: 6px;
                        }
                        .signature-cell {
                            border: 1px solid #000;
                            font-weight: 700;
                            padding: 8px;
                            text-align: left;
                        }
                        .sno-cell { width: 60px; }
                        .name-cell { width: 220px; }
                        .code-cell { width: 120px; }
                        .date-cell { width: 70px; }
                        .day-cell { width: 45px; }
                        .total-cell { width: 100px; }
                    </style>
                </head>
                <body>
                    <table>
                        <tr>
                            <td class="company-title" colspan="${totalColumns}">U FIRM TECHNOLOGIES PVT. LTD</td>
                        </tr>
                        <tr>
                            <td class="report-title" colspan="${totalColumns}">
                                ${escapeHtml(`Attendance ${monthLabel} (${selectedDeviceName})`)}
                            </td>
                        </tr>
                        <tr>
                            <th class="header-cell sno-cell" rowspan="2">S.No</th>
                            <th class="header-cell name-cell" rowspan="2">Employee Name</th>
                            <th class="header-cell code-cell" rowspan="2">EMPL Code</th>
                            <th class="header-cell date-cell">Date</th>
                            ${dayNumberHeaders}
                            <th class="header-cell total-cell" rowspan="2">Normal Working Days</th>
                            <th class="header-cell total-cell" rowspan="2">O.T</th>
                            <th class="header-cell total-cell" rowspan="2">WO</th>
                            <th class="header-cell total-cell" rowspan="2">Total Absent</th>
                            <th class="header-cell total-cell" rowspan="2">Total Present</th>
                        </tr>
                        <tr>
                            <th class="header-cell date-cell">Days</th>
                            ${dayNameHeaders}
                        </tr>
                        ${employeeRows}
                        <tr>
                            <td class="blank-cell" colspan="4"></td>
                            <td class="summary-text-cell" colspan="${dateRange.length + 5}">SUMMARY</td>
                        </tr>
                        ${summaryTextRows}
                        <tr>
                            <td class="blank-cell" colspan="4"></td>
                            <td class="summary-text-cell" colspan="${dateRange.length + 5}">
                                ${escapeHtml(`TOTAL ATTENDANCE - ${overallTotals.totalAttendance}`)}
                            </td>
                        </tr>
                        <tr>
                            <td class="signature-cell" colspan="4">Prepared By</td>
                            <td class="signature-cell" colspan="${Math.max(1, Math.floor((dateRange.length + 5) / 2))}">Checked By</td>
                            <td class="signature-cell" colspan="${Math.max(1, Math.ceil((dateRange.length + 5) / 2))}">Verified By</td>
                        </tr>
                    </table>
                </body>
            </html>
        `;
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
        const htmlContent = buildAttendanceWorkbookHtml();
        const blob = new Blob([htmlContent], {
            type: "application/vnd.ms-excel;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Device_${selectedDeviceName}_${formatDate(fromDate)}_${formatDate(toDate)}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
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
                                <Column field="EmployeeName" header="Employee Name" />
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
