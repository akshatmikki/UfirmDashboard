"use client";

import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Link } from "react-router-dom";
import swal from "sweetalert";

import {
    getAllDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation,
    getDesignationById,
} from "../../Services/Designation";

const DesignationMaster = () => {
    const toast = useRef(null);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");

    const [dialogVisible, setDialogVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [formData, setFormData] = useState({
        Designation_ID: null,
        DesignationName: "",
        IsActive: true,
    });

    const tableHeaderButtonStyle = {
        backgroundColor: "#0ea5e9",
        border: "1px solid #0ea5e9",
        color: "#ffffff",
        fontWeight: 600,
        boxShadow: "none",
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getAllDesignations();
            setData(res || []);
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const normalize = (str) => {
        return str?.toLowerCase().replace(/[.\s]/g, "");
    };

    const filteredData = data.filter((item) => {
        if (!globalFilter) return true;

        return normalize(item.DesignationName).includes(
            normalize(globalFilter)
        );
    });

    const openAdd = () => {
        setFormData({
            Designation_ID: null,
            DesignationName: "",
            IsActive: true,
        });
        setIsEdit(false);
        setDialogVisible(true);
    };

    const openEdit = async (row) => {
        try {
            const res = await getDesignationById(row.Designation_ID);
            setFormData({
                ...res,
                IsActive: res.IsActive !== undefined ? res.IsActive : true,
            });
            setIsEdit(true);
            setDialogVisible(true);
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    const handleDelete = async (row) => {
        try {
            const confirmed = await swal({
                buttons: {
                    ok: "Yes",
                    cancel: "No",
                },
                text: "Are you sure you want to delete this designation?",
                icon: "warning",
                closeOnClickOutside: false,
                dangerMode: true,
            });

            if (confirmed !== "ok") {
                return;
            }
            await deleteDesignation(row.Designation_ID);
            toast.current.show({ severity: "success", summary: "Deleted" });
            fetchData();
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.DesignationName.trim()) {
                toast.current.show({ severity: "warn", detail: "Enter Designation Name" });
                return;
            }

            const payload = {
                DesignationName: formData.DesignationName,
                IsActive: formData.IsActive,
            };

            if (isEdit) {
                await updateDesignation(formData.Designation_ID, payload);
            } else {
                await createDesignation(payload);
            }

            toast.current.show({
                severity: "success",
                summary: isEdit ? "Updated" : "Created",
                detail: `Designation ${isEdit ? "updated" : "created"} successfully`,
            });

            setDialogVisible(false);
            fetchData();
        } catch (err) {
            toast.current.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    const actionBody = (row) => (
        <div className="flex align-items-center gap-2">
            <Button
                icon="pi pi-pencil"
                className="p-button-sm"
                style={{
                    backgroundColor: "#fbbf24",
                    border: "1px solid #fbbf24",
                    color: "#111827",
                    width: "2.5rem",
                    height: "2.5rem",
                    boxShadow: "none",
                }}
                tooltip="Edit"
                onClick={() => openEdit(row)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-sm"
                style={{
                    backgroundColor: "#22c55e",
                    border: "1px solid #22c55e",
                    color: "#ffffff",
                    width: "2.5rem",
                    height: "2.5rem",
                    boxShadow: "none",
                }}
                tooltip="Delete"
                onClick={() => handleDelete(row)}
            />
        </div>
    );

    const header = (
        <div
            className="flex gap-3 mb-3"
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
            }}
        >
            <div>
                <h2 className="m-0 text-900" style={{ fontSize: "2.2rem", fontWeight: 700 }}>
                    Designation
                </h2>
            </div>

            <div
                className="flex align-items-center gap-3"
                style={{ marginLeft: "auto", justifyContent: "flex-end", columnGap: "1rem" }}
            >
                <span className="p-input-icon-left w-full" style={{ maxWidth: "18rem" }}>

                    <InputText
                        placeholder="Search..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full"
                    />
                </span>

                <Button
                    label="Add New"
                    icon="pi pi-plus"
                    className="font-semibold px-4"
                    style={{ ...tableHeaderButtonStyle, marginLeft: "0.25rem" }}
                    onClick={openAdd}
                />
            </div>
        </div>
    );

    return (
        <div className="content-wrapper">
            <Toast ref={toast} />

            <section className="content">
                <div className="container-fluid">
                    <div
                        className="card"
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 2px 12px rgba(15, 23, 42, 0.08)",
                            border: "1px solid #dbe4ee",
                            overflow: "hidden",
                        }}
                    >
                        <div className="p-3 p-md-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <Link
                                    to="/Account/App/Designation"
                                    className="text-decoration-none"
                                >
                                    <Button
                                        label="Designation"
                                        className="p-button-sm"
                                        style={{
                                            backgroundColor: "#0ea5e9",
                                            border: "1px solid #0ea5e9",
                                            color: "#ffffff",
                                            boxShadow: "none",
                                        }}
                                    />
                                </Link>
                                <Link
                                    to="/Account/App/Department"
                                    className="text-decoration-none"
                                >
                                    <Button
                                        label="Department"
                                        className="p-button-sm p-button-outlined"
                                    />
                                </Link>
                            </div>

                            {header}

                            <DataTable
                                value={filteredData}
                                paginator
                                rows={10}
                                loading={loading}
                                emptyMessage="No designations found."
                                responsiveLayout="scroll"
                                className="p-datatable-gridlines p-datatable-sm"
                                stripedRows
                                rowHover
                            >
                                <Column
                                    header="#"
                                    body={(row, options) => (
                                        <span className="font-semibold">
                                            {options.rowIndex + 1}
                                        </span>
                                    )}
                                    style={{ width: "70px" }}
                                />

                                <Column
                                    field="Designation_ID"
                                    header="Designation ID"
                                    style={{ minWidth: "180px" }}
                                />

                                <Column
                                    field="DesignationName"
                                    header="Designation Name"
                                    style={{ minWidth: "260px" }}
                                />

                                <Column
                                    header="Actions"
                                    body={actionBody}
                                    exportable={false}
                                    style={{ minWidth: "160px" }}
                                />
                            </DataTable>
                        </div>
                    </div>
                </div>
            </section>

            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <span>{isEdit ? "Edit Designation" : "Add New Designation"}</span>
                    </div>
                }
                visible={dialogVisible}
                style={{ width: "25vw" }}
                breakpoints={{ "960px": "75vw", "641px": "90vw" }}
                modal
                onHide={() => setDialogVisible(false)}
                footer={
                    <div className="flex justify-content-end gap-2 mt-2">
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            className="p-button-text p-button-secondary"
                            onClick={() => setDialogVisible(false)}
                        />
                        <Button
                            label={isEdit ? "Update" : "Create"}
                            icon="pi pi-check"
                            className="p-button-primary px-4"
                            onClick={handleSave}
                        />
                    </div>
                }
            >
                <div className="p-fluid flex flex-column gap-4 pt-2">
                    <div className="field">
                        <label htmlFor="designationName" className="font-bold mb-2 block">
                            Designation Name <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            id="designationName"
                            value={formData.DesignationName}
                            placeholder="Enter designation name (e.g. Software Engineer)"
                            onChange={(e) =>
                                setFormData({ ...formData, DesignationName: e.target.value })
                            }
                            autoFocus
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default DesignationMaster;
