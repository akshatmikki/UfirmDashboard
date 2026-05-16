import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";

const styles = {
  chatScroll: {
    maxHeight: "250px",
    overflowY: "auto",
    padding: "10px",
    overscrollBehavior: "contain",
  },
  chatRow: {
    display: "flex",
    marginBottom: "8px",
  },
  chatLeft: {
    justifyContent: "flex-start",
  },
  chatRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "70%",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
  supBubble: {
    backgroundColor: "#e4e6eb",
    borderTopLeftRadius: "0",
  },
  fmBubble: {
    backgroundColor: "#dcf8c6",
    borderTopRightRadius: "0",
  },
};

const ChatBox = ({
  remarks = [],
  onSend,
  status,
  context,
  assetData,
  fillHeight = false,
  containerMaxHeight,
  chatScrollMaxHeight,
}) => {
  let statusOptions = [];
  if (context === "task") statusOptions = ["Actionable", "Completed"];
  else if (context === "ticket")
    statusOptions = ["IN PROGRESS", "RESOLVED", "CLOSED", "REOPEN"];

  const [inputValue, setInputValue] = useState("");
  const [currentStatus, setCurrentStatus] = useState(
    status || statusOptions[0],
  );
  const [serviceDate, setServiceDate] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [serviceDoc, setServiceDoc] = useState(null);
  const [image, setImage] = useState(null);
  const [servicedBy, setServicedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const chatScrollRef = useRef(null);

  const handleSend = async () => {
    if (context === "asset") {
      if (!assetData.AssetId || !serviceDate || !nextServiceDate) {
        alert("Please fill Service Date, Next Service Date, and Asset ID.");
        return;
      }

      const formData = new FormData();
      formData.append("AssetId", assetData.AssetId);
      formData.append("ServiceDate", serviceDate);
      formData.append("NextServiceDate", nextServiceDate);
      formData.append("Remark", inputValue || "No remarks");
      formData.append("ServiceCost", serviceCost || "");
      formData.append("ServicedBy", servicedBy || "");
      formData.append("ApprovedBy", approvedBy || "");

      if (serviceDoc) formData.append("ServiceDoc", serviceDoc);
      if (image) formData.append("Image", image);

      try {
        const response = await fetch(
          "https://api.urest.in:8096/api/Asset/SaveServiceRecord",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error("Failed to save service record:", errText);
          alert("Failed to save service record.");
          return;
        }

        alert("Service Record saved successfully!");
        setTimeout(() => {
          if (typeof assetData.apiCall === "function") assetData.apiCall();
          if (typeof assetData.onClose === "function") assetData.onClose();
        }, 500);

        setInputValue("");
        setServiceDate("");
        setNextServiceDate("");
        setServiceCost("");
        setServiceDoc(null);
        setImage(null);
        setServicedBy("");
        setApprovedBy("");
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong while saving.");
      }
    } else {
      const statusToSend = currentStatus || status;
      onSend(inputValue, statusToSend);
      setInputValue("");
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return "";
    const date = new Date(dt);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleMarkComplete = () => {
    setCurrentStatus("Completed");
    onSend(inputValue || "Marked as completed", "Completed");
    setInputValue("");
  };

  const toggleStatus = () => {
    if (statusOptions.length <= 1) return;
    const currentIndex = statusOptions.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    setCurrentStatus(statusOptions[nextIndex]);
  };

  useEffect(() => {
    if (status) {
      setCurrentStatus(status);
      return;
    }
    if (context === "task") {
      setCurrentStatus("Actionable");
      return;
    }
    if (context === "ticket") {
      setCurrentStatus("IN PROGRESS");
    }
  }, [context, status]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
      } catch (_) {
        el.scrollTop = el.scrollHeight;
      }
    };
    scrollToBottom();
    const raf = window.requestAnimationFrame(scrollToBottom);
    const t = window.setTimeout(scrollToBottom, 0);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [remarks?.length]);

  const stripHtml = (html) => html.replace(/<[^>]*>/g, "");

  const parseRemark = (html) => {
    if (!html) return { label: "", message: "", date: "" };
    const clean = stripHtml(html).trim();
    const dateMatch = clean.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    const rawDate = dateMatch ? dateMatch[0] : "";
    const textOnly = rawDate ? clean.replace(rawDate, "").trim() : clean;
    const [label, ...msgParts] = textOnly.split(":");
    const message = msgParts.join(":").trim();
    let formattedDate = "";
    if (rawDate) {
      const d = new Date(rawDate.replace(" ", "T"));
      formattedDate = d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return {
      label: label.trim(),
      message,
      date: formattedDate,
    };
  };

  return (
    <div className={`ufirm-chatbox ${fillHeight ? "is-fill" : ""}`}>
      <div
        className={`ufirm-chat-surface ufirm-chat-surface-${context || "task"} ${context === "asset" ? "mb-3" : "mb-0"}`}
        style={
          context === "asset"
            ? {}
            : {
                maxHeight: fillHeight ? "none" : containerMaxHeight || "320px",
                height: fillHeight ? "100%" : undefined,
                display: "flex",
                flexDirection: "column",
              }
        }
      >
        {context !== "asset" && (
          <div
            className="ufirm-chat-scroll"
            style={{
              maxHeight: fillHeight ? "none" : chatScrollMaxHeight || "240px",
              flex: 1,
              minHeight: 0,
            }}
            ref={chatScrollRef}
          >
            {remarks.length === 0 ? (
              <p className="ufirm-chat-empty">No remarks available</p>
            ) : (
              remarks.map((item, index) => {
                const isFM = item.RemarkHtml?.includes("FM:");
                return (
                  <div
                    key={index}
                    className={`ufirm-chat-row ${isFM ? "is-right" : "is-left"}`}
                  >
                    <div
                      className={`ufirm-chat-bubble ${isFM ? "is-fm" : "is-sup"}`}
                    >
                      {(() => {
                        const { label, message, date } = parseRemark(item.RemarkHtml);
                        const finalDate = context === "ticket" ? formatDateTime(item.RemarkDate) : date;
                        return (
                          <>
                            <div className="ufirm-chat-line">
                              <span className="ufirm-chat-label">{label}:</span>{" "}
                              <span className="ufirm-chat-message">{message}</span>
                            </div>
                            {finalDate && (
                              <div className="ufirm-chat-date">{finalDate}</div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {context === "asset" ? (
          <div className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>FM Remark</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter FM remark..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Service Date</Form.Label>
              <Form.Control type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Next Service Date</Form.Label>
              <Form.Control type="date" value={nextServiceDate} onChange={(e) => setNextServiceDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Service Cost (₹)</Form.Label>
              <Form.Control type="number" placeholder="Enter cost..." value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Upload Service Document</Form.Label>
              <Form.Control type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => setServiceDoc(e.target.files[0])} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Upload Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Serviced By</Form.Label>
              <Form.Control type="text" placeholder="Enter technician name..." value={servicedBy} onChange={(e) => setServicedBy(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Approved By</Form.Label>
              <Form.Control type="text" placeholder="Enter approver name..." value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleSend}>
              Save Service Record
            </Button>
          </div>
        ) : (
          <div className="ufirm-chat-composer">
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="ufirm-chat-input"
              style={{ resize: "vertical" }}
            />
            <Button variant="primary" onClick={handleSend} className="ufirm-chat-send">
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
