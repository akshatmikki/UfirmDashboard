import React, { useMemo } from "react";
import { useViewTaskController, useTaskFmRemarks } from "../../taskHooks";
import { TaskShell, TaskSection, TaskInlineSection, useSingleOpenSection } from "../TaskPageLayout";
import TaskAssetSection from "../TaskAssetSection";
import TaskFmRemarksSection from "../TaskFmRemarksSection";
import { TaskQuestionsViewSection } from "../TaskQuestionsSections";

export default function ViewTaskPage(props) {
  const { visible, closeModal, rowData, onTaskUpdated, viewOnlySection, initialOpenSection } = props;
  const { openSection, toggleSection } = useSingleOpenSection(initialOpenSection ?? null);
  const ctrl = useViewTaskController({ rowData });
  const questions = ctrl.questions || [];
  const fmCtrl = useTaskFmRemarks({
    taskId: rowData?.TaskId,
    taskName: rowData?.Name,
    propertyId: ctrl.propertyId,
    initialTaskDate: ctrl.initialTaskDate,
    onTaskUpdated,
  });

  const normalizedTaskStatus = String(rowData?.TaskStatus || "").trim().toLowerCase();
  const isActionable =
    normalizedTaskStatus === "actionable" ||
    normalizedTaskStatus === "in-progress" ||
    normalizedTaskStatus === "in progress";
  const fmOnly = String(viewOnlySection || "").toLowerCase() === "fmremarks";

  const fmQuestions = useMemo(
    () =>
      (questions || [])
        .filter((item) => item?.QuesId || item?.id || item?.QuestID)
        .map((item) => ({
          id: Number(item.QuesId ?? item.QuestID ?? item.id),
          name: String(item.QuestionName ?? item.QuesName ?? item.QuesName ?? item.name ?? ""),
        }))
        .filter((item) => Number.isFinite(item.id) && item.name.trim()),
    [questions],
  );

  const footer = fmOnly ? null : (
    <button className="btn btn-secondary" type="button" onClick={closeModal}>
      Close
    </button>
  );

  const categoryLabel =
    (ctrl.categoryData || []).find((c) => String(c.Id ?? c.catId) === String(ctrl.selectedCategory))?.Name ||
    (ctrl.categoryData || []).find((c) => String(c.Id ?? c.catId) === String(ctrl.selectedCategory))?.name ||
    ctrl.selectedCategory ||
    "-";

  const subCategoryLabel =
    (ctrl.subCategory || []).find((s) => String(s.SubCategoryId) === String(ctrl.selectedSubCategory))?.SubCategoryName ||
    ctrl.selectedSubCategory ||
    "-";

  const propertyLabel =
    (ctrl.propertyData || []).find((p) => String(p.propertyId) === String(ctrl.propertyId))?.name ||
    ctrl.propertyId ||
    "-";

  const formatDate = (val) => {
    if (!val) return "-";
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      return val.toLocaleDateString("en-GB");
    }
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB");
    }
    return String(val);
  };

  const formatTime = (val) => {
    if (!val) return "-";
    if (val instanceof Date && !Number.isNaN(val.getTime())) {
      return val.toLocaleTimeString("en-GB");
    }
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB");
    }
    return String(val);
  };

  return (
    <div>
      <TaskShell 
        visible={visible} 
        title={
          fmOnly
            ? `${rowData?.Name || "FM remarks"}${rowData?.TaskId ? ` (${rowData.TaskId})` : ""}${
                propertyLabel && propertyLabel !== "-" ? ` \u2013 ${propertyLabel}` : ""
              }`
            : "Task details"
        }
        priority={rowData?.Priority} 
        status={rowData?.TaskStatus}
        variant={fmOnly ? "fm" : undefined}
        rightActions={
          fmOnly ? null : (
            <>
              <button type="button" style={{ border:"none", background:"transparent", display:"flex", alignItems:"center", gap:"6px", color:"#0369a1", fontWeight:"600", padding:"0", fontSize:"15px" }}>
                <i className="far fa-edit" /> Edit
              </button>
              <button type="button" style={{ border:"none", background:"transparent", color:"#94a3b8", padding:"0", fontSize:"18px" }}><i className="far fa-edit" /></button>
              <button type="button" style={{ border:"none", background:"transparent", color:"#94a3b8", padding:"0", fontSize:"18px" }}><i className="far fa-trash-alt" /></button>
            </>
          )
        }
        onClose={closeModal} 
        footer={footer}
      >
        {!fmOnly ? (
          <>
            <TaskSection title="Task details" isOpen>
              <div className="task-view-grid">
                <div className="task-view-field">
                  <p className="task-view-label">Task Name</p>
                  <p className="task-view-value">{rowData?.Name || "-"}</p>
                </div>
                <div className="task-view-field"></div>
                <div className="task-view-field">
                  <p className="task-view-label">Category</p>
                  <p className="task-view-value">{categoryLabel}</p>
                </div>
                 <div className="task-view-field">
                  <p className="task-view-label">Sub-category</p>
                  <p className="task-view-value">{subCategoryLabel}</p>
                </div>
                
                <div className="task-view-field">
                  <p className="task-view-label">Location</p>
                  <p className="task-view-value">{rowData?.Location || "-"}</p>
                </div>
                <div className="task-view-field">
                  <p className="task-view-label">Property</p>
                  <p className="task-view-value">{propertyLabel}</p>
                </div>
                <div className="task-view-field">
                   <p className="task-view-label">Priority</p>
                   <p className="task-view-value">{rowData?.Priority || "-"}</p>
                </div>
                <div className="task-view-field">
                  <p className="task-view-label">Assigned to</p>
                  <p className="task-view-value">{rowData?.AssignedTo || "-"}</p>
                </div>

                <div className="task-view-field">
                  <p className="task-view-label">Start Date</p>
                  <p className="task-view-value">{formatDate(ctrl.startDate)}</p>
                </div>
                 <div className="task-view-field">
                  <p className="task-view-label">Due Date</p>
                  <p className="task-view-value">{formatDate(ctrl.endDate)}</p>
                </div>
                <div className="task-view-field">
                  <p className="task-view-label">Start time</p>
                  <p className="task-view-value">{formatTime(ctrl.startTime)}</p>
                </div>
                <div className="task-view-field">
                   <p className="task-view-label">End time</p>
                   <p className="task-view-value">{formatTime(ctrl.endTime)}</p>
                </div>

                <div className="task-view-field">
                   <p className="task-view-label">Occurence</p>
                   <p className="task-view-value">{rowData?.OccurenceView || "-"}</p>
                </div>
                 <div className="task-view-field">
                   <p className="task-view-label">Reminder</p>
                   <p className="task-view-value">{ctrl.remindme || "-"}</p>
                </div>
                <div className="task-view-field"></div>
                <div className="task-view-field"></div>

                 <div className="task-view-field task-view-field--full">
                   <p className="task-view-label">Description</p>
                   <p className="task-view-value">{rowData?.TaskDescription || "-"}</p>
                </div>
              </div>
            </TaskSection>

            <TaskInlineSection title="Checklist">
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
          </>
        ) : null}

        {isActionable ? (
          fmOnly ? (
            <TaskFmRemarksSection
              compact
              taskName={rowData?.Name}
              location={rowData?.Location}
              questions={fmQuestions}
              selectedQuestionId={fmCtrl.selectedQuestionId}
              onSelectQuestion={fmCtrl.onSelectQuestion}
              onViewImage={(qid) => ctrl.openViewImage?.({ QuesId: qid, TaskId: rowData?.TaskId })}
              fmSelectedDate={fmCtrl.fmSelectedDate}
              onDateChange={fmCtrl.onDateChange}
              loading={fmCtrl.loading}
              remarks={fmCtrl.remarks}
              chatStatus={rowData?.TaskStatus}
              questionStatusMap={fmCtrl.questionStatusMap}
              questionIdsWithRemarks={fmCtrl.questionIdsWithRemarks}
              onSend={fmCtrl.sendFmRemark}
            />
          ) : (
            <TaskSection
              title="Fm Remarks"
              isOpen={openSection === "fmRemarks"}
              onToggle={() => toggleSection("fmRemarks")}
            >
              <TaskFmRemarksSection
                taskName={rowData?.Name}
                location={rowData?.Location}
                questions={fmQuestions}
                selectedQuestionId={fmCtrl.selectedQuestionId}
                onSelectQuestion={fmCtrl.onSelectQuestion}
                onViewImage={(qid) => ctrl.openViewImage?.({ QuesId: qid, TaskId: rowData?.TaskId })}
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
          )
        ) : fmOnly ? (
          <p className="text-muted mb-0">FM remarks are available only for actionable tasks.</p>
        ) : (
          <TaskSection title="Fm Remarks" isOpen>
            <p className="text-muted mb-0">FM remarks are available only for actionable tasks.</p>
          </TaskSection>
        )}
      </TaskShell>
    </div>
  );
}
