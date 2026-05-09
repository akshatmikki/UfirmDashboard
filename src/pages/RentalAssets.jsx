import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import ExportToCSV from "../ReactComponents/ExportToCSV/ExportToCSV";
import RentalPopUp from "../ReactComponents/RentalModal/RentalPopUp";
import { getAssetRentOutReturnHistoryByAssetId } from "../Services/RentalAssets";
import { getAllLocations } from "../Services/AttendanceService";
import "../MainComponents/AssetsMaster/AssetsMaster.css";
import "./RentalAssets.css";
import CustomDatePicker from "../ReactComponents/CustomDatePicker/CustomDatePicker";
import CustomDropdown from "../ReactComponents/CustomDropdown/CustomDropdown";

const statusOptions = {
  running: { label: "Active", key: "running" },
  inactive: { label: "Inactive", key: "inactive" },
  servicing: { label: "Servicing", key: "servicing" },
};

const leaseOptions = {
  in: { label: "In", key: "in" },
  out: { label: "Out", key: "out" },
  open: { label: "Open", key: "open" },
  unknown: { label: "-", key: "unknown" },
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

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getRentalContractSource = (asset = {}) =>
  asset.RentalContract ||
  asset.Contract ||
  asset.RentOut?.RentalContract ||
  asset.Return?.RentalContract ||
  asset.ImageOut ||
  asset.Image ||
  "";

const getLatestRentalContractAsset = (asset = {}) => {
  const history = Array.isArray(asset?.history) ? asset.history : [];
  const contractEntry = history
    .flatMap((item) => [item?.RentOut, item?.Return].filter(Boolean))
    .find((entry) => getRentalContractSource(entry));

  return contractEntry || asset;
};

const getRentalContractFileName = (asset = {}) => {
  const raw = getRentalContractSource(asset);
  const explicitName = asset.RentalContractFileName || asset.ContractFileName || "";
  if (explicitName) return explicitName;
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const path = raw.split("?")[0];
    return path.substring(path.lastIndexOf("/") + 1);
  }
  if (raw.startsWith("data:")) return "Uploaded file";
  if (raw.includes(".")) return raw;
  return "";
};

const getContractPreviewSrc = (contract, fileName = "") => {
  if (!contract) return "";
  const raw = String(contract);
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  // If it looks like a relative path, prepend base URL
  if (raw.includes("/") || raw.includes("\\")) {
    return `https://api.urest.in:8096/${raw.replace(/^[\\\/]+/, "")}`;
  }

  const extension = String(fileName || "").split(".").pop()?.toLowerCase();
  if (extension === "pdf") return `data:application/pdf;base64,${raw}`;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
    const mime = extension === "jpg" ? "jpeg" : extension;
    return `data:image/${mime};base64,${raw}`;
  }

  return `data:image/png;base64,${raw}`;
};

const toBase64Payload = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildHistoryEntries = (history = [], asset = {}) =>
  (Array.isArray(history) ? history : [])
    .flatMap((item, index) => {
      const entries = [];

      if (item?.RentOut?.RentedOutDate) {
        const outSource = item.RentOut.ImageOut || item.RentOut.RentalContract || asset.Image || asset.AssetImage || asset.ImageData || "";
        const outFileName = item.RentOut.ImageOut ? "Asset photo.jpeg" : (item.RentOut.RentalContract ? "Asset document" : (outSource ? "Asset photo.jpeg" : ""));
        const outPreview = getContractPreviewSrc(outSource, outFileName);

        entries.push({
          id: `rentout-${index}-${item.RentOut.RentedOutDate}`,
          type: "out",
          label: "Rented Out",
          summary: "Asset rented out to customer",
          byLabel: item?.RentOut?.AssigneeName || "-",
          dateValue: item.RentOut.RentedOutDate,
          details: [
            { label: "Vendor:", value: item?.RentOut?.Manufacturer || "-" },
            { label: "Price:", value: item?.RentOut?.MonthlyRent ? `₹${item.RentOut.MonthlyRent} / month` : "-" },
            { label: "Start date:", value: formatDate(item?.RentOut?.RentedOutDate) || "-" },
            { label: "End date:", value: formatDate(item?.RentOut?.TentativeDate) || "-" },
          ],
          mediaSrc: outPreview,
          mediaName: outFileName,
        });
      }

      if (item?.Return?.ReturnDate) {
        const inSource = item.Return.ImageIn || item.Return.RentalContract || asset.Image || asset.AssetImage || asset.ImageData || "";
        const inFileName = item.Return.ImageIn ? "Asset photo.jpeg" : (item.Return.RentalContract ? "Asset document" : (inSource ? "Asset photo.jpeg" : ""));
        const inPreview = getContractPreviewSrc(inSource, inFileName);

        entries.push({
          id: `return-${index}-${item.Return.ReturnDate}`,
          type: "returned",
          label: "Returned",
          summary: "Asset returned by customer",
          byLabel: item?.Return?.ReturnedBy || "-",
          dateValue: item.Return.ReturnDate,
          details: [
            { label: "Vendor:", value: item?.Return?.Manufacturer || "-" },
            { label: "Return date:", value: formatDate(item?.Return?.ReturnDate) || "-" },
          ],
          mediaSrc: inPreview,
          mediaName: inFileName,
        });
      }

      return entries;
    })
    .sort((a, b) => new Date(b.dateValue).getTime() - new Date(a.dateValue).getTime());

