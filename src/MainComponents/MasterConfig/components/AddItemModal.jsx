import React from "react";

export default function AddItemModal({
  showAdd,
  catForm,
  freqForm,
  shiftForm,
  units,
  setCatForm,
  setFreqForm,
  setShiftForm,
  onSave,
  onClose,
}) {
  if (!showAdd) return null;

  const title =
    showAdd === "category" ? "Add Category" : showAdd === "frequency" ? "Add Frequency" : "Add Shift";

  return (
    <div className="mc-overlay">
      <div className="mc-modal">
        <div className="mc-modal-head">
          <span>
            <span className="mc-ico">
              <i className="fa fa-plus" />
            </span>
            {title}
          </span>
          <button onClick={onClose} type="button">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="mc-modal-body">
          {showAdd === "category" ? (
            <>
              <p className="mc-field-label">Name</p>
              <input
                className="mc-input"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
              />
              <p className="mc-field-label">Description</p>
              <textarea
                className="mc-textarea"
                value={catForm.description}
                onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Category description"
              />
            </>
          ) : showAdd === "frequency" ? (
            <>
              <p className="mc-field-label">Name</p>
              <input
                className="mc-input"
                value={freqForm.name}
                onChange={(e) => setFreqForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Once a day"
              />
              <p className="mc-field-label">Value</p>
              <input
                className="mc-input"
                type="number"
                value={freqForm.value}
                onChange={(e) => setFreqForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="1"
              />
              <p className="mc-field-label">Unit</p>
              <select
                className="mc-select"
                value={freqForm.unit}
                onChange={(e) => setFreqForm((p) => ({ ...p, unit: e.target.value }))}
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <p className="mc-field-label">Shift Name</p>
              <input
                className="mc-input"
                value={shiftForm.ShiftName}
                onChange={(e) => setShiftForm((p) => ({ ...p, ShiftName: e.target.value }))}
                placeholder="e.g. Morning Shift"
              />
              <p className="mc-field-label">Time From</p>
              <input
                className="mc-input"
                type="time"
                value={shiftForm.TimeFrom}
                onChange={(e) => setShiftForm((p) => ({ ...p, TimeFrom: e.target.value }))}
              />
              <p className="mc-field-label">Time To</p>
              <input
                className="mc-input"
                type="time"
                value={shiftForm.TimeTo}
                onChange={(e) => setShiftForm((p) => ({ ...p, TimeTo: e.target.value }))}
              />
            </>
          )}
        </div>

        <div className="mc-modal-foot">
          <button className="mc-btn primary" onClick={onSave} type="button">
            Save
          </button>
          <button className="mc-btn ghost" onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

