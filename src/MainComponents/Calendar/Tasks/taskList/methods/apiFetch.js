import moment from 'moment';

const $ = window.$;

export default function attachApiFetch(TaskList) {
    TaskList.prototype.getCategory = function () {
      var type = "R";
      var model = this.getModel(type);
      this.manageCategory(model, type);
    }
  
    TaskList.prototype.getSubCategory = function () {
      var type = "R";
      var model = this.getModel(type);
      var categoryId = this.state.selectedCategoryId
        ? this.state.selectedCategoryId
        : 0;
      this.manageSubCategory(model, type, categoryId);
    }
    TaskList.prototype.getTasks = function () {
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
    TaskList.prototype.getAssign = function () {
      var type = "R";
      var model = this.getAssignModel(type);
      this.manageAssign(model, type);
    }
    TaskList.prototype.getDashboardAssignList = function () {
      var type = "R";
      var model = this.getAssignModel(type);
      this.manageDashboardAssign(model, type);
    }
    TaskList.prototype.getTasksPriority = function () {
      var type = "R";
      var model = this.getTaskPriorityModel(type);
      this.manageTaskPriority(model, type);
    }
  
    TaskList.prototype.onAddQuestion = function (data) {
      var rowData = this.findItem(data);
      if (rowData) {
        this.setState({
          taskId: rowData.TaskId,
          taskName: rowData.Name,
        });
      }
  };
  
    TaskList.prototype.findItem = function (id) {
      return this.state.data.find((item) => {
        if (item.TaskId === id) {
          return item;
        }
      });
    }
  
    TaskList.prototype.DateRangeConfig = function (startDate, endDate) {
      let _this = this;
      const parsedStart = moment(startDate, ["YYYY-MM-DD", "DD/MM/YYYY", moment.ISO_8601], true);
      const parsedEnd = moment(endDate, ["YYYY-MM-DD", "DD/MM/YYYY", moment.ISO_8601], true);
      const validStart = parsedStart.isValid() ? parsedStart : moment();
      const validEnd = parsedEnd.isValid() ? parsedEnd : moment();

      $("#dataRange").daterangepicker({
        locale: {
          format: "DD/MM/YYYY",
        },
        autoUpdateInput: true,
        startDate: validStart,
        endDate: validEnd,
      });
      $("#dataRange").off("apply.daterangepicker");
      $("#dataRange").on("apply.daterangepicker", function (ev, picker) {
        var startDate = picker.startDate;
        var endDate = picker.endDate;
        _this.setState({
          filtered: false,
          filterFromDate: startDate.format("YYYY-MM-DD"),
          filterToDate: endDate.format("YYYY-MM-DD"),
        });
      });
    }
  
}
