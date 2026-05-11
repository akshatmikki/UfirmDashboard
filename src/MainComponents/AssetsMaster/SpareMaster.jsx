"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import SpareService from "../../Services/SpareService";
import "./AssetsMaster.css";
import CustomDatePicker from "../../ReactComponents/CustomDatePicker/CustomDatePicker";
import CustomDropdown from "../../ReactComponents/CustomDropdown/CustomDropdown";
import QRCode from "react-qr-code";
import { renderToStaticMarkup } from "react-dom/server";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
    InvoiceNo: null,
    InvoiceFileName: "",
    Warranty: null,
    WarrantyFileName: "",
    Remarks: "",
    QRCode: "",
    showQR: false
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

function getFileNameFromPath(value) {
  if (!value) return "";
  const raw = String(value);
  if (raw.startsWith("data:")) return "Existing document";
  return raw.split(/[\\/]/).pop() || "";
}

function getSpareValue(row = {}) {
  const value =
    row.Value ??
    row.value ??
    row.AssetValue ??
    row.assetValue ??
    row.SpareValue ??
    row.spareValue;

  return value === undefined || value === null || String(value).trim() === "" ? "" : value;
}

function statusMeta(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("inactive")) return { label: "Inactive", key: "inactive" };
  if (raw.includes("servic")) return { label: "Servicing", key: "servicing" };
  return { label: "Active", key: "running" };
}

function getStatusFormValue(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("inactive")) return "Inactive";
  if (raw.includes("servic")) return "Servicing";
  return "Running";
}

