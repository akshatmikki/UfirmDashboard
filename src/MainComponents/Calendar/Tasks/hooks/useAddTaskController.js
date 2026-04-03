import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import * as appCommon from "../../../../Common/AppCommon.js";
import { createTaskWithQuestions } from "../../../../Services/notificationService";
import useAddTaskLookups from "./useAddTaskLookups";

const emptyQuestion = { QuestionName: "" };

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

function getMissingRequiredField(form = {}) {
  if (!String(form.taskName || "").trim()) return "taskName";
  if (!String(form.selectedCategory || "").trim()) return "selectedCategory";
  if (!String(form.selectedSubCategory || "").trim()) return "selectedSubCategory";
  if (!String(form.location || "").trim()) return "location";
  if (!String(form.assignTo || "").trim()) return "assignTo";
  if (!String(form.occurence || "").trim()) return "occurence";
  return "";
}

export default function useAddTaskController({ PropertyId, categoryData, type }) {
  const [form, setForm] = useState(() => ({
    taskName: "",
    location: "",
    selectedCategory: "",
    selectedSubCategory: "",
    assignTo: "",
    occurence: "",
    remindme: "",
    check: false,
    startDate: new Date(),
    endDate: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    createdOn: moment().format(),
    assetId: "",
    assetBrand: "",
    assetPhoto: null,
    lastServiceDate: null,
    nextServiceDate: null,
    QRCode: "",
  }));

  const updateForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const lookups = useAddTaskLookups({
    PropertyId,
    selectedCategory: form.selectedCategory,
    updateForm,
  });

  const [quesValues, setQuesValues] = useState([emptyQuestion]);
  const [isSaving, setIsSaving] = useState(false);

  const onQuestionNameChange = useCallback((index, value) => {
    setQuesValues((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], QuestionName: value };
      return next;
    });
  }, []);

  const addQuestion = useCallback(() => {
    setQuesValues((prev) => [...prev, emptyQuestion]);
  }, []);

  const removeQuestion = useCallback((index) => {
    setQuesValues((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const hasAtLeastOneQuestion = useMemo(() => {
    return (quesValues || []).some((q) => q.QuestionName?.trim());
  }, [quesValues]);

  const isDateRangeValid = useMemo(() => {
    return isEndDateAfterStartDate(form.startDate, form.endDate);
  }, [form.endDate, form.startDate]);

  const isTimeRangeValid = useMemo(() => {
    return isEndTimeAfterStartTime(form.startTime, form.endTime);
  }, [form.endTime, form.startTime]);

  const isTaskValid = useMemo(() => {
    return (
      form.taskName.trim() !== "" &&
      form.selectedCategory &&
      form.selectedSubCategory &&
      form.assignTo &&
      form.occurence &&
      form.location.trim() !== "" &&
      isDateRangeValid &&
      isTimeRangeValid
    );
  }, [form, isDateRangeValid, isTimeRangeValid]);

  const save = useCallback(async () => {
    if (isSaving) return { ok: false };
    const missingField = getMissingRequiredField(form);
    if (missingField) {
      return { ok: false, reason: "missing_required", field: missingField, message: "Please fill out this field" };
    }
    if (!hasAtLeastOneQuestion) {
      return { ok: false, reason: "missing_question", message: "Please add at least one question before saving." };
    }
    if (!isDateRangeValid) {
      return { ok: false, reason: "date_range", message: "End date should be greater than start date." };
    }
    if (!isTimeRangeValid) {
      return { ok: false, reason: "time_range", message: "End time should be greater than start time." };
    }

    setIsSaving(true);
    try {
      const taskPayload = {
        Id: 0,
        CategoryId: parseInt(form.selectedCategory),
        SubCategoryId: parseInt(form.selectedSubCategory),
        Name: form.taskName,
        Description: "Desc",
        DateFrom: form.startDate,
        DateTo: form.endDate,
        TimeFrom: form.startTime,
        TimeTo: form.endTime,
        Remarks: "",
        Occurence: form.occurence,
        CreatedBy: 1,
        CreatedOn: form.createdOn,
        AssignTo: parseInt(form.assignTo),
        RemindMe: form.remindme,
        Location: form.location,
        AssetsID: form.assetId ? parseInt(form.assetId) : 0,
        QRCode: form.QRCode,
        Type: type,
      };

      const questionsPayload = (quesValues || [])
        .filter((q) => q.QuestionName?.trim())
        .map((q) => ({ QuestionName: q.QuestionName.trim() }));

      await createTaskWithQuestions({ Task: taskPayload, Questions: questionsPayload });
      return { ok: true, message: "Task created successfully" };
    } catch (err) {
      console.error(err);
      appCommon.showtextalert("Error while saving task", err?.message || "Something went wrong", "error");
      return { ok: false, reason: "server", message: err?.message || "Something went wrong" };
    } finally {
      setIsSaving(false);
    }
  }, [form, hasAtLeastOneQuestion, isDateRangeValid, isSaving, isTimeRangeValid, quesValues, type]);

  return {
    form,
    updateForm,
    categoryData,
    subCategory: lookups.subCategory,
    assign: lookups.assign,
    propertyData: lookups.propertyData,
    assets: lookups.assets,
    occurrenceOptions: lookups.occurrenceOptions,
    quesValues,
    isSaving,
    isTaskValid,
    hasAtLeastOneQuestion,
    onAssetChange: lookups.onAssetChange,
    onQuestionNameChange,
    addQuestion,
    removeQuestion,
    save,
  };
}
