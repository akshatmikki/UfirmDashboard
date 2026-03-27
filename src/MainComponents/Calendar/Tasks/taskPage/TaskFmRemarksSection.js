import React from "react";
import ChatBox from "../../../Notification Center/ChatBox";

export default function TaskFmRemarksSection({
  taskName,
  location,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  fmSelectedDate,
  onDateChange,
  loading,
  remarks,
  chatStatus,
  onSend,
}) {
  const normalizedStatus = String(chatStatus || "")
    .toLowerCase()
    .includes("complete")
    ? "Completed"
    : (chatStatus || "Actionable");

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
          <label>Question</label>
          <select className="form-control" value={selectedQuestionId || ""} onChange={(e) => onSelectQuestion?.(Number(e.target.value))}>
            <option value="">Select Question</option>
            {(questions || []).map((q) => (
              <option key={String(q.id)} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <label>Task Date</label>
          <input className="form-control" value={fmSelectedDate || ""} onChange={(e) => onDateChange?.(e.target.value)} placeholder="yyyy-mm-dd" />
        </div>

        <div className="col-md-5" />
      </div>

      {loading ? <p className="text-muted">Loading remarks...</p> : null}

      <ChatBox remarks={remarks} status={normalizedStatus} context="task" onSend={onSend} />
    </div>
  );
}
