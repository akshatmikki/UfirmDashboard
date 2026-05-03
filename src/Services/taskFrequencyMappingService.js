import axios from "axios";

const API_BASE = "https://api.urest.in:8096/api";

const toId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toDateOnly = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toTimeOnly = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hh = String(value.getHours()).padStart(2, "0");
    const mm = String(value.getMinutes()).padStart(2, "0");
    const ss = String(value.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  const raw = String(value).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mm = String(parsed.getMinutes()).padStart(2, "0");
  const ss = String(parsed.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export const getTaskFrequencyMappingsByTaskId = async (taskId) => {
  const id = toId(taskId);
  if (!id) return [];
  const res = await axios.get(`${API_BASE}/TaskFrequencyMapping/getbytaskid/${id}`, {
    withCredentials: false,
  });
  return Array.isArray(res.data) ? res.data : [];
};

export const createTaskFrequencyMapping = async (model) => {
  const res = await axios.post(`${API_BASE}/TaskFrequencyMapping/create`, model, {
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });
  return res.data;
};

export const updateTaskFrequencyMapping = async (model) => {
  const res = await axios.put(`${API_BASE}/TaskFrequencyMapping/update`, model, {
    headers: { "Content-Type": "application/json" },
    withCredentials: false,
  });
  return res.data;
};

export const deleteTaskFrequencyMapping = async (id) => {
  const mappingId = toId(id);
  if (!mappingId) return null;
  const res = await axios.delete(`${API_BASE}/TaskFrequencyMapping/delete/${mappingId}`, {
    withCredentials: false,
  });
  return res.data;
};

export const replaceTaskFrequencyMappings = async (taskId, frequencyId, mappings = []) => {
  const id = toId(taskId);
  if (!id) throw new Error("TaskId missing");
  const freqId = toId(frequencyId);
  if (!freqId) throw new Error("FrequencyId missing");

  const existing = await getTaskFrequencyMappingsByTaskId(id);
  await Promise.all((existing || []).map((m) => deleteTaskFrequencyMapping(m?.Id)));

  const firstMapping = Array.isArray(mappings) ? mappings.find((m) => m) : null;
  if (!firstMapping) {
    return { ok: true, createdMappings: [], refreshedMappings: [] };
  }

  const payload = {
    TaskId: id,
    FrequencyId: freqId,
    TaskDate: toDateOnly(firstMapping.TaskDate),
    TaskTime: toTimeOnly(firstMapping.TaskTime),
  };

  await createTaskFrequencyMapping(payload);

  const refreshedMappings = await getTaskFrequencyMappingsByTaskId(id);
  const createdMapping =
    (refreshedMappings || []).find(
      (mapping) =>
        toId(mapping?.TaskId) === id &&
        toId(mapping?.FrequencyId) === freqId &&
        toDateOnly(mapping?.TaskDate) === payload.TaskDate &&
        toTimeOnly(mapping?.TaskTime) === payload.TaskTime,
    ) || null;

  return {
    ok: true,
    createdMappings: createdMapping ? [createdMapping] : [],
    refreshedMappings,
  };
};

