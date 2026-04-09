import React from "react";
import { esm } from "../Payroll/EmployeeShiftMapping/employeeShiftStyling";

export default function ShiftMappingSidePanel({
  mapping,
  employees,
  shifts,
  mode,
  form,
  setForm,
  onSave,
  onClose,
  onCancel,
  setMode,
}) {
  if (!mapping) return null;

  return (
    <div className={esm.side}>
      {/* Header */}
      <div className={esm.sideHead}>
        <span className={esm.sideIco}>
          <i className="fas fa-id-badge" />
        </span>
        <span className="flex-1 text-sm">
          {mode === "edit" ? "Edit Mapping" : "Mapping Details"}
        </span>
        <button
          className={esm.sideClose}
          onClick={onClose}
          title="Close"
        >
          <i className="fas fa-times" />
        </button>
      </div>

      {/* Body */}
      <div className={esm.sideBody}>
        {mode === "view" ? (
          /* ── View mode ── */
          <div className="space-y-3">
            <div className={esm.kv}>
              <span className={esm.kvKey}>Employee</span>
              <span className={esm.kvVal}>{mapping._employeeName}</span>
            </div>
            <div className={esm.kv}>
              <span className={esm.kvKey}>Shift</span>
              <span className={esm.kvVal}>
                <span className={esm.badge}>{mapping._shiftName}</span>
              </span>
            </div>
            <div className={esm.kv}>
              <span className={esm.kvKey}>Effective From</span>
              <span className={esm.kvVal}>{mapping._effectiveFrom}</span>
            </div>
            <div className={esm.kv}>
              <span className={esm.kvKey}>Effective To</span>
              <span className={esm.kvVal}>{mapping._effectiveTo}</span>
            </div>
            <div className={esm.kv}>
              <span className={esm.kvKey}>Mapping ID</span>
              <span className={esm.kvVal + " text-gray-400"}>{mapping.Id}</span>
            </div>
          </div>
        ) : (
          /* ── Edit mode ── */
          <>
            {/* Employee */}
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

            {/* Shift */}
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
          </>
        )}
      </div>

      {/* Footer */}
      <div className={esm.sideFoot}>
        {mode === "view" ? (
          <button
            className={esm.btnPrimary}
            onClick={() => setMode("edit")}
          >
            <i className="fas fa-edit" style={{ marginRight: "6px" }} />
            Edit
          </button>
        ) : (
          <>
            <button
              className={esm.btnGhost}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button className={esm.btnPrimary} onClick={onSave}>
              <i className="fas fa-save" style={{ marginRight: "6px" }} />
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}