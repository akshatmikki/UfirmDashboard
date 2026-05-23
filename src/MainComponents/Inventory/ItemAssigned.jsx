"use client";

import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import { Dropdown } from "primereact/dropdown";
import { Paginator } from "primereact/paginator";
import { useSelector } from "react-redux";
import PurchaseOrderPage from './PurchaseOrderPage';

import {
  getItemAssigned,
  createItemAssigned,
  updateItemAssigned,
  deleteItemAssigned,
  getItemSpecificationsByItemId,
  ApproveItemAssigned,
  updatePOStatus
} from "../../Services/ItemassignService";
import { getAllItems, getRateCard } from "../../Services/InventoryService";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";

export default function ItemAssignedPage() {
  const [grouped, setGrouped] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedRows, setSelectedRows] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [specifications, setSpecifications] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemOptions, setItemOptions] = useState([]);
  const [poDialogVisible, setPoDialogVisible] = useState(false);
  const [poInitialItems, setPoInitialItems] = useState([]);
  const [poInitialIds, setPoInitialIds] = useState([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [isEmployeeLinked, setIsEmployeeLinked] = useState(false);
  const [formData, setFormData] = useState({
    itemId: null,
    item_Name: "",
    gender: "",
    quantity: 1,
    isRequisition: false,
    isHandover: false,
  });

  const toast = useRef(null);

  // ✅ Redux propertyId with comprehensive fallbacks (same as StockItems.jsx)
  const propertyId = useSelector(
    (state) =>
      state?.Commonreducer?.puidn ||
      state?.department?.CompanyId ||
      state?.departmentModel?.CompanyId ||
      state?.Commonreducer?.CompanyId ||
      null
  );

  // ---------- date helpers ----------
  const safeDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value) => {
    const d = safeDate(value);
    if (!d) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime12 = (value) => {
    const d = safeDate(value);
    if (!d) return "";
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const renderColorBlock = (val) => {
    if (!val) return null;
    const clean = String(val).replace(/['"]/g, "");
    const style = {
      display: "inline-block",
      width: "14px",
      height: "14px",
      background: clean,
      border: "1px solid #aaa",
      marginLeft: "6px",
      verticalAlign: "middle",
    };
    return <span style={style} />;
  };

  const renderTypeBadge = (row) => {
    const isReq = !!row.IsRequisition;
    const isHand = !!row.IsHandover;

    if (isReq && !isHand) {
      return <span className="badge badge-success">Requisition</span>;
    }
    if (!isReq && isHand) {
      return <span className="badge badge-primary">Handover</span>;
    }
    if (isReq && isHand) {
      return <span className="badge badge-info">Both</span>;
    }
    return <span className="badge badge-secondary">-</span>;
  };

  // ✅ Clear table when propertyId changes (prevent stale data)
  useEffect(() => {
    setGrouped([]);
  }, [propertyId]);

  // ✅ Fetch data on mount AND when propertyId changes
  useEffect(() => {
    if (propertyId && propertyId !== "Select" && propertyId !== null) {
      fetchGrouped();
      fetchItemOptions();
    }
  }, [propertyId]);

  // ---------- data fetch ----------
  const fetchGrouped = async () => {
    if (!propertyId || propertyId === "Select" || propertyId === null) {
      toast.current?.show({
        severity: "error",
        summary: "Property Missing",
        detail: "Please select a property first.",
      });
      return;
    }

    try {
      const res = await getItemAssigned(propertyId);
      const sorted = (res || []).sort((a, b) => b.Id - a.Id);
      setGrouped(sorted);
      setFirst(0);
    } catch (err) {
      console.error("[FETCH_GROUPED_ERROR]", err);
      setGrouped([]);
    }
  };

  const fetchItemOptions = async () => {
    if (!propertyId || propertyId === "Select" || propertyId === null) {
      return;
    }

    try {
      const res = await getAllItems(propertyId);
      const formatted = (res || []).map((i) => ({
        label: i.Name,
        value: {
          id: i.Id,
          name: i.Name,
          IsEmployeeLinked: i.IsEmployeeLinked
        },
      }));
      setItemOptions(formatted);
    } catch (err) {
      console.error("[FETCH_ITEMS_ERROR]", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load item list",
      });
    }
  };

  // ---------- form handlers ----------
  const handleItemSelect = async (value) => {

    setFormData((prev) => ({
      ...prev,
      itemId: value?.id ?? null,
      item_Name: value?.name ?? "",
      gender: ""
    }));

    if (!value || !value.id) {
      setSpecifications([]);
      setIsEmployeeLinked(false);
      return;
    }

    try {

      const res = await getItemSpecificationsByItemId(value.id);

      // ✅ IMPORTANT FIX
      if (res && res.length > 0) {
        setIsEmployeeLinked(!!res[0].IsEmployeeLinked);
      } else {
        setIsEmployeeLinked(false);
      }

      if (!res || res.length === 0) {

        toast.current?.show({
          severity: "info",
          summary: "No Specifications",
          detail: "No specifications available for this item.",
        });

        setSpecifications([]);
        return;
      }

      setSpecifications(
        res.map((s) => ({
          Id: s.Id || 0,
          Specification: s.Specification,
          Specification_Value: "",
        }))
      );

    } catch (err) {

      console.error("[FETCH_SPECS_ERROR]", err);

      setIsEmployeeLinked(false);

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load specifications",
      });

      setSpecifications([]);
    }
  };

  const handleSpecValueChange = (index, value) => {
    setSpecifications((prev) =>
      prev.map((spec, i) =>
        i === index ? { ...spec, Specification_Value: value } : spec
      )
    );
  };

  // ✅ Validation before save
  const validateForm = () => {
    if (!formData.itemId) {
      toast.current?.show({
        severity: "warn",
        summary: "Missing Item",
        detail: "Please select an item.",
      });
      return false;
    }

    if (isEmployeeLinked && (!formData.gender || formData.gender === "")) {
      toast.current?.show({
        severity: "warn",
        summary: "Missing Gender",
        detail: "Please select a gender.",
      });
      return false;
    }

    if (!formData.quantity || formData.quantity < 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Quantity",
        detail: "Quantity must be at least 1.",
      });
      return false;
    }

    if (!formData.isRequisition && !formData.isHandover) {
      toast.current?.show({
        severity: "warn",
        summary: "Missing Type",
        detail: "Please select either Requisition or Handover.",
      });
      return false;
    }

    // ✅ Validate all specifications are filled
    for (let spec of specifications) {
      if (!spec.Specification_Value || spec.Specification_Value.trim() === "") {
        toast.current?.show({
          severity: "warn",
          summary: "Incomplete Specifications",
          detail: `Please fill in the value for "${spec.Specification}".`,
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const basePayload = {
        Id: selectedItem ? selectedItem.Id : 0,
        ItemId: formData.itemId,
        Item_Name: formData.item_Name,
        Gender: formData.gender,
        Quantity: formData.quantity,
        PropertyId: Number(propertyId),
        IsRequisition: formData.isRequisition,
        IsHandover: formData.isHandover,
        Is_Active: true,
        Details: specifications.map((s) => ({
          Id: s.Id || 0,
          Specification_Name: s.Specification,
          Specification_Value: s.Specification_Value || "",
          Is_Active: true,
        })),
      };

      if (selectedItem) {
        // ✅ Update existing item
        await updateItemAssigned(selectedItem.Id, basePayload);
        toast.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Item assignment updated successfully.",
        });
      } else {
        // ✅ Create new item (API expects array)
        const payload = [basePayload];
        await createItemAssigned(payload);
        toast.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Item assignment created successfully.",
        });
      }

      setDialogVisible(false);
      fetchGrouped(); // ✅ Refresh table
    } catch (err) {
      console.error("[SAVE_ERROR]", err);
      toast.current?.show({
        severity: "error",
        summary: "Save Failed",
        detail: err.message || "An error occurred while saving.",
      });
    }
  };

  const openEditDialog = (rowData) => {
    setSelectedItem(rowData);
    setFormData({
      itemId: rowData.ItemId || null,
      item_Name: rowData.Item_Name || "",
      gender: rowData.Gender || "",
      quantity: rowData.Quantity || 1,
      isRequisition: rowData.IsRequisition || false,
      isHandover: rowData.IsHandover || false,

    });
    setIsEmployeeLinked(!!rowData.IsEmployeeLinked);

    // ✅ Pre-fill specifications from existing data
    setSpecifications(
      (rowData.Details || []).map((d) => ({
        Id: d.Id,
        Specification: d.Specification_Name,
        Specification_Value: d.Specification_Value,
      }))
    );

    setDialogVisible(true);
  };

  const openAddDialog = () => {
    setSelectedItem(null);
    setFormData({
      itemId: null,
      item_Name: "",
      gender: "",
      quantity: 1,
      isRequisition: false,
      isHandover: false,
    });
    setSpecifications([]);
    setDialogVisible(true);
  };

  const openDeleteDialog = (rowData) => {
    setSelectedItem(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    try {
      // ✅ Soft delete (set Is_Active: false)
      await deleteItemAssigned(selectedItem.Id);
      toast.current?.show({
        severity: "success",
        summary: "Deleted",
        detail: "Item assignment deleted successfully.",
      });
      setDeleteDialogVisible(false);
      fetchGrouped(); // ✅ Refresh table
    } catch (err) {
      console.error("[DELETE_ERROR]", err);
      toast.current?.show({
        severity: "error",
        summary: "Delete Failed",
        detail: err.message || "An error occurred while deleting.",
      });
    }
  };
  const handleApprove = async () => {
    if (selectedRows.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "No Selection",
        detail: "Please select at least one item to approve.",
      });
      return;
    }

    try {
      // Call the approve API for each selected item individually
      await Promise.all(selectedRows.map((id) => ApproveItemAssigned(id)));

      toast.current?.show({
        severity: "success",
        summary: "Approved",
        detail: "Selected items approved successfully.",
      });

      setSelectedRows([]);
      fetchGrouped(); // refresh table
    } catch (err) {
      console.error("APPROVE_ERROR", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Failed to approve items.",
      });
    }
  };

  const handlePurchaseOrder = () => {
    if (selectedRows.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "No Selection",
        detail: "Please select at least one item to create Purchase Order.",
      });
      return;
    }
    const selectedItems = grouped.filter((row) => selectedRows.includes(row.Id));

    const unapprovedItems = selectedItems.filter((row) => !row.IsFMApproved);
    if (unapprovedItems.length > 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Not Approved",
        detail: "Purchase Order cannot be created for unapproved items.",
      });
      return;
    }

    setPoInitialItems(selectedItems);
    setPoInitialIds(selectedRows);
    setPoDialogVisible(true);
  };

  // ---------- filtering ----------
  const filtered = grouped.filter((row) => {
    if (filterType === "Requisition" && !row.IsRequisition) return false;
    if (filterType === "Handover" && !row.IsHandover) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    const name = (row.Item_Name ?? "").toLowerCase();
    const gender = (row.Gender ?? "").toLowerCase();
    const qty = (row.Quantity ?? "").toString().toLowerCase();
    const typeText = row.IsRequisition
      ? "requisition"
      : row.IsHandover
        ? "handover"
        : "";

    const specsText = Array.isArray(row.Details)
      ? row.Details.map(
        (d) =>
          `${d.Specification_Name ?? ""}: ${d.Specification_Value ?? ""}`
      )
        .join(" ")
        .toLowerCase()
      : "";

    return (
      name.includes(term) ||
      gender.includes(term) ||
      qty.includes(term) ||
      typeText.includes(term) ||
      specsText.includes(term)
    );
  });

  const currentItems = filtered.slice(first, first + rows);

  return (
    <div
      className="container-fluid py-3"
      style={{
        maxWidth: "95%",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: window.innerWidth > 992 ? "90px" : "0px",
        transition: "padding 0.2s ease",
      }}
    >
      <Toast ref={toast} />

      <div className="card shadow-sm mt-3">
        <div
          className="card-body d-flex flex-wrap align-items-center"
          style={{ paddingBottom: "10px" }}
        >
          <h5 className="mb-0">Item Assigned</h5>

          <div className="ml-auto d-flex align-items-center" style={{ gap: "12px" }}>

            <div className="d-flex align-items-center" style={{ gap: "10px", marginRight: "10px" }}>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="filterAll"
                  name="filterType"
                  value="All"
                  onChange={(e) => setFilterType(e.value)}
                  checked={filterType === "All"}
                />
                <label htmlFor="filterAll" className="ml-2 mb-0">All</label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="filterRequisition"
                  name="filterType"
                  value="Requisition"
                  onChange={(e) => setFilterType(e.value)}
                  checked={filterType === "Requisition"}
                />
                <label htmlFor="filterRequisition" className="ml-2 mb-0">Requisition</label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="filterHandover"
                  name="filterType"
                  value="Handover"
                  onChange={(e) => setFilterType(e.value)}
                  checked={filterType === "Handover"}
                />
                <label htmlFor="filterHandover" className="ml-2 mb-0">Handover</label>
              </div>
            </div>

            {/* ✅ Search bar - matches Add Item button size */}
            {/* <span className="search-icon-wrapper">
      <i className="fa fa-search" style={{ color: "#6b7280" }} />
    </span> */}
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={{
                height: "38px",
                width: "200px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                paddingLeft: "12px",
              }}
            />
            <Button
              label="Approve"
              icon="pi pi-check"
              className="p-button-info"
              disabled={selectedRows.length === 0 || selectedRows.some(id => grouped.find(row => row.Id === id)?.IsFMApproved)}
              onClick={handleApprove}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            />
            <Button
              label="Purchase Order"
              icon="pi pi-shopping-cart"
              className="p-button-primary"
              disabled={selectedRows.length === 0}
              onClick={handlePurchaseOrder}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
            />

            {/* ✅ Add button - rounded */}
            <Button
              label="Add Requisition"
              icon="pi pi-plus"
              className="p-button-success"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "8px",
                whiteSpace: "nowrap",
              }}
              onClick={openAddDialog}
            />
          </div>
        </div>

        <div className="card-body p-3">
          <div className="table-responsive">
            <table
              className="table table-bordered table-striped table-hover mb-0 table-sm"
              style={{ fontSize: "14px" }}
            >
              <thead className="thead-light">
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.filter(x => !x.IsPOCreated).length > 0 && selectedRows.length === filtered.filter(x => !x.IsPOCreated).length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filtered.filter(x => !x.IsPOCreated).map((x) => x.Id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ width: "80px" }}>S. No</th>
                  <th>Item Name</th>
                  <th style={{ width: "120px" }}>Gender</th>
                  <th style={{ width: "100px" }}>Quantity</th>
                  <th style={{ minWidth: "220px" }}>Specifications</th>
                  <th style={{ width: "140px" }}>Type</th>
                  <th style={{ width: "130px" }}>Date</th>
                  <th style={{ width: "130px" }}>Time</th>
                  <th style={{ width: "100px" }}>Approved</th>
                  <th style={{ width: "140px" }}>Status</th>
                  <th style={{ width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-muted">
                      No records found.
                    </td>
                  </tr>
                )}

                {currentItems.map((row, index) => (
                  <tr key={row.Id ?? index}>
                    <td>
                      <input
                        type="checkbox"
                        disabled={row.IsPOCreated}
                        checked={selectedRows.includes(row.Id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, row.Id]);
                          } else {
                            setSelectedRows(selectedRows.filter((id) => id !== row.Id));
                          }
                        }}
                      />
                    </td>
                    <td>{first + index + 1}</td>
                    <td>{row.Item_Name}</td>
                    <td>{row.Gender}</td>
                    <td>{row.Quantity}</td>
                    <td>
                      {(!Array.isArray(row.Details) ||
                        row.Details.length === 0) && (
                          <span className="text-muted">No Specifications</span>
                        )}

                      {Array.isArray(row.Details) &&
                        row.Details.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span>
                              {d.Specification_Name}: {d.Specification_Value}
                            </span>
                            {String(d.Specification_Name)
                              .toLowerCase()
                              .includes("color") &&
                              renderColorBlock(d.Specification_Value)}
                          </div>
                        ))}
                    </td>
                    <td>{renderTypeBadge(row)}</td>
                    <td>{formatDate(row.Created_On)}</td>
                    <td>{formatTime12(row.Created_On)}</td>
                    <td className="text-center">
                      {row.IsFMApproved ? (
                        <i className="pi pi-check" style={{ color: "green", fontSize: "1.2rem" }}></i>
                      ) : (
                        <i className="pi pi-times" style={{ color: "red", fontSize: "1.2rem" }}></i>
                      )}
                    </td>
                    <td className="text-center">
                      {row.IsPOCreated ? (
                        <span
                          className="badge badge-success"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          PO Created
                        </span>
                      ) : (
                        <span
                          className="badge badge-warning"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          PO Pending
                        </span>
                      )}
                    </td>

                    <td className="text-center">
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-warning p-button-sm mr-2"
                        style={{
                          width: "24px",
                          height: "24px",
                          padding: "0",
                          fontSize: "0.65rem",
                        }}
                        onClick={() => openEditDialog(row)}
                      />

                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-danger p-button-sm"
                        style={{
                          width: "24px",
                          height: "24px",
                          padding: "0",
                          fontSize: "0.65rem",
                        }}
                        onClick={() => openDeleteDialog(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <Paginator
              first={first}
              rows={rows}
              totalRecords={filtered.length}
              onPageChange={(e) => {
                setFirst(e.first);
                setRows(e.rows);
              }}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        header={
          selectedItem ? "Edit Item Assignment" : "Add New Item Assignment"
        }
        visible={dialogVisible}
        style={{ width: "60vw" }}
        onHide={() => setDialogVisible(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setDialogVisible(false)}
              className="p-button-text"
            />
            <Button label="Save" icon="pi pi-check" onClick={handleSave} />
          </div>
        }
      >
        <div className="p-fluid">
          {/* Dropdown for item */}
          <div className="field">
            <label>Item *</label>
            <Dropdown
              value={
                itemOptions.find(
                  (opt) => opt.value.id === formData.itemId
                )?.value || null
              }
              options={itemOptions}
              onChange={(e) => handleItemSelect(e.value)}
              placeholder="Select an item"
              showClear
              filter
              className="w-full"
              disabled={!!selectedItem}
            />
          </div>
          {isEmployeeLinked && (
            <div className="field">
              <label>Gender *</label>

              <select
                className="p-inputtext p-component"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value,
                  })
                }
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>Quantity *</label>
            <InputText
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="field">
            <label className="block mb-2">Type *</label>
            <div className="flex align-items-center gap-5">
              <div className="flex align-items-center">
                <RadioButton
                  inputId="requisition"
                  name="type"
                  value="Requisition"
                  checked={formData.isRequisition}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      isRequisition: true,
                      isHandover: false,
                    })
                  }
                />
                <label htmlFor="requisition" className="ml-2">
                  Requisition
                </label>
              </div>

              {/* <div className="flex align-items-center">
                <RadioButton
                  inputId="handover"
                  name="type"
                  value="Handover"
                  checked={formData.isHandover}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      isHandover: true,
                      isRequisition: false,
                    })
                  }
                />
                <label htmlFor="handover" className="ml-2">
                  Handover
                </label>
              </div> */}
            </div>
          </div>

          {specifications.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2">Specifications *</h4>
              <DataTable value={specifications} responsiveLayout="scroll">
                <Column field="Specification" header="Specification" />
                <Column
                  header="Value"
                  body={(rowData, { rowIndex }) => (
                    <InputText
                      value={rowData.Specification_Value || ""}
                      onChange={(e) =>
                        handleSpecValueChange(rowIndex, e.target.value)
                      }
                      placeholder="Enter value"
                    />
                  )}
                />
              </DataTable>
            </div>
          )}
        </div>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        header="Confirm Delete"
        visible={deleteDialogVisible}
        style={{ width: "25vw" }}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setDeleteDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Delete"
              icon="pi pi-check"
              onClick={handleDelete}
              className="p-button-danger"
            />
          </div>
        }
        onHide={() => setDeleteDialogVisible(false)}
      >
        <p>Are you sure you want to delete this record?</p>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog
        visible={poDialogVisible}
        onHide={() => setPoDialogVisible(false)}
        modal
        style={{ width: '90vw', height: '90vh' }}
        header="Create Purchase Order"
      >
        {poDialogVisible && (
          <PurchaseOrderPage
            initialItems={poInitialItems}
            initialIds={poInitialIds}
            refreshItemAssigned={() => {
              setPoDialogVisible(false);
              setSelectedRows([]);
              fetchGrouped();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}