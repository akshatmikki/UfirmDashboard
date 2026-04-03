import React from "react";

export default function DeleteConfirmModal({
  showDelete,
  deleteTitle,
  selectedInfo,
  onCancel,
  onConfirm,
}) {
  if (!showDelete) return null;

  return (
    <div className="mc-overlay">
      <div className="mc-modal small">
        <div className="mc-modal-head">
          <span>
            <span className="mc-ico warn">
              <i className="fas fa-exclamation-triangle" />
            </span>
            {deleteTitle}
          </span>
          <button onClick={onCancel} type="button">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="mc-modal-body">
          <p className="mc-field-val">
            {showDelete.type === "category"
              ? "Are you sure you want to delete this category? This action cannot be undone."
              : showDelete.type === "shift"
              ? "Are you sure you want to delete this shift? This action cannot be undone."
              : "Are you sure you want to delete this frequency? This action cannot be undone."}
          </p>

          <div className="mc-info-box">
            {showDelete.type === "category" ? (
              <>
                <div>
                  <b>Category ID:</b> #{selectedInfo?.catId || showDelete.id}
                </div>
                <div>
                  <b>Category Name:</b> {selectedInfo?.name || "-"}
                </div>
                <div>
                  <b>Sub-categories:</b> {selectedInfo?.subCount ?? "-"}
                </div>
              </>
            ) : showDelete.type === "shift" ? (
              <>
                <div>
                  <b>Shift ID:</b> #{selectedInfo?.ShiftId || showDelete.id}
                </div>
                <div>
                  <b>Shift Name:</b> {selectedInfo?.ShiftName || showDelete.name || "-"}
                </div>
              </>
            ) : (
              <>
                <div>
                  <b>Frequency ID:</b> #{selectedInfo?.Id || showDelete.id}
                </div>
                <div>
                  <b>Frequency Name:</b> {selectedInfo?.Name || "-"}
                </div>
              </>
            )}
          </div>

          {showDelete.type === "category" ? (
            <div className="mc-warn-box">
              <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />
              All sub-categories associated with this category will also be deleted.
            </div>
          ) : null}
        </div>

        <div className="mc-modal-foot">
          <button className="mc-btn ghost" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="mc-btn delete" onClick={onConfirm} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

