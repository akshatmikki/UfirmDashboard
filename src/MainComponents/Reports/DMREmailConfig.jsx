import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import {
  fetchEmailConfig,
  saveEmailConfig,
  triggerManualDmrReport,
} from "../../Services/ReportService";

const emailCss = `
/* ── overlay & modal shell ── */
.dme-overlay{position:fixed;inset:0;background:rgba(10,18,30,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1300;}
.dme-modal{width:min(980px,96vw);height:min(760px,94vh);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 28px 90px rgba(10,18,30,.32);display:flex;flex-direction:column;}

/* ── header ── */
.dme-head{background:linear-gradient(135deg,#1b4c80 0%,#2a6cb5 100%);padding:13px 20px;flex-shrink:0;display:flex;align-items:center;gap:12px;}
.dme-head-icon{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dme-head-icon i{font-size:15px;color:#fff;}
.dme-head-text{flex:1;min-width:0;}
.dme-head-title{font-size:14.5px;font-weight:700;color:#fff;line-height:1.2;}
.dme-head-sub{font-size:11px;color:rgba(255,255,255,.62);margin-top:1px;}
.dme-head-close{border:0;background:rgba(255,255,255,.15);color:#fff;width:28px;height:28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;transition:background .15s;}
.dme-head-close:hover{background:rgba(255,255,255,.28);}

/* ── two-panel split ── */
.dme-split{display:grid;grid-template-columns:340px 1fr;flex:1;min-height:0;overflow:hidden;}

/* ── LEFT panel ── */
.dme-left{background:#f5f8fc;border-right:1px solid #e2e9f2;padding:18px 16px;display:flex;flex-direction:column;gap:14px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.1) transparent;}
.dme-left::-webkit-scrollbar{width:4px;}
.dme-left::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px;}

.dme-section-title{font-size:10px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:#8fa0b4;margin-bottom:2px;}

.dme-card{background:#fff;border:1px solid #e0e8f2;border-radius:11px;overflow:hidden;}
.dme-card-field{padding:10px 13px;border-bottom:1px solid #edf1f8;}
.dme-card-field:last-child{border-bottom:0;}
.dme-lbl{font-size:10.5px;font-weight:700;color:#7a8fa3;letter-spacing:.4px;text-transform:uppercase;margin-bottom:5px;display:flex;align-items:center;gap:4px;}
.dme-lbl-req{color:#d94f4f;font-size:14px;line-height:.9;}
.dme-inp{width:100%;height:34px;border:1.5px solid #d5e0ee;border-radius:7px;background:#f8fafd;color:#2d3741;padding:0 10px;font-size:12.5px;outline:0;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;}
.dme-inp:focus{border-color:#2562a3;background:#fff;box-shadow:0 0 0 3px rgba(37,98,163,.11);}
.dme-inp::placeholder{color:#bcc9d8;}
.dme-hint{font-size:10.5px;color:#a8b8c8;margin-top:4px;}

/* recipient badge preview */
.dme-addr-preview{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;}
.dme-addr-chip{background:#e8f0fb;color:#2a5a9e;border-radius:4px;padding:2px 7px;font-size:10.5px;font-weight:600;}

/* toggle */
.dme-toggle-card{background:#fff;border:1px solid #e0e8f2;border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:12px;}
.dme-toggle-track{width:42px;height:23px;border-radius:12px;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;border:0;outline:0;}
.dme-toggle-track:focus-visible{box-shadow:0 0 0 3px rgba(37,98,163,.22);}
.dme-toggle-thumb{position:absolute;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:left .18s;}
.dme-toggle-lbl{font-size:12.5px;font-weight:700;}
.dme-toggle-sub{font-size:11px;color:#9baabb;margin-top:1px;}
.dme-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:middle;}

/* info */
.dme-info{display:flex;align-items:flex-start;gap:7px;font-size:11.5px;color:#6b7a8d;line-height:1.6;background:#edf4fd;border:1px solid #cddff5;border-radius:9px;padding:9px 11px;}
.dme-info i{color:#2562a3;font-size:12px;flex-shrink:0;margin-top:1px;}

/* frequency chips */
.dme-freq-chips{display:flex;gap:6px;flex-wrap:wrap;}
.dme-freq-chip{padding:5px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}

/* ── RIGHT panel ── */
.dme-right{display:flex;flex-direction:column;overflow:hidden;}

.dme-right-head{padding:14px 20px 10px;border-bottom:1px solid #edf1f7;flex-shrink:0;}
.dme-right-title{font-size:12px;font-weight:700;color:#4a5568;letter-spacing:.4px;text-transform:uppercase;margin-bottom:8px;}
.dme-badges{display:flex;gap:7px;flex-wrap:wrap;}
.dme-badge{display:inline-flex;align-items:center;gap:5px;border-radius:6px;padding:4px 10px;font-size:11.5px;font-weight:700;}
.dme-badge.tasks{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;}
.dme-badge.assets{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;}
.dme-badge.complaints{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;}
.dme-badge i{font-size:11px;}

.dme-editor{flex:1;display:flex;flex-direction:column;min-height:0;padding:12px 20px 16px;gap:8px;}
.dme-editor-label{font-size:10.5px;font-weight:700;color:#8fa0b4;letter-spacing:.5px;text-transform:uppercase;}
.dme-textarea{flex:1;width:100%;border:1.5px solid #d5e0ee;border-radius:10px;background:#fff;color:#2d3741;padding:13px 15px;font-size:12.5px;outline:0;resize:none;font-family:monospace;line-height:1.75;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;min-height:0;}
.dme-textarea:focus{border-color:#2562a3;box-shadow:0 0 0 3px rgba(37,98,163,.11);}

/* attachment toggles inside card fields */
.dme-attach-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.dme-attach-info{flex:1;min-width:0;}
.dme-attach-title{font-size:12px;font-weight:700;color:#2d3741;}
.dme-attach-sub{font-size:10.5px;color:#9baabb;margin-top:1px;}
.dme-mini-track{width:36px;height:20px;border-radius:10px;cursor:pointer;transition:background .2s;flex-shrink:0;position:relative;border:0;outline:0;}
.dme-mini-track:focus-visible{box-shadow:0 0 0 3px rgba(37,98,163,.22);}
.dme-mini-thumb{position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22);transition:left .18s;}

/* manual send calendar override */
.dme-cal .p-inputtext{height:32px;border:1.5px solid #d5e0ee;border-radius:7px;background:#f8fafd;color:#2d3741;padding:0 10px;font-size:12px;width:100%;box-sizing:border-box;}
.dme-cal .p-inputtext:enabled:focus{border-color:#2562a3;background:#fff;box-shadow:0 0 0 3px rgba(37,98,163,.11);}
.dme-cal .p-button{height:32px;width:32px;background:#edf1f5;border:1.5px solid #d5e0ee;border-left:0;border-radius:0 7px 7px 0;color:#55606c;}
.dme-cal .p-button:hover{background:#d9e8f8;color:#245789;}
.dme-cal .p-inputwrapper{width:100%;}

/* ── footer ── */
.dme-foot{padding:11px 20px;border-top:1px solid #edf1f6;display:flex;gap:8px;justify-content:flex-end;background:#fafbfd;flex-shrink:0;}
.dme-btn{display:inline-flex;align-items:center;gap:6px;height:34px;border:0;border-radius:8px;padding:0 18px;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;}
.dme-btn:disabled{opacity:.45;cursor:not-allowed;}
.dme-btn.primary{background:#245789;color:#fff;box-shadow:0 2px 8px rgba(36,87,137,.28);}
.dme-btn.primary:hover:not(:disabled){background:#1f4f82;box-shadow:0 4px 14px rgba(36,87,137,.36);}
.dme-btn.ghost{background:#fff;border:1.5px solid #d5dde8;color:#58626d;}
.dme-btn.ghost:hover:not(:disabled){background:#f3f6fb;border-color:#bbc6d4;}
.dme-btn.send-now{background:#0f6e35;color:#fff;width:100%;justify-content:center;height:36px;}
.dme-btn.send-now:hover:not(:disabled){background:#0b5829;}
`;

