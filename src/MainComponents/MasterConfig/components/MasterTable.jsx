import React from "react";

function renderHeader(tab) {
  if (tab === "categories") {
    return (
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Sub-category</th>
        <th>Actions</th>
      </tr>
    );
  }
  if (tab === "frequencies") {
    return (
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Value</th>
        <th>Unit</th>
        <th>Actions</th>
      </tr>
    );
  }
  return (
    <tr>
      <th>ID</th>
      <th>Shift Name</th>
      <th>Time From</th>
      <th>Time To</th>
      <th>Actions</th>
    </tr>
  );
}

export default function MasterTable({
  tab,
  loading,
  selected,
  catRows,
  freqRows,
  shiftRows,
  onSelectRow,
  onEditRow,
  onDeleteRow,
}) {
  const rows = tab === "categories" ? catRows : tab === "frequencies" ? freqRows : shiftRows;
  const colSpan = tab === "categories" ? 4 : 5;

  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead>{renderHeader(tab)}</thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="mc-empty" colSpan={colSpan}>
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="mc-empty" colSpan={colSpan}>
                No data found.
              </td>
            </tr>
          ) : null}

          {tab === "categories"
            ? catRows.map((r) => (
                <tr
                  key={r.catId}
                  className={
                    selected?.type === "category" && Number(selected.id) === Number(r.catId)
                      ? "mc-row-active"
                      : ""
                  }
                  onClick={() => onSelectRow(r)}
                >
                  <td>#{r.catId}</td>
                  <td>{r.name}</td>
                  <td>
                    <span className="mc-badge">{String(r.subCount).padStart(2, "0")}</span>
                  </td>
                  <td>
                    <div className="mc-actions">
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRow(r);
                        }}
                      >
                        <i className="far fa-edit" />
                      </button>
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRow({ type: "category", id: r.catId });
                        }}
                      >
                        <i className="far fa-trash-alt" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            : tab === "frequencies"
            ? freqRows.map((r) => (
                <tr
                  key={r.Id}
                  className={
                    selected?.type === "frequency" && Number(selected.id) === Number(r.Id)
                      ? "mc-row-active"
                      : ""
                  }
                  onClick={() => onSelectRow(r)}
                >
                  <td>#{r.Id}</td>
                  <td>{r.Name}</td>
                  <td>{r.Fvalue}</td>
                  <td>{r.Funit}</td>
                  <td>
                    <div className="mc-actions">
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRow(r);
                        }}
                      >
                        <i className="far fa-edit" />
                      </button>
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRow({ type: "frequency", id: r.Id });
                        }}
                      >
                        <i className="far fa-trash-alt" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            : shiftRows.map((r) => (
                <tr
                  key={r.ShiftId}
                  className={
                    selected?.type === "shift" && Number(selected.id) === Number(r.ShiftId)
                      ? "mc-row-active"
                      : ""
                  }
                  onClick={() => onSelectRow(r)}
                >
                  <td>#{r.ShiftId}</td>
                  <td>{r.ShiftName}</td>
                  <td>{r.TimeFrom}</td>
                  <td>{r.TimeTo}</td>
                  <td>
                    <div className="mc-actions">
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRow(r);
                        }}
                      >
                        <i className="far fa-edit" />
                      </button>
                      <button
                        className="mc-act"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRow({ type: "shift", id: r.ShiftId, name: r.ShiftName });
                        }}
                      >
                        <i className="far fa-trash-alt" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

