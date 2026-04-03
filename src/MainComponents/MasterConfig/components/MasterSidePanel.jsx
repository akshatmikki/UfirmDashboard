import React from "react";

export default function MasterSidePanel({
  tab,
  mode,
  selectedSubs,
  catForm,
  freqForm,
  shiftForm,
  units,
  setCatForm,
  setFreqForm,
  setShiftForm,
  addSubToForm,
  removeSubFromForm,
  onClose,
  onSave,
  setMode,
}) {
  const title =
    tab === "categories"
      ? mode === "edit"
        ? "Edit Category"
        : "Category Details"
      : tab === "frequencies"
      ? mode === "edit"
        ? "Edit Frequency"
        : "Frequency Details"
      : mode === "edit"
      ? "Edit Shift"
      : "Shift Details";

  return (
    <aside className="mc-side">
      <div className="mc-side-head">
        <span className="mc-ico">
          <i className={`far ${mode === "edit" ? "fa-edit" : "fa-eye"}`} />
        </span>
        {title}
      </div>

      <div className="mc-side-body">
        {tab === "categories" ? (
          mode === "view" ? (
            <>
              <div className="mc-kv">
                <span className="mc-kv-key">ID</span>
                <span className="mc-kv-val">#{catForm.id}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Name</span>
                <span className="mc-kv-val">{catForm.name || "-"}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Description</span>
                <span className="mc-kv-val">{catForm.description || "-"}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Sub-categories</span>
                <span className="mc-kv-val" />
              </div>
              {selectedSubs.length ? (
                selectedSubs.map((s) => (
                  <div className="mc-sub-item mc-sub-item--readonly" key={s.SubCategoryId}>
                    <span>{s.SubCategoryName}</span>
                  </div>
                ))
              ) : (
                <p className="mc-field-val">No sub-categories.</p>
              )}
            </>
          ) : (
            <>
              <p className="mc-field-label">ID</p>
              <p className="mc-field-val">#{catForm.id}</p>
              <p className="mc-field-label">Name</p>
              <input
                className="mc-input"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
              />
              <p className="mc-field-label">Description</p>
              <textarea
                className="mc-textarea"
                value={catForm.description}
                onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
              />
              <p className="mc-field-label">Sub-categories</p>
              <div className="mc-sub-add">
                <input
                  className="mc-input"
                  value={catForm.newSub}
                  onChange={(e) => setCatForm((p) => ({ ...p, newSub: e.target.value }))}
                  placeholder="Sub-category name"
                />
                <button className="mc-btn primary" onClick={addSubToForm} type="button">
                  + Add
                </button>
              </div>
              {(catForm.subs || []).map((s, i) => (
                <div className="mc-sub-item" key={`${s.name}-${i}`}>
                  <span>{s.name}</span>
                  <button onClick={() => removeSubFromForm(i)} type="button">
                    <i className="far fa-trash-alt" />
                  </button>
                </div>
              ))}
            </>
          )
        ) : tab === "frequencies" ? (
          mode === "view" ? (
            <>
              <div className="mc-kv">
                <span className="mc-kv-key">ID</span>
                <span className="mc-kv-val">#{freqForm.id}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Name</span>
                <span className="mc-kv-val">{freqForm.name || "-"}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Value</span>
                <span className="mc-kv-val">{freqForm.value || "-"}</span>
              </div>
              <div className="mc-kv">
                <span className="mc-kv-key">Unit</span>
                <span className="mc-kv-val">{freqForm.unit || "-"}</span>
              </div>
            </>
          ) : (
            <>
              <p className="mc-field-label">ID</p>
              <p className="mc-field-val">#{freqForm.id}</p>
              <p className="mc-field-label">Name</p>
              <input
                className="mc-input"
                value={freqForm.name}
                onChange={(e) => setFreqForm((p) => ({ ...p, name: e.target.value }))}
              />
              <p className="mc-field-label">Value</p>
              <input
                className="mc-input"
                type="number"
                value={freqForm.value}
                onChange={(e) => setFreqForm((p) => ({ ...p, value: e.target.value }))}
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
          )
        ) : mode === "view" ? (
          <>
            <div className="mc-kv">
              <span className="mc-kv-key">ID</span>
              <span className="mc-kv-val">#{shiftForm.ShiftId}</span>
            </div>
            <div className="mc-kv">
              <span className="mc-kv-key">Shift Name</span>
              <span className="mc-kv-val">{shiftForm.ShiftName || "-"}</span>
            </div>
            <div className="mc-kv">
              <span className="mc-kv-key">Time From</span>
              <span className="mc-kv-val">{shiftForm.TimeFrom || "-"}</span>
            </div>
            <div className="mc-kv">
              <span className="mc-kv-key">Time To</span>
              <span className="mc-kv-val">{shiftForm.TimeTo || "-"}</span>
            </div>
          </>
        ) : (
          <>
            <p className="mc-field-label">ID</p>
            <p className="mc-field-val">#{shiftForm.ShiftId}</p>
            <p className="mc-field-label">Shift Name</p>
            <input
              className="mc-input"
              value={shiftForm.ShiftName}
              onChange={(e) => setShiftForm((p) => ({ ...p, ShiftName: e.target.value }))}
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

      <div className="mc-side-footer">
        {mode === "view" ? (
          <>
            <button className="mc-btn primary" type="button" onClick={() => setMode("edit")}>
              Edit
            </button>
            <button className="mc-btn ghost" type="button" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <button className="mc-btn primary" type="button" onClick={onSave}>
              Save
            </button>
            <button className="mc-btn ghost" type="button" onClick={() => setMode("view")}>
              Cancel
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

