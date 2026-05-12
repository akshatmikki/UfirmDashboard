import React, { useState } from "react";
import FMResponseModal from "./FMResponseModal";
import "./Notification.css";
import { emitTaskNotificationRefresh } from "../../Services/notificationService";

const NotificationList = ({ nList = [], apiCall }) => {
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Handle click for non-asset notifications (tasks/complaints)
  const handleNotificationClick = async (notification) => {
    let latestNotification = notification;
    if (typeof apiCall === "function") {
      const latestList = await apiCall();
      if (Array.isArray(latestList) && latestList.length) {
        latestNotification =
          latestList.find((item) =>
            Number(item.NotificationId || item.TaskId || item.TicketId || item.AssetId) ===
            Number(notification.NotificationId || notification.TaskId || notification.TicketId || notification.AssetId),
          ) || notification;
      }
    }
    setSelectedNotification(latestNotification);
  };

  const handleCloseModal = () => {
    setSelectedNotification(null);
  };

  const handleReply = (message, currentStatus, updatedNextServiceDate) => {
    if (message.trim() === "") {
      alert("Message cannot be empty!");
      return;
    }

    let newResponse = {};

    if (selectedNotification.TaskId) {
      // Task reply
      newResponse = {
        TaskId: selectedNotification.TaskId,
        QuestionId: selectedNotification.QuestionId,
        TaskName: selectedNotification.TaskName,
        FmId: 0,
        FmRemark: message,
        FmDateTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        CurrentStatus: currentStatus,
        SUPdateTime: selectedNotification.SUPdateTime,
        TaskDate: selectedNotification.TaskDate,
      };
    } else if (selectedNotification.TicketId) {
      // Complaint reply
      newResponse = {
        TicketId: selectedNotification.TicketId,
        LocationName: selectedNotification.Title || "Unknown",
        CurrentStatus: currentStatus,
        FMdateTime: new Date().toISOString(),
        FMRemark: message,
        TicketDate: selectedNotification.TaskDate || new Date().toISOString(),
        TransactionDate: selectedNotification.TaskDate,
      };
    } else if (selectedNotification.AssetId) {
      // ✅ Asset reply
      newResponse = {
        AssetId: selectedNotification.AssetId,
        FMRemark: message,
        UpdatedNextServiceDate: updatedNextServiceDate || selectedNotification.NextServiceDate,
      };
    }

    handleSendReply(newResponse);
    handleCloseModal();
  };

  const handleSendReply = async (newResponse) => {
    let apiUrl = "";

    if (newResponse.TaskId) apiUrl = "https://api.urest.in:8096/FMResponse";
    else if (newResponse.TicketId) apiUrl = "https://api.urest.in:8096/FMComplaintResponse";
    else if (newResponse.AssetId) apiUrl = "https://api.urest.in:8096/api/Asset/SaveFMServiceResponse"; // ✅ new

    if (!apiUrl) return;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResponse),
      });

      if (res.ok) {
        if (typeof apiCall === "function") await apiCall();
      } else throw new Error("Failed to send reply");
      emitTaskNotificationRefresh();
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  // 🧩 Detect whether list is for assets (based on structure)
  const isAssetNotification =
    Array.isArray(nList) &&
    nList.length > 0 &&
    nList[0].AssetId !== undefined;

  if (!Array.isArray(nList) || nList.length === 0) {
    return <div className="no-data-text">No notifications available.</div>;
  }

  return (
    <div className="notification-list-container">
      {/* ✅ ASSET NOTIFICATIONS */}
      {isAssetNotification &&
  nList.map((asset) => (
    <div
      key={asset.AssetId}
      className={`notification-item-cards ${
        asset.ServiceStatus === "Overdue" ? "overdue-card" : "upcoming-card"
      }`}
      onClick={() => handleNotificationClick(asset)}  // ✅ Added this line
    >
      <div className="notification-item-contents">
        <b>{asset.AssetName}</b>
        <span
          style={{
            color: asset.ServiceStatus === "Overdue" ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {asset.ServiceStatus}
        </span>
        <span>Last Service: {asset.LastServiceDate || "N/A"}</span>
        <span>Next Service: {asset.NextServiceDate || "N/A"}</span>
        <span>
          Days Remaining:{" "}
          <b
            style={{
              color: asset.DaysRemaining < 0 ? "red" : "green",
            }}
          >
            {asset.DaysRemaining}
          </b>
        </span>
      </div>
    </div>
  ))}

      {/* ✅ TASK / COMPLAINT NOTIFICATIONS */}
      {!isAssetNotification &&
        nList.map((notification) => (
          <div
            key={
              notification.TicketId ||
              notification.TaskId ||
              notification.NotificationId
            }
            className="notification-item-card"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-item-content">
              {notification.TaskId ? (
                <span>
                  Actionable: {notification.TaskName} – {notification.SupName}:{" "}
                  {notification.SupRemark}
                </span>
              ) : (
                <span>
                  <b>{notification.TicketNumber}</b> ({notification.Status}) –{" "}
                  {notification.SupName || "All"}:{" "}
                  {notification.SupRemark || "No remarks"}
                </span>
              )}
            </div>
          </div>
        ))}

      {selectedNotification && (
  <FMResponseModal
    notification={selectedNotification}
    onClose={handleCloseModal}
    onReply={handleReply}
     apiCall={apiCall}
  />
)}
    </div>
  );
};

export default NotificationList;
