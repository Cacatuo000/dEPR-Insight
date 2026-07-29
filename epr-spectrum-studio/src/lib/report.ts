import { jsPDF } from "jspdf";
import { computeSpectrum, NU_B, D_CM1_TO_GAUSS, G_E } from "@/lib/engine/physics";
import type { SimConfig, SpectrumParams, OrientationResult, IsotopeResult, Transition } from "@/lib/engine/types";
import type { SavedSimulation } from "@/lib/history";

interface SpectrumArrays {
  fieldAxis: number[];
  absorption: number[];
  derivative: number[];
  stickData: IsotopeResult[];
  orientations: OrientationResult[];
  transitions: Transition[];
}

// Theme colors — matching the design reference palette
const TEAL = "#006970" as const;
const PURPLE = "#6200bc" as const;
const DARK_BG = "#111318" as const;
const WHITE = "#ffffff" as const;
const PRINT_DARK = "#1a1a1a" as const;
const PRINT_GRAY = "#666666" as const;
const PRINT_LIGHT = "#aaaaaa" as const;

// Symbols — written in ASCII because jsPDF's built-in Helvetica lacks Greek/Unicode
const DELTA = "Delta";
const LAMBDA = "lambda";
const NU = "nu";
const GAMMA = "gamma";
const APAR = "A(par)";
const APERP = "A(perp)";
const GPAR = "g(par)";
const GPERP = "g(perp)";
const CM1 = "(cm-1)";
const ZFS_UNIT = "(1e-4 cm-1)";

function paramRow(pdf: jsPDF, y: number, label: string, value: string): number {
  pdf.setFontSize(8.5);
  pdf.setTextColor(PRINT_GRAY);
  pdf.setFont("Helvetica", "normal");
  pdf.text(label, 22, y);
  pdf.setTextColor(PRINT_DARK);
  pdf.setFont("Courier", "normal");
  pdf.text(value, 125, y, { align: "right" });
  return 5.5;
}

function sectionTitle(pdf: jsPDF, y: number, title: string): number {
  pdf.setFontSize(10.5);
  pdf.setTextColor(TEAL);
  pdf.setFont("Helvetica", "bold");
  pdf.text(title, 20, y);
  pdf.setDrawColor(TEAL);
  pdf.setLineWidth(0.3);
  pdf.line(20, y + 2, 190, y + 2);
  return 9;
}

