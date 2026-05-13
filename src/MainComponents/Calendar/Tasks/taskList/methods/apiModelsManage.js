import moment from 'moment';
import * as appCommon from '../../../../../Common/AppCommon.js';

const toTaskDateMoment = (value) => {
  if (!value) return null;
  const parsed = moment(value, ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY-MM-DDTHH:mm:ss", moment.ISO_8601], true);
  return parsed.isValid() ? parsed : null;
};

const getTaskDateLabel = (value) => {
  const parsed = toTaskDateMoment(value);
  return parsed ? parsed.format("DD-MM-YYYY") : "No Date";
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
const hasActiveStatusFilter = (value) => {
  const normalized = normalizeStatus(value);
  return normalized !== "" && normalized !== "none" && normalized !== "0";
};
const matchesStatusFilter = (taskStatus, filterStatus) => {
  const tStatus = normalizeStatus(taskStatus);
  const fStatus = normalizeStatus(filterStatus);

  if (!hasActiveStatusFilter(fStatus)) return true;

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

const clampPage = (page, totalItems, pageSize) => {
  const safeSize = Number(pageSize) > 0 ? Number(pageSize) : 1;
  const totalPages = Math.max(1, Math.ceil((Number(totalItems) || 0) / safeSize));
  const desired = Number(page) || 1;
  return Math.min(Math.max(1, desired), totalPages);
};

export default function attachApiModelsManage(TaskList) {
    TaskList.prototype.loadProperty = function () {
      this.comdbprovider.getUserAssignedproperty().then((resp) => {
        if (resp && resp.ok && resp.status === 200) {
          return resp.json().then((rData) => {
            this.setState({ propertyData: rData });
          });
        }
      });
    }
  
    TaskList.prototype.getModel = function (
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
      pageNumber,
      pageSize
  ) {
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
            PageNumber: pageNumber,
            PageSize: pageSize,
          });
          break;
        default:
      }
      return model;
    };
  
    TaskList.prototype.getDeleteTaskModel = function (type, taskId) {
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
  
    TaskList.prototype.getAssignModel = function (type) {
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
  
    TaskList.prototype.getTaskPriorityModel = function (type) {
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
  
    TaskList.prototype.manageCategory = function (model, type) {
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
  
    TaskList.prototype.manageTask = function (model, type) {
      this.setState({ dataLoading: true });
      this.ApiProvider.manageTask(model, type).then((resp) => {
        if (resp.ok && resp.status === 200) {
          return resp.json().then((rData) => {
            switch (type) {
              case "R":
                let taskData = [];
                const responseData = Array.isArray(rData) ? rData : (rData.Data || []);
                const totalRecords = rData.TotalRecords || responseData.length;
                const totalPages = rData.TotalPages || 1;

                responseData.forEach((element) => {
                  taskData.push({
                    Id: element.Id,
                    TaskId: element.TaskId,
                    TaskCategoryId: element.TaskCategoryId,
                    TaskSubCategoryId: element.TaskSubCategoryId,
                    Name: element.Name,
                    Description: element.Description,
                    DateFrom: element.DateFrom ? element.DateFrom.split("T")[0] : "",
                    DateTo: element.DateTo ? element.DateTo.split("T")[0] : "",
                    TimeFrom: element.TimeFrom ? element.TimeFrom.split("T")[1] : "",
                    TimeTo: element.TimeTo ? element.TimeTo.split("T")[1] : "",
                    Remarks: element.Remarks,
                    TaskStatus: element.TaskStatus,
                    Occurence: element.Occurence ? element.Occurence.split(" ")[0] : "",
                    OccurenceView: this.modifyOccurence(
                      element.Occurence ? element.Occurence.split(" ")[0] : "",
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
                const sortedDates = [
                  ...new Set(
                    taskData
                      .map((task) => getTaskDateLabel(task?.UpdatedOn))
                  ),
                ].sort((a, b) => {
                  if (a === "No Date") return 1;
                  if (b === "No Date") return -1;
                  return moment(b, "DD-MM-YYYY").valueOf() - moment(a, "DD-MM-YYYY").valueOf();
                });

                this.setState((prevState) => {
                  const hasCurrentExpandedDate =
                    prevState.expandedDate && sortedDates.includes(prevState.expandedDate);

                  const expandedDate = hasCurrentExpandedDate ? prevState.expandedDate : (sortedDates[0] || null);
                  const expandedDateChanged = expandedDate !== prevState.expandedDate;

                  const searchStr = String(prevState.searchTerm || "").trim().toLowerCase();
                  const filteredData = searchStr
                    ? taskData.filter((task) =>
                        Object.values(task || {}).some((value) => {
                          if (value === null || value === undefined || typeof value === "object") return false;
                          return String(value).toLowerCase().includes(searchStr);
                        })
                      )
                    : taskData;

                  const groupedByDate = filteredData.reduce((acc, task) => {
                    const dateKey = getTaskDateLabel(task?.UpdatedOn);
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(task);
                    return acc;
                  }, {});

                  const itemsForExpanded = expandedDate
                    ? (groupedByDate[expandedDate] || []).filter((task) =>
                        matchesStatusFilter(task?.TaskStatus, prevState.uiTaskStatus)
                      )
                    : [];

                  return {
                    data: taskData,
                    dataLoading: false,
                    ...counts,
                    expandedDate,
                    cardPage: expandedDateChanged
                      ? 1
                      : clampPage(prevState.cardPage, itemsForExpanded.length, prevState.cardPageSize),
                    tablePage: expandedDateChanged
                      ? 1
                      : clampPage(prevState.tablePage, itemsForExpanded.length, prevState.tablePageSize),
                    dateStatusFilters: {},
                    totalRecords: totalRecords,
                    totalPages: totalPages,
                  };
                });
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
                this.setState({ dataLoading: false }, () => this.getTasks());
                break;
              default:
                this.setState({ dataLoading: false });
            }
          });
        } else {
          this.setState({ dataLoading: false });
        }
      }).catch(() => {
        this.setState({ dataLoading: false });
      });
    };
  
    TaskList.prototype.modifyOccurence = function (Occurrence) {
      const match = this.state.frequencyData.find(
        (f) => f.Occurence === Occurrence
      );
  
      return match ? match.Name : Occurrence;
    };
    TaskList.prototype.manageSubCategory = function (model, type, categoryId) {
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
  
    TaskList.prototype.manageAssign = function (model, type) {
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
  
    TaskList.prototype.manageDashboardAssign = function (model, type) {
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
  
    TaskList.prototype.manageTaskPriority = function (model, type) {
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
  
}
