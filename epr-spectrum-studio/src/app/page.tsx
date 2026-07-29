"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { GitFork, Download, Image as ImageIcon, FileText, Atom, SlidersHorizontal, Sparkles, Copy, Check, ExternalLink, Clock, ChevronDown, ChevronUp, Save, Heart, Shield, RotateCcw } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Logo } from "@/components/ui/Logo";
import { ParameterPanel } from "@/components/ParameterPanel";
import { SimulationCard } from "@/components/dashboard/SimulationCard";
import { computeSpectrum, computeGValues, NU_B, G_E, D_CM1_TO_GAUSS } from "@/lib/engine/physics";
import { metalli } from "@/lib/engine/metals";
import { legantiLibreria } from "@/lib/engine/ligands";
import { loadHistory, saveSimulation, deleteSimulation, getVisited, markVisited, saveConfig, loadConfig, saveHfValues, loadHfValues, clearConfig } from "@/lib/history";
import { downloadReportPdf } from "@/lib/report";
import type { SavedSimulation } from "@/lib/history";
import type { SimConfig, Preset, Symmetry } from "@/lib/engine/types";
import { PLACEHOLDER_METAL } from "@/lib/engine/types";

const SpectrumPlot = dynamic(() => import("@/components/plots/SpectrumPlot"), { ssr: false });
const StickSpectrumPlot = dynamic(() => import("@/components/plots/StickSpectrum"), { ssr: false });
const SplittingTree = dynamic(() => import("@/components/plots/SplittingTree"), { ssr: false });

type Tab = "guide" | "parameters" | "spectra" | "splitting" | "export" | "about";

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
    metalName: PLACEHOLDER_METAL,
    symmetry: "Axial (D4h / C4v / D3h)",
    stato: "",
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

function formatMs(ms: number): string {
  if (Number.isInteger(ms)) return String(ms);
  const num = ms * 2;
  return `${num}/2`;
}

const NO_DATA_MESSAGE = "No data yet — adjust the parameters to compute a spectrum.";

