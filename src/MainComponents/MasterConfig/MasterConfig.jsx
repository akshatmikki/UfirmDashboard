import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as appCommon from "../../Common/AppCommon.js";
import ApiProvider from "../Calendar/DataProvider";
import {
  addFrequency,
  addScheduleCategory,
  deleteFrequency,
  deleteScheduleCategory,
  getFrequencyList,
  getScheduleCategoryList,
  updateFrequency,
  updateScheduleCategory,
} from "../../Services/masterService";
import { masterConfigCss } from "./masterConfigTheme";
import { set } from "date-fns";
import { use } from "react";

const initCat = { id: 0, name: "", description: "", subs: [], newSub: "" };
const initFreq = { id: 0, name: "", value: "", unit: "Days" };
const initShift = { ShiftId: 0, ShiftName: "", TimeFrom: "", TimeTo: "" };
const units = ["Minutes", "Hours", "Days", "Weeks", "Months"];

const qFilter = (rows, q, keys) => (!q.trim()
  ? rows
  : rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))));

const getOccurrenceCode = (name = "") => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return trimmed.length >= 3 ? trimmed.substring(0, 3).toUpperCase() : trimmed.toUpperCase();
};

const normalizeCategory = (row = {}) => ({
  catId: Number(row.catId ?? row.ScheduleCategoryId ?? 0),
  name: row.name ?? row.CategoryName ?? "",
  description: row.description ?? row.Description ?? "",
  isActive: row.isActive ?? row.IsActive ?? true,
});

