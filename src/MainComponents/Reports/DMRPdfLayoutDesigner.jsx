import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { savePdfLayoutConfig } from "../../Services/ReportService";

/* ── Default chart type per module ──────────────────────────────────────── */
const MODULE_CHART_DEFAULTS = {
  Tasks: "bar",
  Tickets: "pie",
  Assets: "bar",
  AssetSummary: "bar",
  Alerts: "bar",
  MonthlyTrends: "line",
  Spares: "bar",
  Services: "bar",
  Rentals: "bar",
};

const ALL_MODULE_KEYS = Object.keys(MODULE_CHART_DEFAULTS);

/* ── Build default config from live report data ──────────────────────────── */
export const buildDefaultPdfConfig = (reportData) => ({
  sections: ALL_MODULE_KEYS
    .filter((k) => Array.isArray(reportData?.[k]) && reportData[k].length > 0)
    .map((k) => ({
      moduleKey: k,
      enabled: true,
      showChart: true,
      chartType: MODULE_CHART_DEFAULTS[k] || "bar",
      showTable: true,
      headerColor: "#245789",
    })),
});

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const pdfDesignerCss = `
.dpd-overlay{position:fixed;inset:0;background:rgba(10,18,30,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1400;}
.dpd-modal{width:min(660px,96vw);max-height:90vh;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 28px 90px rgba(10,18,30,.32);display:flex;flex-direction:column;}

/* header */
.dpd-head{background:linear-gradient(135deg,#1b4c80 0%,#2a6cb5 100%);padding:13px 20px;flex-shrink:0;display:flex;align-items:center;gap:12px;}
.dpd-head-icon{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dpd-head-icon i{font-size:15px;color:#fff;}
.dpd-head-text{flex:1;min-width:0;}
.dpd-head-title{font-size:14.5px;font-weight:700;color:#fff;line-height:1.2;}
.dpd-head-sub{font-size:11px;color:rgba(255,255,255,.62);margin-top:1px;}
.dpd-head-close{border:0;background:rgba(255,255,255,.15);color:#fff;width:28px;height:28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;transition:background .15s;}
.dpd-head-close:hover{background:rgba(255,255,255,.28);}

/* body */
.dpd-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.1) transparent;}
.dpd-body::-webkit-scrollbar{width:4px;}
.dpd-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px;}

/* section cards */
.dpd-card{background:#fff;border:1.5px solid #e0e8f2;border-radius:11px;overflow:hidden;transition:border-color .15s;}
.dpd-card.disabled{background:#f8fafd;border-color:#edf1f7;}
.dpd-card-head{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:default;}
.dpd-mod-label{flex:1;font-size:13px;font-weight:700;color:#2d3741;}
.dpd-card.disabled .dpd-mod-label{color:#aab4bf;}
.dpd-card-body{padding:0 14px 12px;display:flex;flex-direction:column;gap:8px;}
.dpd-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.dpd-lbl{font-size:11px;font-weight:700;color:#7a8fa3;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap;}
.dpd-select{height:30px;border:1.5px solid #d5e0ee;border-radius:6px;background:#f8fafd;color:#2d3741;padding:0 8px;font-size:12px;outline:0;cursor:pointer;}
.dpd-select:focus{border-color:#2562a3;}
.dpd-check-row{display:flex;align-items:center;gap:6px;cursor:pointer;}
.dpd-check-row input[type=checkbox]{width:14px;height:14px;accent-color:#245789;cursor:pointer;}
.dpd-check-lbl{font-size:12px;color:#4a5568;}
.dpd-color-wrap{display:flex;align-items:center;gap:6px;}
.dpd-color-swatch{width:22px;height:22px;border-radius:5px;border:1.5px solid #d5e0ee;overflow:hidden;cursor:pointer;flex-shrink:0;}
.dpd-color-swatch input[type=color]{width:140%;height:140%;margin:-20%;border:none;padding:0;cursor:pointer;background:transparent;}
.dpd-color-hex{font-size:11px;color:#7a8fa3;}

/* mini toggle (reuse from DMREmailConfig) */
.dpd-mini-track{width:36px;height:20px;border-radius:10px;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;border:0;outline:0;}
.dpd-mini-track:focus-visible{box-shadow:0 0 0 3px rgba(37,98,163,.22);}
.dpd-mini-thumb{position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22);transition:left .18s;}

/* empty state */
.dpd-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 0;gap:8px;color:#9ba5ae;}
.dpd-empty i{font-size:30px;color:#d8dee6;}
.dpd-empty p{margin:0;font-size:13px;}

/* footer */
.dpd-foot{padding:11px 20px;border-top:1px solid #edf1f6;display:flex;gap:8px;justify-content:flex-end;background:#fafbfd;flex-shrink:0;}
.dpd-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:0;border-radius:8px;padding:0 18px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;}
.dpd-btn:disabled{opacity:.45;cursor:not-allowed;}
.dpd-btn.primary{background:#245789;color:#fff;box-shadow:0 2px 8px rgba(36,87,137,.28);}
.dpd-btn.primary:hover:not(:disabled){background:#1f4f82;}
.dpd-btn.ghost{background:#fff;border:1.5px solid #d5dde8;color:#58626d;}
.dpd-btn.ghost:hover:not(:disabled){background:#f3f6fb;border-color:#bbc6d4;}
`;

