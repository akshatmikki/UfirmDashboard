import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getSalaryAllowancesByProperties,
  getAllowancesDeductions,
  createSalaryAllowance,
  updateSalaryAllowance,
  getADPercentages,
} from "../../Services/PayrollService";
// import { getPropertyById } from "../../Services/PropertyService";
import { getEmployeesByOffice } from "../../Services/PayrollService";
import {
  getAllClients,
  getClientByPropertyId,
  getPropertiesByClientId,
  deleteSalaryGroup,
} from "../../Services/ClientService";

export default function SGNEW() {
  const propertyId = useSelector((state) => state.Commonreducer.puidn);
  const reduxClientId = useSelector((state) => state.Commonreducer.companyid);

  const [salaryGroups, setSalaryGroups] = useState([]);
  const [adList, setAdList] = useState([]);
  const [adPercentages, setAdPercentages] = useState([]);
  const [activeDeduction, setActiveDeduction] = useState(null);
  const [allowanceAmounts, setAllowanceAmounts] = useState({});
  const [deductionAmounts, setDeductionAmounts] = useState({});
  const [deductionAllowanceMap, setDeductionAllowanceMap] = useState({});
  const [allowanceSelected, setAllowanceSelected] = useState({});
  const [selectedSG, setSelectedSG] = useState("");
  const [previewSG, setPreviewSG] = useState(null);
  const [odDoubleFlags, setOdDoubleFlags] = useState({});
  const [multiplyValues, setMultiplyValues] = useState({});
  const [adValueType, setAdValueType] = useState({});
  const [editablePercentages, setEditablePercentages] = useState({});
  const [adFormula, setAdFormula] = useState({});
  const [designation, setDesignation] = useState("");
  const [excludeEmployees, setExcludeEmployees] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [excludedEmployeeIds, setExcludedEmployeeIds] = useState([]);
  const [designationTouched, setDesignationTouched] = useState(false);
  const [pfLimit, setPfLimit] = useState("");
  const [esiLimit, setEsiLimit] = useState("");
  const [perDayOD, setPerDayOD] = useState({});
  const [activeStatutory, setActiveStatutory] = useState({
    PF: false,
    ESI: false,
  });
  const [otBaseType, setOtBaseType] = useState("Base");
  const isLoadingSG = React.useRef(false);
  const [unitList, setUnitList] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [otStandalone, setOtStandalone] = useState(false);

  const [form, setForm] = useState({
    salaryGroupName: "",
    baseSalary: "",
    totalWorkingDays: "0",
    shiftHours: "0",
    salaryCycleFrom: "0",
    salaryCycleTo: "0",
    monthlySundays: "0",
    excludeSunday: false,
    monthDays: "0"
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        // ✅ CASE 1: Property selected from navbar
        if (Number(propertyId) > 0) {
          const res = await getClientByPropertyId(propertyId);
          setUnitList(res ? [res] : []);
          setSelectedUnitId(res?.ClientID || null);
          setSelectedPropertyId([Number(propertyId)]);
          return;
        }

        // ✅ CASE 2: Client selected from navbar
        if (Number(reduxClientId) > 0) {
          const res = await getAllClients();
          setUnitList(res || []);
          setSelectedUnitId(Number(reduxClientId));
          return;
        }

        // ❌ CASE 3: NOTHING selected (THIS WAS YOUR BUG)
        const res = await getAllClients();
        setUnitList(res || []);

        // 🔥 HARD RESET (MISSING PIECE)
        setSelectedUnitId(null);
        setSelectedPropertyId([]);
        setPropertyList([]);
        setSalaryGroups([]);

      } catch (err) {
        console.log("Failed to load units", err);
      }
    };

    loadUnits();
  }, [propertyId, reduxClientId]);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        if (!selectedUnitId) {
          setPropertyList([]);
          setSelectedPropertyId([]);
          return;
        }

        setSelectedPropertyId([]);

        const res = await getPropertiesByClientId(selectedUnitId);
        const list = res || [];

        setPropertyList(list);

        // 🔥 FIX: Preserve navbar-selected property
        setSelectedPropertyId((prev) => {
          // If already selected (from navbar), keep it
          if (prev && prev.length > 0) return prev;

          // Auto-select only if single property
          if (list.length === 1) {
            return [list[0].PropertyId];
          }

          return [];
        });

      } catch (err) {
        console.log("Failed to load properties by unit", err);
      }
    };

    loadProperties();
  }, [selectedUnitId]);

  useEffect(() => {
    if (!selectedPropertyId || selectedPropertyId.length === 0) {
      setSalaryGroups([]);
      return;
    }

    loadSG(selectedPropertyId);
  }, [selectedPropertyId]);

  useEffect(() => {
    loadAD(); // GLOBAL – always load
    loadADPercentages();
  }, []);

  useEffect(() => {
    const close = () => setShowPropertyDropdown(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!activeStatutory.PF) return;
    if (adValueType.PF !== "PERCENT") return;

    const percent =
      Number(editablePercentages.PF) ||
      getEffectivePercentage("PF")?.Percentage ||
      0;

    if (!percent) return;

    let baseAmount = 0;
    let formulaParts = [];

    if (deductionAllowanceMap.PF?.BaseSalary) {
      baseAmount += Number(form.baseSalary) || 0;
      formulaParts.push("Base");
    }

    Object.entries(deductionAllowanceMap.PF || {}).forEach(([k, v]) => {
      if (k !== "BaseSalary" && v) {
        baseAmount += Number(allowanceAmounts[k]) || 0;
        formulaParts.push(k);
      }
    });

    if (!baseAmount) return;

    const amount = Math.round(baseAmount * (percent / 100));

    setDeductionAmounts((prev) => ({
      ...prev,
      PF: amount,
    }));

    setAdFormula((prev) => ({
      ...prev,
      PF:
        formulaParts.length > 1
          ? `(${formulaParts.join(" + ")}) * ${percent / 100}`
          : `${formulaParts[0]} * ${percent / 100}`,
    }));
  }, [
    activeStatutory.PF,
    adValueType.PF,
    editablePercentages.PF,
    deductionAllowanceMap.PF,
    form.baseSalary,
    allowanceAmounts.HRA,
  ]);

  useEffect(() => {
    if (!activeStatutory.ESI) return;
    if (adValueType.ESI !== "PERCENT") return;

    const percent =
      Number(editablePercentages.ESI) ||
      getEffectivePercentage("ESI")?.Percentage ||
      0;

    if (!percent) return;

    let baseAmount = 0;
    let formulaParts = [];

    if (deductionAllowanceMap.ESI?.BaseSalary) {
      baseAmount += Number(form.baseSalary) || 0;
      formulaParts.push("Base");
    }

    Object.entries(deductionAllowanceMap.ESI || {}).forEach(([k, v]) => {
      if (k !== "BaseSalary" && v) {
        baseAmount += Number(allowanceAmounts[k]) || 0;
        formulaParts.push(k);
      }
    });

    if (!baseAmount) return;

    const amount = Math.round(baseAmount * (percent / 100));

    setDeductionAmounts((prev) => ({
      ...prev,
      ESI: amount,
    }));

    setAdFormula((prev) => ({
      ...prev,
      ESI:
        formulaParts.length > 1
          ? `(${formulaParts.join(" + ")}) * ${percent / 100}`
          : `${formulaParts[0]} * ${percent / 100}`,
    }));
  }, [
    activeStatutory.ESI,
    adValueType.ESI,
    editablePercentages.ESI,
    deductionAllowanceMap.ESI,
    form.baseSalary,
    allowanceAmounts,
  ]);

  useEffect(() => {
    if (!selectedPropertyId || selectedPropertyId.length === 0) return;

    // 🔥 FULL HARD RESET ON UNIT CHANGE
    setSelectedSG("");
    setDesignation("");
    setExcludeEmployees(false);
    setExcludedEmployeeIds([]);

    // 🔥 CLEAR ALL MONEY + MODE STATE (THIS WAS MISSING)
    setAllowanceAmounts({});
    setDeductionAmounts({});
    setAdValueType({});
    setEditablePercentages({});
    setAdFormula({});
    setActiveDeduction(null);

    // 🔥 RESET FORM
    setForm((prev) => ({
      salaryGroupName: "",
      baseSalary: "",
      totalWorkingDays: prev.totalWorkingDays,
      shiftHours: prev.shiftHours,
      salaryCycleFrom: prev.salaryCycleFrom,
      salaryCycleTo: prev.salaryCycleTo,
      monthDays: "0",
      monthlySundays: "0",
      excludeSunday: false,
    }));
  }, [selectedUnitId]);

  useEffect(() => {
    if (!activeDeduction) return;

    // 🚫 DO NOT TOUCH PF / ESI HERE
    if (activeDeduction === "PF" || activeDeduction === "ESI") return;

    setAllowanceSelected({
      BaseSalary: true,
      ...(deductionAllowanceMap[activeDeduction] || {}),
    });
  }, [activeDeduction, deductionAllowanceMap]);

  useEffect(() => {
    if (!selectedSG) return;
    if (!salaryGroups.length || !adList.length) return;

    const sg = salaryGroups.find((s) => s.SalaryGroup === selectedSG);
    if (!sg) return;

    let newDeductions = {};

    sg.AllowancesDeductions.forEach((ad) => {
      if ((ad.Type === "D" || ad.Type === "OD") && ad.FixedAmount > 0) {
        newDeductions[ad.Name] = ad.FixedAmount;
      }
      if (ad.CalculatedAmount > 0) {
        newDeductions[ad.Name] = ad.CalculatedAmount;
      }
    });

    setDeductionAmounts(newDeductions);
  }, [adList, selectedSG]);

  useEffect(() => {
    if (isLoadingSG.current) return;
    const base = Number(form.baseSalary) || 0;
    if (!base) return;

    let newAllowanceAmounts = {};
    let newFormulas = {};

    allowances.concat(otherAllowances).forEach((a) => {
      const name = a.Name;

      if (adValueType[name] !== "PERCENT") return;

      const percentObj = getEffectivePercentage(name);
      if (!percentObj) return;

      const percentage = percentObj.Percentage;
      const amount = Math.round(base * (percentage / 100));

      newAllowanceAmounts[name] = amount;
      newFormulas[name] = `Base * ${percentage / 100}`;
    });

    if (isLoadingSG.current) {
      setAllowanceAmounts(newAllowanceAmounts);
    } else {
      setAllowanceAmounts((prev) => ({ ...prev, ...newAllowanceAmounts }));
    }

    setAdFormula((prev) => ({ ...prev, ...newFormulas }));
  }, [form.baseSalary, adValueType, adPercentages]);

  useEffect(() => {
    if (!selectedUnitId) {
      setEmployees([]);
      setDesignations([]);
      return;
    }

    if (!selectedPropertyId || selectedPropertyId.length === 0) return;

    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);

        const allResults = await Promise.all(
          selectedPropertyId.map((pid) => getEmployeesByOffice(pid)),
        );

        const mergedEmployees = allResults.flat().filter(Boolean);
        setEmployees(mergedEmployees);

        const uniqueDesignations = [
          ...new Set(
            mergedEmployees
              .map((e) => e.Designation || e.Profile?.Designation)
              .filter(Boolean),
          ),
        ];

        setDesignations(uniqueDesignations);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [selectedUnitId, selectedPropertyId]);

  const getEffectivePercentage = (adName) => {
    if (!adPercentages.length) return null;

    const propertyIds = Array.isArray(selectedPropertyId)
      ? selectedPropertyId
      : [];

    for (const pid of propertyIds) {
      const match = adPercentages.find(
        (p) =>
          p.AD_Name === adName &&
          Number(p.PropertyId) === Number(pid) &&
          p.IsGlobal === false &&
          p.IsActive,
      );

      if (match) return match;
    }

    return (
      adPercentages.find(
        (p) => p.AD_Name === adName && p.IsGlobal && p.IsActive,
      ) || null
    );
  };

  const buildADModel = () => {
    let list = [];

    adList.forEach((item) => {
      const name = item.Name;

      // 🔥 Special case: OTAmount must bypass zero amount filtering
      if (name === "OTAmount") {

        // 🔥 NEW FEATURE — OT standalone mode
        if (otStandalone) {
          list.push({
            AD_Id: item.ID,
            Name: name,
            Type: item.Type,
            FixedAmount: 0,
            CalculatedAmount: 0,
            Formula: null,
            FormulaId: null,

            IsDouble: !!odDoubleFlags[name],
            MultiplyValue: odDoubleFlags[name]
              ? Number(multiplyValues[name]) || 0
              : 0,

            Isbasic: otBaseType === "Base",
            Perday: false,
          });

          return;
        }

        const isUsedInPF = !!deductionAllowanceMap.PF?.OTAmount;
        const isUsedInESI = !!deductionAllowanceMap.ESI?.OTAmount;
        const isSelected = !!allowanceSelected[name];

        if (!isUsedInPF && !isUsedInESI && !isSelected) {
          return; // ❌ DO NOT SEND OTAmount
        }

        list.push({
          AD_Id: item.ID,
          Name: name,
          Type: item.Type,
          FixedAmount: 0,
          CalculatedAmount: 0,
          Formula: null,
          FormulaId: null,

          IsDouble: !!odDoubleFlags[name],
          MultiplyValue: odDoubleFlags[name]
            ? Number(multiplyValues[name]) || 0
            : 0,

          Isbasic: otBaseType === "Base",
          Perday: false,
        });

        return;
      }

      let fixed = 0;
      let calculated = 0;

      // ✅ ALLOWANCES & OA (FIXED OR PERCENT)
      if (item.Type === "A" || item.Type === "OA") {
        const amount = Number(allowanceAmounts[name]) || 0;
        if (amount <= 0) return;

        if (adValueType[name] === "PERCENT") {
          calculated = amount;
          fixed = 0;
        } else {
          // 🔥 DEFAULT TO FIXED
          fixed = amount;
          calculated = 0;
        }
      }

      // ✅ DEDUCTIONS & OD
      if (item.Type === "D" || item.Type === "OD") {
        if (adValueType[name] === "FIXED") {
          fixed = deductionAmounts[name] || 0;
        } else {
          calculated = deductionAmounts[name] || 0;
        }
      }

      // Allowances (A, OA) should ALWAYS be included if fixed amount > 0
      // ✅ ALLOWANCES & OA inclusion rule
      if (item.Type === "A" || item.Type === "OA") {
        if (adValueType[name] === "FIXED" && fixed === 0) return;
        if (adValueType[name] === "PERCENT" && calculated === 0) return;
      } else {
        // DEDUCTIONS & OD
        if (adValueType[name] === "FIXED") {
          fixed = Number(deductionAmounts[name]) || 0;
          if (fixed <= 0) return; // ❗ don’t send zero junk
          calculated = 0;
        } else {
          // percentage-based deduction
          if (calculated <= 0) return;
          calculated = Number(deductionAmounts[name]) || 0;
          if (calculated <= 0) return;
        }
      }

      list.push({
        AD_Id: item.ID,
        Name: name,
        Type: item.Type,
        FixedAmount: fixed,
        CalculatedAmount: calculated,
        Formula: adValueType[name] === "FIXED" ? null : adFormula[name] || null,
        FormulaId: null,

        IsDouble: odDoubleFlags[name] || false,

        MultiplyValue: odDoubleFlags[name]
          ? Number(multiplyValues[name]) || 0
          : 0,

        Isbasic: false, // only OT uses Isbasic=true

        Perday:
          item.Type === "OD" &&
            (name === "Food" || name === "Accommodation" || name === "Uniform")
            ? !!perDayOD[name]
            : false,
      });
    });

    return list;
  };

  const handleAllowanceAmount = (name, value) => {
    setAllowanceAmounts((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const loadADPercentages = async () => {
    try {
      const res = await getADPercentages();
      setAdPercentages(res);
    } catch (err) {
      console.log("Failed to fetch AD Percentages:", err);
    }
  };

  const loadAD = async () => {
    try {
      const res = await getAllowancesDeductions();
      setAdList(res);
    } catch (err) {
      console.log("Failed to fetch AD:", err);
    }
  };

  const cleanList = adList; // DO NOT REMOVE DUPLICATES
  const allowances = cleanList.filter((x) => x.Type === "A");
  const deductions = cleanList.filter((x) => x.Type === "D");
  const otherAllowances = cleanList.filter((x) => x.Type === "OA");
  const otherDeductions = cleanList.filter((x) => x.Type === "OD");

  const loadSG = async (propertyIds) => {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        setSalaryGroups([]);
        return;
      }

      const res = await getSalaryAllowancesByProperties(propertyIds);
      setSalaryGroups(res || []);
    } catch (err) {
      console.log("Failed to fetch Salary Groups by properties", err);
    }
  };

  const handleDropdownSelect = (sg) => {
    if (!sg) return;
    isLoadingSG.current = true;

    // 🔥 HARD RESET — REQUIRED WHEN SWITCHING SG
    setAllowanceAmounts({});
    setDeductionAmounts({});
    setAdValueType({});
    setEditablePercentages({});
    setAdFormula({});
    setAllowanceSelected({});
    setDeductionAllowanceMap({});
    setActiveStatutory({ PF: false, ESI: false });
    setActiveDeduction(null);
    setOdDoubleFlags({});
    setMultiplyValues({});
    setPerDayOD({});
    setOtBaseType("Base");
    setOtStandalone(false);

    // 🔥 Store SG-based exclusions & designations
    setExcludedEmployeeIds(sg.ExcludedEmployeeIds || []);

    if (Array.isArray(sg.Designations) && sg.Designations.length > 0) {
      setDesignation(sg.Designations[0]); // auto-select designation
    }

    // 1. Fill main fields
    setForm({
      salaryGroupName: sg.SalaryGroup,
      baseSalary: sg.BaseSalary,
      totalWorkingDays: sg.TotalWorkingDays,
      shiftHours: sg.ShiftHours,
      salaryCycleFrom: sg.Salarystartfrom ?? "",
      salaryCycleTo: sg.Salaryendto ?? "",
      excludeSunday: !!sg.ExcludeSunday,
      monthlySundays: sg.MonthSundays ?? "0",
      monthDays: sg.MonthDays ?? "0"
    });

    // 2. Prepare maps
    let newAllowances = {};
    let newDeductions = {};
    let calcFlags = {};
    let formulas = {};
    let deductionAllowanceRestoreMap = {}; // 🔥 NEW

    // 3. Read Allowances + Deductions from API model
    sg.AllowancesDeductions.forEach((ad) => {
      const name = ad.Name;

      // SPECIAL CASE: OTAmount base type
      if (name === "OTAmount") {
        setOtBaseType(ad.Isbasic === false ? "Gross" : "Base");
      }

      // 🔥 RESTORE OTAmount special flags
      if (ad.Name === "OTAmount") {
        setOdDoubleFlags((prev) => ({
          ...prev,
          OTAmount: !!ad.IsDouble,
        }));

        setMultiplyValues((prev) => ({
          ...prev,
          OTAmount: ad.MultiplyValue ?? null,
        }));

        setOtBaseType(ad.Isbasic === false ? "Gross" : "Base");
      }

      // 🔥 RESTORE allowance usage FROM DEDUCTION FORMULA
      if (ad.Type === "D" && ad.Formula) {
        const usedAllowances = {};

        const tokens = ad.Formula.match(/[A-Z][A-Za-z0-9_]*/g) || [];
        tokens.forEach((t) => {
          if (t === "Base") {
            usedAllowances["BaseSalary"] = true;
          } else {
            usedAllowances[t] = true;
          }
        });

        deductionAllowanceRestoreMap[name] = usedAllowances;
      }

      // 🔥 RESTORE Per Day flag for OD items
      if (
        ad.Type === "OD" &&
        (ad.Name === "Food" ||
          ad.Name === "Accommodation" ||
          ad.Name === "Uniform")
      ) {
        setPerDayOD((prev) => ({
          ...prev,
          [ad.Name]: !!ad.Perday,
        }));
      }

      // CASE 1: Calculated Amount exists → percentage-based
      if (ad.CalculatedAmount && ad.CalculatedAmount > 0) {
        setAdValueType((prev) => ({
          ...prev,
          [name]: "PERCENT",
        }));

        // restore editable percentage from formula
        const match = ad.Formula?.match(/([\d.]+)$/);
        const percentage = match ? Number(match[1]) * 100 : 0;

        setEditablePercentages((prev) => ({
          ...prev,
          [name]: percentage,
        }));

        if (ad.Type === "A" || ad.Type === "OA") {
          newAllowances[name] = ad.CalculatedAmount;
        } else {
          newDeductions[name] = ad.CalculatedAmount;
          calcFlags[name] = true;
        }

        if (ad.Formula) formulas[name] = ad.Formula;
        return;
      }

      // CASE 2: Fixed Amount exists → fixed
      if (ad.FixedAmount && ad.FixedAmount > 0) {
        if (ad.Type === "A" || ad.Type === "OA") {
          newAllowances[name] = ad.FixedAmount;
        } else {
          newDeductions[name] = ad.FixedAmount;
        }

        // 🔥 THIS WAS MISSING
        setAdValueType((prev) => ({
          ...prev,
          [name]: "FIXED",
        }));

        // 🔥 ALSO MARK DEDUCTION AS VALID
        if (ad.Type === "D" || ad.Type === "OD") {
        }
      }
    });

    // COMMIT deduction → allowance dependency map FIRST
    setDeductionAllowanceMap(deductionAllowanceRestoreMap);

    // Check if OT exists in API
    const hasOT = sg.AllowancesDeductions.some(
      (ad) => ad.Name === "OTAmount"
    );

    // Check usage in PF / ESI
    const usedInPF = deductionAllowanceRestoreMap?.PF?.OTAmount;
    const usedInESI = deductionAllowanceRestoreMap?.ESI?.OTAmount;

    // Final correct decision
    setOtStandalone(
      hasOT && !usedInPF && !usedInESI
    );

    // Mark PF / ESI as active statutory deductions
    setActiveStatutory({
      PF: !!deductionAllowanceRestoreMap.PF,
      ESI: !!deductionAllowanceRestoreMap.ESI,
    });

    // RESTORE allowanceSelected for PF / ESI so formula works
    let restoredSelected = {};

    ["PF", "ESI"].forEach((d) => {
      if (deductionAllowanceRestoreMap[d]) {
        Object.keys(deductionAllowanceRestoreMap[d]).forEach((a) => {
          if (deductionAllowanceRestoreMap[d][a]) {
            restoredSelected[a] = true;
          }
        });
      }
    });

    // 4. Set UI states
    setAllowanceAmounts(newAllowances);
    setDeductionAmounts(newDeductions);
    setAdFormula(formulas);

    setAllowanceSelected((prev) => ({
      ...prev,
      ...restoredSelected,
    }));

    setPfLimit(sg.PFLimit ?? "");
    setEsiLimit(sg.ESILimit ?? "");
    setTimeout(() => {
      isLoadingSG.current = false; // 🔓 UNLOCK after state settles
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🔥 NEW LOGIC (ADD THIS HERE)
    if (name === "salaryCycleFrom" || name === "salaryCycleTo") {
      const from = name === "salaryCycleFrom" ? value : form.salaryCycleFrom;
      const to = name === "salaryCycleTo" ? value : form.salaryCycleTo;

      if (Number(from) > 0 || Number(to) > 0) {
        setForm(prev => ({
          ...prev,
          [name]: value,
          monthDays: "",
          excludeSunday: false,
          monthlySundays: ""
        }));
        return;
      }
    }

    // DEFAULT UPDATE
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // ✅ VALIDATION FIRST
    if (!selectedPropertyId || selectedPropertyId.length === 0) {
      alert("Please select at least one Property");
      return;
    }
    if (
      (!form.salaryGroupName || form.salaryGroupName.trim() === "") &&
      (!selectedSG || selectedSG.trim() === "")
    ) {
      alert("Please enter Salary Group Name or select an existing SG");
      return;
    }

    try {
      const adModel = buildADModel();

      // 🔑 detect update by SG name
      const existingSG = salaryGroups.find(
        (sg) => sg.SalaryGroup === form.salaryGroupName,
      );

      const isUpdate = !!existingSG;

      const model = isUpdate
        ? {
          // 🔁 PUT payload
          SalaryGroup_IDs: existingSG.SalaryGroup_IDs,
          Property_IDs: selectedPropertyId,
          SalaryGroup: form.salaryGroupName,
          BaseSalary: Number(form.baseSalary),

          PFLimit: pfLimit ? Number(pfLimit) : null,
          ESILimit: esiLimit ? Number(esiLimit) : null,
          TotalWorkingDays: Number(form.totalWorkingDays),
          ShiftHours: Number(form.shiftHours),
          Salarystartfrom: Number(form.salaryCycleFrom) || 0,
          Salaryendto: Number(form.salaryCycleTo) || 0,
          ExcludeSunday: form.excludeSunday,
          MonthSundays:
            form.monthlySundays !== "" ? Number(form.monthlySundays) : null,
          MonthDays:
            form.monthDays !== "" ? Number(form.monthDays) : null,

          Designations: designation ? [designation] : [],
          ExcludedEmployeeIds: excludedEmployeeIds || [],
          AllowancesDeductions: adModel,
          CreatedBy: 1,
          UpdatedBy: 1,
          IsActive: true,
        }
        : {
          // ➕ POST payload
          SalaryGroup_ID: 0,
          PropertyIds: selectedPropertyId,
          SalaryGroup: form.salaryGroupName,
          BaseSalary: Number(form.baseSalary),

          PFLimit: pfLimit ? Number(pfLimit) : null,
          ESILimit: esiLimit ? Number(esiLimit) : null,
          TotalWorkingDays: Number(form.totalWorkingDays),
          ShiftHours: Number(form.shiftHours),
          Salarystartfrom: Number(form.salaryCycleFrom) || 0,
          Salaryendto: Number(form.salaryCycleTo) || 0,
          ExcludeSunday: form.excludeSunday,
          MonthSundays:
            form.monthlySundays !== "" ? Number(form.monthlySundays) : null,
          MonthDays:
            form.monthDays !== "" ? Number(form.monthDays) : null,

          Designations: designation ? [designation] : [],
          ExcludedEmployeeIds: excludedEmployeeIds || [],
          AllowancesDeductions: adModel,
          CreatedBy: 1,
          UpdatedBy: 1,
          IsActive: true,
        };

      if (isUpdate) {
        // ✅ UPDATED: no separate ID param
        await updateSalaryAllowance(model);
        alert("Salary group updated!");
      } else {
        await createSalaryAllowance(model);
        alert("Salary group created!");
      }

      // 🔄 reload SG list for selected properties
      await loadSG(selectedPropertyId);

      // 🔥 full reset
      resetAll();
    } catch (err) {
      alert("Save failed! Check console.");
      console.error(err);
    }
  };

  const handleDeleteSalaryGroup = async () => {
    if (!selectedSG || selectedSG.trim() === "") {
      alert("Please select an existing salary group to delete.");
      return;
    }

    const existingSG = salaryGroups.find((sg) => sg.SalaryGroup === selectedSG);
    const salaryGroupId = Array.isArray(existingSG?.SalaryGroup_IDs)
      ? existingSG.SalaryGroup_IDs[0]
      : existingSG?.SalaryGroup_ID;

    if (!salaryGroupId) {
      alert("Unable to find selected salary group.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete salary group "${selectedSG}"?`)) {
      return;
    }

    try {
      const res = await deleteSalaryGroup(salaryGroupId);
      alert(res?.message || "Salary Group deleted successfully (soft delete).");
      await loadSG(selectedPropertyId);
      resetSalaryGroupForm();
      setPreviewSG(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete salary group.");
    }
  };

  // SUM OF ALLOWANCES (A + OA)
  const totalAllowance = Object.keys(allowanceAmounts)
    .filter((key) => Number(allowanceAmounts[key]) > 0)
    .reduce((sum, key) => sum + Number(allowanceAmounts[key]), 0);

  // SUM OF ALL DEDUCTIONS (D + OD)
  const totalDeduction = Object.values(deductionAmounts)
    .filter((v) => typeof v === "number" && v > 0)
    .reduce((a, b) => a + b, 0);

  // GROSS = BASE + ALLOWANCES
  const totalGross = (Number(form.baseSalary) || 0) + totalAllowance;

  // NET PAY
  const netPay = totalGross - totalDeduction;

  const SalarySummaryBox = () => (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "8px 12px", // much smaller
        background: "#fff",
        marginTop: 15,
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 16,
          fontWeight: 600,
          color: "#2a4365",
        }}
      >
        {/* Gross */}
        <div style={{ flex: 1 }}>
          Total Gross ={" "}
          <span style={{ color: "#000" }}>₹ {totalGross.toFixed(2)}</span>
        </div>

        {/* Deduction */}
        <div style={{ flex: 1, textAlign: "center" }}>
          Total Deduction ={" "}
          <span style={{ color: "#000" }}>₹ {totalDeduction.toFixed(2)}</span>
        </div>

        {/* Net Pay */}
        <div style={{ flex: 1, textAlign: "right" }}>
          Net Pay ={" "}
          <span style={{ color: "#2b6cb0" }}>₹ {netPay.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const resetSalaryGroupForm = () => {
    setForm({
      salaryGroupName: "",
      baseSalary: "",
      totalWorkingDays: "0",
      shiftHours: "0",
      salaryCycleFrom: "0",
      salaryCycleTo: "0",
      excludeSunday: false,
      monthlySundays: "0",
      monthDays: "0"
    });

    setAdValueType({});
    setEditablePercentages({});
    setAllowanceSelected({});
    setAllowanceAmounts({});
    setDeductionAmounts({});
    setActiveDeduction(null);
    setAdFormula({});
    setSelectedSG("");
    setOdDoubleFlags({});
    setMultiplyValues({});
    setDesignation("");
    setExcludeEmployees(false);
    setExcludedEmployeeIds([]);
    setDesignationTouched(false);
    setPfLimit("");
    setEsiLimit("");
    setDeductionAllowanceMap({}); // 🔥 RESET PF / ESI CHECKBOX STATE
    setPerDayOD({}); // 🔥 RESET Per Day checkboxes (OD)
    setActiveStatutory({
      PF: false,
      ESI: false,
    });
    setOtBaseType("Base");
    setOtStandalone(false);
  };

  const resetAll = () => {
    resetSalaryGroupForm();
    setSelectedSG("");
    setPreviewSG(null);

    // Only reset PROPERTY, not client
    setSelectedPropertyId([]);
    setShowPropertyDropdown(false);

    // ❌ REMOVE THIS LINE COMPLETELY
    // setSelectedUnitId(null);
  };

  const isPropertySelected =
    selectedPropertyId && selectedPropertyId.length > 0;

  const isSGValid =
    (form.salaryGroupName && form.salaryGroupName.trim() !== "") ||
    (selectedSG && selectedSG.trim() !== "");

  const canSave = isPropertySelected && isSGValid;

  const allowOnlyNumbers = (e) => {
    const { name, value } = e.target;

    if (value === "" || /^\d*\.?\d*$/.test(value)) {

      // 🔥 ADD THIS LOGIC HERE
      if (name === "salaryCycleFrom" || name === "salaryCycleTo") {
        const from = name === "salaryCycleFrom" ? value : form.salaryCycleFrom;
        const to = name === "salaryCycleTo" ? value : form.salaryCycleTo;

        if (Number(from) > 0 || Number(to) > 0) {
          setForm(prev => ({
            ...prev,
            [name]: value,
            monthDays: "",
            excludeSunday: false,
            monthlySundays: ""
          }));
          return;
        }
      }

      if (name === "monthDays") {
        const is31 = Number(value) === 31;

        setForm(prev => ({
          ...prev,
          monthDays: value,

          // wipe salary cycle
          salaryCycleFrom: "0",
          salaryCycleTo: "0",

          // only allow Sundays if 31
          excludeSunday: is31 ? prev.excludeSunday : false,
          monthlySundays: is31 ? prev.monthlySundays : ""
        }));
        return;
      }

      // normal update
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const filteredEmployees = designation
    ? employees.filter((e) => (e.Designation || e.Profile?.Designation) === designation)
    : [];

  const getEmployeeSalaryGroupName = (emp) => {
    const sgId = Number(emp.FacilityMember?.SG_Link_ID);
    if (!sgId) return "Not Assigned";

    const sg = salaryGroups.find(
      (s) =>
        Array.isArray(s.SalaryGroup_IDs) &&
        s.SalaryGroup_IDs.some((id) => Number(id) === sgId)
    );

    return sg ? sg.SalaryGroup : "Not Assigned";
  };

  const activateDeductionWithBase = (deductionName) => {
    // ❌ DO NOT touch activeDeduction for PF / ESI
    if (deductionName !== "PF" && deductionName !== "ESI") {
      setActiveDeduction(deductionName);
    }

    // 2️⃣ Force deduction into PERCENT mode
    setAdValueType((prev) => ({
      ...prev,
      [deductionName]: "PERCENT",
    }));

    // 3️⃣ Restore % from API if missing
    const percentObj = getEffectivePercentage(deductionName);
    setEditablePercentages((prev) => ({
      ...prev,
      [deductionName]: prev[deductionName] ?? percentObj?.Percentage ?? 0,
    }));
  };

  const isMonthDaysFilled = Number(form.monthDays) > 0;
  const isMonthDaysEmptyOrZero = Number(form.monthDays) === 0;
  const isMonthDays31 = Number(form.monthDays) === 31;
  const isSalaryCycleStarted =
    Number(form.salaryCycleFrom) > 0 || Number(form.salaryCycleTo) > 0;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "16px 24px",
        paddingLeft: 90,
        background: "#f8fafc", // app background
        boxSizing: "border-box",
      }}
    >
      {/* ===== SECTION: BASIC SALARY GROUP DETAILS ===== */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: "10px 18px",
          marginBottom: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* ===== SG SCOPE SELECTION ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "1px 14px",
            marginBottom: 17,
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Accent bar */}
          <div
            style={{
              width: 3,
              height: 20,
              borderRadius: 3,
              background: "#2563eb",
            }}
          />

          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {/* Select Client */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontWeight: 600 }}>Select Client :</label>
              <select
                className="form-control"
                value={selectedUnitId || ""}
                disabled={true}
                onChange={(e) => {
                  setSelectedUnitId(Number(e.target.value));
                  setSelectedPropertyId([]);
                  setSalaryGroups([]);
                  resetSalaryGroupForm();
                }}
                style={{ width: 260 }}
              >
                <option value="">-- Select Client --</option>
                {unitList.map((u) => (
                  <option key={u.ClientID} value={u.ClientID}>
                    {u.ClientName}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Unit */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                position: "relative",
                minWidth: 420,
              }}
            >
              <label style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                Select Unit :
              </label>

              {/* Dropdown trigger */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (propertyList.length > 0) {
                    setShowPropertyDropdown((prev) => !prev);
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 250,
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: propertyList.length ? "#fff" : "#f9fafb",
                  cursor: propertyList.length ? "pointer" : "not-allowed",
                  fontSize: 13,
                }}
              >
                {
                  selectedPropertyId.length === 0
                    ? "Select Property"
                    : selectedPropertyId.length === 1
                      ? propertyList.find(p => p.PropertyId === selectedPropertyId[0])?.PropertyName
                      : `${selectedPropertyId.length} properties selected`
                }
              </div>

              {/* Dropdown panel */}
              {showPropertyDropdown && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: 6,
                    width: "100%",
                    maxHeight: 220,
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 10,
                    zIndex: 1000,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                  }}
                >
                  {propertyList.map((p) => (
                    <label
                      key={p.PropertyId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        marginBottom: 6,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyId.includes(p.PropertyId)}
                        onChange={(e) => {
                          const checked = e.target.checked;

                          setSelectedPropertyId((prev) =>
                            checked
                              ? [...prev, p.PropertyId]
                              : prev.filter((id) => id !== p.PropertyId),
                          );
                        }}
                      />
                      {p.PropertyName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 1: TITLE + SG NAME + SELECT SG */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 3, // reduced gap
          }}
        >
          {/* TITLE */}
          <div
            onClick={() => {
              resetAll();
            }}
            style={{
              display: "inline-block",
              background: "#e2e8f0",
              padding: "8px 18px",
              borderRadius: "6px",
              borderLeft: "5px solid #1e3a8a",
              marginBottom: "5px",
              marginTop: "-10px",
              cursor: "pointer", // UX hint only
            }}
          >
            <h2
              style={{
                margin: 0,
                padding: 0,
                fontSize: 22, // same size you wanted
                fontWeight: 700,
                color: "#1e3a8a",
                letterSpacing: "0.3px",
              }}
            >
              CREATE SALARY GROUP
            </h2>
          </div>

          {/* Salary Group Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                paddingLeft: 25,
                marginTop: "-10px",
              }}
            >
              Salary Group Name =
            </label>

            <input
              placeholder="Enter Name"
              name="salaryGroupName"
              value={form.salaryGroupName}
              onChange={handleChange}
              className="form-control"
              style={{
                width: "200px",
                height: "32px",
                fontSize: "14px",
                padding: "2px 8px",
                marginTop: "-15px",
              }}
            />
          </div>

          {/* Select Existing SG */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                paddingLeft: 25,
                marginTop: "-10px",
              }}
            >
              Select Existing SG =
            </label>

            <select
              className="form-control"
              style={{
                width: "200px",
                height: "32px",
                padding: "2px 8px",
                marginTop: "-15px",
                fontSize: "14px",
                color: selectedSG ? "#000" : "#999",
              }}
              value={selectedSG}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedSG(name);

                if (!name) {
                  resetSalaryGroupForm();
                  return;
                }

                handleDropdownSelect(
                  salaryGroups.find((s) => s.SalaryGroup === name),
                );
              }}
            >
              <option value="">-- Select Existing SG --</option>

              {salaryGroups.map((sg) => (
                <option key={sg.SalaryGroup} value={sg.SalaryGroup}>
                  {sg.SalaryGroup}
                </option>
              ))}
            </select>
          </div>

          {/* TOP RIGHT SAVE BUTTON */}
          <div style={{ marginLeft: "auto", marginTop: "-15px", display: "flex", gap: 8 }}>

            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={!canSave}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                opacity: canSave ? 1 : 0.5,
                cursor: canSave ? "pointer" : "not-allowed"
              }}
            >
              Save
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleDeleteSalaryGroup}
              disabled={!selectedSG}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                opacity: selectedSG ? 1 : 0.5,
                cursor: selectedSG ? "pointer" : "not-allowed"
              }}
            >
              Delete
            </button>
          </div>
        </div>
        {/* ROW 2: WORKING DAYS + SHIFT HOURS + DESIGNATION + EXCLUDE */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "max-content 90px max-content 90px max-content 180px auto",
            alignItems: "center",
            columnGap: 16,
            rowGap: 8,
            marginBottom: 8,
            paddingLeft: 10,
          }}
        >
          {/* Total Working Days */}
          <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            Total Working Days =
          </label>
          <input
            name="totalWorkingDays"
            value={form.totalWorkingDays}
            onChange={allowOnlyNumbers}
            className="form-control"
            style={{
              width: 80,
              height: 30,
              fontSize: 14,
              padding: "2px 6px",
            }}
          />

          {/* Shift Hours */}
          <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            Total Shift Hours =
          </label>
          <input
            name="shiftHours"
            value={form.shiftHours}
            onChange={allowOnlyNumbers}
            className="form-control"
            style={{
              width: 80,
              height: 30,
              fontSize: 14,
              padding: "2px 6px",
            }}
          />

          {/* Designation */}
          <label
            style={{
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Designation <span style={{ color: "red" }}>*</span>
          </label>

          <select
            className="form-control"
            value={designation}
            onChange={(e) => {
              const newDesignation = e.target.value;

              setDesignation(newDesignation);
              setExcludeEmployees(false);
              setDesignationTouched(false);
            }}
            style={{
              width: 170,
              height: 30,
              fontSize: 14,
              padding: "2px 8px",
            }}
          >
            <option value="">-- Select Designation --</option>
            {designations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Exclude checkbox + popup */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={excludeEmployees}
              onChange={(e) => {
                if (!designation) {
                  alert("Please select designation first");
                  return;
                }

                const checked = e.target.checked;
                setExcludeEmployees(checked);
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Exclude specific employees
            </span>

            {/* POPUP — EXACT SAME LOGIC */}
            {excludeEmployees && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 8,
                  width: 220,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 10,
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    marginBottom: 8,
                    color: "#040d1aff",
                  }}
                >
                  Exclude Employees
                </div>

                {loadingEmployees ? (
                  <div style={{ fontSize: 12, color: "#555" }}>Loading...</div>
                ) : employees.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#777" }}>
                    No employees found
                  </div>
                ) : (
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    {filteredEmployees.map((emp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          marginBottom: 6,
                        }}
                      >
                        {/* CHECKBOX */}
                        <input
                          type="checkbox"
                          checked={excludedEmployeeIds.includes(
                            emp.FacilityMember?.FacilityMemberId
                          )}
                          onChange={(e) => {
                            const empId = emp.FacilityMember?.FacilityMemberId;

                            if (!designationTouched) {
                              setExcludedEmployeeIds([]);
                            }

                            setDesignationTouched(true);

                            setExcludedEmployeeIds((prev) =>
                              e.target.checked
                                ? [...prev, empId]
                                : prev.filter((id) => id !== empId)
                            );
                          }}
                        />

                        <span
                          style={{ cursor: "pointer", fontWeight: 600 }}
                          onClick={() => {
                            const empId = emp.FacilityMember?.FacilityMemberId;

                            if (!designationTouched) {
                              setExcludedEmployeeIds([]);
                            }

                            setDesignationTouched(true);

                            setExcludedEmployeeIds((prev) =>
                              prev.includes(empId)
                                ? prev.filter((id) => id !== empId)
                                : [...prev, empId]
                            );
                          }}
                        >
                          {emp.Profile?.EmployeeName}
                        </span>

                        <span
                          style={{
                            cursor: "pointer",
                            color: "#0f766e",
                            fontWeight: 500,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();

                            const sgId = Number(emp.FacilityMember?.SG_Link_ID);

                            const sg = salaryGroups.find(
                              (s) =>
                                Array.isArray(s.SalaryGroup_IDs) &&
                                s.SalaryGroup_IDs.some(
                                  (id) => Number(id) === sgId
                                )
                            );

                            if (sg) setPreviewSG(sg);
                          }}
                        >
                          ({getEmployeeSalaryGroupName(emp)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: SALARY CYCLE + MONTH + SUNDAYS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            paddingLeft: 10,
            marginBottom: 10,
          }}
        >
          {/* Salary Cycle Day From */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
              Salary Cycle Day From =
            </label>
            <input
              name="salaryCycleFrom"
              value={form.salaryCycleFrom}
              onChange={allowOnlyNumbers}
              disabled={isMonthDaysFilled}
              className="form-control"
              style={{
                width: 70,
                height: 30,
                fontSize: 14,
                padding: "2px 6px",
              }}
            />
          </div>

          {/* Salary Cycle Day To */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
              Salary Cycle Day To =
            </label>
            <input
              name="salaryCycleTo"
              value={form.salaryCycleTo}
              onChange={allowOnlyNumbers}
              disabled={isMonthDaysFilled}
              className="form-control"
              style={{
                width: 70,
                height: 30,
                fontSize: 14,
                padding: "2px 6px",
              }}
            />
          </div>

          {/* Month Days */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
              Month Days =
            </label>
            <input
              name="monthDays"
              value={form.monthDays}
              onChange={allowOnlyNumbers}
              disabled={isSalaryCycleStarted}
              className="form-control"
              style={{
                width: 70,
                height: 30,
                fontSize: 14,
                padding: "2px 6px",
              }}
            />
          </div>

          {/* Exclude Sundays */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={form.excludeSunday}
              disabled={
                isSalaryCycleStarted || (!isMonthDaysEmptyOrZero && !isMonthDays31)
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  excludeSunday: e.target.checked,
                }))
              }
            />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Exclude Sundays
            </span>
          </div>

          {/* Monthly Sundays */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
              Monthly Sundays =
            </label>
            <input
              name="monthlySundays"
              value={form.monthlySundays}
              onChange={allowOnlyNumbers}
              disabled={!isMonthDaysEmptyOrZero && !isMonthDays31}
              className="form-control"
              style={{
                width: 70,
                height: 30,
                fontSize: 14,
                padding: "2px 6px",
              }}
            />
          </div>
        </div>
        <hr
          style={{
            margin: "3px 0",
            borderTop: "3px solid #001affff",
            marginTop: -5,
          }}
        />
      </div>
      {/* MAIN BODY GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(520px, 1fr) minmax(520px, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ALLOWANCES */}
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <h4 style={{ color: "#2a4365", margin: 0 }}>Allowances</h4>

            <div
              style={{
                textAlign: "center",
                fontWeight: 600,
                marginLeft: -81,
              }}
            >
              PF
            </div>

            <div
              style={{
                textAlign: "center",
                fontWeight: 600,
                marginLeft: -148,
              }}
            >
              ESI
            </div>
          </div>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {/* BASE SALARY (MOVED HERE) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "30px 1fr 40px 110px 40px 40px 60px",
                alignItems: "center",
                columnGap: 8,
                marginBottom: 8,
              }}
            >
              {/* Checkbox placeholder (no checkbox for Base Salary selection) */}
              <div />

              {/* Label */}
              <span>Base Salary</span>

              {/* Fixed # box (aligned above others) */}
              <input
                value="#"
                disabled
                style={{
                  width: 32,
                  height: 28,
                  fontSize: 12,
                  textAlign: "center",
                  marginLeft: -95,
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e5e7eb",
                  cursor: "not-allowed",
                }}
              />

              {/* Amount input (aligned above other amounts) */}
              <input
                name="baseSalary"
                value={form.baseSalary}
                onChange={allowOnlyNumbers}
                className="form-control"
                style={{
                  width: 110,
                  height: 28,
                  fontSize: 13,
                  marginLeft: -107,
                }}
              />

              {/* PF checkbox */}
              <input
                type="checkbox"
                checked={!!deductionAllowanceMap.PF?.BaseSalary}
                onChange={(e) => {
                  const checked = e.target.checked;

                  if (checked) {
                    // ✅ TURN PF ON
                    setActiveStatutory((prev) => ({ ...prev, PF: true }));

                    setDeductionAllowanceMap((prev) => ({
                      ...prev,
                      PF: {
                        ...(prev.PF || {}),
                        BaseSalary: true,
                      },
                    }));

                    activateDeductionWithBase("PF");
                  } else {
                    // 1️⃣ Update BaseSalary mapping only
                    setDeductionAllowanceMap((prev) => {
                      const pfMap = { ...(prev.PF || {}) };
                      delete pfMap.BaseSalary;

                      // 2️⃣ Check if ANY allowance still uses PF
                      const hasAnyPFAllowance = Object.keys(pfMap).some(
                        (k) => pfMap[k] === true,
                      );

                      // 3️⃣ If none left → fully remove PF
                      if (!hasAnyPFAllowance) {
                        setActiveStatutory((prev) => ({ ...prev, PF: false }));

                        // clear PF states
                        setAdValueType((prev) => {
                          const copy = { ...prev };
                          delete copy.PF;
                          return copy;
                        });

                        setEditablePercentages((prev) => {
                          const copy = { ...prev };
                          delete copy.PF;
                          return copy;
                        });

                        setDeductionAmounts((prev) => {
                          const copy = { ...prev };
                          delete copy.PF;
                          return copy;
                        });

                        setAdFormula((prev) => {
                          const copy = { ...prev };
                          delete copy.PF;
                          return copy;
                        });

                        const newMap = { ...prev };
                        delete newMap.PF;
                        return newMap;
                      }

                      // 4️⃣ Otherwise keep PF alive (HRA still checked)
                      return {
                        ...prev,
                        PF: pfMap,
                      };
                    });
                  }
                }}
              />

              {/* ESI checkbox */}
              <input
                type="checkbox"
                checked={!!deductionAllowanceMap.ESI?.BaseSalary}
                onChange={(e) => {
                  const checked = e.target.checked;

                  if (checked) {
                    setActiveStatutory((prev) => ({ ...prev, ESI: true }));

                    setDeductionAllowanceMap((prev) => ({
                      ...prev,
                      ESI: {
                        ...(prev.ESI || {}),
                        BaseSalary: true,
                      },
                    }));

                    activateDeductionWithBase("ESI");
                  } else {
                    setDeductionAllowanceMap((prev) => {
                      const esiMap = { ...(prev.ESI || {}) };
                      delete esiMap.BaseSalary;

                      const hasAnyESI = Object.values(esiMap).some(
                        (v) => v === true,
                      );

                      if (!hasAnyESI) {
                        setActiveStatutory((p) => ({ ...p, ESI: false }));

                        setAdValueType((p) => {
                          const c = { ...p };
                          delete c.ESI;
                          return c;
                        });

                        setEditablePercentages((p) => {
                          const c = { ...p };
                          delete c.ESI;
                          return c;
                        });

                        setDeductionAmounts((p) => {
                          const c = { ...p };
                          delete c.ESI;
                          return c;
                        });

                        setAdFormula((p) => {
                          const c = { ...p };
                          delete c.ESI;
                          return c;
                        });

                        const newMap = { ...prev };
                        delete newMap.ESI;
                        return newMap;
                      }

                      return { ...prev, ESI: esiMap };
                    });
                  }
                }}
                style={{ transform: "scale(1.1)", justifySelf: "center" }}
              />

              {/* Empty FX placeholder to keep alignment */}
              <div />
            </div>
            {allowances.map((a) => {
              const isPercentMode = adValueType[a.Name] === "PERCENT";

              const disableAmount = isPercentMode;

              return (
                <div
                  key={a.ID}
                  style={{
                    display: "grid",
                    // gridTemplateColumns: "1fr 40px 40px 60px",
                    gridTemplateColumns: "30px 1fr 40px 40px 60px",
                    alignItems: "center",
                    marginBottom: 8,
                    columnGap: 8,
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    // style={{ display: "none" }}
                    disabled
                    style={{ pointerEvents: "none", opacity: 0.7 }}
                    checked={!!allowanceSelected[a.Name]}
                    onChange={(e) => {
                      if (!activeDeduction) {
                        alert("Please select a deduction first!");
                        return;
                      }

                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => ({
                        ...prev,
                        [activeDeduction]: {
                          ...(prev[activeDeduction] || {}),
                          [a.Name]: checked,
                        },
                      }));

                      // Update visible selected allowances
                      setAllowanceSelected((prev) => ({
                        ...prev,
                        [a.Name]: checked,
                      }));
                    }}
                  // style={{ transform: "scale(1.1)" }}
                  />

                  {/* Name + Amount */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span style={{ width: 70 }}>{a.Name}</span>
                    {/* % / # Dropdown control */}
                    <select
                      value={adValueType[a.Name] || ""}
                      onChange={(e) => {
                        const type = e.target.value;

                        setAdValueType((prev) => ({
                          ...prev,
                          [a.Name]: type,
                        }));

                        if (type === "PERCENT") {
                          const percentObj = getEffectivePercentage(a.Name);
                          setEditablePercentages((prev) => ({
                            ...prev,
                            [a.Name]: percentObj?.Percentage || 0,
                          }));
                        }
                        if (type === "FIXED") {
                          setEditablePercentages((prev) => ({
                            ...prev,
                            [a.Name]: "",
                          }));
                          setAdFormula((prev) => ({ ...prev, [a.Name]: "" }));
                        }
                      }}
                      style={{
                        width: 32,
                        height: 28,
                        fontSize: 12,
                        color: "#000",
                      }}
                    >
                      <option value="FIXED">#</option>
                      <option value="PERCENT">%</option>
                    </select>
                    {adValueType[a.Name] === "PERCENT" && (
                      <input
                        type="number"
                        style={{
                          width: 55,
                          height: 28,
                          fontSize: 12,
                        }}
                        value={editablePercentages[a.Name] || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;

                          setEditablePercentages((prev) => ({
                            ...prev,
                            [a.Name]: val,
                          }));
                        }}
                      />
                    )}

                    <input
                      type="number"
                      className="form-control"
                      disabled={disableAmount}
                      style={{
                        width: 110,
                        height: "28px",
                        fontSize: "13px",
                        padding: "2px 6px",

                        backgroundColor: disableAmount ? "#f1f5f9" : "#fff",
                        cursor: disableAmount ? "not-allowed" : "text",
                        border: "1px solid #e5e7eb",

                        color: disableAmount ? "rgba(0,0,0,0.4)" : "#000",
                      }}
                      value={allowanceAmounts[a.Name] || ""}
                      onChange={(e) =>
                        handleAllowanceAmount(a.Name, e.target.value)
                      }
                    />
                  </div>
                  {/* PF Checkbox */}
                  <input
                    type="checkbox"
                    checked={!!deductionAllowanceMap.PF?.[a.Name]}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => {
                        const pfMap = {
                          ...(prev.PF || {}),
                          BaseSalary: prev.PF?.BaseSalary ?? false,
                          [a.Name]: checked,
                        };

                        // 🔑 does PF still have ANY allowance?
                        const hasAnyPFAllowance = Object.values(pfMap).some(
                          (v) => v === true,
                        );

                        // ❌ last PF allowance removed → kill PF completely
                        if (!hasAnyPFAllowance) {
                          setActiveStatutory((p) => ({ ...p, PF: false }));

                          setAdValueType((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setEditablePercentages((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setDeductionAmounts((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setAdFormula((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          const newMap = { ...prev };
                          delete newMap.PF;
                          return newMap;
                        }

                        // ✅ PF still valid
                        setActiveStatutory((p) => ({ ...p, PF: true }));

                        // 🔥 initialize PF only when it becomes active
                        if (checked && !prev.PF) {
                          activateDeductionWithBase("PF");
                        }

                        return {
                          ...prev,
                          PF: pfMap,
                        };
                      });

                      // 🔥 sync allowanceSelected (UI only)
                      setAllowanceSelected((prev) => ({
                        ...prev,
                        BaseSalary: true,
                        [a.Name]: checked,
                      }));

                      // 🔥 ensure fixed allowance amount exists
                      if (checked && adValueType[a.Name] === "FIXED") {
                        setAllowanceAmounts((prev) => ({
                          ...prev,
                          [a.Name]: prev[a.Name] || Number(a.FixedAmount) || 0,
                        }));
                      }
                    }}
                  />

                  {/* ESI Checkbox */}
                  <input
                    type="checkbox"
                    checked={!!deductionAllowanceMap.ESI?.[a.Name]}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => {

                        const newMap = { ...prev }; // preserve PF and any other deductions

                        const esiMap = {
                          ...(prev.ESI || {}),
                          BaseSalary: prev.ESI?.BaseSalary ?? false,
                          [a.Name]: checked,
                        };

                        const hasAnyESI = Object.values(esiMap).some(v => v === true);

                        if (!hasAnyESI) {
                          setActiveStatutory((p) => ({ ...p, ESI: false }));

                          setAdValueType((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setEditablePercentages((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setDeductionAmounts((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setAdFormula((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          delete newMap.ESI;
                          return newMap;
                        }

                        if (checked && !prev.ESI) {
                          activateDeductionWithBase("ESI");
                        }

                        setActiveStatutory((p) => ({ ...p, ESI: true }));

                        newMap.ESI = esiMap;

                        return newMap;
                      });

                      setAllowanceSelected((prev) => ({
                        ...prev,
                        BaseSalary: true,
                        [a.Name]: checked,
                      }));

                      if (checked && adValueType[a.Name] === "FIXED") {
                        setAllowanceAmounts((prev) => ({
                          ...prev,
                          [a.Name]: prev[a.Name] || Number(a.FixedAmount) || 0,
                        }));
                      }
                    }}
                  />

                  {/* FX */}
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: "100%", padding: "4px 0", fontSize: 12 }}
                  >
                    FX
                  </button>
                </div>
              );
            })}
          </div>

          {/* OTHER ALLOWANCES */}
          <h4
            style={{
              color: "#2a4365",
              margin: "20px 0 10px",
              maxHeight: "20px",
            }}
          >
            Other Allowances
          </h4>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {otherAllowances.map((a) => {
              const isPercentMode = adValueType[a.Name] === "PERCENT";

              const disableAmount = isPercentMode;

              return (
                <div
                  key={a.ID}
                  style={{
                    display: "grid",
                    // gridTemplateColumns: "1fr 40px 40px 60px",
                    gridTemplateColumns: "30px 1fr 40px 40px 60px",
                    alignItems: "center",
                    marginBottom: 8,
                    columnGap: 8,
                  }}
                >
                  {/* MAIN checkbox (select OTAmount allowance) */}
                  <input
                    type="checkbox"
                    // style={{ display: "none" }}
                    disabled
                    style={{ pointerEvents: "none", opacity: 0.7 }}
                    checked={!!allowanceSelected[a.Name]}
                    onChange={(e) => {
                      if (a.Name === "OTAmount" && otStandalone) {
                        alert("OTAmount is standalone. It cannot be used in PF/ESI.");
                        return;
                      }
                      if (!activeDeduction) {
                        alert("Please select a deduction first!");
                        return;
                      }

                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => ({
                        ...prev,
                        [activeDeduction]: {
                          ...(prev[activeDeduction] || {}),
                          [a.Name]: checked,
                        },
                      }));

                      // Update visible selected allowances
                      setAllowanceSelected((prev) => ({
                        ...prev,
                        [a.Name]: checked,
                      }));
                    }}
                  // style={{ transform: "scale(1.1)" }}
                  />

                  {/* UI BLOCK (special for OTAmount) */}
                  {a.Name === "OTAmount" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14, // more spacing
                        marginTop: 3,
                      }}
                    >
                      {/* Label */}
                      <span style={{ width: 120, marginTop: -4 }}>
                        {a.Name}
                      </span>

                      {/* To Multiply Checkbox */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginLeft: -20,
                          opacity: (allowanceSelected[a.Name] || otStandalone) ? 1 : 0.4,
                          cursor: (allowanceSelected[a.Name] || otStandalone) ? "pointer" : "not-allowed",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={!(allowanceSelected[a.Name] || otStandalone)} // disable until first checkbox selected
                          checked={odDoubleFlags[a.Name] || false}
                          onChange={(e) => {
                            const checked = e.target.checked;

                            setOdDoubleFlags((prev) => ({
                              ...prev,
                              [a.Name]: checked,
                            }));

                            if (!checked) {
                              setMultiplyValues((prev) => ({
                                ...prev,
                                [a.Name]: null,
                              }));
                            }
                          }}
                        />
                        <span style={{ fontSize: 12 }}>To Multiply</span>
                      </label>

                      {/* Dropdown (shows only when 2nd checkbox is checked) */}
                      {odDoubleFlags[a.Name] && (
                        <select
                          style={{
                            width: 65,
                            height: 26,
                            fontSize: 12,
                            marginLeft: -7, // add spacing between label and dropdown
                            marginTop: 0, // slight downward shift
                          }}
                          value={multiplyValues[a.Name] || ""}
                          onChange={(e) =>
                            setMultiplyValues((prev) => ({
                              ...prev,
                              [a.Name]: e.target.value,
                            }))
                          }
                        >
                          <option value="">--</option>
                          {[1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                      {/* ✅ ALWAYS-CHECKED BASE CHECKBOX */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 3,
                          marginLeft: 25,
                          pointerEvents: "none", // 🔥 cannot be changed
                        }}
                      >
                        <input type="checkbox" checked />
                      </label>

                      {/* ✅ BASE / GROSS DROPDOWN */}
                      <select
                        value={otBaseType}
                        onChange={(e) => setOtBaseType(e.target.value)}
                        style={{
                          width: 70,
                          height: 26,
                          fontSize: 12,
                          marginLeft: -6,
                        }}
                      >
                        <option value="Base">Base</option>
                        <option value="Gross">Gross</option>
                      </select>
                      {/* OT Standalone YES/NO */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginLeft: 15,
                          border: "2px solid #2563eb",
                          borderRadius: 25,
                          overflow: "hidden",
                          height: 26
                        }}
                      >
                        <div
                          onClick={() => {
                            if (
                              deductionAllowanceMap.PF?.OTAmount ||
                              deductionAllowanceMap.ESI?.OTAmount
                            ) {
                              alert("OTAmount is already used in PF/ESI, so standalone cannot be set to Yes.");
                              return;
                            }
                            setOtStandalone(true);
                          }}
                          style={{
                            padding: "2px 12px",
                            background: otStandalone ? "#2563eb" : "#fff",
                            color: otStandalone ? "#fff" : "#2563eb",
                            fontWeight: 600,
                            cursor:
                              deductionAllowanceMap.PF?.OTAmount ||
                                deductionAllowanceMap.ESI?.OTAmount
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              deductionAllowanceMap.PF?.OTAmount ||
                                deductionAllowanceMap.ESI?.OTAmount
                                ? 0.6
                                : 1,
                            fontSize: 12
                          }}
                        >
                          Yes
                        </div>

                        <div
                          onClick={() => {
                            setOtStandalone(false);
                            setOdDoubleFlags(prev => ({ ...prev, OTAmount: false }));
                            setMultiplyValues(prev => ({ ...prev, OTAmount: null }));
                          }}
                          style={{
                            padding: "2px 12px",
                            background: !otStandalone ? "#2563eb" : "#fff",
                            color: !otStandalone ? "#fff" : "#2563eb",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 12
                          }}
                        >
                          No
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* OTHER Allowances */
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 70 }}>{a.Name}</span>
                      {/* % / # Dropdown */}
                      <select
                        value={adValueType[a.Name] || ""}
                        onChange={(e) => {
                          const type = e.target.value;

                          setAdValueType((prev) => ({
                            ...prev,
                            [a.Name]: type,
                          }));

                          if (type === "PERCENT") {
                            const percentObj = getEffectivePercentage(a.Name);
                            setEditablePercentages((prev) => ({
                              ...prev,
                              [a.Name]: percentObj?.Percentage || 0,
                            }));
                          }
                          if (type === "FIXED") {
                            setEditablePercentages((prev) => ({
                              ...prev,
                              [a.Name]: "",
                            }));
                            setAdFormula((prev) => ({
                              ...prev,
                              [a.Name]: "",
                            }));
                          }
                        }}
                        style={{
                          width: 32,
                          height: 28,
                          fontSize: 12,
                          color: "#000",
                        }}
                      >
                        <option value="FIXED">#</option>
                        <option value="PERCENT">%</option>
                      </select>
                      {adValueType[a.Name] === "PERCENT" && (
                        <input
                          type="number"
                          style={{
                            width: 55,
                            height: 28,
                            fontSize: 12,
                          }}
                          value={editablePercentages[a.Name] || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;

                            setEditablePercentages((prev) => ({
                              ...prev,
                              [a.Name]: val,
                            }));
                          }}
                        />
                      )}

                      <input
                        type="number"
                        className="form-control"
                        disabled={disableAmount}
                        style={{
                          width: 110,
                          height: "28px",
                          fontSize: "13px",
                          padding: "2px 6px",

                          backgroundColor: disableAmount ? "#f1f5f9" : "#fff",
                          cursor: disableAmount ? "not-allowed" : "text",
                          border: "1px solid #e5e7eb",

                          color: disableAmount ? "rgba(0,0,0,0.4)" : "#000",
                        }}
                        value={allowanceAmounts[a.Name] || ""}
                        onChange={(e) =>
                          handleAllowanceAmount(a.Name, e.target.value)
                        }
                      />
                    </div>
                  )}

                  <input
                    type="checkbox"
                    checked={!!deductionAllowanceMap.PF?.[a.Name]}
                    onChange={(e) => {
                      // 🔒 Block PF usage when OT is standalone
                      if (a.Name === "OTAmount" && otStandalone) {
                        alert("Standalone OT cannot be used in PF.");
                        return;
                      }
                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => {
                        const pfMap = {
                          ...(prev.PF || {}),
                          BaseSalary: prev.PF?.BaseSalary ?? false,
                          [a.Name]: checked,
                        };

                        // 🔑 check if ANY PF source still exists
                        const hasAnyPFSource = Object.values(pfMap).some(
                          (v) => v === true,
                        );

                        // ❌ last PF source removed → kill PF fully
                        if (!hasAnyPFSource) {
                          setActiveStatutory((p) => ({ ...p, PF: false }));

                          setAdValueType((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setEditablePercentages((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setDeductionAmounts((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          setAdFormula((p) => {
                            const c = { ...p };
                            delete c.PF;
                            return c;
                          });

                          const newMap = { ...prev };
                          delete newMap.PF;
                          return newMap;
                        }

                        // ✅ PF still valid
                        if (checked && !prev.PF) {
                          activateDeductionWithBase("PF");
                        }

                        setActiveStatutory((p) => ({ ...p, PF: true }));

                        return {
                          ...prev,
                          PF: pfMap,
                        };
                      });

                      // 🔥 UI sync
                      setAllowanceSelected((prev) => ({
                        ...prev,
                        BaseSalary: true,
                        [a.Name]: checked,
                      }));

                      // 🔥 ensure fixed OA value exists
                      if (checked && adValueType[a.Name] === "FIXED") {
                        setAllowanceAmounts((prev) => ({
                          ...prev,
                          [a.Name]: prev[a.Name] || Number(a.FixedAmount) || 0,
                        }));
                      }
                    }}
                  />

                  <input
                    type="checkbox"
                    checked={!!deductionAllowanceMap.ESI?.[a.Name]}
                    onChange={(e) => {
                      // 🔒 Block ESI usage when OT is standalone
                      if (a.Name === "OTAmount" && otStandalone) {
                        alert("Standalone OT cannot be used in ESI.");
                        return;
                      }
                      const checked = e.target.checked;

                      setDeductionAllowanceMap((prev) => {

                        const newMap = { ...prev }; // preserve PF and other deductions

                        const esiMap = {
                          ...(prev.ESI || {}),
                          BaseSalary: prev.ESI?.BaseSalary ?? false,
                          [a.Name]: checked,
                        };

                        const hasAnyESI = Object.values(esiMap).some((v) => v === true);

                        // ❌ if no ESI sources remain → remove ESI
                        if (!hasAnyESI) {
                          setActiveStatutory((p) => ({ ...p, ESI: false }));

                          setAdValueType((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setEditablePercentages((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setDeductionAmounts((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          setAdFormula((p) => {
                            const c = { ...p };
                            delete c.ESI;
                            return c;
                          });

                          delete newMap.ESI;
                          return newMap;
                        }

                        // ✅ activate ESI if newly checked
                        if (checked && !prev.ESI) {
                          activateDeductionWithBase("ESI");
                        }

                        setActiveStatutory((p) => ({ ...p, ESI: true }));

                        newMap.ESI = esiMap;

                        return newMap;
                      });

                      setAllowanceSelected((prev) => ({
                        ...prev,
                        BaseSalary: true,
                        [a.Name]: checked,
                      }));

                      if (checked && adValueType[a.Name] === "FIXED") {
                        setAllowanceAmounts((prev) => ({
                          ...prev,
                          [a.Name]: prev[a.Name] || Number(a.FixedAmount) || 0,
                        }));
                      }
                    }}
                    style={{ transform: "scale(1.1)", justifySelf: "center" }}
                  />

                  {/* FX BUTTON */}
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: "100%", padding: "4px 0", fontSize: 12 }}
                  >
                    FX
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE: DEDUCTIONS + SUMMARY */}
        <div>
          {/* MAIN DEDUCTIONS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
              gap: 12,
            }}
          >
            {/* LEFT: DEDUCTIONS + LIMITS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <h4 style={{ color: "#2a4365", margin: 0 }}>Deductions</h4>

              {/* PF LIMIT */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 22 }}>
                  PF Limit
                </span>
                <input
                  type="text"
                  value={pfLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) setPfLimit(val);
                  }}
                  className="form-control"
                  style={{
                    width: 90,
                    height: 26,
                    fontSize: 13,
                    padding: "2px 6px",
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* ESI LIMIT */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>ESI Limit</span>
                <input
                  type="text"
                  value={esiLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) setEsiLimit(val);
                  }}
                  className="form-control"
                  style={{
                    width: 90,
                    height: 26,
                    fontSize: 13,
                    padding: "2px 6px",
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* RIGHT: REFRESH BUTTON */}
            <button
              className="btn btn-sm btn-outline-primary"
              style={{
                padding: "2px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
              onClick={() => {
                resetAll();
              }}
            >
              Refresh
            </button>
          </div>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
            }}
          >
            {deductions.map((d) => {
              // compute REAL vs PREVIEW for this deduction
              const isReal = adValueType[d.Name] === "FIXED";
              const valueType =
                adValueType[d.Name] ||
                (getEffectivePercentage(d.Name) ? "PERCENT" : "FIXED");

              const isPercentage = valueType === "PERCENT";

              const rawValue = deductionAmounts[d.Name] ?? 0;

              let displayValue = rawValue;

              // 👇 ONLY FOR PF UI LIMIT
              if (d.Name === "PF" && pfLimit) {
                let baseAmount = 0;

                if (deductionAllowanceMap.PF?.BaseSalary) {
                  baseAmount += Number(form.baseSalary) || 0;
                }

                Object.entries(deductionAllowanceMap.PF || {}).forEach(([k, v]) => {
                  if (k !== "BaseSalary" && v) {
                    baseAmount += Number(allowanceAmounts[k]) || 0;
                  }
                });

                const limitedBase = Math.min(baseAmount, Number(pfLimit));

                const percent =
                  Number(editablePercentages.PF) ||
                  getEffectivePercentage("PF")?.Percentage ||
                  0;

                displayValue = Math.round(limitedBase * (percent / 100));
              }

              // 👇 ONLY FOR ESI UI LIMIT
              if (d.Name === "ESI" && esiLimit) {
                let baseAmount = 0;

                if (deductionAllowanceMap.ESI?.BaseSalary) {
                  baseAmount += Number(form.baseSalary) || 0;
                }

                Object.entries(deductionAllowanceMap.ESI || {}).forEach(([k, v]) => {
                  if (k !== "BaseSalary" && v) {
                    baseAmount += Number(allowanceAmounts[k]) || 0;
                  }
                });

                const limitedBase = Math.min(baseAmount, Number(esiLimit));

                const percent =
                  Number(editablePercentages.ESI) ||
                  getEffectivePercentage("ESI")?.Percentage ||
                  0;

                displayValue = Math.round(limitedBase * (percent / 100));
              }

              return (
                <div
                  key={d.ID}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr 60px",
                    alignItems: "center",
                    marginBottom: 8,
                    columnGap: 8,
                  }}
                >
                  {/* PF / ESI = STATUTORY RADIOS | Others = NORMAL RADIO GROUP */}
                  {d.Name === "PF" || d.Name === "ESI" ? (
                    <input
                      type="checkbox"
                      disabled
                      style={{ pointerEvents: "none", opacity: 0.7 }}
                      checked={
                        Object.values(deductionAllowanceMap[d.Name] || {}).some(v => v === true)
                      }
                      onChange={() => {

                        setDeductionAllowanceMap(prev => ({
                          ...prev,
                          [d.Name]: {
                            ...(prev[d.Name] || {}),
                            BaseSalary: true
                          }
                        }));

                        if (!activeStatutory[d.Name]) {
                          setActiveStatutory(prev => ({
                            ...prev,
                            [d.Name]: true
                          }));
                        }

                        activateDeductionWithBase(d.Name);
                      }}
                    />
                  ) : (
                    <input
                      type="radio"
                      name="deductionMain"
                      disabled
                      style={{ pointerEvents: "none", opacity: 0.7 }}
                      value={d.Name}
                      checked={activeDeduction === d.Name}
                      onChange={(e) => {
                        const name = e.target.value;

                        // ✅ ONLY other deductions control activeDeduction
                        setActiveDeduction(name);

                        const percentObj = getEffectivePercentage(name);

                        setEditablePercentages((prev) => ({
                          ...prev,
                          [name]: prev[name] ?? percentObj?.Percentage ?? 0,
                        }));

                        setAdValueType((prev) => ({
                          ...prev,
                          [name]: "PERCENT",
                        }));

                        setDeductionAmounts((prev) => ({
                          ...prev,
                          [name]: prev[name] || 0,
                        }));
                      }}
                    // style={{ transform: "scale(1.1)" }}
                    />
                  )}

                  {/* Name + Amount */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ width: 120 }}>{d.Name}</span>
                    <select
                      value={
                        adValueType[d.Name] ||
                        (getEffectivePercentage(d.Name) ? "PERCENT" : "FIXED")
                      }
                      onChange={(e) => {
                        const type = e.target.value;

                        setAdValueType((prev) => ({
                          ...prev,
                          [d.Name]: type,
                        }));

                        if (type === "FIXED") {
                          setEditablePercentages((prev) => ({
                            ...prev,
                            [d.Name]: "",
                          }));

                          setAdFormula((prev) => ({
                            ...prev,
                            [d.Name]: null,
                          }));
                        }
                      }}
                      style={{
                        width: 32,
                        height: 28,
                        fontSize: 12,
                      }}
                    >
                      <option value="PERCENT">%</option>
                      <option value="FIXED">#</option>
                    </select>
                    {adValueType[d.Name] === "PERCENT" && (
                      <input
                        type="number"
                        style={{ width: 55, height: 28, fontSize: 12 }}
                        value={editablePercentages[d.Name] || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditablePercentages((prev) => ({
                            ...prev,
                            [d.Name]: val,
                          }));
                        }}
                      />
                    )}

                    <input
                      type="number"
                      className="form-control"
                      disabled={isPercentage}
                      style={{
                        width: 120,
                        height: "28px",
                        padding: "2px 6px",
                        fontSize: "13px",

                        backgroundColor: isPercentage ? "#f1f5f9" : "#fff",
                        cursor: isPercentage ? "not-allowed" : "text",
                        border: "1px solid #e5e7eb",

                        color: "#000",
                      }}
                      value={displayValue}
                      onChange={(e) =>
                        setDeductionAmounts((prev) => ({
                          ...prev,
                          [d.Name]: Number(e.target.value),
                        }))
                      }
                    />
                    {adValueType[d.Name] === "PERCENT" && adFormula[d.Name] && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "#475569", // subtle gray
                          whiteSpace: "nowrap",
                        }}
                      >
                        = {adFormula[d.Name]}
                      </span>
                    )}
                  </div>

                  {/* FX BUTTON */}
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: "100%", padding: "4px 0", fontSize: 12 }}
                  >
                    FX
                  </button>
                </div>
              );
            })}
          </div>

          {/* SALARY SUMMARY */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "12px 14px",
              marginTop: 15,
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <h4
              style={{
                color: "#2a4365",
                margin: "0 0 10px",
              }}
            >
              Salary Summary
            </h4>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4, // tighter spacing
                }}
              >
                <strong>Total Gross:</strong>
                <span>₹ {totalGross.toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4, // tighter spacing
                }}
              >
                <strong>Total Deduction:</strong>
                <span>₹ {totalDeduction.toFixed(2)}</span>
              </div>

              {/* TIGHT HR LINE */}
              <hr style={{ margin: "6px 0" }} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: 16,
                  color: "#2b6cb0",
                  marginTop: 2, // reduced gap above net pay
                }}
              >
                <span>Net Pay:</span>
                <span>₹ {netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* OTHER DEDUCTIONS HEADER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "30px 1fr 40px 60px",
              alignItems: "center",
              margin: "20px 0 10px",
            }}
          >
            {/* Empty radio column */}
            <div />

            {/* Heading */}
            <h4 style={{ color: "#2a4365", margin: 0, marginLeft: -30 }}>
              Other Deductions
            </h4>

            {/* Per Day heading — NOW aligned with checkbox column */}
            <div
              style={{
                textAlign: "center",
                fontWeight: 600,
                fontSize: 13,
                color: "#1e293b",
                marginLeft: -30,
              }}
            >
              Per Day
            </div>

            {/* Empty FX column */}
            <div />
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
            }}
          >
            {otherDeductions.map((d) => {
              const isReal = adValueType[d.Name] === "FIXED";
              const valueType =
                adValueType[d.Name] ||
                (getEffectivePercentage(d.Name) ? "PERCENT" : "FIXED");

              const isPercentage = valueType === "PERCENT";
              const showPerDay =
                d.Name === "Food" ||
                d.Name === "Accommodation" ||
                d.Name === "Uniform";

              return (
                <div
                  key={d.ID}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr 40px 60px",
                    alignItems: "center",
                    marginBottom: 8,
                    columnGap: 8,
                  }}
                >
                  {/* Radio */}
                  <input
                    type="radio"
                    name="deductionOther"
                    disabled
                    style={{ pointerEvents: "none", opacity: 0.7 }}
                    value={d.Name}
                    checked={activeDeduction === d.Name}
                    onChange={(e) => {
                      const name = e.target.value;

                      setActiveDeduction(name);

                      // 🔥 SAME SAFETY NET AS MAIN DEDUCTIONS
                      const percentObj = getEffectivePercentage(name);

                      setEditablePercentages((prev) => ({
                        ...prev,
                        [name]: prev[name] ?? percentObj?.Percentage ?? 0,
                      }));

                      setAdValueType((prev) => ({
                        ...prev,
                        [name]: "PERCENT",
                      }));
                    }}
                  // style={{ transform: "scale(1.1)" }}
                  />

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ width: 120 }}>{d.Name}</span>
                    <select
                      value={
                        adValueType[d.Name] ||
                        (getEffectivePercentage(d.Name) ? "PERCENT" : "FIXED")
                      }
                      onChange={(e) => {
                        const type = e.target.value;

                        setAdValueType((prev) => ({
                          ...prev,
                          [d.Name]: type,
                        }));

                        if (type === "FIXED") {
                          setEditablePercentages((prev) => ({
                            ...prev,
                            [d.Name]: "",
                          }));

                          setAdFormula((prev) => ({
                            ...prev,
                            [d.Name]: null,
                          }));
                        }
                      }}
                      style={{
                        width: 32,
                        height: 28,
                        fontSize: 12,
                      }}
                    >
                      <option value="PERCENT">%</option>
                      <option value="FIXED">#</option>
                    </select>
                    {activeDeduction === d.Name &&
                      adValueType[d.Name] === "PERCENT" && (
                        <input
                          type="number"
                          style={{ width: 55, height: 28, fontSize: 12 }}
                          value={editablePercentages[d.Name] || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;

                            setEditablePercentages((prev) => ({
                              ...prev,
                              [d.Name]: val,
                            }));
                          }}
                        />
                      )}
                    <input
                      type="number"
                      className="form-control"
                      style={{
                        width: 120,
                        height: "28px",
                        padding: "2px 6px",
                        fontSize: "13px",

                        backgroundColor: isPercentage ? "#f1f5f9" : "#fff",
                        cursor: isPercentage ? "not-allowed" : "text",
                        border: "1px solid #e5e7eb",

                        color: "#000",
                      }}
                      value={deductionAmounts[d.Name] ?? ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;

                        // 1️⃣ store amount
                        setDeductionAmounts((prev) => ({
                          ...prev,
                          [d.Name]: val,
                        }));

                        // 2️⃣ FORCE FIXED mode
                        setAdValueType((prev) => ({
                          ...prev,
                          [d.Name]: "FIXED",
                        }));

                        // 4️⃣ REMOVE formula (fixed has none)
                        setAdFormula((prev) => ({
                          ...prev,
                          [d.Name]: null,
                        }));
                      }}
                    />
                  </div>

                  {/* PER DAY checkbox (only for selected items) */}
                  {showPerDay ? (
                    <input
                      type="checkbox"
                      checked={!!perDayOD[d.Name]}
                      onChange={(e) =>
                        setPerDayOD((prev) => ({
                          ...prev,
                          [d.Name]: e.target.checked,
                        }))
                      }
                      style={{
                        transform: "scale(1.1)",
                        justifySelf: "center",
                      }}
                    />
                  ) : (
                    <div /> // placeholder to keep alignment
                  )}

                  {/* FX */}
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ width: "100%", padding: "4px 0", fontSize: 12 }}
                  >
                    FX
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: "10px 18px",
          marginBottom: 10,
          marginTop: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* SALARY SUMMARY BOX */}
        <div style={{ marginTop: 2 }}>
          <SalarySummaryBox />
        </div>
        {/* SAVE BUTTON */}
        <div className="d-flex justify-content-center mt-4">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: "10px 150px",
              fontSize: 16,
              opacity: canSave ? 1 : 0.5,
              cursor: canSave ? "pointer" : "not-allowed"
            }}
          >
            Save
          </button>
        </div>
      </div>
      {previewSG && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              width: 720,
              maxHeight: "85vh",
            }}
          >
            {/* TITLE */}
            <h2 style={{ marginBottom: 20 }}>
              Salary Group → {previewSG.SalaryGroup}
            </h2>

            {/* TWO COLUMN LAYOUT */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {/* ALLOWANCES */}
              <div
                style={{
                  background: "#eafff1",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Allowance</span>
                  <span>Amount</span>
                </div>

                {/* BASE SALARY */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span>Base Salary</span>
                  <span>₹ {Number(previewSG.BaseSalary).toFixed(2)}</span>
                </div>

                {/* OTHER ALLOWANCES */}
                {previewSG.AllowancesDeductions.filter(
                  (a) => a.Type === "A" || a.Type === "OA",
                ).map((a) => (
                  <div
                    key={a.AD_Id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span>{a.Name}</span>
                    <span>
                      ₹ {(a.FixedAmount || a.CalculatedAmount).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* TOTAL ALLOWANCE */}
                <hr />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>Total Allowance:</span>
                  <span>
                    ₹{" "}
                    {(
                      Number(previewSG.BaseSalary) +
                      previewSG.AllowancesDeductions.filter(
                        (a) => a.Type === "A" || a.Type === "OA",
                      ).reduce(
                        (sum, a) =>
                          sum + (a.FixedAmount || a.CalculatedAmount || 0),
                        0,
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* DEDUCTIONS */}
              <div
                style={{
                  background: "#ffeaea",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Deduction</span>
                  <span>Amount</span>
                </div>

                {previewSG.AllowancesDeductions.filter(
                  (a) => a.Type === "D" || a.Type === "OD",
                ).map((a) => (
                  <div
                    key={a.AD_Id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span>{a.Name}</span>
                    <span>
                      ₹ {(a.FixedAmount || a.CalculatedAmount).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* TOTAL DEDUCTION */}
                <hr />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>Total Deduction:</span>
                  <span>
                    ₹{" "}
                    {previewSG.AllowancesDeductions.filter(
                      (a) => a.Type === "D" || a.Type === "OD",
                    )
                      .reduce(
                        (sum, a) =>
                          sum + (a.FixedAmount || a.CalculatedAmount || 0),
                        0,
                      )
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <div style={{ textAlign: "right", marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={() => setPreviewSG(null)}
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
