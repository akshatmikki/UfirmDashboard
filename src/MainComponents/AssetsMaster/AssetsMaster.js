
import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import departmentActions from "../../redux/department/action.js";
import DataGrid from "../../ReactComponents/DataGrid/DataGrid.jsx";
import Button from "../../ReactComponents/Button/Button";
import ApiProvider from "./DataProvider.js";
import * as appCommon from "../../Common/AppCommon.js";
import { DELETE_CONFIRMATION_MSG } from "../../Contants/Common";
import swal from "sweetalert";
import { CreateValidator, ValidateControls } from "./Validation.js";
import DocumentUploader from "../../ReactComponents/FileUploader/DocumentUploader.jsx";
import ExportToCSV from "../../ReactComponents/ExportToCSV/ExportToCSV.js";
import "../Calendar/Tasks/taskList/components/TaskListView.css";
import "./AssetsMaster.css";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(","));
    reader.onerror = (error) => reject(error);
  });

const RadioButtonGroup = ({ options, name, selectedValue, onChange, disabled = false }) => (
  <div className="d-flex align-items-center justify-content-around flex-wrap">
    {options.map((opt) => (
      <label
        key={opt.value}
        className="form-check-label d-flex align-items-center mr-3 mb-1"
        style={{ cursor: disabled ? "not-allowed" : "pointer", gap: "8px" }}
      >
        <input
          type="radio"
          name={name}
          value={opt.value}
          checked={selectedValue === opt.value}
          onChange={onChange}
          className="form-check-input"
          disabled={disabled}
        />
        {opt.label}
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
        { sTitle: "Id", titleValue: "Id", orderable: true },
        { sTitle: "Assets Name", titleValue: "Name" },
        { sTitle: "Description", titleValue: "Description" },
        { sTitle: "QRCode", titleValue: "QRCode" },
        { sTitle: "Service Due Date", titleValue: "NextServiceDate" },
        {
          sTitle: "Action",
          titleValue: "Action",
          Action: "Edit&View&Delete",
          Index: "0",
          orderable: false,
        },
      ],
      PageMode: "Home",
      Id: 0,
      AssetType: "",
      ManufacturerName: "",
      SelectedCategory: "",
      SelectedSubCategory: "",
      SelectedAssetName: "",
      SelectedAssetModel: "",
      IsMoveable: false,
      Name: "",
      Description: "",
      QRCode: "",
      ImageData: null,
      AssetImage: "",
      ImageExt: "",
      documentVal: "",
      currentSelectedFile: null,
      showImagefilename: "",
      showImagefiletype: null,
      showImagefile: [],
      extension: "",
      LastServiceDate: null,
      NextServiceDate: null,
      IsRentable: false,
      AssetValue: 0,
      Capacity: "",
      AMCdoc: null,
      AMCimage: "",
      status: false,
      category: null,
      location: null,
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
    if (boolVal === "") return "";
    return boolVal ? "Yes" : "No";
  };

  getStatusLabel = (value) => {
    const boolVal = this.normalizeBoolean(value);
    if (boolVal === "") return "";
    return boolVal ? "Functional" : "Non-Functional";
  };

  getModel = (type, overrides = {}) => {
    return [
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
  };

  loadHomagePageData() {
    const model = this.getModel();
    this.setState({ isLoading: true });
    this.ApiProviderr.manageDocumentTypeMaster(model, "R")
      .then((resp) => {
        if (resp.ok && resp.status === 200) {
          return resp.json().then((rData) => {
            const dueServiceAssets = Array.isArray(rData?.PassedServiceDates)
              ? rData.PassedServiceDates
              : [];
            const upcomingServiceAssets = Array.isArray(rData?.UpcomingServiceDates)
              ? rData.UpcomingServiceDates
              : [];
            const merged = [...dueServiceAssets, ...upcomingServiceAssets].map((item) => ({
              ...item,
              NextServiceDate: this.normalizeDate(item?.NextServiceDate),
              LastServiceDate: this.normalizeDate(item?.LastServiceDate),
            }));

            this.setState({
              GridData: merged,
              DueGridData: dueServiceAssets,
              isLoading: false,
            });
          });
        }
        this.setState({ isLoading: false });
        return null;
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  onPagechange = () => {};

  Addnew = () => {
    this.setState({ PageMode: "Add" }, () => {
      CreateValidator();
    });
  };

  findItem(id) {
    return this.state.GridData.find((item) => Number(item.Id) === Number(id)) || null;
  }

  setFormData = (rowData, mode) => {
    if (!rowData) return;
    this.setState({
      PageMode: mode,
      Id: rowData.Id,
      Name: rowData.Name || "",
      Description: rowData.Description || "",
      QRCode: rowData.QRCode || "",
      ManufacturerName: rowData.Manufacturer || "",
      AssetModel: rowData.AssetModel || "",
      IsMoveable: this.normalizeBoolean(rowData.IsMoveable),
      LastServiceDate: this.normalizeDate(rowData.LastServiceDate),
      NextServiceDate: this.normalizeDate(rowData.NextServiceDate),
      IsRentable: this.normalizeBoolean(rowData.IsRentable),
      AssetValue: rowData.AssetValue || 0,
      Capacity: rowData.Capacity ?? rowData.capacity ?? "",
      AssetType: rowData.AssetType || "",
      AssetImage: rowData.AssetImage || "",
      AMCimage: rowData.AMCdoc || "",
      showImagefiletype: rowData.ImageExt,
      showImagefile: rowData.Image,
      extension: rowData.ImageExt,
      status: this.normalizeBoolean(rowData.Status),
      category: rowData.Category || "",
      location: rowData.Location || "",
      serviceReminderDay: rowData.serviceReminderDay || "",
    });
  };

  ongridedit = (id) => {
    CreateValidator();
    const rowData = this.findItem(id);
    this.setFormData(rowData, "Edit");
  };

  onGridDelete = (id) => {
    const rowData = this.findItem(id);
    if (!rowData) return;

    const myhtml = document.createElement("div");
    myhtml.innerHTML = `${DELETE_CONFIRMATION_MSG}</hr>`;

    swal({
      buttons: { ok: "Yes", cancel: "No" },
      content: myhtml,
      icon: "warning",
      closeOnClickOutside: false,
      dangerMode: true,
    }).then((value) => {
      if (value === "ok") {
        this.setState({ Id: String(rowData.Id) }, () => {
          const type = "D";
          const model = this.getModel(type);
          this.mangaeSave(model, type);
        });
      }
    });
  };

  onGridView = (id) => {
    const rowData = this.findItem(id);
    this.setFormData(rowData, "View");
  };

  onFileChange(event) {
    const validFileExtensions = ["jpg", "jpeg", "png", "pdf"];
    const selected = event?.target?.files?.[0];
    if (!selected) return;

    const extension = selected.name.substring(selected.name.lastIndexOf(".") + 1);
    const isValidFiletype = validFileExtensions.some((x) => x === extension.toLowerCase());

    if (isValidFiletype) {
      this.setState({ ImageData: selected });
      return;
    }

    this.setState({ documentVal: "", currentSelectedFile: null });
    appCommon.showtextalert(
      `${selected.name} Invalid file type, Please select only ${validFileExtensions.join(", ")}`,
      "",
      "error"
    );
  }

  onAMCFileChange = (event) => {
    const validFileExtensions = ["jpg", "jpeg", "png", "pdf"];
    const selected = event?.target?.files?.[0];
    if (!selected) return;

    const extension = selected.name.substring(selected.name.lastIndexOf(".") + 1);
    const isValidFiletype = validFileExtensions.some((x) => x === extension.toLowerCase());

    if (isValidFiletype) {
      this.setState({ AMCdoc: selected });
      return;
    }

    this.setState({ documentVal: "", currentSelectedFile: null });
    appCommon.showtextalert(
      `${selected.name} Invalid file type, Please select only ${validFileExtensions.join(", ")}`,
      "",
      "error"
    );
  };

  handleSave = async () => {
    const upFile = this.state.ImageData;
    const amcUpFile = this.state.AMCdoc;

    let assetImage = this.state.AssetImage;
    let imageExt = this.state.ImageExt;
    let amcImage = this.state.AMCimage;

    if (upFile && upFile.name && upFile.size) {
      const fileD = await toBase64(upFile);
      const extension = upFile.name.substring(upFile.name.lastIndexOf(".") + 1);
      assetImage = fileD[1];
      imageExt = extension;
    }

    if (amcUpFile && amcUpFile.name && amcUpFile.size) {
      const fileD = await toBase64(amcUpFile);
      amcImage = fileD[1];
    }

    if (ValidateControls()) {
      const type = this.state.PageMode === "Add" ? "I" : "U";
      const model = this.getModel(type, {
        AssetImage: assetImage,
        ImageExt: imageExt,
        AMCdoc: amcImage,
      });
      this.mangaeSave(model, type);
    }

    this.setState({
      ImageData: null,
      AssetImage: "",
      ImageExt: "",
      AMCdoc: null,
      AMCimage: "",
    });
  };

  mangaeSave = (model, type) => {
    this.ApiProviderr.manageDocumentTypeMaster(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          if (rData === 0) {
            appCommon.showtextalert("Assets Name Existed !", "", "error");
          } else {
            if (type !== "D") {
              appCommon.showtextalert("Assets Saved Successfully!", "", "success");
            } else {
              appCommon.showtextalert("Assets Deleted Successfully!", "", "success");
            }
            this.handleCancel();
          }
        });
      }
      return null;
    });
  };

  handleCancel = () => {
    this.setState(
      {
        Id: 0,
        Name: "",
        Description: "",
        QRCode: "",
        ManufacturerName: "",
        AssetModel: "",
        IsMoveable: false,
        LastServiceDate: "",
        NextServiceDate: "",
        IsRentable: false,
        AssetValue: 0,
        Capacity: "",
        AssetType: "",
        AssetImage: "",
        AMCimage: "",
        showImagefiletype: null,
        showImagefile: null,
        extension: null,
        status: false,
        category: "",
        location: "",
        serviceReminderDay: "",
        ImageData: null,
        AMCdoc: null,
      },
      () => {
        this.setState({ PageMode: "Home" });
        this.loadHomagePageData();
      }
    );
  };
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

  getFilteredGridData = () => {
    const {
      GridData,
      searchTerm,
      filterAssetType,
      filterStatus,
      filterMoveable,
      filterRentable,
      filterDueFrom,
      filterDueTo,
      filterCategory,
      filterLocation,
      filterCapacity,
    } = this.state;

    return (GridData || []).filter((item) => {
      const rowId = String(item?.Id || "");
      const rowName = String(item?.Name || "");
      const rowDescription = String(item?.Description || "");
      const rowQr = String(item?.QRCode || "");
      const rowType = String(item?.AssetType || "");
      const rowCategory = String(item?.Category || "");
      const rowLocation = String(item?.Location || "");
      const rowCapacity = String(item?.Capacity ?? item?.capacity ?? "");
      const rowNextServiceDate = this.normalizeDate(item?.NextServiceDate);

      const search = String(searchTerm || "").toLowerCase().trim();
      const matchesSearch =
        !search ||
        rowId.toLowerCase().includes(search) ||
        rowName.toLowerCase().includes(search) ||
        rowDescription.toLowerCase().includes(search) ||
        rowQr.toLowerCase().includes(search);

      const matchesAssetType = !filterAssetType || rowType === filterAssetType;
      const matchesStatus =
        filterStatus === ""
          ? true
          : this.normalizeBoolean(item?.Status) === this.normalizeBoolean(filterStatus);
      const matchesMovable =
        filterMoveable === ""
          ? true
          : this.normalizeBoolean(item?.IsMoveable) === this.normalizeBoolean(filterMoveable);
      const matchesRentable =
        filterRentable === ""
          ? true
          : this.normalizeBoolean(item?.IsRentable) === this.normalizeBoolean(filterRentable);

      const matchesCategory =
        !filterCategory || rowCategory.toLowerCase().includes(String(filterCategory).toLowerCase().trim());
      const matchesLocation =
        !filterLocation || rowLocation.toLowerCase().includes(String(filterLocation).toLowerCase().trim());
      const matchesCapacity =
        !filterCapacity || rowCapacity.toLowerCase().includes(String(filterCapacity).toLowerCase().trim());

      const matchesDueFrom = !filterDueFrom || !rowNextServiceDate || rowNextServiceDate >= filterDueFrom;
      const matchesDueTo = !filterDueTo || !rowNextServiceDate || rowNextServiceDate <= filterDueTo;

      return (
        matchesSearch &&
        matchesAssetType &&
        matchesStatus &&
        matchesMovable &&
        matchesRentable &&
        matchesCategory &&
        matchesLocation &&
        matchesCapacity &&
        matchesDueFrom &&
        matchesDueTo
      );
    });
  };

  getExportData = (rows) => {
    return (rows || []).map((item) => ({
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
      Status: this.getStatusLabel(item.Status),
      Category: item.Category,
      Location: item.Location,
      ServiceReminderDay: item.serviceReminderDay,
    }));
  };

  renderHomeView = () => {
    const filteredGridData = this.getFilteredGridData();
    const dueCount = this.state.DueGridData.length;
    const functionalCount = filteredGridData.filter((item) => this.normalizeBoolean(item.Status) === true).length;
    const nonFunctionalCount = filteredGridData.filter(
      (item) => this.normalizeBoolean(item.Status) === false
    ).length;

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

    return (
      <div className="row">
        <div className="col-12">
          <div className="card p-2 task-planner-shell asset-master-shell">
            <div className="task-summary-grid">
              <div className="task-summary-card task-summary-total">
                <p className="task-summary-value">{filteredGridData.length}</p>
                <p className="task-summary-label">Total Assets</p>
              </div>
              <div className="task-summary-card task-summary-overdue">
                <p className="task-summary-value">{dueCount}</p>
                <p className="task-summary-label">Service Overdue</p>
              </div>
              <div className="task-summary-card task-summary-completed">
                <p className="task-summary-value">{functionalCount}</p>
                <p className="task-summary-label">Functional</p>
              </div>
              <div className="task-summary-card task-summary-pending">
                <p className="task-summary-value">{nonFunctionalCount}</p>
                <p className="task-summary-label">Non-Functional</p>
              </div>
            </div>

            <div className="card-header p-2 task-list-filter-shell">
              <div className="task-planner-toolbar">
                <div className="input-group task-search-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text">
                      <i className="fa fa-search text-muted" />
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by asset name, ID, QR code"
                    value={this.state.searchTerm}
                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                  />
                </div>

                <div className="task-toolbar-actions">
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center task-toolbar-btn"
                    type="button"
                    onClick={() => this.setState({ showFilterPanel: !this.state.showFilterPanel })}
                  >
                    <i className="fa fa-sliders mr-1" />
                    Filter
                    {activeFilterCount > 0 ? <span className="task-filter-count">{activeFilterCount}</span> : null}
                  </button>

                  <ExportToCSV data={this.getExportData(filteredGridData)} fileName="AssetsMaster.csv" />

                  <Button
                    id="btnNewAsset"
                    Action={this.Addnew}
                    ClassName="btn btn-primary d-flex align-items-center px-3 task-toolbar-btn task-add-btn"
                    Icon={<i className="fa fa-plus mr-1" aria-hidden="true" />}
                    Text="Create New Asset"
                  />
                </div>
              </div>

              {this.state.showFilterPanel ? (
                <div className="p-2 mb-2 mt-2 task-filter-panel task-filter-panel-advanced">
                  <div className="task-filter-head">
                    <h6>Filters</h6>
                    <button className="btn btn-link p-0" type="button" onClick={this.resetFilters}>
                      <i className="fa fa-times mr-1" />
                      Reset All
                    </button>
                  </div>

                  <div className="task-filter-grid asset-filter-grid">
                    <div className="task-filter-col">
                      <p className="task-filter-group-title">Asset Type</p>
                      <select
                        className="form-control task-filter-select"
                        value={this.state.filterAssetType}
                        onChange={(e) => this.setState({ filterAssetType: e.target.value })}
                      >
                        <option value="">All Asset Types</option>
                        <option value="Machine/Equipment">Machine/Equipment</option>
                        <option value="MeasuringEnquipment">Measuring Equipment</option>
                        <option value="Facility">Facility</option>
                      </select>

                      <p className="task-filter-group-title">Status</p>
                      <select
                        className="form-control task-filter-select"
                        value={this.state.filterStatus}
                        onChange={(e) => this.setState({ filterStatus: e.target.value })}
                      >
                        <option value="">All Status</option>
                        <option value="true">Functional</option>
                        <option value="false">Non-Functional</option>
                      </select>

                      <p className="task-filter-group-title">Service Due Date</p>
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <input
                            type="date"
                            className="form-control task-filter-select"
                            value={this.state.filterDueFrom}
                            onChange={(e) => this.setState({ filterDueFrom: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6 mb-2">
                          <input
                            type="date"
                            className="form-control task-filter-select"
                            value={this.state.filterDueTo}
                            onChange={(e) => this.setState({ filterDueTo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="task-filter-col">
                      <p className="task-filter-group-title">Movable</p>
                      <select
                        className="form-control task-filter-select"
                        value={this.state.filterMoveable}
                        onChange={(e) => this.setState({ filterMoveable: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>

                      <p className="task-filter-group-title">Rentable</p>
                      <select
                        className="form-control task-filter-select"
                        value={this.state.filterRentable}
                        onChange={(e) => this.setState({ filterRentable: e.target.value })}
                      >
                        <option value="">All</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>

                      <p className="task-filter-group-title">Category</p>
                      <input
                        type="text"
                        className="form-control task-filter-select"
                        placeholder="Category"
                        value={this.state.filterCategory}
                        onChange={(e) => this.setState({ filterCategory: e.target.value })}
                      />

                      <p className="task-filter-group-title">Location</p>
                      <input
                        type="text"
                        className="form-control task-filter-select"
                        placeholder="Location"
                        value={this.state.filterLocation}
                        onChange={(e) => this.setState({ filterLocation: e.target.value })}
                      />

                      <p className="task-filter-group-title">Capacity</p>
                      <input
                        type="text"
                        className="form-control task-filter-select"
                        placeholder="e.g. 2 Ton, 500 L"
                        value={this.state.filterCapacity}
                        onChange={(e) => this.setState({ filterCapacity: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="card-body pt-2 asset-master-table-wrap">
              <DataGrid
                Id="grdAssetsMaster"
                IsPagination={false}
                ColumnCollection={this.state.gridHeader}
                Onpageindexchanged={this.onPagechange}
                onEditMethod={this.ongridedit}
                onGridDeleteMethod={this.onGridDelete}
                onGridViewMethod={this.onGridView}
                DefaultPagination={true}
                IsSarching="true"
                GridData={filteredGridData}
                pageSize="2000"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  renderFormView = (readOnly = false) => {
    const isEditMode = this.state.PageMode === "Edit";

    return (
      <div className="row">
        <div className="col-12">
          <div className="card p-2 task-planner-shell asset-master-shell">
            <div className="asset-master-form-header">
              <h4 className="asset-master-form-title mb-0">
                {readOnly ? "View Asset" : isEditMode ? "Edit Asset" : "Create Asset"}
              </h4>
              <button className="btn btn-outline-secondary task-toolbar-btn" onClick={this.handleCancel} type="button">
                <i className="fa fa-arrow-left mr-1" />
                Back to List
              </button>
            </div>

            <div className="card-body p-3">
              <div className="asset-form-section">
                <h6 className="asset-form-section-title">Asset Type</h6>
                <div className="asset-type-wrap">
                  <RadioButtonGroup
                    options={[
                      { label: "Machine/Equipment", value: "Machine/Equipment" },
                      { label: "Measuring Equipment", value: "MeasuringEnquipment" },
                      { label: "Facility", value: "Facility" },
                    ]}
                    name="AssetType"
                    selectedValue={this.state.AssetType}
                    onChange={(e) => this.setState({ AssetType: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="asset-form-section">
                <h6 className="asset-form-section-title">Basic Details</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="manufacturer">Manufacturer</label>
                      <input
                        type="text"
                        id="manufacturer"
                        placeholder="Manufacturer"
                        value={this.state.ManufacturerName}
                        className="form-control"
                        onChange={(e) => this.setState({ ManufacturerName: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="txtDocumentType">Asset Name</label>
                      <input
                        type="text"
                        id="txtDocumentType"
                        placeholder="Asset Name"
                        className="form-control"
                        value={this.state.Name}
                        onChange={(e) => this.setState({ Name: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="assetModel">Asset Model</label>
                      <input
                        type="text"
                        id="assetModel"
                        placeholder="Asset Model"
                        value={this.state.AssetModel}
                        className="form-control"
                        onChange={(e) => this.setState({ AssetModel: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="isMovable">Is Movable</label>
                      <select
                        id="isMovable"
                        className="form-control"
                        value={this.state.IsMoveable}
                        onChange={(e) => this.setState({ IsMoveable: e.target.value })}
                        disabled={readOnly}
                      >
                        <option value="">Select an option</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="asset-form-section">
                <h6 className="asset-form-section-title">Service Details</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="lastServiceDate">Last Service Date</label>
                      <input
                        type="date"
                        id="lastServiceDate"
                        className="form-control"
                        value={this.state.LastServiceDate || ""}
                        onChange={(e) => this.setState({ LastServiceDate: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="nextServiceDate">Next Service Date</label>
                      <input
                        type="date"
                        id="nextServiceDate"
                        className="form-control"
                        value={this.state.NextServiceDate || ""}
                        onChange={(e) => this.setState({ NextServiceDate: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="IsRentable">Is Rentable?</label>
                      <select
                        id="IsRentable"
                        className="form-control"
                        value={this.state.IsRentable}
                        onChange={(e) => this.setState({ IsRentable: e.target.value })}
                        disabled={readOnly}
                      >
                        <option value="">Select an option</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="serviceReminderDay">Asset Service Reminder</label>
                      <select
                        id="serviceReminderDay"
                        className="form-control"
                        value={this.state.serviceReminderDay}
                        onChange={(e) => this.setState({ serviceReminderDay: e.target.value })}
                        disabled={readOnly}
                      >
                        <option value="">No Reminder</option>
                        <option value="1">One Day Prior</option>
                        <option value="7">One Week Prior</option>
                        <option value="15">15 Days Prior</option>
                        <option value="30">One Month Prior</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="asset-form-section">
                <h6 className="asset-form-section-title">Financial & Asset Info</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="assetValue">Asset Value</label>
                      <div className="input-group">
                        <div className="input-group-prepend">
                          <span className="input-group-text">Rs.</span>
                        </div>
                        <input
                          type="number"
                          id="assetValue"
                          className="form-control currency"
                          value={this.state.AssetValue}
                          onChange={(e) =>
                            this.setState({ AssetValue: parseFloat(e.target.value) || 0 })
                          }
                          onKeyDown={(e) => e.key === "e" && e.preventDefault()}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="capacity">Capacity</label>
                      <input
                        type="text"
                        id="capacity"
                        placeholder="e.g. 500 L, 2 Ton"
                        className="form-control"
                        value={this.state.Capacity}
                        onChange={(e) => this.setState({ Capacity: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="status">Asset Status</label>
                      <select
                        id="status"
                        className="form-control"
                        value={this.state.status}
                        onChange={(e) => this.setState({ status: e.target.value })}
                        disabled={readOnly}
                      >
                        <option value="">Select an option</option>
                        <option value="true">Functional</option>
                        <option value="false">Non-Functional</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="category">Asset Category</label>
                      <input
                        type="text"
                        className="form-control"
                        id="category"
                        value={this.state.category || ""}
                        onChange={(e) => this.setState({ category: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="location">Asset Location</label>
                      <input
                        type="text"
                        className="form-control"
                        id="location"
                        value={this.state.location || ""}
                        onChange={(e) => this.setState({ location: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="QRCode">QR Code</label>
                      <input
                        type="text"
                        id="QRCode"
                        placeholder="QR Code"
                        value={this.state.QRCode}
                        className="form-control"
                        onChange={(e) => this.setState({ QRCode: e.target.value })}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        onChange={(e) => this.setState({ Description: e.target.value })}
                        placeholder="Description"
                        value={this.state.Description}
                        className="form-control form-control-sm"
                        rows="3"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="asset-form-section">
                <h6 className="asset-form-section-title">Documents</h6>
                {!readOnly ? (
                  <div className="row">
                    <div className="col-md-6">
                      <label>Asset Image</label>
                      <DocumentUploader
                        Class="form-control"
                        id="kycfileUploader"
                        type="file"
                        onChange={this.onFileChange.bind(this)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label>AMC Upload</label>
                      <DocumentUploader
                        Class="form-control"
                        id="AMCfileUploader"
                        type="file"
                        onChange={this.onAMCFileChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-md-6">
                      <label>Asset Image</label>
                      <div className="asset-preview-box">
                        {this.state.AssetImage ? (
                          <img
                            src={`data:image/png;base64,${this.state.AssetImage}`}
                            alt="Asset"
                            className="img-fluid"
                          />
                        ) : (
                          <div className="text-muted">No image</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label>AMC Contract</label>
                      <div className="asset-preview-box">
                        {this.state.AMCimage ? (
                          <img
                            src={`data:image/png;base64,${this.state.AMCimage}`}
                            alt="AMC Document"
                            className="img-fluid"
                          />
                        ) : (
                          <div className="text-muted">No AMC document</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!readOnly ? (
              <div className="card-footer d-flex justify-content-end gap-2 asset-form-actions">
                <Button id="btnSave" Text="Save" Action={this.handleSave} ClassName="btn btn-primary mr-2" />
                <Button id="btnCancel" Text="Cancel" Action={this.handleCancel} ClassName="btn btn-secondary" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  render() {
    return (
      <div>
        {this.state.PageMode === "Home" && this.renderHomeView()}
        {(this.state.PageMode === "Add" || this.state.PageMode === "Edit") && this.renderFormView(false)}
        {this.state.PageMode === "View" && this.renderFormView(true)}
      </div>
    );
  }
}

function mapStoreToprops(state) {
  return {
    PropertyId: state.Commonreducer.puidn,
  };
}

function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators(departmentActions, dispatch);
  return { actions };
}

export default connect(mapStoreToprops, mapDispatchToProps)(AssetsMaster);
