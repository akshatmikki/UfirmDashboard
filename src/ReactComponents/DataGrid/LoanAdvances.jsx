import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Checkbox } from "primereact/checkbox";
import {
  getEmployeeLoan,
  createEmployeeLoan,
  getLoanDetails,
  approveLoan,
  rejectLoan,
  payLoanEmi,
  payFullLoan,
  updateLoanEmi,
  restructureLoan,
} from "../../Services/PayrollService";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatToMonthYear = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
};

const toMonthInputValue = (monthText) => {
  if (!monthText || monthText === "-") return "";
  const [mon, year] = monthText.split("-");
  const idx = MONTHS.findIndex((m) => m === mon);
  if (idx < 0) return "";
  return `${year}-${String(idx + 1).padStart(2, "0")}`;
};

const toApiMonth = (value) => {
  if (!value) return "";
  const [year, mm] = value.split("-");
  const idx = Number(mm) - 1;
  return `${MONTHS[idx]}-${year}`;
};

const LoanAdvanceDialog = ({ show, onClose, facilityMemberId, employeeName: propEmployeeName }) => {
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState(propEmployeeName || "");
  const [loanAmount, setLoanAmount] = useState(null);
  const [tenureMonths, setTenureMonths] = useState(null);
  const [repaymentStart, setRepaymentStart] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  const [loanMaster, setLoanMaster] = useState(null);
  const [loanEMIs, setLoanEMIs] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const [restructureTenure, setRestructureTenure] = useState(null);
  const [syncRemaining, setSyncRemaining] = useState(true);

  const [editEmi, setEditEmi] = useState(null);
  const [editDialogShow, setEditDialogShow] = useState(false);
  const [editAmount, setEditAmount] = useState(null);
  const [editMonthText, setEditMonthText] = useState("");
  const [editSkip, setEditSkip] = useState(false);

  useEffect(() => {
    if (show && facilityMemberId) {
      fetchLoanData(facilityMemberId);
    }
  }, [show, facilityMemberId]);

  const getCurrentUserId = () => {
    return Number(localStorage.getItem("UserId") || localStorage.getItem("userId") || 1);
  };

  const normalizeLoanPayload = (result) => {
    const sourceLoan = result?.LoanMaster || result?.Loan || result?.loanMaster || result?.loan || null;
    const sourceEmis = Array.isArray(result?.LoanEMIs) ? result.LoanEMIs : Array.isArray(result?.EMIs) ? result.EMIs : [];

    const normalizedLoan = sourceLoan ? {
      LoanID: sourceLoan.LoanID ?? sourceLoan.LoanId ?? null,
      EmployeeID: sourceLoan.EmployeeID ?? sourceLoan.EmpID ?? facilityMemberId ?? null,
      EmployeeName: sourceLoan.EmployeeName ?? sourceLoan.EmpName ?? sourceLoan.Name ?? "",
      LoanAdvanceAmount: sourceLoan.LoanAdvanceAmount ?? sourceLoan.Amount ?? sourceLoan.LoanAmount ?? 0,
      TenureMonths: sourceLoan.TenureMonths ?? sourceLoan.Tenure ?? 0,
      RepaymentMonthYear: sourceLoan.RepaymentMonthYear ?? null,
      IsApproved: sourceLoan.IsApproved ?? sourceLoan.Approved ?? false,
      IsActive: sourceLoan.IsActive ?? true,
    } : null;

    const normalizedEmis = sourceEmis.map((emi, idx) => ({
      ID: emi.ID ?? emi.RowID ?? idx + 1,
      RepaymentDueMonth: emi.RepaymentDueMonth ?? emi.Month ?? "-",
      RepaymentAmount: Number(emi.RepaymentAmount ?? emi.Amount ?? emi.MonthlyInstallment ?? 0),
      PaymentStatus: Boolean(emi.PaymentStatus ?? emi.Paid ?? false),
      DeductionDate: emi.DeductionDate ?? emi.RepaymentDoneDate ?? null,
    }));

    return { normalizedLoan, normalizedEmis };
  };

  async function fetchLoanData(employeeId) {
    setLoading(true);
    try {
      const result = await getEmployeeLoan(employeeId);
      const { normalizedLoan, normalizedEmis } = normalizeLoanPayload(result);
      if (normalizedLoan?.EmployeeName) setEmployeeName(normalizedLoan.EmployeeName);
      setLoanMaster(normalizedLoan);
      setLoanEMIs(normalizedEmis);
      setSelectedLoanId(normalizedLoan?.LoanID || null);
    } catch {
      setLoanMaster(null);
      setLoanEMIs([]);
      setSelectedLoanId(null);
    }
    setLoading(false);
  }

  async function refreshLoanById(loanId) {
    if (!loanId) return;
    setLoading(true);
    try {
      const result = await getLoanDetails(loanId);
      const { normalizedLoan, normalizedEmis } = normalizeLoanPayload(result);
      setLoanMaster(normalizedLoan);
      setLoanEMIs(normalizedEmis);
      setSelectedLoanId(loanId);
    } catch (error) {
      console.error("Failed to refresh loan:", error);
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const totalPayable = loanEMIs.reduce((sum, emi) => sum + (emi.RepaymentAmount || 0), 0);
    const paidTotal = loanEMIs.reduce((sum, emi) => sum + (emi.PaymentStatus ? emi.RepaymentAmount || 0 : 0), 0);
    return {
      totalPayable,
      paidTotal,
      remainingTotal: Math.max(0, totalPayable - paidTotal)
    };
  }, [loanEMIs]);

  const handleCreateLoan = async () => {
    if (!loanAmount || !tenureMonths || !repaymentStart) return;
    setLoading(true);
    try {
      const payload = {
        EmployeeID: facilityMemberId,
        LoanAdvanceAmount: loanAmount,
        TenureMonths: tenureMonths,
        IssueDate: new Date().toISOString(),
        RepaymentMonthYear: formatToMonthYear(repaymentStart),
        CurrentMonth: formatToMonthYear(new Date()),
        ProposedBy: getCurrentUserId(),
      };
      const response = await createEmployeeLoan(payload);
      const loanId = response?.LoanID || response?.LoanId;
      if (loanId) await refreshLoanById(loanId);
      else await fetchLoanData(facilityMemberId);
      setLoanAmount(null);
      setTenureMonths(null);
    } catch {
      alert("Failed to create loan.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLoanId) return;
    setLoading(true);
    try {
      await approveLoan(selectedLoanId, getCurrentUserId());
      await refreshLoanById(selectedLoanId);
    } catch {
      alert("Approval failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLoanId) return;
    if (!window.confirm("Reject this loan request?")) return;
    setLoading(true);
    try {
      await rejectLoan(selectedLoanId);
      await fetchLoanData(facilityMemberId);
    } catch {
      alert("Rejection failed.");
    } finally {
      setLoading(false);
    }
  };

  const redistributeAmounts = (originalEmis, editInfo) => {
    const { emiId, newAmount, skip } = editInfo;
    const loanTotal = Number(loanMaster?.LoanAdvanceAmount);
    if (!Number.isFinite(loanTotal) || loanTotal <= 0) return null;

    const map = new Map(originalEmis.map((e) => [e.ID, { ...e }]));
    const edited = map.get(emiId);
    if (!edited) return null;

    if (skip) {
      edited.RepaymentAmount = 0;
      edited.PaymentStatus = true;
    } else if (newAmount != null) {
      edited.RepaymentAmount = Math.round(newAmount * 100) / 100;
    }

    const paidTotal = Array.from(map.values()).reduce((sum, e) => sum + (e.PaymentStatus ? e.RepaymentAmount || 0 : 0), 0);
    let remaining = Math.round((loanTotal - paidTotal) * 100) / 100;
    if (remaining < 0) remaining = 0;

    const unpaidOthers = Array.from(map.values()).filter((e) => !e.PaymentStatus && e.ID !== emiId);
    if (unpaidOthers.length > 0) {
      const totalCents = Math.round(remaining * 100);
      const perCents = Math.floor(totalCents / unpaidOthers.length);
      let remainder = totalCents - perCents * unpaidOthers.length;
      unpaidOthers.forEach((e) => {
        const extra = remainder > 0 ? 1 : 0;
        e.RepaymentAmount = (perCents + extra) / 100;
        remainder -= extra;
      });
    }
    return Array.from(map.values());
  };

  const onEditEmi = (emi) => {
    setEditEmi(emi);
    setEditAmount(emi.RepaymentAmount);
    setEditMonthText(toMonthInputValue(emi.RepaymentDueMonth));
    setEditSkip(false);
    setEditDialogShow(true);
  };

  const handleUpdateEmi = async () => {
    if (!editEmi) return;
    setLoading(true);
    try {
      const payload = {
        EMIId: editEmi.ID,
        NewAmount: editSkip ? 0 : editAmount,
        NewMonth: toApiMonth(editMonthText),
        Skip: editSkip
      };

      if (syncRemaining) {
        const redistributed = redistributeAmounts(loanEMIs, { emiId: editEmi.ID, newAmount: payload.NewAmount, skip: payload.Skip });
        if (redistributed) {
          for (const emi of redistributed) {
            const original = loanEMIs.find(e => e.ID === emi.ID);
            if (!original) continue;
            if (emi.ID === editEmi.ID || original.RepaymentAmount !== emi.RepaymentAmount) {
              await updateLoanEmi({
                EMIId: emi.ID,
                NewAmount: emi.RepaymentAmount,
                NewMonth: emi.ID === editEmi.ID ? payload.NewMonth : undefined,
                Skip: emi.ID === editEmi.ID ? payload.Skip : undefined
              });
            }
          }
        }
      } else {
        await updateLoanEmi(payload);
      }
      await refreshLoanById(selectedLoanId);
      setEditDialogShow(false);
    } catch {
      alert("Failed to update installment.");
    } finally {
      setLoading(false);
    }
  };

  const statusTemplate = (rowData) => {
    return <Tag value={rowData.PaymentStatus ? "PAID" : "PENDING"} severity={rowData.PaymentStatus ? "success" : "warning"} style={{ fontSize: "9px" }} />;
  };

  const actionTemplate = (rowData) => {
    if (rowData.PaymentStatus) {
      return <small style={{ fontSize: "10px" }} className="text-gray-400">{rowData.DeductionDate ? new Date(rowData.DeductionDate).toLocaleDateString() : "-"}</small>;
    }
    return (
      <div className="flex gap-1 justify-content-center">
        <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-text p-0" style={{ width: "1.5rem", height: "1.5rem" }} onClick={() => payLoanEmi(rowData.ID).then(() => refreshLoanById(selectedLoanId))} />
        <Button icon="pi pi-pencil" className="p-button-rounded p-button-info p-button-text p-0" style={{ width: "1.5rem", height: "1.5rem" }} onClick={() => onEditEmi(rowData)} />
      </div>
    );
  };

  return (
    <Dialog
      header={
        <div className="flex align-items-center" style={{ fontSize: "1rem" }}>
          <i className="pi pi-briefcase text-primary mr-2"></i>
          <span>Loan Tracking - <span className="text-primary font-bold">{employeeName}</span></span>
        </div>
      }
      visible={show}
      style={{ width: "880px" }}
      modal
      onHide={onClose}
      className="loan-compact-dialog"
    >
      {loanMaster && (
        <div className="metrics-bar flex gap-2 mb-3 px-2">
          {[{ label: "TOTAL", val: loanMaster.LoanAdvanceAmount, color: "blue" },
          { label: "PAID", val: totals.paidTotal, color: "green" },
          { label: "DUE", val: totals.remainingTotal, color: "rose" },
          { label: "TENURE", val: `${loanMaster.TenureMonths} Months`, color: "orange" }
          ].map((m, i) => (
            <div key={i} className={`flex-1 flex align-items-center justify-content-between bg-${m.color}-50 p-2 border-round shadow-sm`} style={{ borderLeft: `3px solid var(--${m.color}-500)` }}>
              <span className="text-xs font-bold text-gray-500 mr-4">{m.label}</span>
              <span className={`text-sm font-bold text-${m.color}-700`}>{typeof m.val === 'number' ? `₹${m.val.toLocaleString()}` : m.val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="p-fluid grid">
        <div className="col-12 md:col-4 border-right-1 border-gray-100 pr-3">
          {!loanMaster ? (
            <div className="p-2">
              <h6 className="mt-0 mb-3 flex align-items-center"><i className="pi pi-plus-circle mr-2 text-primary"></i>Application</h6>
              <div className="field mb-2">
                <label className="text-xs font-bold text-gray-600">Amount (₹)</label>
                <InputNumber value={loanAmount} onValueChange={(e) => setLoanAmount(e.value)} mode="currency" currency="INR" locale="en-IN" style={{ height: "32px" }} />
              </div>
              <div className="field mb-2">
                <label className="text-xs font-bold text-gray-600">Recovery (Mo)</label>
                <InputNumber value={tenureMonths} onValueChange={(e) => setTenureMonths(e.value)} min={1} max={120} style={{ height: "32px" }} />
              </div>
              <div className="field mb-3">
                <label className="text-xs font-bold text-gray-600">Start Month</label>
                <Calendar value={repaymentStart} onChange={(e) => setRepaymentStart(e.value)} view="month" dateFormat="mm/yy" showIcon style={{ height: "32px" }} />
              </div>
              <Button label="Submit" icon="pi pi-send" onClick={handleCreateLoan} loading={loading} style={{ height: "35px" }} />
            </div>
          ) : (
            <div className="flex flex-column gap-3 p-2">
              <div>
                <h6 className="mt-0 mb-2 text-gray-700">Management</h6>
                <div className="flex flex-column gap-2">
                  {!loanMaster.IsApproved && (
                    <div className="flex gap-2">
                      <Button label="Approve" icon="pi pi-check" className="p-button-success flex-1" onClick={handleApprove} loading={loading} style={{ height: "32px", fontSize: "12px" }} />
                      <Button label="Reject" icon="pi pi-trash" className="p-button-danger p-button-text p-0" onClick={handleReject} loading={loading} style={{ height: "32px", fontSize: "12px" }} />
                    </div>
                  )}
                  {loanMaster.IsApproved && (
                    <Button label="Settle Full Loan" icon="pi pi-wallet" className="p-button-help p-button-sm" onClick={() => payFullLoan(selectedLoanId).then(() => refreshLoanById(selectedLoanId))} loading={loading} style={{ height: "32px", fontSize: "12px" }} />
                  )}
                </div>
              </div>

              <div className="pt-3 border-top-1 border-gray-100">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Extend Tenure</label>
                <div className="p-inputgroup" style={{ height: "32px" }}>
                  <InputNumber value={restructureTenure} onValueChange={(e) => setRestructureTenure(e.value)} placeholder="Months" style={{ fontSize: "12px" }} />
                  <Button icon="pi pi-refresh" className="p-button-warning" onClick={() => restructureLoan(selectedLoanId, restructureTenure).then(() => refreshLoanById(selectedLoanId))} loading={loading} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-12 md:col-8 pl-3">
          <DataTable
            value={loanEMIs}
            scrollable
            scrollHeight="320px"
            size="small"
            stripedRows
            className="compact-datatable"
          >
            <Column header="#" body={(r, o) => o.rowIndex + 1} style={{ width: "3.5rem" }} headerStyle={{ textAlign: 'center' }} />
            <Column field="RepaymentDueMonth" header="DUE" headerStyle={{ textAlign: 'center' }} style={{ fontWeight: "700", fontSize: "11px" }} />
            <Column field="RepaymentAmount" header="AMOUNT" headerStyle={{ textAlign: 'center' }} body={(r) => <span style={{ fontSize: "11px" }}>₹{r.RepaymentAmount.toFixed(2)}</span>} />
            <Column header="STATUS" body={statusTemplate} headerStyle={{ textAlign: 'center' }} style={{ width: "100px" }} />
            <Column header="ACTION" body={actionTemplate} headerStyle={{ textAlign: 'center' }} style={{ width: "100px" }} />
          </DataTable>
        </div>
      </div>

      <Dialog
        header="Adjust Installment"
        visible={editDialogShow}
        style={{ width: "350px" }}
        modal
        onHide={() => setEditDialogShow(false)}
        footer={
          <div className="flex justify-content-end gap-2 p-2">
            <Button label="Cancel" className="p-button-text p-button-sm" onClick={() => setEditDialogShow(false)} />
            <Button label="Save" icon="pi pi-save" className="p-button-sm" onClick={handleUpdateEmi} loading={loading} />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label className="font-bold text-sm text-gray-700 block mb-2">New Repayment Amount (₹)</label>
            <InputNumber value={editAmount} onValueChange={(e) => setEditAmount(e.value)} mode="currency" currency="INR" disabled={editSkip} />
          </div>
          <div className="field mb-4">
            <label className="font-bold text-sm text-gray-700 block mb-2">Adjust Due Month</label>
            <input type="month" value={editMonthText} onChange={(e) => setEditMonthText(e.target.value)} disabled={editSkip} className="p-inputtext w-full" style={{ padding: '0.75rem' }} />
          </div>
          <div className="flex align-items-center gap-3 mb-3 p-3 bg-rose-50 border-round-lg border-1 border-rose-100">
            <Checkbox inputId="skip" checked={editSkip} onChange={e => setEditSkip(e.checked)} />
            <label htmlFor="skip" className="text-sm font-bold text-rose-700 cursor-pointer">Skip this installment (Set to ₹0)</label>
          </div>
          <div className="flex align-items-center gap-3 p-3 bg-blue-50 border-round-lg border-1 border-blue-100">
            <Checkbox inputId="sync" checked={syncRemaining} onChange={e => setSyncRemaining(e.checked)} />
            <label htmlFor="sync" className="text-sm font-semibold text-blue-700 cursor-pointer">Re-sync remaining schedule balance</label>
          </div>
        </div>
      </Dialog>

      <style>{`
        .loan-compact-dialog .p-dialog-content { padding: 0.75rem; background: #fff; }
        .compact-datatable .p-datatable-thead > tr > th { background: #f8fafc; font-size: 10px; padding: 0.5rem; }
        .compact-datatable .p-datatable-tbody > tr > td { padding: 0.4rem; font-size: 11px; }
        .metrics-bar > div { min-width: 0; }
        .p-tag { padding: 0.15rem 0.4rem; }
      `}</style>
    </Dialog>
  );
};

export default LoanAdvanceDialog;