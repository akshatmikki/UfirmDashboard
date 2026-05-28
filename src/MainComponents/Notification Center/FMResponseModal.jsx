import React from 'react';
import Modal from 'react-bootstrap/Modal';
import ChatBox from './ChatBox'; // Import the renamed component
import { useEffect, useState } from "react";
import { getTaskRemarks, getComplaintRemarks, markTaskComplete, emitTaskNotificationRefresh } from "../../Services/notificationService";

const FMResponseModal = ({ notification, onClose, onReply, apiCall }) => {
  const isTaskNotification = notification && notification.TaskId;
  const isAssetNotification = notification && notification.AssetId;
  const isTicketNotification = notification && notification.TicketId;
  const [taskRemarks, setTaskRemarks] = useState([]);
  const [complaintRemarks, setComplaintRemarks] = useState([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const modalKind = isTaskNotification
    ? "task"
    : isAssetNotification
      ? "asset"
      : isTicketNotification
        ? "complaint"
        : "default";

  const modalTitle = isTaskNotification
    ? "Task Notification"
    : isAssetNotification
      ? "Asset Notification"
      : isTicketNotification
        ? "Complaints"
        : "Notification";

  useEffect(() => {
    if (!isTaskNotification) return;

    getTaskRemarks(
      notification.TaskId,
      notification.QuestionId,
      notification.TaskDate
    )
      .then(data => setTaskRemarks(data || []))
      .catch(() => setTaskRemarks([]));
  }, [notification?.TaskId, notification?.QuestionId, notification?.TaskDate]);

  useEffect(() => {
    if (!isTicketNotification) return;

    getComplaintRemarks(notification.TicketId)
      .then(data => setComplaintRemarks(data || []))
      .catch(() => setComplaintRemarks([]));
  }, [notification?.TicketId]);

  const refreshRemarks = async () => {
    try {
      if (isTaskNotification) {
        const data = await getTaskRemarks(
          notification.TaskId,
          notification.QuestionId,
          notification.TaskDate,
        );
        setTaskRemarks(Array.isArray(data) ? data : []);
      } else if (isTicketNotification) {
        const data = await getComplaintRemarks(notification.TicketId);
        setComplaintRemarks(Array.isArray(data) ? data : []);
      }
    } catch {
      if (isTaskNotification) setTaskRemarks([]);
      if (isTicketNotification) setComplaintRemarks([]);
    }
  };

  const handleSendAndRefresh = async (message, currentStatus, updatedNextServiceDate) => {
    await Promise.resolve(onReply?.(message, currentStatus, updatedNextServiceDate));
    await refreshRemarks();
    if (typeof apiCall === "function") await apiCall();
  };

  const handleMarkCompleteClick = async () => {
    const taskId = Number(notification?.TaskId);
    const propertyId = Number(notification?.PropertyId);
    const taskDate = notification?.TaskDate;
    const questionId = Number(notification?.QuestionId);

    if (!taskId || !propertyId || !taskDate) {
      alert("Missing TaskId / PropertyId / TaskDate for this task.");
      return;
    }

    const ok = window.confirm("Mark this task as Completed?");
    if (!ok) return;

    setIsCompleting(true);
    try {
      await markTaskComplete({
        taskId,
        questionId,
        taskDate,
        propertyId,
        taskStatus: "Completed"
      });
      alert("Task marked as completed successfully!");
      if (typeof apiCall === "function") {
        await apiCall();
      }
      emitTaskNotificationRefresh();
      onClose();
    } catch (error) {
      console.error("Error marking task complete:", error);
      alert("Failed to mark task as completed.");
    } finally {
      setIsCompleting(false);
    }
  };


  return (
    <Modal
      show={!!notification}
      onHide={onClose}
      centered
      dialogClassName="ufirm-notification-dialog"
      contentClassName={`ufirm-notification-modal ufirm-notification-modal-${modalKind}`}
    >
      <Modal.Header closeButton className={`ufirm-modal-header ufirm-modal-header-${modalKind}`}>
        <Modal.Title className="ufirm-modal-title">
          <span className={`ufirm-modal-title-icon ufirm-modal-title-icon-${modalKind}`} aria-hidden="true">
            <i
              className={
                modalKind === "asset"
                  ? "fas fa-tools"
                  : modalKind === "complaint"
                    ? "far fa-bell"
                    : "far fa-check-square"
              }
            ></i>
          </span>
          <span className="ufirm-modal-title-text">{modalTitle}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {notification && (
          <div className="ufirm-modal-body">
            {/* ---------------- TASK NOTIFICATION ---------------- */}
            {isTaskNotification ? (
              <>
                <div className="ufirm-modal-kv">
                  <div className="ufirm-kv-item">
                    <span className="ufirm-kv-label">Task ID</span>
                    <span className="ufirm-kv-value">{notification.TaskId}</span>
                  </div>
                  <div className="ufirm-kv-item ufirm-kv-item-full">
                    <span className="ufirm-kv-label">Task Name</span>
                    <span className="ufirm-kv-value">{notification.TaskName}</span>
                  </div>
                  <div className="ufirm-kv-item">
                    <span className="ufirm-kv-label">Question ID</span>
                    <span className="ufirm-kv-value">{notification.QuestionId}</span>
                  </div>
                  <div className="ufirm-kv-item ufirm-kv-item-full">
                    <span className="ufirm-kv-label">Question</span>
                    <span className="ufirm-kv-value">{notification.QuestionName}</span>
                  </div>
                  <div className="ufirm-kv-item ufirm-kv-item-full">
                    <span className="ufirm-kv-label">Property</span>
                    <span className="ufirm-kv-value">{notification.PropertyName}</span>
                  </div>
                  {(() => {
                    const rawStatus = (notification?.CurrentStatus || "").toString().toLowerCase();
                    const isAlreadyCompleted = rawStatus.includes("complete") || rawStatus.includes("resolve");
                    return (
                      <div className="ufirm-kv-item ufirm-kv-item-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="ufirm-kv-label">Task Status</span>
                          <span className="ufirm-kv-value">{notification.CurrentStatus || "Pending"}</span>
                        </div>
                        <button
                          type="button"
                          className="notification-task-complete-btn"
                          onClick={handleMarkCompleteClick}
                          disabled={isCompleting || isAlreadyCompleted}
                          title={isAlreadyCompleted ? "Already Completed" : "Mark as Completed"}
                        >
                          {isCompleting ? "Saving..." : isAlreadyCompleted ? "Completed" : "Mark Complete"}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <ChatBox
                  remarks={taskRemarks}
                  status={notification.CurrentStatus}
                  context="task"
                  onSend={handleSendAndRefresh}
                />

              </>
            ) :
              /* ---------------- ASSET NOTIFICATION ---------------- */
              isAssetNotification ? (
                <>
                  <div className="ufirm-modal-kv">
                    <div className="ufirm-kv-item">
                      <span className="ufirm-kv-label">Asset ID</span>
                      <span className="ufirm-kv-value">{notification.AssetId}</span>
                    </div>
                    <div className="ufirm-kv-item ufirm-kv-item-full">
                      <span className="ufirm-kv-label">Asset Name</span>
                      <span className="ufirm-kv-value">{notification.AssetName}</span>
                    </div>
                    <div className="ufirm-kv-item">
                      <span className="ufirm-kv-label">Last Service</span>
                      <span className="ufirm-kv-value">
                        {notification.LastServiceDate
                          ? new Date(notification.LastServiceDate).toLocaleDateString()
                          : "Not available"}
                      </span>
                    </div>
                    <div className="ufirm-kv-item">
                      <span className="ufirm-kv-label">Next Service</span>
                      <span className="ufirm-kv-value">
                        {notification.NextServiceDate
                          ? new Date(notification.NextServiceDate).toLocaleDateString()
                          : "Not available"}
                      </span>
                    </div>
                    <div className="ufirm-kv-item">
                      <span className="ufirm-kv-label">Days Remaining</span>
                      <span className="ufirm-kv-value">{notification.DaysRemaining}</span>
                    </div>
                    <div className="ufirm-kv-item">
                      <span className="ufirm-kv-label">Status</span>
                      <span className="ufirm-kv-value">{notification.ServiceStatus}</span>
                    </div>
                    {(notification.LastServicedBy || notification.ServicedBy) && (
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Last Serviced By</span>
                        <span className="ufirm-kv-value">{notification.LastServicedBy || notification.ServicedBy}</span>
                      </div>
                    )}
                    {(notification.LastServiceCost !== undefined && notification.LastServiceCost !== null) && (
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Last Service Cost</span>
                        <span className="ufirm-kv-value">₹{notification.LastServiceCost || 0}</span>
                      </div>
                    )}
                    {notification.LastServiceRemark && (
                      <div className="ufirm-kv-item ufirm-kv-item-full">
                        <span className="ufirm-kv-label">Last Service Remark</span>
                        <span className="ufirm-kv-value ufirm-kv-multiline">{notification.LastServiceRemark}</span>
                      </div>
                    )}
                  </div>

                  <ChatBox
                    remark={notification.LastServiceRemark || 'No remarks yet'}
                    name={notification.LastServicedBy || 'Technician'}
                    remarkDateTime={notification.LastServiceDate || 'Unknown'}
                    status={notification.ServiceStatus}
                    context="asset"
                    onSend={onReply}
                    assetData={{
                      ...notification,
                      onClose,
                      apiCall,
                    }}
                  />
                </>
              ) :
                /* ---------------- COMPLAINT/TICKET NOTIFICATION ---------------- */
                isTicketNotification ? (
                  <>
                    <div className="ufirm-modal-kv">
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Ticket</span>
                        <span className="ufirm-kv-value">{notification.TicketNumber || notification.TicketId}</span>
                      </div>
                      <div className="ufirm-kv-item ufirm-kv-item-full">
                        <span className="ufirm-kv-label">Location</span>
                        <span className="ufirm-kv-value">{notification.Title || "Not specified"}</span>
                      </div>
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Reported To</span>
                        <span className="ufirm-kv-value">{notification.SupName || "All"}</span>
                      </div>
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Created</span>
                        <span className="ufirm-kv-value">
                          {notification.CreatedOn ? new Date(notification.CreatedOn).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="ufirm-kv-item">
                        <span className="ufirm-kv-label">Status</span>
                        <span className="ufirm-kv-value">{notification.Status}</span>
                      </div>
                      {notification.Description && (
                        <div className="ufirm-kv-item ufirm-kv-item-full">
                          <span className="ufirm-kv-label">Description</span>
                          <span className="ufirm-kv-value">{notification.Description}</span>
                        </div>
                      )}
                    </div>
                    {notification.CustomerMobileNo && (
                      <div className="ufirm-modal-subrow">
                        <span className="ufirm-kv-label">Customer Mobile</span>
                        <span className="ufirm-kv-value">{notification.CustomerMobileNo}</span>
                      </div>
                    )}


                    {notification.AttachmentUrl && (
                      <div className="ufirm-modal-subrow">
                        <span className="ufirm-kv-label">Attachment</span>
                        <a className="ufirm-modal-link" href={notification.AttachmentUrl} target="_blank" rel="noopener noreferrer">
                          {notification.AttachmentName || "View Attachment"}
                        </a>
                      </div>
                    )}

                    <ChatBox
                      remarks={complaintRemarks}
                      status={notification.Status}
                      context="ticket"
                      onSend={handleSendAndRefresh}
                    />
                  </>
                ) : (
                  <p>Unknown notification type</p>
                )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default FMResponseModal;
