import React, { useCallback } from "react";
import moment from "moment";
import { useAddTaskController } from "../../taskHooks";
import { TaskShell, TaskSection, useMultiOpenSections } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import { TaskQuestionsCreateSection } from "../TaskQuestionsSections";

export default function CreateTaskPage(props) {
  const { visible, closeModal, categoryData, onTaskAdded, type, PropertyId } = props;
  const { isOpen, toggleSection } = useMultiOpenSections(["details", "questions", "asset"]);
  const ctrl = useAddTaskController({ PropertyId, categoryData, type });
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
    if (!res?.ok) return;
    closeModal?.();
    onTaskAdded?.();
  }, [closeModal, ctrl, onTaskAdded]);

  const footer = (
    <>
      <button
        className="btn btn-primary"
        type="button"
        disabled={!ctrl.isTaskValid || !ctrl.hasAtLeastOneQuestion || ctrl.isSaving}
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
    <TaskShell visible={visible} title="Add Task" onClose={closeModal} footer={footer}>
      <TaskSection title="Task Details" isOpen={isOpen("details")} onToggle={() => toggleSection("details")}>
        <TaskDetailsForm
          showTaskId={false}
          taskName={ctrl.form.taskName}
          onTaskNameChange={(v) => ctrl.updateForm({ taskName: v })}
          propertyId={PropertyId}
          propertyOptions={ctrl.propertyData}
          location={ctrl.form.location}
          onLocationChange={(v) => ctrl.updateForm({ location: v })}
          categoryOptions={categoryData}
          selectedCategory={ctrl.form.selectedCategory}
          onCategoryChange={(v) => ctrl.updateForm({ selectedCategory: v })}
          subCategoryOptions={ctrl.subCategory}
          selectedSubCategory={ctrl.form.selectedSubCategory}
          onSubCategoryChange={(v) => ctrl.updateForm({ selectedSubCategory: v })}
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
          onAssignToChange={(v) => ctrl.updateForm({ assignTo: v })}
          occurrenceOptions={ctrl.occurrenceOptions}
          occurence={ctrl.form.occurence}
          onOccurenceChange={(v) => ctrl.updateForm({ occurence: v })}
        />
      </TaskSection>

      <TaskSection title="Questionnaire (Checklist)" isOpen={isOpen("questions")} onToggle={() => toggleSection("questions")}>
        <TaskQuestionsCreateSection
          taskName={ctrl.form.taskName}
          location={ctrl.form.location}
          quesValues={ctrl.quesValues}
          onAddQuestion={ctrl.addQuestion}
          onRemoveQuestion={ctrl.removeQuestion}
          onQuestionNameChange={ctrl.onQuestionNameChange}
        />
      </TaskSection>

      <TaskSection title="Asset" isOpen={isOpen("asset")} onToggle={() => toggleSection("asset")}>
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
      </TaskSection>
    </TaskShell>
  );
}
