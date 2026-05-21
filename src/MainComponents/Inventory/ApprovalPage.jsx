import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import { useSelector, useDispatch } from 'react-redux';

const ApprovalTable = ({
    title = 'Pending For Approval',
    gridHeader = [],
    gridData = [],
    onGridEdit,
    onGridDelete,
    onGridApprove,
    onGridReject,
    onGridView
}) => {
    const userrole = useSelector((state) => state.Commonreducer.entrolval);
    const userid = useSelector((state) => state.Commonreducer.userId);
    const username = useSelector((state) => state.Commonreducer.userName);
    const useremail = useSelector((state) => state.Commonreducer.userEmail);
    const companyid = useSelector((state) => state.Commonreducer.companyid);
    const dispatch = useDispatch();
    const [openDropDown, setOpenDropDown] = useState(true);


    const handleToggle = () => {
        setOpenDropDown(prev => !prev);
    };

    const actionBodyTemplate = (rowData) => {
        const canApproveReject = userrole?.includes("Admin") || userrole?.includes("HR") || userrole === "Admin," || userrole === "HR,";

        return (
            <div className="mc-actions">
                {onGridEdit && (
                    <button className="mc-act" onClick={() => onGridEdit(rowData.Id)} title="Edit">
                        <i className="far fa-edit"></i>
                    </button>
                )}
                {onGridView && (
                    <button className="mc-act" onClick={() => onGridView(rowData.Id)} title="View">
                        <i className="far fa-eye"></i>
                    </button>
                )}
                {canApproveReject && onGridApprove && (
                    <button className="mc-act" style={{ color: "#2e7d32" }} onClick={() => onGridApprove(rowData.Id)} title="Approve">
                        <i className="far fa-check-circle"></i>
                    </button>
                )}
                {canApproveReject && onGridReject && (
                    <button className="mc-act" style={{ color: "#d32f2f" }} onClick={() => onGridReject(rowData.Id)} title="Reject">
                        <i className="far fa-times-circle"></i>
                    </button>
                )}
                {/* {canApproveReject && onGridDelete && (
                    <button className="mc-act" onClick={() => onGridDelete(rowData.Id)} title="Delete">
                        <i className="far fa-trash-alt" aria-hidden="true"></i>
                    </button>
                )} */}
            </div>
        );
    };

    return (
        <>
            <style>{`
                .approval-transparent-scrollbar {
                    max-height: 180px !important;
                    overflow-y: auto !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: rgba(0, 0, 0, 0.15) transparent !important;
                }
                .approval-transparent-scrollbar::-webkit-scrollbar {
                    width: 6px !important;
                    height: 6px !important;
                }
                .approval-transparent-scrollbar::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                .approval-transparent-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.15) !important;
                    border-radius: 3px !important;
                }
                .approval-transparent-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.3) !important;
                }
                .approval-transparent-scrollbar .mc-table {
                    overflow: visible !important;
                }
                .approval-transparent-scrollbar thead th {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 10 !important;
                    background: #edf1f4 !important;
                }
            `}</style>
            <div className="card">
                <div
                    className="card-header d-flex p-0"
                    onClick={handleToggle}
                    style={{ cursor: 'pointer', backgroundColor: '#f1e7c3' }}
                >
                    <h5 className="ml-3 mt-2">{title}</h5>
                    <ul className="nav ml-auto tableFilterContainer">
                        <li className="nav-item">
                            <div className="input-group input-group-sm">
                                <div className="input-group-prepend">
                                    <span
                                        className="btn btn-primary"
                                        style={{ backgroundColor: '#f1e7c3', color: '#000000' }}
                                    >
                                        {openDropDown ? '\u2191' : '\u2193'}
                                    </span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                {openDropDown && (
                    <div className="card-body p-2">
                        {gridData && gridData.length > 0 ? (
                            <div className="mc-table-wrap approval-transparent-scrollbar" style={{ padding: "0 8px 10px" }}>
                                <table className="mc-table">
                                    <thead>
                                        <tr>
                                            {gridHeader
                                                .filter(
                                                    (col) =>
                                                        col.titleValue.toLowerCase() !== 'action' &&
                                                        col.titleValue.toLowerCase() !== 'actions'
                                                )
                                                .map((col, idx) => (
                                                    <th key={idx}>{col.titleValue}</th>
                                                ))}
                                            {(onGridEdit || onGridDelete || onGridApprove || onGridView) && (
                                                <th>Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gridData.map((rowData, rIdx) => (
                                            <tr key={rowData.Id || rIdx}>
                                                {gridHeader
                                                    .filter(
                                                        (col) =>
                                                            col.titleValue.toLowerCase() !== 'action' &&
                                                            col.titleValue.toLowerCase() !== 'actions'
                                                    )
                                                    .map((col, cIdx) => {
                                                        if (col.render) {
                                                            return <td key={cIdx}>{col.render(rowData)}</td>;
                                                        }
                                                        const val = rowData[col.sTitle] ?? rowData[col.titleValue] ?? "";
                                                        if (col.sTitle === 'IsApproved' || col.titleValue === 'Approved') {
                                                            const isApproved = val === true || val === 'true' || val === 1;
                                                            return (
                                                                <td key={cIdx}>
                                                                    <span
                                                                        className="mc-badge"
                                                                        style={{
                                                                            background: isApproved ? "#d9e8f7" : "#f9dddd",
                                                                            color: isApproved ? "#365676" : "#b03030"
                                                                        }}
                                                                    >
                                                                        {isApproved ? "Yes" : "No"}
                                                                    </span>
                                                                </td>
                                                            );
                                                        }
                                                        return <td key={cIdx}>{String(val)}</td>;
                                                    })}
                                                {(onGridEdit || onGridDelete || onGridApprove || onGridView) && (
                                                    <td>
                                                        {actionBodyTemplate(rowData)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-3 text-center text-muted" style={{ fontSize: "14px" }}>
                                No pending items found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ApprovalTable;