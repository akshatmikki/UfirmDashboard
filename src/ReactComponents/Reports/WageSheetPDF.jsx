import jsPDF from "jspdf";

export const generateWageSheetPDF = (employees, filters, preview = false) => {
  const doc = new jsPDF("landscape");

  const { unitName, month, logo } = filters;
  const pageWidth = doc.internal.pageSize.getWidth();

  const totals = employees.reduce((acc, emp) => {
    acc.Basic += emp.Basic || 0;
    acc.HRA += emp.HRA || 0;
    acc.Conv += emp.CONV ?? emp.Conveyance ?? 0;
    acc.DA += emp.DA || 0;
    acc.Wash += emp.Washing || 0;
    acc.Spl += emp.SpecialAllowance || 0;
    acc.Other += emp.OtherAllowance || 0;
    acc.Bonus += emp.Bonus || 0;
    acc.OTAmt += emp.OTAmount || 0;
    acc.Gross += emp.Gross || 0;

    acc.PF += emp.PF || 0;
    acc.ESI += emp.ESI || 0;
    acc.LWF += emp.LwfEmployeeAmount || 0;
    acc.PT += emp.PftAmount ?? emp.PT ?? 0;
    acc.Advance += emp.AdvanceDed ?? emp.Advance ?? 0;
    acc.Food += emp.Food || 0;
    acc.Maintenance += emp.Maintenance || 0;
    acc.Uniform += emp.Uniform || 0;
    acc.Room += emp.Room || 0;
    acc.JoiningKits += emp.JoiningKits || 0;
    acc.OtherDed += emp.OtherDeduction || 0;
    acc.DocDed += emp.DocumentDeduction || 0;
    acc.Accommodation += emp.Accommodation || 0;
    acc.Fine += emp.Fine || 0;
    acc.BGV += emp.BGV || 0;

    acc.TotalDeduction += emp.TotalDeduction || 0;
    acc.NetSalary += emp.NetSalary || 0;

    return acc;
  }, {
    Basic: 0, HRA: 0, Conv: 0, DA: 0, Wash: 0, Spl: 0, Other: 0, Bonus: 0, OTAmt: 0, Gross: 0,
    PF: 0, ESI: 0, LWF: 0, PT: 0, Advance: 0, Food: 0, Maintenance: 0, Uniform: 0, Room: 0, JoiningKits: 0, OtherDed: 0, DocDed: 0, Accommodation: 0, Fine: 0, BGV: 0,
    TotalDeduction: 0, NetSalary: 0
  });

  // ================= HEADER =================
  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ufirm Technologies Private Limited", pageWidth / 2, 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("H-64, Sector-63, Noida Uttar Pradesh", pageWidth / 2, 14, { align: "center" });

    doc.setFontSize(6);
    doc.text("FORM XVII", 10, 10);
    doc.text("REGISTER OF WAGES", 10, 14);
    doc.text("[RULE 78 (1) (a) (i)]", 10, 18);

    if (logo) {
      doc.addImage(logo, "PNG", pageWidth - 40, 6, 25, 12);
    }

    doc.line(10, 20, pageWidth - 10, 20);

    doc.setFontSize(7);
    doc.text(`Wages Period Month : ${month}`, 10, 25);
    doc.text(`Unit Name : ${unitName}`, pageWidth / 2, 25, { align: "center" });

    doc.line(10, 28, pageWidth - 10, 28);
  };

  drawHeader();

  // ================= COLUMN HEADER =================
  let startY = 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);

  doc.text("SNO", 10, startY);
  doc.text("EMP CODE", 18, startY);
  doc.text("EMPLOYEE DETAILS", 35, startY);

  doc.text("ATTEND.", 85, startY);
  doc.text("EARNINGS", 139, startY);   // shifted right
  doc.text("DEDUCTIONS", 215, startY); // shifted right

  startY += 6;

  doc.setFont("helvetica", "normal");

  doc.text("Name", 35, startY);
  doc.text("Father", 35, startY + 4);
  doc.text("Desig", 35, startY + 8);

  // Identity
  doc.text("Dept", 60, startY);
  doc.text("UAN", 60, startY + 4);
  doc.text("ESI", 60, startY + 8);

  // ================= ATTENDANCE =================
  doc.text("Days", 78, startY);
  doc.text("Div", 84, startY);   // 👈 Divide by Days
  doc.text("OTD", 89, startY);
  doc.text("OTH", 95, startY);

  // ================= EARNINGS =================
  doc.text("Basic", 109, startY);
  doc.text("HRA", 115, startY);
  doc.text("Conv", 121, startY);
  doc.text("DA", 127, startY);
  doc.text("Wash", 132, startY);
  doc.text("Spl", 139, startY);
  doc.text("Oth", 144, startY);
  doc.text("Bonus", 149, startY);
  doc.text("OT Amt", 156, startY);
  doc.text("Gross", 167, startY);

  // ================= DEDUCTIONS =================
  doc.text("PF", 180, startY);
  doc.text("ESI", 185, startY);
  doc.text("LWF", 191, startY);
  doc.text("PT", 197, startY);
  doc.text("Adv", 202, startY);
  doc.text("Food", 208, startY);
  doc.text("Maint", 214, startY);
  doc.text("Uniform", 220, startY);
  doc.text("Room", 228, startY);
  doc.text("Join", 235, startY);
  doc.text("OthD", 240, startY);
  doc.text("DocD", 246, startY);
  doc.text("Acmd", 252, startY);
  doc.text("Fine", 258, startY);
  doc.text("BGV", 263, startY);

  // Final
  doc.text("Tot Ded", 274, startY);
  doc.text("Net Salary", 286, startY);

  doc.line(10, startY + 10, pageWidth - 10, startY + 10);

  // ================= ROWS =================
  let y = startY + 16;

  employees.forEach((emp, i) => {
    if (y > 190) {
      doc.addPage();
      drawHeader();
      y = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.text(String(i + 1), 10, y);
    doc.text(emp.EmployeeCode || "-", 18, y);

    doc.setFont("helvetica", "normal");
    doc.text(emp.FacilityMemberName || "-", 35, y);
    doc.text(emp.FatherName || "-", 35, y + 4);
    doc.text(emp.Designation || "-", 35, y + 8);

    // Identity
    doc.text(emp.Department || "-", 60, y);
    doc.text(emp.UANNumber || "-", 60, y + 4);
    doc.text(emp.ESINumber || "-", 60, y + 8);

    // ================= ATTENDANCE =================
    doc.text(String(emp.WorkingDays || 0), 78, y);
    doc.text(String(emp.DivideByDays || 0), 84, y);
    doc.text(String(emp.OTDays || 0), 89, y);
    doc.text(String(emp.OTHours || 0), 95, y);

    // ================= EARNINGS =================
    doc.text(String(emp.Basic || 0), 109, y);
    doc.text(String(emp.HRA || 0), 115, y);
    doc.text(String(emp.CONV ?? emp.Conveyance ?? 0), 121, y);
    doc.text(String(emp.DA || 0), 127, y);
    doc.text(String(emp.Washing || 0), 132, y);
    doc.text(String(emp.SpecialAllowance || 0), 139, y);
    doc.text(String(emp.OtherAllowance || 0), 144, y);
    doc.text(String(emp.Bonus || 0), 149, y);
    doc.text(String(emp.OTAmount || 0), 156, y);
    doc.text(String(emp.Gross || 0), 167, y);

    // ================= DEDUCTIONS =================
    doc.text(String(emp.PF || 0), 180, y);
    doc.text(String(emp.ESI || 0), 185, y);
    doc.text(String(emp.LwfEmployeeAmount || 0), 191, y);
    doc.text(String(emp.PftAmount || 0), 197, y);
    doc.text(String(emp.AdvanceDed || 0), 202, y);
    doc.text(String(emp.Food || 0), 208, y);
    doc.text(String(emp.Maintenance || 0), 214, y);
    doc.text(String(emp.Uniform || 0), 220, y);
    doc.text(String(emp.Room || 0), 228, y);
    doc.text(String(emp.JoiningKits || 0), 235, y);
    doc.text(String(emp.OtherDeduction || 0), 240, y);
    doc.text(String(emp.DocumentDeduction || 0), 246, y);
    doc.text(String(emp.Accommodation || 0), 252, y);
    doc.text(String(emp.Fine || 0), 258, y);
    doc.text(String(emp.BGV || 0), 263, y);

    // Final
    doc.text(String(emp.TotalDeduction || 0), 274, y);

    doc.setFont("helvetica", "bold");
    doc.text(String(emp.NetSalary || 0), 286, y);

    // Bank Box
    const boxWidth = 90;
    const boxX = 110;

    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, y + 2, boxWidth, 12, 4, 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);

    doc.text(`BANK: ${emp.BankName || "-"}`, boxX + 2, y + 6);
    doc.text(`A/C: ${emp.BankAccountNumber || "-"}`, boxX + 2, y + 10);
    doc.text(`IFSC: ${emp.BankIFSCCode || "-"}`, boxX + 45, y + 10);
    doc.text(`PayMode: Bank Transfer`, boxX + 45, y + 6);

    doc.line(10, y + 16, pageWidth - 10, y + 16);

    y += 22;
  });

  // ================= TOTAL ROW =================
  if (y > 190) {
    doc.addPage();
    drawHeader();
    y = 40;
  }

  doc.setFont("helvetica", "bold");

  doc.text("TOTAL", 35, y);

  // Earnings
  doc.text(String(totals.Basic), 109, y);
  doc.text(String(totals.HRA), 115, y);
  doc.text(String(totals.Conv), 121, y);
  doc.text(String(totals.DA), 127, y);
  doc.text(String(totals.Wash), 132, y);
  doc.text(String(totals.Spl), 139, y);
  doc.text(String(totals.Other), 144, y);
  doc.text(String(totals.Bonus), 149, y);
  doc.text(String(totals.OTAmt), 156, y);
  doc.text(String(totals.Gross), 167, y);

  // Deductions
  doc.text(String(totals.PF), 180, y);
  doc.text(String(totals.ESI), 185, y);
  doc.text(String(totals.LWF), 191, y);
  doc.text(String(totals.PT), 197, y);
  doc.text(String(totals.Advance), 202, y);
  doc.text(String(totals.Food), 208, y);
  doc.text(String(totals.Maintenance), 214, y);
  doc.text(String(totals.Uniform), 220, y);
  doc.text(String(totals.Room), 228, y);
  doc.text(String(totals.JoiningKits), 235, y);
  doc.text(String(totals.OtherDed), 240, y);
  doc.text(String(totals.DocDed), 246, y);
  doc.text(String(totals.Accommodation), 252, y);
  doc.text(String(totals.Fine), 258, y);
  doc.text(String(totals.BGV), 263, y);

  // Final
  doc.text(String(totals.TotalDeduction), 274, y);
  doc.text(String(totals.NetSalary), 286, y);

  doc.line(10, y + 4, pageWidth - 10, y + 4);

  // ================= PAGE NUMBERS =================
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, 200, {
      align: "right",
    });
  }

  // ================= OUTPUT =================
  if (preview) {
    return doc.output("bloburl");
  } else {
    const fileName = `${unitName} Wages Sheet ${month.replace(" - ", " ")}`;
    doc.save(`${fileName}.pdf`);
  }
};