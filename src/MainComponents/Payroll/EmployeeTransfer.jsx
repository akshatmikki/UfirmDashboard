import React, { useState } from "react";
import EmployeeSearch from "./EmployeeSearch";
import EmployeeTransferTab from "./EmployeeTransferTab";
import "./EmployeeTransfer.css";

const EmployeeTransfer = () => {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="content-wrapper">
      <div className="employee-search-page">

        {/* 🔥 Toggle Buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
          <button
            className={activeTab === "search" ? "active-btn" : ""}
            onClick={() => setActiveTab("search")}
          >
            Search
          </button>

          <button
            className={activeTab === "transfer" ? "active-btn" : ""}
            onClick={() => setActiveTab("transfer")}
          >
            Transfer
          </button>
        </div>

        {/* 🔁 Switch UI */}
        {activeTab === "search" && <EmployeeSearch />}
        {activeTab === "transfer" && <EmployeeTransferTab />}
      </div>
    </div>
  );
};

export default EmployeeTransfer;