import React, { Fragment } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import { getAllClients, getPropertiesByClientId } from "../Services/ClientService.js";
import { getAllProperties } from "../Services/PropertyService";
import TicketingDashboard from "../MainComponents/Ticket/TicketingDashboard";
import Department from "../pages/Department";
import Home from "../MainComponents/Home/Home";
import User from "../pages/User";
import PropertyMember from "../pages/PropertyMember";
import UserProfile from "../pages/UserProfilePage";
import ChangePassword from "../MainComponents/ChangePassword/ChangePassword";
import DropDownList from "../ReactComponents/SelectBox/DropdownList";
import ComplainManagement from "../pages/ComplainManagement";
import PropertyMaster from "../MainComponents/PropertyMaster/PropertyMaster.jsx";
import PropertyDetailsPage from "../pages/PropertyDetailsPage";
import ParkingZonePage from "../pages/ParkingZonePage";
import TicketCategoriesPage from "../pages/TicketCategoriesPage";
import PropertyTower from "../pages/PropertyTowerPage";
import PropertyAssignmentPage from "../pages/PropertyAssignmentPage";
import ParkingDetailsPage from "../pages/ParkingDetailsPage";
import FacilityMember from "../MainComponents/FacilityMember/FacilityMember";
import FacilityLatlongPage from "../pages/FacilityLatlongPage";
import ParkingAssignmentPage from "../pages/ParkingAssignmentsPage";
import EmergencyContactPage from "../pages/EmergencyContactPage";
import LayoutDataProvider from "./LayoutDataProvider.js";
import * as appCommon from "../Common/AppCommon.js";
import Notification from "../MainComponents/Notification Center/Notification.jsx";
import LeaveDashboard  from "../MainComponents/Attendance/EmployeeLeaveRemaining.jsx";
import ApiService from "../apiService";
import { getConfig } from "../utility/apiConfig";
import { getManagedEmployeesByIdentity } from "../Services/UserAccessService";
import { normalizeRoles } from "../Common/roleUtils";
import { ROLE_RULES } from "../Common/roleAccess";
//redux
import departmentActions from "../redux/department/action";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import AmenitiesAssignmentPage from "../pages/AmenitiesAssignmentPage";
import AmenitiesBookingPage from "../pages/AmenitiesBookingPage";
import AmenitiesMasterPage from "../pages/AmenitiesMasterPage";
import ManageResidentOwnersPage from "../pages/ManageResidentOwnersPage";
import ManageFlatPage from "../pages/ManageFlatPage";
import DocumentTypeMasterPage from "../pages/DocumentTypeMasterPage";
import AssetsMasterPage from "../pages/AssetsMasterPage";
import CheckInCheckOut from "../pages/checkIn-checkOutPage.jsx";
import RentalAssets from "../pages/RentalAssets.jsx";
import CategoryPage from "../MainComponents/Inventory/CategoryPage.jsx";
import VendorPage from "../MainComponents/Inventory/VendorPage.jsx";
import RateCardPage from "../MainComponents/Inventory/RateCardPage.jsx";
import EscalationGroupPage from "../pages/EscalationGroupPage";
import EscalationMatrixPage from "../pages/EscalationMatrixPage";
import NoticeBoardPage from "../pages/NoticeBoardPage";
import PropertyEmployees from "../pages/PropertyEmployees";
import PendingApprovalPage from "../pages/PendingApprovalPage";
import KanbanBoardPage from "../pages/KanbanBoardPage";
import EventCalendarPage from "../pages/EventCalendarPage";
import TaskEventCalendarPage from "../pages/TaskEventCalendarPage.jsx";
import PropertyOwnerPage from "../pages/PropertyOwnerPage.jsx";
import PropertyTenatsPage from "../pages/PropertyTenatsPage.jsx";
import RwaMemberPage from "../pages/RwaMemberPage";
import CalendarCategoryPage from "../pages/CalendarCategoryPage";
import CalendarSubCategoryPage from "../pages/CalendarSubCategoryPage";
import EventApproval from "../pages/EventApproval.jsx";
import PlannerTaskPage from "../pages/PlannerTaskPage.jsx";
import PlannerTaskAuditPage from "../pages/PlannerTaskAuditPage.jsx";
import KYCPage from "../pages/KYCPage.jsx";
import EmployeePage from "../pages/EmployeePage.jsx";
import GuardMasterPage from "../pages/GuardMasterPage";
import ResidentEventPage from "../pages/ResidentEventPage.jsx";
import PlannerTaskStatus from "../pages/PlannerTaskStatus.jsx";
import GuardListPage from "../pages/GuardListPage.jsx";
import AssetTrackingPage from "../pages/AssetTrackingPage.jsx";
import PlannerTaskAnalysisPage from "../pages/PlannerTaskAnalysisPage.jsx";
import UploaderPage from "../pages/UploaderPage";
import CreateNewUser from "../MainComponents/NewUser/CreateNewUser";
import AddNewUser from "../MainComponents/NewUser/AddNewUser";
import ServiceRecords from "../pages/ManageAssets";
import PPMSpreadsheet from "../pages/PPMSpreadsheet";
import FrequencyMasterPage from "../pages/FrequencyMasterPage";
import ItemMasterPage from "../MainComponents/Inventory/itemPage";
import PurchaseOrderPage from "../MainComponents/Inventory/PurchaseOrderMaster";
import StockPage from "../MainComponents/Inventory/StockMaster";
import StockItemsPage from "../pages/StockItemsPage";
import AttendanceMaster from "../MainComponents/Attendance/attendance.jsx";
import Leave from "../MainComponents/Attendance/Leaves.jsx";
import Visitor from "../MainComponents/Visitor/Visitor.jsx";
import FacilityLatlong from "../MainComponents/FacilityMember/FacilityLatlong.jsx";
import LeaveMaster from "../MainComponents/Attendance/LeaveMaster.jsx";
import EmployeeLeave from "../MainComponents/FacilityMember/EmployeeLeave.jsx";
import SparePage from "../MainComponents/AssetsMaster/SpareMaster.jsx";
import SpotVisitCalendar from "../MainComponents/Calendar/SpotVisitCalendar.jsx";
import AllowanceDeduction from "../MainComponents/Payroll/AllowanceDeduction.jsx";
import SalaryGroups from "../MainComponents/Payroll/SalaryGroups.jsx";
import ExpenseMaster from "../MainComponents/Expense/ExpenseMaster.jsx";
import ExpenseTypeMaster from "../MainComponents/Expense/ExpenseTypeMaster.jsx";
import ExpenseReport from "../MainComponents/Expense/ExpenseReport.jsx";
// import Formula from "../MainComponents/FacilityMember/Formula.jsx";
import GenerateSalary from "../MainComponents/Payroll/GenerateSalary.jsx";
import ProfessionalTax from "../MainComponents/Payroll/ProfessionalTax.jsx";
import LabourFund from "../MainComponents/Payroll/LabourFund.jsx";
import AttendanceSheet from "../MainComponents/Payroll/AttendanceSheet.jsx";
import Linking from "../MainComponents/Payroll/Linking.jsx";
import ItemAssignedPage from "../MainComponents/Inventory/ItemAssigned.jsx";
import ItemSpecificationPage from "../MainComponents/Inventory/ItemSpecification.jsx";
// import OTHours from "../MainComponents/Payroll/OTHours.jsx";
import ClientMasterPage from "../MainComponents/PropertyMaster/ClientMaster.jsx";
import AD_Percentage from "../MainComponents/Payroll/AD_Percentage.jsx";
import SGNEW from "../MainComponents/Payroll/SGNEW.jsx";
import DMRReport from "../MainComponents/Reports/DMRReport.jsx";
import AttendanceReportPage from "../MainComponents/Reports/AttendanceReport.jsx";
import Report from "../MainComponents/Payroll/Report.jsx";
import BranchMaster from "../MainComponents/FacilityMember/BranchMaster.jsx";
import AttendanceBiometricReport from "../MainComponents/Reports/AttendanceBiometricReport.jsx";

