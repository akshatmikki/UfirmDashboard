import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import swal from "sweetalert";
import * as appCommon from "../../../../Common/AppCommon.js";
import { createTaskWithQuestions } from "../../../../Services/notificationService";
import { replaceTaskFrequencyMappings } from "../../../../Services/taskFrequencyMappingService";
import { saveTaskShiftRepetitions } from "../../../../Services/taskShiftRepetitionMappingService";
import useEditTaskLookups from "./useEditTaskLookups";
import useEditTaskQuestions from "./useEditTaskQuestions";

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isEndDateAfterStartDate(startDate, endDate) {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  const startOnlyDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnlyDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return endOnlyDate.getTime() > startOnlyDate.getTime();
}

function isEndTimeAfterStartTime(startTime, endTime) {
  if (!isValidDate(startTime) || !isValidDate(endTime)) return false;
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  return endMinutes > startMinutes;
}

function parseTaskDate(value, fallback) {
  if (!value) return fallback;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = moment(
    String(value),
    ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
    true,
  );
  if (parsed.isValid()) return parsed.toDate();
  const loose = moment(String(value));
  return loose.isValid() ? loose.toDate() : fallback;
}

function parseTaskTime(value, fallback) {
  if (!value) return fallback;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = moment(
    String(value),
    ["HH:mm:ss", "HH:mm", "h:mm A", "hh:mm A", "h:mmA", "hh:mmA"],
    true,
  );
  if (parsed.isValid()) return parsed.toDate();
  const loose = moment(String(value));
  return loose.isValid() ? loose.toDate() : fallback;
}

function coerceEndDateAfterStartDate(startDate, endDate) {
  if (!isValidDate(startDate)) return endDate;
  const safeEnd = isValidDate(endDate) ? endDate : startDate;
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(safeEnd.getFullYear(), safeEnd.getMonth(), safeEnd.getDate());
  if (endOnly.getTime() > startOnly.getTime()) return safeEnd;
  return new Date(startOnly.getFullYear(), startOnly.getMonth(), startOnly.getDate() + 1);
}

function coerceEndTimeAfterStartTime(startTime, endTime) {
  if (!isValidDate(startTime)) return endTime;
  const safeEnd = isValidDate(endTime) ? endTime : startTime;
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = safeEnd.getHours() * 60 + safeEnd.getMinutes();
  if (endMinutes > startMinutes) return safeEnd;
  return moment(startTime).add(30, "m").toDate();
}

function getMissingRequiredField(form = {}) {
  if (!String(form.taskName || "").trim()) return "taskName";
  if (!String(form.selectedCategory || "").trim()) return "selectedCategory";
  if (!String(form.selectedSubCategory || "").trim()) return "selectedSubCategory";
  if (!String(form.location || "").trim()) return "location";
  if (!String(form.assignTo || "").trim()) return "assignTo";
  if (!String(form.occurence || "").trim()) return "occurence";
  return "";
}

function getFrequencyIdFromOccurrence(frequencyData = [], occurrenceValue = "") {
  const selected = (frequencyData || []).find(
    (item) => String(item?.Occurence || "").trim() === String(occurrenceValue || "").trim(),
  );
  return Number(selected?.Id ?? selected?.FrequencyId ?? 0) || 0;
}

