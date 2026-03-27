import React from "react";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import Button from "../../../../../ReactComponents/Button/Button";
import TaskListCounters from "./TaskListCounters";
import TaskListModals from "./TaskListModals";
import "./TaskListView.css";

export default function TaskListView({ ctx }) {
  const showResetButton = !!ctx.state.filtered;

  return (
    <div>
      {ctx.state.PageMode === "Home" && (
        <div className="row">
          <LoadingOverlay
            active={ctx.state.loading}
            spinner={<PropagateLoader color="#336B93" size={30} />}
          >
            <div className="col-12">
              <div
                className="card p-2"
                style={{ borderRadius: "12px", border: "1px solid #dde4ec" }}
              >
                <TaskListCounters
                  completedTasks={ctx.state.completedTasks}
                  pendingTasks={ctx.state.pendingTasks}
                  actionableTasks={ctx.state.actionableTasks}
                />

                <div className="card-header p-2 task-list-filter-shell">
                  <div className="d-flex w-100 flex-column">
                    <div
                      className="d-flex flex-wrap align-items-center justify-content-between mb-2 task-list-toolbar"
                    >
                      <div className="d-flex align-items-center flex-wrap task-list-toolbar-seq">
                        <div
                          className="d-flex mr-3 bg-white border shadow-sm"
                          style={{ borderRadius: "8px", padding: "2px" }}
                        >
                          <button
                            className={`btn btn-sm ${
                              ctx.state.viewMode === "card"
                                ? "btn-primary shadow-sm"
                                : "bg-transparent text-muted text-hover-primary"
                            }`}
                            onClick={() => ctx.setState({ viewMode: "card" })}
                            title="Card View"
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              outline: "none",
                            }}
                          >
                            <i className="fa fa-th-large"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${
                              ctx.state.viewMode === "table"
                                ? "btn-primary shadow-sm"
                                : "bg-transparent text-muted text-hover-primary"
                            }`}
                            onClick={() => ctx.setState({ viewMode: "table" })}
                            title="Table View"
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              outline: "none",
                            }}
                          >
                            <i className="fa fa-table"></i>
                          </button>
                        </div>

                        <div className="input-group" style={{ maxWidth: "250px" }}>
                          <div className="input-group-prepend">
                            <span className="input-group-text bg-white border-right-0">
                              <i className="fa fa-search text-muted"></i>
                            </span>
                          </div>
                          <input
                            type="text"
                            className="form-control border-left-0"
                            placeholder="Search tasks..."
                            value={ctx.state.searchTerm}
                            onChange={(e) =>
                              ctx.setState({ searchTerm: e.target.value })
                            }
                          />
                        </div>
                        <div
                          className="input-group task-date-range-group"
                        >
                          <div className="input-group-prepend task-date-range-icon">
                            <span className="input-group-text bg-white">
                              <i className="fa fa-calendar-alt"></i>
                            </span>
                          </div>
                          <input
                            type="text"
                            className="form-control bg-white task-date-range-input"
                            id="dataRange"
                            placeholder="Select date range"
                          />
                        </div>
                        <button
                          className="btn btn-outline-primary rounded shadow-sm d-flex align-items-center task-toolbar-btn"
                          type="button"
                          onClick={() =>
                            ctx.setState({
                              showFilterPanel: !ctx.state.showFilterPanel,
                            })
                          }
                        >
                          <i className="fa fa-filter mr-1"></i>
                          Filters
                          <i
                            className={`fa ml-2 ${
                              ctx.state.showFilterPanel
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            }`}
                          />
                        </button>

                        <div className="task-apply-reset-toggle">
                          {showResetButton ? (
                            <Button
                              id="btnResetFilter"
                              Action={ctx.Reset}
                              ClassName="btn btn-danger d-flex align-items-center task-toolbar-btn task-toggle-btn task-toggle-single"
                              Text={
                                <>
                                  <i className="fa fa-times mr-1"></i> Reset
                                </>
                              }
                              title="Clear all filters"
                            />
                          ) : (
                            <Button
                              id="btnApplyFilter"
                              Action={ctx.Filter}
                              ClassName="btn btn-primary d-flex align-items-center task-toolbar-btn task-toggle-btn task-toggle-single"
                              Text={
                                <>
                                  <i className="fa fa-check mr-1"></i> Apply
                                </>
                              }
                              title="Apply filters"
                            />
                          )}
                        </div>
                        <button
                          className="btn btn-outline-success rounded shadow-sm d-flex align-items-center task-toolbar-btn"
                          onClick={ctx.handleExportWithQuestions}
                          disabled={ctx.state.exporting}
                        >
                          {ctx.state.exporting ? (
                            <>
                              <i className="fa fa-spinner fa-spin mr-1"></i>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-file-excel-o mr-1"></i>
                              Export
                            </>
                          )}
                        </button>

                        <Button
                          id="btnNewTask"
                          Action={ctx.AddNew}
                          ClassName="btn btn-success rounded shadow-sm d-flex align-items-center px-3 task-toolbar-btn task-add-btn"
                          Icon={<i className="fa fa-plus mr-1"></i>}
                          Text={<span style={{ fontWeight: 600 }}>Add Task</span>}
                          title="Add a new task"
                        />
                      </div>
                    </div>

                    {ctx.state.showFilterPanel ? (
                      <div
                        className="p-2 mb-2 task-filter-panel"
                      >
                        <div className="row">
                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              id="dllCategory"
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({
                                  selectedCategoryId: e.target.value,
                                  filtered: false,
                                })
                              }
                              value={ctx.state.selectedCategoryId}
                            >
                              <option value={0}>Select Category</option>
                              {ctx.state.CategoryData
                                ? ctx.state.CategoryData.map((e, key) => (
                                    <option key={key} value={e.Id}>
                                      {e.Name}
                                    </option>
                                  ))
                                : null}
                            </select>
                          </div>

                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({
                                  selectedSubCategoryId: e.target.value,
                                  filtered: false,
                                })
                              }
                              value={ctx.state.selectedSubCategoryId}
                            >
                              <option value={0}>Sub Category</option>
                              {ctx.state.subCategory &&
                                ctx.state.subCategory.map((e, key) => (
                                  <option key={key} value={e.SubCategoryId}>
                                    {e.SubCategoryName}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({ occurance: e.target.value, filtered: false })
                              }
                              value={ctx.state.occurance}
                            >
                              <option value="">Repeat</option>
                              {ctx.state.frequencyData.map((e, key) => (
                                <option key={key} value={e.Occurence}>
                                  {e.Name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({ taskStatus: e.target.value, filtered: false })
                              }
                              value={ctx.state.taskStatus}
                            >
                              <option value="None">Task Status</option>
                              <option value="Pending">Pending</option>
                              <option value="Complete">Complete</option>
                              <option value="Actionable">Actionable</option>
                            </select>
                          </div>

                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({ taskPriority: e.target.value, filtered: false })
                              }
                              value={ctx.state.taskPriority}
                            >
                              <option value={0}>Task Priority</option>
                              {ctx.state.taskPriorityList &&
                                ctx.state.taskPriorityList.map((e, key) => (
                                  <option key={key} value={e.Id}>
                                    {e.Name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="col-xl-2 col-md-4 col-sm-6 mb-2">
                            <select
                              className="form-control task-filter-select"
                              onChange={(e) =>
                                ctx.setState({ assignTo: e.target.value, filtered: false })
                              }
                              value={ctx.state.assignTo}
                            >
                              <option value={0}>Assigned To</option>
                              {ctx.state.dashboardAssign &&
                                ctx.state.dashboardAssign.map((e, key) => (
                                  <option key={key} value={e.assignId}>
                                    {e.assignName}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : null}

                  </div>
                </div>

                <div className="card-body pt-2">
                  <LoadingOverlay
                    active={ctx.state.dataLoading}
                    spinner={<PropagateLoader color="#336B93" size={30} />}
                  >
                    <div style={{ minHeight: "400px" }}>
                      {ctx.state.viewMode === "card"
                        ? ctx.renderTaskCards()
                        : ctx.renderTaskTable()}
                    </div>
                  </LoadingOverlay>
                </div>
              </div>
            </div>
          </LoadingOverlay>
        </div>
      )}

      <TaskListModals ctx={ctx} />
    </div>
  );
}
