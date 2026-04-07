"use client";

import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Link } from "react-router-dom";

import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../Services/Department";

const normalizeDepartment = (item = {}) => ({
  Id: item.Id ?? item.id ?? item.DepartmentId ?? item.departmentId ?? null,
  Name: item.Name ?? item.name ?? item.DepartmentName ?? item.departmentName ?? "",
});

const DepartmentMaster = () => {
  const toast = useRef(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    Id: null,
    Name: "",
  });

  const primaryButtonStyle = {
    backgroundColor: "#0ea5e9",
    border: "1px solid #0ea5e9",
    color: "#ffffff",
    fontWeight: 600,
    boxShadow: "none",
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAllDepartments();
      setData(Array.isArray(res) ? res.map(normalizeDepartment) : []);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setFormData({
      Id: null,
      Name: "",
    });
    setIsEdit(false);
    setDialogVisible(true);
  };

  const openEdit = (row) => {
    setFormData({
      Id: row.Id,
      Name: row.Name,
    });
    setIsEdit(true);
    setDialogVisible(true);
  };

  const handleDelete = async (row) => {
    try {
      await deleteDepartment(row.Id);
      toast.current.show({ severity: "success", summary: "Deleted" });
      fetchData();
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: err.message });
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.Name.trim()) {
        toast.current.show({ severity: "warn", detail: "Enter Department Name" });
        return;
      }

      const payload = {
        Name: formData.Name,
      };

      if (isEdit) {
        await updateDepartment(formData.Id, payload);
      } else {
        await createDepartment(payload);
      }

      toast.current.show({
        severity: "success",
        summary: isEdit ? "Updated" : "Created",
        detail: `Department ${isEdit ? "updated" : "created"} successfully`,
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
          Department
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
          label="Add Department"
          icon="pi pi-plus"
          className="font-semibold px-4"
          style={{ ...primaryButtonStyle, marginLeft: "0.25rem" }}
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
                    className="p-button-sm p-button-outlined"
                  />
                </Link>
                <Link
                  to="/Account/App/department"
                  className="text-decoration-none"
                >
                  <Button
                    label="Department"
                    className="p-button-sm"
                    style={{
                      backgroundColor: "#0ea5e9",
                      border: "1px solid #0ea5e9",
                      color: "#ffffff",
                      boxShadow: "none",
                    }}
                  />
                </Link>
              </div>

              {header}

              <DataTable
                value={data}
                paginator
                rows={10}
                loading={loading}
                globalFilter={globalFilter}
                emptyMessage="No departments found."
                responsiveLayout="scroll"
                className="p-datatable-gridlines p-datatable-sm"
                stripedRows
                rowHover
              >
                <Column
                  header="#"
                  body={(row, options) => (
                    <span className="font-semibold">{options.rowIndex + 1}</span>
                  )}
                  style={{ width: "70px" }}
                />

                <Column field="Id" header="ID" style={{ minWidth: "180px" }} />

                <Column
                  field="Name"
                  header="Department Name"
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
            <span>{isEdit ? "Edit Department" : "Add Department"}</span>
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
            <label htmlFor="departmentName" className="font-bold mb-2 block">
              Department Name <span className="text-red-500">*</span>
            </label>
            <InputText
              id="departmentName"
              value={formData.Name}
              placeholder="Enter department name"
              onChange={(e) =>
                setFormData({ ...formData, Name: e.target.value })
              }
              autoFocus
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DepartmentMaster;
