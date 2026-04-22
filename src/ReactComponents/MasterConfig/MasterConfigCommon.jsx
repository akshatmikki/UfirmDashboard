import React, { useCallback, useEffect, useMemo, useState } from "react";
import { masterConfigCss } from "./masterConfigTheme";

function getByPath(obj, path) {
  if (!path) return undefined;
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function valueToString(val) {
  if (val == null) return "";
  return String(val);
}

function qFilter(rows, q, keys) {
  const query = String(q || "").trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((r) =>
    keys.some((k) => valueToString(getByPath(r, k)).toLowerCase().includes(query))
  );
}

function Modal({ title, iconClassName, size = "default", onClose, children, footer }) {
  return (
    <div className="mc-overlay">
      <div className={`mc-modal ${size === "small" ? "small" : ""}`}>
        <div className="mc-modal-head">
          <span>
            {iconClassName ? (
              <span className={`mc-ico ${iconClassName.includes("warn") ? "warn" : ""}`}>
                <i className={iconClassName.replace("warn", "").trim()} />
              </span>
            ) : null}
            {title}
          </span>
          <button onClick={onClose} type="button">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="mc-modal-body">{children}</div>
        {footer ? <div className="mc-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function Field({ field, value, onChange, context }) {
  const type = field.type || "text";
  const placeholder = field.placeholder || "";
  const disabled = !!field.disabled;
  const readOnly = !!field.readOnly;
  const options =
    typeof field.options === "function" ? field.options(context) : Array.isArray(field.options) ? field.options : null;

  if (type === "textarea") {
    return (
      <textarea
        className="mc-textarea"
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === "select") {
    return (
      <select
        className="mc-select"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {(options || []).map((opt) => {
          const v = typeof opt === "object" ? opt.value : opt;
          const label = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={String(v)} value={v}>
              {label}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <input
      className="mc-input"
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * MasterConfigCommon
 *
 * Use this when you want the MasterConfig UI to be reusable across modules,
 * and the module provides the "structure" (tabs/columns/fields + CRUD functions),
 * similar to how `DataGrid` consumes `ColumnCollection` and `GridData`.
 *
 * Props:
 * - `title` (string)
 * - `context` (object): any extra data (propertyId, userId, units, etc.)
 * - `tabs` (array):
 *    {
 *      id, label, entityName,
 *      load: async ({ context }) => rows[],
 *      getId?: (row) => any (default: row.id),
 *      searchKeys?: string[] (default: ["id","name"]),
 *      columns: [{ header, valueKey?: string, render?: (row)=>ReactNode }],
 *      fields: [{ key, label, type?, options?, placeholder?, required?, readOnly?, disabled? }],
 *      initialForm?: ({ context }) => object,
 *      toForm?: ({ row, context }) => object,
 *      validate?: ({ mode, form, context }) => string | null,
 *      save: async ({ mode, form, row, context }) => void,
 *      remove: async ({ row, context }) => void
 *    }
 * - `notify` optional: ({ type, message }) => void
 */
export default function MasterConfigCommon({ title = "Master Configuration", context = {}, tabs = [], notify, useGrid = false }) {
  const tabMap = useMemo(() => new Map(tabs.map((t) => [t.id, t])), [tabs]);
  const defaultTabId = tabs[0]?.id || "";
  const [tabId, setTabId] = useState(defaultTabId);
  const tab = tabMap.get(tabId) || tabs[0];

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [mode, setMode] = useState("view"); // view | edit
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [form, setForm] = useState({});
  const [addForm, setAddForm] = useState({});

  const doNotify = useCallback(
    (type, message) => {
      if (typeof notify === "function") return notify({ type, message });
      if (type === "error") console.error(message);
      else console.log(message);
      if (type === "error" || type === "warning" || type === "success") window.alert(message);
    },
    [notify]
  );

  const getRowId = useCallback((t, r) => (typeof t?.getId === "function" ? t.getId(r) : r?.id), []);

  const refresh = useCallback(async () => {
    if (!tab) return;
    setLoading(true);
    try {
      const data = await tab.load({ context });
      if (Array.isArray(data)) {
        setRows(data);
        setMeta({});
      } else {
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setMeta(data?.meta && typeof data.meta === "object" ? data.meta : {});
      }
    } catch (e) {
      console.error("MasterConfigCommon load failed:", e);
      setRows([]);
      setMeta({});
      doNotify("error", "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [context, doNotify, tab]);

  useEffect(() => {
    setTabId(defaultTabId);
  }, [defaultTabId]);

  useEffect(() => {
    refresh();
  }, [refresh, tabId]);

  useEffect(() => {
    setQuery("");
    setSelectedRow(null);
    setMode("view");
    setShowAdd(false);
    setShowDelete(false);
    setMeta({});

    const initial =
      typeof tab?.initialForm === "function"
        ? tab.initialForm({ context, meta })
        : tab?.fields?.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});
    setForm(initial || {});
    setAddForm(initial || {});
  }, [context, tab, tabId]);

  const filteredRows = useMemo(() => {
    const keys = tab?.searchKeys?.length ? tab.searchKeys : ["id", "name"];
    return qFilter(rows, query, keys);
  }, [query, rows, tab]);

  const onSelect = useCallback(
    (row) => {
      setSelectedRow(row);
      setMode("view");
      const next =
        typeof tab?.toForm === "function"
          ? tab.toForm({ row, context, meta })
          : tab?.fields?.reduce((acc, f) => ({ ...acc, [f.key]: getByPath(row, f.key) ?? "" }), {});
      setForm(next || {});
    },
    [context, meta, tab]
  );

  const onEdit = useCallback(
    (row) => {
      onSelect(row);
      setMode("edit");
    },
    [onSelect]
  );

  const openAdd = useCallback(() => {
    const initial =
      typeof tab?.initialForm === "function"
        ? tab.initialForm({ context, meta })
        : tab?.fields?.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});
    setAddForm(initial || {});
    setShowAdd(true);
  }, [context, meta, tab]);

  const validateRequired = useCallback(
    (t, current) => {
      const required = (t?.fields || []).filter((f) => f.required);
      for (const f of required) {
        const v = current?.[f.key];
        if (String(v ?? "").trim() === "") return `${f.label || f.key} is required.`;
      }
      return null;
    },
    []
  );

  const save = useCallback(
    async ({ mode: saveMode, currentForm, row }) => {
      if (!tab) return;

      const customError =
        typeof tab.validate === "function" ? tab.validate({ mode: saveMode, form: currentForm, context, meta }) : null;
      const requiredError = validateRequired(tab, currentForm);
      const error = customError || requiredError;
      if (error) return doNotify("warning", error);

      setLoading(true);
      try {
        await tab.save({ mode: saveMode, form: currentForm, row, context, meta });
        doNotify("success", `${tab.entityName || "Item"} saved successfully!`);
        setShowAdd(false);
        setMode("view");
        await refresh();
      } catch (e) {
        console.error("MasterConfigCommon save failed:", e);
        doNotify("error", `Unable to save ${tab.entityName || "item"}.`);
      } finally {
        setLoading(false);
      }
    },
    [context, doNotify, meta, refresh, tab, validateRequired]
  );

  const remove = useCallback(async () => {
    if (!tab || !selectedRow) return;
    setLoading(true);
    try {
      await tab.remove({ row: selectedRow, context, meta });
      doNotify("success", `${tab.entityName || "Item"} deleted successfully!`);
      setShowDelete(false);
      setSelectedRow(null);
      setMode("view");
      await refresh();
    } catch (e) {
      console.error("MasterConfigCommon delete failed:", e);
      doNotify("error", `Unable to delete ${tab.entityName || "item"}.`);
    } finally {
      setLoading(false);
    }
  }, [context, doNotify, meta, refresh, selectedRow, tab]);

  const deleteTitle = `${showDelete ? "Delete " : ""}${tab?.entityName || "Item"}`;
  const selectedId = selectedRow ? getRowId(tab, selectedRow) : null;

  return (
    <div className="mc-wrap">
      <style>{masterConfigCss}</style>
      <h3 className="mc-head">
        <span className="mc-head-title">{title}</span>
      </h3>

      <div className="mc-grid" style={{ gridTemplateColumns: selectedRow ? "minmax(0,1fr) 390px" : "1fr" }}>
        <div className="mc-card">
          <div className="mc-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`mc-tab ${tabId === t.id ? "active" : ""}`}
                type="button"
                onClick={() => setTabId(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mc-tools">
            <div className="mc-search">
              <i className="fas fa-search" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
            </div>
            <button className="mc-btn-add" type="button" onClick={openAdd} disabled={!tab}>
              <i className="fa fa-plus" /> {tab?.addLabel || `Add ${tab?.entityName || "Item"}`}
            </button>
          </div>

          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead>
                <tr>
                  {(tab?.columns || []).map((c, idx) => (
                    <th key={`${c.header || idx}`}>{c.header}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredRows.length === 0 ? (
                  <tr>
                    <td className="mc-empty" colSpan={(tab?.columns?.length || 0) + 1}>
                      Loading...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td className="mc-empty" colSpan={(tab?.columns?.length || 0) + 1}>
                      No data found.
                    </td>
                  </tr>
                ) : null}

                {filteredRows.map((r) => (
                  <tr
                    key={String(getRowId(tab, r))}
                    className={selectedId != null && String(selectedId) === String(getRowId(tab, r)) ? "mc-row-active" : ""}
                    onClick={() => onSelect(r)}
                  >
                    {(tab?.columns || []).map((c, idx) => {
                      const val = c.render ? c.render(r) : c.valueKey ? getByPath(r, c.valueKey) : "";
                      return <td key={`${c.header || idx}`}>{val}</td>;
                    })}
                    <td>
                      <div className="mc-actions">
                        <button
                          className="mc-act"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(r);
                          }}
                        >
                          <i className="far fa-edit" />
                        </button>
                        <button
                          className="mc-act"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(r);
                            setShowDelete(true);
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
        </div>

        {selectedRow ? (
          <aside className="mc-side">
            <div className="mc-side-head">
              <span className="mc-ico">
                <i className={`far ${mode === "edit" ? "fa-edit" : "fa-eye"}`} />
              </span>
              {mode === "edit" ? `Edit ${tab?.entityName || "Item"}` : `${tab?.entityName || "Item"} Details`}
            </div>

            <div className={`mc-side-body ${useGrid ? "mc-form-grid" : ""}`}>
              {mode === "view" ? (
                (tab?.fields || []).map((f) => {
                  const v = form?.[f.key];
                  return (
                    <div className={`mc-kv ${f.colSpan === 2 ? "full" : ""}`} key={f.key}>
                      <span className="mc-kv-key">{f.label || f.key}</span>
                      <span className="mc-kv-val">
                        {typeof f.renderView === "function"
                          ? f.renderView({ value: v, form, row: selectedRow, context, meta, mode })
                          : valueToString(v ?? "-") || "-"}
                      </span>
                    </div>
                  );
                })
              ) : (
                (tab?.fields || []).map((f) => {
                  const v = form?.[f.key];
                  return (
                    <div className={f.colSpan === 2 ? "full" : ""} key={f.key}>
                      <p className="mc-field-label">{f.label || f.key}</p>
                      {typeof f.renderEdit === "function" ? (
                        f.renderEdit({
                          value: v,
                          form,
                          row: selectedRow,
                          context,
                          meta,
                          mode,
                          setForm: (updater) => setForm((p) => (typeof updater === "function" ? updater(p || {}) : updater)),
                        })
                      ) : (
                        <Field
                          field={{
                            ...f,
                            options:
                              typeof f.options === "function" ? () => f.options({ context, meta }) : f.options,
                          }}
                          value={v}
                          context={{ context, meta }}
                          onChange={(next) => setForm((p) => ({ ...(p || {}), [f.key]: next }))}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mc-side-footer">
              {mode === "view" ? (
                <>
                  <button className="mc-btn primary" type="button" onClick={() => setMode("edit")}>
                    Edit
                  </button>
                  <button className="mc-btn ghost" type="button" onClick={() => setSelectedRow(null)}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="mc-btn primary"
                    type="button"
                    onClick={() => save({ mode: "edit", currentForm: form, row: selectedRow })}
                    disabled={loading}
                  >
                    Save
                  </button>
                  <button className="mc-btn ghost" type="button" onClick={() => setMode("view")} disabled={loading}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {showAdd ? (
        <Modal
          title={tab?.addLabel || `Add ${tab?.entityName || "Item"}`}
          iconClassName="fa fa-plus"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button
                className="mc-btn primary"
                onClick={() => save({ mode: "add", currentForm: addForm, row: null })}
                type="button"
                disabled={loading}
              >
                Save
              </button>
              <button className="mc-btn ghost" onClick={() => setShowAdd(false)} type="button" disabled={loading}>
                Cancel
              </button>
            </>
          }
        >
          <div className={useGrid ? "mc-form-grid" : ""}>
            {(tab?.fields || []).filter(f => !f.hideInAdd).map((f) => (
              <div className={f.colSpan === 2 ? "full" : ""} key={f.key}>
                <p className="mc-field-label">{f.label || f.key}</p>
                {typeof f.renderEdit === "function" ? (
                  f.renderEdit({
                    value: addForm?.[f.key],
                    form: addForm,
                    row: null,
                    context,
                    meta,
                    mode: "add",
                    setForm: (updater) =>
                      setAddForm((p) => (typeof updater === "function" ? updater(p || {}) : updater)),
                  })
                ) : (
                  <Field
                    field={{
                      ...f,
                      options: typeof f.options === "function" ? () => f.options({ context, meta }) : f.options,
                    }}
                    value={addForm?.[f.key]}
                    context={{ context, meta }}
                    onChange={(next) => setAddForm((p) => ({ ...(p || {}), [f.key]: next }))}
                  />
                )}
              </div>
            ))}
          </div>
        </Modal>
      ) : null}

      {showDelete && selectedRow ? (
        <Modal
          title={deleteTitle}
          iconClassName="warn fas fa-exclamation-triangle"
          size="small"
          onClose={() => setShowDelete(false)}
          footer={
            <>
              <button className="mc-btn ghost" onClick={() => setShowDelete(false)} type="button" disabled={loading}>
                Cancel
              </button>
              <button className="mc-btn delete" onClick={remove} type="button" disabled={loading}>
                Delete
              </button>
            </>
          }
        >
          <p className="mc-field-val">
            Are you sure you want to delete this {tab?.entityName || "item"}? This action cannot be undone.
          </p>
          <div className="mc-info-box">
            <div>
              <b>ID:</b> {valueToString(selectedId ?? "-") || "-"}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
