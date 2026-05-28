import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import swal from "sweetalert";
import {
  emitTaskNotificationRefresh,
  fetchNotifications,
  getTaskRemarks,
  markTaskComplete,
} from "../../../../Services/notificationService";

export default function useTaskFmRemarks({
  taskId,
  taskName,
  propertyId,
  initialTaskDate,
  onTaskUpdated,
}) {
  const getTodayIsoDate = useCallback(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const normalizeDateOnly = useCallback((value) => {
    if (!value) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return moment(value).format("YYYY-MM-DD");
    }

    const parsed = moment(
      value,
      ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
      true,
    );
    if (parsed.isValid()) return parsed.format("YYYY-MM-DD");

    const loose = moment(value);
    return loose.isValid() ? loose.format("YYYY-MM-DD") : "";
  }, []);

  const getInitialIsoDate = useCallback(() => {
    const normalized = normalizeDateOnly(initialTaskDate);
    return normalized || getTodayIsoDate();
  }, [getTodayIsoDate, initialTaskDate, normalizeDateOnly]);

  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [fmSelectedDate, setFmSelectedDate] = useState(() => getInitialIsoDate());
  const [resolvedTaskDate, setResolvedTaskDate] = useState(() => getInitialIsoDate());
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasAnyRemarksForQuestion, setHasAnyRemarksForQuestion] = useState(false);
  const [questionStatusMap, setQuestionStatusMap] = useState({});
  const [questionIdsWithRemarks, setQuestionIdsWithRemarks] = useState([]);

  useEffect(() => {
    const initial = getInitialIsoDate();
    setFmSelectedDate(initial);
    setResolvedTaskDate(initial);
  }, [getInitialIsoDate]);

  const loadRemarks = useCallback(
    async (questionId, taskDate) => {
      if (!taskId || !questionId || !taskDate) return;
      setLoading(true);
      try {
        const iso = normalizeDateOnly(taskDate);
        let data = await getTaskRemarks(taskId, questionId, iso || taskDate);

        if (Array.isArray(data) && data.length === 0 && iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          const alt = moment(iso, "YYYY-MM-DD").format("DD-MM-YYYY");
          data = await getTaskRemarks(taskId, questionId, alt);
        }

        setRemarks(data || []);
      } catch {
        setRemarks([]);
      } finally {
        setLoading(false);
      }
    },
    [normalizeDateOnly, taskId],
  );

  const loadQuestionStatuses = useCallback(
    async (taskDate) => {
      if (!taskId || !propertyId) {
        setQuestionStatusMap({});
        setQuestionIdsWithRemarks([]);
        return;
      }

      try {
        const list = await fetchNotifications("task", propertyId);
        const selectedDate = normalizeDateOnly(taskDate || resolvedTaskDate);
        const filtered = (list || []).filter((n) => {
          if (Number(n.TaskId) !== Number(taskId)) return false;
          if (!selectedDate) return true;
          return normalizeDateOnly(n.TaskDate) === selectedDate;
        });

        const taskLevelStatusRow = filtered.find((item) => {
          const qid = Number(item.QuestionId ?? item.QuestID ?? 0);
          return qid === 0;
        });
        const taskLevelStatus =
          taskLevelStatusRow?.CurrentTaskStatus ||
          taskLevelStatusRow?.TaskStatus ||
          taskLevelStatusRow?.CurrentStatus ||
          "";

        const latestByQuestion = {};
        filtered.forEach((item) => {
          const qid = Number(item.QuestionId ?? item.QuestID ?? 0);
          if (!qid) return;

          const prev = latestByQuestion[qid];
          const prevTime = prev ? new Date(prev.SUPdateTime || prev.UpdatedOn || 0).getTime() : 0;
          const currTime = new Date(item.SUPdateTime || item.UpdatedOn || 0).getTime();

          if (!prev || currTime >= prevTime) {
            latestByQuestion[qid] = item;
          }
        });

        const next = {};
        const withRemarks = new Set();
        Object.keys(latestByQuestion).forEach((qid) => {
          const row = latestByQuestion[qid] || {};
          next[qid] =
            row.CurrentTaskStatus ||
            row.CurrentStatus ||
            row.TaskStatus ||
            taskLevelStatus ||
            "Actionable";
          if (String(row.SupRemark || "").trim() || String(row.FmRemark || "").trim()) {
            withRemarks.add(Number(qid));
          }
        });

        setQuestionStatusMap(next);
        setQuestionIdsWithRemarks(Array.from(withRemarks));
      } catch {
        setQuestionStatusMap({});
        setQuestionIdsWithRemarks([]);
      }
    },
    [normalizeDateOnly, propertyId, resolvedTaskDate, taskId],
  );

  useEffect(() => {
    loadQuestionStatuses(resolvedTaskDate);
  }, [loadQuestionStatuses, resolvedTaskDate]);

  const onSelectQuestion = useCallback(
    async (questionId) => {
      setSelectedQuestionId(questionId);
      setRemarks([]);
      setHasAnyRemarksForQuestion(!!questionStatusMap[String(questionId)] || !!questionStatusMap[questionId]);
      await loadRemarks(questionId, resolvedTaskDate);
    },
    [loadRemarks, questionStatusMap, resolvedTaskDate],
  );

  const onDateChange = useCallback(
    async (dateStr) => {
      setFmSelectedDate(dateStr);
      setResolvedTaskDate(dateStr);
      setRemarks([]);
      await loadQuestionStatuses(dateStr);
      if (selectedQuestionId) {
        await loadRemarks(selectedQuestionId, dateStr);
      }
    },
    [loadQuestionStatuses, loadRemarks, selectedQuestionId],
  );

  const lastSupRemarkDate = useMemo(() => {
    const lastSup = (remarks || []).find((r) => r.RemarkHtml?.includes("SUP:"));
    return lastSup?.RemarkDate || null;
  }, [remarks]);

  const sendFmRemark = useCallback(
    async (message, status, questionIdOverride) => {
      if (!message?.trim()) {
        swal({ icon: "warning", title: "Message required", text: "Please type a message before sending." });
        return;
      }

      const targetQuestionId = questionIdOverride || selectedQuestionId;
      if (!targetQuestionId || !resolvedTaskDate) return;

      const formattedTaskDate = moment(resolvedTaskDate, "YYYY-MM-DD", true).isValid()
        ? moment(resolvedTaskDate, "YYYY-MM-DD").format("DD-MM-YYYY")
        : resolvedTaskDate;

      const payload = {
        TaskId: taskId,
        QuestionId: targetQuestionId,
        TaskName: taskName,
        FmId: 0,
        FmRemark: message,
        FmDateTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        CurrentStatus: status,
        SUPdateTime: lastSupRemarkDate || formattedTaskDate,
        TaskDate: formattedTaskDate,
      };

      try {
        if (status === "Completed") {
          await markTaskComplete({
            taskId,
            questionId: targetQuestionId,
            taskDate: formattedTaskDate,
            propertyId,
            taskStatus: "Completed",
          });
        }

        const res = await fetch("https://api.urest.in:8096/FMResponse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("FM reply failed");

        await loadRemarks(targetQuestionId, resolvedTaskDate);
        await loadQuestionStatuses(resolvedTaskDate);
        emitTaskNotificationRefresh();
        if (typeof onTaskUpdated === "function") onTaskUpdated();
      } catch (err) {
        console.error("Error sending FM remark or marking task complete:", err);
        swal({ icon: "error", title: "Error", text: "Unable to send remark or mark task complete" });
      }
    },
    [
      lastSupRemarkDate,
      loadQuestionStatuses,
      loadRemarks,
      onTaskUpdated,
      resolvedTaskDate,
      selectedQuestionId,
      taskId,
      taskName,
      propertyId,
    ],
  );

  return {
    selectedQuestionId,
    fmSelectedDate,
    loading,
    remarks,
    hasAnyRemarksForQuestion,
    questionStatusMap,
    questionIdsWithRemarks,
    onSelectQuestion,
    onDateChange,
    sendFmRemark,
  };
}
