import React from "react";
import { useViewTaskController, useTaskFmRemarks } from "../../taskHooks";
import { TaskShell, TaskSection, TaskInlineSection, useSingleOpenSection } from "../TaskPageLayout";
import TaskDetailsForm from "../TaskDetailsForm";
import TaskAssetSection from "../TaskAssetSection";
import TaskFmRemarksSection from "../TaskFmRemarksSection";
import { TaskQuestionsViewSection } from "../TaskQuestionsSections";

export default function ViewTaskPage(props) {
  const { visible, closeModal, rowData, onTaskUpdated } = props;
  const { openSection, toggleSection } = useSingleOpenSection("details");
  const ctrl = useViewTaskController({ rowData });

  const fmCtrl = useTaskFmRemarks({
    taskId: rowData?.TaskId,
    taskName: rowData?.Name,
    propertyId: ctrl.propertyId,
    initialTaskDate: ctrl.initialTaskDate,
    onTaskUpdated,
  });

  const isActionable = String(rowData?.TaskStatus || "").toLowerCase() === "actionable";

  const footer = (
    <button className="btn btn-secondary" type="button" onClick={closeModal}>
      Close
    </button>
  );

  return (
    <div>
      <TaskShell visible={visible} title="View Task" onClose={closeModal} footer={footer}>
        <TaskSection title="Task Details" isOpen={openSection === "details"} onToggle={() => toggleSection("details")}>
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

        <TaskInlineSection title="Checklist (Optional)">
          <TaskQuestionsViewSection questions={ctrl.questions} />
        </TaskInlineSection>

        <TaskInlineSection title="Assets (Optional)">
          <TaskAssetSection
            mode="view"
            assetId={rowData?.AssetId || ""}
            assetName={ctrl.assetDetails.assetName}
            assetBrand={ctrl.assetDetails.assetBrand}
            lastServiceDate={ctrl.assetDetails.lastServiceDate}
            nextServiceDate={ctrl.assetDetails.nextServiceDate}
            assetPhoto={ctrl.assetDetails.assetPhoto}
            QRCode={rowData?.QRcode || ctrl.assetDetails.QRCode || ""}
          />
        </TaskInlineSection>

        {isActionable && (
          <TaskSection title="Fm Remarks" isOpen={openSection === "fmRemarks"} onToggle={() => toggleSection("fmRemarks")}>
            <TaskFmRemarksSection
              taskName={rowData?.Name}
              location={rowData?.Location}
              questions={ctrl.questions || []}
              selectedQuestionId={fmCtrl.selectedQuestionId}
              onSelectQuestion={fmCtrl.onSelectQuestion}
              onViewImage={(qid) => ctrl.openViewImage?.(qid)}
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
      </TaskShell>
    </div>
  );
}
