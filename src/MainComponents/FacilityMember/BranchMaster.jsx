import React, { useState, useEffect, useMemo } from "react";
import { getAllBranches, createBranch, updateBranch, deleteBranch } from "../../Services/BranchMaster";

const BranchMaster = () => {
  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or danger
  const [isView, setIsView] = useState(false);

  const initialForm = {
    BranchId: 0,
    BranchCode: "",
    BranchName: "",
    AddressLine: "",
    StateName: "",
    ManagerName: "",
    ManagerMobileNo: "",
    IsActive: true
  };

  const [formData, setFormData] = useState(initialForm);

  const handleView = (branch) => {
    setIsView(true);
    setIsEdit(false);
    setFormData(branch);
    setShowModal(true);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error("Failed to load branches");
    }
  };

  // 🔍 Search Filter
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) =>
      Object.values(branch)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  const handleEdit = (branch) => {
    setIsView(false);
    setIsEdit(true);
    setFormData(branch);
    setShowModal(true);
  };

  const normalize = (str) => {
    return str?.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const handleSave = async () => {
    try {
      if (!formData.BranchName.trim()) {
        setMessage("Enter Branch Name");
        setMessageType("danger");
        return;
      }

      const normalizedName = normalize(formData.BranchName);

      // 🔥 DUPLICATE NAME
      const isNameDuplicate = branches.some(
        (b) =>
          normalize(b.BranchName) === normalizedName &&
          b.BranchId !== formData.BranchId
      );

      if (isNameDuplicate) {
        setMessage("Branch name already exists.");
        setMessageType("danger");
        return;
      }

      // ✅ API CALL
      if (isEdit) {
        await updateBranch(formData.BranchId, formData);
        setMessage("Branch updated successfully.");
      } else {
        const { BranchCode, ...payload } = formData;
        await createBranch(payload);
        setMessage("Branch created successfully.");
      }

      setMessageType("success");
      setShowModal(false);
      loadBranches();

      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      setMessage(error?.response?.data || "Something went wrong.");
      setMessageType("danger");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this branch?"
    );

    if (!confirmDelete) return;

    try {
      await deleteBranch(id);
      loadBranches();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // 📤 Export to Excel (CSV)
  const exportToExcel = () => {
    const headers = [
      "Branch Code",
      "Branch Name",
      "Address",
      "State",
      "Manager",
      "Mobile"
    ];

    const rows = filteredBranches.map((b) => [
      b.BranchCode ?? "",
      b.BranchName ?? "",
      b.AddressLine ?? "",
      b.StateName ?? "",
      b.ManagerName ?? "",
      b.ManagerMobileNo ? `="${b.ManagerMobileNo}"` : ""
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
    link.setAttribute("download", "BranchMaster.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="container mt-4">
      <h2>Branch Master</h2>

      {message && (
        <div className={`alert alert-${messageType} mt-3`}>
          {message}
        </div>
      )}

      {/* Top Controls */}
      <div className="card p-3 mb-3">
        <div className="row align-items-center">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-md-8 text-end">
            <button
              className="btn btn-success me-2"
              onClick={() => {
                setIsView(false);
                setIsEdit(false);
                setFormData(initialForm);
                setShowModal(true);
              }}
            >
              <i className="fa fa-plus me-1"></i> Create
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={exportToExcel}
            >
              📤 Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Branch Code</th>
                <th>Branch Name</th>
                <th>Address</th>
                <th>State</th>
                <th>Manager</th>
                <th>Mobile</th>
                <th style={{ width: "160px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">
                    No branches found
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch, index) => (
                  <tr key={branch.BranchId}>
                    <td>{index + 1}</td>
                    <td>{branch.BranchCode}</td>
                    <td>{branch.BranchName}</td>
                    <td>{branch.AddressLine}</td>
                    <td>{branch.StateName}</td>
                    <td>{branch.ManagerName}</td>
                    <td>{branch.ManagerMobileNo}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-info"
                          title="View"
                          onClick={() => handleView(branch)}
                        >
                          <i className="fa fa-eye"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-primary"
                          title="Edit"
                          onClick={() => handleEdit(branch)}
                        >
                          <i className="fa fa-edit"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          title="Delete"
                          onClick={() => handleDelete(branch.BranchId)}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {showModal && (
            <div className="modal d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {isView
                        ? "View Branch"
                        : isEdit
                          ? "Edit Branch"
                          : "Create Branch"}
                    </h5>
                    <button
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>

                  <div className="modal-body">
                    <div className="mb-2">
                      <label>Branch Code</label>
                      <input
                        className="form-control"
                        value={formData.BranchCode || "Auto-generated"}
                        disabled
                      />
                    </div>

                    <div className="mb-2">
                      <label>Branch Name</label>
                      <input
                        className="form-control"
                        value={formData.BranchName}
                        disabled={isView}
                        onChange={(e) =>
                          setFormData({ ...formData, BranchName: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label>Address</label>
                      <input
                        className="form-control"
                        value={formData.AddressLine}
                        disabled={isView}
                        onChange={(e) =>
                          setFormData({ ...formData, AddressLine: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label>State</label>
                      <input
                        className="form-control"
                        value={formData.StateName}
                        disabled={isView}
                        onChange={(e) =>
                          setFormData({ ...formData, StateName: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label>Manager</label>
                      <input
                        className="form-control"
                        value={formData.ManagerName}
                        disabled={isView}
                        onChange={(e) =>
                          setFormData({ ...formData, ManagerName: e.target.value })
                        }
                      />
                    </div>

                    <div className="mb-2">
                      <label>Mobile</label>
                      <input
                        className="form-control"
                        value={formData.ManagerMobileNo}
                        disabled={isView}
                        onChange={(e) =>
                          setFormData({ ...formData, ManagerMobileNo: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>

                    {!isView && (
                      <button
                        className="btn btn-primary"
                        onClick={handleSave}
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BranchMaster;
