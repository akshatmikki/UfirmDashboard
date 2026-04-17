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

const ReturnAsset = ({ Close, setData, asset, showModeToggle }) => {
  const initialDateTime = splitDateTime("");
  const [formData, setFormData] = useState({
    returnedBy: "",
    rentedFrom: asset?.Vendor || "",
    returnedFrom: asset?.Location || "",
    manufacturer: asset?.Manufacturer || "",
    rentalCharges: "",
    securityDeposit: "",
    returnDate: initialDateTime.date,
    returnTime: initialDateTime.time,
    tentativeReturnDate: "",
    approvedBy: "",
    imageIn: null,
    rentalContractName: "",
    assetImageName: "",
  });

  const assetName = useMemo(() => asset?.Name || "Generator", [asset]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event, targetField, fileNameField, stripPrefix) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = stripPrefix ? String(reader.result).split(",")[1] : reader.result;
      setFormData((prev) => ({
        ...prev,
        [targetField]: result,
        [fileNameField]: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setData({
      returnedBy: formData.returnedBy,
      returnDateTime: joinDateTime(formData.returnDate, formData.returnTime),
      returnedFrom: formData.returnedFrom,
      imageIn: formData.imageIn,
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
          <label className="rental-asset-label">Received by</label>
          <input className="rental-asset-input" type="text" name="returnedBy" placeholder="Select name" value={formData.returnedBy} onChange={handleInputChange} required />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rented from</label>
          <input className="rental-asset-input" type="text" name="rentedFrom" placeholder="Vendor name" value={formData.rentedFrom} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Location</label>
          <input className="rental-asset-input" type="text" name="returnedFrom" placeholder="Auto populated" value={formData.returnedFrom} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Manufacturer</label>
          <input className="rental-asset-input" type="text" name="manufacturer" placeholder="Auto-populated" value={formData.manufacturer} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rental charges</label>
          <input className="rental-asset-input" type="number" name="rentalCharges" placeholder="₹" value={formData.rentalCharges} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Security deposit</label>
          <input className="rental-asset-input" type="number" name="securityDeposit" placeholder="₹" value={formData.securityDeposit} onChange={handleInputChange} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rent-in date</label>
          <CustomDatePicker value={formData.returnDate} onChange={(e) => handleInputChange({ target: { name: "returnDate", value: e.target.value } })} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Rent -n time</label>
          <input className="rental-asset-input" type="time" name="returnTime" value={formData.returnTime} onChange={handleInputChange} required />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Tentative date of returning</label>
          <CustomDatePicker value={formData.tentativeReturnDate} onChange={(e) => handleInputChange({ target: { name: "tentativeReturnDate", value: e.target.value } })} />
        </div>
        <div className="rental-asset-field">
          <label className="rental-asset-label">Approved by</label>
          <input className="rental-asset-input" type="text" name="approvedBy" placeholder="Enter name" value={formData.approvedBy} onChange={handleInputChange} />
        </div>

        {!showModeToggle ? (
          <>
            <div className="rental-asset-field">
              <label className="rental-asset-label">Rental contract</label>
              <label className="rental-asset-upload">
                <input type="file" accept="image/*,.pdf" onChange={(event) => handleFileChange(event, "rentalContractData", "rentalContractName", false)} />
                <span className="rental-asset-upload-name">{formData.rentalContractName || "Upload file"}</span>
                <i className="fa fa-file-text-o" aria-hidden="true" />
              </label>
            </div>
            <div className="rental-asset-field">
              <label className="rental-asset-label">Asset image</label>
              <label className="rental-asset-upload">
                <input type="file" accept="image/*" onChange={(event) => handleFileChange(event, "imageIn", "assetImageName", true)} />
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
          Rent-in
        </button>
        <button type="button" className="btn rental-asset-cancel" onClick={Close}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ReturnAsset;
