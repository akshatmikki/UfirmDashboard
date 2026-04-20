import React, { useEffect, useMemo, useRef, useState } from "react";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import { connect } from "react-redux";
import ExportToCSV from "../ReactComponents/ExportToCSV/ExportToCSV";
import PopUp from "../ReactComponents/CheckIn&OutModal/PopUp";
import CustomDatePicker from "../ReactComponents/CustomDatePicker/CustomDatePicker";
import SpareService from "../Services/SpareService";
import { getAssetCheckInOutHistoryByAssetId } from "../Services/CheckInCheckOut";
import "../MainComponents/AssetsMaster/AssetsMaster.css";
import "./RentalAssets.css";
import "./checkIn-checkOutPage.css";

const ASSET_API_BASE = "https://api.urest.in:8096";

const normalizeDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const iso = normalizeDate(value);
  if (!iso) return "-";
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
};

const formatDateTimeParts = (value) => {
  if (!value) return { date: "-", time: "-" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: formatDate(value), time: "-" };
  return {
    date: date.toLocaleDateString("en-GB").replace(/\//g, "-"),
    time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
};

const toReadableLabel = (key) =>
  String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const looksLikeImageField = (key, value) => {
  if (!value) return false;
  const text = String(value).trim();
  return /image|photo|attachment/i.test(String(key || "")) || /^data:image\//i.test(text) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(text) || /^https?:\/\//i.test(text);
};

const resolveImageSource = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^data:image\//i.test(text) || /^https?:\/\//i.test(text)) return text;
  if (/^[A-Za-z0-9+/=]+$/.test(text) && text.length > 80) return `data:image/jpeg;base64,${text}`;
  return text;
};

const getHistorySections = (item = {}) =>
  [
    { key: "CheckOut", type: "checkout", title: "Asset checked out from location", data: item?.CheckOut || null },
    { key: "CheckIn", type: "checkin", title: "Asset checked into location", data: item?.CheckIn || null },
  ].filter((section) => section.data && Object.keys(section.data).length > 0);

const statusMeta = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "true" || raw === "running" || raw === "active") {
    return { label: "Running", className: "asset-status-badge status-active" };
  }
  if (raw === "servicing") {
    return { label: "Servicing", className: "asset-status-badge status-servicing" };
  }
  return { label: "Inactive", className: "asset-status-badge status-inactive" };
};

const dispatchMeta = (row = {}) => {
  if (row?.DispatchType) {
    const normalized = String(row.DispatchType).trim().toLowerCase();
    if (normalized === "out") return { label: "Out", className: "transfer-chip transfer-chip-out" };
    if (normalized === "in") return { label: "In", className: "transfer-chip transfer-chip-in" };
    if (normalized === "open") return { label: "Open", className: "transfer-chip transfer-chip-open" };
  }
  if (row?.ReturnDate === null && row?.RentedOutDate) return { label: "Out", className: "transfer-chip transfer-chip-out" };
  if (row?.ReturnDate) return { label: "In", className: "transfer-chip transfer-chip-in" };
  return { label: "Open", className: "transfer-chip transfer-chip-open" };
};

const buildAssetEditForm = (row = {}) => ({
  Id: row.Id || "",
  Name: row.Name || "",
  Status: statusMeta(row.Status).label,
  Description: row.Description || row.Purpose || "",
  DispatchType: dispatchMeta(row).label,
  AssigneeName: row.AssigneeName || row.Assignee || "S kumar",
  OutFrom: row.OutFrom || row.Location || "Building A",
  SentTo: row.SentTo || row.SentLocation || "Building B",
  Manufacturer: row.Manufacturer || "Generic",
  Model: row.AssetModel || row.Model || "Generic model",
  ExpiryDate: normalizeDate(row.TentativeReturnDate || row.ReturnDate || row.ExpiryDate),
  Location: row.Location || row.OutFrom || "Building A",
});

const buildSpareEditForm = (row = {}) => ({
  SpareID: row.SpareID || "",
  SpareType: row.SpareType || row.Name || "",
  Status: statusMeta(row.Status).label,
  Description: row.Remarks || row.Description || "",
  SerialNumber: row.SerialNumber || "",
  AssetName: row.AssetName || "Related asset",
  Manufacturer: row.Manufacturer || "Generic",
  Model: row.Model || "Generic model",
  VendorName: row.VendorName || "Generic vendor",
  Rating: row.Rating || "",
  PurchaseDate: normalizeDate(row.PurchaseDate),
  ExpiryDate: normalizeDate(row.ExpiryDate),
  Location: row.Location || "Building A",
});

const buildActionAsset = (row, tab) =>
  tab === "spares"
    ? {
        Id: row?.AssetID || row?.SpareID || 0,
        Name: row?.AssetName || row?.SpareType || "Spare part",
      }
    : {
        Id: row?.Id || 0,
        Name: row?.Name || "Asset",
      };

const mapStateToProps = (state) => ({
  propId: state.Commonreducer?.puidn || state.UserDataReducer?.UserData?.PropertyId || state.PropertyId || 0,
});

