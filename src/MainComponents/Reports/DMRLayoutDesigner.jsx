import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { saveLayoutConfig } from "../../Services/ReportService";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DEFAULT_BG = "003366";
const ALL_MODULE_KEYS = [
  "Assets", "Spares", "Services", "Rentals",
  "Tasks", "Tickets", "AssetSummary", "Alerts", "MonthlyTrends",
];
const modLabel = (k) => (k === "AssetSummary" ? "Asset Summary" : k);
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/* module → accent color for small badges in the grid */
const MOD_COLOR = {
  Assets: "#1e4d7b", Spares: "#6b3fa0", Services: "#0f6e35",
  Rentals: "#b45309", Tasks: "#c2410c", Tickets: "#be185d",
  AssetSummary: "#0369a1", Alerts: "#dc2626", MonthlyTrends: "#047857",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
/* NOTE: each column now carries its own moduleKey */
const buildCols = (reportData, moduleKey) => {
  const d = reportData?.[moduleKey];
  if (!Array.isArray(d) || !d.length) return [];
  return Object.keys(d[0]).map((key) => ({ key, label: key, enabled: true, moduleKey }));
};

/* ─── Exported helpers (consumed by DMRReport.jsx) ───────────────────────── */
export const buildDefaultConfig = (reportData) => ({
  sheets: ALL_MODULE_KEYS
    .filter((k) => Array.isArray(reportData?.[k]) && reportData[k].length > 0)
    .map((k, i) => ({
      id: `sheet_${i}`,
      label: modLabel(k),
      sections: [{
        id: `sec_${i}_0`,
        sectionLabel: modLabel(k),
        headerBgColor: DEFAULT_BG,
        headerFontBold: true,
        showSectionHeader: false,
        columns: buildCols(reportData, k),
      }],
    })),
});

export const mergeConfig = (savedConfig, reportData) => {
  if (!savedConfig?.sheets) return buildDefaultConfig(reportData);
  return {
    sheets: savedConfig.sheets.map((sheet) => ({
      ...sheet,
      sections: sheet.sections.map((sec) => ({
        ...sec,
        /* backward-compat: old configs had a section-level moduleKey; migrate it to each column */
        columns: (sec.columns || []).map((c) => ({
          ...c,
          moduleKey: c.moduleKey || sec.moduleKey || ALL_MODULE_KEYS[0],
        })),
      })),
    })),
  };
};

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
.xld-overlay{position:fixed;inset:0;background:rgba(31,38,46,.55);display:flex;align-items:center;justify-content:center;z-index:1300;}
.xld-modal{width:min(1340px,98vw);height:calc(100vh - 28px);background:#fff;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(31,38,46,.25);}
.xld-head{display:flex;align-items:center;gap:9px;padding:10px 14px;border-bottom:1px solid #e0e6ec;flex-shrink:0;}
.xld-head-ico{width:28px;height:28px;border-radius:50%;background:#d4edd8;color:#0f6e35;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.xld-head-title{font-size:16px;font-weight:700;color:#333b45;flex:1;}
.xld-head-hint{font-size:11px;color:#9ba5ae;margin-right:8px;}
.xld-head-close{border:0;background:transparent;color:#8e98a2;font-size:18px;cursor:pointer;padding:0;line-height:1;}
.xld-head-close:hover{color:#3f4750;}
.xld-body{display:flex;flex:1;overflow:hidden;min-height:0;}
.xld-foot{display:flex;justify-content:flex-end;gap:8px;padding:8px 14px;border-top:1px solid #e0e6ec;flex-shrink:0;background:#f8f9fb;}

/* ── Palette ── */
.xld-pal{width:220px;flex-shrink:0;border-right:1px solid #e0e6ec;display:flex;flex-direction:column;background:#f5f7fa;overflow:hidden;}
.xld-pal-hd{padding:7px 10px;font-size:10px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#66707a;border-bottom:1px solid #e0e6ec;background:#edf0f4;flex-shrink:0;}
.xld-pal-scroll{flex:1;overflow-y:auto;padding:8px 6px;}
.xld-pal-scroll::-webkit-scrollbar{width:4px;}
.xld-pal-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px;}
.xld-mod-grp{margin-bottom:12px;}
.xld-mod-nm{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;padding:2px 2px 4px;border-bottom:1px solid #dde3ec;margin-bottom:4px;}
.xld-mod-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.xld-chips{display:flex;flex-wrap:wrap;gap:3px;}
.xld-chip{font-size:10px;padding:3px 7px;background:#fff;border:1px solid #cdd5df;border-radius:3px;cursor:grab;color:#3a4148;white-space:nowrap;user-select:none;transition:background .1s,border-color .1s;}
.xld-chip:hover{background:#e3effa;border-color:#245789;color:#245789;}

/* ── Canvas ── */
.xld-canvas{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#e8ecf0;}

/* Sheet tabs */
.xld-tabs{display:flex;align-items:flex-end;padding:6px 8px 0;gap:2px;border-bottom:2px solid #b8c4d0;background:#dce3ea;flex-shrink:0;overflow-x:auto;}
.xld-tabs::-webkit-scrollbar{height:3px;}
.xld-tab{display:flex;align-items:center;gap:5px;padding:5px 12px 7px;font-size:12px;font-weight:600;background:#c4ceda;border:1px solid #aebece;border-bottom:0;border-radius:4px 4px 0 0;cursor:pointer;color:#55606c;user-select:none;white-space:nowrap;flex-shrink:0;position:relative;bottom:-1px;}
.xld-tab.active{background:#fff;color:#245789;border-color:#b8c4d0;border-bottom:2px solid #fff;}
.xld-tab-x{border:0;background:transparent;color:#9ba5ae;padding:0;font-size:10px;cursor:pointer;line-height:1;}
.xld-tab-x:hover{color:#e53935;}
.xld-tab-add{width:26px;height:26px;border:1px dashed #9ba5ae;border-radius:3px;background:transparent;color:#9ba5ae;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-bottom:2px;flex-shrink:0;}
.xld-tab-add:hover{background:#d9ebfa;color:#245789;border-color:#245789;}
.xld-tab-inp{border:1px solid #245789;border-radius:3px;padding:1px 5px;font-size:12px;color:#333;background:#fff;outline:none;width:80px;}

/* Grid scroll */
.xld-grid-area{flex:1;overflow:auto;padding:14px 12px;}
.xld-grid-area::-webkit-scrollbar{width:7px;height:7px;}
.xld-grid-area::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;}

/* Section block */
.xld-sec{margin-bottom:18px;background:#fff;border:1px solid #c0cad6;border-radius:5px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.xld-sec-bar{display:flex;align-items:center;gap:7px;padding:5px 8px;border-bottom:1px solid #d0dae4;background:#edf2f7;}
.xld-sec-bar-clr{width:22px;height:22px;border:1px solid #c0cad6;border-radius:3px;padding:1px;cursor:pointer;background:#f4f7fa;flex-shrink:0;}
.xld-sec-bar-rm{border:0;background:transparent;color:#c8d3de;padding:0;font-size:12px;cursor:pointer;flex-shrink:0;line-height:1;}
.xld-sec-bar-rm:hover{color:#e53935;}
.xld-sec-rename{border:1px solid #245789;border-radius:3px;padding:1px 6px;font-size:11px;color:#333;background:#fff;outline:none;width:130px;}
.xld-sec-mods{font-size:9px;color:#9ba5ae;background:#edf0f4;border:1px solid #d8dde4;border-radius:2px;padding:1px 5px;flex-shrink:0;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* Excel table */
.xld-tbl-wrap{overflow-x:auto;}
.xld-tbl{border-collapse:collapse;table-layout:fixed;}
.xld-tbl th,.xld-tbl td{border:1px solid #c0cad6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.xld-tbl th{padding:0;min-width:130px;max-width:210px;user-select:none;cursor:grab;vertical-align:middle;}
.xld-tbl th.dov{outline:2px dashed rgba(255,255,255,.75);outline-offset:-2px;}
.xld-tbl th.col-off .xld-th-inner{opacity:.5;}
.xld-tbl td{padding:4px 9px;font-size:11px;color:#3a4148;background:#fff;min-width:130px;max-width:210px;}
.xld-tbl tr:nth-child(even) td{background:#f5f8fc;}

.xld-th-inner{display:flex;align-items:flex-start;gap:3px;padding:5px 7px;}
.xld-th-drag{font-size:10px;color:rgba(255,255,255,.3);flex-shrink:0;margin-top:2px;}
.xld-th-chk{accent-color:#fff;width:12px;height:12px;cursor:pointer;flex-shrink:0;margin-top:3px;}
.xld-th-lbl{flex:1;overflow:hidden;}
.xld-th-lbl-span{display:block;overflow:hidden;text-overflow:ellipsis;font-size:11px;font-weight:600;color:#fff;cursor:text;}
.xld-th-mod-badge{display:inline-flex;align-items:center;gap:3px;margin-top:2px;}
.xld-th-mod-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.xld-th-mod-txt{font-size:9px;color:rgba(255,255,255,.45);white-space:nowrap;}
.xld-th-lbl-inp{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.55);border-radius:3px;padding:1px 4px;font-size:11px;color:#fff;outline:none;width:95px;}
.xld-th-rm{border:0;background:transparent;color:rgba(255,255,255,.38);padding:0;font-size:10px;cursor:pointer;line-height:1;flex-shrink:0;margin-top:2px;}
.xld-th-rm:hover{color:#ff7070;}

/* Drop zone column */
.xld-drop-th{background:#f8fafc;border:1px dashed #9ab4cc;min-width:40px;max-width:40px;width:40px;text-align:center;vertical-align:middle;cursor:default;color:#b0bec5;font-size:20px;transition:background .15s,border-color .15s;}
.xld-drop-th.dov{background:#d9eefa;border-color:#245789;color:#245789;}

/* Drag-over section highlight */
.xld-sec.sec-dov{outline:2px dashed #245789;outline-offset:2px;}

/* Add section */
.xld-add-sec{width:100%;padding:9px 12px;border:1px dashed #9ab4cc;border-radius:5px;background:#fff;color:#245789;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .1s;}
.xld-add-sec:hover{background:#e3effa;border-color:#245789;}
.xld-add-sec:disabled{opacity:.4;cursor:not-allowed;}

/* Empty */
.xld-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:130px;color:#b0bec5;font-size:13px;gap:8px;}

/* Module picker */
.xld-picker{position:fixed;background:#fff;border:1px solid #c8d3de;border-radius:7px;box-shadow:0 8px 28px rgba(31,38,46,.17);z-index:1500;min-width:210px;overflow:hidden;}
.xld-picker-hd{padding:7px 12px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#66707a;border-bottom:1px solid #e0e6ec;background:#f5f7fa;}
.xld-picker-item{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:12px;color:#3a4148;cursor:pointer;}
.xld-picker-item:hover{background:#e3effa;color:#245789;}

/* Buttons */
.xld-btn{display:inline-flex;align-items:center;gap:5px;border:0;border-radius:4px;height:30px;padding:0 12px;font-size:12px;font-weight:700;cursor:pointer;transition:background .1s;}
.xld-btn.primary{background:#245789;color:#fff;}
.xld-btn.primary:hover{background:#1f4f82;}
.xld-btn.ghost{background:#fff;border:1px solid #d8dee6;color:#58626d;}
.xld-btn.ghost:hover{background:#f0f5fa;border-color:#245789;color:#245789;}
.xld-btn:disabled{opacity:.45;cursor:not-allowed;}
`;

/* ─── Inline rename ───────────────────────────────────────────────────────── */
const InlineRename = ({ value, onChange, spanClass = "", inputClass = "" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v) onChange(v);
    else setDraft(value);
  };
  if (editing)
    return (
      <input
        className={inputClass}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setEditing(false); setDraft(value); }
        }}
        onClick={(e) => e.stopPropagation()}
        autoFocus
      />
    );
  return (
    <span
      className={spanClass}
      title="Double-click to rename"
      onDoubleClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
};

/* ─── Module picker popup ─────────────────────────────────────────────────── */
const ModulePicker = ({ anchorRef, visible, onHide, reportData, onPick }) => {
  const popRef = useRef(null);
  useEffect(() => {
    if (!visible) return;
    const h = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)) onHide();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [visible, onHide, anchorRef]);

  if (!visible) return null;
  const rect = anchorRef.current?.getBoundingClientRect();
  const style = rect
    ? { bottom: window.innerHeight - rect.top + 4, left: rect.left }
    : { top: 100, left: 100 };
  const available = ALL_MODULE_KEYS.filter(
    (k) => Array.isArray(reportData?.[k]) && reportData[k].length > 0
  );
  return (
    <div ref={popRef} className="xld-picker" style={style}>
      <div className="xld-picker-hd">Choose a module section to add</div>
      {available.map((k) => (
        <div key={k} className="xld-picker-item" onClick={() => { onPick(k); onHide(); }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: MOD_COLOR[k] || "#888", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{modLabel(k)}</span>
          <span style={{ fontSize: 10, color: "#9ba5ae" }}>{buildCols(reportData, k).length} cols</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const DMRLayoutDesigner = ({ visible, onHide, config, propertyId, reportData, onSaved }) => {
  const toast = useRef(null);
  const addSecBtnRef = useRef(null);
  const drag = useRef(null); // { type:'chip'|'col', moduleKey?, key?, label?, sIdx?, cIdx? }

  const [sheets, setSheets] = useState([]);
  const [selSheet, setSelSheet] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [dropTarget, setDropTarget] = useState(null); // { sIdx, cIdx? } | null

  useEffect(() => {
    if (visible && config?.sheets) {
      setSheets(JSON.parse(JSON.stringify(config.sheets)));
      setSelSheet(0);
    }
  }, [visible, config]);

  if (!visible) return null;

  const currSheet = sheets[selSheet];

  /* ── Sheet ops ── */
  const addSheet = () => {
    const next = [...sheets, { id: uid(), label: `Sheet ${sheets.length + 1}`, sections: [] }];
    setSheets(next);
    setSelSheet(next.length - 1);
  };
  const removeSheet = (idx, e) => {
    e.stopPropagation();
    setSheets((p) => p.filter((_, i) => i !== idx));
    setSelSheet((p) => Math.max(0, Math.min(p, sheets.length - 2)));
  };
  const renameSheet = (idx, label) =>
    setSheets((p) => p.map((s, i) => (i === idx ? { ...s, label } : s)));

  /* ── Section ops ── */
  const addSection = (moduleKey) => {
    const sec = {
      id: uid(),
      sectionLabel: modLabel(moduleKey),
      headerBgColor: DEFAULT_BG,
      headerFontBold: true,
      showSectionHeader: true,
      columns: buildCols(reportData, moduleKey),
    };
    setSheets((p) =>
      p.map((s, i) => (i === selSheet ? { ...s, sections: [...s.sections, sec] } : s))
    );
  };
  const removeSection = (sIdx) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : { ...s, sections: s.sections.filter((_, si) => si !== sIdx) }
      )
    );
  const updateSection = (sIdx, patch) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) => (si === sIdx ? { ...sec, ...patch } : sec)),
        }
      )
    );

  /* ── Column ops ── */
  const removeCol = (sIdx, cIdx) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) =>
            si !== sIdx ? sec : { ...sec, columns: sec.columns.filter((_, ci) => ci !== cIdx) }
          ),
        }
      )
    );
  const toggleCol = (sIdx, cIdx) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) =>
            si !== sIdx ? sec : {
              ...sec,
              columns: sec.columns.map((c, ci) => (ci === cIdx ? { ...c, enabled: !c.enabled } : c)),
            }
          ),
        }
      )
    );
  const renameCol = (sIdx, cIdx, label) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) =>
            si !== sIdx ? sec : {
              ...sec,
              columns: sec.columns.map((c, ci) => (ci === cIdx ? { ...c, label } : c)),
            }
          ),
        }
      )
    );
  const moveCol = (sIdx, from, to) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) => {
            if (si !== sIdx) return sec;
            const cols = [...sec.columns];
            const [x] = cols.splice(from, 1);
            cols.splice(to, 0, x);
            return { ...sec, columns: cols };
          }),
        }
      )
    );

  /* insert at position, silently skip if same key+moduleKey already present */
  const insertCol = (sIdx, key, label, moduleKey, insertAt = null) =>
    setSheets((p) =>
      p.map((s, i) =>
        i !== selSheet ? s : {
          ...s,
          sections: s.sections.map((sec, si) => {
            if (si !== sIdx) return sec;
            if (sec.columns.some((c) => c.key === key && c.moduleKey === moduleKey)) return sec;
            const newCol = { key, label, enabled: true, moduleKey };
            const cols = [...sec.columns];
            if (insertAt !== null) cols.splice(insertAt, 0, newCol);
            else cols.push(newCol);
            return { ...sec, columns: cols };
          }),
        }
      )
    );

  /* ── Drag ── */
  const ov = (e) => e.preventDefault();

  const onChipDragStart = (e, moduleKey, key, label) => {
    drag.current = { type: "chip", moduleKey, key, label };
    e.dataTransfer.effectAllowed = "copy";
  };
  const onColDragStart = (e, sIdx, cIdx) => {
    drag.current = { type: "col", sIdx, cIdx };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDrop = (e, sIdx, cIdx) => {
    e.preventDefault();
    setDropTarget(null);
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.type === "chip") {
      insertCol(sIdx, d.key, d.label, d.moduleKey, cIdx);
    } else if (d.type === "col" && d.sIdx === sIdx && d.cIdx !== cIdx) {
      moveCol(sIdx, d.cIdx, cIdx);
    }
  };

  const handleDropZoneDrop = (e, sIdx) => {
    e.preventDefault();
    setDropTarget(null);
    const d = drag.current;
    drag.current = null;
    if (!d || d.type !== "chip") return;
    insertCol(sIdx, d.key, d.label, d.moduleKey);
  };

  /* ── Save ── */
  const handleSave = async () => {
    try {
      setSaving(true);
      await saveLayoutConfig(propertyId, JSON.stringify({ sheets }));
      toast.current?.show({ severity: "success", summary: "Saved", detail: "Layout saved successfully" });
      onSaved({ sheets });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save layout" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Section renderer ── */
  const renderSection = (sec, sIdx) => {
    const { columns: cols, headerBgColor } = sec;
    const hdrBg = `#${headerBgColor || DEFAULT_BG}`;

    /* find max row count among all modules referenced in this section */
    const usedMods = [...new Set(cols.map((c) => c.moduleKey).filter(Boolean))];
    const maxRows = Math.min(
      3,
      Math.max(0, ...usedMods.map((mk) => reportData?.[mk]?.length ?? 0))
    );

    /* label of modules used, for the section bar */
    const modsLabel = usedMods.map(modLabel).join(" + ") || "empty";

    return (
      <div
        key={sec.id}
        className={`xld-sec${dropTarget?.sIdx === sIdx && dropTarget?.drop ? " sec-dov" : ""}`}
      >
        {/* Section toolbar */}
        <div className="xld-sec-bar">
          <i className="pi pi-bars" style={{ color: "#9ba5ae", fontSize: 11, cursor: "grab", flexShrink: 0 }} />
          <InlineRename
            value={sec.sectionLabel}
            onChange={(v) => updateSection(sIdx, { sectionLabel: v })}
            spanClass=""
            inputClass="xld-sec-rename"
          />
          <span className="xld-sec-mods" title={modsLabel}>{modsLabel}</span>
          <span style={{ flex: 1 }} />
          <label
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#66707a", cursor: "pointer", userSelect: "none", flexShrink: 0 }}
            title="Emit a title row above the columns in the exported Excel"
          >
            <input
              type="checkbox"
              style={{ accentColor: "#245789", width: 12, height: 12, cursor: "pointer" }}
              checked={!!sec.showSectionHeader}
              onChange={(e) => updateSection(sIdx, { showSectionHeader: e.target.checked })}
            />
            Title row
          </label>
          <input
            type="color"
            className="xld-sec-bar-clr"
            value={`#${sec.headerBgColor || DEFAULT_BG}`}
            onChange={(e) => updateSection(sIdx, { headerBgColor: e.target.value.replace("#", "") })}
            title="Header background colour"
          />
          <button className="xld-sec-bar-rm" onClick={() => removeSection(sIdx)} title="Remove section">
            <i className="pi pi-trash" />
          </button>
        </div>

        {/* Excel-like grid */}
        <div
          className="xld-tbl-wrap"
          onDragOver={(e) => { ov(e); setDropTarget((p) => (p?.sIdx === sIdx && !p?.cIdx ? p : { sIdx, drop: true })); }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => handleDropZoneDrop(e, sIdx)}
        >
          <table className="xld-tbl">
            <thead>
              <tr>
                {cols.map((col, cIdx) => {
                  const isDov = dropTarget?.sIdx === sIdx && dropTarget?.cIdx === cIdx;
                  const modColor = MOD_COLOR[col.moduleKey] || "#888";
                  return (
                    <th
                      key={`${col.moduleKey}_${col.key}_${cIdx}`}
                      className={`${!col.enabled ? "col-off" : ""} ${isDov ? "dov" : ""}`}
                      style={{ background: hdrBg }}
                      draggable
                      onDragStart={(e) => onColDragStart(e, sIdx, cIdx)}
                      onDragOver={(e) => { ov(e); e.stopPropagation(); setDropTarget({ sIdx, cIdx }); }}
                      onDragLeave={(e) => { e.stopPropagation(); setDropTarget(null); }}
                      onDrop={(e) => { e.stopPropagation(); handleColDrop(e, sIdx, cIdx); }}
                    >
                      <div className="xld-th-inner">
                        <i className="pi pi-bars xld-th-drag" />
                        <input
                          type="checkbox"
                          className="xld-th-chk"
                          checked={col.enabled}
                          onChange={() => toggleCol(sIdx, cIdx)}
                          onClick={(e) => e.stopPropagation()}
                          title="Show / hide in export"
                        />
                        <div className="xld-th-lbl">
                          <InlineRename
                            value={col.label}
                            onChange={(v) => renameCol(sIdx, cIdx, v)}
                            spanClass="xld-th-lbl-span"
                            inputClass="xld-th-lbl-inp"
                          />
                          {/* module badge */}
                          <div className="xld-th-mod-badge">
                            <span className="xld-th-mod-dot" style={{ background: modColor }} />
                            <span className="xld-th-mod-txt">{col.moduleKey}</span>
                          </div>
                        </div>
                        <button
                          className="xld-th-rm"
                          onClick={(e) => { e.stopPropagation(); removeCol(sIdx, cIdx); }}
                          title="Remove column"
                        >
                          <i className="pi pi-times" />
                        </button>
                      </div>
                    </th>
                  );
                })}
                {/* Drop-zone: append new column */}
                <th
                  className={`xld-drop-th ${dropTarget?.sIdx === sIdx && dropTarget?.drop ? "dov" : ""}`}
                  onDragOver={(e) => { ov(e); e.stopPropagation(); setDropTarget({ sIdx, drop: true }); }}
                  onDragLeave={(e) => { e.stopPropagation(); setDropTarget(null); }}
                  onDrop={(e) => { e.stopPropagation(); handleDropZoneDrop(e, sIdx); }}
                  title="Drop any field here to add it"
                >
                  +
                </th>
              </tr>
            </thead>
            <tbody>
              {maxRows > 0 ? (
                Array.from({ length: maxRows }, (_, rIdx) => (
                  <tr key={rIdx}>
                    {cols.map((col, cIdx) => {
                      const rowData = Array.isArray(reportData?.[col.moduleKey])
                        ? reportData[col.moduleKey][rIdx]
                        : null;
                      return (
                        <td key={cIdx} style={{ color: col.enabled ? undefined : "#c8d3de" }}>
                          {String(rowData?.[col.key] ?? "")}
                        </td>
                      );
                    })}
                    <td style={{ background: "#f8fafc", borderColor: "#c0cad6" }} />
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={cols.length + 1}
                    style={{ color: "#c8d3de", textAlign: "center", padding: "10px 8px", fontStyle: "italic" }}
                  >
                    No preview data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Palette ── */
  const paletteMods = ALL_MODULE_KEYS.filter(
    (k) => Array.isArray(reportData?.[k]) && reportData[k].length > 0
  );

  return (
    <>
      <style>{css}</style>
      <Toast ref={toast} />

      <ModulePicker
        anchorRef={addSecBtnRef}
        visible={pickerVisible}
        onHide={() => setPickerVisible(false)}
        reportData={reportData}
        onPick={addSection}
      />

      <div className="xld-overlay" onClick={onHide}>
        <div className="xld-modal" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="xld-head">
            <div className="xld-head-ico"><i className="pi pi-file-excel" /></div>
            <span className="xld-head-title">Configure Excel Layout</span>
            <span className="xld-head-hint">
              Drag any field from the palette into any section · Double-click to rename · Checkbox to show/hide
            </span>
            <button className="xld-head-close" onClick={onHide}><i className="fas fa-times" /></button>
          </div>

          {/* Body */}
          <div className="xld-body">

            {/* Field palette */}
            <div className="xld-pal">
              <div className="xld-pal-hd">
                <i className="pi pi-list" style={{ marginRight: 5 }} />
                Field Palette
              </div>
              <div className="xld-pal-scroll">
                {paletteMods.map((mk) => {
                  const cols = buildCols(reportData, mk);
                  const dotColor = MOD_COLOR[mk] || "#888";
                  return (
                    <div className="xld-mod-grp" key={mk}>
                      <div className="xld-mod-nm">
                        <span className="xld-mod-dot" style={{ background: dotColor }} />
                        {modLabel(mk)}
                      </div>
                      <div className="xld-chips">
                        {cols.map((c) => (
                          <div
                            key={c.key}
                            className="xld-chip"
                            draggable
                            onDragStart={(e) => onChipDragStart(e, mk, c.key, c.label)}
                            title={`Drag to add "${c.key}" from ${modLabel(mk)}`}
                          >
                            {c.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Excel canvas */}
            <div className="xld-canvas">

              {/* Sheet tabs */}
              <div className="xld-tabs">
                {sheets.map((sheet, idx) => (
                  <div
                    key={sheet.id}
                    className={`xld-tab${selSheet === idx ? " active" : ""}`}
                    onClick={() => setSelSheet(idx)}
                  >
                    <InlineRename
                      value={sheet.label}
                      onChange={(v) => renameSheet(idx, v)}
                      spanClass=""
                      inputClass="xld-tab-inp"
                    />
                    {sheets.length > 1 && (
                      <button className="xld-tab-x" onClick={(e) => removeSheet(idx, e)} title="Remove sheet">
                        <i className="pi pi-times" />
                      </button>
                    )}
                  </div>
                ))}
                <button className="xld-tab-add" onClick={addSheet} title="Add sheet">+</button>
              </div>

              {/* Grid */}
              <div className="xld-grid-area">
                {!currSheet?.sections?.length && (
                  <div className="xld-empty">
                    <i className="pi pi-table" style={{ fontSize: 30, color: "#d8dee6" }} />
                    <span>Click "Add Section" below to start building the layout</span>
                  </div>
                )}
                {currSheet?.sections?.map((sec, sIdx) => renderSection(sec, sIdx))}
                <button
                  ref={addSecBtnRef}
                  className="xld-add-sec"
                  onClick={() => setPickerVisible(true)}
                  disabled={!currSheet}
                >
                  <i className="pi pi-plus" /> Add Section
                </button>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="xld-foot">
            <button className="xld-btn ghost" onClick={onHide}><i className="pi pi-times" /> Cancel</button>
            <button className="xld-btn primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><i className="pi pi-spin pi-spinner" /> Saving…</>
                : <><i className="pi pi-save" /> Save Layout</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DMRLayoutDesigner;
