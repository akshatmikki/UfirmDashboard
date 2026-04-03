import React from "react";
import moment from "moment";

export default function createInitialState(ctx) {
  return {
    columns: [
      { Header: "Task Id", accessor: "TaskId" },
      { Header: "Due Date", accessor: "DateFrom" },
      { Header: "Category", accessor: "CategoryName" },
      { Header: "Sub Category", accessor: "SubCategoryName" },
      { Header: "Task Name", accessor: "Name" },
      { Header: "Occurence", accessor: "OccurenceView" },
      { Header: "Start Time", accessor: "TimeFrom" },
      { Header: "UpdatedOn", accessor: "UpdatedOn" },
      { Header: "Task Status", accessor: "TaskStatus" },
      { Header: "Task Priority", accessor: "TaskPriority" },
      { Header: "Remarks", accessor: "Remarks" },
      {
        Header: "Action",
        Cell: (data) => (
          <div style={{ display: "flex" }}>
            <button
              className="btn btn-sm btn-info"
              onClick={ctx.ViewTask.bind(ctx, data.cell.row.original)}
              title="View"
              style={{ marginRight: "5px" }}
            >
              <i className="fa fa-eye" />
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={ctx.EditTask.bind(ctx, data.cell.row.original)}
              title="Edit"
              style={{ marginRight: "5px" }}
            >
              <i className="fa fa-edit" />
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={ctx.DeleteTask.bind(ctx, data.cell.row.original)}
              title="Delete"
            >
              <i className="fa fa-trash" />
            </button>
          </div>
        ),
      },
    ],
    columnsWithoutDueDate: [
      { Header: "Task Id", accessor: "TaskId" },
      { Header: "Category", accessor: "CategoryName" },
      { Header: "Sub Category", accessor: "SubCategoryName" },
      { Header: "Task Name", accessor: "Name" },
      { Header: "Occurence", accessor: "OccurenceView" },
      { Header: "Start Time", accessor: "TimeFrom" },
      { Header: "UpdatedOn", accessor: "UpdatedOn" },
      { Header: "Task Status", accessor: "TaskStatus" },
      { Header: "Task Priority", accessor: "TaskPriority" },
      {
        Header: "Action",
        Cell: (data) => (
          <div style={{ display: "flex" }}>
            <button
              className="btn btn-sm btn-primary"
              onClick={ctx.AddQuestion.bind(ctx, data.cell.row.original)}
              title="Add"
              style={{ marginRight: "5px" }}
            >
              <i className="fa fa-plus" />
            </button>
            <button
              className="btn btn-sm btn-info"
              onClick={ctx.ViewTask.bind(ctx, data.cell.row.original)}
              title="View"
              style={{ marginRight: "5px" }}
            >
              <i className="fa fa-eye" />
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={ctx.EditTask.bind(ctx, data.cell.row.original)}
              title="View"
              style={{ marginRight: "5px" }}
            >
              <i className="fa fa-edit" />
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={ctx.DeleteTask.bind(ctx, data.cell.row.original)}
              title="View"
            >
              <i className="fa fa-trash" />
            </button>
          </div>
        ),
      },
    ],
    data: [],
    CategoryData: [],
    selectedCategoryId: "",
    selectedSubCategoryId: "",
    usersList: [],
    userIds: "",
    loading: false,
    dataLoading: false,
    showAddModal: false,
    showEditModal: false,
    openAddQuestion: false,
    PageMode: "Home",
    showTaskModal: false,
    actionVisible: false,
    taskId: "",
    taskName: "",
    rowData: {},
    subCategory: [],
    filtered: false,
    occurance: "",
    assignTo: "",
    assign: [],
    dashboardAssign: [],
    taskPriorityList: [],
    taskPriority: "",
    filterFromDate: "",
    filterToDate: "",
    taskStatus: "None",
    startDate: moment().clone().startOf("month"),
    endDate: moment().clone().endOf("month"),
    propertyId: 0,
    propertyData: [],
    header: [
      "Task Id",
      "Location",
      "Category",
      "Sub Category",
      "Task Name",
      "Occurence",
      "Start Time",
      "Updated On",
      "Task Status",
    ],
    pendingTasks: 0,
    completedTasks: 0,
    actionableTasks: 0,
    assignedProperty: [],
    exporting: false,
    frequencyData: [],
    expandedDate: null,
    searchTerm: "",
    viewMode: "card",
    showFilterPanel: false,
    cardPage: 1,
    cardPageSize: 12,
    tablePage: 1,
    tablePageSize: 12,
    deleteConfirmTask: null,
  };
}
