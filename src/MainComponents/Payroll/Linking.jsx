import React, { useState, useEffect } from "react";
import {
  getSalaryAllowancesByProperties,
  getEmployeesByOffices,
  assignSalaryGroupToFacilityMember,
} from "../../Services/PayrollService";
import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
} from "../../Services/ClientService";
import { useSelector } from "react-redux";

export default function DesignationLinking() {
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);
  const reduxPropertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxPropertyIds = useSelector((state) => state.Commonreducer.puidnlist);

  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState([]);

  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  const [salaryGroups, setSalaryGroups] = useState([]);
  const [salaryGroup, setSalaryGroup] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designation, setDesignation] = useState("");

  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [salaryGroupsData, setSalaryGroupsData] = useState([]);

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupGroup, setPopupGroup] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /*------------------------------------------------------
    TYPE CHECKERS
  ------------------------------------------------------*/
  const isAllowance = (t) => t === "A" || t === "OA";
  const isDeduction = (t) => t === "D" || t === "OD";

  /*------------------------------------------------------
    ALLOWANCE AMOUNT CALCULATOR
  ------------------------------------------------------*/
  const getAllowanceAmount = (a) =>
    a.CalculatedAmount > 0 ? a.CalculatedAmount : a.FixedAmount;

  /*------------------------------------------------------
    DEDUCTION AMOUNT CALCULATOR
  ------------------------------------------------------*/
  const getDeductionAmount = (d) =>
    d.CalculatedAmount > 0 ? d.CalculatedAmount : d.FixedAmount;

  /*------------------------------------------------------
    FILTERED EMPLOYEE LIST
  ------------------------------------------------------*/
  const filteredEmployees = employeeList.filter(
    (emp) => emp.Designation === designation
  );

  /*------------------------------------------------------
    FETCH EMPLOYEES
  ------------------------------------------------------*/
  async function fetchEmployees() {
    try {
      let officeIds = [];

      if (selectedPropertyId.length > 0) {
        officeIds = selectedPropertyId;
      } else if (Number(reduxPropertyId) > 0) {
        officeIds = [Number(reduxPropertyId)];
      } else if (Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0) {
        officeIds = reduxPropertyIds;
      }

      if (!officeIds.length) {
        setEmployeeList([]);
        return;
      }

      const data = await getEmployeesByOffices(officeIds);

      const employees = (data || [])
        .map((item) => ({
          FacilityMemberId: item.FacilityMember?.FacilityMemberId,
          SG_Link_ID: item.FacilityMember?.SG_Link_ID
            ? parseInt(item.FacilityMember.SG_Link_ID)
            : null,

          Designation: item.Profile?.Designation || "",
          EmployeeName: item.Profile?.EmployeeName || "",

          // optional but useful later
          Department: item.Profile?.Department || "",
          OfficeId: item.Profile?.OfficeId || null,
        }))
        .filter((emp) => emp.FacilityMemberId); // cleaner filter

      setEmployeeList(employees);

      const uniqueDesignations = [
        ...new Set(
          employees.map((emp) => (emp.Designation || "").trim()).filter(Boolean)
        ),
      ];
      setDesignations(uniqueDesignations);
    } catch (error) {
      setEmployeeList([]);
      setDesignations([]);
    }
  }

  /*------------------------------------------------------
    FETCH SALARY GROUPS
  ------------------------------------------------------*/
  async function fetchSalaryGroups() {
    try {
      let propertyIds = [];

      // 1️⃣ If user selected units from dropdown
      if (selectedPropertyId.length > 0) {
        propertyIds = selectedPropertyId;
      }

      // 2️⃣ Fallback to navbar property
      else if (Number(reduxPropertyId) > 0) {
        propertyIds = [Number(reduxPropertyId)];
      } else if (Array.isArray(reduxPropertyIds) && reduxPropertyIds.length > 0) {
        propertyIds = reduxPropertyIds;
      }

      if (!propertyIds.length) {
        setSalaryGroups([]);
        setSalaryGroupsData([]);
        return;
      }

      const response = await getSalaryAllowancesByProperties(propertyIds);

      if (Array.isArray(response)) {
        setSalaryGroupsData(response);

        setSalaryGroups(
          response.map((item) => ({
            id: item.SalaryGroup_IDs?.[0], // important change
            name: item.SalaryGroup,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading salary groups:", error);
      setSalaryGroups([]);
      setSalaryGroupsData([]);
    }
  }

  useEffect(() => {
    fetchEmployees();
    setSalaryGroup(null);
    setSelectedGroupData(null);
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds]);

  useEffect(() => {
    fetchSalaryGroups();
  }, [selectedPropertyId, reduxPropertyId, reduxPropertyIds]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        if (Number(reduxClientId) > 0) {
          setSelectedUnitId(Number(reduxClientId));
          return;
        }
        if (Number(reduxPropertyId) > 0) {
          const res = await getClientByPropertyId(reduxPropertyId);
          setUnitList(res ? [res] : []);
          setSelectedUnitId(res?.ClientID || null);
        } else {
          const res = await getAllClients();
          setUnitList(res || []);
        }
      } catch (err) {
        console.log("Failed to load units", err);
      }
    };

    loadUnits();
  }, [reduxClientId, reduxPropertyId]);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId([]);
          return;
        }

        const res = await getPropertiesByClientId(selectedUnitId);
        const properties = res || [];

        setPropertyList(properties);

        if (Number(reduxPropertyId) > 0) setSelectedPropertyId([Number(reduxPropertyId)]);
        else if (properties.length === 1) {
          setSelectedPropertyId([properties[0].PropertyId]);
        } else {
          setSelectedPropertyId([]);
        }
      } catch (err) {
        console.log("Failed to load properties", err);
      }
    };

    loadProperties();
  }, [selectedUnitId, reduxPropertyId]);

  /*------------------------------------------------------
    EMPLOYEE SELECT HANDLER
  ------------------------------------------------------*/
  const toggleEmployee = (facilityId) => {
    setSelectedEmployees((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  /*------------------------------------------------------
    SAVE LOGIC
  ------------------------------------------------------*/
  const handleSave = async () => {
    if (isSaving) return;

    if (!salaryGroup || selectedEmployees.length === 0) {
      alert("Please select Salary Group and at least one employee.");
      return;
    }

    const payload = {
      FacilityMemberIds: selectedEmployees.join(","),
      SalaryGroup_ID: parseInt(salaryGroup),
      PropertyID: selectedPropertyId[0] || reduxPropertyId,
    };

    try {
      setIsSaving(true);
      await assignSalaryGroupToFacilityMember(payload);
      await fetchEmployees();
      alert("Salary group assigned successfully.");
      setSelectedEmployees([]);
      setSalaryGroup(null);
      setSelectedGroupData(null);
    } catch {
      alert("Operation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  /*------------------------------------------------------
    HELPER FOR GROUP NAME
  ------------------------------------------------------*/
  const getGroupNameById = (id) => {
    if (!id) return null;

    const group = salaryGroupsData.find(
      (g) => g.SalaryGroup_IDs?.includes(parseInt(id))
    );

    return group ? group.SalaryGroup : null;
  };

  const handleGroupClick = (groupId) => {
    const group = salaryGroupsData.find(
      (g) => g.SalaryGroup_IDs?.includes(parseInt(groupId))
    );
    if (group) {
      setPopupGroup(group);
      setPopupVisible(true);
    }
  };

  const hasSelectedEmps = selectedEmployees.length > 0;

  /*======================================================
    RENDER UI
  ======================================================*/
  return (
    <div
      className="content-wrapper"
      style={{ minHeight: "100vh", padding: 30 }}
    >
      <div
        className="card"
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          padding: "20px 30px",
          background: "#f7fafc",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
          marginBottom: 20,
          background: "#f9fafb",
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}>
          {/* Select Client */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontWeight: 600 }}>Select Client :</label>
            <select
              value={selectedUnitId || ""}
              onChange={(e) => {
                setSelectedUnitId(Number(e.target.value));
                setSelectedPropertyId([]);
              }}
              disabled
            >
              <option value="">-- Select Client --</option>
              {unitList.map((u) => (
                <option key={u.ClientID} value={u.ClientID}>
                  {u.ClientName}
                </option>
              ))}
            </select>
          </div>

          {/* Select Unit Multi Select */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "relative"
          }}>
            <label style={{ fontWeight: 600, minWidth: 100 }}>
              Select Unit :
            </label>

            <div
              onClick={(e) => {
                e.stopPropagation();
                if (propertyList.length > 0) {
                  setShowPropertyDropdown((prev) => !prev);
                }
              }}
              style={{
                border: "1px solid #cbd5e0",
                padding: "6px 12px",
                borderRadius: 6,
                background: "#fff",
                cursor: propertyList.length ? "pointer" : "not-allowed",
                opacity: propertyList.length ? 1 : 0.75,
                minWidth: 180,
                textAlign: "center"
              }}
            >
              {selectedPropertyId.length === propertyList.length
                ? "All Units Selected"
                : `${selectedPropertyId.length} Unit${selectedPropertyId.length !== 1 ? "s" : ""} Selected`}
            </div>

            {showPropertyDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  left: "112px",
                  background: "#fff",
                  border: "1px solid #cbd5e0",
                  borderRadius: 6,
                  padding: 10,
                  maxHeight: 220,
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                }}
              >
                {propertyList.map((p) => (
                  <div key={p.PropertyId} style={{ marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={selectedPropertyId.includes(p.PropertyId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPropertyId((prev) => [...prev, p.PropertyId]);
                        } else {
                          setSelectedPropertyId((prev) =>
                            prev.filter((id) => id !== p.PropertyId)
                          );
                        }
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>{p.PropertyName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <h2 style={{ fontWeight: "bold", color: "#2a4365", marginBottom: 20 }}>
          Salary Designation Linking
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* ===========================================
              LEFT COLUMN — SALARY GROUP VIEW
          ============================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <label style={{ fontWeight: 600 }}>Salary Group</label>
            <select
              value={salaryGroup}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setSalaryGroup(value);
                const groupData = salaryGroupsData.find(
                  (g) => g.SalaryGroup_IDs?.includes(value)
                );
                setSelectedGroupData(groupData || null);
              }}
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            >
              <option value="">-- Select Salary Group --</option>
              {salaryGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            {/* --------------------------------------------------
                SELECTED SALARY GROUP DETAILS VIEW
            -------------------------------------------------- */}
            {selectedGroupData && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 20,
                  height: 350,
                  overflowY: "auto",
                }}
              >
                <h4 style={{ marginBottom: 20, color: "#2a4365" }}>
                  Salary Group → {selectedGroupData.SalaryGroup}
                </h4>

                {/* FIXED SALARY ONLY CASE */}
                {selectedGroupData.AllowancesDeductions.length === 0 &&
                  selectedGroupData.FixedSalary > 0 ? (
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td>Fixed Salary</td>
                        <td style={{ textAlign: "right" }}>
                          ₹{selectedGroupData.FixedSalary}
                        </td>
                      </tr>

                      <tr>
                        <td style={{ fontWeight: "bold" }}>Total Allowance:</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                          ₹{selectedGroupData.FixedSalary}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  /* NORMAL ALLOWANCE + DEDUCTION VIEW */
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    {/* Allowance Box */}
                    <div
                      style={{
                        flex: 1,
                        marginRight: 20,
                        background: "#E8FBE8",
                        borderRadius: 12,
                        padding: "0 0 10px 0",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          background: "#C6F6D5",
                          padding: "10px 0",
                          textAlign: "center",
                          fontWeight: 700,
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                      >
                        Allowance
                      </div>

                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ padding: 8, textAlign: "left" }}>
                              Name
                            </th>
                            <th style={{ padding: 8, textAlign: "right" }}>
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* Base Salary */}
                          {selectedGroupData?.BaseSalary > 0 && (
                            <tr>
                              <td style={{ padding: 8 }}>Base Salary</td>
                              <td style={{ padding: 8, textAlign: "right" }}>
                                ₹{selectedGroupData.BaseSalary}
                              </td>
                            </tr>
                          )}

                          {/* Allowances */}
                          {selectedGroupData?.AllowancesDeductions?.filter(
                            (a) => isAllowance(a.Type)
                          ).map((a) => (
                            <tr key={a.AD_Id}>
                              <td style={{ padding: 8 }}>{a.Name}</td>
                              <td style={{ padding: 8, textAlign: "right" }}>
                                ₹{getAllowanceAmount(a)}
                              </td>
                            </tr>
                          ))}

                          {/* Total */}
                          <tr style={{ borderTop: "2px solid #999" }}>
                            <td style={{ padding: 8, fontWeight: 700 }}>
                              Total Allowance:
                            </td>
                            <td
                              style={{
                                padding: 8,
                                textAlign: "right",
                                fontWeight: 700,
                              }}
                            >
                              ₹
                              {(
                                (selectedGroupData?.BaseSalary || 0) +
                                (selectedGroupData?.AllowancesDeductions || [])
                                  .filter((a) => isAllowance(a.Type))
                                  .reduce(
                                    (sum, a) => sum + getAllowanceAmount(a),
                                    0
                                  )
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Deduction Box */}
                    <div
                      style={{
                        flex: 1,
                        background: "#FFECEC",
                        borderRadius: 12,
                        padding: "0 0 10px 0",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          background: "#FED7D7",
                          padding: "10px 0",
                          textAlign: "center",
                          fontWeight: 700,
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                      >
                        Deduction
                      </div>

                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ padding: 8, textAlign: "left" }}>
                              Name
                            </th>
                            <th style={{ padding: 8, textAlign: "right" }}>
                              Amount
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {/* Deductions */}
                          {selectedGroupData?.AllowancesDeductions?.filter(
                            (d) => isDeduction(d.Type)
                          ).map((d) => (
                            <tr key={d.AD_Id}>
                              <td style={{ padding: 8 }}>{d.Name}</td>
                              <td style={{ padding: 8, textAlign: "right" }}>
                                ₹{getDeductionAmount(d)}
                              </td>
                            </tr>
                          ))}

                          {/* Total Deduction */}
                          <tr style={{ borderTop: "2px solid #999" }}>
                            <td style={{ padding: 8, fontWeight: 700 }}>
                              Total Deduction:
                            </td>
                            <td
                              style={{
                                padding: 8,
                                textAlign: "right",
                                fontWeight: 700,
                              }}
                            >
                              ₹
                              {(selectedGroupData?.AllowancesDeductions || [])
                                .filter((d) => isDeduction(d.Type))
                                .reduce(
                                  (sum, d) => sum + getDeductionAmount(d),
                                  0
                                )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===========================================
              RIGHT COLUMN — EMPLOYEES LIST
          ============================================ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <label style={{ fontWeight: 600 }}>Designation</label>
            <select
              value={designation}
              onChange={(e) => {
                setDesignation(e.target.value);
                setSelectedEmployees([]);
              }}
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
            >
              <option value="">-- Select Designation --</option>
              {designations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>

            {salaryGroupsData.length > 0 &&
              designation &&
              filteredEmployees.length > 0 && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: 20,
                    height: 350,
                    overflowY: "auto",
                  }}
                >
                  <h4 style={{ marginBottom: 20 }}>Employees</h4>

                  <div style={{ padding: 10 }}>
                    {filteredEmployees.map((emp) => {
                      const assignedGroup = getGroupNameById(emp.SG_Link_ID);
                      const isAssignedToCurrent =
                        emp.SG_Link_ID &&
                        parseInt(emp.SG_Link_ID) === parseInt(salaryGroup);

                      return (
                        <div
                          key={emp.FacilityMemberId}
                          style={{
                            marginBottom: 8,
                            backgroundColor: isAssignedToCurrent
                              ? "#e6fffa"
                              : "transparent",
                            padding: "5px 8px",
                            borderRadius: 6,
                          }}
                        >
                          <label>
                            <input
                              type="checkbox"
                              disabled={isSaving || isAssignedToCurrent}
                              value={emp.FacilityMemberId}
                              checked={
                                selectedEmployees.includes(
                                  emp.FacilityMemberId
                                ) || isAssignedToCurrent
                              }
                              disabled={isAssignedToCurrent}
                              onChange={() =>
                                toggleEmployee(emp.FacilityMemberId)
                              }
                              style={{ marginRight: 6 }}
                            />
                            {emp.EmployeeName}
                          </label>

                          {emp.SG_Link_ID && (
                            <span
                              onClick={() => handleGroupClick(emp.SG_Link_ID)}
                              style={{
                                marginLeft: 8,
                                color: "#0f766e",
                                cursor: "pointer",
                              }}
                            >
                              ({assignedGroup})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <button
            onClick={handleSave}
            disabled={
              isSaving || !salaryGroup || !designation || !hasSelectedEmps
            }
            style={{
              padding: "12px 40px",
              backgroundColor:
                isSaving || !salaryGroup || !designation || !hasSelectedEmps
                  ? "#94a3b8"
                  : "#2b6cb0",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {isSaving ? "Processing..." : "Save"}
          </button>
        </div>
      </div>

      {/* ======================================================
          POPUP VIEW (SALARY GROUP DETAILS)
      ====================================================== */}
      {popupVisible && popupGroup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setPopupVisible(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 25,
              maxWidth: 850,
              width: "92%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: 15 }}>
              Salary Group → {popupGroup.SalaryGroup}
            </h2>

            {/* FIXED SALARY ONLY VIEW */}
            {popupGroup.FixedSalary > 0 &&
              popupGroup.AllowancesDeductions.length === 0 ? (
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>Fixed Salary</td>
                    <td style={{ textAlign: "right" }}>
                      ₹{popupGroup.FixedSalary}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Total Allowance:</b>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <b>₹{popupGroup.FixedSalary}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              /* NORMAL ALLOWANCE + DEDUCTION VIEW */
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {/* Allowance Box */}
                <div
                  style={{
                    flex: 1,
                    marginRight: 20,
                    background: "#E8FBE8",
                    borderRadius: 12,
                    padding: "0 0 10px 0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      background: "#C6F6D5",
                      padding: "10px 0",
                      textAlign: "center",
                      fontWeight: 700,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  >
                    Allowance
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 8, textAlign: "left" }}>Name</th>
                        <th style={{ padding: 8, textAlign: "right" }}>
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Base Salary */}
                      {popupGroup.BaseSalary > 0 && (
                        <tr>
                          <td style={{ padding: 8 }}>Base Salary</td>
                          <td style={{ padding: 8, textAlign: "right" }}>
                            ₹{popupGroup.BaseSalary}
                          </td>
                        </tr>
                      )}

                      {/* Allowances */}
                      {popupGroup.AllowancesDeductions.filter((a) =>
                        isAllowance(a.Type)
                      ).map((a) => (
                        <tr key={a.AD_Id}>
                          <td style={{ padding: 8 }}>{a.Name}</td>
                          <td style={{ padding: 8, textAlign: "right" }}>
                            ₹{getAllowanceAmount(a)}
                          </td>
                        </tr>
                      ))}

                      {/* Total */}
                      <tr style={{ borderTop: "2px solid #999" }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>
                          Total Allowance:
                        </td>
                        <td
                          style={{
                            padding: 8,
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          ₹
                          {(
                            (popupGroup.BaseSalary || 0) +
                            popupGroup.AllowancesDeductions.filter((a) =>
                              isAllowance(a.Type)
                            ).reduce((sum, a) => sum + getAllowanceAmount(a), 0)
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deduction Box */}
                <div
                  style={{
                    flex: 1,
                    background: "#FFECEC",
                    borderRadius: 12,
                    padding: "0 0 10px 0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      background: "#FED7D7",
                      padding: "10px 0",
                      textAlign: "center",
                      fontWeight: 700,
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  >
                    Deduction
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 8, textAlign: "left" }}>Name</th>
                        <th style={{ padding: 8, textAlign: "right" }}>
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Deductions */}
                      {popupGroup.AllowancesDeductions.filter((d) =>
                        isDeduction(d.Type)
                      ).map((d) => (
                        <tr key={d.AD_Id}>
                          <td style={{ padding: 8 }}>{d.Name}</td>
                          <td style={{ padding: 8, textAlign: "right" }}>
                            ₹{getDeductionAmount(d)}
                          </td>
                        </tr>
                      ))}

                      {/* Total Deduction */}
                      <tr style={{ borderTop: "2px solid #999" }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>
                          Total Deduction:
                        </td>
                        <td
                          style={{
                            padding: 8,
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          ₹
                          {popupGroup.AllowancesDeductions.filter((d) =>
                            isDeduction(d.Type)
                          ).reduce((sum, d) => sum + getDeductionAmount(d), 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => setPopupVisible(false)}
                style={{
                  padding: "10px 22px",
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
