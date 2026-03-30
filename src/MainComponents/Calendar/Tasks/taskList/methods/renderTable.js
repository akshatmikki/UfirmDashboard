import React from 'react';
import moment from 'moment';

export default function attachRenderTable(TaskList) {
    TaskList.prototype.renderTaskTable = function () {
      const { data, searchTerm } = this.state;
      const searchStr = String(searchTerm || "").trim().toLowerCase();
      const filteredData = searchStr
        ? data.filter((task) =>
            Object.values(task || {}).some((value) => {
              if (value === null || value === undefined || typeof value === "object") {
                return false;
              }
              return String(value).toLowerCase().includes(searchStr);
            }),
          )
        : data;
  
      if (filteredData.length === 0) {
        return (
          <div className="text-center p-5 w-100">
            <h5>No tasks found</h5>
          </div>
        );
      }
  
      // Grouping tasks by UpdatedOn
      const groupedData = filteredData.reduce((groups, task) => {
        const date = task.UpdatedOn;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(task);
        return groups;
      }, {});
  
      // Sort dates in ascending order
      const sortedDates = Object.keys(groupedData).sort((a, b) => {
        return moment(a, "YYYY-MM-DD").valueOf() - moment(b, "YYYY-MM-DD").valueOf();
      });
  
      const activeDate = this.state.expandedDate;
  
      return (
        <div className="container-fluid p-0">
          {sortedDates.map((date, gIndex) => {
            const isExpanded = activeDate === date;
            const tasks = groupedData[date];
            const completedCount = tasks.filter(t => t.TaskStatus === 'Completed').length;
            const pendingCount = tasks.filter(t => t.TaskStatus === 'Pending').length;
            const actionableCount = tasks.filter(t => t.TaskStatus === 'Actionable').length;
  
            return (
              <div key={gIndex} className="mb-4">
                <div
                  className="d-flex align-items-center mb-3 justify-content-between p-2"
                  style={{
                    borderBottom: "2px solid #336B93",
                    background: isExpanded ? "#f0f7ff" : "transparent",
                    cursor: "pointer",
                    userSelect: "none",
                    borderRadius: "8px 8px 0 0"
                  }}
                  onClick={() => this.toggleDateGroup(date)}
                >
                  <div className="d-flex align-items-center flex-wrap">
                    <i className="fa fa-calendar mr-2 text-primary" style={{ fontSize: "1.1rem" }}></i>
                    <h5 className="mb-0 font-weight-bold text-primary mr-3">{date}</h5>
                    <div className="d-flex align-items-center bg-white px-2 py-1 rounded shadow-sm border" style={{ fontSize: "12px" }}>
                      <span className="mr-3">
                        <i className="fa fa-check-circle text-success mr-1"></i>
                        <b>{completedCount}</b> Completed
                      </span>
                      <span className="mr-3">
                        <i className="fa fa-clock-o text-danger mr-1"></i>
                        <b>{pendingCount}</b> Pending
                      </span>
                      <span className="mr-3">
                        <i className="fa fa-clock-o text-danger mr-1"></i>
                        <b>{actionableCount}</b> Actionable
                      </span>
                      <span className="text-muted">
                        Total: <b>{tasks.length}</b>
                      </span>
                    </div>
                  </div>
                  <div className="mr-2">
                    <i
                      className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"} text-primary`}
                      style={{ transition: "all 0.3s ease" }}
                    ></i>
                  </div>
                </div>
  
                {isExpanded && (
                  <div className="animated fadeIn">
                    {(() => {
                      const tablePageSize = this.state.tablePageSize || 10;
                      const totalPages = Math.max(1, Math.ceil(tasks.length / tablePageSize));
                      const currentPage = Math.min(this.state.tablePage || 1, totalPages);
                      const startIndex = (currentPage - 1) * tablePageSize;
                      const pagedTasks = tasks.slice(startIndex, startIndex + tablePageSize);

                      return (
                        <>
                          {pagedTasks.map((task, index) => (
                      <div key={`${task.TaskId}-${startIndex + index}`} className="card mb-3 shadow-sm border" style={{ borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
                        <div className="card-body p-1">
                          {/* Row 1: Headers */}
                          {/* <div className="row no-gutters text-muted text-uppercase" style={{ fontSize: "11px", fontWeight: "700", background: "#f8f9fa", borderBottom: "1px solid #eee", padding: "8px 15px" }}>
                            <div className="col-4">Task Name (ID)</div>
                            <div className="col-2 text-center">Location</div>
                            <div className="col-3 text-center">Cat/Subcat</div>
                            <div className="col-3 text-center">Assign To</div>
                          </div> */}
                          {/* Row 2: Data */}
                          <div className="row no-gutters align-items-start" style={{ padding: "12px 15px 4px 15px" }}>
                            <div className="col-4">
                              <h6 className="mb-0 font-weight-bold" style={{ fontSize: "14px", color: "#336B93" }}>
                                {task.Name} <span className="text-muted font-weight-normal">({task.TaskId})</span>
                              </h6>
                            </div>
                            <div className="col-2 text-start" style={{ fontSize: "13px", fontWeight: "600", color: "#336B93" }}>
                              {task.Location}
                            </div>
                            <div className="col-3 text-start" style={{ fontSize: "13px" }}>
                              {task.CategoryName} / {task.SubCategoryName}
                            </div>
                            <div className="col-3 text-start" style={{ fontSize: "13px" }}>
                              <div className="d-flex align-items-center justify-content-center">
                                {/* <i className="fa fa-user-circle-o mr-1 text-muted"></i> */}
                                {task.AssignedTo}
                              </div>
                            </div>
                          </div>
                          {/* Row 3: Headers */}
                          {/* <div className="row no-gutters text-muted text-uppercase" style={{ fontSize: "11px", fontWeight: "700", background: "#f8f9fa", borderBottom: "1px solid #eee", padding: "8px 15px" }}>
                            <div className="col-4">Description</div>
                            <div className="col-2 text-center">Status</div>
                            <div className="col-3 text-center">Remarks</div>
                            <div className="col-3 text-center">Actions</div>
                          </div> */}
                          {/* Row 4: Data */}
                          <div className="row no-gutters align-items-start" style={{ padding: "4px 15px 12px 15px" }}>
                            <div className="col-4" style={{ fontSize: "13px" }}>
                              <div className="text-truncate" title={task.Description}>
                                {/* <i className="fa fa-info-circle mr-1 text-muted"></i>  */}{task.Description || "-"}
                              </div>
                            </div>
                            <div className="col-2 text-start">
                              <span className={`font-weight-bold ${task.TaskStatus === 'Completed' ? 'text-success' : task.TaskStatus === 'Pending' ? 'text-danger' : 'text-info'}`}
                                style={{ fontSize: "13px" }}>
                                {task.TaskStatus}
                              </span>
                            </div>
                            <div className="col-3 text-start" style={{ fontSize: "13px" }}>
                              <div className="text-truncate" title={task.Remarks || "-"}>
                                {task.Remarks || "-"}
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
                                {task.TimeFrom ? moment(task.TimeFrom, ["HH:mm:ss", "HH:mm"]).format("h:mm A") : "-"}
                              </div>
                            </div>
                            <div className="col-3 text-start">
                              <div className="d-flex justify-content-center align-items-center">
                                <button className="btn btn-sm btn-link text-info p-1 mr-2" onClick={() => this.ViewTask(task)} title="View Detail">
                                  <i className="fa fa-eye"></i>
                                </button>
                                <button className="btn btn-sm btn-link text-success p-1 mr-2" onClick={() => this.EditTask(task)} title="Edit Task">
                                  <i className="fa fa-edit"></i>
                                </button>
                                <button className="btn btn-sm btn-link text-danger p-1" onClick={() => this.DeleteTask(task)} title="Delete Task">
                                  <i className="fa fa-trash"></i>
                                </button>
                                {task.EntryType === "PPM" && (
                                  <button className="btn btn-sm btn-link text-primary p-1 ml-2" onClick={() => this.AddQuestion(task)} title="Add Question">
                                    <i className="fa fa-plus"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                          {tasks.length > tablePageSize && (
                            <div className="d-flex align-items-center justify-content-end mt-2 mb-3">
                              <button
                                className="btn btn-sm btn-outline-primary mr-2"
                                disabled={currentPage <= 1}
                                onClick={() => this.setState({ tablePage: currentPage - 1 })}
                              >
                                Prev
                              </button>
                              <span className="mx-1 text-muted" style={{ fontSize: "0.9rem" }}>
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-primary ml-2"
                                disabled={currentPage >= totalPages}
                                onClick={() => this.setState({ tablePage: currentPage + 1 })}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
  };
  
}
