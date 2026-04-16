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
    <div className="add-task-form">
      {(questions || []).length === 0 ? <p className="text-muted">No questions available.</p> : null}

      {(questions || []).map((q) => (
        <div key={q.QuesId} className="task-procedure-row">
          <div className="task-procedure-index">{q.QuesId}.</div>
          <input className="form-control task-procedure-input" value={q.QuesName || q.QuestionName || ""} disabled />
          <div className="task-procedure-actions" />
        </div>
      ))}
    </div>
  );
}
