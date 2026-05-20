import React from "react";
import moment from "moment";

const toNumber = (value) => Number(value || 0);

export default function TaskDashboardCountDateWise({ dateWise = [] }) {
  const rows = Array.isArray(dateWise) ? dateWise : [];
  if (rows.length === 0) return null;

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += toNumber(r?.Total);
      acc.completed += toNumber(r?.Completed);
      acc.pending += toNumber(r?.Pending);
      acc.actionable += toNumber(r?.Actionable);
      acc.onHold += toNumber(r?.OnHold);
      return acc;
    },
    { total: 0, completed: 0, pending: 0, actionable: 0, onHold: 0 }
  );

  return (
    <div className="mt-2">
      <div className="card border-0 shadow-sm">
        <div className="card-header py-2 px-3 bg-white d-flex align-items-center">
          <h6 className="mb-0">Date-wise Task Count</h6>
        </div>
        <div className="card-body p-0" style={{ maxHeight: 220, overflow: "auto" }}>
          <table className="table table-sm mb-0">
            <thead className="thead-light">
              <tr>
                <th style={{ width: 120 }}>Date</th>
                <th className="text-right">Total</th>
                <th className="text-right">Completed</th>
                <th className="text-right">Pending</th>
                <th className="text-right">Actionable</th>
                <th className="text-right">On Hold</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const date = r?.Date ? moment(String(r.Date)).format("DD-MM-YYYY") : "-";
                return (
                  <tr key={String(r?.Date || Math.random())}>
                    <td>{date}</td>
                    <td className="text-right">{toNumber(r?.Total)}</td>
                    <td className="text-right">{toNumber(r?.Completed)}</td>
                    <td className="text-right">{toNumber(r?.Pending)}</td>
                    <td className="text-right">{toNumber(r?.Actionable)}</td>
                    <td className="text-right">{toNumber(r?.OnHold)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-weight-bold">
                <td>Total</td>
                <td className="text-right">{totals.total}</td>
                <td className="text-right">{totals.completed}</td>
                <td className="text-right">{totals.pending}</td>
                <td className="text-right">{totals.actionable}</td>
                <td className="text-right">{totals.onHold}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
