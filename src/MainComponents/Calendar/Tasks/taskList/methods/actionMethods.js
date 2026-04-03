import moment from 'moment';

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
      this.setState({ deleteConfirmTask: data });
  };

  TaskList.prototype.cancelDeleteTask = function () {
    this.setState({ deleteConfirmTask: null });
  };

  TaskList.prototype.confirmDeleteTask = function () {
    const target = this.state.deleteConfirmTask;
    if (!target) return;
    const type = "D";
    const model = this.getDeleteTaskModel(type, target.TaskId);
    this.setState({ deleteConfirmTask: null }, () => this.manageTask(model, type));
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
