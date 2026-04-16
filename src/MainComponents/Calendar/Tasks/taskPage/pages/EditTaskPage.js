import React, { useCallback, useMemo, useState } from "react";
import moment from "moment";
import { useEditTaskController, useTaskFmRemarks } from "../../taskHooks";
import { TaskShell, TaskSection, TaskInlineSection, useSingleOpenSection } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import TaskFmRemarksSection from "../TaskFmRemarksSection";
import { TaskQuestionsEditSection } from "../TaskQuestionsSections";
import ViewQuestionImg from "../../ViewQuestionImg";
import EditQuestion from "../../EditQuestion";

export default function EditTaskPage(props) {
  const { visible, closeModal, rowData, categoryData, onTaskUpdated } = props;
  const { openSection, toggleSection } = useSingleOpenSection("details");
  const ctrl = useEditTaskController({ rowData, categoryData });
  
  const fmCtrl = useTaskFmRemarks({
    taskId: rowData?.TaskId,
    taskName: rowData?.Name || ctrl.form.taskName,
    propertyId: ctrl.form.propertyId,
    initialTaskDate: ctrl.initialTaskDate,
    onTaskUpdated,
  });

  const isActionable = String(rowData?.TaskStatus || "").toLowerCase() === "actionable";
  const [invalidField, setInvalidField] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);
  const q = ctrl.questionsCtrl;
  const onStartDateChange = useCallback(
    (d) => {
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return;
      const minEndDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const startOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const currentEnd = ctrl.form.endDate;
      const currentEndOnly = currentEnd instanceof Date
        ? new Date(currentEnd.getFullYear(), currentEnd.getMonth(), currentEnd.getDate())
        : null;

      if (!currentEndOnly || currentEndOnly.getTime() <= startOnly.getTime()) {
        ctrl.updateForm({ startDate: d, endDate: minEndDate });
        return;
      }
      ctrl.updateForm({ startDate: d });
    },
    [ctrl],
  );

  const fallbackOccurrenceOptions = useMemo(
    () => [
      { value: "N", label: "Do not repeat" },
      { value: "D", label: "Daily" },
      { value: "W", label: "Weekly" },
      { value: "M", label: "Monthly" },
      { value: "Y", label: "Yearly" },
    ],
    [],
  );

  const onSave = useCallback(async () => {
    const res = await ctrl.save();
    if (!res?.ok) {
      if (res?.reason === "missing_required") {
        setInvalidField(res.field || "");
        setInlineError(res.message || "Please fill out this field");
      } else {
        setInlineError(res?.message || "Please check required fields");
      }
      return;
    }
    setInvalidField("");
    setInlineError("");
    setSuccessInfo({
      title: "Task updated successfully",
      subtitle: "The task changes are saved.",
    });
  }, [ctrl]);

  const footer = (
    <>
      <button
        className="btn btn-primary"
        type="button"
        disabled={ctrl.saving}
        onClick={onSave}
      >
        {ctrl.saving ? "Saving..." : "Save"}
      </button>
      <button className="btn btn-secondary" type="button" onClick={closeModal}>
        Cancel
      </button>
    </>
  );

  const questions = q.questions || [];

  return (
    <div>
      <TaskShell visible={visible} title="Edit Task" onClose={closeModal} footer={footer}>
        <TaskSection title="Task Details" isOpen={openSection === "details"} onToggle={() => toggleSection("details")}>
          <TaskDetailsForm
            showTaskId
            taskId={rowData?.TaskId}
            taskName={ctrl.form.taskName}
            onTaskNameChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ taskName: v }); }}
            description={ctrl.form.description}
            onDescriptionChange={(v) => ctrl.updateForm({ description: v })}
            propertyId={ctrl.form.propertyId}
            propertyOptions={ctrl.lookups.propertyData}
            location={ctrl.form.location}
            onLocationChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ location: v }); }}
            categoryOptions={categoryData}
            selectedCategory={ctrl.form.selectedCategory}
            onCategoryChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ selectedCategory: v }); }}
            subCategoryOptions={ctrl.lookups.subCategory}
            selectedSubCategory={ctrl.form.selectedSubCategory}
            onSubCategoryChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ selectedSubCategory: v }); }}
            startDate={ctrl.form.startDate}
            onStartDateChange={onStartDateChange}
            endDate={ctrl.form.endDate}
            onEndDateChange={(d) => ctrl.updateForm({ endDate: d })}
            check={ctrl.form.check}
            onAllDayChange={(v) => ctrl.updateForm({ check: v })}
            startTime={ctrl.form.startTime}
            onStartTimeChange={(d) =>
              ctrl.updateForm({
                startTime: d,
                endTime: moment(d).add(30, "m").toDate(),
              })
            }
            endTime={ctrl.form.endTime}
            onEndTimeChange={(d) => ctrl.updateForm({ endTime: d })}
            remindme={ctrl.form.remindme}
            onRemindMeChange={(v) => ctrl.updateForm({ remindme: v })}
            assignOptions={ctrl.lookups.assign}
            assignTo={ctrl.form.assignTo}
            onAssignToChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ assignTo: v }); }}
            occurrenceOptions={
              (ctrl.lookups.occurrenceOptions || []).length
                ? ctrl.lookups.occurrenceOptions
                : fallbackOccurrenceOptions
            }
            occurence={ctrl.form.occurence}
            onOccurenceChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ occurence: v }); }}
            invalidField={invalidField}
          />
        </TaskSection>

        <TaskInlineSection
          title="Checklist (Optional)"
          actionLabel="Add procedure"
          onAction={q.openAddQuestion}
        >
          <TaskQuestionsEditSection
            questions={questions}
            onEditQuestion={q.openEditQuestion}
            onDeleteQuestion={ctrl.requestDeleteQuestion}
          />
        </TaskInlineSection>

        <TaskInlineSection
          title="Assets (Optional)"
          actionLabel="Add asset"
          onAction={() => ctrl.lookups.onAssetChange?.(ctrl.form.assetId || "")}
        >
          <TaskAssetSection
            taskName={ctrl.form.taskName}
            location={ctrl.form.location}
            mode="edit"
            assets={ctrl.lookups.assets}
            assetId={ctrl.form.assetId}
            onAssetChange={ctrl.lookups.onAssetChange}
            assetBrand={ctrl.form.assetBrand}
            lastServiceDate={ctrl.form.lastServiceDate}
            nextServiceDate={ctrl.form.nextServiceDate}
            assetPhoto={ctrl.form.assetPhoto}
            QRCode={ctrl.form.QRCode}
          />
        </TaskInlineSection>

        {isActionable && (
          <TaskSection title="Fm Remarks" isOpen={openSection === "fmRemarks"} onToggle={() => toggleSection("fmRemarks")}>
            <TaskFmRemarksSection
              taskName={rowData?.Name || ctrl.form.taskName}
              location={rowData?.Location || ctrl.form.location}
              questions={questions}
              selectedQuestionId={fmCtrl.selectedQuestionId}
              onSelectQuestion={fmCtrl.onSelectQuestion}
              onViewImage={(qid) => q.openViewImage?.(qid)}
              fmSelectedDate={fmCtrl.fmSelectedDate}
              onDateChange={fmCtrl.onDateChange}
              loading={fmCtrl.loading}
              remarks={fmCtrl.remarks}
              chatStatus={rowData?.TaskStatus}
              questionStatusMap={fmCtrl.questionStatusMap}
              questionIdsWithRemarks={fmCtrl.questionIdsWithRemarks}
              onSend={fmCtrl.sendFmRemark}
            />
          </TaskSection>
        )}

        {inlineError ? (
          <div className="task-inline-error-pop">
            <i className="fa fa-exclamation-triangle mr-2" />
            {inlineError}
          </div>
        ) : null}

        {successInfo ? (
          <div className="task-feedback-overlay" role="dialog" aria-modal="true">
            <div className="task-feedback-modal">
              <div className="task-feedback-head task-feedback-head--success">
                <div className="task-feedback-title-wrap">
                  <span className="task-feedback-icon">
                    <i className="fa fa-check-circle-o" />
                  </span>
                  <h4>{successInfo.title}</h4>
                </div>
                <button type="button" className="task-feedback-close" onClick={() => setSuccessInfo(null)}>
                  <i className="fa fa-times" />
                </button>
              </div>
              <div className="task-feedback-body">
                <p>{successInfo.subtitle}</p>
              </div>
              <div className="task-feedback-foot">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSuccessInfo(null);
                    closeModal?.();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </TaskShell>

      {q.showViewQuestionImgModal ? (
        <ViewQuestionImg
          showEditQuestionModel={q.showViewQuestionImgModal}
          closeModal={() => q.setShowViewQuestionImgModal(false)}
          rowData={{
            TaskId: rowData?.TaskId,
            QuesId: q.selectedQuestion?.QuesId,
            CreatedOn: rowData?.UpdatedOn || rowData?.CreatedOn,
          }}
        />
      ) : null}

      {q.showEditQuestionModal ? (
        <EditQuestion
          showEditQuestionModel={q.showEditQuestionModal}
          closeModal={() => q.setShowEditQuestionModal(false)}
          rowData={{ TaskId: rowData?.TaskId, ...(q.selectedQuestion || {}) }}
          onQuestionSave={q.onQuestionSave}
        />
      ) : null}
    </div>
  );
}
