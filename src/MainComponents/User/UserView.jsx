import React from 'react';
import Button from '../../ReactComponents/Button/Button.jsx';
import './User.css';

const viewCss = `
.uv-avatar{width:96px;height:96px;border-radius:50%;border:3px solid #d8dee6;overflow:hidden;background:#edf1f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.uv-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.uv-hero{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 0 16px;border-bottom:1px solid #f0f3f6;margin-bottom:20px;}
.uv-name{font-size:18px;font-weight:700;color:#30363d;}
.uv-email{font-size:13px;color:#8e98a2;}
.uv-badge{display:inline-block;background:#d9e8f7;color:#365676;border-radius:999px;font-size:12px;font-weight:700;padding:3px 14px;margin-top:2px;}
.uv-field{margin-bottom:14px;}
.uv-label{font-size:11px;font-weight:700;color:#55606c;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;}
.uv-val{font-size:13px;color:#3a4148;background:#f5f8fb;border:1px solid #e8edf2;border-radius:5px;padding:7px 10px;min-height:34px;word-break:break-word;}
.uv-val.empty{color:#b0b8c1;}
`;

class UserView extends React.Component {
    handleCancel = () => this.props.Action('Home');

    render() {
        const d = this.props.Data || {};
        const V = this.props.Value || {};

        const norm = (v) => {
            if (v == null) return '';
            const s = String(v).trim();
            return !s || s.toLowerCase() === 'n/a' ? '' : s;
        };

        const nameById = (list, id) => {
            if (!Array.isArray(list)) return '';
            const found = list.find((x) => String(x?.Id) === String(id));
            return norm(found?.Name);
        };

        const cityName     = norm(d.CityName)     || nameById(V.City,     d.CityId);
        const branchName   = norm(d.BranchName)   || nameById(V.Branch,   d.BranchId);
        const roleName     = norm(d.RoleName)     || nameById(V.Role,     d.RoleId);
        const userTypeName = norm(d.UserTypeName) || nameById(V.UserType, d.UserTypeId);

        const propertyIdsRaw =
            (Array.isArray(d.PropertyIds)    && d.PropertyIds)    ||
            (Array.isArray(d.PropertyIDList) && d.PropertyIDList) ||
            (d.PropertyId != null ? [d.PropertyId] : []);

        const propertyNames = Array.from(
            new Set(propertyIdsRaw.map((x) => Number(x)).filter((x) => x > 0))
        )
            .map((pid) => nameById(V.Property, pid))
            .filter(Boolean);

        const initials =
            (norm(d.FirstName)?.[0] || '').toUpperCase() +
            (norm(d.LastName)?.[0]  || '').toUpperCase();

        // Helper: labelled read-only field
        const Field = ({ label, value }) => (
            <div className="uv-field">
                <div className="uv-label">{label}</div>
                <div className={`uv-val${!value ? ' empty' : ''}`}>
                    {value || '—'}
                </div>
            </div>
        );

        return (
            <div className="card shadow-sm">
                <style>{viewCss}</style>

                <div className="card-header">
                    <h3 className="card-title mb-0">User Details</h3>
                </div>

                <div className="card-body">

                    {/* ── Avatar hero ── */}
                    <div className="uv-hero">
                        <div className="uv-avatar">
                            {norm(d.ProfileImageUrl)
                                ? <img src={d.ProfileImageUrl} alt="profile" />
                                : <span style={{ fontSize: 32, fontWeight: 700, color: '#9ba5ae' }}>
                                    {initials || <i className="far fa-user" style={{ fontSize: 32, color: '#9ba5ae' }} />}
                                  </span>
                            }
                        </div>
                        <div className="uv-name">{norm(d.FirstName)} {norm(d.LastName)}</div>
                        <div className="uv-email">{norm(d.EmailAddress)}</div>
                        {roleName && <span className="uv-badge">{roleName}</span>}
                    </div>

                    {/* ── 2-column grid ── */}
                    <div className="row">
                        <div className="col-sm-6">
                            <Field label="Employee ID"  value={norm(d.EmpCode)} />
                        </div>
                        <div className="col-sm-6">
                            <Field label="Phone Number" value={norm(d.ContactNumber)} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <Field label="City"        value={cityName} />
                        </div>
                        <div className="col-sm-6">
                            <Field label="Branch"      value={branchName} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <Field label="User Type"   value={userTypeName} />
                        </div>
                        <div className="col-sm-6">
                            <div className="uv-field">
                                <div className="uv-label">Property</div>
                                <div className={`uv-val${propertyNames.length === 0 ? ' empty' : ''}`}>
                                    {propertyNames.length > 0
                                        ? propertyNames.map((n, i) => (
                                            <div key={i} style={{ lineHeight: 1.8 }}>{n}</div>
                                        ))
                                        : '—'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="card-footer d-flex justify-content-end">
                    <Button Id="btnBack" Text="Back" Action={this.handleCancel} ClassName="btn btn-secondary" />
                </div>
            </div>
        );
    }
}

export default UserView;
