const BASE_URL = "https://api.urest.in:8096/api/tasks";

const toTwoDigit = (value) => String(value).padStart(2, "0");

export const getTaskSummary = async (propertyId, month, year) => {
  const res = await fetch(
    `${BASE_URL}/Tasksummary?propertyId=${propertyId}&month=${toTwoDigit(
      month
    )}&year=${year}`
  );
  if (!res.ok) return [];
  return res.json();
};

export const getTaskMonthlySummary = async (propertyId, month, year) => {
  const res = await fetch(
    `${BASE_URL}/TaskMonthlySummary?propertyId=${propertyId}&month=${toTwoDigit(
      month
    )}&year=${year}`
  );
  if (!res.ok) return [];
  return res.json();
};

export const getTaskDetails = async (taskId, taskDate, assignTo) => {
  const res = await fetch(
    `${BASE_URL}/Taskdetails?taskId=${taskId}&taskDate=${taskDate}&assignTo=${assignTo}`
  );
  if (!res.ok) return [];
  return res.json();
};