function getServiceStatus(row = {}) {
  const rawStatus = String(row?.ServiceStatus || row?.serviceStatus || "").trim();
  if (rawStatus) return rawStatus;

  let expiryDate = normalizeDateOnly(row?.ExpiryDate);
  if (!expiryDate) return "";

  if (expiryDate.includes("-")) {
    const parts = expiryDate.split("-");
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  return expiryDate < today ? "Overdue" : "Upcoming";
}

function matchesServiceStatus(row = {}, selectedStatus = "") {
  if (!selectedStatus) return true;
  const current = String(getServiceStatus(row) || "").trim().toLowerCase();
  const selected = String(selectedStatus || "").trim().toLowerCase();
  return current === selected;
}

const ROWS_PER_PAGE = 15;

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
  const [filterManufacturer, setFilterManufacturer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAssetId, setFilterAssetId] = useState("");
  const [filterServiceStatus, setFilterServiceStatus] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [spareRows, setSpareRows] = useState([getEmptySpareRow()]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successType, setSuccessType] = useState("U");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAction, setCancelAction] = useState(null);

  const [editForm, setEditForm] = useState(null);
  const searchInputRef = useRef(null);
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);
  const [downloadQRProgress, setDownloadQRProgress] = useState(0);

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
      const directAssets = Array.isArray(data) ? data : [];
      const combined = directAssets.length
        ? directAssets
        : [
          ...(Array.isArray(data?.PassedServiceDates) ? data.PassedServiceDates : []),
          ...(Array.isArray(data?.UpcomingServiceDates) ? data.UpcomingServiceDates : []),
        ];
      setAssets(combined);
    } catch {
      setAssets([]);
    }
  };

  useEffect(() => {
    if (Number(propertyId) > 0) {
      loadSpares();
      loadAssets();
    } else {
      setSpares([]);
      setAssets([]);
      setSelectedSpareId(null);
      setShowFilterPanel(false);
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

  const generateQRCode = (index) => {
    const uniqueQR = "SPARE-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    setSpareRows(prev => {
      const updated = [...prev];
      updated[index].QRCode = uniqueQR;
      updated[index].showQR = false;
      return updated;
    });
  };
  const toggleQR = (index) => {
    setSpareRows(prev => {
      const updated = [...prev];
      updated[index].showQR = !updated[index].showQR;
      return updated;
    });
  };
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");

      const reader = new FileReader();
      reader.readAsDataURL(file); // 🔥 IMPORTANT

      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
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
        formData.append("QRCode", row.QRCode);
        formData.append("BackupTime", row.BackupTime);
        formData.append("Status", row.Status);
        formData.append("Quantity", row.Quantity);
        formData.append("PurchaseDate", toIsoOrEmpty(row.PurchaseDate));
        formData.append("ExpiryDate", toIsoOrEmpty(row.ExpiryDate));
        formData.append("SerialNumber", row.SerialNumber);
        formData.append("VendorName", row.VendorName);


        const invoiceBase64 = await fileToBase64(row.InvoiceNo);
        const warrantyBase64 = await fileToBase64(row.Warranty);

        formData.append("InvoiceFile", invoiceBase64 || "");
        formData.append("WarrantyFile", warrantyBase64 || "");

        formData.append("Remarks", row.Remarks);
        formData.append("Reusable", 0);

        await SpareService.create(formData);
      }

      setShowAddModal(false);
      resetAddForm();
      setSuccessType("I");
      setShowSuccessModal(true);
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
      const passesQuery =
        !query ||
        [row?.SpareID, row?.AssetID, row?.SpareType, row?.Name]
          .some((v) => String(v || "").toLowerCase().includes(query));
      const passesVendor = !filterVendor || String(row?.VendorName || "").toLowerCase().includes(String(filterVendor).toLowerCase());
      const passesType = !filterType || String(row?.SpareType || "").toLowerCase().includes(String(filterType).toLowerCase());
      const passesStatus = !filterStatus || statusMeta(row?.Status).label === filterStatus;
      const passesAsset = !filterAssetId || String(row?.AssetID ?? "") === String(filterAssetId);
      const passesManufacturer = !filterManufacturer || String(row?.Manufacturer || "").toLowerCase().includes(filterManufacturer.toLowerCase());
      const passesServiceStatus = matchesServiceStatus(row, filterServiceStatus);

      return passesQuery && passesVendor && passesType && passesStatus && passesAsset && passesManufacturer && passesServiceStatus;
    });
  }, [spares, searchTerm, filterVendor, filterType, filterStatus, filterAssetId, filterManufacturer, filterServiceStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterVendor, filterManufacturer, filterStatus, filterType, filterAssetId, filterServiceStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSpares.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSpares = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
    return filteredSpares.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredSpares, safeCurrentPage]);

  const manufacturerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map((asset) => String(asset?.Manufacturer || asset?.manufacturer || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [assets]
  );

  const vendorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (spares || [])
            .map((row) => String(row?.VendorName || row?.Vendor || row?.Distributor || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [spares]
  );

  const selectedRow = useMemo(() => (spares || []).find((row) => Number(row.SpareID) === Number(selectedSpareId)) || null, [spares, selectedSpareId]);

  useEffect(() => {
    if (!selectedRow) return;
    const asset = assetById.get(Number(selectedRow.AssetID)) || {};
    setEditForm({
      SpareID: selectedRow.SpareID,
      AssetID: selectedRow.AssetID,
      AssetName: asset.Name || asset.name || selectedRow.Name || selectedRow.AssetName || "",
      SpareType: selectedRow.SpareType || "",
      Status: getStatusFormValue(selectedRow.Status),
      Remarks: selectedRow.Remarks || "",
      SerialNumber: selectedRow.SerialNumber || "",
      Manufacturer: asset.Manufacturer || asset.manufacturer || "",
      Model: asset.AssetModel || asset.Model || "",
      VendorName: selectedRow.VendorName || "",
      Rating: selectedRow.Rating || "",
      Value: getSpareValue(selectedRow),
      BackupTime: selectedRow.BackupTime || "",
      Quantity: selectedRow.Quantity ?? 1,
      PurchaseDate: normalizeDateOnly(selectedRow.PurchaseDate),
      ExpiryDate: normalizeDateOnly(selectedRow.ExpiryDate),
      InvoiceFileName: selectedRow.InvoiceFileName || getFileNameFromPath(selectedRow.InvoiceFilePath),
      WarrantyFileName: selectedRow.WarrantyFileName || getFileNameFromPath(selectedRow.WarrantyFilePath),
    });
  }, [selectedRow, assetById]);

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
      formData.append("AssetID", editForm.AssetID || existing.AssetID || "");
      formData.append("SpareType", editForm.SpareType);
      formData.append("Rating", existing.Rating || "");
      formData.append("Value", editForm.Value || "");
      // formData.append("AssetValue", editForm.Value || "");
      formData.append("BackupTime", editForm.BackupTime || existing.BackupTime || "");
      formData.append("Status", editForm.Status);
      formData.append("Quantity", editForm.Quantity || existing.Quantity || 1);
      formData.append("PurchaseDate", toIsoOrEmpty(editForm.PurchaseDate));
      formData.append("ExpiryDate", toIsoOrEmpty(editForm.ExpiryDate));
      formData.append("SerialNumber", editForm.SerialNumber);
      formData.append("VendorName", editForm.VendorName || "");
      const invoiceBase64 = await fileToBase64(editForm.InvoiceFile);
      const warrantyBase64 = await fileToBase64(editForm.WarrantyFile);

      formData.append(
        "InvoiceFile",
        invoiceBase64 || selectedRow?.InvoiceFilePath || ""
      );

      formData.append(
        "WarrantyFile",
        warrantyBase64 || selectedRow?.WarrantyFilePath || ""
      );
      formData.append("Remarks", editForm.Remarks);
      formData.append("Reusable", 0);

      await SpareService.update(formData);
      setSuccessType("U");
      setShowSuccessModal(true);
      setSideMode("details");
      loadSpares();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to update spare" });
    }
  };

  const resetFilters = () => {
    setFilterVendor("");
    setFilterManufacturer("");
    setFilterStatus("");
    setFilterType("");
    setFilterAssetId("");
    setFilterServiceStatus("");
  };

  const closeFilterPopup = () => setShowFilterPanel(false);

  const getAssetQrValue = (item = {}) => {
    const qrValue = item?.QRCode || item?.QRcode || item?.QrCode || "";
    return String(qrValue || item?.SpareID || item?.Id || "").trim();
  };

  const getAssetNameValue = (item = {}) =>
    String(item?.SpareType || item?.Name || item?.name || item?.AssetName || item?.assetName || "").trim();

  const downloadAssetQRCode = async (item = {}) => {
    const qrValue = getAssetQrValue(item);
    if (!qrValue) {
      alert("No QR found");
      return;
    }

    setIsDownloadingQR(true);
    setDownloadQRProgress(0);

    const pdf = new jsPDF("p", "mm", "a4");

    const container = document.createElement("div");
    container.style.width = "400px";
    container.style.height = "600px";
    container.style.position = "relative";
    container.style.background = "#fff";

    const img = new Image();
    img.src = "/Assets/canva-template.png";
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
    nameText.innerText = getAssetNameValue(item).toUpperCase();
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

    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.7);
    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
    document.body.removeChild(container);

    setDownloadQRProgress(100);
    const assetName = getAssetNameValue(item) || "Spare";
    pdf.save(`${assetName}_QR.pdf`);
    setIsDownloadingQR(false);
    setDownloadQRProgress(0);
  };

  const downloadAllQRCodes = async () => {
    const assets = filteredSpares;
    if (!assets || assets.length === 0) {
      alert("No spares found");
      return;
    }

    setIsDownloadingQR(true);
    setDownloadQRProgress(0);

    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < assets.length; i++) {
      setDownloadQRProgress(Math.round((i / assets.length) * 100));
      const item = assets[i];
      const qrValue = getAssetQrValue(item);

      const container = document.createElement("div");
      container.style.width = "400px";
      container.style.height = "600px";
      container.style.position = "relative";
      container.style.background = "#fff";

      const img = new Image();
      img.src = "/Assets/canva-template.png";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.position = "absolute";

      await new Promise((resolve) => { img.onload = resolve; });
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
      nameText.innerText = getAssetNameValue(item).toUpperCase();
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

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.7);
      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      document.body.removeChild(container);
    }

    setDownloadQRProgress(100);
    pdf.save("Spare_Assets_QR.pdf");
    setIsDownloadingQR(false);
    setDownloadQRProgress(0);
  };

  const selectedAsset = selectedRow ? assetById.get(Number(selectedRow.AssetID)) : null;
  const selectedStatus = statusMeta(selectedRow?.Status);
  const selectedStatusLabel = String(selectedRow?.Status || "").trim() || selectedStatus.label;
  const selectedQrValue = selectedRow?.QRCode || selectedRow?.SpareID;

  const exportSparesToExcel = (rows) => {
    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.innerText = text || "";
      return div.innerHTML;
    };

    const headers = [
      "ID",
      "Type",
      "Asset",
      "Asset ID",
      "Serial Number",
      "Vendor",
      "Quantity",
      "Back-up Time",
      "Purchase Date",
      "Expiry Date",
      "Value",
      "Status",
    ];

    const tableRows = (rows || [])
      .map((row) => {
        const asset = assetById.get(Number(row.AssetID));
        const assetName = asset?.Name || asset?.name || "-";
        const meta = statusMeta(row?.Status);
        const value = getSpareValue(row);

        return `
          <tr style="height:30px;">
            <td>${escapeHtml(row.SpareID)}</td>
            <td>${escapeHtml(row.SpareType)}</td>
            <td>${escapeHtml(assetName)}</td>
            <td>${escapeHtml(row.AssetID)}</td>
            <td>${escapeHtml(row.SerialNumber)}</td>
            <td>${escapeHtml(row.VendorName)}</td>
            <td>${escapeHtml(row.Quantity)}</td>
            <td>${escapeHtml(row.BackupTime)}</td>
            <td>${escapeHtml(formatDisplayDate(row.PurchaseDate))}</td>
            <td>${escapeHtml(formatDisplayDate(row.ExpiryDate))}</td>
            <td>${escapeHtml(value)}</td>
            <td>${escapeHtml(meta.label)}</td>
          </tr>
        `;
      })
      .join("");

    const tableHeaders = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charSet="utf-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Spare Assets</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #d0d7de; padding: 8px; }
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
    link.download = "SpareAssets.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const renderDetailsPanel = () => {
    if (!selectedRow) return null;
    return (
      <div className="asset-side-panel asset-details-view-panel">
        <div className="asset-side-panel-header">
          <h4 className="asset-side-panel-title">Spare part Details</h4>
        </div>
        <div className="asset-side-panel-body">
          <div className="asset-details-new-layout">
            <div className="asset-details-row asset-details-header-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value">{selectedRow.SpareID}</span>
            </div>

            <div className="asset-details-row asset-details-name-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Name</span>
                <span className="asset-info-value">{selectedRow.SpareType || "-"}</span>
              </div>
              <span className={`asset-status-badge asset-status-badge-${selectedStatus.key}`}>{selectedStatusLabel}</span>
            </div>

            {/* <div className="asset-details-row asset-details-desc-row">
              <div className="asset-info-item">
                <span className="asset-info-label">Description</span>
                <span className="asset-info-value">{selectedRow.Description || selectedRow.description || "-"}</span>
              </div>
            </div> */}

            <div className="asset-details-grid">
              <div className="asset-info-item asset-info-full">
                <span className="asset-info-label">Serial number</span>
                <span className="asset-info-value">{selectedRow.SerialNumber || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Asset</span>
                <span className="asset-info-value">{selectedAsset?.Name || selectedAsset?.name || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Asset ID</span>
                <span className="asset-info-value">{selectedRow.AssetID || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Vendor</span>
                <span className="asset-info-value">{selectedRow.VendorName || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Quantity</span>
                <span className="asset-info-value">{selectedRow.Quantity ?? "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Type</span>
                <span className="asset-info-value">{selectedRow.SpareType || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Back up time</span>
                <span className="asset-info-value">{selectedRow.BackupTime || "-"}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Purchase date</span>
                <span className="asset-info-value">{formatDisplayDate(selectedRow.PurchaseDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Expiry date</span>
                <span className="asset-info-value">{formatDisplayDate(selectedRow.ExpiryDate)}</span>
              </div>
              <div className="asset-info-item">
                <span className="asset-info-label">Value</span>
                <span className="asset-info-value">{getSpareValue(selectedRow) || "-"}</span>
              </div>
            </div>
          </div>

          <div className="asset-details-docs-section">
            <div className="asset-qr-preview-box">
              <div className="asset-qr-wrapper" aria-label="QR code preview">
                {selectedQrValue ? <QRCode value={selectedQrValue} size={72} bgColor="transparent" /> : null}
              </div>
              {selectedQrValue ? (
                <button
                  type="button"
                  className="asset-doc-link-text asset-download-qr-link"
                  onClick={() => downloadAssetQRCode(selectedRow)}
                >
                  Download QR
                  <i className="fa fa-download" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {(() => {
              const openDocument = (filePath) => {
                if (!filePath) return;

                if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                  window.open(filePath, "_blank");
                  return;
                }

                const baseUrl = "https://api.urest.in:8096/";
                const fullUrl = baseUrl + filePath.replace(/\\/g, "/");
                window.open(fullUrl, "_blank");
              };

              const invoiceSrc = selectedRow?.InvoiceFilePath || "";
              const warrantySrc = selectedRow?.WarrantyFilePath || "";

              return (
                <div className="asset-doc-links-stack asset-doc-links-stack-view">
                  <div className="asset-doc-link-item">
                    <div className="asset-doc-icon-wrapper">
                      <i className="fa fa-file-text" aria-hidden="true" />
                    </div>
                    {invoiceSrc ? (
                      <button type="button" className="asset-doc-link-text" onClick={() => openDocument(invoiceSrc)}>
                        Invoice
                      </button>
                    ) : (
                      <span className="asset-doc-link-text disabled">Invoice</span>
                    )}
                  </div>
                  <div className="asset-doc-link-item">
                    <div className="asset-doc-icon-wrapper">
                      <i className="fa fa-file-text" aria-hidden="true" />
                    </div>
                    {warrantySrc ? (
                      <button type="button" className="asset-doc-link-text" onClick={() => openDocument(warrantySrc)}>
                        Warranty card
                      </button>
                    ) : (
                      <span className="asset-doc-link-text disabled">Warranty card</span>
                    )}
                  </div>
                </div>
              );
            })()}
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
    const updateEditField = (field, value) => setEditForm((prev) => ({ ...prev, [field]: value }));
    return (
      <div className="asset-side-panel asset-side-panel-form spare-side-panel asset-side-panel-form-edit">
        <div className="asset-side-panel-header asset-form-new-header">
          <div className="asset-panel-title-wrap">
            <span className="asset-form-icon-circle">
              <i className="fa fa-pencil-square-o" aria-hidden="true" />
            </span>
            <h4 className="asset-side-panel-title">Edit spare part details</h4>
          </div>
        </div>
        <div className="asset-side-panel-body spare-side-panel-body">
          <div className="asset-qr-preview">
            <div className="asset-qr-wrapper" aria-label="QR code preview">
              {selectedQrValue ? <QRCode value={selectedQrValue} size={120} bgColor="transparent" /> : null}
            </div>
          </div>

          <div className="asset-form-simple-stack spare-form-grid">
            <div className="asset-form-id-row-simple spare-readonly-row">
              <span className="asset-info-label">ID</span>
              <span className="asset-info-value">{editForm.SpareID || "-"}</span>
            </div>

            <div className="asset-form-group-custom">
              <label>Name</label>
              <input className="form-control" value={editForm.SpareType} onChange={(e) => updateEditField("SpareType", e.target.value)} />
            </div>

            <div className="asset-form-group-custom">
              <label>Status</label>
              <CustomDropdown
                variant="short"
                value={editForm.Status}
                onChange={(e) => updateEditField("Status", e.target.value)}
                placeholder="Select status"
                options={[
                  { label: "Active", value: "Running" },
                  { label: "Inactive", value: "Inactive" },
                  { label: "Servicing", value: "Servicing" }
                ]}
              />
            </div>

            {/* <div className="asset-form-group-custom">
              <label>Description</label>
              <textarea rows="4" className="form-control" value={editForm.Remarks} onChange={(e) => updateEditField("Remarks", e.target.value)} />
            </div> */}

            <div className="asset-form-group-custom">
              <label>Serial number</label>
              <input className="form-control" value={editForm.SerialNumber} onChange={(e) => updateEditField("SerialNumber", e.target.value)} />
            </div>

            <div className="asset-form-group-custom">
              <label>Asset</label>
              <CustomDropdown
                variant="long"
                value={editForm.AssetID}
                onChange={(e) => {
                  const nextAsset = assetOptions.find((item) => String(item.value) === String(e.target.value));
                  setEditForm((prev) => ({
                    ...prev,
                    AssetID: e.target.value,
                    AssetName: nextAsset?.label || "",
                  }));
                }}
                placeholder="Asset name or ID"
                options={assetOptions}
              />
            </div>

            <div className="asset-form-row-two-col">
              <div className="asset-form-group-custom">
                <label>Vendor</label>
                <input className="form-control" value={editForm.VendorName} onChange={(e) => updateEditField("VendorName", e.target.value)} />
              </div>
              <div className="asset-form-group-custom">
                <label>Quantity</label>
                <input type="number" min="1" className="form-control" value={editForm.Quantity ?? 1} onChange={(e) => updateEditField("Quantity", e.target.value)} />
              </div>

              <div className="asset-form-group-custom">
                <label>Type</label>
                <input className="form-control" value={editForm.SpareType} onChange={(e) => updateEditField("SpareType", e.target.value)} />
              </div>
              <div className="asset-form-group-custom">
                <label>Back-up time</label>
                <input type="time" step="1" className="form-control" value={editForm.BackupTime || ""} onChange={(e) => updateEditField("BackupTime", e.target.value)} />
              </div>
              {/* <div className="asset-form-group-custom">
                <label>Model</label>
                <input className="form-control" value={editForm.Model || ""} readOnly />
              </div> */}
            </div>

            <div className="asset-form-row-two-col">


              {/* <div className="asset-form-group-custom">
                <label>Manufacturer</label>
                <input className="form-control" value={editForm.Manufacturer || ""} readOnly />
              </div> */}
            </div>

            <div className="asset-form-row-two-col">


            </div>

            <div className="asset-form-row-two-col">
              <div className="asset-form-group-custom">
                <label>Purchase date</label>
                <CustomDatePicker value={editForm.PurchaseDate || ""} onChange={(e) => updateEditField("PurchaseDate", e.target.value)} popupAnchorSelector=".asset-form-group-custom" />
              </div>
              <div className="asset-form-group-custom">
                <label>Expiry date</label>
                <CustomDatePicker value={editForm.ExpiryDate || ""} onChange={(e) => updateEditField("ExpiryDate", e.target.value)} popupAnchorSelector=".asset-form-group-custom" />
              </div>
            </div>

            <div className="asset-form-group-custom">
              <label>Value</label>
              <input className="form-control" value={editForm.Value || ""} onChange={(e) => updateEditField("Value", e.target.value)} />
            </div>

            <div className="asset-form-group-custom">
              <label>Invoice</label>
              <div className="asset-file-input-wrapper">
                <input type="text" className="form-control" value={editForm.InvoiceFileName || ""} readOnly />
                <i className="fa fa-file-text-o asset-file-icon" />
                <input
                  type="file"
                  className="asset-file-hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditForm((prev) => ({
                      ...prev,
                      InvoiceFile: file,
                      InvoiceFileName: file?.name || ""
                    }));
                  }}
                />
              </div>
            </div>

            <div className="asset-form-group-custom">
              <label>Warranty card</label>
              <div className="asset-file-input-wrapper">
                <input type="text" className="form-control" value={editForm.WarrantyFileName || ""} readOnly />
                <i className="fa fa-file-text-o asset-file-icon" />
                <input
                  type="file"
                  className="asset-file-hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditForm((prev) => ({
                      ...prev,
                      WarrantyFile: file,
                      WarrantyFileName: file?.name || ""
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="asset-side-panel-footer">
          <button type="button" className="btn btn-primary" onClick={saveEdit}>
            Save changes
          </button>
          <button
            type="button"
            className="btn btn-light"
            onClick={() =>
              requestCancelConfirm(() => {
                setSelectedSpareId(null);
                setSideMode("details");
                setEditForm(null);
              })
            }
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="content-wrapper">
      <Toast ref={toast} />
      {isDownloadingQR && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "white" }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: "48px", marginBottom: "16px" }} />
          <h4 style={{ color: "white", margin: 0 }}>Generating PDF: {downloadQRProgress}%</h4>
        </div>
      )}
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
                    <span className="asset-master-tab-label">Owned assets</span>
                  </button>
                  <button type="button" className="asset-master-tab" onClick={() => history.push("/Account/App/RentalAssets")}>
                    <span className="asset-master-tab-label">Rented assets</span>
                  </button>
                  <button type="button" className="asset-master-tab active">
                    <span className="asset-master-tab-label">Spare parts</span>
                    <span className="asset-master-tab-count">{spares.length}</span>
                  </button>
                </div>

                <div className="asset-master-toolbar">
                  <div className="asset-master-search" onClick={() => searchInputRef.current?.focus()}>
                    <i className="fa fa-search" aria-hidden="true" />
                    <input ref={searchInputRef} type="text" placeholder="Search by name or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <div className="asset-master-toolbar-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ backgroundColor: "#1f4e7a", borderColor: "#1f4e7a", color: "#ffffff" }}
                      onClick={downloadAllQRCodes}
                    >
                      Download QR
                    </button>
                    <button type="button" className={`btn asset-toolbar-filter ${showFilterPanel ? "active" : ""}`} onClick={() => setShowFilterPanel((prev) => !prev)}>
                      <i className="fa fa-sliders" aria-hidden="true" />
                      Filter
                    </button>
                    <button type="button" className="asset-export-btn" onClick={() => exportSparesToExcel(filteredSpares)}>
                      <i className="fa fa-external-link" aria-hidden="true" />
                      Export
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary asset-toolbar-add"
                      onClick={() => {
                        resetAddForm();
                        setShowAddModal(true);
                      }}
                    >
                      <i className="fa fa-plus" aria-hidden="true" />
                      Add spare part
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
                        <label>Asset</label>
                        <CustomDropdown
                          variant="long"
                          value={filterAssetId}
                          onChange={(e) => setFilterAssetId(e.target.value)}
                          placeholder="Enter name"
                          options={assetOptions}
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
                      <button type="button" className="asset-filter-apply" onClick={closeFilterPopup}>
                        Apply filters
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className={`asset-master-table-wrap asset-master-table-wrap-spare ${selectedSpareId ? "has-selection" : ""}`.trim()}>
                  <div className="table-responsive">
                    <table className="table custTable table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Asset</th>
                          <th>Expiry date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSpares.map((row) => {
                          const meta = statusMeta(row?.Status);
                          const asset = assetById.get(Number(row.AssetID));
                          const isActive = Number(row.SpareID) === Number(selectedSpareId);
                          const isOverdueAsset = String(getServiceStatus(row)).toLowerCase() === "overdue";
                          return (
                            <tr key={row.SpareID} className={`${isActive ? "grid-selected-row" : ""} ${isOverdueAsset ? "asset-overdue-row" : ""}`.trim()} onClick={() => onRowClick(row)}>
                              <td>{row.SpareID || "-"}</td>
                              <td>{row.SpareType || "-"}</td>
                              <td>{asset?.Name || asset?.name || "-"}</td>
                              <td>{formatDisplayDate(row.ExpiryDate)}</td>
                              <td>
                                <span className={`spare-table-status spare-table-status-${meta.key}`}>{meta.label}</span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <button type="button" className="btn btn-sm btn-info" title="Edit" onClick={() => openEditPanel(row)}>
                                  <i className="fa fa-pencil-square-o" aria-hidden="true" />
                                </button>
                                <button type="button" className="btn btn-sm btn-danger" title="Delete" onClick={() => confirmDelete(row)}>
                                  <i className="fa fa-trash-o" aria-hidden="true" />
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
                  {filteredSpares.length > ROWS_PER_PAGE ? (
                    <div className="asset-owned-pagination">
                      <span>{`Showing ${(safeCurrentPage - 1) * ROWS_PER_PAGE + 1}-${Math.min(safeCurrentPage * ROWS_PER_PAGE, filteredSpares.length)} of ${filteredSpares.length}`}</span>
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
                      <CustomDropdown
                        variant="long"
                        value={assetId}
                        onChange={(e) => setAssetId(e.target.value)}
                        placeholder="Asset name or ID"
                        options={assetOptions}
                      />
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

                        <div className="asset-qr-actions" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                          <button
                            type="button"
                            className="spare-add-generate"
                            onClick={() => {
                              if (!row.QRCode) {
                                generateQRCode(index);
                                return;
                              }
                              toggleQR(index);
                            }}
                          >
                            <i className="fa fa-qrcode" />
                            {!row.QRCode ? "Generate QR code" : row.showQR ? "Hide QR code" : "View QR code"}
                          </button>
                          {row.QRCode && row.showQR ? (
                            <div className="asset-add-qr-block" style={{ justifyContent: "flex-start", marginTop: "8px", marginBottom: "0" }}>
                              <div className="asset-add-qr-preview">
                                <QRCode value={row.QRCode} size={84} />
                              </div>
                            </div>
                          ) : null}

                        </div>

                        {/* ✅ QR preview ALWAYS BELOW buttons */}

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
                            <input type="time" step="1" className="form-control" value={row.BackupTime || ""} onChange={(e) => updateRow(index, "BackupTime", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Status</label>
                            <CustomDropdown
                              variant="short"
                              value={row.Status}
                              onChange={(e) => updateRow(index, "Status", e.target.value)}
                              placeholder="Select status"
                              options={[
                                { label: "Active", value: "Running" },
                                { label: "Servicing", value: "Servicing" },
                                { label: "Inactive", value: "Inactive" }
                              ]}
                            />
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
                            <CustomDatePicker value={normalizeDateOnly(row.PurchaseDate)} onChange={(e) => updateRow(index, "PurchaseDate", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Expiry date</label>
                            <CustomDatePicker value={normalizeDateOnly(row.ExpiryDate)} onChange={(e) => updateRow(index, "ExpiryDate", e.target.value)} />
                          </div>
                          <div className="spare-add-field">
                            <label>Add invoice</label>
                            <div className="asset-file-input-wrapper">
                              <input type="text" className="form-control" placeholder="Upload file" value={row.InvoiceFileName || ""} readOnly />
                              <i className="fa fa-file-text-o asset-file-icon" />
                              <input
                                type="file"
                                className="asset-file-hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  updateRow(index, "InvoiceNo", file);
                                  updateRow(index, "InvoiceFileName", file?.name || "");
                                }}
                              />
                            </div>
                          </div>
                          <div className="spare-add-field">
                            <label>Add warranty</label>
                            <div className="asset-file-input-wrapper">
                              <input type="text" className="form-control" placeholder="Upload file" value={row.WarrantyFileName || ""} readOnly />
                              <i className="fa fa-file-text-o asset-file-icon" />
                              <input
                                type="file"
                                className="asset-file-hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  updateRow(index, "Warranty", file);
                                  updateRow(index, "WarrantyFileName", file?.name || "");
                                }}
                              />
                            </div>
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
                      {sideMode === "edit" ? "Cancel edits" : "Cancel action"}
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowCancelConfirm(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-confirm-body">
                    {sideMode === "edit"
                      ? "Are you sure you want to cancel? All your updated information will be lost."
                      : "Are you sure you want to cancel? All your entered information will be lost."}
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
                        <span className="asset-dialog-assetvalue">{assetById.get(Number(deleteTarget.AssetID))?.Location || "-"}</span>
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
                      {successType === "U" ? "Changes updated successfully" : "Item created successfully"}
                    </div>
                    <button type="button" className="spare-add-close" onClick={() => setShowSuccessModal(false)}>
                      <i className="fa fa-times" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="asset-side-panel-body">
                    {successType === "U" ? "The item has been updated." : "The item is ready. You can now monitor its progress."}
                  </div>
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