export default function Home() {
  const [config, setConfig] = useState<SimConfig>(getDefaultConfig);
  const [activeTab, setActiveTab] = useState<Tab>("guide");
  const [hfValues, setHfValues] = useState<Record<string, { apar: number; aperp: number }>>(() => getInitialHf(PLACEHOLDER_METAL));
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [history, setHistory] = useState<SavedSimulation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedHistory = loadHistory();
    setHistory(savedHistory);
    setQuickStartOpen(savedHistory.length === 0 || !getVisited());

    const savedConfig = loadConfig() as SimConfig | null;
    if (savedConfig) setConfig(savedConfig);
    const savedHf = loadHfValues() as Record<string, { apar: number; aperp: number }> | null;
    if (savedHf) setHfValues(savedHf);

    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (hydrated) saveConfig(config);
  }, [config, hydrated]);

  useEffect(() => {
    if (hydrated) saveHfValues(hfValues);
  }, [hfValues, hydrated]);

  const onChange = useCallback(<K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    if (key === "metalName" && typeof value === "string") {
      setHfValues(getInitialHf(value));
      const m = metalli[value];
      if (m) {
        setConfig(prev => ({ ...prev, [key]: value, dCount: m.dCount, D_zfs: m.S > 0.5 ? prev.D_zfs : 0 }));
        return;
      }
    }
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      if (key === "symmetry" && value === "Cubic / isotropic") {
        next.stato = "";
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: Preset, presetName: string) => {
    const metalData = metalli[preset.metal];
    const hf: Record<string, { apar: number; aperp: number }> = {};
    if (metalData) {
      for (const iso of metalData.isotopes) {
        const apar = preset.A_par?.[iso.label] ?? (typeof metalData.A_par_default === "number" ? metalData.A_par_default : metalData.A_par_default[iso.label] ?? 0);
        const aperp = preset.A_perp?.[iso.label] ?? (typeof metalData.A_perp_default === "number" ? metalData.A_perp_default : metalData.A_perp_default[iso.label] ?? 0);
        hf[iso.label] = { apar, aperp };
      }
    }
    setConfig(prev => ({
      ...prev,
      complexName: presetName !== "None (manual)" ? presetName : undefined,
      metalName: preset.metal,
      symmetry: preset.symmetry as Symmetry,
      stato: preset.stato ?? (preset.symmetry === "Cubic / isotropic" ? "" : prev.stato),
      dCount: metalData?.dCount ?? prev.dCount,
      D_zfs: preset.D_zfs ?? (metalData && metalData.S > 0.5 ? prev.D_zfs : 0),
      ligandGroups: (preset.ligands ?? []).map(l => ({ ...l })),
    }));
    setHfValues(hf);
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

  const result = useMemo(() => {
    try {
      return computeSpectrum(params);
    } catch {
      return null;
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
    { key: "guide", label: "Dashboard" },
    { key: "parameters", label: "Parameters" },
    { key: "spectra", label: "Spectra" },
    { key: "splitting", label: "Splitting" },
    { key: "export", label: "Export" },
    { key: "about", label: "About" },
  ];

  const csvUrl = useMemo(() => {
    if (!result) return "";
    const lines = ["Field (G),Absorption,Derivative"];
    for (let i = 0; i < result.fieldAxis.length; i++) {
      lines.push(`${result.fieldAxis[i].toFixed(2)},${result.absorption[i].toFixed(6)},${result.derivative[i].toFixed(6)}`);
    }
    return URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  }, [result]);

  const csvPreview = useMemo(() => {
    if (!result) return null;
    const preview: string[] = [];
    const max = Math.min(6, result.fieldAxis.length);
    for (let i = 0; i < max; i++) {
      preview.push(`${result.fieldAxis[i].toFixed(1)}\t${result.absorption[i].toFixed(5)}\t${result.derivative[i].toFixed(5)}`);
    }
    return preview;
  }, [result]);

  const citation = "Bernardi, S. dEPR Insight — EPR Simulation Suite for d-Orbital Complexes (2026).";

  const handleCopyCitation = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } catch {
      // clipboard API not available — ignore
    }
  }, []);

  const handleReset = useCallback(() => {
    clearConfig();
    setConfig(getDefaultConfig());
    setHfValues(getInitialHf(PLACEHOLDER_METAL));
    setResetKey(k => k + 1);
  }, []);

  const handleSave = useCallback(() => {
    if (!result) return;
    const sim: SavedSimulation = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(config)),
      gValues: { ...gValues },
      hfValues: JSON.parse(JSON.stringify(hfValues)),
      stickCount: nLineeTotali,
      nOrientations: nOrientazioni,
    };
    saveSimulation(sim);
    setHistory(loadHistory());
    markVisited();
    if (quickStartOpen) setQuickStartOpen(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  }, [result, config, gValues, hfValues, nLineeTotali, nOrientazioni, quickStartOpen]);

  const handleDelete = useCallback((id: string) => {
    setHistory(deleteSimulation(id));
  }, []);

  const handleLoad = useCallback((sim: SavedSimulation) => {
    setConfig(sim.config);
    setHfValues(sim.hfValues);
    setActiveTab("parameters");
  }, []);

  const handleReport = useCallback((sim: SavedSimulation) => {
    downloadReportPdf(sim);
  }, []);

  // Revoke the previous blob URL whenever a new one is created (or on unmount)
  useEffect(() => {
    return () => {
      if (csvUrl) URL.revokeObjectURL(csvUrl);
    };
  }, [csvUrl]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Topbar */}
      <header className="h-14 shrink-0 flex items-center px-5 bg-surface-container-low border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <Logo size={36} iconSize={20} className="rounded-lg shadow-[0_0_14px_rgba(219,252,255,0.18)]" />
          <div className="flex flex-col justify-center">
            <h1 className="text-[15px] font-bold text-primary-fixed-dim font-display leading-tight">
              dEPR Insight
            </h1>
            <span className="text-[9px] text-on-surface-variant tracking-[0.05em] uppercase leading-tight">
              EPR Simulation Suite
            </span>
          </div>
          <span className="text-[9px] font-semibold text-primary tracking-[0.05em] uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">v1.0</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-on-surface-variant">
          {result && (
            <>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-mono transition-all duration-200 cursor-pointer active:scale-95 text-on-surface-variant bg-surface-variant/20 border border-outline-variant/15 hover:bg-surface-variant/40 hover:text-on-surface"
                title="Reset to default configuration"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <div className="flex items-center gap-2.5 bg-surface-variant/20 border border-outline-variant/15 rounded-full px-3.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_6px_rgba(229,255,186,0.8)] animate-pulse" aria-hidden="true" />
                <span className="font-medium text-on-surface">{config.metalName}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
                <span>{config.symmetry}</span>
                <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
                <span className="font-mono text-primary">{config.frequency} GHz</span>
              </div>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold font-mono transition-all duration-200 cursor-pointer active:scale-95 ${
                  savedFeedback
                    ? "text-tertiary bg-tertiary/15 border border-tertiary/30"
                    : "text-tertiary bg-tertiary/10 border border-tertiary/20 hover:bg-tertiary/20"
                }`}
                title="Save this simulation to history"
              >
                {savedFeedback ? <Check size={12} /> : <Save size={12} />}
                {savedFeedback ? "Saved" : "Save"}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ParameterPanel key={resetKey} config={config} onChange={onChange} onApplyPreset={applyPreset} onClearPreset={() => setConfig(prev => ({ ...prev, complexName: undefined, ligandGroups: [] }))} />

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
                        {NO_DATA_MESSAGE}
                      </div>
                    )}
                  </div>
                </GlassPanel>

                <GlassPanel className="p-4">
                  <h3 className="text-[13px] font-semibold text-on-surface mb-3 flex items-center gap-2">
                    Stick Spectrum
                    <span className="text-[10px] font-normal text-on-surface-variant">
                      (drag to zoom, scroll to pan)
                    </span>
                  </h3>
                  {result ? (
                    <div className="h-[420px]">
                      <StickSpectrumPlot
                        stickData={result.stickData}
                        orientations={result.orientations}
                        transitions={result.transitions}
                        frequency={config.frequency}
                        D_zfs={config.D_zfs}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-[420px] flex items-center justify-center text-[12px] text-on-surface-variant">
                      {NO_DATA_MESSAGE}
                    </div>
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
                          <th className="py-1.5 px-2">Transition</th>
                          <th className="py-1.5 px-2">Field (G)</th>
                          <th className="py-1.5 px-2">Intensity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result ? (() => {
                          const rows: { iso: string; orient: string; trans: string; field: string; int: string }[] = [];
                          result.orientations.forEach((orient) => {
                            const base = NU_B * config.frequency / orient.g;
                            result.transitions.forEach((trans) => {
                              const shift_zfs = trans.shift_factor * D_CM1_TO_GAUSS * config.D_zfs / orient.g;
                              const baseTrans = base + shift_zfs;
                              const transLabel = `${formatMs(trans.ms_start)} \u2192 ${formatMs(trans.ms_start + 1)}`;
                              result.stickData.forEach((iso) => {
                                const pattern = iso[orient.patternKey as keyof typeof iso] as Record<number, number>;
                                for (const [spost, inten] of Object.entries(pattern)) {
                                  if (inten > 1e-4) {
                                    rows.push({
                                      iso: iso.isotope,
                                      orient: orient.label,
                                      trans: transLabel,
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
                              <td className="py-1 px-2 font-mono text-[10px]">{r.trans}</td>
                              <td className="py-1 px-2 font-mono">{r.field}</td>
                              <td className="py-1 px-2 font-mono text-on-surface-variant">{r.int}</td>
                            </tr>
                          ));
                        })() : (
                          <tr><td colSpan={5} className="py-4 text-center text-on-surface-variant">{NO_DATA_MESSAGE}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassPanel>
              </div>
            )}

            {activeTab === "guide" && (
              <div className="space-y-4">
                {/* Hero banner — always visible */}
                <GlassPanel className="p-10 relative overflow-hidden group">
                  {/* Decorative EPR wave watermark in the background */}
                  <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center">
                    <svg width="600" height="240" viewBox="0 0 56 56" fill="none" aria-hidden="true" className="text-primary-fixed-dim scale-y-[0.25]">
                      <line x1="2" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                      <path d="M 2 28 C 7 28, 12 10, 18 10 C 24 10, 26 28, 28 28 C 30 28, 32 46, 38 46 C 44 46, 49 28, 54 28" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="w-24 h-24 bg-surface-container-lowest rounded-xl flex items-center justify-center border border-outline-variant mb-5 shadow-[0_0_15px_rgba(0,219,233,0.1)] group-hover:border-primary-fixed-dim group-hover:shadow-[0_0_20px_rgba(0,219,233,0.2)] transition-all duration-500">
                      <Logo size={64} iconSize={40} className="border-none" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <h2 className="text-[22px] font-bold text-primary-fixed-dim font-display">dEPR Insight</h2>
                      <span className="text-[9px] font-semibold text-primary tracking-[0.05em] uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">v1.0</span>
                    </div>
                    <p className="text-[14px] text-primary-fixed-dim font-display font-medium mb-3 tracking-[0.15em]">
                      dive deeper into d-orbital EPR
                    </p>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary-fixed-dim/40 to-transparent mb-3" />
                    <p className="text-[12px] text-on-surface-variant max-w-xl leading-relaxed">
                      Simulation and interpretation of EPR spectra for paramagnetic transition metal complexes.
                      Select a metal in the sidebar to begin.
                    </p>
                  </div>
                </GlassPanel>

                {/* Dashboard header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-bold text-on-surface font-display">Dashboard</h2>
                    <p className="text-[11px] text-on-surface-variant">Overview and recent simulations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.05em] text-on-surface-variant">Simulations saved</div>
                      <div className="text-[20px] font-bold font-mono text-primary">
                        {hydrated ? history.length : "\u2014"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Start section — collapsible */}
                <GlassPanel className="overflow-hidden">
                  <button
                    onClick={() => { markVisited(); setQuickStartOpen(!quickStartOpen); }}
                    className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-surface-variant/10 hover:shadow-[0_0_18px_rgba(219,252,255,0.1)] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-primary/80">
                        {quickStartOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </span>
                      <span className="text-[13px] font-bold text-on-surface font-display">Quick Start Guide</span>
                      {!quickStartOpen && (
                        <span className="text-[10px] text-on-surface-variant">(click to expand)</span>
                      )}
                    </div>
                    {quickStartOpen && (
                      <span className="text-[10px] text-on-surface-variant/50">click to collapse</span>
                    )}
                  </button>

                  {quickStartOpen && (
                    <div className="px-5 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {[
                          { num: "1", icon: <Atom size={15} />, color: "text-[#dbfcff]", title: "Choose metal", desc: "Pick a metal center and symmetry in the Complex section of the left panel." },
                          { num: "2", icon: <SlidersHorizontal size={15} />, color: "text-[#e5ffba]", title: "Tune parameters", desc: "Use a Quick Preset or set \u0394, \u03BB, and A couplings manually." },
                          { num: "3", icon: <Sparkles size={15} />, color: "text-[#d8b9ff]", title: "View spectra", desc: "Absorption, derivative, and interactive stick spectrum in the Spectra tab." },
                          { num: "4", icon: <GitFork size={15} />, color: "text-[#00f0ff]", title: "Analyze splitting", desc: "Hyperfine branching tree via the 2nI+1 rule in the Splitting tab." },
                          { num: "5", icon: <Download size={15} />, color: "text-[#a9f900]", title: "Export data", desc: "CSV download, PNG plots, and printable PDF reports." },
                        ].map((step) => (
                          <div key={step.num} className="p-3 rounded-xl bg-surface-variant/15 border border-outline-variant/10">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-on-surface-variant/50 bg-surface-variant/30 w-4 h-4 rounded-full flex items-center justify-center shrink-0">{step.num}</span>
                              <span className={step.color}>{step.icon}</span>
                              <h3 className="text-[11px] font-semibold text-on-surface">{step.title}</h3>
                            </div>
                            <p className="text-[10.5px] text-on-surface-variant leading-relaxed">{step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassPanel>

                {/* First-time prompt — only when no history */}
                {history.length === 0 && hydrated && (
                  <GlassPanel className="p-4 text-center">
                    <p className="text-[12px] text-on-surface-variant">
                      Start by configuring a metal complex in the left panel.
                      When you see a spectrum, click <strong className="text-tertiary">Save</strong> in the top bar to build your simulation library.
                    </p>
                  </GlassPanel>
                )}

                {/* History section */}
                {history.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-on-surface-variant/60" />
                      <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Recent Simulations</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {history.map((sim) => (
                        <SimulationCard
                          key={sim.id}
                          sim={sim}
                          onLoad={handleLoad}
                          onDelete={handleDelete}
                          onReport={handleReport}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "parameters" && (
              metal ? (
              <div className="space-y-4">
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
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-3">Metal Isotopes — Hyperfine Coupling A</h3>
                  <div className="space-y-2">
                    {metal?.isotopes.map((iso) => {
                      const vals = hfValues[iso.label] ?? { apar: 0, aperp: 0 };
                      const isRhombic = config.symmetry === "Rhombic";
                      const isCubic = config.symmetry === "Cubic / isotropic";
                      return (
                        <div key={iso.label} className="flex items-center gap-4 p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
                          <div className="w-24">
                            <div className="text-[12px] font-semibold text-on-surface">{iso.label}</div>
                            <div className="text-[10px] text-on-surface-variant">I = {iso.I}, {(iso.abundance * 100).toFixed(1)}%</div>
                          </div>
                          {isRhombic ? (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-on-surface-variant">A<sub>x</sub></label>
                                <input type="number" value={vals.aperp}
                                  onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], aperp: Number(e.target.value) } }))}
                                  step={1} min={0}
                                  className="w-16 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-on-surface-variant">A<sub>y</sub></label>
                                <input type="number" value={vals.aperp}
                                  onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], aperp: Number(e.target.value) } }))}
                                  step={1} min={0}
                                  className="w-16 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-on-surface-variant">A<sub>z</sub></label>
                                <input type="number" value={vals.apar}
                                  onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], apar: Number(e.target.value) } }))}
                                  step={1} min={0}
                                  className="w-16 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                              </div>
                            </>
                          ) : isCubic ? (
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] text-on-surface-variant">A</label>
                              <input type="number" value={vals.apar}
                                onChange={(e) => { const v = Number(e.target.value); setHfValues(prev => ({ ...prev, [iso.label]: { apar: v, aperp: v } })); }}
                                step={1} min={0}
                                className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-on-surface-variant">A‖</label>
                                <input type="number" value={vals.apar}
                                  onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], apar: Number(e.target.value) } }))}
                                  step={1} min={0}
                                  className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-on-surface-variant">A⊥</label>
                                <input type="number" value={vals.aperp}
                                  onChange={(e) => setHfValues(prev => ({ ...prev, [iso.label]: { ...prev[iso.label], aperp: Number(e.target.value) } }))}
                                  step={1} min={0}
                                  className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary/50" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassPanel>

                  {config.ligandGroups.length > 0 && (
                    <GlassPanel className="p-5">
                      <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-3">Ligand Hyperfine Coupling A</h3>
                      <div className="space-y-2">
                        {config.ligandGroups.map((lg, gi) => {
                          const lib = legantiLibreria[lg.isotope];
                          const I_val = lib ? lib[0] : 1;
                          const isRhombic = config.symmetry === "Rhombic";
                          const isCubic = config.symmetry === "Cubic / isotropic";
                          return (
                            <div key={gi} className="flex items-center gap-4 p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
                              <div className="w-32">
                                <div className="text-[12px] font-semibold text-on-surface truncate">{lg.isotope}</div>
                                <div className="text-[10px] text-on-surface-variant">I = {I_val}, n = {lg.n}</div>
                              </div>
                              {isRhombic ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-on-surface-variant">A<sub>x</sub></label>
                                    <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{(lg.A_x ?? lg.A_perp).toFixed(1)} G</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-on-surface-variant">A<sub>y</sub></label>
                                    <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{(lg.A_y ?? lg.A_perp).toFixed(1)} G</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-on-surface-variant">A<sub>z</sub></label>
                                    <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{(lg.A_z ?? lg.A_par).toFixed(1)} G</span>
                                  </div>
                                </>
                              ) : isCubic ? (
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] text-on-surface-variant">A</label>
                                  <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{lg.A_par.toFixed(1)} G</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-on-surface-variant">A‖</label>
                                    <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{lg.A_par.toFixed(1)} G</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[10px] text-on-surface-variant">A⊥</label>
                                    <span className="w-20 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1 text-[11px] font-mono text-on-surface text-center">{lg.A_perp.toFixed(1)} G</span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </GlassPanel>
                  )}

                <GlassPanel className="p-5">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-3">Calculated g-Factors</h3>
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
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-3">Electron Spin &amp; ZFS</h3>
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
              ) : (
              <GlassPanel className="p-8 flex flex-col items-center justify-center text-center opacity-70">
                <span className="text-[60px] mb-4 opacity-30 select-none">&#9889;</span>
                <p className="text-sm text-on-surface-variant font-mono">Select a metal center in the sidebar to see parameters.</p>
                <button onClick={() => setActiveTab("guide")} className="mt-4 px-4 py-1.5 border border-primary-fixed-dim text-primary-fixed-dim hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-colors text-xs font-mono uppercase tracking-wider rounded-sm">
                  Open Quick Start Guide
                </button>
              </GlassPanel>
              )
            )}

            {activeTab === "splitting" && (
              <div className="space-y-4">
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
                          {metal?.isotopes.map((isoMain) => {
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
                     <div className="text-[12px] text-on-surface-variant">{NO_DATA_MESSAGE}</div>
                   )}
                 </GlassPanel>

                 {result && metal && (() => {
                   const metalColor = "#dbfcff";
                   const ligandColor = "#e5ffba";
                   const isoMain = metal.isotopes[0];
                   if (!isoMain) return null;
                   const A_m = config.symmetry === "Cubic / isotropic"
                     ? ((hfValues[isoMain.label]?.apar ?? 0) + 2 * (hfValues[isoMain.label]?.aperp ?? 0)) / 3
                     : (hfValues[isoMain.label]?.apar ?? 0);
                   const groups: { name: string; n: number; I: number; A: number; color: string }[] = [
                     { name: `Metal (${isoMain.label}, I=${isoMain.I})`, n: 1, I: isoMain.I, A: A_m, color: metalColor },
                     ...config.ligandGroups.map(lg => {
                       const lib = legantiLibreria[lg.isotope];
                       const I_val = lib ? lib[0] : 1;
                       return { name: `${lg.isotope} (n=${lg.n}, I=${I_val})`, n: lg.n, I: I_val, A: lg.A_par, color: ligandColor };
                     }),
                   ];
                   const nTot = groups.reduce((acc, g) => acc * (Math.round(2 * g.n * g.I) + 1), 1);
                   return (
                      <GlassPanel className="p-5">
                        <h3 className="text-[13px] font-semibold text-on-surface mb-1">Splitting Tree Diagram</h3>
                        <p className="text-[10px] text-on-surface-variant mb-3">
                          Shows hyperfine splitting using A‖ values. For axial/rhombic systems, the actual stick spectrum in the Spectra tab uses both A‖ and A⊥ across different orientations.
                        </p>
                       <div className="min-h-[200px]">
                          <SplittingTree groups={groups} totalLines={nTot} />
                       </div>
                     </GlassPanel>
                   );
                 })()}

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
              <div className="space-y-4">
                {/* Spectrum plot export */}
                <GlassPanel className="p-5">
                  <h3 className="text-[14px] font-semibold text-on-surface mb-4">Export Spectrum Data</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* PNG card */}
                    <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-surface-variant/20 border border-outline-variant/20">
                      <ImageIcon size={32} className="text-primary/80" aria-hidden="true" />
                      <div className="text-center">
                        <span className="text-[13px] font-semibold text-on-surface block mb-1">PNG Image</span>
                        <span className="text-[10px] text-on-surface-variant leading-relaxed">
                          Switch to the <strong>Spectra</strong> tab and click the camera icon
                          (<span className="font-mono text-[10px]">&#x1F4F7;</span>) in the
                          Plotly toolbar. Exports at <strong>2x resolution</strong>, ready for
                          publications and presentations.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("spectra")}
                        className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors cursor-pointer mt-1"
                      >
                        <ExternalLink size={12} /> Go to Spectra tab
                      </button>
                    </div>

                    {/* CSV card */}
                    <a
                      href={csvUrl}
                      download={`EPR_data_${config.metalName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`}
                      className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all text-center no-underline group ${
                        csvUrl
                          ? "bg-surface-variant/20 border-outline-variant/20 hover:bg-primary/10 hover:border-primary/30 cursor-pointer"
                          : "bg-surface-variant/10 border-outline-variant/10 opacity-40 pointer-events-none"
                      }`}
                    >
                      <FileText size={32} className="text-primary/80" aria-hidden="true" />
                      <div className="text-center">
                        <span className="text-[13px] font-semibold text-on-surface block mb-1">CSV Data</span>
                        <span className="text-[10px] text-on-surface-variant leading-relaxed">
                          Download the full spectrum as comma-separated values.
                          Columns: <strong>Field (G)</strong>, <strong>Absorption</strong>,{" "}
                          <strong>Derivative</strong>.
                          {result && (
                            <span className="block mt-0.5 text-on-surface-variant/70">
                              {result.fieldAxis.length.toLocaleString()} points &middot;{" "}
                              {config.BMin}&ndash;{config.BMax} G
                            </span>
                          )}
                        </span>
                      </div>
                      {csvUrl && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                          <Download size={13} /> Download CSV
                        </span>
                      )}
                    </a>
                  </div>

                  {/* CSV preview */}
                  {csvPreview && csvPreview.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-2">
                        Data preview (first {csvPreview.length} rows)
                      </h4>
                      <pre className="text-[10px] font-mono text-on-surface-variant bg-surface-container-lowest/60 rounded-lg p-3 overflow-x-auto border border-outline-variant/10 leading-relaxed">
                        Field (G){"\t"}Absorption{"\t"}Derivative{"\n"}
                        {csvPreview.join("\n")}
                        {csvPreview.length < (result?.fieldAxis.length ?? 0) && (
                          <span className="text-on-surface-variant/40">{"\n"}... ({(result?.fieldAxis.length ?? 0) - csvPreview.length} more rows)</span>
                        )}
                      </pre>
                    </div>
                  )}
                </GlassPanel>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-4">
                {/* Privacy & Local-first info */}
                <GlassPanel className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Shield size={18} className="text-tertiary" />
                    <h3 className="text-[14px] font-semibold text-on-surface">Privacy &amp; Data</h3>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    <strong>dEPR Insight runs entirely in your browser.</strong> No data is ever sent to a server
                    or stored in the cloud. All simulations, parameters, and saved results stay on
                    your device — nothing leaves your computer. There are no accounts, no tracking,
                    and no analytics. Your research data remains completely private.
                  </p>
                </GlassPanel>

                {/* Citation card */}
                <GlassPanel className="p-5">
                  <h3 className="text-[14px] font-semibold text-on-surface mb-3">How to Cite</h3>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 bg-surface-container-lowest/60 rounded-lg p-3 border border-outline-variant/10">
                      <p className="text-[12px] text-on-surface leading-relaxed">{citation}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCitation}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                        copiedCitation
                          ? "bg-tertiary-container/20 text-tertiary border border-tertiary/30"
                          : "bg-surface-variant/30 text-on-surface-variant border border-outline-variant/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      }`}
                    >
                      {copiedCitation ? (
                        <>
                          <Check size={13} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </GlassPanel>

                {/* Support card */}
                <GlassPanel className="p-5">
                  <h3 className="text-[14px] font-semibold text-on-surface mb-3">Support dEPR Insight</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">
                    If this tool has been useful for your research, consider supporting its development.
                    Every contribution helps keep it free and up to date.
                  </p>
                  <a
                    href="https://paypal.me/SharonBernardi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20 hover:border-secondary-fixed-dim hover:text-secondary-fixed-dim transition-all cursor-pointer"
                  >
                    <Heart size={14} />
                    Donate with PayPal
                  </a>
                </GlassPanel>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="h-8 shrink-0 flex items-center justify-center gap-3 px-5 bg-surface-container-low border-t border-outline-variant/20 text-[10px] text-on-surface-variant">
        <span>dEPR Insight · Created by Sharon Bernardi</span>
        <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
        <a
          href="https://paypal.me/SharonBernardi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-secondary hover:text-secondary-fixed-dim transition-colors"
        >
          <Heart size={10} />
          <span>Support this project</span>
        </a>
      </footer>
    </div>
  );
}
