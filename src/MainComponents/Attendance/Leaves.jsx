"use client";

import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { useSelector } from "react-redux";
import {
    fetchAllLeaveRequests,
    updateAllLeaveRequests,
    fetchLeaveSummary,
    submitLeaveRequest,
} from "../../Services/LeaveService";
import { EmployeeLeaveService } from "../../Services/EmployeeLeaveService";
import { FacilityLatlongService } from "../../Services/FacilityLatlongService";
import { FilterMatchMode } from "primereact/api";
import { ROLE_RULES } from "../../Common/roleAccess";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "./AttendanceTaskStyle.css";

const Leaves = () => {
    const [gridData, setGridData] = useState([]);
    const [employeeLeaveSummary, setEmployeeLeaveSummary] = useState([]);
    const [showTable, setShowTable] = useState(true);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [createDialogVisible, setCreateDialogVisible] = useState(false);

    const propertyId = useSelector((state) => state.Commonreducer.puidn);
    const userId = useSelector((state) => state.Commonreducer.userId);
    const userName = useSelector((state) => state.Commonreducer.userName);
    const userRole = useSelector((state) => state.Commonreducer.entrolval);
    const managedEmployees = useSelector((state) => state.Commonreducer.managedEmployees);
    const managedEmployeeIds = useSelector((state) => state.Commonreducer.managedEmployeeIds);
    const managedEmployeesIsAdmin = useSelector((state) => state.Commonreducer.managedEmployeesIsAdmin);
    const managedEmployeesLoaded = useSelector((state) => state.Commonreducer.managedEmployeesLoaded);
    const managerFacilityMemberId = useSelector((state) => state.Commonreducer.managerFacilityMemberId);
    const toast = useRef(null);

    const actionBy = React.useMemo(() => {
        if (typeof document === "undefined") return userId || 0;
        const app = document.getElementById("app");
        const appUserId = Number(app?.getAttribute("userid"));
        if (Number.isFinite(appUserId) && appUserId > 0) return appUserId;
        return userId || 0;
    }, [userId]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    });

    useEffect(() => {
        const appElement = document.getElementById("app");
        const appUserName = appElement?.getAttribute("username") || userName;
        const appUserId = appElement?.getAttribute("userid") || userId;
        const appUserRole = appElement?.getAttribute("userrole") || userRole;

        console.log("Leaves user info", {
            userName: appUserName,
            userId: appUserId,
            userRole: appUserRole
        });
    }, [userName, userId, userRole]);

    // form states
    const [employeeName, setEmployeeName] = useState("");
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [reason, setReason] = useState("");
    const [leaveType, setLeaveType] = useState(null);
    const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
    const [rejectRemark, setRejectRemark] = useState("");
    const [selectedLeave, setSelectedLeave] = useState(null);

    // dropdown data
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]); // ✅ corrected naming

    const roleSource = React.useMemo(() => {
        const appElement = document.getElementById("app");
        return appElement?.getAttribute("userrole") || userRole;
    }, [userRole]);

    const isManagerRole = React.useMemo(() => ROLE_RULES.isManagerRole(roleSource), [roleSource]);
    const isAdminRole = React.useMemo(() => ROLE_RULES.isAdminRole(roleSource), [roleSource]);
    const isHrRole = React.useMemo(() => ROLE_RULES.isHrRole(roleSource), [roleSource]);
    const applyManagerFilter = isManagerRole && !isAdminRole && !isHrRole && !managedEmployeesIsAdmin;

    const managedEmployeeIdSet = React.useMemo(() => {
        const idSet = new Set();
        if (Array.isArray(managedEmployeeIds) && managedEmployeeIds.length > 0) {
            managedEmployeeIds.forEach((id) => {
                const num = Number(id);
                if (Number.isFinite(num)) idSet.add(num);
            });
        } else {
            (managedEmployees || []).forEach((emp) => {
                const id = Number(emp.FacilityMemberId);
                if (Number.isFinite(id)) idSet.add(id);
            });
        }
        if (managerFacilityMemberId) {
            idSet.delete(Number(managerFacilityMemberId));
        }
        return idSet;
    }, [managedEmployeeIds, managedEmployees, managerFacilityMemberId]);

    const managedMobileSet = React.useMemo(() => {
        const mobileSet = new Set();
        (managedEmployees || []).forEach((emp) => {
            if (emp.MobileNumber != null) {
                mobileSet.add(String(emp.MobileNumber).trim());
            }
        });
        return mobileSet;
    }, [managedEmployees]);

    const getRowEmployeeId = React.useCallback((row) => {
        if (!row) return null;
        const candidates = [
            row.EmployeeId,
            row.FacilityMemberId,
            row.FacilityMemberID,
            row.EmpId,
            row.EmpID,
        ];
        for (const candidate of candidates) {
            const num = Number(candidate);
            if (Number.isFinite(num) && num > 0) return num;
        }
        return null;
    }, []);

    const getRowMobile = React.useCallback((row) => {
        if (!row) return null;
        const raw =
            row.MobileNo ??
            row.MobileNumber ??
            row.mobileNo ??
            row.mobileNumber ??
            row.Mobile ??
            row.mobile;
        if (raw == null) return null;
        const asString = String(raw).trim();
        return asString ? asString : null;
    }, []);

    const filteredGridData = React.useMemo(() => {
        if (!applyManagerFilter) return gridData;
        if (!managedEmployeesLoaded) return [];
        if (managedEmployeeIdSet.size === 0 && managedMobileSet.size === 0) return [];
        return (gridData || []).filter((row) => {
            const employeeId = getRowEmployeeId(row);
            if (employeeId && managedEmployeeIdSet.size > 0) {
                return managedEmployeeIdSet.has(employeeId);
            }
            const mobile = getRowMobile(row);
            if (mobile && managedMobileSet.size > 0) {
                return managedMobileSet.has(mobile);
            }
            return false;
        });
    }, [
        gridData,
        applyManagerFilter,
        managedEmployeesLoaded,
        managedEmployeeIdSet,
        managedMobileSet,
        getRowEmployeeId,
        getRowMobile
    ]);

    const filteredEmployees = React.useMemo(() => {
        if (!applyManagerFilter) return employees;
        if (!managedEmployeesLoaded) return [];
        if (managedEmployeeIdSet.size === 0) return [];
        return (employees || []).filter((emp) =>
            managedEmployeeIdSet.has(Number(emp.id))
        );
    }, [employees, applyManagerFilter, managedEmployeesLoaded, managedEmployeeIdSet]);

    useEffect(() => {
        if (propertyId) {
            loadDropdowns();
            loadLeaves();
            loadEmployees();
        }
    }, [propertyId]);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const data = await fetchAllLeaveRequests(propertyId);
            setGridData(data || []);
        } catch (error) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to fetch leaves",
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const empData = await FacilityLatlongService.getFacilityMembers(
                propertyId
            );
            setEmployees(
                empData.map((e) => ({
                    label: e.Name,
                    value: e.MobileNumber,
                    id: e.FacilityMemberId,
                }))
            );
        } catch (error) {
            console.error(error);
        }
    };

    const loadDropdowns = async () => {
        try {
            const leaveRes = await EmployeeLeaveService.getLeaveTypes(propertyId);
            if (Array.isArray(leaveRes)) {
                setLeaveTypes(
                    leaveRes.map((lt) => ({
                        label: `${lt.LeaveType} - ${lt.LeaveDescription}`,
                        value: lt.Id,
                    }))
                );
            }
        } catch (error) {
            console.error("Dropdown load error:", error);
        }
    };

    const approveLeave = async (data) => {
        const payload = {
            ...data,
            IsApproved: true,
            IsRejected: false,
            Status: "Approved",
            ActionBy: actionBy || 0,
            ActionOn: new Date().toISOString(),
            ActionRemarks: data?.ActionRemarks || "",
        };
        await updateAllLeaveRequests(payload);
        await loadLeaves();

        try {
            if (data.MobileNo) {
                const summary = await fetchLeaveSummary(data.MobileNo);
                setEmployeeLeaveSummary(summary || []);
            }
        } catch (error) {
            console.error("Failed to refresh leave summary:", error);
        }

        toast.current.show({
            severity: "success",
            summary: "Approved",
            detail:` Leave ID ${data.LeaveId} Approved`,
            life: 3000,
        });
    };

    const rejectLeave = async () => {
        if (!selectedLeave) return;

        if (!rejectRemark.trim()) {
            toast.current.show({
                severity: "warn",
                summary: "Validation",
                detail: "Please enter rejection remark",
                life: 3000,
            });
            return;
        }

        const payload = {
            ...selectedLeave,
            IsRejected: true,
            IsApproved: false,
            Status: "Rejected",
            ActionRemarks: rejectRemark,
            ActionBy: actionBy || 0,
            ActionOn: new Date().toISOString(),
        };

        await updateAllLeaveRequests(payload);
        await loadLeaves();

        try {
            if (selectedLeave.MobileNo) {
                const summary = await fetchLeaveSummary(selectedLeave.MobileNo);
                setEmployeeLeaveSummary(summary || []);
            }
        } catch (error) {
            console.error("Failed to refresh leave summary:", error);
        }

        toast.current.show({
            severity: "error",
            summary: "Rejected",
            detail: `Leave ID ${selectedLeave.LeaveId} Rejected`,
            life: 3000,
        });

        // reset
        setRejectRemark("");
        setSelectedLeave(null);
        setRejectDialogVisible(false);
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
        setFilters({
            ...filters,
            global: { value, matchMode: FilterMatchMode.CONTAINS },
        });
    };

    const calculateLeaveCount = (from, to) => {
        if (!from || !to) return 0;
        const start = new Date(from);
        const end = new Date(to);
        const diff =
            Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    const header = (
        <div className="attendance-task-toolbar">
            <h5 className="attendance-task-title">Leaves</h5>
            <div className="attendance-task-actions">
                <div className="input-group attendance-task-search">
                    <div className="input-group-prepend">
                        <span className="input-group-text">
                            <i className="fa fa-search text-muted"></i>
                        </span>
                    </div>
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="Search leaves..."
                        className="form-control"
                    />
                </div>
                <Button
                    label="Create Leave"
                    icon="fa fa-plus"
                    className="p-button-success attendance-task-btn"
                    onClick={() => setCreateDialogVisible(true)}
                />
            </div>
        </div>
    );

    const statusBadge = (rowData) => {
        if (rowData?.IsApproved) {
            return (
                <span className="badge badge-success">
                    Approved
                </span>
            );
        }
        if (rowData?.IsRejected) {
            return (
                <span className="badge badge-danger">
                    Rejected
                </span>
            );
        }
        return (
            <span className="badge badge-warning">
                Pending
            </span>
        );
    };

    const actionBodyTemplate = (rowData) => {
        if (rowData?.IsApproved || rowData?.IsRejected) {
            return statusBadge(rowData);
        }

        return (
            <>
                <Button
                    icon="fa fa-check"
                    className="p-button-success p-button-sm mr-2 attendance-task-btn"
                    onClick={() => approveLeave(rowData)}
                />
                <Button
                    icon="fa fa-times"
                    className="p-button-danger p-button-sm attendance-task-btn"
                    onClick={() => {
                        setSelectedLeave(rowData);
                        setRejectDialogVisible(true);
                    }}
                />
            </>
        );
    };

    const saveLeave = async () => {
        if (!employeeName || !fromDate || !toDate || !reason || !leaveType) {
            toast.current.show({
                severity: "warn",
                summary: "Validation",
                detail: "All fields are required",
                life: 3000,
            });
            return;
        }

        const selectedEmployee = employees.find(
            (emp) => emp.value === employeeName
        );
        const leaveCount = calculateLeaveCount(fromDate, toDate);

        // ✅ Remaining leave check
        const selectedLeaveTypeSummary = employeeLeaveSummary.find(
            (s) => s.LeaveTypeId === leaveType
        );
        if (
            selectedLeaveTypeSummary &&
            leaveCount > selectedLeaveTypeSummary.RemainingLeaves
        ) {
            toast.current.show({
                severity: "error",
                summary: "Limit Exceeded",
                detail: `You cannot apply more than ${selectedLeaveTypeSummary.RemainingLeaves} leaves.`,
                life: 4000,
            });
            return;
        }

        // ✅ Overlap check
        const newFrom = new Date(fromDate);
        const newTo = new Date(toDate);
        const overlap = gridData.some(
            (l) =>
                l.MobileNo === selectedEmployee.value &&
                (l.IsApproved || (!l.IsApproved && !l.IsRejected)) &&
                ((newFrom >= new Date(l.FromDate) &&
                    newFrom <= new Date(l.ToDate)) ||
                    (newTo >= new Date(l.FromDate) &&
                        newTo <= new Date(l.ToDate)) ||
                    (newFrom <= new Date(l.FromDate) &&
                        newTo >= new Date(l.ToDate)))
        );

        if (overlap) {
            toast.current.show({
                severity: "error",
                summary: "Overlap",
                detail: "Leave already applied for selected date range",
                life: 4000,
            });
            return;
        }

        const payload = {
            LeaveId: 0,
            EmployeeName: selectedEmployee ? selectedEmployee.label : "",
            MobileNo: selectedEmployee ? selectedEmployee.value : "",
            FromDate: fromDate,
            ToDate: toDate,
            Reason: reason,
            Status: "Pending",
            AppliedOn: new Date().toISOString(),
            LeaveType: leaveType,
            IsActive: true,
            IsApproved: false,
            IsRejected: false,
            ActionBy: 0,
            ActionOn: null,
            ActionRemarks: "",
            LeaveTypeId: leaveType,
            LeaveCount: leaveCount,
        };

        try {
            await submitLeaveRequest(payload);
            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Leave Created Successfully",
                life: 3000,
            });

            // ✅ Reset form fields after save
            setEmployeeName("");
            setFromDate(null);
            setToDate(null);
            setReason("");
            setLeaveType(null);
            setEmployeeLeaveSummary([]);
            //setShowTable(false);
            setCreateDialogVisible(false);

            loadLeaves();
        } catch (error) {
            console.error("Leave creation failed:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to create leave",
                life: 3000,
            });
        }
    };

    const onEmployeeChange = async (e) => {
        const selectedMobile = e.value;
        setEmployeeName(selectedMobile);

        if (selectedMobile) {
            try {
                const summary = await fetchLeaveSummary(selectedMobile);
                setEmployeeLeaveSummary(summary || []);
            } catch (error) {
                console.error("Failed to fetch leave summary:", error);
                setEmployeeLeaveSummary([]);
            }
        } else {
            setEmployeeLeaveSummary([]);
        }
    };

    return (
        <div className="content-wrapper attendance-task-shell">
            <section className="content mt-4">
                <div className="container-fluid">
                    <div className="card p-2 attendance-task-card">
                        <Toast ref={toast} />
                        <div className="px-2">
                            {showTable && (
                                <DataTable
                                    value={filteredGridData}
                                    loading={loading}
                                    header={header}
                                    paginator
                                    rows={10}
                                    filters={filters}
                                    filterDisplay="row"
                                    globalFilterFields={["EmployeeName", "Reason", "LeaveType"]}
                                    emptyMessage="No leave requests found."
                                    dataKey="LeaveId"
                                    breakpoint="960px"
                                    className="attendance-task-table"
                                >
                                    <Column field="EmployeeName" header="Employee Name" />
                                    <Column
                                        field="FromDate"
                                        header="From Date"
                                        body={(rowData) =>
                                            rowData.FromDate
                                                ? rowData.FromDate.split("T")[0]
                                                : ""
                                        }
                                    />
	                                    <Column
	                                        field="ToDate"
	                                        header="To Date"
	                                        body={(rowData) =>
	                                            rowData.ToDate ? rowData.ToDate.split("T")[0] : ""
	                                        }
	                                    />
	                                    <Column
	                                        header="Status"
	                                        body={(rowData) => statusBadge(rowData)}
	                                    />
	                                    <Column field="Reason" header="Reason" />
	                                    <Column body={(rowData) => {
	                                        const typeId = rowData.LeaveTypeId ;
	                                        const type = leaveTypes.find((lt) => lt.value === typeId);
	                                        return type ? type.label : "N/A";
	                                    }} header="Leave Type" />
	                                    <Column
	                                        field="ActionBy"
	                                        header="Processed By"
	                                        body={(rowData) => rowData?.ActionBy ?? ""}
	                                    />
	                                    <Column
	                                        field="ActionOn"
	                                        header="Processed On"
	                                        body={(rowData) => {
	                                            const raw = rowData?.ActionOn;
	                                            if (!raw) return "";
	                                            const d = new Date(raw);
	                                            return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
	                                        }}
	                                    />
	                                    {filteredGridData.some((row) => row.ActionRemarks && row.ActionRemarks.trim() !== "") && (
	                                        <Column field="ActionRemarks" header="Rejection Remark" />
	                                    )}
	                                    <Column header="Action" body={actionBodyTemplate} />
	                                </DataTable>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Create Leave Dialog */}
            <Dialog
                visible={createDialogVisible}
                header="Create Leave"
                modal
                style={{ width: "500px" }}
                onHide={() => setCreateDialogVisible(false)}
            >
                <div className="p-fluid">
                    <div className="field mb-3">
                        <label>Employee Name</label>
                        <Dropdown
                            value={employeeName}
                            options={filteredEmployees}
                            onChange={onEmployeeChange}
                            placeholder="Select Employee"
                        />
                    </div>

                    {employeeLeaveSummary.length > 0 && (
                        <div className="mb-3">
                            <h6>Leave Summary</h6>
                            <DataTable value={employeeLeaveSummary} responsiveLayout="scroll">
                                <Column field="LeaveType" header="Leave Type" />
                                <Column field="TakenLeaves" header="Taken Leaves" />
                                <Column field="RemainingLeaves" header="Remaining Leaves" />
                            </DataTable>
                        </div>
                    )}
                    <div className="field mb-3">
                        <label>Leave Type</label>
                        <Dropdown
                            value={leaveType}
                            options={leaveTypes}
                            onChange={(e) => setLeaveType(e.value)}
                            placeholder="Select Leave Type"
                        />
                    </div>
                    <div className="field mb-3">
                        <label>From Date</label>
                        <Calendar
                            value={fromDate}
                            onChange={(e) => setFromDate(e.value)}
                            showIcon
                            dateFormat="yy-mm-dd"
                        />
                    </div>
                    <div className="field mb-3">
                        <label>To Date</label>
                        <Calendar
                            value={toDate}
                            onChange={(e) => setToDate(e.value)}
                            showIcon
                            dateFormat="yy-mm-dd"
                        />
                    </div>
                    <div className="field mb-3">
                        <label>Reason</label>
                        <InputText
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter Reason"
                        />
                    </div>
                </div>
                <div className="attendance-task-modal-footer mt-3">
                    <Button
                        label="Cancel"
                        className="p-button-text mr-2"
                        onClick={() => setCreateDialogVisible(false)}
                    />
                    <Button label="Save" icon="pi pi-check" onClick={saveLeave} />
                </div>
            </Dialog>
            {/* Reject Leave Dialog */}
            <Dialog
                visible={rejectDialogVisible}
                header="Reject Leave"
                modal
                style={{ width: "400px" }}
                onHide={() => setRejectDialogVisible(false)}
            >
                <div className="p-fluid">
                    <div className="field mb-3">
                        <label>Rejection Remark</label>
                        <InputText
                            value={rejectRemark}
                            onChange={(e) => setRejectRemark(e.target.value)}
                            placeholder="Enter remark"
                        />
                    </div>
                </div>
                <div className="attendance-task-modal-footer mt-3">
                    <Button
                        label="Cancel"
                        className="p-button-text mr-2"
                        onClick={() => setRejectDialogVisible(false)}
                    />
                    <Button
                        label="Reject"
                        icon={<i className="fa fa-times mr-2" />}
                        className="p-button-danger rounded"
                        onClick={rejectLeave}
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default Leaves;
