import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ReadonlyDate({ value }) {
  if (!value) return <input className="form-control" value="" disabled />;
  if (typeof value === "string") return <input className="form-control" value={value} disabled />;
  return <ReactDatePicker className="form-control" selected={value} dateFormat="dd/MM/yyyy" readOnly />;
}

export default function TaskAssetSection({
  taskName,
  location,
  mode,
  assets,
  assetId,
  assetName,
  onAssetChange,
  assetBrand,
  lastServiceDate,
  nextServiceDate,
  assetPhoto,
  QRCode,
}) {
  const isView = mode === "view";
  return (
    <div className="add-task-form">
      <div className="row mb-3">
        <div className="col-md-6">
          <label>Task Name</label>
          <input className="form-control" value={taskName || ""} disabled />
        </div>
        <div className="col-md-6">
          <label>Location</label>
          <input className="form-control" value={location || ""} disabled />
        </div>
      </div>

      {isView ? (
        <div className="row mb-3 align-items-center">
          <div className="col-md-2">
            <label>Asset Details</label>
          </div>
          <div className="col-md-10">
            <input className="form-control" value={assetName || ""} disabled />
          </div>
        </div>
      ) : (
        <div className="row mb-3 align-items-center">
          <div className="col-md-2">
            <label>Asset Name</label>
          </div>
          <div className="col-md-10">
            <select
              className={`form-control ${!assetId ? "placeholder-select" : ""}`}
              value={assetId || ""}
              onChange={(e) => onAssetChange?.(e.target.value)}
            >
              <option value="">Select Asset</option>
              {(assets || []).map((a) => (
                <option key={String(a.assetId)} value={a.assetId}>
                  {a.assetName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="row mb-3 align-items-center">
        <div className="col-md-2">
          <label>Asset ID</label>
        </div>
        <div className="col-md-4">
          <input className="form-control" value={assetId || ""} disabled />
        </div>

        <div className="col-md-2">
          <label>Asset Brand</label>
        </div>
        <div className="col-md-4">
          <input className="form-control" value={assetBrand || ""} disabled />
        </div>
      </div>

      <div className="row mb-3 align-items-center">
        <div className="col-md-2">
          <label>Last Service</label>
        </div>
        <div className="col-md-4">
          <ReadonlyDate value={lastServiceDate} />
        </div>

        <div className="col-md-2">
          <label>Next Service</label>
        </div>
        <div className="col-md-4">
          <ReadonlyDate value={nextServiceDate} />
        </div>
      </div>

      <div className="row mb-0 align-items-center">
        <div className="col-md-2">
          <label>Asset Photo</label>
        </div>

        <div className="col-md-4">
          {assetPhoto ? (
            <img
              src={`data:image/png;base64,${assetPhoto}`}
              alt="Asset"
              style={{
                height: "90px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="form-control d-flex align-items-center text-muted" style={{ height: "38px" }}>
              No image available
            </div>
          )}
        </div>

        <div className="col-md-2">
          <label>QR Code</label>
        </div>
        <div className="col-md-4">
          <input className="form-control" value={QRCode || ""} disabled />
        </div>
      </div>
    </div>
  );
}