function drawSpectrumCanvas(
  fieldAxis: number[],
  absorption: number[],
  derivative: number[],
  showAbsorption: boolean,
  showDeriv: boolean,
  width: number,
  height: number,
): string {
  const scale = 8;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.scale(scale, scale);
  const pad = { l: 55, r: 30, t: 28, b: 32 };
  const pw = width - pad.l - pad.r;
  const ph = height - pad.t - pad.b;

  // Subtle light background
  ctx.fillStyle = "#fafbfc";
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 0.4;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.t + (ph / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + pw, gy); ctx.stroke();
    const gx = pad.l + (pw / 4) * i;
    ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + ph); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, pad.t + ph);
  ctx.lineTo(pad.l + pw, pad.t + ph);
  ctx.stroke();

  const fMin = fieldAxis[0];
  const fMax = fieldAxis[fieldAxis.length - 1];
  const fRange = fMax - fMin;
  function fx(f: number) { return pad.l + ((f - fMin) / fRange) * pw; }

  // X axis labels
  ctx.fillStyle = PRINT_GRAY;
  ctx.font = "7px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  const fStep = Math.pow(10, Math.floor(Math.log10(fRange / 4)));
  for (let f = Math.ceil(fMin / fStep) * fStep; f <= fMax; f += fStep) {
    ctx.fillText(String(Math.round(f)), fx(f), pad.t + ph + 13);
  }
  ctx.fillStyle = PRINT_DARK;
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  ctx.fillText("Magnetic Field (Gauss)", pad.l + pw / 2, height - 5);

  // --- Absorption ---
  if (showAbsorption) {
  let aMin = Infinity, aMax = -Infinity;
  for (const v of absorption) { if (v < aMin) aMin = v; if (v > aMax) aMax = v; }
  const aRange = aMax - aMin || 1;
  function fyA(a: number) { return pad.t + ph - ((a - aMin) / aRange) * ph; }

  // Fill under absorption curve
  ctx.beginPath();
  ctx.moveTo(fx(fieldAxis[0]), pad.t + ph);
  for (let i = 0; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyA(absorption[i]));
  ctx.lineTo(fx(fieldAxis[fieldAxis.length - 1]), pad.t + ph);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 105, 112, 0.08)";
  ctx.fill();

  // Absorption curve line
  ctx.beginPath();
  ctx.moveTo(fx(fieldAxis[0]), fyA(absorption[0]));
  for (let i = 1; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyA(absorption[i]));
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Y axis labels (absorption)
  ctx.textAlign = "right";
  ctx.fillStyle = PRINT_GRAY;
  ctx.font = "7px 'JetBrains Mono', monospace";
  const aStep = (() => {
    const raw = aRange / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = raw / mag <= 2 ? 1 : raw / mag <= 5 ? 2 : 5;
    return step * mag;
  })();
  for (let a = Math.floor(aMin / aStep) * aStep; a <= aMax; a += aStep) {
    ctx.fillText(a.toFixed(4), pad.l - 7, fyA(a) + 3);
  }
  }

  // Y axis title
  ctx.save();
  ctx.translate(10, pad.t + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PRINT_DARK;
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("Normalized Signal", 0, 0);
  ctx.restore();

  // --- Derivative ---
  if (showDeriv) {
    let dMin = Infinity, dMax = -Infinity;
    for (const v of derivative) { if (v < dMin) dMin = v; if (v > dMax) dMax = v; }
    const dRange = dMax - dMin || 1;
    const dMid = (dMin + dMax) / 2;
    function fyD(d: number) { return pad.t + ph - ((d - dMin) / dRange) * ph; }

    // Zero line
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    ctx.moveTo(fx(fMin), fyD(dMid));
    ctx.lineTo(fx(fMax), fyD(dMid));
    ctx.stroke();
    ctx.restore();

    // Derivative curve
    ctx.beginPath();
    ctx.moveTo(fx(fieldAxis[0]), fyD(derivative[0]));
    for (let i = 1; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyD(derivative[i]));
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = showAbsorption ? 1.0 : 1.1;
    if (showAbsorption) ctx.setLineDash([4, 3]);
    ctx.stroke();
    if (showAbsorption) ctx.setLineDash([]);

    // Y axis labels for derivative-only mode
    if (!showAbsorption) {
      ctx.textAlign = "right";
      ctx.fillStyle = PRINT_GRAY;
      ctx.font = "7px 'JetBrains Mono', monospace";
      const dStep = (() => {
        const raw = dRange / 4;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const step = raw / mag <= 2 ? 1 : raw / mag <= 5 ? 2 : 5;
        return step * mag;
      })();
      for (let d = Math.floor(dMin / dStep) * dStep; d <= dMax; d += dStep) {
        ctx.fillText(d.toFixed(4), pad.l - 7, fyD(d) + 3);
      }
    }
  }

  // Legend box
  const legendItems = (showAbsorption ? 1 : 0) + (showDeriv ? 1 : 0);
  if (legendItems > 0) {
  const lx = pad.l + pw - 110;
  const ly = pad.t + 4;
  const legendH = legendItems * 12 + 4;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(lx, ly, 106, legendH, 3);
  ctx.fill();
  ctx.stroke();

  let itemY = ly + 9;
  if (showAbsorption) {
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx + 6, itemY);
    ctx.lineTo(lx + 22, itemY);
    ctx.stroke();
    ctx.fillStyle = PRINT_DARK;
    ctx.font = "7px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("Absorption", lx + 26, itemY + 2);
    itemY += 12;
  }

  if (showDeriv) {
    ctx.save();
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.5;
    if (showAbsorption) ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(lx + 6, itemY);
    ctx.lineTo(lx + 22, itemY);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PRINT_DARK;
    ctx.textAlign = "left";
    ctx.fillText("1st derivative", lx + 26, itemY + 2);
  }
  }

  return canvas.toDataURL("image/png", 1.0);
}

function formatMs(ms: number): string {
  if (Number.isInteger(ms)) return String(ms);
  const num = ms * 2;
  return num + "/2";
}

function safeLabel(label: string): string {
  return label
    .replace(/\u2016/g, "par")   // ‖ → par
    .replace(/\u22A5/g, "perp"); // ⊥ → perp
}

