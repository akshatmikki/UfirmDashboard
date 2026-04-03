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

export default function attachRenderTable(TaskList) {
  TaskList.prototype.renderTaskTable = function () {
    const { data, searchTerm, tablePage = 1, tablePageSize = 12 } = this.state;
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

    const totalPages = Math.max(1, Math.ceil(filteredData.length / tablePageSize));
    const currentPage = Math.min(tablePage, totalPages);
    const startIndex = (currentPage - 1) * tablePageSize;
    const pagedTasks = filteredData.slice(startIndex, startIndex + tablePageSize);

    return (
      <>
        <div className="task-list-stack">
          {pagedTasks.map((task, index) => (
            <div
              key={`${task.TaskId}-${startIndex + index}`}
              className={`task-line-item ${getStatusClass(task.TaskStatus)}`}
              onClick={() => this.ViewTask(task)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") this.ViewTask(task);
              }}
            >
              <div className="task-line-top">
                <div>
                  <h6 className="task-line-title">
                    {task.Name} <small>({task.TaskId})</small>
                  </h6>
                  <div className="task-meta-inline">
                    {task.CategoryName} / {task.SubCategoryName}
                  </div>
                </div>

                <span className="task-chip task-chip-location">{task.Location || "-"}</span>

                <div className="d-flex align-items-center justify-content-end">
                  <span className={`task-chip task-chip-status ${getStatusClass(task.TaskStatus)}`}>{task.TaskStatus || "Pending"}</span>
                  <div className="task-line-actions ml-3">
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

              <div className="task-line-desc">{task.Description || "Routine maintenance check"}</div>

              <div className="task-line-bottom">
                <span>
                  <i className="fa fa-refresh mr-1" />
                  {task.OccurenceView || "-"}
                </span>
                <span className={`task-priority ${getPriorityClass(task.TaskPriority)}`}>{task.TaskPriority || "Normal Priority"}</span>
                <span>{task.AssignedTo || "-"}</span>
                <span>Due {task.DateFrom ? moment(task.DateFrom).format("DD-MM-YYYY") : "-"}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length > tablePageSize ? (
          <div className="task-pager">
            <button className="btn btn-sm btn-outline-primary" disabled={currentPage <= 1} onClick={() => this.setState({ tablePage: currentPage - 1 })}>
              Prev
            </button>
            <span className="text-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button className="btn btn-sm btn-outline-primary" disabled={currentPage >= totalPages} onClick={() => this.setState({ tablePage: currentPage + 1 })}>
              Next
            </button>
          </div>
        ) : null}
      </>
    );
  };
}
