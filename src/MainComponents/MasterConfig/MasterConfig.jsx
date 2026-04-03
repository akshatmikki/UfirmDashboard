import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import * as appCommon from "../../Common/AppCommon.js";
import ApiProvider from "../Calendar/DataProvider";
import { addFrequency, addScheduleCategory, createShift, deleteFrequency, deleteScheduleCategory, deleteShift, getFrequencyList, getScheduleCategoryList, getShiftList, updateFrequency, updateScheduleCategory, updateShift } from "../../Services/masterService";
import { masterConfigCss } from "./masterConfigTheme";
import { initCat, initFreq, initShift, units } from "./constants";
import { getOccurrenceCode, normalizeCategory, qFilter } from "./utils";
import AddItemModal from "./components/AddItemModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import MasterSidePanel from "./components/MasterSidePanel";
import MasterTable from "./components/MasterTable";
import MasterTabs from "./components/MasterTabs";

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
      const data = await getShiftList(selectedPropertyId);
      setShifts(Array.isArray(data) ? data : []);
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

  const catRows = useMemo(() => qFilter(cats, query, ["catId", "name"]).map((c) => ({ ...c, subCount: subs.filter((s) => Number(s.CategoryId) === Number(c.catId)).length })), [cats, query, subs]);
  const freqRows = useMemo(() => qFilter(freqs, query, ["Id", "Name", "Fvalue", "Funit"]), [freqs, query]);
  const shiftRows = useMemo(() => qFilter(shifts, query, ["ShiftId", "ShiftName"]), [shifts, query]);
  const selectedSubs = useMemo(() => (selected?.type === "category" ? subs.filter((s) => Number(s.CategoryId) === Number(selected.id)) : []), [selected, subs]);

  const selectRow = useCallback(
    (row) => {
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
    },
    [subs, tab]
  );

  const addSubToForm = () => {
    const text = catForm.newSub.trim();
    if (!text) return;
    setCatForm((p) => ({ ...p, subs: [...p.subs, { id: 0, name: text }], newSub: "" }));
  };

  const removeSubFromForm = (idx) => {
    setCatForm((p) => ({ ...p, subs: p.subs.filter((_, i) => i !== idx) }));
  };

  const saveCategory = async (fromAdd = false) => {
    if (!catForm.name.trim()) return appCommon.showtextalert("Please enter category name.", "", "warning");

    const payload = {
      ScheduleCategoryId: Number(catForm.id || 0),
      CategoryName: catForm.name.trim(),
      Description: catForm.description?.trim() || null,
      IsActive: true,
      CreatedBy: selectedUserId,
      UpdatedBy: selectedUserId,
    };

    try {
      if (Number(catForm.id) > 0) await updateScheduleCategory(Number(catForm.id), payload);
      else await addScheduleCategory(payload);
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
      categoryId = Number(byName.sort((a, b) => Number(b.catId) - Number(a.catId))[0]?.catId || 0);
    }

    const newSubs = (catForm.subs || []).filter((s) => !s.id && s.name.trim());
    await Promise.all(
      newSubs.map((s) =>
        api.manageSubCategory(
          [{ categoryId: categoryId || Number(catForm.id), subCategoryName: s.name.trim(), subCategoryId: null }],
          "C"
        )
      )
    );

    appCommon.showtextalert("Category saved successfully!", "", "success");
    if (fromAdd) setShowAdd(null);
    else setMode("view");
    await loadAll();
  };

  const saveFrequency = async (fromAdd = false) => {
    if (!freqForm.name.trim()) return appCommon.showtextalert("Please enter frequency name.", "", "warning");
    if (String(freqForm.value).trim() === "")
      return appCommon.showtextalert("Please enter frequency value.", "", "warning");
    if (Number(freqForm.value) <= 0)
      return appCommon.showtextalert("Frequency value must be greater than 0.", "", "warning");

    const payload = {
      Name: freqForm.name.trim(),
      Fvalue: Number(freqForm.value),
      Funit: freqForm.unit,
      Occurence: getOccurrenceCode(freqForm.name),
      IsActive: true,
      PropertyId: selectedPropertyId,
    };

    try {
      if (freqForm.id) await updateFrequency(Number(freqForm.id), payload);
      else await addFrequency(payload);
    } catch (error) {
      console.error("Unable to save frequency", error);
      return appCommon.showtextalert("Unable to save frequency.", "", "error");
    }

    appCommon.showtextalert("Frequency saved successfully!", "", "success");
    if (fromAdd) setShowAdd(null);
    else setMode("view");
    await loadAll();
  };

  const saveShift = async (fromAdd = false) => {
    if (!shiftForm.ShiftName || !shiftForm.ShiftName.trim())
      return appCommon.showtextalert("Please enter shift name.", "", "warning");
    if (!shiftForm.TimeFrom) return appCommon.showtextalert("Please enter shift start time.", "", "warning");
    if (!shiftForm.TimeTo) return appCommon.showtextalert("Please enter shift end time.", "", "warning");

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
      if (Number(shiftForm.ShiftId) > 0) await updateShift(payload);
      else await createShift(payload);
    } catch (error) {
      console.error("Unable to save shift", error);
      return appCommon.showtextalert("Unable to save shift.", "", "error");
    }

    appCommon.showtextalert("Shift saved successfully!", "", "success");
    if (fromAdd) setShowAdd(null);
    else setMode("view");
    await loadShifts();
  };

  const confirmDelete = async () => {
    if (!showDelete) return;

    let success = false;
    if (showDelete.type === "category") {
      try {
        const resp = await deleteScheduleCategory(showDelete.id);
        success = !!resp?.ok;
      } catch (error) {
        console.error("Unable to delete category", error);
      }
    } else if (showDelete.type === "shift") {
      try {
        const resp = await deleteShift(showDelete.id);
        success = !!resp?.ok;
      } catch (error) {
        console.error("Unable to delete shift", error);
      }
    } else {
      try {
        const resp = await deleteFrequency(showDelete.id);
        success = !!resp?.ok;
      } catch (error) {
        console.error("Unable to delete frequency", error);
      }
    }

    if (!success) return appCommon.showtextalert("Unable to delete item.", "", "error");
    appCommon.showtextalert("Deleted successfully!", "", "success");
    setShowDelete(null);
    setSelected(null);
    if (showDelete.type === "shift") await loadShifts();
    else await loadAll();
  };

  const handleChangeTab = (nextTab) => { setTab(nextTab); setQuery(""); setSelected(null); setMode("view"); };
  const handleOpenAdd = () => { setShowAdd(tab === "categories" ? "category" : tab === "frequencies" ? "frequency" : "shift"); setCatForm(initCat); setFreqForm(initFreq); setShiftForm(initShift); };

  const deleteTitle =
    showDelete?.type === "category" ? "Delete Category" : showDelete?.type === "shift" ? "Delete Shift" : "Delete Frequency";
  const selectedInfo =
    showDelete?.type === "category"
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
          <MasterTabs tab={tab} onTabChange={handleChangeTab} />
          <div className="mc-tools">
            <div className="mc-search">
              <i className="fas fa-search" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ID" />
            </div>
            <button className="mc-btn-add" type="button" onClick={handleOpenAdd}>
              <i className="fa fa-plus" />{" "}
              {tab === "categories" ? "Add Category" : tab === "frequencies" ? "Add Frequency" : "Add Shift"}
            </button>
          </div>

          <MasterTable
            tab={tab}
            loading={loading}
            selected={selected}
            catRows={catRows}
            freqRows={freqRows}
            shiftRows={shiftRows}
            onSelectRow={selectRow}
            onEditRow={(row) => {
              selectRow(row);
              setMode("edit");
            }}
            onDeleteRow={setShowDelete}
          />
        </div>

        {selected ? (
          <MasterSidePanel
            tab={tab}
            mode={mode}
            selectedSubs={selectedSubs}
            catForm={catForm}
            freqForm={freqForm}
            shiftForm={shiftForm}
            units={units}
            setCatForm={setCatForm}
            setFreqForm={setFreqForm}
            setShiftForm={setShiftForm}
            addSubToForm={addSubToForm}
            removeSubFromForm={removeSubFromForm}
            onClose={() => setSelected(null)}
            onSave={() => (tab === "categories" ? saveCategory(false) : tab === "frequencies" ? saveFrequency(false) : saveShift(false))}
            setMode={setMode}
          />
        ) : null}
      </div>

      <AddItemModal
        showAdd={showAdd}
        catForm={catForm}
        freqForm={freqForm}
        shiftForm={shiftForm}
        units={units}
        setCatForm={setCatForm}
        setFreqForm={setFreqForm}
        setShiftForm={setShiftForm}
        onSave={() => (showAdd === "category" ? saveCategory(true) : showAdd === "frequency" ? saveFrequency(true) : saveShift(true))}
        onClose={() => setShowAdd(null)}
      />

      <DeleteConfirmModal
        showDelete={showDelete}
        deleteTitle={deleteTitle}
        selectedInfo={selectedInfo}
        onCancel={() => setShowDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

