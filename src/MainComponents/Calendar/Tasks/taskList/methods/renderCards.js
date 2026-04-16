import React from "react";
import moment from "moment";

const getStatusClass = (status) => String(status || "").toLowerCase().replace(/\s+/g, "-");
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

  tasks.forEach((task) => {
    const status = String(task?.TaskStatus || "").trim().toLowerCase();
    if (status === "completed" || status === "complete") completed += 1;
    else if (status === "pending") pending += 1;
    else if (status === "actionable" || status === "in-progress" || status === "in progress") actionable += 1;
  });

  return { completed, pending, actionable };
};

export default function attachRenderCards(TaskList) {
  TaskList.prototype.renderTaskCards = function () {
    const { data, searchTerm } = this.state;
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
          const isExpanded = activeDate === date;
          const { completed, pending, actionable } = getStatusCounts(tasks);
          const cardPageSize = Number(this.state.cardPageSize || 12);
          const cardPage = Number(this.state.cardPage || 1);
          const totalPages = Math.max(1, Math.ceil(tasks.length / cardPageSize));
          const currentPage = Math.min(cardPage, totalPages);
          const startIndex = (currentPage - 1) * cardPageSize;
          const pagedTasks = isExpanded ? tasks.slice(startIndex, startIndex + cardPageSize) : [];

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
                  <span className="badge badge-light border text-success">{completed} Completed</span>
                  <span className="badge badge-light border text-danger">{pending} Pending</span>
                  <span className="badge badge-light border text-info">{actionable} Actionable</span>
                  <span className="badge badge-light border text-muted">Total {tasks.length}</span>
                </div>
                <i className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-primary`} />
              </div>

              {isExpanded ? (
                <>
                  <div className="task-grid">
                    {pagedTasks.map((task, index) => (
                      <div
                        key={`${task.TaskId}-${index}`}
                        className={`task-card ${getStatusClass(task.TaskStatus)}`}
                        onClick={() => this.ViewTask(task)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") this.ViewTask(task);
                        }}
                      >
                        <div className="task-card-head">
                          <span>
                            {task.CategoryName} / {task.SubCategoryName}
                          </span>
                          <span className={`task-chip-status ${getStatusClass(task.TaskStatus)}`}>
                            {String(task.TaskStatus || "").trim().toLowerCase() === "pending" ? (
                              <span className="task-status-dot" aria-hidden="true" />
                            ) : null}
                            {getDisplayStatus(task.TaskStatus)}
                          </span>
                        </div>

                        <div className="task-card-body">
                          <div className="task-card-content">
                            <div className="task-card-title-group">
                              <h6 className="task-card-title">{task.Name || "Task"}</h6>
                              <p className="task-card-id">({task.TaskId})</p>
                            </div>

                            <div className="task-card-kv">
                              <span>Priority</span>
                              <b className={`task-priority ${getPriorityClass(task.TaskPriority)}`}>{task.TaskPriority || "-"}</b>
                              
                              <span>Assigned to</span>
                              <b>{task.AssignedTo || "-"}</b>
                              
                              <span>Location</span>
                              <b>{task.Location || "-"}</b>
                              
                              <span>Due date</span>
                              <b>{getTaskDateDisplay(task.UpdatedOn)}</b>
                            </div>
                          </div>

                          <div className="task-card-actions">
                            <div className="task-card-action-group">
                              <button
                                className="btn btn-link task-action-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.EditTask(task);
                                }}
                                title="Edit Task"
                                type="button"
                              >
                                <i className="fa fa-pencil-square-o" />
                              </button>
                              <button
                                className="btn btn-link task-action-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.DeleteTask(task);
                                }}
                                title="Delete Task"
                                type="button"
                              >
                                <i className="fa fa-trash-o" />
                              </button>
                            </div>
                            {task.EntryType === "PPM" ? (
                              <button
                                className="btn btn-link task-action-add"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.AddQuestion(task);
                                }}
                                title="Add Question"
                                type="button"
                              >
                                <i className="fa fa-plus-square-o" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tasks.length > cardPageSize ? (
                    <div className="task-pager">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={currentPage <= 1}
                        onClick={() => this.setState({ cardPage: currentPage - 1 })}
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
                        onClick={() => this.setState({ cardPage: currentPage + 1 })}
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
