import React, { useEffect, useMemo, useState } from "react";
import { getAllProperties } from "../../Services/PropertyService";

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

  const [dataMode, setDataMode] = useState("test"); // "test" | "live"
  const [selectedYear, setSelectedYear] = useState(defaults.year);
  const [selectedMonth, setSelectedMonth] = useState(defaults.month);

  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // row data is stored per month-year so user can fill amounts/reasons and come back later
  const [rowsBySiteId, setRowsBySiteId] = useState({});
  const [selectedSiteIds, setSelectedSiteIds] = useState(() => new Set());
  const [searchText, setSearchText] = useState("");
  const [sending, setSending] = useState(false);

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
      const data = await getAllProperties();
      const normalized = (Array.isArray(data) ? data : [])
        .map((p) => ({
          SiteId: Number(p.PropertyID ?? p.PropertyId ?? p.Id ?? p.id ?? 0),
          SiteName: String(p.Name ?? p.PropertyName ?? p.SiteName ?? "").trim(),
        }))
        .filter((p) => p.SiteId > 0 && p.SiteName);

      setSites(normalized.length ? normalized : TEST_SITES);
    } catch (e) {
      console.error("Failed to load sites:", e);
      setSites(TEST_SITES);
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

  // Load data once
  useEffect(() => {
    if (dataMode === "live") loadSites();
    else loadTestSites();
  }, []);

  // Load saved rows when month/year changes
  useEffect(() => {
    const saved = safeJsonParse(window.localStorage.getItem(storageKey), {});
    setRowsBySiteId(saved && typeof saved === "object" ? saved : {});
    setSelectedSiteIds(new Set());

    if (dataMode === "test") seedTestRowsIfEmpty();
  }, [storageKey]);

  // Ensure we always have a row object for each site (so table renders nicely)
  useEffect(() => {
    if (!sites.length) return;
    setRowsBySiteId((prev) => {
      const next = { ...(prev || {}) };
      let changed = false;
      for (const s of sites) {
        const key = String(s.SiteId);
        if (!next[key]) {
          next[key] = {
            SiteId: s.SiteId,
            SiteName: s.SiteName,
            AmountToTransfer: 0,
            PreviouslyTransferred: 0,
            NotGeneratedReason: "",
          };
          changed = true;
        } else if (!next[key].SiteName) {
          next[key] = { ...next[key], SiteName: s.SiteName };
          changed = true;
        }
      }
      if (!changed) return prev;
      return next;
    });
  }, [sites]);

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
        PendingAmount: pending,
        Status: status,
      };
    });

    const q = searchText.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => (r.SiteName || "").toLowerCase().includes(q));
  }, [sites, rowsBySiteId, searchText]);

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
        NotGeneratedReason: (r.NotGeneratedReason || "").trim(),
      }));

    if (!payload.length) {
      alert("No pending amount available to send for approval.");
      return;
    }

    if (
      !window.confirm(
        `Send ${payload.length} site(s) for approval for ${monthNames[selectedMonth - 1]} ${selectedYear}?`
      )
    ) {
      return;
    }

    setSending(true);
    try {
      // NOTE: API integration is pending.
      // When backend is ready, replace the alert with a POST call.
      // Example payload is prepared in `payload`.
      console.log("Funds approval payload:", payload);
      alert("Sent for approval successfully.");
      setSelectedSiteIds(new Set());
    } catch (e) {
      console.error("Failed to send for approval:", e);
      alert("Failed to send for approval.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
      <div
        className="card"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          paddingBottom: 14,
        }}
      >
        {/* HEADER */}
        <div
          className="d-flex justify-content-between align-items-center"
          style={{
            padding: "20px 28px 14px 28px",
            borderBottom: "1px solid #dee2e6",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ fontWeight: "bold", fontSize: "2rem", margin: 0 }}>
              Funds Approval
            </h2>
            <div style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>
              Select month/year, review site-wise transfer amount, reason, and send for approval.
            </div>
          </div>

          <div
            className="d-flex align-items-end"
            style={{ gap: 12, flexWrap: "wrap" }}
          >
            <div>
              <label style={{ fontSize: 12, marginBottom: 4 }}>Mode</label>
              <select
                className="form-control"
                style={{ width: 140 }}
                value={dataMode}
                onChange={(e) => {
                  const nextMode = e.target.value;
                  setDataMode(nextMode);
                  if (nextMode === "live") loadSites();
                  else {
                    loadTestSites();
                    seedTestRowsIfEmpty();
                  }
                }}
              >
                <option value="test">Test Data</option>
                <option value="live">Live Data</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, marginBottom: 4 }}>Year</label>
              <select
                className="form-control"
                style={{ width: 140 }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, marginBottom: 4 }}>Month</label>
              <select
                className="form-control"
                style={{ width: 180 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(clampMonth(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthNames[m - 1]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, marginBottom: 4 }}>Search</label>
              <input
                type="text"
                className="form-control"
                style={{ width: 220, background: "#f8fafc" }}
                placeholder="Search site"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-outline-secondary"
                style={{ height: 38 }}
                onClick={loadSites}
                disabled={loadingSites || dataMode !== "live"}
                title="Reload site list"
              >
                {loadingSites ? "Loading..." : "Reload Sites"}
              </button>

              <button
                className="btn btn-primary"
                style={{ height: 38 }}
                onClick={() => sendForApproval(null)}
                disabled={sending || selectedSiteIds.size === 0}
                title="Send selected sites for approval"
              >
                {sending ? "Sending..." : "Send for Approval"}
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive px-4 pt-3 pb-2">
          <table className="table table-bordered table-hover">
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ width: 50, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selectedSiteIds.has(r.SiteId))}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible"
                  />
                </th>
                <th>Site</th>
                <th style={{ width: 170 }}>Amount to Transfer</th>
                <th style={{ width: 170 }}>Previously Transferred</th>
                <th>Why not generated right now?</th>
                <th style={{ width: 140 }}>Pending</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ width: 170 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 22 }}>
                    {loadingSites ? "Loading sites..." : "No sites found."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.SiteId}>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedSiteIds.has(r.SiteId)}
                        onChange={() => toggleSelected(r.SiteId)}
                        aria-label={`Select ${r.SiteName}`}
                      />
                    </td>

                    <td style={{ fontWeight: 600 }}>{r.SiteName}</td>

                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={r.AmountToTransfer}
                        min={0}
                        onChange={(e) =>
                          updateRow(r.SiteId, { AmountToTransfer: toNumber(e.target.value) })
                        }
                      />
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        {formatINR(r.AmountToTransfer)}
                      </div>
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={r.PreviouslyTransferred}
                        min={0}
                        onChange={(e) =>
                          updateRow(r.SiteId, { PreviouslyTransferred: toNumber(e.target.value) })
                        }
                      />
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                        {formatINR(r.PreviouslyTransferred)}
                      </div>
                    </td>

                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={r.NotGeneratedReason}
                        placeholder="E.g., Salary not generated / Bank details missing / Attendance pending"
                        onChange={(e) =>
                          updateRow(r.SiteId, { NotGeneratedReason: e.target.value })
                        }
                      />
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {formatINR(r.PendingAmount)}
                    </td>

                    <td>
                      <span
                        className={
                          r.Status === "Ready"
                            ? "badge bg-success"
                            : r.Status === "Blocked"
                              ? "badge bg-warning text-dark"
                              : r.Status === "Already Transferred"
                                ? "badge bg-secondary"
                                : "badge bg-danger"
                        }
                      >
                        {r.Status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => sendForApproval(r.SiteId)}
                        disabled={sending || r.PendingAmount <= 0}
                        title="Send this site for approval"
                      >
                        Send
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div
          className="px-4 pb-3"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            Total to Transfer:{" "}
            <span style={{ fontWeight: 800 }}>{formatINR(totals.totalAmount)}</span>
          </div>
          <div style={{ fontWeight: 600 }}>
            Total Previously Transferred:{" "}
            <span style={{ fontWeight: 800 }}>{formatINR(totals.totalPrev)}</span>
          </div>
          <div style={{ fontWeight: 600 }}>
            Total Pending:{" "}
            <span style={{ fontWeight: 800 }}>{formatINR(totals.totalPending)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
