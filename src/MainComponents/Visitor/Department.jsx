import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";

import {
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    fetchDepartmentMaster,
    createDepartmentMaster
} from "../../Services/DepartmentVisitor.js";

const VisitorDepartment = () => {

    const toast = useRef(null);

    const propertyId = useSelector(
        (state) => state.Commonreducer.puidn
    );

    const [departmentList, setDepartmentList] = useState([]);
    const [departmentOptions, setDepartmentOptions] = useState([]);

    const [loading, setLoading] = useState(false);

    const [visible, setVisible] = useState(false);

    const [isEdit, setIsEdit] = useState(false);

    const [departmentSearch, setDepartmentSearch] =
        useState("");

    const [formData, setFormData] = useState({
        Id: 0,
        DepartmentId: "",
        BranchHeadName: "",
        BranchHeadMobile: "",
        BranchHeadEmail: ""
    });

    const loadDepartments = async () => {

        try {

            setLoading(true);

            const data =
                await fetchDepartments(propertyId);

            setDepartmentList(data);

        } catch (error) {

            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to load departments"
            });

        } finally {

            setLoading(false);
        }
    };

    const loadDepartmentMaster = async () => {

        try {

            const data =
                await fetchDepartmentMaster();

            setDepartmentOptions(data);

        } catch (error) {

            console.error(error);
        }
    };

    useEffect(() => {

        if (propertyId) {

            loadDepartments();

            loadDepartmentMaster();
        }

    }, [propertyId]);

    const openNew = () => {

        setIsEdit(false);

        setFormData({
            Id: 0,
            DepartmentId: "",
            BranchHeadName: "",
            BranchHeadMobile: "",
            BranchHeadEmail: ""
        });

        setDepartmentSearch("");

        setVisible(true);
    };

    const editDepartmentData = (rowData) => {

        setIsEdit(true);

        setFormData({
            Id: rowData.Id,
            DepartmentId: rowData.DepartmentId,
            BranchHeadName:
                rowData.BranchHeadName || "",
            BranchHeadMobile:
                rowData.BranchHeadMobile || "",
            BranchHeadEmail:
                rowData.BranchHeadEmail || ""
        });

        setVisible(true);
    };

    const removeDepartment = async (rowData) => {

        if (
            !window.confirm(
                "Are you sure want to delete?"
            )
        ) {
            return;
        }

        try {

            await deleteDepartment(rowData.Id);

            toast.current.show({
                severity: "success",
                summary: "Deleted",
                detail:
                    "Department deleted successfully"
            });

            loadDepartments();

        } catch (error) {

            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Delete failed"
            });
        }
    };

    const handleDepartmentKeyDown = async (e) => {

        if (e.key === "Enter") {

            const exists = departmentOptions.find(
                (x) =>
                    x.label.toLowerCase() ===
                    departmentSearch.toLowerCase()
            );

            if (
                !exists &&
                departmentSearch.trim()
            ) {

                try {

                    const response =
                        await createDepartmentMaster({
                            DepartmentName:
                                departmentSearch
                        });

                    const newDepartment = {
                        label: departmentSearch,
                        value: response.Id
                    };

                    setDepartmentOptions((prev) => [
                        ...prev,
                        newDepartment
                    ]);

                    setFormData({
                        ...formData,
                        DepartmentId: response.Id
                    });

                    toast.current.show({
                        severity: "success",
                        summary: "Created",
                        detail:
                            "New department created successfully"
                    });

                } catch (error) {

                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail:
                            "Failed to create department"
                    });
                }
            }
        }
    };

    const saveDepartment = async () => {

        if (!formData.DepartmentId) {

            toast.current.show({
                severity: "warn",
                summary: "Validation",
                detail:
                    "Please select department"
            });

            return;
        }

        try {

            const payload = {
                ...formData,
                PropertyId: propertyId
            };

            if (isEdit) {

                await updateDepartment(payload);

                toast.current.show({
                    severity: "success",
                    summary: "Updated",
                    detail:
                        "Department updated successfully"
                });

            } else {

                await createDepartment(payload);

                toast.current.show({
                    severity: "success",
                    summary: "Created",
                    detail:
                        "Department created successfully"
                });
            }

            setVisible(false);

            loadDepartments();

        } catch (error) {

            toast.current.show({
                severity: "error",
                summary: "Error",
                detail:
                    "Something went wrong"
            });
        }
    };

    const statusBodyTemplate = (rowData) => {

        return rowData.IsActive ? (
            <span className="badge badge-success">
                Active
            </span>
        ) : (
            <span className="badge badge-danger">
                Inactive
            </span>
        );
    };

    const actionBodyTemplate = (rowData) => {

        return (
            <div className="d-flex gap-2">

                <Button
                    icon="pi pi-pencil"
                    className="p-button-warning p-button-sm"
                    onClick={() =>
                        editDepartmentData(rowData)
                    }
                />

                <Button
                    icon="pi pi-trash"
                    className="p-button-danger p-button-sm"
                    onClick={() =>
                        removeDepartment(rowData)
                    }
                />

            </div>
        );
    };

    const header = (
        <div className="d-flex justify-content-between align-items-center">

            <h4 className="m-0">
                Department Master
            </h4>

            <Button
                label="Add Department"
                icon="pi pi-plus"
                onClick={openNew}
            />

        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <div className="p-3">

                            <DataTable
                                value={departmentList}
                                paginator
                                rows={10}
                                loading={loading}
                                responsiveLayout="scroll"
                                header={header}
                                emptyMessage="No departments found"
                            >

                                <Column
                                    field="Id"
                                    header="ID"
                                />

                                <Column
                                    field="DepartmentName"
                                    header="Department"
                                />

                                <Column
                                    field="BranchHeadName"
                                    header="Head Name"
                                />

                                <Column
                                    field="BranchHeadMobile"
                                    header="Mobile"
                                />

                                <Column
                                    field="BranchHeadEmail"
                                    header="Email"
                                />

                                <Column
                                    header="Status"
                                    body={
                                        statusBodyTemplate
                                    }
                                />

                                <Column
                                    header="Action"
                                    body={
                                        actionBodyTemplate
                                    }
                                    style={{
                                        width: "120px",
                                        textAlign:
                                            "center"
                                    }}
                                />

                            </DataTable>

                            <Dialog
                                header={
                                    isEdit
                                        ? "Edit Department"
                                        : "Add Department"
                                }
                                visible={visible}
                                style={{
                                    width: "500px"
                                }}
                                modal
                                onHide={() =>
                                    setVisible(false)
                                }
                            >

                                <div className="row">

                                    <div className="col-md-12 mb-3">

                                        <label>
                                            Department
                                        </label>

                                        <Dropdown
                                            value={
                                                formData.DepartmentId
                                            }
                                            options={
                                                departmentOptions
                                            }
                                            optionLabel="label"
                                            optionValue="value"
                                            filter
                                            editable
                                            onFilter={(e) =>
                                                setDepartmentSearch(
                                                    e.filter
                                                )
                                            }
                                            onKeyDown={
                                                handleDepartmentKeyDown
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    DepartmentId:
                                                        e.value
                                                })
                                            }
                                            placeholder="Search or Create Department"
                                            className="w-100"
                                        />

                                    </div>

                                    <div className="col-md-12 mb-3">

                                        <label>
                                            Head Name
                                        </label>

                                        <InputText
                                            className="w-100"
                                            value={
                                                formData.BranchHeadName
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    BranchHeadName:
                                                        e
                                                            .target
                                                            .value
                                                })
                                            }
                                        />

                                    </div>

                                    <div className="col-md-12 mb-3">

                                        <label>
                                            Mobile Number
                                        </label>

                                        <InputText
                                            className="w-100"
                                            value={
                                                formData.BranchHeadMobile
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    BranchHeadMobile:
                                                        e
                                                            .target
                                                            .value
                                                })
                                            }
                                        />

                                    </div>

                                    <div className="col-md-12 mb-3">

                                        <label>
                                            Email
                                        </label>

                                        <InputText
                                            className="w-100"
                                            value={
                                                formData.BranchHeadEmail
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    BranchHeadEmail:
                                                        e
                                                            .target
                                                            .value
                                                })
                                            }
                                        />

                                    </div>

                                    <div className="col-md-12">

                                        <Button
                                            label={
                                                isEdit
                                                    ? "Update"
                                                    : "Save"
                                            }
                                            className="w-100"
                                            onClick={
                                                saveDepartment
                                            }
                                        />

                                    </div>

                                </div>

                            </Dialog>

            </div>
        </div>
    );
};

export default VisitorDepartment;