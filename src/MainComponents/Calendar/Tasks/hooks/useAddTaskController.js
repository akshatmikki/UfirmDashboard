import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import * as appCommon from "../../../../Common/AppCommon.js";
import { createTaskWithQuestions } from "../../../../Services/notificationService";
import useAddTaskLookups from "./useAddTaskLookups";

const emptyQuestion = { QuestionName: "" };

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

  const isTaskValid = useMemo(() => {
    return (
      form.taskName.trim() !== "" &&
      form.selectedCategory &&
      form.selectedSubCategory &&
      form.assignTo &&
      form.occurence &&
      form.location.trim() !== ""
    );
  }, [form]);

  const save = useCallback(async () => {
    if (isSaving) return { ok: false };
    if (!hasAtLeastOneQuestion) {
      appCommon.showtextalert("Please add at least one question before saving.", "", "warning");
      return { ok: false };
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
      appCommon.showtextalert("Task & Questions Saved Successfully!", "", "success");
      return { ok: true };
    } catch (err) {
      console.error(err);
      appCommon.showtextalert("Error while saving task", err?.message || "Something went wrong", "error");
      setIsSaving(false);
      return { ok: false };
    }
  }, [form, hasAtLeastOneQuestion, isSaving, quesValues, type]);

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

