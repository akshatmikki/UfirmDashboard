import React from "react";
import moment from "moment";
import { downloadQRCode } from "../../../../../Common/QRUtils";

const getStatusClass = (status) => String(status || "").toLowerCase().replace(/\s+/g, "-");
const normalizeStatus = (status) => String(status || "").trim().toLowerCase();
const hasActiveStatusFilter = (filter) => {
  const normalized = normalizeStatus(filter);
  return normalized !== "" && normalized !== "none" && normalized !== "0";
};
const isActionableStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === "actionable" || normalized === "in-progress" || normalized === "in progress" || normalized === "on-hold" || normalized === "on hold";
};
const getStatusRank = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "pending" || normalized.includes("overdue")) return 0;
  if (normalized === "on-hold" || normalized === "on hold") return 1;
  if (normalized === "actionable" || normalized === "in-progress" || normalized === "in progress") return 2;
  if (normalized === "completed" || normalized === "complete") return 3;
  return 99;
};
const matchesStatusFilter = (taskStatus, statusFilter) => {
  const tStatus = normalizeStatus(taskStatus);
  const fStatus = normalizeStatus(statusFilter);

  if (!hasActiveStatusFilter(fStatus)) return true;

  if (fStatus === "complete" || fStatus === "completed") {
    return tStatus === "complete" || tStatus === "completed";
  }

  if (fStatus === "actionable" || fStatus === "in-progress" || fStatus === "in progress") {
    return tStatus === "actionable" || tStatus === "in-progress" || tStatus === "in progress";
  }

  if (fStatus === "pending") {
    return tStatus === "pending" || tStatus.includes("overdue");
  }

  if (fStatus === "on-hold" || fStatus === "on hold") {
    return tStatus === "on-hold" || tStatus === "on hold";
  }

  return tStatus === fStatus;
};
const getPriorityClass = (priority) => {
  const val = String(priority || "").toLowerCase();
  if (val.includes("sos")) return "sos";
  if (val.includes("high")) return "high";
  if (val.includes("medium")) return "medium";
  if (val.includes("low")) return "low";
  return "";
};

const getDisplayStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "pending") return "Overdue";
  if (normalized === "completed" || normalized === "complete") return "Completed";
  return status || "Overdue";
};

const toTaskDateMoment = (value) => {
  if (!value) return null;
  const parsed = moment(value, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601], true);
  return parsed.isValid() ? parsed : null;
};

const getTaskDateLabel = (value) => {
  const parsed = toTaskDateMoment(value);
  return parsed ? parsed.format("DD-MM-YYYY") : "No Date";
};

const getTaskDateDisplay = (value) => {
  const parsed = toTaskDateMoment(value);
  return parsed ? parsed.format("DD-MM-YYYY") : "-";
};

const getStatusCounts = (tasks = []) => {
  let completed = 0;
  let pending = 0;
  let actionable = 0;
  let onHold = 0;

  tasks.forEach((task) => {
    const status = String(task?.TaskStatus || "").trim().toLowerCase();
    if (status === "completed" || status === "complete") completed += 1;
    else if (status === "pending") pending += 1;
    else if (status === "actionable" || status === "in-progress" || status === "in progress") actionable += 1;
    else if (status === "on-hold" || status === "on hold") onHold += 1;
  });

  return { completed, pending, actionable, onHold };
};

