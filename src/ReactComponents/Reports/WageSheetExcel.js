import * as XLSX from "xlsx";

// ================= GENERATE EXCEL =================
export const generateWageSheetExcel = (employees, filters, preview = false) => {

  const { unitName, month } = filters;

  const totals = employees.reduce((acc, emp) => {
    acc.Basic += emp.Basic || 0;
    acc.HRA += emp.HRA || 0;
    acc.Conv += emp.CONV ?? emp.Conveyance ?? 0;
    acc.DA += emp.DA || 0;
    acc.Wash += emp.Washing || 0;
    acc.Spl += emp.SpecialAllowance || 0;
    acc.Other += emp.OtherAllowance || 0;
    acc.Bonus += emp.Bonus || 0;
    acc.TotalSalary += emp.TotalGross || 0;
    acc.OTAmt += emp.OTAmount || 0;
    acc.Gross += emp.Gross || 0;
    acc.PF += emp.PF || 0;
    acc.ESI += emp.ESI || 0;
    acc.LWF += emp.LwfEmployeeAmount ?? 0;
    acc.PT += emp.PftAmount ?? 0;
    acc.Advance += emp.AdvanceDed ?? 0;
    acc.Food += emp.Food || 0;
    acc.Maintenance += emp.Maintenance || 0;
    acc.Uniform += emp.Uniform || 0;
    acc.Tax += emp.IncomeTax || 0;
    acc.Room += emp.Room || 0;
    acc.JoiningKits += emp.JoiningKits || 0;
    acc.BGV += emp.BGV || 0;
    acc.OtherDed += emp.OtherDeduction || 0;
    acc.DocDed += emp.DocumentDeduction || 0;
    acc.Fine += emp.Fine || 0;
    acc.Accommodation += emp.Accommodation || 0;
    acc.Loan += emp.LoanEMI || 0;
    acc.TotalDeduction += emp.TotalDeduction || 0;
    acc.NetSalary += emp.NetSalary || 0;
    return acc;
  }, {
    Basic: 0, HRA: 0, Conv: 0, DA: 0, Wash: 0, Spl: 0, Other: 0, Bonus: 0,
    TotalSalary: 0, OTAmt: 0, Gross: 0,
    PF: 0, ESI: 0, LWF: 0, PT: 0, Advance: 0, Food: 0,
    Maintenance: 0, Uniform: 0, Tax: 0, Room: 0, JoiningKits: 0, BGV: 0, OtherDed: 0, DocDed: 0, Fine: 0, Accommodation: 0, Loan: 0,
    TotalDeduction: 0, NetSalary: 0
  });

  const data = employees.map((emp, i) => ({
    "S.No": i + 1,
    "EMP CODE": emp.EmployeeCode || "-",

    "Name": emp.FacilityMemberName || "-",
    "Father": emp.FatherName || "-",
    "Designation": emp.Designation || "-",

    "Dept": emp.Department || "-",
    "Salary Generated": emp.SalaryGeneratedOn
      ? new Date(emp.SalaryGeneratedOn).toLocaleString("en-IN")
      : "-",
    "UAN": emp.UANNumber || "-",
    "ESI No": emp.ESINumber || "-",

    "Working Days": emp.WorkingDays || 0,
    "Divide by Days": emp.DivideByDays || 0,
    "OT Days": emp.OTDays || 0,
    "OT Hours": emp.OTHours || 0,

    "Basic": emp.Basic || 0,
    "HRA": emp.HRA || 0,
    "Conv": emp.CONV ?? emp.Conveyance ?? 0,
    "DA": emp.DA || 0,
    "Wash": emp.Washing || 0,
    "Spl": emp.SpecialAllowance || 0,
    "Other": emp.OtherAllowance || 0,
    "Bonus": emp.Bonus || 0,
    "Total Salary": emp.TotalGross || 0,
    "OT Amt": emp.OTAmount || 0,
    "Gross": emp.Gross || 0,

    "PF": emp.PF || 0,
    "ESI": emp.ESI || 0,
    "LWF": emp.LwfEmployeeAmount ?? 0,
    "PT": emp.PftAmount ?? 0,
    "Advance": emp.AdvanceDed ?? 0,
    "Food": emp.Food || 0,
    "Maintenance": emp.Maintenance || 0,
    "Uniform": emp.Uniform || 0,
    "Tax": emp.IncomeTax || 0,

    "Room": emp.Room || 0,
    "Joining Kits": emp.JoiningKits || 0,
    "BGV": emp.BGV || 0,
    "Other Ded": emp.OtherDeduction || 0,
    "Doc Ded": emp.DocumentDeduction || 0,
    "Fine": emp.Fine || 0,
    "Acmd": emp.Accommodation || 0,
    "Loan": emp.LoanEMI || 0,

    "Total Deduction": emp.TotalDeduction || 0,
    "Net Salary": emp.NetSalary || 0,

    "Bank": emp.BankName || "-",
    "Account": emp.BankAccountNumber || "-",
    "IFSC": emp.BankIFSCCode || "-",

    "Approved By": emp.ApprovedBy || "-",
    "Approved On": emp.ApprovedOn
      ? new Date(emp.ApprovedOn).toLocaleString("en-IN")
      : "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A5" });

  const headers = data.length ? Object.keys(data[0]) : [];

  const totalRow = headers.map((key, index) => {
    if (index === 0) return "TOTAL";

    switch (key) {
      case "Basic": return totals.Basic;
      case "HRA": return totals.HRA;
      case "Conv": return totals.Conv;
      case "DA": return totals.DA;
      case "Wash": return totals.Wash;
      case "Spl": return totals.Spl;
      case "Other": return totals.Other;
      case "Bonus": return totals.Bonus;
      case "Total Salary": return totals.TotalSalary;
      case "OT Amt": return totals.OTAmt;
      case "Gross": return totals.Gross;
      case "PF": return totals.PF;
      case "ESI": return totals.ESI;
      case "LWF": return totals.LWF;
      case "PT": return totals.PT;
      case "Advance": return totals.Advance;
      case "Food": return totals.Food;
      case "Maintenance": return totals.Maintenance;
      case "Uniform": return totals.Uniform;
      case "Tax": return totals.Tax;
      case "Room": return totals.Room;
      case "Joining Kits": return totals.JoiningKits;
      case "BGV": return totals.BGV;
      case "Other Ded": return totals.OtherDed;
      case "Doc Ded": return totals.DocDed;
      case "Fine": return totals.Fine;
      case "Acmd": return totals.Accommodation;
      case "Loan": return totals.Loan;
      case "Total Deduction": return totals.TotalDeduction;
      case "Net Salary": return totals.NetSalary;
      default: return "";
    }
  });

  XLSX.utils.sheet_add_aoa(worksheet, [[], totalRow], { origin: -1 });

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