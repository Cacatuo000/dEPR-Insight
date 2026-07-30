"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

interface SpectrumPlotProps {
  fieldAxis: number[];
  absorption: number[];
  derivative: number[];
  displayMode: "Absorption only" | "Derivative only" | "Both";
  experimental?: { field: number[]; signal: number[] };
  title?: string;
  onRelayout?: (layout: Readonly<Partial<Layout>>) => void;
  className?: string;
}

const plotLayout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#b9cacb", family: "JetBrains Mono, monospace" },
  xaxis: {
    title: { text: "Magnetic field (Gauss)", font: { color: "#b9cacb" } },
    gridcolor: "rgba(255,255,255,0.03)",
    zeroline: false,
    showline: true,
    linecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "#849495" },
  },
  yaxis: {
    title: { text: "Signal (normalized)", font: { color: "#b9cacb" } },
    gridcolor: "rgba(255,255,255,0.03)",
    zeroline: false,
    showline: true,
    linecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "#849495" },
  },
  autosize: true,
  dragmode: "zoom",
  hovermode: "x unified",
};

const DELETE_LAST_SVG = {
  width: 18,
  height: 18,
  path: "M13,5 L12.4,4 L5.6,4 L5,5 L3,5 L3,6 L15,6 L15,5 Z M5.5,7 L12.5,7 L12.1,14.8 C12.05,15.5 11.5,16 10.8,16 L7.2,16 C6.5,16 5.95,15.5 5.9,14.8 Z M7,8 L7,14 M9,8 L9,14 M11,8 L11,14",
};

function deleteLastShape(gd: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapes: any[] | undefined = (gd as any)?.layout?.shapes;
  if (shapes && shapes.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Plotly = (window as any).Plotly;
    if (Plotly) {
      Plotly.relayout(gd, { shapes: shapes.slice(0, -1) });
    }
  }
}

const plotConfig = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToAdd: [
    "drawline",
    "drawopenpath",
    "eraseshape",
    {
      name: "Delete last line",
      title: "Remove last drawn line or shape",
      icon: DELETE_LAST_SVG,
      click: deleteLastShape,
    },
  ],
  modeBarButtonsToRemove: ["sendDataToCloud"],
  displaylogo: false,
  toImageButtonOptions: {
    format: "png",
    filename: "EPR_spectrum",
    scale: 2,
  },
};

export default function SpectrumPlot({
  fieldAxis,
  absorption,
  derivative,
  displayMode,
  experimental,
  title,
  onRelayout,
  className,
}: SpectrumPlotProps) {
  const isMobile = useIsMobile();
  const traces: Data[] = [];

  if (displayMode !== "Derivative only") {
    traces.push({
      x: fieldAxis,
      y: absorption,
      type: "scatter",
      mode: "lines",
      name: "Absorption",
      line: { color: "#dbfcff", width: 2 },
      fill: "tozeroy",
      fillcolor: "rgba(219, 252, 255, 0.08)",
    });
  }

  if (displayMode !== "Absorption only") {
    traces.push({
      x: fieldAxis,
      y: derivative,
      type: "scatter",
      mode: "lines",
      name: "1st derivative",
      line: { color: "#d8b9ff", width: 1.5, dash: displayMode === "Both" ? "dash" : "solid" },
    });
  }

  if (experimental) {
    traces.push({
      x: experimental.field,
      y: experimental.signal,
      type: "scatter",
      mode: "lines",
      name: "Experimental",
      line: { color: "#ffffff", width: 1.2, dash: "dash" },
    });
  }

  const layout = {
    ...plotLayout,
    title: title ? { text: title, font: { color: "#e2e2e8", size: 15 } } : undefined,
    margin: isMobile ? { l: 44, r: 10, t: 30, b: 50 } : { l: 60, r: 30, t: 40, b: 60 },
    showlegend: true,
    legend: {
      font: { color: "#e2e2e8", size: 11 },
      bgcolor: "rgba(30, 32, 36, 0.8)",
      x: 1,
      xanchor: "right",
      y: 1,
    },
  };

  return (
    <div className={className}>
      <Plot
        data={traces}
        layout={layout}
        config={plotConfig}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        onRelayout={onRelayout}
      />
    </div>
  );
}
