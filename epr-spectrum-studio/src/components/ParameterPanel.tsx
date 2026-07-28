"use client";

import { useState, useRef, useEffect } from "react";
import type { SimConfig, Symmetry, DisplayMode, LigandGroup, Preset } from "@/lib/engine/types";
import { metalli, metalKeys } from "@/lib/engine/metals";
import { legantiOrdine, legantiComuni, legantiComuniOrdine } from "@/lib/engine/ligands";
import { presetDatabase, presetKeys } from "@/lib/engine/presets";
import { ChevronDown, ChevronRight, Plus, Trash2, Zap, FlaskConical, SlidersHorizontal, Waves, Magnet } from "lucide-react";
import { InfoTip } from "@/components/ui/InfoTip";

interface Props {
  config: SimConfig;
  onChange: <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;
  onApplyPreset: (preset: Preset) => void;
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
    glow: "shadow-[0_0_10px_rgba(142,213,255,0.25)]",
  },
  primaryContainer: {
    chip: "bg-primary-container/10 border-primary-container/25 text-primary-container",
    glow: "shadow-[0_0_10px_rgba(56,189,248,0.25)]",
  },
  tertiary: {
    chip: "bg-tertiary/10 border-tertiary/25 text-tertiary",
    glow: "shadow-[0_0_10px_rgba(84,231,136,0.25)]",
  },
  secondary: {
    chip: "bg-secondary/10 border-secondary/25 text-secondary",
    glow: "shadow-[0_0_10px_rgba(255,175,211,0.25)]",
  },
  error: {
    chip: "bg-error/10 border-error/25 text-error",
    glow: "shadow-[0_0_10px_rgba(255,180,171,0.25)]",
  },
} as const;

type AccentKey = keyof typeof ACCENTS;