function buildStickTable(
  stickData: IsotopeResult[],
  orientations: OrientationResult[],
  transitions: Transition[],
  frequency: number,
  D_zfs: number,
): { field: number; intensity: number; transition: string; label: string }[] {
  const rows: { field: number; intensity: number; transition: string; label: string }[] = [];
  orientations.forEach((orient) => {
    const base = NU_B * frequency / orient.g;
    transitions.forEach((trans) => {
      const shiftZfs = trans.shift_factor * D_CM1_TO_GAUSS * D_zfs / orient.g;
      const baseTrans = base + shiftZfs;
      const tLabel = formatMs(trans.ms_start) + " -> " + formatMs(trans.ms_start + 1);
      stickData.forEach((iso) => {
        const pattern = iso[orient.patternKey as keyof typeof iso] as Record<number, number>;
        for (const [spost, inten] of Object.entries(pattern)) {
          if (inten > 1e-4) {
            rows.push({
              field: baseTrans - Number(spost) / orient.g,
              intensity: inten * trans.intensity,
              transition: tLabel,
              label: safeLabel(orient.label) + " . " + iso.isotope,
            });
          }
        }
      });
    });
  });
  rows.sort((a, b) => a.field - b.field);
  return rows.slice(0, 60);
}

function buildParams(
  config: SimConfig,
  gValues: Record<string, number>,
  hfValues: Record<string, { apar: number; aperp: number }>,
): SpectrumParams {
  const A_par: Record<string, number> = {};
  const A_perp: Record<string, number> = {};
  for (const [iso, v] of Object.entries(hfValues)) {
    A_par[iso] = v.apar;
    A_perp[iso] = v.aperp;
  }
  let lambdaEff = 0;
  if (config.lambdaSign === "Auto") {
    if (config.dCount < 5) lambdaEff = config.lambdaMod;
    else if (config.dCount > 5) lambdaEff = -config.lambdaMod;
  } else {
    lambdaEff = config.lambdaSign === "Positive (+)" ? config.lambdaMod : -config.lambdaMod;
  }
  return {
    metalName: config.metalName,
    symmetry: config.symmetry,
    stato: config.stato || undefined,
    lambdaEff,
    dCount: config.dCount,
    Dc: config.Dc,
    Dpar: config.Dpar,
    Dperp: config.Dperp,
    Dx: config.Dx,
    Dy: config.Dy,
    Dz: config.Dz,
    manualG: config.manualG,
    gPar: gValues.gPar,
    gPerp: gValues.gPerp,
    gIso: gValues.gIso,
    gx: gValues.gx,
    gy: gValues.gy,
    gz: gValues.gz,
    A_par,
    A_perp,
    ligands: config.ligandGroups,
    D_zfs: config.D_zfs,
    frequency: config.frequency,
    gamma: config.gamma,
    tumbling: { Rigid: 0, Slow: 0.25, Intermediate: 0.5, Fast: 0.75, Isotropic: 1 }[config.tumbling] ?? 0,
    BMin: config.BMin,
    BMax: config.BMax,
    nPoints: config.nPoints,
    displayMode: config.displayMode,
  };
}

function computeArrays(
  config: SimConfig,
  gValues: Record<string, number>,
  hfValues: Record<string, { apar: number; aperp: number }>,
): SpectrumArrays | null {
  try {
    const params = buildParams(config, gValues, hfValues);
    const result = computeSpectrum(params);
    if (!result) return null;
    return {
      fieldAxis: result.fieldAxis,
      absorption: result.absorption,
      derivative: result.derivative,
      stickData: result.stickData,
      orientations: result.orientations,
      transitions: result.transitions,
    };
  } catch {
    return null;
  }
}

