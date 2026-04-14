import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import ExportToCSV from "../ReactComponents/ExportToCSV/ExportToCSV";
import RentalPopUp from "../ReactComponents/RentalModal/RentalPopUp";
import { getAssetRentOutReturnHistoryByAssetId } from "../Services/RentalAssets";
import "./RentalAssets.css";

const recordsPerPage = 15;

const statusOptions = {
  running: { label: "Running", key: "running" },
  inactive: { label: "Inactive", key: "inactive" },
  servicing: { label: "Servicing", key: "servicing" },
};

const leaseOptions = {
  in: { label: "In", key: "in" },
  out: { label: "Out", key: "out" },
  open: { label: "Open", key: "open" },
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
  if (text.includes("T")) {
    const time = text.split("T")[1] || "";
    return time.slice(0, 5);
  }
  return text.slice(0, 5);
};

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
  if (raw === "in") return leaseOptions.in;
  if (raw === "out") return leaseOptions.out;
  if (raw === "open") return leaseOptions.open;
  if (asset.ReturnDate === null && asset.RentedOutDate) return leaseOptions.out;
  if (asset.ReturnDate) return leaseOptions.in;
  return leaseOptions.open;
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
});

const RentalAssets = ({ propId, history }) => {
  const [rentalAssets, setRentalAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [panelMode, setPanelMode] = useState("details");
  const [editForm, setEditForm] = useState(buildEditForm());
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("rentout");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);

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
      if (!query) return true;
      return [asset.Id, asset.Name, asset.Manufacturer, asset.Description, asset.Location]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(query));
    });
  }, [rentalAssets, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / recordsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  const currentRecords = useMemo(() => {
    const start = (safePage - 1) * recordsPerPage;
    return filteredAssets.slice(start, start + recordsPerPage);
  }, [filteredAssets, safePage]);

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
            }
          : item
      )
    );
    setPanelMode("details");
  };

  const handleActionSubmit = async (formData) => {
    if (!selectedAsset) return;
    const url = actionType === "return" ? "https://api.urest.in:8096/ManageRentInAsset" : "https://api.urest.in:8096/ManageRentOutAsset";

    await fetch(url, {
      method: actionType === "return" ? "PUT" : "POST",
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

  const renderDetailsPanel = () => {
    if (!selectedAsset) return null;
    const statusMeta = getStatusMeta(selectedAsset);

    return (
      <div className="rental-panel-card">
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
            <button type="button" className="rental-text-link rental-panel-link-row">
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
    <div className="rental-panel-card">
      <div className="rental-panel-header rental-edit-panel-header">
        <div className="rental-edit-title">
          <span className="rental-edit-icon">
            <i className="fa fa-pencil-square-o" aria-hidden="true" />
          </span>
          <h4 className="rental-panel-title">Edit asset details</h4>
        </div>
      </div>

      <div className="rental-panel-body rental-edit-panel-body">
        <div className="rental-form-grid">
          <div className="form-group rental-form-full rental-readonly-row">
            <label>ID</label>
            <div className="rental-readonly-value">{editForm.Id || "AST-111"}</div>
          </div>
          <div className="form-group rental-form-full">
            <label>Name</label>
            <input className="form-control" value={editForm.Name} onChange={(e) => setEditForm({ ...editForm, Name: e.target.value })} />
          </div>
          <div className="form-group rental-form-full">
            <label>Status</label>
            <select className="form-control" value={editForm.Status} onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}>
              <option value="Running">Running</option>
              <option value="Inactive">Inactive</option>
              <option value="Servicing">Servicing</option>
            </select>
          </div>
          <div className="form-group rental-form-full">
            <label>Description</label>
            <textarea className="form-control" rows="4" value={editForm.Description} onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Vendor</label>
            <input className="form-control" value={editForm.Vendor} onChange={(e) => setEditForm({ ...editForm, Vendor: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Lease type</label>
            <select className="form-control" value={editForm.LeaseType} onChange={(e) => setEditForm({ ...editForm, LeaseType: e.target.value })}>
              <option value="Outbound">Outbound</option>
              <option value="Inbound">Inbound</option>
              <option value="Open">Open</option>
            </select>
          </div>
          <div className="form-group">
            <label>Manufacturer</label>
            <input className="form-control" value={editForm.Manufacturer} onChange={(e) => setEditForm({ ...editForm, Manufacturer: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input className="form-control" value={editForm.Model} onChange={(e) => setEditForm({ ...editForm, Model: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Cost</label>
            <input className="form-control" value={editForm.Cost} onChange={(e) => setEditForm({ ...editForm, Cost: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Security deposit</label>
            <input className="form-control" value={editForm.SecurityDeposit} onChange={(e) => setEditForm({ ...editForm, SecurityDeposit: e.target.value })} />
          </div>
          <div className="form-group rental-form-full">
            <label>Expiry date</label>
            <input type="date" className="form-control" value={editForm.ExpiryDate} onChange={(e) => setEditForm({ ...editForm, ExpiryDate: e.target.value })} />
          </div>
          <div className="form-group rental-form-full">
            <label>Location</label>
            <input className="form-control" value={editForm.Location} onChange={(e) => setEditForm({ ...editForm, Location: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="rental-panel-footer">
        <button type="button" className="btn rental-primary-btn" onClick={handleSaveEdit}>
          Save changes
        </button>
        <button type="button" className="btn rental-secondary-btn" onClick={() => setPanelMode("details")}>
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
                    <button type="button" className="btn rental-secondary-btn">
                      <i className="fa fa-sliders mr-1" aria-hidden="true" />
                      Filter
                    </button>
                    {/* <ExportToCSV data={filteredAssets} fileName="RentalAssets.csv" /> */}
                    <button
                      type="button"
                      className="btn rental-primary-btn"
                      onClick={() => handleOpenRentModal(selectedAsset || filteredAssets[0] || {}, "rentout")}
                      disabled={!selectedAsset && filteredAssets.length === 0}
                    >
                      <i className="fa fa-sign-out mr-1" aria-hidden="true" />
                      Rent asset
                    </button>
                  </div>
                </div>

                <LoadingOverlay active={loading} spinner={<PropagateLoader color="#336B93" size={16} />}>
                  <div className="rental-assets-table-wrap">
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
                        {currentRecords.map((asset) => {
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
                                  <button type="button" className="rental-icon-btn" title="Delete">
                                    <i className="fa fa-trash-o" aria-hidden="true" />
                                  </button>
                                  <button type="button" className="rental-icon-btn" title={isReturnFlow ? "Rent in" : "Rent out"} onClick={() => handleOpenRentModal(asset, isReturnFlow ? "return" : "rentout")}>
                                    <i className={`fa ${isReturnFlow ? "fa-sign-in" : "fa-sign-out"}`} aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rental-assets-pagination">
                    <span>
                      Showing {currentRecords.length} out of {filteredAssets.length} entries
                    </span>
                    <div className="rental-pagination-controls">
                      <button type="button" className="rental-page-btn" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                        <i className="fa fa-angle-left" aria-hidden="true" />
                      </button>
                      <span className="rental-page-number">{safePage}</span>
                      <button type="button" className="rental-page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                        <i className="fa fa-angle-right" aria-hidden="true" />
                      </button>
                    </div>
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

            {showHistoryModal ? (
              <div className="rental-history-overlay" onClick={() => setShowHistoryModal(false)}>
                <div className="rental-history-card" onClick={(e) => e.stopPropagation()}>
                  <div className="rental-history-header">
                    <div className="rental-history-title-wrap">
                      <span className="rental-history-icon">
                        <i className="fa fa-history" aria-hidden="true" />
                      </span>
                      <div>
                        <h4>Rented asset - {historyAsset?.Name || "Generator"}</h4>
                        <span>({historyAsset?.Id || "AST-111"})</span>
                      </div>
                    </div>
                    <button type="button" className="rental-history-close" onClick={() => setShowHistoryModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rental-history-body">
                    {historyLoading ? (
                      <div className="rental-history-empty">Loading history...</div>
                    ) : Array.isArray(historyAsset?.history) && historyAsset.history.length > 0 ? (
                      historyAsset.history.map((item, index) => {
                        const isRentOut = !!item?.RentOut;
                        const statusLabel = isRentOut ? "Rented Out" : "Returned";
                        const statusKey = isRentOut ? "out" : "returned";
                        const dateValue = isRentOut ? item?.RentOut?.RentedOutDate : item?.Return?.ReturnDate;
                        const nameValue = isRentOut ? item?.RentOut?.AssigneeName : item?.Return?.ReturnedBy;
                        const summary = isRentOut ? "Asset rented out to customer" : "Asset returned by customer";

                        return (
                          <div key={index} className="rental-history-item">
                            <span className="rental-history-dot" />
                            <div className="rental-history-date">
                              <strong>{formatDate(dateValue)}</strong>
                              <span>{formatTime(dateValue)}</span>
                            </div>
                            <span className={`rental-history-badge rental-history-${statusKey}`}>{statusLabel}</span>
                            <div className="rental-history-copy">
                              <strong>{summary}</strong>
                              <span>By {nameValue || "S Kumar"}</span>
                            </div>
                            <i className="fa fa-angle-down" aria-hidden="true" />
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
