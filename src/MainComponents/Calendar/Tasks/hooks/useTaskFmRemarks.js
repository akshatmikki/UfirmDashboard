import { useCallback, useEffect, useMemo, useState } from "react";
import swal from "sweetalert";
import { fetchNotifications, getTaskRemarks } from "../../../../Services/notificationService";

export default function useTaskFmRemarks({ taskId, taskName, propertyId, initialTaskDate }) {
  const getTodayIsoDate = useCallback(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [fmSelectedDate, setFmSelectedDate] = useState(() => getTodayIsoDate());
  const [resolvedTaskDate, setResolvedTaskDate] = useState(() => getTodayIsoDate());
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasAnyRemarksForQuestion, setHasAnyRemarksForQuestion] = useState(false);

  useEffect(() => {
    const today = getTodayIsoDate();
    setFmSelectedDate(today);
    setResolvedTaskDate(today);
  }, [getTodayIsoDate, initialTaskDate]);

  const loadRemarks = useCallback(
    async (questionId, taskDate) => {
      if (!taskId || !questionId || !taskDate) return;
      setLoading(true);
      try {
        const data = await getTaskRemarks(taskId, questionId, taskDate);
        setRemarks(data || []);
      } catch {
        setRemarks([]);
      } finally {
        setLoading(false);
      }
    },
    [taskId],
  );

  const resolveTaskDate = useCallback(
    async (questionId) => {
      if (!taskId || !propertyId || !questionId) return;
      try {
        const list = await fetchNotifications("task", propertyId);
        const hasAny = (list || []).some((n) => n.TaskId === taskId && n.QuestionId === questionId);
        setHasAnyRemarksForQuestion(!!hasAny);
      } catch {
        setHasAnyRemarksForQuestion(false);
      }
      await loadRemarks(questionId, resolvedTaskDate);
    },
    [loadRemarks, propertyId, resolvedTaskDate, taskId],
  );

  const onSelectQuestion = useCallback(
    async (questionId) => {
      setSelectedQuestionId(questionId);
      setRemarks([]);
      await resolveTaskDate(questionId);
    },
    [resolveTaskDate],
  );

  const onDateChange = useCallback(
    async (dateStr) => {
      setFmSelectedDate(dateStr);
      setResolvedTaskDate(dateStr);
      setRemarks([]);
      if (selectedQuestionId) {
        await loadRemarks(selectedQuestionId, dateStr);
      }
    },
    [loadRemarks, selectedQuestionId],
  );

  const lastSupRemarkDate = useMemo(() => {
    const lastSup = (remarks || []).find((r) => r.RemarkHtml?.includes("SUP:"));
    return lastSup?.RemarkDate || null;
  }, [remarks]);

  const sendFmRemark = useCallback(
    async (message, status) => {
      if (!message?.trim()) {
        swal({ icon: "warning", title: "Message required", text: "Please type a message before sending." });
        return;
      }
      if (!selectedQuestionId || !resolvedTaskDate) return;

      const payload = {
        TaskId: taskId,
        QuestionId: selectedQuestionId,
        TaskName: taskName,
        FmId: 0,
        FmRemark: message,
        FmDateTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        CurrentStatus: status,
        SUPdateTime: lastSupRemarkDate || resolvedTaskDate,
        TaskDate: resolvedTaskDate,
      };

      try {
        const res = await fetch("https://api.urest.in:8096/FMResponse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("FM reply failed");

        await loadRemarks(selectedQuestionId, resolvedTaskDate);
      } catch {
        swal({ icon: "error", title: "Error", text: "Unable to send remark" });
      }
    },
    [lastSupRemarkDate, loadRemarks, resolvedTaskDate, selectedQuestionId, taskId, taskName],
  );

  return {
    selectedQuestionId,
    fmSelectedDate,
    loading,
    remarks,
    hasAnyRemarksForQuestion,
    onSelectQuestion,
    onDateChange,
    sendFmRemark,
  };
}

