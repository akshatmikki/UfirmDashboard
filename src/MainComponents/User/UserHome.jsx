import React from 'react';
import * as appCommon from '../../Common/AppCommon';
import departmentActions from '../../redux/department/action';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ApiProvider from './DataProvider.js';
import { masterConfigCss } from '../../ReactComponents/MasterConfig/masterConfigTheme';

const extraCss = `
/* ── avatar ────────────────────────────────────────────── */
.av-wrap{position:relative;border-radius:50%;cursor:pointer;border:3px solid #d8dee6;overflow:hidden;background:#edf1f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s,box-shadow .2s;}
.av-wrap:hover{border-color:#245789;box-shadow:0 0 0 4px #d9e8f8;}
.av-wrap.no-hover:hover{border-color:#d8dee6;box-shadow:none;cursor:default;}
.av-wrap img{width:100%;height:100%;object-fit:cover;display:block;}
.av-overlay{position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background .2s;}
.av-wrap:hover:not(.no-hover) .av-overlay{background:rgba(0,0,0,.42);}
.av-overlay i{color:#fff;opacity:0;transition:opacity .2s;}
.av-wrap:hover:not(.no-hover) .av-overlay i{opacity:1;}
.av-status-ok{color:#4a9d6f;font-size:11px;display:flex;align-items:center;gap:3px;margin-top:5px;}
.av-status-spin{color:#245789;font-size:11px;display:flex;align-items:center;gap:3px;margin-top:5px;}
.av-hint-sm{color:#9ba5ae;font-size:10px;text-align:center;line-height:1.5;margin-top:5px;}
.av-remove-sm{border:1px solid #e05252;background:transparent;color:#e05252;border-radius:3px;font-size:10px;padding:1px 8px;cursor:pointer;margin-top:4px;transition:background .15s,color .15s;}
.av-remove-sm:hover{background:#e05252;color:#fff;}
.av-hero{display:flex;flex-direction:column;align-items:center;padding:14px 10px 12px;border-bottom:1px solid #edf1f5;margin-bottom:10px;}
.av-hero-name{font-size:14px;font-weight:700;color:#333c45;margin-top:8px;text-align:center;}
.av-hero-email{font-size:11px;color:#8e98a2;margin-top:2px;text-align:center;word-break:break-all;}
.av-hero-badge{display:inline-block;background:#d9e8f7;color:#365676;border-radius:999px;font-size:11px;font-weight:700;padding:2px 10px;margin-top:5px;}
/* ── property dropdown ─────────────────────────────────── */
.mc-prop-btn{width:100%;height:32px;border:1px solid #d8dee6;border-radius:5px;background:#f4f7fa;color:#3f4750;padding:0 10px;font-size:13px;text-align:left;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:6px;transition:border-color .15s,background .15s;}
.mc-prop-btn:hover{border-color:#245789;background:#eef4fc;}
.mc-prop-btn.open{border-color:#245789;background:#eef4fc;}
.mc-prop-count{display:inline-flex;align-items:center;justify-content:center;background:#245789;color:#fff;border-radius:10px;font-size:11px;font-weight:700;padding:0 6px;height:18px;min-width:18px;flex-shrink:0;}
.mc-prop-menu{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #c8d3de;border-radius:8px;z-index:400;max-height:200px;overflow-y:auto;box-shadow:0 8px 28px rgba(31,38,46,.15);scrollbar-width:thin;}
.mc-prop-menu::-webkit-scrollbar{width:4px;}
.mc-prop-menu::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:2px;}
.mc-prop-allbar{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid #edf1f5;position:sticky;top:0;background:#fff;z-index:1;}
.mc-prop-allbar button{border:0;background:transparent;font-size:12px;color:#245789;cursor:pointer;font-weight:700;padding:0;line-height:1;}
.mc-prop-allbar button:hover{text-decoration:underline;}
.mc-prop-menu label{display:flex;align-items:center;gap:10px;padding:7px 12px;cursor:pointer;font-size:13px;color:#3a4148;user-select:none;transition:background .1s;}
.mc-prop-menu label:hover{background:#f0f6ff;}
.mc-prop-menu label input[type=checkbox]{accent-color:#245789;width:15px;height:15px;cursor:pointer;flex-shrink:0;}
/* ── sidebar helpers ───────────────────────────────────── */
.mc-field-wrap{margin-bottom:10px;position:relative;}
.mc-field-sep{border:0;border-top:1px solid #edf1f5;margin:8px 0 10px;}
.mc-email-ro{font-size:13px;color:#4a5158;padding:4px 0;word-break:break-all;}
/* ── side-head close btn ───────────────────────────────── */
.mc-side-close{margin-left:auto;border:0;background:transparent;color:#8e98a2;cursor:pointer;font-size:15px;line-height:1;padding:0;}
.mc-side-close:hover{color:#3f4750;}
`;

