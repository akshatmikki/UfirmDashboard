import axios from "axios";

const API_BASE = "https://api.urest.in:8096/api";

const toId = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

export const replaceTaskFrequencyMappings = async (taskId, mappings = []) => {
  const id = toId(taskId);
  if (!id) throw new Error("TaskId missing");

  const existing = await getTaskFrequencyMappingsByTaskId(id);
  await Promise.all((existing || []).map((m) => deleteTaskFrequencyMapping(m?.Id)));

  const payloads = (mappings || []).map((m) => ({
    TaskId: id,
    ShiftId: toId(m.ShiftId),
    TaskDate: m.TaskDate ?? null,
    TaskTime: m.TaskTime ?? null,
    IsActive: true,
  }));

  await Promise.all(payloads.map((p) => createTaskFrequencyMapping(p)));
  return { ok: true };
};

