import React, { useEffect, useState } from "react";
import {
  getSalaryAllowancesByProperty,
  getSalaryAllowancesByFacilityMember,
  assignSalaryGroupToFacilityMember,
} from "../../Services/PayrollService";

export default function SalaryGroupView({
  propertyId,
  facilityMemberId,
  employeeName,
  onClose,
}) {
  const [salaryGroups, setSalaryGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [finalAddedGroups, setFinalAddedGroups] = useState([]);
  const [facilityMemberSalaryData, setFacilityMemberSalaryData] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  /* -------------------------
     Type helpers
     A  => Allowance
     OA => Other Allowance
     D  => Deduction
     OD => Other Deduction
     ------------------------- */
  const isAllowance = (t) => t === "A" || t === "OA";
  const isDeduction = (t) => t === "D" || t === "OD";

  // amount for allowances: prefer CalculatedAmount, fallback to FixedAmount
  const getAllowanceAmount = (a) =>
    Number(a?.CalculatedAmount) > 0 ? Number(a.CalculatedAmount) : Number(a?.FixedAmount || 0);

  useEffect(() => {
    if (propertyId) {
      getSalaryAllowancesByProperty(propertyId)
        .then((data) => setSalaryGroups(data || []))
        .catch(() => setSalaryGroups([]));
    }
  }, [propertyId]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSalaryAllowancesByFacilityMember(facilityMemberId);
        setFacilityMemberSalaryData(data?.SalaryGroups || []);
      } catch {
        setFacilityMemberSalaryData([]);
      }
    }
    if (facilityMemberId) fetchData();
  }, [facilityMemberId]);

  // Auto-select already assigned salary group for the employee
  useEffect(() => {
    if (facilityMemberSalaryData.length > 0 && salaryGroups.length > 0) {
      const assignedGroup = facilityMemberSalaryData[0]; // assume one active group per employee
      setSelectedGroupId(assignedGroup.SalaryGroup_ID);
    }
  }, [facilityMemberSalaryData, salaryGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = salaryGroups.find((g) => g.SalaryGroup_ID === selectedGroupId);
      setSelectedGroupData(group || null);
    } else {
      setSelectedGroupData(null);
    }
  }, [selectedGroupId, salaryGroups]);

  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
  const existingGroups = safeArray(facilityMemberSalaryData);
  const combinedSalaryGroups =
    finalAddedGroups.length > 0
      ? [finalAddedGroups[finalAddedGroups.length - 1]]
      : existingGroups.length > 0
        ? [existingGroups[existingGroups.length - 1]]
        : [];

  const handleAdd = async () => {
    if (!selectedGroupData) return;

    if (
      finalAddedGroups.some((g) => g.SalaryGroup_ID === selectedGroupData.SalaryGroup_ID) ||
      safeArray(facilityMemberSalaryData).some((g) => g.SalaryGroup_ID === selectedGroupData.SalaryGroup_ID)
    ) {
      alert("This salary group is already assigned.");
      return;
    }

    try {
      setIsAssigning(true);
      await assignSalaryGroupToFacilityMember({
        FacilityMemberIds: facilityMemberId,
        SalaryGroup_ID: selectedGroupData.SalaryGroup_ID,
        PropertyID: propertyId
      });

      alert(
        facilityMemberSalaryData.length > 0
          ? "Salary Group modified successfully!"
          : "Salary Group assigned successfully!"
      );

      // update local state so UI shows the newly assigned group
      setFinalAddedGroups([{ ...selectedGroupData }]);
      setFacilityMemberSalaryData([{ ...selectedGroupData }]);
      setSelectedGroupId(selectedGroupData.SalaryGroup_ID);
    } catch {
      alert("Failed to add salary group. Please try again.");
    } finally {
      setIsAssigning(false); // 🔥 STOP LOADING
    }
  };

  /* ------------------------------------------------
     Totals: use isAllowance/isDeduction mappings
     salaryValue is FixedSalary if >0 else BaseSalary
     ------------------------------------------------ */
  function getTotals(items = [], salaryValue = 0) {
    const totalAllowance =
      (Number(salaryValue) || 0) +
      items
        .filter((a) => isAllowance(a.Type))
        .reduce((sum, a) => sum + (Number(a.CalculatedAmount) || Number(a.FixedAmount) || 0), 0);

    const totalDeduction = items
      .filter((d) => isDeduction(d.Type))
      .reduce((sum, d) => sum + (Number(d.CalculatedAmount) || 0), 0);

    return { totalAllowance, totalDeduction };
  }

  function getTotalSalary(salaryGroup = {}, items = []) {
    const salaryValue =
      Number(salaryGroup.FixedSalary) > 0 ? Number(salaryGroup.FixedSalary) : Number(salaryGroup.BaseSalary || 0);
    const { totalAllowance, totalDeduction } = getTotals(items, salaryValue);
    return totalAllowance - totalDeduction;
  }

  const selectedTotals = selectedGroupData
    ? getTotals(
      selectedGroupData.AllowancesDeductions || [],
      Number(selectedGroupData.FixedSalary) > 0 ? Number(selectedGroupData.FixedSalary) : Number(selectedGroupData.BaseSalary || 0)
    )
    : { totalAllowance: 0, totalDeduction: 0 };

  const selectedTotalSalary = selectedGroupData
    ? getTotalSalary(selectedGroupData, selectedGroupData.AllowancesDeductions || [])
    : 0;

  const isSelectedFixed = selectedGroupData ? Number(selectedGroupData.FixedSalary) > 0 : false;

  /* ------------------------------------------------
     Render rows: include Base/Fixed salary as first allowance row
     Use isAllowance/isDeduction filters and getAllowanceAmount for display
     ------------------------------------------------ */
  const renderAllowanceDeductionRows = (items = [], salaryGroup = {}) => {
    // allowances: A + OA
    const allowances = (items || []).filter((a) => isAllowance(a.Type));
    // deductions: D + OD
    const deductions = (items || []).filter((d) => isDeduction(d.Type));
    const isFixedSalary = salaryGroup && Number(salaryGroup.FixedSalary) > 0;

    // salary row into allowances (Fixed Salary or Base Salary)
    let salaryAllowanceRow = null;
    if (isFixedSalary) {
      salaryAllowanceRow = {
        ID: "fixed",
        Name: "Fixed Salary",
        CalculatedAmount: salaryGroup.FixedSalary,
        FixedAmount: salaryGroup.FixedSalary,
      };
    } else if (Number(salaryGroup.BaseSalary) > 0) {
      salaryAllowanceRow = {
        ID: "base",
        Name: "Base Salary",
        CalculatedAmount: salaryGroup.BaseSalary,
        FixedAmount: salaryGroup.BaseSalary,
      };
    }

    const allAllowances = salaryAllowanceRow ? [salaryAllowanceRow, ...allowances] : allowances;
    const maxRows = Math.max(allAllowances.length, deductions.length);

    return Array.from({ length: maxRows }).map((_, i) => (
      <tr key={i} style={i % 2 === 0 ? styles.stripedRow : undefined}>
        <td style={styles.cell}>{allAllowances[i] ? allAllowances[i].Name : ""}</td>
        <td style={styles.cellCenter}>
          {allAllowances[i]
            ? `₹${Number(allAllowances[i].CalculatedAmount || allAllowances[i].FixedAmount || 0)}`
            : ""}
        </td>

        {!isFixedSalary && (
          <>
            <td style={styles.cell}>{deductions[i] ? deductions[i].Name : ""}</td>
            <td style={styles.cellCenter}>
              {deductions[i] ? `₹${Number(deductions[i].CalculatedAmount || 0)}` : ""}
            </td>
          </>
        )}
      </tr>
    ));
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <h3 style={styles.title}>View Salary Group</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close dialog">
            ×
          </button>
        </header>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Employee Name
            <input type="text" value={employeeName || ""} disabled style={styles.input} />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Salary Group Name
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              style={styles.select}
            >
              <option value="">-- Select Salary Group --</option>
              {salaryGroups.map((group) => (
                <option key={group.SalaryGroup_ID} value={group.SalaryGroup_ID}>
                  {group.SalaryGroup}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Show preview for any selected group EXCEPT the one already assigned */}
        {selectedGroupData &&
          !facilityMemberSalaryData.some((g) => g.SalaryGroup_ID === selectedGroupData.SalaryGroup_ID) && (
            <>
              <table style={styles.table} cellSpacing={0}>
                <thead>
                  <tr>
                    <th colSpan={2} style={{ ...styles.tableHeader, ...styles.allowanceHeader }}>
                      Allowance
                    </th>
                    {!isSelectedFixed && (
                      <th colSpan={2} style={{ ...styles.tableHeader, ...styles.deductionHeader }}>
                        Deduction
                      </th>
                    )}
                  </tr>
                  <tr>
                    <th style={styles.subHeader}>Name</th>
                    <th style={styles.subHeader}>Amount</th>
                    {!isSelectedFixed && (
                      <>
                        <th style={styles.subHeader}>Name</th>
                        <th style={styles.subHeader}>Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {renderAllowanceDeductionRows(selectedGroupData.AllowancesDeductions || [], selectedGroupData)}
                  <tr>
                    <td />
                    <td
                      style={{
                        ...styles.cellCenter,
                        fontWeight: "700",
                        borderTop: "2px solid #64748b",
                      }}
                    >
                      Total Allowance: ₹{selectedTotals.totalAllowance}
                    </td>
                    {!isSelectedFixed && (
                      <>
                        <td />
                        <td
                          style={{
                            ...styles.cellCenter,
                            fontWeight: "700",
                            borderTop: "2px solid #64748b",
                          }}
                        >
                          Total Deduction: ₹{selectedTotals.totalDeduction}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  fontWeight: "800",
                  fontSize: "19px",
                  textAlign: "center",
                  margin: "16px 0",
                  color: "#1e40af",
                }}
              >
                Total Salary: ₹{selectedTotalSalary}
              </div>
            </>
          )}

        <button
          onClick={handleAdd}
          disabled={
            isAssigning ||
            !selectedGroupData ||
            facilityMemberSalaryData.some((g) => g.SalaryGroup_ID === selectedGroupData.SalaryGroup_ID)
          }
          style={{
            ...styles.button,
            ...(isAssigning ||
              !selectedGroupData ||
              facilityMemberSalaryData.some((g) => g.SalaryGroup_ID === selectedGroupData.SalaryGroup_ID)
              ? styles.buttonDisabled
              : {}),
          }}
        >
          {isAssigning
            ? "Processing..."
            : facilityMemberSalaryData.length > 0
              ? "Modify"
              : "Add"}
        </button>

        {combinedSalaryGroups.length > 0 && (
          <section style={styles.addedSection}>
            {combinedSalaryGroups.map((group) => {
              const isFixed = Number(group.FixedSalary) > 0;
              const groupTotals = getTotals(group.AllowancesDeductions || [], isFixed ? Number(group.FixedSalary) : Number(group.BaseSalary || 0));
              const groupTotalSalary = getTotalSalary(group, group.AllowancesDeductions || []);
              return (
                <div key={group.SalaryGroup_ID} style={{ ...styles.finalGroupCard, position: "relative" }}>
                  <div style={styles.groupHeader}>
                    <span style={styles.groupName}>Salary Group → {group.SalaryGroup}</span>
                  </div>

                  <table style={styles.table} cellSpacing={0}>
                    <thead>
                      <tr>
                        <th colSpan={2} style={{ ...styles.tableHeader, ...styles.allowanceHeader }}>
                          Allowance
                        </th>
                        {!isFixed && (
                          <th colSpan={2} style={{ ...styles.tableHeader, ...styles.deductionHeader }}>
                            Deduction
                          </th>
                        )}
                      </tr>
                      <tr>
                        <th style={styles.subHeader}>Name</th>
                        <th style={styles.subHeader}>Amount</th>
                        {!isFixed && (
                          <>
                            <th style={styles.subHeader}>Name</th>
                            <th style={styles.subHeader}>Amount</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {renderAllowanceDeductionRows(group.AllowancesDeductions || [], group)}
                      <tr>
                        <td />
                        <td
                          style={{
                            ...styles.cellCenter,
                            fontWeight: "700",
                            borderTop: "2px solid #64748b",
                          }}
                        >
                          Total Allowance: ₹{groupTotals.totalAllowance}
                        </td>
                        {!isFixed && (
                          <>
                            <td />
                            <td
                              style={{
                                ...styles.cellCenter,
                                fontWeight: "700",
                                borderTop: "2px solid #64748b",
                              }}
                            >
                              Total Deduction: ₹{groupTotals.totalDeduction}
                            </td>
                          </>
                        )}
                      </tr>
                    </tbody>
                  </table>

                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "19px",
                      textAlign: "center",
                      margin: "16px 0",
                      color: "#1e40af",
                    }}
                  >
                    Total Salary: ₹{groupTotalSalary}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(20, 27, 54, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    padding: 16,
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: 640,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
    padding: "28px 32px 36px",
    fontFamily: "'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#1e293b",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    margin: 0,
    color: "#0f172a",
  },
  closeBtn: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: 26,
    fontWeight: "600",
    cursor: "pointer",
    color: "#64748b",
    lineHeight: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 8,
    color: "#334155",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    borderRadius: 6,
    border: "1.5px solid #cbd5e1",
    backgroundColor: "#f8fafc",
    fontWeight: "400",
    color: "#334155",
    outline: "none",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 15,
    borderRadius: 6,
    border: "1.5px solid #cbd5e1",
    backgroundColor: "#f1f5f9",
    fontWeight: "400",
    color: "#334155",
    outline: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginBottom: 30,
  },
  tableHeader: {
    padding: "12px 14px",
    fontWeight: "700",
    fontSize: 15,
    color: "#1e293b",
    borderBottom: "2px solid #cbd5e1",
    userSelect: "none",
  },
  allowanceHeader: {
    backgroundColor: "#d1fae5",
    borderRight: "1.5px solid #a7f3d0",
    color: "#065f46",
    textAlign: "center",
  },
  deductionHeader: {
    backgroundColor: "#fee2e2",
    borderLeft: "1.5px solid #fca5a5",
    color: "#991b1b",
    textAlign: "center",
  },
  subHeader: {
    padding: "10px 12px",
    fontWeight: "600",
    fontSize: 14,
    borderBottom: "1.5px solid #e2e8f0",
    color: "#475569",
    textAlign: "center",
  },
  stripedRow: {
    backgroundColor: "#f8fafc",
  },
  cell: {
    padding: "10px 12px",
    fontSize: 14,
    color: "#344054",
    textAlign: "center",
    fontWeight: "500",
  },
  cellCenter: {
    padding: "10px 12px",
    fontSize: 14,
    color: "#344054",
    textAlign: "center",
    fontWeight: "500",
  },
  button: {
    alignSelf: "flex-start",
    padding: "12px 32px",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: 8,
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 4px 15px rgb(37 99 235 / 0.4)",
    transition: "background-color 0.3s ease",
    userSelect: "none",
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  addedSection: {
    marginTop: 32,
  },
  finalGroupCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    position: "relative",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  groupName: {
    fontWeight: "700",
    fontSize: 18,
    color: "#334155",
  },
};