export async function downloadReportPdf(
  sim: SavedSimulation,
  arrays?: SpectrumArrays | null,
): Promise<void> {
  const c = sim.config;
  const g = sim.gValues;
  const hf = sim.hfValues;
  const spectrum = arrays ?? computeArrays(c, g, hf);
  const date = new Date(sim.timestamp).toLocaleString();
  const showDeriv = c.displayMode === "Both" || c.displayMode === "Derivative only";
  const showAbsorption = c.displayMode === "Both" || c.displayMode === "Absorption only";

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  const m = 20;

  // -- Colored header bar --
  pdf.setFillColor(TEAL);
  pdf.rect(0, 0, 210, 16, "F");
  pdf.setFontSize(13);
  pdf.setTextColor(WHITE);
  pdf.setFont("Helvetica", "bold");
  pdf.text("dEPR Insight  —  Simulation Report", m, 10.5);

  pdf.setFillColor(DARK_BG);
  pdf.rect(0, 16, 210, 0.8, "F");
  y = 24;

  // -- Metadata row --
  pdf.setFontSize(7.5);
  pdf.setTextColor(PRINT_GRAY);
  pdf.setFont("Helvetica", "normal");
  pdf.text(date, m, y);
  y += 4.5;
  pdf.setFontSize(9);
  pdf.setTextColor(PRINT_DARK);
  pdf.setFont("Helvetica", "bold");
  pdf.text(c.complexName ?? c.metalName + "  \u2022  " + c.symmetry + "  \u2022  " + c.frequency + " GHz", m, y);
  y += 8;

  // -- Spectrum Settings (first!) --
  y += sectionTitle(pdf, y, "Spectrum Settings");
  y += paramRow(pdf, y, "Frequency " + NU + " (GHz)", String(c.frequency));
  y += paramRow(pdf, y, "Linewidth " + GAMMA + " (Gauss)", String(c.gamma));
  y += paramRow(pdf, y, "Tumbling regime", c.tumbling);
  y += paramRow(pdf, y, "Display mode", c.displayMode);
  y += paramRow(pdf, y, "Field range", c.BMin + " — " + c.BMax + " G");
  y += paramRow(pdf, y, "Data points", String(c.nPoints));
  y += 3;

  // -- Spectrum chart --
  if (spectrum && spectrum.fieldAxis.length > 0) {
    const spectrumTitle = showAbsorption && showDeriv ? "Absorption & Derivative Spectrum"
      : showAbsorption ? "Absorption Spectrum"
      : "Derivative Spectrum";
    y += sectionTitle(pdf, y, spectrumTitle);
    const imgData = drawSpectrumCanvas(
      spectrum.fieldAxis,
      spectrum.absorption,
      spectrum.derivative,
      showAbsorption,
      showDeriv,
      480,
      230,
    );
    if (imgData) {
      pdf.addImage(imgData, "PNG", 14, y, 182, 87);
      y += 93;
    }
    y += 3;
  }

  // -- Complex --
  if (y > 230) { pdf.addPage(); y = 22; }
  y += sectionTitle(pdf, y, "Complex");
  y += paramRow(pdf, y, "Metal center", c.metalName);
  y += paramRow(pdf, y, "Symmetry", c.symmetry);
  if (c.stato) y += paramRow(pdf, y, "Ground state", c.stato);
  const d = c.dCount;
  const S = d <= 5 ? d / 2 : (10 - d) / 2;
  const sDisplay = Number.isInteger(S) ? String(S) : (2 * S) + "/2";
  y += paramRow(pdf, y, "Spin S", sDisplay);
  if (c.ligandGroups.length > 0) {
    const n = c.ligandGroups.length;
    pdf.setFontSize(8.5);
    pdf.setTextColor(PRINT_GRAY);
    pdf.setFont("Helvetica", "normal");
    pdf.text("Ligands", 22, y);
    pdf.setTextColor(PRINT_DARK);
    pdf.setFont("Courier", "normal");
    if (n === 1) {
      const lg = c.ligandGroups[0];
      pdf.text(n + " group: " + lg.isotope + "  n = " + lg.n + "  " + APAR + " = " + lg.A_par + " G", 125, y, { align: "right" });
      y += 5.5;
    } else {
      pdf.text(n + " groups", 125, y, { align: "right" });
      y += 5.5;
      for (const lg of c.ligandGroups) {
        pdf.text(lg.isotope + "  n = " + lg.n + "  " + APAR + " = " + lg.A_par + " G", 125, y, { align: "right" });
        y += 5.5;
      }
    }
    y += 2;
  }
  y += 3;

  // -- g-Factors --
  y += sectionTitle(pdf, y, "g-Factors");
  const parts: string[] = [];
  if (g.gIso != null) parts.push("g = " + g.gIso.toFixed(4));
  if (g.gPar != null) parts.push(GPAR + " = " + g.gPar.toFixed(4));
  if (g.gPerp != null) parts.push(GPERP + " = " + g.gPerp.toFixed(4));
  if (g.gx != null) parts.push("gx = " + g.gx.toFixed(4));
  if (g.gy != null) parts.push("gy = " + g.gy.toFixed(4));
  if (g.gz != null) parts.push("gz = " + g.gz.toFixed(4));
  pdf.setFontSize(10);
  pdf.setTextColor(PRINT_DARK);
  pdf.setFont("Courier", "normal");
  pdf.text(parts.join("  |  "), m, y);
  y += 6;

  const gIsoAvg =
    g.gIso ??
    (g.gPar != null && g.gPerp != null
      ? (g.gPar + 2 * g.gPerp) / 3
      : g.gx != null && g.gy != null && g.gz != null
        ? (g.gx + g.gy + g.gz) / 3
        : G_E);
  pdf.setFontSize(8);
  pdf.setTextColor(PRINT_GRAY);
  pdf.setFont("Helvetica", "italic");
  pdf.text("g_iso avg = " + (typeof gIsoAvg === "number" ? gIsoAvg.toFixed(4) : String(gIsoAvg)) + "  (g_e = " + G_E + ")", m, y);
  y += 6;

  // -- Electronic Parameters --
  y += sectionTitle(pdf, y, "Electronic Parameters");
  y += paramRow(pdf, y, "d electrons", String(c.dCount));
  y += paramRow(pdf, y, LAMBDA + " sign", c.lambdaSign);
  y += paramRow(pdf, y, "|" + LAMBDA + "| " + CM1, String(c.lambdaMod));
  if (c.symmetry === "Cubic / isotropic") {
    y += paramRow(pdf, y, DELTA + " cubic " + CM1, String(c.Dc));
  }
  if (c.symmetry.includes("Axial")) {
    y += paramRow(pdf, y, DELTA + "(par) " + CM1, String(c.Dpar));
    y += paramRow(pdf, y, DELTA + "(perp) " + CM1, String(c.Dperp));
  }
  if (c.symmetry === "Rhombic") {
    y += paramRow(pdf, y, DELTA + "x " + CM1, String(c.Dx));
    y += paramRow(pdf, y, DELTA + "y " + CM1, String(c.Dy));
    y += paramRow(pdf, y, DELTA + "z " + CM1, String(c.Dz));
  }
  if (c.D_zfs > 0) {
    y += paramRow(pdf, y, "ZFS D " + ZFS_UNIT, String(c.D_zfs));
  }
  y += 3;

  // -- Hyperfine Coupling --
  const isoEntries = Object.entries(hf);
  const hyperfineNeeded = isoEntries.length > 0 ? 12 + isoEntries.length * 5 : 0;
  if (isoEntries.length > 0 && y + hyperfineNeeded > 280) { pdf.addPage(); y = 22; }
  y += sectionTitle(pdf, y, "Hyperfine Coupling — Metal Isotopes");
  if (isoEntries.length > 0) {
    pdf.setFontSize(7.5);
    pdf.setTextColor(PRINT_DARK);
    pdf.setFont("Courier", "normal");
    for (const [iso, v] of isoEntries) {
      if (y > 280) { pdf.addPage(); y = 22; }
      pdf.text(iso + "  |  " + APAR + " = " + v.apar + " G  |  " + APERP + " = " + v.aperp + " G", m, y);
      y += 5;
    }
  }
  y += 3;

  // -- Peak table --
  if (spectrum && spectrum.stickData.length > 0) {
    if (y > 210) { pdf.addPage(); y = 22; }
    y += sectionTitle(pdf, y, "Peak Relative Intensities");
    const sticks = buildStickTable(
      spectrum.stickData,
      spectrum.orientations,
      spectrum.transitions,
      c.frequency,
      c.D_zfs,
    );
    if (sticks.length > 0) {
      pdf.setFontSize(7);
      pdf.setTextColor(PRINT_GRAY);
      pdf.setFont("Helvetica", "bold");
      pdf.text("Field (G)", m, y);
      pdf.text("Transition", 65, y);
      pdf.text("Intensity", 100, y, { align: "right" });
      pdf.text("Isotope / Orient.", 115, y);
      y += 3;
      pdf.setDrawColor(TEAL);
      pdf.setLineWidth(0.2);
      pdf.line(m, y, 190, y);
      y += 3.5;

      pdf.setFont("Courier", "normal");
      const maxI = Math.max(...sticks.map((s) => s.intensity)) || 1;
      for (const s of sticks) {
        if (y > 280) { pdf.addPage(); y = 22; }
        pdf.setFontSize(7);
        pdf.setTextColor(PRINT_DARK);
        pdf.text(s.field.toFixed(1), m, y);
        pdf.text(s.transition, 65, y);
        pdf.setTextColor(PRINT_GRAY);
        pdf.text(s.intensity.toFixed(4), 100, y, { align: "right" });
        pdf.setTextColor(PRINT_DARK);
        pdf.text(s.label, 115, y);
        const barW = Math.max(1.5, (s.intensity / maxI) * 28);
        pdf.setFillColor(TEAL);
        pdf.rect(160, y - 1.2, barW, 2, "F");
        y += 4;
      }
    }
  }

  // -- Footer on each page --
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    // Subtle top accent line
    pdf.setDrawColor(TEAL);
    pdf.setLineWidth(0.15);
    pdf.line(20, 17, 190, 17);
    // Bottom footer
    pdf.setFontSize(6.5);
    pdf.setTextColor(PRINT_LIGHT);
    pdf.setFont("Helvetica", "normal");
    pdf.text("dEPR Insight  |  Bernardi, S. (2026)  |  Page " + i + " / " + pageCount, m, 293);
  }

  const safeName = c.metalName.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save("EPR_report_" + safeName + "_" + sim.id.slice(0, 6) + ".pdf");
}