function Section({ title, icon, accent = "primary", defaultOpen, info, children }: { title: string; icon?: React.ReactNode; accent?: AccentKey; defaultOpen?: boolean; info?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const a = ACCENTS[accent];
  return (
    <div className="border-b border-outline-variant/10 last:border-b-0">
      <div className="flex items-center gap-1.5 w-full px-4 py-3 text-[12px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">
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
        <div className="absolute z-50 left-0 mt-1 min-w-[140px] bg-surface-container-high border border-outline-variant/30 rounded-lg shadow-lg shadow-black/40 overflow-hidden max-h-44 overflow-y-auto custom-scrollbar">
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
          className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg pl-3 pr-8 py-2 text-[12px] text-on-surface font-sans text-left focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-surface-variant/50 transition-colors"
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

export function ParameterPanel({ config, onChange: propOnChange, onApplyPreset }: Props) {
  const metal = metalli[config.metalName];
  const S = metal?.S ?? 0.5;
  const [selectedPreset, setSelectedPreset] = useState("None (manual)");
  const applyingPreset = useRef(false);

  const handlePreset = (name: string) => {
    if (name === "None (manual)") {
      setSelectedPreset("None (manual)");
      return;
    }
    const preset = presetDatabase[name];
    if (!preset) return;
    applyingPreset.current = true;
    onApplyPreset(preset);
    setSelectedPreset(name);
    setTimeout(() => { applyingPreset.current = false; }, 0);
  };

  const onChange = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => {
    if (!applyingPreset.current) {
      setSelectedPreset("None (manual)");
    }
    propOnChange(key, value);
  };

  return (
    <aside className="w-80 shrink-0 h-full bg-surface-container-low border-r border-outline-variant/20 overflow-y-auto custom-scrollbar">
      {/* Presets */}
      <Section title="Quick presets" icon={<Zap size={15} aria-hidden="true" />} accent="primaryContainer" defaultOpen={false} info="Ready-to-use parameter sets for common complexes. Choosing one fills in metal, symmetry, couplings and ligands for you — you can still change anything afterwards.">
        <Select
          value={selectedPreset}
          options={["None (manual)", ...presetKeys]}
          onChange={handlePreset}
        />
      </Section>

      {/* Complex */}
      <Section title="Complex" icon={<FlaskConical size={15} aria-hidden="true" />} accent="tertiary" info="What you are simulating: the metal ion, the symmetry of its coordination environment, and — for axial complexes — the d orbital hosting the unpaired electron. You can also add ligand nuclei with spin (e.g. ¹⁴N, ¹H): their coupling with the unpaired electron produces superhyperfine splitting, the small extra lines in the spectrum.">
        <Select
          value={config.metalName}
          options={metalKeys}
          onChange={(v) => onChange("metalName", v)}
          label="Metal center"
        />
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
          <Label>Add common ligand</Label>
          <LigandQuickAdd config={config} onChange={onChange} />
        </div>

        {/* Custom ligand groups */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <Label>Custom groups</Label>
            <button
              onClick={() => {
                const newGroup: LigandGroup = { isotope: "N-14", n: 2, A_par: 15, A_perp: 15 };
                onChange("ligandGroups", [...config.ligandGroups, newGroup]);
              }}
              aria-label="Add custom ligand group"
              title="Add custom ligand group"
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
          {config.ligandGroups.map((group, idx) => (
            <div key={idx} className="flex items-center gap-1 mt-1.5 p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
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
                title="n"
              />
              <input
                type="number"
                value={group.A_par}
                onChange={(e) => {
                  const updated = [...config.ligandGroups];
                  updated[idx] = { ...updated[idx], A_par: Number(e.target.value) };
                  onChange("ligandGroups", updated);
                }}
                step={0.5}
                className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
                title="A‖"
              />
              <input
                type="number"
                value={group.A_perp}
                onChange={(e) => {
                  const updated = [...config.ligandGroups];
                  updated[idx] = { ...updated[idx], A_perp: Number(e.target.value) };
                  onChange("ligandGroups", updated);
                }}
                step={0.5}
                className="w-14 bg-transparent border border-outline-variant/20 rounded-lg px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
                title="A⊥"
              />
              <button
                onClick={() => onChange("ligandGroups", config.ligandGroups.filter((_, i) => i !== idx))}
                aria-label={`Remove ${group.isotope} group`}
                title={`Remove ${group.isotope} group`}
                className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Electronic */}
      <Section title="Electronic parameters" icon={<SlidersHorizontal size={15} aria-hidden="true" />} accent="secondary" defaultOpen={false} info={`How the g-factors are calculated. Δ is the energy gap between the d orbitals created by the ligand field; λ (spin–orbit coupling) mixes the orbitals and shifts g away from the free-electron value (gₑ = 2.0023). The λ sign is chosen automatically: positive for less-than-half-filled d shells, negative for more-than-half-filled ones. If you already know the experimental g-values, tick "Enter g manually" and type them in directly.`}>
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
      <Section title="Spectrum" icon={<Waves size={15} aria-hidden="true" />} accent="primary" info="Settings of the simulated experiment. ν is the microwave frequency (X-band ≈ 9.5 GHz) and γ the linewidth of each line. Tumbling describes molecular motion: 'Rigid' is a frozen sample showing the full anisotropy (separate g‖ and g⊥ features), 'Isotropic' is fast rotation in solution, which averages everything into a single line. B min / B max set the field window and Points the resolution of the trace.">
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
      <Section title="Zero-Field Splitting (ZFS)" icon={<Magnet size={15} aria-hidden="true" />} accent="error" defaultOpen={S > 0.5} info="Zero-field splitting separates the spin sublevels even without a magnetic field. It exists only for ions with S > 1/2 (e.g. Mn²⁺, Fe³⁺, high-spin Co²⁺); for S = 1/2 ions like Cu²⁺ it has no effect. A non-zero D splits the spectrum into 2S transitions at different fields. Enter D in units of 10⁻⁴ cm⁻¹.">
        {S > 0.5 ? (
          <NumInput value={config.D_zfs} onChange={(v) => onChange("D_zfs", v)} min={0} max={10000} step={5} label="D (×10⁻⁴ cm⁻¹)" />
        ) : (
          <div className="text-[11px] text-on-surface-variant">S = 1/2, ZFS not applicable.</div>
        )}
      </Section>
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
    const newGroups: LigandGroup[] = [];
    for (const nuc of info.nuclei) {
      const existing = config.ligandGroups.findIndex(g => g.isotope === nuc.isotope);
      if (existing >= 0) {
        const updated = [...config.ligandGroups];
        updated[existing] = { ...updated[existing], n: updated[existing].n + nuc.n * count };
        onChange("ligandGroups", updated);
      } else {
        newGroups.push({ isotope: nuc.isotope, n: nuc.n * count, A_par: nuc.A_par, A_perp: nuc.A_perp });
      }
    }
    if (newGroups.length > 0) {
      onChange("ligandGroups", [...config.ligandGroups, ...newGroups]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg pl-2 pr-7 py-1.5 text-[11px] text-on-surface font-sans text-left focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-surface-variant/50 transition-colors"
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
