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

const DARK = "#222222" as const;
const GRAY = "#555555" as const;
const LIGHT = "#999999" as const;
const BLUE = "#00668a" as const;
const PINK = "#b33078" as const;
const WHITE = "#ffffff" as const;

// ASCII-safe replacements for symbols jsPDF Helvetica doesn't render well
const DELTA = "Delta";
const LAMBDA = "lambda";
const NU = "nu";
const GAMMA = "gamma";
const APAR = "A(||)";
const APERP = "A(|_)";
const GPAR = "g(||)";
const GPERP = "g(|_)";
const CM1 = "(cm^-1)";
const ZFS_UNIT = "(1e-4 cm^-1)";

function paramRow(pdf: jsPDF, y: number, label: string, value: string): number {
  pdf.setFontSize(9);
  pdf.setTextColor(GRAY);
  pdf.setFont("Helvetica", "normal");
  pdf.text(label, 20, y);
  pdf.setTextColor(DARK);
  pdf.setFont("Courier", "normal");
  pdf.text(value, 120, y, { align: "right" });
  return 6;
}

function sectionTitle(pdf: jsPDF, y: number, title: string): number {
  pdf.setFontSize(11);
  pdf.setTextColor(BLUE);
  pdf.setFont("Helvetica", "bold");
  pdf.text(title, 20, y);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.08);
  pdf.line(20, y + 2.5, 190, y + 2.5);
  return 10;
}

function drawSpectrumCanvas(
  fieldAxis: number[],
  absorption: number[],
  derivative: number[],
  showDeriv: boolean,
  width: number,
  height: number,
): string {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.scale(scale, scale);
  const pad = { l: 50, r: 25, t: 20, b: 30 };
  const pw = width - pad.l - pad.r;
  const ph = height - pad.t - pad.b;

  // White background
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.t + (ph / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + pw, gy); ctx.stroke();
    const gx = pad.l + (pw / 4) * i;
    ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, pad.t + ph); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 0.8;
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
  ctx.fillStyle = GRAY;
  ctx.font = "7px monospace";
  ctx.textAlign = "center";
  const fStep = Math.pow(10, Math.floor(Math.log10(fRange / 4)));
  for (let f = Math.ceil(fMin / fStep) * fStep; f <= fMax; f += fStep) {
    ctx.fillText(String(Math.round(f)), fx(f), pad.t + ph + 12);
  }
  ctx.fillStyle = DARK;
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Magnetic Field (Gauss)", pad.l + pw / 2, height - 4);

  // --- Absorption ---
  let aMin = Infinity, aMax = -Infinity;
  for (const v of absorption) { if (v < aMin) aMin = v; if (v > aMax) aMax = v; }
  const aRange = aMax - aMin || 1;
  function fyA(a: number) { return pad.t + ph - ((a - aMin) / aRange) * ph; }

  // Fill
  ctx.beginPath();
  ctx.moveTo(fx(fieldAxis[0]), pad.t + ph);
  for (let i = 0; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyA(absorption[i]));
  ctx.lineTo(fx(fieldAxis[fieldAxis.length - 1]), pad.t + ph);
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 102, 138, 0.10)";
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(fx(fieldAxis[0]), fyA(absorption[0]));
  for (let i = 1; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyA(absorption[i]));
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Y axis labels (absorption)
  ctx.textAlign = "right";
  ctx.fillStyle = GRAY;
  ctx.font = "7px monospace";
  const aStep = (() => {
    const raw = aRange / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = raw / mag <= 2 ? 1 : raw / mag <= 5 ? 2 : 5;
    return step * mag;
  })();
  for (let a = Math.floor(aMin / aStep) * aStep; a <= aMax; a += aStep) {
    ctx.fillText(a.toFixed(4), pad.l - 6, fyA(a) + 3);
  }

  // Y axis title
  ctx.save();
  ctx.translate(10, pad.t + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = DARK;
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Absorption", 0, 0);
  ctx.restore();

  // --- Derivative ---
  if (showDeriv) {
    let dMin = Infinity, dMax = -Infinity;
    for (const v of derivative) { if (v < dMin) dMin = v; if (v > dMax) dMax = v; }
    const dRange = dMax - dMin || 1;
    const dMid = (dMin + dMax) / 2;
    function fyD(d: number) { return pad.t + ph - ((d - dMin) / dRange) * ph; }

    // Zero line
    ctx.beginPath();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 0.6;
    ctx.moveTo(fx(fMin), fyD(dMid));
    ctx.lineTo(fx(fMax), fyD(dMid));
    ctx.stroke();
    ctx.setLineDash([]);

    // Derivative curve
    ctx.beginPath();
    ctx.moveTo(fx(fieldAxis[0]), fyD(derivative[0]));
    for (let i = 1; i < fieldAxis.length; i++) ctx.lineTo(fx(fieldAxis[i]), fyD(derivative[i]));
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Derivative label
    ctx.fillStyle = PINK;
    ctx.font = "italic 8px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("1st derivative", pad.l + 6, pad.t + 12);
  }

  // Legend
  ctx.fillStyle = BLUE;
  ctx.font = "8px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("-- Absorption", pad.l + 6, pad.t + (showDeriv ? 26 : 12));

  return canvas.toDataURL("image/png", 1.0);
}

