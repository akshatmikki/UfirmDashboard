"use client";

import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "jspdf-autotable";
import { masterConfigCss } from "../../ReactComponents/MasterConfig/masterConfigTheme";
import { fetchDmrReport, fetchLayoutConfig } from "../../Services/ReportService";
import DMRLayoutDesigner, { buildDefaultConfig, mergeConfig } from "./DMRLayoutDesigner";
import DMREmailConfig from "./DMREmailConfig";

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

/* ─── Component ───────────────────────────────────────────────────────────── */
const DmrReportPage = () => {
  const toast = useRef(null);
  const propertyId = useSelector((state) => state.Commonreducer.puidn);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [layoutConfig, setLayoutConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  /* Load saved layout on mount */
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

  /* Merge saved + live data */
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
      const data = await fetchDmrReport(propertyId, fmt(fromDate), fmt(toDate));
      setReport(data);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to load DMR report" });
    } finally {
      setLoading(false);
    }
  };

  /* CSV fallback */
  const exportCSV = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  /* Excel download */
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

        /* Each column carries its own moduleKey — find the max row count across all used modules */
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
            /* resolve the module for this column (new per-column moduleKey, fallback to section-level) */
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

  /* Render a section table */
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
            title={!report ? "Load a report first" : "Configure layout & Excel design"}
          >
            <i className="pi pi-sliders-h" /> Configure Layout
          </button>
          <button className="dmr-btn ghost" onClick={() => setShowEmailConfig(true)}>
            <i className="pi pi-envelope" /> Email Config
          </button>
          <button className="dmr-btn success" onClick={downloadExcel} disabled={!report}>
            <i className="pi pi-file-excel" /> Download Excel
          </button>
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
          {/* KPI cards */}
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

          {/* Section tables */}
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

      </div>{/* /inner padding wrapper */}

      {/* ── Dialogs (outside padding wrapper so overlays render correctly) ── */}
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

      <DMREmailConfig
        visible={showEmailConfig}
        onHide={() => setShowEmailConfig(false)}
        propertyId={propertyId}
      />
    </div>
  );
};

export default DmrReportPage;
