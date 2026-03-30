"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { FilterMatchMode, PrimeReactProvider } from "primereact/api";
import { InputTextarea } from "primereact/inputtextarea";
import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "./AttendanceTaskStyle.css";
import {
  getCompOffByEmployee,
  getCompOffCounts,
  processCompOff,
} from "../../Services/CompOffService";
import { ROLE_RULES } from "../../Common/roleAccess";

const Compoff = () => {
  const toast = useRef(null);

  const userRole = useSelector((state) => state.Commonreducer.entrolval);
  const managedEmployeeIds = useSelector((state) => state.Commonreducer.managedEmployeeIds);
  const managedEmployeesLoaded = useSelector((state) => state.Commonreducer.managedEmployeesLoaded);
  const managerFacilityMemberId = useSelector((state) => state.Commonreducer.managerFacilityMemberId);
  const managedEmployeesIsAdmin = useSelector((state) => state.Commonreducer.managedEmployeesIsAdmin);

  const [counts, setCounts] = useState([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const [details, setDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [rejectRow, setRejectRow] = useState(null);

  const [processingIds, setProcessingIds] = useState(() => new Set());
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const roleSource = useMemo(() => {
    if (typeof document === "undefined") return userRole;
    const appElement = document.getElementById("app");
    return appElement?.getAttribute("userrole") || userRole;
  }, [userRole]);

  const isManagerRole = useMemo(() => ROLE_RULES.isManagerRole(roleSource), [roleSource]);
  const isAdminRole = useMemo(() => ROLE_RULES.isAdminRole(roleSource), [roleSource]);
  const isHrRole = useMemo(() => ROLE_RULES.isHrRole(roleSource), [roleSource]);
  const applyManagerFilter = isManagerRole && !isAdminRole && !isHrRole && !managedEmployeesIsAdmin;

  const managedEmployeeIdSet = useMemo(() => {
    const idSet = new Set();
    if (!Array.isArray(managedEmployeeIds)) return idSet;
    managedEmployeeIds.forEach((id) => {
      const num = Number(id);
      if (Number.isFinite(num)) idSet.add(num);
    });
    if (managerFacilityMemberId) {
      idSet.delete(Number(managerFacilityMemberId));
    }
    return idSet;
  }, [managedEmployeeIds, managerFacilityMemberId]);

  const visibleCounts = useMemo(() => {
    if (!applyManagerFilter) return counts;
    if (!managedEmployeesLoaded) return [];
    if (managedEmployeeIdSet.size === 0) return [];
    return (counts || []).filter((row) => managedEmployeeIdSet.has(Number(row?.EmployeeId)));
  }, [applyManagerFilter, counts, managedEmployeesLoaded, managedEmployeeIdSet]);

  const actionBy = useMemo(() => {
    if (typeof document === "undefined") return "";
    const app = document.getElementById("app");
    const userId = app?.getAttribute("userid");
    const userName = app?.getAttribute("username");
    return userId || userName || "1";
  }, []);

  const fetchCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const data = await getCompOffCounts();
      setCounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load comp-off counts:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load comp-off data",
      });
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const fetchDetails = async (employeeId) => {
    if (!employeeId) return;
    setIsLoadingDetails(true);
    try {
      const data = await getCompOffByEmployee(employeeId);
      setDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load comp-off details:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load comp-off details",
      });
      setDetails([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const openDetails = async (row) => {
    if (!row?.EmployeeId) return;
    setSelectedEmployee(row);
    setDetailsDialogVisible(true);
    await fetchDetails(row.EmployeeId);
  };

  const markProcessing = (id, isProcessing) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const approveRow = async (row) => {
    const id = row?.Id;
    if (!id) return;
    markProcessing(id, true);
    try {
      const res = await processCompOff({
        compOffId: id,
        isApproved: true,
        isRejected: false,
        actionBy,
      });
      toast.current?.show({
        severity: "success",
        summary: "Approved",
        detail: res?.Message || "Comp off approved",
      });
      await Promise.all([fetchCounts(), fetchDetails(selectedEmployee?.EmployeeId)]);
    } catch (error) {
      console.error("Approve comp-off failed:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to approve comp off",
      });
    } finally {
      markProcessing(id, false);
    }
  };

  const openReject = (row) => {
    setRejectRow(row);
    setRejectRemark("");
    setRejectDialogVisible(true);
  };

  const confirmReject = async () => {
    const id = rejectRow?.Id;
    if (!id) return;

    markProcessing(id, true);
    try {
      const res = await processCompOff({
        compOffId: id,
        isApproved: false,
        isRejected: true,
        actionBy,
        rejectionRemark: rejectRemark || null,
      });
      toast.current?.show({
        severity: "success",
        summary: "Rejected",
        detail: res?.Message || "Comp off rejected",
      });
      setRejectDialogVisible(false);
      setRejectRow(null);
      setRejectRemark("");
      await Promise.all([fetchCounts(), fetchDetails(selectedEmployee?.EmployeeId)]);
    } catch (error) {
      console.error("Reject comp-off failed:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to reject comp off",
      });
    } finally {
      markProcessing(id, false);
    }
  };

  const canActionRow = (row) => {
    const status = String(row?.Status || "").toLowerCase();
    return status === "pending";
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
  };

  const header = (
    <div className="attendance-task-toolbar">
      <h5 className="attendance-task-title">Comp Off</h5>
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
            placeholder="Search employee..."
            className="form-control"
          />
        </div>
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          className="p-button-outlined attendance-task-btn"
          onClick={fetchCounts}
          disabled={isLoadingCounts}
        />
      </div>
    </div>
  );

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <PrimeReactProvider>
      <div className="content-wrapper attendance-task-shell">
        <section className="content mt-4">
          <div className="container-fluid">
            <Toast ref={toast} />

            <div className="card p-2 attendance-task-card">
              <div className="px-2">
                <DataTable
                  value={visibleCounts}
                  dataKey="EmployeeId"
                  header={header}
                  paginator
                  rows={10}
                  loading={isLoadingCounts}
                  filters={filters}
                  globalFilterFields={["EmployeeName", "EmployeeId"]}
                  responsiveLayout="scroll"
                  emptyMessage="No comp-off data found."
                  className="attendance-task-table"
                >
                  <Column header="Employee ID" field="EmployeeId" />
                  <Column header="Employee" field="EmployeeName" />
                  <Column header="Comp Off Count" field="CompOffCount" />
                  <Column
                    header="Action"
                    body={(row) => (
                      <Button
                        icon="pi pi-eye"
                        className="p-button-text"
                        tooltip="View details"
                        onClick={() => openDetails(row)}
                      />
                    )}
                  />
                </DataTable>

                <Dialog
                  header={
                    selectedEmployee
                      ? `Comp Off - ${selectedEmployee.EmployeeName || ""} (${selectedEmployee.EmployeeId})`
                      : "Comp Off Details"
                  }
                  visible={detailsDialogVisible}
                  style={{ width: "1100px" }}
                  modal
                  onHide={() => {
                    setDetailsDialogVisible(false);
                    setSelectedEmployee(null);
                    setDetails([]);
                  }}
                >
                  <DataTable
                    value={details}
                    dataKey="Id"
                    loading={isLoadingDetails}
                    responsiveLayout="scroll"
                    emptyMessage="No comp-off records found."
                  >
                    <Column
                      header="Work Date"
                      body={(row) =>
                        row.WorkDate ? new Date(row.WorkDate).toLocaleDateString() : "-"
                      }
                    />
                    <Column header="Status" field="Status" />
                    <Column header="Used" body={(row) => (row.IsUsed ? "Yes" : "No")} />
                    <Column
                      header="Expiry"
                      body={(row) =>
                        row.ExpiryDate ? new Date(row.ExpiryDate).toLocaleDateString() : "-"
                      }
                    />
                    <Column header="Approved By" body={(row) => row.ApprovedBy ?? "-"} />
                    <Column
                      header="Approved On"
                      body={(row) =>
                        row.ApprovedOn ? new Date(row.ApprovedOn).toLocaleDateString() : "-"
                      }
                    />
                    <Column
                      header="Created On"
                      body={(row) =>
                        row.CreatedOn ? new Date(row.CreatedOn).toLocaleString() : "-"
                      }
                    />
                    <Column
                      header="Actions"
                      body={(row) => {
                        const disabled =
                          !canActionRow(row) || processingIds.has(row?.Id);
                        return (
                          <div className="d-flex gap-2">
                            <Button
                              label="Approve"
                              icon="pi pi-check"
                              className="p-button-success p-button-sm attendance-task-btn"
                              disabled={disabled}
                              onClick={() => approveRow(row)}
                            />
                            <Button
                              label="Reject"
                              icon="pi pi-times"
                              className="p-button-danger p-button-sm attendance-task-btn"
                              disabled={disabled}
                              onClick={() => openReject(row)}
                            />
                          </div>
                        );
                      }}
                    />
                  </DataTable>
                </Dialog>

                <Dialog
                  header="Reject Comp Off"
                  visible={rejectDialogVisible}
                  style={{ width: "600px" }}
                  modal
                  onHide={() => {
                    setRejectDialogVisible(false);
                    setRejectRow(null);
                    setRejectRemark("");
                  }}
                  footer={
                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        label="Cancel"
                        className="p-button-text"
                        onClick={() => {
                          setRejectDialogVisible(false);
                          setRejectRow(null);
                          setRejectRemark("");
                        }}
                      />
                      <Button
                        label="Reject"
                        icon="pi pi-times"
                        className="p-button-danger"
                        onClick={confirmReject}
                        disabled={!rejectRow?.Id || processingIds.has(rejectRow?.Id)}
                      />
                    </div>
                  }
                >
                    <div className="p-fluid">
                      <label>Rejection Remark</label>
                      <InputTextarea
                        rows={4}
                      value={rejectRemark}
                      onChange={(e) => setRejectRemark(e.target.value)}
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                </Dialog>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PrimeReactProvider>
  );
};

export default Compoff;
