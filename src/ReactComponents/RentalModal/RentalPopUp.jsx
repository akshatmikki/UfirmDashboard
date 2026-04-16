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

  useEffect(() => {
    if (show) {
      setActiveMode(getInitialMode(actionType, asset));
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
            <ReturnAsset Close={handleClose} setData={handleReturnData} asset={asset} showModeToggle={showModeToggle} />
          ) : (
            <RentOut Close={handleClose} setData={handleRentOutData} asset={asset} showModeToggle={showModeToggle} />
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default RentalPopUp;
