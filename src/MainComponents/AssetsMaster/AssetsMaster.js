import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import departmentActions from "../../redux/department/action.js";
import Button from "../../ReactComponents/Button/Button";
import ApiProvider from "./DataProvider.js";
import * as appCommon from "../../Common/AppCommon.js";
import { DELETE_CONFIRMATION_MSG } from "../../Contants/Common";
import { CreateValidator, ValidateControls } from "./Validation.js";
import DocumentUploader from "../../ReactComponents/FileUploader/DocumentUploader.jsx";
import "../Calendar/Tasks/taskList/components/TaskListView.css";
import "./AssetsMaster.css";
import { withRouter } from "react-router-dom";
import CustomDatePicker from "../../ReactComponents/CustomDatePicker/CustomDatePicker";
import CustomDropdown from "../../ReactComponents/CustomDropdown/CustomDropdown";
import QRCode from "react-qr-code";
import { renderToStaticMarkup } from "react-dom/server";
import { saveAssetAMC } from "../../Services/AssetService";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const toBase64FromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch existing file: ${response.status}`);
  }
  const blob = await response.blob();
  return toBase64(blob);
};

const normalizeUploadValue = async (currentValue, selectedFile) => {
  if (selectedFile?.name && selectedFile?.size) {
    return toBase64(selectedFile);
  }

  const value = String(currentValue || "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  if (/^https?:\/\//i.test(value)) {
    return toBase64FromUrl(value);
  }
  return value;
};

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
    this.searchInputRef = React.createRef();
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
      activeTab: "owned",
      Id: 0,
      AssetType: "",
      ManufacturerName: "",
      AssetModel: "",
      IsMoveable: false,
      IsRented: false,
      Name: "",
      Description: "",
      QRCode: "",
      ImageData: null,
      AssetImage: "",
      ImageExt: "",
      assetImageFileName: "",
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
      amcFileName: "",
      amcDateFrom: "",
      amcDateTo: "",
      amcTotalAmount: "",
      amcContractType: "",
      showAmcDetailsForm: false,
      WarrantyDocument: null,
      warrantyImage: "",
      warrantyFileName: "",
      status: false,
      category: "",
      location: "",
      serviceReminderDay: "",
      searchTerm: "",
      showFilterPanel: false,
      filterCapacity: "",
      filterVendor: "",
      filterManufacturer: "",
      filterStatus: "",
      filterServiceStatus: "",
      filterType: "",
      selectedRowId: null,
      showCancelConfirm: false,
      cancelConfirmType: "",
      showDeleteModal: false,
      deleteTarget: null,
      showSuccessModal: false,
      successType: "",
      showAmcModal: false,
      PurchaseDate: "",
      WarrantyDate: "",
      currentPage: 1,
      nextAddAssetId: 0,
      showAddQrPreview: false,
    };
    this.ApiProviderr = new ApiProvider();
  }

  componentDidMount() {
    this.loadHomagePageData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.PropertyId !== this.props.PropertyId) {
      this.loadHomagePageData();
    }

    const filterKeys = [
      "searchTerm",
      "filterCapacity",
      "filterVendor",
      "filterManufacturer",
      "filterServiceStatus",
      "filterType",
    ];

    if (filterKeys.some((key) => prevState[key] !== this.state[key])) {
      this.setState({ currentPage: 1 });
    }
  }
  // 👇 ADD THIS METHOD INSIDE CLASS
downloadAllQRCodes = async () => {
  console.log("QR DOWNLOAD START");

  const assets = this.getFilteredGridData() || this.state.GridData;

  if (!assets || assets.length === 0) {
    alert("No assets found");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");

  for (let i = 0; i < assets.length; i++) {
    const item = assets[i];
    const qrValue = this.getAssetQrValue(item);

    // 🔥 Container (single card per page)
    const container = document.createElement("div");
    container.style.width = "400px";
    container.style.height = "600px";
    container.style.position = "relative";
    container.style.background = "#fff";

    // ✅ Canva background (WITHOUT QR)
    const img = new Image();
    img.src = "/canva-template.png";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "absolute";

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    container.appendChild(img);

    // ✅ Dynamic QR
    const qrWrapper = document.createElement("div");

    qrWrapper.innerHTML = renderToStaticMarkup(<QRCode value={qrValue} size={264} />);

    qrWrapper.style.position = "absolute";
    qrWrapper.style.top = "101px";
    qrWrapper.style.left = "58px";
    qrWrapper.style.width = "284px";
    qrWrapper.style.height = "284px";
    qrWrapper.style.padding = "10px";
    qrWrapper.style.background = "#ffffff";

    container.appendChild(qrWrapper);

    // ✅ 🔥 Asset Name on Brown Bar
    const brownBox = document.createElement("div");
    const brownBoxLeft = 58;
    const brownBoxTop = (40.2 / 59.4) * 600;
    const brownBoxWidth = 284;
    const brownBoxHeight = (2.63 / 59.4) * 600;
    brownBox.style.position = "absolute";
    brownBox.style.top = `${brownBoxTop}px`;
    brownBox.style.left = `${brownBoxLeft}px`;
    brownBox.style.width = `${brownBoxWidth}px`;
    brownBox.style.height = `${brownBoxHeight}px`;
    brownBox.style.background = "#3f2a21";
    brownBox.style.zIndex = "1";

    const nameText = document.createElement("div");
    nameText.innerText = this.getAssetNameValue(item).toUpperCase();

    nameText.style.position = "absolute";
    nameText.style.top = `${brownBoxTop}px`;
    nameText.style.left = `${brownBoxLeft}px`;
    nameText.style.width = `${brownBoxWidth}px`;
    nameText.style.height = `${brownBoxHeight}px`;

    nameText.style.textAlign = "center";
    nameText.style.color = "#ffffff";
    nameText.style.fontSize = "13px";
    nameText.style.fontWeight = "bold";
    nameText.style.letterSpacing = "1px";
    nameText.style.lineHeight = `${brownBoxHeight}px`;
    nameText.style.overflow = "hidden";
    nameText.style.whiteSpace = "nowrap";
    nameText.style.textOverflow = "ellipsis";
    nameText.style.zIndex = "2";

    container.appendChild(brownBox);
    container.appendChild(nameText);

    document.body.appendChild(container);

    // wait render
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      
    });

    // ✅ reduce PDF size
    const imgData = canvas.toDataURL("image/jpeg", 0.7);

    if (i !== 0) pdf.addPage();

    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

    document.body.removeChild(container);
  }

  pdf.save("Assets_QR.pdf");
};

downloadAssetQRCode = async (item = {}) => {
  const qrValue = this.getAssetQrValue(item);

  if (!qrValue) {
    alert("No QR found");
    return;
  }

  const pdf = new jsPDF("p", "mm", "a4");

  const container = document.createElement("div");
  container.style.width = "400px";
  container.style.height = "600px";
  container.style.position = "relative";
  container.style.background = "#fff";

  const img = new Image();
  img.src = "/canva-template.png";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.position = "absolute";

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  container.appendChild(img);

  const qrWrapper = document.createElement("div");

  qrWrapper.innerHTML = renderToStaticMarkup(<QRCode value={qrValue} size={264} />);

  qrWrapper.style.position = "absolute";
  qrWrapper.style.top = "101px";
  qrWrapper.style.left = "58px";
  qrWrapper.style.width = "284px";
  qrWrapper.style.height = "284px";
  qrWrapper.style.padding = "10px";
  qrWrapper.style.background = "#ffffff";

  container.appendChild(qrWrapper);

  const brownBox = document.createElement("div");
  const brownBoxLeft = 58;
  const brownBoxTop = (40.2 / 59.4) * 600;
  const brownBoxWidth = 284;
  const brownBoxHeight = (2.63 / 59.4) * 600;
  brownBox.style.position = "absolute";
  brownBox.style.top = `${brownBoxTop}px`;
  brownBox.style.left = `${brownBoxLeft}px`;
  brownBox.style.width = `${brownBoxWidth}px`;
  brownBox.style.height = `${brownBoxHeight}px`;
  brownBox.style.background = "#3f2a21";
  brownBox.style.zIndex = "1";

  const nameText = document.createElement("div");
  nameText.innerText = this.getAssetNameValue(item).toUpperCase();

  nameText.style.position = "absolute";
  nameText.style.top = `${brownBoxTop}px`;
  nameText.style.left = `${brownBoxLeft}px`;
  nameText.style.width = `${brownBoxWidth}px`;
  nameText.style.height = `${brownBoxHeight}px`;

  nameText.style.textAlign = "center";
  nameText.style.color = "#ffffff";
  nameText.style.fontSize = "13px";
  nameText.style.fontWeight = "bold";
  nameText.style.letterSpacing = "1px";
  nameText.style.lineHeight = `${brownBoxHeight}px`;
  nameText.style.overflow = "hidden";
  nameText.style.whiteSpace = "nowrap";
  nameText.style.textOverflow = "ellipsis";
  nameText.style.zIndex = "2";

  container.appendChild(brownBox);
  container.appendChild(nameText);

  document.body.appendChild(container);

  await new Promise((resolve) => setTimeout(resolve, 300));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.7);

  pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

  document.body.removeChild(container);

  const assetName = this.getAssetNameValue(item) || "Asset";
  pdf.save(`${assetName}_QR.pdf`);
};

  normalizeDate = (value) => {
    if (!value) return "";
    const raw = String(value);
    return raw.length >= 10 ? raw.substring(0, 10) : raw;
  };

  getApiBoolean = (value, fallback = false) => {
    const normalized = this.normalizeBoolean(value);
    return typeof normalized === "boolean" ? normalized : fallback;
  };

  getAssetStatusPayload = () => {
    const rawStatus = String(this.state.status ?? "").trim();
    if (!rawStatus) {
      return { Status: false, AssetStatus: "" };
    }
    if (rawStatus === "true" || rawStatus === "false") {
      return { Status: rawStatus === "true", AssetStatus: "" };
    }
    return { Status: true, AssetStatus: rawStatus };
  };

  normalizeBoolean = (value) => {
    if (value === true || value === "true" || value === 1 || value === "1") return true;
    if (value === false || value === "false" || value === 0 || value === "0") return false;
    return "";
  };

  getRowDescription = (rowData = {}) =>
    rowData.Description || rowData.description || rowData.AssetDescription || rowData.assetDescription || rowData.Desc || "";

  getBoolLabel = (value) => {
    const boolVal = this.normalizeBoolean(value);
    if (boolVal === "") return "-";
    return boolVal ? "Yes" : "No";
  };

  getAssetQrValue = (item = {}) => {
    const qrValue = item?.QRCode || item?.QRcode || item?.QrCode || "";
    return String(qrValue || item?.Id || "").trim();
  };

  getAssetNameValue = (item = {}) =>
    String(item?.Name || item?.name || item?.AssetName || item?.assetName || "").trim();

  formatDisplayDate = (value) => {
    const normalized = this.normalizeDate(value);
    if (!normalized) return "-";
    const [year, month, day] = normalized.split("-");
    return year && month && day ? `${day}-${month}-${year}` : normalized;
  };

  getFileExtension = (fileName = "") => {
    const rawName = String(fileName || "").trim();
    if (!rawName || !rawName.includes(".")) return "";
    const ext = rawName.split(".").pop();
    return String(ext || "").trim().toLowerCase();
  };

  getDocumentFieldValue = (value) => {
    const normalized = String(value ?? "").trim();
    return normalized && normalized.toLowerCase() !== "null" && normalized.toLowerCase() !== "undefined"
      ? normalized
      : "";
  };

  getAmcDocumentValue = (item = {}) =>
    this.getDocumentFieldValue(item?.AMCFile) ||
    this.getDocumentFieldValue(item?.AmcFile) ||
    this.getDocumentFieldValue(item?.AMCdoc) ||
    this.getDocumentFieldValue(item?.AMCimage) ||
    this.getDocumentFieldValue(item?.AMCDocument) ||
    this.getDocumentFieldValue(item?.AmcDocument) ||
    "";

  getAmcFileValue = (item = {}) =>
    this.getDocumentFieldValue(item?.AMCFile) ||
    this.getDocumentFieldValue(item?.AmcFile) ||
    "";

  getAmcDocumentName = (item = {}) =>
    item?.AMCdocName ||
    item?.AMCimageName ||
    item?.AMCFileName ||
    item?.AmcFileName ||
    item?.AMCDocumentName ||
    item?.AmcDocumentName ||
    "";

  inferExtensionFromBase64 = (base64Payload = "") => {
    const raw = String(base64Payload || "").trim();
    if (!raw) return "";
    // Common "magic numbers" in base64 form
    if (raw.startsWith("JVBERi0")) return "pdf"; // %PDF
    if (raw.startsWith("/9j/")) return "jpg"; // JPEG
    if (raw.startsWith("iVBORw0KGgo")) return "png"; // PNG
    if (raw.startsWith("R0lGOD")) return "gif"; // GIF
    if (raw.startsWith("UklGR")) return "webp"; // WEBP (RIFF)
    return "";
  };

  getPreviewSrc = (fileData, ext = "png") => {
    if (!fileData) return "";
    const raw = String(fileData);
    if (raw.startsWith("data:") || raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }

    const inferredExt = this.inferExtensionFromBase64(raw);
    const requestedExt = String(ext || "").toLowerCase();
    const normalizedExt = (inferredExt && (!requestedExt || requestedExt === "png") ? inferredExt : requestedExt) || inferredExt || "png";
    const mimeType =
      normalizedExt === "pdf"
        ? "application/pdf"
        : `image/${normalizedExt === "jpg" ? "jpeg" : normalizedExt}`;
    return `data:${mimeType};base64,${raw}`;
  };

  escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  openDocumentUrl = (src) => {
    if (!src) return;
    if (src.startsWith("http://") || src.startsWith("https://")) {
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    // Chrome blocks opening data: URLs via target="_blank"; open in new window instead
    const win = window.open("", "_blank");
    if (!win) return;
    if (src.startsWith("data:application/pdf")) {
      win.document.write(
        `<html><body style="margin:0;padding:0"><embed src="${src}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0"></body></html>`
      );
    } else {
      win.document.write(
        `<html><body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${src}" style="max-width:100%;max-height:100vh;object-fit:contain"></body></html>`
      );
    }
    win.document.close();
  };

  getAssetStatusMeta = (item = {}) => {
    const rawStatus = item?.Status;
    const nextServiceDate = this.normalizeDate(item?.NextServiceDate);
    const today = new Date().toISOString().slice(0, 10);
    const rawServiceStatus = String(item?.ServiceStatus || item?.serviceStatus || "").trim();
    const serviceStatus = rawServiceStatus || (!nextServiceDate ? "Due" : nextServiceDate < today ? "Overdue" : "Upcoming");
    if (typeof rawStatus === "string" && rawStatus && rawStatus !== "true" && rawStatus !== "false") {
      return { label: rawStatus, key: rawStatus.toLowerCase().replace(/\s+/g, "-"), serviceStatus };
    }
    const boolStatus = this.normalizeBoolean(rawStatus);
    if (boolStatus === false) return { label: "Inactive", key: "inactive", serviceStatus };
    if (boolStatus === true) return { label: "Active", key: "running", serviceStatus };
    return { label: "-", key: "inactive", serviceStatus };
  };

  getAssetTypeLabel = (item = {}) => {
    const rawType = String(item?.AssetType || item?.Type || item?.LeaseType || "").trim().toLowerCase();
    if (!rawType) return "";
    if (rawType.includes("rented in") || rawType === "in" || rawType.includes("inbound")) return "Rented in";
    if (rawType.includes("rented out") || rawType === "out" || rawType.includes("outbound")) return "Rented Out";
    if (rawType.includes("house") || rawType.includes("in house") || rawType.includes("owned")) return "In house";
    return String(item?.AssetType || item?.Type || item?.LeaseType || "").trim();
  };

  matchesServiceStatus = (item = {}, selectedStatus = "") => {
    if (!selectedStatus) return true;
    const current = String(this.getAssetStatusMeta(item).serviceStatus || "").trim().toLowerCase();
    const selected = String(selectedStatus || "").trim().toLowerCase();
    if (!current) return false;
    return current === selected;
  };

  getModel = (type, overrides = {}) => [
    (() => {
      const statusPayload = this.getAssetStatusPayload();
      return {
      Id: this.state.Id,
      Name: this.state.Name,
      Description: this.state.Description,
      QRCode: this.state.QRCode,
      AssetType: this.state.AssetType,
      Manufacturer: this.state.ManufacturerName,
      AssetModel: this.state.AssetModel,
      IsMoveable: this.getApiBoolean(this.state.IsMoveable),
      IsRented: this.getApiBoolean(this.state.IsRented),
      Flag: type,
      AssetImage: this.state.AssetImage,
      LastServiceDate: this.state.LastServiceDate,
      NextServiceDate: this.state.NextServiceDate,
      IsRentable: this.getApiBoolean(this.state.IsRentable),
      AssetValue: this.state.AssetValue,
      Capacity: this.state.Capacity,
      AMCdoc: this.state.AMCimage,
      AMCDateFrom: this.state.amcDateFrom,
      AMCDateTo: this.state.amcDateTo,
      WarrantyDocument: this.state.warrantyImage,
      AssetStatus: statusPayload.AssetStatus,
      Status: statusPayload.Status,
      Category: this.state.category,
      Location: this.state.location,
      serviceReminderDay: this.state.serviceReminderDay,
      PropertyId: Number(this.props.PropertyId) || 0,
      propertyId: Number(this.props.PropertyId) || 0,
      PurchaseDate: this.state.PurchaseDate,
      WarrantyDate: this.state.WarrantyDate,
      ...overrides,
      };
    })(),
  ];

  loadHomagePageData = () => {
    const propertyId = Number(this.props.PropertyId);
    if (!(propertyId > 0)) {
      this.setState({ GridData: [], DueGridData: [], isLoading: false, selectedRowId: null, PageMode: "Home", nextAddAssetId: 0 });
      return;
    }

    this.setState({ isLoading: true });
      this.ApiProviderr.manageDocumentTypeMaster(this.getModel(), "R")
      .then((resp) => {
        if (!resp.ok || resp.status !== 200) return null;
        return resp.json().then((rData) => {
          const isDirectList = Array.isArray(rData);
          const noServiceDateAssets = isDirectList ? [] : Array.isArray(rData?.NoServiceDate) ? rData.NoServiceDate : [];
          const dueServiceAssets = isDirectList ? rData : Array.isArray(rData?.PassedServiceDates) ? rData.PassedServiceDates : [];
          const upcomingServiceAssets = isDirectList ? [] : Array.isArray(rData?.UpcomingServiceDates) ? rData.UpcomingServiceDates : [];
          const merged = [...noServiceDateAssets, ...dueServiceAssets, ...upcomingServiceAssets].map((item) => {
            const nextServiceDate = this.normalizeDate(item?.NextServiceDate);
            const statusMeta = this.getAssetStatusMeta(item);
            const displayDate = this.formatDisplayDate(nextServiceDate);

            return {
              ...item,
              LastServiceDate: this.normalizeDate(item?.LastServiceDate),
              NextServiceDate: nextServiceDate,
              NextServiceDateDisplay: displayDate,
              Location: item?.Location || item?.location || "",
              StatusDisplay: `<span class="asset-table-status asset-table-status-${statusMeta.key}">${statusMeta.label}</span>`,
            };
          });

           // Sort: Upcoming (nearest first) at top, then overdue.
           const today = new Date().toISOString().slice(0, 10);
           merged.sort((a, b) => {
             const dateA = a.NextServiceDate || "";
             const dateB = b.NextServiceDate || "";
             const isUpcomingA = !!dateA && dateA >= today;
             const isUpcomingB = !!dateB && dateB >= today;

             if (isUpcomingA !== isUpcomingB) return isUpcomingA ? -1 : 1;
             if (!dateA && !dateB) return 0;
             if (!dateA) return 1;
             if (!dateB) return -1;
             return dateA.localeCompare(dateB);
           });

          this.setState({
            GridData: merged,
            DueGridData: [...noServiceDateAssets, ...dueServiceAssets],
            isLoading: false,
            nextAddAssetId: this.getNextAssetId(merged),
          });
        });
      })
      .catch(() => this.setState({ isLoading: false }));
  };

  onPagechange = () => { };

  findItem = (id) => this.state.GridData.find((item) => String(item.Id) === String(id)) || null;

  getNextAssetId = (rows = this.state.GridData) => {
    const ids = (rows || []).map((item) => Number(item?.Id)).filter((id) => Number.isFinite(id));
    const maxId = ids.length ? Math.max(...ids) : 0;
    return maxId + 1;
  };

  generateAddAssetQr = () => {
    const nextId = this.state.Id || this.state.nextAddAssetId || this.getNextAssetId();
    const qrValue = String(nextId || "").trim();
    if (!qrValue) return;
    this.setState({
      Id: nextId,
      QRCode: qrValue,
      showAddQrPreview: false,
    });
  };

  Addnew = () => {
    this.setState(
      {
        PageMode: "Add",
        selectedRowId: null,
        Id: this.state.nextAddAssetId || this.getNextAssetId(),
        AssetType: "",
        ManufacturerName: "",
        AssetModel: "",
        IsMoveable: false,
        IsRented: false,
        Name: "",
        Description: "",
        QRCode: "",
        ImageData: null,
        AssetImage: "",
        ImageExt: "",
        assetImageFileName: "",
        LastServiceDate: "",
        NextServiceDate: "",
        IsRentable: false,
        AssetValue: 0,
        Capacity: "",
        AMCdoc: null,
        AMCimage: "",
        amcFileName: "",
        amcDateFrom: "",
        amcDateTo: "",
        amcTotalAmount: "",
        amcContractType: "",
        showAmcDetailsForm: false,
        WarrantyDocument: null,
        warrantyImage: "",
        warrantyFileName: "",
        status: false,
        category: "",
        location: "",
        serviceReminderDay: "",
        PurchaseDate: "",
        WarrantyDate: "",
        showAddQrPreview: false,
      },
      () => CreateValidator()
    );
  };

  setFormData = (rowData, mode) => {
    if (!rowData) return;
    const assetQrValue = this.getAssetQrValue(rowData);
    this.setState({
      PageMode: mode,
      selectedRowId: rowData.Id,
      Id: rowData.Id,
      Name: rowData.Name || "",
      Description: this.getRowDescription(rowData),
      QRCode: assetQrValue,
      ManufacturerName: rowData.Manufacturer || "",
      AssetModel: rowData.AssetModel || "",
      IsMoveable: String(this.normalizeBoolean(rowData.IsMoveable)),
      IsRented: String(this.normalizeBoolean(rowData.IsRented)),
      LastServiceDate: this.normalizeDate(rowData.LastServiceDate),
      NextServiceDate: this.normalizeDate(rowData.NextServiceDate),
      IsRentable: String(this.normalizeBoolean(rowData.IsRentable)),
      AssetValue: rowData.AssetValue || 0,
      Capacity: rowData.Capacity ?? rowData.capacity ?? "",
      AssetType: rowData.AssetType || "",
      AssetImage: rowData.AssetImage || rowData.Image || "",
      AMCimage: this.getAmcDocumentValue(rowData),
      amcDateFrom: this.normalizeDate(rowData.AMCDateFrom || rowData.AmcDateFrom || rowData.DateFrom),
      amcDateTo: this.normalizeDate(rowData.AMCDateTo || rowData.AmcDateTo || rowData.DateTo),
      amcTotalAmount: rowData.AMCTotalAmount || rowData.AmcTotalAmount || rowData.TotalAmount || "",
      amcContractType: rowData.AMCContractType || rowData.AmcContractType || rowData.ContractType || "",
      warrantyImage: rowData.WarrantyDocument || rowData.warrantyImage || "",
      assetImageFileName:
        rowData.AssetImageName ||
        rowData.ImageName ||
        ((rowData.AssetImage || rowData.Image) ? `Existing image${rowData.ImageExt ? `.${rowData.ImageExt}` : ""}` : ""),
      amcFileName: this.getAmcDocumentName(rowData) || (this.getAmcDocumentValue(rowData) ? "Existing document" : ""),
      warrantyFileName:
        rowData.WarrantyDocumentName ||
        rowData.warrantyImageName ||
        ((rowData.WarrantyDocument || rowData.warrantyImage) ? "Existing document" : ""),
      showImagefiletype: rowData.ImageExt || null,
      showImagefile: rowData.Image || null,
      extension: rowData.ImageExt || null,
      status: String(this.normalizeBoolean(rowData.Status)),
      category: rowData.Category || "",
      location: rowData.Location || "",
        serviceReminderDay: rowData.serviceReminderDay || "",
        PurchaseDate: this.normalizeDate(rowData.PurchaseDate),
        WarrantyDate: this.normalizeDate(rowData.WarrantyDate),
        showAddQrPreview: false,
    });
  };

  ongridedit = (id) => {
    CreateValidator();
    this.setFormData(this.findItem(id), "Edit");
  };

  onGridView = (id) => this.setFormData(this.findItem(id), "View");
  onGridRowSelect = (id) => {
    if (String(id) === String(this.state.selectedRowId)) {
      if (this.state.PageMode === "View") {
        this.closeSidePanel();
      } else {
        this.setState({ PageMode: "View" });
      }
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
      this.setState({ ImageData: selected, assetImageFileName: selected.name });
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
      this.setState({ AMCdoc: selected, amcFileName: selected.name });
      return;
    }
    appCommon.showtextalert(`${selected.name} Invalid file type, Please select only ${valid.join(", ")}`, "", "error");
  };

  onWarrantyFileChange = (event) => {
    const selected = event?.target?.files?.[0];
    if (!selected) return;
    const valid = ["jpg", "jpeg", "png", "pdf"];
    const extension = selected.name.substring(selected.name.lastIndexOf(".") + 1).toLowerCase();
    if (valid.includes(extension)) {
      this.setState({ WarrantyDocument: selected, warrantyFileName: selected.name });
      return;
    }
    appCommon.showtextalert(`${selected.name} Invalid file type, Please select only ${valid.join(", ")}`, "", "error");
  };

  handleTabChange = (tab) => {
  this.setState({
    activeTab: tab,
    PageMode: "Home",
    selectedRowId: null
  });
};

  openAmcModal = () => {
    const asset = this.getSelectedAssetRecord();
    if (!asset) return;
    this.setState({
      showAmcModal: true,
      AMCdoc: null,
      AMCimage: this.getAmcDocumentValue(asset),
      amcDateFrom: this.normalizeDate(asset.AMCDateFrom || asset.AmcDateFrom || asset.DateFrom),
      amcDateTo: this.normalizeDate(asset.AMCDateTo || asset.AmcDateTo || asset.DateTo),
      amcTotalAmount: asset.AMCTotalAmount || asset.AmcTotalAmount || asset.TotalAmount || "",
      amcContractType: asset.AMCContractType || asset.AmcContractType || asset.ContractType || "",
      amcFileName: this.getAmcDocumentName(asset) || (this.getAmcDocumentValue(asset) ? "Existing document" : ""),
    });
  };

  closeAmcModal = () => this.setState({ showAmcModal: false });

  handleAmcSave = async () => {
    const asset = this.getSelectedAssetRecord();
    if (!asset) return;

    let amcFile = this.state.AMCimage;
    if (this.state.AMCdoc?.name && this.state.AMCdoc?.size) {
      amcFile = await toBase64(this.state.AMCdoc);
    }

    try {
      const response = await saveAssetAMC({
        Id: Number(asset.Id) || 0,
        AMCFromDate: this.state.amcDateFrom,
        AMCToDate: this.state.amcDateTo,
        AMCTotalAmount: Number(this.state.amcTotalAmount) || 0,
        AMCContractType: this.state.amcContractType,
        AMCFile: amcFile || "",
      });

      this.setState(
        {
          showAmcModal: false,
          AMCimage: this.getDocumentFieldValue(response?.AMCFile) || amcFile || "",
          amcFileName: response?.AMCFile ? String(response.AMCFile).split(/[\\/]/).pop() : this.state.amcFileName,
        },
        this.loadHomagePageData
      );
      appCommon.showtextalert(response?.Message || "AMC Details Saved Successfully", "", "success");
    } catch (error) {
      appCommon.showtextalert("Unable to save AMC details", "", "error");
    }
  };

  handleSave = async () => {
    if (this.state.PageMode === "Add" && !String(this.state.QRCode || "").trim()) {
      appCommon.showtextalert("Please generate QR code before saving.", "", "error");
      return;
    }

    let assetImage = this.state.AssetImage;
    let imageExt = this.state.ImageExt;
    let amcImage = this.state.AMCimage;
    let warrantyImage = this.state.warrantyImage;

    try {
      assetImage = await normalizeUploadValue(this.state.AssetImage, this.state.ImageData);
      amcImage = await normalizeUploadValue(this.state.AMCimage, this.state.AMCdoc);
      warrantyImage = await normalizeUploadValue(this.state.warrantyImage, this.state.WarrantyDocument);
    } catch (error) {
      appCommon.showtextalert("Unable to prepare uploaded document. Please reselect the file and try again.", "", "error");
      return;
    }

    if (this.state.ImageData?.name && this.state.ImageData?.size) {
      imageExt = this.state.ImageData.name.substring(this.state.ImageData.name.lastIndexOf(".") + 1);
    }

    if (ValidateControls()) {
      const type = this.state.PageMode === "Add" ? "I" : "U";
      this.mangaeSave(this.getModel(type, { AssetImage: assetImage, ImageExt: imageExt, AMCdoc: amcImage, WarrantyDocument: warrantyImage }), type);
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
        IsRented: false,
        Name: "",
        Description: "",
        QRCode: "",
        ImageData: null,
        AssetImage: "",
        ImageExt: "",
        assetImageFileName: "",
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
        amcFileName: "",
        amcDateFrom: "",
        amcDateTo: "",
        amcTotalAmount: "",
        amcContractType: "",
        showAmcDetailsForm: false,
        WarrantyDocument: null,
        warrantyImage: "",
        warrantyFileName: "",
        status: false,
        category: "",
        location: "",
        serviceReminderDay: "",
        PurchaseDate: "",
        WarrantyDate: "",
        showAmcModal: false,
        showAddQrPreview: false,
      },
      this.loadHomagePageData
    );
  };

  closeSidePanel = () => this.setState({ PageMode: "Home", selectedRowId: null });
  closeSuccessModal = () => this.setState({ showSuccessModal: false, successType: "" });
  resetFilters = () => {
    this.setState({
      searchTerm: "",
      filterCapacity: "",
      filterVendor: "",
      filterManufacturer: "",
      filterStatus: "",
      filterServiceStatus: "",
      filterType: "",
    });
  };

  closeFilterPopup = () => this.setState({ showFilterPanel: false });

  renderFilterPopup = () => {
    if (!this.state.showFilterPanel) return null;

    return (
      <div className="asset-inline-filters">
        <div className="asset-filter-header">
          <span className="asset-filter-title">Filters</span>
          <button className="asset-filter-reset" type="button" onClick={this.resetFilters}>
            <i className="fa fa-times" />
            Reset All
          </button>
        </div>

        <div className="asset-filter-grid">
          <div className="asset-filter-field">
            <label>Vendor</label>
            <CustomDropdown 
              variant="long" 
              value={this.state.filterVendor} 
              onChange={(e) => this.setState({ filterVendor: e.target.value })} 
              placeholder="Enter name" 
              options={this.getVendorOptions().map(v => ({ label: v, value: v }))} 
            />
          </div>
          <div className="asset-filter-field">
            <label>Manufacturer</label>
            <CustomDropdown 
              variant="long" 
              value={this.state.filterManufacturer} 
              onChange={(e) => this.setState({ filterManufacturer: e.target.value })} 
              placeholder="Enter name" 
              options={this.getManufacturerOptions().map(m => ({ label: m, value: m }))} 
            />
          </div>

          <div className="asset-filter-field asset-filter-field-full">
            <label>Type</label>
            <div className="asset-filter-chip-row">
              {["Rented in", "Rented Out", "In house"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`asset-filter-chip ${this.state.filterType === item ? "active" : ""}`}
                  onClick={() => this.setState({ filterType: this.state.filterType === item ? "" : item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="asset-filter-field asset-filter-field-full">
            <label>Status</label>
            <div className="asset-filter-chip-row">
              {["Active", "Servicing", "Inactive"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`asset-filter-chip ${this.state.filterStatus === item ? "active" : ""}`}
                  onClick={() => this.setState({ filterStatus: this.state.filterStatus === item ? "" : item })}
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
                  className={`asset-filter-chip ${this.state.filterServiceStatus === item ? "active" : ""}`}
                  onClick={() => this.setState({ filterServiceStatus: this.state.filterServiceStatus === item ? "" : item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="asset-filter-popup-footer">
          <button className="asset-filter-apply" type="button" onClick={this.closeFilterPopup}>
            Apply filters
          </button>
        </div>
      </div>
    );
  };

  getFilteredGridData = () =>
    (this.state.GridData || []).filter((item) => {
      const search = String(this.state.searchTerm || "").toLowerCase().trim();
      const rowId = String(item?.Id ?? item?.AssetID ?? "").toLowerCase();
      const rowName = String(item?.Name || item?.name || item?.AssetName || "").toLowerCase();
      const rowType = String(item?.AssetType || "");
      const rowCategory = String(item?.Category || "").toLowerCase();
      const rowLocation = String(item?.Location || "").toLowerCase();
      const rowCapacity = String(item?.Capacity ?? item?.capacity ?? "").toLowerCase();
      const rowNextServiceDate = this.normalizeDate(item?.NextServiceDate);

      return (
        (!search || rowId.includes(search) || rowName.includes(search)) &&
        (!this.state.filterManufacturer || String(item?.Manufacturer || "").toLowerCase().includes(this.state.filterManufacturer.toLowerCase())) &&
        (!this.state.filterVendor || String(item?.Vendor || "").toLowerCase().includes(this.state.filterVendor.toLowerCase())) &&
        (!this.state.filterStatus || this.getAssetStatusMeta(item).label === this.state.filterStatus) &&
        (!this.state.filterType || this.getAssetTypeLabel(item) === this.state.filterType) &&
        this.matchesServiceStatus(item, this.state.filterServiceStatus)
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
      IsRented: this.getBoolLabel(item.IsRented),
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

  exportOwnedAssetsToExcel = (rows) => {
    const exportRows = this.getExportData(rows);
    const headers = [
      "Id",
      "Name",
      "Description",
      "QRCode",
      "AssetType",
      "Manufacturer",
      "AssetModel",
      "IsMoveable",
      "IsRented",
      "LastServiceDate",
      "NextServiceDate",
      "IsRentable",
      "AssetValue",
      "Capacity",
      "Status",
      "Category",
      "Location",
      "ServiceReminderDay",
      "Image",
    ];

    const tableRows = exportRows
      .map((row, index) => {
        const sourceRow = rows?.[index] || {};
        const imageSource = sourceRow.AssetImage || sourceRow.Image;
        const imageExt = sourceRow.ImageExt || sourceRow.extension || "png";
        const previewSrc = imageSource ? this.getPreviewSrc(imageSource, imageExt) : "";

        return `
          <tr style="height:90px;">
            <td>${this.escapeHtml(row.Id)}</td>
            <td>${this.escapeHtml(row.Name)}</td>
            <td>${this.escapeHtml(row.Description)}</td>
            <td>${this.escapeHtml(row.QRCode)}</td>
            <td>${this.escapeHtml(row.AssetType)}</td>
            <td>${this.escapeHtml(row.Manufacturer)}</td>
            <td>${this.escapeHtml(row.AssetModel)}</td>
            <td>${this.escapeHtml(row.IsMoveable)}</td>
            <td>${this.escapeHtml(row.IsRented)}</td>
            <td>${this.escapeHtml(row.LastServiceDate)}</td>
            <td>${this.escapeHtml(row.NextServiceDate)}</td>
            <td>${this.escapeHtml(row.IsRentable)}</td>
            <td>${this.escapeHtml(row.AssetValue)}</td>
            <td>${this.escapeHtml(row.Capacity)}</td>
            <td>${this.escapeHtml(row.Status)}</td>
            <td>${this.escapeHtml(row.Category)}</td>
            <td>${this.escapeHtml(row.Location)}</td>
            <td>${this.escapeHtml(row.ServiceReminderDay)}</td>
            <td style="width:90px;height:90px;text-align:center;vertical-align:middle;overflow:hidden;padding:4px;">
              ${previewSrc ? `<div style="width:80px;height:80px;overflow:hidden;margin:0 auto;display:flex;align-items:center;justify-content:center;"><img src="${previewSrc}" alt="" width="70" height="70" style="display:block;width:70px;height:70px;margin:0 auto;border:none;" /></div>` : ""}
            </td>
          </tr>
        `;
      })
      .join("");

    const tableHeaders = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join("");
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charSet="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Owned Assets</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #d0d7de; padding: 8px; vertical-align: middle; overflow: hidden; }
            th { background: #f3f4f6; font-weight: 600; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AssetsMaster.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  getSelectedAssetRecord = () => (this.state.selectedRowId ? this.findItem(this.state.selectedRowId) : null);

  getVendorOptions = () =>
    Array.from(
      new Set(
        (this.state.GridData || [])
          .map((item) => String(item?.Vendor || item?.Distributor || item?.VendorName || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

  getManufacturerOptions = () =>
    Array.from(
      new Set(
        (this.state.GridData || [])
          .map((item) => String(item?.Manufacturer || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

  getPaginatedRows = (rows) => {
    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil((rows || []).length / pageSize));
    const currentPage = Math.min(this.state.currentPage || 1, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    return {
      rows: (rows || []).slice(startIndex, startIndex + pageSize),
      currentPage,
      totalPages,
      totalRows: (rows || []).length,
    };
  };

  renderTablePagination = (currentPage, totalPages, totalRows, onPageChange) => {
    if (totalRows <= 15) return null;

    return (
      <div className="asset-owned-pagination">
        <span>{`Showing ${(currentPage - 1) * 15 + 1}-${Math.min(currentPage * 15, totalRows)} of ${totalRows}`}</span>
        <div className="asset-owned-pagination-controls">
          <button type="button" className="asset-owned-page-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            <i className="fa fa-angle-left" aria-hidden="true" />
          </button>
          <span className="asset-owned-page-number">{currentPage}</span>
          <button type="button" className="asset-owned-page-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            <i className="fa fa-angle-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  renderOwnedAssetsTable = (rows) => {
    const paginated = this.getPaginatedRows(rows);

    return (
    <div className={`asset-master-table-wrap asset-master-table-wrap-owned ${this.state.selectedRowId ? "has-selection" : ""}`.trim()}>
      <table className="table asset-owned-table custTable table-hover mb-0">
          <thead>
            <tr>
              <th className="col-id" style={{ width: "70px" }}>ID</th>
              <th className="col-name">Name</th>
              <th className="col-location">Location</th>
              <th className="col-date" style={{ width: "110px" }}>Service due</th>
              <th className="col-status" style={{ width: "100px" }}>Status</th>
              <th className="col-actions" style={{ width: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.rows.length ? (
              paginated.rows.map((asset) => {
                const statusMeta = this.getAssetStatusMeta(asset);
                const isSelected = String(this.state.selectedRowId) === String(asset.Id);
                const isOverdueFiltered = this.state.filterServiceStatus === "Overdue";
                return (
                  <tr
                    key={asset.Id}
                    className={`${isSelected ? "grid-selected-row active" : ""} ${isOverdueFiltered ? "asset-overdue-row" : ""}`.trim()}
                    onClick={() => this.onGridRowSelect(asset.Id)}
                  >
                    <td className="col-id">{asset.Id || "-"}</td>
                    <td className="col-name">{asset.Name || "-"}</td>
                    <td className="col-location">{asset.Location || asset.location || "-"}</td>
                    <td className="col-date">{this.formatDisplayDate(asset.NextServiceDate)}</td>
                    <td className="col-status">
                      <span className={`asset-table-status asset-table-status-${statusMeta.key}`}>{statusMeta.label}</span>
                    </td>
                    <td className="col-actions">
                      <div className="asset-owned-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="asset-owned-icon-btn" title="Edit" onClick={() => this.ongridedit(asset.Id)}>
                          <i className="fa fa-pencil-square-o" aria-hidden="true" />
                        </button>
                        <button type="button" className="asset-owned-icon-btn" title="Delete" onClick={() => this.onGridDelete(asset.Id)}>
                          <i className="fa fa-trash-o" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="asset-owned-empty-state">No assets found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {this.renderTablePagination(paginated.currentPage, paginated.totalPages, paginated.totalRows, (page) => this.setState({ currentPage: page }))}
    </div>
  );
  };

  renderReadOnlyField = (label, value, extraClass = "") => (
    <div className={`asset-info-item ${extraClass}`.trim()}>
      <span className="asset-info-label">{label}</span>
      <span className="asset-info-value">{value || "-"}</span>
    </div>
  );

  renderAssetDetailsPanel = () => {
    const asset = this.getSelectedAssetRecord();
    if (!asset) return null;
    const assetQrValue = this.getAssetQrValue(asset);
    const statusMeta = this.getAssetStatusMeta(asset);
    const imageSource = this.getPreviewSrc(
      this.state.AssetImage || asset.AssetImage || this.state.showImagefile || asset.Image,
      this.state.showImagefiletype || this.state.extension || asset.ImageExt || "png"
    );
    const amcExt = this.getFileExtension(this.state.amcFileName) || this.getFileExtension(this.getAmcDocumentName(asset));
    const warrantyExt =
      this.getFileExtension(this.state.warrantyFileName) ||
      this.getFileExtension(asset.WarrantyDocumentName || asset.warrantyImageName || "");
    const amcSource = this.getPreviewSrc(this.getAmcFileValue(asset), amcExt);
    const warrantySource = this.getPreviewSrc(
      this.state.warrantyImage || asset.WarrantyDocument || asset.warrantyImage,
      warrantyExt
    );

    return (
      <div className="asset-side-panel asset-details-view-panel">
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
                <span className="asset-info-value">{this.getRowDescription(asset) || "-"}</span>
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
               <div className="asset-details-row asset-details-location-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Location</span>
                <span className="asset-info-value">{asset.Location || asset.location || "-"}</span>
              </div>
            </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Reminder</span>
                <span className="asset-info-value">{asset.serviceReminderDay ? `${asset.serviceReminderDay} day(s)` : "No reminder set"}</span>
              </div>
              
              <div className="asset-info-item">
                <span className="asset-info-label">Is Movable</span>
                <span className="asset-info-value">{this.getBoolLabel(asset.IsMoveable)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Is Rentable</span>
                <span className="asset-info-value">{this.getBoolLabel(asset.IsRentable)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Is Rented</span>
                <span className="asset-info-value">{this.getBoolLabel(asset.IsRented)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Date of Purchase</span>
                <span className="asset-info-value">{this.formatDisplayDate(asset.PurchaseDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Value</span>
                <span className="asset-info-value">{asset.AssetValue ? `₹${asset.AssetValue}` : "₹0"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Warranty Expiry</span>
                <span className="asset-info-value">{this.formatDisplayDate(asset.WarrantyDate)}</span>
              </div>
            </div>

           

            <div className="asset-details-docs-section">
              <div className="asset-qr-preview-box">
                <div className="asset-qr-wrapper">
                  {assetQrValue ? (
                    <QRCode
                      value={assetQrValue}
                      size={72}
                      id={`qr-${asset.Id}`}
                    />
                  ) : (
                    <span>No QR</span>
                  )}
                </div>
                {assetQrValue ? (
                  <button
                    type="button"
                    className="asset-doc-link-text asset-download-qr-link"
                    onClick={() => this.downloadAssetQRCode(asset)}
                  >
                   
                    Download QR
                     <i className="fa fa-download" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="asset-doc-links-stack asset-doc-links-stack-view">
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-picture-o" />
                  </div>
                  {imageSource ? (
                    <button
                      type="button"
                      className="asset-doc-link-text"
                      onClick={() => this.openDocumentUrl(imageSource)}
                    >Asset photo</button>
                  ) : (
                    <span className="asset-doc-link-text disabled">Asset photo</span>
                  )}
                </div>
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-file-text-o" />
                  </div>
                  {warrantySource ? (
                    <button
                      type="button"
                      className="asset-doc-link-text"
                      onClick={() => this.openDocumentUrl(warrantySource)}
                    >Warranty Card</button>
                  ) : (
                    <span className="asset-doc-link-text disabled">Warranty Card</span>
                  )}
                </div>
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-file-text-o" />
                  </div>
                  {amcSource ? (
                    <button
                      type="button"
                      className="asset-doc-link-text"
                      onClick={() => this.openDocumentUrl(amcSource)}
                    >AMC Contract</button>
                  ) : (
                    <span className="asset-doc-link-text disabled">AMC Contract</span>
                  )}
                </div>
                <div className="asset-doc-link-item">
                  <div className="asset-doc-icon-wrapper">
                    <i className="fa fa-plus-square-o" />
                  </div>
                  <button type="button" className="asset-doc-link-text" onClick={this.openAmcModal}>
                    Add AMC details
                  </button>
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


  renderAssetForm = () => {
    const isEditMode = this.state.PageMode === "Edit";
    const assetQrValue = this.getAssetQrValue({ QRCode: this.state.QRCode, Id: this.state.Id });
    return (
      <div className={`asset-side-panel asset-side-panel-form ${isEditMode ? "asset-side-panel-form-edit" : ""}`.trim()}>
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
              {assetQrValue ? (
                <QRCode value={assetQrValue} size={120} />
              ) : (
                <span>No QR</span>
              )}
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
              <CustomDropdown
                variant="short"
                value={this.state.status}
                onChange={(e) => this.setState({ status: e.target.value })}
                placeholder="Select status"
                options={[
                  { label: "Active", value: "true" },
                  { label: "Inactive", value: "false" },
                  { label: "Servicing", value: "Servicing" }
                ]}
              />
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

            <div className="asset-form-row-two-col">
              <div className="form-group asset-form-group-custom">
                <label>Last serviced</label>
                <CustomDatePicker value={this.state.LastServiceDate} onChange={(e) => this.setState({ LastServiceDate: e.target.value })} />
              </div>
              <div className="form-group asset-form-group-custom">
                <label>Next service</label>
                <CustomDatePicker value={this.state.NextServiceDate} onChange={(e) => this.setState({ NextServiceDate: e.target.value })} />
              </div>
            </div>

            <div className="asset-form-row-two-col">
              <div className="form-group asset-form-group-custom">
                <label>Reminder</label>
                <input type="text" className="form-control" value={this.state.serviceReminderDay} onChange={(e) => this.setState({ serviceReminderDay: e.target.value })} />
              </div>
              <div className="form-group asset-form-group-custom">
                <label>Value</label>
                <input type="text" className="form-control" value={this.state.AssetValue} onChange={(e) => this.setState({ AssetValue: e.target.value })} />
              </div>
            </div>

            <div className="asset-form-row-two-col">
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
                <label>Is Rented</label>
                <RadioButtonGroup
                  name="IsRented"
                  selectedValue={String(this.state.IsRented)}
                  onChange={(e) => this.setState({ IsRented: e.target.value })}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              </div>
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Location</label>
              <input type="text" className="form-control" value={this.state.location} onChange={(e) => this.setState({ location: e.target.value })} />
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Asset image</label>
              <div className="asset-file-input-wrapper">
                <input type="text" className="form-control" value={this.state.assetImageFileName || ""} readOnly />
                <i className="fa fa-picture-o asset-file-icon" />
                <input type="file" className="asset-file-hidden" onChange={this.onFileChange} />
              </div>
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Warranty document</label>
              <div className="asset-file-input-wrapper">
                <input type="text" className="form-control" value={this.state.warrantyFileName || ""} readOnly />
                <i className="fa fa-file-text-o asset-file-icon" />
                <input type="file" className="asset-file-hidden" onChange={this.onWarrantyFileChange} />
              </div>
            </div>

            <div className="form-group asset-form-group-custom">
              <label>AMC contract</label>
              <div className="asset-file-input-wrapper">
                <input type="text" className="form-control" value={this.state.amcFileName || ""} readOnly />
                <i className="fa fa-file-text-o asset-file-icon" />
                <input type="file" className="asset-file-hidden" onChange={this.onAMCFileChange} />
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
    const nextAssetId = this.state.Id || this.state.nextAddAssetId || this.getNextAssetId();
    const addAssetQrValue = String(this.state.QRCode || "").trim();
    const canViewAddQr = Boolean(addAssetQrValue);

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
          </div>

          <div className="asset-add-body">
            <div className="asset-add-id-row">
              <div className="asset-add-id-left">
                <span className="asset-add-id-label">ID</span>
                <span className="asset-add-id-value">{nextAssetId ? `#${nextAssetId}` : "-"}</span>
              </div>
              <button
                type="button"
                className="asset-add-generate"
                onClick={() => {
                  if (!canViewAddQr) {
                    this.generateAddAssetQr();
                    return;
                  }
                  this.setState((prev) => ({ showAddQrPreview: !prev.showAddQrPreview }));
                }}
              >
                <i className="fa fa-qrcode" aria-hidden="true" />
                {!canViewAddQr ? "Generate QR code" : this.state.showAddQrPreview ? "Hide QR code" : "View QR code"}
              </button>
            </div>

            {canViewAddQr ? (
              <div className="asset-add-qr-block">
                {this.state.showAddQrPreview ? (
                  <div className="asset-add-qr-preview">
                    <QRCode value={addAssetQrValue} size={84} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="asset-add-grid">
              <div className="form-group asset-form-group-custom">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add name"
                  value={this.state.Name}
                  onChange={(e) => this.setState({ Name: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Status</label>
                <CustomDropdown
                  variant="short"
                  value={this.state.status}
                  onChange={(e) => this.setState({ status: e.target.value })}
                  placeholder="Input status"
                  options={[
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                    { label: "Servicing", value: "Servicing" }
                  ]}
                />
              </div>

              <div className="form-group asset-form-group-custom asset-add-span-2">
                <label>Description</label>
                <textarea
                  rows="3"
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
                <CustomDatePicker value={this.state.LastServiceDate} onChange={(e) => this.setState({ LastServiceDate: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Next service</label>
                <CustomDatePicker value={this.state.NextServiceDate} onChange={(e) => this.setState({ NextServiceDate: e.target.value })} />
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
                <label>Is Rented</label>
                <RadioButtonGroup
                  name="IsRented"
                  selectedValue={String(this.state.IsRented)}
                  onChange={(e) => this.setState({ IsRented: e.target.value })}
                  options={[
                    { label: "Yes", value: "true" },
                    { label: "No", value: "false" },
                  ]}
                />
              </div>


              <div className="form-group asset-form-group-custom">
                <label>Service reminder</label>
                <CustomDropdown
                  variant="short"
                  value={this.state.serviceReminderDay}
                  onChange={(e) => this.setState({ serviceReminderDay: e.target.value })}
                  placeholder="Select reminder"
                  options={[
                    { label: "One Day Prior", value: "1" },
                    { label: "One Week Prior", value: "7" },
                    { label: "15 Days Prior", value: "15" },
                    { label: "One Month Prior", value: "30" }
                  ]}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Location</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Location"
                  value={this.state.location} 
                  onChange={(e) => this.setState({ location: e.target.value })} 
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Date of Purchase</label>
                <CustomDatePicker value={this.state.PurchaseDate} onChange={(e) => this.setState({ PurchaseDate: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Value</label>
                <div className="asset-input-icon-wrapper">
                  <span className="asset-input-icon">₹</span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder=""
                    value={this.state.AssetValue} 
                    onChange={(e) => this.setState({ AssetValue: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Warranty date</label>
                <CustomDatePicker value={this.state.WarrantyDate} onChange={(e) => this.setState({ WarrantyDate: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Warranty document</label>
                <div className="asset-file-input-wrapper">
                  <input type="text" className="form-control" placeholder="Upload file" value={this.state.warrantyFileName || ""} readOnly />
                  <i className="fa fa-file-text-o asset-file-icon" />
                  <input type="file" className="asset-file-hidden" onChange={this.onWarrantyFileChange} />
                </div>
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Asset image</label>
                <div className="asset-file-input-wrapper">
                  <input type="text" className="form-control" placeholder="Upload file" value={this.state.assetImageFileName || ""} readOnly />
                  <i className="fa fa-picture-o asset-file-icon" />
                  <input type="file" className="asset-file-hidden" onChange={this.onFileChange} />
                </div>
              </div>

            </div>
          </div>

          <div className="asset-add-footer">
            <button type="button" className="btn btn-primary asset-add-btn-save" onClick={this.handleSave}>Save</button>
            <button type="button" className="btn btn-light asset-add-btn-cancel" onClick={() => this.requestCancelConfirm("add")}>Cancel</button>
          </div>
        </div>
      </div>
            

    );
  };

  renderCancelConfirmModal = () => {
    if (!this.state.showCancelConfirm) return null;
    const isEdit = this.state.cancelConfirmType === "edit";
    const title = isEdit ? "Cancel edits" : "Cancel action";
    const bodyText = isEdit
      ? "Are you sure you want to cancel? All your updated information will be lost."
      : "Are you sure you want to cancel? All your entered information will be lost.";
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
          <div className="asset-side-panel-body">{bodyText}</div>
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
        <div className="asset-master-main-card asset-delete-modal" onClick={(e) => e.stopPropagation()}>
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
        <div className="asset-master-main-card asset-success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="spare-add-title">
              <span className="spare-add-icon" style={{ background: "rgba(33, 150, 243, 0.12)", color: "#1f4f82" }}>
                <i className="fa fa-check-circle-o" aria-hidden="true" />
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

  renderAmcModal = () => {
    if (!this.state.showAmcModal) return null;

    return (
      <div className="spare-add-backdrop" onClick={this.closeAmcModal}>
        <div className="asset-master-main-card" style={{ maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
          <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="spare-add-title">
              <span className="spare-add-icon" style={{ background: "rgba(33, 150, 243, 0.12)", color: "#1f4f82" }}>
                <i className="fa fa-file-text-o" aria-hidden="true" />
              </span>
              Add AMC details
            </div>
            <button type="button" className="spare-add-close" onClick={this.closeAmcModal}>
              <i className="fa fa-times" aria-hidden="true" />
            </button>
          </div>
          <div className="asset-side-panel-body">
            <div className="asset-add-amc-grid">
              <div className="form-group asset-form-group-custom">
                <label>Date From</label>
                <CustomDatePicker value={this.state.amcDateFrom} onChange={(e) => this.setState({ amcDateFrom: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>Date To</label>
                <CustomDatePicker value={this.state.amcDateTo} onChange={(e) => this.setState({ amcDateTo: e.target.value })} />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>AMC Total Amount</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter total amount"
                  value={this.state.amcTotalAmount}
                  onChange={(e) => this.setState({ amcTotalAmount: e.target.value })}
                />
              </div>

              <div className="form-group asset-form-group-custom">
                <label>AMC Contract</label>
                <CustomDropdown
                  variant="short"
                  value={this.state.amcContractType}
                  onChange={(e) => this.setState({ amcContractType: e.target.value })}
                  placeholder="Select contract"
                  options={[
                    { label: "Monthly", value: "Monthly" },
                    { label: "Quaterly", value: "Quaterly" },
                    { label: "Half Yearly", value: "Half Yearly" },
                    { label: "Yearly", value: "Yearly" },
                  ]}
                />
              </div>

              <div className="form-group asset-form-group-custom asset-add-span-2">
                <label>Document Upload</label>
                <div className="asset-file-input-wrapper">
                  <input type="text" className="form-control" placeholder="Upload file" value={this.state.amcFileName || ""} readOnly />
                  <i className="fa fa-file-text-o asset-file-icon" />
                  <input type="file" className="asset-file-hidden" onChange={this.onAMCFileChange} />
                </div>
              </div>
            </div>
          </div>
          <div className="asset-dialog-actions asset-dialog-actions-right">
            <button type="button" className="btn btn-light" onClick={this.closeAmcModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={this.handleAmcSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };


  renderSidePanel = () => {
    if (this.state.PageMode === "View") return this.renderAssetDetailsPanel();
    if (this.state.PageMode === "Add" || this.state.PageMode === "Edit") return this.renderAssetForm();
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

        <div className={`asset-master-layout asset-master-layout-owned ${hasSidePanel ? "has-side-panel" : ""}`}>
          <div className="asset-master-main-card">
            <div className="asset-master-tabs">
             <button
  type="button"
  className={`asset-master-tab ${this.state.activeTab === "owned" ? "active" : ""}`}
  onClick={() => {
  this.setState({ activeTab: "owned" });
  this.props.history.push("/Account/App/AssetsMaster");
}}
>
  <span className="asset-master-tab-label">Owned assets</span>
  {this.state.activeTab === "owned" ? <span className="asset-master-tab-count">{this.state.GridData.length}</span> : null}
</button>

<button
  type="button"
  className={`asset-master-tab ${this.state.activeTab === "rented" ? "active" : ""}`}
  onClick={() => {
    this.setState({ activeTab: "rented" });
    this.props.history.push("/Account/App/RentalAssets");
  }}
>
  <span className="asset-master-tab-label">Rented assets</span>
</button>

<button
  type="button"
  className={`asset-master-tab ${this.state.activeTab === "spare" ? "active" : ""}`}
  onClick={() => {
    this.setState({ activeTab: "spare" });
    this.props.history.push("/Account/App/SpareMaster");
  }}
>
  <span className="asset-master-tab-label">Spare parts</span>
</button>
            </div>

            <div className="asset-master-toolbar">
              <div className="asset-master-search" onClick={() => this.searchInputRef.current?.focus()}>
                <i className="fa fa-search" aria-hidden="true" />
                <input
                  ref={this.searchInputRef}
                  type="text"
                  placeholder="Search by name or ID"
                  value={this.state.searchTerm}
                  onChange={(e) => this.setState({ searchTerm: e.target.value })}
                />
              </div>

              <div className="asset-master-toolbar-actions">
                <button
                  className="btn btn-success"
                  onClick={() => this.downloadAllQRCodes()}
                >
                  Download QR
                </button>
                <button className={`btn asset-toolbar-filter ${this.state.showFilterPanel ? "active" : ""}`} type="button" onClick={() => this.setState({ showFilterPanel: !this.state.showFilterPanel })}>
                  <i className="fa fa-sliders" aria-hidden="true" />
                  Filter
                  {activeFilterCount > 0 ? <span className="task-filter-count">{activeFilterCount}</span> : null}
                </button>
                <button type="button" className="asset-export-btn" onClick={() => this.exportOwnedAssetsToExcel(filteredGridData)}>
                  <i className="fa fa-external-link" aria-hidden="true" style={{ marginRight: "6px" }} />
                  Export
                </button>
                <button type="button" className="btn btn-primary asset-toolbar-add" onClick={this.Addnew}>
                  <i className="fa fa-plus" aria-hidden="true" />
                  Add asset
                </button>
              </div>
            </div>

            {this.renderFilterPopup()}

            {this.renderOwnedAssetsTable(filteredGridData)}
          </div>

          {hasSidePanel ? this.renderSidePanel() : null}
        </div>
        {showAssetModal ? this.renderAssetFormModal() : null}
        {this.renderCancelConfirmModal()}
        {this.renderDeleteConfirmModal()}
        {this.renderSuccessModal()}
        {this.renderAmcModal()}
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
