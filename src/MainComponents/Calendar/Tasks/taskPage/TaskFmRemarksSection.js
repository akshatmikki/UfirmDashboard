import React, { useEffect, useMemo, useState } from "react";
import ChatBox from "../../../Notification Center/ChatBox";

export default function TaskFmRemarksSection({
  taskName,
  location,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onViewImage,
  fmSelectedDate,
  onDateChange,
  loading,
  remarks,
  chatStatus,
  questionStatusMap,
  questionIdsWithRemarks,
  onSend,
}) {
  const normalizedStatus = String(chatStatus || "")
    .toLowerCase()
    .includes("complete")
    ? "Completed"
    : (chatStatus || "Actionable");

  const [openQuestionId, setOpenQuestionId] = useState(null);
  const visibleQuestions = useMemo(() => {
    const ids = new Set((questionIdsWithRemarks || []).map((id) => Number(id)));
    if (!ids.size) return questions || [];
    return (questions || []).filter((q) => ids.has(Number(q.id)));
  }, [questionIdsWithRemarks, questions]);

  useEffect(() => {
    if (!visibleQuestions?.length) {
      setOpenQuestionId(null);
      return;
    }

    const actionableQuestion = visibleQuestions.find((q) => {
      const status =
        (questionStatusMap && (questionStatusMap[String(q.id)] || questionStatusMap[q.id])) ||
        normalizedStatus;
      return String(status || "").toLowerCase() === "actionable";
    });

    const defaultQuestionId = actionableQuestion?.id || visibleQuestions[0].id;
    setOpenQuestionId((prev) => {
      if (!prev) return defaultQuestionId;
      const stillVisible = visibleQuestions.some((q) => Number(q.id) === Number(prev));
      return stillVisible ? prev : defaultQuestionId;
    });
  }, [normalizedStatus, questionStatusMap, visibleQuestions]);

  useEffect(() => {
    if (!openQuestionId) return;
    if (Number(selectedQuestionId) === Number(openQuestionId)) return;
    onSelectQuestion?.(Number(openQuestionId));
  }, [onSelectQuestion, openQuestionId, selectedQuestionId]);

  const effectiveStatusMap = useMemo(() => questionStatusMap || {}, [questionStatusMap]);

  const getQuestionStatus = (questionId) => {
    const status =
      effectiveStatusMap[String(questionId)] ||
      effectiveStatusMap[questionId] ||
      normalizedStatus;

    return String(status || "Actionable");
  };

  const toggleQuestion = (questionId) => {
    setOpenQuestionId((prev) => {
      if (Number(prev) === Number(questionId)) return null;
      return questionId;
    });
  };

  return (
    <div className="add-task-form">
      <div className="row mb-3">
        <div className="col-md-6">
          <label>Task Name</label>
          <input className="form-control" value={taskName || ""} disabled />
        </div>
        <div className="col-md-6">
          <label>Location</label>
          <input className="form-control" value={location || ""} disabled />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Task Date</label>
          <input
            type="date"
            className="form-control"
            value={fmSelectedDate || ""}
            onChange={(e) => onDateChange?.(e.target.value)}
            onFocus={(e) => e.target.showPicker?.()}
          />
        </div>
      </div>

      {(visibleQuestions || []).map((q, index) => {
        const isOpen = Number(openQuestionId) === Number(q.id);
        const currentStatus = getQuestionStatus(q.id);
        const isActionable = currentStatus.toLowerCase() === "actionable";

        return (
          <div
            key={String(q.id)}
            className="card mb-2"
            style={{
              border: isActionable ? "2px solid #198754" : "1px solid #d6d6d6",
              boxShadow: isActionable ? "0 0 0 3px rgba(25,135,84,0.08)" : "none",
            }}
          >
            <button
              type="button"
              className="btn btn-light w-100 text-start d-flex justify-content-between align-items-center"
              onClick={() => toggleQuestion(q.id)}
              aria-expanded={isOpen}
            >
              <span>
                <strong>Q{index + 1}:</strong> {q.name}
              </span>
              <span>
                <span className={`badge ${isActionable ? "bg-success" : "bg-secondary"} me-2`}>
                  {currentStatus}
                </span>
                {isOpen ? "-" : "+"}
              </span>
            </button>

            {isOpen ? (
              <div className="card-body" style={{ background: "#f8f9fa" }}>
                <div className="mb-3">
                  <button
                    className="btn btn-info"
                    type="button"
                    onClick={() => onViewImage?.(q.id)}
                  >
                    <i className="fa fa-eye mr-1" /> View Image
                  </button>
                </div>

                {loading ? <p className="text-muted">Loading remarks...</p> : null}

                <ChatBox
                  remarks={remarks}
                  status={currentStatus}
                  context="task"
                  onSend={(message, status) => onSend?.(message, status, Number(q.id))}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {!visibleQuestions?.length ? (
        <p className="text-muted">No questions found for this task/date.</p>
      ) : null}
    </div>
  );
}
