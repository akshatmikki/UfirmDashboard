import React from "react";
import { esm } from "../Payroll/EmployeeShiftMapping/employeeShiftStyling";

export default function ShiftMappingTable({
  rows,
  loading,
  selected,
  onSelectRow,
  onEditRow,
  onDeleteRow,
}) {
  if (loading) {
    return (
      <div className={esm.tableWrap}>
        <div className={esm.loadingState}>
          <i className="fas fa-spinner fa-spin mr-2" />
          Loading shift mappings...
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className={esm.tableWrap}>
        <div className={esm.emptyState}>
          <i className="fas fa-calendar-times mb-2 block text-2xl text-gray-300" />
          No shift mappings found.
        </div>
      </div>
    );
  }

  return (
    <div className={esm.tableWrap}>
      <table className={esm.table}>
        <thead>
          <tr>
            <th className={esm.th}>#</th>
            <th className={esm.th}>Employee</th>
            <th className={esm.th}>Shift</th>
            <th className={esm.th}>Effective From</th>
            <th className={esm.th}>Effective To</th>
            <th className={esm.th} style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isActive = selected?.Id === row.Id;
            return (
              <tr
                key={row.Id}
                className={isActive ? esm.trActive : esm.tr}
                onClick={() => onSelectRow(row)}
              >
                <td className={esm.td}>{idx + 1}</td>
                <td className={esm.td}>{row._employeeName}</td>
                <td className={esm.td}>
                  <span className={esm.badge}>{row._shiftName}</span>
                </td>
                <td className={esm.td}>{row._effectiveFrom}</td>
                <td className={esm.td}>{row._effectiveTo}</td>
                <td className={esm.td} style={{ width: "120px", textAlign: "center", padding: "9px 0" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
                    <button
                      className={esm.actEdit}
                      title="Edit mapping"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRow(row);
                      }}
                    >
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      className={esm.actDelete}
                      title="Delete mapping"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRow(row);
                      }}
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}