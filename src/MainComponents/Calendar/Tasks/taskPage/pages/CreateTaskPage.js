import React, { useCallback, useState } from "react";
import moment from "moment";
import { useAddTaskController } from "../../taskHooks";
import { TaskShell, TaskSection, TaskInlineSection, useSingleOpenSection } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import { TaskQuestionsCreateSection } from "../TaskQuestionsSections";
import TaskScheduleSection from "../TaskScheduleSection";
import { downloadQRCode } from "../../../../../Common/QRUtils";

export default function CreateTaskPage(props) {
  const { visible, closeModal, categoryData, onTaskAdded, type, PropertyId } = props;
  const { openSection, toggleSection } = useSingleOpenSection("details");
  const ctrl = useAddTaskController({ PropertyId, categoryData, type });
  const [invalidField, setInvalidField] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);
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
      title: "Task created successfully",
      subtitle: "The task is ready. You can now monitor its progress.",
    });
  }, [ctrl]);

  const footer = (
    <>
      <button
        className="btn btn-primary"
        type="button"
        disabled={ctrl.isSaving}
        onClick={onSave}
      >
        {ctrl.isSaving ? "Saving..." : "Save"}
      </button>
      <button className="btn btn-secondary" type="button" onClick={closeModal}>
        Cancel
      </button>
    </>
  );

  return (
    <TaskShell
      visible={visible}
      title="Add Task"
      onClose={closeModal}
      footer={footer}
      rightActions={
        !!ctrl.form.QRCode && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() =>
              downloadQRCode({
                qrValue: ctrl.form.QRCode,
                name: ctrl.form.taskName || "New Task",
                templatePath: "/Assets/task-template.png",
                fileName: `${ctrl.form.taskName || "Task"}_QR`,
              })
            }
            style={{ fontWeight: "600" }}
          >
            Generate QR
          </button>
        )
      }
    >
      <TaskSection title="Task Details" isOpen={openSection === "details"} onToggle={() => toggleSection("details")}>
        <TaskDetailsForm
          showTaskId={false}
          taskName={ctrl.form.taskName}
          onTaskNameChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ taskName: v }); }}
          description={ctrl.form.description}
          onDescriptionChange={(v) => ctrl.updateForm({ description: v })}
          propertyId={PropertyId}
          propertyOptions={ctrl.propertyData}
          location={ctrl.form.location}
          onLocationChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ location: v }); }}
          categoryOptions={categoryData}
          selectedCategory={ctrl.form.selectedCategory}
          onCategoryChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ selectedCategory: v }); }}
          subCategoryOptions={ctrl.subCategory}
          selectedSubCategory={ctrl.form.selectedSubCategory}
          onSubCategoryChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ selectedSubCategory: v }); }}
          startDate={ctrl.form.startDate}
          onStartDateChange={onStartDateChange}
          endDate={ctrl.form.endDate}
          onEndDateChange={(d) => ctrl.updateForm({ endDate: d })}
          check={ctrl.form.check}
          allDayDisabled
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
          assignOptions={ctrl.assign}
          assignTo={ctrl.form.assignTo}
          onAssignToChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ assignTo: v }); }}
          occurrenceOptions={ctrl.occurrenceOptions}
          occurence={ctrl.form.occurence}
          onOccurenceChange={(v) => { setInvalidField(""); setInlineError(""); ctrl.updateForm({ occurence: v }); }}
          invalidField={invalidField}
        />
      </TaskSection>



      <TaskInlineSection
        title="Checklist "
        actionLabel="Add procedure"
        onAction={ctrl.addQuestion}
      >
        <TaskQuestionsCreateSection
          quesValues={ctrl.quesValues}
          onRemoveQuestion={ctrl.removeQuestion}
          onQuestionNameChange={ctrl.onQuestionNameChange}
        />
      </TaskInlineSection>

      <TaskInlineSection
        title="Assets (Optional)"
        actionLabel="Add asset"
        onAction={() => ctrl.onAssetChange?.(ctrl.form.assetId || "")}
      >
        <TaskAssetSection
          taskName={ctrl.form.taskName}
          location={ctrl.form.location}
          mode="create"
          assets={ctrl.assets.map((a) => ({ assetId: a.assetId, assetName: a.assetName }))}
          assetId={ctrl.form.assetId}
          onAssetChange={ctrl.onAssetChange}
          assetBrand={ctrl.form.assetBrand}
          lastServiceDate={ctrl.form.lastServiceDate}
          nextServiceDate={ctrl.form.nextServiceDate}
          assetPhoto={ctrl.form.assetPhoto}
          QRCode={ctrl.form.QRCode}
        />
      </TaskInlineSection>
      <TaskInlineSection title="Schedule (Optional)">
        <TaskScheduleSection
          embedded
          shifts={ctrl.shifts}
          baseDate={ctrl.form.startDate}
          dueDate={ctrl.form.endDate}
          onAssignTimes={({ startTime, endTime }) => {
            ctrl.updateForm({ startTime, endTime });
          }}
          onScheduleUpdate={(s) => ctrl.setSchedule?.(s)}
        />
      </TaskInlineSection>

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
                  onTaskAdded?.();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </TaskShell>
  );
}
