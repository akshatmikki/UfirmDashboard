// services/notificationService.js
import axios from "axios";
const API_BASE = "https://api.urest.in:8096/api";
const BASE_URL = "https://api.urest.in:8096/api/notification";
// const BASE_URL = "https://api.urest.in:8096/api/notification";

const endpoints = {
  task: "FMTaskNotification",
  complaint: "FMComplaintNotification",
};

export const TASK_NOTIFICATION_REFRESH_EVENT = "ufirm:task-notification-updated";

export const emitTaskNotificationRefresh = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TASK_NOTIFICATION_REFRESH_EVENT));
};

export const fetchNotifications = async (type, propertyId) => {
  const endpoint = endpoints[type];
  if (!endpoint) throw new Error("Invalid notification type");

  const url = `${BASE_URL}/${type}?propertyId=${propertyId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`${type} notification error:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn(`${type} notification data is not an array:`, data);
      return [];
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${type} notifications:`, error);
    return [];
  }
};

// 🔹 NEW: Fetch Asset Service Notifications
export const fetchAssetServiceNotifications = async (propertyId) => {
  const url = `https://api.urest.in:8096/api/Asset/GetServiceNotifications/${propertyId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Asset Service Notifications error:`, response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    // ✅ Case 1: API returns object { Upcoming: [...], Overdue: [...] }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const merged = [
        ...(data.Upcoming || []),
        ...(data.Overdue || []),
      ];
      return merged;
    }

    // ✅ Case 2: API already returns an array
    if (Array.isArray(data)) {
      return data;
    }

    console.warn("Unknown data format for Asset Service Notifications:", data);
    return [];
  } catch (error) {
    console.error(`Error fetching Asset Service Notifications:`, error);
    return [];
  }
};

export const fetchFmRemarkNotifications = async (propertyId, taskDate = null) => {
  if (!propertyId) return [];
  try {
    let url = `${BASE_URL}/taskFMRemark?propertyId=${propertyId}`;
    if (taskDate) url += `&taskDate=${encodeURIComponent(taskDate)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching FM remark notifications:", error);
    return [];
  }
};

export const getTaskRemarks = async (taskId, questionId, taskDate) => {
  try {
    const res = await axios.get(
      `${API_BASE}/notification/task/remarks`,
      {
        params: {
          taskId,
          questionId,
          taskDate,
        },
        withCredentials: false, // explicit, fine
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error fetching task remarks:", error);
    throw error;
  }
};

export const markTaskComplete = async ({ taskId, questionId, questId, taskDate, propertyId, taskStatus = "Completed" }) => {
  if (!taskId) throw new Error("taskId is required");
  if (!taskDate) throw new Error("taskDate is required");
  if (!propertyId) throw new Error("propertyId is required");

  const normalizeToIsoDateOnly = (value) => {
    if (!value) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, "0");
      const dd = String(value.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const raw = String(value).trim();
    if (!raw) return "";

    // ISO date or ISO datetime -> keep date-only part
    const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];

    // DD-MM-YYYY -> convert to YYYY-MM-DD
    const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

    // DD/MM/YYYY -> convert to YYYY-MM-DD
    const dmySlash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmySlash) return `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`;

    return raw;
  };

  const finalQuestId = questId !== undefined ? questId : (questionId !== undefined ? questionId : 0);
  const finalQuestionId = questionId !== undefined ? questionId : (questId !== undefined ? questId : 0);
  const normalizedTaskDate = normalizeToIsoDateOnly(taskDate);
  if (!normalizedTaskDate) throw new Error("taskDate is invalid");

  const res = await axios.post(
    `${API_BASE}/notification/task/complete`,
    {
      taskId,
      questId: finalQuestId,
      questionId: finalQuestionId,
      taskDate: normalizedTaskDate,
      propertyId,
      taskStatus,
      taskstatus: taskStatus,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
    },
  );

  return res.data;
};

export const getComplaintRemarks = async (ticketId) => {
  try {
    const res = await axios.get(
      `${API_BASE}/notification/complaints/remarks`,
      {
        params: {
          ticketId,
        },
        withCredentials: false, // explicit, consistent with others
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error fetching complaint remarks:", error);
    throw error;
  }
};

// 🔹 CREATE TASK WITH QUESTIONS (UREST API)
export const createTaskWithQuestions = async (payload) => {
  try {
    const res = await axios.post(
      "https://api.urest.in:8096/CreateTask",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: false, // important
      }
    );

    return res.data; // {}
  } catch (error) {
    console.error("Error creating task with questions:", error);
    throw error;
  }
};

// 🔹 GET TASK QUESTION IMAGES (BEFORE / AFTER)
export const getTaskQuestionImage = async ({
  taskId,
  questId,
  createdOn,
}) => {
  try {
    const res = await axios.get(
      "https://api.urest.in:8096/GetTaskQuestionImage",
      {
        params: {
          taskId,
          questId,
          createdOn,
        },
        headers: {
          Accept: "application/json",
        },
        withCredentials: false,
      }
    );

    const data = res.data || {};

    return {
      id: data.Id || null,
      taskId: data.TaskId || taskId,
      questId: data.QuestId || questId,
      beforeImage: data.BeforeImage || null, // already base64 prefixed
      afterImage: data.AfterImage || null,   // can be null
      createdOn: data.CreatedOn || null,
      updatedOn: data.UpdatedOn || null,
    };
  } catch (error) {
    console.error("Error fetching task question image:", error);
    throw error;
  }
};