function formatMs(ms: number): string {
  if (Number.isInteger(ms)) return String(ms);
  const num = ms * 2;
  return num + "/2";
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
              label: orient.label + " . " + iso.isotope,
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

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  const m = 20;

  // -- Title --
  pdf.setFontSize(18);
  pdf.setTextColor(BLUE);
  pdf.setFont("Helvetica", "bold");
  pdf.text("dEPR Insight -- Simulation Report", m, y);
  y += 7;
  pdf.setFontSize(9);
  pdf.setTextColor(GRAY);
  pdf.setFont("Helvetica", "normal");
  pdf.text(date + "  |  " + c.metalName + "  |  " + c.symmetry, m, y);
  y += 10;

  // -- Complex --
  y += sectionTitle(pdf, y, "Complex");
  y += paramRow(pdf, y, "Metal center", c.metalName);
  y += paramRow(pdf, y, "Symmetry", c.symmetry);
  if (c.stato) y += paramRow(pdf, y, "Ground state", c.stato);
  const d = c.dCount;
  const S = d % 2 === 0 ? (11 - d) / 2 : (11 - d) / 2;
  y += paramRow(pdf, y, "Spin S", String(S));
  y += 4;

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
  pdf.setTextColor(DARK);
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
  pdf.setFontSize(9);
  pdf.setTextColor(GRAY);
  pdf.setFont("Helvetica", "italic");
  pdf.text("g_iso avg = " + (typeof gIsoAvg === "number" ? gIsoAvg.toFixed(4) : String(gIsoAvg)) + "  (g_e = " + G_E + ")", m, y);
  y += 6;

  // -- Electronic --
  y += sectionTitle(pdf, y, "Electronic Parameters");
  y += paramRow(pdf, y, "d electrons", String(c.dCount));
  y += paramRow(pdf, y, LAMBDA + " sign", c.lambdaSign);
  y += paramRow(pdf, y, "|" + LAMBDA + "| " + CM1, String(c.lambdaMod));
  if (c.symmetry === "Cubic / isotropic") {
    y += paramRow(pdf, y, DELTA + " cubic " + CM1, String(c.Dc));
  }
  if (c.symmetry.includes("Axial")) {
    y += paramRow(pdf, y, DELTA + "(||) " + CM1, String(c.Dpar));
    y += paramRow(pdf, y, DELTA + "(|_) " + CM1, String(c.Dperp));
  }
  if (c.symmetry === "Rhombic") {
    y += paramRow(pdf, y, DELTA + "x " + CM1, String(c.Dx));
    y += paramRow(pdf, y, DELTA + "y " + CM1, String(c.Dy));
    y += paramRow(pdf, y, DELTA + "z " + CM1, String(c.Dz));
  }
  if (c.D_zfs > 0) {
    y += paramRow(pdf, y, "ZFS D " + ZFS_UNIT, String(c.D_zfs));
  }
  y += 4;

  // -- Spectrum chart --
  if (spectrum && spectrum.fieldAxis.length > 0) {
    if (y > 190) { pdf.addPage(); y = 20; }
    y += sectionTitle(pdf, y, showDeriv ? "Absorption & Derivative Spectrum" : "Absorption Spectrum");
    const imgData = drawSpectrumCanvas(
      spectrum.fieldAxis,
      spectrum.absorption,
      spectrum.derivative,
      showDeriv,
      460,
      220,
    );
    if (imgData) {
      pdf.addImage(imgData, "PNG", 15, y, 180, 86);
      y += 92;
    }
    y += 4;
  }

  // -- Hyperfine --
  y += sectionTitle(pdf, y, "Hyperfine Coupling - Metal Isotopes");
  const isoEntries = Object.entries(hf);
  if (isoEntries.length > 0) {
    pdf.setFontSize(8);
    pdf.setTextColor(DARK);
    pdf.setFont("Courier", "normal");
    for (const [iso, v] of isoEntries) {
      pdf.text(iso + "  |  " + APAR + " = " + v.apar + " G  |  " + APERP + " = " + v.aperp + " G", m, y);
      y += 5;
    }
  }
  y += 4;

  // -- Ligands --
  if (c.ligandGroups.length > 0) {
    y += sectionTitle(pdf, y, "Ligand Nuclei");
    pdf.setFontSize(8);
    pdf.setTextColor(DARK);
    pdf.setFont("Courier", "normal");
    for (const lg of c.ligandGroups) {
      pdf.text(lg.isotope + "  |  n = " + lg.n + "  |  " + APAR + " = " + lg.A_par + " G", m, y);
      y += 5;
    }
    y += 4;
  }

  // -- Peak table --
  if (spectrum && spectrum.stickData.length > 0) {
    if (y > 220) { pdf.addPage(); y = 20; }
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
      pdf.setTextColor(GRAY);
      pdf.setFont("Helvetica", "bold");
      pdf.text("Field (G)", m, y);
      pdf.text("Transition", 65, y);
      pdf.text("Intensity", 100, y, { align: "right" });
      pdf.text("Isotope / Orient.", 115, y);
      y += 3;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(m, y, 190, y);
      y += 3;

      pdf.setFont("Courier", "normal");
      const maxI = Math.max(...sticks.map((s) => s.intensity)) || 1;
      for (const s of sticks) {
        if (y > 278) { pdf.addPage(); y = 20; }
        pdf.setFontSize(7.5);
        pdf.setTextColor(DARK);
        pdf.text(s.field.toFixed(1), m, y);
        pdf.text(s.transition, 65, y);
        pdf.setTextColor(GRAY);
        pdf.text(s.intensity.toFixed(4), 100, y, { align: "right" });
        pdf.setTextColor(DARK);
        pdf.text(s.label, 115, y);
        const barW = Math.max(1, (s.intensity / maxI) * 30);
        pdf.setFillColor(0, 102, 138);
        pdf.rect(160, y - 1.2, barW, 1.8, "F");
        y += 4;
      }
    }
  }

  // -- Spectrum settings --
  if (y > 240) { pdf.addPage(); y = 20; }
  y += 2;
  y += sectionTitle(pdf, y, "Spectrum Settings");
  y += paramRow(pdf, y, "Frequency " + NU + " (GHz)", String(c.frequency));
  y += paramRow(pdf, y, "Linewidth " + GAMMA + " (Gauss)", String(c.gamma));
  y += paramRow(pdf, y, "Tumbling", c.tumbling);
  y += paramRow(pdf, y, "Display mode", c.displayMode);
  y += paramRow(pdf, y, "Field range", c.BMin + " - " + c.BMax + " G");
  y += paramRow(pdf, y, "Data points", String(c.nPoints));

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(LIGHT);
    pdf.setFont("Helvetica", "normal");
    pdf.text("dEPR Insight | Bernardi, S. (2026) | Page " + i + "/" + pageCount, m, 292);
  }

  const safeName = c.metalName.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save("EPR_report_" + safeName + "_" + sim.id.slice(0, 6) + ".pdf");
}
