import React from "react";
import { esm } from "../EmployeeShiftMapping/employeeShiftStyling";

export default function AssignShiftModal({
  show,
  employees,
  shifts,
  form,
  setForm,
  onSave,
  onClose,
  existingMappings,
}) {
  if (!show) return null;

  // Show current shift assignments for the selected employee as a heads-up
  const employeeCurrentMappings = existingMappings.filter(
    (m) => Number(m.EmployeeId) === Number(form.employeeId)
  );

  return (
    <div 
      className={esm.overlay}
      onClick={onClose}
    >
      <div 
        className={esm.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={esm.modalHead}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <div className={esm.modalHeadIcon}>
              <i className="fas fa-calendar-plus" />
            </div>
            <div className={esm.modalHeadTitle}>Assign Shift to Employee</div>
          </div>
          <button
            className={esm.modalHeadClose}
            onClick={onClose}
            title="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div className={esm.modalBody}>
          {/* Employee dropdown */}
          <div className={esm.fieldWrap}>
            <label className={esm.label}>
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              className={esm.select}
              value={form.employeeId}
              onChange={(e) =>
                setForm((p) => ({ ...p, employeeId: e.target.value }))
              }
            >
              <option value="">— Select Employee —</option>
              {employees.map((emp) => (
                <option
                  key={emp.FacilityMember.FacilityMemberId}
                  value={emp.FacilityMember.FacilityMemberId}
                >
                  {emp.Profile.EmployeeName}
                </option>
              ))}
            </select>
          </div>

          {/* Existing mappings info for selected employee */}
          {form.employeeId && employeeCurrentMappings.length > 0 && (
            <div className={esm.infoBox}>
              <strong>Existing shift assignments for this employee:</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                {employeeCurrentMappings.map((m) => (
                  <li key={m.Id}>
                    <span className="font-semibold">{m._shiftName}</span>{" "}
                    &nbsp;({m._effectiveFrom} → {m._effectiveTo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shift dropdown */}
          <div className={esm.fieldWrap}>
            <label className={esm.label}>
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              className={esm.select}
              value={form.shiftId}
              onChange={(e) =>
                setForm((p) => ({ ...p, shiftId: e.target.value }))
              }
            >
              <option value="">— Select Shift —</option>
              {shifts.map((s) => (
                <option key={s.ShiftId} value={s.ShiftId}>
                  {s.ShiftName} ({s.TimeFrom?.slice(0, 5)} – {s.TimeTo?.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          {/* Effective From */}
          <div className={esm.fieldWrap}>
            <label className={esm.label}>
              Effective From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={esm.input}
              value={form.effectiveFrom}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveFrom: e.target.value }))
              }
            />
          </div>

          {/* Effective To */}
          <div className={esm.fieldWrap}>
            <label className={esm.label}>
              Effective To{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className={esm.input}
              value={form.effectiveTo}
              min={form.effectiveFrom || undefined}
              onChange={(e) =>
                setForm((p) => ({ ...p, effectiveTo: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className={esm.modalFoot}>
          <button 
            className={esm.btnGhost}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={esm.btnPrimary}
            onClick={onSave}
          >
            <i className="fas fa-check" style={{ marginRight: "6px" }} />
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}