const ROWS_PER_PAGE = 15;

const normalizeBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

const getStatusMeta = (asset = {}) => {
  const raw = String(asset.Status || asset.AssetStatus || "").trim().toLowerCase();
  if (raw.includes("inactive")) return statusOptions.inactive;
  if (raw.includes("servic")) return statusOptions.servicing;
  if (raw.includes("active")) return statusOptions.running;
  if (raw.includes("running")) return statusOptions.running;

  const hasRentStatus = Object.prototype.hasOwnProperty.call(asset, "IsRentable") || Object.prototype.hasOwnProperty.call(asset, "IsRented");
  if (hasRentStatus) {
    if (normalizeBoolean(asset.IsRentable) || normalizeBoolean(asset.IsRented)) return statusOptions.running;
    return statusOptions.inactive;
  }

  if (asset.ReturnDate === null && asset.RentedOutDate) return statusOptions.running;
  return statusOptions.inactive;
};

const getLeaseMeta = (asset = {}) => {
  const raw = String(asset.LeaseType || asset.Lease || "").trim().toLowerCase();
  if (!raw) return leaseOptions.unknown;
  if (raw === "in" || raw === "inbound" || raw === "return" || raw === "returned") return leaseOptions.in;
  if (raw === "out" || raw === "outbound") return leaseOptions.out;
  if (raw === "open") return leaseOptions.open;
  return leaseOptions.unknown;
};

const getLeaseDisplayValue = (asset = {}) => getLeaseMeta(asset).label;

const getExpiryDateValue = (asset = {}) => asset.ReturnDate || asset.TentativeDate || asset.TentativeReturnDate || asset.ExpiryDate || "";

const getServiceStatus = (asset = {}) => {
  const rawStatus = String(asset?.ServiceStatus || asset?.serviceStatus || "").trim();
  if (rawStatus) return rawStatus;

  let expiryDate = normalizeDate(getExpiryDateValue(asset));
  if (!expiryDate) return "";

  if (expiryDate.includes("-")) {
    const parts = expiryDate.split("-");
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  return expiryDate < today ? "Overdue" : "Upcoming";
};

const matchesServiceStatus = (asset = {}, selectedStatus = "") => {
  if (!selectedStatus) return true;
  const current = String(getServiceStatus(asset) || "").trim().toLowerCase();
  const selected = String(selectedStatus || "").trim().toLowerCase();
  return current === selected;
};

const getFirstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";

const toNumberPayload = (value) => {
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const toApiDateTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("T")) {
    if (raw.length === 16) return `${raw}:00`;
    return raw;
  }
  return `${raw}T00:00:00`;
};

const getLatestRentOutData = (asset = {}) => {
  const history = Array.isArray(asset?.history) ? asset.history : [];
  const rentOutEntries = history
    .map((item) => item?.RentOut)
    .filter(Boolean)
    .sort((a, b) => {
      const bTime = new Date(b.RentOutDateTime || b.RentedOutDate || b.TentativeReturnDate || 0).getTime();
      const aTime = new Date(a.RentOutDateTime || a.RentedOutDate || a.TentativeReturnDate || 0).getTime();
      return bTime - aTime;
    });

  return rentOutEntries[0] || asset?.RentOut || {};
};

const toBase64Field = (value, fileName = "") => {
  let raw = String(value || "").trim();
  if (!raw) return "";

  // If it's a data URL (new upload), keep the full string as requested by user
  if (raw.startsWith("data:")) {
    return raw;
  }

  // Remove any potential whitespace or line breaks that can break base64 decoding
  raw = raw.replace(/\s/g, "");

  // If it's a URL, blob, or file path/name, it's not new base64 content.
  // We return empty string so the backend doesn't try to re-save an existing file.
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:") ||
    raw.includes("\\") ||
    (raw.includes(".") && raw.length < 255) ||
    (fileName && raw === fileName && raw.length < 255)
  ) {
    return "";
  }

  // To be safe, if it doesn't look like base64 content (usually long), don't send it.
  return raw.length > 100 ? raw : "";
};

