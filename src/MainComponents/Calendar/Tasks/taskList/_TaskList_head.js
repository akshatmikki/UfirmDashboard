import React, { Component } from "react";
import { connect } from "react-redux";
import departmentAction from "../../../../src/redux/department/action.js";
import { bindActionCreators } from "redux";
import moment from "moment";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import Button from "../../../ReactComponents/Button/Button";
import DataTable from "../../../ReactComponents/ReactTable/DataTable";
import ApiProvider from "../DataProvider";
import AddTask from "./AddTask";
import AddQuestion from "./AddQuestion";
import ViewTask from "./ViewTask";
import * as appCommon from "../../../Common/AppCommon.js";
import swal from "sweetalert";
import { DELETE_CONFIRMATION_MSG } from "../../../Contants/Common";
import EditTask from "./EditTask";
import { downloadExcel } from "react-export-table-to-excel";
import { CSVLink } from "react-csv";
import LayoutDataProvider from "../../../Routing/LayoutDataProvider";
import { getFrequencyList } from "../../../Services/masterService";
import * as XLSX from "xlsx";

const $ = window.$;

class TaskList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [
        {
          Header: "Task Id",
          accessor: "TaskId",
        },
        {
          Header: "Due Date",
          accessor: "DateFrom",
        },
        {
          Header: "Category",
          accessor: "CategoryName",
        },
        {
          Header: "Sub Category",
          accessor: "SubCategoryName",
        },
        {
          Header: "Task Name",
          accessor: "Name",
        },
        // {
        //   Header: "Assigned To",
        //   accessor: "AssignedTo",
        // },
        // {
        //   Header: "Due Date",
        //   accessor: "DateFrom",
        // },
        // {
        //   Header: "End Date",
        //   accessor: "DateTo",
        // },
        // {
        //   Header: "Start Time",
        //   accessor: "TimeFrom",
        // },
        // {
        //   Header: "End Time",
        //   accessor: "TimeTo",
        // },
        {
          Header: "Occurence",
          accessor: "OccurenceView",
        },
        {
          Header: "UpdatedOn",
          accessor: "UpdatedOn",
        },
        {
          Header: "Task Status",
          accessor: "TaskStatus",
        },
        {
          Header: "Task Priority",
          accessor: "TaskPriority",
        },
        {
          Header: "Remarks",
          accessor: "Remarks",
        },
        {
          Header: "Action",
          Cell: (data) => {
            return (
              <div style={{ display: "flex" }}>
                <button
                  className="btn btn-sm btn-info"
                  onClick={this.ViewTask.bind(this, data.cell.row.original)}
                  title="View"
                  style={{ marginRight: "5px" }}
                >
                  <i className="fa fa-eye"></i>
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={this.EditTask.bind(this, data.cell.row.original)}
                  title="Edit"
                  style={{ marginRight: "5px" }}
                >
                  <i className="fa fa-edit"></i>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={this.DeleteTask.bind(this, data.cell.row.original)}
                  title="Delete"
                >
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            );
          },
        },
      ],
      columnsWithoutDueDate: [
        {
          Header: "Task Id",
          accessor: "TaskId",
        },
        {
          Header: "Category",
          accessor: "CategoryName",
        },
        {
          Header: "Sub Category",
          accessor: "SubCategoryName",
        },
        {
          Header: "Task Name",
          accessor: "Name",
        },
        {
          Header: "Occurence",
          accessor: "OccurenceView",
        },
        {
          Header: "UpdatedOn",
          accessor: "UpdatedOn",
        },
        {
          Header: "Task Status",
          accessor: "TaskStatus",
        },
        {
          Header: "Task Priority",
          accessor: "TaskPriority",
        },
        // {
        //   Header: "Assigned To",
        // },
        // {
        //   Header: "Assigned By",
        // },
        {
          Header: "Action",
          Cell: (data) => {
            return (
              <div style={{ display: "flex" }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={this.AddQuestion.bind(this, data.cell.row.original)}
                  title="Add"
                  style={{ marginRight: "5px" }}
                >
                  <i className="fa fa-plus"></i>
                </button>
                <button
                  className="btn btn-sm btn-info"
                  onClick={this.ViewTask.bind(this, data.cell.row.original)}
                  title="View"
                  style={{ marginRight: "5px" }}
                >
                  <i className="fa fa-eye"></i>
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={this.EditTask.bind(this, data.cell.row.original)}
                  title="View"
                  style={{ marginRight: "5px" }}
                >
                  <i className="fa fa-edit"></i>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={this.DeleteTask.bind(this, data.cell.row.original)}
                  title="View"
                >
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            );
          },
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
      PageMode: "Home",
      showQuesModal: false,
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
    };
    this.ApiProvider = new ApiProvider();
    this.comdbprovider = new LayoutDataProvider();
  }

  toggleDateGroup = (date) => {
    this.setState((prevState) => ({
      expandedDate: prevState.expandedDate === date ? null : date,
    }));
  };

  getExportDataWithQuestions = () => {
    const exportRows = [];

    this.state.data.forEach((task) => {
      // 🔹 assume questions are stored here (adjust key if needed)
      const questions = task.TaskTransactionModel1 || [];

      // ❗ If no questions, export task once
      if (!questions.length) {
        exportRows.push({
          ...task,
          Questionnaire: "",
        });
      } else {
        // ❗ If multiple questions, duplicate task row
        questions.forEach((q) => {
          exportRows.push({
            ...task, // 👈 keeps ALL existing columns
            Questionnaire: q.Question || q.QuestionName || "",
          });
        });
      }
    });

    return exportRows;
  };

  fetchQuestionsForTask = async (task) => {
    try {
      const taskId = task.TaskId;

      // Same date logic as ViewTask
      let date = task.UpdatedOn.split("-");
      const updatedOn = `${date[2]}-${date[1]}-${date[0]}`;

      const model = [
        {
          CmdType: "R",
          Id: taskId,
          date: updatedOn,
        },
      ];

      const resp = await this.ApiProvider.manageQues(model, "R");

      if (resp.ok && resp.status === 200) {
        const rData = await resp.json();

        return rData.map((q) => ({
          QuesId: q.QuestID,
          QuesName: q.QuestionName,
          Action: q.Action,
          Remark: q.Remarks,
        }));
      }

      return [];
    } catch (e) {
      console.error("Question fetch failed for task", task.TaskId, e);
      return [];
    }
  };

  handleCustomPropertyExport = async () => {
    // Custom export for Property 43
    // Group by Supervisor -> Task Name -> Matrix of Location x Questionnaires
    if (this.state.exporting) return;
    this.setState({ exporting: true });

    try {
      // 1. Fetch questions for ALL visible tasks.
      const tasksWithQues = [];
      for (const task of this.state.data) {
        const questions = await this.fetchQuestionsForTask(task);
        tasksWithQues.push({
          ...task,
          questionsList: questions || []
        });
      }

      // 2. Group by Supervisor (AssignedTo)
      const supervisorGroups = {};
      tasksWithQues.forEach((t) => {
        const sup = t.AssignedTo || "Unassigned";
        if (!supervisorGroups[sup]) supervisorGroups[sup] = [];
        supervisorGroups[sup].push(t);
      });

      const wb = XLSX.utils.book_new();

      // 3. Process each Supervisor group
      Object.keys(supervisorGroups).forEach((supervisorName) => {
        const supTasks = supervisorGroups[supervisorName];
        let sheetData = [];

        // Group by Task Name
        const taskNameGroups = {};
        supTasks.forEach((t) => {
          const tName = t.Name || "Unnamed Task";
          if (!taskNameGroups[tName]) taskNameGroups[tName] = [];
          taskNameGroups[tName].push(t);
        });

        Object.keys(taskNameGroups).forEach((taskName) => {
          const tasksUnderName = taskNameGroups[taskName];
          
          // Gather unique question names across all tasks in this TaskName group
          const uniqueQuesNamesSet = new Set();
          tasksUnderName.forEach(t => {
             t.questionsList.forEach(q => {
               if (q.QuesName) uniqueQuesNamesSet.add(q.QuesName);
             });
          });
          const quesNameArray = Array.from(uniqueQuesNamesSet);

          // Add headers
          sheetData.push([`Task Name: ${taskName}`]);
          sheetData.push([`Supervisor: ${supervisorName}`]);
          sheetData.push([]);
          
          const headerRow = ["Location", ...quesNameArray, "Remarks"];
          sheetData.push(headerRow);

          // Add rows for each location/task
          tasksUnderName.forEach(task => {
            const rowData = [];
            rowData.push(task.Location || "");
            
            // Map the questions
            quesNameArray.forEach(qName => {
               const matchedQ = task.questionsList.find(q => q.QuesName === qName);
               if (matchedQ) {
                 const status = String(matchedQ.Action || "").toLowerCase();
                 if (status === "completed" || status === "complete" || status === "done") {
                   rowData.push("✔");
                 } else {
                   rowData.push("✘");
                 }
               } else {
                 rowData.push(""); // No such question for this location
               }
            });

            // Actionable remark or default task remark
            let rowRemark = task.Remarks || "";
            let specificRemarks = [];
            task.questionsList.forEach(q => {
              if (q.Remark && q.Remark.trim() !== "") {
                const qStatus = String(q.Action || "").toLowerCase();
                // "in which actionable remark will come" -> capturing all remarks for context
                if (qStatus.includes("actionable") || qStatus.includes("pending")) {
                   specificRemarks.push(`${q.QuesName}: ${q.Remark}`);
                } else if (q.Remark.trim()) {
                   specificRemarks.push(`${q.QuesName}: ${q.Remark}`);
                }
              }
            });
            if (specificRemarks.length > 0) {
               rowRemark = specificRemarks.join(" | ");
            }

            rowData.push(rowRemark);
            sheetData.push(rowData);
          });
          
          sheetData.push([]); // blank row after table
          sheetData.push([]);
        });

        // Ensure valid sheet name (Excel limits to 31 chars, no brackets)
        let safeSheetName = supervisorName.replace(/[\[\]\*\\\/\?\:]/g, "").substring(0, 31) || "Sheet";
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      XLSX.writeFile(wb, "TaskList_Supervisor_Report.xlsx");

    } catch (err) {
      console.error("Custom export failed:", err);
      alert("Custom export failed: " + (err.message || String(err)));
      appCommon.showtextalert("Export failed", "Please try again later", "error");
    } finally {
      this.setState({ exporting: false });
    }
  };

  handleExportWithQuestions = async () => {
    // Redirect to custom export if property is 43
    // Logging/alerting to debug why the user says it's not working
    if (String(this.props.PropertyVal).includes("43") || String(this.state.propertyId).includes("43")) {
      return this.handleCustomPropertyExport().catch(err => {
         alert("Fatal error in custom export: " + err);
         this.setState({ exporting: false });
      });
    }

    // fallback alert to verify if we missed the ID
    if (String(this.props.PropertyVal).includes("pilani") || String(this.props.PropertyVal).includes("Pilani")) {
       return this.handleCustomPropertyExport();
    }

    // 🛑 prevent double click
    if (this.state.exporting) return;

    this.setState({ exporting: true });

    try {
      const exportRows = [];

      for (const task of this.state.data) {
        const questions = await this.fetchQuestionsForTask(task);

        const questionnaireText = questions.length
          ? questions.map((q, i) => `${i + 1}. ${q.QuesName}`).join("\n")
          : "";

        // ❌ remove unwanted columns ONLY for export
        const { AssignedToId, EntryType, Occurence, ...cleanTask } = task;

        exportRows.push({
          ...cleanTask,
          Questionnaire: questionnaireText,
        });
      }

      downloadExcel({
        fileName: "Tasklist",
        sheet: "Tasks",
        tablePayload: {
          header: Object.keys(exportRows[0] || {}),
          body: exportRows,
        },
      });
    } catch (err) {
      console.error("Export failed:", err);
      appCommon.showtextalert("Export failed", "Please try again", "error");
    } finally {
      // ✅ allow export again
      this.setState({ exporting: false });
    }
  };

  handleDownloadExcel() {
    downloadExcel({
      fileName: `TaskList`,
      sheet: "react-export-table-to-excel",
      tablePayload: {
        header: this.state.header,
        // accept two different data structures
        body: this.state.data,
      },
    });
  }

  loadProperty() {
    this.comdbprovider.getUserAssignedproperty().then((resp) => {
      if (resp && resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          this.setState({ propertyData: rData });
        });
      }
    });
  }

  getModel = (
    type,
    categoryId,
    subCategoryId,
    assignTo,
    occurance,
    startDate,
    endDate,
    taskStatus,
    propertyId,
    taskPriority,
  ) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
          CategoryId: categoryId,
          SubCategoryId: subCategoryId,
          AssignedTo: assignTo,
          Occurrence: occurance,
          DteFr: startDate,
          DteTo: endDate,
          TaskStatus: taskStatus,
          PropertyId: propertyId,
          TaskPriority: taskPriority,
        });
        break;
      default:
    }
    return model;
  };

  getDeleteTaskModel = (type, taskId) => {
    var model = [];
    switch (type) {
      case "D":
        model.push({
          CmdType: type,
          TaskId: taskId,
        });
        break;
      default:
    }
    return model;
  };

  getAssignModel = (type) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
          PropertyId: this.props.PropertyVal ? this.props.PropertyVal : 0,
        });
        break;
      default:
    }
    return model;
  };

  getTaskPriorityModel = (type) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
        });
        break;
      default:
    }
    return model;
  };

  manageCategory = (model, type) => {
    this.ApiProvider.manageCategory(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          let catData = [];
          rData.forEach((element) => {
            catData.push({
              Id: element.catId,
              Name: element.name,
            });
          });
          switch (type) {
            case "R":
              this.setState({ CategoryData: catData });
              break;
            default:
          }
        });
      }
    });
  };

  manageTask = (model, type) => {
    if (this.state.filtered) {
      this.setState({ dataLoading: true });
      this.ApiProvider.manageTask(model, type).then((resp) => {
        if (resp.ok && resp.status === 200) {
          return resp.json().then((rData) => {
            switch (type) {
              case "R":
                let taskData = [];
                rData.forEach((element) => {
                  taskData.push({
                    Id: element.Id,
                    TaskId: element.TaskId,
                    TaskCategoryId: element.TaskCategoryId,
                    TaskSubCategoryId: element.TaskSubCategoryId,
                    Name: element.Name,
                    Description: element.Description,
                    DateFrom: element.DateFrom.split("T")[0],
                    DateTo: element.DateTo.split("T")[0],
                    TimeFrom: element.TimeFrom.split("T")[1],
                    TimeTo: element.TimeTo.split("T")[1],
                    Remarks: element.Remarks,
                    TaskStatus: element.TaskStatus,
                    Occurence: element.Occurence.split(" ")[0],
                    OccurenceView: this.modifyOccurence(
                      element.Occurence.split(" ")[0],
                    ),
                    CategoryName: element.CategoryName,
                    SubCategoryName: element.SubCategoryName,
                    Location: element.Location,
                    EntryType: element.EntryType,
                    AssignedTo: element.AssignedTo,
                    AssignedToId: element.AssignedToId,
                    QRcode: element.QRCode,
                    UpdatedOn: element.UpdatedOn,
                    PropertyId: element.PropertyId,
                    AssetId: element.AssetId,
                    TaskPriority: element.TaskPriority,
                  });
                });
                const counts = this.computeTaskCounts(taskData);
                this.setState({ data: taskData, dataLoading: false, ...counts });
                break;
              case "D":
                if (rData === "Deleted !") {
                  appCommon.showtextalert(
                    "Task Deleted Successfully!",
                    "",
                    "success",
                  );
                } else {
                  appCommon.showtextalert("Someting went wrong !", "", "error");
                }
                this.getTasks();
                break;
              default:
            }
          });
        }
      });
    }
  };

  modifyOccurence = (Occurrence) => {
    const match = this.state.frequencyData.find(
      (f) => f.Occurence === Occurrence
    );

    return match ? match.Name : Occurrence;
  };
  manageSubCategory = (model, type, categoryId) => {
    this.ApiProvider.manageSubCategory(model, type, categoryId).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          let subCatData = [];
          rData.forEach((element) => {
            subCatData.push({
              SubCategoryId: element.SubCategoryId,
              CategoryId: element.CategoryId,
              SubCategoryName: element.SubCategoryName,
            });
          });
          switch (type) {
            case "R":
              this.setState({ subCategory: subCatData });
              break;
            default:
          }
        });
      }
    });
  };

  manageAssign = (model, type) => {
    this.ApiProvider.manageAssign(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          let assignData = [];
          rData.forEach((element) => {
            assignData.push({
              assignId: element.Id,
              assignName: element.Name,
            });
          });
          switch (type) {
            case "R":
              this.setState({ assign: assignData });
              break;
            default:
          }
        });
      }
    });
  };

  manageDashboardAssign = (model, type) => {
    this.ApiProvider.manageDashboardAssign(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          let assignData = [];
          rData.forEach((element) => {
            assignData.push({
              assignId: element.Id,
              assignName: element.Name,
            });
          });
          switch (type) {
            case "R":
              this.setState({ dashboardAssign: assignData });
              break;
            default:
          }
        });
      }
    });
  };

  manageTaskPriority = (model, type) => {
    this.ApiProvider.manageTaskPriority(model, type).then((resp) => {
      if (resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          let taskPriorityList = [];
          rData.forEach((element) => {
            taskPriorityList.push({
              Id: element.Id,
              Name: element.Name,
            });
          });
          switch (type) {
            case "R":
              this.setState({ taskPriorityList: taskPriorityList });
              break;
            default:
          }
        });
      }
    });
  };

  getCategory() {
    var type = "R";
    var model = this.getModel(type);
    this.manageCategory(model, type);
  }

  getSubCategory() {
    var type = "R";
    var model = this.getModel(type);
    var categoryId = this.state.selectedCategoryId
      ? this.state.selectedCategoryId
      : 0;
    this.manageSubCategory(model, type, categoryId);
  }
  getTasks() {
    const type = "R";

    const categoryId = this.state?.selectedCategoryId || 0;
    const subCategoryId = this.state?.selectedSubCategoryId || 0;
    const assignToId = this.state?.assignTo || 0;
    const occurance = this.state?.occurance || 0;

    const startDate = this.state?.filterFromDate || "";
    const endDate = this.state?.filterToDate || "";

    const taskStatus =
      this.state?.taskStatus && this.state.taskStatus !== "None"
        ? this.state.taskStatus
        : "";

    const propertyId = this.props?.PropertyVal || 0;
    const taskPriority = this.state?.taskPriority || 0;

    const model = this.getModel(
      type,
      categoryId,
      subCategoryId,
      assignToId,
      occurance,
      startDate,
      endDate,
      taskStatus,
      propertyId,
      taskPriority,
    );

    this.manageTask(model, type);
  }
  getAssign() {
    var type = "R";
    var model = this.getAssignModel(type);
    this.manageAssign(model, type);
  }
  getDashboardAssignList() {
    var type = "R";
    var model = this.getAssignModel(type);
    this.manageDashboardAssign(model, type);
  }
  getTasksPriority() {
    var type = "R";
    var model = this.getTaskPriorityModel(type);
    this.manageTaskPriority(model, type);
  }

  onAddQuestion = (data) => {
    var rowData = this.findItem(data);
    if (rowData) {
      this.setState({
        taskId: rowData.TaskId,
        taskName: rowData.Name,
      });
    }
  };

  findItem(id) {
    return this.state.data.find((item) => {
      if (item.TaskId === id) {
        return item;
      }
    });
  }

  DateRangeConfig(startDate, endDate) {
    let _this = this;
    $("#dataRange").daterangepicker({
      locale: {
        format: "DD/MM/YYYY",
      },
      startDate: startDate,
      endDate: endDate,
    });
    $("#dataRange").on("apply.daterangepicker", function (ev, picker) {
      var startDate = picker.startDate;
      var endDate = picker.endDate;
      _this.setState({
        filterFromDate: startDate.format("YYYY-MM-DD"),
        filterToDate: endDate.format("YYYY-MM-DD"),
      });
    });
  }

  componentDidMount() {
    const { PropertyVal } = this.props;
    const status =
      this.props.status === "Completed" ? "Complete" : this.props.status;
    const priority = this.props.priority;
    const subCatId = parseInt(this.props.subCatId);
    const initialDate = this.props.dashDates;
    const today = moment();
    this.getAllFrequency();
    this.setState(
      {
        filterFromDate:
          status === null && priority === null
            ? today.format("YYYY-MM-DD")
            : initialDate,
        filterToDate: today.format("YYYY-MM-DD"),
        filtered: true,
        propertyId: PropertyVal,
        taskStatus: status === null ? 0 : status,
        taskPriority: priority === null ? 0 : priority,
        selectedSubCategoryId: subCatId === null ? 0 : subCatId,
      },
      // const startDate = moment().clone().startOf("month");
      // const endDate = moment().clone().endOf("month");
      // this.setState({
      //   filterFromDate: startDate.format('YYYY-MM-DD'),
      //   filterToDate: endDate.format('YYYY-MM-DD'),
      //   filtered: true
      // },
      () => {
        const dateTo = new Date(this.state.filterToDate);
        const dateFrom = new Date(this.state.filterFromDate);
        this.DateRangeConfig(dateFrom, dateTo);
        // this.DateRangeConfig(startDate, endDate);
        this.getCategory();
        this.getTasks();
        this.getTasksPriority();
        this.getAssign();
        this.getDashboardAssignList();
        // this.getAllProperties();
        this.loadProperty();
        // this.TaskStatusConfig();
      },
    );
  }

  AddNew = () => {
    this.setState({ PageMode: "Add", showAddModal: true });
  };

  Filter = () => {
    if (
      this.props.PropertyVal > 0 ||
      this.state.assignTo > 0 ||
      this.state.occurance !== "" ||
      this.state.taskStatus !== "None"
    ) {
      this.setState({ filtered: true }, () => {
        this.getTasks();
      });
    } else {
      appCommon.showtextalert(
        "",
        "Please Select Any Filter Attribute",
        "warning",
      );
    }
  };

  Reset = () => {
    this.setState({
      filtered: false,
      selectedCategoryId: 0,
      selectedSubCategoryId: 0,
      occurance: "",
      assignTo: 0,
      taskStatus: "None",
      completedTasks: 0,
      pendingTasks: 0,
      actionableTasks: 0,
      taskPriority: 0,
      data: [],
    });
    //this.getTasks();
  };

  AddQuestion = (data) => {
    this.setState({
      PageMode: "AddQuestion",
      showQuesModal: true,
      rowData: data,
    });
  };
  ViewTask = (data) => {
    this.setState({ PageMode: "ViewTask", showTaskModal: true, rowData: data });
  };
  EditTask = (data) => {
    this.setState({ PageMode: "EditTask", showEditModal: true, rowData: data });
  };

  DeleteTask = (data) => {
    let myhtml = document.createElement("div");
    myhtml.innerHTML = DELETE_CONFIRMATION_MSG + "</hr>";
    alert: swal({
      buttons: {
        ok: "Yes",
        cancel: "No",
      },
      content: myhtml,
      icon: "warning",
      closeOnClickOutside: false,
      dangerMode: true,
    }).then((value) => {
      switch (value) {
        case "ok":
          var type = "D";
          var model = this.getDeleteTaskModel(type, data.TaskId);
          this.manageTask(model, type);
          break;
        case "cancel":
          break;
        default:
          break;
      }
    });
  };

  closeModal = () => {
    this.setState(
      {
        PageMode: "Home",
        showAddModal: false,
        showQuesModal: false,
        showTaskModal: false,
      },
      () => {
        const startDate = moment().clone().startOf("month");
        const endDate = moment().clone().endOf("month");
        this.DateRangeConfig(startDate, endDate);
        this.setState({
          pendingTasks: 0,
          actionableTasks: 0,
          completedTasks: 0,
        });

        this.getCategory();
        this.getTasks();
        // this.TaskStatusConfig();
      },
    );
  };

  selectedCategory = (value) => this.setState({ selectedCategoryId: value });

  // closeModal = () => this.setState({ PageMode: 'Home', showAddModal: false });

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedCategoryId !== this.state.selectedCategoryId) {
      this.getSubCategory();
    }
    if (
      prevState.selectedCategoryId !== this.state.selectedCategoryId &&
      prevState.selectedSubCategoryId !== this.state.selectedSubCategoryId
    ) {
      this.getTasks();
    }

    if (prevProps.PropertyVal !== this.props.PropertyVal) {
      this.getAssign();
      this.getDashboardAssignList();
    }

    if (prevProps.PropertyVal !== this.props.PropertyVal) {
      const { PropertyVal } = this.props;
      if (PropertyVal !== null && PropertyVal !== undefined) {
        this.setState({ localPropertyValue: PropertyVal });
        this.componentDidMount();
      }
    }
  }
  onCategorySelected = (val) => { };

  handleStatusFilter = (status) => {
    this.setState({ taskStatus: status }, () => {
      if (typeof this.Filter === "function") {
        this.Filter();
      }
    });
  };

  // TaskStatusConfig() {
  //   let _this = this;
  //   $("#ticketMutliSelect").multiselect({
  //     onSelectAll: function () {
  //       // _this.filterOnChange();
  //     },
  //     onDeselectAll: function () {
  //       // _this.filterOnChange();
  //     },
  //     onChange: function (option, checked, select) {
  //       // _this.filterOnChange();
  //     },
  //   });
  // }

  computeTaskCounts = (tasks) => {
    let completedTasks = 0;
    let pendingTasks = 0;
    let actionableTasks = 0;

    (tasks || []).forEach((task) => {
      const status = String(task?.TaskStatus || "")
        .trim()
        .toLowerCase();

      if (status === "completed" || status === "complete") completedTasks += 1;
      else if (status === "pending") pendingTasks += 1;
      else if (status === "actionable") actionableTasks += 1;
    });

    return { completedTasks, pendingTasks, actionableTasks };
  };

  getAllFrequency = async () => {
    try {
      const data = await getFrequencyList(this.props.PropertyVal ? Number(this.props.PropertyVal) : null);
      this.setState({ frequencyData: data });
    } catch (error) {
      console.error("Error fetching frequency:", error);
    }
  };

  renderTaskCards = () => {
    const { data, searchTerm, taskStatus } = this.state;
    // Step 1: Base search filter
    const baseFilteredData = data.filter((task) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        task.TaskId.toString().includes(searchStr) ||
        task.Name.toLowerCase().includes(searchStr) ||
        task.CategoryName.toLowerCase().includes(searchStr) ||
        task.SubCategoryName.toLowerCase().includes(searchStr)
      );
    });

    if (baseFilteredData.length === 0) {
      return (
        <div className="text-center p-5 w-100">
          <h5>No tasks found</h5>
        </div>
      );
    }

    // Step 2: Grouping tasks by UpdatedOn using base search data so counts stay full
    const groupedData = baseFilteredData.reduce((groups, task) => {
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

    const activeDate = this.state.expandedDate || (sortedDates.length > 0 ? sortedDates[0] : null);

    return (
      <div className="container-fluid p-0">
        {sortedDates.map((date, gIndex) => {
          const isExpanded = activeDate === date;
          const allTasks = groupedData[date];
          
          const completedCount = allTasks.filter(t => t.TaskStatus === 'Completed' || t.TaskStatus === 'Complete').length;
          const pendingCount = allTasks.filter(t => t.TaskStatus === 'Pending').length;
          const actionableCount = allTasks.filter(t => t.TaskStatus === 'Actionable').length;

          // Step 3: Now apply local status filter to display
          const displayTasks = allTasks.filter((task) => {
            const tStatus = String(task.TaskStatus || "").trim().toLowerCase();
            const sFilter = String(taskStatus || "None").trim().toLowerCase();
            
            if (sFilter === "none" || sFilter === "" || sFilter === "0") return true;
            if (sFilter === "complete" || sFilter === "completed") {
               return (tStatus === "complete" || tStatus === "completed");
            }
            return (tStatus === sFilter);
          });

          // Skip rendering the group if nothing matches the status
          if (displayTasks.length === 0) return null;

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
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Complete"); }}>
                      <i className="fa fa-check-circle text-success mr-1"></i>
                      <b>{completedCount}</b> Completed
                    </span>
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Pending"); }}>
                      <i className="fa fa-clock-o text-danger mr-1"></i>
                      <b>{pendingCount}</b> Pending
                    </span>
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Actionable"); }}>
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
                <div className="row animated fadeIn">
                  {displayTasks.map((task, index) => (
                    <div className="col-lg-4 col-md-6 mb-4" key={index}>
                      <div className="card h-100 shadow-sm border"
                        style={{
                          borderRadius: "16px",
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
                            padding: "8px 15px"
                          }}>
                          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#336B93" }}>
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
                        <div className="card-body p-3">
                          <div className="mb-1 d-flex justify-content-between align-items-start" style={{ minHeight: "35px" }}>
                            <div style={{ flex: 1, paddingRight: "10px" }}>
                              <h6 className="card-title mb-0 text-dark font-weight-bold"
                                style={{ fontSize: "14px", lineHeight: "1.3" }}>
                                {task.Name} <span style={{ color: "#666", fontWeight: "normal" }}>({task.TaskId})</span>
                              </h6>
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              <span style={{ fontWeight: "600", fontSize: "11px", color: "#336B93", background: "#eef4f8", padding: "2px 8px", borderRadius: "10px" }}>
                                {task.Location}
                              </span>
                            </div>
                          </div>
                          <div className="task-details mt-0 py-1" style={{ fontSize: "12px", color: "#555", background: "#fcfcfc", borderRadius: "8px" }}>
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
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  renderTaskTable = () => {
    const { data, searchTerm, taskStatus } = this.state;
    // Step 1: Base search filter
    const baseFilteredData = data.filter((task) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        task.TaskId.toString().includes(searchStr) ||
        task.Name.toLowerCase().includes(searchStr) ||
        task.CategoryName.toLowerCase().includes(searchStr) ||
        task.SubCategoryName.toLowerCase().includes(searchStr)
      );
    });

    if (baseFilteredData.length === 0) {
      return (
        <div className="text-center p-5 w-100">
          <h5>No tasks found</h5>
        </div>
      );
    }

    // Grouping tasks by UpdatedOn
    const groupedData = baseFilteredData.reduce((groups, task) => {
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

    const activeDate = this.state.expandedDate || (sortedDates.length > 0 ? sortedDates[0] : null);

    return (
      <div className="container-fluid p-0">
        {sortedDates.map((date, gIndex) => {
          const isExpanded = activeDate === date;
          const allTasks = groupedData[date];
          
          const completedCount = allTasks.filter(t => t.TaskStatus === 'Completed' || t.TaskStatus === 'Complete').length;
          const pendingCount = allTasks.filter(t => t.TaskStatus === 'Pending').length;
          const actionableCount = allTasks.filter(t => t.TaskStatus === 'Actionable').length;

          // Step 3: Now apply local status filter
          const displayTasks = allTasks.filter((task) => {
            const tStatus = String(task.TaskStatus || "").trim().toLowerCase();
            const sFilter = String(taskStatus || "None").trim().toLowerCase();
            
            if (sFilter === "none" || sFilter === "" || sFilter === "0") return true;
            if (sFilter === "complete" || sFilter === "completed") {
               return (tStatus === "complete" || tStatus === "completed");
            }
            return (tStatus === sFilter);
          });

          if (displayTasks.length === 0) return null;

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
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Complete"); }}>
                      <i className="fa fa-check-circle text-success mr-1"></i>
                      <b>{completedCount}</b> Completed
                    </span>
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Pending"); }}>
                      <i className="fa fa-clock-o text-danger mr-1"></i>
                      <b>{pendingCount}</b> Pending
                    </span>
                    <span className="mr-3" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); this.handleStatusFilter("Actionable"); }}>
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
                  {displayTasks.map((task, index) => (
                    <div key={index} className="card mb-3 shadow-sm border" style={{ borderRadius: "12px", background: "#fff", overflow: "hidden" }}>
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
                            {task.Remarks || "-"}
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    return (
      <div>
        {this.state.PageMode === "Home" && (
          <div className="row">
            <LoadingOverlay
              active={this.state.loading}
              spinner={<PropagateLoader color="#336B93" size={30} />}
            >
              <div className="col-12">
                <div className="card p-2">
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      margin: "8px 0 8px 0",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        background: "#40769b",
                        color: "white",
                        borderRadius: "8px",
                        padding: "12px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginLeft: 20,
                        }}
                      >
                        Completed Tasks :
                      </span>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginRight: 20,
                        }}
                      >
                        {this.state.completedTasks}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: "#fa6154",
                        color: "white",
                        borderRadius: "8px",
                        padding: "12px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginLeft: 20,
                        }}
                      >
                        Pending Tasks :
                      </span>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginRight: 20,
                        }}
                      >
                        {this.state.pendingTasks}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: "#1bb2c9",
                        color: "white",
                        borderRadius: "8px",
                        padding: "12px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontWeight: 600,
                        fontSize: "1.5rem",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginLeft: 20,
                        }}
                      >
                        Actionable Tasks :
                      </span>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          marginRight: 20,
                        }}
                      >
                        {this.state.actionableTasks}
                      </span>
                    </div>
                  </div>
                  <div className="card-header d-flex p-2">
                    <div className="d-flex w-100 flex-column">
                      {/* First Row - Main Filters */}
                      <div className="d-flex align-items-center mb-2">
                        <div className="d-flex flex-grow-1">
                          <div className="nav-item mr-2">
                            <select
                              id="dllCategory"
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  selectedCategoryId: e.target.value,
                                })
                              }
                              disabled={this.state.filtered}
                              value={this.state.selectedCategoryId}
                            >
                              <option value={0}>Select Category</option>
                              {this.state.CategoryData
                                ? this.state.CategoryData.map((e, key) => {
                                  return (
                                    <option key={key} value={e.Id}>
                                      {e.Name}
                                    </option>
                                  );
                                })
                                : null}
                            </select>
                          </div>
                          <div
                            className="nav-item mr-2"
                            style={{ maxWidth: "160px" }}
                          >
                            <select
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  selectedSubCategoryId: e.target.value,
                                })
                              }
                              value={this.state.selectedSubCategoryId}
                              disabled={this.state.filtered}
                            >
                              <option value={0}>Sub Category</option>
                              {this.state.subCategory &&
                                this.state.subCategory.map((e, key) => {
                                  return (
                                    <option key={key} value={e.SubCategoryId}>
                                      {e.SubCategoryName}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                          <div className="nav-item mr-2">
                            <select
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  occurance: e.target.value,
                                })
                              }
                              disabled={this.state.filtered}
                              value={this.state.occurance}
                            >
                              <option value="">Repeat</option>
                              {this.state.frequencyData.map((e, key) => (
                                <option key={key} value={e.Occurence}>
                                  {e.Name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="nav-item mr-2">
                            <select
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  taskStatus: e.target.value,
                                })
                              }
                              disabled={this.state.filtered}
                              value={this.state.taskStatus}
                            >
                              <option value="None">Task Status</option>
                              <option value="Pending">Pending</option>
                              <option value="Complete">Complete</option>
                              <option value="Actionable">Actionable</option>
                            </select>
                          </div>
                          <div className="nav-item mr-2">
                            <select
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  taskPriority: e.target.value,
                                })
                              }
                              disabled={this.state.filtered}
                              value={this.state.taskPriority}
                            >
                              <option value={0}>Task Priority</option>
                              {this.state.taskPriorityList &&
                                this.state.taskPriorityList.map((e, key) => {
                                  return (
                                    <option key={key} value={e.Id}>
                                      {e.Name}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                          <div className="nav-item mr-2 style={{maxWidth: '800px'}}">
                            <select
                              className="form-control"
                              onChange={(e) =>
                                this.setState({
                                  assignTo: e.target.value,
                                })
                              }
                              disabled={this.state.filtered}
                              value={this.state.assignTo}
                            >
                              <option value={0}>Assigned To</option>
                              {this.state.dashboardAssign &&
                                this.state.dashboardAssign.map((e, key) => {
                                  return (
                                    <option key={key} value={e.assignId}>
                                      {e.assignName}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Second Row - Assigned To, Date Range, and Buttons */}
                      <div className="d-flex align-items-center">
                        <div className="d-flex flex-grow-1">
                          <div className="nav-item mr-2">
                            <div className="input-group input-group-sm">
                              <div className="form-group">
                                <div className="input-group">
                                  <div className="input-group-prepend">
                                    <span className="input-group-text">
                                      <i className="fa fa-calendar-alt"></i>
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    className="form-control float-right"
                                    id="dataRange"
                                    disabled={this.state.filtered}
                                  ></input>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex ml-auto">
                          {!this.state.filtered && (
                            <Button
                              id="btnNewTask"
                              Action={this.Filter.bind(this)}
                              ClassName="btn btn-primary mr-2 rounded shadow-sm d-flex align-items-center"
                              Text={
                                <>
                                  <i className="fa fa-filter mr-1"></i> Filter
                                </>
                              }
                              title="Apply filters"
                            />
                          )}
                          {this.state.filtered && (
                            <Button
                              id="btnNewTask"
                              Action={this.Reset.bind(this)}
                              ClassName="btn btn-danger mr-2 rounded shadow-sm d-flex align-items-center"
                              Text={
                                <>
                                  <i className="fa fa-times mr-1"></i> Reset
                                </>
                              }
                              title="Clear all filters"
                            />
                          )}
                          <button
                            className="btn btn-outline-success mr-2 rounded shadow-sm d-flex align-items-center"
                            onClick={this.handleExportWithQuestions}
                            disabled={this.state.exporting}
                          >
                            {this.state.exporting ? (
                              <>
                                <i className="fa fa-spinner fa-spin mr-1"></i>{" "}
                                Exporting...
                              </>
                            ) : (
                              <>
                                <i className="fa fa-file-excel-o mr-1"></i>{" "}
                                Export
                              </>
                            )}
                          </button>

                          <Button
                            id="btnNewTask"
                            Action={this.AddNew.bind(this)}
                            ClassName="btn btn-success rounded shadow-sm d-flex align-items-center px-3"
                            Icon={<i className="fa fa-plus mr-1"></i>}
                            Text={
                              <span style={{ fontWeight: 600 }}>Add Task</span>
                            }
                            title="Add a new task"
                          />
                        </div>
                      </div>
                      <div className="d-flex mt-2 justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="d-flex mr-3 bg-white border shadow-sm" style={{ borderRadius: "8px", padding: "2px" }}>
                            <button
                              className={`btn btn-sm ${this.state.viewMode === 'card' ? 'btn-primary shadow-sm' : 'bg-transparent text-muted text-hover-primary'}`}
                              onClick={() => this.setState({ viewMode: 'card' })}
                              title="Card View"
                              style={{ padding: "5px 12px", borderRadius: "6px", border: "none", outline: "none" }}
                            >
                              <i className="fa fa-th-large"></i>
                            </button>
                            <button
                              className={`btn btn-sm ${this.state.viewMode === 'table' ? 'btn-primary shadow-sm' : 'bg-transparent text-muted text-hover-primary'}`}
                              onClick={() => this.setState({ viewMode: 'table' })}
                              title="Table View"
                              style={{ padding: "5px 12px", borderRadius: "6px", border: "none", outline: "none" }}
                            >
                              <i className="fa fa-table"></i>
                            </button>
                          </div>
                          <div className="input-group" style={{ maxWidth: "300px" }}>
                            <div className="input-group-prepend">
                              <span className="input-group-text bg-white border-right-0">
                                <i className="fa fa-search text-muted"></i>
                              </span>
                            </div>
                            <input
                              type="text"
                              className="form-control border-left-0"
                              placeholder="Search tasks..."
                              value={this.state.searchTerm}
                              onChange={(e) => this.setState({ searchTerm: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body pt-2">
                    <LoadingOverlay
                      active={this.state.dataLoading}
                      spinner={<PropagateLoader color="#336B93" size={30} />}
                    >
                      <div style={{ minHeight: "400px" }}>
                        {this.state.viewMode === "card" ? this.renderTaskCards() : this.renderTaskTable()}
                      </div>
                    </LoadingOverlay>
                  </div>
                </div>
              </div>
            </LoadingOverlay>
          </div>
        )}
        {this.state.showAddModal && (
          <AddTask
            showAddModal={this.state.showAddModal}
            closeModal={this.closeModal}
            categoryData={this.state.CategoryData}
            onTaskAdded={() => this.getTasks()}
            type={"PPMtask"}
          />
        )}
        {this.state.PageMode === "AddQuestion" && (
          <AddQuestion
            showQuesModal={this.state.showQuesModal}
            closeModal={this.closeModal}
            rowData={this.state.rowData}
          />
        )}
        {this.state.PageMode === "ViewTask" && (
          <ViewTask
            showTaskModal={this.state.showTaskModal}
            closeModal={this.closeModal}
            rowData={this.state.rowData}
          />
        )}
        {this.state.PageMode === "EditTask" && (
          <EditTask
            showEditModal={this.state.showEditModal}
            closeModal={this.closeModal}
            rowData={this.state.rowData}
            categoryData={this.state.CategoryData}
          />
        )}
      </div>
    );
  }
}
const mapStateToProps = (state, props) => {
  return {
    PropertyVal: state.Commonreducer.puidn,
    Entrolval: state.Commonreducer.entrolval,
    dashDates: state.Commonreducer.dashDates,
  };
};
const mapDispatchToProps = (dispatch) => {
  const actions = bindActionCreators(departmentAction, dispatch);
  return { actions };
};

export default connect(mapStateToProps, mapDispatchToProps)(TaskList);
