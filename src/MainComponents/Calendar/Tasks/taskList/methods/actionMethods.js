import moment from 'moment';

export default function attachActionMethods(TaskList) {
  const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

  const toTaskDateMoment = (value) => {
    if (!value) return null;
    const parsed = moment(
      value,
      ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss", moment.ISO_8601],
      true,
    );
    return parsed.isValid() ? parsed : null;
  };

  const getTaskDateLabel = (value) => {
    const parsed = toTaskDateMoment(value);
    return parsed ? parsed.format("DD-MM-YYYY") : "No Date";
  };

  const matchesStatusFilter = (taskStatus, filterStatus) => {
    const tStatus = normalizeStatus(taskStatus);
    const fStatus = normalizeStatus(filterStatus);

    if (!fStatus || fStatus === "none" || fStatus === "0") return true;

    if (fStatus === "complete" || fStatus === "completed") {
      return tStatus === "complete" || tStatus === "completed";
    }

    if (fStatus === "actionable" || fStatus === "in-progress" || fStatus === "in progress") {
      return tStatus === "actionable" || tStatus === "in-progress" || tStatus === "in progress";
    }

    if (fStatus === "pending") {
      return tStatus === "pending" || tStatus.includes("overdue");
    }

    if (fStatus === "on-hold" || fStatus === "on hold") {
      return tStatus === "on-hold" || tStatus === "on hold";
    }

    return tStatus === fStatus;
  };

    TaskList.prototype.AddNew = function () {
      this.setState({ PageMode: "Add", showAddModal: true });
  };
  
    TaskList.prototype.Filter = function () {
      this.setState({ filtered: true, cardPage: 1, tablePage: 1 }, () => {
        this.getTasks();
      });
  };
  
    TaskList.prototype.Reset = function () {
      const today = moment();
      // Prevent componentDidUpdate from firing a duplicate getTasks when category/subcat resets
      this._suppressCduTaskFetch = true;
      this.setState({
        filtered: false,
        selectedCategoryId: 0,
        selectedSubCategoryId: 0,
        occurance: "",
        assignTo: 0,
        taskStatus: "None",
        uiTaskStatus: "None",
        dateStatusFilters: {},
        completedTasks: 0,
        pendingTasks: 0,
        actionableTasks: 0,
        onHoldTasks: 0,
        taskPriority: 0,
        data: [],
        showFilterPanel: false,
        cardPage: 1,
        tablePage: 1,
        filterFromDate: today.format("YYYY-MM-DD"),
        filterToDate: today.format("YYYY-MM-DD"),
      }, () => {
        this._suppressCduTaskFetch = false;
        this.DateRangeConfig(today, today);
        this.getTasks();
      });
  };

  TaskList.prototype.handleStatusFilter = function (status) {
    this.setState((prevState) => {
      const prevFilter = normalizeStatus(prevState.uiTaskStatus);
      const nextFilter = normalizeStatus(status);
      const toggledOff = prevFilter && prevFilter !== "none" && prevFilter === nextFilter;
      const uiTaskStatus = toggledOff ? "None" : status;
      const normalizedNext = normalizeStatus(uiTaskStatus);

      const tasks = Array.isArray(prevState.data) ? prevState.data : [];
      const groupedByDate = tasks.reduce((acc, task) => {
        const key = getTaskDateLabel(task?.UpdatedOn);
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {});

      const sortedDates = Object.keys(groupedByDate)
        .sort((a, b) => {
          const aIsNoDate = String(a || "").trim().toLowerCase() === "no date";
          const bIsNoDate = String(b || "").trim().toLowerCase() === "no date";
          if (aIsNoDate && !bIsNoDate) return 1;
          if (bIsNoDate && !aIsNoDate) return -1;
          if (aIsNoDate && bIsNoDate) return 0;
          return moment(b, "DD-MM-YYYY").valueOf() - moment(a, "DD-MM-YYYY").valueOf();
        });

      const currentDate = prevState.expandedDate && sortedDates.includes(prevState.expandedDate) ? prevState.expandedDate : null;

      const dateHasMatch = (dateKey) =>
        (groupedByDate[dateKey] || []).some((t) => matchesStatusFilter(t?.TaskStatus, normalizedNext));

      let expandedDate = currentDate;
      if (normalizedNext && normalizedNext !== "none") {
        if (!expandedDate || !dateHasMatch(expandedDate)) {
          expandedDate = sortedDates.find(dateHasMatch) || null;
        }
      } else if (!expandedDate) {
        expandedDate = sortedDates[0] || null;
      }

      return { uiTaskStatus, expandedDate, cardPage: 1, tablePage: 1 };
    }, () => this.getTasks());
  };

  TaskList.prototype.handleDateStatusFilter = function (dateKey, status) {
    this.setState((prevState) => {
      const safeDateKey = String(dateKey || "").trim();
      if (!safeDateKey) return null;

      const prevMap = prevState.dateStatusFilters || {};
      const prevForDate = normalizeStatus(prevMap[safeDateKey]);
      const nextFilter = normalizeStatus(status);
      const toggledOff = prevForDate && prevForDate !== "none" && prevForDate === nextFilter;

      const nextMap = { ...prevMap };
      if (toggledOff || nextFilter === "none" || nextFilter === "") {
        delete nextMap[safeDateKey];
      } else {
        nextMap[safeDateKey] = status;
      }

      return { dateStatusFilters: nextMap, cardPage: 1, tablePage: 1 };
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
      const viewOnlySection = arguments.length > 1 ? arguments[1] : null;
      this.setState({
        PageMode: "ViewTask",
        showTaskModal: true,
        showEditModal: false,
        openAddQuestion: false,
        viewOnlySection: viewOnlySection || null,
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
        viewOnlySection: null,
      },
      () => {
        this.getCategory();
        this.getTasks();
      }
    );
  };
  
  TaskList.prototype.selectedCategory = function (value) { return this.setState({ selectedCategoryId: value }); };
  
    // closeModal = () => this.setState({ PageMode: 'Home', showAddModal: false });
  
    TaskList.prototype.computeTaskCounts = function (tasks) {
      let completedTasks = 0;
      let pendingTasks = 0;
      let actionableTasks = 0;
      let onHoldTasks = 0;
  
      (tasks || []).forEach((task) => {
        const status = String(task?.TaskStatus || "")
          .trim()
          .toLowerCase();
  
        if (status === "completed" || status === "complete") completedTasks += 1;
        else if (status === "pending") pendingTasks += 1;
        else if (status === "actionable" || status === "in-progress" || status === "in progress") actionableTasks += 1;
        else if (status === "on-hold" || status === "on hold") onHoldTasks += 1;
      });
  
      return { completedTasks, pendingTasks, actionableTasks, onHoldTasks };
  };

}