class UserHome extends React.Component {
    constructor(props) {
        super(props);
        this.fileInputRef = React.createRef();
        this.state = {
            gridData: [],
            q: '',
            page: 1,
            pageSize: 10,
            // sidebar
            selectedRow: null,
            sideMode: null,      // 'view' | 'edit'
            editForm: {},
            propMenuOpen: false,
            sideImageUploading: false,
            // delete modal
            showDeleteModal: false,
            deleteTarget: null,
        };
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    norm = (v) => {
        if (v == null) return '';
        const s = String(v).trim();
        return !s || s.toLowerCase() === 'n/a' ? '' : s;
    };

    nameById = (list, id) => {
        if (!Array.isArray(list)) return '';
        const found = list.find((x) => String(x?.Id) === String(id));
        return this.norm(found?.Name);
    };

    buildDisplayRow = (user) => {
        const V = this.props.Value || {};

        const roleName     = this.norm(user?.RoleName)     || this.nameById(V.Role,     user?.RoleId);
        const cityName     = this.norm(user?.CityName)     || this.nameById(V.City,     user?.CityId);
        const branchName   = this.norm(user?.BranchName)   || this.nameById(V.Branch,   user?.BranchId);
        const userTypeName = this.norm(user?.UserTypeName) || this.nameById(V.UserType, user?.UserTypeId);

        const propertyIdsRaw =
            (Array.isArray(user?.PropertyIds)    && user.PropertyIds)    ||
            (Array.isArray(user?.PropertyIDList) && user.PropertyIDList) ||
            (user?.PropertyId != null ? [user.PropertyId] : null)        ||
            (user?.PropertyID != null ? [user.PropertyID] : null)        ||
            [];
        const propertyIds = Array.from(
            new Set(propertyIdsRaw.map((x) => Number(x) || 0).filter((x) => x > 0))
        );
        const propertyNames = propertyIds.map((pid) => this.nameById(V.Property, pid)).filter(Boolean);

        return {
            ...user,
            EmailAddress:       this.norm(user?.EmailAddress)  || this.norm(user?.emailAddress),
            FirstName:          this.norm(user?.FirstName)     || this.norm(user?.firstName),
            LastName:           this.norm(user?.LastName)      || this.norm(user?.lastName),
            ContactNumber:      this.norm(user?.ContactNumber) || this.norm(user?.contactNumber),
            RoleName:           roleName,
            CityNameDisplay:    cityName,
            BranchNameDisplay:  branchName,
            UserTypeDisplay:    userTypeName,
            PropertyIds:        propertyIds,
            PropertyNamesDisplay: propertyNames.join(', '),
        };
    };

    // ─── data ────────────────────────────────────────────────────────────────

    loadUser = () => {
        new ApiProvider().getAllUsers(null, null, true).then((res) => {
            if (res.ok) {
                res.json().then((data) => {
                    const rows = Array.isArray(data) ? data.map(this.buildDisplayRow) : [];
                    this.setState({ gridData: rows });
                });
            }
        });
    };

    componentDidMount() { this.loadUser(); }

    componentDidUpdate(prevProps) {
        const v = this.props.Value;
        const pv = prevProps.Value;
        if (
            pv?.Role     !== v?.Role     || pv?.Property !== v?.Property ||
            pv?.City     !== v?.City     || pv?.Branch   !== v?.Branch   ||
            pv?.UserType !== v?.UserType
        ) {
            this.loadUser();
        }
    }

    // ─── sidebar ─────────────────────────────────────────────────────────────

    openView = (row) => {
        this.setState({ selectedRow: row, sideMode: 'view', editForm: {}, propMenuOpen: false });
    };

    buildEditForm = (row) => ({
        empCode:             row.EmpCode       || '',
        firstName:           row.FirstName     || '',
        lastName:            row.LastName      || '',
        contactNumber:       row.ContactNumber || '',
        cityId:     row.CityId     ? String(row.CityId)     : '',
        branchId:   row.BranchId   ? String(row.BranchId)   : '',
        userTypeId: row.UserTypeId ? String(row.UserTypeId) : '',
        roleId:     row.RoleId     ? String(row.RoleId)     : '',
        selectedPropertyIds: (row.PropertyIds || []).map(String),
        profileImageUrl:     row.ProfileImageUrl || '',
    });

    switchToEdit = () => {
        const row = this.state.selectedRow;
        if (!row) return;
        this.setState({ sideMode: 'edit', propMenuOpen: false, sideImageUploading: false, editForm: this.buildEditForm(row) });
    };

    openEditDirect = (row) => {
        this.setState({ selectedRow: row, sideMode: 'edit', propMenuOpen: false, sideImageUploading: false, editForm: this.buildEditForm(row) });
    };

    handleSideFileSelect = async (e) => {
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

        this.setState({ sideImageUploading: true });
        try {
            const data = await new ApiProvider().uploadProfileImage(file);
            this.setState((p) => ({
                sideImageUploading: false,
                editForm: { ...p.editForm, profileImageUrl: data.ProfileImageUrl },
            }));
        } catch {
            this.setState({ sideImageUploading: false });
            appCommon.ShownotifyError('Image upload failed. Please try again.');
        }
    };

    cancelEdit   = () => this.setState({ sideMode: 'view', propMenuOpen: false });
    closeSidebar = () => this.setState({ selectedRow: null, sideMode: null, editForm: {}, propMenuOpen: false });

    setForm = (field) => (e) => {
        const val = e.target.value;
        this.setState((p) => ({ editForm: { ...p.editForm, [field]: val } }));
    };

    toggleProperty = (id) => {
        this.setState((p) => {
            const ids  = p.editForm.selectedPropertyIds || [];
            const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
            return { editForm: { ...p.editForm, selectedPropertyIds: next } };
        });
    };

    selectAllProps = () => {
        const all = (this.props.Value?.Property || []).map((p) => String(p.Id));
        this.setState((p) => ({ editForm: { ...p.editForm, selectedPropertyIds: all } }));
    };

    clearAllProps = () => {
        this.setState((p) => ({ editForm: { ...p.editForm, selectedPropertyIds: [] } }));
    };

    handleSave = () => {
        const { selectedRow, editForm } = this.state;
        if (!selectedRow) return;
        if (!editForm.firstName?.trim()) {
            appCommon.ShownotifyError('First Name is required');
            return;
        }
        if (this.state.sideImageUploading) {
            appCommon.ShownotifyError('Please wait, image is still uploading…');
            return;
        }
        const dto = {
            UserId:          selectedRow.UserId,
            EmpCode:         editForm.empCode,
            FirstName:       editForm.firstName,
            LastName:        editForm.lastName,
            Email:           selectedRow.EmailAddress,
            PhoneNumber:     editForm.contactNumber,
            CityId:          parseInt(editForm.cityId)     || null,
            UserTypeId:      parseInt(editForm.userTypeId) || null,
            PropertyIds:     (editForm.selectedPropertyIds || []).join(','),
            IsActive:        true,
            BranchId:        parseInt(editForm.branchId)   || null,
            DepartmentId:    null,
            RoleId:          parseInt(editForm.roleId)     || 0,
            UpdatedBy:       parseInt(localStorage.getItem('userId')) || 1,
            ProfileImageUrl: editForm.profileImageUrl || null,
        };
        new ApiProvider().updateUser(dto)
            .then((res) => {
                if (res.ok) {
                    appCommon.showtextalert('User Updated Successfully', '', 'success');
                    this.setState({ sideMode: 'view', propMenuOpen: false }, () => this.loadUser());
                } else {
                    appCommon.ShownotifyError('Failed to update user');
                }
            })
            .catch(() => appCommon.ShownotifyError('Failed to update user'));
    };

    // ─── delete ──────────────────────────────────────────────────────────────

    openDelete  = (row) => this.setState({ showDeleteModal: true, deleteTarget: row });
    closeDelete = ()    => this.setState({ showDeleteModal: false, deleteTarget: null });

    confirmDelete = () => {
        const { deleteTarget } = this.state;
        if (!deleteTarget) return;
        const updatedBy = parseInt(localStorage.getItem('userId')) || 1;
        new ApiProvider().deactivateUser(deleteTarget.UserId, updatedBy).then(() => {
            appCommon.showtextalert('User Deactivated Successfully', '', 'success');
            if (this.state.selectedRow?.UserId === deleteTarget.UserId) this.closeSidebar();
            this.closeDelete();
            this.loadUser();
        });
    };

    // ─── render ──────────────────────────────────────────────────────────────

    render() {
        const {
            gridData, q, page, pageSize,
            selectedRow, sideMode, editForm, propMenuOpen,
            showDeleteModal, deleteTarget,
        } = this.state;

        // filter + paginate
        const filtered = gridData.filter((row) =>
            [row.EmailAddress, row.FirstName, row.LastName, row.ContactNumber, row.RoleName]
                .some((v) => String(v ?? '').toLowerCase().includes(q.toLowerCase()))
        );
        const totalRows  = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
        const safePage   = Math.min(page, totalPages);
        const pagedRows  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

        // lookup lists
        const V         = this.props.Value || {};
        const cities    = (V.City     || []).filter((c) => String(c.Id) !== '0');
        const roles     =  V.Role     || [];
        const branches  = (V.Branch   || []).filter((b) => String(b.Id) !== '0');
        const userTypes = (V.UserType || []).filter((u) => String(u.Id) !== '0');
        const properties = V.Property || [];

        // property dropdown
        const selIds   = editForm.selectedPropertyIds || [];
        const propLabel = selIds.length === 0 ? 'Select properties' : null;

        const kv = (label, value) => (
            <div className="mc-kv" key={label}>
                <span className="mc-kv-key">{label}</span>
                <span className="mc-kv-val">{value || <span style={{ color: '#b0b8c1' }}>—</span>}</span>
            </div>
        );

        return (
            <div className="mc-wrap">
                <style>{masterConfigCss}</style>
                <style>{extraCss}</style>

                <h3 className="mc-head"><span className="mc-head-title">Users</span></h3>

                <div
                    className="mc-grid"
                    style={{ gridTemplateColumns: selectedRow ? 'minmax(0,1fr) 400px' : '1fr' }}
                >
                    {/* ══════════ Main Table Card ══════════ */}
                    <div className="mc-card">
                        <div className="mc-tools">
                            <div className="mc-search">
                                <i className="fas fa-search" />
                                <input
                                    value={q}
                                    onChange={(e) => this.setState({ q: e.target.value, page: 1 })}
                                    placeholder="Search users..."
                                />
                            </div>
                            <button className="mc-btn-add" type="button" onClick={() => this.props.Action('Add')}>
                                <i className="fa fa-plus" /> Add User
                            </button>
                        </div>

                        <div className="mc-table-wrap">
                            <table className="mc-table">
                                <thead>
                                    <tr>
                                        <th>Email</th><th>First Name</th><th>Last Name</th>
                                        <th>Mobile</th><th>Role</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedRows.length === 0 ? (
                                        <tr><td className="mc-empty" colSpan={6}>
                                            {gridData.length === 0 ? 'Loading...' : 'No users found.'}
                                        </td></tr>
                                    ) : pagedRows.map((row) => (
                                        <tr
                                            key={row.UserId}
                                            className={selectedRow?.UserId === row.UserId ? 'mc-row-active' : ''}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => this.openView(row)}
                                        >
                                            <td>{row.EmailAddress}</td>
                                            <td>{row.FirstName}</td>
                                            <td>{row.LastName}</td>
                                            <td>{row.ContactNumber}</td>
                                            <td>{row.RoleName}</td>
                                            <td>
                                                <div className="mc-actions">
                                                    <button
                                                        className="mc-act"
                                                        type="button"
                                                        title="Edit"
                                                        onClick={(e) => { e.stopPropagation(); this.openEditDirect(row); }}
                                                    >
                                                        <i className="far fa-edit" />
                                                    </button>
                                                    <button
                                                        className="mc-act"
                                                        type="button"
                                                        title="Delete"
                                                        style={{ color: '#c93535' }}
                                                        onClick={(e) => { e.stopPropagation(); this.openDelete(row); }}
                                                    >
                                                        <i className="far fa-trash-alt" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mc-pager">
                            <div className="mc-pager-left">
                                <span className="mc-pager-label">Rows per page</span>
                                <select
                                    className="mc-pager-select"
                                    value={pageSize}
                                    onChange={(e) => this.setState({ pageSize: Number(e.target.value), page: 1 })}
                                >
                                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span className="mc-pager-meta">
                                    {totalRows === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, totalRows)}`} of {totalRows}
                                </span>
                            </div>
                            <div className="mc-pager-right">
                                <button className="mc-btn ghost" disabled={safePage <= 1} onClick={() => this.setState({ page: safePage - 1 })}>Prev</button>
                                <span className="mc-pager-page">Page {safePage} of {totalPages}</span>
                                <button className="mc-btn ghost" disabled={safePage >= totalPages} onClick={() => this.setState({ page: safePage + 1 })}>Next</button>
                            </div>
                        </div>
                    </div>

                    {/* ══════════ Sidebar ══════════ */}
                    {selectedRow && (
                        <div className="mc-side">

                            {/* ── View Mode ── */}
                            {sideMode === 'view' && (
                                <>
                                    <div className="mc-side-head">
                                        <span className="mc-ico"><i className="far fa-user" /></span>
                                        <span>User Details</span>
                                        <button className="mc-side-close" onClick={this.closeSidebar} type="button">
                                            <i className="fas fa-times" />
                                        </button>
                                    </div>
                                    <div className="mc-side-body">

                                        {/* Avatar hero */}
                                        <div className="av-hero">
                                            <div className="av-wrap no-hover" style={{ width: 80, height: 80 }}>
                                                {selectedRow.ProfileImageUrl
                                                    ? <img src={selectedRow.ProfileImageUrl} alt="profile" />
                                                    : <span style={{ fontSize: 26, fontWeight: 700, color: '#9ba5ae' }}>
                                                        {(selectedRow.FirstName?.[0] || '').toUpperCase()}
                                                        {(selectedRow.LastName?.[0]  || '').toUpperCase()}
                                                        {!selectedRow.FirstName && !selectedRow.LastName &&
                                                            <i className="far fa-user" style={{ fontSize: 26, color: '#9ba5ae' }} />
                                                        }
                                                      </span>
                                                }
                                                <div className="av-overlay" />
                                            </div>
                                            <div className="av-hero-name">{selectedRow.FirstName} {selectedRow.LastName}</div>
                                            <div className="av-hero-email">{selectedRow.EmailAddress}</div>
                                            {selectedRow.RoleName && (
                                                <span className="av-hero-badge">{selectedRow.RoleName}</span>
                                            )}
                                        </div>

                                        {kv('Employee ID', selectedRow.EmpCode)}
                                        {kv('Phone',       selectedRow.ContactNumber)}
                                        {kv('City',        selectedRow.CityNameDisplay)}
                                        {kv('Property',    selectedRow.PropertyNamesDisplay)}
                                        {kv('Branch',      selectedRow.BranchNameDisplay)}
                                        {kv('User Type',   selectedRow.UserTypeDisplay)}
                                    </div>
                                    <div className="mc-side-footer">
                                        <button className="mc-btn primary" type="button" onClick={this.switchToEdit}>
                                            <i className="far fa-edit" style={{ marginRight: 5 }} />Edit
                                        </button>
                                        <button className="mc-btn ghost" type="button" onClick={this.closeSidebar}>Close</button>
                                    </div>
                                </>
                            )}

                            {/* ── Edit Mode ── */}
                            {sideMode === 'edit' && (
                                <>
                                    <div className="mc-side-head">
                                        <span className="mc-ico"><i className="far fa-edit" /></span>
                                        <span>Edit User</span>
                                        <button className="mc-side-close" onClick={this.closeSidebar} type="button">
                                            <i className="fas fa-times" />
                                        </button>
                                    </div>
                                    <div className="mc-side-body">

                                        {/* Avatar upload */}
                                        <div className="av-hero" style={{ paddingBottom: 12 }}>
                                            <div
                                                className="av-wrap"
                                                style={{ width: 80, height: 80 }}
                                                onClick={() => this.fileInputRef.current?.click()}
                                                title="Click to change photo"
                                            >
                                                {editForm.profileImageUrl
                                                    ? <img src={editForm.profileImageUrl} alt="profile" />
                                                    : <span style={{ fontSize: 26, fontWeight: 700, color: '#9ba5ae' }}>
                                                        {(editForm.firstName?.[0] || '').toUpperCase()}
                                                        {(editForm.lastName?.[0]  || '').toUpperCase()}
                                                        {!editForm.firstName && !editForm.lastName &&
                                                            <i className="far fa-user" style={{ fontSize: 26, color: '#9ba5ae' }} />
                                                        }
                                                      </span>
                                                }
                                                <div className="av-overlay">
                                                    <i className={this.state.sideImageUploading ? 'fas fa-spinner fa-spin' : 'fas fa-camera'} style={{ fontSize: 16 }} />
                                                </div>
                                            </div>
                                            <input
                                                ref={this.fileInputRef}
                                                type="file"
                                                accept=".png,.jpg,.jpeg"
                                                style={{ display: 'none' }}
                                                onChange={this.handleSideFileSelect}
                                            />
                                            {this.state.sideImageUploading && (
                                                <span className="av-status-spin"><i className="fas fa-spinner fa-spin" />Uploading…</span>
                                            )}
                                            {editForm.profileImageUrl && !this.state.sideImageUploading && (
                                                <span className="av-status-ok"><i className="fas fa-check-circle" />Photo uploaded</span>
                                            )}
                                            {!editForm.profileImageUrl && !this.state.sideImageUploading && (
                                                <span className="av-hint-sm">PNG · JPG · JPEG<br />Click to upload</span>
                                            )}
                                        </div>

                                        {/* Email – read only */}
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Email</div>
                                            <div className="mc-email-ro">{selectedRow.EmailAddress}</div>
                                        </div>
                                        <hr className="mc-field-sep" />

                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Employee ID</div>
                                            <input className="mc-input" value={editForm.empCode} onChange={this.setForm('empCode')} placeholder="Employee ID" />
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">First Name</div>
                                            <input className="mc-input" value={editForm.firstName} onChange={this.setForm('firstName')} placeholder="First Name" />
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Last Name</div>
                                            <input className="mc-input" value={editForm.lastName} onChange={this.setForm('lastName')} placeholder="Last Name" />
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Phone Number</div>
                                            <input className="mc-input" value={editForm.contactNumber} onChange={this.setForm('contactNumber')} placeholder="Phone Number" />
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">City</div>
                                            <select className="mc-select" value={editForm.cityId} onChange={this.setForm('cityId')}>
                                                <option value="">Select City</option>
                                                {cities.map((c) => <option key={c.Id} value={String(c.Id)}>{c.Name}</option>)}
                                            </select>
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Role</div>
                                            <select className="mc-select" value={editForm.roleId} onChange={this.setForm('roleId')}>
                                                <option value="">Select Role</option>
                                                {roles.map((r) => <option key={r.Id} value={String(r.Id)}>{r.Name}</option>)}
                                            </select>
                                        </div>

                                        {/* Property – checkbox dropdown */}
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Property</div>
                                            <button
                                                type="button"
                                                className={`mc-prop-btn${propMenuOpen ? ' open' : ''}`}
                                                onClick={() => this.setState({ propMenuOpen: !propMenuOpen })}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                                    {propLabel
                                                        ? <span style={{ color: '#9ba5ae' }}>{propLabel}</span>
                                                        : <>
                                                            <span className="mc-prop-count">{selIds.length}</span>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {selIds.length === properties.length
                                                                    ? 'All properties'
                                                                    : `propert${selIds.length === 1 ? 'y' : 'ies'} selected`}
                                                            </span>
                                                        </>
                                                    }
                                                </span>
                                                <i className={`fas fa-chevron-${propMenuOpen ? 'up' : 'down'}`} style={{ fontSize: 11, color: '#8e98a2', flexShrink: 0 }} />
                                            </button>

                                            {propMenuOpen && (
                                                <div className="mc-prop-menu">
                                                    <div className="mc-prop-allbar">
                                                        <button type="button" onClick={this.selectAllProps}>Select all</button>
                                                        <button type="button" onClick={this.clearAllProps}>Clear</button>
                                                    </div>
                                                    {properties.map((p) => {
                                                        const id = String(p.Id);
                                                        return (
                                                            <label key={p.Id}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selIds.includes(id)}
                                                                    onChange={() => this.toggleProperty(id)}
                                                                />
                                                                {p.Name}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">Branch</div>
                                            <select className="mc-select" value={editForm.branchId} onChange={this.setForm('branchId')}>
                                                <option value="">Select Branch</option>
                                                {branches.map((b) => <option key={b.Id} value={String(b.Id)}>{b.Name}</option>)}
                                            </select>
                                        </div>
                                        <div className="mc-field-wrap">
                                            <div className="mc-field-label">User Type</div>
                                            <select className="mc-select" value={editForm.userTypeId} onChange={this.setForm('userTypeId')}>
                                                <option value="">Select User Type</option>
                                                {userTypes.map((u) => <option key={u.Id} value={String(u.Id)}>{u.Name}</option>)}
                                            </select>
                                        </div>

                                    </div>
                                    <div className="mc-side-footer">
                                        <button className="mc-btn primary" type="button" onClick={this.handleSave}>Save</button>
                                        <button className="mc-btn ghost"   type="button" onClick={this.cancelEdit}>Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* ══════════ Delete Modal ══════════ */}
                {showDeleteModal && (
                    <div className="mc-overlay" onClick={this.closeDelete}>
                        <div className="mc-modal small" onClick={(e) => e.stopPropagation()}>
                            <div className="mc-modal-head">
                                <span>
                                    <span className="mc-ico warn"><i className="fas fa-exclamation-triangle" /></span>
                                    Deactivate User
                                </span>
                                <button type="button" onClick={this.closeDelete}><i className="fas fa-times" /></button>
                            </div>
                            <div className="mc-modal-body">
                                <div className="mc-warn-box">This will deactivate the user and cannot be undone.</div>
                                <div className="mc-info-box" style={{ marginTop: 10 }}>
                                    <strong>Email:</strong> {deleteTarget?.EmailAddress}<br />
                                    <strong>Name:</strong> {deleteTarget?.FirstName} {deleteTarget?.LastName}
                                </div>
                            </div>
                            <div className="mc-modal-foot">
                                <button className="mc-btn ghost"  type="button" onClick={this.closeDelete}>Cancel</button>
                                <button className="mc-btn delete" type="button" onClick={this.confirmDelete}>Deactivate</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

function mapStoreToprops() { return {}; }
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(departmentActions, dispatch) };
}
export default connect(mapStoreToprops, mapDispatchToProps)(UserHome);