var currentpropertyid;
var currentclientid;
class MainNav extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      UserName: "Test User",
      UserProfileImg:
        "https://account.ufirm.in/assets/cdn/public/profileimg/default.jpg",
      PropertyData: [],
      PropertyMultiData: [],
      selectedPropertyOptions: [],
      selectedClientId: 0,
      clientData: [],
      userRoles: [],
    };
    this.managedEmployeesRequested = false;
    this.comdbprovider = new LayoutDataProvider();
  }

  loaduserRole() {
    this.comdbprovider.getUserRoles().then((resp) => {
      if (resp && resp.ok && resp.status === 200) {
        resp.json().then((rData) => {
          this.onUpdateUserRole(rData);
          const normalizedRoles = normalizeRoles(rData);
          const appElement = document.getElementById("app");
          if (appElement && normalizedRoles.length > 0) {
            appElement.setAttribute("userrole", normalizedRoles.join(","));
          }
          this.tryLoadManagedEmployees();
          this.setState({ userRoles: normalizedRoles }, () => {
            if (this.isHrRole()) {
              this.loadClient();
            } else if (this.isManagerRole()) {
              this.loadAllProperties();
            } else {
              this.loadProperty();
            }
          });
        });
      }
    });
  }

  loadCurrentUserInfo = async () => {
    try {
      const config = getConfig("common.fetchUserById");
      if (!config) return;
      config.pathVariables = { UserId: 0 };
      const api = new ApiService(config);
      const res = await api.call();
      const data = res?.data;
      if (!data) return;

      const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      const appElement = document.getElementById("app");
      if (appElement) {
        if (fullName) appElement.setAttribute("username", fullName);
        if (data.userId != null) appElement.setAttribute("userid", String(data.userId));
        if (data.profileImageUrl) appElement.setAttribute("profileimg", data.profileImageUrl);
      }

      if (fullName) {
        this.setState({ UserName: fullName });
      }
      if (data.profileImageUrl) {
        this.setState({ UserProfileImg: data.profileImageUrl });
      }

      this.tryLoadManagedEmployees();
    } catch (error) {
      console.error("Failed to load current user info:", error);
    }
  };

  tryLoadManagedEmployees = () => {
    if (this.managedEmployeesRequested) return;
    const appElement = document.getElementById("app");
    const userName = appElement?.getAttribute("username");
    const userRole = appElement?.getAttribute("userrole");
    if (!userName || !userRole) return;
    this.managedEmployeesRequested = true;
    this.loadManagedEmployees(userName, userRole);
  };

  loadManagedEmployees = async (userName, userRole) => {
    if (!userName || !userRole) return;
    try {
      const response = await getManagedEmployeesByIdentity(userName, userRole);
      const isAdmin = !!response?.IsAdmin;
      const employees = Array.isArray(response?.Employees) ? response.Employees : [];
      const employeeIds = employees
        .map((emp) => Number(emp.FacilityMemberId))
        .filter((id) => Number.isFinite(id));
      this.props.actions.setManagedEmployees({
        employees,
        employeeIds,
        isAdmin,
        managerFacilityMemberId: response?.ManagerFacilityMemberId ?? null
      });
    } catch (error) {
      console.error("Failed to load managed employees:", error);
      this.props.actions.setManagedEmployees({
        employees: [],
        employeeIds: [],
        isAdmin: false,
        managerFacilityMemberId: null
      });
    }
  };

  loadClient = async () => {
    try {
      const rData = await getAllClients();
      this.setState({ clientData: rData || [] });
    } catch (error) {
      this.setState({ clientData: [] });
    }
  };

  loadPropertyByClient = async (clientId) => {
    try {
      const rawData = await getPropertiesByClientId(clientId);
      const propertyList = (rawData || []).map((item) => ({
        Value: item.PropertyId || item.Value || item.id || 0,
        Name: item.Name || item.PropertyName || item.text || "",
      }));
      const propertyMultiOptions = propertyList.map((item) => ({
        label: item.Name,
        value: item.Value,
      }));
      this.setState({
        PropertyData: propertyList,
        PropertyMultiData: propertyMultiOptions,
        selectedPropertyOptions: [],
      });
      this.props.actions.updateproperty({ CompanyId: 0, PropertyIds: [] });
    } catch (error) {
      this.setState({
        PropertyData: [],
        PropertyMultiData: [],
        selectedPropertyOptions: [],
      });
      this.props.actions.updateproperty({ CompanyId: 0, PropertyIds: [] });
    }
  };

  loadAllProperties = async () => {
    try {
      const rawData = await getAllProperties();
      const propertyList = (rawData || []).map((item) => ({
        Value: item.PropertyId || item.Value || item.id || 0,
        Name: item.Name || item.PropertyName || item.text || "",
      }));
      this.setState({
        PropertyData: propertyList,
        PropertyMultiData: [],
        selectedPropertyOptions: [],
      });
      if (propertyList.length === 1) {
        this.onPropertyChanged(propertyList[0].Value);
      } else {
        this.props.actions.updateproperty({ CompanyId: 0, PropertyIds: [] });
      }
    } catch (error) {
      this.setState({
        PropertyData: [],
        PropertyMultiData: [],
        selectedPropertyOptions: [],
      });
      this.props.actions.updateproperty({ CompanyId: 0, PropertyIds: [] });
    }
  };

  loadProperty() {
    this.comdbprovider.getUserAssignedproperty().then((resp) => {
      if (resp && resp.ok && resp.status === 200) {
        return resp.json().then((rData) => {
          rData = appCommon.changejsoncolumnname(rData, "id", "Value");
          rData = appCommon.changejsoncolumnname(rData, "text", "Name");
          this.setState({ PropertyData: rData, PropertyMultiData: [] }, () => {
            if (rData.length === 1) {
              this.onPropertyChanged(rData[0].Value);
            }
          });
        });
      }
    });
  }

  componentDidMount() {


    var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdG5hbWUiOiJBZG1pbiIsImxhc3RuYW1lIjoiQWRtaW4iLCJpbmZvX3QiOiJoZ0NycCtRcUF1cVlzRmxqaGVkMk1IKzhRekN2REZxRmRHVUVsbUw0NCtVcTNTVFJEYWxyNDJBNE0xL3dWRGhJcXNsMlBDTlp6QTZvTFVqUlFua1BXMkEzcEhSclJ5L2EvWWtIM0l1YzZ6alRPdXNFemFSUVpKTWRleTRHRG9OOUJIUCthM3U4dXFZTnZ3bFRDeUdVUDZXWlh6Zkc0VjhlM2pRMTdCdC9jTDA5OVZtUktsN3NKK3ZGdFB2blE0Nk40SFFjNGd2OEJuQ2VlNlVEdW15ejZ5S3p1K0F1bE9DSzhzZ3VPOWdLU3lEeVllZVZFMGZ2ZUVoQ1ZWQ2w3dUVuIiwibmJmIjoxNzczMDM3NjQ5LCJleHAiOjE4MDQ1NzM2NDksImlhdCI6MTc3MzAzNzY0OX0.3HXQ0J4Dpwf55U3mHWfu2lr0zTxc4VUXI4F3mGCDgqM";

    //var token = window.sessionStorage.getItem("userinfo_key")


    if (token === null) {
      const timerId = setTimeout(() => {
        this.componentDidMount();
      }, 1000);
    } else {
      this.loadCurrentUserInfo();
      this.loaduserRole();

      if (document.getElementById("app").getAttribute("profileimg") != null) {
        this.setState({
          UserProfileImg: document
            .getElementById("app")
            .getAttribute("profileimg"),
        });
      }

      if (document.getElementById("app").getAttribute("username") != null) {
        this.setState({
          UserName: document.getElementById("app").getAttribute("username"),
        });
      }
    }
  }
  isHrRole = () => {
    return ROLE_RULES.isHrRole(this.state.userRoles);
  };

  isAdminRole = () => ROLE_RULES.isAdminRole(this.state.userRoles);

  isManagerRole = () => ROLE_RULES.isManagerRole(this.state.userRoles);

  isPropertyManagerRole = () =>
    ROLE_RULES.isPropertyManagerRole(this.state.userRoles);


  onClientChanged = async (value) => {
    const clientId = Number(value) || 0;
    this.setState({
      selectedClientId: clientId,
      selectedPropertyOptions: [],
      PropertyData: [],
      PropertyMultiData: [],
    });
    this.props.actions.updateclient({ CompanyId: clientId });
    currentclientid = clientId;

    if (clientId > 0) {
      await this.loadPropertyByClient(clientId);
    }
  };

  onPropertyMultiChanged = (options) => {
    const selectedOptions = Array.isArray(options) ? options : [];
    const propertyIds = selectedOptions.map((item) => Number(item.value)).filter((id) => id > 0);
    const selectedPropertyId = propertyIds.length > 0 ? propertyIds[0] : 0;

    this.setState({ selectedPropertyOptions: selectedOptions });
    this.props.actions.updateproperty({
      CompanyId: selectedPropertyId,
      PropertyIds: propertyIds,
    });
    currentpropertyid = selectedPropertyId;
  };

  onPropertyChanged = (value) => {
    this.props.actions.updateproperty({
      CompanyId: value,
      PropertyIds: value ? [Number(value)] : [],
    });
    currentpropertyid = value;
  };
  onUpdateUserRole = (value) => {
    this.props.actions.updateuserrole({ UserRole: value });
  };
  render() {
    const roles = this.state.userRoles;
    const isHrRole = this.isHrRole();
    const canSeeAllPages = ROLE_RULES.canSeeAllPages(roles);
    const canAccessPlanner = ROLE_RULES.canAccessPlanner(roles);
    const canAccessAssetManagement = ROLE_RULES.canAccessAssetManagement(roles);
    const canAccessInventoryManagement = ROLE_RULES.canAccessInventoryManagement(roles);
    const canAccessPropertyManagement = ROLE_RULES.canAccessPropertyManagement(roles);
    const canAccessFacilityManagement = ROLE_RULES.canAccessFacilityManagement(roles);
    const canAccessPayrollManagement = ROLE_RULES.canAccessPayrollManagement(roles);
    const canAccessReports = ROLE_RULES.canAccessReports(roles);
    const canAccessParkingManagement = ROLE_RULES.canAccessParkingManagement(roles);
    const canAccessMasterSettings = ROLE_RULES.canAccessMasterSettings(roles);
    const canAccessUserManagement = ROLE_RULES.canAccessUserManagement(roles);
    const canAccessPropertySettings = ROLE_RULES.canAccessPropertySettings(roles);
    const canAccessComplaintManagement = ROLE_RULES.canAccessComplaintManagement(roles);
    const canAccessAmenities = ROLE_RULES.canAccessAmenities(roles);
    const canAccessUploader = ROLE_RULES.canAccessUploader(roles);
    const hideAttendanceForPropertyManager =
      ROLE_RULES.shouldHideAttendanceForPropertyManager(roles);
    return (
      <Router>
        <div className="wrapper">
          <nav className="main-header sticky-top navbar navbar-expand navbar-dark navbar-primary">
            <div className="navbar-nav">
              <div className="nav-item">
                <a
                  className="nav-link"
                  data-widget="pushmenu"
                  href="#"
                  role="button"
                >
                  <i className="fas fa-bars"></i>
                </a>
              </div>
              {!isHrRole && this.state.PropertyData.length === 1 && (
                <div className="nav-item d-none d-sm-inline-block">
                  <a href="#" className="nav-link">
                    {this.state.PropertyData[0].Name}
                  </a>
                </div>
              )}
            </div>
            <form className="form-inline ml-3">
              {isHrRole ? (
                <Fragment>
                  <div className="input-group input-group-sm mr-2">
                    <DropDownList
                      Id="ddlClient"
                      Name="Client"
                      onSelected={this.onClientChanged}
                      Options={(this.state.clientData || []).map((item) => ({
                        Value: item.ClientID || item.Value || item.id || 0,
                        Name: item.ClientName || item.Name || item.text || "",
                      }))}
                    />
                  </div>
                  {this.state.selectedClientId > 0 && (
                    <div className="input-group input-group-sm" style={{ minWidth: "260px" }}>
                      <DropDownList
                        Id="ddlProperty"
                        Name="Property"
                        onSelected={this.onPropertyChanged.bind(this)}
                        Options={this.state.PropertyData}
                      />
                    </div>
                  )}
                </Fragment>
              ) : (
                <Fragment>
                  {this.state.PropertyData.length > 1 && (
                    <div className="input-group input-group-sm">
                      <DropDownList
                        Id="ddlProperty"
                        onSelected={this.onPropertyChanged.bind(this)}
                        Options={this.state.PropertyData}
                      />
                    </div>
                  )}
                </Fragment>
              )}
            </form>
            <div className="navbar-nav  ml-auto ">
              <Notification />
              <div className="nav-item dropdown">
                <a
                  href="#"
                  data-toggle="dropdown"
                  className="dropdown-toggle nav-link dropdown-user-link"
                >
                  <span className="avatar avatar-online">
                    <img
                      src={this.state.UserProfileImg}
                      className="rounded-circle"
                      alt="Avatar"
                      width="35"
                      height="35"
                    ></img>
                  </span>
                  <span id="lblusername" className="user-name">
                    {this.state.UserName}
                  </span>
                </a>
                <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                  <Link to="/Account/App/UserProfile" className="dropdown-item">
                    <p>My Profile</p>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link to="/Account/App/ChangePassword" className="dropdown-item">
                    <p>Change Password </p>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <a href="/Account/Logout" className="dropdown-item">
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <aside className="main-sidebar elevation-4 sidebar-light-primary">
            <Link to="/Account/App" className="brand-link">
              <img
                src="https://account.ufirm.in/assets/cdn/public/img/Ufirm-fabicon.png"
                alt="UFIRM Logo"
                className="brand-image"
              ></img>
              <span className="brand-text">
                <img src="/Assets/firmity.png" alt="UFIRM Logo"></img>
              </span>
            </Link>
            <div className="sidebar ">
              <nav className="mt-2">
                <ul
                  className="nav nav-pills nav-sidebar flex-column"
                  data-widget="treeview"
                  role="menu"
                  data-accordion="false"
                >
                  {/* <li className="nav-item has-treeview">
                    <a href="#" className="nav-link">
                      <i className="nav-icon fas fa-tachometer-alt"></i>
                      <p>Dashboard</p>
                    </a>
                  </li> */}
                  {canAccessPlanner ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-calendar"></i>
                        <p>
                          Planner<i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        {
                          // this.state.userRoles.includes("Admin") || this.state.userRoles.includes("Property Admin") ?
                          <Fragment>
                            <li className="nav-item">
                              <Link
                                to="/Account/App/CalendarCategory"
                                className="nav-link"
                              >
                                <i className=" fas fa-caret-right nav-icon"></i>
                                <p>Category </p>
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link
                                to="/Account/App/CalendarSubCategory"
                                className="nav-link"
                              >
                                <i className=" fas fa-caret-right nav-icon"></i>
                                <p>Sub Category </p>
                              </Link>
                            </li>
                            <li className="nav-item">
                              <Link
                                to="/Account/App/FrequencyMaster"
                                className="nav-link"
                              >
                                <i className=" fas fa-caret-right nav-icon"></i>
                                <p>Frequency Master </p>
                              </Link>
                            </li>
                            {/* <li className="nav-item">
                              <Link
                                to="/EventApproval"
                                className="nav-link"
                              >
                                <i className=" fas fa-caret-right nav-icon"></i>
                                <p>Event Approval</p>
                              </Link>
                            </li> */}
                          </Fragment>
                          // : null
                        }

                        {/*<li className="nav-item">*/}
                        {/*  <Link*/}
                        {/*    to="/EventCalendar"*/}
                        {/*    className="nav-link"*/}
                        {/*  >*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Events</p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PlannerTask"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Tasks</p>
                          </Link>
                        </li>
                        {/* <li className="nav-item">
                                                        <Link to="/PlannerTaskAudit" className="nav-link">
                                                            <i className=" fas fa-caret-right nav-icon"></i>
                                                            <p>Tasks Audit</p>
                                                        </Link>
                                                    </li> */}
                        {/* <li className="nav-item">
                          <Link
                            to="/TaskAnalysis"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Tasks Analysis</p>
                          </Link>
                        </li> */}
                        {/* <li className="nav-item">
                          <Link
                            to="/Account/App/TaskEventsCalender"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Task Calendar</p>
                          </Link>
                        </li> */}
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PPMSpreadsheet"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>PPM Calendar</p>
                          </Link>
                        </li>
                        {/* <li className="nav-item">
                          <Link
                            to="/ResidentEvents"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Resident Events</p>
                          </Link>
                        </li> */}
                        {/*<li className="nav-item">*/}
                        {/*  <Link*/}
                        {/*    to="/TaskStatus"*/}
                        {/*    className="nav-link"*/}
                        {/*  >*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Task Status</p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}
                        <li className="nav-item">
                          <Link
                            to="/Account/App/GuardList"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Spot Visits</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/SpotVisitCalendar"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Spot Visit Calendar</p>
                          </Link>
                        </li>
                        {/* <li className="nav-item">
                                                        <Link to="/AttendanceSummary" className="nav-link">
                                                            <i className=" fas fa-caret-right nav-icon"></i>
                                                            <p>Attendance Summary</p>
                                                        </Link>
                                                    </li> */}
                      </ul>
                    </li>
                  ) : null}
                  {canAccessAssetManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-wrench"></i>
                        <p>
                          Asset Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/AssetsMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Assets Master</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/SpareMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Spare Master</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/CheckIn&CheckOut"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Check IN & OUT</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/RentalAssets"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Rental Assets</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/ServiceRecords"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Service Records</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/AssetTracking"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Asset Log</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}
                  {canAccessInventoryManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-boxes"></i>
                        <p>
                          Inventory Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link to="/Account/App/Category" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Category</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link to="/Account/App/Item" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Items</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link to="/Account/App/Vendors" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Vendors</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/RateCard" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Rate Card</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PurchaseOrders"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Purchase Orders</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/Stock" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Stock</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/StockItems"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Stock Items</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/ItemSpecification"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Item Specification</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ItemAssigned"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Item Assigned</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}
                  {canAccessPropertyManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-hotel"></i>
                        <p>
                          Property Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ManageResidentOwners"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Manage Resident/Owners</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/RwaMember"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Rwa Member</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link to="/Account/App/Notice" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Notice Bord</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/EmergencyContact"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Emergency Contact </p>
                          </Link>
                        </li>
                        {/* <li className="nav-item">
                                                <Link to="/PendingApproval" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Pending Approval</p>
                                                </Link>
                                            </li> */}
                        <li className="nav-item">
                          <Link
                            to="/Account/App/Employeeassignment"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Employee Assignment</p>
                          </Link>
                        </li>
                        <li className="nav-item ">
                          <Link
                            to="/Account/App/PropertyMember"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Rent Agreement</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}

                  {canAccessFacilityManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-address-book"></i>
                        <p>
                          Facility Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/FacilityMember"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Facility Member </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/Facility" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Facility Latlong </p>
                          </Link>
                        </li>

                        {canSeeAllPages ? (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/CreateNewUser"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Create New User</p>
                            </Link>
                          </li>
                        ) : null}

                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/Attendance"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Attendance</p>
                            </Link>
                          </li>
                        )}

                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/leavemaster"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Leave Master </p>
                            </Link>
                          </li>
                        )}
                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/EmployeeLeave"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Employee Leave </p>
                            </Link>
                          </li>
                        )}

                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/EmployeeLeaveRemaining"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Employee Leave Remaining </p>
                            </Link>
                          </li>
                        )}
                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link to="/Account/App/leave" className="nav-link">
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Leaves </p>
                            </Link>
                          </li>
                        )}
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ExpenseMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Expense Master </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ExpenseTypeMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Expense Type Master </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ExpenseReport"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Expense Report </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/Visitor" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Visitor </p>
                          </Link>
                        </li>

                        {/* <li className="nav-item">
                                        <Link to="/FacilityMember" className="nav-link">
                                            <i className=" fas fa-caret-right nav-icon"></i>
                                            <p>In Out Register</p>
                                        </Link>
                                    </li> */}
                        {/* <li className="nav-item">
                                        <Link to="/FacilityMember" className="nav-link">
                                            <i className=" fas fa-caret-right nav-icon"></i>
                                            <p>Get Pass</p>
                                        </Link>
                                    </li> */}
                      </ul>
                    </li>
                  ) : null}

                  {canAccessPayrollManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-rupee-sign"></i>
                        <p>
                          Payroll Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/GenerateSalary"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Generate Salary</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/AttendanceSheet"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Attendance Sheet</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/SGNEW"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Salary Groups</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/AllowanceDeduction"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Allowance Deduction</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link to="/Account/App/Linking" className="nav-link">
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Designation Linking</p>
                          </Link>
                        </li>

                        {/* <li className="nav-item">
                          <Link to="/Account/App/OTHours" className="nav-link">
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>OT Hours</p>
                          </Link>
                        </li> */}

                        <li className="nav-item">
                          <Link
                            to="/Account/App/Report"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Report Page</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/ProfessionalTax"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Professional Tax</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/LabourFund"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Labour Welfare Fund</p>
                          </Link>
                        </li>

                        <li className="nav-item">
                          <Link
                            to="/Account/App/AD_Percentage"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Percentage</p>
                          </Link>
                        </li>

                        {/* <li className="nav-item">
                          <Link to="/Account/App/Formula" className="nav-link">
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Formula</p>
                          </Link>
                        </li> */}

                        {/* <li className="nav-item">
                          <Link
                            to="/Account/App/SalaryGroups"
                            className="nav-link"
                          >
                            <i className="fas fa-caret-right nav-icon"></i>
                            <p>Salary Groups Old</p>
                          </Link>
                        </li> */}

                      </ul>
                    </li>
                  ) : null}
                  {canAccessReports ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-chart-bar"></i>
                        <p>
                          Report
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link to="/Account/App/DMRReport" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>DMR Report</p>
                          </Link>
                        </li>
                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link to="/Account/App/AttendanceReport" className="nav-link">
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Attendance Report</p>
                            </Link>
                          </li>
                        )}
                        {!hideAttendanceForPropertyManager && (
                          <li className="nav-item">
                            <Link to="/Account/App/AttendanceBiometricReport" className="nav-link">
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Attendance Biometric Report</p>
                            </Link>
                          </li>
                        )}
                      </ul>
                    </li>
                  ) : null}
                  {canAccessParkingManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-car"></i>
                        <p>
                          Parking Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ParkingZone"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Parking Zone </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ParkingDetails"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Parking Details </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ParkingAssignment"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Parking Assignment </p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}

                  {/* <li className="nav-item has-treeview">
                                        <a href="#" className="nav-link">
                                            <i className="nav-icon fas fa-user-tie"></i>
                                            <p>
                                                Property Members <i className="right fas fa-angle-left"></i>
                                            </p>
                                        </a>
                                        <ul className="nav nav-treeview">
                                            <li className="nav-item">
                                                <Link to="/ManageResidentOwners" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Manage Resident/Owners</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/ManageFlat" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Manage Flats</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/PropertyMember" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Change Ownership</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/PropertyMember" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Manage Flat/Property</p>
                                                </Link>
                                            </li>

                                            <li className="nav-item">
                                                <Link to="/PropertyMember" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Property Member</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/PropertyOwner" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Property Owner</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/Tenant" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Property Tenant</p>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link to="/PropertyAssignment" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Property Assignment </p>
                                                </Link>
                                            </li>
                                            <li className="nav-item ">
                                                <Link to="/PropertyMember" className="nav-link">
                                                    <i className=" fas fa-caret-right nav-icon"></i>
                                                    <p>Rent Agreement</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li> */}
                  {canAccessMasterSettings ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-cog"></i>
                        <p>
                          Master Settings
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/DocumentType"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Document Type</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}

                  {canAccessUserManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-user-cog"></i>
                        <p>
                          User Management
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        {canAccessUserManagement ? (
                          <li className="nav-item">
                            <Link
                              to="/Account/App/AddNewUser"
                              className="nav-link"
                            >
                              <i className=" fas fa-caret-right nav-icon"></i>
                              <p>Add New User </p>
                            </Link>
                          </li>
                        ) : null}
                        <li className="nav-item">
                          <Link to="/Account/App/user" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>User </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/department"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Department </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/KYC" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>KYC</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/Employee" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Employee Master</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/Attendance"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Attendance</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link to="/Account/App/Guard" className="nav-link">
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Guard Master</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}

                  {canAccessPropertySettings ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-building"></i>
                        <p>
                          Property Setttings
                          <i className="fas fa-angle-left right"></i>
                        </p>
                      </a>
                      <ul
                        className="nav nav-treeview"
                        style={{ display: "none" }}
                      >
                        
                        <li className="nav-item">
                          <Link
                            to="/Account/App/BranchMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Branch Master</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/ClientMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Client Master </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PropertyMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Property Master </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PropertyTower"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Property Towers </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/PropertyDetails"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Property Details </p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}
                  {canAccessComplaintManagement ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-ticket-alt"></i>
                        <p>
                          Complaint Management
                          <i className="fas fa-angle-left right"></i>
                          {/* <span className="badge badge-info right">6</span> */}
                        </p>
                      </a>

                      <ul
                        className="nav nav-treeview"
                        style={{ display: "none" }}
                      >
                        {/*<li className="nav-item">*/}
                        {/*  <Link to="/Complain" className="nav-link">*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Open Tickets </p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}

                        <li className="nav-item">
                          <Link
                            to="/Account/App/TicketComplains"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Complains</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/TicketCategories"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Category</p>
                          </Link>
                        </li>
                        {/*<li className="nav-item">*/}
                        {/*  <Link*/}
                        {/*      to="/EscalationGroup"*/}
                        {/*      className="nav-link"*/}
                        {/*  >*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Escalation Matrix</p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}
                        {/*<li className="nav-item">*/}
                        {/*  <Link*/}
                        {/*      to="/EscalationMatrix"*/}
                        {/*      className="nav-link"*/}
                        {/*  >*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Complain Matrix</p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}
                        {/*<li className="nav-item">*/}
                        {/*  <Link to="/ticket" className="nav-link">*/}
                        {/*    <i className=" fas fa-caret-right nav-icon"></i>*/}
                        {/*    <p>Ticket</p>*/}
                        {/*  </Link>*/}
                        {/*</li>*/}
                      </ul>
                    </li>
                  ) : null}

                  {canAccessAmenities ? (
                    <li className="nav-item has-treeview">
                      <a href="#" className="nav-link">
                        <i className="nav-icon fas fa-dumbbell"></i>
                        <p>
                          Amenities Settings
                          <i className="right fas fa-angle-left"></i>
                        </p>
                      </a>
                      <ul className="nav nav-treeview">
                        <li className="nav-item">
                          <Link
                            to="/Account/App/AmenitiesMaster"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Amenities Master </p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/AmenitiesAssignment"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Amenities Assignment</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/Account/App/AmenitiesBooking"
                            className="nav-link"
                          >
                            <i className=" fas fa-caret-right nav-icon"></i>
                            <p>Amenities Booking</p>
                          </Link>
                        </li>
                      </ul>
                    </li>
                  ) : null}

                  {canAccessUploader ? (
                    <li className="nav-item has-treeview">
                      <Link to="/Account/App/UploaderPage" className="nav-link">
                        <i className="nav-icon fas fa-cloud-upload-alt "></i>
                        <p>Uploader </p>
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </nav>
            </div>
          </aside>
          <Switch>
            <Route
              exact
              path="/"
              render={() => <Redirect to="/Account/App" />}
            />

            <Route exact path="/Account/App" component={Home} />
            <Route exact path="/Account/App/ticket">
              <TicketingDashboard />
            </Route>
            <Route path="/Account/App/department">
              <Department />
            </Route>
            <Route path="/Account/App/ChangePassword">
              <ChangePassword />
            </Route>
            <Route path="/Account/App/team"></Route>
            <Route path="/Account/App/EmergencyContact">
              <EmergencyContactPage />
            </Route>
            <Route path="/Account/App/user">
              <User />
            </Route>
            <Route path="/Account/App/UserProfile">
              <UserProfile />
            </Route>
            <Route path="/Account/App/FacilityMember">
              <FacilityMember />
            </Route>
            <Route path="/Account/App/CreateNewUser">
              <CreateNewUser />
            </Route>
            <Route path="/Account/App/AddNewUser">
              <AddNewUser />
            </Route>
            <Route path="/Account/App/Facility">
              <FacilityLatlong />
            </Route>

            <Route path="/Account/App/CreateNewUser">
              <CreateNewUser />
            </Route>
            <Route path="/Account/App/AddNewUser">
              <AddNewUser />
            </Route>
            <Route path="/Account/App/CreateNewUser">
              <CreateNewUser />
            </Route>
            <Route path="/Account/App/AddNewUser">
              <AddNewUser />
            </Route>
            <Route path="/Account/App/CreateNewUser">
              <CreateNewUser />
            </Route>
            <Route path="/Account/App/AddNewUser">
              <AddNewUser />
            </Route>
            <Route path="/Account/App/PropertyMember">
              <PropertyMember />
            </Route>
            <Route path="/Account/App/PropertyOwner">
              <PropertyOwnerPage />
            </Route>
            <Route path="/Account/App/Tenant">
              <PropertyTenatsPage />
            </Route>

            {/* <Route path="/Home">
                            <PropertyDashboard />
                        </Route> */}

            <Route path="/Account/App/Complain">
              <ComplainManagement />
            </Route>
            <Route path="/Account/App/PropertyMaster">
              <PropertyMaster />
            </Route>
            <Route path="/Account/App/ClientMaster">
              <ClientMasterPage />
            </Route>
            <Route path="/Account/App/PropertyDetails">
              <PropertyDetailsPage />
            </Route>
            <Route path="/Account/App/SpareMaster">
              <SparePage />
            </Route>
            <Route path="/Account/App/ParkingDetails">
              <ParkingDetailsPage />
            </Route>
            <Route path="/Account/App/ParkingZone">
              <ParkingZonePage />
            </Route>
            <Route path="/Account/App/TicketCategories">
              <TicketCategoriesPage />
            </Route>
            <Route path="/Account/App/PropertyTower">
              <PropertyTower />
            </Route>
            <Route path="/Account/App/PropertyAssignment">
              <PropertyAssignmentPage />
            </Route>
            <Route path="/Account/App/ParkingAssignment">
              <ParkingAssignmentPage />
            </Route>
            <Route path="/Account/App/AmenitiesMaster">
              <AmenitiesMasterPage />
            </Route>
            <Route path="/Account/App/AmenitiesAssignment">
              <AmenitiesAssignmentPage />
            </Route>
            <Route path="/Account/App/AmenitiesBooking">
              <AmenitiesBookingPage />
            </Route>
            <Route path="/Account/App/KYC">
              <KYCPage />
            </Route>
            <Route path="/Account/App/Employee">
              <EmployeePage />
            </Route>
            <Route path="/Account/App/Attendance">
              <AttendanceMaster />
            </Route>
            <Route path="/Account/App/Guard">
              <GuardMasterPage />
            </Route>
            {/* <Route path="/Account/App/AttendanceRecords">
              <AttendanceRecordsPage />
            </Route> */}
            <Route path="/Account/App/ManageResidentOwners">
              <ManageResidentOwnersPage />
            </Route>
            <Route path="/Account/App/RwaMember">
              <RwaMemberPage />
            </Route>
            <Route path="/Account/App/ManageFlat">
              <ManageFlatPage />
            </Route>
            <Route path="/Account/App/DocumentType">
              <DocumentTypeMasterPage />
            </Route>
            <Route path="/Account/App/AssetsMaster">
              <AssetsMasterPage />
            </Route>
            <Route path="/Account/App/Category">
              <CategoryPage />
            </Route>
            <Route path="/Account/App/Item">
              <ItemMasterPage />
            </Route>
            <Route path="/Account/App/CheckIn&CheckOut">
              <CheckInCheckOut />
            </Route>
            <Route path="/Account/App/Vendors">
              <VendorPage />
            </Route>
            <Route path="/Account/App/RateCard">
              <RateCardPage />
            </Route>
            <Route path="/Account/App/PurchaseOrders">
              <PurchaseOrderPage />
            </Route>
            <Route path="/Account/App/Stock">
              <StockPage />
            </Route>
            {/* <Route path="/Account/App/Stock">
              <StockPage />
            </Route> */}
            <Route path="/Account/App/RentalAssets">
              <RentalAssets />
            </Route>
            <Route path="/Account/App/ServiceRecords">
              <ServiceRecords />
            </Route>
            <Route path="/Account/App/leave">
              <Leave />
            </Route>
            <Route path="/Account/App/Visitor">
              <Visitor />
            </Route>
            <Route path="/Account/App/ServiceRecords">
              <ServiceRecords />
            </Route>
            <Route path="/Account/App/Visitor">
              <Visitor />
            </Route>
            <Route path="/Account/App/ServiceRecords">
              <ServiceRecords />
            </Route>
            <Route path="/Account/App/EscalationGroup">
              <EscalationGroupPage />
            </Route>
            <Route path="/Account/App/EscalationMatrix">
              <EscalationMatrixPage />
            </Route>
            <Route path="/Account/App/Notice">
              <NoticeBoardPage />
            </Route>
            <Route path="/Account/App/Employeeassignment">
              <PropertyEmployees />
            </Route>
            <Route path="/Account/App/PendingApproval">
              <PendingApprovalPage />
            </Route>
            <Route path="/Account/App/TicketComplains">
              <KanbanBoardPage />
            </Route>
            <Route path="/Account/App/EventCalendar">
              <EventCalendarPage />
            </Route>
            <Route path="/Account/App/CalendarCategory">
              <CalendarCategoryPage />
            </Route>
            <Route path="/Account/App/FrequencyMaster">
              <FrequencyMasterPage />
            </Route>
            <Route path="/Account/App/CalendarSubCategory">
              <CalendarSubCategoryPage />
            </Route>
            <Route path="/Account/App/EventApproval">
              <EventApproval />
            </Route>
            <Route path="/Account/App/PlannerTask">
              <PlannerTaskPage />
            </Route>
            <Route path="/Account/App/TaskAnalysis">
              <PlannerTaskAnalysisPage />
            </Route>
            <Route path="/Account/App/PlannerTaskAudit">
              <PlannerTaskAuditPage />
            </Route>
            <Route path="/Account/App/TaskEventsCalender">
              <TaskEventCalendarPage />
            </Route>
            <Route path="/Account/App/PPMSpreadsheet">
              <PPMSpreadsheet />
            </Route>
            <Route path="/Account/App/ResidentEvents">
              <ResidentEventPage />
            </Route>
            <Route path="/Account/App/TaskStatus">
              <PlannerTaskStatus />
            </Route>
            <Route path="/Account/App/AssetTracking">
              <AssetTrackingPage />
            </Route>
            <Route path="/Account/App/GuardList">
              <GuardListPage />
            </Route>
            <Route path="/Account/App/UploaderPage">
              <UploaderPage />
            </Route>
            {/* <Route path="/Account/App/OTHours" component={OTHours} /> */}
            <Route path="/Account/App/BranchMaster" component={BranchMaster} />
            <Route path="/Account/App/Linking" component={Linking} />
            <Route
              path="/Account/App/AttendanceSheet"
              component={AttendanceSheet}
            />
            <Route path="/Account/App/LabourFund" component={LabourFund} />
            <Route
              path="/Account/App/ProfessionalTax"
              component={ProfessionalTax}
            />
            <Route
              path="/Account/App/AD_Percentage"
              component={AD_Percentage}
            />
            <Route
              path="/Account/App/GenerateSalary"
              component={GenerateSalary}
            />
            <Route
              path="/Account/App/Report"
              component={Report}
            />
            <Route path="/Account/App/SGNEW" component={SGNEW} />
            <Route path="/Account/App/SalaryGroups" component={SalaryGroups} />
            <Route
              path="/Account/App/AllowanceDeduction"
              component={AllowanceDeduction}
            />
            {/* <Route path="/Account/App/Formula" component={Formula} /> */}
            <Route
              path="/Account/App/SpotVisitCalendar"
              component={SpotVisitCalendar}
            />
            <Route
              path="/Account/App/ExpenseReport"
              component={ExpenseReport}
            />
            <Route
              path="/Account/App/AttendanceReport"
              component={AttendanceReportPage}
            />
            <Route
              path="/Account/App/ExpenseTypeMaster"
              component={ExpenseTypeMaster}
            />
            <Route
              path="/Account/App/ExpenseMaster"
              component={ExpenseMaster}
            />
            <Route path="/Account/App/leave" component={Leave} />
            <Route path="/Account/App/leavemaster" component={LeaveMaster} />
            <Route
              path="/Account/App/Facility"
              component={FacilityLatlongPage}
            />
            <Route path="/Account/App/DMRReport" component={DMRReport} />
            <Route path="/Account/App/AttendanceBiometricReport" component={AttendanceBiometricReport} />
            <Route
              path="/Account/App/EmployeeLeave"
              component={EmployeeLeave}
            />
            <Route path="/Account/App/EmployeeLeaveRemaining" component={LeaveDashboard} />
            <Route path="/Account/App/ItemSpecification">
              <ItemSpecificationPage />
            </Route>
            <Route path="/Account/App/ItemAssigned">
              <ItemAssignedPage />
            </Route>
            <Route path="/Account/App/StockItems">
              <StockItemsPage />
            </Route>

            {/* <Route path="/AttendanceSummary">
                            <AttendanceSummaryPage />
                        </Route> */}
          </Switch>
          <footer
            className="main-footer"
            style={{
              padding: "6px 15px",
              fontSize: "13px",
              lineHeight: "18px",
              background: "#ffffffff",
              borderTop: "1px solid #dcdde1",
              height: "0px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>
                © 2025-2026 <a href="https://firmity.in/">Firmity.in</a>
              </strong>
            </div>
            <div>
              <b>Version</b> 3.0.6-pre
            </div>
          </footer>

          <aside className="control-sidebar control-sidebar-dark"></aside>
        </div>
      </Router>
    );
  }
}

function mapStoreToprops(state, props) {
  return {
    // userName: state.Catalog.usreName,
    // structureList: state.Catalog.structureData,
    // languageCode: state.Catalog.languageCode,
    // structureData: state.Catalog.currentStructure,
    // categoryList: state.Catalog.navigationData,
    // globalSearch: state.Catalog.globalSearch
  };
}

function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators(departmentActions, dispatch);
  return { actions };
}
export default connect(mapStoreToprops, mapDispatchToProps)(MainNav);