/* ── Component ───────────────────────────────────────────────────────────── */
const DMRPdfLayoutDesigner = ({
  visible,
  onHide,
  propertyId,
  reportData,
  currentConfig,
  onSaved,
}) => {
  const toast = useRef(null);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);

  /* Initialise sections from saved config or build defaults */
  useEffect(() => {
    if (!visible) return;
    const base = currentConfig || buildDefaultPdfConfig(reportData);
    // Deep clone to avoid mutating props
    setSections(JSON.parse(JSON.stringify(base.sections || [])));
  }, [visible, currentConfig, reportData]);

  if (!visible) return null;

  /* Patch a single section by index */
  const updateSection = (idx, patch) =>
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    try {
      setSaving(true);
      await savePdfLayoutConfig(propertyId, JSON.stringify({ sections }));
      toast.current?.show({ severity: "success", summary: "Saved", detail: "PDF layout saved" });
      onSaved({ sections });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save PDF layout" });
    } finally {
      setSaving(false);
    }
  };

  const noSections = !sections || sections.length === 0;

  return (
    <>
      <style>{pdfDesignerCss}</style>
      <Toast ref={toast} />

      <div className="dpd-overlay" onClick={onHide}>
        <div className="dpd-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="dpd-head">
            <div className="dpd-head-icon"><i className="pi pi-file-pdf" /></div>
            <div className="dpd-head-text">
              <div className="dpd-head-title">PDF Layout Configuration</div>
              <div className="dpd-head-sub">Choose which sections appear in the downloaded PDF, chart types, and colors</div>
            </div>
            <button className="dpd-head-close" onClick={onHide} title="Close">
              <i className="pi pi-times" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="dpd-body">
            {noSections ? (
              <div className="dpd-empty">
                <i className="pi pi-info-circle" />
                <p>Load a report first to configure the PDF layout</p>
              </div>
            ) : (
              sections.map((sec, idx) => (
                <div
                  key={sec.moduleKey}
                  className={`dpd-card${sec.enabled ? "" : " disabled"}`}
                >
                  {/* Card header: toggle + module name */}
                  <div className="dpd-card-head">
                    <button
                      type="button"
                      className="dpd-mini-track"
                      style={{ background: sec.enabled ? "#245789" : "#c4cfd9" }}
                      onClick={() => updateSection(idx, { enabled: !sec.enabled })}
                    >
                      <span
                        className="dpd-mini-thumb"
                        style={{ left: sec.enabled ? 18 : 2 }}
                      />
                    </button>
                    <span className="dpd-mod-label">{sec.moduleKey}</span>
                    {sec.enabled && (
                      <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>
                        INCLUDED
                      </span>
                    )}
                    {!sec.enabled && (
                      <span style={{ fontSize: 10, color: "#c4cfd9", fontWeight: 700 }}>
                        EXCLUDED
                      </span>
                    )}
                  </div>

                  {/* Card body: options, visible only when enabled */}
                  {sec.enabled && (
                    <div className="dpd-card-body">

                      {/* Show Chart + type */}
                      <div className="dpd-row">
                        <label className="dpd-check-row">
                          <input
                            type="checkbox"
                            checked={sec.showChart}
                            onChange={(e) => updateSection(idx, { showChart: e.target.checked })}
                          />
                          <span className="dpd-check-lbl">Show Chart</span>
                        </label>
                        {sec.showChart && (
                          <>
                            <span className="dpd-lbl">Type</span>
                            <select
                              className="dpd-select"
                              value={sec.chartType}
                              onChange={(e) => updateSection(idx, { chartType: e.target.value })}
                            >
                              <option value="bar">Bar</option>
                              <option value="pie">Pie</option>
                              <option value="line">Line</option>
                              <option value="doughnut">Doughnut</option>
                            </select>
                          </>
                        )}
                      </div>

                      {/* Show Table */}
                      <div className="dpd-row">
                        <label className="dpd-check-row">
                          <input
                            type="checkbox"
                            checked={sec.showTable}
                            onChange={(e) => updateSection(idx, { showTable: e.target.checked })}
                          />
                          <span className="dpd-check-lbl">Show Table</span>
                        </label>
                      </div>

                      {/* Header color */}
                      <div className="dpd-row">
                        <span className="dpd-lbl">Header Color</span>
                        <div className="dpd-color-wrap">
                          <div className="dpd-color-swatch">
                            <input
                              type="color"
                              value={sec.headerColor || "#245789"}
                              onChange={(e) => updateSection(idx, { headerColor: e.target.value })}
                            />
                          </div>
                          <span className="dpd-color-hex">{sec.headerColor || "#245789"}</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Footer ── */}
          <div className="dpd-foot">
            <button className="dpd-btn ghost" onClick={onHide}>
              <i className="pi pi-times" /> Cancel
            </button>
            <button
              className="dpd-btn primary"
              onClick={handleSave}
              disabled={saving || noSections}
            >
              {saving
                ? <><i className="pi pi-spin pi-spinner" /> Saving…</>
                : <><i className="pi pi-save" /> Save PDF Layout</>
              }
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DMRPdfLayoutDesigner;
