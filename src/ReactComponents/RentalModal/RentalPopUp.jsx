import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import ReturnAsset from "../../pages/ReturnAssetPage";
import RentOut from "../../pages/RentOutAssetPage";
import "./RentalPopUp.css";

const getInitialMode = (actionType, asset) => {
  if (actionType === "return") return "rentin";
  if (actionType === "rentout") return "rentout";

  const rentOutTime = asset?.RentedOutDate ? new Date(asset.RentedOutDate).getTime() : 0;
  const returnTime = asset?.ReturnDate ? new Date(asset.ReturnDate).getTime() : 0;
  return rentOutTime > returnTime ? "rentin" : "rentout";
};

function RentalPopUp({ show, handleClose, asset, actionType, handleSubmit }) {
  const [activeMode, setActiveMode] = useState(getInitialMode(actionType, asset));
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (show) {
      setActiveMode(getInitialMode(actionType, asset));
      setShowCancelConfirm(false);
    }
  }, [show, actionType, asset]);

  const title = useMemo(() => {
    if (actionType === "return") return "Rent-in asset";
    if (actionType === "rentout") return "Rent-out asset";
    return "Rent asset";
  }, [actionType]);

  const handleRentOutData = (rentOutData) => {
    handleSubmit(rentOutData, "rentout");
  };

  const handleReturnData = (returnData) => {
    handleSubmit(returnData, "return");
  };

  const handleRequestClose = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCancelConfirm(false);
    handleClose();
  };

  const showModeToggle = actionType !== "return" && actionType !== "rentout";

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered dialogClassName="rental-figma-modal">
      <Modal.Body className="rental-figma-modal-body">
        <div className="rental-figma-shell">
          <div className="rental-figma-header">
            <div className="rental-figma-title-wrap">
              <span className="rental-figma-title-icon">
                <i className="fa fa-sign-out" aria-hidden="true" />
              </span>
              <h3 className="rental-figma-title">{showModeToggle ? "Rent asset" : title}</h3>
            </div>
          </div>

          {showModeToggle ? (
            <div className="rental-figma-mode-switch">
              <label className="rental-figma-radio">
                <input type="radio" name="rentMode" value="rentout" checked={activeMode === "rentout"} onChange={() => setActiveMode("rentout")} />
                <span>Rent-out</span>
              </label>
              <label className="rental-figma-radio">
                <input type="radio" name="rentMode" value="rentin" checked={activeMode === "rentin"} onChange={() => setActiveMode("rentin")} />
                <span>Rent-in</span>
              </label>
            </div>
          ) : null}

          {activeMode === "rentin" ? (
            <ReturnAsset Close={handleRequestClose} setData={handleReturnData} asset={asset} showModeToggle={showModeToggle} />
          ) : (
            <RentOut Close={handleRequestClose} setData={handleRentOutData} asset={asset} showModeToggle={showModeToggle} />
          )}
        </div>

        {showCancelConfirm ? (
          <div className="spare-add-backdrop" onClick={() => setShowCancelConfirm(false)}>
            <div className="asset-master-main-card" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
              <div className="asset-side-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="spare-add-title">
                  <span className="spare-add-icon" style={{ background: "rgba(235, 75, 75, 0.12)", color: "#eb4b4b" }}>
                    <i className="fa fa-exclamation-triangle" aria-hidden="true" />
                  </span>
                  Cancel edits
                </div>
                <button type="button" className="spare-add-close" onClick={() => setShowCancelConfirm(false)}>
                  <i className="fa fa-times" aria-hidden="true" />
                </button>
              </div>
              <div className="asset-side-panel-body">
                Are you sure you want to cancel? All your updated information will be lost.
              </div>
              <div className="asset-dialog-actions">
                <button type="button" className="btn btn-light" onClick={() => setShowCancelConfirm(false)}>
                  No, keep editing
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmClose}>
                  Yes, cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal.Body>
    </Modal>
  );
}

export default RentalPopUp;
