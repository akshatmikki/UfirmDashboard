import React, { Component } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
// import events from './events';
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Event.css";

import { EditorState, ContentState } from "draft-js";
import htmlToDraft from "html-to-draftjs";
import ApiProvider from "../DataProvider";
import CommonDataProvider from "../../../Common/DataProvider/CommonDataProvider.js";
import * as appCommon from "../../../Common/AppCommon.js";

import AddEventTask from "./AddEventTask";
import DetailsEvent from "./DetailsEvent";
import MultiSelectInline from "../../../ReactComponents/MultiSelectInline/MultiSelectInline";

import { connect } from "react-redux";
import departmentAction from "../../../redux/department/action";
import { bindActionCreators } from "redux";

import ViewTaskEvent from "./ViewTaskEvent";

// let allViews = Object.keys(Views).map(k => Views[k])

import EventDetailsModel from "./EventDetailsModel";
let EventDetailsModelInstance = new EventDetailsModel();

const localizer = momentLocalizer(moment);

const ColoredDateCellWrapper = ({ children }) =>
  React.cloneElement(React.Children.only(children), {
    style: {
      backgroundColor: "lightblue",
    },
  });
class TaskEventCalendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      PageMode: "Home",
      events: [],
      showAddModal: false,
      defaultDate: new Date(),
      defaultView: "month",
      startDate: null,
      endDate: null,
      categoryList: [],
      assigneeList: [],
      showTaskEventModal: false,
      showDetailsModal: false,
      EventDetailsModelInstance: null,
      filterEventType: "E",
      filterCategoryList: [],
      setSelectedOptionsCategory: [],
      filterCategroy: "NULL",
      filterAssigneeList: [],
      setSelectedOptionsAssignee: [],
      filterAssignee: "NULL",
      detailspageHtmlFormatDesc: "",
      taskStatusList: [],
      filterEventStatus: "",
      eventData:{},
    };
    this.ApiProviderr = new ApiProvider();
    this.comdbprovider = new CommonDataProvider();
  }
  handleSelect = ({ start, end }) => {
    this.setState({ showAddModal: true, startDate: start, endDate: end });
  };

  eventStyle({ event }) {
    // console.log(event); //Deleted,Completed,Pending Approval,Overdue,Scheduled
    let text;
    switch (event.TaskStatus) {
      case "R":
        text = (
          <span style={{ color: "white"}}>
            <i
              className="fa fa-check"
              title="Completed"
              style={{ fontSize: 12, marginRight: "4px" }}
            ></i>
            {`${event.eventNumber}- ${event.title}`}
          </span>
        );
        break;
      case "O":
        text = (
          <span style={{ color: "white" }}>
            <i
              className="fa fa-exclamation-triangle"
              title="Overdue"
              style={{ fontSize: 12, marginRight: "4px" }}
            ></i>
            {`${event.eventNumber}- ${event.title}`}
          </span>
        );
        break;
      case "G":
        text = (
          <span style={{ color: "white" }}>
            <i
              className="fa fa-clock"
              title="Scheduled"
              style={{ fontSize: 12, marginRight: "4px" }}
            ></i>
            {`${event.eventNumber}- ${event.title}`}
          </span>
        );
        break;
      default:
        text = (
          <span style={{ color: "black" }}>
            {`${event.eventNumber}- ${event.title}`}
          </span>
        );
        break;
    }
    return text;
  }

  eventStyleGetter = (event, start, end, isSelected) => {
    console.log(event)
    if (event.TaskStatus == "R") {
      return {
        style: {
          backgroundColor: "Red",
        },
      };
    }
    else if (event.TaskStatus == "O") {
      return {
        style: {
          backgroundColor: "Orange",
        },
      };
    }
    else if (event.TaskStatus == "G") {
      return {
        style: {
          backgroundColor: "Green",
        },
      };
    }
    else {
      return {
        style: {
          backgroundColor: event.categoryColor,
        },
      };
    }
  };

  closemodal = () => {
    this.setState({ showAddModal: false });
  };
  closeDetailEventmodal = () => {
    this.setState({ showDetailsModal: false, EventDetailsModelInstance: null });
  };

  componentDidMount() {
    this.getCategory();
    this.getAsignee();
    this.getEvents();
    this.getTaskStatus();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.PropertyId !== this.props.PropertyId) {
      this.getAsignee();
      this.getEvents();
    }
  }

  getModel = (type, EventId, SubEventId) => {
    var model = [];
    switch (type) {
      case "R":
        model.push({
          CmdType: type,
          CategoryId:0,
          SubCategoryId:0,
          AssignedToId:0,
          Occurrence:0,
        });
        break;
      case "E":
        model.push({
          CmdType: type,
          PropertyId: parseInt(this.props.PropertyId),
          EventType: this.state.filterEventType
            ? this.state.filterEventType
            : "NULL",
          Categories: this.state.filterCategroy
            ? this.state.filterCategroy
            : "NULL",
          Assignees: this.state.filterAssignee
            ? this.state.filterAssignee
            : "NULL",
          EventStatus: this.state.filterEventStatus
            ? this.state.filterEventStatus
            : "NULL",
        });
        break;
      case "DT":
        model.push({
          CmdType: type,
          EventId: parseInt(EventId),
        });
        break;
      default:
    }
    return model;
  };

  manageCategory = (model, type) => {
    this.ApiProviderr.manageCategory(model, type).then((resp) => {
      if (resp.ok && resp.status == 200) {
        return resp.json().then((rData) => {
          switch (type) {
            case "R":
              this.setState({ categoryList: rData });
              let newCategory = [];
              rData.forEach((element) => {
                newCategory.push({
                  Id: element.catId,
                  Name: element.name,
                  value: element.name,
                  label: element.name,
                  color: "#0052CC",
                });
              });
              this.setState({ filterCategoryList: newCategory });
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
  getAsignee() {
    this.ApiProviderr.manageAssigne(parseInt(this.props.PropertyId)).then(
      (resp) => {
        if (resp.ok && resp.status == 200) {
          return resp.json().then((rData) => {
            this.setState({ assigneeList: rData });

            let newAssignee = [];
            rData.forEach((element) => {
              newAssignee.push({
                Id: element.emailAddress,
                Name: element.displayName,
                value: element.displayName,
                label: element.displayName,
                color: "#0052CC",
              });
            });
            this.setState({ filterAssigneeList: newAssignee });
          });
        }
      }
    );
  }
  getTaskStatus() {
    this.ApiProviderr.getTaskStatus().then((resp) => {
      if (resp.ok && resp.status == 200) {
        return resp.json().then((rData) => {
          this.setState({ taskStatusList: rData });
        });
      }
    });
  }

  getEvents = () => {
    var type = "R";
    var model = this.getModel(type);
    this.manageEvents(model, type);
    //this.setState({ events: events });
  };
  manageEvents = (model, type) => {
    this.ApiProviderr.manageTaskEvents(model, type).then((resp) => {
      if (resp.ok && resp.status == 200) {
        return resp.json().then((rData) => {
          switch (type) {
            case "R":
              let eventData = [];
              rData.forEach((x) => {
                x.start = new Date(x.DateFrom.split("T")[0]+"T"+x.TimeFrom.split("T")[1]);
                x.end = new Date(x.DateTo.split("T")[0]+"T"+x.TimeTo.split("T")[1]);
                x.title = x.Name;
                x.eventNumber =  x.TaskId>70? x.TaskId>85? '0/0' : '3/5':'2/7';    
                eventData.push(x);
              });
              this.setState({ events: eventData });
              break;
            case "E":
              let newData = [];
              rData.forEach((x) => {
                if (x.allday) {
                  // x.start = new Date(Date.parse(x.start))
                  // x.end = new Date(Date.parse(x.end))
                  x.start = new Date(Date.parse(`${x.start} ${x.startTime}`));
                  x.end = new Date(Date.parse(`${x.end} ${x.endTime}`));
                } else {
                  x.start = new Date(Date.parse(`${x.start} ${x.startTime}`));
                  x.end = new Date(Date.parse(`${x.end} ${x.endTime}`));
                }
                newData.push(x);
              });
              console.log(newData);
              this.setState({ events: newData });
              break;
            case "DT":
              if (rData != null) {
                let singleEvtData = null;
                if (rData.isAllday) {
                  rData.startDate = new Date(Date.parse(rData.startDate));
                  rData.endDate = new Date(Date.parse(rData.endDate));
                  rData.startTime = new Date();
                  rData.endTime = new Date();
                } else {
                  rData.startTime = new Date(
                    Date.parse(`${rData.startDate} ${rData.startTime}`)
                  );
                  rData.endTime = new Date(
                    Date.parse(`${rData.endDate} ${rData.endTime}`)
                  );
                  rData.startDate = new Date(Date.parse(rData.startDate));
                  rData.endDate = new Date(Date.parse(rData.endDate));
                }

                if (rData.repeat !== "Do not repeat") {
                  rData.repeateEndBy = new Date(Date.parse(rData.repeateEndBy));
                }

                singleEvtData = rData;
                // find assignee id
                let currAssignee = this.state.assigneeList.filter(
                  (x) => x.emailAddress === singleEvtData.assignToEmail
                );

                singleEvtData.assigneeId = currAssignee[0].id;

                let htmlcontent = singleEvtData.description;
                const blocksFromHtml = htmlToDraft(htmlcontent);
                const { contentBlocks, entityMap } = blocksFromHtml;
                const contentState = ContentState.createFromBlockArray(
                  contentBlocks,
                  entityMap
                );
                const editorState = EditorState.createWithContent(contentState);
                EventDetailsModelInstance.setDescription(editorState);
                EventDetailsModelInstance.setEventId(singleEvtData.eventId);
                EventDetailsModelInstance.setCategoryId(
                  singleEvtData.categoryId
                );
                EventDetailsModelInstance.setTitle(singleEvtData.title);
                EventDetailsModelInstance.setType(singleEvtData.type);
                EventDetailsModelInstance.setStartDate(singleEvtData.startDate);
                EventDetailsModelInstance.setStartTime(singleEvtData.startTime);
                EventDetailsModelInstance.setEndDate(singleEvtData.endDate);
                EventDetailsModelInstance.setEndTime(singleEvtData.endTime);
                EventDetailsModelInstance.setisAllday(singleEvtData.isAllday);
                EventDetailsModelInstance.setColor(singleEvtData.color);
                EventDetailsModelInstance.setNotificationBefore(
                  singleEvtData.notificationBefore
                );
                EventDetailsModelInstance.setRepeat(singleEvtData.repeat);
                EventDetailsModelInstance.setAssignee(singleEvtData.assigneeId);
                EventDetailsModelInstance.setRepeateEndBy(
                  singleEvtData.repeateEndBy
                );
                EventDetailsModelInstance.setSubEventId(
                  singleEvtData.subEventId
                );
                EventDetailsModelInstance.setCompletedBy(
                  singleEvtData.completedBy
                );
                EventDetailsModelInstance.setEventNumber(
                  singleEvtData.eventNumber
                );
                EventDetailsModelInstance.setIsDeleteRequest(
                  singleEvtData.isDeleteRequest
                );
                EventDetailsModelInstance.setStatusRequest(
                  singleEvtData.status
                );
                this.setState(
                  {
                    EventDetailsModelInstance: EventDetailsModelInstance,
                    showDetailsModal: true,
                    detailspageHtmlFormatDesc: singleEvtData.description,
                  },
                  () => {
                    console.log(this.state.EventDetailsModelInstance);
                  }
                );
              }
              break;
            default:
          }
        });
      }
    });
  };

  handleEventSelect = (event) => {
    console.log(event);
    this.setState({ PageMode: "ViewTask",showTaskEventModal: true, eventData:event });
  };

  closeModal = () => {
    this.setState(
      {
        PageMode: "Home",
        showEventTaskModal: false,
      }
    );
  };

  // filter code
  eventTypeFilter = (val) => {
    this.setState({ filterEventType: val }, () => this.getEvents());
  };

  eventAssigneeFilter(value, event) {
    this.setState({ setSelectedOptionsAssignee: value }, () => {
      let data = this.state.setSelectedOptionsAssignee.map((item) => {
        return item.Id;
      });
      this.setState({ filterAssignee: data.join(",") }, () => this.getEvents());
    });
  }

  eventCategoryFilter(value, event) {
    this.setState({ setSelectedOptionsCategory: value }, () => {
      let data = this.state.setSelectedOptionsCategory.map((item) => {
        return item.Id;
      });
      this.setState({ filterCategroy: data.join(",") }, () => this.getEvents());
    });
  }
  eventStatusFilter(value) {
    this.setState({ filterEventStatus: value }, () => {
      this.getEvents();
    });
  }
  render() {
    return (
      <div>
        {this.state.PageMode === "Home" && (
          <div className="row">
            <div className="col-12">
              <div className="card task-calendar-shell">
                <div className="card-header d-flex p-0">
                  <ul className="nav ml-auto tableFilterContainer">
                    {/* <li className="nav-item">
                                            <select
                                                className="form-control"
                                                value={this.state.filterEventType}
                                                onChange={(e) => { this.eventTypeFilter(e.target.value) }}>
                                                <option value="NULL">Filter Event Type</option>
                                                <option value="E">Event</option>
                                            </select>
                                        </li> */}
                    <li className="nav-item">
                      <select
                        className="form-control"
                        value={this.state.filterEventStatus}
                        onChange={(e) => {
                          this.eventStatusFilter(e.target.value);
                        }}
                      >
                        <option value="NULL">Filter Event Status</option>
                        {this.state.taskStatusList
                          ? this.state.taskStatusList.map((e, key) => {
                              return (
                                <option key={key} value={e.statusName}>
                                  {e.statusName}
                                </option>
                              );
                            })
                          : null}
                      </select>
                    </li>
                    <li
                      className="nav-item"
                      style={{ width: "300px", zIndex: "999" }}
                    >
                      <MultiSelectInline
                        ID="ddlFilterCategory"
                        isMulti={true}
                        value={this.state.setSelectedOptionsCategory}
                        onChange={this.eventCategoryFilter.bind(this)}
                        options={this.state.filterCategoryList}
                        placeholder="Filter by Category"
                      />
                    </li>
                    <li
                      className="nav-item"
                      style={{ width: "300px", zIndex: "999" }}
                    >
                      <MultiSelectInline
                        ID="ddlFilterAssignnee"
                        isMulti={true}
                        value={this.state.setSelectedOptionsAssignee}
                        onChange={this.eventAssigneeFilter.bind(this)}
                        options={this.state.filterAssigneeList}
                        placeholder="Filter by Assignee"
                      />
                    </li>
                  </ul>
                </div>
                <div className="card-body pt-2">
                  <Calendar
                    localizer={localizer}
                    events={this.state.events}
                    startAccessor="start"
                    endAccessor="start"
                    style={{ height: 650 }}
                    step={30}
                    showMultiDayTimes
                  
                    popup
                    onSelectEvent={this.handleEventSelect}
                    // onSelectSlot={this.handleSelect}
                    eventPropGetter={this.eventStyleGetter}
                    components={{
                      event: this.eventStyle,
                      timeSlotWrapper: ColoredDateCellWrapper,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {this.state.showAddModal && (
          <AddEventTask
            showAddModal={this.state.showAddModal}
            closeModal={this.closemodal}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            showAttachmentmodal={this.showAttachmentmodal}
            categoryList={this.state.categoryList}
            assigneeList={this.state.assigneeList}
            propertyId={this.props.PropertyId}
            getEvents={this.getEvents}
          />
        )}

        {this.state.PageMode === "ViewTask" && (
          <ViewTaskEvent
            showTaskModal={this.state.showTaskEventModal}
            closeModal={this.closeModal}
            rowData={this.state.eventData}
          />
        )}

      </div>
    );
  }
}

function mapStoreToprops(state, props) {
  return {
    PropertyId: state.Commonreducer.puidn,
  };
}

function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators(departmentAction, dispatch);
  return { actions };
}
export default connect(mapStoreToprops, mapDispatchToProps)(TaskEventCalendar);
