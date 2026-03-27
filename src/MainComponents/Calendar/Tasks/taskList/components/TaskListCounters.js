import React from "react";

export default function TaskListCounters({ completedTasks, pendingTasks, actionableTasks }) {
  return (
    <div style={{ display: "flex", gap: "14px", margin: "8px 0 10px 0", flexWrap: "wrap" }}>
      <div
        style={{
          flex: 1,
          minWidth: "220px",
          background: "linear-gradient(135deg,#356f98,#4a86ad)",
          color: "white",
          borderRadius: "12px",
          padding: "16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: "1.75rem",
        }}
      >
        <span style={{ fontSize: "1.12rem", fontWeight: 700, marginLeft: 22 }}>Completed Tasks :</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 700, marginRight: 22 }}>{completedTasks}</span>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "220px",
          background: "linear-gradient(135deg,#f35f53,#ff7165)",
          color: "white",
          borderRadius: "12px",
          padding: "16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: "1.75rem",
        }}
      >
        <span style={{ fontSize: "1.12rem", fontWeight: 700, marginLeft: 22 }}>Pending Tasks :</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 700, marginRight: 22 }}>{pendingTasks}</span>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "220px",
          background: "linear-gradient(135deg,#16a7bd,#27bdd3)",
          color: "white",
          borderRadius: "12px",
          padding: "16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: "1.75rem",
        }}
      >
        <span style={{ fontSize: "1.12rem", fontWeight: 700, marginLeft: 22 }}>Actionable Tasks :</span>
        <span style={{ fontSize: "1.3rem", fontWeight: 700, marginRight: 22 }}>{actionableTasks}</span>
      </div>
    </div>
  );
}
