import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
    return s === "actionable";
  };

  const visibleQuestions = useMemo(() => {
    const list = questions || [];
    return list.filter((q) => {
      const rawStatus = effectiveStatusMap[String(q.id)] || effectiveStatusMap[q.id];
      // Only show questions that have an explicit status set in the notification map.
      // If a question has no status entry, it means it hasn't been 'actioned' yet.
      if (rawStatus == null || String(rawStatus).trim() === "") return false;
      return isActionableStatus(rawStatus);
    });
  }, [effectiveStatusMap, isActionableStatus, normalizedStatus, questions]);

  const hasRemarkSet = useMemo(
    () => new Set((questionIdsWithRemarks || []).map((id) => Number(id))),
    [questionIdsWithRemarks],
  );

  const visibleQuestionsSignature = useMemo(
    () => (visibleQuestions || []).map((q) => String(q.id)).join("|"),
    [visibleQuestions],
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

  useLayoutEffect(() => {
    if (!listRef.current) return undefined;

    // Ensure the list starts at the top so the first visible question isn't hidden by a retained scroll position.
    const el = listRef.current;
    let mounted = true;
    const reset = () => {
      if (!mounted || !el) return;
      try {
        el.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch (_) {
        el.scrollTop = 0;
      }
    };

    // Run repeatedly until the modal/layout is actually visible; otherwise some browsers keep the old scrollTop.
    let raf = 0;
    let attempts = 0;
    const tick = () => {
      if (!mounted || !el) return;
      const isVisible = el.offsetParent !== null && el.clientHeight > 0;
      if (isVisible) reset();
      if (attempts++ < 24 && (!isVisible || el.scrollTop !== 0)) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    reset();
    raf = window.requestAnimationFrame(tick);
    const t1 = window.setTimeout(tick, 0);
    const t2 = window.setTimeout(tick, 120);
    return () => {
      mounted = false;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [compact, fmSelectedDate, taskName, location, visibleQuestionsSignature]);

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

      <div className="fm-remarks-split" style={compact ? { flex: 1, minHeight: 0, display: "flex" } : { display: "flex" }}>
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
                  onMouseDown={(e) => e.preventDefault()}
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

        <div className="fm-chat" aria-label="FM remarks thread" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {openQuestionId ? (
            <>
              <div className="fm-chat-head">
                <div className="fm-chat-title">
                  <span className="fm-chat-pill">{isCurrentActionable ? "Actionable" : "Remarks"}</span>
                  <span className="fm-chat-question">
                    {(visibleQuestions || []).find((q) => Number(q.id) === Number(openQuestionId))?.name || ""}
                  </span>
                  <span className="fm-chat-date text-muted ml-2" style={{ fontSize: '13px', fontWeight: 'normal' }}>
                    ({fmSelectedDate})
                  </span>
                </div>
                <div className="fm-chat-actions">
                  <button className="btn btn-info btn-sm mr-2" type="button" onClick={() => onViewImage?.(openQuestionId)}>
                    <i className="fa fa-eye mr-1" /> View Image
                  </button>
                  {isCurrentActionable ? (
                    <button 
                      className="btn btn-success btn-sm" 
                      type="button" 
                      onClick={() => onSend?.("Marked as completed", "Completed", Number(openQuestionId))}
                    >
                      <i className="fa fa-check mr-1" /> Mark as Complete
                    </button>
                  ) : null}
                </div>
              </div>

              {loading ? <p className="text-muted mb-2">Loading remarks...</p> : null}

              <div className="fm-chat-box" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
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
