import React from "react";
import { esm } from "../Payroll/EmployeeShiftMapping/employeeShiftStyling";

export default function DeleteConfirmModal({
  show,
  itemLabel,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <div 
      className={esm.overlay}
      onClick={onCancel}
    >
      <div 
        className={esm.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={esm.modalHead}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <div className={`${esm.modalHeadIcon} warn`}>
              <i className="fas fa-exclamation-triangle" />
            </div>
            <div className={esm.modalHeadTitle}>Delete Shift Mapping</div>
          </div>
          <button
            className={esm.modalHeadClose}
            onClick={onCancel}
            title="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div className={esm.modalBody}>
          <div className={esm.warnBox}>
            {itemLabel ? (
              <>
                Are you sure you want to remove the shift assignment for{" "}
                <strong>"{itemLabel}"</strong>?
              </>
            ) : (
              "Are you sure you want to remove this shift assignment?"
            )}
            <div style={{ fontSize: "12px", color: "#9ba5ae", fontWeight: "400", marginTop: "8px" }}>
              This action cannot be undone.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={esm.modalFoot}>
          <button 
            className={esm.btnGhost}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className={esm.btnDanger}
            onClick={onConfirm}
          >
            <i className="fas fa-trash-alt" style={{ marginRight: "6px" }} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}