import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { MasterConfigCommon } from "../ReactComponents/MasterConfig";
import {
  createCategory,
  createItem,
  createVendor,
  deleteCategory,
  deleteItem,
  deleteVendor,
  getAllItems,
  getCategories,
  getVendors,
  updateCategory,
  updateItem,
  updateVendor,
} from "../Services/InventoryService";

function asBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return false;
}

export default function InventoryMasterConfigPage() {
  const propertyId = useSelector((s) => s.Commonreducer.puidn);
  const userId = useSelector((s) => s.Commonreducer.userId);

  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  const refreshLookups = useCallback(async () => {
    if (!propertyId) {
      setCategories([]);
      setVendors([]);
      return;
    }
    try {
      const cats = await getCategories(propertyId).catch(() => []);
      const vens = await getVendors(propertyId).catch(() => []);
      setCategories(Array.isArray(cats) ? cats : []);
      setVendors(Array.isArray(vens) ? vens : []);
    } catch {
      setCategories([]);
      setVendors([]);
    }
  }, [propertyId]);

  useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  const context = useMemo(
    () => ({
      propertyId,
      userId,
      categories,
      vendors,
      refreshLookups,
    }),
    [propertyId, userId, categories, vendors, refreshLookups]
  );

  const tabs = useMemo(
    () => [
      {
        id: "category",
        label: "Category",
        entityName: "Category",
        addLabel: "Add Category",
        getId: (r) => r?.Id,
        searchKeys: ["Id", "Name", "Description"],
        load: async ({ context }) => {
          if (!context?.propertyId) return [];
          const rows = await getCategories(context.propertyId);
          return Array.isArray(rows) ? rows : [];
        },
        columns: [
          { header: "Id", valueKey: "Id" },
          { header: "Name", valueKey: "Name" },
          { header: "Description", valueKey: "Description" },
          {
            header: "Approved",
            render: (r) => (
              <span className="mc-badge" style={{ background: asBool(r?.IsApproved) ? "#d9e8f7" : "#f9dddd", color: asBool(r?.IsApproved) ? "#365676" : "#b03030" }}>
                {asBool(r?.IsApproved) ? "Yes" : "No"}
              </span>
            ),
          },
        ],
        fields: [
          { key: "Name", label: "Name", required: true },
          { key: "Description", label: "Description", type: "textarea" },
          {
            key: "IsApproved",
            label: "Approved",
            type: "select",
            options: [
              { value: false, label: "No" },
              { value: true, label: "Yes" },
            ],
          },
        ],
        initialForm: ({ context }) => ({
          Id: 0,
          Name: "",
          Description: "",
          propertyId: context?.propertyId,
          IsApproved: false,
        }),
        toForm: ({ row, context }) => ({
          Id: row?.Id ?? 0,
          Name: row?.Name ?? "",
          Description: row?.Description ?? "",
          propertyId: context?.propertyId,
          IsApproved: asBool(row?.IsApproved),
        }),
        validate: ({ form }) => {
          if (!String(form?.Name || "").trim()) return "Category name is required.";
          return null;
        },
        save: async ({ mode, form, row, context }) => {
          if (!context?.propertyId) throw new Error("Please select a Property.");
          const payload = {
            ...form,
            propertyId: context.propertyId,
            IsApproved: asBool(form?.IsApproved),
          };
          if (mode === "add") {
            await createCategory(payload);
            await context.refreshLookups?.();
            return;
          }
          await updateCategory(row?.Id ?? form?.Id, payload);
          await context.refreshLookups?.();
        },
        remove: async ({ row, context }) => {
          await deleteCategory(row?.Id);
          await context.refreshLookups?.();
        },
      },
      {
        id: "item",
        label: "Item",
        entityName: "Item",
        addLabel: "Add Item",
        getId: (r) => r?.Id,
        searchKeys: ["Id", "Name", "Description", "CategoryName", "CategoryId"],
        load: async ({ context }) => {
          if (!context?.propertyId) return [];
          const rows = await getAllItems(context.propertyId);
          return Array.isArray(rows) ? rows : [];
        },
        columns: [
          { header: "Id", valueKey: "Id" },
          { header: "Name", valueKey: "Name" },
          {
            header: "Category",
            render: (r) => {
              const found = (categories || []).find((c) => String(c?.Id) === String(r?.CategoryId));
              return found?.Name || r?.CategoryName || r?.Category || "-";
            },
          },
          { header: "Unit", valueKey: "MeasurementUnit" },
          { header: "Min Stock", valueKey: "MinStockLevel" },
          {
            header: "Approved",
            render: (r) => (
              <span className="mc-badge" style={{ background: asBool(r?.IsApproved) ? "#d9e8f7" : "#f9dddd", color: asBool(r?.IsApproved) ? "#365676" : "#b03030" }}>
                {asBool(r?.IsApproved) ? "Yes" : "No"}
              </span>
            ),
          },
        ],
        fields: [
          { key: "Name", label: "Name", required: true },
          { key: "Description", label: "Description", type: "textarea" },
          {
            key: "CategoryId",
            label: "Category",
            type: "select",
            options: (ctx) => [
              { value: "", label: "Select Category" },
              ...(ctx?.categories || ctx?.context?.categories || []).map((c) => ({
                value: c?.Id,
                label: c?.Name,
              })),
            ],
          },
          { key: "MeasurementUnit", label: "Measurement Unit" },
          { key: "MinStockLevel", label: "Min Stock Level", type: "number" },
          { key: "BrandName", label: "Brand Name" },
          { key: "HSNCode", label: "HSN Code" },
          {
            key: "IsApproved",
            label: "Approved",
            type: "select",
            options: [
              { value: false, label: "No" },
              { value: true, label: "Yes" },
            ],
          },
        ],
        initialForm: ({ context }) => ({
          Id: 0,
          Name: "",
          Description: "",
          CategoryId: "",
          MeasurementUnit: "",
          MinStockLevel: "",
          BrandName: "",
          HSNCode: "",
          PropertyId: context?.propertyId,
          IsApproved: false,
        }),
        toForm: ({ row, context }) => ({
          Id: row?.Id ?? 0,
          Name: row?.Name ?? "",
          Description: row?.Description ?? "",
          CategoryId: row?.CategoryId ?? 0,
          MeasurementUnit: row?.MeasurementUnit ?? "",
          MinStockLevel: row?.MinStockLevel ?? "",
          BrandName: row?.BrandName ?? "",
          HSNCode: row?.HSNCode ?? "",
          PropertyId: context?.propertyId,
          IsApproved: asBool(row?.IsApproved),
        }),
        validate: ({ form, context }) => {
          if (!context?.propertyId) return "Please select a Property.";
          if (!String(form?.Name || "").trim()) return "Item name is required.";
          if (!form?.CategoryId || Number(form.CategoryId) === 0) return "Please select a Category.";
          return null;
        },
        save: async ({ mode, form, row, context }) => {
          if (!context?.propertyId) throw new Error("Please select a Property.");
          const payload = {
            ...form,
            PropertyId: context.propertyId,
            CategoryId: Number(form?.CategoryId || 0),
            MinStockLevel: String(form?.MinStockLevel ?? ""),
            IsApproved: asBool(form?.IsApproved),
            IsActive: true,
          };
          if (mode === "add") {
            await createItem(payload);
            return;
          }
          await updateItem(row?.Id ?? form?.Id, payload);
        },
        remove: async ({ row }) => {
          await deleteItem(row?.Id);
        },
      },
      {
        id: "vendor",
        label: "Vendor",
        entityName: "Vendor",
        addLabel: "Add Vendor",
        getId: (r) => r?.Id,
        searchKeys: ["Id", "Name", "ContactPerson", "ContactNumber", "Email", "GSTNumber", "PANNumber"],
        load: async ({ context }) => {
          if (!context?.propertyId) return [];
          const rows = await getVendors(context.propertyId);
          return Array.isArray(rows) ? rows : [];
        },
        columns: [
          { header: "Id", valueKey: "Id" },
          { header: "Name", valueKey: "Name" },
          { header: "Contact", valueKey: "ContactPerson" },
          { header: "Phone", valueKey: "ContactNumber" },
          { header: "Email", valueKey: "Email" },
          {
            header: "Approved",
            render: (r) => (
              <span className="mc-badge" style={{ background: asBool(r?.IsApproved) ? "#d9e8f7" : "#f9dddd", color: asBool(r?.IsApproved) ? "#365676" : "#b03030" }}>
                {asBool(r?.IsApproved) ? "Yes" : "No"}
              </span>
            ),
          },
        ],
        fields: [
          { key: "Name", label: "Name", required: true },
          { key: "ContactPerson", label: "Contact Person" },
          { key: "ContactNumber", label: "Contact Number" },
          { key: "Email", label: "Email" },
          { key: "Address", label: "Address", type: "textarea" },
          { key: "GSTNumber", label: "GST Number" },
          { key: "PANNumber", label: "PAN Number" },
          { key: "WebsiteUrl", label: "Website" },
          { key: "PANFile", label: "PAN File", type: "file" },
          { key: "GSTFile", label: "GST Certificate", type: "file" },
          { key: "BrochureFile", label: "Brochure", type: "file" },
          {
            key: "IsApproved",
            label: "Approved",
            type: "select",
            options: [
              { value: false, label: "No" },
              { value: true, label: "Yes" },
            ],
          },
        ],
        initialForm: ({ context }) => ({
          Id: 0,
          Name: "",
          ContactPerson: "",
          ContactNumber: "",
          Email: "",
          Address: "",
          GSTNumber: "",
          PANNumber: "",
          WebsiteUrl: "",
          PANFile: null,
          GSTFile: null,
          BrochureFile: null,
          PropertyId: context?.propertyId,
          IsApproved: false,
        }),
        toForm: ({ row, context }) => ({
          Id: row?.Id ?? 0,
          Name: row?.Name ?? "",
          ContactPerson: row?.ContactPerson ?? "",
          ContactNumber: row?.ContactNumber ?? "",
          Email: row?.Email ?? "",
          Address: row?.Address ?? "",
          GSTNumber: row?.GSTNumber ?? "",
          PANNumber: row?.PANNumber ?? "",
          WebsiteUrl: row?.WebsiteUrl ?? "",
          PANFile: null,
          GSTFile: null,
          BrochureFile: null,
          PropertyId: context?.propertyId,
          IsApproved: asBool(row?.IsApproved),
        }),
        validate: ({ form, context }) => {
          if (!context?.propertyId) return "Please select a Property.";
          if (!String(form?.Name || "").trim()) return "Vendor name is required.";
          return null;
        },
        save: async ({ mode, form, row, context }) => {
          if (!context?.propertyId) throw new Error("Please select a Property.");
          const fd = new FormData();
          if (mode !== "add") fd.append("Id", String(row?.Id ?? form?.Id ?? 0));
          fd.append("PropertyId", String(context.propertyId));
          fd.append("Name", String(form?.Name ?? ""));
          fd.append("ContactPerson", String(form?.ContactPerson ?? ""));
          fd.append("ContactNumber", String(form?.ContactNumber ?? ""));
          fd.append("Email", String(form?.Email ?? ""));
          fd.append("Address", String(form?.Address ?? ""));
          fd.append("GSTNumber", String(form?.GSTNumber ?? ""));
          fd.append("PANNumber", String(form?.PANNumber ?? ""));
          fd.append("WebsiteUrl", String(form?.WebsiteUrl ?? ""));
          fd.append("CreatedBy", String(context?.userId || 1));
          fd.append("ApprovedBy", String(context?.userId || 1));
          fd.append("IsApproved", asBool(form?.IsApproved) ? "true" : "false");

          if (form?.PANFile instanceof File) fd.append("pan", form.PANFile);
          if (form?.GSTFile instanceof File) fd.append("gst", form.GSTFile);
          if (form?.BrochureFile instanceof File) fd.append("brochure", form.BrochureFile);

          if (mode === "add") {
            await createVendor(fd);
            await context.refreshLookups?.();
            return;
          }
          await updateVendor(row?.Id ?? form?.Id, fd);
          await context.refreshLookups?.();
        },
        remove: async ({ row, context }) => {
          await deleteVendor(row?.Id);
          await context.refreshLookups?.();
        },
      },
    ],
    [categories]
  );

  const notify = useCallback(({ type, message }) => {
    const msg = String(message || "");
    if (!msg) return;
    if (type === "error") {
      // keep parity with other modules: console + alert
      console.error(msg);
      window.alert(msg);
      return;
    }
    if (type === "success") {
      window.alert(msg);
      return;
    }
    console.log(msg);
  }, []);

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <MasterConfigCommon title="Inventory" context={context} tabs={tabs} notify={notify} />
        </div>
      </section>
    </div>
  );
}
