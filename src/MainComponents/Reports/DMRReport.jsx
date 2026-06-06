"use client";

import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { useSelector } from "react-redux";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "jspdf-autotable";

import { masterConfigCss } from "../../ReactComponents/MasterConfig/masterConfigTheme";
import {
  fetchDmrReport,
  fetchLayoutConfig,
  fetchPdfLayoutConfig,
} from "../../Services/ReportService";
import DMRLayoutDesigner, { buildDefaultConfig, mergeConfig } from "./DMRLayoutDesigner";
import DMRPdfLayoutDesigner, { buildDefaultPdfConfig } from "./DMRPdfLayoutDesigner";
import DMREmailConfig from "./DMREmailConfig";

/* Register Chart.js components (idempotent — safe alongside BarChart.js registration) */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* ─── Page-specific CSS ───────────────────────────────────────────────────── */
const dmrCss = `
.dmr-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:0;border-radius:4px;font-size:13px;font-weight:700;padding:0 14px;cursor:pointer;transition:background .15s;}
.dmr-btn:disabled{opacity:.45;cursor:not-allowed;}
.dmr-btn.primary{background:#245789;color:#fff;}
.dmr-btn.primary:hover:not(:disabled){background:#1f4f82;}
.dmr-btn.ghost{background:#fff;border:1px solid #d8dee6;color:#58626d;}
.dmr-btn.ghost:hover:not(:disabled){background:#f0f5fa;border-color:#245789;color:#245789;}
.dmr-btn.success{background:#0f6e35;color:#fff;}
.dmr-btn.success:hover:not(:disabled){background:#0b5829;}
.dmr-btn.pdf-dl{background:#b91c1c;color:#fff;}
.dmr-btn.pdf-dl:hover:not(:disabled){background:#991b1b;}
.dmr-filter-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;padding:12px 14px 14px;}
.dmr-cal .p-inputtext{height:32px;border:1px solid #d8dee6;border-radius:5px;background:#f4f7fa;color:#3f4750;padding:0 10px;font-size:13px;width:160px;}
.dmr-cal .p-inputtext:enabled:hover{border-color:#245789;}
.dmr-cal .p-inputtext:enabled:focus{outline:none;border-color:#245789;background:#fff;box-shadow:none;}
.dmr-cal .p-button{height:32px;width:32px;background:#edf1f5;border:1px solid #d8dee6;border-left:0;border-radius:0 5px 5px 0;color:#55606c;}
.dmr-cal .p-button:hover{background:#d9e8f8;color:#245789;}
.dmr-section{background:#fff;border:1px solid #d7dde4;border-radius:12px;overflow:hidden;margin-bottom:12px;}
.dmr-section-hd{display:flex;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid #e7ecf1;}
.dmr-section-ico{width:26px;height:26px;border-radius:50%;background:#d9ebfa;color:#2a5a86;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
.dmr-section-title{font-size:15px;font-weight:700;color:#333c45;flex:1;}
.dmr-section-count{font-size:12px;font-weight:700;color:#365676;background:#d9e8f7;padding:2px 9px;border-radius:999px;}
.dmr-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:10px;padding:12px 14px;}
.dmr-kpi-card{background:#f5f8fc;border:1px solid #d8e4f0;border-radius:8px;padding:12px 14px;}
.dmr-kpi-label{font-size:10px;font-weight:700;color:#66707a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;}
.dmr-kpi-val{font-size:22px;font-weight:700;color:#245789;line-height:1.1;}
.dmr-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;gap:10px;color:#66707a;font-size:13px;}
.dmr-loading-spinner{width:36px;height:36px;border:3px solid #d9e8f8;border-top-color:#245789;border-radius:50%;animation:dmr-spin .8s linear infinite;}
@keyframes dmr-spin{to{transform:rotate(360deg)}}
.dmr-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;gap:8px;color:#9ba5ae;}
.dmr-empty-state i{font-size:32px;color:#d8dee6;}
.dmr-empty-state p{margin:0;font-size:13px;}
.dmr-view-tabs{display:flex;gap:6px;margin-bottom:10px;}
.dmr-img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:12px 14px;}
.dmr-img-card{border:1px solid #d8dee6;border-radius:8px;overflow:hidden;background:#fff;}
.dmr-img-card img{width:100%;height:140px;object-fit:cover;display:block;}
.dmr-img-caption{padding:4px 8px;font-size:11px;color:#55606c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dmr-dl-group{display:flex;gap:4px;}
`;

