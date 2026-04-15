"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import SpareService from "../../Services/SpareService";
import "./AssetsMaster.css";

function getEmptySpareRow() {
  return {
    SpareType: "",
    Rating: "",
    BackupTime: "",
    Status: "Running",
    Quantity: 1,
    PurchaseDate: "",
    ExpiryDate: "",
    SerialNumber: "",
    VendorName: "",
    InvoiceNo: "",
    Warranty: "",
    Remarks: "",
  };
}

function normalizeDateOnly(value) {
  if (!value) return "";
  const raw = String(value);
  return raw.includes("T") ? raw.split("T")[0] : raw;
}

function formatDisplayDate(value) {
  const raw = normalizeDateOnly(value);
  if (!raw) return "-";
  const [year, month, day] = raw.split("-");
  return year && month && day ? `${day}-${month}-${year}` : raw;
}

function statusMeta(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("inactive")) return { label: "Inactive", key: "inactive" };
  if (raw.includes("servic")) return { label: "Servicing", key: "servicing" };
  return { label: "Running", key: "running" };
}

function buildPseudoQrCells(value) {
  const seed = String(value || "QR").split("").reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);
  return Array.from({ length: 144 }, (_, index) => {
    const row = Math.floor(index / 12);
    const col = index % 12;
    const inTopLeft = row < 3 && col < 3;
    const inTopRight = row < 3 && col > 8;
    const inBottomLeft = row > 8 && col < 3;
    if (inTopLeft || inTopRight || inBottomLeft) return true;
    return ((seed + row * 17 + col * 29 + row * col) % 5) < 2;
  });
}

