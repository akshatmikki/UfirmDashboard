import React, { useEffect, useState } from "react";
import {
  getLwfList,
  getCountries,
  getStatesByCountry,
  deleteLwf,
  addLwf,
  updateLwf,
} from "../../Services/PayrollService";

export default function LabourFund() {
  const [lwfData, setLwfData] = useState([]);
  const [states, setStates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchLwf, setSearchLwf] = useState("");

  useEffect(() => {
    getCountries()
      .then((countries) => {
        const india = countries.find(
          (c) => c.Name.toLowerCase() === "india"
        ) || countries[0];
        if (india) {
          getStatesByCountry(india.CountryId).then(setStates).catch(() => setStates([]));
        }
      })
      .catch(() => setStates([]));
    fetchData();
  }, []);

  function fetchData() {
    getLwfList().then(setLwfData).catch(() => setLwfData([]));
  }

  const getStateName = (stateId) => {
    const foundState = states.find((state) => state.StateId === stateId);
    return foundState ? foundState.StateName.toString() : stateId.toString();
  };

  const initialLwfForm = {
    LwfId: 0,
    StateId: 0,
    LwfAmount: 0,
    EmployeeAmount: 0,
    EmployerAmount: 0,
    MaxRange: 0,
    Percentage: 0,
  };

  const openDialog = (type, record = null) => {
    setDialogType(type);
    setSelectedRecord(record);
    if (type === "create-lwf") {
      setFormData(initialLwfForm);
    } else if (record) {
      setFormData(record);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRecord(null);
    setFormData({});
  };

  const handleDeleteLwf = async (id) => {
    if (window.confirm("Are you sure you want to delete this LWF record?")) {
      try {
        await deleteLwf(id);
        fetchData();
      } catch {
        alert("Delete failed.");
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const lwfAmount = parseFloat(formData.LwfAmount) || 0;
    const empAmount = parseFloat(formData.EmployeeAmount) || 0;
    const employerAmount = parseFloat(formData.EmployerAmount) || 0;

    if (lwfAmount !== empAmount + employerAmount) {
      alert("'Lwf Amount' must equal the sum of Employee Amount and Employer Amount");
      return;
    }

    try {
      if (dialogType === "create-lwf") {
        await addLwf(formData);
      } else if (dialogType === "edit-lwf") {
        await updateLwf(formData.LwfId, formData);
      }
      fetchData();
      closeDialog();
    } catch {
      alert("Operation failed.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "StateId" ? parseInt(value) : value,
    }));
  };

  const isView = dialogType === "view-lwf";

  const stateOptions = states.map((s) => (
    <option key={s.StateId} value={s.StateId}>
      {s.StateName}
    </option>
  ));

  const filteredLwf = lwfData.filter((item) => {
    const stateName = getStateName(item.StateId).toLowerCase();
    return (
      stateName.includes(searchLwf.toLowerCase()) ||
      item.LwfAmount.toString().includes(searchLwf) ||
      item.EmployeeAmount.toString().includes(searchLwf) ||
      item.EmployerAmount.toString().includes(searchLwf) ||
      item.MaxRange?.toString().includes(searchLwf) ||
      item.Percentage?.toString().includes(searchLwf)
    );
  });

  return (
    <div className="content-wrapper" style={{ minHeight: "100vh", padding: 30 }}>
      <div
        className="card"
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          padding: "20px 30px",
          background: "#f7fafc",
        }}
      >
        {/* Labour Welfare Fund Section */}
        <div
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}
        >
          <h2 style={{ fontWeight: "bold", color: "#2a4365" }}>Labour Welfare Fund</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchLwf}
              onChange={(e) => setSearchLwf(e.target.value)}
              style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <button className="btn btn-success" onClick={() => openDialog("create-lwf")}>
              Create
            </button>
          </div>
        </div>

        <table className="table table-bordered" style={{ width: "100%", background: "#fff" }}>
          <thead style={{ background: "#edf2f7" }}>
            <tr>
              <th>S.No.</th>
              <th>State Name</th>
              <th>Lwf Amount</th>
              <th>Employee Amount</th>
              <th>Employer Amount</th>
              <th>Max Range</th>
              <th>Percentage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLwf.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#718096" }}>
                  No data
                </td>
              </tr>
            ) : (
              filteredLwf.map((item, index) => (
                <tr key={item.LwfId}>
                  <td>{index + 1}</td>
                  <td>{getStateName(item.StateId)}</td>
                  <td>{item.LwfAmount}</td>
                  <td>{item.EmployeeAmount}</td>
                  <td>{item.EmployerAmount}</td>
                  <td>{item.MaxRange}</td>
                  <td>{item.Percentage}</td>
                  <td style={{ textAlign: "center", fontSize: 18, userSelect: "none" }}>
                    <button
                      className="btn btn-sm btn-info me-2"
                      title="View"
                      onClick={() => openDialog("view-lwf", item)}
                      type="button"
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      className="btn btn-sm btn-primary me-2"
                      title="Edit"
                      onClick={() => openDialog("edit-lwf", item)}
                      type="button"
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      title="Delete"
                      onClick={() => handleDeleteLwf(item.LwfId)}
                      type="button"
                    >
                      <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog Modal */}
      {dialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeDialog}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: 600,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 20 }}>
              {dialogType === "create-lwf" && "Create "}
              {dialogType === "edit-lwf" && "Edit "}
              {dialogType === "view-lwf" && "View "}
              Labour Welfare Fund
            </h3>

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 10 }}>
                <label>State:</label>
                {isView ? (
                  <div>{getStateName(formData.StateId)}</div>
                ) : (
                  <select
                    name="StateId"
                    value={formData.StateId}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: 6 }}
                  >
                    <option value={0}>-- Select State --</option>
                    {stateOptions}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Lwf Amount:</label>
                {isView ? (
                  <div>{formData.LwfAmount}</div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    name="LwfAmount"
                    value={formData.LwfAmount}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: 6 }}
                  />
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Employee Amount:</label>
                {isView ? (
                  <div>{formData.EmployeeAmount}</div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    name="EmployeeAmount"
                    value={formData.EmployeeAmount}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: 6 }}
                  />
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Employer Amount:</label>
                {isView ? (
                  <div>{formData.EmployerAmount}</div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    name="EmployerAmount"
                    value={formData.EmployerAmount}
                    onChange={handleInputChange}
                    required
                    style={{ width: "100%", padding: 6 }}
                  />
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Max Range:</label>
                {isView ? (
                  <div>{formData.MaxRange}</div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    name="MaxRange"
                    value={formData.MaxRange}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: 6 }}
                  />
                )}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Percentage:</label>
                {isView ? (
                  <div>{formData.Percentage}</div>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    name="Percentage"
                    value={formData.Percentage}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: 6 }}
                  />
                )}
              </div>

              <div style={{ textAlign: "right", marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDialog}
                  style={{ marginRight: 10 }}
                >
                  Cancel
                </button>
                {!isView && (
                  <button type="submit" className="btn btn-primary">
                    {dialogType === "create-lwf" ? "Create" : "Update"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
