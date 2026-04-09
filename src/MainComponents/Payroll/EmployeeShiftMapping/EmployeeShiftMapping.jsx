import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as appCommon from "../../../Common/AppCommon.js";
import {
  getEmployeesByOffice,
  getShiftsByProperty,
  getMappingsByProperty,
  createMapping,
  updateMapping,
  deleteMapping,
} from "../../../Services/empShiftMappingService.js";
import { esm, esmCss } from "./employeeShiftStyling.js";
import { initMappingForm, initFilters } from "./constants.js";
import {
  resolveEmployeeName,
  resolveShiftName,
  formatDate,
  qFilter,
  validateForm,
  checkDuplicate,
  checkOverlap,
} from "./utils.js";
import ShiftMappingFilters from "../ComponentsEmployeeShiftMapping/ShiftMappingFilters";
import ShiftMappingTable from "../ComponentsEmployeeShiftMapping/ShiftMappingTable";
import ShiftMappingSidePanel from "../ComponentsEmployeeShiftMapping/ShiftMappingSidePanel";
import AssignShiftModal from "../ComponentsEmployeeShiftMapping/AssignShiftModal";
import DeleteConfirmModal from "../ComponentsEmployeeShiftMapping/DeleteConfirmModal";

export default function EmployeeShiftMapping() {
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const userId = useSelector((state) => state.Commonreducer.userId);
  const selectedPropertyId = Number(propertyId) > 0 ? Number(propertyId) : null;
  const selectedUserId = Number(userId) > 0 ? Number(userId) : 1;

  // ── Core data ──────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ── UI state ───────────────────────────────────────────────
  const [selected, setSelected] = useState(null);   // currently clicked row
  const [mode, setMode] = useState("view");          // "view" | "edit"
  const [form, setForm] = useState(initMappingForm);
  const [filters, setFilters] = useState(initFilters);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(null); // row object to delete

  // ── Load everything on mount ───────────────────────────────
  const loadAll = useCallback(async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [empData, shiftData, mappingData] = await Promise.all([
        getEmployeesByOffice(selectedPropertyId),
        getShiftsByProperty(selectedPropertyId),
        getMappingsByProperty(selectedPropertyId),
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setShifts(Array.isArray(shiftData) ? shiftData : []);
      setMappings(Array.isArray(mappingData) ? mappingData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setLoadError("Failed to load data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Inject CSS styles ──────────────────────────────────────
  useEffect(() => {
    const styleId = "esm-styles";
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.textContent = esmCss;
      document.head.appendChild(styleTag);
    }
    return () => {
      // Optional: remove on unmount
      // const existingStyle = document.getElementById(styleId);
      // if (existingStyle) existingStyle.remove();
    };
  }, []);

  // ── Enrich mappings with resolved display names ────────────
  const enrichedMappings = useMemo(
    () =>
      mappings.map((m) => ({
        ...m,
        _employeeName: resolveEmployeeName(employees, m.EmployeeId),
        _shiftName: resolveShiftName(shifts, m.ShiftId),
        _effectiveFrom: formatDate(m.EffectiveFrom),
        _effectiveTo: formatDate(m.EffectiveTo),
      })),
    [mappings, employees, shifts]
  );

  // ── Apply filters ──────────────────────────────────────────
  const filteredRows = useMemo(
    () => qFilter(enrichedMappings, filters),
    [enrichedMappings, filters]
  );

  // ── Row selection → populate side panel ───────────────────
  const selectRow = useCallback((row) => {
    setSelected(row);
    setMode("view");
    setForm({
      id: row.Id,
      employeeId: String(row.EmployeeId),
      shiftId: String(row.ShiftId),
      effectiveFrom: row.EffectiveFrom ? row.EffectiveFrom.split("T")[0] : "",
      effectiveTo: row.EffectiveTo ? row.EffectiveTo.split("T")[0] : "",
    });
  }, []);

  // ── Open assign modal with clean form ─────────────────────
  const handleOpenAdd = () => {
    setForm(initMappingForm);
    setShowAdd(true);
  };

  // ── Save (create or update) ────────────────────────────────
  const handleSave = async (fromAdd = false) => {
    // 1. Field-level validation
    const validationError = validateForm(form);
    if (validationError)
      return appCommon.showtextalert(validationError, "", "warning");

    // 2. Exact duplicate: same employee + same shift already mapped
    if (checkDuplicate(mappings, form))
      return appCommon.showtextalert(
        "This shift is already assigned to this employee.",
        "",
        "warning"
      );

    // 3. Date-range overlap: check if shift times actually collide
    if (checkOverlap(mappings, form, shifts))
      return appCommon.showtextalert(
        "This employee already has a shift with overlapping times during this period. Please choose a different shift or date range.",
        "",
        "warning"
      );

    const payload = {
      Id: Number(form.id || 0),
      EmployeeId: Number(form.employeeId),
      ShiftId: Number(form.shiftId),
      EffectiveFrom: form.effectiveFrom,
      EffectiveTo: form.effectiveTo || null,
      PropertyId: selectedPropertyId,
      IsActive: true,
      CreatedBy: selectedUserId,
      ModifiedBy: selectedUserId,
    };

    try {
      if (Number(form.id) > 0) await updateMapping(payload);
      else await createMapping(payload);
    } catch (err) {
      console.error("Save failed:", err);
      return appCommon.showtextalert(
        "Failed to save shift mapping. Please try again.",
        "",
        "error"
      );
    }

    appCommon.showtextalert("Shift mapping saved successfully!", "", "success");
    if (fromAdd) {
      setShowAdd(false);
    } else {
      setSelected(null);
      setMode("view");
    }
    await loadAll();
  };

  // ── Delete ─────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!showDelete) return;
    try {
      await deleteMapping(showDelete.Id);
    } catch (err) {
      console.error("Delete failed:", err);
      return appCommon.showtextalert(
        "Failed to delete the shift mapping. Please try again.",
        "",
        "error"
      );
    }
    appCommon.showtextalert("Shift mapping deleted successfully!", "", "success");
    setShowDelete(null);
    setSelected(null);
    await loadAll();
  };

  // Label shown in delete modal: "Avinash Tiwari — morning"
  const deleteLabel = showDelete
    ? `${showDelete._employeeName} — ${showDelete._shiftName}`
    : "";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px 20px 20px 40px", minHeight: "calc(100vh - 58px)", marginLeft: "40px" }}>
      {/* Page card wrapper */}
      <div className={esm.card} style={{ padding: "20px" }}>
        {/* Page heading with Assign button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h3 className={esm.head}>
            <i className="fas fa-calendar-alt" style={{ marginRight: "10px" }} />
            Employee Shift Mapping
          </h3>
          <button
            className={esm.btnAssign}
            onClick={handleOpenAdd}
            title="Assign new shift to employee"
          >
            <i className="fas fa-plus" /> Assign Shift
          </button>
        </div>

        {/* Load error banner */}
        {loadError && <div className={esm.errorBanner}>{loadError}</div>}

        {/* Main grid — collapses to single column when no row is selected */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "minmax(0,1fr) 380px" : "1fr",
            gap: "10px",
            alignItems: "start",
          }}
        >
          {/* Left: filters + table */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #d7dde4",
              borderRadius: "9px",
              overflow: "hidden",
            }}
          >
            <ShiftMappingFilters
              filters={filters}
              setFilters={setFilters}
              employees={employees}
              shifts={shifts}
            />
            <ShiftMappingTable
              rows={filteredRows}
              loading={loading}
              selected={selected}
              onSelectRow={selectRow}
              onEditRow={(row) => {
                selectRow(row);
                setMode("edit");
              }}
              onDeleteRow={setShowDelete}
            />
          </div>

        {/* Right: detail / edit panel */}
        {selected && (
          <ShiftMappingSidePanel
            mapping={selected}
            employees={employees}
            shifts={shifts}
            mode={mode}
            form={form}
            setForm={setForm}
            onSave={() => handleSave(false)}
            onClose={() => {
              setSelected(null);
              setMode("view");
            }}
            onCancel={() => {
              // Close the side panel entirely when canceling edit
              setSelected(null);
              setMode("view");
            }}
            setMode={setMode}
          />
        )}
        </div>

        {/* Assign shift modal */}
        <AssignShiftModal
          show={showAdd}
          employees={employees}
          shifts={shifts}
          form={form}
          setForm={setForm}
          onSave={() => handleSave(true)}
          onClose={() => setShowAdd(false)}
          existingMappings={enrichedMappings}
        />

        {/* Delete confirmation modal */}
        <DeleteConfirmModal
          show={!!showDelete}
          itemLabel={deleteLabel}
          onConfirm={confirmDelete}
          onCancel={() => setShowDelete(null)}
        />
      </div>
    </div>
  );
}