import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import departmentAction from "../../../../redux/department/action.js";
import ApiProvider from "../../DataProvider";
import LayoutDataProvider from "../../../../Routing/LayoutDataProvider";
import createInitialState from "./initialState";
import TaskListView from "./components/TaskListView";

import attachApiMethods from "./methods/apiMethods";
import attachActionMethods from "./methods/actionMethods";
import attachExportMethods from "./methods/exportMethods";
import attachRenderMethods from "./methods/renderMethods";

class TaskList extends Component {
  constructor(props) {
    super(props);
    this.ApiProvider = new ApiProvider();
    this.comdbprovider = new LayoutDataProvider();
    this.state = createInitialState(this);
    const methodsToBind = [
      "AddNew",
      "Filter",
      "Reset",
      "AddQuestion",
      "ViewTask",
      "EditTask",
      "DeleteTask",
      "closeModal",
      "handleExportWithQuestions",
    ];

    methodsToBind.forEach((methodName) => {
      if (typeof this[methodName] === "function") {
        this[methodName] = this[methodName].bind(this);
      }
    });
  }

  render() {
    return <TaskListView ctx={this} />;
  }
}

attachApiMethods(TaskList);
attachActionMethods(TaskList);
attachExportMethods(TaskList);
attachRenderMethods(TaskList);

const mapStateToProps = (state) => {
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

export default connect(mapStateToProps, mapDispatchToProps)(TaskList);
