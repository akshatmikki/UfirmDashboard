import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { masterConfigCss } from "../../ReactComponents/MasterConfig/masterConfigTheme";
import { fetchEmailConfig, saveEmailConfig } from "../../Services/ReportService";

const emailCss = `
.dme-overlay{position:fixed;inset:0;background:rgba(31,38,46,.5);display:flex;align-items:center;justify-content:center;z-index:1300;}
.dme-modal{width:min(500px,95vw);background:#fff;border:1px solid #d7dde4;border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(31,38,46,.2);}
.dme-btn{display:inline-flex;align-items:center;gap:6px;height:32px;border:0;border-radius:4px;padding:0 14px;font-size:13px;font-weight:700;cursor:pointer;transition:background .1s;}
.dme-btn:disabled{opacity:.45;cursor:not-allowed;}
.dme-btn.primary{background:#245789;color:#fff;}
.dme-btn.primary:hover:not(:disabled){background:#1f4f82;}
.dme-btn.ghost{background:#fff;border:1px solid #d8dee6;color:#58626d;}
.dme-btn.ghost:hover:not(:disabled){background:#f0f5fa;}
.dme-toggle{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#f5f8fc;border:1px solid #d8e4f0;border-radius:7px;}
.dme-toggle-track{width:42px;height:24px;border-radius:12px;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;border:0;}
.dme-toggle-thumb{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:left .2s;}
`;

const EMPTY = { toEmails: "", ccEmails: "", bccEmails: "", isActive: true };

const DMREmailConfig = ({ visible, onHide, propertyId }) => {
  const toast = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchEmailConfig(propertyId)
      .then((d) => setForm(d ? { ...EMPTY, ...d } : EMPTY))
      .catch(() => setForm(EMPTY))
      .finally(() => setLoading(false));
  }, [visible, propertyId]);

  if (!visible) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.toEmails.trim()) {
      toast.current?.show({ severity: "warn", summary: "Validation", detail: "To Emails is required" });
      return;
    }
    try {
      setSaving(true);
      await saveEmailConfig(propertyId, form);
      toast.current?.show({ severity: "success", summary: "Saved", detail: "Email configuration saved" });
      onHide();
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to save email config" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{masterConfigCss}</style>
      <style>{emailCss}</style>
      <Toast ref={toast} />

      <div className="dme-overlay" onClick={onHide}>
        <div className="dme-modal" onClick={(e) => e.stopPropagation()}>

          {/* Head */}
          <div className="mc-modal-head">
            <span>
              <span className="mc-ico"><i className="pi pi-envelope" /></span>
              Daily DMR Email Configuration
            </span>
            <button onClick={onHide}><i className="fas fa-times" /></button>
          </div>

          {/* Body */}
          <div className="mc-modal-body">
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#66707a", fontSize: 13 }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: 18, display: "block", marginBottom: 8 }} />
                Loading…
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* To */}
                <div>
                  <div className="mc-field-label" style={{ marginBottom: 4 }}>
                    To Emails <span style={{ color: "#e05252" }}>*</span>
                  </div>
                  <input
                    className="mc-input"
                    value={form.toEmails}
                    onChange={(e) => set("toEmails", e.target.value)}
                    placeholder="email1@company.com, email2@company.com"
                  />
                  <div style={{ fontSize: 11, color: "#8e98a2", marginTop: 3 }}>
                    Separate multiple addresses with commas
                  </div>
                </div>

                {/* CC */}
                <div>
                  <div className="mc-field-label" style={{ marginBottom: 4 }}>CC Emails</div>
                  <input
                    className="mc-input"
                    value={form.ccEmails}
                    onChange={(e) => set("ccEmails", e.target.value)}
                    placeholder="cc@company.com"
                  />
                </div>

                {/* BCC */}
                <div>
                  <div className="mc-field-label" style={{ marginBottom: 4 }}>BCC Emails</div>
                  <input
                    className="mc-input"
                    value={form.bccEmails}
                    onChange={(e) => set("bccEmails", e.target.value)}
                    placeholder="bcc@company.com"
                  />
                </div>

                {/* Active toggle */}
                <div className="dme-toggle">
                  {/* Custom toggle */}
                  <button
                    className="dme-toggle-track"
                    style={{ background: form.isActive ? "#245789" : "#c8d3de" }}
                    onClick={() => set("isActive", !form.isActive)}
                    type="button"
                    title={form.isActive ? "Disable scheduled send" : "Enable scheduled send"}
                  >
                    <span
                      className="dme-toggle-thumb"
                      style={{ left: form.isActive ? 21 : 3 }}
                    />
                  </button>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: form.isActive ? "#245789" : "#8e98a2" }}>
                      {form.isActive ? "Scheduled send ENABLED" : "Scheduled send DISABLED"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8e98a2", marginTop: 1 }}>
                      Daily report sent at 10 AM for the previous day
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="mc-info-box">
                  <i className="pi pi-info-circle" style={{ marginRight: 6, color: "#245789" }} />
                  Changes here update the <strong>DmrReportEmailConfig</strong> table. The backend scheduler picks
                  up the new recipients on the next run — no restart needed.
                </div>

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mc-modal-foot">
            <button className="dme-btn ghost" onClick={onHide}>
              <i className="pi pi-times" /> Cancel
            </button>
            <button className="dme-btn primary" onClick={handleSave} disabled={saving || loading}>
              {saving
                ? <><i className="pi pi-spin pi-spinner" /> Saving…</>
                : <><i className="pi pi-save" /> Save</>
              }
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DMREmailConfig;
