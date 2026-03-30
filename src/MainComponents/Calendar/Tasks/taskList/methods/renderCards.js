import React from 'react';
import moment from 'moment';

export default function attachRenderCards(TaskList) {
    TaskList.prototype.renderTaskCards = function () {
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
                      const cardPageSize = this.state.cardPageSize || 9;
                      const totalPages = Math.max(1, Math.ceil(tasks.length / cardPageSize));
                      const currentPage = Math.min(this.state.cardPage || 1, totalPages);
                      const startIndex = (currentPage - 1) * cardPageSize;
                      const pagedTasks = tasks.slice(startIndex, startIndex + cardPageSize);

                      return (
                        <>
                          <div className="row">
                            {pagedTasks.map((task, index) => {
                      const formattedStartTime = task.TimeFrom
                        ? moment(task.TimeFrom, ["HH:mm:ss", "HH:mm"]).format("h:mm A")
                        : "-";

                      return (
                      <div className="col-lg-4 col-md-6 mb-2" key={`${task.TaskId}-${startIndex + index}`}>
                        <div className="card h-100 shadow-sm border"
                          style={{
                            borderRadius: "12px",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                            borderColor: "#e0e0e0",
                            background: "#fff"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = "translateY(-8px)";
                            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
                          }}
                        >
                          <div className="card-header d-flex justify-content-between align-items-center"
                            style={{
                              background: "#f8f9fa",
                              borderBottom: "1px solid #e0e0e0",
                              padding: "5px 10px 5px 16px"
                            }}>
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#336B93" }}>
                              Task Detail
                            </span>
  
                            <div className="d-flex align-items-center">
                              <i className="fa fa-eye text-info mr-3"
                                onClick={() => this.ViewTask(task)}
                                title="View Detail"
                                style={{ fontSize: "14px", cursor: "pointer" }}></i>
                              <i className="fa fa-edit text-success mr-3"
                                onClick={() => this.EditTask(task)}
                                title="Edit Task"
                                style={{ fontSize: "14px", cursor: "pointer" }}></i>
                              <i className="fa fa-trash text-danger mr-3"
                                onClick={() => this.DeleteTask(task)}
                                title="Delete Task"
                                style={{ fontSize: "14px", cursor: "pointer" }}></i>
                              {task.EntryType === "PPM" && (
                                <i className="fa fa-plus text-primary"
                                  onClick={() => this.AddQuestion(task)}
                                  title="Add Question"
                                  style={{ fontSize: "14px", cursor: "pointer" }}></i>
                              )}
                            </div>
  
                            <span style={{
                              fontSize: "13px",
                              fontWeight: "bold",
                              color: task.TaskStatus === 'Completed' ? '#28a745' : task.TaskStatus === 'Pending' ? '#dc3545' : '#17a2b8'
                            }}>
                              {task.TaskStatus}
                            </span>
                          </div>
                          <div className="card-body p-2" style={{ paddingLeft: "16px", paddingTop: "8px", paddingBottom: "8px" }}>
                            <div className="mb-1 d-flex justify-content-between align-items-start" style={{ minHeight: "35px" }}>
                              <div style={{ flex: 1, paddingRight: "8px", minHeight: "56px" }}>
                                <h6 className="card-title mb-0 text-dark font-weight-bold"
                                  style={{
                                    fontSize: "13px",
                                    lineHeight: "1.3",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}>
                                  {task.Name}
                                </h6>
                                <div style={{ color: "#666", fontWeight: "normal", fontSize: "12px", marginTop: "1px" }}>({task.TaskId})</div>
                              </div>
                                <div
                                  style={{
                                    maxWidth: "46%",
                                    minWidth: 0,
                                    marginLeft: "8px",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-block",
                                      width: "fit-content",
                                      maxWidth: "100%",
                                      fontWeight: "600",
                                      fontSize: "11px",
                                      color: "#336B93",
                                      background: "#eef4f8",
                                    padding: "2px 9px",
                                    borderRadius: "999px",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: "1.25",
                                    textAlign: "left",
                                  }}
                                >
                                  {task.Location}
                                </span>
                              </div>
                            </div>
                            <div className="task-details mt-0 py-0" style={{ fontSize: "11px", color: "#555", background: "#fcfcfc", borderRadius: "8px", paddingLeft: "4px" }}>
                              <div className="row no-gutters text-left">
                                <div className="col-6 px-2">
                                  <div className="mb-1 d-flex align-items-start justify-content-start" title={task.CategoryName + "/" + task.SubCategoryName} style={{ textAlign: "left" }}>
                                    <i className="fa fa-tag mr-1 text-muted" style={{ fontSize: "10px", marginTop: "4px" }}></i>
                                    <span>{task.CategoryName} / {task.SubCategoryName}</span>
                                  </div>
                                  <div className="mb-0 text-muted d-flex align-items-start justify-content-start" style={{ fontSize: "11px", textAlign: "left" }}>
                                    <i className="fa fa-refresh mr-1" style={{ fontSize: "10px", marginTop: "3px" }}></i>
                                    <span>{task.OccurenceView}</span>
                                  </div>
                                  <div className="mb-0 text-muted d-flex align-items-start justify-content-start" style={{ fontSize: "11px", textAlign: "left" }}>
                                    <i className="fa fa-clock-o mr-1" style={{ fontSize: "10px", marginTop: "3px" }}></i>
                                    <span>Start: {formattedStartTime}</span>
                                  </div>
                                </div>
                                <div className="col-6 px-2 border-left" style={{ borderColor: "#eee !important" }}>
                                  <div className="mb-1 d-flex align-items-start justify-content-start" title={task.AssignedTo} style={{ textAlign: "left" }}>
                                    <i className="fa fa-user mr-1 text-muted" style={{ fontSize: "10px", marginTop: "4px" }}></i>
                                    <span>{task.AssignedTo}</span>
                                  </div>
                                  {task.Remarks !== "All" && (
                                    <div className="mb-1 text-muted d-flex align-items-start justify-content-start" title={task.Remarks} style={{ fontSize: "11px", textAlign: "left" }}>
                                      <i className="fa fa-commenting-o mr-1" style={{ fontSize: "10px", marginTop: "3px" }}></i>
                                      <span>{task.Remarks}</span>
                                    </div>
                                  )}
                                  <div className="mb-0 text-muted d-flex align-items-start justify-content-start" title={task.Description} style={{ fontStyle: "italic", fontSize: "11px", textAlign: "left" }}>
                                    <i className="fa fa-info-circle mr-1" style={{ fontSize: "10px", marginTop: "3px" }}></i>
                                    <span className="text-truncate" style={{ maxWidth: "100%" }}>{task.Description}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                          </div>

                          {tasks.length > cardPageSize && (
                            <div className="d-flex align-items-center justify-content-end mt-2 mb-3">
                              <button
                                className="btn btn-sm btn-outline-primary mr-2"
                                disabled={currentPage <= 1}
                                onClick={() => this.setState({ cardPage: currentPage - 1 })}
                              >
                                Prev
                              </button>
                              <span className="mx-1 text-muted" style={{ fontSize: "0.9rem" }}>
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-primary ml-2"
                                disabled={currentPage >= totalPages}
                                onClick={() => this.setState({ cardPage: currentPage + 1 })}
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
