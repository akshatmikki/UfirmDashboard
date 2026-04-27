import React from "react";

const countByStatus = (rows = [], statusMatcher) =>
  rows.filter((task) => statusMatcher(String(task.TaskStatus || "").toLowerCase())).length;

export default function TaskListCounters({ tasks = [], completedTasks, pendingTasks, actionableTasks, onStatusClick }) {
  const total = Array.isArray(tasks) ? tasks.length : 0;
  const completed = Number(completedTasks || 0);
  const pending = Number(pendingTasks || 0);
  const inProgress = Number(actionableTasks || 0);
  const overdue = countByStatus(tasks, (status) => status.includes("overdue"));

  return (
    <div className="task-summary-grid">
      {/* <div className="task-summary-card task-summary-total" style={{ cursor: "pointer" }} onClick={() => onStatusClick?.("None")}>
        <p className="task-summary-value">{total}</p>
        <p className="task-summary-label">Total Tasks</p>
      </div> */}
      <div className="task-summary-card task-summary-completed" style={{ cursor: "pointer" }} onClick={() => onStatusClick?.("Complete")}>
        <p className="task-summary-value">{completed}</p>
        <p className="task-summary-label">Completed</p>
      </div>
      <div className="task-summary-card task-summary-progress" style={{ cursor: "pointer" }} onClick={() => onStatusClick?.("Actionable")}>
        <p className="task-summary-value">{inProgress}</p>
        <p className="task-summary-label">Actionable</p>
      </div>
      <div className="task-summary-card task-summary-pending" style={{ cursor: "pointer" }} onClick={() => onStatusClick?.("Pending")}>
        <p className="task-summary-value">{pending}</p>
        <p className="task-summary-label">Pending</p>
      </div>
      {/* <div className="task-summary-card task-summary-overdue">
        <p className="task-summary-value">{overdue}</p>
        <p className="task-summary-label">Completed</p>
      </div> */}
    </div>
  );
}
