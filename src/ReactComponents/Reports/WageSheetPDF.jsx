import jsPDF from "jspdf";

export const generateWageSheetPDF = (employees, filters, preview = false) => {
  const doc = new jsPDF("landscape");

  const { unitName, month, logo } = filters;
  const pageWidth = doc.internal.pageSize.getWidth();

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
    doc.text(`${unitName}`, pageWidth / 2, 25, { align: "center" });

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
  doc.text("EARNINGS", 140, startY);
  doc.text("DEDUCTIONS", 220, startY);

  startY += 6;

  doc.setFont("helvetica", "normal");

  doc.text("Name", 35, startY);
  doc.text("Father", 35, startY + 4);
  doc.text("Desig", 35, startY + 8);

  // ✅ Combined Identity Column
  doc.text("Dept", 60, startY);
  doc.text("UAN", 60, startY + 4);
  doc.text("ESI", 60, startY + 8);

  // Attendance
  doc.text("Days", 85, startY);
  doc.text("OTD", 92, startY);
  doc.text("OTH", 100, startY);

  // Earnings
  doc.text("Basic", 108, startY);
  doc.text("HRA", 116, startY);
  doc.text("Conv", 124, startY);
  doc.text("Wash", 132, startY);
  doc.text("Spl", 140, startY);
  doc.text("Oth", 148, startY);
  doc.text("Bonus", 156, startY);
  doc.text("OT Amt", 166, startY);
  doc.text("Gross", 176, startY);

  // Deductions
  doc.text("PF", 188, startY);
  doc.text("ESI", 196, startY);
  doc.text("LWF", 204, startY);
  doc.text("PT", 212, startY);
  doc.text("Adv", 220, startY);
  doc.text("Food", 228, startY);
  doc.text("Maint", 236, startY);
  doc.text("Uniform", 244, startY);
  doc.text("Tax", 252, startY);

  // Final Columns
  doc.text("Tot Ded", 262, startY);
  doc.text("Net Salary", 275, startY);
  doc.text("Sign", 288, startY);

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

    // ✅ Combined Identity Column
    doc.text(emp.Department || "-", 60, y);
    doc.text(emp.UANNumber || "-", 60, y + 4);
    doc.text(emp.ESINumber || "-", 60, y + 8);

    // Attendance
    doc.text(String(emp.WorkingDays || 0), 85, y);
    doc.text(String(emp.OTDays || 0), 92, y);
    doc.text(String(emp.OTHours || 0), 100, y);

    // Earnings
    doc.text(String(emp.Basic || 0), 108, y);
    doc.text(String(emp.HRA || 0), 116, y);
    doc.text(String(emp.CONV ?? emp.Conveyance ?? 0), 124, y);
    doc.text(String(emp.Washing || 0), 132, y);
    doc.text(String(emp.SpecialAllowance || 0), 140, y);
    doc.text(String(emp.OtherAllowance || 0), 148, y);
    doc.text(String(emp.Bonus || 0), 156, y);
    doc.text(String(emp.OTAmount || 0), 166, y);
    doc.text(String(emp.ProratedTotalGross || 0), 176, y);

    // Deductions
    doc.text(String(emp.PF || 0), 188, y);
    doc.text(String(emp.ESI || 0), 196, y);
    doc.text(String(emp.LwfEmployeeAmount || 0), 204, y);
    doc.text(String(emp.PT || 0), 212, y);
    doc.text(String(emp.Advance || 0), 220, y);
    doc.text(String(emp.Food || 0), 228, y);
    doc.text(String(emp.Maintenance || 0), 236, y);
    doc.text(String(emp.Uniform || 0), 244, y);
    doc.text(String(emp.IncomeTax || 0), 252, y);

    // Final Columns
    doc.text(String(emp.TotalDeduction || 0), 262, y);

    doc.setFont("helvetica", "bold");
    doc.text(String(emp.NetSalary || 0), 275, y);

    doc.text("________", 288, y);

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
    doc.save("WageSheet.pdf");
  }
};