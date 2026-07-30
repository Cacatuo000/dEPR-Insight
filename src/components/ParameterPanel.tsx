"use client";

import { useState, useRef, useEffect } from "react";
import type { SimConfig, Symmetry, DisplayMode, Preset } from "@/lib/engine/types";
import { PLACEHOLDER_METAL } from "@/lib/engine/types";
import { metalli, metalKeys, elementGroups, elementKeys } from "@/lib/engine/metals";
import { legantiOrdine, legantiComuni, legantiComuniOrdine } from "@/lib/engine/ligands";
import { presetDatabase, presetKeys } from "@/lib/engine/presets";
import { ChevronDown, ChevronRight, Plus, Trash2, Zap, FlaskConical, SlidersHorizontal, Waves, Magnet } from "lucide-react";
import { InfoTip } from "@/components/ui/InfoTip";

interface Props {
  config: SimConfig;
  onChange: <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;
  onApplyPreset: (preset: Preset, presetName: string) => void;
  onClearPreset: () => void;
}

const symmetryOptions: Symmetry[] = ["Cubic / isotropic", "Axial (D4h / C4v / D3h)", "Rhombic"];

const tumblingOptions = ["Rigid", "Slow", "Intermediate", "Fast", "Isotropic"];

const displayOptions: DisplayMode[] = ["Absorption only", "Derivative only", "Both"];

const statiPossibili = [
  "d_x2-y2, elongated octahedral (D4h)",
  "d_z2, compressed octahedral (D4h)",
  "d_xy, square planar (D4h)",
  "d_x2-y2, square planar (D4h)",
  "d_x2-y2, square pyramidal (C4v)",
  "d_z2, apical pyramid (C4v)",
  "d_z2, trigonal bipyramidal (D3h)",
  "d_x2-y2, equatorial bipyramidal (D3h)",
];

const ACCENTS = {
  primary: {
    chip: "bg-primary/10 border-primary/25 text-primary",
    glow: "shadow-[0_0_10px_rgba(219,252,255,0.25)]",
    border: "border-primary/40",
  },
  primaryContainer: {
    chip: "bg-primary-container/10 border-primary-container/25 text-primary-container",
    glow: "shadow-[0_0_10px_rgba(0,240,255,0.25)]",
    border: "border-primary-container/40",
  },
  tertiary: {
    chip: "bg-tertiary/10 border-tertiary/25 text-tertiary",
    glow: "shadow-[0_0_10px_rgba(229,255,186,0.25)]",
    border: "border-tertiary/40",
  },
  secondary: {
    chip: "bg-secondary/10 border-secondary/25 text-secondary",
    glow: "shadow-[0_0_10px_rgba(216,185,255,0.25)]",
    border: "border-secondary/40",
  },
  error: {
    chip: "bg-error/10 border-error/25 text-error",
    glow: "shadow-[0_0_10px_rgba(255,180,171,0.25)]",
    border: "border-error/40",
  },
} as const;

type AccentKey = keyof typeof ACCENTS;

