import React, { Component } from "react";
import moment from "moment";
import LoadingOverlay from "react-loading-overlay";
import { PropagateLoader } from "react-spinners";
import Button from "../../../ReactComponents/Button/Button";
import DataTable from "../../../ReactComponents/ReactTable/DataTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ApiProvider from "../DataProvider";
import * as appCommon from "../../../Common/AppCommon.js";
import TaskPage from "../Tasks/TaskPage";
import {getFrequencyList} from "../../../Services/masterService";
import {bindActionCreators} from "redux";
import departmentAction from "../../../redux/department/action";
import {connect} from "react-redux";

const $ = window.$;
const CounterLabel = ({ title, count, bgColor = "#336B93" }) => {
  return (
      <div
          className="d-inline-flex justify-content-between align-items-center rounded px-4 py-2 shadow-sm text-white"
          style={{
            backgroundColor: bgColor,
            fontWeight: "600",
            fontSize: "18px",
            width: "100%",
          }}
      >
        <span className="me-3">{title} :</span>
        <span>{count}</span>
      </div>
  );
};

class GuardList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [
        {
          Header: "Task Id",
          accessor: "TaskId",
        },
        {
          Header: "Task Name",
          accessor: "Name",
        },
        {
          Header: "Date",
          accessor: "UpdatedOn",
        },
        {
          Header: "Frequency",
          accessor: "OccurenceView",
        },
        {
          Header: "Task Status",
          accessor:"TaskStatus"
        },
        {
          Header: "Task Priority",
          accessor: "TaskPriority",
        },
        {
          Header: "Remarks",
          accessor:"Remarks"
        },
      ],
      data: [],
      loading: false,
      PageMode: "Home",
      showAddModal: false,
      guardId: "",
      filtered: false,
      filterFromDate:'',
      filterToDate:'',
      startDate :moment().clone().startOf("month"),
      endDate :moment().clone().startOf("month"),
      categories: [],
      subCategories: [],
      filteredSubCategories: [],
      selectedCategory: 0,
      selectedSubCategory:0,
      frequencies: [],
      selectedFrequency:0,
      statusList: [
        { value: "Pending", label: "Pending" },
        { value: "Complete", label: "Complete" },
        { value: "Actionable", label: "Actionable" },
      ],
      selectedStatus:"None",
      priorityList: [],
      selectedPriority:0,
      assignToList: [],
      selectedUser:0,
      filtersApplied: false,
      fromDate: null,
      toDate: null,
    };
    this.ApiProvider = new ApiProvider();
  }

  getModel = (type, categoryId, subCategoryId,assignTo,occurance,startDate,endDate,taskStatus,propertyId,taskPriority) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
          CategoryId: categoryId,
          SubCategoryId: subCategoryId,
          AssignedTo: assignTo,
          Occurrence: occurance,
          DteFr : startDate,
          DteTo : endDate,
          TaskStatus : taskStatus,
          PropertyId : propertyId,
          TaskPriority:taskPriority
        });
        break;
      default:
    }
    return model;
  };

  getAllFrenquency= async()=>{
    try {
      this.setState({ loading: true }); // Show loading before fetching data
      const data = await getFrequencyList();
      this.setState({ frequencies: data, loading: false });
    } catch (error) {
      console.error('Error fetching frequency:', error);
      this.setState({ loading: false });
    }
  }

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
              this.setState({ categories: catData });
              break;
            default:
          }
        });
      }
    });
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
              this.setState({ subCategories: subCatData });
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
              this.setState({ priorityList: taskPriorityList });
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
              Id: element.Id,
              Name: element.Name,
            });
          });
          switch (type) {
            case "R":
              this.setState({ assignToList: assignData });
              break;
            default:
          }
        });
      }
    });
  };

  manageTask = (model, type) => {
    if(this.state.filtersApplied){
      this.setState({ loading: true });
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
                    TaskStatus:element.TaskStatus,
                    OccurenceView: element.Occurence.split(" ")[0] ,
                    // OccurenceView: this.modifyOccurence(element.Occurence.split(" ")[0]) ,
                    CategoryName: element.CategoryName,
                    SubCategoryName: element.SubCategoryName,
                    Location:element.Location,
                    EntryType: element.EntryType,
                    AssignedTo: element.AssignedTo,
                    AssignedToId:element.AssignedToId,
                    QRcode: element.QRCode,
                    UpdatedOn : element.UpdatedOn,
                    PropertyId:element.PropertyId,
                    AssetId:element.AssetId,
                    TaskPriority : element.TaskPriority
                  });
                });
                //this.countTasksByStatus(taskData)
                this.setState({ data: taskData, loading: false });
                break;
              case "D":
                if (rData === "Deleted !") {
                  appCommon.showtextalert(
                      "Task Deleted Successfully!",
                      "",
                      "success"
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

  handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;

    this.setState({ selectedCategory }, () => {
      this.getSubCategory();
    });
  };

  componentDidMount() {
    this.getCategory();
    this.getAllFrenquency();
    this.getTasksPriority();
    this.getDashboardAssignList()
  }

  componentDidUpdate(prevProps, prevState) {
    if (
        prevState.selectedCategoryId !== this.state.selectedCategoryId &&
        prevState.selectedSubCategory !== this.state.selectedSubCategory
    ) {
      this.getTasks();
    }

    if (prevProps.PropertyVal !== this.props.PropertyVal)
    {
      this.getDashboardAssignList();
      console.log(this.props.PropertyVal)
    }
  }

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

  getDashboardAssignList() {
    var type = "R";
    var model = this.getAssignModel(type);
    this.manageDashboardAssign(model, type);
  }

  getCategory() {
    var type = "R";
    var model = this.getModel(type);
    this.manageCategory(model, type);
  }

  getSubCategory() {
    var type = "R";
    var model = this.getModel(type);
    var categoryId = this.state.selectedCategory
        ? this.state.selectedCategory
        : 0;
    this.manageSubCategory(model, type, categoryId);
  }

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

  getTasksPriority() {
    var type = "R";
    var model = this.getTaskPriorityModel(type);
    this.manageTaskPriority(model, type);
  }

  AddNew = () => {
    this.setState({ PageMode: "Add", showAddModal: true });
  };

  closeModal = () => {
    this.setState(
        {
          PageMode: "Home",
          showAddModal: false,
        },
    );
  };

  getTasks() {
    var type = "R";
    var categoryId = this.state.selectedCategory
        ? this.state.selectedCategory
        : 0;
    var subCategoryId = this.state.selectedSubCategory
        ? this.state.selectedSubCategory
        : 0;
    var assignToId = this.state.selectedUser
        ? this.state.selectedUser
        : 0;
    var occurrence = this.state.selectedFrequency ? this.state.selectedFrequency : 0;
    var startDate  = this.state.fromDate ? moment(this.state.fromDate).format("YYYY-MM-DD") :'';
    var endDate  = this.state.toDate ? moment(this.state.toDate).format("YYYY-MM-DD") : '';
    var taskStatus = this.state.selectedStatus === 'None'? '' : this.state.selectedStatus;
    var propertyId = this.props.PropertyVal ? this.props.PropertyVal : 0;
    var taskPriority = this.state.selectedPriority ? this.state.selectedPriority : 0;
    console.log("filter set")
    var model = this.getModel(type, categoryId, subCategoryId, assignToId, occurrence,startDate,endDate,taskStatus,propertyId,taskPriority);
    console.log("got model"+ JSON.stringify(model));
    this.manageTask(model, type);
  }

  handleFilter = () => {
    if (this.props.PropertyVal > 0 || this.state.selectedUser > 0 || this.state.selectedFrequency> 0 || this.state.selectedStatus !== "None")
    {
      console.log(this.props.PropertyVal,this.state.selectedUser,this.state.selectedFrequency,this.state.selectedStatus)
      this.setState({ filtersApplied: true }, () => {
        this.getTasks();
      });

    } else {
      appCommon.showtextalert("", "Please Select Any Filter Attribute", "warning");
    }
  };

  handleReset = () => {
    this.setState({
      filtersApplied: false,
      selectedCategory: 0,
      selectedSubCategory: 0,
      selectedFrequency:0,
      selectedUser:0,
      selectedStatus:"None",
      selectedPriority:0,
      fromDate: null,
      toDate: null,

      propertyId:0,
      completedTasks:0,
      pendingTasks:0,
      actionableTasks:0,
      data:[],
    });
    //this.getTasks();
  };


  render() {
    return (
        <div>
          {this.state.PageMode === "Home" && (
              <div className="row">
                <LoadingOverlay
                    active={this.state.loading}
                    spinner={<PropagateLoader color="#336B93" size={30}/>}
                >
                  <div className="col-12">
                    <div className="card">
                      <div className=" card-header d-flex flex-column flex-md-row
                           justify-content-between align-items-start align-items-md-center p-3 gap-3">
                        <CounterLabel title="Completed Tasks" count={33} bgColor="#336b93"/>
                        <CounterLabel title="Pending Tasks" count={12} bgColor="#f44336e0"/>
                        <CounterLabel title="Actionable Tasks" count={8} bgColor="#17a2b8"/>
                      </div>
                      <div className="card-header">
                        <form className="row gy-3 gx-3 align-items-end">
                          {/* 1. Category */}
                          <div className="col-md-2">
                            <select
                                id="category"
                                className="form-select"
                                onChange={this.handleCategoryChange}
                                value={this.state.selectedCategory}
                            >
                              <option value="">Select Category</option>
                              {this.state.categories.map(cat => (
                                  <option key={cat.Id} value={cat.Id}>{cat.Name}</option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Sub Category */}
                          <div className="col-md-2">
                            <select
                                id="subCategory"
                                className="form-select"
                                disabled={!this.state.selectedCategory}
                                value={this.state.selectedSubCategory}
                                onChange={(e) => this.setState({selectedSubCategory: e.target.value})}
                            >
                              <option value="">Select Sub Category</option>
                              {this.state.subCategories.map(sub => (
                                  <option key={sub.SubCategoryId} value={sub.SubCategoryId}>{sub.SubCategoryName}</option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Frequency */}
                          <div className="col-md-2">
                            <select
                                id="frequency"
                                className="form-select"
                                value={this.state.selectedFrequency}
                                onChange={(e) => this.setState({selectedFrequency: e.target.value})}
                            >
                              <option value="">Select Frequency</option>
                              {this.state.frequencies.map(freq => (
                                  <option key={freq.Id} value={freq.Id}>{freq.Name}</option>
                              ))}
                            </select>
                          </div>

                          {/* 4. Task Status */}
                          <div className="col-md-2">
                            <select
                                id="status"
                                className="form-select"
                                value={this.state.selectedStatus}
                                onChange={(e) => this.setState({selectedStatus: e.target.value})}
                            >
                              <option value="">Select Status</option>
                              {this.state.statusList.map(status => (
                                  <option key={status.value} value={status.value}>{status.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* 5. Task Priority */}
                          <div className="col-md-2">
                            <select
                                id="priority"
                                className="form-select"
                                value={this.state.selectedPriority}
                                onChange={(e) => this.setState({selectedPriority: e.target.value})}
                            >
                              <option value="">Select Priority</option>
                              {this.state.priorityList.map(p => (
                                  <option key={p.Id} value={p.Id}>{p.Name}</option>
                              ))}
                            </select>
                          </div>

                          {/* 6. Assigned To */}
                          <div className="col-md-2">
                            <select
                                id="assignedTo"
                                className="form-select"
                                value={this.state.selectedUser}
                                onChange={(e) => this.setState({selectedUser: e.target.value})}
                            >
                              <option value="">Assigned To</option>
                              {this.state.assignToList.map(user => (
                                  <option key={user.Id} value={user.Id}>{user.Name}</option>
                              ))}
                            </select>
                          </div>
                          {/* 7. Date Range */}
                          <div className="col-md-2">
                            <div className="position-relative">
                              <DatePicker
                                  selectsRange
                                  startDate={this.state.fromDate}
                                  endDate={this.state.toDate}
                                  onChange={(dates) => {
                                    const [start, end] = dates;
                                    this.setState({ fromDate: start, toDate: end });
                                  }}
                                  isClearable
                                  placeholderText="Select Date Range"
                                  className="form-control w-100"
                                  wrapperClassName="d-block"
                                  dateFormat="dd-MM-yyyy"
                              />
                            </div>
                          </div>

                          {/* 8. Buttons */}
                          <div className="col-10 d-flex flex-wrap gap-2 justify-content-end mt-2">
                            <button
                                type="button"
                                className={`btn ${this.state.filtersApplied ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={this.state.filtersApplied ? this.handleReset : this.handleFilter}
                            >
                              <i className={`fa ${this.state.filtersApplied ? 'fa-undo' : 'fa-filter'} me-1`}/>
                              {this.state.filtersApplied ? 'Reset' : 'Filter'}
                            </button>

                            <button type="button" className="btn btn-outline-success" onClick={this.handleExport}>
                              <i className="fa fa-file-excel me-1"/> Export
                            </button>

                            <Button
                                id="btnNewTask"
                                Action={this.AddNew.bind(this)}
                                ClassName="btn btn-success"
                                Icon={<i className="fa fa-plus" aria-hidden="true"></i>}
                                Text="Add Spot Visit Task"
                            />
                          </div>
                        </form>
                      </div>
                      <div className="card-body pt-2">
                        <LoadingOverlay
                            active={this.state.loading}
                            spinner={<PropagateLoader color="#336B93" size={30}/>}
                        >
                          <DataTable
                              data={this.state.data}
                              columns={this.state.columns}
                              hideGridSearchAndSize={true}
                              globalSearch={true}
                              isDefaultPagination={true}
                          />
                        </LoadingOverlay>
                      </div>
                    </div>
                  </div>
                </LoadingOverlay>
              </div>
          )}
          {this.state.showAddModal && (
              <TaskPage
                mode="create"
                visible={this.state.showAddModal}
                closeModal={this.closeModal}
                categoryData={this.state.CategoryData}
                type={"SpotVisit"}
                PropertyId={this.props.PropertyVal}
              />
          )}
        </div>
    );
  }
}
const mapStateToProps = (state,props) => {
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

export default connect(mapStateToProps,mapDispatchToProps)(GuardList)
