import React from "react";
import { CSVLink } from "react-csv";
import { Button } from "primereact/button";

const ExportToCSV = ({ data = [], fileName = "Tasklist.csv" }) => {
  return (
    <CSVLink
      data={data}
      filename={fileName}
      style={{ textDecoration: "none" }}
    >
      <Button
        label="Export"
        icon="pi pi-external-link"
        tooltip="Download CSV"
        type="button"
        className="asset-export-btn"
        style={{
          width: "106px",
          height: "40px",
          padding: "8px 20px 8px 12px",
          gap: "4px",
          borderRadius: "4px",
          border: "1px solid rgba(19, 23, 32, 0.15)",
          background: "#ffffff",
          color: "#1E3143",
          boxShadow: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontStyle: "normal",
          fontSize: "14px",
          lineHeight: "20px",
          letterSpacing: "-0.15px",
          textAlign: "center",
        }}
      />
    </CSVLink>
  );
};

export default ExportToCSV;
