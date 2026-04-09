import React, { useMemo } from "react";
import { useTaskFmRemarks, useViewTaskController } from "../../taskHooks";
import { TaskShell, TaskSection, useMultiOpenSections } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import TaskFmRemarksSection from "../TaskFmRemarksSection";
import { TaskQuestionsViewSection } from "../TaskQuestionsSections";
import ViewQuestionImg from "../../ViewQuestionImg";

export default function ViewTaskPage(props) {
  const { visible, closeModal, rowData, onTaskUpdated } = props;
  const { isOpen, toggleSection } = useMultiOpenSections(["details", "questions", "asset", "fmRemarks"]);
  const ctrl = useViewTaskController({ rowData });

  const fm = useTaskFmRemarks({
    taskId: rowData?.TaskId,
    taskName: rowData?.Name,
    propertyId: rowData?.PropertyId,
    initialTaskDate: ctrl.initialTaskDate,
    onTaskUpdated,
  });

  const fmQuestions = useMemo(() => {
    return (ctrl.questions || []).map((q) => ({ id: q.QuesId, name: q.QuesName }));
  }, [ctrl.questions]);

  const footer = (
    <button className="btn btn-secondary" type="button" onClick={closeModal}>
      Close
    </button>
  );

  return (
    <div>
      <TaskShell visible={visible} title="View Task" onClose={closeModal} footer={footer}>
        <TaskSection title="Task Details" isOpen={isOpen("details")} onToggle={() => toggleSection("details")}>
          <TaskDetailsForm
            readOnly
            showTaskId
            taskId={rowData?.TaskId}
            taskName={rowData?.Name}
            propertyId={ctrl.propertyId}
            propertyOptions={ctrl.propertyData}
            location={rowData?.Location}
            categoryOptions={ctrl.categoryData}
            subCategoryOptions={ctrl.subCategory}
            selectedCategory={ctrl.selectedCategory}
            selectedSubCategory={ctrl.selectedSubCategory}
            startDate={ctrl.startDate}
            endDate={ctrl.endDate}
            startTime={ctrl.startTime}
            endTime={ctrl.endTime}
            remindme={ctrl.remindme}
            check={ctrl.check}
            assignToText={rowData?.AssignedTo}
            occurrenceText={rowData?.OccurenceView}
          />
        </TaskSection>

        <TaskSection title="Questionnaire (Checklist)" isOpen={isOpen("questions")} onToggle={() => toggleSection("questions")}>
          <TaskQuestionsViewSection
            taskName={rowData?.Name}
            location={rowData?.Location}
            questions={ctrl.questions}
          />
        </TaskSection>

        <TaskSection title="Asset" isOpen={isOpen("asset")} onToggle={() => toggleSection("asset")}>
          <TaskAssetSection
            taskName={rowData?.Name}
            location={rowData?.Location}
            mode="view"
            assetId={rowData?.AssetId || ""}
            assetName={ctrl.assetDetails.assetName}
            assetBrand={ctrl.assetDetails.assetBrand}
            lastServiceDate={ctrl.assetDetails.lastServiceDate}
            nextServiceDate={ctrl.assetDetails.nextServiceDate}
            assetPhoto={ctrl.assetDetails.assetPhoto}
            QRCode={rowData?.QRcode || ctrl.assetDetails.QRCode || ""}
          />
        </TaskSection>

        <TaskSection title="FM Remarks" isOpen={isOpen("fmRemarks")} onToggle={() => toggleSection("fmRemarks")}>
          <TaskFmRemarksSection
            taskName={rowData?.Name}
            location={rowData?.Location}
            questions={fmQuestions}
            selectedQuestionId={fm.selectedQuestionId}
            onSelectQuestion={fm.onSelectQuestion}
            onViewImage={(questionId) => {
              const selected = (ctrl.questions || []).find((item) => Number(item.QuesId) === Number(questionId));
              if (selected) ctrl.openViewImage(selected);
            }}
            fmSelectedDate={fm.fmSelectedDate}
            onDateChange={fm.onDateChange}
            loading={fm.loading}
            remarks={fm.remarks}
            hasAnyRemarksForQuestion={fm.hasAnyRemarksForQuestion}
            chatStatus={rowData?.CurrentStatus || rowData?.TaskStatus || "Actionable"}
            questionStatusMap={fm.questionStatusMap}
            questionIdsWithRemarks={fm.questionIdsWithRemarks}
            onSend={fm.sendFmRemark}
          />
        </TaskSection>
      </TaskShell>

      {ctrl.showViewQuestionImgModal ? (
        <ViewQuestionImg
          showEditQuestionModel={ctrl.showViewQuestionImgModal}
          closeModal={() => ctrl.setShowViewQuestionImgModal(false)}
          rowData={{
            TaskId: rowData?.TaskId,
            QuesId: ctrl.selectedQuestion?.QuesId,
            CreatedOn: rowData?.UpdatedOn || rowData?.CreatedOn,
          }}
        />
      ) : null}
    </div>
  );
}
