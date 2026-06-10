import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";

export default function InactiveEmployeesTable({ data = [], loading, onRegenerate }) {
    // 🔥 Map API response → table-friendly structure
    const formattedData = (data || []).map((item) => ({
        FacilityMemberId: item?.FacilityMember?.FacilityMemberId,
        EmployeeCode: item?.Profile?.EmployeeCode,
        EmployeeName: item?.Profile?.EmployeeName,
        Designation: item?.Profile?.Designation,
        PhoneNumber: item?.Profile?.PhoneNumber,
        Gender: item?.Profile?.Gender,
    }));

    return (
        <div className="card mt-2">
            <DataTable
                value={formattedData}
                paginator
                rows={10}
                loading={loading}
                responsiveLayout="scroll"
                emptyMessage="No inactive employees found."
            >
                <Column field="EmployeeCode" header="Employee Code" />
                <Column field="EmployeeName" header="Name" />
                <Column field="Designation" header="Designation" />
                <Column field="Gender" header="Gender" />
                <Column field="PhoneNumber" header="Contact" />
                <Column
                    header="Action"
                    body={(row) => (
                        <Button
                            label="Active"
                            icon="pi pi-check"
                            className="p-button-success p-button-sm"
                            onClick={() => onRegenerate(row)}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
}