function Section({ title, icon, accent = "primary", defaultOpen, info, children }: { title: string; icon?: React.ReactNode; accent?: AccentKey; defaultOpen?: boolean; info?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const a = ACCENTS[accent];
  return (
    <div className={`border-b border-outline-variant/10 last:border-b-0 mb-0.5 ${open ? "border-l-2 " + a.border : "border-l-2 border-l-transparent"}`}>
      <div className={`flex items-center gap-1.5 w-full px-4 py-3 text-[12px] font-bold uppercase tracking-[0.05em] transition-colors ${open ? "bg-surface-variant/15 text-on-surface" : "text-on-surface-variant"}`}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center gap-2 flex-1 hover:text-on-surface transition-colors cursor-pointer"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {icon && (
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${a.chip} ${a.glow}`}>
              {icon}
            </span>
          )}
          {title}
        </button>
        {info && <InfoTip title={title} content={info} />}
      </div>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

type Setter = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-on-surface-variant block mb-1">{children}</label>;
}

function MiniSelect({ value, options, onChange, className }: { value: string; options: string[]; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`bg-transparent border border-outline-variant/20 rounded-lg px-1.5 py-1 text-[10px] font-mono text-on-surface text-left focus:outline-none hover:bg-surface-variant/20 transition-colors cursor-pointer ${className ?? ""}`}
      >
        <span className="block truncate">{value}</span>
      </button>
      {open && (
        <div className="absolute z-50 right-0 mt-1 min-w-[140px] bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg shadow-black/40 overflow-hidden max-h-44 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                opt === value ? "bg-primary/15 text-primary" : "text-on-surface hover:bg-surface-variant/40"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg pl-3 pr-8 py-2 text-[12px] text-on-surface text-left focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-surface-variant/50 transition-colors"
        >
          <span className="block truncate">{value}</span>
        </button>
        <ChevronDown
          size={14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        {open && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg shadow-black/40 overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer ${
                  opt === value
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-variant/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NumInput({ value, onChange, min, max, step, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step ?? 1}
        className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface font-mono focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}

export function ParameterPanel({ config, onChange: propOnChange, onApplyPreset, onClearPreset }: Props) {
  const metal = metalli[config.metalName];
  const S = metal?.S ?? 0.5;
  const [selectedPreset, setSelectedPreset] = useState("None (manual)");
  const applyingPreset = useRef(false);

  const handlePreset = (name: string) => {
    if (name === "None (manual)") {
      setSelectedPreset("None (manual)");
      onClearPreset();
      return;
    }
    const preset = presetDatabase[name];
    if (!preset) return;
    applyingPreset.current = true;
    onApplyPreset(preset, name);
    setSelectedPreset(name);
    setTimeout(() => { applyingPreset.current = false; }, 0);
  };

  const onChange = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    if (!applyingPreset.current) {
      setSelectedPreset("None (manual)");
    }
    propOnChange(key, value);
  };

  const selectedElement = metal?.element ?? "";
  const availableMetals = (elementGroups.find(g => g.element === selectedElement)?.metals ?? [])
    .filter(m => metalli[m] != null);

  const handleElementChange = (element: string) => {
    const group = elementGroups.find(g => g.element === element);
    if (group && group.metals.length > 0) {
      onChange("metalName", group.metals[0]);
    }
  };

  const metalVariants = availableMetals.map(key => {
    const m = metalli[key];
    if (!m) return null;
    const label = m.spinLabel ? `${m.oxidation}, ${m.spinLabel}` : m.oxidation;
    return { key, label };
  }).filter((v): v is { key: string; label: string } => v != null);

  return (
    <aside className="w-80 shrink-0 h-full bg-surface-container-low border-r border-outline-variant/20 overflow-y-auto custom-scrollbar">
      {/* Presets */}
      <Section title="Quick presets" icon={<Zap size={17} aria-hidden="true" />} accent="primaryContainer" defaultOpen={true} info="Ready-to-use parameter sets for common complexes. Choosing one fills in metal, symmetry, couplings and ligands for you — you can still change anything afterwards.">
        <Select
          value={selectedPreset}
          options={["None (manual)", ...presetKeys]}
          onChange={handlePreset}
        />
      </Section>

      {/* Complex */}
      <Section title="Complex" icon={<FlaskConical size={17} aria-hidden="true" />} accent="tertiary" defaultOpen={false} info="What you are simulating: the metal ion, the symmetry of its coordination environment, and — for axial complexes — the d orbital hosting the unpaired electron. You can also add ligand nuclei with spin (e.g. ¹⁴N, ¹H): their coupling with the unpaired electron produces superhyperfine splitting, the small extra lines in the spectrum.">
        <Select
          value={selectedElement || "— Select an element —"}
          options={["— Select an element —", ...elementKeys]}
          onChange={handleElementChange}
          label="Element"
        />
        {metalVariants.length > 1 && (
          <MiniSelect
            value={metal?.spinLabel ? `${metal.oxidation}, ${metal.spinLabel}` : (metal?.oxidation ?? "—")}
            options={metalVariants.map(v => v.label)}
            onChange={(label) => {
              const mv = metalVariants.find(v => v.label === label);
              if (mv) onChange("metalName", mv.key);
            }}
          />
        )}
        <div className="text-[10px] text-on-surface-variant font-mono">{metal?.fullName ?? ""}</div>
        <Label>Symmetry</Label>
        <div className="space-y-1">
          {symmetryOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="symmetry"
                checked={config.symmetry === opt}
                onChange={() => onChange("symmetry", opt)}
                className="accent-primary w-3 h-3"
              />
              <span className="text-[12px] text-on-surface group-hover:text-primary transition-colors">{opt}</span>
            </label>
          ))}
        </div>

        {config.symmetry === "Axial (D4h / C4v / D3h)" && (
          <Select
            value={config.stato}
            options={statiPossibili}
            onChange={(v) => onChange("stato", v)}
            label="Ground state"
          />
        )}

        {/* Quick ligand add */}
        <div className="pt-2">
          <Label>Add ligand</Label>
          <LigandQuickAdd config={config} onChange={onChange} />
        </div>

        {/* Ligand groups list */}
        {config.ligandGroups.length > 0 && (
        <div className="pt-2 space-y-1.5">
          {config.ligandGroups.map((group, idx) => (
            <div key={idx} className="p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
              <div className="flex items-center gap-1">
                <MiniSelect
                  value={group.isotope}
                  options={legantiOrdine}
                  onChange={(v) => {
                    const updated = [...config.ligandGroups];
                    updated[idx] = { ...updated[idx], isotope: v };
                    onChange("ligandGroups", updated);
                  }}
                  className="flex-1"
                />
                <span className="text-[9px] text-on-surface-variant w-3 text-center font-mono">n</span>
                <input
                  type="number"
                  value={group.n}
                  onChange={(e) => {
                    const updated = [...config.ligandGroups];
                    updated[idx] = { ...updated[idx], n: Number(e.target.value) };
                    onChange("ligandGroups", updated);
                  }}
                  min={1}
                  max={16}
                  className="w-8 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
                />
                {config.symmetry !== "Rhombic" && (
                  <>
                    <span className="text-[9px] text-on-surface-variant font-mono">A‖</span>
                    <input type="number" value={group.A_par}
                      onChange={(e) => { const u = [...config.ligandGroups]; u[idx] = { ...u[idx], A_par: Number(e.target.value) }; onChange("ligandGroups", u); }}
                      step={0.5} className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none" />
                    <span className="text-[9px] text-on-surface-variant font-mono">A⊥</span>
                    <input type="number" value={group.A_perp}
                      onChange={(e) => { const u = [...config.ligandGroups]; u[idx] = { ...u[idx], A_perp: Number(e.target.value) }; onChange("ligandGroups", u); }}
                      step={0.5} className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none" />
                  </>
                )}
                <button
                  onClick={() => onChange("ligandGroups", config.ligandGroups.filter((_, i) => i !== idx))}
                  aria-label={`Remove ${group.isotope} group`}
                  title={`Remove ${group.isotope} group`}
                  className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            {config.symmetry !== "Cubic / isotropic" && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="flex-1" />
                  <span className="text-[9px] text-on-surface-variant w-3 text-center font-mono" />
                  <span className="w-8" />
                  <span className="text-[9px] text-on-surface-variant font-mono">A<sub>x</sub></span>
                  <input type="number" value={group.A_x ?? 0}
                    onChange={(e) => { const u = [...config.ligandGroups]; u[idx] = { ...u[idx], A_x: Number(e.target.value) }; onChange("ligandGroups", u); }}
                    step={0.5} className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none" />
                  <span className="text-[9px] text-on-surface-variant font-mono">A<sub>y</sub></span>
                  <input type="number" value={group.A_y ?? 0}
                    onChange={(e) => { const u = [...config.ligandGroups]; u[idx] = { ...u[idx], A_y: Number(e.target.value) }; onChange("ligandGroups", u); }}
                    step={0.5} className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none" />
                  <span className="text-[9px] text-on-surface-variant font-mono">A<sub>z</sub></span>
                  <input type="number" value={group.A_z ?? 0}
                    onChange={(e) => { const u = [...config.ligandGroups]; u[idx] = { ...u[idx], A_z: Number(e.target.value) }; onChange("ligandGroups", u); }}
                    step={0.5} className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none" />
                  <span className="w-[20px]" />
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </Section>

      {/* Electronic */}
      <Section title="Electronic parameters" icon={<SlidersHorizontal size={17} aria-hidden="true" />} accent="secondary" defaultOpen={false} info={`How the g-factors are calculated. Δ is the energy gap between the d orbitals created by the ligand field; λ (spin–orbit coupling) mixes the orbitals and shifts g away from the free-electron value (gₑ = 2.0023). The λ sign is chosen automatically: positive for less-than-half-filled d shells, negative for more-than-half-filled ones. If you already know the experimental g-values, tick "Enter g manually" and type them in directly.`}>
        <NumInput value={config.dCount} onChange={(v) => onChange("dCount", v)} min={1} max={9} label="d electrons" />
        <Select
          value={config.lambdaSign}
          options={["Auto", "Positive (+)", "Negative (−)"]}
          onChange={(v) => onChange("lambdaSign", v as SimConfig["lambdaSign"])}
          label="λ sign"
        />
        <NumInput value={config.lambdaMod} onChange={(v) => onChange("lambdaMod", v)} min={0} max={3000} step={10} label="|λ| (cm⁻¹)" />

        {config.symmetry === "Cubic / isotropic" && (
          <NumInput value={config.Dc} onChange={(v) => onChange("Dc", v)} min={100} max={40000} step={100} label="Δ cubic (cm⁻¹)" />
        )}
        {config.symmetry === "Axial (D4h / C4v / D3h)" && (
          <>
            <NumInput value={config.Dpar} onChange={(v) => onChange("Dpar", v)} min={100} max={40000} step={100} label="Δ‖ (cm⁻¹)" />
            <NumInput value={config.Dperp} onChange={(v) => onChange("Dperp", v)} min={100} max={40000} step={100} label="Δ⊥ (cm⁻¹)" />
          </>
        )}
        {config.symmetry === "Rhombic" && (
          <>
            <NumInput value={config.Dx} onChange={(v) => onChange("Dx", v)} min={100} max={40000} step={100} label="Δx (cm⁻¹)" />
            <NumInput value={config.Dy} onChange={(v) => onChange("Dy", v)} min={100} max={40000} step={100} label="Δy (cm⁻¹)" />
            <NumInput value={config.Dz} onChange={(v) => onChange("Dz", v)} min={100} max={40000} step={100} label="Δz (cm⁻¹)" />
          </>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            checked={config.manualG}
            onChange={(e) => onChange("manualG", e.target.checked)}
            className="accent-primary w-3 h-3"
            id="manualG"
          />
          <label htmlFor="manualG" className="text-[11px] text-on-surface-variant cursor-pointer">Enter g manually</label>
        </div>
        {config.manualG && config.symmetry === "Cubic / isotropic" && (
          <NumInput value={config.gIso} onChange={(v) => onChange("gIso", v)} step={0.001} label="g (isotropic)" />
        )}
        {config.manualG && config.symmetry === "Axial (D4h / C4v / D3h)" && (
          <>
            <NumInput value={config.gPar} onChange={(v) => onChange("gPar", v)} step={0.001} label="g‖" />
            <NumInput value={config.gPerp} onChange={(v) => onChange("gPerp", v)} step={0.001} label="g⊥" />
          </>
        )}
        {config.manualG && config.symmetry === "Rhombic" && (
          <>
            <NumInput value={config.gx} onChange={(v) => onChange("gx", v)} step={0.001} label="gx" />
            <NumInput value={config.gy} onChange={(v) => onChange("gy", v)} step={0.001} label="gy" />
            <NumInput value={config.gz} onChange={(v) => onChange("gz", v)} step={0.001} label="gz" />
          </>
        )}
      </Section>

      {/* Spectrum */}
      <Section title="Spectrum" icon={<Waves size={17} aria-hidden="true" />} accent="primary" defaultOpen={false} info="Settings of the simulated experiment. ν is the microwave frequency (X-band ≈ 9.5 GHz) and γ the linewidth of each line. Tumbling describes molecular motion: 'Rigid' is a frozen sample showing the full anisotropy (separate g‖ and g⊥ features), 'Isotropic' is fast rotation in solution, which averages everything into a single line. B min / B max set the field window and Points the resolution of the trace.">
        <NumInput value={config.frequency} onChange={(v) => onChange("frequency", v)} min={1} max={400} step={0.1} label="ν (GHz)" />
        <NumInput value={config.gamma} onChange={(v) => onChange("gamma", v)} min={0.1} max={500} step={0.5} label="γ (Gauss, FWHM)" />
        <Label>Display</Label>
        <div className="space-y-1">
          {displayOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="displayMode"
                checked={config.displayMode === opt}
                onChange={() => onChange("displayMode", opt)}
                className="accent-primary w-3 h-3"
              />
              <span className="text-[12px] text-on-surface group-hover:text-primary transition-colors">{opt}</span>
            </label>
          ))}
        </div>
        <Label>Tumbling</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {tumblingOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer group">
              <input
                type="radio"
                name="tumbling"
                checked={config.tumbling === opt}
                onChange={() => onChange("tumbling", opt)}
                className="accent-primary w-3 h-3"
              />
              <span className="text-[11px] text-on-surface group-hover:text-primary transition-colors">{opt}</span>
            </label>
          ))}
        </div>
        <NumInput value={config.BMin} onChange={(v) => onChange("BMin", v)} min={100} max={10000} step={100} label="B min (G)" />
        <NumInput value={config.BMax} onChange={(v) => onChange("BMax", v)} min={500} max={15000} step={100} label="B max (G)" />
        <NumInput value={config.nPoints} onChange={(v) => onChange("nPoints", v)} min={500} max={20000} step={500} label="Points" />
      </Section>

      {/* ZFS */}
      <Section title="Zero-Field Splitting (ZFS)" icon={<Magnet size={17} aria-hidden="true" />} accent="error" defaultOpen={S > 0.5} info="Zero-field splitting separates the spin sublevels even without a magnetic field. It exists only for ions with S > 1/2 (e.g. Mn²⁺, Fe³⁺, high-spin Co²⁺). D describes axial distortion along z; E (>0) adds rhombic distortion in the xy plane (|E/D| ≤ 1/3). For axial systems (E=0), the spectrum splits into 2S transitions. For rhombic systems (E≠0), each transition further splits. Enter D and E in units of 10⁻⁴ cm⁻¹.">
        {S > 0.5 ? (
          <>
            {config.symmetry === "Cubic / isotropic" ? (
              <div className="space-y-1">
                <Label>D (×10⁻⁴ cm⁻¹)</Label>
                <input
                  type="number"
                  value={0}
                  disabled
                  className="w-full bg-surface-variant/20 border border-outline-variant/20 rounded-lg px-3 py-2 text-[12px] text-on-surface-variant/50 font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-on-surface-variant/50">D = 0 per simmetria cubica/isotropica</p>
              </div>
            ) : (
              <NumInput value={config.D_zfs} onChange={(v) => onChange("D_zfs", v)} min={0} max={10000} step={5} label="D (×10⁻⁴ cm⁻¹)" />
            )}
            {config.symmetry !== "Cubic / isotropic" && (
              config.symmetry === "Rhombic" ? (
                <NumInput
                  value={config.E_zfs}
                  onChange={(v) => onChange("E_zfs", v)}
                  min={0}
                  max={config.D_zfs > 0 ? Math.floor(config.D_zfs / 3) : 0}
                  step={5}
                  label={`E (×10⁻⁴ cm⁻¹)  |E/D| ≤ 1/3`}
                />
              ) : (
                <div className="space-y-1">
                  <Label>E (×10⁻⁴ cm⁻¹)</Label>
                  <input
                    type="number"
                    value={0}
                    disabled
                    className="w-full bg-surface-variant/20 border border-outline-variant/20 rounded-lg px-3 py-2 text-[12px] text-on-surface-variant/50 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-on-surface-variant/50">E = 0 per simmetria assiale</p>
                </div>
              )
            )}
          </>
        ) : (
          <div className="text-[11px] text-on-surface-variant">S = 1/2, ZFS not applicable.</div>
        )}
      </Section>
      <div className="px-4 py-3 border-t border-outline-variant/10">
        <p className="text-[10px] text-on-surface-variant/60 text-center">
          Spectrum updates in real time as you change parameters.
        </p>
      </div>
    </aside>
  );
}

function LigandQuickAdd({ config, onChange }: { config: SimConfig; onChange: Setter }) {
  const [selected, setSelected] = useState("—");
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const info = selected !== "—" ? legantiComuni[selected] : null;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const allOptions = ["—", ...legantiComuniOrdine];

  const handleSelect = (name: string) => {
    setSelected(name);
    setOpen(false);
  };

  const handleAdd = () => {
    if (!info) return;
    const newGroups = [...config.ligandGroups];
    for (const nuc of info.nuclei) {
      if (config.symmetry === "Rhombic") {
        newGroups.push({
          isotope: nuc.isotope, n: nuc.n * count,
          A_par: nuc.A_par, A_perp: nuc.A_perp,
          A_x: nuc.A_perp, A_y: nuc.A_perp, A_z: nuc.A_par,
        });
      } else {
        newGroups.push({ isotope: nuc.isotope, n: nuc.n * count, A_par: nuc.A_par, A_perp: nuc.A_perp });
      }
    }
    onChange("ligandGroups", newGroups);
  };

  return (
    <div className="space-y-1.5">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg pl-2 pr-7 py-1.5 text-[11px] text-on-surface text-left focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-surface-variant/50 transition-colors"
        >
          <span className="block truncate">{selected}</span>
        </button>
        <ChevronDown
          size={12}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        {open && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg shadow-black/40 overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
            {allOptions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelect(name)}
                className={`w-full text-left px-2 py-1.5 text-[11px] transition-colors cursor-pointer ${
                  name === selected
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-variant/40"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      {info && (
        <>
          <div className="text-[10px] text-on-surface-variant">{info.description}</div>
          {info.nuclei.length > 0 && (
            <div className="text-[9px] text-on-surface-variant/70 font-mono space-y-0.5">
              {info.nuclei.map((nuc, ni) => (
                <div key={ni}>
                  {nuc.isotope}:{" "}
                  {config.symmetry === "Rhombic"
                    ? `Ax=${nuc.A_perp.toFixed(0)} Ay=${nuc.A_perp.toFixed(0)} Az=${nuc.A_par.toFixed(0)} G`
                    : `A‖=${nuc.A_par.toFixed(0)} A⊥=${nuc.A_perp.toFixed(0)} G`}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              min={1}
              max={16}
              className="w-16 bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[11px] font-mono text-on-surface focus:outline-none"
            />
            <button
              onClick={handleAdd}
              className="flex-1 bg-primary/20 text-primary text-[11px] font-bold py-1.5 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </>
      )}
    </div>
  );
}
