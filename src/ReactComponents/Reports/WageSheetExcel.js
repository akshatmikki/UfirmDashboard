import * as XLSX from "xlsx";

// ================= GENERATE EXCEL =================
export const generateWageSheetExcel = (employees, filters, preview = false) => {

  const { unitName, month } = filters;

  const totals = employees.reduce((acc, emp) => {
    acc.Basic += emp.Basic || 0;
    acc.HRA += emp.HRA || 0;
    acc.Conv += emp.CONV ?? emp.Conveyance ?? 0;
    acc.Wash += emp.Washing || 0;
    acc.Spl += emp.SpecialAllowance || 0;
    acc.Other += emp.OtherAllowance || 0;
    acc.Bonus += emp.Bonus || 0;
    acc.TotalSalary += emp.TotalGross || 0;
    acc.OTAmt += emp.OTAmount || 0;
    acc.Gross += emp.ProratedTotalGross || 0;
    acc.PF += emp.PF || 0;
    acc.ESI += emp.ESI || 0;
    acc.LWF += emp.LwfAmount ?? 0;
    acc.PT += emp.PftAmount ?? 0;
    acc.Advance += emp.AdvanceDed ?? 0;
    acc.Food += emp.Food || 0;
    acc.Maintenance += emp.Maintenance || 0;
    acc.Uniform += emp.Uniform || 0;
    acc.Tax += emp.IncomeTax || 0;
    acc.TotalDeduction += emp.TotalDeduction || 0;
    acc.NetSalary += emp.NetSalary || 0;
    return acc;
  }, {
    Basic: 0, HRA: 0, Conv: 0, Wash: 0, Spl: 0, Other: 0, Bonus: 0,
    TotalSalary: 0, OTAmt: 0, Gross: 0,
    PF: 0, ESI: 0, LWF: 0, PT: 0, Advance: 0, Food: 0,
    Maintenance: 0, Uniform: 0, Tax: 0,
    TotalDeduction: 0, NetSalary: 0
  });

  const data = employees.map((emp, i) => ({
    "S.No": i + 1,
    "EMP NO": emp.EmployeeCode || "-",

    "Name": emp.FacilityMemberName || "-",
    "Father": emp.FatherName || "-",
    "Designation": emp.Designation || "-",

    "Dept": emp.Department || "-",
    "UAN": emp.UANNumber || "-",
    "ESI No": emp.ESINumber || "-",

    "Working Days": emp.WorkingDays || 0,
    "Divide by Days": emp.AttendanceTotalWorkingDays || 0,
    "OT Days": emp.OTDays || 0,
    "OT Hours": emp.OTHours || 0,

    "Basic": emp.Basic || 0,
    "HRA": emp.HRA || 0,
    "Conv": emp.CONV ?? emp.Conveyance ?? 0,
    "Wash": emp.Washing || 0,
    "Spl": emp.SpecialAllowance || 0,
    "Other": emp.OtherAllowance || 0,
    "Bonus": emp.Bonus || 0,
    "Total Salary": emp.TotalGross || 0,
    "OT Amt": emp.OTAmount || 0,
    "Gross": emp.ProratedTotalGross || 0,

    "PF": emp.PF || 0,
    "ESI": emp.ESI || 0,
    "LWF": emp.LwfAmount ?? 0,
    "PT": emp.PftAmount ?? 0,
    "Advance": emp.AdvanceDed ?? 0,
    "Food": emp.Food || 0,
    "Maintenance": emp.Maintenance || 0,
    "Uniform": emp.Uniform || 0,
    "Tax": emp.IncomeTax || 0,

    "Total Deduction": emp.TotalDeduction || 0,
    "Net Salary": emp.NetSalary || 0,

    "Bank": emp.BankName || "-",
    "Account": emp.BankAccountNumber || "-",
    "IFSC": emp.BankIFSCCode || "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A5" });

  XLSX.utils.sheet_add_aoa(worksheet, [
    [],
    [
      "TOTAL", "", "", "", "", "", "", "",
      "", "", "", "",

      totals.Basic,
      totals.HRA,
      totals.Conv,
      totals.Wash,
      totals.Spl,
      totals.Other,
      totals.Bonus,
      totals.TotalSalary,
      totals.OTAmt,
      totals.Gross,
      totals.PF,
      totals.ESI,
      totals.LWF,
      totals.PT,
      totals.Advance,
      totals.Food,
      totals.Maintenance,
      totals.Uniform,
      totals.Tax,
      totals.TotalDeduction,
      totals.NetSalary,
      "", "", ""
    ]
  ], { origin: -1 }); // 👈 VERY IMPORTANT (append at end)

  // 👇 header rows like PDF style
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["Ufirm Technologies Private Limited"],
    [`Wage Month: ${month}`],
    [unitName],
    []
  ], { origin: "A1" });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Wage Sheet");

  if (preview) {
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    return URL.createObjectURL(blob);
  } else {
    const fileName = `${unitName} Wages Sheet ${month.replace(" - ", " ")}`;
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
};