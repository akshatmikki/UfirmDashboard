import React from 'react'
//import HomeContainer from '../../containers/home/homecontainer.jsx';
import Button from '../../ReactComponents/Button/Button.jsx';
import DataGrid from '../../ReactComponents/DataGrid/DataGrid.jsx';
import '../../Scripts/plugins/bootstrap-multiselect.js';
import '../../Style/bootstrap-multiselect.css';
import swal from 'sweetalert';
import { DELETE_CONFIRMATION_MSG } from '../../Contants/Common';
import * as appCommon from '../../Common/AppCommon';
import { Typeahead } from 'react-bootstrap-typeahead';
import departmentActions from '../../redux/department/action';
import { connect } from 'react-redux';
import { promiseWrapper } from '../../utility/common';
import { bindActionCreators } from 'redux';
import ApiProvider from './DataProvider.js';
const $ = window.$;

class UserHome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userData: [],
            pageSize: 10,
            pageNumber: 1,
            gridHeader: [
                // Keep UserId as first (hidden) column for DataGrid action buttons
                { sTitle: 'UserId', titleValue: 'UserId', "orderable": false, "visible": false },
                { sTitle: 'Email', titleValue: 'EmailAddress', "orderable": true },
                { sTitle: 'First Name', titleValue: 'FirstName', "orderable": true },
                { sTitle: 'Last Name', titleValue: 'LastName', "orderable": true },
                { sTitle: 'Mobile', titleValue: 'ContactNumber', "orderable": true },
                { sTitle: 'Role', titleValue: 'RoleName', "orderable": true, className:"setwidth" },
                { sTitle: 'Company', titleValue: 'CompanyNameDisplay', "orderable": true },
                { sTitle: 'Branch', titleValue: 'BranchNameDisplay', "orderable": true },
                { sTitle: 'Department', titleValue: 'DepartmentNameDisplay', "orderable": true },
                { sTitle: 'City', titleValue: 'CityNameDisplay', "orderable": true },
                { sTitle: 'User Type', titleValue: 'UserTypeNameDisplay', "orderable": true },
                { sTitle: 'Property', titleValue: 'PropertyNamesDisplay', "orderable": false },
                { sTitle: 'Action', titleValue: 'Action', Action: "ALL", Index: '0', "orderable": false }
            ],
            grdTotalRows: 0,
            grdTotalPages: 0,
            gridData: [],
            pagemode: 'new',
            searchValue: null,
            filterName:"emailAddress"
        }
    }

    normalizeDisplay = (value) => {
        if (value == null) return "";
        const s = String(value).trim();
        if (!s || s.toLowerCase() === "n/a") return "";
        return s;
    }

    getNameById = (list, id) => {
        if (!Array.isArray(list)) return "";
        const found = list.find((x) => String(x?.Id) === String(id));
        return this.normalizeDisplay(found?.Name);
    }

    buildDisplayRow = (user) => {
        const Value = this.props.Value || {};

        const companyName =
            this.normalizeDisplay(user?.CompanyName) ||
            this.getNameById(Value.Company, user?.CompanyId);
        const branchName =
            this.normalizeDisplay(user?.BranchName) ||
            this.getNameById(Value.Branch, user?.BranchId);
        const departmentName =
            this.normalizeDisplay(user?.DepartmentName) ||
            this.getNameById(Value.Departments, user?.DepartmentId);
        const cityName =
            this.normalizeDisplay(user?.CityName) ||
            this.getNameById(Value.City, user?.CityId);

        const roleName =
            this.normalizeDisplay(user?.RoleName) ||
            this.getNameById(Value.Role, user?.RoleId);

        const userTypeName =
            this.normalizeDisplay(user?.UserTypeName) ||
            this.getNameById(Value.UserType, user?.UserTypeId);

        const propertyIdsRaw =
            (Array.isArray(user?.PropertyIds) && user.PropertyIds) ||
            (Array.isArray(user?.PropertyIDList) && user.PropertyIDList) ||
            (user?.PropertyId != null ? [user.PropertyId] : null) ||
            (user?.PropertyID != null ? [user.PropertyID] : null) ||
            [];

        const propertyIds = Array.from(
            new Set(propertyIdsRaw.map((x) => Number(x) || 0).filter((x) => x > 0))
        );
        const propertyNames = propertyIds
            .map((pid) => this.getNameById(Value.Property, pid))
            .filter(Boolean);

        return {
            ...user,
            EmailAddress: this.normalizeDisplay(user?.EmailAddress) || this.normalizeDisplay(user?.emailAddress),
            FirstName: this.normalizeDisplay(user?.FirstName) || this.normalizeDisplay(user?.firstName),
            LastName: this.normalizeDisplay(user?.LastName) || this.normalizeDisplay(user?.lastName),
            ContactNumber: this.normalizeDisplay(user?.ContactNumber) || this.normalizeDisplay(user?.contactNumber),
            RoleName: roleName,
            CompanyNameDisplay: companyName,
            BranchNameDisplay: branchName,
            DepartmentNameDisplay: departmentName,
            CityNameDisplay: cityName,
            UserTypeNameDisplay: userTypeName,
            PropertyNamesDisplay: propertyNames.join(", "),
        };
    }

    loadUserTypeAhead = (searchtext) => {
        promiseWrapper(this.props.actions.fetchUser, { SearchValue: searchtext, PageSize: 10, PageNumber: 1 }).then((data) => {
            this.setState({ userData: data.usersModel, });
        });
    }

    ClearTyeahead = (type, event) => {
        if (type === 'C') {
            var option = this.thaCustomer.props.options;
            if (!option.includes(event.target.value)) {
            }

        }
    }

    onCustomerList = (arg) => {
        let searchVal;
        if (arg === '' || arg === null) {
            this.setState({ searchValue: null }, () => {
                this.loadUser();
                this.loadUserTypeAhead(null);
            });
        }
        else {
            this.setState({ searchValue: arg.trim() }, () => {
                this.loadUser();
                this.loadUserTypeAhead(arg.trim());
            });
        }

    }

    onUserSearch = (SearchText) => {
        if (SearchText.length > 0) {
            this.setState({ searchValue: SearchText[0].emailAddress }, () => {
                this.loadUserTypeAhead(SearchText[0].emailAddress);
                this.loadUser();
            });
        }
        else {
            this.setState({ searchValue: null }, () => {
                this.loadUserTypeAhead(null);
                this.loadUser();
            });
        }
    }

    onPagechange = (page) => {
        this.setState({ pageNumber: page }, () => {
            this.loadUser();
        });
    }

    loadUser = () => {
        new ApiProvider().getAllUsers(null, null, true).then(res => {
            if (res.ok) {
                res.json().then(data => {
                    const rows = Array.isArray(data) ? data.map(this.buildDisplayRow) : [];
                    this.setState({ 
                        gridData: rows,
                        grdTotalRows: rows.length,
                        grdTotalPages: 1 // Since it's not server-side paginated in the new API
                    });
                });
            }
        });
    }

    componentDidMount() {
        this.loadUser();
        this.loadUserTypeAhead(null);
        this.createFilterDropDown();
    }

    filterOnChange(val){
        this.setState({filterName:val});
    }

    createFilterDropDown() {
        let object = this;
        $('#userFillterlist').multiselect(
            {
                onSelectAll: function () {
                    object.filterOnChange();
                },
                onDeselectAll: function () {
                    object.filterOnChange();
                },
                onChange: function (option, checked, select) {
                    
                    object.filterOnChange(option.val());
                },
            }
        );
    }

    onaddnewuser() {
        //
        this.props.Action('Add');
    }

    findItem(userId) {
        return this.state.gridData.find((item) => {
            if (item.UserId === userId) {
                return item;
            }
        });
    }

    ongridedit(userId) {
        this.props.Action('Edit', this.findItem(userId));
    }
    ongridview(userId) {
        this.props.Action('View', this.findItem(userId));
    }
    ongriddelete(userId) {
        let myhtml = document.createElement("div");
        myhtml.innerHTML = DELETE_CONFIRMATION_MSG + "</hr>"
        alert: (
            swal({
                buttons: {
                    ok: "Yes",
                    cancel: "No",
                },
                content: myhtml,
                icon: "warning",
                closeOnClickOutside: false,
                dangerMode: true
            }).then((value) => {
                switch (value) {
                    case "ok":
                        let updatedBy = localStorage.getItem('userId') || 1; // Fallback to 1 if not found
                        new ApiProvider().deactivateUser(userId, updatedBy).then((res) => {
                            this.loadUser();
                            appCommon.showtextalert("User Deactivated Successfully", "", "success");
                        });
                        break;
                    case "cancel":
                        //do nothing 
                        break;
                    default:
                        break;
                }
            })
        );
    }

    render() {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex p-0">
                            <ul className="nav ml-auto tableFilterContainer">
                                <li className="nav-item">
                                    <div className="input-group input-group-sm">
                                    </div>
                                </li>
                                <li className="nav-item">
                                    <select 
                                        className="form-control-sm btn-primary pr-0"
                                        data-placeholder="Filter List Item"
                                        id="userFillterlist">
                                        {/* <option value="firstName">First Name</option>
                                        <option value="lastName">Last Name</option> */}
                                        <option value="emailAddress">Email</option> 
                                    </select>
                                </li>
                                <li className="nav-item">
                                    <div className="input-group input-group-sm">
                                        <div className="input-group-prepend">
                                        </div>
                                        <Typeahead
                                            id="typeGridFilter"
                                            ref={(typeahead) =>
                                                this.thaCustomer = typeahead}
                                            labelKey={this.state.filterName}
                                            onChange={this.onUserSearch}
                                            onInputChange={this.onCustomerList}
                                            options={this.state.userData}
                                            placeholder='Type Email'
                                            onBlur={this.ClearTyeahead.bind(this, 'C')}
                                        />
                                    </div>
                                </li>
                                <li className="nav-item">
                                    <Button id="btnNewUser"
                                        DataToggle="modal"
                                        DataTarget={this.props.AddNewId}
                                        Action={this.onaddnewuser.bind(this)}
                                        ClassName="btn btn-success btn-sm"
                                        Icon={<i className="fa fa-plus" aria-hidden="true"></i>}
                                        Text=" ADD NEW" />

                                </li>
                            </ul>
                        </div>
                        <div className="card-body pt-2">
                            <DataGrid
                                Id="grdUser"
                                IsPagination={true}
                                ColumnCollection={this.state.gridHeader}
                                totalpages={this.state.grdTotalPages}
                                totalrows={this.state.grdTotalRows}
                                Onpageindexchanged={this.onPagechange.bind(this)}
                                onEditMethod={this.ongridedit.bind(this)}
                                onGridViewMethod={this.ongridview.bind(this)}
                                onGridDeleteMethod={this.ongriddelete.bind(this)}
                                GridData={this.state.gridData} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

function mapStoreToprops(state, props) {
    return { }
}

function mapDispatchToProps(dispatch) {
    const actions = bindActionCreators(departmentActions, dispatch);
    return { actions };
}

export default connect(mapStoreToprops, mapDispatchToProps)(UserHome);
