import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Downloads a QR code with a template background and dynamic text.
 * @param {Object} options
 * @param {string} options.qrValue - The value to be encoded in the QR code.
 * @param {string} options.name - The name to be displayed on the template (e.g., Task Name).
 * @param {string} options.templatePath - Path to the background image (e.g., '/Assets/task-template.png').
 * @param {string} options.fileName - Name of the downloaded PDF file.
 */
export const downloadQRCode = async ({ qrValue, name, templatePath, fileName }) => {
  if (!qrValue) {
    alert("No QR value found");
    return;
  }

  const resolveTemplateUrl = (path) => {
    const raw = String(path || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("data:")) return raw;

    // Prefer the app's base URL (PUBLIC_URL) when hosted under a sub-path.
    const publicUrl = String(process.env.PUBLIC_URL || "").replace(/\/$/, "");
    if (publicUrl && raw.startsWith("/")) return `${publicUrl}${raw}`;
    return raw;
  };

  const pdf = new jsPDF("p", "mm", "a4");

  const container = document.createElement("div");
  container.style.width = "400px";
  container.style.height = "600px";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-9999px";
  container.style.background = "#fff";

  const img = new Image();
  img.src = resolveTemplateUrl(templatePath);
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.position = "absolute";

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`Failed to load template image: ${img.src || templatePath}`));
    });
  } catch (e) {
    console.error(e);
    alert("Unable to download QR right now (template image failed to load).");
    return;
  }

  container.appendChild(img);

  const qrWrapper = document.createElement("div");
  qrWrapper.innerHTML = renderToStaticMarkup(<QRCode value={qrValue} size={264} />);
  qrWrapper.style.position = "absolute";
  qrWrapper.style.top = "101px";
  qrWrapper.style.left = "58px";
  qrWrapper.style.width = "284px";
  qrWrapper.style.height = "284px";
  qrWrapper.style.padding = "10px";
  qrWrapper.style.background = "#ffffff";

  container.appendChild(qrWrapper);

  const brownBox = document.createElement("div");
  const brownBoxLeft = 58;
  const brownBoxTop = (40.2 / 59.4) * 600;
  const brownBoxWidth = 284;
  const brownBoxHeight = (2.63 / 59.4) * 600;
  brownBox.style.position = "absolute";
  brownBox.style.top = `${brownBoxTop}px`;
  brownBox.style.left = `${brownBoxLeft}px`;
  brownBox.style.width = `${brownBoxWidth}px`;
  brownBox.style.height = `${brownBoxHeight}px`;
  brownBox.style.background = "#3f2a21";
  brownBox.style.zIndex = "1";

  const nameText = document.createElement("div");
  nameText.innerText = (name || "").toUpperCase();
  nameText.style.position = "absolute";
  nameText.style.top = `${brownBoxTop}px`;
  nameText.style.left = `${brownBoxLeft}px`;
  nameText.style.width = `${brownBoxWidth}px`;
  nameText.style.height = `${brownBoxHeight}px`;
  nameText.style.textAlign = "center";
  nameText.style.color = "#ffffff";
  nameText.style.fontSize = "13px";
  nameText.style.fontWeight = "bold";
  nameText.style.letterSpacing = "1px";
  nameText.style.lineHeight = `${brownBoxHeight}px`;
  nameText.style.overflow = "hidden";
  nameText.style.whiteSpace = "nowrap";
  nameText.style.textOverflow = "ellipsis";
  nameText.style.zIndex = "2";

  container.appendChild(brownBox);
  container.appendChild(nameText);

  document.body.appendChild(container);

  await new Promise((resolve) => setTimeout(resolve, 300));

  let canvas;
  try {
    canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
    });
  } catch (e) {
    console.error(e);
    document.body.removeChild(container);
    alert("Unable to download QR right now (render failed).");
    return;
  }

  const imgData = canvas.toDataURL("image/jpeg", 0.7);
  pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);

  document.body.removeChild(container);

  pdf.save(`${fileName || "QR_Code"}.pdf`);
};
