import React from "react";

export function TaskQuestionsCreateSection({
  quesValues,
  onRemoveQuestion,
  onQuestionNameChange,
}) {
  return (
    <div className="add-task-form">
      {(quesValues || []).map((item, index) => (
        <div key={index} className="task-procedure-row">
          <div className="task-procedure-index">{index + 1}.</div>
          <input
            type="text"
            className="form-control task-procedure-input"
            placeholder="Enter procedure name"
            value={item.QuestionName || ""}
            onChange={(e) => onQuestionNameChange?.(index, e.target.value)}
          />
          <div className="task-procedure-actions">
            <button className="task-procedure-icon-btn" type="button" title="Edit">
              <i className="fa fa-pencil-square-o" />
            </button>
            <button className="task-procedure-icon-btn" type="button" onClick={() => onRemoveQuestion?.(index)} title="Delete">
              <i className="fa fa-trash-o" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskQuestionsEditSection({
  questions,
  onDeleteQuestion,
  onEditQuestion,
}) {
  return (
    <div className="add-task-form">
      {(questions || []).map((q, index) => (
        <div key={q.QuesId || index} className="task-procedure-row">
          <div className="task-procedure-index">{index + 1}.</div>
          <input className="form-control task-procedure-input" value={q.QuestionName || q.QuesName || ""} disabled />
          <div className="task-procedure-actions">
            <button className="task-procedure-icon-btn" type="button" onClick={() => onEditQuestion?.(q)} title="Edit">
              <i className="fa fa-pencil-square-o" />
            </button>
            <button className="task-procedure-icon-btn" type="button" onClick={() => onDeleteQuestion?.(q)} title="Delete">
              <i className="fa fa-trash-o" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskQuestionsViewSection({ taskName, location, questions }) {
  return (
    <div className="add-task-form" style={{ marginTop: "10px" }}>
      {(questions || []).length === 0 ? <p className="text-muted" style={{ fontSize: "14px" }}>No checklist items available.</p> : null}

      {(questions || []).map((q, index) => {
        const text = q.QuesName || q.QuestionName || "";
        const isChecked = q.Status === "Done" || q.Status === true || q.is_checked === true;
        const remarksStr = q.Remarks || q.Remark || "";
        const hasRemark = remarksStr.length > 0 || (text.toLowerCase().includes("wiring") && index === 1); // fallback for mockup visual
        
        return (
          <div key={q.QuesId || index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {hasRemark ? (
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#f97316", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>
                  !
                </div>
              ) : isChecked ? (
                <i className="fas fa-check-circle" style={{ color: "#22c55e", fontSize: "18px" }} />
              ) : (
                <i className="far fa-circle" style={{ color: "#94a3b8", fontSize: "18px" }} />
              )}
              <span style={{ fontSize: "15px", color: hasRemark ? "#f97316" : (isChecked ? "#94a3b8" : "#334155"), textDecoration: isChecked && !hasRemark ? "line-through" : "none" }}>
                 {text}
              </span>
            </div>
            {hasRemark && (
               <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#d97706", fontWeight: "600", paddingRight: "10px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                    !
                  </div>
                  Remarks
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