const buildRentOutAssetPayload = (asset = {}, form = {}) => {
  const rentOutData = getLatestRentOutData(asset);
  const assetId = getFirstValue(form.AssetId, asset.AssetId, asset.Id, form.Id);
  const assetName = getFirstValue(form.AssetName, form.Name, asset.AssetName, asset.Name);
  const rentOutDateTime = toApiDateTime(
    getFirstValue(
      form.RentOutDateTime,
      asset.RentOutDateTime,
      asset.RentedOutDate,
      rentOutData.RentOutDateTime,
      rentOutData.RentedOutDate
    )
  );
  const tentativeReturnDate = toApiDateTime(
    getFirstValue(
      form.TentativeReturnDate,
      form.ExpiryDate,
      asset.TentativeReturnDate,
      asset.TentativeDate,
      asset.ExpiryDate,
      asset.ReturnDate,
      rentOutData.TentativeReturnDate,
      rentOutData.TentativeDate
    )
  );
  const rentalContractFileName = getFirstValue(
    form.RentalContractFileName,
    form.RentalContractName,
    asset.RentalContractFileName,
    asset.ContractFileName,
    rentOutData.RentalContractFileName,
    rentOutData.ContractFileName,
    getRentalContractFileName(rentOutData),
    getRentalContractFileName(asset)
  );
  const imageOutName = getFirstValue(
    form.ImageInName,
    form.ImageOutName,
    asset.ImageInName,
    asset.ImageOutName,
    rentOutData.ImageInName,
    rentOutData.ImageOutName,
    form.ImageIn && form.ImageIn.length < 255 ? form.ImageIn : "",
    form.ImageOut && form.ImageOut.length < 255 ? form.ImageOut : "",
    asset.ImageIn,
    asset.ImageOut,
    rentOutData.ImageIn,
    rentOutData.ImageOut,
    asset.AssetImageFileName,
    asset.ImageExt,
    asset.AssetImage,
    asset.Image
  );

  return {
    AssetId: toNumberPayload(assetId),
    AssetName: assetName,
    AssigneeName: getFirstValue(form.AssigneeName, asset.AssigneeName, rentOutData.AssigneeName),
    RentOutDateTime: rentOutDateTime,
    TentativeReturnDate: tentativeReturnDate,
    RentedTo: getFirstValue(form.RentedTo, form.Vendor, asset.RentedTo, rentOutData.RentedTo, asset.Vendor, asset.VendorName, asset.Distributor),
    OutFrom: getFirstValue(form.OutFrom, asset.OutFrom, rentOutData.OutFrom, form.Location, asset.Location),
    RentalCharges: toNumberPayload(getFirstValue(form.RentalCharges, form.Cost, asset.RentalCharges, rentOutData.RentalCharges, asset.MonthlyRent, asset.Cost)),
    ApprovedBy: getFirstValue(form.ApprovedBy, asset.ApprovedBy, rentOutData.ApprovedBy),
    SecurityDeposit: toNumberPayload(getFirstValue(form.SecurityDeposit, asset.SecurityDeposit, rentOutData.SecurityDeposit)),
    RentOutTime: getFirstValue(form.RentOutTime, asset.RentOutTime, rentOutData.RentOutTime, rentOutDateTime),
    Manufacturer: getFirstValue(form.Manufacturer, asset.Manufacturer, rentOutData.Manufacturer),
    Location: getFirstValue(form.Location, asset.Location, rentOutData.Location, form.OutFrom, asset.OutFrom),
    ImageOutBase64: toBase64Field(getFirstValue(form.ImageOutBase64, asset.ImageOutBase64, rentOutData.ImageOutBase64, asset.ImageData, asset.AssetImage, asset.Image), imageOutName),
    RentalContractBase64: toBase64Field(
      getFirstValue(form.RentalContractBase64, asset.RentalContractBase64, rentOutData.RentalContractBase64, form.RentalContract),
      rentalContractFileName
    ),
    ImageOut: toBase64Field(getFirstValue(form.ImageOutBase64, form.ImageInBase64, asset.ImageOutBase64), imageOutName),
    RentalContract: toBase64Field(getFirstValue(form.RentalContractBase64, asset.RentalContractBase64), rentalContractFileName),
    Status: getFirstValue(form.Status, asset.Status, asset.AssetStatus, rentOutData.Status),
    Description: getFirstValue(form.Description, asset.Description, rentOutData.Description),
    LeaseType: getFirstValue(form.LeaseType, asset.LeaseType, asset.Lease, rentOutData.LeaseType),
    Model: getFirstValue(form.Model, asset.Model, asset.AssetModel, rentOutData.Model),
    // Support for Return (Rent-in) history fields
    ReturnedBy: getFirstValue(form.ReturnedBy, form.AssigneeName),
    ReturnDate: toApiDateTime(getFirstValue(form.ExpiryDate, form.ReturnDate, form.ReturnDateTime, form.RentOutDateTime)),
    ReturnFrom: getFirstValue(form.ReturnedFrom, form.ReturnFrom, form.OutFrom, form.Location),
    ImageInBase64: toBase64Field(getFirstValue(form.ImageInBase64, form.ImageOutBase64, asset.ImageInBase64), imageOutName),
    ImageIn: toBase64Field(getFirstValue(form.ImageInBase64, form.ImageOutBase64, asset.ImageInBase64), imageOutName),
    Remarks: getFirstValue(form.Remarks, form.Description),
  };
};

