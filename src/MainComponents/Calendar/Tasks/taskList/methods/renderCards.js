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

export default function attachRenderCards(TaskList) {
  TaskList.prototype.renderTaskCards = function () {
    const { data, searchTerm, cardPage = 1, cardPageSize = 12 } = this.state;
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

    const totalPages = Math.max(1, Math.ceil(filteredData.length / cardPageSize));
    const currentPage = Math.min(cardPage, totalPages);
    const startIndex = (currentPage - 1) * cardPageSize;
    const pagedTasks = filteredData.slice(startIndex, startIndex + cardPageSize);

    return (
      <>
        <div className="task-grid">
          {pagedTasks.map((task, index) => (
            <div
              key={`${task.TaskId}-${startIndex + index}`}
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
                <span className={`task-chip task-chip-status ${getStatusClass(task.TaskStatus)}`}>{task.TaskStatus || "Pending"}</span>
              </div>

              <div className="task-card-body">
                <div className="task-card-content">
                  <h6 className="task-card-title">{task.Name || "Task"}</h6>
                  <p className="task-card-id">({task.TaskId})</p>

                  <div className="task-card-kv">
                    <span>Priority</span>
                    <b className={`task-priority ${getPriorityClass(task.TaskPriority)}`}>{task.TaskPriority || "-"}</b>
                    <span>Assigned to</span>
                    <b>{task.AssignedTo || "-"}</b>
                    <span>Location</span>
                    <b>{task.Location || "-"}</b>
                    <span>Due date</span>
                    <b>{task.DateFrom ? moment(task.DateFrom).format("DD-MM-YYYY") : "-"}</b>
                  </div>
                </div>

                <div className="task-card-actions">
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

        {filteredData.length > cardPageSize ? (
          <div className="task-pager">
            <button className="btn btn-sm btn-outline-primary" disabled={currentPage <= 1} onClick={() => this.setState({ cardPage: currentPage - 1 })}>
              Prev
            </button>
            <span className="text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button className="btn btn-sm btn-outline-primary" disabled={currentPage >= totalPages} onClick={() => this.setState({ cardPage: currentPage + 1 })}>
              Next
            </button>
          </div>
        ) : null}
      </>
    );
  };
}
