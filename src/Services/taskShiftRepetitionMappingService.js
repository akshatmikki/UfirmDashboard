import axios from "axios";

const API_BASE = "https://api.urest.in:8096/api";

const toId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toIsoString = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

export const createTaskShiftRepetitionMapping = async (model) => {
  const payload = {
    TaskFrequencyId: toId(model?.TaskFrequencyId),
    ShiftId: toId(model?.ShiftId),
    DateFrom: toIsoString(model?.DateFrom),
    DateTo: toIsoString(model?.DateTo),
    Repetition: Math.min(5, Math.max(1, toId(model?.Repetition))),
    Repetition_Interval: toId(model?.Repetition_Interval),
    Repetition_Interval_Unit: String(model?.Repetition_Interval_Unit || ""),
  };

  const res = await axios.post(`${API_BASE}/TaskShiftRepetitionMapping/create`, payload, {
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });
  return res.data;
};

export const saveTaskShiftRepetitions = async (createdMappings = [], sourceMappings = [], repetition = {}) => {
  if (!repetition?.enabled) return [];

  const items = (createdMappings || [])
    .map((created, index) => {
      const source = sourceMappings[index] || {};
      return {
        TaskFrequencyId: toId(created?.Id ?? created?.TaskFrequencyId ?? created?.taskFrequencyId),
        ShiftId: toId(source?.ShiftId),
        DateFrom: repetition?.DateFrom,
        DateTo: repetition?.DateTo,
        Repetition: repetition?.Repetition,
        Repetition_Interval: repetition?.Repetition_Interval,
        Repetition_Interval_Unit: repetition?.Repetition_Interval_Unit,
      };
    })
    .filter((item) => item.TaskFrequencyId && item.DateFrom && item.DateTo && item.Repetition && item.Repetition_Interval);

  return Promise.all(items.map((item) => createTaskShiftRepetitionMapping(item)));
};
