import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateWageSheetPDF = (employees, filters) => {
  const doc = new jsPDF("landscape");

  const { clientName, unitName, month } = filters;

  // ================= HEADER =================
  doc.setFontSize(10);
  doc.text("UFIRM TECHNOLOGIES PVT. LTD.", 10, 8);
  doc.text("H-64, SEC-63, NOIDA, UP", 10, 12);

  doc.setFontSize(9);
  doc.text("REGISTER OF WAGES", 130, 10, { align: "center" });

  doc.setFontSize(7);
  doc.text(`Client: ${clientName}`, 10, 18);
  doc.text(`Unit: ${unitName}`, 10, 22);
  doc.text(`Month: ${month}`, 10, 26);

  // ================= HEADERS (REAL FORMAT STYLE) =================
  const head = [
    [
      "EmpCode",
      "Sr.No",
      "Employee Name",
      "Father Name",
      "Bank",
      "Acc No",
      "IFSC",
      "UAN",
      "PF",
      "ESI",
      "Days",
      "Rate",
      "EARNINGS", "", "", "", "", "", "", "", "",
      "DEDUCTION", "", "", "", "", "", "",
      "Net Salary",
      "Signature"
    ],
    [
      "", "", "", "", "", "", "", "", "", "",
      "",
      "Basic",
      "Basic", "DA", "HRA", "Conv", "Wash", "OthAll", "Bonus", "OT", "Gross",
      "PF", "ESI", "LWF", "Food", "Adv", "Fine", "OthDed",
      "",
      ""
    ]
  ];

  // ================= ROWS =================
  const rows = employees.map((emp, index) => [
    emp.EmployeeCode,
    index + 1,
    emp.FacilityMemberName,
    emp.FatherName || "-",
    emp.BankName || "-",
    emp.BankAccountNumber || "-",
    emp.BankIFSCCode || "-",
    emp.UANNumber || "-",
    emp.PF_number || "-",
    emp.ESINumber || "-",
    emp.WorkingDays || 0,

    emp.Basic || 0,

    // Earnings
    emp.Basic || 0,
    emp.DA || 0,
    emp.HRA || 0,
    emp.CONV || 0,
    emp.Wash || 0,
    emp.OTHALL || 0,
    emp.Bonus || 0,
    emp.OTAmount || 0,
    emp.TotalGross || 0,

    // Deduction
    emp.PF || 0,
    emp.ESI || 0,
    emp.LwfEmployeeAmount || 0,
    emp.Food || 0,
    emp.Advance || 0,
    emp.Fine || 0,
    emp.OtherDeduction || 0,

    emp.NetSalary || 0,
    ""
  ]);

  // ================= TABLE =================
  autoTable(doc, {
    head,
    body: rows,
    startY: 30,
    styles: {
      fontSize: 5,
      cellPadding: 1,
      halign: "center"
    },
    columnStyles: {
      2: { halign: "left" },
      3: { halign: "left" }
    },
    theme: "grid",

    didParseCell: (data) => {
      if (data.section === "head" && data.row.index === 0) {
        if (data.column.index === 12) data.cell.colSpan = 9; // earnings
        if (data.column.index === 21) data.cell.colSpan = 7; // deduction
      }
    }
  });

  doc.save("WageSheet.pdf");
};