const DUMMY_BODY = `Dear Team,

Please find below the Daily Management Report for {{DATE}}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASKS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tasks      : {{TASKS_TOTAL}}
Completed        : {{TASKS_COMPLETED}}
Pending          : {{TASKS_PENDING}}
Overdue          : {{TASKS_OVERDUE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ ASSETS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Assets     : {{ASSETS_TOTAL}}
Operational      : {{ASSETS_OPERATIONAL}}
Under Maintenance: {{ASSETS_MAINTENANCE}}
Out of Service   : {{ASSETS_OUT_OF_SERVICE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📣 COMPLAINTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Complaints   : {{COMPLAINTS_NEW}}
Resolved Today   : {{COMPLAINTS_RESOLVED}}
Pending          : {{COMPLAINTS_PENDING}}
Escalated        : {{COMPLAINTS_ESCALATED}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review and take necessary action where required.

Regards,
Property Management Team`;

const FREQ_RANGE = { Daily: 1, Weekly: 7, Monthly: 30 };

const EMPTY = {
  toEmails: "",
  ccEmails: "",
  bccEmails: "",
  isActive: true,
  emailBody: DUMMY_BODY,
  attachDailyPdf: true,
  attachWeeklyPdf: false,
  attachDocumentsPdf: false,
  frequency: "Daily",
  sendTime: "10:00",
  sendDayOfWeek: 1,
  sendDayOfMonth: 1,
  reportRangeDays: 1,
};

