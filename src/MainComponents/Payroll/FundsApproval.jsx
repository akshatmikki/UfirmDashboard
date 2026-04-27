import React, { useState, useEffect, useMemo } from "react";
import { getAllProperties } from "../../Services/PropertyService";
import { getFreezedSalaryDetailsForFundsApproval, getAllAgreements, sendFundsApprovalToRecipient, getFundsApprovalHistory } from "../../Services/PayrollService";
import { Modal, Card, Row, Col, Badge } from "react-bootstrap";
import * as appCommon from "../../Common/AppCommon";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TEST_SITES = [
  { SiteId: 101, SiteName: "Green Valley Residency" },
  { SiteId: 102, SiteName: "Skyline Heights" },
  { SiteId: 103, SiteName: "Sunrise Apartments" },
  { SiteId: 104, SiteName: "Lakeview Towers" },
];

const TEST_DEFAULTS_BY_SITE_ID = {
  101: {
    AmountToTransfer: 125000,
    PreviouslyTransferred: 50000,
    NotGeneratedReason: "",
  },
  102: {
    AmountToTransfer: 0,
    PreviouslyTransferred: 0,
    NotGeneratedReason: "Salary not generated for the selected month.",
  },
  103: {
    AmountToTransfer: 98000,
    PreviouslyTransferred: 98000,
    NotGeneratedReason: "",
  },
  104: {
    AmountToTransfer: 75000,
    PreviouslyTransferred: 0,
    NotGeneratedReason: "Attendance approval pending.",
  },
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatINR(value) {
  const n = toNumber(value);
  try {
    return n.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  } catch {
    return `₹ ${n}`;
  }
}

function clampMonth(m) {
  const n = toNumber(m);
  if (n < 1) return 1;
  if (n > 12) return 12;
  return n;
}

function getDefaultMonthYear() {
  const today = new Date();
  let month = today.getMonth(); // previous month (0-based)
  let year = today.getFullYear();
  if (month === 0) {
    month = 12;
    year = year - 1;
  }
  return { month, year };
}

function makeStorageKey(year, month) {
  return `FundsApproval:${year}-${String(month).padStart(2, "0")}`;
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export default function FundsApproval() {
  const defaults = getDefaultMonthYear();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [dataMode, setDataMode] = useState("live");
  const [selectedYear, setSelectedYear] = useState(defaults.year);
  const [selectedMonth, setSelectedMonth] = useState(defaults.month);

  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);

  const [rowsBySiteId, setRowsBySiteId] = useState({});
  const [selectedSiteIds, setSelectedSiteIds] = useState(() => new Set());
  const [searchText, setSearchText] = useState("");
  const [sending, setSending] = useState(false);

  // Live Data State
  const [freezedBreakup, setFreezedBreakup] = useState([]);
  const [expandedSiteIds, setExpandedSiteIds] = useState(new Set());
  const [history, setHistory] = useState([]);

  const years = useMemo(() => {
    const list = [];
    for (let y = 2021; y <= currentYear; y++) list.push(y);
    return list;
  }, [currentYear]);

  const months = useMemo(() => {
    const max = selectedYear === currentYear ? currentMonth : 12;
    const list = [];
    for (let m = 1; m <= max; m++) list.push(m);
    return list;
  }, [selectedYear, currentYear, currentMonth]);

  const storageKey = useMemo(
    () => makeStorageKey(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const monthName = monthNames[selectedMonth - 1].toLowerCase();
      const freezedData = await getFreezedSalaryDetailsForFundsApproval(monthName, selectedYear);

      const summaryList = Array.isArray(freezedData?.summary) ? freezedData.summary : [];
      const employeesList = Array.isArray(freezedData?.employees) ? freezedData.employees : [];

      setFreezedBreakup(employeesList);

      const normalized = summaryList.map((s) => ({
        SiteId: Number(s.PropertyId),
        SiteName: String(s.PropertyName || "").trim(),
        AgreementAmount: toNumber(s.AgreementAmount),
        AgreementStartDate: s.Agreement_Start_Date ? new Date(s.Agreement_Start_Date) : null,
        AgreementEndDate: s.Agreement_End_Date ? new Date(s.Agreement_End_Date) : null,
        FreezedSalary: toNumber(s.TotalFreezedSalary),
        FreezedEmployees: toNumber(s.TotalFreezedEmployees),
        PrevMonthFreezed: toNumber(s.PreviousMonthFreezedSalary),
        TotalEmployeesInUnit: toNumber(s.TotalEmployeesInUnit),
        PendingDiff: toNumber(s.PendingAmountDiff),
      }));

      setSites(normalized);
    } catch (e) {
      console.error("Failed to load sites:", e);
      if (dataMode === "test") setSites(TEST_SITES);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadTestSites = () => {
    setSites(TEST_SITES);
  };

  const seedTestRowsIfEmpty = () => {
    const hasSaved = window.localStorage.getItem(storageKey) != null;
    if (hasSaved) return;

    const next = {};
    for (const s of TEST_SITES) {
      const def = TEST_DEFAULTS_BY_SITE_ID[s.SiteId] || {};
      next[String(s.SiteId)] = {
        SiteId: s.SiteId,
        SiteName: s.SiteName,
        AmountToTransfer: toNumber(def.AmountToTransfer),
        PreviouslyTransferred: toNumber(def.PreviouslyTransferred),
        NotGeneratedReason: def.NotGeneratedReason || "",
      };
    }
    persistRows(next);
  };

  const loadHistory = async () => {
    try {
      const monthName = monthNames[selectedMonth - 1];
      const historicalData = await getFundsApprovalHistory(monthName, selectedYear);
      setHistory(Array.isArray(historicalData) ? historicalData : []);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };

  useEffect(() => {
    if (dataMode === "live") {
      loadSites();
      loadHistory();
    } else {
      loadTestSites();
    }
  }, [dataMode, selectedMonth, selectedYear]);

  useEffect(() => {
    const saved = safeJsonParse(window.localStorage.getItem(storageKey), {});
    setRowsBySiteId(saved && typeof saved === "object" ? saved : {});
    setSelectedSiteIds(new Set());
    setExpandedSiteIds(new Set());

    if (dataMode === "test") seedTestRowsIfEmpty();
  }, [storageKey]);

  useEffect(() => {
    if (!sites.length) return;
    setRowsBySiteId((prev) => {
      const next = { ...prev };
      for (const s of sites) {
        const key = String(s.SiteId);
        next[key] = {
          ...next[key],
          SiteId: s.SiteId,
          SiteName: s.SiteName,
          AmountToTransfer: dataMode === "live" ? s.FreezedSalary : (next[key]?.AmountToTransfer ?? 0),
          AgreementAmount: s.AgreementAmount,
          FreezedEmployees: s.FreezedEmployees,
          PrevMonthFreezed: s.PrevMonthFreezed,
          TotalEmployeesInUnit: s.TotalEmployeesInUnit,
          PendingDiff: s.PendingDiff,
          RecipientName: next[key]?.RecipientName ?? "",
          RecipientEmail: next[key]?.RecipientEmail ?? ""
        };
      }
      return next;
    });
  }, [sites, dataMode]);

  const rows = useMemo(() => {
    const list = sites.map((s) => {
      const row = rowsBySiteId?.[String(s.SiteId)] || {};
      const amount = toNumber(row.AmountToTransfer);
      const prev = toNumber(row.PreviouslyTransferred);
      const pending = Math.max(0, amount - prev);
      const hasReason = String(row.NotGeneratedReason || "").trim().length > 0;
      const status =
        amount <= 0
          ? "Not Generated"
          : pending <= 0
            ? "Already Transferred"
            : hasReason
              ? "Blocked"
              : "Ready";

      return {
        SiteId: s.SiteId,
        SiteName: row.SiteName || s.SiteName,
        AmountToTransfer: amount,
        PreviouslyTransferred: prev,
        NotGeneratedReason: row.NotGeneratedReason || "",
        PendingAmount: amount,
        Status: status,
        FreezedEmployees: row.FreezedEmployees || 0,
        AgreementAmount: s.AgreementAmount || 0,
        PrevMonthFreezed: s.PrevMonthFreezed || 0,
        TotalEmployeesInUnit: s.TotalEmployeesInUnit || 0,
        PendingDiff: s.PendingDiff || 0,
        RecipientName: row.RecipientName || "",
        RecipientEmail: row.RecipientEmail || "",
      };
    });

    const q = searchText.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => (r.SiteName || "").toLowerCase().includes(q));
  }, [sites, rowsBySiteId, searchText, history]);

  const stats = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    history.forEach(h => {
      if (h.IsApproved === true) approved += toNumber(h.AmountToTransfer);
      else if (h.IsApproved === false) rejected += toNumber(h.AmountToTransfer);
      else pending += toNumber(h.AmountToTransfer);
    });
    return { approved, rejected, pending };
  }, [history]);

  const totals = useMemo(() => {
    let totalAmount = 0;
    let totalPrev = 0;
    let totalPending = 0;
    for (const r of rows) {
      totalAmount += toNumber(r.AmountToTransfer);
      totalPrev += toNumber(r.PreviouslyTransferred);
      totalPending += toNumber(r.PendingAmount);
    }
    return { totalAmount, totalPrev, totalPending };
  }, [rows]);

  const persistRows = (nextRows) => {
    setRowsBySiteId(nextRows);
    window.localStorage.setItem(storageKey, JSON.stringify(nextRows || {}));
  };

  const updateRow = (siteId, patch) => {
    const key = String(siteId);
    const next = { ...(rowsBySiteId || {}) };
    next[key] = { ...(next[key] || {}), ...patch, SiteId: Number(siteId) };
    persistRows(next);
  };

  const toggleExpand = (siteId) => {
    setExpandedSiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const toggleSelected = (siteId) => {
    setSelectedSiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedSiteIds((prev) => {
      const allVisible = rows.map((r) => r.SiteId);
      const next = new Set(prev);
      const allSelected = allVisible.every((id) => next.has(id));
      if (allSelected) {
        for (const id of allVisible) next.delete(id);
      } else {
        for (const id of allVisible) next.add(id);
      }
      return next;
    });
  };

  const sendForApproval = async (onlySiteId = null) => {
    const selected =
      onlySiteId != null
        ? rows.filter((r) => r.SiteId === onlySiteId)
        : rows.filter((r) => selectedSiteIds.has(r.SiteId));

    const payload = selected
      .filter((r) => r.PendingAmount > 0)
      .map((r) => ({
        SiteId: r.SiteId,
        SiteName: r.SiteName,
        Month: selectedMonth,
        MonthName: monthNames[selectedMonth - 1],
        Year: selectedYear,
        AmountToTransfer: r.AmountToTransfer,
        PreviouslyTransferred: r.PreviouslyTransferred,
        PendingAmount: r.PendingAmount,
        AgreementAmount: r.AgreementAmount,
        PendingDiff: r.PendingDiff,
        RecipientName: r.RecipientName,
        RecipientEmail: r.RecipientEmail,
        NotGeneratedReason: (r.NotGeneratedReason || "").trim(),
        EmployeeIds: freezedBreakup
          .filter(b => Number(b.PropertyId) === r.SiteId)
          .map(b => Number(b.FacilityMemberId)),
      }));

    const invalid = payload.filter(p => !p.RecipientEmail || !p.RecipientName);
    if (invalid.length > 0) {
      alert(`Please provide Recipient Name and Email for all selected sites: ${invalid.map(i => i.SiteName).join(", ")}`);
      return;
    }

    if (!window.confirm(`Send ${payload.length} site(s) for approval?`)) return;

    setSending(true);
    try {
      const result = await sendFundsApprovalToRecipient({
        month: monthNames[selectedMonth - 1],
        year: selectedYear,
        sentBy: appCommon.getLoggedInUserName() || "Admin",
        requests: payload
      });

      alert(result?.message || "Approval request(s) sent successfully via email.");
      setSelectedSiteIds(new Set());
    } catch (e) {
      console.error("Failed to send approval:", e);
      alert("Failed to send approval request. Check console for details.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
      <div className="card shadow-sm" style={{ maxWidth: 1250, margin: "0 auto", borderRadius: 10 }}>
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom flex-wrap gap-3">
          <div>
            <h2 className="fw-bold m-0 text-primary">Funds Approval</h2>
            <div className="text-muted small">Review site-wise salary requirements and manage fund transfers.</div>
          </div>

          <div className="d-flex align-items-end gap-2 flex-wrap">
            <div>
              <label className="small mb-1 d-block text-secondary">Year</label>
              <select className="form-select form-select-sm" style={{ width: 100 }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="small mb-1 d-block text-secondary">Month</label>
              <select className="form-select form-select-sm" style={{ width: 140 }} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="small mb-1 d-block text-secondary">Search</label>
              <input type="text" className="form-control form-control-sm" style={{ width: 180 }} placeholder="Search site..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ height: 31 }} onClick={() => sendForApproval(null)} disabled={sending || selectedSiteIds.size === 0}>
              {sending ? "Sending..." : "Send for Approval"}
            </button>
          </div>
        </div>

        {/* SUMMARY STATS */}
        {dataMode === "live" && (
          <div className="p-3 bg-light border-bottom">
            <Row className="g-3">
              <Col md={3}>
                <Card className="text-center shadow-sm border-0 border-start border-primary border-4">
                  <Card.Body className="py-2">
                    <div className="text-muted small fw-bold">TOTAL REQUESTED</div>
                    <div className="fs-5 fw-bold">{formatINR(totals.totalAmount)}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-0 border-start border-success border-4">
                  <Card.Body className="py-2">
                    <div className="text-success small fw-bold">TOTAL APPROVED</div>
                    <div className="fs-5 fw-bold text-success">{formatINR(stats.approved)}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-0 border-start border-danger border-4">
                  <Card.Body className="py-2">
                    <div className="text-danger small fw-bold">TOTAL REJECTED</div>
                    <div className="fs-5 fw-bold text-danger">{formatINR(stats.rejected)}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center shadow-sm border-0 border-start border-warning border-4">
                  <Card.Body className="py-2">
                    <div className="text-warning small fw-bold">PENDING APPROVAL</div>
                    <div className="fs-5 fw-bold text-warning">{formatINR(stats.pending)}</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* TABLE */}
        <div className="table-responsive p-3">
          <table className="table table-bordered table-hover align-middle shadow-sm rounded">
            <thead className="table-light">
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>
                  <input type="checkbox" checked={rows.length > 0 && rows.every(r => selectedSiteIds.has(r.SiteId))} onChange={toggleSelectAllVisible} />
                </th>
                <th>Site</th>
                <th className="text-end" style={{ width: 130 }}>Agreement Amt</th>
                <th className="text-end" style={{ width: 130 }}>Prev Month</th>
                <th className="text-end" style={{ width: 130 }}>Current Freezed</th>
                <th className="text-end" style={{ width: 120 }}>Budget Diff</th>
                <th style={{ width: 170 }}>Approve To (Name)</th>
                <th style={{ width: 220 }}>Approve To (Email)</th>
                <th>Reason</th>
                <th className="text-center" style={{ width: 150 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center p-5 text-muted">{loadingSites ? "Fetching live data..." : "No property records found for this period."}</td></tr>
              ) : (
                rows.map((r) => (
                  <React.Fragment key={r.SiteId}>
                    <tr>
                      <td className="text-center">
                        <input type="checkbox" checked={selectedSiteIds.has(r.SiteId)} onChange={() => toggleSelected(r.SiteId)} />
                      </td>
                      <td className="fw-bold">{r.SiteName}</td>
                      <td className="text-end">{formatINR(r.AgreementAmount)}</td>
                      <td className="text-end text-muted small">{formatINR(r.PrevMonthFreezed)}</td>
                      <td className="text-end fw-bold">{formatINR(r.AmountToTransfer)}</td>
                      <td className={`text-end fw-bold ${r.PendingDiff > 0 ? "text-danger" : "text-success"}`}>
                        {formatINR(r.PendingDiff)}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Name..."
                          value={r.RecipientName}
                          onChange={(e) => updateRow(r.SiteId, { RecipientName: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="Email..."
                          value={r.RecipientEmail}
                          onChange={(e) => updateRow(r.SiteId, { RecipientEmail: e.target.value })}
                        />
                      </td>
                      <td>
                        <input type="text" className="form-control form-control-sm" placeholder="Reason..." value={r.NotGeneratedReason} onChange={(e) => updateRow(r.SiteId, { NotGeneratedReason: e.target.value })} />
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => sendForApproval(r.SiteId)} disabled={sending || r.PendingAmount <= 0}>Send</button>
                          <button className="btn btn-outline-info" onClick={() => toggleExpand(r.SiteId)}>
                            {expandedSiteIds.has(r.SiteId) ? "Hide" : "Breakup"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedSiteIds.has(r.SiteId) && (
                      <tr className="table-light">
                        <td colSpan={11} className="p-0">
                          <div className="p-3 bg-white border rounded m-2 shadow-sm">
                            <h6 className="mb-3 text-secondary d-flex justify-content-between align-items-center">
                              <span>Salary Slip Breakup</span>
                              <span className="badge bg-light text-dark">{r.FreezedEmployees} Freezed Employees</span>
                            </h6>
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered mb-0 small" style={{ minWidth: 1200 }}>
                                <thead className="bg-light text-center">
                                  <tr>
                                    <th rowSpan="2" className="align-middle">Emp ID</th>
                                    <th rowSpan="2" className="align-middle">Name / Designation</th>
                                    <th colSpan="5" className="bg-success text-white py-1">Earnings</th>
                                    <th colSpan="5" className="bg-danger text-white py-1">Deductions</th>
                                    <th colSpan="3" className="bg-info text-white py-1">Attendance</th>
                                    <th rowSpan="2" className="align-middle bg-primary text-white">Net Total</th>
                                  </tr>
                                  <tr className="bg-light small">
                                    <th>Basic</th>
                                    <th>HRA</th>
                                    <th>Conv.</th>
                                    <th>Spl.</th>
                                    <th>OT</th>
                                    <th>ESI</th>
                                    <th>PF</th>
                                    <th>PT</th>
                                    <th>Adv.</th>
                                    <th>TDS</th>
                                    <th>W</th>
                                    <th>L</th>
                                    <th>P</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {freezedBreakup
                                    .filter(b => Number(b.PropertyId) === r.SiteId)
                                    .map((b, idx) => (
                                      <tr key={idx}>
                                        <td className="text-center">{b.FacilityMemberId}</td>
                                        <td>
                                          <div className="fw-bold">{b.FacilityMemberName}</div>
                                          <div className="text-muted" style={{ fontSize: 10 }}>{b.Designation}</div>
                                        </td>
                                        {/* Earnings */}
                                        <td className="text-end">{formatINR(b.Basic)}</td>
                                        <td className="text-end">{formatINR(b.HRA)}</td>
                                        <td className="text-end">{formatINR(b.Conveyance)}</td>
                                        <td className="text-end">{formatINR(b.SplAllowance)}</td>
                                        <td className="text-end">{formatINR(b.OTAmount)}</td>

                                        {/* Deductions */}
                                        <td className="text-end text-danger">{formatINR(b.ESI)}</td>
                                        <td className="text-end text-danger">{formatINR(b.PF)}</td>
                                        <td className="text-end text-danger">{formatINR(b.PT)}</td>
                                        <td className="text-end text-danger">{formatINR(b.Advance)}</td>
                                        <td className="text-end text-danger">{formatINR(b.TDS)}</td>

                                        {/* Attendance */}
                                        <td className="text-center">{b.WorkingDays || 0}</td>
                                        <td className="text-center">{b.LeaveDays || b.AbsentDays || 0}</td>
                                        <td className="text-center fw-bold">{b.PaidDays || 0}</td>

                                        <td className="text-end fw-bold text-primary">{formatINR(b.NetSalary || b.GeneratedAmount)}</td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="p-4 bg-light text-end border-top d-flex justify-content-end gap-4 flex-wrap">
          <div className="summary-item">
            <div className="text-muted small">Total to Transfer</div>
            <div className="fw-bold fs-5 text-primary">{formatINR(totals.totalAmount)}</div>
          </div>
          <div className="summary-item border-start ps-4">
            <div className="text-muted small">Previously Transferred</div>
            <div className="fw-bold fs-5">{formatINR(totals.totalPrev)}</div>
          </div>
          <div className="summary-item border-start ps-4">
            <div className="text-muted small">Net Pending</div>
            <div className="fw-bold fs-5 text-dark">{formatINR(totals.totalPending)}</div>
          </div>
        </div>
        {/* HISTORY TABLE ✅ NEW SECTION */}
        <div className="p-4 border-top">
          <h5 className="fw-bold text-secondary mb-3">Approval & Rejection History</h5>
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle small">
              <thead className="table-dark">
                <tr>
                  <th>Site Name</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Status</th>
                  <th>Action By</th>
                  <th>Remark / Feedback</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-3 text-muted">No history found for current selection.</td></tr>
                ) : (
                  history.map((h, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{sites.find(s => s.SiteId === Number(h.PropertyId))?.SiteName || `Site ${h.PropertyId}`}</td>
                      <td className="text-end">{formatINR(h.AmountToTransfer)}</td>
                      <td className="text-center">
                        <Badge bg={h.IsApproved === true ? "success" : h.IsApproved === false ? "danger" : "warning"}>
                          {h.IsApproved === true ? "Approved" : h.IsApproved === false ? "Rejected" : "Pending"}
                        </Badge>
                      </td>
                      <td>{h.ApprovedBy || h.RejectedBy || "Pending"}</td>
                      <td>{h.RejectionRemark || "-"}</td>
                      <td>{new Date(h.ApprovedOn || h.RejectionOn || h.SentOn).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}


