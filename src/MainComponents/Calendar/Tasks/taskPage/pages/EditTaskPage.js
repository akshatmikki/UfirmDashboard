import React, { useCallback, useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { useEditTaskController, useTaskFmRemarks } from "../../taskHooks";
import { TaskShell, TaskSection, useMultiOpenSections } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import TaskFmRemarksSection from "../TaskFmRemarksSection";
import { TaskQuestionsEditSection } from "../TaskQuestionsSections";
import ViewQuestionImg from "../../ViewQuestionImg";
import EditQuestion from "../../EditQuestion";

export default function EditTaskPage(props) {
  const { visible, closeModal, rowData, categoryData, openAddQuestion } = props;
  const { isOpen, toggleSection } = useMultiOpenSections(["details", "questions", "asset", "fmRemarks"]);
  const ctrl = useEditTaskController({ rowData, categoryData });
  const q = ctrl.questionsCtrl;
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      autoOpenedRef.current = false;
      return;
    }
    if (!openAddQuestion) return;
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    q.openAddQuestion();
  }, [openAddQuestion, q, visible]);

  const fm = useTaskFmRemarks({
    taskId: rowData?.TaskId,
    taskName: rowData?.Name,
    propertyId: rowData?.PropertyId,
    initialTaskDate: ctrl.initialTaskDate,
  });

  const fmQuestions = useMemo(() => {
    return (q.questions || []).map((x) => ({ id: x.QuesId, name: x.QuestionName }));
  }, [q.questions]);

  const onSave = useCallback(async () => {
    const res = await ctrl.save();
    if (!res?.ok) return;
    closeModal?.();
  }, [closeModal, ctrl]);

  const footer = (
    <>
      <button
        className="btn btn-primary"
        type="button"
        disabled={!ctrl.isEditTaskValid || !q.hasAtLeastOneQuestion || ctrl.saving}
        onClick={onSave}
      >
        {ctrl.saving ? "Saving..." : "Save"}
      </button>
      <button className="btn btn-secondary" type="button" onClick={closeModal}>
        Cancel
      </button>
    </>
  );

  return (
    <div>
      <TaskShell visible={visible} title="Edit Task" onClose={closeModal} footer={footer}>
        <TaskSection title="Task Details" isOpen={isOpen("details")} onToggle={() => toggleSection("details")}>
          <TaskDetailsForm
            showTaskId
            taskId={rowData?.TaskId}
            taskName={ctrl.form.taskName}
            onTaskNameChange={(v) => ctrl.updateForm({ taskName: v })}
            propertyId={ctrl.form.propertyId}
            propertyOptions={ctrl.lookups.propertyData}
            location={ctrl.form.location}
            onLocationChange={(v) => ctrl.updateForm({ location: v })}
            categoryOptions={categoryData}
            selectedCategory={ctrl.form.selectedCategory}
            onCategoryChange={(v) => ctrl.updateForm({ selectedCategory: v })}
            subCategoryOptions={ctrl.lookups.subCategory}
            selectedSubCategory={ctrl.form.selectedSubCategory}
            onSubCategoryChange={(v) => ctrl.updateForm({ selectedSubCategory: v })}
            startDate={ctrl.form.startDate}
            onStartDateChange={(d) => ctrl.updateForm({ startDate: d })}
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
            onAssignToChange={(v) => ctrl.updateForm({ assignTo: v })}
            occurrenceOptions={[
              { value: "N", label: "Do not repeat" },
              { value: "D", label: "Daily" },
              { value: "W", label: "Weekly" },
              { value: "M", label: "Monthly" },
              { value: "Y", label: "Yearly" },
            ]}
            occurence={ctrl.form.occurence}
            onOccurenceChange={(v) => ctrl.updateForm({ occurence: v })}
          />
        </TaskSection>

        <TaskSection title="Questionnaire (Checklist)" isOpen={isOpen("questions")} onToggle={() => toggleSection("questions")}>
          <TaskQuestionsEditSection
            taskName={ctrl.form.taskName}
            location={ctrl.form.location}
            loading={q.loadingQuestions}
            questions={q.questions}
            onAddQuestion={q.openAddQuestion}
            onEditQuestion={q.openEditQuestion}
            onDeleteQuestion={ctrl.requestDeleteQuestion}
          />
        </TaskSection>

        <TaskSection title="Asset" isOpen={isOpen("asset")} onToggle={() => toggleSection("asset")}>
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
        </TaskSection>

        <TaskSection title="FM Remarks" isOpen={isOpen("fmRemarks")} onToggle={() => toggleSection("fmRemarks")}>
          <TaskFmRemarksSection
            taskName={ctrl.form.taskName}
            location={ctrl.form.location}
            questions={fmQuestions}
            selectedQuestionId={fm.selectedQuestionId}
            onSelectQuestion={fm.onSelectQuestion}
            onViewImage={(questionId) => {
              const selected = (q.questions || []).find((item) => Number(item.QuesId) === Number(questionId));
              if (selected) q.openViewImage(selected);
            }}
            fmSelectedDate={fm.fmSelectedDate}
            onDateChange={fm.onDateChange}
            loading={fm.loading}
            remarks={fm.remarks}
            hasAnyRemarksForQuestion={fm.hasAnyRemarksForQuestion}
            chatStatus={rowData?.CurrentStatus || rowData?.TaskStatus || "Actionable"}
            onSend={fm.sendFmRemark}
          />
        </TaskSection>
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
