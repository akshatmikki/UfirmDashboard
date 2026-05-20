import React from "react";

const countByStatus = (rows = [], statusMatcher) =>
  rows.filter((task) => statusMatcher(String(task.TaskStatus || "").toLowerCase())).length;

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

export default function TaskListCounters({
  tasks = [],
  completedTasks,
  pendingTasks,
  actionableTasks,
  onHoldTasks,
  dashboardCount,
  activeStatus,
  onStatusClick,
}) {
  const hasDashboard = !!dashboardCount && typeof dashboardCount === "object";
  const total = hasDashboard ? Number(dashboardCount.TotalTasks || 0) : Array.isArray(tasks) ? tasks.length : 0;
  const visible = Array.isArray(tasks) ? tasks.length : 0;
  const completed = hasDashboard ? Number(dashboardCount.Completed || 0) : Number(completedTasks || 0);
  const pending = hasDashboard ? Number(dashboardCount.Pending || 0) : Number(pendingTasks || 0);
  const inProgress = hasDashboard ? Number(dashboardCount.Actionable || 0) : Number(actionableTasks || 0);
  const onHold = hasDashboard ? Number(dashboardCount.OnHold || 0) : Number(onHoldTasks || 0);
  const overdue = countByStatus(tasks, (status) => status.includes("overdue"));
  const active = normalizeStatus(activeStatus);
  const totalActive = active === "" || active === "none" || active === "0";
  const completedActive = active === "complete" || active === "completed";
  const pendingActive = active === "pending";
  const actionableActive = active === "actionable" || active === "in-progress" || active === "in progress";

  return (
    <div className="task-summary-grid">
      <div
        className={`task-summary-card task-summary-total ${totalActive ? "task-summary-active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onStatusClick?.("None")}
        role="button"
        tabIndex={0}
        aria-pressed={totalActive}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onStatusClick?.("None");
        }}
        title="Show all tasks"
      >
        <p className="task-summary-value">{total}</p>
        <p className="task-summary-label">Total Tasks</p>
      </div>
      
      <div
        className={`task-summary-card task-summary-completed ${completedActive ? "task-summary-active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onStatusClick?.("Complete")}
        role="button"
        tabIndex={0}
        aria-pressed={completedActive}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onStatusClick?.("Complete");
        }}
        title="Filter completed tasks"
      >
        <p className="task-summary-value">{completed}</p>
        <p className="task-summary-label">Completed</p>
      </div>
      <div
        className={`task-summary-card task-summary-progress ${actionableActive ? "task-summary-active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onStatusClick?.("Actionable")}
        role="button"
        tabIndex={0}
        aria-pressed={actionableActive}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onStatusClick?.("Actionable");
        }}
        title="Filter actionable tasks"
      >
        <p className="task-summary-value">{inProgress}</p>
        <p className="task-summary-label">Actionable</p>
      </div>
      <div
        className={`task-summary-card task-summary-pending ${pendingActive ? "task-summary-active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onStatusClick?.("Pending")}
        role="button"
        tabIndex={0}
        aria-pressed={pendingActive}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onStatusClick?.("Pending");
        }}
        title="Filter pending tasks"
      >
        <p className="task-summary-value">{pending}</p>
        <p className="task-summary-label">Pending</p>
      </div>
      <div
        className={`task-summary-card task-summary-onhold ${active === "on-hold" || active === "on hold" ? "task-summary-active" : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onStatusClick?.("On Hold")}
        role="button"
        tabIndex={0}
        aria-pressed={active === "on-hold" || active === "on hold"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onStatusClick?.("On Hold");
        }}
        title="Filter on hold tasks"
      >
        <p className="task-summary-value">{onHold}</p>
        <p className="task-summary-label">On Hold</p>
      </div>
      {/* <div className="task-summary-card task-summary-overdue">
        <p className="task-summary-value">{overdue}</p>
        <p className="task-summary-label">Completed</p>
      </div> */}
    </div>
  );
}
