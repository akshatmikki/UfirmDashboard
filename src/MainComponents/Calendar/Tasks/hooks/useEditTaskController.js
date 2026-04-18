import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import swal from "sweetalert";
import * as appCommon from "../../../../Common/AppCommon.js";
import { createTaskWithQuestions } from "../../../../Services/notificationService";
import { replaceTaskFrequencyMappings } from "../../../../Services/taskFrequencyMappingService";
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

function getMissingRequiredField(form = {}) {
  if (!String(form.taskName || "").trim()) return "taskName";
  if (!String(form.selectedCategory || "").trim()) return "selectedCategory";
  if (!String(form.selectedSubCategory || "").trim()) return "selectedSubCategory";
  if (!String(form.location || "").trim()) return "location";
  if (!String(form.assignTo || "").trim()) return "assignTo";
  if (!String(form.occurence || "").trim()) return "occurence";
  return "";
}

export default function useEditTaskController({ rowData, categoryData }) {
  const initialStartDate = rowData?.DateFrom ? new Date(rowData.DateFrom) : new Date();
  const initialEndDate = rowData?.DateTo ? new Date(rowData.DateTo) : initialStartDate;

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
    startTime: rowData?.TimeFrom ? moment(rowData.TimeFrom, "HH:mm:ss").toDate() : new Date(),
    endTime: rowData?.TimeTo ? moment(rowData.TimeTo, "HH:mm:ss").toDate() : moment().add(30, "m").toDate(),
    createdOn: moment().format(),
    propertyId: rowData?.PropertyId || 0,
    assetId: rowData?.AssetId || "",
    assetBrand: "",
    assetPhoto: null,
    lastServiceDate: null,
    nextServiceDate: null,
    QRCode: rowData?.QRcode || "",
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
    const raw = rowData?.UpdatedOn || rowData?.DateFrom || "";
    if (!raw) return "";
    const parsed = moment(
      raw,
      ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601],
      true,
    );
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
  }, [rowData?.DateFrom, rowData?.UpdatedOn]);

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
          await replaceTaskFrequencyMappings(rowData.TaskId, schedule?.mappings || []);
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
  }, [form, q, rowData?.TaskId, saving, schedule]);

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