export default function attachRenderTable(TaskList) {
  TaskList.prototype.renderTaskTable = function () {
    const { data, searchTerm, uiTaskStatus, dateStatusFilters } = this.state;
    const searchStr = String(searchTerm || "").trim().toLowerCase();
    const filteredData = searchStr
      ? data.filter((task) =>
        Object.values(task || {}).some((value) => {
          if (value === null || value === undefined || typeof value === "object") return false;
          return String(value).toLowerCase().includes(searchStr);
        })
      )
      : data;

    if (filteredData.length === 0) {
      return (
        <div className="task-empty-state">
          <div className="task-empty-icon">
            <i className="fa fa-list-alt" />
          </div>
          <h3 className="task-empty-title">No tasks found</h3>
          <p className="task-empty-subtitle">
            Get started by creating your first maintenance task to track equipment inspections, repairs, and preventive maintenance.
          </p>
          <button className="btn btn-primary task-empty-cta" type="button" onClick={this.AddNew}>
            <i className="fa fa-plus mr-2" />
            Create your first task
          </button>
        </div>
      );
    }

    const groupedByDate = filteredData.reduce((acc, task) => {
      const dateKey = getTaskDateLabel(task?.UpdatedOn);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      if (a === "No Date") return 1;
      if (b === "No Date") return -1;
      return moment(b, "DD-MM-YYYY").valueOf() - moment(a, "DD-MM-YYYY").valueOf();
    });

    const activeDate = this.state.expandedDate;

    return (
      <>
        {sortedDates.map((date) => {
          const tasks = groupedByDate[date] || [];
          const dateFilter = dateStatusFilters && dateStatusFilters[date] ? dateStatusFilters[date] : null;
          const effectiveFilter = dateFilter || uiTaskStatus;
          const displayTasks = tasks
            .filter((task) => matchesStatusFilter(task?.TaskStatus, effectiveFilter))
            .slice()
            .sort((a, b) => {
              const rankDiff = getStatusRank(a?.TaskStatus) - getStatusRank(b?.TaskStatus);
              if (rankDiff !== 0) return rankDiff;
              const aId = Number(a?.TaskId ?? 0);
              const bId = Number(b?.TaskId ?? 0);
              return aId - bId;
            });

          const isFilterActive = hasActiveStatusFilter(effectiveFilter);
          const isCompletedActive = isFilterActive && (normalizeStatus(effectiveFilter) === "complete" || normalizeStatus(effectiveFilter) === "completed");
          const isPendingActive = isFilterActive && normalizeStatus(effectiveFilter) === "pending";
          const isActionableActive = isFilterActive && (normalizeStatus(effectiveFilter) === "actionable" || normalizeStatus(effectiveFilter) === "in-progress" || normalizeStatus(effectiveFilter) === "in progress");
          const isOnHoldActive = isFilterActive && (normalizeStatus(effectiveFilter) === "on-hold" || normalizeStatus(effectiveFilter) === "on hold");

          // Don't hide the header if tasks exist for this date but are filtered out by status
          if (displayTasks.length === 0 && !isFilterActive) return null;

          const isExpanded = activeDate === date;
          const { completed, pending, actionable, onHold } = getStatusCounts(tasks);
          const tablePageSize = Number(this.state.tablePageSize || 10);
          const tablePage = Number(this.state.tablePage || 1);
          const totalPages = Number(this.state.totalPages || 1);
          const currentPage = tablePage;
          const pagedTasks = isExpanded ? displayTasks : [];

          return (
            <div key={date} className="mb-3">
              <div
                className="d-flex align-items-center justify-content-between px-3 py-2 mb-2"
                style={{
                  borderBottom: "2px solid #336B93",
                  background: isExpanded ? "#f0f7ff" : "#f8fbff",
                  cursor: "pointer",
                  userSelect: "none",
                  borderRadius: "8px 8px 0 0",
                }}
                onClick={() => this.toggleDateGroup(date)}
              >
                <div className="d-flex align-items-center flex-wrap" style={{ gap: 10 }}>
                  <h6 className="mb-0 font-weight-bold text-primary">
                    <i className="fa fa-calendar mr-2" />
                    {date}
                  </h6>
                  <button
                    type="button"
                    className={`badge badge-light border text-success ${isCompletedActive ? "task-badge-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDateStatusFilter?.(date, "Complete");
                    }}
                    title="Filter completed tasks"
                  >
                    {completed} Completed
                  </button>
                  <button
                    type="button"
                    className={`badge badge-light border text-danger ${isPendingActive ? "task-badge-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDateStatusFilter?.(date, "Pending");
                    }}
                    title="Filter pending tasks"
                  >
                    {pending} Pending
                  </button>
                  <button
                    type="button"
                    className={`badge badge-light border text-info ${isActionableActive ? "task-badge-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDateStatusFilter?.(date, "Actionable");
                    }}
                    title="Filter actionable tasks"
                  >
                    {actionable} Actionable
                  </button>
                  <button
                    type="button"
                    className={`badge badge-light border text-secondary ${isOnHoldActive ? "task-badge-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDateStatusFilter?.(date, "On Hold");
                    }}
                    title="Filter on hold tasks"
                  >
                    {onHold} On Hold
                  </button>
                  <span className="badge badge-light border text-muted">Total {tasks.length}</span>
                </div>
                <i className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-primary`} />
              </div>

              {isExpanded ? (
                <>
                  <div className="task-list-stack">
                    {pagedTasks.map((task, index) => (
                      <div
                        key={`${task.TaskId}-${index}`}
                        className={`task-line-item ${getStatusClass(task.TaskStatus)}`}
                        onClick={() => this.ViewTask(task)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") this.ViewTask(task);
                        }}
                      >
                        <div className="task-line-content">
                          <div className="task-line-top">
                            <div className="task-line-main">
                              <div className="task-line-header-row">
                                <h6 className="task-line-title">{task.Name || "Untitled Task"}</h6>
                                <span className="task-line-id">#{task.TaskId || "-"}</span>
                                <span className="task-line-category">
                                  {[task.CategoryName, task.SubCategoryName].filter(Boolean).join(" / ") || "-"}
                                </span>
                                <span className="task-chip task-chip-location">{task.Location || "-"}</span>
                              </div>
                              <div className="task-line-desc">{task.Description || "Routine maintenance check"}</div>
                            </div>

                            <div className="task-line-side">
                              <span className={`task-chip task-chip-status ${getStatusClass(task.TaskStatus)}`}>
                                {String(task.TaskStatus || "").trim().toLowerCase() === "pending" ? (
                                  <span className="task-status-dot" aria-hidden="true" />
                                ) : null}
                                {getDisplayStatus(task.TaskStatus)}
                              </span>
                              <div className="task-line-actions">
                                {isActionableStatus(task.TaskStatus) ? (
                                  <button
                                    className="btn btn-link task-action-remarks"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.ViewTask(task, "fmRemarks");
                                    }}
                                    title="Remarks"
                                    type="button"
                                  >
                                    <i className="fa fa-commenting-o" />
                                  </button>
                                ) : null}
                                {!!task.AssetId && (
                                  <button
                                    className="btn btn-link task-action-download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadQRCode({
                                        qrValue: String(task.QRCode || task.AssetId || "").trim(),
                                        name: task.Name || "Task",
                                        templatePath: "/Assets/task-template.png",
                                        fileName: `${task.Name || "Task"}_QR`,
                                      });
                                    }}
                                    title="Download QR"
                                    type="button"
                                  >
                                    <i className="fa fa-download" />
                                  </button>
                                )}
                                <button className="btn btn-link task-action-edit" onClick={(e) => { e.stopPropagation(); this.EditTask(task); }} title="Edit Task" type="button">
                                  <i className="fa fa-pencil-square-o" />
                                </button>
                                <button className="btn btn-link task-action-delete" onClick={(e) => { e.stopPropagation(); this.DeleteTask(task); }} title="Delete Task" type="button">
                                  <i className="fa fa-trash-o" />
                                </button>
                                {task.EntryType === "PPM" ? (
                                  <button className="btn btn-link task-action-add" onClick={(e) => { e.stopPropagation(); this.AddQuestion(task); }} title="Add Question" type="button">
                                    <i className="fa fa-plus-square-o" />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="task-line-bottom">
                            <span className="task-line-info-item">
                              <i className="fa fa-refresh" />
                              {task.OccurenceView || "-"}
                            </span>
                            <span className={`task-line-info-item task-priority ${getPriorityClass(task.TaskPriority)}`}>
                              {task.TaskPriority || "Normal Priority"}
                            </span>
                            <span className="task-line-info-item">
                              {task.AssignedTo || "-"}
                            </span>
                            <span className="task-line-info-item">
                              Due {getTaskDateDisplay(task.UpdatedOn)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 ? (
                    <div className="task-pager">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={currentPage <= 1}
                        onClick={() => this.setState({ tablePage: currentPage - 1 }, () => this.getTasks())}
                        type="button"
                      >
                        Prev
                      </button>
                      <span className="text-muted">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={currentPage >= totalPages}
                        onClick={() => this.setState({ tablePage: currentPage + 1 }, () => this.getTasks())}
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  ) : null}

                </>
              ) : null}
            </div>
          );
        })}
      </>
    );
  };
}