const buildEditForm = (asset = {}) => ({
  Id: asset.Id || "",
  Name: asset.Name || "",
  Status: getStatusMeta(asset).label,
  Description: asset.Description || "",
  Vendor: asset.RentedTo || asset.Vendor || asset.VendorName || asset.Distributor || asset.Manufacturer || "",
  LeaseType: asset.LeaseType || asset.Lease || "",
  Manufacturer: asset.Manufacturer || "",
  Model: asset.AssetModel || asset.Model || "",
  Cost: asset.RentalCharges || asset.MonthlyRent || asset.Cost || "",
  SecurityDeposit: asset.SecurityDeposit || "",
  ExpiryDate: normalizeDate(getExpiryDateValue(asset)),
  Location: asset.Location || asset.OutFrom || "",
  RentalContract: getRentalContractSource(asset),
  RentalContractFileName: getRentalContractFileName(asset),
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
  const [propertyLocationOptions, setPropertyLocationOptions] = useState([]);
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
  const [currentPage, setCurrentPage] = useState(1);

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
    if (Number(propId) > 0) {
      fetchRentalAssets();
    } else {
      setRentalAssets([]);
      setSelectedAssetId(null);
      setPanelMode("details");
      setShowFilterPanel(false);
      setLoading(false);
    }
  }, [propId]);

  useEffect(() => {
    let isMounted = true;

    const fetchLocationOptions = async () => {
      try {
        const data = await getAllLocations();
        if (!isMounted) return;
        setPropertyLocationOptions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        if (isMounted) setPropertyLocationOptions([]);
      }
    };

    fetchLocationOptions();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const passesServiceStatus = matchesServiceStatus(asset, filterServiceStatus);

      return matchesSearch && matchesManufacturer && matchesStatus && matchesVendor && matchesType && passesServiceStatus;
    });
  }, [rentalAssets, searchTerm, filterManufacturer, filterVendor, filterStatus, filterType, filterServiceStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterManufacturer, filterVendor, filterStatus, filterType, filterServiceStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAssets = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    return filteredAssets.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredAssets, safeCurrentPage]);

  const manufacturerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rentalAssets
            .map((asset) => String(asset?.Manufacturer || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [rentalAssets]
  );

  const vendorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rentalAssets
            .map((asset) => String(asset?.Vendor || asset?.VendorName || asset?.Distributor || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [rentalAssets]
  );

  const selectedAsset = useMemo(() => rentalAssets.find((item) => Number(item.Id) === Number(selectedAssetId)) || null, [rentalAssets, selectedAssetId]);

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...propertyLocationOptions, selectedAsset?.Location, selectedAsset?.OutFrom]
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [propertyLocationOptions, selectedAsset]
  );

  const resetFilters = () => {
    setFilterManufacturer("");
    setFilterVendor("");
    setFilterLease("");
    setFilterStatus("");
    setFilterType("");
    setFilterServiceStatus("");
  };

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const payload = {
      Id: deleteTarget.Id || 0,
      Name: deleteTarget.Name || "",
      Description: deleteTarget.Description || "",
      QRCode: deleteTarget.QRCode || "",
      AssetType: deleteTarget.AssetType || deleteTarget.Type || deleteTarget.LeaseType || "",
      Manufacturer: deleteTarget.Manufacturer || "",
      AssetModel: deleteTarget.AssetModel || deleteTarget.Model || "",
      IsMoveable: deleteTarget.IsMoveable ?? false,
      IsRented: deleteTarget.IsRented ?? false,
      Flag: "D",
      AssetImage: deleteTarget.AssetImage || deleteTarget.Image || "",
      LastServiceDate: normalizeDate(deleteTarget.LastServiceDate || ""),
      NextServiceDate: normalizeDate(deleteTarget.NextServiceDate || ""),
      IsRentable: deleteTarget.IsRentable ?? true,
      AssetValue: deleteTarget.AssetValue || deleteTarget.MonthlyRent || deleteTarget.Cost || 0,
      Capacity: deleteTarget.Capacity || deleteTarget.capacity || "",
      capacity: deleteTarget.Capacity || deleteTarget.capacity || "",
      AMCdoc: deleteTarget.AMCdoc || deleteTarget.AMCimage || "",
      status: deleteTarget.Status ?? false,
      category: deleteTarget.Category || deleteTarget.category || "",
      location: deleteTarget.Location || deleteTarget.OutFrom || "",
      serviceReminderDay: deleteTarget.serviceReminderDay || "",
      propertyId: propId,
      PurchaseDate: normalizeDate(deleteTarget.PurchaseDate || ""),
      WarrantyDate: normalizeDate(deleteTarget.WarrantyDate || deleteTarget.ExpiryDate || deleteTarget.ReturnDate || ""),
    };

    try {
      const resp = await fetch("https://api.urest.in:8096/ManageAssets", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error("Failed to delete rental asset");
      }

      await fetchRentalAssets();
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAsset) return;
    try {
      let rentalContractValue = editForm.RentalContract;
      let rentalContractFileName = editForm.RentalContractFileName || "";

      if (editForm.RentalContract instanceof File) {
        rentalContractValue = await toBase64Payload(editForm.RentalContract);
        rentalContractFileName = editForm.RentalContract.name;
      }

      let assetForPayload = selectedAsset;
      if (!Array.isArray(selectedAsset.history)) {
        try {
          const historyData = await getAssetRentOutReturnHistoryByAssetId(selectedAsset.Id);
          const normalizedHistory = Array.isArray(historyData) ? historyData : [];
          assetForPayload = { ...selectedAsset, history: normalizedHistory };
          setRentalAssets((prev) =>
            prev.map((item) =>
              Number(item.Id) === Number(selectedAsset.Id)
                ? {
                  ...item,
                  history: normalizedHistory,
                }
                : item
            )
          );
        } catch (historyError) {
          console.error(historyError);
        }
      }

      const payload = buildRentOutAssetPayload(assetForPayload, {
        ...editForm,
        ImageOut: editForm.ImageOutBase64 || editForm.ImageOut || "",
        ImageOutBase64: editForm.ImageOutBase64 || editForm.ImageOut || "",
        RentalContract: rentalContractValue,
        RentalContractBase64: rentalContractValue,
        RentalContractFileName: rentalContractFileName,
      });

      const resp = await fetch("https://api.urest.in:8096/ManageRentOutAsset", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error("Failed to update rental asset");
      }

      await fetchRentalAssets();
      setSelectedAssetId(selectedAsset.Id);
      setPanelMode("details");
      setEditForm((prev) => ({
        ...prev,
        RentalContract: rentalContractValue,
        RentalContractFileName: rentalContractFileName,
      }));
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
    }
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
    const url = "https://api.urest.in:8096/ManageRentOutAsset";
    const payload = isReturnMode
      ? buildRentOutAssetPayload(selectedAsset, {
        ReturnedBy: formData.returnedBy || "",
        ReturnDate: formData.returnDateTime || "",
        ReturnedFrom: formData.returnedFrom || "",
        ImageInBase64: formData.imageIn || "",
        ImageIn: formData.imageIn || "",
        ImageInName: formData.assetImageName || "",
        RentalContractBase64: formData.rentalContract || "",
        RentalContract: formData.rentalContract || "",
        RentalContractFileName: formData.rentalContractName || "",
        Remarks: formData.remarks || "",
        Status: "In",
        RentedTo: formData.rentedFrom || "",
        // Fallback for standard fields if needed by backend
        AssigneeName: formData.returnedBy || "",
        RentOutDateTime: formData.returnDateTime || "",
        ImageOutBase64: formData.imageIn || "",
        ImageOut: formData.imageIn || "",
        ImageOutName: formData.assetImageName || "",
      })
      : buildRentOutAssetPayload(selectedAsset, {
        AssigneeName: formData.assigneeName || "",
        RentOutDateTime: formData.rentOutDateTime || "",
        TentativeReturnDate: formData.tentativeReturnDate || "",
        RentedTo: formData.rentedTo || "",
        OutFrom: formData.outFrom || "",
        RentalCharges: formData.rentalCharges || 0,
        SecurityDeposit: formData.securityDeposit || 0,
        RentOutTime: formData.rentOutTime || formData.rentOutDateTime || "",
        ApprovedBy: formData.approvedBy || "",
        Manufacturer: formData.manufacturer || selectedAsset.Manufacturer || "",
        Location: formData.location || formData.outFrom || selectedAsset.Location || "",
        ImageOutBase64: formData.imageOut || "",
        ImageOut: formData.imageOut || "",
        ImageOutName: formData.imageOutName || "",
        RentalContractBase64: formData.rentalContract || "",
        RentalContract: formData.rentalContract || "",
        RentalContractFileName: formData.rentalContractName || "",
        Status: "Out",
      });

    await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

  const handleOpenContract = async () => {
    if (!selectedAsset) return;
    let assetWithContract = getLatestRentalContractAsset(selectedAsset);

    if (!getRentalContractSource(assetWithContract)) {
      try {
        const historyData = Array.isArray(selectedAsset.history)
          ? selectedAsset.history
          : await getAssetRentOutReturnHistoryByAssetId(selectedAsset.Id);
        const normalizedHistory = Array.isArray(historyData) ? historyData : [];
        assetWithContract = getLatestRentalContractAsset({ ...selectedAsset, history: normalizedHistory });
        setRentalAssets((prev) =>
          prev.map((item) =>
            Number(item.Id) === Number(selectedAsset.Id)
              ? {
                ...item,
                history: normalizedHistory,
              }
              : item
          )
        );
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const contract = getRentalContractSource(assetWithContract);
    const contractFileName = getRentalContractFileName(assetWithContract);
    if (!contract) return;

    const previewSrc = getContractPreviewSrc(contract, contractFileName);
    if (!previewSrc) return;

    if (previewSrc.startsWith("http://") || previewSrc.startsWith("https://")) {
      window.open(previewSrc, "_blank", "noopener,noreferrer");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) return;
    if (previewSrc.startsWith("data:application/pdf")) {
      win.document.write(
        `<html><body style="margin:0;padding:0"><embed src="${previewSrc}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0"></body></html>`
      );
    } else {
      win.document.write(
        `<html><body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${previewSrc}" style="max-width:100%;max-height:100vh;object-fit:contain"></body></html>`
      );
    }
    win.document.close();
  };

  const renderDetailsPanel = () => {
    if (!selectedAsset) return null;
    const statusMeta = getStatusMeta(selectedAsset);

    const imageSource = getContractPreviewSrc(
      selectedAsset.AssetImage || selectedAsset.Image || selectedAsset.ImageOut,
      selectedAsset.ImageExt || selectedAsset.ImageOutName || "png"
    );

    return (
      <div className="rental-panel-card rental-details-view-panel">
        <div className="rental-panel-header">
          <h4 className="rental-panel-title">Asset Details</h4>
        </div>

        <div className="rental-panel-body">
          {imageSource && !imageSource.includes("application/pdf") ? (
            <div className="asset-hero-image-wrapper">
              <img src={imageSource} alt="Asset" className="asset-hero-image" />
            </div>
          ) : (
            <div className="asset-hero-image-empty">
              <div className="asset-hero-empty-icon">
                <i className="fa fa-picture-o" aria-hidden="true" />
              </div>
              <div className="asset-hero-empty-text">Asset photo not available</div>
              <button type="button" className="asset-hero-empty-btn" onClick={() => handleEditClick(selectedAsset)}>
                <i className="fa fa-picture-o" aria-hidden="true" />
                Add asset photo
              </button>
            </div>
          )}
          <div className="rental-detail-grid">
            <div className="rental-detail-item rental-detail-full rental-readonly-row">
              <span className="rental-detail-label">ID</span>
              <span className="rental-detail-value rental-readonly-value">{selectedAsset.Id || "-"}</span>
            </div>
            <div className="rental-detail-item rental-detail-full">
              <div className="rental-detail-inline-head">
                <span className="rental-detail-label">Name</span>
                <span className={`rental-status-chip rental-status-${statusMeta.key}`}>{statusMeta.label}</span>
              </div>
              <span className="rental-detail-value">{selectedAsset.Name || "-"}</span>
            </div>
            <div className="rental-detail-item rental-detail-full">
              <span className="rental-detail-label">Description</span>
              <span className="rental-detail-value">{selectedAsset.Description || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Vendor</span>
              <span className="rental-detail-value">{selectedAsset.Vendor || selectedAsset.VendorName || selectedAsset.Distributor || selectedAsset.Manufacturer || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Lease type</span>
              <span className="rental-detail-value">{selectedAsset.LeaseType || selectedAsset.Lease || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Manufacturer</span>
              <span className="rental-detail-value">{selectedAsset.Manufacturer || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Model</span>
              <span className="rental-detail-value">{selectedAsset.AssetModel || selectedAsset.Model || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Cost</span>
              <span className="rental-detail-value">{selectedAsset.MonthlyRent || selectedAsset.Cost ? `₹${selectedAsset.MonthlyRent || selectedAsset.Cost}/day` : "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Security deposit</span>
              <span className="rental-detail-value">{selectedAsset.SecurityDeposit || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Expiry date</span>
              <span className="rental-detail-value">{formatDate(getExpiryDateValue(selectedAsset))}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Location</span>
              <span className="rental-detail-value">{selectedAsset.Location || selectedAsset.OutFrom || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Approved by</span>
              <span className="rental-detail-value">{selectedAsset.ApprovedBy || "-"}</span>
            </div>
            <div className="rental-detail-item">
              <span className="rental-detail-label">Returned by</span>
              <span className="rental-detail-value">{selectedAsset.ReturnedBy || "-"}</span>
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
              onClick={() => handleOpenRentModal(selectedAsset, selectedAsset.IsRented ? "return" : "rentout")}
            >
              <i className={`fa ${selectedAsset.IsRented ? "fa-sign-in" : "fa-sign-out"} mr-1`} aria-hidden="true" />
              {selectedAsset.IsRented ? "Rent in" : "Rent out"}
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const valid = ["jpg", "jpeg", "png", "webp"];
    const extension = file.name.split(".").pop().toLowerCase();
    if (!valid.includes(extension)) {
      alert(`Invalid file type. Please select ${valid.join(", ")}`);
      return;
    }
    const base64 = await toBase64Payload(file);
    setEditForm((prev) => ({
      ...prev,
      ImageOutBase64: base64,
      ImageOutName: file.name,
      previewImage: URL.createObjectURL(file),
    }));
  };

  const renderEditPanel = () => {
    const imageSource = editForm.previewImage || getContractPreviewSrc(
      editForm.ImageOutBase64 || selectedAsset?.AssetImage || selectedAsset?.Image || selectedAsset?.ImageOut,
      editForm.ImageOutName || selectedAsset?.ImageExt || selectedAsset?.ImageOutName || "png"
    );

    return (
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
          <div className="asset-form-image-upload-wrapper">
            {imageSource && !imageSource.includes("application/pdf") ? (
              <div className="asset-hero-image-wrapper">
                <img src={imageSource} alt="Asset" className="asset-hero-image" />
                <label className="asset-hero-edit-overlay">
                  <i className="fa fa-camera" />
                  <span>Change photo</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleImageUpload} />
                </label>
              </div>
            ) : (
              <div className="asset-hero-image-empty">
                <div className="asset-hero-empty-icon">
                  <i className="fa fa-picture-o" aria-hidden="true" />
                </div>
                <div className="asset-hero-empty-text">Asset photo not available</div>
                <label className="asset-hero-empty-btn" style={{ cursor: "pointer", margin: 0 }}>
                  <i className="fa fa-picture-o" aria-hidden="true" />
                  Add asset photo
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={handleImageUpload} />
                </label>
              </div>
            )}
          </div>

          <div className="asset-form-id-row-simple">
            <span className="asset-info-label">ID</span>
            <span className="asset-info-value">{editForm.Id || "-"}</span>
          </div>

          <div className="asset-form-simple-stack">
            <div className="form-group asset-form-group-custom">
              <label>Name</label>
              <input className="form-control" value={editForm.Name} onChange={(e) => setEditForm({ ...editForm, Name: e.target.value })} />
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Status</label>
              <CustomDropdown
                variant="short"
                value={editForm.Status}
                onChange={(e) => setEditForm({ ...editForm, Status: e.target.value })}
                placeholder="Select status"
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                  { label: "Servicing", value: "Servicing" }
                ]}
              />
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
                <CustomDropdown
                  variant="short"
                  value={editForm.LeaseType}
                  onChange={(e) => setEditForm({ ...editForm, LeaseType: e.target.value })}
                  placeholder="Select lease type"
                  options={[
                    { label: "Outbound", value: "Outbound" },
                    { label: "Inbound", value: "Inbound" },
                    { label: "Open", value: "Open" }
                  ]}
                />
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
                <CustomDatePicker value={editForm.ExpiryDate} onChange={(e) => setEditForm({ ...editForm, ExpiryDate: e.target.value })} />
              </div>
              <div className="form-group asset-form-group-custom">
                <label>Location</label>
                <CustomDropdown
                  variant="short"
                  value={editForm.Location}
                  onChange={(e) => setEditForm({ ...editForm, Location: e.target.value })}
                  placeholder="Select location"
                  options={locationOptions.map(v => ({ label: v, value: v }))}
                />
              </div>
            </div>

            <div className="form-group asset-form-group-custom">
              <label>Rental contract</label>
              <div className="rental-upload-field">
                <input className="form-control" placeholder="Upload file" value={editForm.RentalContractFileName || ""} readOnly />
                <span className="rental-upload-icon" aria-hidden="true">
                  <i className="fa fa-file-text" />
                </span>
                <input
                  type="file"
                  className="asset-file-hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const base64 = await toBase64Payload(file);
                      setEditForm((prev) => ({
                        ...prev,
                        RentalContract: base64,
                        RentalContractBase64: base64,
                        RentalContractFileName: file.name,
                      }));
                    }
                  }}
                />
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
  };


  return (
    <div className="content-wrapper">
      <section className="content mt-3">
        <div className="container-fluid">
          <div className="rental-assets-page">
            <div className="rental-assets-breadcrumb" onClick={() => history.push("/Account/App/AssetsMaster")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && history.push("/Account/App/AssetsMaster")}>
              <i className="fa fa-angle-left" aria-hidden="true" />
              <span>Asset Master</span>
            </div>

            <div className={`rental-assets-layout ${selectedAsset && !showActionModal ? "has-side-panel" : ""}`}>
              <div className="rental-assets-main-card">
                <div className="rental-assets-tabs">
                  <button type="button" className="rental-assets-tab" onClick={() => history.push("/Account/App/AssetsMaster")}>
                    <span className="rental-assets-tab-label">Owned assets</span>
                  </button>
                  <button type="button" className="rental-assets-tab active">
                    <span className="rental-assets-tab-label">Rented assets</span>
                    <span className="rental-assets-tab-count">{rentalAssets.length}</span>
                  </button>
                  <button type="button" className="rental-assets-tab" onClick={() => history.push("/Account/App/SpareMaster")}>
                    <span className="rental-assets-tab-label">Spare parts</span>
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
                        <CustomDropdown
                          variant="long"
                          value={filterVendor}
                          onChange={(e) => setFilterVendor(e.target.value)}
                          placeholder="Enter name"
                          options={vendorOptions.map(v => ({ label: v, value: v }))}
                        />
                      </div>
                      <div className="asset-filter-field">
                        <label>Manufacturer</label>
                        <CustomDropdown
                          variant="long"
                          value={filterManufacturer}
                          onChange={(e) => setFilterManufacturer(e.target.value)}
                          placeholder="Enter name"
                          options={manufacturerOptions.map(m => ({ label: m, value: m }))}
                        />
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
                          {["Active", "Servicing", "Inactive"].map((item) => (
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
                  <div className={`rental-assets-table-wrap ${selectedAssetId && !showActionModal ? "has-selection" : ""}`.trim()}>
                    <table className="table rental-assets-table mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Asset Name</th>
                          <th>Manufacturer</th>
                          <th>Lease</th>
                          <th>Location</th>
                          <th>Expiry date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssets.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="rental-assets-empty-state">No assets found.</td>
                          </tr>
                        ) : paginatedAssets.map((asset) => {
                          const statusMeta = getStatusMeta(asset);
                          const leaseMeta = getLeaseMeta(asset);
                          const isReturnFlow = asset.ReturnDate === null && asset.RentedOutDate;
                          const isOverdueAsset = String(getServiceStatus(asset)).toLowerCase() === "overdue";

                          return (
                            <tr key={asset.Id} className={`${Number(selectedAssetId) === Number(asset.Id) ? "active" : ""} ${isOverdueAsset ? "asset-overdue-row" : ""}`.trim()} onClick={() => handleSelectAsset(asset)}>
                              <td>{asset.Id || "-"}</td>
                              <td>{asset.Name || "-"}</td>
                              <td>{asset.Manufacturer || "-"}</td>
                              <td>
                                <span className={`rental-lease-pill rental-lease-${leaseMeta.key}`}>{getLeaseDisplayValue(asset)}</span>
                              </td>
                              <td>{asset.Location || asset.OutFrom || "-"}</td>
                              <td>{formatDate(getExpiryDateValue(asset))}</td>
                              <td>
                                <span className={`rental-status-chip rental-status-${statusMeta.key}`}>{statusMeta.label}</span>
                              </td>
                              <td>
                                <div className="rental-row-actions" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" className="rental-icon-btn" title="Edit" onClick={() => handleEditClick(asset)}>
                                    <i className="fa fa-pencil-square-o" aria-hidden="true" />
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
                    {filteredAssets.length > ROWS_PER_PAGE ? (
                      <div className="asset-owned-pagination">
                        <span>{`Showing ${(safeCurrentPage - 1) * ROWS_PER_PAGE + 1}-${Math.min(safeCurrentPage * ROWS_PER_PAGE, filteredAssets.length)} of ${filteredAssets.length}`}</span>
                        <div className="asset-owned-pagination-controls">
                          <button type="button" className="asset-owned-page-btn" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
                            <i className="fa fa-angle-left" aria-hidden="true" />
                          </button>
                          <span className="asset-owned-page-number">{safeCurrentPage}</span>
                          <button type="button" className="asset-owned-page-btn" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
                            <i className="fa fa-angle-right" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                </LoadingOverlay>
              </div>

              {!showActionModal && selectedAsset ? (panelMode === "edit" ? renderEditPanel() : renderDetailsPanel()) : null}
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
                    Are you sure you want to cancel? All your updated information will be lost.
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
                        <span className="rental-history-title-lease">- {historyAsset?.Name || "-"}</span>
                        <span className="rental-history-title-id">({historyAsset?.Id || "-"})</span>
                      </div>
                    </div>
                    <button type="button" className="rental-history-close" onClick={() => setShowHistoryModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rental-history-body">
                    {historyLoading ? (
                      <div className="rental-history-empty">Loading history...</div>
                    ) : buildHistoryEntries(historyAsset?.history, historyAsset).length > 0 ? (
                      buildHistoryEntries(historyAsset?.history, historyAsset).map((item) => {
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
                                <div className="rental-history-details-grid">
                                  <div className="rental-history-details-list">
                                    {item.details.map((detail, detailIndex) => (
                                      <div key={`${item.id}-detail-${detailIndex}`} className="rental-history-detail-item">
                                        <span className="rental-history-detail-label">{detail.label}</span>
                                        <span className="rental-history-detail-value">{detail.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {item.mediaSrc ? (
                                    <div className="rental-history-media-card">
                                      {item.mediaSrc.startsWith("data:application/pdf") ? (
                                        <button
                                          type="button"
                                          className="rental-history-media-link"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const win = window.open("", "_blank");
                                            if (!win) return;
                                            win.document.write(
                                              `<html><body style="margin:0;padding:0"><embed src="${item.mediaSrc}" type="application/pdf" width="100%" height="100%" style="position:fixed;inset:0"></body></html>`
                                            );
                                            win.document.close();
                                          }}
                                        >
                                          {item.mediaName}
                                        </button>
                                      ) : (
                                        <>
                                          <img src={item.mediaSrc} alt={item.mediaName || "Asset document"} className="rental-history-media-preview" />
                                          <button
                                            type="button"
                                            className="rental-history-media-link"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(item.mediaSrc, "_blank", "noopener,noreferrer");
                                            }}
                                          >
                                            {item.mediaName}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
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