export default function useEditTaskController({ rowData, categoryData }) {
  const initialStartDate = parseTaskDate(rowData?.DateFrom, new Date());
  const initialEndDate = coerceEndDateAfterStartDate(
    initialStartDate,
    parseTaskDate(rowData?.DateTo, initialStartDate),
  );
  const initialStartTime = parseTaskTime(rowData?.TimeFrom, new Date());
  const initialEndTime = coerceEndTimeAfterStartTime(
    initialStartTime,
    parseTaskTime(rowData?.TimeTo, moment(initialStartTime).add(30, "m").toDate()),
  );

  const [form, setForm] = useState(() => ({
    taskName: rowData?.Name || "",
    description: rowData?.Description || "",
    location: rowData?.Location || "",
    selectedCategory: rowData?.TaskCategoryId || "",
    selectedSubCategory: rowData?.TaskSubCategoryId || "",
    assignTo: rowData?.AssignedToId || "",
    remindme: rowData?.RemindMe || "",
    occurence: rowData?.Occurence || "N",
    check: rowData?.AllDay === "Y",
    startDate: initialStartDate,
    endDate: initialEndDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    createdOn: moment().format(),
    propertyId: rowData?.PropertyId || 0,
    assetId: rowData?.AssetId || "",
    assetBrand: "",
    assetPhoto: null,
    lastServiceDate: null,
    nextServiceDate: null,
    QRCode: rowData?.QRCode || "",
  }));

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const lookups = useEditTaskLookups({
    propertyId: form.propertyId,
    selectedCategory: form.selectedCategory,
    assetId: form.assetId,
    updateForm,
  });

  const q = useEditTaskQuestions({ rowData });
  const [schedule, setSchedule] = useState({ dirty: false, mappings: [] });

  const initialTaskDate = useMemo(() => {
    // Prefer the actionable/occurrence date (TaskDate) when present.
    // `UpdatedOn` can be "today" due to status updates, which breaks mark-complete payloads.
    const raw = rowData?.TaskDate || rowData?.UpdatedOn || rowData?.DateFrom || "";
    if (!raw) return "";
    const parsed = moment(
      raw,
      ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
      true,
    );
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
  }, [rowData?.DateFrom, rowData?.TaskDate, rowData?.UpdatedOn]);

  const isEditTaskValid = useMemo(() => {
    return (
      form.taskName?.trim() !== "" &&
      form.selectedCategory &&
      form.selectedSubCategory &&
      form.assignTo &&
      form.occurence &&
      form.location?.trim() !== "" &&
      isEndDateAfterStartDate(form.startDate, form.endDate) &&
      isEndTimeAfterStartTime(form.startTime, form.endTime)
    );
  }, [form]);

  const requestDeleteQuestion = useCallback(
    (question) => {
      swal({
        title: "Delete Question?",
        text: "This question will be removed. You can save to apply changes.",
        icon: "warning",
        buttons: ["Cancel", "Delete"],
        dangerMode: true,
      }).then((ok) => {
        if (!ok) return;
        q.removeQuestionLocal(question.QuesId);
      });
    },
    [q],
  );

  const [saving, setSaving] = useState(false);
  const save = useCallback(async () => {
    if (saving) return { ok: false };
    const missingField = getMissingRequiredField(form);
    if (missingField) {
      return { ok: false, reason: "missing_required", field: missingField, message: "Please fill out this field" };
    }
    if (!q.hasAtLeastOneQuestion) {
      return { ok: false, reason: "missing_question", message: "Please add at least one question before saving." };
    }
    if (!isEndDateAfterStartDate(form.startDate, form.endDate)) {
      return { ok: false, reason: "date_range", message: "End date should be greater than start date." };
    }
    if (!isEndTimeAfterStartTime(form.startTime, form.endTime)) {
      return { ok: false, reason: "time_range", message: "End time should be greater than start time." };
    }
    setSaving(true);
    try {
      const taskPayload = {
        Id: rowData?.TaskId,
        CategoryId: parseInt(form.selectedCategory),
        SubCategoryId: parseInt(form.selectedSubCategory),
        Name: form.taskName,
        Description: form.description,
        DateFrom: form.startDate,
        DateTo: form.endDate,
        TimeFrom: form.startTime,
        TimeTo: form.endTime,
        Remarks: "remarks",
        Occurence: form.occurence,
        CreatedBy: 1,
        CreatedOn: form.createdOn,
        AssignTo: parseInt(form.assignTo),
        RemindMe: form.remindme,
        Location: form.location,
        AssetsID: form.assetId ? parseInt(form.assetId) : 0,
        QRCode: form.QRCode,
        Type: "U",
      };

      const questionsPayload = (q.questions || []).map((item) => ({ QuestionName: item.QuestionName }));

      await createTaskWithQuestions({ Task: taskPayload, Questions: questionsPayload });

      if (schedule?.dirty && rowData?.TaskId) {
        try {
          const frequencyId = getFrequencyIdFromOccurrence(lookups.frequencyData, form.occurence);
          const mappingRes = await replaceTaskFrequencyMappings(rowData.TaskId, frequencyId, schedule?.mappings || []);
          await saveTaskShiftRepetitions(mappingRes?.createdMappings || [], schedule?.mappings || [], schedule?.repetition || {});
        } catch (e) {
          appCommon.showtextalert(
            "Task updated, but schedule not saved",
            e?.message || "TaskFrequencyMapping save failed",
            "warning",
          );
        }
      }
      return { ok: true, message: "Task updated successfully" };
    } catch (err) {
      console.error("Edit task failed:", err);
      appCommon.showtextalert("Error while updating task", err?.message || "Something went wrong", "error");
      return { ok: false, reason: "server", message: err?.message || "Something went wrong" };
    } finally {
      setSaving(false);
    }
  }, [form, lookups.frequencyData, q, rowData?.TaskId, saving, schedule]);

  return {
    form,
    updateForm,
    categoryData,
    lookups,
    questionsCtrl: q,
    initialTaskDate,
    isEditTaskValid,
    saving,
    schedule,
    setSchedule,
    requestDeleteQuestion,
    save,
  };
}
