import React from "react";
import ApiProvider from "../Calendar/DataProvider";
import {
  addFrequency,
  addScheduleCategory,
  createShift,
  deleteFrequency,
  deleteScheduleCategory,
  deleteShift,
  getFrequencyList,
  getScheduleCategoryList,
  getShiftList,
  updateFrequency,
  updateScheduleCategory,
  updateShift,
} from "../../Services/masterService";
import { getOccurrenceCode, normalizeCategory } from "./utils";
import { initCat, initFreq, initShift, units } from "./constants";

async function loadSubCategories(api) {
  const resp = await api.manageSubCategory([{ CmdType: "R" }], "R", 0);
  if (resp?.ok) return resp.json();
  return [];
}

export function createMasterConfigContext({ api, selectedPropertyId, selectedUserId }) {
  return { api, selectedPropertyId, selectedUserId };
}

export function createMasterConfigTabs() {
  return [
    {
      id: "categories",
      label: "Categories",
      entityName: "Category",
      searchKeys: ["catId", "name"],
      columns: [
        { header: "ID", render: (r) => `#${r.catId}` },
        { header: "Name", valueKey: "name" },
        {
          header: "Sub-category",
          render: (r) => <span className="mc-badge">{String(r.subCount || 0).padStart(2, "0")}</span>,
        },
      ],
      fields: [
        { key: "id", label: "ID", readOnly: true, hideInAdd: true },
        { key: "name", label: "Name", required: true, placeholder: "Category name" },
        { key: "description", label: "Description", type: "textarea", placeholder: "Category description" },
        {
          key: "subs",
          label: "Sub-categories",
          hideInAdd: true,
          renderView: ({ row, meta }) => {
            const subs = (meta?.subs || []).filter((s) => Number(s.CategoryId) === Number(row?.catId));
            if (!subs.length) return "No sub-categories.";
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {subs.map((s) => (
                  <div className="mc-sub-item mc-sub-item--readonly" key={s.SubCategoryId}>
                    <span>{s.SubCategoryName}</span>
                  </div>
                ))}
              </div>
            );
          },
          renderEdit: ({ form, setForm }) => {
            const add = () => {
              const text = String(form?.newSub || "").trim();
              if (!text) return;
              setForm((p) => ({ ...p, subs: [...(p.subs || []), { id: 0, name: text }], newSub: "" }));
            };
            const removeAt = (idx) => setForm((p) => ({ ...p, subs: (p.subs || []).filter((_, i) => i !== idx) }));
            return (
              <>
                <div className="mc-sub-add">
                  <input
                    className="mc-input"
                    value={form?.newSub || ""}
                    onChange={(e) => setForm((p) => ({ ...p, newSub: e.target.value }))}
                    placeholder="Sub-category name"
                  />
                  <button className="mc-btn primary" onClick={add} type="button">
                    + Add
                  </button>
                </div>
                {(form?.subs || []).map((s, i) => (
                  <div className="mc-sub-item" key={`${s.name}-${i}`}>
                    <span>{s.name}</span>
                    <button onClick={() => removeAt(i)} type="button">
                      <i className="far fa-trash-alt" />
                    </button>
                  </div>
                ))}
              </>
            );
          },
        },
      ],
      initialForm: () => initCat,
      toForm: ({ row, meta }) => ({
        id: row.catId,
        name: row.name || "",
        description: row.description || "",
        subs: (meta?.subs || [])
          .filter((s) => Number(s.CategoryId) === Number(row.catId))
          .map((s) => ({ id: s.SubCategoryId, name: s.SubCategoryName })),
        newSub: "",
      }),
      load: async ({ context }) => {
        const api = context.api || new ApiProvider();
        const [catsRaw, subs] = await Promise.all([getScheduleCategoryList(), loadSubCategories(api)]);
        const cats = Array.isArray(catsRaw) ? catsRaw.map((x) => normalizeCategory(x)) : [];
        const rows = cats.map((c) => ({
          ...c,
          subCount: (subs || []).filter((s) => Number(s.CategoryId) === Number(c.catId)).length,
        }));
        return { rows, meta: { subs: Array.isArray(subs) ? subs : [] } };
      },
      validate: ({ form }) => {
        if (!String(form?.name || "").trim()) return "Please enter category name.";
        return null;
      },
      save: async ({ form, context }) => {
        const selectedUserId = context.selectedUserId;
        const api = context.api || new ApiProvider();

        const payload = {
          ScheduleCategoryId: Number(form.id || 0),
          CategoryName: String(form.name || "").trim(),
          Description: String(form.description || "").trim() || null,
          IsActive: true,
          CreatedBy: selectedUserId,
          UpdatedBy: selectedUserId,
        };

        if (Number(form.id) > 0) await updateScheduleCategory(Number(form.id), payload);
        else await addScheduleCategory(payload);

        let categoryId = Number(form.id || 0);
        if (!categoryId) {
          const fresh = await getScheduleCategoryList();
          const byName = (fresh || [])
            .map((x) => normalizeCategory(x))
            .filter((x) => String(x.name || "").toLowerCase() === String(form.name || "").trim().toLowerCase());
          categoryId = Number(byName.sort((a, b) => Number(b.catId) - Number(a.catId))[0]?.catId || 0);
        }

        const newSubs = (form.subs || []).filter((s) => !s.id && String(s.name || "").trim());
        await Promise.all(
          newSubs.map((s) =>
            api.manageSubCategory(
              [{ categoryId: categoryId || Number(form.id), subCategoryName: String(s.name || "").trim(), subCategoryId: null }],
              "C"
            )
          )
        );
      },
      remove: async ({ row }) => deleteScheduleCategory(row.catId),
    },
    {
      id: "frequencies",
      label: "Frequencies",
      entityName: "Frequency",
      searchKeys: ["Id", "Name", "Fvalue", "Funit"],
      columns: [
        { header: "ID", render: (r) => `#${r.Id}` },
        { header: "Name", valueKey: "Name" },
        { header: "Value", valueKey: "Fvalue" },
        { header: "Unit", valueKey: "Funit" },
      ],
      fields: [
        { key: "id", label: "ID", readOnly: true, hideInAdd: true },
        { key: "name", label: "Name", required: true, placeholder: "Once a day" },
        { key: "value", label: "Value", type: "number", required: true, placeholder: "1" },
        {
          key: "unit",
          label: "Unit",
          type: "select",
          options: () => units,
        },
      ],
      initialForm: () => initFreq,
      toForm: ({ row }) => ({
        id: row.Id,
        name: row.Name || "",
        value: row.Fvalue ?? "",
        unit: row.Funit || "Days",
      }),
      load: async ({ context }) => getFrequencyList(context.selectedPropertyId),
      validate: ({ form }) => {
        if (!String(form?.name || "").trim()) return "Please enter frequency name.";
        if (String(form?.value ?? "").trim() === "") return "Please enter frequency value.";
        if (Number(form.value) <= 0) return "Frequency value must be greater than 0.";
        return null;
      },
      save: async ({ form, context }) => {
        const payload = {
          Name: String(form.name || "").trim(),
          Fvalue: Number(form.value),
          Funit: form.unit,
          Occurence: getOccurrenceCode(form.name),
          IsActive: true,
          PropertyId: context.selectedPropertyId,
        };

        if (form.id) await updateFrequency(Number(form.id), payload);
        else await addFrequency(payload);
      },
      remove: async ({ row }) => deleteFrequency(row.Id),
    },
    {
      id: "shiftmaster",
      label: "Shift",
      entityName: "Shift",
      searchKeys: ["ShiftId", "ShiftName"],
      columns: [
        { header: "ID", render: (r) => `#${r.ShiftId}` },
        { header: "Shift Name", valueKey: "ShiftName" },
        { header: "Time From", valueKey: "TimeFrom" },
        { header: "Time To", valueKey: "TimeTo" },
      ],
      fields: [
        { key: "ShiftId", label: "ID", readOnly: true, hideInAdd: true },
        { key: "ShiftName", label: "Shift Name", required: true, placeholder: "e.g. Morning Shift" },
        { key: "TimeFrom", label: "Time From", type: "time", required: true },
        { key: "TimeTo", label: "Time To", type: "time", required: true },
      ],
      initialForm: () => initShift,
      toForm: ({ row }) => ({
        ShiftId: row.ShiftId,
        ShiftName: row.ShiftName || "",
        TimeFrom: row.TimeFrom || "",
        TimeTo: row.TimeTo || "",
      }),
      load: async ({ context }) => getShiftList(context.selectedPropertyId),
      validate: ({ form }) => {
        if (!String(form?.ShiftName || "").trim()) return "Please enter shift name.";
        if (!form?.TimeFrom) return "Please enter shift start time.";
        if (!form?.TimeTo) return "Please enter shift end time.";
        return null;
      },
      save: async ({ form, context }) => {
        const payload = {
          ShiftId: Number(form.ShiftId || 0),
          ShiftName: String(form.ShiftName || "").trim(),
          TimeFrom: form.TimeFrom,
          TimeTo: form.TimeTo,
          PropertyId: context.selectedPropertyId,
          IsActive: true,
          CreatedBy: context.selectedUserId,
          ModifiedBy: context.selectedUserId,
        };
        if (Number(form.ShiftId) > 0) await updateShift(payload);
        else await createShift(payload);
      },
      remove: async ({ row }) => deleteShift(row.ShiftId),
    },
  ];
}
