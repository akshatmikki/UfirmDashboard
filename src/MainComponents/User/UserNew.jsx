import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import departmentActions from '../../redux/department/action';
import * as appCommon from '../../Common/AppCommon';
import { ToastContainer } from 'react-toastify';
import ApiProvider from './DataProvider.js';
import './User.css';

const avatarCss = `
.av-wrap{position:relative;width:96px;height:96px;border-radius:50%;cursor:pointer;border:3px solid #d8dee6;overflow:hidden;background:#edf1f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s,box-shadow .2s;}
.av-wrap:hover{border-color:#245789;box-shadow:0 0 0 4px #d9e8f8;}
.av-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.av-overlay{position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background .2s;}
.av-wrap:hover .av-overlay{background:rgba(0,0,0,.42);}
.av-overlay i{color:#fff;font-size:20px;opacity:0;transition:opacity .2s;}
.av-wrap:hover .av-overlay i{opacity:1;}
.av-status-ok{color:#4a9d6f;font-size:12px;display:flex;align-items:center;gap:4px;}
.av-status-spin{color:#245789;font-size:12px;display:flex;align-items:center;gap:4px;}
.av-hint{color:#9ba5ae;font-size:11px;text-align:center;line-height:1.6;}
.av-remove{border:1px solid #e05252;background:transparent;color:#e05252;border-radius:4px;font-size:11px;padding:2px 10px;cursor:pointer;transition:background .15s,color .15s;margin-top:2px;}
.av-remove:hover{background:#e05252;color:#fff;}
.av-section{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 0 16px;border-bottom:1px solid #f0f3f6;margin-bottom:16px;}
.av-name{font-size:15px;font-weight:700;color:#333c45;margin-top:4px;}
.av-sub{font-size:12px;color:#8e98a2;}
`;

class UserNew extends React.Component {
    constructor(props) {
        super(props);
        this.fileInputRef = React.createRef();
        this.ApiProvider  = new ApiProvider();
        this.state        = this.buildState(props.Data);
    }

    buildState(data) {
        const d = data || {};
        return {
            empCode:             d.EmpCode        || '',
            firstName:           d.FirstName      || '',
            lastName:            d.LastName       || '',
            email:               d.EmailAddress   || '',
            contactNumber:       d.ContactNumber  || '',
            cityId:              d.CityId     ? String(d.CityId)     : '',
            branchId:            d.BranchId   ? String(d.BranchId)   : '',
            userTypeId:          d.UserTypeId ? String(d.UserTypeId) : '',
            roleId:              d.RoleId     ? String(d.RoleId)     : '',
            selectedPropertyIds: Array.isArray(d.PropertyIds) ? d.PropertyIds.map(String) : [],
            profileImageUrl:     d.ProfileImageUrl || '',
            imageUploading:      false,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.Data !== this.props.Data) {
            this.setState(this.buildState(this.props.Data));
        }
    }

    set = (field) => (e) => this.setState({ [field]: e.target.value });

    handlePropertyChange = (e) => {
        const ids = Array.from(e.target.selectedOptions, (o) => o.value);
        this.setState({ selectedPropertyIds: ids });
    };

    handleFileSelect = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg'];
        const ext        = file.name.split('.').pop().toLowerCase();
        if (!validTypes.includes(file.type) && !['png', 'jpg', 'jpeg'].includes(ext)) {
            appCommon.ShownotifyError('Only PNG, JPG or JPEG images are allowed');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            appCommon.ShownotifyError('Image must be less than 5 MB');
            return;
        }

