import { useCallback, useMemo, useState } from "react";
import moment from "moment";
import swal from "sweetalert";
import * as appCommon from "../../../../Common/AppCommon.js";
import { createTaskWithQuestions } from "../../../../Services/notificationService";
import useEditTaskLookups from "./useEditTaskLookups";
import useEditTaskQuestions from "./useEditTaskQuestions";

export default function useEditTaskController({ rowData, categoryData }) {
  const initialStartDate = rowData?.DateFrom ? new Date(rowData.DateFrom) : new Date();
  const initialEndDate = rowData?.DateTo ? new Date(rowData.DateTo) : initialStartDate;

  const [form, setForm] = useState(() => ({
    taskName: rowData?.Name || "",
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

  const initialTaskDate = useMemo(() => {
    return rowData?.DateFrom ? moment(rowData.DateFrom).format("YYYY-MM-DD") : "";
  }, [rowData?.DateFrom]);

  const isEditTaskValid = useMemo(() => {
    return (
      form.taskName?.trim() !== "" &&
      form.selectedCategory &&
      form.selectedSubCategory &&
      form.assignTo &&
      form.occurence &&
      form.location?.trim() !== ""
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
    if (!q.hasAtLeastOneQuestion) {
      appCommon.showtextalert("Please add at least one question before saving.", "", "warning");
      return { ok: false };
    }
    setSaving(true);
    try {
      const taskPayload = {
        Id: rowData?.TaskId,
        CategoryId: parseInt(form.selectedCategory),
        SubCategoryId: parseInt(form.selectedSubCategory),
        Name: form.taskName,
        Description: "Desc",
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
      appCommon.showtextalert("Task updated successfully!", "", "success");
      return { ok: true };
    } catch (err) {
      console.error("Edit task failed:", err);
      appCommon.showtextalert("Error while updating task", err?.message || "Something went wrong", "error");
      setSaving(false);
      return { ok: false };
    }
  }, [form, q, rowData?.TaskId, saving]);

  return {
    form,
    updateForm,
    categoryData,
    lookups,
    questionsCtrl: q,
    initialTaskDate,
    isEditTaskValid,
    saving,
    requestDeleteQuestion,
    save,
  };
}