export default function MasterConfig() {
  const api = useMemo(() => new ApiProvider(), []);
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const userId = useSelector((state) => state.Commonreducer.userId);
  const selectedPropertyId = Number(propertyId) > 0 ? Number(propertyId) : null;
  const selectedUserId = Number(userId) > 0 ? Number(userId) : 1;
  const [tab, setTab] = useState("categories");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [freqs, setFreqs] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("view");
  const [showAdd, setShowAdd] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [catForm, setCatForm] = useState(initCat);
  const [freqForm, setFreqForm] = useState(initFreq);
  const [shiftForm, setShiftForm] = useState(initShift);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, f] = await Promise.all([
        getScheduleCategoryList(),
        api.manageSubCategory([{ CmdType: "R" }], "R", 0).then((r) => (r?.ok ? r.json() : [])),
        getFrequencyList(selectedPropertyId),
      ]);
      setCats(Array.isArray(c) ? c.map((x) => normalizeCategory(x)) : []);
      setSubs(Array.isArray(s) ? s : []);
      setFreqs(Array.isArray(f) ? f : []);
    } finally {
      setLoading(false);
    }
  }, [api, selectedPropertyId]);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.urest.in:8096/api/ShiftMaster/getbypropertyid=${selectedPropertyId}`);
      const data = await (res.ok ? res.json() : []);
      setShifts(Array.isArray(data) ? data : []);
      setShiftForm(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Unable to load shifts:", error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === "shiftmaster") loadShifts();
    }, [tab, loadShifts]);

  const catRows = useMemo(
    () => qFilter(cats, query, ["catId", "name"]).map((c) => ({
      ...c,
      subCount: subs.filter((s) => Number(s.CategoryId) === Number(c.catId)).length,
    })),
    [cats, query, subs]
  );
  const freqRows = useMemo(() => qFilter(freqs, query, ["Id", "Name", "Fvalue", "Funit"]), [freqs, query]);
  const shiftRows = useMemo(() => qFilter(shifts, query, ["ShiftId", "ShiftName"]), [shifts, query]);
  
  const selectedSubs = useMemo(
    () => (selected?.type === "category"
      ? subs.filter((s) => Number(s.CategoryId) === Number(selected.id))
      : []),
    [selected, subs]
  );

const selectRow = (row) => {
    if (tab === "shiftmaster") {
      setSelected({ type: "shift", id: row.ShiftId });
      setMode("view");
      setShiftForm({
        ShiftId: row.ShiftId,
        ShiftName: row.ShiftName || "",
        TimeFrom: row.TimeFrom || "",
        TimeTo: row.TimeTo || "",
      });
      setCatForm(initCat);
      setFreqForm(initFreq);
      return;
    }
    
    const isCat = tab === "categories";
    const id = isCat ? row.catId : row.Id;
    setSelected({ type: isCat ? "category" : "frequency", id });
    setMode("view");
    
    if (isCat) {
      setCatForm({
        id: row.catId,
        name: row.name || "",
        description: row.description || "",
        subs: subs
          .filter((s) => Number(s.CategoryId) === Number(row.catId))
          .map((s) => ({ id: s.SubCategoryId, name: s.SubCategoryName })),
        newSub: "",
      });
      setFreqForm(initFreq);
      return;
    }

    setCatForm(initCat);
    setFreqForm({
      id: row.Id,
      name: row.Name || "",
      value: row.Fvalue ?? "",
      unit: row.Funit || "Days",
    });
  };

  const addSubToForm = () => {
    const t = catForm.newSub.trim();
    if (!t) return;
    setCatForm((p) => ({ ...p, subs: [...p.subs, { id: 0, name: t }], newSub: "" }));
  };

  const removeSubFromForm = (idx) => {
    setCatForm((p) => ({ ...p, subs: p.subs.filter((_, i) => i !== idx) }));
  };

  const saveCategory = async (fromAdd = false) => {
    if (!catForm.name.trim()) {
      return appCommon.showtextalert("Please enter category name.", "", "warning");
    }

    const isEdit = Number(catForm.id) > 0;
    const payload = {
      ScheduleCategoryId: Number(catForm.id || 0),
      CategoryName: catForm.name.trim(),
      Description: catForm.description?.trim() || null,
      IsActive: true,
      CreatedBy: selectedUserId,
      UpdatedBy: selectedUserId,
    };

    try {
      if (isEdit) {
        await updateScheduleCategory(Number(catForm.id), payload);
      } else {
        await addScheduleCategory(payload);
      }
    } catch (error) {
      console.error("Unable to save category", error);
      return appCommon.showtextalert("Unable to save category.", "", "error");
    }

    let categoryId = Number(catForm.id || 0);
    if (!categoryId) {
      const fresh = await getScheduleCategoryList();
      const byName = (fresh || [])
        .map((x) => normalizeCategory(x))
        .filter((x) => String(x.name || "").toLowerCase() === catForm.name.trim().toLowerCase());
      categoryId = Number(
        byName
          .sort((a, b) => Number(b.catId) - Number(a.catId))[0]?.catId || 0
      );
    }

    const newSubs = (catForm.subs || []).filter((s) => !s.id && s.name.trim());
    await Promise.all(
      newSubs.map((s) => api.manageSubCategory([{
        categoryId: categoryId || Number(catForm.id),
        subCategoryName: s.name.trim(),
        subCategoryId: null,
      }], "C"))
    );

    appCommon.showtextalert("Category saved successfully!", "", "success");
    if (fromAdd) {
      setShowAdd(null);
    } else {
      setMode("view");
    }
    await loadAll();
  };

  const saveFrequency = async (fromAdd = false) => {
    if (!freqForm.name.trim()) {
      return appCommon.showtextalert("Please enter frequency name.", "", "warning");
    }
    if (String(freqForm.value).trim() === "") {
      return appCommon.showtextalert("Please enter frequency value.", "", "warning");
    }
    if (Number(freqForm.value) <= 0) {
      return appCommon.showtextalert("Frequency value must be greater than 0.", "", "warning");
    }

    const payload = {
      Name: freqForm.name.trim(),
      Fvalue: Number(freqForm.value),
      Funit: freqForm.unit,
      Occurence: getOccurrenceCode(freqForm.name),
      IsActive: true,
      PropertyId: selectedPropertyId,
    };

    try {
      if (freqForm.id) {
        await updateFrequency(Number(freqForm.id), payload);
      } else {
        await addFrequency(payload);
      }
    } catch (error) {
      console.error("Unable to save frequency", error);
      return appCommon.showtextalert("Unable to save frequency.", "", "error");
    }

    appCommon.showtextalert("Frequency saved successfully!", "", "success");
    if (fromAdd) {
      setShowAdd(null);
    } else {
      setMode("view");
    }
    await loadAll();
  };

  const saveShift = async (fromAdd = false) => {
   if (!shiftForm.ShiftName || !shiftForm.ShiftName.trim()) {
      return appCommon.showtextalert("Please enter shift name.", "", "warning");
    }
    if (!shiftForm.TimeFrom) {
      return appCommon.showtextalert("Please enter shift start time.", "", "warning");
    }
    if (!shiftForm.TimeTo) {
      return appCommon.showtextalert("Please enter shift end time.", "", "warning");
    }

    const isEdit = Number(shiftForm.ShiftId) > 0;
    const payload = {
      ShiftId: Number(shiftForm.ShiftId || 0),
      ShiftName: shiftForm.ShiftName.trim(),
      TimeFrom: shiftForm.TimeFrom,
      TimeTo: shiftForm.TimeTo,
      PropertyId: selectedPropertyId,
      IsActive: true,
      CreatedBy: selectedUserId,
      ModifiedBy: selectedUserId,
    };

    try {
      if (isEdit) {
        const res = await fetch(`https://api.urest.in:8096/api/ShiftMaster/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`https://api.urest.in:8096/api/ShiftMaster/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      }
    } catch (error) {
      console.error("Unable to save shift", error);
      return appCommon.showtextalert("Unable to save shift.", "", "error");
    }

    appCommon.showtextalert("Shift saved successfully!", "", "success");
    if (fromAdd) {
      setShowAdd(null);
    } else {
      setMode("view");
    }
    await loadShifts();
  };

  const confirmDelete = async () => {
    if (!showDelete) return;

    const isCat = showDelete.type === "category";
    const isShift = showDelete.type === "shift";
    let success = false;

     if (isCat) {
      try {
        const resp = await deleteScheduleCategory(showDelete.id);
        success = !!resp?.ok;
      } catch (error) {
        console.error("Unable to delete category", error);
        success = false;
      }
    } else if (isShift) {
      try {
        const resp = await fetch(`https://api.urest.in:8096/api/ShiftMaster/delete/${showDelete.id}`, { method: "DELETE" });
        success = resp.ok;
      } catch (error) {
        console.error("Unable to delete shift", error);
        success = false;
      }
    } else {
      try {
        const resp = await deleteFrequency(showDelete.id);
        success = !!resp?.ok;
      } catch (error) {
        console.error("Unable to delete frequency", error);
        success = false;
      }
    }

    if (!success) return appCommon.showtextalert("Unable to delete item.", "", "error");

    appCommon.showtextalert("Deleted successfully!", "", "success");
    setShowDelete(null);
    setSelected(null);
    if (isShift) {
      await loadShifts();
    } else {
      await loadAll();
    }
  };

  const addModal = showAdd === "category"
    ? {
      title: "Add Category",
      save: () => saveCategory(true),
      body: (
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
      ),
    }
    : showAdd === "frequency"
      ? {
        title: "Add Frequency",
        save: () => saveFrequency(true),
        body: (
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
        ),
      }
      : showAdd === "shift"
        ? {
          title: "Add Shift",
          save: () => saveShift(true),
          body: (
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
          ),
        }
        : null;

  const deleteTitle = showDelete?.type === "category" ? "Delete Category" : showDelete?.type === "shift"
      ? "Delete Shift"
      : "Delete Frequency";
  const selectedInfo = showDelete?.type === "category"
    ? catRows.find((r) => Number(r.catId) === Number(showDelete?.id))
        : showDelete?.type === "shift"
      ? shiftRows.find((r) => Number(r.ShiftId) === Number(showDelete?.id))
    : freqRows.find((r) => Number(r.Id) === Number(showDelete?.id));

   return (
    <div className="mc-wrap">
      <style>{masterConfigCss}</style>
      <h3 className="mc-head">
        <span className="mc-head-title">Master Configuration</span>
      </h3>
      <div className="mc-grid" style={{ gridTemplateColumns: selected ? "minmax(0,1fr) 390px" : "1fr" }}>
        <div className="mc-card">
          <div className="mc-tabs">
            <button
              className={`mc-tab ${tab === "categories" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setTab("categories");
                setQuery("");
                setSelected(null);
              }}
            >
              Categories
            </button>
            <button
              className={`mc-tab ${tab === "frequencies" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setTab("frequencies");
                setQuery("");
                setSelected(null);
              }}
            >
              Frequencies
            </button>
            <button
              className={`mc-tab ${tab === "shiftmaster" ? "active" : ""}`}
              type="button"
              onClick={() => {
                setTab("shiftmaster");
                setQuery("");
                setSelected(null);
              }}
            >
              Shift
            </button>
          </div>
          <div className="mc-tools">
            <div className="mc-search">
              <i className="fas fa-search" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID"
              />
            </div>
            <button
              className="mc-btn-add"
              type="button"
              onClick={() => {
                setShowAdd(tab === "categories" ? "category" : tab === "frequencies" ? "frequency" : "shift");
                setCatForm(initCat);
                setFreqForm(initFreq);
                setShiftForm(initShift);
              }}
            >
              <i className="fa fa-plus" />{" "}
              {tab === "categories" ? "Add Category" : tab === "frequencies" ? "Add Frequency" : "Add Shift"}
            </button>
          </div>
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead>
                {tab === "categories" ? (
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Sub-category</th>
                    <th>Actions</th>
                  </tr>
                ) : tab === "frequencies" ? (
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>ID</th>
                    <th>Shift Name</th>
                    <th>Time From</th>
                    <th>Time To</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="mc-empty" colSpan={tab === "categories" ? 4 : 5}>Loading...</td>
                  </tr>
                ) : (tab === "categories" ? catRows : tab === "frequencies" ? freqRows : shiftRows).length === 0 ? (
                  <tr>
                    <td className="mc-empty" colSpan={tab === "categories" ? 4 : 5}>No data found.</td>
                  </tr>
                ) : null}

                {tab === "categories"
                  ? catRows.map((r) => (
                    <tr
                      key={r.catId}
                      className={selected?.type === "category" && Number(selected.id) === Number(r.catId) ? "mc-row-active" : ""}
                      onClick={() => selectRow(r)}
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
                              selectRow(r);
                              setMode("edit");
                            }}
                          >
                            <i className="far fa-edit" />
                          </button>
                          <button
                            className="mc-act"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDelete({ type: "category", id: r.catId });
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
                        className={selected?.type === "frequency" && Number(selected.id) === Number(r.Id) ? "mc-row-active" : ""}
                        onClick={() => selectRow(r)}
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
                                selectRow(r);
                                setMode("edit");
                              }}
                            >
                              <i className="far fa-edit" />
                            </button>
                            <button
                              className="mc-act"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDelete({ type: "frequency", id: r.Id });
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
                        className={selected?.type === "shift" && Number(selected.id) === Number(r.ShiftId) ? "mc-row-active" : ""}
                        onClick={() => selectRow(r)}
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
                                selectRow(r);
                                setMode("edit");
                              }}
                            >
                              <i className="far fa-edit" />
                            </button>
                            <button
                              className="mc-act"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDelete({ type: "shift", id: r.ShiftId, name: r.ShiftName });
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

        {selected ? (
          <aside className="mc-side">
            <div className="mc-side-head">
              <span className="mc-ico">
                <i className={`far ${mode === "edit" ? "fa-edit" : "fa-eye"}`} />
              </span>
              {tab === "categories"
                ? (mode === "edit" ? "Edit Category" : "Category Details")
                : tab === "frequencies"
                  ? (mode === "edit" ? "Edit Frequency" : "Frequency Details")
                  : (mode === "edit" ? "Edit Shift" : "Shift Details")}
            </div>
            <div className="mc-side-body">
              {tab === "categories" ? (
                mode === "view" ? (
                  <>
                    <div className="mc-kv"><span className="mc-kv-key">ID</span><span className="mc-kv-val">#{catForm.id}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Name</span><span className="mc-kv-val">{catForm.name || "-"}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Description</span><span className="mc-kv-val">{catForm.description || "-"}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Sub-categories</span><span className="mc-kv-val" /></div>
                    {selectedSubs.length
                      ? selectedSubs.map((s) => (
                        <div className="mc-sub-item mc-sub-item--readonly" key={s.SubCategoryId}>
                          <span>{s.SubCategoryName}</span>
                        </div>
                      ))
                      : <p className="mc-field-val">No sub-categories.</p>}
                  </>
                ) : (
                  <>
                    <p className="mc-field-label">ID</p>
                    <p className="mc-field-val">#{catForm.id}</p>
                    <p className="mc-field-label">Name</p>
                    <input className="mc-input" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} />
                    <p className="mc-field-label">Description</p>
                    <textarea className="mc-textarea" value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} />
                    <p className="mc-field-label">Sub-categories</p>
                    <div className="mc-sub-add">
                      <input
                        className="mc-input"
                        value={catForm.newSub}
                        onChange={(e) => setCatForm((p) => ({ ...p, newSub: e.target.value }))}
                        placeholder="Sub-category name"
                      />
                      <button className="mc-btn primary" onClick={addSubToForm} type="button">+ Add</button>
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
                    <div className="mc-kv"><span className="mc-kv-key">ID</span><span className="mc-kv-val">#{freqForm.id}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Name</span><span className="mc-kv-val">{freqForm.name || "-"}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Value</span><span className="mc-kv-val">{freqForm.value || "-"}</span></div>
                    <div className="mc-kv"><span className="mc-kv-key">Unit</span><span className="mc-kv-val">{freqForm.unit || "-"}</span></div>
                  </>
                ) : (
                  <>
                    <p className="mc-field-label">ID</p>
                    <p className="mc-field-val">#{freqForm.id}</p>
                    <p className="mc-field-label">Name</p>
                    <input className="mc-input" value={freqForm.name} onChange={(e) => setFreqForm((p) => ({ ...p, name: e.target.value }))} />
                    <p className="mc-field-label">Value</p>
                    <input className="mc-input" type="number" value={freqForm.value} onChange={(e) => setFreqForm((p) => ({ ...p, value: e.target.value }))} />
                    <p className="mc-field-label">Unit</p>
                    <select className="mc-select" value={freqForm.unit} onChange={(e) => setFreqForm((p) => ({ ...p, unit: e.target.value }))}>
                      {units.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </>
                )
              ) : mode === "view" ? (
                <>
                  <div className="mc-kv"><span className="mc-kv-key">ID</span><span className="mc-kv-val">#{shiftForm.ShiftId}</span></div>
                  <div className="mc-kv"><span className="mc-kv-key">Shift Name</span><span className="mc-kv-val">{shiftForm.ShiftName || "-"}</span></div>
                  <div className="mc-kv"><span className="mc-kv-key">Time From</span><span className="mc-kv-val">{shiftForm.TimeFrom || "-"}</span></div>
                  <div className="mc-kv"><span className="mc-kv-key">Time To</span><span className="mc-kv-val">{shiftForm.TimeTo || "-"}</span></div>
                </>
              ) : (
                <>
                  <p className="mc-field-label">ID</p>
                  <p className="mc-field-val">#{shiftForm.ShiftId}</p>
                  <p className="mc-field-label">Shift Name</p>
                  <input className="mc-input" value={shiftForm.ShiftName} onChange={(e) => setShiftForm((p) => ({ ...p, ShiftName: e.target.value }))} />
                  <p className="mc-field-label">Time From</p>
                  <input className="mc-input" type="time" value={shiftForm.TimeFrom} onChange={(e) => setShiftForm((p) => ({ ...p, TimeFrom: e.target.value }))} />
                  <p className="mc-field-label">Time To</p>
                  <input className="mc-input" type="time" value={shiftForm.TimeTo} onChange={(e) => setShiftForm((p) => ({ ...p, TimeTo: e.target.value }))} />
                </>
              )}
            </div>
            <div className="mc-side-footer">
              {mode === "view" ? (
                <>
                  <button className="mc-btn primary" type="button" onClick={() => setMode("edit")}>Edit</button>
                  <button className="mc-btn ghost" type="button" onClick={() => setSelected(null)}>Close</button>
                </>
              ) : (
                <>
                  <button
                    className="mc-btn primary"
                    type="button"
                    onClick={() => (
                      tab === "categories" ? saveCategory(false) :
                      tab === "frequencies" ? saveFrequency(false) :
                      saveShift(false)
                    )}
                  >
                    Save
                  </button>
                  <button className="mc-btn ghost" type="button" onClick={() => setMode("view")}>Cancel</button>
                </>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {addModal ? (
        <div className="mc-overlay">
          <div className="mc-modal">
            <div className="mc-modal-head">
              <span>
                <span className="mc-ico">
                  <i className="fa fa-plus" />
                </span>
                {addModal.title}
              </span>
              <button onClick={() => setShowAdd(null)} type="button">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mc-modal-body">{addModal.body}</div>
            <div className="mc-modal-foot">
              <button className="mc-btn primary" onClick={addModal.save} type="button">Save</button>
              <button className="mc-btn ghost" onClick={() => setShowAdd(null)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}

      {showDelete ? (
        <div className="mc-overlay">
          <div className="mc-modal small">
            <div className="mc-modal-head">
              <span>
                <span className="mc-ico warn">
                  <i className="fas fa-exclamation-triangle" />
                </span>
                {deleteTitle}
              </span>
              <button onClick={() => setShowDelete(null)} type="button">
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
                    <div><b>Category ID:</b> #{selectedInfo?.catId || showDelete.id}</div>
                    <div><b>Category Name:</b> {selectedInfo?.name || "-"}</div>
                    <div><b>Sub-categories:</b> {selectedInfo?.subCount ?? "-"}</div>
                  </>
                ) : showDelete.type === "shift" ? (
                  <>
                    <div><b>Shift ID:</b> #{selectedInfo?.ShiftId || showDelete.id}</div>
                    <div><b>Shift Name:</b> {selectedInfo?.ShiftName || showDelete.name || "-"}</div>
                  </>
                ) : (
                  <>
                    <div><b>Frequency ID:</b> #{selectedInfo?.Id || showDelete.id}</div>
                    <div><b>Frequency Name:</b> {selectedInfo?.Name || "-"}</div>
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
              <button className="mc-btn ghost" onClick={() => setShowDelete(null)} type="button">Cancel</button>
              <button className="mc-btn delete" onClick={confirmDelete} type="button">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}