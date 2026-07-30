"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";
import { NU_B } from "@/lib/engine/physics";
import type { IsotopeResult, OrientationResult, Transition } from "@/lib/engine/types";

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

const COLORI = ["#dbfcff", "#e5ffba", "#d8b9ff", "#00f0ff", "#a9f900", "#00dbe9", "#a2ef00"];

interface SingleStickSpectrumProps {
  stickData: IsotopeResult[];
  orientation: OrientationResult;
  transitions: Transition[];
  frequency: number;
  className?: string;
}

function SingleStickSpectrum({
  stickData,
  orientation,
  transitions,
  frequency,
  className,
}: SingleStickSpectrumProps) {
  const isMobile = useIsMobile();
  const traces: Data[] = [];
  let yMax = 0;

  const base = NU_B * frequency / orientation.g;

  stickData.forEach((iso, isoIdx) => {
    const xLines: (number | null)[] = [];
    const yLines: (number | null)[] = [];

    transitions.forEach((trans) => {
      const shift_zfs = trans.energy_shift / orientation.g;
      const baseTrans = base + shift_zfs;
      const pattern = iso[orientation.patternKey as keyof typeof iso] as Record<number, number>;
      for (const [spost, inten] of Object.entries(pattern)) {
        if (inten > 1e-6) {
          const B = baseTrans - Number(spost) / orientation.g;
          const int = inten * trans.intensity;
          xLines.push(B, B, null);
          yLines.push(0, int, null);
          if (int > yMax) yMax = int;
        }
      }
    });

    if (xLines.length > 0) {
      traces.push({
        x: xLines,
        y: yLines,
        type: "scatter",
        mode: "lines",
        name: `${iso.isotope} (${(iso.abundance * 100).toFixed(0)}%)`,
        line: { color: COLORI[isoIdx % COLORI.length], width: 1.8 },
        hoverinfo: "x+name",
        hoverlabel: { bgcolor: "rgba(30, 32, 36, 0.95)", font: { color: "#e2e2e8", size: 11 } },
      } as Data);
    }
  });

  if (traces.length === 0) return null;

  yMax = yMax * 1.12;

  const layout: Partial<Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#b9cacb", family: "JetBrains Mono, monospace", size: 11 },
    xaxis: {
      title: { text: "Magnetic Field (Gauss)", font: { color: "#b9cacb", size: 11 } },
      gridcolor: "rgba(255,255,255,0.04)",
      zeroline: false,
      showline: true,
      linecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#849495", size: 9 },
    },
    yaxis: {
      title: { text: "Relative Intensity", font: { color: "#b9cacb", size: 11 } },
      gridcolor: "rgba(255,255,255,0.04)",
      zeroline: false,
      showline: true,
      linecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#849495", size: 9 },
      range: [0, yMax],
    },
    margin: isMobile ? { l: 44, r: 8, t: 48, b: 44 } : { l: 55, r: 15, t: 60, b: 55 },
    autosize: true,
    dragmode: "zoom",
    hovermode: "closest",
    showlegend: true,
    legend: {
      font: { color: "#e2e2e8", size: 10 },
      bgcolor: "rgba(30, 32, 36, 0.85)",
      bordercolor: "rgba(255,255,255,0.08)",
      x: 1,
      xanchor: "right",
      y: 1,
      itemsizing: "constant",
      itemwidth: 30,
    },
    title: {
      text: `${orientation.label}<br><sub>g = ${orientation.g.toFixed(4)}</sub>`,
      font: { color: "#e2e2e8", size: 13 },
      x: 0.02,
      xanchor: "left",
      y: 0.95,
    },
  };

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtons: [["resetScale2d"], ["toImage"]],
    toImageButtonOptions: { format: "png", filename: `EPR_stick_${orientation.label}`, scale: 2 },
  };

  return (
    <div className={className}>
      <Plot
        data={traces}
        layout={layout}
        config={plotConfig}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default function StickSpectrum({
  stickData,
  orientations,
  transitions,
  frequency,
  className,
}: {
  stickData: IsotopeResult[];
  orientations: OrientationResult[];
  transitions: Transition[];
  frequency: number;
  className?: string;
}) {
  if (stickData.length === 0 || orientations.length === 0) return null;

  const cols = orientations.length === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : orientations.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  return (
    <div className={`grid gap-4 ${cols} ${className ?? ""}`}>
      {orientations.map((orient) => (
        <SingleStickSpectrum
          key={orient.label}
          stickData={stickData}
          orientation={orient}
          transitions={transitions}
          frequency={frequency}
          className="min-h-[300px] md:min-h-[380px]"
        />
      ))}
    </div>
  );
}
