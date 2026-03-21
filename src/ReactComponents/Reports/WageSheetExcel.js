import * as XLSX from "xlsx";

// ================= GENERATE EXCEL =================
export const generateWageSheetExcel = (employees, filters, preview = false) => {

  const { unitName, month } = filters;

  const data = employees.map((emp, i) => ({
    "S.No": i + 1,
    "EMP NO": emp.EmployeeCode || "-",

    "Name": emp.FacilityMemberName || "-",
    "Father": emp.FatherName || "-",
    "Designation": emp.Designation || "-",

    "Dept": emp.Department || "-",
    "UAN": emp.UANNumber || "-",
    "ESI No": emp.ESINumber || "-",

    "Days": emp.WorkingDays || 0,
    "OT Days": emp.OTDays || 0,
    "OT Hours": emp.OTHours || 0,

    "Basic": emp.Basic || 0,
    "HRA": emp.HRA || 0,
    "Conv": emp.CONV ?? emp.Conveyance ?? 0,
    "Wash": emp.Washing || 0,
    "Spl": emp.SpecialAllowance || 0,
    "Other": emp.OtherAllowance || 0,
    "Bonus": emp.Bonus || 0,
    "OT Amt": emp.OTAmount || 0,
    "Gross": emp.ProratedTotalGross || 0,

    "PF": emp.PF || 0,
    "ESI": emp.ESI || 0,
    "LWF": emp.LwfEmployeeAmount || 0,
    "PT": emp.PT || 0,
    "Advance": emp.Advance || 0,
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