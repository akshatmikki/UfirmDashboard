import React from 'react';
import Modal from 'react-bootstrap/Modal';
import ChatBox from './ChatBox'; // Import the renamed component
import { useEffect, useState } from "react";
import { getTaskRemarks, getComplaintRemarks } from "../../Services/notificationService";

const FMResponseModal = ({ notification, onClose, onReply, apiCall }) => {
  const isTaskNotification = notification && notification.TaskId;
  const isAssetNotification = notification && notification.AssetId;
  const isTicketNotification = notification && notification.TicketId;
  const [taskRemarks, setTaskRemarks] = useState([]);
  const [complaintRemarks, setComplaintRemarks] = useState([]);

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
                </div>

                <ChatBox
                  remarks={taskRemarks}
                  status={notification.CurrentStatus}
                  context="task"
                  onSend={onReply}
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
                      onSend={onReply}
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
