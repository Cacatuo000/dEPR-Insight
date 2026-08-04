import Plotly from "plotly.js/dist/plotly";
import type { Config, Data, DownloadImgopts, Layout, ScatterData } from "plotly.js";

export const plotly = Plotly;

export interface PngVariant {
  filename: string;
  background: string;
  fontColor: string;
  titleColor: string;
  mutedColor: string;
  gridColor: string;
  axisColor: string;
  legendBg: string;
  legendBorder: string;
  hoverBg: string;
  hoverText: string;
  traceColors: Record<string, string>;
  fillColors: Record<string, string>;
}

export const DOWNLOAD_DARK_ICON = {
  width: 18,
  height: 18,
  path: "M9 2.25 A4.5 4.5 0 0 0 15.75 9 A6.75 6.75 0 1 1 9 2.25 Z",
};

export const DOWNLOAD_WHITE_ICON = {
  width: 18,
  height: 18,
  path: [
    "M8.1 1.2 L9.9 1.2 L9.9 3.1 L8.1 3.1 Z",
    "M8.1 14.9 L9.9 14.9 L9.9 16.8 L8.1 16.8 Z",
    "M1.2 8.1 L3.1 8.1 L3.1 9.9 L1.2 9.9 Z",
    "M14.9 8.1 L16.8 8.1 L16.8 9.9 L14.9 9.9 Z",
    "M3.1 1.8 L4.9 3.6 L3.1 5.4 L1.3 3.6 Z",
    "M13.1 1.8 L14.9 3.6 L13.1 5.4 L11.3 3.6 Z",
    "M3.1 12.6 L4.9 14.4 L3.1 16.2 L1.3 14.4 Z",
    "M13.1 12.6 L14.9 14.4 L13.1 16.2 L11.3 14.4 Z",
    "M9 6.6 A2.4 2.4 0 1 0 9 11.4 A2.4 2.4 0 0 0 9 6.6 Z",
  ].join(" "),
};

type AxisLike = {
  title?: { font?: { color?: string; size?: number; family?: string } } | undefined;
  gridcolor?: string;
  linecolor?: string;
  tickfont?: { color?: string; size?: number; family?: string };
};

function styleAxis(axis: unknown, variant: PngVariant): void {
  if (!axis || typeof axis !== "object") return;
  const ax = axis as AxisLike;
  if (ax.title && typeof ax.title === "object") {
    ax.title.font = { ...ax.title.font, color: variant.fontColor };
  }
  ax.gridcolor = variant.gridColor;
  ax.linecolor = variant.axisColor;
  if (ax.tickfont) {
    ax.tickfont = { ...ax.tickfont, color: variant.mutedColor };
  }
}

export function downloadPng(gd: unknown, variant: PngVariant): void {
  if (!gd || typeof gd !== "object") return;
  const graph = gd as {
    data?: Data[];
    layout?: Partial<Layout>;
    _context?: Partial<Config>;
  } | null;
  if (!graph || !Array.isArray(graph.data) || !graph.layout) return;

  const data = JSON.parse(JSON.stringify(graph.data)) as ScatterData[];
  const layout = JSON.parse(JSON.stringify(graph.layout)) as Partial<Layout> & {
    title?: { text?: string; font?: { color?: string; size?: number; family?: string } };
    legend?: {
      bgcolor?: string;
      bordercolor?: string;
      font?: { color?: string; size?: number; family?: string };
    };
    hoverlabel?: {
      bgcolor?: string;
      font?: { color?: string; size?: number; family?: string };
    };
  };

  layout.paper_bgcolor = variant.background;
  layout.plot_bgcolor = variant.background;

  if (layout.font && typeof layout.font === "object") {
    layout.font = { ...layout.font, color: variant.fontColor };
  }
  styleAxis(layout.xaxis, variant);
  styleAxis(layout.yaxis, variant);

  if (layout.title && typeof layout.title === "object") {
    layout.title.font = { ...(layout.title.font ?? {}), color: variant.titleColor };
  }
  if (layout.legend && typeof layout.legend === "object") {
    layout.legend.font = { ...(layout.legend.font ?? {}), color: variant.fontColor };
    layout.legend.bgcolor = variant.legendBg;
    layout.legend.bordercolor = variant.legendBorder;
  }
  if (layout.hoverlabel && typeof layout.hoverlabel === "object") {
    layout.hoverlabel.bgcolor = variant.hoverBg;
    layout.hoverlabel.font = { ...(layout.hoverlabel.font ?? {}), color: variant.hoverText };
  }

  data.forEach((trace) => {
    const key = typeof trace.name === "string" ? trace.name : "";
    const lineColor = variant.traceColors[key];
    const fillColor = variant.fillColors[key];
    if (lineColor) trace.line = { ...trace.line, color: lineColor };
    if (fillColor) trace.fillcolor = fillColor;
    if (trace.hoverlabel) {
      trace.hoverlabel = {
        ...trace.hoverlabel,
        bgcolor: variant.hoverBg,
        font: { ...(trace.hoverlabel.font ?? {}), color: variant.hoverText },
      };
    }
  });

  const el = gd as HTMLElement;
  const width = el.offsetWidth > 0 ? el.offsetWidth : null;
  const height = el.offsetHeight > 0 ? el.offsetHeight : null;

  void Plotly.downloadImage(
    { data, layout, config: graph._context },
    { format: "png", width, height, filename: variant.filename, scale: 2 } as DownloadImgopts
  );
}
