import * as React from 'react';
import UserHome from '../MainComponents/User/UserHome.jsx';
import UserNew from '../MainComponents/User/UserNew.jsx';
import UserView from '../MainComponents/User/UserView.jsx';

import { connect } from 'react-redux';
import departmentAction from '../redux/department/action';
import { bindActionCreators } from 'redux';
import {
    fetchBranches,
    fetchCities,
    fetchCompanies,
    fetchDepartments,
    fetchProperties,
    fetchRoles,
    fetchUserTypes,
} from '../MainComponents/NewUser/createNewUserService';
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
                Company: [], companyId: "0",
                Property: [], propertyId: "0",
            },
            ShowImage: true,
        }
    }
    componentDidMount() {
        this.loadLookups();
    }

    mapLookupList = (data, getId, getName, placeholder = null) => {
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows
            .map((item) => ({
                Id: getId(item),
                Name: getName(item),
            }))
            .filter((item) => item.Id != null && String(item.Name || "").trim() !== "");
        return placeholder ? [placeholder, ...mapped] : mapped;
    }

    loadLookups = async () => {
        const lookups = await Promise.allSettled([
            fetchCompanies(),
            fetchBranches(),
            fetchDepartments(),
            fetchRoles(),
            fetchUserTypes(),
            fetchCities(),
            fetchProperties(),
        ]);

        const unwrap = (index) => (lookups[index].status === "fulfilled" ? lookups[index].value : []);

        const Value = {
            Company: this.mapLookupList(unwrap(0), (item) => item.CompanyId, (item) => item.CompanyName, { Id: "0", Name: "Select Company" }),
            Branch: this.mapLookupList(unwrap(1), (item) => item.BranchId, (item) => item.BranchName, { Id: "0", Name: "Select Branch" }),
            Departments: this.mapLookupList(unwrap(2), (item) => item.DepartmentId, (item) => item.DepartmentName, { Id: "0", Name: "Select Department" }),
            Role: this.mapLookupList(unwrap(3), (item) => item.UserRoleId, (item) => item.UserRoleName),
            UserType: this.mapLookupList(unwrap(4), (item) => item.UserTypeId, (item) => item.UserTypeName, { Id: "0", Name: "Select User Type" }),
            City: this.mapLookupList(unwrap(5), (item) => item.CityId, (item) => item.CityName, { Id: "0", Name: "Select City" }),
            Property: this.mapLookupList(unwrap(6), (item) => item.PropertyId, (item) => item.Name),
            userTypeId: this.state.Value.userTypeId,
            cityId: this.state.Value.cityId,
            branchId: this.state.Value.branchId,
            departmentsId: this.state.Value.departmentsId,
            roleId: this.state.Value.roleId,
            companyId: this.state.Value.companyId,
            propertyId: this.state.Value.propertyId,
        };
        this.setState({ Value });
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
        
        fetchBranches().then((data) => {
            let branchData = [{ "Id": "0", "Name": "Select Branch" }];
            const rows = Array.isArray(data) ? data : [];
            rows.forEach(element => {
                if (!value || String(element.CompanyId) === String(value)) {
                    branchData.push({ Id: element.BranchId, Name: element.BranchName });
                }
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

