import React, { useCallback, useEffect, useMemo, useState } from "react";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeTimeString(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const parts = s.split(":").map((p) => p.trim());
  if (parts.length < 2) return "";
  const hh = toNumber(parts[0]);
  const mm = toNumber(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "";
  const h = Math.max(0, Math.min(23, hh));
  const m = Math.max(0, Math.min(59, mm));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(hhmm) {
  const s = normalizeTimeString(hhmm);
  if (!s) return NaN;
  const [h, m] = s.split(":").map((p) => Number(p));
  return h * 60 + m;
}

function setDateTime(baseDate, hhmm) {
  const base = baseDate instanceof Date && !Number.isNaN(baseDate.getTime()) ? baseDate : new Date();
  const safe = normalizeTimeString(hhmm);
  if (!safe) return new Date(base);
  const [h, m] = safe.split(":").map((p) => Number(p));
  const next = new Date(base);
  next.setHours(h, m, 0, 0);
  return next;
}

function formatRange(from, to) {
  const a = normalizeTimeString(from);
  const b = normalizeTimeString(to);
  if (!a && !b) return "00:00 - 00:00";
  return `${a || "00:00"} - ${b || "00:00"}`;
}

function normalizeShiftRows(shifts) {
  const base = Array.isArray(shifts) ? shifts : [];
  return base
    .map((s, idx) => ({
      id: String(s.ShiftId ?? s.id ?? idx),
      shiftId: Number(s.ShiftId ?? s.id ?? 0),
      name: String(s.ShiftName ?? s.name ?? `Shift ${idx + 1}`),
      from: normalizeTimeString(s.TimeFrom ?? s.from),
      to: normalizeTimeString(s.TimeTo ?? s.to),
    }))
    .filter((s) => s.id && s.name);
}

function startOfDay(d) {
  const date = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function formatDateYmd(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatDateYmd(value);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : formatDateYmd(parsed);
}

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-").map(Number);
    return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

function formatTimeHhMm(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function unitToMinutes(unit) {
  const key = String(unit || "").toLowerCase();
  if (key === "minutes") return 1;
  if (key === "hours") return 60;
  if (key === "days") return 24 * 60;
  if (key === "weeks") return 7 * 24 * 60;
  return 60;
}

export default function TaskScheduleSection({
  shifts,
  baseDate,
  dueDate,
  onAssignTimes,
  onScheduleUpdate,
  embedded = false,
}) {
  const rows = useMemo(() => normalizeShiftRows(shifts), [shifts]);
  const [mode, setMode] = useState("shift"); // "shift" | "custom"
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [repeatCount, setRepeatCount] = useState("");
  const [intervalValue, setIntervalValue] = useState("");
  const [intervalUnit, setIntervalUnit] = useState("Hours");
  const [repeatDateFrom, setRepeatDateFrom] = useState(() => toDateInputValue(baseDate));
  const [repeatDateTo, setRepeatDateTo] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [dirty, setDirty] = useState(false);

  const selectedShiftRows = useMemo(() => {
    const selected = new Set(selectedShiftIds);
    return rows.filter((r) => selected.has(String(r.id)));
  }, [rows, selectedShiftIds]);

  const canShowRemove = useMemo(() => {
    return (
      (mode === "shift" && selectedShiftIds.length > 0) ||
      (mode === "custom" && (customStart || customEnd || repeatCount || intervalValue)) ||
      repeatDateFrom ||
      repeatDateTo
    );
  }, [customEnd, customStart, intervalValue, mode, repeatCount, repeatDateFrom, repeatDateTo, selectedShiftIds.length]);

  useEffect(() => {
    const nextDate = toDateInputValue(baseDate);
    if (!nextDate) return;
    setRepeatDateFrom((prev) => prev || nextDate);
  }, [baseDate]);

  const effectiveRepeatDateTo = useMemo(() => {
    return repeatDateTo || toDateInputValue(dueDate) || "";
  }, [dueDate, repeatDateTo]);

  const occurrenceAnchorDate = useMemo(() => {
    return parseDateOnly(repeatDateFrom) || startOfDay(baseDate);
  }, [baseDate, repeatDateFrom]);

  const shiftRange = useMemo(() => {
    if (!selectedShiftRows.length) return { from: "", to: "", crossesMidnight: false };
    const starts = selectedShiftRows.map((r) => timeToMinutes(r.from)).filter(Number.isFinite);
    const ends = selectedShiftRows.map((r) => timeToMinutes(r.to)).filter(Number.isFinite);
    if (!starts.length || !ends.length) return { from: "", to: "", crossesMidnight: false };
    const minStart = Math.min(...starts);
    const maxEnd = Math.max(...ends);
    const crossesMidnight = maxEnd <= minStart;
    const from = `${String(Math.floor(minStart / 60)).padStart(2, "0")}:${String(minStart % 60).padStart(2, "0")}`;
    const to = `${String(Math.floor(maxEnd / 60)).padStart(2, "0")}:${String(maxEnd % 60).padStart(2, "0")}`;
    return { from, to, crossesMidnight };
  }, [selectedShiftRows]);

  const timingPreview = useMemo(() => {
    if (mode === "shift") return formatRange(shiftRange.from, shiftRange.to);
    return formatRange(customStart, customEnd);
  }, [customEnd, customStart, mode, shiftRange.from, shiftRange.to]);

  const toggleShift = useCallback((id) => {
    setInlineError("");
    setDirty(true);
    setSelectedShiftIds((prev) => {
      const key = String(id);
      return prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
    });
  }, []);

  const resetSchedule = useCallback(() => {
    setInlineError("");
    setMode("shift");
    setSelectedShiftIds([]);
    setCustomStart("");
    setCustomEnd("");
    setRepeatCount("");
    setIntervalValue("");
    setIntervalUnit("Hours");
    setRepeatDateFrom(toDateInputValue(baseDate));
    setRepeatDateTo("");
    setDirty(true);
  }, [baseDate]);

  const onAssign = useCallback(() => {
    setInlineError("");
    if (mode === "shift") {
      if (!selectedShiftRows.length) {
        setInlineError("Please select at least one shift.");
        return;
      }
      if (shiftRange.crossesMidnight) {
        setInlineError("Selected shifts cross midnight. Please use Custom time.");
        return;
      }
      if (timeToMinutes(shiftRange.to) <= timeToMinutes(shiftRange.from)) {
        setInlineError("End time should be greater than start time.");
        return;
      }
      onAssignTimes?.({
        startTime: setDateTime(baseDate, shiftRange.from),
        endTime: setDateTime(baseDate, shiftRange.to),
      });
      return;
    }

    const startMinutes = timeToMinutes(customStart);
    const endMinutes = timeToMinutes(customEnd);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      setInlineError("Please enter start and end times.");
      return;
    }
    if (endMinutes <= startMinutes) {
      setInlineError("End time should be greater than start time.");
      return;
    }
    onAssignTimes?.({
      startTime: setDateTime(baseDate, customStart),
      endTime: setDateTime(baseDate, customEnd),
    });
  }, [baseDate, customEnd, customStart, mode, onAssignTimes, selectedShiftRows.length, shiftRange.crossesMidnight, shiftRange.from, shiftRange.to, selectedShiftRows]);

  const intervalMinutes = useMemo(() => {
    const n = Number(intervalValue);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n) * unitToMinutes(intervalUnit);
  }, [intervalUnit, intervalValue]);

  const occurrences = useMemo(() => {
    const n = Number(repeatCount);
    const count = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    const base = occurrenceAnchorDate;

    if (count > 1 && intervalMinutes <= 0) return [];

    if (mode === "shift") {
      if (!selectedShiftRows.length) return [];
      const entries = [];
      selectedShiftRows.forEach((shift) => {
        if (!shift.from) return;
        const baseTime = setDateTime(base, shift.from);
        for (let i = 0; i < count; i += 1) {
          const offset = i * intervalMinutes;
          const dt = new Date(baseTime.getTime() + offset * 60 * 1000);
          entries.push({
            key: `${shift.shiftId || shift.id}-${formatDateYmd(dt)}-${shift.from}-${i}`,
            shiftId: Number(shift.shiftId) || 0,
            shiftName: shift.name,
            taskDate: startOfDay(dt),
            taskTime: dt,
            range: formatRange(shift.from, shift.to),
          });
        }
      });
      return entries.sort((a, b) => a.taskTime.getTime() - b.taskTime.getTime());
    }

    if (!customStart) return [];
    const entries = [];
    const baseTime = setDateTime(base, customStart);
    for (let i = 0; i < count; i += 1) {
      const offset = i * intervalMinutes;
      const dt = new Date(baseTime.getTime() + offset * 60 * 1000);
      entries.push({
        key: `custom-${formatDateYmd(dt)}-${customStart}-${i}`,
        shiftId: 0,
        shiftName: "Custom",
        taskDate: startOfDay(dt),
        taskTime: dt,
        range: formatRange(customStart, customEnd),
      });
    }
    return entries;
  }, [customEnd, customStart, intervalMinutes, mode, occurrenceAnchorDate, repeatCount, selectedShiftRows]);

  const schedulePayload = useMemo(() => {
    const repeatNumber = Number(repeatCount);
    const repetitionValue = Number.isFinite(repeatNumber) && repeatNumber > 0
      ? Math.min(5, Math.floor(repeatNumber))
      : 0;
    const intervalNumber = Number(intervalValue);
    const repetitionInterval = Number.isFinite(intervalNumber) && intervalNumber > 0
      ? Math.floor(intervalNumber)
      : 0;

    return {
      dirty,
      mode,
      selectedShiftIds,
      customStart,
      customEnd,
      repeatCount,
      intervalValue,
      intervalUnit,
      mappings: occurrences.map((o) => ({
        ShiftId: Number(o.shiftId) || 0,
        TaskDate: o.taskDate,
        TaskTime: o.taskTime,
      })),
      preview: occurrences.map((o) => ({
        shiftName: o.shiftName,
        date: formatDateYmd(o.taskDate),
        time: formatTimeHhMm(o.taskTime),
        range: o.range,
      })),
      repetition: {
        enabled: Boolean(repetitionValue && repetitionInterval && repeatDateFrom && effectiveRepeatDateTo),
        DateFrom: repeatDateFrom || "",
        DateTo: effectiveRepeatDateTo,
        Repetition: repetitionValue,
        Repetition_Interval: repetitionInterval,
        Repetition_Interval_Unit: String(intervalUnit || ""),
      },
    };
  }, [customEnd, customStart, dirty, effectiveRepeatDateTo, intervalUnit, intervalValue, mode, occurrences, repeatCount, repeatDateFrom, selectedShiftIds]);

  useEffect(() => {
    onScheduleUpdate?.(schedulePayload);
  }, [onScheduleUpdate, schedulePayload]);

  const renderShiftButtons = () => {
    if (!rows.length) {
      const fallback = [
        { id: "morning", name: "Morning", from: "", to: "" },
        { id: "afternoon", name: "Afternoon", from: "", to: "" },
        { id: "evening", name: "Evening", from: "", to: "" },
      ];
      return fallback.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`task-shift-pill ${selectedShiftIds.includes(s.id) ? "is-selected" : ""}`}
          onClick={() => toggleShift(s.id)}
        >
          {s.name}
        </button>
      ));
    }

    return rows.map((s) => (
      <button
        key={s.id}
        type="button"
        className={`task-shift-pill ${selectedShiftIds.includes(String(s.id)) ? "is-selected" : ""}`}
        onClick={() => toggleShift(s.id)}
        title={formatRange(s.from, s.to)}
      >
        {s.name}
      </button>
    ));
  };

  return (
    <div className="task-schedule-wrap">
      {!embedded || canShowRemove ? (
        <div className="task-schedule-topbar">
          {embedded ? <div /> : <div className="task-schedule-title">Schedule (Optional)</div>}
          {canShowRemove ? (
            <button type="button" className="task-schedule-remove" onClick={resetSchedule}>
              <i className="fas fa-times" />
              <span>Remove shift</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="task-schedule-grid">
        <div className="task-schedule-card">
          <div className="task-schedule-card-title">Timing</div>

          <label className="task-schedule-radio">
            <input
              type="radio"
              name="taskScheduleMode"
              checked={mode === "shift"}
              onChange={() => { setInlineError(""); setDirty(true); setMode("shift"); }}
            />
            <span className="task-schedule-radio-text">
              <span className="task-schedule-radio-head">Shift based</span>
              <span className="task-schedule-radio-sub">Select one or more shifts</span>
            </span>
          </label>

          {mode === "shift" ? (
            <>
              <div className="task-shift-pill-row">{renderShiftButtons()}</div>
              <div className="task-schedule-muted">{timingPreview}</div>
            </>
          ) : null}

          <label className="task-schedule-radio" style={{ marginTop: 10 }}>
            <input
              type="radio"
              name="taskScheduleMode"
              checked={mode === "custom"}
              onChange={() => { setInlineError(""); setDirty(true); setMode("custom"); }}
            />
            <span className="task-schedule-radio-text">
              <span className="task-schedule-radio-head">Custom time</span>
              <span className="task-schedule-radio-sub">Set specific start and end times</span>
            </span>
          </label>

          {mode === "custom" ? (
            <div className="task-custom-time-row">
              <div className="task-time-input">
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => { setInlineError(""); setDirty(true); setCustomStart(e.target.value); }}
                  placeholder="Start time"
                />
                <i className="far fa-clock" />
              </div>
              <span className="task-time-dash">-</span>
              <div className="task-time-input">
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => { setInlineError(""); setDirty(true); setCustomEnd(e.target.value); }}
                  placeholder="End time"
                />
                <i className="far fa-clock" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="task-schedule-card">
          <div className="task-schedule-card-title">Repetition</div>

          <div className="task-schedule-field">
            <div className="task-schedule-field-label">Repetition</div>
            <div className="task-schedule-field-sub">Choose how many times task is to be repeated</div>
            <select
              className="form-control"
              value={repeatCount}
              onChange={(e) => { setInlineError(""); setDirty(true); setRepeatCount(e.target.value); }}
            >
              <option value="">- times</option>
              {Array.from({ length: 5 }).map((_, i) => (
                <option key={String(i + 1)} value={String(i + 1)}>{i + 1} times</option>
              ))}
            </select>
          </div>

          <div className="task-schedule-field" style={{ marginTop: 14 }}>
            <div className="task-schedule-field-label">Date range</div>
            <div className="task-schedule-field-sub">Choose the repetition start and end dates</div>
            <div className="task-schedule-interval-row">
              <input
                className="form-control"
                type="date"
                value={repeatDateFrom}
                onChange={(e) => { setInlineError(""); setDirty(true); setRepeatDateFrom(e.target.value); }}
              />
              <input
                className="form-control"
                type="date"
                value={repeatDateTo}
                min={repeatDateFrom || undefined}
                onChange={(e) => { setInlineError(""); setDirty(true); setRepeatDateTo(e.target.value); }}
              />
            </div>
          </div>

          <div className="task-schedule-field" style={{ marginTop: 14 }}>
            <div className="task-schedule-field-label">Interval</div>
            <div className="task-schedule-field-sub">Choose the intervals between repetitions</div>
            <div className="task-schedule-interval-row">
              <input
                className="form-control"
                type="number"
                min="0"
                value={intervalValue}
                onChange={(e) => { setInlineError(""); setDirty(true); setIntervalValue(e.target.value); }}
                placeholder="00"
              />
              <select
                className="form-control"
                value={intervalUnit}
                onChange={(e) => { setInlineError(""); setDirty(true); setIntervalUnit(e.target.value); }}
              >
                {["Minutes", "Hours", "Days", "Weeks"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="task-schedule-card">
          <div className="task-schedule-card-title">Preview</div>
          <div className="task-schedule-preview">
            {schedulePayload.preview.length ? (
              <ul className="task-schedule-preview-list">
                {schedulePayload.preview.map((p) => (
                  <li key={`${p.shiftName}-${p.date}-${p.time}`}>
                    <strong>{p.shiftName}</strong> — {p.date} {p.time} ({p.range})
                  </li>
                ))}
              </ul>
            ) : (
              <div className="task-schedule-preview-empty">Your scheduled timings will be displayed here</div>
            )}

            {Number(repeatCount) > 1 && intervalMinutes <= 0 ? (
              <div className="task-schedule-preview-empty" style={{ marginTop: 8 }}>
                Select an interval to generate repeated schedule.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {inlineError ? (
        <div className="task-schedule-error">
          <i className="fa fa-exclamation-triangle mr-2" />
          {inlineError}
        </div>
      ) : null}

      <div className="task-schedule-actions">
        <button type="button" className="btn btn-outline-primary" onClick={onAssign}>
          <i className="fa fa-plus mr-2" />
          Assign
        </button>
      </div>
    </div>
  );
}
