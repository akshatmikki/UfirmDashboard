"use client";

import React, { useEffect, useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { useSelector } from "react-redux";

import { getStockLedger } from "../../Services/StockLedger.js";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";

export default function StockLedger() {
  const [stockData, setStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toast = useRef(null);

  const propertyId = useSelector(
    (state) =>
      state?.Commonreducer?.puidn ||
      state?.department?.CompanyId ||
      state?.departmentModel?.CompanyId ||
      state?.Commonreducer?.CompanyId ||
      27
  );

  useEffect(() => {
    if (propertyId) {
      fetchStockLedger();
    }
  }, [propertyId]);

  const fetchStockLedger = async () => {
    try {
      const response = await getStockLedger(propertyId);

      if (response) {
        setStockData(response.data || response || []);
      }
    } catch (error) {
      console.error("FETCH_STOCK_LEDGER_ERROR", error);

      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch stock ledger",
      });
    }
  };

  const filteredData = stockData.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      item.ItemName?.toLowerCase().includes(search) ||
      item.BrandName?.toLowerCase().includes(search) ||
      item.StockStatus?.toLowerCase().includes(search)
    );
  });

  const renderStatusBadge = (status) => {
    if (status === "Low Stock") {
      return (
        <span
          className="badge badge-danger"
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
          }}
        >
          Low Stock
        </span>
      );
    }

    return (
      <span
        className="badge badge-success"
        style={{
          padding: "6px 10px",
          borderRadius: "6px",
        }}
      >
        In Stock
      </span>
    );
  };

  return (
    <div
      className="container-fluid py-3"
      style={{
        maxWidth: "95%",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: window.innerWidth > 992 ? "90px" : "0px",
      }}
    >
      <Toast ref={toast} />

      <div className="card shadow-sm mt-3">
        <div className="card-body d-flex flex-wrap align-items-center">
          <h5 className="mb-0">Stock Ledger</h5>

          <div className="ml-auto d-flex align-items-center">
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={{
                height: "38px",
                width: "220px",
                borderRadius: "8px",
              }}
            />

            
          </div>
        </div>

        <div className="card-body p-3">
          <div className="table-responsive">
            <table
              className="table table-bordered table-striped table-hover mb-0 table-sm"
              style={{ fontSize: "14px" }}
            >
              <thead className="thead-light">
                <tr>
                  <th>S.No</th>
                  <th>Item Name</th>
                  <th>Brand Name</th>
                  <th>Measurement Unit</th>
                  <th>Min Stock</th>
                  <th>Stock In</th>
                  <th>Requisition Qty</th>
                  <th>Handed Over Qty</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.ItemName}</td>
                      <td>{item.BrandName}</td>
                      <td>{item.MeasurementUnit}</td>
                      <td>{item.MinStockLevel}</td>
                      <td>{item.StockIn}</td>
                      <td>{item.InRequisitionQty}</td>
                      <td>{item.HandedOverQty}</td>
                      <td>{item.Balance}</td>
                      <td>{renderStatusBadge(item.StockStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}