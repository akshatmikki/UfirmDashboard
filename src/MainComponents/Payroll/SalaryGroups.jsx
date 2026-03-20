// -------------------- SECTION 1 --------------------
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Dialog } from "primereact/dialog";
import {
  getSalaryAllowancesByProperty,
  getSalaryAllowancesByClient,
  deleteSalaryAllowance,
  updateSalaryAllowance,
  createSalaryAllowance,
  getAllowancesDeductions,
  getADPercentages,
} from "../../Services/PayrollService";
import { FacilityMemberService } from "../../Services/FacilityService.js";
import Formulaone from "../../ReactComponents/DataGrid/Formula1stdialogbox.jsx";
import CustomFormulaDialog from "../../ReactComponents/DataGrid/CustomFormulaDialog";
import { getPropertyById } from "../../Services/PropertyService";

export default function SalaryGroups() {
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);

  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alDtOptions, setAlDtOptions] = useState([]);
  const [selectedType, setSelectedType] = useState("Allowance");
  const [selectedAllowancesDeductions, setSelectedAllowancesDeductions] =useState([]);
// designation & employee handling
const [designation, setDesignation] = useState("");
const [excludeEmployees, setExcludeEmployees] = useState(false);
const [employees, setEmployees] = useState([]);
const [excludedEmployeeIds, setExcludedEmployeeIds] = useState([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [fxAvailableItems, setFxAvailableItems] = useState([]);
  const [customFormulaVisible, setCustomFormulaVisible] = useState(false);
  const [customFormulaTarget, setCustomFormulaTarget] = useState(null);

  const [formData, setFormData] = useState({
    ID: 0,
    SalaryGroup_ID: 0,
    SalaryGroup: "",
    BaseSalary: "",
    Property_ID: propertyId || 0,
    CreatedOn: "",
    CreatedBy: 0,
    UpdatedOn: "",
    UpdatedBy: 0,
    IsActive: true,
    TaxAmount: 0,
    StartDate: "",
    EndDate: "",
    TotalWorkingDays: 0,
    ShiftHours: 0,
    AllowancesDeductions: [],
  });

  const [editId, setEditId] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [fxVisible, setFxVisible] = useState(false);
  const [fxTitle, setFxTitle] = useState("");
  const [fxTargetItem, setFxTargetItem] = useState(null);

  // percentage rules state
  const [percentageRules, setPercentageRules] = useState({
    property: [],
    global: [],
  });

  function normalizeFormula(f) {
    if (!f) return "";
    if (typeof f === "string") return f.trim();
    if (typeof f === "object" && f.Formula) return f.Formula.trim();
    return "";
  }
  // ---------------- NEW FUNCTION ----------------
  // Extract dependency names referenced in a formula by matching against master item names
  function extractDependencies(formula, allItems) {
    if (!formula) return [];

    // normalize item names and check word boundaries
    const found = [];
    for (const m of allItems) {
      const name = (m.Name || "").toString().trim();
      if (!name) continue;
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(formula)) {
        // avoid duplicates
        if (!found.includes(name)) found.push(name);
      }
    }
    return found;
  }

  useEffect(() => {
  if (!propertyId) return;

  (async () => {
    try {
      const empData = await FacilityMemberService.getFacilityMembers(propertyId);
      setEmployees(empData || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  })();
}, [propertyId]);

  // ---------------- END NEW FUNCTION ----------------

  function countDependencies(formula, items) {
    if (!formula) return 0;
    const names = items.map((i) => i.Name);
    let count = 0;

    for (const name of names) {
      const regex = new RegExp(`\\b${name}\\b`, "i");
      if (regex.test(formula)) count++;
    }

    return count;
  }

  // open fx dialog helper
  const openFxFor = (row) => {
    const available = [
      {
        ID: -999,
        Name: "Base",
        Mode: "#",
        FixedAmount: Number(formData.BaseSalary || 0),
        CalculatedAmount: Number(formData.BaseSalary || 0),
      },
      ...selectedAllowancesDeductions.map((it) => ({
        ...it,
        FixedAmount: it.Mode === "#" ? Number(it.Value || 0) : 0,
        CalculatedAmount: Number(it.CalculatedAmount || 0),
      })),
    ];

    const filtered = available.filter((a) => a.ID !== row.ID);

    setFxTargetItem(row);
    setFxTitle(row.Name);
    setFxVisible(true);
    setFxAvailableItems(filtered);
  };

  const openCustomFormula = (item) => {
    setFxVisible(false);
    setCustomFormulaTarget(item);
    setCustomFormulaVisible(true);
  };
  window.openCustomFormula = () => openCustomFormula(fxTargetItem);

  // derived
  const baseSalaryNum = Number(formData.BaseSalary);
  const isBaseActive = baseSalaryNum > 0;
  const canCreate = isBaseActive;

  // calculation helper
  const calculateAmount = (item, baseSalary, knownValues = {}) => {
    let formulaStrRaw = "";

    if (typeof item.Formula === "string") {
      formulaStrRaw = item.Formula.trim();
    } else if (item.Formula?.Formula) {
      formulaStrRaw = item.Formula.Formula.trim();
    }

    if (!formulaStrRaw) return 0;

    let formulaStr = formulaStrRaw.replace(
      /\bBase\b|\bBasic\b/gi,
      baseSalary || 0
    );

    Object.entries(knownValues).forEach(([key, val]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedKey, "gi");
      formulaStr = formulaStr.replace(regex, val || 0);
    });

    try {
      const result = new Function("return " + formulaStr)();
      return typeof result === "number" && !isNaN(result) ? result : 0;
    } catch {
      return 0;
    }
  };

  // ---------- Data loading (useEffect) ----------
  useEffect(() => {
    (async () => {
      const pid = Number(propertyId) || 0;
      const cid = Number(reduxClientId) || 0;
      if (!pid && !cid) return;
      setLoading(true);
      try {
        // 1. salary groups
        const salaryData =
          pid > 0
            ? await getSalaryAllowancesByProperty(pid)
            : await getSalaryAllowancesByClient(cid);
        setData(
          salaryData.map((group) => ({
            ...group,
            AllowancesDeductions: (group.AllowancesDeductions || []).map(
              (item) => ({
                ...item,
                AD_Id: item.AD_Id || item.ID,
                CalculatedAmount: item.CalculatedAmount || 0,
              })
            ),
          }))
        );

        // 2. master list
        const alDtData = await getAllowancesDeductions();

        // 2.a sort properly: allowances (A, OA) first then deductions (D, OD)
        const sorted = [...alDtData].sort((a, b) => {
          const aIsAllow = a.Type === "A" || a.Type === "OA";
          const bIsAllow = b.Type === "A" || b.Type === "OA";
          if (aIsAllow && !bIsAllow) return -1;
          if (!aIsAllow && bIsAllow) return 1;
          return 0;
        });

        setAlDtOptions(sorted);

        // 3. percentage rules
        let percentages = [];
        try {
          percentages = await getADPercentages(propertyId);
        } catch (pe) {
          try {
            percentages = await getADPercentages();
          } catch (err) {
            percentages = [];
          }
        }

        const propPercentages = (percentages || []).filter(
          (p) =>
            p.PropertyId != null &&
            Number(p.PropertyId) === Number(propertyId) &&
            (p.IsGlobal === 0 || !p.IsGlobal)
        );
        const globalPercentages = (percentages || []).filter(
          (p) => p.IsGlobal === 1 || p.PropertyId == null || p.PropertyId === 0
        );

        setPercentageRules({
          property: propPercentages,
          global: globalPercentages,
        });

        // 4. property meta (only when a specific property is selected)
        if (pid > 0) {
          const propertyData = await getPropertyById(pid);
          setFormData((prev) => ({
            ...prev,
            ShiftHours: propertyData.ShiftHours || 0,
            TotalWorkingDays: propertyData.TotalWorkingDays || 0,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            ShiftHours: 0,
            TotalWorkingDays: 0,
          }));
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load salary groups.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, reduxClientId]);

  // -------------------- SECTION 2 --------------------
  // helper: normalize names
  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  // get percentage for an item: property -> global -> fallback to item.Value
  const getPercentageForItem = (item) => {
    if (!item) return 0;
    const name = normalize(item.Name);

    // 1) property-level match
    const prop = percentageRules.property.find(
      (p) => normalize(p.AD_Name) === name
    );
    if (prop && prop.Percentage != null) return Number(prop.Percentage);

    // 2) global
    const glob = percentageRules.global.find(
      (p) => normalize(p.AD_Name) === name
    );
    if (glob && glob.Percentage != null) return Number(glob.Percentage);

    // 3) fallback to user-entered value
    const val = Number(item.Value || item.defaultValue || 0);
    return isNaN(val) ? 0 : val;
  };

  // recalc amounts honoring Fx, #, and %
  const recalculateAmounts = (items, _, baseSalary) => {
    if (!items || items.length === 0) return [];

    const sorted = [...items].sort((a, b) => {
      const aRefs = a.Formula ? countDependencies(a.Formula, items) : 0;
      const bRefs = b.Formula ? countDependencies(b.Formula, items) : 0;
      return aRefs - bRefs;
    });

    const knownValues = {};
    const output = [];

    for (const item of sorted) {
      let amount = 0;

      if (item.isFx && item.Formula) {
        amount = calculateAmount(item, baseSalary, knownValues);
      } else if (item.Mode === "%") {
        const pct = getPercentageForItem(item);
        amount = (pct / 100) * baseSalary;
      } else if (item.Mode === "#") {
        amount = Number(item.Value || 0);
      }

      knownValues[item.Name] = amount;

      output.push({ ...item, CalculatedAmount: amount });
    }

    return output;
  };

  // -------------------- SECTION 3 --------------------
  const openCreateDialog = () => {
    setFormData({
      ...formData,
      ID: 0,
      SalaryGroup_ID: 0,
      SalaryGroup: "",
      BaseSalary: "",
      AllowancesDeductions: [],
    });
    setSelectedAllowancesDeductions([]);
    setEditId(null);
    setIsViewMode(false);
    setSelectedType("Allowance");
    setDialogVisible(true);
  };

  const openEditDialog = (item) => {
    const initialAllowances = (item.AllowancesDeductions || []).map((ad) => {
      const rawFormula = normalizeFormula(ad.Formula);

      let mode = "%";
      let value = "";
      let isFx = false;

      if (rawFormula) {
        // Detect if formula is simple percent: "Base * x"
        const simpleMatch = rawFormula.match(/^Base\s*\*\s*(\d+(\.\d+)?)$/i);

        if (simpleMatch) {
          // This is a simple percent formula
          const decimal = parseFloat(simpleMatch[1]);
          value = (decimal * 100).toString();
          mode = "%";
        } else {
          // This is a real FX formula
          isFx = true;
          mode = "Fx";
          value = rawFormula;
        }
      } else if (ad.FixedAmount > 0) {
        // Fixed Amount Mode
        mode = "#";
        value = ad.FixedAmount.toString();
      } else {
        // NO formula, fallback to percentage rules
        const percent = getPercentageForItem(ad);
        value = percent ? percent.toString() : "";
        mode = "%";
      }

      return {
        ...ad,
        ID: ad.AD_Id || ad.ID,
        Mode: mode,
        Value: value,
        Formula: rawFormula,
        isFx: isFx,
        CalculatedAmount: ad.CalculatedAmount || 0,
      };
    });

    setFormData({
      ...item,
      BaseSalary: item.BaseSalary?.toString() || "",
      TotalWorkingDays: item.TotalWorkingDays || 0,
      ShiftHours: item.ShiftHours || 0,
    });

    // ---------------- PATCHED: Auto-select dependencies for Fx items ----------------
    // We'll add dependency items (like HRA) into selectedAllowancesDeductions so they become checked.
    (async () => {
      try {
        const masterList = alDtOptions || []; // master AD list from state
        let finalList = [...initialAllowances];

        // For each Fx item in initial list, find referenced AD names and ensure those ADs are added
        initialAllowances.forEach((adItem) => {
          if (adItem.isFx && adItem.Formula) {
            const deps = extractDependencies(adItem.Formula, masterList);

            deps.forEach((depName) => {
              // ignore 'Base' as it's base salary, not an AD entry
              if (/^base$/i.test(depName)) return;

              const depItem = masterList.find((m) => m.Name === depName);
              const depFormula = normalizeFormula(depItem.Formula);
              if (depItem && !finalList.some((x) => x.ID === depItem.ID)) {
                finalList.push({
                  ...depItem,
                  ID: depItem.AD_Id || depItem.ID,
                  Mode: "%", // default to percentage (user can change)
                  Value: getPercentageForItem(depItem)?.toString() || "",
                  Formula: depFormula,
                  isFx: !!depFormula, // if master has its own formula
                  CalculatedAmount: depItem.CalculatedAmount || 0,
                });
              }
            });
          }
        });

        // Recalculate amounts with form BaseSalary
        const newBase = Number(item.BaseSalary || 0);
        const recalced = recalculateAmounts(finalList, 0, newBase);

        setSelectedAllowancesDeductions(recalced);
      } catch (e) {
        console.error("Error auto-selecting dependencies:", e);
        setSelectedAllowancesDeductions(initialAllowances);
      }
    })();
    // ---------------- END PATCH ----------------

    setEditId(item.SalaryGroup_ID);
    setIsViewMode(false);
    setDialogVisible(true);
  };

  const openViewDialog = (item) => {
    const initialAllowances = (item.AllowancesDeductions || []).map((ad) => {
      const rawFormula = normalizeFormula(ad.Formula);

      let mode = "%";
      let value = "";
      let isFx = false;

      if (rawFormula) {
        const simpleMatch = rawFormula.match(/^Base\s*\*\s*(\d+(\.\d+)?)$/i);
        if (simpleMatch) {
          const decimal = parseFloat(simpleMatch[1]);
          value = (decimal * 100).toString();
          mode = "%";
        } else {
          isFx = true;
          mode = "Fx";
          value = "";
        }
      } else if (ad.FixedAmount > 0) {
        mode = "#";
        value = ad.FixedAmount.toString();
      } else {
        const percent = getPercentageForItem(ad);
        value = percent ? percent.toString() : "";
      }

      return {
        ...ad,
        ID: ad.AD_Id || ad.ID,
        Mode: mode,
        Value: value,
        Formula: rawFormula,
        isFx,
        CalculatedAmount: ad.CalculatedAmount || 0,
      };
    });

    // ---------------- PATCHED: Auto-select dependencies for Fx items in view mode as well ----------------
    (async () => {
      try {
        const masterList = alDtOptions || [];
        let finalList = [...initialAllowances];

        initialAllowances.forEach((adItem) => {
          if (adItem.isFx && adItem.Formula) {
            const deps = extractDependencies(adItem.Formula, masterList);

            deps.forEach((depName) => {
              if (/^base$/i.test(depName)) return;
              const depItem = masterList.find((m) => m.Name === depName);
              if (depItem && !finalList.some((x) => x.ID === depItem.ID)) {
                finalList.push({
                  ...depItem,
                  ID: depItem.AD_Id || depItem.ID,
                  Mode: "%",
                  Value: getPercentageForItem(depItem)?.toString() || "",
                  Formula: depItem.Formula || "",
                  isFx: !!depItem.Formula,
                  CalculatedAmount: depItem.CalculatedAmount || 0,
                });
              }
            });
          }
        });

        const newBase = Number(item.BaseSalary || 0);
        const recalced = recalculateAmounts(finalList, 0, newBase);

        setSelectedAllowancesDeductions(recalced);
      } catch (e) {
        console.error("Error auto-selecting dependencies in view:", e);
        setSelectedAllowancesDeductions(initialAllowances);
      }
    })();
    // ---------------- END PATCH ----------------

    setFormData({
      ...item,
      BaseSalary: item.BaseSalary ? item.BaseSalary.toString() : "",
      TotalWorkingDays: item.TotalWorkingDays || 0,
      ShiftHours: item.ShiftHours || 0,
    });

    setIsViewMode(true);
    setDialogVisible(true);
  };

  // handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "BaseSalary") {
      const newBase = Number(value);
      setSelectedAllowancesDeductions((prev) =>
        recalculateAmounts(prev, 0, newBase)
      );
    }
  };

  const handleDeleteAlDtItem = (id) =>
    setSelectedAllowancesDeductions((prev) =>
      prev.filter((item) => item.ID !== id)
    );

  const handleSave = async () => {
    const baseSalaryNum = Number(formData.BaseSalary);

    const model = {
      SalaryGroup_ID: editId || 0,
      SalaryGroup: formData.SalaryGroup.trim(),
      BaseSalary: baseSalaryNum,
      Property_ID: Number(propertyId),
      CreatedBy: 1,
      UpdatedBy: 1,
      TotalWorkingDays: Number(formData.TotalWorkingDays),
      ShiftHours: Number(formData.ShiftHours),

      AllowancesDeductions: selectedAllowancesDeductions.map((item) => {
        let Formula = item.Formula || "";
        let FixedAmount = 0;
        let CalculatedAmount = item.CalculatedAmount || 0;

        if (item.isFx && item.Formula) {
          // Keep exact formula
          Formula = item.Formula;
        } else if (item.Mode === "%") {
          const finalPercent = getPercentageForItem(item);
          const decimal = (finalPercent / 100).toFixed(2);
          Formula = `Base * ${decimal}`;
          CalculatedAmount = Number(
            ((finalPercent / 100) * baseSalaryNum).toFixed(2)
          );
        } else if (item.Mode === "#") {
          FixedAmount = Number(item.Value || 0);
          CalculatedAmount = FixedAmount;
          Formula = "";
        }

        return {
          AD_Id: item.ID,
          Name: item.Name.trim(),
          Type: item.Type,
          Formula,
          FixedAmount,
          CalculatedAmount,
          FormulaId: item.FormulaId || 0,
        };
      }),
    };

    try {
      if (editId) await updateSalaryAllowance(editId, model);
      else await createSalaryAllowance(model);

      alert("Saved successfully!");
      setDialogVisible(false);

      if (Number(propertyId) > 0) await getSalaryAllowancesByProperty(Number(propertyId)).then(setData);
      else if (Number(reduxClientId) > 0) await getSalaryAllowancesByClient(Number(reduxClientId)).then(setData);
    } catch (err) {
      alert("Failed to save salary group");
    }
  };

  // renderRow
  const allowances = selectedAllowancesDeductions.filter(
    (item) => item.Type === "A" || item.Type === "OA"
  );
  const deductions = selectedAllowancesDeductions.filter(
    (item) => item.Type === "D"
  );
  const maxRows = Math.max(allowances.length, deductions.length);
  const filteredData = data.filter(
    (item) =>
      item.SalaryGroup &&
      item.SalaryGroup.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDelete = async (salaryGroupId) => {
    if (window.confirm("Are you sure you want to delete this salary group?")) {
      try {
        await deleteSalaryAllowance(salaryGroupId);
        alert("Deleted successfully!");
        if (Number(propertyId) > 0) await getSalaryAllowancesByProperty(Number(propertyId)).then(setData);
        else if (Number(reduxClientId) > 0) await getSalaryAllowancesByClient(Number(reduxClientId)).then(setData);
      } catch {
        alert("Failed to delete salary group.");
      }
    }
  };

  const renderRow = (opt) => {
    const row = selectedAllowancesDeductions.find((x) => x.ID === opt.ID);
    const isChecked = !!row;
    const mode = row?.Mode || "%";
    const val = row?.Value || "";

    let calc = "";

    if (normalizeFormula(row?.Formula) && row?.isFx) {
      calc = Number(row.CalculatedAmount || 0).toFixed(2);
    } else if (mode === "%") {
      const pct = getPercentageForItem(row || opt);
      calc = ((pct / 100) * Number(formData.BaseSalary || 0)).toFixed(2);
    } else if (mode === "#") {
      calc = val;
    }

    return (
      <div key={opt.ID} className="ad-row">
        {/* CHECKBOX */}
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isViewMode}
          onClick={(e) => {
            // If already checked and has a formula, prevent unchecking
            if (isChecked && row?.isFx) {
              e.preventDefault();
              console.log('Prevented uncheck of Fx item:', opt.Name);
              return;
            }
          }}
          onChange={(e) => {
            const willBeChecked = e.target.checked;

            console.log('Checkbox onChange:', {
              name: opt.Name,
              willBeChecked,
              isChecked,
              rowExists: !!row,
              rowData: row
            });

            if (willBeChecked) {
              // If already checked, do nothing
              if (isChecked) {
                console.log('Already checked, ignoring');
                return;
              }

              console.log('Adding new item:', opt.Name);

              // New Item being selected
              const rawFormula = normalizeFormula(opt.Formula);
              const newItem = {
                ...opt,
                Mode: rawFormula ? "Fx" : "%",
                Formula: rawFormula,
                Value: rawFormula ? "" : getPercentageForItem(opt).toString(),
                isFx: !!rawFormula,
                CalculatedAmount: opt.CalculatedAmount || 0,
              };

              // ---------------- PATCH: auto-select dependencies when selecting an Fx item ----------------
              setSelectedAllowancesDeductions((prev) => {
                // clone prev to mutate safely
                const next = [...prev];

                // Add the item itself if not present
                if (!next.some(x => x.ID === newItem.ID)) {
                  next.push(newItem);
                }

                // If it's an Fx item, find dependencies and add them
                if (newItem.isFx && newItem.Formula) {
                  const deps = extractDependencies(newItem.Formula, alDtOptions);

                  deps.forEach((depName) => {
                    // ignore base placeholder
                    if (/^base$/i.test(depName)) return;

                    const depItem = alDtOptions.find((m) => m.Name === depName);
                    if (depItem && !next.some((x) => x.ID === depItem.ID)) {
                      next.push({
                        ...depItem,
                        ID: depItem.AD_Id || depItem.ID,
                        Mode: "%", // default to %
                        Value: getPercentageForItem(depItem)?.toString() || "",
                        Formula: depItem.Formula || "",
                        isFx: !!depItem.Formula,
                        CalculatedAmount: depItem.CalculatedAmount || 0,
                      });
                    }
                  });
                }

                // Recalculate with current base salary
                return recalculateAmounts(next, 0, Number(formData.BaseSalary));
              });
              // ---------------- END PATCH ----------------
            } else {
              console.log('Unchecking item:', opt.Name);
              // Unchecking - remove from list
              handleDeleteAlDtItem(opt.ID);
            }
          }}
        />
        {/* NAME */}
        <div className="ad-name">{opt.Name}</div>

        {/* MODE SELECT */}
        <div className="ad-mode">
          {row?.isFx ? (
            <div className="fx-mode-box">Fx</div>
          ) : (
            <select
              disabled={!isChecked}
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value;

                setSelectedAllowancesDeductions((prev) => {
                  const updated = prev.map((item) => {
                    if (item.ID !== opt.ID) return item;

                    if (item.isFx) {
                      return { ...item, Mode: "Fx" }; // Lock if Fx
                    }

                    return {
                      ...item,
                      Mode: newMode,
                      Formula: "", // Clear formula for mode change
                      isFx: false,
                      Value:
                        newMode === "%"
                          ? getPercentageForItem(item).toString()
                          : "",
                    };
                  });

                  return recalculateAmounts(updated, 0, Number(formData.BaseSalary));
                });
              }}
            >
              <option value="%">%</option>
              <option value="#">#</option>
            </select>
          )}
        </div>

        {/* VALUE INPUT */}
        <input
          type="number"
          disabled={!isChecked || row?.isFx}
          value={val}
          onChange={(e) => {
            const raw = e.target.value;

            setSelectedAllowancesDeductions((prev) => {
              const updated = prev.map((item) =>
                item.ID === opt.ID ? { ...item, Value: raw } : item
              );
              return recalculateAmounts(updated, 0, Number(formData.BaseSalary));
            });
          }}
        />

        {/* CALCULATED */}
        <input readOnly className="calc-box" value={isChecked ? calc : ""} />

        {/* FX BUTTON */}
        <button
          type="button"
          className={`btn ${row?.isFx ? "btn-primary" : "btn-outline-secondary"
            }`}
          disabled={!isChecked}
          onClick={() => openFxFor(row || opt)}
        >
          FX
        </button>
      </div>
    );
  };

  // -------------------- SECTION 4 --------------------

  // dialog footers
  const viewFooter = (
    <button
      className="btn btn-secondary"
      onClick={() => setDialogVisible(false)}
    >
      Close
    </button>
  );
  const editFooter = (
    <>
      <button
        className="btn btn-secondary me-2"
        onClick={() => setDialogVisible(false)}
        type="button"
      >
        Cancel
      </button>
      <button
        className="btn btn-primary"
        onClick={handleSave}
        type="submit"
        disabled={!canCreate}
      >
        Save
      </button>
    </>
  );

  return (
    <div
      className="content-wrapper"
      style={{ minHeight: "100vh", padding: 30 }}
    >
      <div
        className="card"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            fontWeight: "bold",
            marginLeft: 28,
            marginTop: 12,
            fontSize: "2.2rem",
          }}
        >
          Salary Groups
        </h2>
        <div
          className="d-flex justify-content-between align-items-center"
          style={{ padding: "12px 28px 16px 28px" }}
        >
          <div style={{ flex: 1 }} />
          <input
            type="text"
            className="form-control"
            style={{
              maxWidth: 220,
              marginRight: 15,
              background: "#f8fafc",
              fontSize: 16,
            }}
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            className="btn"
            style={{
              background: "#198754",
              color: "white",
              fontWeight: 500,
              fontSize: 18,
              padding: "7px 25px",
            }}
            onClick={openCreateDialog}
          >
            Create New
          </button>
        </div>

        <div className="table-responsive px-3 pb-4">
          {loading ? (
            <div style={{ textAlign: "center", padding: 20 }}>Loading...</div>
          ) : (
            <table className="table mb-0" style={{ minWidth: 650 }}>
              <thead>
                <tr>
                  <th style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    Salary Group Name
                  </th>
                  <th style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    Base Salary
                  </th>
                  <th style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-muted py-4"
                      style={{ fontSize: "1.05rem" }}
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.SalaryGroup_ID}>
                      <td style={{ verticalAlign: "middle" }}>
                        {item.SalaryGroup}
                      </td>
                      <td style={{ verticalAlign: "middle" }}>
                        ₹ {(Number(item.BaseSalary) || 0).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          title="Edit"
                          onClick={() => openEditDialog(item)}
                        >
                          <i className="fa fa-pencil" aria-hidden="true" />
                        </button>
                        <button
                          className="btn btn-sm btn-info me-2"
                          title="View"
                          onClick={() => openViewDialog(item)}
                        >
                          <i className="fa fa-eye" aria-hidden="true" />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          title="Delete"
                          onClick={() => handleDelete(item.SalaryGroup_ID)}
                        >
                          <i className="fa fa-trash" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog
        header={
          isViewMode
            ? "View Salary Group"
            : editId
              ? "Edit Salary Group"
              : "Create Salary Group"
        }
        visible={dialogVisible}
        style={{ width: "95vw", height: "95vh", maxWidth: "1500px" }}
        modal
        onHide={() => setDialogVisible(false)}
        footer={isViewMode ? viewFooter : editFooter}
        draggable={false}
        resizable={false}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isViewMode) handleSave();
          }}
        >
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Total Working Days</label>
              <input
                type="number"
                step="0.01"
                name="TotalWorkingDays"
                className="form-control"
                value={formData.TotalWorkingDays || ""}
                onChange={handleFormChange}
                placeholder="Total working days"
                disabled={isViewMode}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Shift Hours</label>
              <input
                type="number"
                step="0.01"
                name="ShiftHours"
                className="form-control"
                value={formData.ShiftHours || ""}
                onChange={handleFormChange}
                placeholder="Shift hours"
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Salary Group Name */}
          <div className="mb-3">
            <label className="form-label">Salary Group Name</label>
            <input
              type="text"
              name="SalaryGroup"
              className="form-control"
              value={formData.SalaryGroup}
              onChange={handleFormChange}
              placeholder="Enter salary group name"
              required
              disabled={isViewMode}
            />
          </div>

          {/* Base Salary */}
          <div className="mb-3">
            <label className="form-label">Base Salary</label>
            <input
              type="number"
              name="BaseSalary"
              className="form-control"
              value={formData.BaseSalary}
              onChange={handleFormChange}
              placeholder="Enter base salary"
              min="0"
              step="0.01"
              required
              disabled={isViewMode}
            />
          </div>

          {/* VIEW MODE TABLE */}
          {isViewMode && (
            <div className="table-responsive mt-3">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Allowance</th>
                    <th style={{ textAlign: "center" }}>Amount</th>
                    <th style={{ textAlign: "center" }}>Deduction</th>
                    <th style={{ textAlign: "center" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(maxRows)].map((_, idx) => {
                    const allow = allowances[idx];
                    const deduct = deductions[idx];

                    return (
                      <tr key={idx}>
                        <td>
                          {allow ? (
                            <>
                              <div>{allow.Name}</div>
                              {normalizeFormula(allow.Formula) && <div style={{ fontSize: "12px", color: "#6c757d" }}>({normalizeFormula(allow.Formula)})</div>}
                            </>
                          ) : (
                            ""
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          {allow ? Number(allow.FixedAmount > 0 ? allow.FixedAmount : allow.CalculatedAmount).toFixed(2) : ""}
                        </td>

                        <td>
                          {deduct ? (
                            <>
                              <div>{deduct.Name}</div>
                              {deduct.Formula && <div style={{ fontSize: "12px", color: "#6c757d" }}>({deduct.Formula})</div>}
                            </>
                          ) : (
                            ""
                          )}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          {deduct ? Number(deduct.FixedAmount > 0 ? deduct.FixedAmount : deduct.CalculatedAmount).toFixed(2) : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SIDE-BY-SIDE ALLOWANCE + DEDUCTION */}
          {!isViewMode && (
            <div className="row" style={{ marginTop: "10px" }}>
              {/* ALLOWANCE LIST */}
              <div className="col-6">
                <h5 style={{ fontWeight: 600 }}>Allowances</h5>
                <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "8px", maxHeight: "60vh", overflowY: "auto" }}>
                  {alDtOptions.filter((opt) => opt.Type === "A" || opt.Type === "OA").map((opt) => renderRow(opt))}
                </div>
              </div>

              {/* DEDUCTION LIST */}
              <div className="col-6">
                <h5 style={{ fontWeight: 600 }}>Deductions</h5>
                <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "8px", maxHeight: "60vh", overflowY: "auto" }}>
                  {alDtOptions.filter((opt) => opt.Type === "D").map((opt) => renderRow(opt))}
                </div>
              </div>
            </div>
          )}
        </form>

        <Formulaone
          visible={fxVisible}
          onClose={() => setFxVisible(false)}
          title={fxTitle}
          baseSalary={Number(formData.BaseSalary || 0)}
          items={fxAvailableItems}
          onApply={(res) => {
            setSelectedAllowancesDeductions((prev) =>
              prev.map((it) =>
                it.ID === fxTargetItem.ID
                  ? {
                    ...it,
                    Formula: res.formulaString,
                    CalculatedAmount: res.calculatedAmount,
                    Mode: "Fx",
                    Value: "",
                    FixedAmount: 0,
                    isFx: true,
                  }
                  : it
              )
            );
            setFxVisible(false);
          }}
        />
      </Dialog>

      <CustomFormulaDialog
        visible={customFormulaVisible}
        onHide={() => setCustomFormulaVisible(false)}
        targetItem={customFormulaTarget}
        items={fxAvailableItems}
        baseSalary={Number(formData.BaseSalary || 0)}
        onSave={(newFormula, calculatedAmount) => {
          setSelectedAllowancesDeductions((prev) =>
            prev.map((it) =>
              it.ID === customFormulaTarget.ID
                ? { ...it, Formula: normalizeFormula(newFormula), CalculatedAmount: calculatedAmount, isFx: true, Mode: "Fx", Value: "" }
                : it
            )
          );
          setCustomFormulaVisible(false);
        }}
      />
    </div>
  );
}
