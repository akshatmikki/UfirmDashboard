import React, { useMemo, useState } from "react";
import FMResponseModal from "./FMResponseModal";
import "./Notification.css";
import { emitTaskNotificationRefresh } from "../../Services/notificationService";

const NotificationList = ({ type, nList = [], apiCall }) => {
  const [selectedNotification, setSelectedNotification] = useState(null);

  const title = useMemo(() => {
    if (type === "asset") return "Asset Service";
    if (type === "complaint") return "Complaints";
    return "Task Remarks";
  }, [type]);

  const formatRelativeTime = (value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    const diffMs = Date.now() - dt.getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

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

  const assetHeaderTitle = useMemo(() => {
    if (type !== "asset") return "";
    return "Asset Alerts";
  }, [type]);

  const formatAssetDueText = (asset) => {
    const remaining = Number(asset?.DaysRemaining);
    if (!Number.isFinite(remaining)) return "";
    if (remaining === 0) return "Due today";
    if (remaining > 0) return `Due in ${remaining} day${remaining > 1 ? "s" : ""}`;
    const days = Math.abs(remaining);
    return `${days} day${days > 1 ? "s" : ""} overdue`;
  };

  const getAssetTone = (asset) => {
    const status = (asset?.ServiceStatus || "").toString().toLowerCase();
    if (status.includes("overdue")) return "overdue";
    return "due";
  };

  const getComplaintTone = (notification) => {
    const status = (notification?.Status || notification?.TicketStatus || "").toString().toLowerCase();
    if (status.includes("resolve")) return "resolved";
    if (status.includes("progress")) return "progress";
    if (status.includes("open")) return "open";
    return "open";
  };

  const getComplaintStatusText = (notification) =>
    (notification?.Status || notification?.TicketStatus || "Open").toString();

  const renderComplaintNotification = (notification) => {
    const tone = getComplaintTone(notification);
    const titleText =
      (notification.Title || notification.TaskName || notification.LocationName || "Complaint").toString();
    const code = notification.TicketNumber || notification.TicketId || notification.NotificationId || "";
    const location = notification.LocationName || notification.Title || notification.PropertyName || "—";
    const assignedTo = notification.SupName || notification.AssignedTo || "All";
    const timeText = formatRelativeTime(
      notification.TransactionDate || notification.TicketDate || notification.TaskDate || notification.CreatedOn,
    );
    const statusText = getComplaintStatusText(notification);

    return (
      <div className="complaint-card">
        <div className="complaint-row">
          <div className="complaint-left" aria-hidden="true">
            <span className={`complaint-dot complaint-dot-${tone}`}></span>
          </div>
          <div className="complaint-body">
            <div className="complaint-title-row">
              <div className="complaint-title">{titleText}</div>
              <div className="complaint-code">{code ? `(${code})` : ""}</div>
            </div>
            <div className="complaint-meta">
              <div className="complaint-meta-item">
                <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>{location}</span>
              </div>
              <div className="complaint-meta-item">
                <i className="far fa-user" aria-hidden="true"></i>
                <span>{assignedTo}</span>
              </div>
              <div className="complaint-meta-item">
                <i className="far fa-clock" aria-hidden="true"></i>
                <span>{timeText}</span>
              </div>
              <div className={`complaint-status complaint-status-${tone}`}>{statusText}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskNotification = (notification) => (
    <div className="notification-task-row">
      <div className="notification-task-left">
        <span className="notification-task-avatar" aria-hidden="true">
          <i className="far fa-comment-dots"></i>
        </span>
      </div>
      <div className="notification-task-body">
        <div className="notification-task-title-row">
          <div className="notification-task-title">{notification.TaskName || "Task"}</div>
          <div className="notification-task-id">
            {notification.TaskNumber || notification.TaskId
              ? `(${notification.TaskNumber || notification.TaskId})`
              : ""}
          </div>
        </div>
        {notification.TaskDesc && (
          <div className="notification-task-subtitle">{notification.TaskDesc}</div>
        )}
        {(notification.SupRemark || notification.Remark) && (
          <div className="notification-task-remark">
            {(notification.SupRemark || notification.Remark || "").toString()}
          </div>
        )}
        <div className="notification-task-meta">
          <div className="notification-task-meta-item">
            <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
            <span>{notification.LocationName || notification.Title || notification.PropertyName || "—"}</span>
          </div>
          <div className="notification-task-meta-item">
            <i className="far fa-user" aria-hidden="true"></i>
            <span>{notification.SupName || notification.AssignedTo || "—"}</span>
          </div>
          <div className="notification-task-meta-item">
            <i className="far fa-clock" aria-hidden="true"></i>
            <span>{formatRelativeTime(notification.SUPdateTime || notification.TaskDate || notification.NotificationDate)}</span>
          </div>
          {(() => {
            const rawPriority = (notification.PriorityName || notification.Priority || notification.TaskPriority || "").toString().trim();
            if (!rawPriority) return null;
            const lower = rawPriority.toLowerCase();
            const level = lower.includes("high")
              ? "high"
              : lower.includes("medium")
                ? "medium"
                : lower.includes("low")
                  ? "low"
                  : "default";
            return (
              <div className={`notification-task-priority notification-task-priority-${level}`}>
                {rawPriority}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  if (!Array.isArray(nList) || nList.length === 0) {
    return <div className="no-data-text">No notifications available.</div>;
  }

  return (
    <div className={`notification-list-container notification-list-${type || "task"}`}>
      {(type === "task" || type === undefined) && (
        <div className="notification-header">
          <div className="notification-header-left">
            <span className="notification-header-icon" aria-hidden="true">
              <i className="far fa-check-square"></i>
            </span>
            <span className="notification-header-title">{title}</span>
            <span className="notification-header-count" aria-label={`${nList.length} notifications`}>
              {nList.length}
            </span>
          </div>
          <a href="#" className="notification-header-action" onClick={(e) => e.preventDefault()}>
            Mark all read
          </a>
        </div>
      )}
      {/* ✅ ASSET NOTIFICATIONS */}
      {type === "asset" && (
        <div className="notification-header notification-header-asset">
          <div className="notification-header-left">
            <span className="notification-header-icon notification-header-icon-asset" aria-hidden="true">
              <i className="fas fa-tools"></i>
            </span>
            <span className="notification-header-title">{assetHeaderTitle}</span>
            <span className="notification-header-count" aria-label={`${nList.length} notifications`}>
              {nList.length}
            </span>
          </div>
          <a href="#" className="notification-header-action" onClick={(e) => e.preventDefault()}>
            View all
          </a>
        </div>
      )}

      {type === "complaint" && (
        <div className="notification-header notification-header-complaint">
          <div className="notification-header-left">
            <span className="notification-header-icon notification-header-icon-complaint" aria-hidden="true">
              <i className="far fa-bell"></i>
            </span>
            <span className="notification-header-title">{title}</span>
            <span className="notification-header-count" aria-label={`${nList.length} notifications`}>
              {nList.length}
            </span>
          </div>
          <a href="#" className="notification-header-action" onClick={(e) => e.preventDefault()}>
            View all
          </a>
        </div>
      )}
      {isAssetNotification &&
        nList.map((asset) => {
          const tone = getAssetTone(asset);
          const dueText = formatAssetDueText(asset);
          const assetCode = asset.AssetCode || asset.AssetTag || asset.AssetNo || asset.AssetId;
          const location = asset.LocationName || asset.PropertyName || asset.BuildingName || "—";
          return (
            <div
              key={asset.AssetId}
              className={`asset-alert-card asset-alert-${tone}`}
              onClick={() => handleNotificationClick(asset)}
            >
              <div className="asset-alert-row">
                <div className="asset-alert-left" aria-hidden="true">
                  <span className={`asset-alert-icon asset-alert-icon-${tone}`}>
                    <i className={tone === "overdue" ? "fas fa-exclamation-circle" : "fas fa-info-circle"}></i>
                  </span>
                </div>
                <div className="asset-alert-body">
                  <div className="asset-alert-title-row">
                    <div className="asset-alert-title">{asset.AssetName || "Asset"}</div>
                    <div className="asset-alert-code">{assetCode ? `(${assetCode})` : ""}</div>
                  </div>
                  <div className={`asset-alert-status asset-alert-status-${tone}`}>
                    {tone === "overdue" ? "Maintenance overdue" : "Maintenance due"}
                  </div>
                  <div className="asset-alert-meta">
                    <span className="asset-alert-meta-item">{location}</span>
                    {dueText && (
                      <>
                        <span className="asset-alert-meta-sep" aria-hidden="true">
                          •
                        </span>
                        <span className={`asset-alert-meta-item asset-alert-due asset-alert-due-${tone}`}>
                          {dueText}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

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
            {notification.TaskId ? (
              <div className="notification-task-card">{renderTaskNotification(notification)}</div>
            ) : type === "complaint" ? (
              renderComplaintNotification(notification)
            ) : (
              <div className="notification-item-content">
                <span>
                  <b>{notification.TicketNumber}</b> ({notification.Status}) –{" "}
                  {notification.SupName || "All"}:{" "}
                  {notification.SupRemark || "No remarks"}
                </span>
              </div>
            )}
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
