import React, { useMemo, useState } from "react";
import CustomDatePicker from "../ReactComponents/CustomDatePicker/CustomDatePicker";
const formatAssetId = (value) => (value || value === 0 ? `#${value}` : "#1234");

const splitDateTime = (value) => {
  if (!value) return { date: "", time: "" };
  const [date, time = ""] = String(value).split("T");
  return { date, time: time.slice(0, 5) };
};

const joinDateTime = (date, time) => {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
};

const RentOut = ({ Close, setData, asset, showModeToggle }) => {
  const initialDateTime = splitDateTime("");
  const [formData, setFormData] = useState({
    assigneeName: "",
    rentedTo: "",
    outFrom: asset?.Location || "",
    manufacturer: asset?.Manufacturer || "",
    rentalCharges: "",
    securityDeposit: "",
    rentOutDate: initialDateTime.date,
    rentOutTime: initialDateTime.time,
    tentativeReturnDate: "",
    approvedBy: "",
    imageOut: null,
    rentalContractName: "",
    assetImageName: "",
  });

  const assetName = useMemo(() => asset?.Name || "Generator", [asset]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event, targetField, fileNameField) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [targetField]: reader.result,
        [fileNameField]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setData({
      assigneeName: formData.assigneeName,
      rentOutDateTime: joinDateTime(formData.rentOutDate, formData.rentOutTime),
      outFrom: formData.outFrom,
      rentedTo: formData.rentedTo,
      tentativeReturnDate: formData.tentativeReturnDate,
      imageOut: formData.imageOut,
      approvedBy: formData.approvedBy,
      rentalCharges: formData.rentalCharges,
    });
    if (Close) Close();
  };

  return (
    <form className="rental-asset-form" onSubmit={handleSubmit}>
      <div className="rental-asset-scroll-area">
        {!showModeToggle ? (
        <div className="rental-asset-meta">
          <div className="rental-asset-meta-item">
            <span className="rental-asset-meta-label">Asset Name</span>
            <span className="rental-asset-meta-value">{assetName}</span>
          </div>
          <div className="rental-asset-meta-item rental-asset-meta-id">
            <span className="rental-asset-meta-label">ID</span>
            <span className="rental-asset-meta-value">{formatAssetId(asset?.Id)}</span>
          </div>
        </div>
      ) : (
        <div className="rental-asset-select-wrap rental-asset-select-wrap-full">
          <label className="rental-asset-label">Asset</label>
          <div className="rental-asset-input rental-asset-select">{assetName}</div>
        </div>
      )}

      <div className="rental-asset-grid">
        <div className="rental-asset-field">
          <label className="rental-asset-label">Asignee name</label>
          <input className="rental-asset-input" type="text" name="assigneeName" placeholder="Select name" value={formData.assigneeName} onChange={handleInputChange} required />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rented to</label>
          <input className="rental-asset-input" type="text" name="rentedTo" placeholder="Vendor name" value={formData.rentedTo} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Out from</label>
          <input className="rental-asset-input" type="text" name="outFrom" placeholder="Auto-populated" value={formData.outFrom} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Manufacturer</label>
          <input className="rental-asset-input" type="text" name="manufacturer" placeholder="Vendor name" value={formData.manufacturer} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rental charges</label>
          <input className="rental-asset-input" type="number" name="rentalCharges" placeholder="₹" value={formData.rentalCharges} onChange={handleInputChange} required />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Security deposit</label>
          <input className="rental-asset-input" type="number" name="securityDeposit" placeholder="₹" value={formData.securityDeposit} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rent-out date</label>
          <CustomDatePicker value={formData.rentOutDate} onChange={(e) => handleInputChange({ target: { name: "rentOutDate", value: e.target.value } })} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rent out time</label>
          <input className="rental-asset-input" type="time" name="rentOutTime" value={formData.rentOutTime} onChange={handleInputChange} required />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Tentative date of returning</label>
          <CustomDatePicker value={formData.tentativeReturnDate} onChange={(e) => handleInputChange({ target: { name: "tentativeReturnDate", value: e.target.value } })} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Approved by</label>
          <input className="rental-asset-input" type="text" name="approvedBy" placeholder="Enter name" value={formData.approvedBy} onChange={handleInputChange} required />
        </div>

        {!showModeToggle ? (
          <>
            <div className="rental-asset-field">
              <label className="rental-asset-label">Rental contract</label>
              <label className="rental-asset-upload">
                <input type="file" accept="image/*,.pdf" onChange={(event) => handleFileChange(event, "rentalContractData", "rentalContractName")} />
                <span className="rental-asset-upload-name">{formData.rentalContractName || "Upload file"}</span>
                <i className="fa fa-file-text-o" aria-hidden="true" />
              </label>
            </div>
            <div className="rental-asset-field">
              <label className="rental-asset-label">Asset image</label>
              <label className="rental-asset-upload">
                <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, "imageOut", "assetImageName")} />
                <span className="rental-asset-upload-name">{formData.assetImageName || "Upload file"}</span>
                <i className="fa fa-picture-o" aria-hidden="true" />
              </label>
            </div>
          </>
        ) : null}
        </div>
      </div>

      <div className="rental-asset-actions">
        <button type="submit" className="btn rental-asset-submit">
          Rent-out
        </button>
        <button type="button" className="btn rental-asset-cancel" onClick={Close}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RentOut;
