import React, { useEffect, useMemo, useRef, useState } from "react";
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
  compact = false,
}) {
  const normalizedStatus = String(chatStatus || "")
    .toLowerCase()
    .includes("complete")
    ? "Completed"
    : (chatStatus || "Actionable");

  const [openQuestionId, setOpenQuestionId] = useState(null);
  const listRef = useRef(null);

  const effectiveStatusMap = useMemo(() => questionStatusMap || {}, [questionStatusMap]);
  const getQuestionStatus = (questionId) => {
    const status =
      effectiveStatusMap[String(questionId)] ||
      effectiveStatusMap[questionId] ||
      normalizedStatus;

    return String(status || "Actionable");
  };

  const isActionableStatus = (value) => {
    const s = String(value || "").trim().toLowerCase();
    return s === "actionable" || s === "in-progress" || s === "in progress";
  };

  const visibleQuestions = useMemo(() => {
    const list = questions || [];
    return list.filter((q) => {
      const rawStatus = effectiveStatusMap[String(q.id)] || effectiveStatusMap[q.id];
      // If we don't have per-question status yet, don't hide questions (prevents blank UI on first load).
      if (rawStatus == null || String(rawStatus).trim() === "") return true;
      return isActionableStatus(rawStatus);
    });
  }, [effectiveStatusMap, isActionableStatus, normalizedStatus, questions]);

  const hasRemarkSet = useMemo(
    () => new Set((questionIdsWithRemarks || []).map((id) => Number(id))),
    [questionIdsWithRemarks],
  );

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
    if (!listRef.current) return;
    // Ensure the list starts at the top so the first visible question isn't hidden by a retained scroll position.
    const el = listRef.current;
    let mounted = true;
    const reset = () => {
      if (!mounted || !el) return;
      el.scrollTop = 0;
    };
    const frame = window.requestAnimationFrame(reset);
    const t1 = window.setTimeout(reset, 0);
    const t2 = window.setTimeout(reset, 50);
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [fmSelectedDate, taskName, location, visibleQuestions?.length]);

  useEffect(() => {
    if (!openQuestionId) return;
    if (Number(selectedQuestionId) === Number(openQuestionId)) return;
    onSelectQuestion?.(Number(openQuestionId));
  }, [onSelectQuestion, openQuestionId, selectedQuestionId]);

  const currentStatus = openQuestionId ? getQuestionStatus(openQuestionId) : normalizedStatus;
  const isCurrentActionable = isActionableStatus(currentStatus);

  return (
    <div
      className={`add-task-form ${compact ? "fm-remarks-compact" : ""}`.trim()}
      style={
        compact
          ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
          : undefined
      }
    >
      {!compact ? (
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
      ) : null}

      {!compact ? (
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
      ) : null}

      <div className="fm-remarks-split" style={compact ? { flex: 1, minHeight: 0 } : undefined}>
        <div className="fm-questions" role="navigation" aria-label="Task questionnaire">
          <div className="fm-questions-head">Task Questionnaire</div>
          <div className="fm-questions-list" ref={listRef}>
            {(visibleQuestions || []).map((q, index) => {
              const status = getQuestionStatus(q.id);
              const isActionable = String(status || "").toLowerCase() === "actionable";
              const isActive = Number(openQuestionId) === Number(q.id);
              const hasRemarks = hasRemarkSet.has(Number(q.id));

              return (
                <button
                  key={String(q.id)}
                  type="button"
                  className={`fm-q-item ${isActive ? "is-active" : ""}`}
                  onClick={() => setOpenQuestionId(Number(q.id))}
                  title={q.name}
                  tabIndex={-1}
                >
                  <span className="fm-q-name">
                    <span className="fm-q-index">{index + 1}</span>
                    <span className="fm-q-text">{q.name}</span>
                  </span>
                  <span className="fm-q-meta">
                    {hasRemarks ? <span className="fm-q-dot" aria-label="Has remarks" /> : null}
                    <span className={`fm-q-badge ${isActionable ? "is-actionable" : ""}`}>{status}</span>
                  </span>
                </button>
              );
            })}

            {!visibleQuestions?.length ? (
              <div className="fm-q-empty">No actionable questions found for this task/date.</div>
            ) : null}
          </div>
        </div>

        <div className="fm-chat" aria-label="FM remarks thread">
          {openQuestionId ? (
            <>
              <div className="fm-chat-head">
                <div className="fm-chat-title">
                  <span className="fm-chat-pill">{isCurrentActionable ? "Actionable" : "Remarks"}</span>
                  <span className="fm-chat-question">
                    {(visibleQuestions || []).find((q) => Number(q.id) === Number(openQuestionId))?.name || ""}
                  </span>
                </div>
                <div className="fm-chat-actions">
                  <button className="btn btn-info btn-sm" type="button" onClick={() => onViewImage?.(openQuestionId)}>
                    <i className="fa fa-eye mr-1" /> View Image
                  </button>
                </div>
              </div>

              {loading ? <p className="text-muted mb-2">Loading remarks...</p> : null}

              <div className="fm-chat-box">
                <ChatBox
                  remarks={remarks}
                  status={currentStatus}
                  context="task"
                  fillHeight
                  onSend={(message, status) => onSend?.(message, status, Number(openQuestionId))}
                />
              </div>
            </>
          ) : (
            <div className="fm-chat-empty">Select a question to view remarks.</div>
          )}
        </div>
      </div>
    </div>
  );
}
