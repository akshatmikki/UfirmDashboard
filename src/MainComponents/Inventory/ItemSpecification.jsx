// itemspecification.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux"; // ✅ Added (was missing)
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";

import {
  getItemSpecification,
  createItemSpecification,
  getItemSpecificationName,
} from "../../Services/ItemassignService";
import { getAllItems } from "../../Services/InventoryService";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";

const ItemSpecificationPage = () => {
  const [items, setItems] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const toast = useRef(null);
  const propertyId = useSelector((state) => state.Commonreducer.puidn);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [formData, setFormData] = useState({
    Id: null,
    ItemId: null,
    Name: "",
    Specification: "",
  });

  // 🔹 Group duplicate item names
  const groupedItems = React.useMemo(() => {
    const grouped = {};
    items.forEach((item) => {
      const name = item.Name;
      if (!name) return;
      if (!grouped[name]) {
        grouped[name] = {
          ...item,
          specifications: [],
        };
      }
      if (
        item.Specification &&
        !grouped[name].specifications.includes(item.Specification)
      ) {
        grouped[name].specifications.push(item.Specification);
      }
    });
    return Object.values(grouped);
  }, [items]);

  // 🔹 Modern soft-color palette for specifications
  const specColors = [
    { bg: "#eef2ff", text: "#4f46e5", border: "#c7d2fe" }, // Indigo
    { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" }, // Emerald
    { bg: "#fef3c7", text: "#d97706", border: "#fde68a" }, // Amber
    { bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" }, // Pink
    { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" }, // Green
    { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" }, // Blue
    { bg: "#faf5ff", text: "#9333ea", border: "#e9d5ff" }, // Purple
    { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" }, // Rose
  ];

  const specificationBodyTemplate = (rowData) => {
    if (!rowData.specifications || rowData.specifications.length === 0) {
      return null;
    }
    return (
      <div className="d-flex flex-wrap align-items-center gap-1">
        {rowData.specifications.map((spec, index) => {
          const color = specColors[index % specColors.length];
          return (
            <React.Fragment key={spec}>
              <span
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  textTransform: "capitalize",
                  cursor: "default"
                }}
              >
                {spec}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // 🔹 Fetch all data on mount
  useEffect(() => {
    fetchAllItems();
    fetchItemOptions();
  }, [propertyId]);

  // 🔹 Fetch item specifications
  const fetchAllItems = async () => {
    try {
      const res = await getItemSpecification();
      setItems(res || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load items",
      });
    }
  };

  // 🔹 Fetch items for dropdown
  const fetchItemOptions = async () => {
    try {
      const res = await getAllItems(propertyId);
      const formatted = res.map((item) => ({
        label: item.Name,
        value: { id: item.Id, name: item.Name },
      }));
      setItemOptions(formatted);
    } catch (err) {
      console.error("Error fetching item options:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load item list",
      });
    }
  };

  // 🔹 Fetch item specs by name
  const fetchByName = async (name) => {
    if (!name) {
      fetchAllItems();
      return;
    }
    try {
      const res = await getItemSpecificationName(name);
      setItems(res || []);
    } catch (err) {
      console.error("Error fetching by name:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to search items",
      });
    }
  };

  // 🔹 Save new item specification
  const handleSave = async () => {
    if (!formData.ItemId || !formData.Specification.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Missing Data",
        detail: "Please select an item and enter a specification.",
      });
      return;
    }

    try {
      const payload = {
        ItemId: formData.ItemId,
        Name: formData.Name,
        Specification: formData.Specification,
      };

      await createItemSpecification(payload);
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Item created successfully",
      });
      setDialogVisible(false);
      fetchAllItems();
    } catch (err) {
      console.error("Save Error:", err);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to save item",
      });
    }
  };

  // 🔹 Global search filter
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
    setFilters({
      ...filters,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    });
    fetchByName(value);
  };

  // 🔹 Open dialog for create
  const openCreateDialog = () => {
    setFormData({ Id: null, ItemId: null, Name: "", Specification: "" });
    setDialogVisible(true);
  };

  // 🔹 Header section
  const header = (
    <div className="d-flex justify-content-between align-items-center p-2">
      <h3 className="m-0">Item Master</h3>
      <div className="d-flex gap-2 align-items-center">
        <span className="p-input-icon-left" style={{ position: "relative", display: "inline-block" }}>
          <i
            className="pi pi-search"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              color: "#9ca3af",
              pointerEvents: "none",
              fontSize: "14px",
              lineHeight: "14px",
              height: "14px",
              width: "14px",
              margin: 0,
              padding: 0,
              display: "block"
            }}
          />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search by name..."
            style={{
              paddingLeft: "38px",
              borderRadius: "6px"
            }}
          />
        </span>
        <Button
          label="Create"
          icon="pi pi-plus"
          onClick={openCreateDialog}
          className="p-button-success"
        />
      </div>
    </div>
  );

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <Toast ref={toast} />
            <div className="pr-6 pl-6">
              <DataTable
                value={groupedItems}
                header={header}
                paginator
                rows={10}
                filters={filters}
                globalFilterFields={["Name"]}
                emptyMessage="No items found."
                dataKey="Name"
                breakpoint="960px"
              >
                <Column field="Name" header="Item Name" />
                <Column body={specificationBodyTemplate} header="Specification" />
              </DataTable>
            </div>
          </div>
        </div>
      </section>

      {/* Dialog for creating specification */}
      <Dialog
        header="Create Item Specification"
        visible={dialogVisible}
        style={{ width: "400px" }}
        modal
        onHide={() => setDialogVisible(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="modal-body">
            <div className="row">
              {/* 🔹 Dropdown for selecting item */}
              <div className="col-12 mt-3 flex flex-col">
                <label htmlFor="item" className="mb-1">Select Item</label>

                <Dropdown
                  id="item"
                  value={
                    formData.ItemId
                      ? { id: formData.ItemId, name: formData.Name }
                      : null
                  }
                  options={itemOptions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ItemId: e.value.id,
                      Name: e.value.name,
                    })
                  }
                  placeholder="Select an Item"
                  className="w-full"
                  style={{ width: "100%" }}
                  showClear
                  filter
                />
              </div>

              {/* 🔹 Specification field */}
              <div className="col-12 mt-3">
                <label htmlFor="specification">Specification</label>
                <input
                  id="specification"
                  placeholder="Enter Specification"
                  type="text"
                  className="form-control"
                  value={formData.Specification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Specification: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <Button
              label="Cancel"
              className="p-button-text"
              onClick={() => setDialogVisible(false)}
            />
            <Button label="Save" onClick={handleSave} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ItemSpecificationPage;