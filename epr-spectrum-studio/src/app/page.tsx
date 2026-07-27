"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ParameterPanel } from "@/components/ParameterPanel";
import { computeSpectrum, computeGValues, NU_B, G_E, D_CM1_TO_GAUSS } from "@/lib/engine/physics";
import { metalli } from "@/lib/engine/metals";
import { legantiLibreria } from "@/lib/engine/ligands";
import type { SimConfig, SpectrumResult } from "@/lib/engine/types";

const SpectrumPlot = dynamic(() => import("@/components/plots/SpectrumPlot"), { ssr: false });

type Tab = "spectra" | "parameters" | "splitting" | "export";

function getInitialHf(metalName: string): Record<string, { apar: number; aperp: number }> {
  const metal = metalli[metalName];
  if (!metal) return {};
  const hf: Record<string, { apar: number; aperp: number }> = {};
  for (const iso of metal.isotopes) {
    const apar = typeof metal.A_par_default === "number" ? metal.A_par_default : metal.A_par_default[iso.label] ?? 0;
    const aperp = typeof metal.A_perp_default === "number" ? metal.A_perp_default : metal.A_perp_default[iso.label] ?? 0;
    hf[iso.label] = { apar, aperp };
  }
  return hf;
}

function getDefaultConfig(): SimConfig {
  return {
    metalName: "Copper (Cu2+)",
    symmetry: "Axial (D4h / C4v / D3h)",
    stato: "d_x2-y2, elongated octahedral (D4h)",
    lambdaMod: 800,
    lambdaSign: "Auto",
    dCount: 9,
    Dc: 10000,
    Dpar: 15000,
    Dperp: 8000,
    Dx: 8000,
    Dy: 10000,
    Dz: 15000,
    manualG: false,
    gPar: 2.2,
    gPerp: 2.05,
    gIso: 2.1,
    gx: 2.1,
    gy: 2.1,
    gz: 2.2,
    frequency: 9.5,
    gamma: 8,
    tumbling: "Rigid",
    BMin: 1000,
    BMax: 6000,
    nPoints: 6000,
    displayMode: "Both",
    D_zfs: 0,
    ligandGroups: [],
  };
}

const tumblingMap: Record<string, number> = {
  Rigid: 0, Slow: 0.25, Intermediate: 0.5, Fast: 0.75, Isotropic: 1,
};

const COLORI = ["#4fc3f7", "#ff8a65", "#81c784", "#e57373", "#ba68c8", "#f06292", "#4dd0e1"];