/* ─── Section icon map ────────────────────────────────────────────────────── */
const SECTION_ICONS = {
  Assets: "pi pi-box",
  Spares: "pi pi-wrench",
  Services: "pi pi-cog",
  Rentals: "pi pi-tag",
  Tasks: "pi pi-check-square",
  Tickets: "pi pi-ticket",
  "Asset Summary": "pi pi-chart-bar",
  Alerts: "pi pi-bell",
  "Monthly Trends": "pi pi-chart-line",
};

/* ─── Chart defaults per module ───────────────────────────────────────────── */
const MODULE_CHART_CONFIG = {
  Tasks:        { chartType: "bar",      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"] },
  Tickets:      { chartType: "pie",      colors: ["#3b82f6", "#f97316", "#10b981", "#e11d48"] },
  Assets:       { chartType: "bar",      colors: ["#0ea5e9", "#38bdf8", "#7dd3fc"] },
  AssetSummary: { chartType: "bar",      colors: ["#8b5cf6", "#06b6d4"] },
  Alerts:       { chartType: "bar",      colors: ["#ef4444", "#f97316"] },
  MonthlyTrends:{ chartType: "line",     colors: ["#245789"] },
  Spares:       { chartType: "bar",      colors: ["#7c3aed"] },
  Services:     { chartType: "bar",      colors: ["#0f6e35"] },
  Rentals:      { chartType: "bar",      colors: ["#b45309"] },
};

/* ─── Resolve the best label/value fields from a data row ─────────────────── */
const resolveChartFields = (data, preferLabel, preferValue) => {
  if (!Array.isArray(data) || !data.length) return { labels: [], values: [] };
  const keys = Object.keys(data[0]);
  const lk = keys.includes(preferLabel)
    ? preferLabel
    : keys.find((k) => typeof data[0][k] === "string") || keys[0];
  const vk = keys.includes(preferValue)
    ? preferValue
    : keys.find((k) => typeof data[0][k] === "number") || keys[1] || keys[0];
  return {
    labels: data.map((r) => String(r[lk] ?? "")),
    values: data.map((r) => Number(r[vk] ?? 0)),
  };
};

/* ─── Component ───────────────────────────────────────────────────────────── */
const DmrReportPage = () => {
  const toast = useRef(null);
  const propertyId = useSelector((state) => state.Commonreducer.puidn);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  /* Layout configs */
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [pdfLayoutConfig, setPdfLayoutConfig] = useState(null);

  /* Dialog visibility */
  const [showDesigner, setShowDesigner] = useState(false);
  const [showPdfDesigner, setShowPdfDesigner] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  /* View mode */
  const [viewMode, setViewMode] = useState("tables");

  /* Download state */
  const [downloading, setDownloading] = useState(false);

  /* Load saved Excel layout on mount */
  useEffect(() => {
    if (!propertyId) return;
    fetchLayoutConfig(propertyId)
      .then((res) => {
        if (res?.layoutJson) {
          try { setSavedConfig(JSON.parse(res.layoutJson)); } catch { }
        }
      })
      .catch(() => { });
  }, [propertyId]);

  /* Load saved PDF layout on mount */
  useEffect(() => {
    if (!propertyId) return;
    fetchPdfLayoutConfig(propertyId)
      .then((res) => {
        if (res?.layoutJson) {
          try { setPdfLayoutConfig(JSON.parse(res.layoutJson)); } catch { }
        }
      })
      .catch(() => { });
  }, [propertyId]);

  /* Merge saved Excel config with live data */
  useEffect(() => {
    if (!report) return;
    setLayoutConfig(
      savedConfig ? mergeConfig(savedConfig, report) : buildDefaultConfig(report)
    );
  }, [report, savedConfig]);

  /* Format date yyyy-mm-dd */
  const fmt = (d) => {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  /* Load report */
  const loadReport = async () => {
    if (!fromDate || !toDate) {
      toast.current?.show({ severity: "warn", summary: "Validation", detail: "Please select From Date and To Date" });
      return;
    }
    try {
      setLoading(true);
      setReport(null);
      setViewMode("tables");
      const data = await fetchDmrReport(propertyId, fmt(fromDate), fmt(toDate));
      setReport(data);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to load DMR report" });
    } finally {
      setLoading(false);
    }
  };

  /* ── CHART RENDERER ──────────────────────────────────────────────────── */
  const renderChart = (moduleKey, data, overrideType = null) => {
    const cfg = MODULE_CHART_CONFIG[moduleKey] || { chartType: "bar", colors: ["#245789"] };
    const type = overrideType || cfg.chartType;
    const { labels, values } = resolveChartFields(data, null, null);
    if (!labels.length) return null;

    const chartData = {
      labels,
      datasets: [{
        label: moduleKey,
        data: values,
        backgroundColor: cfg.colors,
        borderColor: cfg.colors,
        fill: false,
        tension: 0.3,
      }],
    };
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: type === "pie" || type === "doughnut" } },
    };

    return (
      <div style={{ height: 260, padding: "8px 14px 14px" }}>
        {type === "pie"      && <Pie      data={chartData} options={opts} />}
        {type === "doughnut" && <Doughnut data={chartData} options={opts} />}
        {type === "bar"      && <Bar      data={chartData} options={opts} />}
        {type === "line"     && <Line     data={chartData} options={opts} />}
      </div>
    );
  };

  /* ── TABLE RENDERER ──────────────────────────────────────────────────── */
  const renderTable = (title, data) => {
    if (!Array.isArray(data) || data.length === 0) return null;
    const icon = SECTION_ICONS[title] || "pi pi-table";
    return (
      <div className="dmr-section" key={title}>
        <div className="dmr-section-hd">
          <div className="dmr-section-ico"><i className={icon} /></div>
          <span className="dmr-section-title">{title}</span>
          <span className="dmr-section-count">{data.length} rows</span>
        </div>
        <div style={{ padding: "8px 6px 4px" }}>
          <DataTable
            value={data}
            paginator
            rows={10}
            stripedRows
            showGridlines
            responsiveLayout="scroll"
            size="small"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            rowsPerPageOptions={[10, 25, 50]}
          >
            {Object.keys(data[0]).map((col) => (
              <Column key={col} field={col} header={col} sortable style={{ minWidth: "100px" }} />
            ))}
          </DataTable>
        </div>
      </div>
    );
  };

  /* ── IMAGES GALLERY ──────────────────────────────────────────────────── */
  const renderImagesGallery = (documents) => {
    const imageItems = [];
    if (Array.isArray(documents)) {
      documents.forEach((doc) => {
        Object.entries(doc).forEach(([key, val]) => {
          if (typeof val === "string" && /\.(jpg|jpeg|png|gif|webp|bmp)/i.test(val)) {
            imageItems.push({
              url: val,
              caption: doc.FileName || doc.Name || doc.DocumentName || key,
            });
          }
        });
      });
    }

    if (!imageItems.length) {
      return (
        <div className="dmr-empty-state">
          <i className="pi pi-images" />
          <p>No image URLs found in Documents data for this period</p>
        </div>
      );
    }

    return (
      <div className="dmr-img-grid">
        {imageItems.map((item, i) => (
          <div className="dmr-img-card" key={i}>
            <img
              src={item.url}
              alt={item.caption}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="dmr-img-caption" title={item.caption}>{item.caption}</div>
          </div>
        ))}
      </div>
    );
  };

  /* ── EXCEL DOWNLOAD ──────────────────────────────────────────────────── */
  const downloadExcel = async () => {
    if (!report) return;
    const config = layoutConfig || buildDefaultConfig(report);
    if (!config.sheets?.length) return;

    const wb = new ExcelJS.Workbook();
    const LIGHT = { style: "thin", color: { argb: "FFE0E0E0" } };

    for (const sheet of config.sheets) {
      if (!sheet.sections?.length) continue;
      const ws = wb.addWorksheet(sheet.label.substring(0, 31));
      let rowNum = 1;

      for (let si = 0; si < sheet.sections.length; si++) {
        const sec = sheet.sections[si];
        const cols = sec.columns.filter((c) => c.enabled);
        if (!cols.length) continue;

        const usedModules = [...new Set(cols.map((c) => c.moduleKey || sec.moduleKey).filter(Boolean))];
        const maxRows = Math.max(0, ...usedModules.map((mk) => (Array.isArray(report[mk]) ? report[mk].length : 0)));
        if (maxRows === 0) continue;

        const bg = "FF" + (sec.headerBgColor || "003366").replace("#", "");

        if (sec.showSectionHeader) {
          const cell = ws.getRow(rowNum).getCell(1);
          cell.value = sec.sectionLabel;
          cell.font = { bold: true, size: 12, color: { argb: bg } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F4FF" } };
          if (cols.length > 1) ws.mergeCells(rowNum, 1, rowNum, cols.length);
          ws.getRow(rowNum).height = 20;
          rowNum++;
        }

        const hRow = ws.getRow(rowNum);
        cols.forEach((col, ci) => {
          const cell = hRow.getCell(ci + 1);
          cell.value = col.label;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
          cell.font = { bold: sec.headerFontBold !== false, color: { argb: "FFFFFFFF" }, size: 11 };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        });
        hRow.height = 22;
        rowNum++;

        for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
          const dRow = ws.getRow(rowNum);
          cols.forEach((col, ci) => {
            const mk = col.moduleKey || sec.moduleKey;
            const rowData = Array.isArray(report[mk]) ? report[mk][rowIdx] : null;
            const cell = dRow.getCell(ci + 1);
            cell.value = rowData?.[col.key] ?? "";
            cell.border = { top: LIGHT, bottom: LIGHT, left: LIGHT, right: LIGHT };
          });
          rowNum++;
        }

        if (si < sheet.sections.length - 1) rowNum++;
      }

      if (ws.rowCount === 0) continue;

      for (let ci = 1; ci <= ws.columnCount; ci++) {
        let maxLen = 10;
        ws.getColumn(ci).eachCell({ includeEmpty: false }, (cell) => {
          const len = cell.value != null ? String(cell.value).length : 0;
          if (len > maxLen) maxLen = len;
        });
        ws.getColumn(ci).width = Math.min(maxLen + 2, 40);
      }
    }

    if (!wb.worksheets.length) {
      toast.current?.show({ severity: "warn", summary: "Empty", detail: "No enabled sections to export" });
      return;
    }

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `DMR_Report_${fmt(fromDate) || "export"}.xlsx`
    );
  };

  /* ── PDF DOWNLOAD ────────────────────────────────────────────────────── */
  const downloadPdf = async () => {
    if (!report) return;
    try {
      setDownloading(true);

      /* Build section list from saved PDF config or fall back to defaults */
      const sections = (pdfLayoutConfig?.sections?.filter((s) => s.enabled)) ||
        buildDefaultPdfConfig(report).sections;

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      /* Cover header */
      doc.setFontSize(18);
      doc.setTextColor(36, 87, 137);
      doc.text("Daily Management Report", pageW / 2, 44, { align: "center" });
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Period: ${fmt(fromDate) || "—"} to ${fmt(toDate) || "—"}   |   Generated: ${new Date().toLocaleString()}`,
        pageW / 2, 60, { align: "center" }
      );

      /* KPI summary table */
      if (report.Kpis && Object.keys(report.Kpis).length) {
        const kpiBody = Object.entries(report.Kpis).map(([k, v]) => [k, String(v ?? "—")]);
        autoTable(doc, {
          head: [["Metric", "Value"]],
          body: kpiBody,
          startY: 72,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [36, 87, 137], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [240, 247, 252] },
          margin: { left: 30, right: 30 },
        });
      }

      /* Data sections */
      for (const sec of sections) {
        const {
          moduleKey,
          showTable = true,
          headerColor = "#245789",
        } = sec;

        const data = report[moduleKey];
        if (!Array.isArray(data) || !data.length) continue;

        const hex = headerColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) || 36;
        const g = parseInt(hex.substring(2, 4), 16) || 87;
        const b = parseInt(hex.substring(4, 6), 16) || 137;

        if (showTable) {
          const head = [Object.keys(data[0])];
          const body = data.map((row) =>
            Object.values(row).map((v) =>
              v == null ? "" : v instanceof Date ? v.toLocaleDateString() : String(v)
            )
          );

          autoTable(doc, {
            head,
            body,
            startY: (doc.lastAutoTable?.finalY || 80) + 16,
            didDrawPage: (hookData) => {
              doc.setFontSize(11);
              doc.setTextColor(r, g, b);
              doc.setFont(undefined, "bold");
              doc.text(moduleKey, 30, (doc.lastAutoTable?.finalY || 70) + 10);
              doc.setFont(undefined, "normal");
            },
            styles: { fontSize: 8, overflow: "linebreak", cellPadding: 3 },
            headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            margin: { left: 30, right: 30 },
          });
        }
      }

      /* Footer */
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Page ${i} of ${pageCount}   |   Urest DMR System`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 18,
          { align: "center" }
        );
      }

      doc.save(`DMR_Report_${fmt(fromDate) || "export"}.pdf`);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "PDF Error", detail: "Failed to generate PDF" });
    } finally {
      setDownloading(false);
    }
  };

  /* ── DOWNLOAD BOTH ───────────────────────────────────────────────────── */
  const downloadBoth = async () => {
    await downloadExcel();
    await downloadPdf();
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="content-wrapper" style={{ background: "#edf1f5", minHeight: "calc(100vh - 58px)" }}>
      <style>{masterConfigCss}</style>
      <style>{dmrCss}</style>
      <div style={{ padding: "20px 16px 20px 20px" }}>
        <Toast ref={toast} />

        {/* ── Page header ── */}
        <div className="mc-head" style={{ marginBottom: 14 }}>
          <i className="pi pi-chart-bar" style={{ color: "#245789" }} />
          <span className="mc-head-title">DMR Report</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="dmr-btn ghost"
              onClick={() => setShowDesigner(true)}
              disabled={!report}
              title={!report ? "Load a report first" : "Configure Excel layout"}
            >
              <i className="pi pi-sliders-h" /> Excel Layout
            </button>
            <button
              className="dmr-btn ghost"
              onClick={() => setShowPdfDesigner(true)}
              disabled={!report}
              title={!report ? "Load a report first" : "Configure PDF layout"}
            >
              <i className="pi pi-file-pdf" /> PDF Layout
            </button>
            <button className="dmr-btn ghost" onClick={() => setShowEmailConfig(true)}>
              <i className="pi pi-envelope" /> Email Config
            </button>
            <div className="dmr-dl-group">
              <button className="dmr-btn success" onClick={downloadExcel} disabled={!report || downloading}>
                <i className="pi pi-file-excel" /> Excel
              </button>
              <button className="dmr-btn pdf-dl" onClick={downloadPdf} disabled={!report || downloading}>
                <i className="pi pi-file-pdf" /> PDF
              </button>
              <button className="dmr-btn success" onClick={downloadBoth} disabled={!report || downloading}>
                <i className="pi pi-download" /> Both
              </button>
            </div>
          </div>
        </div>

        {/* ── Date filter ── */}
        <div className="mc-card" style={{ marginBottom: 12, paddingBottom: 0, minHeight: 0 }}>
          <div className="mc-side-head">
            <div className="mc-ico"><i className="pi pi-filter" /></div>
            <span style={{ fontWeight: 700, color: "#333c45" }}>Date Filter</span>
          </div>
          <div className="dmr-filter-row">
            <div>
              <div className="mc-field-label">From Date</div>
              <Calendar
                value={fromDate}
                onChange={(e) => setFromDate(e.value)}
                dateFormat="yy-mm-dd"
                showIcon
                className="dmr-cal"
              />
            </div>
            <div>
              <div className="mc-field-label">To Date</div>
              <Calendar
                value={toDate}
                onChange={(e) => setToDate(e.value)}
                dateFormat="yy-mm-dd"
                showIcon
                className="dmr-cal"
              />
            </div>
            <button className="dmr-btn primary" style={{ marginBottom: 1 }} onClick={loadReport}>
              <i className="pi pi-search" /> Apply
            </button>
          </div>
        </div>

        {/* ── View mode tabs ── */}
        {report && (
          <div className="dmr-view-tabs">
            {[
              { key: "tables", icon: "pi pi-table",     label: "Tables" },
              { key: "charts", icon: "pi pi-chart-bar", label: "Charts" },
              { key: "images", icon: "pi pi-images",    label: "Images" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                className={`dmr-btn ${viewMode === key ? "primary" : "ghost"}`}
                onClick={() => setViewMode(key)}
              >
                <i className={icon} /> {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="dmr-loading">
            <div className="dmr-loading-spinner" />
            Loading report…
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !report && (
          <div className="dmr-empty-state">
            <i className="pi pi-file-excel" />
            <p>Select a date range and click Apply to load the report</p>
          </div>
        )}

        {/* ── Report content ── */}
        {!loading && report && (
          <>
            {/* KPI cards — always shown */}
            {report.Kpis && Object.keys(report.Kpis).length > 0 && (
              <div className="mc-card" style={{ marginBottom: 12, paddingBottom: 12, minHeight: 0 }}>
                <div className="mc-side-head">
                  <div className="mc-ico"><i className="pi pi-chart-pie" /></div>
                  <span style={{ fontWeight: 700, color: "#333c45" }}>Key Metrics</span>
                </div>
                <div className="dmr-kpi-grid">
                  {Object.entries(report.Kpis).map(([k, v]) => (
                    <div className="dmr-kpi-card" key={k}>
                      <div className="dmr-kpi-label">{k}</div>
                      <div className="dmr-kpi-val">{v ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TABLES view ── */}
            {viewMode === "tables" && (
              <>
                {renderTable("Assets", report.Assets)}
                {renderTable("Spares", report.Spares)}
                {renderTable("Services", report.Services)}
                {renderTable("Rentals", report.Rentals)}
                {renderTable("Tasks", report.Tasks)}
                {renderTable("Tickets", report.Tickets)}
                {renderTable("Asset Summary", report.AssetSummary)}
                {renderTable("Alerts", report.Alerts)}
                {renderTable("Monthly Trends", report.MonthlyTrends)}
              </>
            )}

            {/* ── CHARTS view ── */}
            {viewMode === "charts" && (
              <>
                {Object.keys(MODULE_CHART_CONFIG).map((key) => {
                  const data = report[key];
                  if (!Array.isArray(data) || !data.length) return null;
                  return (
                    <div className="dmr-section" key={key}>
                      <div className="dmr-section-hd">
                        <div className="dmr-section-ico">
                          <i className={SECTION_ICONS[key] || "pi pi-chart-bar"} />
                        </div>
                        <span className="dmr-section-title">{key}</span>
                        <span className="dmr-section-count">{data.length} rows</span>
                      </div>
                      {renderChart(key, data)}
                    </div>
                  );
                })}
                {/* If all modules are empty */}
                {Object.keys(MODULE_CHART_CONFIG).every(
                  (k) => !Array.isArray(report[k]) || !report[k].length
                ) && (
                  <div className="dmr-empty-state">
                    <i className="pi pi-chart-bar" />
                    <p>No chart data available for this period</p>
                  </div>
                )}
              </>
            )}

            {/* ── IMAGES view ── */}
            {viewMode === "images" && (
              <div className="dmr-section">
                <div className="dmr-section-hd">
                  <div className="dmr-section-ico"><i className="pi pi-images" /></div>
                  <span className="dmr-section-title">Documents Gallery</span>
                  {Array.isArray(report.Documents) && (
                    <span className="dmr-section-count">{report.Documents.length} docs</span>
                  )}
                </div>
                {renderImagesGallery(report.Documents)}
              </div>
            )}
          </>
        )}

      </div>{/* /inner padding wrapper */}

      {/* ── Dialogs ── */}
      <DMRLayoutDesigner
        visible={showDesigner}
        onHide={() => setShowDesigner(false)}
        config={layoutConfig}
        propertyId={propertyId}
        reportData={report}
        onSaved={(newConfig) => {
          setSavedConfig(newConfig);
          setLayoutConfig(newConfig);
          setShowDesigner(false);
        }}
      />

      <DMRPdfLayoutDesigner
        visible={showPdfDesigner}
        onHide={() => setShowPdfDesigner(false)}
        propertyId={propertyId}
        reportData={report}
        currentConfig={pdfLayoutConfig}
        onSaved={(cfg) => {
          setPdfLayoutConfig(cfg);
          setShowPdfDesigner(false);
        }}
      />

      <DMREmailConfig
        visible={showEmailConfig}
        onHide={() => setShowEmailConfig(false)}
        propertyId={propertyId}
      />
    </div>
  );
};

export default DmrReportPage;
