import moment from "moment";
import { getScheduleCategoryList, getSubCategoryList } from "../../../../../Services/masterService";

const $ = window.$;

export default function attachApiFetch(TaskList) {
  TaskList.prototype.getCategory = async function () {
    try {
      const rows = await getScheduleCategoryList();
      const catData = Array.isArray(rows)
        ? rows.map((item) => ({
            Id: Number(item.Id ?? item.ScheduleCategoryId ?? item.catId ?? 0),
            Name: item.Name ?? item.CategoryName ?? item.name ?? "",
          }))
        : [];
      this.setState({ CategoryData: catData });
    } catch (error) {
      console.error("Error fetching category:", error);
      this.setState({ CategoryData: [] });
    }
  };

  TaskList.prototype.getSubCategory = async function () {
    try {
      const categoryId = Number(this.state.selectedCategoryId || 0);
      if (!categoryId) {
        this.setState({ subCategory: [], selectedSubCategoryId: 0 });
        return;
      }
      const rows = await getSubCategoryList(categoryId);
      const subCatData = Array.isArray(rows)
        ? rows.map((item) => ({
            SubCategoryId: Number(item.SubCategoryId ?? item.subCategoryId ?? 0),
            CategoryId: Number(item.CategoryId ?? item.categoryId ?? 0),
            SubCategoryName: item.SubCategoryName ?? item.subCategoryName ?? "",
          }))
        : [];
      this.setState({ subCategory: subCatData });
    } catch (error) {
      console.error("Error fetching sub category:", error);
      this.setState({ subCategory: [] });
    }
  };

  TaskList.prototype.getTasks = function () {
    const type = "R";
    const categoryId = this.state?.selectedCategoryId || 0;
    const subCategoryId = this.state?.selectedSubCategoryId || 0;
    const assignToId = this.state?.assignTo || 0;
    const occurance = this.state?.occurance || 0;
    const startDate = this.state?.filterFromDate || "";
    const endDate = this.state?.filterToDate || "";
    let taskStatus = this.state?.taskStatus && this.state.taskStatus !== "None" ? this.state.taskStatus : "";
    if (!taskStatus && this.state.uiTaskStatus && this.state.uiTaskStatus !== "None") {
      taskStatus = this.state.uiTaskStatus;
    }
    const propertyId = this.props?.PropertyVal || 0;
    const taskPriority = this.state?.taskPriority || 0;

    const isCard = this.state.viewMode === "card";
    const page = isCard ? this.state.cardPage : this.state.tablePage;
    const pageSize = isCard ? this.state.cardPageSize : this.state.tablePageSize;

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
      page || 1,
      pageSize || 10
    );

    this.manageTask(model, type);
  };

  TaskList.prototype.getAssign = function () {
    const type = "R";
    const model = this.getAssignModel(type);
    this.manageAssign(model, type);
  };

  TaskList.prototype.getDashboardAssignList = function () {
    const type = "R";
    const model = this.getAssignModel(type);
    this.manageDashboardAssign(model, type);
  };

  TaskList.prototype.getTasksPriority = function () {
    const type = "R";
    const model = this.getTaskPriorityModel(type);
    this.manageTaskPriority(model, type);
  };

  TaskList.prototype.onAddQuestion = function (data) {
    const rowData = this.findItem(data);
    if (rowData) {
      this.setState({
        taskId: rowData.TaskId,
        taskName: rowData.Name,
      });
    }
  };

  TaskList.prototype.findItem = function (id) {
    return this.state.data.find((item) => item.TaskId === id);
  };

  TaskList.prototype.DateRangeConfig = function (startDate, endDate) {
    const _this = this;
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
      _this.setState({
        filtered: false,
        filterFromDate: picker.startDate.format("YYYY-MM-DD"),
        filterToDate: picker.endDate.format("YYYY-MM-DD"),
      });
    });
  };
}
