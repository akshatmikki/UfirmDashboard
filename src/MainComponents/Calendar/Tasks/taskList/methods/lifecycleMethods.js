import moment from 'moment';
import { getFrequencyList } from '../../../../../Services/masterService';
import { TASK_NOTIFICATION_REFRESH_EVENT } from '../../../../../Services/notificationService';

export default function attachLifecycleMethods(TaskList) {
  TaskList.prototype.getAllFrequency = async function () {
    try {
      const data = await getFrequencyList(this.props.PropertyVal ? Number(this.props.PropertyVal) : null);
      this.setState({ frequencyData: data });
    } catch (error) {
      console.error("Error fetching frequency:", error);
    }
  };

  TaskList.prototype.componentDidMount = function () {
    const { PropertyVal } = this.props;
    const status =
      this.props.status === "Completed" ? "Complete" : this.props.status;
    const priority = this.props.priority;
    const subCatId = parseInt(this.props.subCatId, 10);
    const hasSubCategoryFilter = Number.isFinite(subCatId) && subCatId > 0;
    const hasPresetFilters = status !== null || priority !== null || hasSubCategoryFilter;
    const initialDate = this.props.dashDates;
    const today = moment();
    const parsedInitialDate = moment(initialDate, ["YYYY-MM-DD", "DD/MM/YYYY", moment.ISO_8601], true);
    const fromDate =
      status === null && priority === null
        ? today
        : parsedInitialDate.isValid()
          ? parsedInitialDate
          : today;

    this.getAllFrequency();
    if (typeof window !== "undefined" && this.handleTaskRefreshEvent) {
      window.removeEventListener(TASK_NOTIFICATION_REFRESH_EVENT, this.handleTaskRefreshEvent);
    }
    this.handleTaskRefreshEvent = () => {
      this.getTasks();
    };
    if (typeof window !== "undefined") {
      window.addEventListener(TASK_NOTIFICATION_REFRESH_EVENT, this.handleTaskRefreshEvent);
    }

    this.setState(
      {
        filterFromDate: fromDate.format("YYYY-MM-DD"),
        filterToDate: today.format("YYYY-MM-DD"),
        filtered: hasPresetFilters,
        propertyId: PropertyVal,
        taskStatus: status === null ? "None" : status,
        uiTaskStatus: status === null ? "None" : status,
        taskPriority: priority === null ? 0 : priority,
        selectedSubCategoryId: Number.isFinite(subCatId) ? subCatId : 0,
      },
      () => {
        const dateTo = moment(this.state.filterToDate, "YYYY-MM-DD");
        const dateFrom = moment(this.state.filterFromDate, "YYYY-MM-DD");
        this.DateRangeConfig(dateFrom, dateTo);
        this.getCategory();
        this.getTasks();
        this.getTasksPriority();
        this.getAssign();
        this.getDashboardAssignList();
        this.loadProperty();
      },
    );
  };

  TaskList.prototype.componentDidUpdate = function (prevProps, prevState) {
    if (prevState.selectedCategoryId !== this.state.selectedCategoryId) {
      this.getSubCategory();
    }
    if (
      prevState.selectedCategoryId !== this.state.selectedCategoryId ||
      prevState.selectedSubCategoryId !== this.state.selectedSubCategoryId
    ) {
      this.getTasks();
    }

    if (prevProps.PropertyVal !== this.props.PropertyVal) {
      this.getAssign();
      this.getDashboardAssignList();
    }

    if (prevProps.PropertyVal !== this.props.PropertyVal) {
      const { PropertyVal: nextPropertyVal } = this.props;
      if (nextPropertyVal !== null && nextPropertyVal !== undefined) {
        this.setState({ localPropertyValue: nextPropertyVal });
        this.componentDidMount();
      }
    }
  };

  TaskList.prototype.componentWillUnmount = function () {
    if (typeof window !== "undefined" && this.handleTaskRefreshEvent) {
      window.removeEventListener(TASK_NOTIFICATION_REFRESH_EVENT, this.handleTaskRefreshEvent);
    }
  };

  TaskList.prototype.onCategorySelected = function () {};

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
}
