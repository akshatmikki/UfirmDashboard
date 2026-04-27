import React from "react";
import moment from "moment";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Button from "../../../../../ReactComponents/Button/Button";
import TaskListCounters from "./TaskListCounters";
import TaskListModals from "./TaskListModals";
import "./TaskListView.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 10;
  const end = currentYear + 10;
  const years = [];
  for (let year = start; year <= end; year += 1) years.push(year);
  return years;
};

export default function TaskListView({ ctx }) {
  const showResetButton = !!ctx.state.filtered;
  const selectedCategory = (ctx.state.CategoryData || []).find(
    (item) => String(item.Id) === String(ctx.state.selectedCategoryId)
  );
  const selectedPriority = (ctx.state.taskPriorityList || []).find(
    (item) => String(item.Id) === String(ctx.state.taskPriority)
  );
  const selectedSubCategory = (ctx.state.subCategory || []).find(
    (item) => String(item.SubCategoryId) === String(ctx.state.selectedSubCategoryId)
  );
  const selectedFrequency = (ctx.state.frequencyData || []).find(
    (item) => String(item.Occurence) === String(ctx.state.occurance)
  );
  const selectedAssignee = (ctx.state.dashboardAssign || []).find(
    (item) => String(item.assignId) === String(ctx.state.assignTo)
  );
  const activeFilterCount = [
    ctx.state.selectedCategoryId && Number(ctx.state.selectedCategoryId) > 0,
    ctx.state.selectedSubCategoryId && Number(ctx.state.selectedSubCategoryId) > 0,
    ctx.state.occurance && String(ctx.state.occurance).trim() !== "",
    ctx.state.taskPriority && Number(ctx.state.taskPriority) > 0,
    ctx.state.assignTo && Number(ctx.state.assignTo) > 0,
  ].filter(Boolean).length;
  const hasDateRange = !!ctx.state.filterFromDate && !!ctx.state.filterToDate;
  const showSelectedFiltersBar = !ctx.state.showFilterPanel && (ctx.state.filtered || activeFilterCount > 0);

  const fromDate = ctx.state.filterFromDate ? moment(ctx.state.filterFromDate, "YYYY-MM-DD").toDate() : null;
  const toDate = ctx.state.filterToDate ? moment(ctx.state.filterToDate, "YYYY-MM-DD").toDate() : null;
  const years = getYearOptions();
  const formattedFromDate = fromDate ? moment(fromDate).format("DD/MM/YYYY") : "";
  const formattedToDate = toDate ? moment(toDate).format("DD/MM/YYYY") : "";
  const assigneeInitial = selectedAssignee?.assignName ? selectedAssignee.assignName.charAt(0).toUpperCase() : "S";

  const renderCompactHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => (
    <div className="task-cal-head">
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="task-cal-nav">
        <i className="fa fa-angle-left" />
      </button>
      <div className="task-cal-selects">
        <select
          value={MONTHS[date.getMonth()]}
          onChange={({ target: { value } }) => changeMonth(MONTHS.indexOf(value))}
        >
          {MONTHS.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        <select value={date.getFullYear()} onChange={({ target: { value } }) => changeYear(Number(value))}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="task-cal-nav">
        <i className="fa fa-angle-right" />
      </button>
    </div>
  );

  return (
    <div>
      {ctx.state.PageMode === "Home" && (
        <div className="row">
          <LoadingOverlay active={ctx.state.loading} spinner={<PropagateLoader color="#336B93" size={30} />}>
            <div className="col-12">
              <div className="card p-2 task-planner-shell">
                <TaskListCounters
                  tasks={ctx.state.data}
                  completedTasks={ctx.state.completedTasks}
                  pendingTasks={ctx.state.pendingTasks}
                  actionableTasks={ctx.state.actionableTasks}
                  onStatusClick={(status) => ctx.handleStatusFilter?.(status)}
                />

                <div className="card-header p-2 task-list-filter-shell">
                  <div className="task-planner-toolbar">
                    <div className="input-group task-search-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">
                          <i className="fa fa-search text-muted" />
                        </span>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name or ID"
                        value={ctx.state.searchTerm}
                        onChange={(e) => ctx.setState({ searchTerm: e.target.value, cardPage: 1, tablePage: 1 })}
                      />
                    </div>

                    <div className="task-toolbar-actions">
                      <div className="task-view-switch">
                        <button
                          className={`task-view-switch-btn ${ctx.state.viewMode === "table" ? "active" : ""}`}
                          onClick={() => ctx.setState({ viewMode: "table" })}
                          title="List view"
                          type="button"
                        >
                          <i className="fa fa-list-ul" />
                        </button>
                        <button
                          className={`task-view-switch-btn ${ctx.state.viewMode === "card" ? "active" : ""}`}
                          onClick={() => ctx.setState({ viewMode: "card" })}
                          title="Card view"
                          type="button"
                        >
                          <i className="fa fa-th-large" />
                        </button>
                      </div>

                      <button
                        className="btn btn-outline-secondary d-flex align-items-center task-toolbar-btn"
                        type="button"
                        onClick={() => ctx.setState({ showFilterPanel: !ctx.state.showFilterPanel })}
                      >
                        <i className="fa fa-sliders mr-1" />
                        Filter
                        {activeFilterCount > 0 ? <span className="task-filter-count">{activeFilterCount}</span> : null}
                      </button>

                      <button
                        className="btn btn-outline-secondary d-flex align-items-center task-toolbar-btn"
                        onClick={ctx.handleExportWithQuestions}
                        disabled={ctx.state.exporting}
                        type="button"
                      >
                        {ctx.state.exporting ? (
                          <>
                            <i className="fa fa-spinner fa-spin mr-1" />
                            Exporting {ctx.state.exportProcessed || 0}/{ctx.state.exportTotal || 0}
                          </>
                        ) : (
                          <>
                            <i className="fa fa-external-link mr-1" />
                            Export
                          </>
                        )}
                      </button>

                      <Button
                        id="btnNewTask"
                        Action={ctx.AddNew}
                        ClassName="btn btn-primary d-flex align-items-center px-3 task-toolbar-btn task-add-btn"
                        Icon={<i className="fa fa-plus mr-1" />}
                        Text={<span style={{ fontWeight: 600 }}>Add Task</span>}
                        title="Add a new task"
                      />
                    </div>
                  </div>

                  <div style={{ display: "none" }}>
                    <input id="dataRange" type="text" />
                  </div>

                  {ctx.state.showFilterPanel ? (
                    <div className="p-2 mb-2 mt-2 task-filter-panel task-filter-panel-advanced">
                      <div className="task-filter-head">
                        <h6>Filters</h6>
                        <button className="btn btn-link p-0" type="button" onClick={ctx.Reset}>
                          <i className="fa fa-times mr-1" />
                          Reset All
                        </button>
                      </div>

                      <div className="task-filter-grid">
                        <div className="task-filter-col">
                          <p className="task-filter-group-title">Date range</p>
                          <div className="task-filter-date-row">
                            <div className="task-filter-date-picker-wrap">
                              <ReactDatePicker
                                className="form-control task-filter-select task-filter-date-picker"
                                selected={fromDate}
                                dateFormat="dd-MM-yyyy"
                                renderCustomHeader={renderCompactHeader}
                                onChange={(d) =>
                                  ctx.setState({
                                    filterFromDate: d ? moment(d).format("YYYY-MM-DD") : "",
                                    filtered: false,
                                  })
                                }
                              />
                              <i className="fa fa-calendar-o task-filter-date-icon" />
                            </div>
                            <span className="task-filter-to-text">to</span>
                            <div className="task-filter-date-picker-wrap">
                              <ReactDatePicker
                                className="form-control task-filter-select task-filter-date-picker"
                                selected={toDate}
                                dateFormat="dd-MM-yyyy"
                                minDate={fromDate || undefined}
                                renderCustomHeader={renderCompactHeader}
                                onChange={(d) =>
                                  ctx.setState({
                                    filterToDate: d ? moment(d).format("YYYY-MM-DD") : "",
                                    filtered: false,
                                  })
                                }
                              />
                              <i className="fa fa-calendar-o task-filter-date-icon" />
                            </div>
                          </div>

                          <p className="task-filter-group-title">Category</p>
                          <div className="task-filter-chip-wrap">
                            {(ctx.state.CategoryData || []).map((item) => (
                              <button
                                key={item.Id}
                                type="button"
                                className={`task-filter-chip ${String(ctx.state.selectedCategoryId) === String(item.Id) ? "active" : ""}`}
                                onClick={() =>
                                  ctx.setState({
                                    selectedCategoryId: String(ctx.state.selectedCategoryId) === String(item.Id) ? 0 : item.Id,
                                    selectedSubCategoryId: 0,
                                    filtered: false,
                                  })
                                }
                              >
                                {item.Name}
                              </button>
                            ))}
                          </div>

                          <p className="task-filter-group-title">Subcategory</p>
                          <div className="task-filter-chip-wrap">
                            {(ctx.state.subCategory || []).length === 0 ? (
                              <span className="task-filter-empty">Select a category to view subcategories</span>
                            ) : (
                              (ctx.state.subCategory || []).map((item) => (
                                <button
                                  key={item.SubCategoryId}
                                  type="button"
                                  className={`task-filter-chip ${String(ctx.state.selectedSubCategoryId) === String(item.SubCategoryId) ? "active" : ""}`}
                                  onClick={() =>
                                    ctx.setState({
                                      selectedSubCategoryId:
                                        String(ctx.state.selectedSubCategoryId) === String(item.SubCategoryId) ? 0 : item.SubCategoryId,
                                      filtered: false,
                                    })
                                  }
                                >
                                  {item.SubCategoryName}
                                </button>
                              ))
                            )}
                          </div>

                        </div>

                        <div className="task-filter-col">
                          <p className="task-filter-group-title">Assigned to</p>
                          <select
                            className="form-control task-filter-select"
                            onChange={(e) => ctx.setState({ assignTo: e.target.value, filtered: false })}
                            value={ctx.state.assignTo}
                          >
                            <option value={0}>Technician name</option>
                            {(ctx.state.dashboardAssign || []).map((item) => (
                              <option key={item.assignId} value={item.assignId}>
                                {item.assignName}
                              </option>
                            ))}
                          </select>

                          <p className="task-filter-group-title">Frequency</p>
                          <div className="task-filter-chip-wrap">
                            {(ctx.state.frequencyData || []).length === 0 ? (
                              <span className="task-filter-empty">No frequency data found</span>
                            ) : (
                              (ctx.state.frequencyData || []).map((item) => (
                                <button
                                  key={item.Occurence || item.Name}
                                  type="button"
                                  className={`task-filter-chip ${String(ctx.state.occurance) === String(item.Occurence) ? "active" : ""}`}
                                  onClick={() =>
                                    ctx.setState({
                                      occurance: String(ctx.state.occurance) === String(item.Occurence) ? "" : item.Occurence,
                                      filtered: false,
                                    })
                                  }
                                >
                                  {item.Name}
                                </button>
                              ))
                            )}
                          </div>

                          <p className="task-filter-group-title">Priority</p>
                          <div className="task-filter-chip-wrap">
                            {(ctx.state.taskPriorityList || []).map((item) => (
                              <button
                                key={item.Id}
                                type="button"
                                className={`task-filter-chip ${String(ctx.state.taskPriority) === String(item.Id) ? "active" : ""}`}
                                onClick={() =>
                                  ctx.setState({
                                    taskPriority: String(ctx.state.taskPriority) === String(item.Id) ? 0 : item.Id,
                                    filtered: false,
                                  })
                                }
                              >
                                {item.Name}
                              </button>
                            ))}
                          </div>

                          <div className="task-filter-actions">
                            <Button
                              id="btnApplyFilter"
                              Action={ctx.Filter}
                              ClassName="btn btn-primary d-flex align-items-center task-toolbar-btn"
                              Text={
                                <>
                                  <i className="fa fa-check mr-1" /> Apply Filter
                                </>
                              }
                              title="Apply filters"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showSelectedFiltersBar ? (
                    <div className="task-selected-wrap">
                      <div className="task-selected-top">
                        <div className="task-selected-dates">
                          {hasDateRange ? (
                            <>
                              <span className="task-selected-date-pill">
                                <i className="fa fa-calendar-o mr-1" />
                                {formattedFromDate}
                              </span>
                              <span className="task-selected-to">to</span>
                              <span className="task-selected-date-pill">
                                <i className="fa fa-calendar-o mr-1" />
                                {formattedToDate}
                              </span>
                            </>
                          ) : null}
                        </div>

                        {selectedAssignee ? (
                          <div className="task-selected-assignee">
                            <span className="task-selected-assignee-avatar">{assigneeInitial}</span>
                            <span>{selectedAssignee.assignName}</span>
                            <i className="fa fa-angle-up ml-auto" />
                          </div>
                        ) : null}
                      </div>

                      <div className="task-active-filters">
                        {selectedCategory ? <span className="task-active-chip"><i className="fa fa-times mr-1" />{selectedCategory.Name}</span> : null}
                        {selectedSubCategory ? <span className="task-active-chip"><i className="fa fa-times mr-1" />{selectedSubCategory.SubCategoryName}</span> : null}
                        {selectedFrequency ? <span className="task-active-chip"><i className="fa fa-times mr-1" />{selectedFrequency.Name}</span> : null}
                        {selectedPriority ? <span className="task-active-chip"><i className="fa fa-times mr-1" />{selectedPriority.Name}</span> : null}
                        <button className="btn btn-link task-active-reset" type="button" onClick={ctx.Reset}>
                          <i className="fa fa-times mr-1" />
                          Reset all
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="card-body pt-2">
                  <LoadingOverlay active={ctx.state.dataLoading} spinner={<PropagateLoader color="#336B93" size={30} />}>
                    <div className="task-main-content-area">
                      {ctx.state.viewMode === "card" ? ctx.renderTaskCards() : ctx.renderTaskTable()}
                    </div>
                  </LoadingOverlay>
                </div>
              </div>
            </div>
          </LoadingOverlay>
        </div>
      )}

      <TaskListModals ctx={ctx} />

      {ctx.state.deleteConfirmTask ? (
        <div className="task-delete-overlay" role="dialog" aria-modal="true">
          <div className="task-delete-modal">
            <div className="task-delete-head">
              <div className="task-delete-title-wrap">
                <span className="task-delete-icon">
                  <i className="fa fa-exclamation-triangle" />
                </span>
                <h4>Delete Task</h4>
              </div>
              <button type="button" className="task-delete-close" onClick={ctx.cancelDeleteTask}>
                <i className="fa fa-times" />
              </button>
            </div>

            <div className="task-delete-body">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="task-delete-name">{ctx.state.deleteConfirmTask.Name || "Task"}</div>
            </div>

            <div className="task-delete-foot">
              <button type="button" className="btn btn-outline-secondary" onClick={ctx.cancelDeleteTask}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={ctx.confirmDeleteTask}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
