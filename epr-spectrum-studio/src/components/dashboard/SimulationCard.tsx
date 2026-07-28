"use client";

import { Clock, Trash2, FileText, ArrowUpRight } from "lucide-react";
import type { SavedSimulation } from "@/lib/history";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface Props {
  sim: SavedSimulation;
  onLoad: (sim: SavedSimulation) => void;
  onDelete: (id: string) => void;
  onReport: (sim: SavedSimulation) => void;
}

const ACCENT_COLORS = ["border-l-primary/50", "border-l-tertiary/50", "border-l-secondary/50", "border-l-[#38bdf8]/50"] as const;

const GLOW_COLORS: Record<string, string> = {
  "primary": "rgba(142,213,255,0.12)",
  "tertiary": "rgba(84,231,136,0.12)",
  "secondary": "rgba(255,175,211,0.12)",
  "#38bdf8": "rgba(56,189,248,0.12)",
};

function getGlowColor(accent: string): string {
  for (const [key, glow] of Object.entries(GLOW_COLORS)) {
    if (accent.includes(key)) return glow;
  }
  return GLOW_COLORS["primary"]!;
}

export function SimulationCard({ sim, onLoad, onDelete, onReport }: Props) {
  const c = sim.config;
  const date = new Date(sim.timestamp);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const accent = ACCENT_COLORS[Math.abs(hash(sim.id)) % ACCENT_COLORS.length];
  const glowColor = getGlowColor(accent);

  const gText = sim.gValues.gIso
    ? `g = ${sim.gValues.gIso.toFixed(4)}`
    : sim.gValues.gPar
      ? `g\u2016 = ${sim.gValues.gPar.toFixed(3)}`
      : "";

  return (
    <div
      className="rounded-xl transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: `0 0 0px ${glowColor}` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${glowColor}`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px ${glowColor}`; }}
    >
      <GlassPanel className={`rounded-xl overflow-hidden border-l-4 ${accent}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant bg-surface-variant/40 px-2 py-0.5 rounded">
            {c.symmetry.split(" ")[0]}
          </span>
          <span className="text-[10px] text-on-surface-variant/50 flex items-center gap-1">
            <Clock size={10} />
            {dateStr}
          </span>
        </div>

        <h3 className="text-[14px] font-bold text-on-surface mb-1 font-display">
          {c.metalName}
        </h3>
        <p className="text-[11px] text-on-surface-variant mb-3">
          {c.symmetry} {gText && <span className="font-mono text-primary/80 ml-1">{gText}</span>}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-[10px] text-on-surface-variant/60 bg-surface-container-lowest/60 px-1.5 py-0.5 rounded font-mono">
            {sim.stickCount} lines
          </span>
          {c.ligandGroups.length > 0 && (
            <span className="text-[10px] text-on-surface-variant/60 bg-surface-container-lowest/60 px-1.5 py-0.5 rounded font-mono">
              {c.ligandGroups.length} ligand{c.ligandGroups.length > 1 ? "s" : ""}
            </span>
          )}
          {c.D_zfs > 0 && (
            <span className="text-[10px] text-[#54e788]/80 bg-[#54e788]/5 px-1.5 py-0.5 rounded font-mono">
              D &gt; 0
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onLoad(sim)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <ArrowUpRight size={12} /> Load
          </button>
          <button
            onClick={() => onReport(sim)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-colors cursor-pointer"
            title="Download report"
          >
            <FileText size={12} /> Report
          </button>
          <button
            onClick={() => onDelete(sim.id)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-on-surface-variant/40 hover:text-error hover:bg-error/5 transition-colors cursor-pointer ml-auto"
            title="Delete simulation"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      </GlassPanel>
    </div>
  );
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
