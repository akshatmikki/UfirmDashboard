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
    <Modal show={!!notification} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isTaskNotification
            ? 'Task Notification'
            : isAssetNotification
              ? 'Asset Notification'
              : isTicketNotification
                ? 'Complaint Notification'
                : 'Notification'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {notification && (
          <div>
            {/* ---------------- TASK NOTIFICATION ---------------- */}
            {isTaskNotification ? (
              <>
                <p><strong>Task ID:</strong> {notification.TaskId}</p>
                <p><strong>Task Name:</strong> {notification.TaskName}</p>
                <p><strong>Question ID:</strong> {notification.QuestionId}</p>
                <p><strong>Question Name:</strong> {notification.QuestionName}</p>
                <p><strong>Property ID:</strong> {notification.PropertyId}</p>
                <p><strong>Property Name:</strong> {notification.PropertyName}</p>

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
                  <p><strong>Asset ID:</strong> {notification.AssetId}</p>
                  <p><strong>Asset Name:</strong> {notification.AssetName}</p>
                  <p><strong>Last Service Date:</strong>
                    {notification.LastServiceDate
                      ? new Date(notification.LastServiceDate).toLocaleDateString()
                      : 'Not available'}
                  </p>
                  <p><strong>Next Service Date:</strong>
                    {notification.NextServiceDate
                      ? new Date(notification.NextServiceDate).toLocaleDateString()
                      : 'Not available'}
                  </p>
                  <p><strong>Days Remaining:</strong> {notification.DaysRemaining}</p>
                  <p><strong>Service Status:</strong> {notification.ServiceStatus}</p>
                  <p><strong>Last Service Remark:</strong>
                    {notification.LastServiceRemark || 'No remarks available'}
                  </p>
                  <p><strong>Last Serviced By:</strong>
                    {notification.LastServicedBy || 'Unknown'}
                  </p>
                  <p><strong>Last Service Cost:</strong> ₹{notification.LastServiceCost || 0}</p>

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
                    <p><strong>Ticket ID:</strong> {notification.TicketId}</p>
                    <p><strong>Ticket Number:</strong> {notification.TicketNumber}</p>
                    <p><strong>Location:</strong> {notification.Title || 'Not specified'}</p>
                    <p><strong>Reported To:</strong> {notification.SupName || 'All'}</p>
                    <p><strong>Created On:</strong> {new Date(notification.CreatedOn).toLocaleString()}</p>
                    <p><strong>Status:</strong> {notification.Status}</p>
                    <p><strong>Description:</strong> {notification.Description}</p>
                    {notification.CustomerMobileNo && (
                      <p>
                        <strong>Customer Mobile Number:</strong> {notification.CustomerMobileNo}
                      </p>
                    )}


                    {notification.AttachmentUrl && (
                      <p>
                        <strong>Attachment:</strong>{' '}
                        <a href={notification.AttachmentUrl} target="_blank" rel="noopener noreferrer">
                          {notification.AttachmentName || 'View Attachment'}
                        </a>
                      </p>
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
