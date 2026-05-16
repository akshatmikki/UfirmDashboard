import * as React from 'react';
import UserHome from '../MainComponents/User/UserHome.jsx';
import UserNew from '../MainComponents/User/UserNew.jsx';
import UserView from '../MainComponents/User/UserView.jsx';

import { connect } from 'react-redux';
import departmentAction from '../redux/department/action';
import { promiseWrapper } from '../utility/common';
import { bindActionCreators } from 'redux';
// import { CheckIsMandatory } from '../Common/Validation/ValidationCommon.js';

class User extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            PageMode: 'Home',
            PageTitle: 'User Home',
            Value: {
                UserType: [], userTypeId: "0",
                City: [], cityId: "0",
                Branch: [], branchId: "0",
                Departments: [], departmentsId: "0",
                Role: [], roleId: "0",
                Vendor: [], vendorId: "0",
                Company: [], companyId: "0",
                Property: [], propertyId: "0",
            },
            ShowImage: true,
        }
    }
    componentDidMount() {

        promiseWrapper(this.props.actions.fetchCompany, { CompanyId: 0 }).then((data) => {
            let companyData = [{ "Id": "0", "Name": "Select Company" }];
            data.forEach(element => {
                companyData.push({ Id: element.companyId, Name: element.companyName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Company = companyData; return { Value } });
        });

        //Initiated Branch dropdown
        let branchData = [{ "Id": "0", "Name": "Select Branch" }];
        this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Branch = branchData; return { Value } });

        promiseWrapper(this.props.actions.fetchDepartments, { DepartmentsId: 0 }).then((data) => {
            let departmentData = [{ "Id": "0", "Name": "Select Department" }];
            data.forEach(element => {
                departmentData.push({ Id: element.departmentId, Name: element.departmentName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Departments = departmentData; return { Value } });
        });
        promiseWrapper(this.props.actions.fetchUserRole, { UserRoleId: 0 }).then((data) => {
            let userRoleData = [];
            data.forEach(element => {
                userRoleData.push({ Id: element.userRoleId, Name: element.userRoleName, value: element.userRoleName, label: element.userRoleName, color: '#0052CC' });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Role = userRoleData; return { Value } });
        });
        promiseWrapper(this.props.actions.fetchVendor, { VendorId: 0 }).then((data) => {
            let vendorData = [{ "Id": "0", "Name": "Select Vendor" }];
            data.forEach(element => {
                vendorData.push({ Id: element.vendorId, Name: element.vendorName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Vendor = vendorData; return { Value } });
        });
        promiseWrapper(this.props.actions.fetchUserType, { UserTypeId: 0 }).then((data) => {
            console.log(this.state.Data);
            let userTypeData = [{ "Id": "0", "Name": "Select User Type" }];
            data.forEach(element => {
                userTypeData.push({ Id: element.userTypeId, Name: element.userTypeName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.UserType = userTypeData; return { Value } });
        });
        promiseWrapper(this.props.actions.fetchCity, { CityId: 0 }).then((data) => {
            let cityData = [{ "Id": "0", "Name": "Select City" }];
            data.forEach(element => {
                cityData.push({ Id: element.cityId, Name: element.cityName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.City = cityData; return { Value } });
        });



        promiseWrapper(this.props.actions.fetchProperty, { PropertyId: 0 }).then((data) => {
            let propertyData = [];
            data.forEach(element => {
                propertyData.push({ Id: element.id, Name: element.text, value: element.text, label: element.text, color: '#0052CC' });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Property = propertyData; return { Value } });
        });
    }

    componentDidUpdate() {
        console.log(this.state.Value);
    }

    onChangeUserType(e) {
        
        console.log(e);
    }

    managepagemode(pagetype, data) {

        this.setState({ PageMode: pagetype, PageTitle: 'User ' + pagetype, Data: data });
    }

    onChangeBranch(value) {
        
        promiseWrapper(this.props.actions.fetchBranch, { CompanyId: value, BranchId: 0 }).then((data) => {
            let branchData = [{ "Id": "0", "Name": "Select Branch" }];
            data.forEach(element => {
                branchData.push({ Id: element.branchId, Name: element.branchName });
            });
            this.setState(prevState => { let Value = Object.assign({}, prevState.Value); Value.Branch = branchData; return { Value } });
        });
    }

    onChange(userTypeId) {
        
        this.setState(prevState => {
            let Data = Object.assign({}, prevState.Data);
            Data.userTypeId = userTypeId;
            return { Data }
        });
    }
    // onChangeAdd(userTypeId) {   
    //     
    //     this.setState(prevState => { 
    //         let Value = Object.assign({}, prevState.Value); 
    //         Value.Selected  = userTypeId; 
    //         return { Value } 
    //     });
    // }

    render() {

        return (
            <div className="content-wrapper">
                <div className="content-header">
                    <div className="container-fluid">
                        <div className="row mb-2">
                            <div className="col-sm-6">
                                <h1 className="m-0 text-dark">User Master</h1>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right">
                                    <li className="breadcrumb-item"><a href="/">Home</a></li>
                                    <li className="breadcrumb-item active"><a href="/user">User</a> </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <section className="content">
                    <div className="container-fluid">
                        <div className="container-fluid">
                            {this.state.PageMode === 'Home' &&
                                <UserHome
                                    Id="AddNewDepartment"
                                    Value={this.state.Value}
                                    Action={this.managepagemode.bind(this)} />
                            }
                            {this.state.PageMode === 'Add' &&
                                <UserNew

                                    Id="AddNewDepartment"
                                    PageMode={this.state.PageMode}
                                    Value={this.state.Value}
                                    CompanyValue={this.onChangeBranch.bind(this)}
                                    //onNameChangeAdd={this.onChangeAdd.bind(this)}
                                    Action={this.managepagemode.bind(this)}
                                    Title={this.state.PageMode} />
                            }
                            {this.state.PageMode === 'View' &&
                                <UserView
                                    Id="viewDepartment"
                                    Data={this.state.Data}
                                    Value={this.state.Value}
                                    Action={this.managepagemode.bind(this)}
                                    Title={this.state.PageMode} />
                            }
                            {this.state.PageMode === 'Edit' &&
                                <UserNew
                                    Id="AddNewDepartment"
                                    PageMode={this.state.PageMode}
                                    Data={this.state.Data}
                                    Value={this.state.Value}
                                    CompanyValue={this.onChangeBranch.bind(this)}
                                    onNameChange={this.onChange.bind(this)}
                                    Action={this.managepagemode.bind(this)}
                                    Title={this.state.PageMode} />
                            }
                        </div>
                    </div>
                </section>
            </div>
        );
    }
}
function mapStoreToprops(state, props) {
    return {}
}

function mapDispatchToProps(dispatch) {
    const actions = bindActionCreators(departmentAction, dispatch);
    return { actions };
}
export default connect(mapStoreToprops, mapDispatchToProps)(User);

