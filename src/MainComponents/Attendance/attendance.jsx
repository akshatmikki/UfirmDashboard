import React, { useState, useEffect, useRef } from "react";
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { getAttendance, getFacilityMembers, getAllLocations, saveManualAttendance, getManualAttendanceByProperty, processManualAttendance, rejectprocessManualAttendance } from "../../Services/AttendanceService";
import * as XLSX from "xlsx";
import { getAllClients } from "../../Services/ClientService";
import { useSelector } from 'react-redux';
import { ROLE_RULES } from "../../Common/roleAccess";

const LPS_BOSSARD_PROPERTY_ID = 31;
const OT_ENABLED_CLIENT_ID = 33;

export default function AttendanceMaster() {
    const [rejectionDialog, setRejectionDialog] = useState(false);
    const [rejectionRemark, setRejectionRemark] = useState("");
    const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [globalFilter, setGlobalFilter] = useState('');
    const [attendanceData, setAttendanceData] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [selectedDayAttendance, setSelectedDayAttendance] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const propertyId = useSelector((state) => state.Commonreducer.puidn);
    const propertyIds = useSelector((state) => state.Commonreducer.puidnlist);
    const userId = useSelector((state) => state.Commonreducer.userId);
    const userName = useSelector((state) => state.Commonreducer.userName);
    const userEmail = useSelector((state) => state.Commonreducer.userEmail);
    const userRole = useSelector((state) => state.Commonreducer.entrolval);
    const companyId = useSelector((state) => state.Commonreducer.companyid);
    const managedEmployeeIds = useSelector((state) => state.Commonreducer.managedEmployeeIds);
    const managedEmployeesLoaded = useSelector((state) => state.Commonreducer.managedEmployeesLoaded);
    const managerFacilityMemberId = useSelector((state) => state.Commonreducer.managerFacilityMemberId);
    const managedEmployeesIsAdmin = useSelector((state) => state.Commonreducer.managedEmployeesIsAdmin);
    const [submittedData, setSubmittedData] = useState([]);

    // ✅ New States for Pending and Approved/Rejected dialogs
    const [pendingDialog, setPendingDialog] = useState(false);
    const [approvedRejectedDialog, setApprovedRejectedDialog] = useState(false);
    const [pendingData, setPendingData] = useState([]);
    const [approvedRejectedData, setApprovedRejectedData] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [ClientID, setClientId] = useState(null);
    const [clientList, setClientList] = useState([]);
    // used ONLY for getAttendance
    const attendanceEntityId =
        selectedClient === "CLIENT" ? ClientID : propertyId;
    const attendanceType = selectedClient === "CLIENT" ? "CLIENT" : "PROPERTY";
    const [locations, setLocations] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const attendanceRequestSeqRef = useRef(0);

    useEffect(() => {
        const appElement = document.getElementById("app");
        const appUserName = appElement?.getAttribute("username") || userName;
        const appUserId = appElement?.getAttribute("userid") || userId;
        const appUserRole = appElement?.getAttribute("userrole") || userRole;

        console.log("Attendance user info", {
            app,
            userName: appUserName,
            userId: appUserId,
            userRole: appUserRole,
            userEmail,
            companyId,
            propertyId,
            propertyIds
        });
    }, [userRole, userId, userName, userEmail, companyId, propertyId, propertyIds]);

    useEffect(() => {
        // Fetch client list for dropdown
        const fetchClients = async () => {
            try {
                const response = await getAllClients();
                setClientList(response);
            } catch (error) {
                console.error("Failed to load clients:", error);
            }
        };
        fetchClients();
    }, []);
    // ✅ Employee fetch API call
    useEffect(() => {
        const controller = new AbortController();
        const fetchEmployees = async () => {
            try {
                if (!propertyId) return;
                const data = await getFacilityMembers(propertyId, { signal: controller.signal });
                if (data) {
                    const formatted = data.map(emp => ({
                        ...emp,
                        label: emp.Name,
                        value: emp
                    }));
                    setEmployeeList(formatted);
                }
            } catch (error) {
                if (error.name !== 'AbortError' && !axios.isCancel(error)) {
                    console.error("Failed to load employees:", error);
                }
            }
        };
        fetchEmployees();
        return () => controller.abort();
    }, [propertyId]);

    const employeeMap = React.useMemo(() => {
        const map = {};
        employeeList.forEach(emp => {
            map[emp.FacilityMemberId] = emp.Name;
        });
        return map;
    }, [employeeList]);

    const roleSource = React.useMemo(() => {
        const appElement = document.getElementById("app");
        return appElement?.getAttribute("userrole") || userRole;
    }, [userRole]);

    const isManagerRole = React.useMemo(() => ROLE_RULES.isManagerRole(roleSource), [roleSource]);
    const isAdminRole = React.useMemo(() => ROLE_RULES.isAdminRole(roleSource), [roleSource]);
    const isHrRole = React.useMemo(() => ROLE_RULES.isHrRole(roleSource), [roleSource]);
    const applyManagerFilter = isManagerRole && !isAdminRole && !isHrRole && !managedEmployeesIsAdmin;

    const filterManualAttendanceByManager = React.useCallback(
        (records) => {
            if (!applyManagerFilter) return records || [];
            if (!managedEmployeesLoaded) return [];
            if (!Array.isArray(managedEmployeeIds) || managedEmployeeIds.length === 0) return [];
            const idSet = new Set(managedEmployeeIds.map((id) => Number(id)));
            if (managerFacilityMemberId) {
                idSet.delete(Number(managerFacilityMemberId));
            }
            return (records || []).filter((item) => idSet.has(Number(item.EmployeeId)));
        },
        [applyManagerFilter, managedEmployeesLoaded, managedEmployeeIds, managerFacilityMemberId]
    );

    useEffect(() => {
        const filtered = filterManualAttendanceByManager(submittedData);
        const pending = filtered.filter(item => !item.IsApproved && !item.IsRejected);
        const processed = filtered.filter(item => item.IsApproved || item.IsRejected);
        setPendingData(pending);
        setApprovedRejectedData(processed);
    }, [submittedData, filterManualAttendanceByManager]);


    // ✅ Location fetch API call
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await getAllLocations();
                setLocations(data);
            } catch (error) {
                console.error("Failed to load locations:", error);
            }
        };
        fetchLocations();
    }, []);

    // ✅ Fetch all manual attendance and separate pending vs approved/rejected
    useEffect(() => {
        const controller = new AbortController();

        const fetchManualAttendance = async () => {
            if (!propertyId) return;
            try {
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                const savedData = await getManualAttendanceByProperty(
                    propertyId,
                    month,
                    year,
                    { signal: controller.signal }
                );
                if (!savedData) return;

                const formattedData = savedData.map(item => ({
                    Id: item.Id,
                    EmployeeId: item.EmployeeId,
                    EmployeeName: item.EmployeeName ||
                        employeeMap[item.EmployeeId] ||
                        `ID-${item.EmployeeId}`,
                    employee: { Name: item.EmployeeName || `ID-${item.EmployeeId}` },
                    mobile: item.MobileNo,
                    PunchTime: item.PunchTime ? new Date(item.PunchTime) : null,
                    punchDate: item.PunchTime ? new Date(item.PunchTime) : null,
                    checkIn: item.PunchTime ? new Date(item.PunchTime) : null,
                    PunchType: item.PunchType,
                    GateNo: item.GateNo,
                    CreatedBy: item.CreatedBy,
                    CreatedOn: item.CreatedOn ? new Date(item.CreatedOn) : null,
                    EmpId: item.EmpId,
                    Status: item.Status,
                    image: item.ImageFileName,
                    ImageFileName: item.ImageFileName,
                    location: item.LocationName || "",
                    LocationName: item.LocationName || "",
                    Reason: item.Reason || "",
                    IsApproved: item.IsApproved || false,
                    IsRejected: item.IsRejected || false,
                    RejectionRemark: item.RejectionRemark || "",
                    ApprovedBy: item.ApprovedBy,
                    ApprovedOn: item.ApprovedOn ? new Date(item.ApprovedOn) : null
                }));

                setSubmittedData(formattedData);
            } catch (error) {
                if (error.name !== 'AbortError' && !axios.isCancel(error)) {
                    console.error("Failed to fetch saved attendance:", error);
                }
            }
        };

        fetchManualAttendance();
        return () => controller.abort();
    }, [propertyId, employeeMap, currentDate]);

    // This is used for refresh after actions
    const refreshManualAttendance = async () => {
        if (!propertyId) return;
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            const savedData = await getManualAttendanceByProperty(
                propertyId,
                month,
                year
            );
            const formattedData = savedData.map(item => ({
                Id: item.Id,
                EmployeeId: item.EmployeeId,
                EmployeeName: item.EmployeeName ||
                    employeeMap[item.EmployeeId] ||
                    `ID-${item.EmployeeId}`,
                employee: { Name: item.EmployeeName || `ID-${item.EmployeeId}` },
                mobile: item.MobileNo,
                PunchTime: item.PunchTime ? new Date(item.PunchTime) : null,
                punchDate: item.PunchTime ? new Date(item.PunchTime) : null,
                checkIn: item.PunchTime ? new Date(item.PunchTime) : null,
                PunchType: item.PunchType,
                GateNo: item.GateNo,
                CreatedBy: item.CreatedBy,
                CreatedOn: item.CreatedOn ? new Date(item.CreatedOn) : null,
                EmpId: item.EmpId,
                Status: item.Status,
                image: item.ImageFileName,
                ImageFileName: item.ImageFileName,
                location: item.LocationName || "",
                LocationName: item.LocationName || "",
                Reason: item.Reason || "",
                IsApproved: item.IsApproved || false,
                IsRejected: item.IsRejected || false,
                RejectionRemark: item.RejectionRemark || "",
                ApprovedBy: item.ApprovedBy,
                ApprovedOn: item.ApprovedOn ? new Date(item.ApprovedOn) : null
            }));
            setSubmittedData(formattedData);
        } catch (error) {
            console.error("Failed to refresh manual attendance:", error);
        }
    };

    // ✅ Approve Attendance
    const handleApprove = async (record) => {
        console.log("Approving record:", record);
        try {
            await processManualAttendance({
                id: record.Id,
                approve: true,
                actionBy: userId
            });

            alert("Attendance approved ✅");
            refreshManualAttendance(); // Refresh data
        } catch (error) {
            console.error(error);
            alert("Failed to approve ❌");
        }
    };

    // ✅ Reject Attendance (open dialog)
    const handleReject = (record) => {
        setSelectedAttendanceId(record.Id);
        setRejectionRemark("");
        setRejectionDialog(true);
    };

    // ✅ Submit Rejection
    const submitRejection = async () => {
        if (!rejectionRemark.trim()) {
            alert("Please enter rejection remark");
            return;
        }
        try {
            await rejectprocessManualAttendance({
                id: selectedAttendanceId,
                approve: false,
                actionBy: userId,
                rejectionRemark
            });

            alert("Attendance rejected ❌");
            setRejectionDialog(false);
            refreshManualAttendance(); // Refresh data
        } catch (error) {
            console.error(error);
            alert("Failed to reject ❌");
        }
    };

    const getAttendanceForDate = (date) => {
        const dateStr = date.toISOString().slice(0, 10);
        return attendanceData.filter(record => {
            const recordDate = new Date(record.PunchDate);
            return recordDate.toISOString().slice(0, 10) === dateStr;
        });
    };

    const getDayStatusSummary = (dayAttendance) => {
        if (!dayAttendance || dayAttendance.length === 0) return null;
        return dayAttendance.every(r => r.Status === "Holiday") ? "Holiday" : "WorkingDay";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Present": return "green";
            case "Holiday": return "#0d6efd";
            case "Leave": return "#fd7e14";
            default: return "red";
        }
    };

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const parseDurationToSeconds = (value) => {
        if (!value || value === "--" || value === "0h") return 0;

        const timeMatch = String(value).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10) || 0;
            const minutes = parseInt(timeMatch[2], 10) || 0;
            const seconds = parseInt(timeMatch[3], 10) || 0;
            return (hours * 3600) + (minutes * 60) + seconds;
        }

        const textMatch = String(value).match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
        if (textMatch) {
            const hours = parseInt(textMatch[1], 10) || 0;
            const minutes = parseInt(textMatch[2], 10) || 0;
            return (hours * 3600) + (minutes * 60);
        }

        return 0;
    };
    const formatSecondsAsTime = (totalSeconds) => {
        if (!totalSeconds || totalSeconds <= 0) return "0h";

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0"),
        ].join(":");
    };
    const getOtFromWorkingTime = (workingTime) => {
        const otSeconds = parseDurationToSeconds(workingTime) - (8 * 60 * 60);
        return otSeconds > 0 ? formatSecondsAsTime(otSeconds) : "0h";
    };
    const getFirstDayOfMonth = (date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 7 : day;
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 1; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    useEffect(() => {
        const missingEntity =
            (attendanceType === "PROPERTY" && !propertyId) ||
            (attendanceType === "CLIENT" && !ClientID);

        if (missingEntity) {
            setAttendanceData([]);
            setSelectedDayAttendance([]);
            setSelectedDay(null);
            return;
        }

        const seq = attendanceRequestSeqRef.current + 1;
        attendanceRequestSeqRef.current = seq;

        setAttendanceData([]);
        setSelectedDayAttendance([]);
        setSelectedDay(null);

        const controller = new AbortController();

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const fromDate = new Date(year, month, 1).toLocaleDateString('en-CA');
        const toDate = new Date(year, month + 1, 0).toLocaleDateString('en-CA');

        const entityId =
            attendanceType === "CLIENT" ? ClientID : propertyId;

        getAttendance(entityId, fromDate, toDate, attendanceType)
            .then((data) => {
                if (seq !== attendanceRequestSeqRef.current) return;
                setAttendanceData(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                if (seq !== attendanceRequestSeqRef.current) return;
                setAttendanceData([]);
                console.error(error);
            });

    }, [attendanceType, propertyId, ClientID, currentDate]);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const calendarDays = generateCalendarDays();

    const handleMonthChange = (e) => {
        const newMonth = parseInt(e.target.value, 10);
        setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
    };

    const handleDayClick = (dayNumber) => {
        if (!dayNumber) return;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
        const attendance = getAttendanceForDate(date);
        setSelectedDayAttendance(attendance);
        setSelectedDay(date);
        setDialogVisible(true);
    };

    const exportMonthToCSV = (attendanceData, currentDate) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const allDates = [];
        for (let d = 1; d <= daysInMonth; d++) {
            // Generate local YYYY-MM-DD keys
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            allDates.push(dateKey);
        }

        const employees = {};
        attendanceData.forEach(record => {
            // Use a unique key to prevent collisions between employees with same names/missing codes
            const uniqueId = record.EmployeeId || record.FacilityMemberId || `${record.EmployeeCode || ""}_${record.EmployeeName || "Unknown"}`;
            const empName = record.EmployeeName;
            const desig = record.Designation || "--";
            const empCode = record.EmployeeCode || "--";

            const recordDateObj = new Date(record.PunchDate);
            // Generate local YYYY-MM-DD keys to match allDates
            const dateKey = `${recordDateObj.getFullYear()}-${String(recordDateObj.getMonth() + 1).padStart(2, '0')}-${String(recordDateObj.getDate()).padStart(2, '0')}`;

            if (!employees[uniqueId]) {
                employees[uniqueId] = {
                    EmployeeName: empName,
                    Designation: desig,
                    EmployeeCode: empCode,
                    Attendance: {}
                };
            }

            employees[uniqueId].Attendance[dateKey] = {
                CheckIn: record.MinCheckIn || "--",
                CheckOut: record.MaxCheckOut || "--",
                WorkingTime: record.TotalWorkingTime || "0h",
                Status: record.Status || "Absent"
            };
        });

        let ws_data = [];
        const shouldShowOtRow =
            (attendanceType === "PROPERTY" && Number(attendanceEntityId) === LPS_BOSSARD_PROPERTY_ID) ||
            (attendanceType === "CLIENT" && Number(attendanceEntityId) === OT_ENABLED_CLIENT_ID);

        Object.entries(employees).forEach(([id, empData]) => {
            const empName = empData.EmployeeName;
            const attMap = empData.Attendance;

            let present = 0, absent = 0, holiday = 0, leave = 0, totalWTmin = 0;

            allDates.forEach(dateKey => {
                const rec = attMap[dateKey];
                const status = rec ? rec.Status : "Absent";

                if (status === "Present") present++;
                else if (status === "Holiday") holiday++;
                else if (status === "Leave") leave++;
                else if (status === "Absent") absent++;

                if (rec && rec.WorkingTime && rec.WorkingTime !== "0h") {
                    const parts = rec.WorkingTime.split(":");
                    const h = parseInt(parts[0]) || 0;
                    const m = parseInt(parts[1]) || 0;
                    totalWTmin += h * 60 + m;
                }
            });

            const totalHours = `${Math.floor(totalWTmin / 60)}h ${totalWTmin % 60}m`;

            // 🔹 Employee + Code + Designation
            ws_data.push([`Employee: ${empName} - ${empData.EmployeeCode} (${empData.Designation})`]);

            // 🔹 Summary
            ws_data.push([
                `Present: ${present}`,
                `Absent: ${absent}`,
                `Holiday: ${holiday}`,
                `Leave: ${leave}`,
                `Working Hours: ${totalHours}`
            ]);

            ws_data.push([]);

            // 🔹 Date-wise grid
            const displayDates = allDates.map(dateKey => {
                const [y, m, d] = dateKey.split("-");
                return `${d}-${m}-${y}`;
            });

            ws_data.push(["Date", ...displayDates]);
            ws_data.push(["In", ...allDates.map(d => attMap[d]?.CheckIn || "--")]);
            ws_data.push(["Out", ...allDates.map(d => attMap[d]?.CheckOut || "--")]);
            ws_data.push(["WT", ...allDates.map(d => attMap[d]?.WorkingTime || "0h")]);
            if (shouldShowOtRow) {
                ws_data.push(["OT", ...allDates.map(d => getOtFromWorkingTime(attMap[d]?.WorkingTime))]);
            }

            // 🔹 Status shows Present / Holiday / Leave / Absent
            ws_data.push(["Status", ...allDates.map(d => attMap[d]?.Status || "Absent")]);

            ws_data.push([]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `Attendance_${month + 1}_${year}.xlsx`);
    };

    // const exportMonthToCSV_Horizontal = (attendanceData, currentDate) => {
    //     const year = currentDate.getFullYear();
    //     const month = currentDate.getMonth();
    //     const daysInMonth = new Date(year, month + 1, 0).getDate();

    //     const allDates = [];
    //     for (let d = 1; d <= daysInMonth; d++) {
    //         const dateObj = new Date(year, month, d, 12, 0, 0);
    //         const key = dateObj.toISOString().slice(0, 10);
    //         const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    //         allDates.push({ key, label: `Day ${d} (${dayName})` });
    //     }

    //     const employees = {};
    //     attendanceData.forEach(record => {
    //         const emp = record.EmployeeName;
    //         const recordDateObj = new Date(record.PunchDate);
    //         recordDateObj.setHours(12, 0, 0, 0);
    //         const dateKey = recordDateObj.toISOString().slice(0, 10);
    //         if (!employees[emp]) employees[emp] = {};
    //         employees[emp][dateKey] = {
    //             WorkingTime: record.TotalWorkingTime || "00:00:00",
    //             Status: record.Status || "A"
    //         };
    //     });

    //     let ws_data = [];
    //     ws_data.push([
    //         "Employee Name",
    //         "Employee Code",
    //         ...allDates.map(d => d.label),
    //         "Total P",
    //         "Total A",
    //         "Total WO",
    //         "Payable Days",
    //         "Total WT"
    //     ]);

    //     const sumTimes = (times) => {
    //         let totalSeconds = times.reduce((acc, t) => {
    //             const [h, m, s] = t.split(':').map(Number);
    //             return acc + h * 3600 + m * 60 + s;
    //         }, 0);
    //         const h = Math.floor(totalSeconds / 3600);
    //         const m = Math.floor((totalSeconds % 3600) / 60);
    //         const s = totalSeconds % 60;
    //         return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    //     };

    //     Object.entries(employees).forEach(([emp, attMap]) => {
    //         let row = [emp];
    //         let totalP = 0, totalA = 0, totalWO = 0;
    //         let dailyTimes = [];

    //         allDates.forEach(({ key }) => {
    //             const att = attMap[key];
    //             if (att) {
    //                 row.push(`Status: ${att.Status} WT: ${att.WorkingTime}`);
    //                 if (att.Status === "P") totalP++;
    //                 else if (att.Status === "A") totalA++;
    //                 else if (att.Status === "WO") totalWO++;
    //                 if (att.WorkingTime && att.WorkingTime !== "--") dailyTimes.push(att.WorkingTime);
    //             } else {
    //                 row.push("Status: A WT: --");
    //                 totalA++;
    //             }
    //         });

    //         const payableDays = totalP + totalWO;
    //         const totalWT = dailyTimes.length ? sumTimes(dailyTimes) : "00:00:00";
    //         row.push(totalP, totalA, totalWO, payableDays, totalWT);
    //         ws_data.push(row);
    //     });

    //     const wb = XLSX.utils.book_new();
    //     const ws = XLSX.utils.aoa_to_sheet(ws_data);
    //     XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    //     XLSX.writeFile(wb, `Attendance_${month + 1}_${year}.xlsx`);
    // };

    const exportDailyToCSV = (attendanceList, selectedDay) => {
        if (!attendanceList || attendanceList.length === 0) {
            alert("No attendance data available for export.");
            return;
        }

        const columns = ["Employee Name", "Employee Code", "Check In", "Check Out", "Working Time", "Status"];
        const rows = attendanceList.map(record => [
            record.EmployeeName || "",
            record.EmployeeCode || "",
            record.MinCheckIn || "",
            record.MaxCheckOut || "",
            record.TotalWorkingTime || "",
            record.Status || ""
        ]);

        const wsData = [
            [`Attendance for: ${selectedDay ? selectedDay.toLocaleDateString() : ""}`],
            columns,
            ...rows,
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daily Attendance");
        const fileName = `Attendance_${selectedDay ? selectedDay.toISOString().slice(0, 10) : "date"}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const customHeader = (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{selectedDay ? `Attendance Details - ${selectedDay.toLocaleDateString()}` : 'Attendance Details'}</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button
                    label="Export to Daily"
                    icon="pi pi-file-excel"
                    className="p-button-success"
                    onClick={() => exportDailyToCSV(selectedDayAttendance, selectedDay)}
                    disabled={!selectedDayAttendance || selectedDayAttendance.length === 0}
                />
                <InputText
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    style={{ height: '30px', fontSize: '0.8rem', padding: '2px 6px' }}
                />
            </div>
        </div>
    );
    const startYear = 2025;
    const endYear = new Date().getFullYear() + 2; // optional future years
    const yearOptions = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );
    const handleYearChange = (e) => {
        const newYear = parseInt(e.target.value, 10);
        setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
    };
    return (
        <div style={{ padding: '20px', paddingLeft: '80px', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '10px'
            }}>
                <div></div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                    <Dropdown
                        value={selectedClient}
                        options={[
                            { label: "Property", value: "PROPERTY" },
                            { label: "Client", value: "CLIENT" }
                        ]}
                        onChange={(e) => {
                            setSelectedClient(e.value);
                            setClientId(null);
                            setAttendanceData([]); // 🔥 important
                        }}
                        placeholder="Select Type"
                        style={{ width: '160px' }}
                    />

                    {selectedClient === "CLIENT" && (
                        <Dropdown
                            value={ClientID}
                            options={clientList}
                            optionLabel="ClientName"
                            optionValue="ClientID"
                            onChange={(e) => {
                                setClientId(e.value); // 🔥 this triggers useEffect
                            }}
                            placeholder="Select Client"
                            style={{ width: '200px' }}
                        />
                    )}

                    {/* Month Dropdown */}
                    <select
                        value={currentDate.getMonth()}
                        onChange={handleMonthChange}
                        style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {monthNames.map((name, idx) => (
                            <option key={idx} value={idx}>{name}</option>
                        ))}
                    </select>

                    {/* Year Dropdown */}
                    <select
                        value={currentDate.getFullYear()}
                        onChange={handleYearChange}
                        style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {yearOptions.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    {/* Export Button */}
                    <Button
                        label="Export to CSV"
                        icon="pi pi-file-excel"
                        className="p-button-success"
                        onClick={() => {

                            exportMonthToCSV(attendanceData, currentDate);

                        }}
                    />
                </div>


                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button
                        label="Pending"
                        icon="pi pi-clock"
                        className="p-button-warning"
                        onClick={() => setPendingDialog(true)}
                        badge={pendingData.length.toString()}
                    />
                    <Button
                        label="Approved/Rejected"
                        icon="pi pi-check-circle"
                        className="p-button-info"
                        onClick={() => setApprovedRejectedDialog(true)}
                    />
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px',
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '8px'
            }}>
                {dayNames.map((day, idx) => (
                    <div key={idx} style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        padding: '10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px'
                    }}>
                        {day}
                    </div>
                ))}

                {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
                    Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayNumber = calendarDays[weekIndex * 7 + dayIndex];
                        const dateForDay = dayNumber ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber) : null;

                        const dayAttendance = dateForDay ? getAttendanceForDate(dateForDay) : [];
                        const presentCount = dayAttendance.filter(record => record.Status === 'Present').length;
                        const leaveCount = dayAttendance.filter(record => record.Status === 'Leave').length;
                        const absentCount = dayAttendance.filter(record => record.Status === 'Absent').length;
                        const dayStatus = getDayStatusSummary(dayAttendance);

                        return (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                onClick={() => handleDayClick(dayNumber, dayIndex)}
                                style={{
                                    minHeight: '80px',
                                    padding: '10px',
                                    backgroundColor: dayNumber ? '#fff' : 'transparent',
                                    border: dayNumber ? '1px solid #dee2e6' : 'none',
                                    borderRadius: '4px',
                                    cursor: dayNumber ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (dayNumber) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    if (dayNumber) e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {dayNumber && (
                                    <>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '16px' }}>
                                            {dayNumber}
                                        </div>
                                        {dayAttendance.length > 0 && (
                                            dayStatus === "Holiday" ? (
                                                <div style={{
                                                    fontSize: '12px',
                                                    padding: '4px',
                                                    backgroundColor: '#0d6efd',
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    textAlign: 'center'
                                                }}>
                                                    🎉 Holiday 🎉
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '11px' }}>
                                                    <div style={{ color: 'green' }}>✓ Present: {presentCount}</div>
                                                    <div style={{ color: '#fd7e14' }}>⊘ Leave: {leaveCount}</div>
                                                    <div style={{ color: 'red' }}>✗ Absent: {absentCount}</div>
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
                )).flat()}
            </div>

            {/* Dialog for day details */}
            <Dialog
                visible={dialogVisible}
                onHide={() => { setDialogVisible(false); setGlobalFilter(''); }}
                header={customHeader}
                style={{ width: '80vw' }}
                modal
            >
                <DataTable value={selectedDayAttendance} globalFilter={globalFilter} paginator rows={10}>
                    <Column field="EmployeeName" header="Employee Name" sortable />
                    <Column field="EmployeeCode" header="Employee Code" sortable />
                    <Column field="MinCheckIn" header="Check In" sortable />
                    <Column field="MaxCheckOut" header="Check Out" sortable />
                    <Column field="TotalWorkingTime" header="Working Time" sortable />
                    <Column
                        field="Status"
                        header="Status"
                        sortable
                        body={(rowData) => (
                            <span style={{ color: getStatusColor(rowData.Status), fontWeight: 'bold' }}>
                                {rowData.Status}
                            </span>
                        )}
                    />
                </DataTable>
            </Dialog>


            {/* ✅ Manual Attendance Pending Dialog */}
            <Dialog
                visible={pendingDialog}
                onHide={() => { setPendingDialog(false); setGlobalFilter(''); }}
                header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 2rem)' }}>
                        <span>Manual Attendance Pending ({pendingData.length})</span>
                        <InputText
                            placeholder="Search employee..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            style={{ height: '30px', fontSize: '0.8rem', padding: '2px 6px' }}
                        />
                    </div>
                }
                style={{ width: '90vw' }}
                modal
            >
                {pendingData.length > 0 ? (
                    <DataTable value={pendingData} paginator rows={10} globalFilter={globalFilter}>
                        <Column field="Id" header="ID" sortable style={{ width: '80px' }} />
                        <Column
                            field="EmployeeName"
                            header="Employee Name"
                            sortable
                        />
                        {/* <Column 
                            field="mobile" 
                            header="Mobile" 
                            sortable 
                        /> */}
                        <Column
                            field="PunchTime"
                            header="Punch Time"
                            sortable
                            body={(rowData) => rowData.PunchTime ? new Date(rowData.PunchTime).toLocaleString() : ""}
                        />
                        <Column
                            field="PunchType"
                            header="Punch Type"
                            sortable
                        />

                        <Column
                            field="LocationName"
                            header="Location"
                            sortable
                        />
                        <Column
                            field="Reason"
                            header="Reason"
                            sortable
                        />
                        <Column
                            field="Status"
                            header="Status"
                            sortable
                            body={(rowData) => (
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#ffc107',
                                    color: '#000',
                                    fontWeight: 'bold'
                                }}>
                                    {rowData.Status}
                                </span>
                            )}
                        />
                        <Column
                            header="Actions"
                            body={(rowData) => (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <Button
                                        icon="pi pi-check"
                                        className="p-button-success p-button-sm"
                                        onClick={() => handleApprove(rowData)}
                                        tooltip="Approve"
                                    />
                                    <Button
                                        icon="pi pi-times"
                                        className="p-button-danger p-button-sm"
                                        onClick={() => handleReject(rowData)}
                                        tooltip="Reject"
                                    />
                                </div>
                            )}
                        />
                    </DataTable>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No pending records available
                    </div>
                )}
            </Dialog>

            {/* ✅ Manual Attendance Approved/Rejected Dialog */}
            <Dialog
                visible={approvedRejectedDialog}
                onHide={() => { setApprovedRejectedDialog(false); setGlobalFilter(''); }}
                header={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 2rem)' }}>
                        <span>Manual Attendance History ({approvedRejectedData.length})</span>
                        <InputText
                            placeholder="Search employee..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            style={{ height: '30px', fontSize: '0.8rem', padding: '2px 6px' }}
                        />
                    </div>
                }
                style={{ width: '90vw' }}
                modal
            >
                {approvedRejectedData.length > 0 ? (
                    <DataTable value={approvedRejectedData} paginator rows={10} globalFilter={globalFilter}>
                        <Column field="Id" header="ID" sortable style={{ width: '80px' }} />
                        <Column
                            field="EmployeeName"
                            header="Employee Name"
                            sortable
                        />
                        {/* <Column 
                            field="mobile" 
                            header="Mobile" 
                            sortable 
                        /> */}
                        <Column
                            field="PunchTime"
                            header="Punch Time"
                            sortable
                            body={(rowData) => rowData.PunchTime ? new Date(rowData.PunchTime).toLocaleString() : ""}
                        />
                        <Column
                            field="PunchType"
                            header="Punch Type"
                            sortable
                        />

                        <Column
                            field="LocationName"
                            header="Location"
                            sortable
                        />
                        <Column
                            field="Reason"
                            header="Reason"
                            sortable
                        />

                        <Column
                            field="ApprovedOn"
                            header="Processed On"
                            sortable
                            body={(rowData) => rowData.ApprovedOn ? new Date(rowData.ApprovedOn).toLocaleString() : ""}
                        />
                        <Column
                            field="ApprovedBy"
                            header="Processed By"
                            sortable
                            body={(rowData) => rowData.ApprovedBy ?? ""}
                        />
                        <Column
                            header="Status"
                            body={(rowData) => (
                                <div>
                                    {rowData.IsApproved && (
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}>
                                            ✓ Approved
                                        </span>
                                    )}
                                    {rowData.IsRejected && (
                                        <div>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                fontWeight: 'bold'
                                            }}>
                                                ✗ Rejected
                                            </span>
                                            {rowData.RejectionRemark && (
                                                <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                                                    Remark: {rowData.RejectionRemark}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                    </DataTable>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No processed records available
                    </div>
                )}
            </Dialog>

            {/* ✅ Rejection Remark Dialog */}
            <Dialog
                visible={rejectionDialog}
                onHide={() => setRejectionDialog(false)}
                header="Reject Manual Attendance"
                style={{ width: '400px' }}
                modal
            >
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Remark
                    </label>
                    <InputText
                        value={rejectionRemark}
                        onChange={(e) => setRejectionRemark(e.target.value)}
                        placeholder="Enter rejection remark"
                        className="w-full"
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        onClick={() => setRejectionDialog(false)}
                        className="p-button-secondary"
                    />
                    <Button
                        label="Submit"
                        icon="pi pi-check"
                        onClick={submitRejection}
                        className="p-button-danger"
                    />
                </div>
            </Dialog>
        </div>
    );
}
