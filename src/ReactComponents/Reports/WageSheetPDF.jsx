import jsPDF from "jspdf";

export const generateWageSheetPDF = (employees, filters, preview = false) => {
  const doc = new jsPDF("landscape");

  const { unitName, month, logo } = filters;
  const pageWidth = doc.internal.pageSize.getWidth();

  const totals = employees.reduce((acc, emp) => {
    acc.Basic += emp.Basic || 0;
    acc.HRA += emp.HRA || 0;
    acc.Conv += emp.CONV ?? emp.Conveyance ?? 0;
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
    acc.Tax += emp.IncomeTax || 0;

    acc.TotalDeduction += emp.TotalDeduction || 0;
    acc.NetSalary += emp.NetSalary || 0;

    return acc;
  }, {
    Basic: 0, HRA: 0, Conv: 0, Wash: 0, Spl: 0, Other: 0, Bonus: 0, OTAmt: 0, Gross: 0,
    PF: 0, ESI: 0, LWF: 0, PT: 0, Advance: 0, Food: 0, Maintenance: 0, Uniform: 0, Tax: 0,
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
  doc.text("EMP NO", 18, startY);
  doc.text("EMPLOYEE DETAILS", 35, startY);

  doc.text("ATTEND.", 85, startY);
  doc.text("EARNINGS", 150, startY);   // shifted right
  doc.text("DEDUCTIONS", 230, startY); // shifted right

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
  doc.text("Days", 85, startY);
  doc.text("Div", 93, startY);   // 👈 Divide by Days
  doc.text("OTD", 101, startY);
  doc.text("OTH", 109, startY);

  // ================= EARNINGS =================
  doc.text("Basic", 120, startY);
  doc.text("HRA", 128, startY);
  doc.text("Conv", 136, startY);
  doc.text("Wash", 144, startY);
  doc.text("Spl", 152, startY);
  doc.text("Oth", 160, startY);
  doc.text("Bonus", 168, startY);
  doc.text("OT Amt", 178, startY);
  doc.text("Gross", 188, startY);

  // ================= DEDUCTIONS =================
  doc.text("PF", 200, startY);
  doc.text("ESI", 208, startY);
  doc.text("LWF", 216, startY);
  doc.text("PT", 224, startY);
  doc.text("Adv", 232, startY);
  doc.text("Food", 240, startY);
  doc.text("Maint", 248, startY);
  doc.text("Uniform", 256, startY);
  doc.text("Tax", 264, startY);

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
    doc.text(String(emp.WorkingDays || 0), 85, y);
    doc.text(String(emp.DivideByDays || 0), 93, y);
    doc.text(String(emp.OTDays || 0), 101, y);
    doc.text(String(emp.OTHours || 0), 109, y);

    // ================= EARNINGS =================
    doc.text(String(emp.Basic || 0), 120, y);
    doc.text(String(emp.HRA || 0), 128, y);
    doc.text(String(emp.CONV ?? emp.Conveyance ?? 0), 136, y);
    doc.text(String(emp.Washing || 0), 144, y);
    doc.text(String(emp.SpecialAllowance || 0), 152, y);
    doc.text(String(emp.OtherAllowance || 0), 160, y);
    doc.text(String(emp.Bonus || 0), 168, y);
    doc.text(String(emp.OTAmount || 0), 178, y);
    doc.text(String(emp.Gross || 0), 188, y);

    // ================= DEDUCTIONS =================
    doc.text(String(emp.PF || 0), 200, y);
    doc.text(String(emp.ESI || 0), 208, y);
    doc.text(String(emp.LwfEmployeeAmount || 0), 216, y);
    doc.text(String(emp.PftAmount || 0), 224, y);
    doc.text(String(emp.AdvanceDed || 0), 232, y);
    doc.text(String(emp.Food || 0), 240, y);
    doc.text(String(emp.Maintenance || 0), 248, y);
    doc.text(String(emp.Uniform || 0), 256, y);
    doc.text(String(emp.IncomeTax || 0), 264, y);

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
  doc.text(String(totals.Basic), 120, y);
  doc.text(String(totals.HRA), 128, y);
  doc.text(String(totals.Conv), 136, y);
  doc.text(String(totals.Wash), 144, y);
  doc.text(String(totals.Spl), 152, y);
  doc.text(String(totals.Other), 160, y);
  doc.text(String(totals.Bonus), 168, y);
  doc.text(String(totals.OTAmt), 178, y);
  doc.text(String(totals.Gross), 188, y);

  // Deductions
  doc.text(String(totals.PF), 200, y);
  doc.text(String(totals.ESI), 208, y);
  doc.text(String(totals.LWF), 216, y);
  doc.text(String(totals.PT), 224, y);
  doc.text(String(totals.Advance), 232, y);
  doc.text(String(totals.Food), 240, y);
  doc.text(String(totals.Maintenance), 248, y);
  doc.text(String(totals.Uniform), 256, y);
  doc.text(String(totals.Tax), 264, y);

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