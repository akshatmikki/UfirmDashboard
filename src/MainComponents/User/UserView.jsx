import React from 'react';
import Button from '../../ReactComponents/Button/Button.jsx';
import DataGrid from '../../ReactComponents/DataGrid/DataGrid.jsx';
import './User.css';

class UserView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userType: [],
            gridHeader: [
                // { sTitle: 'Id', titleValue: 'documentTypeId', "orderable": false,  },
                { sTitle: 'Document Type', titleValue: 'documentTypeName', "orderable": false },
                { sTitle: 'Document Number', titleValue: 'documentNumber', "orderable": false },
                { sTitle: 'Document Name', titleValue: 'documentName', "orderable": false, "visible": true },
                { sTitle: 'Document Url', titleValue: 'documentURL', "orderable": false, "visible": true },
                { sTitle: 'Action', titleValue: 'Action', Action: "Download", Index: '0', urlIndex: '3', "orderable": false }
            ],
            gridData: [],
        };
    }
    componentDidMount() {
        console.log(this.props.Data.userType);
        this.setState({ userType: this.props.Data.userType });
        this.setState({ gridData: this.props.Data.userDocumentList });
    }
    handleCancel = () => {
        this.props.Action("Home");
    };


    render() {
        const normalizeDisplay = (value) => {
            if (value == null) return "";
            const s = String(value).trim();
            if (!s || s.toLowerCase() === "n/a") return "";
            return s;
        };

        const getNameById = (list, id, fallback = "") => {
            if (!Array.isArray(list)) return fallback;
            const found = list.find((x) => String(x?.Id) === String(id));
            return normalizeDisplay(found?.Name ?? fallback);
        };

        const companyName =
            normalizeDisplay(this.props.Data.CompanyName) ||
            getNameById(this.props.Value?.Company, this.props.Data.CompanyId, "");
        const branchName =
            normalizeDisplay(this.props.Data.BranchName) ||
            getNameById(this.props.Value?.Branch, this.props.Data.BranchId, "");
        const departmentName =
            normalizeDisplay(this.props.Data.DepartmentName) ||
            getNameById(this.props.Value?.Departments, this.props.Data.DepartmentId, "");
        const cityName =
            normalizeDisplay(this.props.Data.CityName) ||
            getNameById(this.props.Value?.City, this.props.Data.CityId, "");

        const roleName =
            normalizeDisplay(this.props.Data.RoleName) ||
            getNameById(this.props.Value?.Role, this.props.Data.RoleId, "");

        const userTypeName =
            normalizeDisplay(this.props.Data.UserTypeName) ||
            getNameById(this.props.Value?.UserType, this.props.Data.UserTypeId, "");

        const propertyIdsRaw =
            (Array.isArray(this.props.Data.PropertyIds) && this.props.Data.PropertyIds) ||
            (Array.isArray(this.props.Data.PropertyIDList) && this.props.Data.PropertyIDList) ||
            (this.props.Data.PropertyId != null ? [this.props.Data.PropertyId] : null) ||
            (this.props.Data.PropertyID != null ? [this.props.Data.PropertyID] : null) ||
            [];

        const propertyIds = Array.from(new Set(propertyIdsRaw.map((x) => Number(x) || 0).filter((x) => x > 0)));
        const properties = (propertyIds.length ? propertyIds : []).map((pid) => {
            const prop = (this.props.Value?.Property || []).find((p) => String(p?.Id) === String(pid));
            return { pid, name: normalizeDisplay(prop?.Name) };
        }).filter((p) => !!p.name);

        return (
            <div className="card shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                    <h3 className="card-title mb-0">User Details</h3>
                </div>
                <div className="card-body">

                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketTitle">First Name</label>
                                        <div className="dummyBox">{normalizeDisplay(this.props.Data.FirstName)}</div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketTitle">Last Name</label>
                                        <div className="dummyBox">
                                            {normalizeDisplay(this.props.Data.LastName)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">Email Address</label>
                                        <div className="dummyBox">
                                            {normalizeDisplay(this.props.Data.EmailAddress)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketTitle">Contact Number</label>
                                        <div className="dummyBox">
                                            {normalizeDisplay(this.props.Data.ContactNumber)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">Company</label>
                                        <div className="dummyBox">
                                            {companyName}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">Branch</label>
                                        <div className="dummyBox">
                                            {branchName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketTitle">Department</label>
                                        <div className="dummyBox">
                                            {departmentName}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">City</label>
                                        <div className="dummyBox">
                                            {cityName}
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">Role</label>
                                        <div className="dummyBox">
                                            {roleName}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">Property</label>
                                        <div className="dummyBox">
                                            {properties.length > 0 ? properties.map((p) => (
                                                <div key={p.pid}>{p.name}</div>
                                            )) : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="ticketType">User Type</label>
                                        <div className="dummyBox">
                                            {userTypeName}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-sm-6">
                                    <div className="form-group">
                                        <label for="lbProfilePic">Profile Picture</label>
                                        <div>
                                            {normalizeDisplay(this.props.Data.ProfileImageUrl) ? (
                                                <img
                                                    className="ImageView"
                                                    alt="profilepic"
                                                    src={this.props.Data.ProfileImageUrl}
                                                    style={{ height: "90px" }}
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>


                </div>
                <div className="card-footer d-flex justify-content-end">
                    <Button
                        Id="btnCancel"
                        Text="Back"
                        Action={this.handleCancel}
                        ClassName="btn btn-secondary"
                    />
                </div>
            </div>
        );
    }
}

export default UserView;