        this.setState({ imageUploading: true });
        try {
            const data = await this.ApiProvider.uploadProfileImage(file);
            this.setState({ profileImageUrl: data.ProfileImageUrl, imageUploading: false });
        } catch {
            this.setState({ imageUploading: false });
            appCommon.ShownotifyError('Image upload failed. Please try again.');
        }
    };

    handleSave = () => {
        const {
            empCode, firstName, lastName, email, contactNumber,
            cityId, branchId, userTypeId, roleId, selectedPropertyIds,
            profileImageUrl, imageUploading,
        } = this.state;
        const isEdit = this.props.PageMode === 'Edit';
        const userId = isEdit ? (this.props.Data?.UserId || this.props.Data?.userId || 0) : 0;

        if (!firstName.trim()) { appCommon.ShownotifyError('First Name is required'); return; }
        if (imageUploading)    { appCommon.ShownotifyError('Please wait, image is still uploading…'); return; }

        if (isEdit) {
            const dto = {
                UserId:          userId,
                EmpCode:         empCode,
                FirstName:       firstName,
                LastName:        lastName,
                Email:           this.props.Data.EmailAddress,
                PhoneNumber:     contactNumber,
                CityId:          parseInt(cityId)     || null,
                UserTypeId:      parseInt(userTypeId) || null,
                PropertyIds:     selectedPropertyIds.join(','),
                IsActive:        true,
                BranchId:        parseInt(branchId)   || null,
                DepartmentId:    null,
                RoleId:          parseInt(roleId)     || 0,
                UpdatedBy:       parseInt(localStorage.getItem('userId')) || 1,
                ProfileImageUrl: profileImageUrl || null,
            };
            this.ApiProvider.updateUser(dto)
                .then((res) => {
                    if (res.ok) { appCommon.showtextalert('User Updated Successfully', '', 'success'); this.props.Action('Home'); }
                    else          appCommon.ShownotifyError('Failed to update user');
                })
                .catch(() => appCommon.ShownotifyError('Failed to update user'));
        } else {
            const fd = new FormData();
            fd.append('profileImageUrl', profileImageUrl || '');
            fd.append('userId',        0);
            fd.append('firstName',     firstName);
            fd.append('lastName',      lastName);
            fd.append('emailAddress',  email);
            fd.append('contactNumber', contactNumber);
            fd.append('userTypeId',    userTypeId);
            fd.append('cityId',        cityId);
            fd.append('branchId',      branchId);
            fd.append('departmentId',  '0');
            fd.append('companyId',     '0');
            fd.append('roleId',        roleId);
            fd.append('propertyId',    selectedPropertyIds.join(','));
            this.ApiProvider.saveUser(fd)
                .then((res) => {
                    if (res.data <= 0) appCommon.ShownotifyError('User Email already exists');
                    else { appCommon.showtextalert('User Created Successfully', '', 'success'); this.props.Action('Home'); }
                })
                .catch(() => appCommon.ShownotifyError('Failed to create user'));
        }
    };

    handleCancel = () => this.props.Action('Home');

    render() {
        const {
            empCode, firstName, lastName, email, contactNumber,
            cityId, branchId, userTypeId, roleId, selectedPropertyIds,
            profileImageUrl, imageUploading,
        } = this.state;
        const isEdit = this.props.PageMode === 'Edit';
        const V      = this.props.Value || {};
        const inp    = 'form-control form-control-sm';

        const cities     = (V.City     || []).filter((c) => String(c.Id) !== '0');
        const roles      =  V.Role     || [];
        const branches   = (V.Branch   || []).filter((b) => String(b.Id) !== '0');
        const userTypes  = (V.UserType || []).filter((u) => String(u.Id) !== '0');
        const properties =  V.Property || [];

        const initials = (firstName?.[0] || '').toUpperCase() + (lastName?.[0] || '').toUpperCase();

        return (
            <div className="card shadow-sm">
                <style>{avatarCss}</style>

                <div className="card-header">
                    <h3 className="card-title mb-0">{isEdit ? 'Edit User' : 'Add New User'}</h3>
                </div>

                <div className="card-body">

                    {/* ── Profile Photo ── */}
                    <div className="av-section">
                        <div
                            className="av-wrap"
                            onClick={() => this.fileInputRef.current?.click()}
                            title="Click to upload photo"
                        >
                            {profileImageUrl
                                ? <img src={profileImageUrl} alt="profile" />
                                : <span style={{ fontSize: 32, fontWeight: 700, color: '#9ba5ae' }}>
                                    {initials || <i className="far fa-user" style={{ fontSize: 32, color: '#9ba5ae' }} />}
                                  </span>
                            }
                            <div className="av-overlay">
                                <i className={imageUploading ? 'fas fa-spinner fa-spin' : 'fas fa-camera'} />
                            </div>
                        </div>

                        <input
                            ref={this.fileInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            style={{ display: 'none' }}
                            onChange={this.handleFileSelect}
                        />

                        {imageUploading && (
                            <span className="av-status-spin">
                                <i className="fas fa-spinner fa-spin" /> Uploading…
                            </span>
                        )}
                        {profileImageUrl && !imageUploading && (
                            <>
                                <span className="av-status-ok">
                                    <i className="fas fa-check-circle" /> Photo uploaded
                                </span>
                                <button
                                    type="button"
                                    className="av-remove"
                                    onClick={() => this.setState({ profileImageUrl: '' })}
                                >
                                    Remove photo
                                </button>
                            </>
                        )}
                        {!profileImageUrl && !imageUploading && (
                            <span className="av-hint">
                                PNG · JPG · JPEG &nbsp;·&nbsp; Max 5 MB<br />Click avatar to upload
                            </span>
                        )}
                    </div>

                    {/* ── Row 1: Employee ID + First Name ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input className={inp} value={empCode} onChange={this.set('empCode')} placeholder="Employee ID" />
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>First Name</label>
                                <input className={inp} value={firstName} onChange={this.set('firstName')} placeholder="First Name" />
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Last Name + Email ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Last Name</label>
                                <input className={inp} value={lastName} onChange={this.set('lastName')} placeholder="Last Name" />
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Email</label>
                                {isEdit
                                    ? <div className={`${inp} bg-light d-flex align-items-center`}>{this.props.Data?.EmailAddress}</div>
                                    : <input className={inp} type="email" value={email} onChange={this.set('email')} placeholder="Email" />
                                }
                            </div>
                        </div>
                    </div>

                    {/* ── Row 3: Phone + City ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input className={inp} type="tel" value={contactNumber} onChange={this.set('contactNumber')} placeholder="Phone Number" />
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>City Name</label>
                                <select className={inp} value={cityId} onChange={this.set('cityId')}>
                                    <option value="">Select City</option>
                                    {cities.map((c) => <option key={c.Id} value={String(c.Id)}>{c.Name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 4: Role + Property ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Role Name</label>
                                <select className={inp} value={roleId} onChange={this.set('roleId')}>
                                    <option value="">Select Role</option>
                                    {roles.map((r) => <option key={r.Id} value={String(r.Id)}>{r.Name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Property Name</label>
                                <select className={inp} multiple value={selectedPropertyIds} onChange={this.handlePropertyChange} style={{ height: 80 }}>
                                    {properties.map((p) => <option key={p.Id} value={String(p.Id)}>{p.Name}</option>)}
                                </select>
                                <small className="text-muted">Hold Ctrl / Cmd to select multiple</small>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 5: Branch + User Type ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>Branch Name</label>
                                <select className={inp} value={branchId} onChange={this.set('branchId')}>
                                    <option value="">Select Branch</option>
                                    {branches.map((b) => <option key={b.Id} value={String(b.Id)}>{b.Name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label>User Type</label>
                                <select className={inp} value={userTypeId} onChange={this.set('userTypeId')}>
                                    <option value="">Select User Type</option>
                                    {userTypes.map((u) => <option key={u.Id} value={String(u.Id)}>{u.Name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end">
                    <button className="btn btn-primary mr-2" onClick={this.handleSave}>Save</button>
                    <button className="btn btn-secondary" onClick={this.handleCancel}>Cancel</button>
                </div>

                <ToastContainer position="top-right" autoClose={5000} />
            </div>
        );
    }
}

function mapStoreToprops() { return {}; }
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(departmentActions, dispatch) };
}
export default connect(mapStoreToprops, mapDispatchToProps)(UserNew);
