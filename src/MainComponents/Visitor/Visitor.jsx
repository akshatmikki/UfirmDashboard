import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useSelector } from "react-redux";
import { Button } from "primereact/button";
import { FilterMatchMode } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { fetchVisitor } from "../../Services/VisitorService"; // Make sure this is correctly imported
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import ExportToCSV from '../../ReactComponents/ExportToCSV/ExportToCSV.js';
import { Calendar } from "primereact/calendar";
import Department from "./Department";



const Visitor = () => {
    const [gridData, setGridData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [viewDialogVisible, setViewDialogVisible] = useState(false);
    const [dateRange, setDateRange] = useState(null);
    const [activeTab, setActiveTab] = useState("visitor");


    const dt = useRef(null);
    const toast = useRef(null);
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    useEffect(() => {
        if (propertyId) {
            setLoading(true);
            fetchVisitor(propertyId)
                .then((data) => {
                    setGridData(data);
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load visitor data"
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [propertyId]);

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
        setFilters({
            ...filters,
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        });
    };



    const viewVisitor = (visitor) => {
        setSelectedVisitor(visitor);
        setViewDialogVisible(true);
    };

    const actionTemplate = (rowData) => {
        return (
            <Button
                className="p-button-rounded p-button-info p-button-sm-rounded"
                onClick={() => viewVisitor(rowData)}
                tooltip="View Details"
                tooltipOptions={{ position: "top" }}
            >
                <i className="fa fa-eye" />
            </Button>

        );
    };

    const filteredData = gridData.filter((item) => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return true;

        const meetingDate = new Date(item.MeetingStartTime);
        const from = new Date(dateRange[0]);
        const to = new Date(dateRange[1]);

        // end date ke poore din ko include karne ke liye
        to.setHours(23, 59, 59, 999);

        return meetingDate >= from && meetingDate <= to;
    });

    const header = (
        <div className="d-flex justify-content-between align-items-center p-2">
            <h5 className="m-0">Visitor</h5>

            <div className="d-flex gap-2 align-items-center">
                {/* Search */}
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="Search..."
                    />
                </span>

                {/* Date Range Calendar */}
                <Calendar
                    value={dateRange}
                    onChange={(e) => setDateRange(e.value)}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                    hideOnRangeSelection
                    placeholder="Select Date Range"
                    dateFormat="dd-mm-yy"
                    className="p-inputtext-sm"
                />

                <ExportToCSV
                    data={filteredData}
                    className="btn btn-success btn-sm rounded"
                />
            </div>
        </div>
    );


    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">
                    <ul className="nav nav-tabs mb-3" style={{ cursor: "pointer" }}>
                        <li className="nav-item">
                            <span className={`nav-link ${activeTab === "visitor" ? "active" : ""}`} onClick={() => setActiveTab("visitor")}>
                                Visitor
                            </span>
                        </li>
                        <li className="nav-item">
                            <span className={`nav-link ${activeTab === "department" ? "active" : ""}`} onClick={() => setActiveTab("department")}>
                                Department
                            </span>
                        </li>
                    </ul>

                    {activeTab === "visitor" ? (
                    <div className="card">
                        <Toast ref={toast} />
                        <div className="p-3">
                            <DataTable
                                ref={dt}
                                value={filteredData}
                                loading={loading}
                                header={header}
                                paginator
                                rows={10}
                                filters={filters}
                                filterDisplay="row"
                                globalFilterFields={["ID", "Fname", "Lname", "Status", "MPurpose", "Address"]}
                                emptyMessage="No visitor found."
                                dataKey="ID"
                                breakpoint="960px"
                            >
                                <Column field="ID" header="ID" />
                                <Column
                                    header="Visitor Name"
                                    body={(rowData) => `${rowData.Fname} ${rowData.Lname}`}
                                />
                                <Column field="MPurpose" header="Purpose" />
                                <Column
                                    field="MeetingStartTime"
                                    header="In Time"
                                    body={(rowData) => new Date(rowData.MeetingStartTime).toLocaleString()}
                                />
                                <Column
                                    field="MeetingEndTime"
                                    header="Out Time"
                                    body={(rowData) =>
                                        rowData.MeetingEndTime
                                            ? new Date(rowData.MeetingEndTime).toLocaleString()
                                            : "-"
                                    }
                                />
                                <Column
                                    header="Status"
                                    body={(rowData) => {
                                        if (rowData.Status === "Approved") {
                                            return <span className="badge badge-success">Approved</span>;
                                        } else if (rowData.Status === "Rejected") {
                                            return <span className="badge badge-danger">Rejected</span>;
                                        } else {
                                            return <span className="badge badge-warning">{rowData.Status}</span>;
                                        }
                                    }}
                                />
                                <Column
                                    header="Action"
                                    body={actionTemplate}
                                    style={{ textAlign: "center", width: "100px" }}
                                />
                            </DataTable>

                            <Dialog
                                header="Visitor Details"
                                visible={viewDialogVisible}
                                style={{ width: "800px" }}
                                modal
                                onHide={() => setViewDialogVisible(false)}
                            >
                                {selectedVisitor && (
                                    <table width="100%" cellPadding="8">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <strong>Name:</strong> {selectedVisitor.Fname} {selectedVisitor.Lname}
                                                </td>
                                                <td>
                                                    <strong>Mobile No:</strong> {selectedVisitor.MobileNo}
                                                </td>
                                            </tr>

                                            <tr>
                                                <td>
                                                    <strong>Address:</strong> {selectedVisitor.Address}
                                                </td>
                                                <td>
                                                    <strong>Purpose:</strong> {selectedVisitor.MPurpose}
                                                </td>
                                            </tr>

                                            <tr>
                                                <td>
                                                    <strong>Carrying:</strong> {selectedVisitor.ACarrying || "-"}
                                                </td>
                                                <td>
                                                    <strong>Contact Person:</strong> {selectedVisitor.ContactPersonName}
                                                </td>
                                            </tr>

                                            <tr>
                                                <td>
                                                    <strong>Status:</strong> {selectedVisitor.Status}
                                                </td>
                                                <td>
                                                    <strong>Meeting Over:</strong>{" "}
                                                    {selectedVisitor.IsMeetingOver ? "Yes" : "No"}
                                                </td>
                                            </tr>

                                            <tr>
                                                <td>
                                                    <strong>In Time:</strong>{" "}
                                                    {new Date(selectedVisitor.MeetingStartTime).toLocaleString()}
                                                </td>
                                                <td>
                                                    <strong>Out Time:</strong>{" "}
                                                    {selectedVisitor.MeetingEndTime
                                                        ? new Date(selectedVisitor.MeetingEndTime).toLocaleString()
                                                        : "-"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </Dialog>

                        </div>
                    </div>
                    ) : (
                        <Department />
                    )}
                </div>
            </section>
        </div>
    );
};

export default Visitor;
