import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import departmentActions from "../../redux/department/action.js";
import DataGrid from "../../ReactComponents/DataGrid/DataGrid.jsx";
import Button from "../../ReactComponents/Button/Button";
import ApiProvider from "./DataProvider.js";
import * as appCommon from "../../Common/AppCommon.js";
import { DELETE_CONFIRMATION_MSG } from "../../Contants/Common";
import { CreateValidator, ValidateControls } from "./Validation.js";
import DocumentUploader from "../../ReactComponents/FileUploader/DocumentUploader.jsx";
import ExportToCSV from "../../ReactComponents/ExportToCSV/ExportToCSV.js";
import "../Calendar/Tasks/taskList/components/TaskListView.css";
import "./AssetsMaster.css";
import { withRouter } from "react-router-dom";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(","));
    reader.onerror = (error) => reject(error);
  });

const RadioButtonGroup = ({ options, name, selectedValue, onChange }) => (
  <div className="asset-radio-group">
    {options.map((opt) => (
      <label key={opt.value} className="asset-radio-option">
        <input type="radio" name={name} value={opt.value} checked={selectedValue === opt.value} onChange={onChange} />
        <span>{opt.label}</span>
      </label>
    ))}
  </div>
);

class AssetsMaster extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      GridData: [],
      DueGridData: [],
      gridHeader: [
        { sTitle: "ID", titleValue: "Id", orderable: false },
        { sTitle: "Name", titleValue: "Name", orderable: false },
        { sTitle: "Location", titleValue: "Location", orderable: false },
        { sTitle: "Service due", titleValue: "NextServiceDateDisplay", orderable: false },
        { sTitle: "Status", titleValue: "StatusDisplay", orderable: false },
        { sTitle: "Actions", titleValue: "Action", Action: "Edit&View&Delete", Index: "0", orderable: false },
      ],
      PageMode: "Home",
      Id: 0,
      AssetType: "",
      ManufacturerName: "",
      AssetModel: "",
      IsMoveable: false,
      Name: "",
      Description: "",
      QRCode: "",
      ImageData: null,
      AssetImage: "",
      ImageExt: "",
      showImagefiletype: null,
      showImagefile: null,
      extension: null,
      LastServiceDate: "",
      NextServiceDate: "",
      IsRentable: false,
      AssetValue: 0,
      Capacity: "",
      AMCdoc: null,
      AMCimage: "",
      status: false,
      category: "",
      location: "",
      serviceReminderDay: "",
      searchTerm: "",
      showFilterPanel: false,
      filterAssetType: "",
      filterStatus: "",
      filterMoveable: "",
      filterRentable: "",
      filterDueFrom: "",
      filterDueTo: "",
      filterCategory: "",
      filterLocation: "",
      filterCapacity: "",
      selectedRowId: null,
      showCancelConfirm: false,
      cancelConfirmType: "",
      showDeleteModal: false,
      deleteTarget: null,
      showSuccessModal: false,
      successType: "",
    };
    this.ApiProviderr = new ApiProvider();
  }

  componentDidMount() {
    this.loadHomagePageData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.PropertyId !== this.props.PropertyId) {
      this.loadHomagePageData();
    }
  }

  normalizeDate = (value) => {
    if (!value) return "";
    const raw = String(value);
    return raw.length >= 10 ? raw.substring(0, 10) : raw;
  };

  normalizeBoolean = (value) => {
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return "";
  };

  getBoolLabel = (value) => {
    const boolVal = this.normalizeBoolean(value);
    if (boolVal === "") return "-";
    return boolVal ? "Yes" : "No";
  };

  formatDisplayDate = (value) => {
    const normalized = this.normalizeDate(value);
    if (!normalized) return "-";
    const [year, month, day] = normalized.split("-");
    return year && month && day ? `${day}-${month}-${year}` : normalized;
  };

  getPreviewSrc = (fileData, ext = "png") => {
    if (!fileData) return "";
    const raw = String(fileData);
    if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }
    const normalizedExt = String(ext || "png").toLowerCase();
    const mimeType = normalizedExt === "pdf" ? "application/pdf" : `image/${normalizedExt === "jpg" ? "jpeg" : normalizedExt}`;
    return `data:${mimeType};base64,${raw}`;
  };

  getAssetStatusMeta = (item = {}) => {
    const rawStatus = item?.Status;
    if (typeof rawStatus === "string" && rawStatus && rawStatus !== "true" && rawStatus !== "false") {
      return { label: rawStatus, key: rawStatus.toLowerCase().replace(/\s+/g, "-") };
    }
    const boolStatus = this.normalizeBoolean(rawStatus);
    const today = new Date().toISOString().slice(0, 10);
    const nextServiceDate = this.normalizeDate(item?.NextServiceDate);
    if (boolStatus === false) return { label: "Inactive", key: "inactive" };
    if (nextServiceDate && nextServiceDate <= today) return { label: "Servicing", key: "servicing" };
    return { label: "Running", key: "running" };
  };

  getModel = (type, overrides = {}) => [
    {
      Id: this.state.Id,
      Name: this.state.Name,
      Description: this.state.Description,
      QRCode: this.state.QRCode,
      AssetType: this.state.AssetType,
      Manufacturer: this.state.ManufacturerName,
      AssetModel: this.state.AssetModel,
      IsMoveable: this.state.IsMoveable,
      Flag: type,
      AssetImage: this.state.AssetImage,
      LastServiceDate: this.state.LastServiceDate,
      NextServiceDate: this.state.NextServiceDate,
      IsRentable: this.state.IsRentable,
      AssetValue: this.state.AssetValue,
      Capacity: this.state.Capacity,
      capacity: this.state.Capacity,
      AMCdoc: this.state.AMCimage,
      status: this.state.status,
      category: this.state.category,
      location: this.state.location,
      serviceReminderDay: this.state.serviceReminderDay,
      propertyId: this.props.PropertyId,
      ...overrides,
    },
  ];

  loadHomagePageData = () => {
    this.setState({ isLoading: true });
    this.ApiProviderr.manageDocumentTypeMaster(this.getModel(), "R")
      .then((resp) => {
        if (!resp.ok || resp.status !== 200) return null;
        return resp.json().then((rData) => {
          const dueServiceAssets = Array.isArray(rData?.PassedServiceDates) ? rData.PassedServiceDates : [];
          const upcomingServiceAssets = Array.isArray(rData?.UpcomingServiceDates) ? rData.UpcomingServiceDates : [];
          const merged = [...dueServiceAssets, ...upcomingServiceAssets].map((item) => {
            const nextServiceDate = this.normalizeDate(item?.NextServiceDate);
            const statusMeta = this.getAssetStatusMeta(item);
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = nextServiceDate && nextServiceDate < today;
            const displayDate = this.formatDisplayDate(nextServiceDate);

            return {
              ...item,
              LastServiceDate: this.normalizeDate(item?.LastServiceDate),
              NextServiceDate: nextServiceDate,
              NextServiceDateDisplay: isOverdue
                ? `<span style="color: #eb4b4b; font-weight: 700;">${displayDate}</span>`
                : displayDate,
              Location: item?.Location || item?.location || "Building-A",
              StatusDisplay: `<span class="asset-table-status asset-table-status-${statusMeta.key}">${statusMeta.label}</span>`,
            };
          });

          // Sort: Earliest service date first (Overdue at top)
          merged.sort((a, b) => {
            const dateA = a.NextServiceDate || "9999-12-31";
            const dateB = b.NextServiceDate || "9999-12-31";
            return dateA.localeCompare(dateB);
          });

          this.setState({ GridData: merged, DueGridData: dueServiceAssets, isLoading: false });
        });
      })
      .catch(() => this.setState({ isLoading: false }));
  };

  onPagechange = () => { };

  findItem = (id) => this.state.GridData.find((item) => String(item.Id) === String(id)) || null;

  Addnew = () => {
    this.setState(
      {
        PageMode: "Add",
        selectedRowId: null,
        Id: 0,
        AssetType: "",
        ManufacturerName: "",
        AssetModel: "",
        IsMoveable: false,
        Name: "",
        Description: "",
        QRCode: "",
        ImageData: null,
        AssetImage: "",
        ImageExt: "",
        LastServiceDate: "",
        NextServiceDate: "",
        IsRentable: false,
        AssetValue: 0,
        Capacity: "",
        AMCdoc: null,
        AMCimage: "",
        status: false,
        category: "",
        location: "",
        serviceReminderDay: "",
      },
      () => CreateValidator()
    );
  };

  setFormData = (rowData, mode) => {
    if (!rowData) return;
    this.setState({
      PageMode: mode,
      selectedRowId: rowData.Id,
      Id: rowData.Id,
      Name: rowData.Name || "",
      Description: rowData.Description || "",
      QRCode: rowData.QRCode || "",
      ManufacturerName: rowData.Manufacturer || "",
      AssetModel: rowData.AssetModel || "",
      IsMoveable: String(this.normalizeBoolean(rowData.IsMoveable)),
      LastServiceDate: this.normalizeDate(rowData.LastServiceDate),
      NextServiceDate: this.normalizeDate(rowData.NextServiceDate),
      IsRentable: String(this.normalizeBoolean(rowData.IsRentable)),
      AssetValue: rowData.AssetValue || 0,
      Capacity: rowData.Capacity ?? rowData.capacity ?? "",
      AssetType: rowData.AssetType || "",
      AssetImage: rowData.AssetImage || rowData.Image || "",
      AMCimage: rowData.AMCdoc || rowData.AMCimage || "",
      showImagefiletype: rowData.ImageExt || null,
      showImagefile: rowData.Image || null,
      extension: rowData.ImageExt || null,
      status: String(this.normalizeBoolean(rowData.Status)),
      category: rowData.Category || "",
      location: rowData.Location || "",
      serviceReminderDay: rowData.serviceReminderDay || "",
    });
  };

  ongridedit = (id) => {
    CreateValidator();
    this.setFormData(this.findItem(id), "Edit");
  };

  onGridView = (id) => this.setFormData(this.findItem(id), "View");
  onGridRowSelect = (id) => {
    if (this.state.PageMode === "View" && String(this.state.selectedRowId) === String(id)) {
      this.closeSidePanel();
      return;
    }
    this.setFormData(this.findItem(id), "View");
  };

  onGridDelete = (id) => {
    const rowData = this.findItem(id);
    if (!rowData) return;
    this.setState({ showDeleteModal: true, deleteTarget: rowData });
  };

  requestCancelConfirm = (type) => this.setState({ showCancelConfirm: true, cancelConfirmType: type || "" });
  closeCancelConfirm = () => this.setState({ showCancelConfirm: false, cancelConfirmType: "" });

  onFileChange = (event) => {
    const selected = event?.target?.files?.[0];
    if (!selected) return;
    const valid = ["jpg", "jpeg", "png", "pdf"];
    const extension = selected.name.substring(selected.name.lastIndexOf(".") + 1).toLowerCase();
    if (valid.includes(extension)) {
      this.setState({ ImageData: selected });
      return;
    }
    appCommon.showtextalert(`${selected.name} Invalid file type, Please select only ${valid.join(", ")}`, "", "error");
  };

  onAMCFileChange = (event) => {
    const selected = event?.target?.files?.[0];
    if (!selected) return;
    const valid = ["jpg", "jpeg", "png", "pdf"];
    const extension = selected.name.substring(selected.name.lastIndexOf(".") + 1).toLowerCase();
    if (valid.includes(extension)) {
      this.setState({ AMCdoc: selected });
      return;
    }
    appCommon.showtextalert(`${selected.name} Invalid file type, Please select only ${valid.join(", ")}`, "", "error");
  };

  handleSave = async () => {
    let assetImage = this.state.AssetImage;
    let imageExt = this.state.ImageExt;
    let amcImage = this.state.AMCimage;

    if (this.state.ImageData?.name && this.state.ImageData?.size) {
      const fileD = await toBase64(this.state.ImageData);
      assetImage = fileD[1];
      imageExt = this.state.ImageData.name.substring(this.state.ImageData.name.lastIndexOf(".") + 1);
    }
    if (this.state.AMCdoc?.name && this.state.AMCdoc?.size) {
      const fileD = await toBase64(this.state.AMCdoc);
      amcImage = fileD[1];
    }

    if (ValidateControls()) {
      const type = this.state.PageMode === "Add" ? "I" : "U";
      this.mangaeSave(this.getModel(type, { AssetImage: assetImage, ImageExt: imageExt, AMCdoc: amcImage }), type);
    }
  };

  mangaeSave = (model, type) => {
    this.ApiProviderr.manageDocumentTypeMaster(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          if (rData === 0) {
            appCommon.showtextalert("Assets Name Existed !", "", "error");
          } else {
            if (type === "D") {
              appCommon.showtextalert("Assets Deleted Successfully!", "", "success");
              this.setState({ showDeleteModal: false, deleteTarget: null }, this.handleCancel);
            } else {
              this.setState({ showSuccessModal: true, successType: type }, this.handleCancel);
            }
          }
        });
      }
      return null;
    });
  };

  handleCancel = () => {
    this.setState(
      {
        PageMode: "Home",
        selectedRowId: null,
        Id: 0,
        AssetType: "",
        ManufacturerName: "",
        AssetModel: "",
        IsMoveable: false,
        Name: "",
        Description: "",
        QRCode: "",
        ImageData: null,
        AssetImage: "",
        ImageExt: "",
        showImagefiletype: null,
        showImagefile: null,
        extension: null,
        LastServiceDate: "",
        NextServiceDate: "",
        IsRentable: false,
        AssetValue: 0,
        Capacity: "",
        AMCdoc: null,
        AMCimage: "",
        status: false,
        category: "",
        location: "",
        serviceReminderDay: "",
      },
      this.loadHomagePageData
    );
  };

  closeSidePanel = () => this.setState({ PageMode: "Home", selectedRowId: null });
  closeSuccessModal = () => this.setState({ showSuccessModal: false, successType: "" });

  resetFilters = () => {
    this.setState({
      searchTerm: "",
      filterAssetType: "",
      filterStatus: "",
      filterMoveable: "",
      filterRentable: "",
      filterDueFrom: "",
      filterDueTo: "",
      filterCategory: "",
      filterLocation: "",
      filterCapacity: "",
    });
  };

  getFilteredGridData = () =>
    (this.state.GridData || []).filter((item) => {
      const search = String(this.state.searchTerm || "").toLowerCase().trim();
      const rowId = String(item?.Id || "").toLowerCase();
      const rowName = String(item?.Name || "").toLowerCase();
      const rowDescription = String(item?.Description || "").toLowerCase();
      const rowQr = String(item?.QRCode || "").toLowerCase();
      const rowType = String(item?.AssetType || "");
      const rowCategory = String(item?.Category || "").toLowerCase();
      const rowLocation = String(item?.Location || "").toLowerCase();
      const rowCapacity = String(item?.Capacity ?? item?.capacity ?? "").toLowerCase();
      const rowNextServiceDate = this.normalizeDate(item?.NextServiceDate);

      return (
        (!search || rowId.includes(search) || rowName.includes(search) || rowDescription.includes(search) || rowQr.includes(search)) &&
        (!this.state.filterAssetType || rowType === this.state.filterAssetType) &&
        (this.state.filterStatus === "" || this.normalizeBoolean(item?.Status) === this.normalizeBoolean(this.state.filterStatus)) &&
        (this.state.filterMoveable === "" || this.normalizeBoolean(item?.IsMoveable) === this.normalizeBoolean(this.state.filterMoveable)) &&
        (this.state.filterRentable === "" || this.normalizeBoolean(item?.IsRentable) === this.normalizeBoolean(this.state.filterRentable)) &&
        (!this.state.filterCategory || rowCategory.includes(String(this.state.filterCategory).toLowerCase().trim())) &&
        (!this.state.filterLocation || rowLocation.includes(String(this.state.filterLocation).toLowerCase().trim())) &&
        (!this.state.filterCapacity || rowCapacity.includes(String(this.state.filterCapacity).toLowerCase().trim())) &&
        (!this.state.filterDueFrom || !rowNextServiceDate || rowNextServiceDate >= this.state.filterDueFrom) &&
        (!this.state.filterDueTo || !rowNextServiceDate || rowNextServiceDate <= this.state.filterDueTo)
      );
    });

  getExportData = (rows) =>
    (rows || []).map((item) => ({
      Id: item.Id,
      Name: item.Name,
      Description: item.Description,
      QRCode: item.QRCode,
      AssetType: item.AssetType,
      Manufacturer: item.Manufacturer,
      AssetModel: item.AssetModel,
      IsMoveable: this.getBoolLabel(item.IsMoveable),
      LastServiceDate: this.normalizeDate(item.LastServiceDate),
      NextServiceDate: this.normalizeDate(item.NextServiceDate),
      IsRentable: this.getBoolLabel(item.IsRentable),
      AssetValue: item.AssetValue,
      Capacity: item.Capacity ?? item.capacity,
      Status: this.getAssetStatusMeta(item).label,
      Category: item.Category,
      Location: item.Location,
      ServiceReminderDay: item.serviceReminderDay,
    }));

  getSelectedAssetRecord = () => (this.state.selectedRowId ? this.findItem(this.state.selectedRowId) : null);

  renderReadOnlyField = (label, value, extraClass = "") => (
    <div className={`asset-info-item ${extraClass}`.trim()}>
      <span className="asset-info-label">{label}</span>
      <span className="asset-info-value">{value || "-"}</span>
    </div>
  );

  renderAssetDetailsPanel = () => {
    const asset = this.getSelectedAssetRecord();
    if (!asset) return null;
    const statusMeta = this.getAssetStatusMeta(asset);
    const imageSource = this.getPreviewSrc(
      this.state.AssetImage || asset.AssetImage || this.state.showImagefile || asset.Image,
      this.state.showImagefiletype || this.state.extension || asset.ImageExt || "png"
    );
    const amcSource = this.getPreviewSrc(this.state.AMCimage || asset.AMCdoc || asset.AMCimage, "png");

    return (
      <div className="asset-side-panel">
        <div className="asset-side-panel-header">
          <h4 className="asset-side-panel-title">Asset Details</h4>
        </div>
        <div className="asset-side-panel-body">
          <div className="asset-details-new-layout">
            <div className="asset-details-row asset-details-header-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value">{asset.Id}</span>
            </div>

            <div className="asset-details-row asset-details-name-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Name</span>
                <span className="asset-info-value">{asset.Name}</span>
              </div>
              <span className={`asset-status-badge asset-status-badge-${statusMeta.key}`}>{statusMeta.label}</span>
            </div>

            <div className="asset-details-row asset-details-desc-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Description</span>
                <span className="asset-info-value">{asset.Description || "-"}</span>
              </div>
            </div>

            <div className="asset-details-grid-two-col">
              <div className="asset-info-item">
                <span className="asset-info-label">Manufacturer</span>
                <span className="asset-info-value">{asset.Manufacturer || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Model</span>
                <span className="asset-info-value">{asset.AssetModel || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Last serviced</span>
                <span className="asset-info-value">{this.formatDisplayDate(asset.LastServiceDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Next service</span>
                <span className="asset-info-value">{this.formatDisplayDate(asset.NextServiceDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Reminder</span>
                <span className="asset-info-value">{asset.serviceReminderDay ? `${asset.serviceReminderDay} day(s)` : "No reminder set"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Value</span>
                <span className="asset-info-value">{asset.AssetValue ? `₹${asset.AssetValue}` : "₹0"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Is Movable</span>
                <span className="asset-info-value">{this.getBoolLabel(asset.IsMoveable)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Is Rentable</span>
                <span className="asset-info-value">{this.getBoolLabel(asset.IsRentable)}</span>
              </div>
            </div>

            <div className="asset-details-row asset-details-location-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Location</span>
                <span className="asset-info-value">{asset.Location || asset.location || "-"}</span>
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
                  {imageSource ? (
                    <a href={imageSource} target="_blank" rel="noopener noreferrer" className="asset-doc-link-text">Asset photo</a>
                  ) : (
                    <span className="asset-doc-link-text disabled">Asset photo</span>
                  )}
                </div>
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-file-text-o" />
                  </div>
                  {amcSource ? (
                    <a href={amcSource} target="_blank" rel="noopener noreferrer" className="asset-doc-link-text">AMC Contract</a>
                  ) : (
                    <span className="asset-doc-link-text disabled">AMC Contract</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary asset-btn-footer-edit" onClick={() => this.ongridedit(asset.Id)}>
            Edit
          </button>
          <button type="button" className="btn btn-outline-light asset-btn-footer-close" onClick={this.closeSidePanel}>
            Close
          </button>
        </div>
      </div>
    );
  };


  renderAssetFormPanel = () => {
    const isEditMode = this.state.PageMode === "Edit";
    return (
      <div className="asset-side-panel asset-side-panel-form">
        <div className="asset-side-panel-header asset-form-new-header">
          <div className="asset-panel-title-wrap">
            <span className="asset-form-icon-circle">
              <i className="fa fa-pencil-square-o" aria-hidden="true" />
            </span>
            <h4 className="asset-side-panel-title">{isEditMode ? "Edit asset details" : "Add Asset"}</h4>
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
            <span className="asset-info-value">{this.state.Id || "NEW"}</span>
          </div>

          <div className="asset-form-simple-stack">
            <div className="form-group asset-form-group-custom">
              <label>Name</label>
              <input type="text" className="form-control" value={this.state.Name} onChange={(e) => this.setState({ Name: e.target.value })} />
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Status</label>
              <select className="form-control" value={this.state.status} onChange={(e) => this.setState({ status: e.target.value })}>
                <option value="">Select status</option>
                <option value="true">Running</option>
                <option value="false">Inactive</option>
                <option value="Servicing">Servicing</option>
              </select>
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Description</label>
              <textarea rows="4" className="form-control" value={this.state.Description} onChange={(e) => this.setState({ Description: e.target.value })} />
            </div>

            <div className="asset-form-row-two-col">
              <div className="form-group asset-form-group-custom">
                <label>Manufacturer</label>
                <input type="text" className="form-control" value={this.state.ManufacturerName} onChange={(e) => this.setState({ ManufacturerName: e.target.value })} />
              </div>
              <div className="form-group asset-form-group-custom">
                <label>Model</label>
                <input type="text" className="form-control" value={this.state.AssetModel} onChange={(e) => this.setState({ AssetModel: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <Button id="btnSave" Text="Save changes" Action={this.handleSave} ClassName="btn btn-primary asset-btn-footer-save" />
          <Button id="btnCancel" Text="Cancel" Action={() => this.requestCancelConfirm("edit")} ClassName="btn btn-outline-light asset-btn-footer-cancel" />
        </div>
      </div>
    );
  };

  renderAssetFormModal = () => {
    const isEditMode = this.state.PageMode === "Edit";
    const title = isEditMode ? "Edit Asset" : "Add Asset";

    return (
      <div className="asset-add-backdrop" role="presentation">
        <div className="asset-add-modal" role="dialog" aria-modal="true">
          <div className="asset-add-header">
            <div className="asset-add-title">
              <span className="asset-add-icon" aria-hidden="true">
                <i className="fa fa-plus" />
              </span>
              <span>{title}</span>
            </div>

            <button type="button" className="asset-add-generate" disabled>
              <i className="fa fa-qrcode" aria-hidden="true" />
              Generate QR code
            </button>
          </div>

          <div className="asset-add-body">
            <div className="asset-add-id-row">
              <div className="asset-add-id-left">
                <span className="asset-add-id-label">ID</span>
                <span className="asset-add-id-value">{this.state.Id ? `#${this.state.Id}` : "#NEW"}</span>
              </div>
            </div>

            <div className="asset-add-grid">
              <div className="form-group asset-form-group-custom">
                <label>Name</label>
                <input
                  id="txtDocumentType"
                  type="text"
                  className="form-control"
                  placeholder="Add name"
                  value={this.state.Name}
                  onChange={(e) => this.setState({ Name: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Status</label>
                <select className="form-control" value={this.state.status} onChange={(e) => this.setState({ status: e.target.value })}>
                  <option value="">Input status</option>
                  <option value="true">Running</option>
                  <option value="false">Inactive</option>
                  <option value="Servicing">Servicing</option>
                </select>
              </div>

              <div className="form-group asset-form-group-custom asset-add-span-2">
                <label>Description</label>
                <textarea
                  rows="4"
                  className="form-control"
                  placeholder="Category description"
                  value={this.state.Description}
                  onChange={(e) => this.setState({ Description: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Manufacturer</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add manufacturer name"
                  value={this.state.ManufacturerName}
                  onChange={(e) => this.setState({ ManufacturerName: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Model</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add asset model"
                  value={this.state.AssetModel}
                  onChange={(e) => this.setState({ AssetModel: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Last service</label>
                <input type="date" className="form-control" value={this.state.LastServiceDate} onChange={(e) => this.setState({ LastServiceDate: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Next service</label>
                <input type="date" className="form-control" value={this.state.NextServiceDate} onChange={(e) => this.setState({ NextServiceDate: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Is Movable</label>
                <RadioButtonGroup
                  name="IsMoveable"
                  selectedValue={String(this.state.IsMoveable)}
                  onChange={(e) => this.setState({ IsMoveable: e.target.value })}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Is Rentable</label>
                <RadioButtonGroup
                  name="IsRentable"
                  selectedValue={String(this.state.IsRentable)}
                  onChange={(e) => this.setState({ IsRentable: e.target.value })}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Service reminder</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder=""
                  value={this.state.serviceReminderDay}
                  onChange={(e) => this.setState({ serviceReminderDay: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Location</label>
                <input type="text" className="form-control" value={this.state.location} onChange={(e) => this.setState({ location: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="asset-add-footer">
            <Button id="btnSave" Text="Save" Action={this.handleSave} ClassName="btn btn-primary asset-add-btn-save" />
            <Button id="btnCancel" Text="Cancel" Action={() => this.requestCancelConfirm("add")} ClassName="btn btn-light asset-add-btn-cancel" />
          </div>
        </div>
      </div>
    );
  };

  renderCancelConfirmModal = () => {
    if (!this.state.showCancelConfirm) return null;
    const isEdit = this.state.cancelConfirmType === "edit";
    const title = isEdit ? "Cancel edits" : "Cancel action";
    return (
      <div className="spare-add-backdrop" onClick={this.closeCancelConfirm}>
        <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
          <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="spare-add-title">
              <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                <i className="fa fa-exclamation-triangle" aria-hidden="true" />
              </span>
              {title}
            </div>
            <button type="button" className="spare-add-close" onClick={this.closeCancelConfirm}>
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div className="asset-side-panel-body">Are you sure you want to cancel? All your updated information will be lost.</div>
          <div className="asset-dialog-actions">
            <button type="button" className="btn btn-light" onClick={this.closeCancelConfirm}>
              No, keep editing
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                this.closeCancelConfirm();
                this.handleCancel();
              }}
            >
              Yes, cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderDeleteConfirmModal = () => {
    if (!this.state.showDeleteModal || !this.state.deleteTarget) return null;
    const asset = this.state.deleteTarget;
    return (
      <div className="spare-add-backdrop" onClick={() => this.setState({ showDeleteModal: false, deleteTarget: null })}>
        <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
          <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="spare-add-title">
              <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                <i className="fa fa-exclamation-triangle" aria-hidden="true" />
              </span>
              Delete asset
            </div>
            <button type="button" className="spare-add-close" onClick={() => this.setState({ showDeleteModal: false, deleteTarget: null })}>
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div className="asset-side-panel-body">
            Are you sure you want to delete this Asset? This action cannot be undone.
            <div className="asset-dialog-assetbox">
              <div className="asset-dialog-assetrow">
                <span className="asset-dialog-assetlabel">Asset ID:</span>
                <span className="asset-dialog-assetvalue">#{asset.Id}</span>
              </div>
              <div className="asset-dialog-assetrow">
                <span className="asset-dialog-assetlabel">Asset Name:</span>
                <span className="asset-dialog-assetvalue">{asset.Name || "-"}</span>
              </div>
              <div className="asset-dialog-assetrow">
                <span className="asset-dialog-assetlabel">Location:</span>
                <span className="asset-dialog-assetvalue">{asset.Location || asset.location || "-"}</span>
              </div>
            </div>
          </div>
          <div className="asset-dialog-actions asset-dialog-actions-right">
            <button type="button" className="btn btn-light" onClick={() => this.setState({ showDeleteModal: false, deleteTarget: null })}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => this.setState({ Id: String(asset.Id) }, () => this.mangaeSave(this.getModel("D"), "D"))}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderSuccessModal = () => {
    if (!this.state.showSuccessModal) return null;
    const isUpdate = this.state.successType === "U";
    const title = isUpdate ? "Changes updated successfully" : "Item created successfully";
    const subtitle = isUpdate ? "The item has been updated." : "The item is ready. You can now monitor its progress.";
    return (
      <div className="spare-add-backdrop" onClick={this.closeSuccessModal}>
        <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
          <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="spare-add-title">
              <span className="spare-add-icon" style={{ background: "rgba(33, 150, 243, 0.12)", color: "#1f4f82" }}>
                <i className="fa fa-check" aria-hidden="true" />
              </span>
              {title}
            </div>
            <button type="button" className="spare-add-close" onClick={this.closeSuccessModal}>
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div className="asset-side-panel-body">{subtitle}</div>
          <div className="asset-dialog-actions asset-dialog-actions-right">
            <button type="button" className="btn btn-primary" onClick={this.closeSuccessModal}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };


  renderSidePanel = () => {
    if (this.state.PageMode === "View") return this.renderAssetDetailsPanel();
    if (this.state.PageMode === "Add" || this.state.PageMode === "Edit") return this.renderAssetFormPanel();
    return null;
  };

  render() {
    const filteredGridData = this.getFilteredGridData();
    const activeFilterCount = [
      this.state.filterAssetType,
      this.state.filterStatus,
      this.state.filterMoveable,
      this.state.filterRentable,
      this.state.filterDueFrom,
      this.state.filterDueTo,
      this.state.filterCategory,
      this.state.filterLocation,
      this.state.filterCapacity,
    ].filter((item) => String(item || "") !== "").length;
    const hasSidePanel = this.state.PageMode === "View" || this.state.PageMode === "Edit";
    const showAssetModal = this.state.PageMode === "Add";

    return (
      <div className="asset-master-page">
        <div className="asset-master-breadcrumb">
          <i className="fa fa-angle-left" aria-hidden="true" />
          <span>Asset Master</span>
        </div>

        <div className={`asset-master-layout ${hasSidePanel ? "has-side-panel" : ""}`}>
          <div className="asset-master-main-card">
            <div className="asset-master-tabs">
              <button type="button" className="asset-master-tab active">Owned assets</button>
              <button type="button" className="asset-master-tab" onClick={() => this.props.history.push("/Account/App/RentalAssets")}>Rented assets</button>
              <button type="button" className="asset-master-tab" onClick={() => this.props.history.push("/Account/App/SpareMaster")}>Spare parts</button>
            </div>

            <div className="asset-master-toolbar">
              <div className="asset-master-search">
                <i className="fa fa-search" aria-hidden="true" />
                <input type="text" placeholder="Search by name or ID" value={this.state.searchTerm} onChange={(e) => this.setState({ searchTerm: e.target.value })} />
              </div>

              <div className="asset-master-toolbar-actions">
                <button className="btn btn-light asset-toolbar-filter" type="button" onClick={() => this.setState({ showFilterPanel: !this.state.showFilterPanel })}>
                  <i className="fa fa-sliders mr-1" />
                  Filter
                  {activeFilterCount > 0 ? <span className="task-filter-count">{activeFilterCount}</span> : null}
                </button>
                {/* <ExportToCSV data={this.getExportData(filteredGridData)} fileName="AssetsMaster.csv" /> */}
                <button type="button" className="btn btn-primary asset-toolbar-add" onClick={this.Addnew}>
                  <i className="fa fa-plus mr-1" />
                  Add asset
                </button>
              </div>
            </div>

            {this.state.showFilterPanel ? (
              <div className="asset-inline-filters">
                <select className="form-control" value={this.state.filterAssetType} onChange={(e) => this.setState({ filterAssetType: e.target.value })}>
                  <option value="">All Asset Types</option>
                  <option value="Machine/Equipment">Machine/Equipment</option>
                  <option value="MeasuringEnquipment">Measuring Equipment</option>
                  <option value="Facility">Facility</option>
                </select>
                <select className="form-control" value={this.state.filterStatus} onChange={(e) => this.setState({ filterStatus: e.target.value })}>
                  <option value="">All Status</option>
                  <option value="true">Running</option>
                  <option value="false">Inactive</option>
                </select>
                <input type="text" className="form-control" placeholder="Location" value={this.state.filterLocation} onChange={(e) => this.setState({ filterLocation: e.target.value })} />
                <button className="btn btn-link" type="button" onClick={this.resetFilters}>Reset</button>
              </div>
            ) : null}

            <div className="asset-master-table-wrap">
              <DataGrid
                Id="grdAssetsMaster"
                IsPagination={false}
                ColumnCollection={this.state.gridHeader}
                Onpageindexchanged={this.onPagechange}
                onEditMethod={this.ongridedit}
                onGridDeleteMethod={this.onGridDelete}
                onGridViewMethod={this.onGridView}
                onRowClickMethod={this.onGridRowSelect}
                selectedRowId={this.state.selectedRowId}
                DefaultPagination={true}
                IsSarching={false}
                GridData={filteredGridData}
                pageSize="15"
              />
            </div>
          </div>

          {hasSidePanel ? this.renderSidePanel() : null}
        </div>
        {showAssetModal ? this.renderAssetFormModal() : null}
        {this.renderCancelConfirmModal()}
        {this.renderDeleteConfirmModal()}
        {this.renderSuccessModal()}
      </div>
    );
  }
}

function mapStoreToprops(state) {
  return { PropertyId: state.Commonreducer.puidn };
}

function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators(departmentActions, dispatch);
  return { actions };
}

export default withRouter(connect(mapStoreToprops, mapDispatchToProps)(AssetsMaster));