const SparePage = () => {
  const toast = useRef(null);
  const history = useHistory();
  const propertyId = useSelector((state) => state.Commonreducer.puidn);

  const [spares, setSpares] = useState([]);
  const [assets, setAssets] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpareId, setSelectedSpareId] = useState(null);
  const [sideMode, setSideMode] = useState("details");

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterVendor, setFilterVendor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAssetId, setFilterAssetId] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [spareRows, setSpareRows] = useState([getEmptySpareRow()]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAction, setCancelAction] = useState(null);

  const [editForm, setEditForm] = useState(null);
  const searchInputRef = useRef(null);

  const loadSpares = async () => {
    try {
      const data = await SpareService.getByProperty(propertyId);
      setSpares(Array.isArray(data) ? data : []);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to load spares" });
    }
  };

  const loadAssets = async () => {
    try {
      const res = await fetch(`https://api.urest.in:8096/GetAssets?propertyId=${propertyId}`);
      const data = await res.json();
      const combined = [
        ...(Array.isArray(data?.PassedServiceDates) ? data.PassedServiceDates : []),
        ...(Array.isArray(data?.UpcomingServiceDates) ? data.UpcomingServiceDates : []),
      ];
      setAssets(combined);
    } catch {
      setAssets([]);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadSpares();
      loadAssets();
    }
  }, [propertyId]);

  const assetOptions = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    return assets
      .map((asset) => ({ label: asset.Name || asset.name || "-", value: asset.Id || asset.id, raw: asset }))
      .filter((item) => item.value !== undefined && item.value !== null);
  }, [assets]);

  const assetById = useMemo(() => {
    const map = new Map();
    assetOptions.forEach((item) => map.set(Number(item.value), item.raw));
    return map;
  }, [assetOptions]);

  const resetAddForm = () => {
    setAssetId("");
    setSpareRows([getEmptySpareRow()]);
  };

  const addSpareRow = () => setSpareRows((prev) => [...prev, getEmptySpareRow()]);
  const removeSpareRow = (index) => setSpareRows((prev) => prev.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => {
    setSpareRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const hasAddDraft = useMemo(() => {
    if (assetId) return true;
    return spareRows.some((row) =>
      Object.entries(row).some(([key, val]) => {
        if (key === "Quantity") return Number(val || 1) !== 1;
        return String(val || "").trim() !== "";
      })
    );
  }, [assetId, spareRows]);

  const requestCancelConfirm = (next) => {
    setCancelAction(() => next);
    setShowCancelConfirm(true);
  };

  const toIsoOrEmpty = (value) => {
    if (!value) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    const asString = String(value);
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(asString)) return new Date(`${asString}T00:00:00`).toISOString();
    const date = new Date(asString);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };

  const saveAllSpares = async () => {
    if (!assetId) {
      toast.current?.show({ severity: "warn", summary: "Validation", detail: "Please select an Asset" });
      return;
    }
    for (const row of spareRows) {
      if (!row.SpareType || !row.SerialNumber) {
        toast.current?.show({ severity: "warn", summary: "Validation", detail: "Spare Type & Serial Number required for all rows" });
        return;
      }
    }

    try {
      for (const row of spareRows) {
        const formData = new FormData();
        formData.append("PropertyID", propertyId);
        formData.append("AssetID", assetId);
        formData.append("SpareType", row.SpareType);
        formData.append("Rating", row.Rating);
        formData.append("BackupTime", row.BackupTime);
        formData.append("Status", row.Status);
        formData.append("Quantity", row.Quantity);
        formData.append("PurchaseDate", toIsoOrEmpty(row.PurchaseDate));
        formData.append("ExpiryDate", toIsoOrEmpty(row.ExpiryDate));
        formData.append("SerialNumber", row.SerialNumber);
        formData.append("VendorName", row.VendorName);
        formData.append("InvoiceNo", row.InvoiceNo);
        formData.append("Warranty", row.Warranty);
        formData.append("Remarks", row.Remarks);
        formData.append("Reusable", 0);
        await SpareService.create(formData);
      }

      toast.current?.show({ severity: "success", summary: "Saved", detail: "All spares saved successfully" });
      setShowAddModal(false);
      resetAddForm();
      loadSpares();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save spares" });
    }
  };

  const confirmDelete = (row) => {
    setDeleteTarget(row);
    setShowDeleteModal(true);
  };

  const deleteSpare = async () => {
    if (!deleteTarget) return;
    try {
      await SpareService.delete(deleteTarget.SpareID);
      toast.current?.show({ severity: "success", summary: "Deleted", detail: "Spare deleted" });
      setShowDeleteModal(false);
      setDeleteTarget(null);
      if (Number(selectedSpareId) === Number(deleteTarget.SpareID)) setSelectedSpareId(null);
      loadSpares();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to delete spare" });
    }
  };

  const filteredSpares = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    return (spares || []).filter((row) => {
      const relatedAsset = assetById.get(Number(row?.AssetID));
      const passesQuery =
        !query ||
        [row?.SpareID, row?.AssetID, row?.SpareType, row?.Name, row?.SerialNumber, row?.VendorName, relatedAsset?.Name, relatedAsset?.name]
          .some((v) => String(v || "").toLowerCase().includes(query));
      const passesVendor = !filterVendor || String(row?.VendorName || "").toLowerCase().includes(String(filterVendor).toLowerCase());
      const passesType = !filterType || String(row?.SpareType || "").toLowerCase().includes(String(filterType).toLowerCase());
      const passesStatus = !filterStatus || statusMeta(row?.Status).label === filterStatus;
      const passesAsset = !filterAssetId || String(row?.AssetID ?? "") === String(filterAssetId);
      return passesQuery && passesVendor && passesType && passesStatus && passesAsset;
    });
  }, [spares, searchTerm, filterVendor, filterType, filterStatus, filterAssetId, assetById]);

  const selectedRow = useMemo(() => (spares || []).find((row) => Number(row.SpareID) === Number(selectedSpareId)) || null, [spares, selectedSpareId]);

  useEffect(() => {
    if (!selectedRow) return;
    setEditForm({
      SpareID: selectedRow.SpareID,
      AssetID: selectedRow.AssetID,
      SpareType: selectedRow.SpareType || "",
      Status: selectedRow.Status || "Running",
      Remarks: selectedRow.Remarks || "",
      SerialNumber: selectedRow.SerialNumber || "",
    });
  }, [selectedRow]);

  const onRowClick = (row) => {
    if (String(row?.SpareID) === String(selectedSpareId)) {
      if (sideMode === "details") {
        setSelectedSpareId(null);
      } else {
        setSideMode("details");
      }
      return;
    }
    setSelectedSpareId(row.SpareID);
    setSideMode("details");
  };

  const openEditPanel = (row) => {
    setSelectedSpareId(row.SpareID);
    setSideMode("edit");
  };

  const saveEdit = async () => {
    if (!editForm?.SpareID) return;
    if (!editForm.SpareType || !editForm.SerialNumber) {
      toast.current?.show({ severity: "warn", summary: "Validation", detail: "Type & Serial number required" });
      return;
    }

    const existing = selectedRow || {};
    try {
      const formData = new FormData();
      formData.append("SpareID", editForm.SpareID);
      formData.append("PropertyID", propertyId);
      formData.append("AssetID", existing.AssetID || editForm.AssetID || "");
      formData.append("SpareType", editForm.SpareType);
      formData.append("Rating", existing.Rating || "");
      formData.append("BackupTime", existing.BackupTime || "");
      formData.append("Status", editForm.Status);
      formData.append("Quantity", existing.Quantity ?? 1);
      formData.append("PurchaseDate", toIsoOrEmpty(existing.PurchaseDate));
      formData.append("ExpiryDate", toIsoOrEmpty(existing.ExpiryDate));
      formData.append("SerialNumber", editForm.SerialNumber);
      formData.append("VendorName", existing.VendorName || "");
      formData.append("InvoiceNo", existing.InvoiceNo || "");
      formData.append("Warranty", existing.Warranty || "");
      formData.append("Remarks", editForm.Remarks);
      formData.append("Reusable", 0);

      await SpareService.update(formData);
      setShowSuccessModal(true);
      setSideMode("details");
      loadSpares();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to update spare" });
    }
  };

  const resetFilters = () => {
    setFilterVendor("");
    setFilterStatus("");
    setFilterType("");
    setFilterAssetId("");
  };

  const closeFilterPopup = () => setShowFilterPanel(false);

  const selectedAsset = selectedRow ? assetById.get(Number(selectedRow.AssetID)) : null;
  const selectedStatus = statusMeta(selectedRow?.Status);
  const selectedQrCells = useMemo(() => buildPseudoQrCells(selectedRow?.SerialNumber || selectedRow?.SpareID || "QR"), [selectedRow]);

  const renderDetailsPanel = () => {
    if (!selectedRow) return null;
    return (
      <div className="asset-side-panel spare-side-panel asset-details-view-panel">
        <div className="asset-side-panel-header">
          <h4 className="asset-side-panel-title">Spare part Details</h4>
        </div>
        <div className="asset-side-panel-body spare-side-panel-body">
          <div className="asset-details-grid spare-details-grid">
            <div className="asset-info-item asset-info-full spare-readonly-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value spare-readonly-value">{selectedRow.SpareID}</span>
            </div>
            <div className="asset-info-item asset-info-full">
              <div className="spare-inline-head">
                <span className="asset-info-label">Name</span>
                <span className={`spare-status-pill spare-status-${selectedStatus.key}`}>{selectedStatus.label}</span>
              </div>
              <span className="asset-info-value">{selectedRow.SpareType || "Engine filter"}</span>
            </div>
            <div className="asset-info-item asset-info-full">
              <span className="asset-info-label">Description</span>
              <span className="asset-info-value">{selectedRow.Remarks || "Generic engine filter for industrial equipment"}</span>
            </div>
            <div className="asset-info-item asset-info-full">
              <span className="asset-info-label">Serial number</span>
              <span className="asset-info-value">{selectedRow.SerialNumber || "1234567890"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Asset</span>
              <span className="asset-info-value">{selectedAsset?.Name || selectedAsset?.name || "Generator"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Asset ID</span>
              <span className="asset-info-value">{selectedRow.AssetID || "-"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Manufacturer</span>
              <span className="asset-info-value">{selectedAsset?.Manufacturer || selectedAsset?.manufacturer || "Generic"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Model</span>
              <span className="asset-info-value">{selectedAsset?.AssetModel || selectedAsset?.Model || "Generic model"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Vendor</span>
              <span className="asset-info-value">{selectedRow.VendorName || "Generic vendor"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Purchase price</span>
              <span className="asset-info-value">{selectedRow.Rating ? `Rs${selectedRow.Rating}` : "Rs1000"}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Purchase date</span>
              <span className="asset-info-value">{formatDisplayDate(selectedRow.PurchaseDate)}</span>
            </div>
            <div className="asset-info-item">
              <span className="asset-info-label">Expiry date</span>
              <span className="asset-info-value">{formatDisplayDate(selectedRow.ExpiryDate)}</span>
            </div>
          </div>

          <div className="asset-doc-strip spare-doc-strip">
            <div className="spare-qr-code" aria-label="QR code preview">
              {selectedQrCells.map((filled, index) => (
                <span key={index} className={filled ? "filled" : ""} />
              ))}
            </div>
            <button type="button" className="asset-link-btn spare-photo-link" disabled>
              <i className="fa fa-file-image-o mr-1" aria-hidden="true" />
              Spare-part photo
            </button>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary" onClick={() => openEditPanel(selectedRow)}>
            Edit
          </button>
          <button type="button" className="btn btn-light" onClick={() => setSelectedSpareId(null)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderEditPanel = () => {
    if (!selectedRow || !editForm) return null;
    return (
      <div className="asset-side-panel asset-side-panel-form spare-side-panel">
        <div className="asset-side-panel-header">
          <div className="asset-panel-title-wrap">
            <span className="asset-panel-icon">
              <i className="fa fa-pencil-square-o" aria-hidden="true" />
            </span>
            <h4 className="asset-side-panel-title">Edit spare part details</h4>
          </div>
        </div>
        <div className="asset-side-panel-body spare-side-panel-body">
          <div className="asset-qr-preview spare-edit-qr-preview">
            <div className="spare-qr-code spare-qr-code-large" aria-label="QR code preview">
              {selectedQrCells.map((filled, index) => (
                <span key={index} className={filled ? "filled" : ""} />
              ))}
            </div>
          </div>

          <div className="asset-form-grid spare-form-grid">
            <div className="form-group spare-readonly-row">
              <label>ID</label>
              <div className="spare-readonly-value">{selectedRow.AssetID || "AST-111"}</div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input className="form-control" value={editForm.SpareType} onChange={(e) => setEditForm((prev) => ({ ...prev, SpareType: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={editForm.Status} onChange={(e) => setEditForm((prev) => ({ ...prev, Status: e.target.value }))}>
                <option value="Running">Running</option>
                <option value="Inactive">Inactive</option>
                <option value="Servicing">Servicing</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows="4" className="form-control" value={editForm.Remarks} onChange={(e) => setEditForm((prev) => ({ ...prev, Remarks: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Serial number</label>
              <input className="form-control" value={editForm.SerialNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, SerialNumber: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary" onClick={saveEdit}>
            Save changes
          </button>
          <button type="button" className="btn btn-light" onClick={() => setSideMode("details")}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="content-wrapper">
      <Toast ref={toast} />
      <section className="content mt-3">
        <div className="container-fluid">
          <div className="asset-master-page">
            <div
              className="asset-master-breadcrumb"
              role="button"
              tabIndex={0}
              onClick={() => history.push("/Account/App/AssetsMaster")}
              onKeyDown={(e) => e.key === "Enter" && history.push("/Account/App/AssetsMaster")}
            >
              <i className="fa fa-angle-left" aria-hidden="true" />
              <span>Asset Master</span>
            </div>

            <div className={`asset-master-layout ${selectedRow ? "has-side-panel" : ""}`}>
              <div className="asset-master-main-card">
                <div className="asset-master-tabs">
                  <button type="button" className="asset-master-tab" onClick={() => history.push("/Account/App/AssetsMaster")}>
                    Owned assets
                  </button>
                  <button type="button" className="asset-master-tab" onClick={() => history.push("/Account/App/RentalAssets")}>
                    Rented assets
                  </button>
                  <button type="button" className="asset-master-tab active">
                    Spare parts
                  </button>
                </div>

                <div className="asset-master-toolbar">
                  <div className="asset-master-search" onClick={() => searchInputRef.current?.focus()}>
                    <i className="fa fa-search" aria-hidden="true" />
                    <input ref={searchInputRef} type="text" placeholder="Search by name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="asset-master-toolbar-actions">
                    <button type="button" className={`btn asset-toolbar-filter ${showFilterPanel ? "active" : ""}`} onClick={() => setShowFilterPanel((prev) => !prev)}>
                      <i className="fa fa-sliders mr-1" aria-hidden="true" />
                      Filter
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary asset-toolbar-add"
                      onClick={() => {
                        resetAddForm();
                        setShowAddModal(true);
                      }}
                    >
                      <i className="fa fa-plus mr-1" aria-hidden="true" />
                      Add spare part
                    </button>
                  </div>
                </div>

                {showFilterPanel ? (
                  <div className="asset-inline-filters">
                    <div className="asset-filter-header">
                      <span className="asset-filter-title">Filters</span>
                      <button type="button" className="asset-filter-reset" onClick={resetFilters}>
                        <i className="fa fa-times mr-1" />
                        Reset All
                      </button>
                    </div>
                    <div className="asset-filter-field">
                      <label>Vendor</label>
                      <input className="form-control" placeholder="Enter name" value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)} />
                    </div>
                    <div className="asset-filter-field">
                      <label>Asset</label>
                      <select className="form-control" value={filterAssetId} onChange={(e) => setFilterAssetId(e.target.value)}>
                        <option value="">Enter name</option>
                        {assetOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="asset-filter-field asset-filter-field-full">
                      <label>Type</label>
                      <div className="asset-filter-chip-row">
                        {["UPS Battery", "Engine filter", "Battery"].map((item) => (
                          <button key={item} type="button" className={`asset-filter-chip ${filterType === item ? "active" : ""}`} onClick={() => setFilterType(filterType === item ? "" : item)}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="asset-filter-field asset-filter-field-full">
                      <label>Status</label>
                      <div className="asset-filter-chip-row">
                        {["Running", "Servicing", "Inactive"].map((item) => (
                          <button key={item} type="button" className={`asset-filter-chip ${filterStatus === item ? "active" : ""}`} onClick={() => setFilterStatus(filterStatus === item ? "" : item)}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="asset-filter-popup-footer">
                      <button type="button" className="btn btn-primary asset-filter-apply" onClick={closeFilterPopup}>
                        Apply filters
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="asset-master-table-wrap asset-master-table-wrap-spare">
                  <div className="table-responsive">
                    <table className="table custTable table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Asset</th>
                          <th>Service due</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSpares.map((row) => {
                          const meta = statusMeta(row?.Status);
                          const asset = assetById.get(Number(row.AssetID));
                          const isActive = Number(row.SpareID) === Number(selectedSpareId);
                          return (
                            <tr key={row.SpareID} className={isActive ? "grid-selected-row" : ""} onClick={() => onRowClick(row)}>
                              <td>{row.AssetID || "AST-111"}</td>
                              <td>{row.SpareType || "-"}</td>
                              <td>{asset?.Name || asset?.name || "Generator"}</td>
                              <td>{formatDisplayDate(row.ExpiryDate)}</td>
                              <td>
                                <span className={`spare-table-status spare-table-status-${meta.key}`}>{meta.label}</span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <button type="button" className="btn btn-sm btn-info" title="Edit" onClick={() => openEditPanel(row)}>
                                  <i className="fa fa-pencil" aria-hidden="true" />
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" title="Delete" onClick={() => confirmDelete(row)}>
                                  <i className="fa fa-trash" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredSpares.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "18px" }}>
                              No spares found
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

              {selectedRow ? (sideMode === "edit" ? renderEditPanel() : renderDetailsPanel()) : null}
            </div>

            {showAddModal ? (
              <div
                className="spare-add-backdrop"
                onClick={() => (hasAddDraft ? requestCancelConfirm(() => setShowAddModal(false)) : setShowAddModal(false))}
              >
                <div className="spare-add-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="spare-add-header">
                    <div className="spare-add-title">
                      <span className="spare-add-icon">
                        <i className="fa fa-plus" aria-hidden="true" />
                      </span>
                      Add spare part
                    </div>
                    <button
                      type="button"
                      className="spare-add-close"
                      onClick={() => (hasAddDraft ? requestCancelConfirm(() => setShowAddModal(false)) : setShowAddModal(false))}
                    >
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="spare-add-body">
                    <div className="spare-add-field">
                      <label>Asset</label>
                      <select className="form-control" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                        <option value="">Asset name or ID</option>
                        {assetOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="spare-add-section-header">
                      <span>Spare part</span>
                      <button type="button" className="spare-add-link" onClick={addSpareRow}>
                        <i className="fa fa-plus mr-1" aria-hidden="true" />
                        Add
                      </button>
                    </div>

                    {spareRows.map((row, index) => (
                      <div key={index} className="spare-add-card">
                        <div className="spare-add-card-header">
                          <div className="spare-add-card-title">Spare part {index + 1}</div>
                          <button type="button" className="spare-add-trash" disabled={spareRows.length === 1} onClick={() => removeSpareRow(index)}>
                            <i className="fa fa-trash-o" aria-hidden="true" />
                          </button>
                        </div>

                        <button type="button" className="spare-add-generate">
                          <i className="fa fa-qrcode mr-1" aria-hidden="true" />
                          Generate QR code
                        </button>

                        <div className="spare-add-grid">
                          <div className="spare-add-field">
                            <label>Type</label>
                            <input className="form-control" placeholder="Enter type" value={row.SpareType} onChange={(e) => updateRow(index, "SpareType", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Serial number</label>
                            <input className="form-control" placeholder="Enter serial number" value={row.SerialNumber} onChange={(e) => updateRow(index, "SerialNumber", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Back-up time</label>
                            <input className="form-control" placeholder="--:--:--" value={row.BackupTime} onChange={(e) => updateRow(index, "BackupTime", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Status</label>
                            <select className="form-control" value={row.Status} onChange={(e) => updateRow(index, "Status", e.target.value)}>
                              <option value="Running">Running</option>
                              <option value="Servicing">Servicing</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                          <div className="spare-add-field">
                            <label>Quantity</label>
                            <input className="form-control" type="number" min="1" value={row.Quantity} onChange={(e) => updateRow(index, "Quantity", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Vendor</label>
                            <input className="form-control" placeholder="Generic vendor" value={row.VendorName} onChange={(e) => updateRow(index, "VendorName", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Purchase date</label>
                            <input className="form-control" type="date" value={normalizeDateOnly(row.PurchaseDate)} onChange={(e) => updateRow(index, "PurchaseDate", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Expiry date</label>
                            <input className="form-control" type="date" value={normalizeDateOnly(row.ExpiryDate)} onChange={(e) => updateRow(index, "ExpiryDate", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Add invoice</label>
                            <input className="form-control" placeholder="Invoice no" value={row.InvoiceNo} onChange={(e) => updateRow(index, "InvoiceNo", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Add warranty</label>
                            <input className="form-control" placeholder="Warranty" value={row.Warranty} onChange={(e) => updateRow(index, "Warranty", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="spare-add-footer">
                    <button type="button" className="btn btn-primary" onClick={saveAllSpares}>
                      Save all
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => (hasAddDraft ? requestCancelConfirm(() => setShowAddModal(false)) : setShowAddModal(false))}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showCancelConfirm ? (
              <div className="spare-add-backdrop" onClick={() => setShowCancelConfirm(false)}>
                <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="spare-add-title">
                      <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Cancel action
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowCancelConfirm(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">
                    Are you sure you want to cancel? All your entered information will be lost.
                  </div>
                  <div className="asset-dialog-actions">
                    <button type="button" className="btn btn-light" onClick={() => setShowCancelConfirm(false)}>
                      No, keep editing
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setShowCancelConfirm(false);
                        const next = cancelAction;
                        setCancelAction(null);
                        next?.();
                        resetAddForm();
                      }}
                    >
                      Yes, cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showDeleteModal && deleteTarget ? (
              <div className="spare-add-backdrop" onClick={() => setShowDeleteModal(false)}>
                <div className="asset-master-main-card asset-delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="spare-add-title">
                      <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Delete asset
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowDeleteModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">
                    Are you sure you want to delete this Asset? This action cannot be undone.
                    <div className="asset-dialog-assetbox">
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Asset ID:</span>
                        <span className="asset-dialog-assetvalue">#{deleteTarget.SpareID}</span>
                      </div>
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Asset Name:</span>
                        <span className="asset-dialog-assetvalue">{deleteTarget.SpareType || "-"}</span>
                      </div>
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Location:</span>
                        <span className="asset-dialog-assetvalue">{assetById.get(Number(deleteTarget.AssetID))?.Location || "Building A"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="asset-dialog-actions asset-dialog-actions-right">
                    <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={deleteSpare}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showSuccessModal ? (
              <div className="spare-add-backdrop" onClick={() => setShowSuccessModal(false)}>
                <div className="asset-master-main-card asset-success-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="spare-add-title">
                      <span className="spare-add-icon" style={{ background: "rgba(33, 150, 243, 0.12)", color: "#1f4f82" }}>
                        <i className="fa fa-check" aria-hidden="true" />
                      </span>
                      Changes updated successfully
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowSuccessModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">The item has been updated.</div>
                  <div className="asset-dialog-actions asset-dialog-actions-right">
                    <button type="button" className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SparePage;
