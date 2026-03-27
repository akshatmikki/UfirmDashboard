import moment from 'moment';
import swal from 'sweetalert';
import { DELETE_CONFIRMATION_MSG } from '../../../../../Contants/Common';

export default function attachActionMethods(TaskList) {
    TaskList.prototype.AddNew = function () {
      this.setState({ PageMode: "Add", showAddModal: true });
  };
  
    TaskList.prototype.Filter = function () {
      this.setState({ filtered: true }, () => {
        this.getTasks();
      });
  };
  
    TaskList.prototype.Reset = function () {
      const today = moment();
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
        showFilterPanel: false,
        filterFromDate: today.format("YYYY-MM-DD"),
        filterToDate: today.format("YYYY-MM-DD"),
      }, () => {
        this.DateRangeConfig(today, today);
        this.getTasks();
      });
  };
  
    TaskList.prototype.AddQuestion = function (data) {
      this.setState({
        PageMode: "EditTask",
        showEditModal: true,
        showTaskModal: false,
        showAddModal: false,
        openAddQuestion: true,
        rowData: data,
      });
  };
    TaskList.prototype.ViewTask = function (data) {
      this.setState({
        PageMode: "ViewTask",
        showTaskModal: true,
        showEditModal: false,
        openAddQuestion: false,
        rowData: data,
      });
  };
    TaskList.prototype.EditTask = function (data) {
      this.setState({
        PageMode: "EditTask",
        showEditModal: true,
        openAddQuestion: false,
        rowData: data,
      });
  };
  
    TaskList.prototype.DeleteTask = function (data) {
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
  
    TaskList.prototype.closeModal = function () {
      this.setState(
        {
          PageMode: "Home",
          showAddModal: false,
          showTaskModal: false,
          showEditModal: false,
          openAddQuestion: false,
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
  
  TaskList.prototype.selectedCategory = function (value) { return this.setState({ selectedCategoryId: value }); };
  
    // closeModal = () => this.setState({ PageMode: 'Home', showAddModal: false });
  
    TaskList.prototype.computeTaskCounts = function (tasks) {
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

}
