"use client";

import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
  font: { color: "#bdc8d1", family: "Inter, sans-serif" },
  xaxis: {
    title: { text: "Magnetic field (Gauss)", font: { color: "#bdc8d1" } },
    gridcolor: "rgba(255,255,255,0.03)",
    zeroline: false,
    showline: true,
    linecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "#87929a" },
  },
  yaxis: {
    title: { text: "Signal (normalized)", font: { color: "#bdc8d1" } },
    gridcolor: "rgba(255,255,255,0.03)",
    zeroline: false,
    showline: true,
    linecolor: "rgba(255,255,255,0.1)",
    tickfont: { color: "#87929a" },
  },
  margin: { l: 60, r: 30, t: 40, b: 60 },
  autosize: true,
  dragmode: "zoom",
  hovermode: "x unified",
};

const plotConfig = {
  responsive: true,
  displayModeBar: true,
  modeBarButtonsToAdd: ["drawline", "drawopenpath", "eraseshape"],
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
  const traces: Data[] = [];

  if (displayMode !== "Derivative only") {
    traces.push({
      x: fieldAxis,
      y: absorption,
      type: "scatter",
      mode: "lines",
      name: "Absorption",
      line: { color: "#8ed5ff", width: 2 },
      fill: "tozeroy",
      fillcolor: "rgba(142, 213, 255, 0.08)",
    });
  }

  if (displayMode !== "Absorption only") {
    traces.push({
      x: fieldAxis,
      y: derivative,
      type: "scatter",
      mode: "lines",
      name: "1st derivative",
      line: { color: "#ffafd3", width: 1.5, dash: displayMode === "Both" ? "dash" : "solid" },
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
    title: title ? { text: title, font: { color: "#dae2fd", size: 15 } } : undefined,
    showlegend: true,
    legend: {
      font: { color: "#dae2fd", size: 11 },
      bgcolor: "rgba(23, 31, 51, 0.8)",
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
