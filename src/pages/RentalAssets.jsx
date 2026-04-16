import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import ExportToCSV from "../ReactComponents/ExportToCSV/ExportToCSV";
import RentalPopUp from "../ReactComponents/RentalModal/RentalPopUp";
import { getAssetRentOutReturnHistoryByAssetId } from "../Services/RentalAssets";
import "../MainComponents/AssetsMaster/AssetsMaster.css";
import "./RentalAssets.css";

const statusOptions = {
  running: { label: "Running", key: "running" },
  inactive: { label: "Inactive", key: "inactive" },
  servicing: { label: "Servicing", key: "servicing" },
};

const leaseOptions = {
  returned: { label: "Return", key: "return" },
  out: { label: "Out", key: "out" },
  return: { label: "Return", key: "return" },
};

const normalizeDate = (value) => {
  if (!value) return "";
  const text = String(value);
  return text.includes("T") ? text.split("T")[0] : text;
};

const formatDate = (value) => {
  const raw = normalizeDate(value);
  if (!raw) return "-";
  const [year, month, day] = raw.split("-");
  return year && month && day ? `${day}-${month}-${year}` : raw;
};

const formatTime = (value) => {
  if (!value) return "";
  const text = String(value);
  const normalized = text.includes("T") ? text : `1970-01-01T${text}`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const buildHistoryEntries = (history = []) =>
  (Array.isArray(history) ? history : [])
    .flatMap((item, index) => {
      const entries = [];

      if (item?.RentOut?.RentedOutDate) {
        entries.push({
          id: `rentout-${index}-${item.RentOut.RentedOutDate}`,
          type: "out",
          label: "Rented Out",
          summary: "Asset rented out to customer",
          byLabel: item?.RentOut?.AssigneeName || "S Kumar",
          dateValue: item.RentOut.RentedOutDate,
          details: [
            { label: "Rented To", value: item?.RentOut?.RentedTo || "-" },
            { label: "Out From", value: item?.RentOut?.OutFrom || "-" },
            { label: "Approved By", value: item?.RentOut?.ApprovedBy || "-" },
            { label: "Tentative Date", value: formatDate(item?.RentOut?.TentativeDate) || "-" },
          ],
        });
      }

      if (item?.Return?.ReturnDate) {
        entries.push({
          id: `return-${index}-${item.Return.ReturnDate}`,
          type: "returned",
          label: "Returned",
          summary: "Asset returned by customer",
          byLabel: item?.Return?.ReturnedBy || "S Kumar",
          dateValue: item.Return.ReturnDate,
          details: [
            { label: "Returned By", value: item?.Return?.ReturnedBy || "-" },
            { label: "Return From", value: item?.Return?.ReturnFrom || "-" },
            { label: "Return Date", value: formatDate(item?.Return?.ReturnDate) || "-" },
          ],
        });
      }

      return entries;
    })
    .sort((a, b) => new Date(b.dateValue).getTime() - new Date(a.dateValue).getTime());

const getStatusMeta = (asset = {}) => {
  const raw = String(asset.Status || asset.AssetStatus || "").trim().toLowerCase();
  if (raw.includes("inactive")) return statusOptions.inactive;
  if (raw.includes("servic")) return statusOptions.servicing;
  if (raw.includes("running")) return statusOptions.running;
  if (asset.ReturnDate === null && asset.RentedOutDate) return statusOptions.running;
  return statusOptions.inactive;
};

const getLeaseMeta = (asset = {}) => {
  const raw = String(asset.LeaseType || asset.Lease || "").trim().toLowerCase();
  if (raw === "in" || raw === "return" || raw === "returned") return leaseOptions.return;
  if (raw === "out") return leaseOptions.out;
  const rentOutTime = asset?.RentedOutDate ? new Date(asset.RentedOutDate).getTime() : 0;
  const returnTime = asset?.ReturnDate ? new Date(asset.ReturnDate).getTime() : 0;
  if (returnTime && returnTime >= rentOutTime) return leaseOptions.return;
  if (rentOutTime) return leaseOptions.out;
  return leaseOptions.return;
};

const buildEditForm = (asset = {}) => ({
  Id: asset.Id || "",
  Name: asset.Name || "",
  Status: getStatusMeta(asset).label,
  Description: asset.Description || "",
  Vendor: asset.Vendor || asset.Manufacturer || "ABCD",
  LeaseType: asset.LeaseType || "Outbound",
  Manufacturer: asset.Manufacturer || "Generic",
  Model: asset.AssetModel || asset.Model || "Generic model",
  Cost: asset.MonthlyRent || asset.Cost || "100",
  SecurityDeposit: asset.SecurityDeposit || "",
  ExpiryDate: normalizeDate(asset.ExpiryDate || asset.ReturnDate || ""),
  Location: asset.Location || asset.OutFrom || "Building-A",
  RentalContract: asset.RentalContract || asset.Contract || "1234.jpeg",
});

const RentalAssets = ({ propId, history }) => {
  const [rentalAssets, setRentalAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterManufacturer, setFilterManufacturer] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterLease, setFilterLease] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterServiceStatus, setFilterServiceStatus] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [panelMode, setPanelMode] = useState("details");
  const [editForm, setEditForm] = useState(buildEditForm());
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("rentout");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchRentalAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://api.urest.in:8096/api/Asset/GetRentalAssetData?PropId=${propId}`);
      const data = await res.json();
      setRentalAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setRentalAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalAssets();
  }, [propId]);

  const filteredAssets = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    return rentalAssets.filter((asset) => {
      const assetSearchFields = [asset?.Id, asset?.AssetID, asset?.Name, asset?.name, asset?.AssetName];
      const matchesSearch =
        !query ||
        assetSearchFields
          .filter(Boolean)
          .some((item) => String(item).toLowerCase().includes(query));
      const matchesManufacturer = !filterManufacturer || String(asset.Manufacturer || "").toLowerCase().includes(filterManufacturer.toLowerCase());
      const matchesLease = !filterLease || getLeaseMeta(asset).label === filterLease;
      const matchesStatus = !filterStatus || getStatusMeta(asset).label === filterStatus;
      const matchesVendor = !filterVendor || String(asset.Vendor || asset.VendorName || "").toLowerCase().includes(filterVendor.toLowerCase());
      const matchesType = !filterType || String(asset.AssetType || asset.LeaseType || "").toLowerCase().includes(filterType.toLowerCase());
      const matchesServiceStatus = !filterServiceStatus || (asset.ServiceStatus === filterServiceStatus);

      return matchesSearch && matchesManufacturer && matchesStatus && matchesVendor && matchesType && matchesServiceStatus;
    });
  }, [rentalAssets, searchTerm, filterManufacturer, filterVendor, filterStatus, filterType, filterServiceStatus]);

  const resetFilters = () => {
    setFilterManufacturer("");
    setFilterVendor("");
    setFilterLease("");
    setFilterStatus("");
    setFilterType("");
    setFilterServiceStatus("");
  };

  const selectedAsset = useMemo(() => rentalAssets.find((item) => Number(item.Id) === Number(selectedAssetId)) || null, [rentalAssets, selectedAssetId]);

  useEffect(() => {
    if (selectedAsset) setEditForm(buildEditForm(selectedAsset));
  }, [selectedAsset]);

  const handleSelectAsset = async (asset) => {
    if (String(asset?.Id) === String(selectedAssetId)) {
      if (panelMode === "details") {
        setSelectedAssetId(null);
      } else {
        setPanelMode("details");
      }
      return;
    }
    setSelectedAssetId(asset.Id);
    setPanelMode("details");

    const hasHistory = Array.isArray(asset.history);
    if (hasHistory) return;

    try {
      const historyData = await getAssetRentOutReturnHistoryByAssetId(asset.Id);
      setRentalAssets((prev) =>
        prev.map((item) =>
          Number(item.Id) === Number(asset.Id)
            ? {
                ...item,
                history: Array.isArray(historyData) ? historyData : [],
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRentModal = (asset, type) => {
    setSelectedAssetId(asset?.Id || null);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleEditClick = (asset) => {
    setSelectedAssetId(asset.Id);
    setEditForm(buildEditForm(asset));
    setPanelMode("edit");
  };

  const handleDeleteClick = (asset) => {
    setDeleteTarget(asset || null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setRentalAssets((prev) => prev.filter((item) => Number(item.Id) !== Number(deleteTarget.Id)));
    if (Number(selectedAssetId) === Number(deleteTarget.Id)) {
      setSelectedAssetId(null);
      setPanelMode("details");
    }
    if (Number(historyAsset?.Id) === Number(deleteTarget.Id)) {
      setShowHistoryModal(false);
      setHistoryAsset(null);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleSaveEdit = () => {
    setRentalAssets((prev) =>
      prev.map((item) =>
        Number(item.Id) === Number(selectedAssetId)
          ? {
              ...item,
              Name: editForm.Name,
              Status: editForm.Status,
              Description: editForm.Description,
              Vendor: editForm.Vendor,
              LeaseType: editForm.LeaseType,
              Manufacturer: editForm.Manufacturer,
              AssetModel: editForm.Model,
              Model: editForm.Model,
              MonthlyRent: editForm.Cost,
              Cost: editForm.Cost,
              SecurityDeposit: editForm.SecurityDeposit,
              ExpiryDate: editForm.ExpiryDate,
              Location: editForm.Location,
              RentalContract: editForm.RentalContract,
              Contract: editForm.RentalContract,
            }
          : item
      )
    );
    setPanelMode("details");
    setShowSuccessModal(true);
  };

  const handleCancelEdit = () => {
    setShowCancelConfirm(false);
    setSelectedAssetId(null);
    setPanelMode("details");
    setEditForm(buildEditForm());
  };

  const handleActionSubmit = async (formData, submitMode = actionType) => {
    if (!selectedAsset) return;
    const isReturnMode = submitMode === "return";
    const url = isReturnMode ? "https://api.urest.in:8096/ManageRentInAsset" : "https://api.urest.in:8096/ManageRentOutAsset";

    await fetch(url, {
      method: isReturnMode ? "PUT" : "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assetId: selectedAsset.Id,
        assetName: selectedAsset.Name,
        ...formData,
      }),
    });

    setShowActionModal(false);
    fetchRentalAssets();
  };

  const openHistoryModal = async (asset) => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryAsset(asset);
    setExpandedHistoryId(null);
    try {
      const historyData = Array.isArray(asset.history) ? asset.history : await getAssetRentOutReturnHistoryByAssetId(asset.Id);
      const normalizedHistory = Array.isArray(historyData) ? historyData : [];
      setHistoryAsset({ ...asset, history: normalizedHistory });
      setRentalAssets((prev) =>
        prev.map((item) =>
          Number(item.Id) === Number(asset.Id)
            ? {
                ...item,
                history: normalizedHistory,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenContract = () => {
    if (!selectedAsset) return;
    const contract = selectedAsset.ImageOut || selectedAsset.RentalContract || selectedAsset.Contract || selectedAsset.Image || "";
    if (!contract) return;
    
    const raw = String(contract);
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      window.open(raw, "_blank", "noopener,noreferrer");
      return;
    }
    
    const win = window.open("", "_blank");
    if (!win) return;
    if (raw.startsWith("data:application/pdf")) {
      win.document.write(
        `<html><body style="margin:0;padding:0"><embed src="${raw}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0"></body></html>`
      );
    } else {
      const imgSrc = raw.startsWith("data:") ? raw : `data:image/png;base64,${raw}`;
      win.document.write(
        `<html><body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${imgSrc}" style="max-width:100%;max-height:100vh;object-fit:contain"></body></html>`
      );
    }
    win.document.close();
  };

  const renderDetailsPanel = () => {
    if (!selectedAsset) return null;
    const statusMeta = getStatusMeta(selectedAsset);

    return (
      <div className="rental-panel-card rental-details-view-panel">
        <div className="rental-panel-header">
          <h4 className="rental-panel-title">Asset Details</h4>
        </div>

        <div className="rental-panel-body">
          <div className="rental-detail-grid">
            <div className="rental-detail-item rental-detail-full rental-readonly-row">
              <span className="rental-detail-label">ID</span>
              <span className="rental-detail-value rental-readonly-value">{selectedAsset.Id || "AST-111"}</span>
            </div>
            <div className="rental-detail-item rental-detail-full">
              <div className="rental-detail-inline-head">
                <span className="rental-detail-label">Name</span>
                <span className={`rental-status-chip rental-status-${statusMeta.key}`}>{statusMeta.label}</span>
              </div>
              <span className="rental-detail-value">{selectedAsset.Name || "Generator"}</span>
            </div>
            <div className="rental-detail-item rental-detail-full">
              <span className="rental-detail-label">Description</span>
              <span className="rental-detail-value">{selectedAsset.Description || "Generic generator description"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Vendor</span>
              <span className="rental-detail-value">{selectedAsset.Vendor || selectedAsset.Manufacturer || "Generic vendor"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Lease type</span>
              <span className="rental-detail-value">{selectedAsset.LeaseType || "Outbound"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Manufacturer</span>
              <span className="rental-detail-value">{selectedAsset.Manufacturer || "Generic"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Model</span>
              <span className="rental-detail-value">{selectedAsset.AssetModel || selectedAsset.Model || "Generic model"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Cost</span>
              <span className="rental-detail-value">{selectedAsset.MonthlyRent ? `₹${selectedAsset.MonthlyRent}/day` : "₹100/day"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Security deposit</span>
              <span className="rental-detail-value">{selectedAsset.SecurityDeposit || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Expiry date</span>
              <span className="rental-detail-value">{formatDate(selectedAsset.ExpiryDate || selectedAsset.ReturnDate)}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Location</span>
              <span className="rental-detail-value">{selectedAsset.Location || selectedAsset.OutFrom || "Building A"}</span>
            </div>
          </div>
          <div className="rental-panel-links">
            <button type="button" className="rental-text-link rental-panel-link-row" onClick={handleOpenContract}>
              <i className="fa fa-file-text mr-1" aria-hidden="true" />
              Rental contract
            </button>
            <button type="button" className="rental-text-link rental-panel-link-row" onClick={() => openHistoryModal(selectedAsset)}>
              <i className="fa fa-history mr-1" aria-hidden="true" />
              View asset history
            </button>
            <button
              type="button"
              className="rental-text-link rental-panel-link-row"
              onClick={() => handleOpenRentModal(selectedAsset, selectedAsset.ReturnDate === null && selectedAsset.RentedOutDate ? "return" : "rentout")}
            >
              <i className={`fa ${selectedAsset.ReturnDate === null && selectedAsset.RentedOutDate ? "fa-sign-in" : "fa-sign-out"} mr-1`} aria-hidden="true" />
              {selectedAsset.ReturnDate === null && selectedAsset.RentedOutDate ? "Rent in" : "Rent out"}
            </button>
          </div>
        </div>

        <div className="rental-panel-footer">
          <button type="button" className="btn rental-primary-btn" onClick={() => handleEditClick(selectedAsset)}>
            Edit
          </button>
          <button type="button" className="btn rental-secondary-btn" onClick={() => setSelectedAssetId(null)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderEditPanel = () => (
    <div className="asset-side-panel asset-side-panel-form asset-side-panel-form-edit">
      <div className="asset-side-panel-header asset-form-new-header">
        <div className="asset-panel-title-wrap">
          <span className="asset-form-icon-circle">
            <i className="fa fa-pencil-square-o" aria-hidden="true" />
          </span>
          <h4 className="asset-side-panel-title">Edit asset details</h4>
        </div>
      </div>

      <div className="asset-side-panel-body">
        <div className="asset-form-qr-centered">
          <div className="asset-qr-wrapper-large">
            <i className="fa fa-qrcode" aria-hidden="true" />
          </div>
        </div>

        <div className="asset-form-id-row-simple">
          <span className="asset-info-label">ID</span>
          <span className="asset-info-value">{editForm.Id || "AST-111"}</span>
        </div>

        <div className="asset-form-simple-stack">
          <div className="form-group asset-form-group-custom">
            <label>Name</label>
            <input className="form-control" value={editForm.Name} onChange={(e) => setEditForm({ ...editForm, Name: e.target.value })} />
          </div>

          <div className="form-group asset-form-group-custom">
            <label>Status</label>
            <select className="form-control" value={editForm.Status} onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}>
              <option value="Running">Running</option>
              <option value="Inactive">Inactive</option>
              <option value="Servicing">Servicing</option>
            </select>
          </div>

          <div className="form-group asset-form-group-custom">
            <label>Description</label>
            <textarea className="form-control" rows="4" value={editForm.Description} onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })} />
          </div>

          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Vendor</label>
              <input className="form-control" value={editForm.Vendor} onChange={(e) => setEditForm({ ...editForm, Vendor: e.target.value })} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Lease type</label>
              <select className="form-control" value={editForm.LeaseType} onChange={(e) => setEditForm({ ...editForm, LeaseType: e.target.value })}>
                <option value="Outbound">Outbound</option>
                <option value="Inbound">Inbound</option>
                <option value="Open">Open</option>
              </select>
            </div>
          </div>

          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Manufacturer</label>
              <input className="form-control" value={editForm.Manufacturer} onChange={(e) => setEditForm({ ...editForm, Manufacturer: e.target.value })} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Model</label>
              <input className="form-control" value={editForm.Model} onChange={(e) => setEditForm({ ...editForm, Model: e.target.value })} />
            </div>
          </div>

          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Cost</label>
              <input className="form-control" value={editForm.Cost} onChange={(e) => setEditForm({ ...editForm, Cost: e.target.value })} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Security deposit</label>
              <input className="form-control" value={editForm.SecurityDeposit} onChange={(e) => setEditForm({ ...editForm, SecurityDeposit: e.target.value })} />
            </div>
          </div>

          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Expiry date</label>
              <input type="date" className="form-control" value={editForm.ExpiryDate} onChange={(e) => setEditForm({ ...editForm, ExpiryDate: e.target.value })} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Location</label>
              <select className="form-control" value={editForm.Location} onChange={(e) => setEditForm({ ...editForm, Location: e.target.value })}>
                <option value={editForm.Location}>{editForm.Location}</option>
                <option value="Building A">Building A</option>
                <option value="Building-A">Building-A</option>
                <option value="Basement">Basement</option>
                <option value="Gate no-07">Gate no-07</option>
              </select>
            </div>
          </div>

          <div className="form-group asset-form-group-custom">
            <label>Rental contract</label>
            <div className="rental-upload-field">
              <input className="form-control" value={editForm.RentalContract} onChange={(e) => setEditForm({ ...editForm, RentalContract: e.target.value })} />
              <span className="rental-upload-icon" aria-hidden="true">
                <i className="fa fa-file-text" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="asset-side-panel-footer">
        <button type="button" className="btn btn-primary asset-btn-footer-save" onClick={handleSaveEdit}>
          Save changes
        </button>
        <button type="button" className="btn btn-outline-light asset-btn-footer-cancel" onClick={() => setShowCancelConfirm(true)}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="content-wrapper">
      <section className="content mt-3">
        <div className="container-fluid">
          <div className="rental-assets-page">
            <div className="rental-assets-breadcrumb" onClick={() => history.push("/Account/App/AssetsMaster")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && history.push("/Account/App/AssetsMaster")}>
              <i className="fa fa-angle-left" aria-hidden="true" />
              <span>Asset Master</span>
            </div>

            <div className={`rental-assets-layout ${selectedAsset ? "has-side-panel" : ""}`}>
              <div className="rental-assets-main-card">
                <div className="rental-assets-tabs">
                  <button type="button" className="rental-assets-tab" onClick={() => history.push("/Account/App/AssetsMaster")}>
                    Owned assets
                  </button>
                  <button type="button" className="rental-assets-tab active">
                    Rented assets
                  </button>
                  <button type="button" className="rental-assets-tab" onClick={() => history.push("/Account/App/SpareMaster")}>
                    Spare parts
                  </button>
                </div>

                <div className="rental-assets-toolbar">
                  <div className="rental-assets-search">
                    <i className="fa fa-search" aria-hidden="true" />
                    <input type="text" placeholder="Search by name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="rental-assets-actions">
                    <button type="button" className={`btn asset-toolbar-filter ${showFilterPanel ? "active" : ""}`} onClick={() => setShowFilterPanel((prev) => !prev)}>
                      <i className="fa fa-sliders" aria-hidden="true" />
                      Filter
                    </button>
                    {/* <ExportToCSV data={filteredAssets} fileName="RentalAssets.csv" /> */}
                    <button
                      type="button"
                      className="btn rental-primary-btn"
                      onClick={() => handleOpenRentModal(selectedAsset || filteredAssets[0] || {}, "toggle")}
                      disabled={!selectedAsset && filteredAssets.length === 0}
                    >
                      <i className="fa fa-sign-out" aria-hidden="true" />
                      Rent asset
                    </button>
                  </div>
                </div>

                {showFilterPanel ? (
                  <div className="asset-inline-filters">
                    <div className="asset-filter-header">
                      <span className="asset-filter-title">Filters</span>
                      <button type="button" className="asset-filter-reset" onClick={resetFilters}>
                        <i className="fa fa-times" aria-hidden="true" />
                        Reset All
                      </button>
                    </div>

                    <div className="asset-filter-grid">
                      <div className="asset-filter-field">
                        <label>Vendor</label>
                        <select className="form-control" value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}>
                          <option value="">Enter name</option>
                          <option value="vendor1">Vendor 1</option>
                          <option value="vendor2">Vendor 2</option>
                        </select>
                      </div>
                      <div className="asset-filter-field">
                        <label>Manufacturer</label>
                        <select className="form-control" value={filterManufacturer} onChange={(e) => setFilterManufacturer(e.target.value)}>
                          <option value="">Enter name</option>
                          <option value="manfb1">Manufacturer 1</option>
                          <option value="manfb2">Manufacturer 2</option>
                        </select>
                      </div>

                      <div className="asset-filter-field asset-filter-field-full">
                        <label>Type</label>
                        <div className="asset-filter-chip-row">
                          {["Rented in", "Rented Out", "In house"].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`asset-filter-chip ${filterType === item ? "active" : ""}`}
                              onClick={() => setFilterType(filterType === item ? "" : item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="asset-filter-field asset-filter-field-full">
                        <label>Status</label>
                        <div className="asset-filter-chip-row">
                          {["Running", "Servicing", "Inactive"].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`asset-filter-chip ${filterStatus === item ? "active" : ""}`}
                              onClick={() => setFilterStatus(filterStatus === item ? "" : item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="asset-filter-field asset-filter-field-full">
                        <label>Service Status</label>
                        <div className="asset-filter-chip-row">
                          {["Due", "Upcoming", "Overdue"].map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`asset-filter-chip ${filterServiceStatus === item ? "active" : ""}`}
                              onClick={() => setFilterServiceStatus(filterServiceStatus === item ? "" : item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="asset-filter-popup-footer">
                      <button type="button" className="asset-filter-apply" onClick={() => setShowFilterPanel(false)}>
                        Apply filters
                      </button>
                    </div>
                  </div>
                ) : null}

                <LoadingOverlay active={loading} spinner={<PropagateLoader color="#336B93" size={16} />}>
                  <div className={`rental-assets-table-wrap ${selectedAssetId ? "has-selection" : ""}`.trim()}>
                    <table className="table rental-assets-table mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Lease</th>
                          <th>Manufacturer</th>
                          <th>Lease</th>
                          <th>Expiry date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssets.map((asset) => {
                          const statusMeta = getStatusMeta(asset);
                          const leaseMeta = getLeaseMeta(asset);
                          const isReturnFlow = asset.ReturnDate === null && asset.RentedOutDate;

                          return (
                            <tr key={asset.Id} className={Number(selectedAssetId) === Number(asset.Id) ? "active" : ""} onClick={() => handleSelectAsset(asset)}>
                              <td>{asset.Id || "AST-111"}</td>
                              <td>{asset.Name || "Water pump"}</td>
                              <td>{asset.Manufacturer || "-"}</td>
                              <td>
                                <span className={`rental-lease-pill rental-lease-${leaseMeta.key}`}>{leaseMeta.label}</span>
                              </td>
                              <td>{formatDate(asset.ExpiryDate || asset.ReturnDate)}</td>
                              <td>
                                <span className={`rental-status-chip rental-status-${statusMeta.key}`}>{statusMeta.label}</span>
                              </td>
                              <td>
                                <div className="rental-row-actions" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" className="rental-icon-btn" title="Edit" onClick={() => handleEditClick(asset)}>
                                    <i className="fa fa-pencil" aria-hidden="true" />
                                  </button>
                                  <button type="button" className="rental-icon-btn" title="Delete" onClick={() => handleDeleteClick(asset)}>
                                    <i className="fa fa-trash-o" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </LoadingOverlay>
              </div>

              {selectedAsset ? (panelMode === "edit" ? renderEditPanel() : renderDetailsPanel()) : null}
            </div>

            {showActionModal && (selectedAsset || filteredAssets[0]) ? (
              <RentalPopUp
                show={showActionModal}
                handleClose={() => setShowActionModal(false)}
                asset={selectedAsset || filteredAssets[0]}
                actionType={actionType}
                handleSubmit={handleActionSubmit}
              />
            ) : null}

            {showDeleteModal && deleteTarget ? (
              <div className="spare-add-backdrop" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                <div className="asset-master-main-card asset-delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="spare-add-title">
                      <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Delete asset
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">
                    Are you sure you want to delete this Asset? This action cannot be undone.
                    <div className="asset-dialog-assetbox">
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Asset ID:</span>
                        <span className="asset-dialog-assetvalue">#{deleteTarget.Id}</span>
                      </div>
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Asset Name:</span>
                        <span className="asset-dialog-assetvalue">{deleteTarget.Name || "-"}</span>
                      </div>
                      <div className="asset-dialog-assetrow">
                        <span className="asset-dialog-assetlabel">Location:</span>
                        <span className="asset-dialog-assetvalue">{deleteTarget.Location || deleteTarget.OutFrom || "-"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="asset-dialog-actions asset-dialog-actions-right">
                    <button type="button" className="btn btn-light" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
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

            {showCancelConfirm ? (
              <div className="spare-add-backdrop" onClick={() => setShowCancelConfirm(false)}>
                <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="spare-add-title">
                      <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Cancel edits
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
                    <button type="button" className="btn btn-danger" onClick={handleCancelEdit}>
                      Yes, cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showHistoryModal ? (
              <div className="rental-history-overlay" onClick={() => setShowHistoryModal(false)}>
                <div className="rental-history-card" onClick={(e) => e.stopPropagation()}>
                  <div className="rental-history-header">
                    <div className="rental-history-title-wrap">
                      <span className="rental-history-icon">
                        <i className="fa fa-history" aria-hidden="true" />
                      </span>
                      <div className="rental-history-title-text">
                        <span className="rental-history-title-main">Rented asset</span>
                        <span className="rental-history-title-lease">- {historyAsset?.Name || "Generator"}</span>
                        <span className="rental-history-title-id">({historyAsset?.Id || "AST-111"})</span>
                      </div>
                    </div>
                    <button type="button" className="rental-history-close" onClick={() => setShowHistoryModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rental-history-body">
                    {historyLoading ? (
                      <div className="rental-history-empty">Loading history...</div>
                    ) : buildHistoryEntries(historyAsset?.history).length > 0 ? (
                      buildHistoryEntries(historyAsset?.history).map((item) => {
                          const isExpanded = expandedHistoryId === item.id;
                          return (
                          <div
                            key={item.id}
                            className={`rental-history-item ${isExpanded ? "expanded" : ""}`}
                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setExpandedHistoryId(isExpanded ? null : item.id);
                              }
                            }}
                          >
                            <span className="rental-history-dot" />
                            <div className="rental-history-date">
                              <strong>{formatDate(item.dateValue)}</strong>
                              <span>{formatTime(item.dateValue)}</span>
                            </div>
                            <span className={`rental-history-badge rental-history-${item.type}`}>{item.label}</span>
                            <div className="rental-history-copy">
                              <strong>{item.summary}</strong>
                              <span>By {item.byLabel}</span>
                            </div>
                            <i className={`fa ${isExpanded ? "fa-angle-up" : "fa-angle-down"} rental-history-row-icon`} aria-hidden="true" />
                            {isExpanded ? (
                              <div className="rental-history-details">
                                {item.details.map((detail, detailIndex) => (
                                  <div key={`${item.id}-detail-${detailIndex}`} className="rental-history-detail-item">
                                    <span className="rental-history-detail-label">{detail.label}</span>
                                    <span className="rental-history-detail-value">{detail.value}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div className="rental-history-empty">No history found</div>
                    )}
                  </div>

                  <div className="rental-history-footer">
                    <button type="button" className="btn rental-primary-btn" onClick={() => setShowHistoryModal(false)}>
                      Close
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

function mapStateToProps(state) {
  return {
    propId: state.Commonreducer.puidn,
  };
}

export default withRouter(connect(mapStateToProps)(RentalAssets));

