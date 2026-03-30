import React from "react";

export default function TaskListCounters({ completedTasks, pendingTasks, actionableTasks }) {
  return (
    <div style={{ display: "flex", gap: "10px", margin: "6px 0 8px 0", flexWrap: "wrap" }}>
      <div
        style={{
          flex: 1,
          minWidth: "200px",
          background: "linear-gradient(135deg,#356f98,#4a86ad)",
          color: "white",
          borderRadius: "10px",
          padding: "6px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 500,
          fontSize: "1rem",
        }}
      >
        <span style={{ fontSize: "1rem", fontWeight: 500, marginLeft: 16 }}>Completed Tasks :</span>
        <span style={{ fontSize: "1rem", fontWeight: 500, marginRight: 16 }}>{completedTasks}</span>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "200px",
          background: "linear-gradient(135deg,#f35f53,#ff7165)",
          color: "white",
          borderRadius: "10px",
          padding: "6px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 500,
          fontSize: "1rem",
        }}
      >
        <span style={{ fontSize: "1rem", fontWeight: 500, marginLeft: 16 }}>Pending Tasks :</span>
        <span style={{ fontSize: "1rem", fontWeight: 500, marginRight: 16 }}>{pendingTasks}</span>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: "200px",
          background: "linear-gradient(135deg,#16a7bd,#27bdd3)",
          color: "white",
          borderRadius: "10px",
          padding: "6px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 500,
          fontSize: "1rem",
        }}
      >
        <span style={{ fontSize: "1rem", fontWeight: 500, marginLeft: 16 }}>Actionable Tasks :</span>
        <span style={{ fontSize: "1rem", fontWeight: 500, marginRight: 16 }}>{actionableTasks}</span>
      </div>
    </div>
  );
}
