"use client";

import { useState } from "react";
import type { SimConfig, Symmetry, DisplayMode, LigandGroup } from "@/lib/engine/types";
import { metalli, metalKeys } from "@/lib/engine/metals";
import { legantiLibreria, legantiOrdine, legantiComuni, legantiComuniOrdine } from "@/lib/engine/ligands";
import { presetDatabase, presetKeys } from "@/lib/engine/presets";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

interface Props {
  config: SimConfig;
  onChange: <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;
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

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="border-b border-outline-variant/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

type Setter = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => void;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-on-surface-variant block mb-1">{children}</label>;
}

function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-3 py-2 text-[12px] text-on-surface font-sans focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
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

export function ParameterPanel({ config, onChange }: Props) {
  const metal = metalli[config.metalName];
  const S = metal?.S ?? 0.5;

  const handlePreset = (name: string) => {
    if (name === "None (manual)") return;
    const preset = presetDatabase[name];
    if (!preset) return;
    onChange("metalName", preset.metal);
    onChange("symmetry", preset.symmetry as Symmetry);
    if (preset.stato) onChange("stato", preset.stato);
    const metalData = metalli[preset.metal];
    if (metalData) {
      const hf: Record<string, { apar: number; aperp: number }> = {};
      for (const iso of metalData.isotopes) {
        const apar = preset.A_par?.[iso.label] ?? (typeof metalData.A_par_default === "number" ? metalData.A_par_default : metalData.A_par_default[iso.label] ?? 0);
        const aperp = preset.A_perp?.[iso.label] ?? (typeof metalData.A_perp_default === "number" ? metalData.A_perp_default : metalData.A_perp_default[iso.label] ?? 0);
        hf[iso.label] = { apar, aperp };
      }
    }
    onChange("ligandGroups", (preset.ligands ?? []).map(l => ({ ...l })));
  };

  return (
    <aside className="w-80 shrink-0 h-full bg-surface-container-low border-r border-outline-variant/20 overflow-y-auto custom-scrollbar">
      <div className="px-4 py-4 border-b border-outline-variant/10">
        <h2 className="text-[16px] font-bold text-on-surface" style={{ fontFamily: "var(--font-display, Geist)" }}>
          dEPR Insight
        </h2>
        <p className="text-[10px] text-on-surface-variant mt-0.5">EPR Simulation Suite</p>
      </div>

      {/* ⚡ Presets */}
      <Section title="⚡ Quick presets" defaultOpen={false}>
        <Select
          value="None (manual)"
          options={["None (manual)", ...presetKeys]}
          onChange={handlePreset}
        />
      </Section>

      {/* 🧬 Complex */}
      <Section title="🧬 Complex">
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
              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
          {config.ligandGroups.map((group, idx) => (
            <div key={idx} className="flex items-center gap-1 mt-1.5 p-2 rounded bg-surface-variant/20 border border-outline-variant/10">
              <select
                value={group.isotope}
                onChange={(e) => {
                  const updated = [...config.ligandGroups];
                  updated[idx] = { ...updated[idx], isotope: e.target.value };
                  onChange("ligandGroups", updated);
                }}
                className="flex-1 bg-transparent border border-outline-variant/20 rounded px-1.5 py-1 text-[10px] font-mono text-on-surface focus:outline-none"
              >
                {legantiOrdine.map((iso) => (
                  <option key={iso} value={iso}>{iso}</option>
                ))}
              </select>
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
                className="w-8 bg-transparent border border-outline-variant/20 rounded px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
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
                className="w-14 bg-transparent border border-outline-variant/20 rounded px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
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
                className="w-14 bg-transparent border border-outline-variant/20 rounded px-1 py-1 text-[10px] font-mono text-on-surface text-center focus:outline-none"
                title="A⊥"
              />
              <button
                onClick={() => onChange("ligandGroups", config.ligandGroups.filter((_, i) => i !== idx))}
                className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ⚙️ Electronic */}
      <Section title="⚙️ Electronic parameters" defaultOpen={false}>
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

      {/* 📡 Spectrum */}
      <Section title="📡 Spectrum">
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

      {/* 🧲 ZFS */}
      <Section title="🧲 Zero-Field Splitting (ZFS)" defaultOpen={S > 0.5}>
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

  const info = selected !== "—" ? legantiComuni[selected] : null;

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
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-surface-variant/40 border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[11px] text-on-surface font-sans focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
      >
        <option value="—">—</option>
        {legantiComuniOrdine.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
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
              className="w-16 bg-surface-variant/40 border border-outline-variant/30 rounded px-2 py-1.5 text-[11px] font-mono text-on-surface focus:outline-none"
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
