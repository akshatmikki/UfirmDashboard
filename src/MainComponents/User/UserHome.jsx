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
import './User.css';
const $ = window.$;
class UserHome extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userData: [],
            pageSize: 10,
            pageNumber: 1,
            gridHeader: [
                { sTitle: 'Id', titleValue: 'userId', "orderable": false,  },
                { sTitle: 'First Name', titleValue: 'firstName', "orderable": true },
                { sTitle: 'Last Name', titleValue: 'lastName', "orderable": true },
               // { sTitle: 'Email Address', titleValue: 'emailAddress', "orderable": true },
                { sTitle: 'Mobile', titleValue: 'contactNumber', "orderable": true },
                { sTitle: 'User Type', titleValue: 'userType', "orderable": true, className:"setwidth" },
                // { sTitle: 'Branch', titleValue: 'branchName', "orderable": true , className:"setwidth"},
                { sTitle: 'Department', titleValue: 'departmentName', "orderable": true, className:"setwidth" },
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
        promiseWrapper(this.props.actions.fetchUser, { SearchValue: this.state.searchValue, PageSize: this.state.pageSize, PageNumber: this.state.pageNumber }).then((data) => {
            this.setState({ grdTotalPages: data.totalPages });
            this.setState({ grdTotalRows: data.totalRows });
            this.setState({ gridData: data.usersModel, });
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
            if (item.userId === userId) {
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
                        promiseWrapper(this.props.actions.deleteUser, { userId: userId }).then((data) => {
                            this.loadUser();
                            appCommon.showtextalert("User Deleted Successfully", "", "success");

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