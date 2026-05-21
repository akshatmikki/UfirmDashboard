import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  PendingApprovalCategory,
  PendingApprovalItem,
  PendingApprovalVendor,
} from "../Services/InventoryService";
import ApprovalPage from "../MainComponents/Inventory/ApprovalPage";


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
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [activeTab, setActiveTab] = useState("category");

  const masterConfigRef = useRef(null);

  const refreshLookups = useCallback(async () => {
    if (!propertyId) {
      setCategories([]);
      setVendors([]);
      setPendingCategories([]);
      setPendingItems([]);
      setPendingVendors([]);
      return;
    }
    try {
      if (activeTab === "category") {
        const [cats, pCats] = await Promise.all([
          getCategories(propertyId).catch(() => []),
          PendingApprovalCategory(propertyId).catch(() => [])
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setPendingCategories(Array.isArray(pCats?.Data) ? pCats.Data : Array.isArray(pCats) ? pCats : []);
      } else if (activeTab === "item") {
        const [cats, pItems] = await Promise.all([
          getCategories(propertyId).catch(() => []),
          PendingApprovalItem(propertyId).catch(() => [])
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setPendingItems(Array.isArray(pItems?.Data) ? pItems.Data : Array.isArray(pItems) ? pItems : []);
      } else if (activeTab === "vendor") {
        const [vens, pVens] = await Promise.all([
          getVendors(propertyId).catch(() => []),
          PendingApprovalVendor(propertyId).catch(() => [])
        ]);
        setVendors(Array.isArray(vens) ? vens : []);
        setPendingVendors(Array.isArray(pVens?.Data) ? pVens.Data : Array.isArray(pVens) ? pVens : []);
      }
    } catch {
      setCategories([]);
      setVendors([]);
      setPendingCategories([]);
      setPendingItems([]);
      setPendingVendors([]);
    }
  }, [propertyId, activeTab]);

  useEffect(() => {
    refreshLookups();
  }, [refreshLookups, activeTab]);

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
            await context.refreshLookups?.();
            return;
          }
          await updateItem(row?.Id ?? form?.Id, payload);
          await context.refreshLookups?.();
        },
        remove: async ({ row, context }) => {
          await deleteItem(row?.Id);
          await context.refreshLookups?.();
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
          { 
            key: "WebsiteUrl", 
            label: "Website",
            renderView: ({ value }) => value ? <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer">{value}</a> : "-"
          },
          { 
            key: "PANFile", 
            label: "PAN File", 
            type: "file",
            renderView: ({ row }) => row?.PANFileUrl ? <a href={row.PANFileUrl} target="_blank" rel="noopener noreferrer">View Document</a> : "-"
          },
          { 
            key: "GSTFile", 
            label: "GST Certificate", 
            type: "file",
            renderView: ({ row }) => row?.GSTCertificateUrl ? <a href={row.GSTCertificateUrl} target="_blank" rel="noopener noreferrer">View Document</a> : "-"
          },
          { 
            key: "BrochureFile", 
            label: "Brochure", 
            type: "file",
            renderView: ({ row }) => row?.BrochureUrl ? <a href={row.BrochureUrl} target="_blank" rel="noopener noreferrer">View Document</a> : "-"
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

  const gridHeader = [
    { sTitle: 'Id', titleValue: 'Id' },
    { sTitle: 'Name', titleValue: 'Name' },
    { sTitle: 'Description', titleValue: 'Description' },
    { sTitle: 'IsApproved', titleValue: 'Approved' },
  ];

  const handleApproveCategory = async (id) => {
    try {
        const cat = pendingCategories.find(c => c.Id === id);
        if (cat) {
            await updateCategory(id, { ...cat, IsApproved: true });
            refreshLookups();
            notify({ type: "success", message: "Category Approved successfully!" });
            
            // Reload tabs via master config trick if needed, or just let refreshLookups handle it.
            // Actually the load() function for category tab fetches from API, so we should trigger a grid refresh.
            // MasterConfigCommon doesn't expose a ref, but changing context slightly can trigger it.
        }
    } catch (error) {
        notify({ type: "error", message: "Failed to approve category" });
    }
  };

  const handleRejectCategory = async (id) => {
    try {
        await deleteCategory(id);
        refreshLookups();
        notify({ type: "success", message: "Category Rejected successfully!" });
    } catch (error) {
        notify({ type: "error", message: "Failed to reject category" });
    }
  };

  const handleEditCategory = (id) => {
    const cat = pendingCategories.find(c => c.Id === id);
    if (cat) masterConfigRef.current?.editRow(cat);
  };

  const handleDeleteCategory = (id) => {
    const cat = pendingCategories.find(c => c.Id === id);
    if (cat) masterConfigRef.current?.deleteRow(cat);
  };

  const handleApproveItem = async (id) => {
    try {
        const item = pendingItems.find(c => c.Id === id);
        if (item) {
            await updateItem(id, { ...item, IsApproved: true });
            refreshLookups();
            notify({ type: "success", message: "Item Approved successfully!" });
        }
    } catch (error) {
        notify({ type: "error", message: "Failed to approve item" });
    }
  };

  const handleRejectItem = async (id) => {
    try {
        await deleteItem(id);
        refreshLookups();
        notify({ type: "success", message: "Item Rejected successfully!" });
    } catch (error) {
        notify({ type: "error", message: "Failed to reject item" });
    }
  };

  const handleEditItem = (id) => {
    const item = pendingItems.find(c => c.Id === id);
    if (item) masterConfigRef.current?.editRow(item);
  };

  const handleDeleteItem = (id) => {
    const item = pendingItems.find(c => c.Id === id);
    if (item) masterConfigRef.current?.deleteRow(item);
  };

  const handleApproveVendor = async (id) => {
    try {
        const vendor = pendingVendors.find(c => c.Id === id);
        if (vendor) {
            const fd = new FormData();
            fd.append("Id", String(vendor.Id || 0));
            fd.append("PropertyId", String(vendor.PropertyId || propertyId));
            fd.append("Name", String(vendor.Name || ""));
            fd.append("ContactPerson", String(vendor.ContactPerson || ""));
            fd.append("ContactNumber", String(vendor.ContactNumber || ""));
            fd.append("Email", String(vendor.Email || ""));
            fd.append("Address", String(vendor.Address || ""));
            fd.append("GSTNumber", String(vendor.GSTNumber || ""));
            fd.append("PANNumber", String(vendor.PANNumber || ""));
            fd.append("WebsiteUrl", String(vendor.WebsiteUrl || ""));
            fd.append("IsApproved", "true");
            await updateVendor(id, fd);
            refreshLookups();
            notify({ type: "success", message: "Vendor Approved successfully!" });
        }
    } catch (error) {
        notify({ type: "error", message: "Failed to approve vendor" });
    }
  };

  const handleRejectVendor = async (id) => {
    try {
        await deleteVendor(id);
        refreshLookups();
        notify({ type: "success", message: "Vendor Rejected successfully!" });
    } catch (error) {
        notify({ type: "error", message: "Failed to reject vendor" });
    }
  };

  const handleEditVendor = (id) => {
    const vendor = pendingVendors.find(c => c.Id === id);
    if (vendor) masterConfigRef.current?.editRow(vendor);
  };

  const handleDeleteVendor = (id) => {
    const vendor = pendingVendors.find(c => c.Id === id);
    if (vendor) masterConfigRef.current?.deleteRow(vendor);
  };

  const renderApprovalContent = () => {
    const activeTabConfig = tabs.find(t => t.id === activeTab);
    const dynamicHeaders = activeTabConfig?.columns?.map(c => ({
      sTitle: c.valueKey || c.header,
      titleValue: c.header,
      render: c.render
    })) || [];

    if (activeTab === 'category' && pendingCategories && pendingCategories.length > 0) {
      return (
        <ApprovalPage
            title={"Pending For Approval (Categories)"}
            gridHeader={dynamicHeaders}
            gridData={pendingCategories}
            onGridApprove={handleApproveCategory}
            onGridEdit={handleEditCategory}
            onGridReject={handleRejectCategory}
            onGridDelete={handleDeleteCategory}
        />
      );
    }
    if (activeTab === 'item' && pendingItems && pendingItems.length > 0) {
      return (
        <ApprovalPage
            title={"Pending For Approval (Items)"}
            gridHeader={dynamicHeaders}
            gridData={pendingItems}
            onGridApprove={handleApproveItem}
            onGridEdit={handleEditItem}
            onGridReject={handleRejectItem}
            onGridDelete={handleDeleteItem}
        />
      );
    }
    if (activeTab === 'vendor' && pendingVendors && pendingVendors.length > 0) {
      return (
        <ApprovalPage
            title={"Pending For Approval (Vendors)"}
            gridHeader={dynamicHeaders}
            gridData={pendingVendors}
            onGridApprove={handleApproveVendor}
            onGridEdit={handleEditVendor}
            onGridReject={handleRejectVendor}
            onGridDelete={handleDeleteVendor}
        />
      );
    }
    return null;
  };

  const approvalContent = renderApprovalContent();

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <MasterConfigCommon 
            ref={masterConfigRef}
            title="Inventory" 
            context={context} 
            tabs={tabs} 
            notify={notify} 
            onTabChange={setActiveTab}
            topContent={
              approvalContent ? (
                <div style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {approvalContent}
                </div>
              ) : null
            }
          />
        </div>
      </section>
    </div>
  );
}
