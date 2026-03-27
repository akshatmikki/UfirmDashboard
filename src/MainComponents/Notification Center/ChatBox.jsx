import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { Button, Form } from "react-bootstrap";

const styles = {
  chatScroll: {
    maxHeight: "250px",
    overflowY: "auto",
    padding: "10px",
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

const ChatBox = ({ remarks = [], onSend, status, context, assetData }) => {
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

  const chatEndRef = useRef(null);

  

  const handleSend = async () => {
    if (context === "asset") {
      // ✅ Validation
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

      // ✅ Attach files if selected
      if (serviceDoc) formData.append("ServiceDoc", serviceDoc);
      if (image) formData.append("Image", image);

      try {
        const response = await fetch(
          "https://api.urest.in:8096/api/Asset/SaveServiceRecord",
          {
            method: "POST",
            body: formData, // FormData automatically sets multipart/form-data
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

        // Reset fields
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [remarks]);

  const stripHtml = (html) => html.replace(/<[^>]*>/g, "");

  const parseRemark = (html) => {
    if (!html) return { label: "", message: "", date: "" };

    // 1. Strip HTML
    const clean = stripHtml(html).trim();

    // 2. Extract date (YYYY-MM-DD HH:mm:ss)
    const dateMatch = clean.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    const rawDate = dateMatch ? dateMatch[0] : "";

    // 3. Remove date from text completely
    const textOnly = rawDate ? clean.replace(rawDate, "").trim() : clean;

    // 4. Split label and message
    const [label, ...msgParts] = textOnly.split(":");
    const message = msgParts.join(":").trim();

    // 5. Format date nicely
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
    <div className="container mt-3">
      {context !== "asset" && (
        <div className="alert alert-info mb-3 d-flex justify-content-between align-items-center">
          <span>
            Status: <strong>{currentStatus}</strong>
          </span>

          {context === "task"
            ? currentStatus === "Actionable" && (
                <Button variant="success" onClick={handleMarkComplete}>
                  Mark as Complete
                </Button>
              )
            : statusOptions.length > 1 && (
                <Button variant="secondary" onClick={toggleStatus}>
                  Change Status
                </Button>
              )}
        </div>
      )}

      <div
        className="alert alert-secondary mb-3"
        style={
          context === "asset"
            ? {}
            : {
                maxHeight: "300px",
                display: "flex",
                flexDirection: "column",
              }
        }
      >
        {context !== "asset" && (
          <div
            style={{
              ...styles.chatScroll,
              flex: 1,
            }}
          >
            {remarks.length === 0 ? (
              <p style={{ color: "#6c757d" }}>No remarks available</p>
            ) : (
              remarks.map((item, index) => {
                const isFM = item.RemarkHtml?.includes("FM:");

                return (
                  <div
                    key={index}
                    style={{
                      ...styles.chatRow,
                      ...(isFM ? styles.chatRight : styles.chatLeft),
                    }}
                  >
                    <div
                      style={{
                        ...styles.bubble,
                        ...(isFM ? styles.fmBubble : styles.supBubble),
                      }}
                    >
                      {(() => {
                        const { label, message, date } = parseRemark(
                          item.RemarkHtml,
                        );

                        // 👇 ONLY complaint uses RemarkDate
                        const finalDate =
                          context === "ticket"
                            ? formatDateTime(item.RemarkDate)
                            : date;

                        return (
                          <>
                            <div style={{ fontWeight: 600, color: "#000" }}>
                              {label}:{" "}
                              <span style={{ fontWeight: 400, color: "#000", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {message}
                              </span>
                            </div>

                            {finalDate && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 400,
                                  color: "#000",
                                  marginTop: "4px",
                                }}
                              >
                                {finalDate}
                              </div>
                            )}

                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
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
              <Form.Control
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Next Service Date</Form.Label>
              <Form.Control
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Service Cost (₹)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter cost..."
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
              />
            </Form.Group>

            {/* File upload section */}
            <Form.Group className="mb-2">
              <Form.Label>Upload Service Document</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(e) => setServiceDoc(e.target.files[0])}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Upload Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Serviced By</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter technician name..."
                value={servicedBy}
                onChange={(e) => setServicedBy(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Approved By</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter approver name..."
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
              />
            </Form.Group>

            <Button variant="primary" onClick={handleSend}>
              Save Service Record
            </Button>
          </div>
        ) : (
          <div className="d-flex mt-2 align-items-end">
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Type your message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="me-2"
              style={{ resize: "vertical" }}
            />
            <Button variant="primary" onClick={handleSend}>
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