export default function Home() {
  const [config, setConfig] = useState<SimConfig>(getDefaultConfig);
  const [activeTab, setActiveTab] = useState<Tab>("spectra");
  const [result, setResult] = useState<SpectrumResult | null>(null);
  const [hfValues, setHfValues] = useState<Record<string, { apar: number; aperp: number }>>(() => getInitialHf("Copper (Cu2+)"));

  const onChange = useCallback(<K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      if (key === "metalName" && typeof value === "string") {
        setHfValues(getInitialHf(value));
      }
      if (key === "symmetry" && value === "Cubic / isotropic") {
        next.stato = "";
      }
      return next;
    });
  }, []);

  const metal = metalli[config.metalName];
  const S = metal?.S ?? 0.5;

  const lambdaEff = useMemo(() => {
    const sign = config.lambdaSign === "Auto"
      ? (config.dCount < 5 ? 1 : config.dCount > 5 ? -1 : 0)
      : config.lambdaSign === "Positive (+)" ? 1 : -1;
    return sign * config.lambdaMod;
  }, [config.lambdaSign, config.lambdaMod, config.dCount]);

  const gValues = useMemo(() => {
    if (config.manualG) {
      if (config.symmetry === "Cubic / isotropic") return { gIso: config.gIso };
      if (config.symmetry === "Axial (D4h / C4v / D3h)") return { gPar: config.gPar, gPerp: config.gPerp };
      return { gx: config.gx, gy: config.gy, gz: config.gz };
    }
    return computeGValues({
      symmetry: config.symmetry,
      stato: config.stato,
      lambdaEff,
      Dc: config.Dc,
      Dpar: config.Dpar,
      Dperp: config.Dperp,
      Dx: config.Dx,
      Dy: config.Dy,
      Dz: config.Dz,
    });
  }, [config.symmetry, config.stato, lambdaEff, config.Dc, config.Dpar, config.Dperp, config.Dx, config.Dy, config.Dz, config.manualG, config.gPar, config.gPerp, config.gIso, config.gx, config.gy, config.gz]);

  const params = useMemo(() => {
    const A_par: Record<string, number> = {};
    const A_perp: Record<string, number> = {};
    for (const [iso, vals] of Object.entries(hfValues)) {
      A_par[iso] = vals.apar;
      A_perp[iso] = vals.aperp;
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
      tumbling: tumblingMap[config.tumbling] ?? 0,
      BMin: config.BMin,
      BMax: config.BMax,
      nPoints: config.nPoints,
      displayMode: config.displayMode,
    };
  }, [config, lambdaEff, gValues, hfValues]);

  useEffect(() => {
    try {
      const res = computeSpectrum(params);
      setResult(res);
    } catch {
      setResult(null);
    }
  }, [params]);

  const gIsoAvg = gValues.gIso ?? (
    gValues.gPar != null && gValues.gPerp != null
      ? (gValues.gPar + 2 * gValues.gPerp) / 3
      : gValues.gx != null && gValues.gy != null && gValues.gz != null
        ? (gValues.gx + gValues.gy + gValues.gz) / 3
        : G_E
  );

  const nLineeTotali = result
    ? result.stickData.reduce((sum, r) => sum + r.n_lines, 0)
    : 0;

  const nOrientazioni = result?.orientations.length ?? 1;

  const tabs: { key: Tab; label: string }[] = [
    { key: "spectra", label: "Spectra" },
    { key: "parameters", label: "Parameters" },
    { key: "splitting", label: "Splitting" },
    { key: "export", label: "Export" },
  ];

  const csvUrl = useMemo(() => {
    if (!result) return "";
    const lines = ["Field (G),Absorption,Derivative"];
    for (let i = 0; i < result.fieldAxis.length; i++) {
      lines.push(`${result.fieldAxis[i].toFixed(2)},${result.absorption[i].toFixed(6)},${result.derivative[i].toFixed(6)}`);
    }
    return URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  }, [result]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Minimal topbar */}
      <header className="h-12 shrink-0 flex items-center px-5 bg-surface-container-low border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
            <svg width="14" height="14" viewBox="0 0 56 56" fill="none">
              <path d="M 6 28 Q 14 28 20 14 Q 25 10 28 28 Q 31 46 36 46 Q 42 28 50 28" stroke="#8ed5ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <line x1="6" y1="28" x2="50" y2="28" stroke="#8ed5ff" strokeWidth="0.5" opacity="0.15" />
            </svg>
          </div>
          <h1 className="text-[15px] font-bold text-on-surface" style={{ fontFamily: "var(--font-display, Geist)" }}>
            dEPR Insight
          </h1>
          <span className="text-[10px] text-on-surface-variant tracking-[0.1em] uppercase bg-surface-variant/30 px-2 py-0.5 rounded">v1.0</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-on-surface-variant">
          {result && (
            <>
              <span>{config.metalName}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
              <span>{config.symmetry}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
              <span>{config.frequency} GHz</span>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ParameterPanel config={config} onChange={onChange} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 pb-0 border-b border-outline-variant/10 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-[12px] font-semibold rounded-t-lg transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "text-primary bg-surface-container-low border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {activeTab === "spectra" && (
              <div className="space-y-4">
                <GlassPanel className="p-3">
                  <div className="h-[420px]">
                    {result ? (
                      <SpectrumPlot
                        fieldAxis={result.fieldAxis}
                        absorption={result.absorption}
                        derivative={result.derivative}
                        displayMode={config.displayMode}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-on-surface-variant text-[13px]">
                        Configure parameters to compute spectrum
                      </div>
                    )}
                  </div>
                </GlassPanel>

                <GlassPanel className="p-4">
                  <h3 className="text-[13px] font-semibold text-on-surface mb-3">Stick Spectrum</h3>
                  {result ? (
                    <div className="relative">
                      <svg width="100%" height="140" viewBox="0 0 800 140" preserveAspectRatio="xMidYMid meet">
                        {(() => {
                          const sticks: { B: number; int: number; color: string }[] = [];
                          result.orientations.forEach((orient, oi) => {
                            const base = NU_B * config.frequency / orient.g;
                            result.transitions.forEach((trans) => {
                              const shift_zfs = trans.shift_factor * D_CM1_TO_GAUSS * config.D_zfs / orient.g;
                              const baseTrans = base + shift_zfs;
                              result.stickData.forEach((iso, ii) => {
                                const pattern = iso[orient.patternKey as keyof typeof iso] as Record<number, number>;
                                for (const [spost, inten] of Object.entries(pattern)) {
                                  if (inten > 1e-6) {
                                    sticks.push({
                                      B: baseTrans - Number(spost) / orient.g,
                                      int: inten * trans.intensity,
                                      color: COLORI[ii % COLORI.length],
                                    });
                                  }
                                }
                              });
                            });
                          });
                          if (sticks.length === 0) return null;
                          const Bmin = Math.min(...sticks.map(s => s.B));
                          const Bmax = Math.max(...sticks.map(s => s.B));
                          const range = Bmax - Bmin || 1;
                          return sticks.map((s, i) => {
                            const x = ((s.B - Bmin) / range) * 780 + 10;
                            const h = Math.min(s.int * 120, 120);
                            return <line key={i} x1={x} y1={140 - h} x2={x} y2={140} stroke={s.color} strokeWidth="1.5" opacity="0.8" />;
                          });
                        })()}
                      </svg>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {result.stickData.map((r, i) => (
                          <div key={r.isotope} className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                            <span className="w-3 h-[2px] rounded" style={{ backgroundColor: COLORI[i % COLORI.length] }} />
                            {r.isotope} ({(r.abundance * 100).toFixed(0)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[12px] text-on-surface-variant">Run simulation to see stick spectrum</div>
                  )}
                </GlassPanel>

                <GlassPanel className="p-4">
                  <h3 className="text-[13px] font-semibold text-on-surface mb-2">Line List</h3>
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-surface-container">
                        <tr className="text-[10px] font-semibold text-on-surface-variant uppercase border-b border-outline-variant/20">
                          <th className="py-1.5 px-2">Isotope</th>
                          <th className="py-1.5 px-2">Orient.</th>
                          <th className="py-1.5 px-2">Field (G)</th>
                          <th className="py-1.5 px-2">Intensity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result ? (() => {
                          const rows: { iso: string; orient: string; field: string; int: string }[] = [];
                          result.orientations.forEach((orient) => {
                            const base = NU_B * config.frequency / orient.g;
                            result.transitions.forEach((trans) => {
                              const shift_zfs = trans.shift_factor * D_CM1_TO_GAUSS * config.D_zfs / orient.g;
                              const baseTrans = base + shift_zfs;
                              result.stickData.forEach((iso) => {
                                const pattern = iso[orient.patternKey as keyof typeof iso] as Record<number, number>;
                                for (const [spost, inten] of Object.entries(pattern)) {
                                  if (inten > 1e-4) {
                                    rows.push({
                                      iso: iso.isotope,
                                      orient: orient.label,
                                      field: (baseTrans - Number(spost) / orient.g).toFixed(2),
                                      int: (inten * trans.intensity).toFixed(4),
                                    });
                                  }
                                }
                              });
                            });
                          });
                          return rows.slice(0, 100).map((r, i) => (
                            <tr key={i} className="border-b border-outline-variant/5 hover:bg-surface-variant/20">
                              <td className="py-1 px-2 font-mono">{r.iso}</td>
                              <td className="py-1 px-2">{r.orient}</td>
                              <td className="py-1 px-2 font-mono">{r.field}</td>
                              <td className="py-1 px-2 font-mono text-on-surface-variant">{r.int}</td>
                            </tr>
                          ));
                        })() : (
                          <tr><td colSpan={4} className="py-4 text-center text-on-surface-variant">No data</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassPanel>
              </div>
            )}

            {activeTab === "parameters" && (
              <div className="space-y-4 max-w-2xl">
                <GlassPanel className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[15px] font-bold text-on-surface">{config.metalName}</h2>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">S = {S}</span>
                  </div>
                  <div className="text-[12px] text-on-surface-variant">{metal?.fullName}</div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div><span className="text-on-surface-variant">Symmetry:</span><span className="ml-2 text-on-surface font-semibold">{config.symmetry}</span></div>
                    <div><span className="text-on-surface-variant">Frequency:</span><span className="ml-2 text-on-surface font-semibold">{config.frequency} GHz</span></div>
                    <div><span className="text-on-surface-variant">Tumbling:</span><span className="ml-2 text-on-surface font-semibold">{config.tumbling}</span></div>
                    <div><span className="text-on-surface-variant">Linewidth:</span><span className="ml-2 text-on-surface font-semibold">{config.gamma} G</span></div>
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-on-surface-variant mb-3">Metal Isotopes — Hyperfine Coupling A</h3>
                  <div className="space-y-2">
                    {metal?.isotopes.map((iso) => {
                      const vals = hfValues[iso.label] ?? { apar: 0, aperp: 0 };
                      return (
                        <div key={iso.label} className="flex items-center gap-4 p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
                          <div className="w-24">
                            <div className="text-[12px] font-semibold text-on-surface">{iso.label}</div>
                            <div className="text-[10px] text-on-surface-variant">I = {iso.I}, {(iso.abundance * 100).toFixed(1)}%</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-on-surface-variant">A‖</label>
                            <input type="number" value={vals.apar}
                              onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], apar: Number(e.target.value) } }))}
                              step={1} min={0}
                              className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-on-surface-variant">A⊥</label>
                            <input type="number" value={vals.aperp}
                              onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], aperp: Number(e.target.value) } }))}
                              step={1} min={0}
                              className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-on-surface-variant mb-3">Calculated g-Factors</h3>
                  <div className="space-y-1 text-[12px]">
                    {gValues.gIso != null && <div>g = <strong className="text-primary text-[14px] font-mono">{gValues.gIso.toFixed(4)}</strong> (gₑ = {G_E})</div>}
                    {gValues.gPar != null && <div>g‖ = <strong className="text-primary text-[14px] font-mono">{gValues.gPar.toFixed(4)}</strong></div>}
                    {gValues.gPerp != null && <div>g⊥ = <strong className="text-primary text-[14px] font-mono">{gValues.gPerp.toFixed(4)}</strong></div>}
                    {gValues.gx != null && <div>gx = <strong className="text-primary text-[14px] font-mono">{gValues.gx.toFixed(4)}</strong></div>}
                    {gValues.gy != null && <div>gy = <strong className="text-primary text-[14px] font-mono">{gValues.gy.toFixed(4)}</strong></div>}
                    {gValues.gz != null && <div>gz = <strong className="text-primary text-[14px] font-mono">{gValues.gz.toFixed(4)}</strong></div>}
                    <div className="pt-2 text-on-surface-variant">g_iso avg = <span className="font-mono">{gIsoAvg.toFixed(4)}</span></div>
                  </div>
                </GlassPanel>

                <GlassPanel className="p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-on-surface-variant mb-3">Electron Spin &amp; ZFS</h3>
                  <div className="text-[12px] space-y-1">
                    <div>S = {S}</div>
                    {S > 0.5 && config.D_zfs > 0 ? (
                      <div>ZFS: D = {config.D_zfs} × 10⁻⁴ cm⁻¹ → {result?.transitions.length ?? 0} fine-structure transitions</div>
                    ) : (
                      <div className="text-on-surface-variant">ZFS not active (S = 1/2 or D = 0)</div>
                    )}
                    <div className="pt-2 text-on-surface-variant">Total hyperfine lines: {nLineeTotali} per orientation, {nLineeTotali * nOrientazioni} total</div>
                  </div>
                </GlassPanel>
              </div>
            )}

            {activeTab === "splitting" && (
              <div className="space-y-4 max-w-2xl">
                <GlassPanel className="p-5">
                  <h3 className="text-[13px] font-semibold text-on-surface mb-1">Hyperfine Splitting Tree</h3>
                  <p className="text-[11px] text-on-surface-variant mb-4">
                    Each nucleus with spin I splits each line into 2I+1 sub-lines. With n equivalent nuclei, total = 2nI+1.
                  </p>
                  {result && metal ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-[10px] font-semibold text-on-surface-variant uppercase border-b border-outline-variant/20">
                            <th className="py-1.5 px-2">Step</th>
                            <th className="py-1.5 px-2">Nucleus</th>
                            <th className="py-1.5 px-2">I</th>
                            <th className="py-1.5 px-2">n</th>
                            <th className="py-1.5 px-2">2nI+1</th>
                            <th className="py-1.5 px-2">A (G)</th>
                            <th className="py-1.5 px-2">Total lines</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metal.isotopes.map((isoMain) => {
                            const A_m = config.symmetry === "Cubic / isotropic"
                              ? ((hfValues[isoMain.label]?.apar ?? 0) + 2 * (hfValues[isoMain.label]?.aperp ?? 0)) / 3
                              : (hfValues[isoMain.label]?.apar ?? 0);
                            const groups: { name: string; n: number; I: number; A: number }[] = [
                              { name: `Metal (${isoMain.label})`, n: 1, I: isoMain.I, A: A_m },
                              ...config.ligandGroups.map(lg => {
                                const lib = legantiLibreria[lg.isotope];
                                const I_val = lib ? lib[0] : 1;
                                return { name: lg.isotope, n: lg.n, I: I_val, A: lg.A_par };
                              }),
                            ];
                            let nTot = 1;
                            const rows: { step: string; name: string; I: string; n: string; nLines: string; A: string; total: string }[] = [];
                            groups.forEach((g, gi) => {
                              const nLines = Math.round(2 * g.n * g.I) + 1;
                              const prev = nTot;
                              nTot *= nLines;
                              rows.push({
                                step: `${gi + 1}`,
                                name: g.name,
                                I: `${g.I}`,
                                n: `${g.n}`,
                                nLines: `${nLines}`,
                                A: `${g.A.toFixed(1)}`,
                                total: `${prev} → ${nTot}`,
                              });
                            });
                            return (
                              <React.Fragment key={isoMain.label}>
                                {rows.map((r, ri) => (
                                  <tr key={ri} className="border-b border-outline-variant/5">
                                    <td className="py-1 px-2 font-mono">{r.step}</td>
                                    <td className="py-1 px-2">{r.name}</td>
                                    <td className="py-1 px-2">{r.I}</td>
                                    <td className="py-1 px-2">{r.n}</td>
                                    <td className="py-1 px-2 font-mono">{r.nLines}</td>
                                    <td className="py-1 px-2 font-mono">{r.A}</td>
                                    <td className="py-1 px-2 font-mono">{r.total}</td>
                                  </tr>
                                ))}
                                <tr className="bg-primary/5">
                                  <td colSpan={6} className="py-1.5 px-2 text-[11px] font-semibold text-primary">Result for {isoMain.label}</td>
                                  <td className="py-1.5 px-2 font-mono text-[12px] font-bold text-primary">{nTot} lines</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-[12px] text-on-surface-variant">Run simulation to see splitting tree</div>
                  )}
                </GlassPanel>

                <GlassPanel className="p-5">
                  <h3 className="text-[13px] font-semibold text-on-surface mb-2">Ligand Contribution</h3>
                  {config.ligandGroups.length > 0 ? (
                    <div className="text-[12px] space-y-1">
                      {config.ligandGroups.map((lg, i) => {
                        const lib = legantiLibreria[lg.isotope];
                        const I_val = lib ? lib[0] : 1;
                        const nLines = Math.round(2 * lg.n * I_val) + 1;
                        return (
                          <div key={i} className="text-on-surface-variant">
                            {lg.isotope}: {lg.n} nuclei, I={I_val} → {nLines} lines, A‖={lg.A_par} G
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[12px] text-on-surface-variant">No ligand groups added</div>
                  )}
                </GlassPanel>
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-4 max-w-2xl">
                <GlassPanel className="p-6">
                  <h3 className="text-[14px] font-semibold text-on-surface mb-5">Export Spectrum Data</h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface-variant/20 border border-outline-variant/20">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8ed5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                      </svg>
                      <span className="text-[13px] font-semibold text-on-surface">PNG Image</span>
                      <span className="text-[10px] text-on-surface-variant text-center">Publication-ready plot at 2x resolution</span>
                      <span className="text-[10px] text-on-surface-variant">Use the camera icon in the plot toolbar</span>
                    </div>
                    <a
                      href={csvUrl}
                      download={`EPR_data_${config.metalName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all text-center no-underline ${
                        csvUrl
                          ? "bg-surface-variant/20 border-outline-variant/20 hover:bg-primary/10 hover:border-primary/30 cursor-pointer"
                          : "bg-surface-variant/10 border-outline-variant/10 opacity-50 pointer-events-none"
                      }`}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8ed5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span className="text-[13px] font-semibold text-on-surface">CSV Data</span>
                      <span className="text-[10px] text-on-surface-variant">Field, Absorption, Derivative</span>
                    </a>
                  </div>
                </GlassPanel>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
