import React from "react";
import { esm } from "../Payroll/EmployeeShiftMapping/employeeShiftStyling";

export default function ShiftMappingFilters({
  filters,
  setFilters,
  employees,
  shifts,
}) {
  const noEmployees = !employees.length;
  const noShifts = !shifts.length;

  return (
    <div className={esm.filtersBar}>
      {/* Free-text search */}
      <div className={esm.searchWrap}>
        <i
          className="fas fa-search"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ba5ae",
            fontSize: 12,
          }}
        />
        <input
          className={esm.searchInput}
          value={filters.query}
          onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))}
          placeholder="Search by employee or shift"
        />
      </div>

      {/* Employee filter */}
      <select
        className={esm.filterSelect}
        value={filters.employeeId}
        onChange={(e) =>
          setFilters((p) => ({ ...p, employeeId: e.target.value }))
        }
      >
        <option value="">All Employees</option>
        {employees.map((emp) => (
          <option
            key={emp.FacilityMember.FacilityMemberId}
            value={emp.FacilityMember.FacilityMemberId}
          >
            {emp.Profile.EmployeeName}
          </option>
        ))}
      </select>

      {/* Shift filter */}
      <select
        className={esm.filterSelect}
        value={filters.shiftId}
        onChange={(e) =>
          setFilters((p) => ({ ...p, shiftId: e.target.value }))
        }
      >
        <option value="">All Shifts</option>
        {shifts.map((s) => (
          <option key={s.ShiftId} value={s.ShiftId}>
            {s.ShiftName}
          </option>
        ))}
      </select>

      {/* Clear filters — only shown when something is active */}
      {(filters.query || filters.employeeId || filters.shiftId) && (
        <button
          className={esm.btnGhost}
          style={{ minWidth: "unset", padding: "0 10px" }}
          onClick={() =>
            setFilters({ query: "", employeeId: "", shiftId: "" })
          }
          title="Clear all filters"
        >
          <i className="fas fa-times" /> Clear
        </button>
      )}
    </div>
  );
}