const addrChips = (str) =>
  str ? str.split(",").map((s) => s.trim()).filter(Boolean) : [];

const fmtDate = (d) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : null;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DMREmailConfig = ({ visible, onHide, propertyId }) => {
  const toast = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Manual send state */
  const [manualFrom, setManualFrom] = useState(null);
  const [manualTo, setManualTo] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchEmailConfig(propertyId)
      .then((raw) => {
        const d = raw?.data ?? raw;
        setForm(d ? { ...EMPTY, ...d, emailBody: d.emailBody || DUMMY_BODY } : EMPTY);
      })
      .catch(() => setForm(EMPTY))
      .finally(() => setLoading(false));
  }, [visible, propertyId]);

  if (!visible) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFrequencyChange = (freq) => {
    set("frequency", freq);
    set("reportRangeDays", FREQ_RANGE[freq] ?? 1);
  };

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

  const handleSendNow = async () => {
    if (!manualFrom || !manualTo) {
      toast.current?.show({ severity: "warn", summary: "Validation", detail: "Select From and To date for manual send" });
      return;
    }
    try {
      setSending(true);
      await triggerManualDmrReport(propertyId, fmtDate(manualFrom), fmtDate(manualTo));
      toast.current?.show({ severity: "success", summary: "Sent", detail: "DMR report triggered successfully" });
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to trigger send" });
    } finally {
      setSending(false);
    }
  };

  const toChips  = addrChips(form.toEmails);
  const ccChips  = addrChips(form.ccEmails);
  const bccChips = addrChips(form.bccEmails);

  const freqSubtitle = {
    Daily: "Sends daily at the configured time for the previous day",
    Weekly: "Sends weekly on the selected day at the configured time",
    Monthly: "Sends monthly on the selected date at the configured time",
  }[form.frequency] || "";

  return (
    <>
      <style>{emailCss}</style>
      <Toast ref={toast} />

      <div className="dme-overlay" onClick={onHide}>
        <div className="dme-modal" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="dme-head">
            <div className="dme-head-icon"><i className="pi pi-envelope" /></div>
            <div className="dme-head-text">
              <div className="dme-head-title">DMR Email Configuration</div>
              <div className="dme-head-sub">Configure recipients, schedule, and email body for DMR reports</div>
            </div>
            <button className="dme-head-close" onClick={onHide} title="Close">
              <i className="pi pi-times" />
            </button>
          </div>

          {/* ── Two-panel body ── */}
          {loading ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#7a8899", fontSize: 13 }}>
              <div style={{ textAlign: "center" }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: 22, display: "block", marginBottom: 8 }} />
                Loading configuration…
              </div>
            </div>
          ) : (
            <div className="dme-split">

              {/* ──── LEFT panel ──── */}
              <div className="dme-left">

                {/* Recipients */}
                <div>
                  <div className="dme-section-title">Recipients</div>
                  <div className="dme-card">

                    <div className="dme-card-field">
                      <div className="dme-lbl">To Emails <span className="dme-lbl-req">*</span></div>
                      <input
                        className="dme-inp"
                        value={form.toEmails}
                        onChange={(e) => set("toEmails", e.target.value)}
                        placeholder="email1@company.com, email2@company.com"
                      />
                      <div className="dme-hint">Separate multiple addresses with commas</div>
                      {toChips.length > 0 && (
                        <div className="dme-addr-preview">
                          {toChips.map((e, i) => <span className="dme-addr-chip" key={i}>{e}</span>)}
                        </div>
                      )}
                    </div>

                    <div className="dme-card-field">
                      <div className="dme-lbl">CC Emails</div>
                      <input
                        className="dme-inp"
                        value={form.ccEmails}
                        onChange={(e) => set("ccEmails", e.target.value)}
                        placeholder="cc@company.com"
                      />
                      {ccChips.length > 0 && (
                        <div className="dme-addr-preview">
                          {ccChips.map((e, i) => <span className="dme-addr-chip" key={i}>{e}</span>)}
                        </div>
                      )}
                    </div>

                    <div className="dme-card-field">
                      <div className="dme-lbl">BCC Emails</div>
                      <input
                        className="dme-inp"
                        value={form.bccEmails}
                        onChange={(e) => set("bccEmails", e.target.value)}
                        placeholder="bcc@company.com"
                      />
                      {bccChips.length > 0 && (
                        <div className="dme-addr-preview">
                          {bccChips.map((e, i) => <span className="dme-addr-chip" key={i}>{e}</span>)}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Schedule enable/disable */}
                <div>
                  <div className="dme-section-title">Schedule</div>
                  <div className="dme-toggle-card">
                    <button
                      className="dme-toggle-track"
                      style={{ background: form.isActive ? "#245789" : "#c4cfd9" }}
                      onClick={() => set("isActive", !form.isActive)}
                      type="button"
                    >
                      <span className="dme-toggle-thumb" style={{ left: form.isActive ? 21 : 3 }} />
                    </button>
                    <div>
                      <div className="dme-toggle-lbl" style={{ color: form.isActive ? "#1d4b7a" : "#8e98a2" }}>
                        <span className="dme-dot" style={{ background: form.isActive ? "#22c55e" : "#c4cfd9" }} />
                        {form.isActive ? "Scheduled send ENABLED" : "Scheduled send DISABLED"}
                      </div>
                      <div className="dme-toggle-sub">{freqSubtitle}</div>
                    </div>
                  </div>
                </div>

                {/* Send Frequency */}
                <div>
                  <div className="dme-section-title">Send Frequency</div>
                  <div className="dme-card">

                    {/* Frequency chips */}
                    <div className="dme-card-field">
                      <div className="dme-lbl">Frequency</div>
                      <div className="dme-freq-chips">
                        {["Daily", "Weekly", "Monthly"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            className="dme-freq-chip"
                            style={{
                              borderColor: form.frequency === f ? "#245789" : "#d5e0ee",
                              background: form.frequency === f ? "#d9e8f8" : "#f8fafd",
                              color: form.frequency === f ? "#1b4c80" : "#58626d",
                            }}
                            onClick={() => handleFrequencyChange(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Send time */}
                    <div className="dme-card-field">
                      <div className="dme-lbl">Send Time</div>
                      <input
                        type="time"
                        className="dme-inp"
                        style={{ width: 130 }}
                        value={form.sendTime}
                        onChange={(e) => set("sendTime", e.target.value)}
                      />
                    </div>

                    {/* Day of week — Weekly only */}
                    {form.frequency === "Weekly" && (
                      <div className="dme-card-field">
                        <div className="dme-lbl">Send Day (weekly)</div>
                        <select
                          className="dme-inp"
                          value={form.sendDayOfWeek}
                          onChange={(e) => set("sendDayOfWeek", Number(e.target.value))}
                        >
                          {WEEKDAYS.map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Day of month — Monthly only */}
                    {form.frequency === "Monthly" && (
                      <div className="dme-card-field">
                        <div className="dme-lbl">Send Day of Month</div>
                        <select
                          className="dme-inp"
                          value={form.sendDayOfMonth}
                          onChange={(e) => set("sendDayOfMonth", Number(e.target.value))}
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Report range */}
                    <div className="dme-card-field">
                      <div className="dme-lbl">Report Range (days)</div>
                      <input
                        type="number"
                        className="dme-inp"
                        style={{ width: 80 }}
                        min={1}
                        max={365}
                        value={form.reportRangeDays}
                        onChange={(e) => set("reportRangeDays", Number(e.target.value))}
                      />
                      <div className="dme-hint">Auto-set: Daily=1, Weekly=7, Monthly=30. Override if needed.</div>
                    </div>

                  </div>
                </div>

                {/* PDF Attachments */}
                <div>
                  <div className="dme-section-title">PDF Attachments</div>
                  <div className="dme-card">

                    <div className="dme-card-field">
                      <div className="dme-attach-row">
                        <div className="dme-attach-info">
                          <div className="dme-attach-title">Daily Analytics PDF</div>
                          <div className="dme-attach-sub">KPI &amp; summary for previous day</div>
                        </div>
                        <button
                          type="button"
                          className="dme-mini-track"
                          style={{ background: form.attachDailyPdf ? "#245789" : "#c4cfd9" }}
                          onClick={() => set("attachDailyPdf", !form.attachDailyPdf)}
                        >
                          <span className="dme-mini-thumb" style={{ left: form.attachDailyPdf ? 18 : 2 }} />
                        </button>
                      </div>
                    </div>

                    <div className="dme-card-field">
                      <div className="dme-attach-row">
                        <div className="dme-attach-info">
                          <div className="dme-attach-title">Weekly Analytics PDF</div>
                          <div className="dme-attach-sub">Last 7 days rollup report</div>
                        </div>
                        <button
                          type="button"
                          className="dme-mini-track"
                          style={{ background: form.attachWeeklyPdf ? "#245789" : "#c4cfd9" }}
                          onClick={() => set("attachWeeklyPdf", !form.attachWeeklyPdf)}
                        >
                          <span className="dme-mini-thumb" style={{ left: form.attachWeeklyPdf ? 18 : 2 }} />
                        </button>
                      </div>
                    </div>

                    <div className="dme-card-field">
                      <div className="dme-attach-row">
                        <div className="dme-attach-info">
                          <div className="dme-attach-title">Documents PDF</div>
                          <div className="dme-attach-sub">Attach document list as PDF</div>
                        </div>
                        <button
                          type="button"
                          className="dme-mini-track"
                          style={{ background: form.attachDocumentsPdf ? "#245789" : "#c4cfd9" }}
                          onClick={() => set("attachDocumentsPdf", !form.attachDocumentsPdf)}
                        >
                          <span className="dme-mini-thumb" style={{ left: form.attachDocumentsPdf ? 18 : 2 }} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Manual Send */}
                <div>
                  <div className="dme-section-title">Manual Send</div>
                  <div className="dme-card">

                    <div className="dme-card-field">
                      <div className="dme-lbl">From Date</div>
                      <Calendar
                        value={manualFrom}
                        onChange={(e) => setManualFrom(e.value)}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className="dme-cal"
                        inputStyle={{ height: 32, fontSize: 12 }}
                      />
                    </div>

                    <div className="dme-card-field">
                      <div className="dme-lbl">To Date</div>
                      <Calendar
                        value={manualTo}
                        onChange={(e) => setManualTo(e.value)}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className="dme-cal"
                        inputStyle={{ height: 32, fontSize: 12 }}
                      />
                    </div>

                    <div className="dme-card-field">
                      <button
                        type="button"
                        className="dme-btn send-now"
                        onClick={handleSendNow}
                        disabled={sending || !manualFrom || !manualTo}
                      >
                        {sending
                          ? <><i className="pi pi-spin pi-spinner" /> Sending…</>
                          : <><i className="pi pi-send" /> Send Now</>
                        }
                      </button>
                      <div className="dme-hint" style={{ marginTop: 6 }}>
                        Triggers an immediate email for the selected range, ignoring the schedule
                      </div>
                    </div>

                  </div>
                </div>

                {/* Info */}
                <div className="dme-info">
                  <i className="pi pi-info-circle" />
                  <span>
                    Config is stored in <strong>DmrReportEmailConfig</strong>. The scheduler uses your template &amp; PDF flags on the next run — no restart needed.
                  </span>
                </div>

              </div>

              {/* ──── RIGHT: email body editor ──── */}
              <div className="dme-right">

                <div className="dme-right-head">
                  <div className="dme-right-title">Email Body Template</div>
                  <div className="dme-badges">
                    <span className="dme-badge tasks">
                      <i className="pi pi-check-square" /> {"{{TASKS_*}}"}
                    </span>
                    <span className="dme-badge assets">
                      <i className="pi pi-wrench" /> {"{{ASSETS_*}}"}
                    </span>
                    <span className="dme-badge complaints">
                      <i className="pi pi-exclamation-circle" /> {"{{COMPLAINTS_*}}"}
                    </span>
                    <span className="dme-badge" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
                      <i className="pi pi-calendar" /> {"{{DATE}}"}
                    </span>
                  </div>
                </div>

                <div className="dme-editor">
                  <div className="dme-editor-label">Edit template — use {"{{PLACEHOLDER}}"} tokens for dynamic values</div>
                  <textarea
                    className="dme-textarea"
                    value={form.emailBody}
                    onChange={(e) => set("emailBody", e.target.value)}
                    placeholder="Write your email body here…"
                    spellCheck={false}
                  />
                </div>

              </div>

            </div>
          )}

          {/* ── Footer ── */}
          <div className="dme-foot">
            <button className="dme-btn ghost" onClick={onHide}>
              <i className="pi pi-times" /> Cancel
            </button>
            <button className="dme-btn primary" onClick={handleSave} disabled={saving || loading}>
              {saving
                ? <><i className="pi pi-spin pi-spinner" /> Saving…</>
                : <><i className="pi pi-save" /> Save Changes</>
              }
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DMREmailConfig;