const CheckInCheckOut = ({ propId }) => {
  const searchInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("assets");
  const [loading, setLoading] = useState(true);
  const [assetRows, setAssetRows] = useState([]);
  const [spareRows, setSpareRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [assetLocationFilter, setAssetLocationFilter] = useState("");
  const [assetDispatchFilter, setAssetDispatchFilter] = useState("");
  const [assetStatusFilter, setAssetStatusFilter] = useState("");
  const [spareAssetFilter, setSpareAssetFilter] = useState("");
  const [spareTypeFilter, setSpareTypeFilter] = useState("");
  const [spareStatusFilter, setSpareStatusFilter] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedSpareId, setSelectedSpareId] = useState(null);
  const [panelMode, setPanelMode] = useState("details");
  const [assetEditForm, setAssetEditForm] = useState(buildAssetEditForm());
  const [spareEditForm, setSpareEditForm] = useState(buildSpareEditForm());
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("checkout");
  const [actionTab, setActionTab] = useState("assets");
  const [currentActionRow, setCurrentActionRow] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [expandedHistoryKeys, setExpandedHistoryKeys] = useState([]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      const [assetRes, spareRes] = await Promise.all([
        fetch(`${ASSET_API_BASE}/api/Asset/GetAssetCheckOutData?PropId=${propId}`),
        SpareService.getByProperty(propId),
      ]);

      const assetData = await assetRes.json();
      setAssetRows(Array.isArray(assetData) ? assetData : []);
      setSpareRows(Array.isArray(spareRes) ? spareRes : []);
    } catch (error) {
      console.error("Failed to load asset transfer data:", error);
      setAssetRows([]);
      setSpareRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [propId]);

  const selectedAsset = useMemo(
    () => assetRows.find((row) => Number(row.Id) === Number(selectedAssetId)) || null,
    [assetRows, selectedAssetId]
  );

  const selectedSpare = useMemo(
    () => spareRows.find((row) => Number(row.SpareID) === Number(selectedSpareId)) || null,
    [spareRows, selectedSpareId]
  );

  const filteredAssets = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    return assetRows.filter((row) => {
      const matchesSearch =
        !query ||
        [row?.Id, row?.Name]
          .filter(Boolean)
          .some((item) => String(item).toLowerCase().includes(query));
      const matchesLocation = !assetLocationFilter || String(row?.Location || row?.OutFrom || "").toLowerCase().includes(assetLocationFilter.toLowerCase());
      const matchesDispatch = !assetDispatchFilter || dispatchMeta(row).label === assetDispatchFilter;
      const matchesStatus = !assetStatusFilter || statusMeta(row?.Status).label === assetStatusFilter;
      return matchesSearch && matchesLocation && matchesDispatch && matchesStatus;
    });
  }, [assetRows, searchTerm, assetLocationFilter, assetDispatchFilter, assetStatusFilter]);

  const filteredSpares = useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    return spareRows.filter((row) => {
      const matchesSearch =
        !query ||
        [row?.SpareID, row?.SpareType, row?.AssetName]
          .filter(Boolean)
          .some((item) => String(item).toLowerCase().includes(query));
      const matchesAsset = !spareAssetFilter || String(row?.AssetName || row?.AssetID || "").toLowerCase().includes(spareAssetFilter.toLowerCase());
      const matchesType = !spareTypeFilter || String(row?.SpareType || "").toLowerCase().includes(spareTypeFilter.toLowerCase());
      const matchesStatus = !spareStatusFilter || statusMeta(row?.Status).label === spareStatusFilter;
      return matchesSearch && matchesAsset && matchesType && matchesStatus;
    });
  }, [spareRows, searchTerm, spareAssetFilter, spareTypeFilter, spareStatusFilter]);

  const activeRows = activeTab === "assets" ? filteredAssets : filteredSpares;
  const activeSelectedRow = activeTab === "assets" ? selectedAsset : selectedSpare;
  const activeSelection = activeTab === "assets" ? selectedAssetId : selectedSpareId;

  const resetFilters = () => {
    setSearchTerm("");
    setAssetLocationFilter("");
    setAssetDispatchFilter("");
    setAssetStatusFilter("");
    setSpareAssetFilter("");
    setSpareTypeFilter("");
    setSpareStatusFilter("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowFilterPanel(false);
    setPanelMode("details");
    setSearchTerm("");
    if (tab === "assets") {
      setSelectedSpareId(null);
      setSpareEditForm(buildSpareEditForm());
    } else {
      setSelectedAssetId(null);
      setAssetEditForm(buildAssetEditForm());
    }
  };

  const handleAssetRowClick = (row) => {
    if (Number(row?.Id) === Number(selectedAssetId)) {
      setSelectedAssetId(null);
      setPanelMode("details");
      return;
    }
    setSelectedAssetId(row.Id);
    setPanelMode("details");
  };

  const handleSpareRowClick = (row) => {
    if (Number(row?.SpareID) === Number(selectedSpareId)) {
      setSelectedSpareId(null);
      setPanelMode("details");
      return;
    }
    setSelectedSpareId(row.SpareID);
    setPanelMode("details");
  };

  const handleEditClick = (row, tab) => {
    if (tab === "assets") {
      setSelectedAssetId(row.Id);
      setAssetEditForm(buildAssetEditForm(row));
    } else {
      setSelectedSpareId(row.SpareID);
      setSpareEditForm(buildSpareEditForm(row));
    }
    setPanelMode("edit");
  };

  const requestDelete = (row, tab) => {
    setDeleteTarget({ row, tab });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { row, tab } = deleteTarget;
    if (tab === "assets") {
      setAssetRows((prev) => prev.filter((item) => Number(item.Id) !== Number(row.Id)));
      if (Number(selectedAssetId) === Number(row.Id)) setSelectedAssetId(null);
    } else {
      try {
        await SpareService.delete(row.SpareID);
      } catch (error) {
        console.error("Failed to delete spare:", error);
      }
      setSpareRows((prev) => prev.filter((item) => Number(item.SpareID) !== Number(row.SpareID)));
      if (Number(selectedSpareId) === Number(row.SpareID)) setSelectedSpareId(null);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const openActionModal = (type, row, tab) => {
    if (!row) return;
    setCurrentActionRow(row);
    setActionTab(tab);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleActionSubmit = async (formData) => {
    const currentAsset = buildActionAsset(currentActionRow, actionTab);
    const url = actionType === "checkin" ? `${ASSET_API_BASE}/ManageCheckIn` : `${ASSET_API_BASE}/ManageCheckOut`;
    try {
      const response = await fetch(url, {
        method: actionType === "checkin" ? "PUT" : "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AssetId: currentAsset.Id,
          AssetName: currentAsset.Name,
          ...formData,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed ${actionType}: ${errorBody || response.status}`);
      }
      setShowActionModal(false);
      setCurrentActionRow(null);
      await loadPageData();
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    }
  };

  const handleSaveEdit = async () => {
    if (activeTab === "assets" && selectedAssetId) {
      setAssetRows((prev) =>
        prev.map((item) =>
          Number(item.Id) === Number(selectedAssetId)
            ? {
                ...item,
                Name: assetEditForm.Name,
                Status: assetEditForm.Status,
                Description: assetEditForm.Description,
                Purpose: assetEditForm.Description,
                DispatchType: assetEditForm.DispatchType,
                AssigneeName: assetEditForm.AssigneeName,
                OutFrom: assetEditForm.OutFrom,
                SentTo: assetEditForm.SentTo,
                Manufacturer: assetEditForm.Manufacturer,
                AssetModel: assetEditForm.Model,
                Model: assetEditForm.Model,
                TentativeReturnDate: assetEditForm.ExpiryDate,
                ExpiryDate: assetEditForm.ExpiryDate,
                Location: assetEditForm.Location,
              }
            : item
        )
      );
    }

    if (activeTab === "spares" && selectedSpareId) {
      const formData = new FormData();
      formData.append("SpareID", spareEditForm.SpareID);
      formData.append("AssetID", activeSelectedRow?.AssetID || "");
      formData.append("SpareType", spareEditForm.SpareType);
      formData.append("Remarks", spareEditForm.Description);
      formData.append("SerialNumber", spareEditForm.SerialNumber);
      formData.append("VendorName", spareEditForm.VendorName);
      formData.append("Rating", spareEditForm.Rating);
      formData.append("PurchaseDate", spareEditForm.PurchaseDate);
      formData.append("ExpiryDate", spareEditForm.ExpiryDate);
      try {
        await SpareService.update(formData);
      } catch (error) {
        console.error("Failed to update spare:", error);
      }
      setSpareRows((prev) =>
        prev.map((item) =>
          Number(item.SpareID) === Number(selectedSpareId)
            ? {
                ...item,
                SpareType: spareEditForm.SpareType,
                Status: spareEditForm.Status,
                Remarks: spareEditForm.Description,
                Description: spareEditForm.Description,
                SerialNumber: spareEditForm.SerialNumber,
                AssetName: spareEditForm.AssetName,
                Manufacturer: spareEditForm.Manufacturer,
                Model: spareEditForm.Model,
                VendorName: spareEditForm.VendorName,
                Rating: spareEditForm.Rating,
                PurchaseDate: spareEditForm.PurchaseDate,
                ExpiryDate: spareEditForm.ExpiryDate,
                Location: spareEditForm.Location,
              }
            : item
        )
      );
    }

    setPanelMode("details");
    setShowSuccessModal(true);
  };

  const confirmCancelEdit = () => {
    setShowCancelConfirm(false);
    setPanelMode("details");
    if (activeTab === "assets") {
      setSelectedAssetId(null);
      setAssetEditForm(buildAssetEditForm());
    } else {
      setSelectedSpareId(null);
      setSpareEditForm(buildSpareEditForm());
    }
  };

  const openHistory = async (row) => {
    try {
      setShowHistoryModal(true);
      setHistoryLoading(true);
      setHistoryTitle(row?.Name || row?.AssetName || "Asset");
      const data = await getAssetCheckInOutHistoryByAssetId(row?.Id || row?.AssetID);
      setHistoryData(Array.isArray(data) ? data : []);
      setExpandedHistoryKeys(
        (Array.isArray(data) ? data : []).flatMap((item, index) =>
          getHistorySections(item).map((section) => `${index}-${section.key}`)
        )
      );
    } catch (error) {
      console.error("Failed to load history:", error);
      setHistoryData([]);
      setExpandedHistoryKeys([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderHistoryDetails = (data = {}) => {
    const entries = Object.entries(data).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "");
    const imageEntries = entries.filter(([key, value]) => looksLikeImageField(key, value));
    const detailEntries = entries.filter(([key, value]) => !looksLikeImageField(key, value));

    return (
      <div className="transfer-history-detail-card">
        {detailEntries.length ? (
          <div className="transfer-history-detail-grid">
            {detailEntries.map(([key, value]) => (
              <div key={key} className="transfer-history-detail-row">
                <span className="transfer-history-detail-label">{toReadableLabel(key)}</span>
                <span className="transfer-history-detail-value">
                  {/date|time/i.test(key) ? formatDateTimeParts(value).date !== "-" && /time/i.test(key) ? `${formatDateTimeParts(value).date} ${formatDateTimeParts(value).time}` : formatDate(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {imageEntries.length ? (
          <div className="transfer-history-images">
            {imageEntries.map(([key, value]) => (
              <div key={key} className="transfer-history-image-card">
                <span className="transfer-history-detail-label">{toReadableLabel(key)}</span>
                <img className="transfer-history-image" src={resolveImageSource(value)} alt={toReadableLabel(key)} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };
  const renderFilterPanel = () => {
    if (!showFilterPanel) return null;
    if (activeTab === "assets") {
      return (
        <div className="asset-inline-filters">
          <div className="asset-filter-header">
            <span className="asset-filter-title">Filters</span>
            <button type="button" className="asset-filter-reset" onClick={resetFilters}>
              <i className="fa fa-times mr-1" />
              Reset All
            </button>
          </div>
          <div className="asset-filter-field">
            <label>Location</label>
            <input className="form-control" placeholder="Enter name" value={assetLocationFilter} onChange={(e) => setAssetLocationFilter(e.target.value)} />
          </div>
          <div className="asset-filter-field">
            <label>Dispatch</label>
            <select className="form-control" value={assetDispatchFilter} onChange={(e) => setAssetDispatchFilter(e.target.value)}>
              <option value="">Enter name</option>
              <option value="Out">Out</option>
              <option value="In">In</option>
              <option value="Open">Open</option>
            </select>
          </div>
          <div className="asset-filter-field asset-filter-field-full">
            <label>Status</label>
            <div className="asset-filter-chip-row">
              {["Running", "Inactive", "Servicing"].map((item) => (
                <button key={item} type="button" className={`asset-filter-chip ${assetStatusFilter === item ? "active" : ""}`} onClick={() => setAssetStatusFilter(assetStatusFilter === item ? "" : item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="asset-filter-popup-footer">
            <button type="button" className="btn btn-primary asset-filter-apply" onClick={() => setShowFilterPanel(false)}>
              Apply filters
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="asset-inline-filters">
        <div className="asset-filter-header">
          <span className="asset-filter-title">Filters</span>
          <button type="button" className="asset-filter-reset" onClick={resetFilters}>
            <i className="fa fa-times mr-1" />
            Reset All
          </button>
        </div>
        <div className="asset-filter-field">
          <label>Asset</label>
          <input className="form-control" placeholder="Enter name" value={spareAssetFilter} onChange={(e) => setSpareAssetFilter(e.target.value)} />
        </div>
        <div className="asset-filter-field">
          <label>Spare type</label>
          <input className="form-control" placeholder="Enter name" value={spareTypeFilter} onChange={(e) => setSpareTypeFilter(e.target.value)} />
        </div>
        <div className="asset-filter-field asset-filter-field-full">
          <label>Status</label>
          <div className="asset-filter-chip-row">
            {["Running", "Inactive", "Servicing"].map((item) => (
              <button key={item} type="button" className={`asset-filter-chip ${spareStatusFilter === item ? "active" : ""}`} onClick={() => setSpareStatusFilter(spareStatusFilter === item ? "" : item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="asset-filter-popup-footer">
          <button type="button" className="btn btn-primary asset-filter-apply" onClick={() => setShowFilterPanel(false)}>
            Apply filters
          </button>
        </div>
      </div>
    );
  };

  const renderAssetDetailsPanel = () => {
    if (!selectedAsset) return null;
    const currentStatus = statusMeta(selectedAsset.Status);
    return (
      <div className="asset-side-panel asset-details-view-panel transfer-side-panel">
        <div className="asset-side-panel-header">
          <h4 className="asset-side-panel-title">Asset Details</h4>
        </div>
        <div className="asset-side-panel-body">
          <div className="asset-details-new-layout">
            <div className="asset-details-row asset-details-header-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value">{selectedAsset.Id || "AST-111"}</span>
            </div>

            <div className="asset-details-row asset-details-name-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Name</span>
                <span className="asset-info-value">{selectedAsset.Name || "Generator"}</span>
              </div>
              <span className={currentStatus.className}>{currentStatus.label}</span>
            </div>

            <div className="asset-details-row asset-details-desc-row">
              <span className="asset-info-label">Dispatch purpose</span>
              <span className="asset-info-value">{selectedAsset.Description || selectedAsset.Purpose || "Generic generator description"}</span>
            </div>

            <div className="asset-details-grid-two-col">
              <div className="asset-info-item">
                <span className="asset-info-label">Dispatch type</span>
                <span className="asset-info-value">{dispatchMeta(selectedAsset).label === "Out" ? "Outbound" : dispatchMeta(selectedAsset).label}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Assignee</span>
                <span className="asset-info-value">{selectedAsset.AssigneeName || "S kumar"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Out from</span>
                <span className="asset-info-value">{selectedAsset.OutFrom || selectedAsset.Location || "Building A"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Sent to</span>
                <span className="asset-info-value">{selectedAsset.SentTo || "Building B"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Manufacturer</span>
                <span className="asset-info-value">{selectedAsset.Manufacturer || "Generic"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Model</span>
                <span className="asset-info-value">{selectedAsset.AssetModel || selectedAsset.Model || "Generic model"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Expiry date</span>
                <span className="asset-info-value">{formatDate(selectedAsset.TentativeReturnDate || selectedAsset.ExpiryDate || selectedAsset.ReturnDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Location</span>
                <span className="asset-info-value">{selectedAsset.Location || selectedAsset.OutFrom || "Building A"}</span>
              </div>
            </div>

            <div className="asset-details-row asset-details-location-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Location</span>
                <span className="asset-info-value">{selectedAsset.Location || selectedAsset.OutFrom || "Building A"}</span>
              </div>
            </div>

            <div className="asset-details-docs-section">
              <div className="asset-qr-preview-box">
                <div className="asset-qr-wrapper">
                  <i className="fa fa-qrcode" />
                </div>
              </div>
              <div className="asset-doc-links-stack">
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-picture-o" />
                  </div>
                  <span className="asset-doc-link-text disabled">Asset photo</span>
                </div>
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-history" />
                  </div>
                  <button type="button" className="asset-doc-link-text transfer-history-link" onClick={() => openHistory(selectedAsset)}>
                    View asset history
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary asset-btn-footer-edit" onClick={() => handleEditClick(selectedAsset, "assets")}>
            Edit
          </button>
          <button type="button" className="btn btn-outline-light asset-btn-footer-close" onClick={() => setSelectedAssetId(null)}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderSpareDetailsPanel = () => {
    if (!selectedSpare) return null;
    const currentStatus = statusMeta(selectedSpare.Status);
    return (
      <div className="asset-side-panel asset-details-view-panel transfer-side-panel">
        <div className="asset-side-panel-header">
          <h4 className="asset-side-panel-title">Spare Details</h4>
        </div>
        <div className="asset-side-panel-body">
          <div className="asset-details-new-layout">
            <div className="asset-details-header-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value">{selectedSpare.SpareID || "AST-111"}</span>
            </div>
            <div className="asset-details-name-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Name</span>
                <span className="asset-info-value">{selectedSpare.SpareType || "Spare part"}</span>
              </div>
              <span className={currentStatus.className}>{currentStatus.label}</span>
            </div>
            <div className="asset-details-desc-row">
              <span className="asset-info-label">Description</span>
              <span className="asset-info-value">{selectedSpare.Remarks || selectedSpare.Description || "Generic spare description"}</span>
            </div>
            <div className="asset-info-grid">
              <div className="asset-info-item">
                <span className="asset-info-label">Serial number</span>
                <span className="asset-info-value">{selectedSpare.SerialNumber || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Asset</span>
                <span className="asset-info-value">{selectedSpare.AssetName || selectedSpare.AssetID || "Related asset"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Manufacturer</span>
                <span className="asset-info-value">{selectedSpare.Manufacturer || "Generic"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Model</span>
                <span className="asset-info-value">{selectedSpare.Model || "Generic model"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Vendor</span>
                <span className="asset-info-value">{selectedSpare.VendorName || "Generic vendor"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Value</span>
                <span className="asset-info-value">{selectedSpare.Rating || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Purchase date</span>
                <span className="asset-info-value">{formatDate(selectedSpare.PurchaseDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Expiry date</span>
                <span className="asset-info-value">{formatDate(selectedSpare.ExpiryDate)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary asset-btn-footer-edit" onClick={() => handleEditClick(selectedSpare, "spares")}>
            Edit
          </button>
          <button type="button" className="btn btn-outline-light asset-btn-footer-close" onClick={() => setSelectedSpareId(null)}>
            Close
          </button>
        </div>
      </div>
    );
  };
  const renderAssetEditPanel = () => (
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
        <div className="asset-form-id-row-simple">
          <span className="asset-info-label">ID</span>
          <span className="asset-info-value">{assetEditForm.Id || "AST-111"}</span>
        </div>
        <div className="asset-form-simple-stack">
          <div className="form-group asset-form-group-custom">
            <label>Name</label>
            <input className="form-control" value={assetEditForm.Name} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Name: e.target.value }))} />
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Status</label>
            <select className="form-control" value={assetEditForm.Status} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Status: e.target.value }))}>
              <option value="Running">Running</option>
              <option value="Inactive">Inactive</option>
              <option value="Servicing">Servicing</option>
            </select>
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Dispatch purpose</label>
            <textarea rows="4" className="form-control" value={assetEditForm.Description} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Description: e.target.value }))} />
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Dispatch type</label>
              <select className="form-control" value={assetEditForm.DispatchType} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, DispatchType: e.target.value }))}>
                <option value="Out">Outbound</option>
                <option value="In">In</option>
                <option value="Open">Open</option>
              </select>
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Assignee</label>
              <input className="form-control" value={assetEditForm.AssigneeName} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, AssigneeName: e.target.value }))} />
            </div>
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Out from</label>
              <input className="form-control" value={assetEditForm.OutFrom} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, OutFrom: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Sent to</label>
              <input className="form-control" value={assetEditForm.SentTo} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, SentTo: e.target.value }))} />
            </div>
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Manufacturer</label>
              <input className="form-control" value={assetEditForm.Manufacturer} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Manufacturer: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Model</label>
              <input className="form-control" value={assetEditForm.Model} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Model: e.target.value }))} />
            </div>
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Expiry date</label>
              <CustomDatePicker value={assetEditForm.ExpiryDate} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, ExpiryDate: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Location</label>
              <input className="form-control" value={assetEditForm.Location} onChange={(e) => setAssetEditForm((prev) => ({ ...prev, Location: e.target.value }))} />
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

  const renderSpareEditPanel = () => (
    <div className="asset-side-panel asset-side-panel-form asset-side-panel-form-edit">
      <div className="asset-side-panel-header asset-form-new-header">
        <div className="asset-panel-title-wrap">
          <span className="asset-form-icon-circle">
            <i className="fa fa-pencil-square-o" aria-hidden="true" />
          </span>
          <h4 className="asset-side-panel-title">Edit spare part details</h4>
        </div>
      </div>
      <div className="asset-side-panel-body">
        <div className="asset-form-id-row-simple">
          <span className="asset-info-label">ID</span>
          <span className="asset-info-value">{spareEditForm.SpareID || "AST-111"}</span>
        </div>
        <div className="asset-form-simple-stack">
          <div className="form-group asset-form-group-custom">
            <label>Name</label>
            <input className="form-control" value={spareEditForm.SpareType} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, SpareType: e.target.value }))} />
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Status</label>
            <select className="form-control" value={spareEditForm.Status} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, Status: e.target.value }))}>
              <option value="Running">Running</option>
              <option value="Inactive">Inactive</option>
              <option value="Servicing">Servicing</option>
            </select>
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Description</label>
            <textarea rows="4" className="form-control" value={spareEditForm.Description} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, Description: e.target.value }))} />
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Serial number</label>
            <input className="form-control" value={spareEditForm.SerialNumber} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, SerialNumber: e.target.value }))} />
          </div>
          <div className="form-group asset-form-group-custom">
            <label>Asset</label>
            <input className="form-control" value={spareEditForm.AssetName} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, AssetName: e.target.value }))} />
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Manufacturer</label>
              <input className="form-control" value={spareEditForm.Manufacturer} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, Manufacturer: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Model</label>
              <input className="form-control" value={spareEditForm.Model} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, Model: e.target.value }))} />
            </div>
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Vendor</label>
              <input className="form-control" value={spareEditForm.VendorName} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, VendorName: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Value</label>
              <input className="form-control" value={spareEditForm.Rating} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, Rating: e.target.value }))} />
            </div>
          </div>
          <div className="asset-form-row-two-col">
            <div className="form-group asset-form-group-custom">
              <label>Purchase date</label>
              <CustomDatePicker value={spareEditForm.PurchaseDate} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, PurchaseDate: e.target.value }))} />
            </div>
            <div className="form-group asset-form-group-custom">
              <label>Expiry date</label>
              <CustomDatePicker value={spareEditForm.ExpiryDate} onChange={(e) => setSpareEditForm((prev) => ({ ...prev, ExpiryDate: e.target.value }))} />
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

  const exportData = activeTab === "assets"
    ? filteredAssets.map((row) => ({
        Id: row.Id,
        Name: row.Name,
        Location: row.Location || row.OutFrom,
        Dispatch: dispatchMeta(row).label,
        ExpiryDate: formatDate(row.TentativeReturnDate || row.ExpiryDate || row.ReturnDate),
        Status: statusMeta(row.Status).label,
      }))
    : filteredSpares.map((row) => ({
        SpareID: row.SpareID,
        Name: row.SpareType,
        Asset: row.AssetName,
        Location: row.Location,
        ExpiryDate: formatDate(row.ExpiryDate),
        Status: statusMeta(row.Status).label,
      }));

  return (
    <div className="content-wrapper">
      <section className="content mt-3">
        <div className="container-fluid">
          <div className="rental-assets-page transfer-page">
            <div className="rental-assets-breadcrumb" onClick={() => window.history.back()} role="button" tabIndex={0}>
              <i className="fa fa-angle-left" aria-hidden="true" />
              <span>Asset transfer</span>
            </div>

            <div className={`rental-assets-card ${activeSelection ? "with-side-panel" : ""}`.trim()}>
              <div className="rental-assets-main-card">
                <div className="asset-master-toolbar">
                  <div className="asset-master-search" onClick={() => searchInputRef.current?.focus()}>
                    <i className="fa fa-search" aria-hidden="true" />
                    <input ref={searchInputRef} type="text" placeholder="Search by name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="asset-master-toolbar-actions">
                    <button type="button" className={`btn asset-toolbar-filter ${showFilterPanel ? "active" : ""}`.trim()} onClick={() => setShowFilterPanel((prev) => !prev)}>
                      <i className="fa fa-sliders" aria-hidden="true" />
                      Filter
                    </button>
                    <ExportToCSV data={exportData} fileName={activeTab === "assets" ? "AssetTransfer.csv" : "SpareTransfer.csv"} />
                    <button
                      type="button"
                      className="btn asset-toolbar-add transfer-toolbar-checkin"
                      onClick={() => openActionModal("checkin", activeSelectedRow || activeRows[0], activeTab)}
                      disabled={!activeSelectedRow && activeRows.length === 0}
                    >
                      <i className="fa fa-sign-in" aria-hidden="true" />
                      Check in
                    </button>
                    <button
                      type="button"
                      className="btn asset-toolbar-add"
                      onClick={() => openActionModal("checkout", activeSelectedRow || activeRows[0], activeTab)}
                      disabled={!activeSelectedRow && activeRows.length === 0}
                    >
                      <i className="fa fa-sign-out" aria-hidden="true" />
                      Check out
                    </button>
                  </div>
                </div>

                {renderFilterPanel()}

                <LoadingOverlay active={loading} spinner={<PropagateLoader color="#336B93" size={12} />}>
                  {activeTab === "assets" ? (
                    <div className={`asset-master-table-wrap asset-master-table-wrap-owned ${selectedAssetId ? "has-selection" : ""}`.trim()}>
                      <div className={`table-responsive ${selectedAssetId ? "has-selection" : ""}`.trim()}>
                        <table className="table custTable mb-0 transfer-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Location</th>
                              <th>Dispatch</th>
                              <th>Expiry date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAssets.map((row) => {
                              const currentStatus = statusMeta(row.Status);
                              const currentDispatch = dispatchMeta(row);
                              const isSelected = Number(row.Id) === Number(selectedAssetId);
                              return (
                                <tr key={row.Id} className={isSelected ? "grid-selected-row" : ""} onClick={() => handleAssetRowClick(row)}>
                                  <td>{row.Id || "AST-111"}</td>
                                  <td>{row.Name || "Generator"}</td>
                                  <td>{row.Location || row.OutFrom || "Building A"}</td>
                                  <td><span className={currentDispatch.className}>{currentDispatch.label}</span></td>
                                  <td>{formatDate(row.TentativeReturnDate || row.ExpiryDate || row.ReturnDate)}</td>
                                  <td><span className={currentStatus.className}>{currentStatus.label}</span></td>
                                </tr>
                              );
                            })}
                            {filteredAssets.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="asset-master-empty">No assets found.</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={`asset-master-table-wrap asset-master-table-wrap-spare ${selectedSpareId ? "has-selection" : ""}`.trim()}>
                      <div className={`table-responsive ${selectedSpareId ? "has-selection" : ""}`.trim()}>
                        <table className="table custTable mb-0 transfer-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Asset</th>
                              <th>Location</th>
                              <th>Expiry date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSpares.map((row) => {
                              const currentStatus = statusMeta(row.Status);
                              const isSelected = Number(row.SpareID) === Number(selectedSpareId);
                              return (
                                <tr key={row.SpareID} className={isSelected ? "grid-selected-row" : ""} onClick={() => handleSpareRowClick(row)}>
                                  <td>{row.SpareID || "AST-111"}</td>
                                  <td>{row.SpareType || "Spare part"}</td>
                                  <td>{row.AssetName || row.AssetID || "Related asset"}</td>
                                  <td>{row.Location || "Building A"}</td>
                                  <td>{formatDate(row.ExpiryDate)}</td>
                                  <td><span className={currentStatus.className}>{currentStatus.label}</span></td>
                                </tr>
                              );
                            })}
                            {filteredSpares.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="asset-master-empty">No spare parts found.</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </LoadingOverlay>
              </div>

              {activeSelectedRow ? (panelMode === "edit" ? (activeTab === "assets" ? renderAssetEditPanel() : renderSpareEditPanel()) : activeTab === "assets" ? renderAssetDetailsPanel() : renderSpareDetailsPanel()) : null}
            </div>

            {showActionModal && currentActionRow ? (
              <PopUp
                show={showActionModal}
                handleClose={() => {
                  setShowActionModal(false);
                  setCurrentActionRow(null);
                }}
                asset={buildActionAsset(currentActionRow, actionTab)}
                actionType={actionType}
                handleSubmit={handleActionSubmit}
                initialType={actionTab === "assets" ? "asset" : "spare"}
                hideTypeSwitch
              />
            ) : null}

            {showDeleteModal && deleteTarget ? (
              <div className="spare-add-backdrop" onClick={() => setShowDeleteModal(false)}>
                <div className="asset-master-main-card asset-delete-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header transfer-dialog-header">
                    <div className="spare-add-title">
                      <span className="spare-add-icon transfer-danger-icon">
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Delete item
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowDeleteModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">
                    Are you sure you want to delete this {deleteTarget.tab === "assets" ? "asset" : "spare"}?
                  </div>
                  <div className="asset-dialog-actions asset-dialog-actions-right">
                    <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {showSuccessModal ? (
              <div className="spare-add-backdrop" onClick={() => setShowSuccessModal(false)}>
                <div className="asset-master-main-card asset-success-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="asset-side-panel-header transfer-dialog-header">
                    <div className="spare-add-title">
                      <span className="spare-add-icon transfer-success-icon">
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
                <div className="asset-master-main-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
                  <div className="asset-side-panel-header transfer-dialog-header">
                    <div className="spare-add-title">
                      <span className="spare-add-icon transfer-danger-icon">
                        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                      </span>
                      Cancel edits
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowCancelConfirm(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">Are you sure you want to cancel? All your entered information will be lost.</div>
                  <div className="asset-dialog-actions">
                    <button type="button" className="btn btn-light" onClick={() => setShowCancelConfirm(false)}>
                      No, keep editing
                    </button>
                    <button type="button" className="btn btn-danger" onClick={confirmCancelEdit}>
                      Yes, cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {showHistoryModal ? (
              <div className="rental-history-overlay" onClick={() => setShowHistoryModal(false)}>
                <div className="rental-history-card transfer-history-card" onClick={(e) => e.stopPropagation()}>
                  <div className="rental-history-header">
                    <div className="rental-history-title-wrap">
                      <span className="rental-history-icon transfer-history-icon">
                        <i className="fa fa-history" aria-hidden="true" />
                      </span>
                      <div>
                        <h4 className="rental-history-title">{historyTitle}</h4>
                        <div className="rental-history-subtitle">Asset check-in / check-out history</div>
                      </div>
                    </div>
                    <button type="button" className="rental-history-close" onClick={() => setShowHistoryModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="rental-history-body">
                    {historyLoading ? (
                      <div className="rental-history-empty">Loading history...</div>
                    ) : historyData.length === 0 ? (
                      <div className="rental-history-empty">No history found.</div>
                    ) : (
                      historyData.flatMap((item, index) =>
                        getHistorySections(item).map((section) => {
                          const sectionKey = `${index}-${section.key}`;
                          const isExpanded = expandedHistoryKeys.includes(sectionKey);
                          const timeParts = formatDateTimeParts(
                            section.type === "checkout"
                              ? section.data?.CheckOutDateTime || section.data?.CreatedOn || section.data?.TentativeReturnDate
                              : section.data?.ReturnDate || section.data?.CheckInDateTime || section.data?.CreatedOn
                          );
                          const actor =
                            section.type === "checkout"
                              ? section.data?.AssigneeName || section.data?.ApprovedBy || section.data?.CreatedBy
                              : section.data?.ReturnedBy || section.data?.ApprovedBy || section.data?.CreatedBy;

                          return (
                            <div key={sectionKey} className="transfer-history-section">
                              <button
                                type="button"
                                className="transfer-history-section-head"
                                onClick={() =>
                                  setExpandedHistoryKeys((prev) =>
                                    prev.includes(sectionKey) ? prev.filter((itemKey) => itemKey !== sectionKey) : [...prev, sectionKey]
                                  )
                                }
                              >
                                <span className="transfer-history-section-dot" />
                                <div className="transfer-history-section-datetime">
                                  <strong>{timeParts.date}</strong>
                                  <span>{timeParts.time}</span>
                                </div>
                                <span className={`transfer-history-status-pill ${section.type === "checkout" ? "checkout" : "checkin"}`}>
                                  {section.type === "checkout" ? "Checked out" : "Checked in"}
                                </span>
                                <div className="transfer-history-section-copy">
                                  <strong>{section.title}</strong>
                                  <span>{actor ? `By ${actor}` : "-"}</span>
                                </div>
                                <span className={`transfer-history-chevron fa ${isExpanded ? "fa-angle-up" : "fa-angle-down"}`} aria-hidden="true" />
                              </button>
                              {isExpanded ? renderHistoryDetails(section.data) : null}
                            </div>
                          );
                        })
                      )
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

export default connect(mapStateToProps)(CheckInCheckOut);
