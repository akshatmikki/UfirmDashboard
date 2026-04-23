import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";

import {
    getAllClients,
    createClient,
    updateClient,
    deleteClient
} from "../../Services/ClientService";
import { getAllProperties } from "../../Services/PropertyService";

export default function ClientMaster() {
    const [clients, setClients] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [editId, setEditId] = useState(null);

    const [viewVisible, setViewVisible] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [properties, setProperties] = useState([]);

    const [formData, setFormData] = useState({
        clientName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: ""
    });

    // ------------------------------------------
    // Load All Clients
    // ------------------------------------------
    const loadClients = async () => {
        setLoading(true);

        try {
            const data = await getAllClients();

            // Standardize to camelCase
            const mapped = data.map((c) => ({
                clientID: c.ClientID,
                clientName: c.ClientName,
                contactPerson: c.ContactPerson,
                email: c.Email,
                phone: c.Phone,
                address: c.Address
            }));

            setClients(mapped);
        } catch (err) {
            alert("Failed to load clients.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
        loadProperties();
    }, []);

    // ------------------------------------------
    // Open Create Dialog
    // ------------------------------------------
    const openCreateDialog = () => {
        setViewVisible(false);
        setFormData({
            clientName: "",
            contactPerson: "",
            email: "",
            phone: "",
            address: ""
        });
        setEditId(null);
        setDialogVisible(true);
    };

    const loadProperties = async () => {
        try {
            const data = await getAllProperties();

            const mapped = data.map((p) => ({
                propertyId: p.PropertyId,
                name: p.Name,
                clientId: p.ClientID
            }));

            setProperties(mapped);
        } catch (error) {
            console.error("Failed to load properties", error);
        }
    };

    const openViewDialog = (client) => {
        setSelectedClient(client);
        setViewVisible(true);
    };

    // ------------------------------------------
    // Open Edit Dialog
    // ------------------------------------------
    const openEditDialog = (client) => {
        setViewVisible(false);
        setFormData({
            clientName: client.clientName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            address: client.address
        });

        setEditId(client.clientID);
        setDialogVisible(true);
    };

    // ------------------------------------------
    // Delete Client
    // ------------------------------------------
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;

        try {
            await deleteClient(id);
            alert("Client deleted successfully");
            loadClients();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    // ------------------------------------------
    // Save Client (Create or Update)
    // ------------------------------------------
    const handleSave = async () => {
        if (!formData.clientName.trim()) {
            alert("Client name is required");
            return;
        }

        const model = {
            ClientID: editId || 0,
            ClientName: formData.clientName,
            ContactPerson: formData.contactPerson,
            Email: formData.email,
            Phone: formData.phone,
            Address: formData.address,
            CreatedBy: 1,
            UpdatedBy: 1
        };

        try {
            if (editId) {
                await updateClient(editId, model);
                alert("Client updated successfully!");
            } else {
                await createClient(model);
                alert("Client created successfully!");
            }
            setDialogVisible(false);
            loadClients();
        } catch (err) {
            alert(err?.message || err?.response?.data || "Save failed.");
        }
    };

    // ------------------------------------------
    // Filter Clients
    // ------------------------------------------
    const filteredClients = clients.filter((c) => {
        const keyword = searchText.toLowerCase();
        return (
            c.clientName.toLowerCase().includes(keyword) ||
            (c.contactPerson || "").toLowerCase().includes(keyword) ||
            (c.email || "").toLowerCase().includes(keyword)
        );
    });

    const clientProperties = properties.filter(
        (p) => p.clientId === selectedClient?.clientID
    );

    const dialogFooter = (
        <>
            <button className="btn btn-secondary me-2" onClick={() => setDialogVisible(false)}>
                Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
                Save
            </button>
        </>
    );

    const exportToExcel = () => {
        const headers = [
            "Client Name",
            "Contact Person",
            "Email",
            "Phone",
            "Address"
        ];

        const rows = filteredClients.map((c) => [
            c.clientName ?? "",
            c.contactPerson ?? "",
            c.email ?? "",
            c.phone ? `="${c.phone}"` : "",
            c.address ?? ""
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers, ...rows]
                .map((row) =>
                    row
                        .map((value) =>
                            `"${String(value).replace(/"/g, '""')}"`
                        )
                        .join(",")
                )
                .join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ClientMaster.csv");
        document.body.appendChild(link);
        link.click();
    };

    // UI Layout
    return (
        <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
            <div
                className="card"
                style={{
                    maxWidth: 1400,
                    margin: "0 auto",
                    borderRadius: 10,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    paddingBottom: 20
                }}
            >
                {/* HEADER */}
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{
                        padding: "20px 28px 10px 28px",
                        borderBottom: "1px solid #dee2e6"
                    }}
                >
                    <h2 style={{ fontWeight: "bold", fontSize: "2rem", margin: 0 }}>
                        Client Master
                    </h2>

                    <div className="d-flex align-items-center">
                        <input
                            type="text"
                            className="form-control me-2"
                            style={{
                                maxWidth: 220,
                                background: "#f8fafc",
                                fontSize: 15,
                                height: "38px"
                            }}
                            placeholder="Search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />

                        <button
                            className="btn btn-outline-primary me-2 d-flex align-items-center justify-content-center shadow-sm"
                            style={{
                                height: "38px",
                                padding: "0 14px",
                                gap: "6px",
                                whiteSpace: "nowrap"
                            }}
                            onClick={exportToExcel}
                        >
                            <i className="fa fa-download"></i>
                            <span>Export</span>
                        </button>

                        <button
                            className="btn btn-success d-flex align-items-center justify-content-center"
                            style={{ height: "38px", padding: "0 18px" }}
                            onClick={openCreateDialog}
                        >
                            <i className="pi pi-plus me-2" />
                            Create
                        </button>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="table-responsive px-4 pb-4">
                    {loading ? (
                        <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
                    ) : (
                        <table className="table table-bordered align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Client Name</th>
                                    <th>Contact Person</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th style={{ width: 150, textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-3">
                                            No Clients Found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((item) => (
                                        <tr key={item.clientID}>
                                            <td>{item.clientName}</td>
                                            <td>{item.contactPerson}</td>
                                            <td>{item.email}</td>
                                            <td>{item.phone}</td>
                                            <td>{item.address}</td>



                                            <td className="text-center">
                                                <button
                                                    className="btn btn-sm btn-info me-2"
                                                    onClick={() => openViewDialog(item)}
                                                >
                                                    <i className="fa fa-eye" />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary me-2"
                                                    onClick={() => openEditDialog(item)}
                                                >
                                                    <i className="fa fa-pencil" />
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(item.clientID)}
                                                >
                                                    <i className="fa fa-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* DIALOG */}
                <Dialog
                    header={editId ? "Edit Client" : "Create Client"}
                    visible={dialogVisible}
                    modal
                    draggable={false}
                    resizable={false}
                    style={{ width: "500px" }}
                    onHide={() => setDialogVisible(false)}
                    footer={dialogFooter}
                >
                    <form>
                        {/* Client Name */}
                        <div className="mb-3">
                            <label className="form-label">Client Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.clientName}
                                onChange={(e) =>
                                    setFormData({ ...formData, clientName: e.target.value })
                                }
                            />
                        </div>

                        {/* Contact Person */}
                        <div className="mb-3">
                            <label className="form-label">Contact Person</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.contactPerson}
                                onChange={(e) =>
                                    setFormData({ ...formData, contactPerson: e.target.value })
                                }
                            />
                        </div>

                        {/* Email + Phone */}
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Phone</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="mb-3">
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                            />
                        </div>
                    </form>
                </Dialog>
                <Dialog
                    header="Client Details"
                    visible={viewVisible}
                    modal
                    draggable={false}
                    resizable={false}
                    style={{ width: "500px" }}
                    onHide={() => setViewVisible(false)}
                >
                    {selectedClient && (
                        <div className="p-2">
                            <div className="mb-2">
                                <strong>Client Name:</strong> {selectedClient.clientName}
                            </div>

                            <div className="mb-2">
                                <strong>Contact Person:</strong> {selectedClient.contactPerson}
                            </div>

                            <div className="mb-2">
                                <strong>Email:</strong> {selectedClient.email}
                            </div>

                            <div className="mb-2">
                                <strong>Phone:</strong> {selectedClient.phone}
                            </div>

                            <div className="mb-2">
                                <strong>Address:</strong> {selectedClient.address}
                            </div>

                            <hr />

                            <div className="mb-2">
                                <strong>Properties:</strong>
                                {clientProperties.length > 0 ? (
                                    <ul className="mt-2">
                                        {clientProperties.map((prop) => (
                                            <li key={prop.propertyId}>{prop.name}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted mt-2">
                                        No Properties Assigned.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Dialog>

            </div>
        </div>
    );
}
