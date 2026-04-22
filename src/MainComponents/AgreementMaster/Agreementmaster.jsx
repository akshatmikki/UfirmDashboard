import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import * as appCommon from "../../Common/AppCommon.js";
import { MasterConfigCommon } from "../../ReactComponents/MasterConfig";
import { getAllClients } from "../../Services/ClientService";
import { getAllProperties } from "../../Services/PropertyService";

const API_BASE = "http://localhost:62929/api/Agreement";

const AgreementMaster = () => {
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const userId = useSelector((state) => state.Commonreducer.userId);
  const selectedPropertyId = Number(propertyId) > 0 ? Number(propertyId) : null;
  const selectedUserId = Number(userId) > 0 ? Number(userId) : 1;

  const context = useMemo(
    () => ({ selectedPropertyId, selectedUserId }),
    [selectedPropertyId, selectedUserId]
  );

  const tabs = useMemo(
    () => [
      {
        id: "agreements",
        label: "Agreements",
        entityName: "Agreement",
        getId: (r) => r.AgreementId,
        searchKeys: ["AgreementId", "Client_ID", "Property_ID", "Description"],
        columns: [
          { header: "ID", render: (r) => `#${r.AgreementId}` },
          { header: "Client", valueKey: "Client_ID" },
          { header: "Property", valueKey: "Property_ID" },
          { header: "Start", render: (r) => r.Agreement_Start_Date?.split("T")[0] },
          { header: "End", render: (r) => r.Agreement_End_Date?.split("T")[0] },
          { header: "Amount", render: (r) => `₹ ${r.Agreement_Amount}` },
          {
            header: "Status",
            render: (r) => (
              <span
                className={`badge ${
                  r.Agreement_Status === "Active" ? "bg-success" : "bg-secondary"
                }`}
              >
                {r.Agreement_Status}
              </span>
            ),
          },
        ],
        fields: [
          { key: "AgreementId", label: "ID", readOnly: true, hideInAdd: true },
          {
            key: "Client_ID",
            label: "Client",
            required: true,
            type: "select",
            options: ({ meta }) =>
              (meta?.clients || []).map((c) => ({
                value: c.ClientID ?? c.ClientId ?? c.id,
                label: c.ClientName ?? c.clientName ?? c.name,
              })),
          },
          {
            key: "Property_ID",
            label: "Property",
            required: true,
            renderEdit: ({ value, form, setForm, meta }) => {
              const clientId = form?.Client_ID;
              const filteredProps = (meta?.properties || []).filter(
                (p) => String(p.ClientID ?? p.ClientId) === String(clientId)
              );

              return (
                <select
                  className="mc-select"
                  value={value || ""}
                  onChange={(e) => setForm((p) => ({ ...p, Property_ID: e.target.value }))}
                  disabled={!clientId}
                >
                  <option value="">-- Select Property --</option>
                  {filteredProps.map((p) => (
                    <option key={p.PropertyId} value={p.PropertyId}>
                      {p.Name ?? p.PropertyName}
                    </option>
                  ))}
                </select>
              );
            },
          },
          { key: "Agreement_Amount", label: "Amount", required: true, type: "number" },
          { key: "Agreement_Start_Date", label: "Start Date", type: "date", required: true },
          { key: "Agreement_End_Date", label: "End Date", type: "date", required: true },
          {
            key: "Payment_Type",
            label: "Payment Type",
            type: "select",
            options: ["Monthly", "Daily"],
          },
          { key: "Working_Days", label: "Working Days", type: "number" },
          { key: "Salary_Cycle_Start", label: "Salary Cycle Start", type: "number" },
          { key: "Salary_Cycle_End", label: "Salary Cycle End", type: "number" },
          {
            key: "Agreement_Status",
            label: "Status",
            type: "select",
            options: ["Active", "Inactive"],
          },
          { key: "Description", label: "Description", type: "textarea", colSpan: 2 },
        ],
        initialForm: () => ({
          Client_ID: "",
          Property_ID: "",
          Agreement_Start_Date: "",
          Agreement_End_Date: "",
          Agreement_Amount: "",
          Payment_Type: "Monthly",
          Working_Days: "",
          Salary_Cycle_Start: "",
          Salary_Cycle_End: "",
          Agreement_Status: "Active",
          Description: "",
        }),
        toForm: ({ row }) => ({
          ...row,
          Agreement_Start_Date: row.Agreement_Start_Date?.split("T")[0],
          Agreement_End_Date: row.Agreement_End_Date?.split("T")[0],
        }),
        load: async () => {
          const [agreements, clients, properties] = await Promise.all([
            fetch(`${API_BASE}/GetAll`).then((r) => r.json()),
            getAllClients().catch(() => []),
            getAllProperties().catch(() => []),
          ]);
          return {
            rows: agreements,
            meta: { clients, properties },
          };
        },
        save: async ({ mode, form }) => {
          const { AgreementId, ...payload } = form;
          const url = mode === "edit" ? `${API_BASE}/Update/${AgreementId}` : `${API_BASE}/Create`;
          const method = mode === "edit" ? "PUT" : "POST";

          await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        },
        remove: async ({ row }) => {
          await fetch(`${API_BASE}/Delete/${row.AgreementId}`, { method: "DELETE" });
        },
      },
    ],
    []
  );

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <MasterConfigCommon
            title="Agreement Master"
            context={context}
            tabs={tabs}
            useGrid={true}
            notify={({ type, message }) => {
              const t =
                type === "error"
                  ? "error"
                  : type === "warning"
                  ? "warning"
                  : type === "success"
                  ? "success"
                  : "info";
              appCommon.showtextalert(message, "", t);
            }}
          />
        </div>
      </section>
    </div>
  );
};

export default AgreementMaster;