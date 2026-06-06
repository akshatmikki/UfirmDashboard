import moment from "moment";
import { getScheduleCategoryList, getSubCategoryList } from "../../../../../Services/masterService";
import { fetchTaskDashboardCount } from "../../../../../Services/DashboardServices";

const $ = window.$;

export default function attachApiFetch(TaskList) {
  const formatFilterDateForApi = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const iso = moment(raw, "YYYY-MM-DD", true);
    if (iso.isValid()) return iso.format("DD-MM-YYYY");
    return raw;
  };

  const formatFilterDateISO = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const m = moment(raw, ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", moment.ISO_8601], true);
    return m.isValid() ? m.format("YYYY-MM-DD") : raw;
  };

  TaskList.prototype.refreshDashboardCount = async function (params) {
    const {
      propID,
      dteFr,
      dteTo,
      catID,
      subCatID,
      occurrence,
      assingedtoID,
      taskPriorityId,
    } = params || {};

    const key = JSON.stringify({
      propID: Number(propID || 0),
      dteFr: dteFr || "",
      dteTo: dteTo || "",
      catID: Number(catID || 0),
      subCatID: Number(subCatID || 0),
      occurrence: occurrence || "",
      assingedtoID: Number(assingedtoID || 0),
      taskPriorityId: Number(taskPriorityId || 0),
    });

    // Dedupe only in-flight concurrent requests (same key already loading)
    if (key === this._dashboardCountRequestKey) return this._dashboardCountRequestPromise;

    this._dashboardCountRequestKey = key;
    this.setState({ dashboardCountLoading: true, dashboardCountKey: key });

    const requestPromise = fetchTaskDashboardCount(params)
      .then((data) => {
        // Only apply if this is still the latest request
        if (this._dashboardCountRequestKey !== key) return null;
        this.setState({ dashboardCount: data, dashboardCountLoading: false });
        return data;
      })
      .catch((error) => {
        if (this._dashboardCountRequestKey !== key) return null;
        console.error("Error fetching dashboard counts:", error);
        this.setState({ dashboardCount: null, dashboardCountLoading: false });
        return null;
      })
      .finally(() => {
        if (this._dashboardCountRequestKey === key) {
          this._dashboardCountRequestPromise = null;
        }
      });

    this._dashboardCountRequestPromise = requestPromise;
    return requestPromise;
  };

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
    const startDate = formatFilterDateForApi(this.state?.filterFromDate || "");
    const endDate = formatFilterDateForApi(this.state?.filterToDate || "");
    const dashboardStartDate = formatFilterDateISO(this.state?.filterFromDate || "");
    const dashboardEndDate = formatFilterDateISO(this.state?.filterToDate || "");
    let taskStatus = this.state?.taskStatus && this.state.taskStatus !== "None" ? this.state.taskStatus : "";
    if (!taskStatus && this.state.uiTaskStatus && this.state.uiTaskStatus !== "None") {
      taskStatus = this.state.uiTaskStatus;
    }
    const propertyId = this.props?.PropertyVal || 0;
    const taskPriority = this.state?.taskPriority || 0;

    // Dashboard totals and date-wise counts (independent of paging/status)
    this.refreshDashboardCount?.({
      propID: propertyId,
      dteFr: dashboardStartDate,
      dteTo: dashboardEndDate,
      catID: categoryId,
      subCatID: subCategoryId,
      occurrence: occurance,
      assingedtoID: assignToId,
      taskPriorityId: taskPriority,
    });

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
      taskPriority
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
