"use client";

import { useMemo } from "react";

export interface SplittingGroup {
  name: string;
  n: number;
  I: number;
  A: number;
  color: string;
}

interface SplittingTreeProps {
  groups: SplittingGroup[];
  totalLines: number;
}

interface TreeNode {
  x: number;
  intensity: number;
}

interface TreeLevel {
  label: string;
  nLines: number;
  nodes: TreeNode[];
  branchesPerParent: number | null;
  color: string;
  bracketLeftX: number | null;
  bracketRightX: number | null;
  labelA: number | null;
  nucleusLabel: string | null;
}

const LEVEL_HEIGHT = 80;
const START_LEVEL_HEIGHT = 40;
const PROPORTIONAL_SCALE = 1.5;
const NO_LIGAND_TARGET_WIDTH = 700;
const MAX_VISIBLE_NODES = 200;

function extractNucleus(name: string): string {
  const paren = name.indexOf("(");
  return paren > 0 ? name.slice(0, paren).trim() : name;
}

function computeDegeneracies(n: number, I: number): { mTotal: number; degeneracy: number }[] {
  if (n === 1) {
    const result: { mTotal: number; degeneracy: number }[] = [];
    for (let m = -I; m <= I + 0.001; m += 1) {
      result.push({ mTotal: Number(m.toFixed(2)), degeneracy: 1 });
    }
    return result;
  }

  const scale = I % 1 === 0 ? 1 : 2;
  const twoIScaled = Math.round(2 * I * scale);
  const nIScaled = n * I * scale;
  const maxIdx = n * twoIScaled;

  let dp = new Int32Array(maxIdx + 1);
  dp[0] = 1;

  for (let k = 0; k < n; k++) {
    const newDp = new Int32Array(maxIdx + 1);
    for (let prev = 0; prev <= maxIdx; prev++) {
      if (dp[prev] === 0) continue;
      for (let m = 0; m <= twoIScaled; m += scale) {
        newDp[prev + m] += dp[prev];
      }
    }
    dp = newDp;
  }

  const result: { mTotal: number; degeneracy: number }[] = [];
  for (let idx = 0; idx <= maxIdx; idx++) {
    if (dp[idx] > 0) {
      const M = (idx - nIScaled) / scale;
      result.push({ mTotal: Number(M.toFixed(2)), degeneracy: dp[idx] });
    }
  }
  return result;
}

export default function SplittingTree({ groups, totalLines }: SplittingTreeProps) {
  const hScale = useMemo(() => {
    if (groups.length === 0) return PROPORTIONAL_SCALE;

    let totalSpreadG = 2 * groups[0].I * groups[0].A;
    for (let gi = 1; gi < groups.length; gi++) {
      totalSpreadG += 2 * groups[gi].n * groups[gi].I * groups[gi].A;
    }

    if (totalSpreadG <= 0) return PROPORTIONAL_SCALE;

    const s = NO_LIGAND_TARGET_WIDTH / totalSpreadG;
    return Math.max(0.05, Math.min(20, s));
  }, [groups]);

  const levels = useMemo(() => {
    if (groups.length === 0) return [] as TreeLevel[];

    const result: TreeLevel[] = [];
    let nodes: TreeNode[] = [{ x: 0, intensity: 1 }];

    result.push({
      label: "1 line",
      nLines: 1,
      nodes: [{ x: 0, intensity: 1 }],
      branchesPerParent: null,
      color: "#b9cacb",
      bracketLeftX: null,
      bracketRightX: null,
      labelA: null,
      nucleusLabel: null,
    });

    let truncated = false;

    for (let gi = 0; gi < groups.length; gi++) {
      if (truncated) break;
      const group = groups[gi];
      const branches = computeDegeneracies(group.n, group.I);
      const bpf = branches.length;

      const nextNodes: TreeNode[] = [];

      for (const parent of nodes) {
        for (const { mTotal, degeneracy } of branches) {
          nextNodes.push({
            x: parent.x + mTotal * group.A * hScale,
            intensity: parent.intensity * degeneracy,
          });
        }
      }

      if (nextNodes.length > MAX_VISIBLE_NODES) {
        const sampled: TreeNode[] = [];
        const step = Math.ceil(nextNodes.length / MAX_VISIBLE_NODES);
        for (let i = 0; i < nextNodes.length; i += step) {
          sampled.push(nextNodes[i]);
        }
        result.push({
          label: group.name,
          nLines: nextNodes.length,
          nodes: sampled,
          branchesPerParent: null,
          color: group.color,
          bracketLeftX: null,
          bracketRightX: null,
          labelA: null,
          nucleusLabel: null,
        });
        truncated = true;
      } else {
        const allX = nextNodes.map(n => n.x);
        const bracketLeftX = Math.min(...allX);
        const bracketRightX = Math.max(...allX);
        result.push({
          label: group.name,
          nLines: nextNodes.length,
          nodes: nextNodes,
          branchesPerParent: bpf,
          color: group.color,
          bracketLeftX,
          bracketRightX,
          labelA: group.A,
          nucleusLabel: extractNucleus(group.name),
        });
        nodes = nextNodes;
      }
    }

    return result;
  }, [groups, hScale]);

  if (groups.length === 0 || levels.length === 0) return null;

  const maxIntensity = Math.max(...levels.flatMap((l) => l.nodes.map((n) => n.intensity)));
  const allX = levels.flatMap((l) => l.nodes.map((n) => n.x));
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const padding = 60;
  const labelWidth = 130;
  const infoWidth = 110;
  const totalWidth = Math.max(maxX - minX + padding + labelWidth + infoWidth, 500);
  const totalHeight = START_LEVEL_HEIGHT + Math.max(0, levels.length - 1) * LEVEL_HEIGHT + 50;

  const nodeRadius = (intensity: number) => {
    const ratio = intensity / maxIntensity;
    return Math.max(1.5, 1 + ratio * ratio * 9);
  };

  const normalizedX = (x: number) => x - minX + padding + labelWidth;
  const levelY = (idx: number) => {
    if (idx === 0) return 25;
    return START_LEVEL_HEIGHT + (idx - 1) * LEVEL_HEIGHT + 35;
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ minWidth: `${Math.min(totalWidth, 850)}px`, width: "100%", height: "auto" }}
        className="font-mono"
      >
        {/* Connection lines between levels */}
        {levels.slice(1).map((level, li) => {
          const prevLevel = levels[li];
          const prevNodes = prevLevel.nodes;
          const currNodes = level.nodes;
          const bpf = level.branchesPerParent;
          const color = level.color;

          if (bpf === null || !Number.isInteger(bpf) || prevNodes.length === 0) {
            return null;
          }

          const elements: React.ReactNode[] = [];

          prevNodes.forEach((parent, pi) => {
            const startIdx = pi * bpf;
            const endIdx = startIdx + bpf;
            currNodes.slice(startIdx, endIdx).forEach((child, ci) => {
              elements.push(
                <line
                  key={`conn-${li}-${pi}-${ci}`}
                  x1={normalizedX(parent.x)}
                  y1={levelY(li) + nodeRadius(parent.intensity)}
                  x2={normalizedX(child.x)}
                  y2={levelY(li + 1) - nodeRadius(child.intensity)}
                  stroke={color}
                  strokeOpacity={0.08 + (child.intensity / maxIntensity) * 0.3}
                  strokeWidth={0.5 + (child.intensity / maxIntensity) * 1}
                />
              );
            });
          });

          return elements;
        })}

        {/* A-value brackets between levels */}
        {levels.slice(1).map((level, li) => {
          if (level.bracketLeftX === null || level.bracketRightX === null || level.labelA === null) return null;
          if (level.nodes.length === 0) return null;

          const midY = levelY(li) + (levelY(li + 1) - levelY(li)) / 2;
          const bracketLeft = normalizedX(level.bracketLeftX);
          const bracketRight = normalizedX(level.bracketRightX);
          const color = level.color;

          if (bracketRight - bracketLeft < 15) return null;

          return (
            <g key={`a-bracket-${li}`}>
              <line x1={bracketLeft} y1={midY} x2={bracketRight} y2={midY} stroke={color} strokeOpacity={0.5} strokeWidth={0.8} />
              <line x1={bracketLeft} y1={midY - 6} x2={bracketLeft} y2={midY + 6} stroke={color} strokeOpacity={0.5} strokeWidth={0.8} />
              <line x1={bracketRight} y1={midY - 6} x2={bracketRight} y2={midY + 6} stroke={color} strokeOpacity={0.5} strokeWidth={0.8} />
              <text
                x={(bracketLeft + bracketRight) / 2}
                y={midY - 10}
                fill={color}
                fontSize={9}
                fontWeight="bold"
                textAnchor="middle"
              >
                {level.nucleusLabel ? `A(${level.nucleusLabel}) = ${level.labelA.toFixed(1)} G` : `A = ${level.labelA.toFixed(1)} G`}
              </text>
            </g>
          );
        })}

        {/* Level labels on the left */}
        {levels.map((level, li) => (
          <g key={`label-${li}`}>
            <rect x={4} y={levelY(li) - 10} width={labelWidth - 8} height={20} rx={4} fill={level.color} fillOpacity={0.06} />
            <text
              x={labelWidth / 2}
              y={levelY(li) + 4}
              fill={level.color}
              fontSize={9}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {level.label}
            </text>
          </g>
        ))}

        {/* Node circles */}
        {levels.map((level, li) =>
          level.nodes.map((node, ni) => {
            const r = nodeRadius(node.intensity);
            const ratio = node.intensity / maxIntensity;
            return (
              <circle
                key={`node-${li}-${ni}`}
                cx={normalizedX(node.x)}
                cy={levelY(li)}
                r={r}
                fill={level.color}
                fillOpacity={0.12 + ratio * ratio * 0.7}
                stroke={level.color}
                strokeOpacity={0.15 + ratio * 0.5}
                strokeWidth={ratio > 0.5 ? 1.2 : 0.5}
              />
            );
          })
        )}

        {/* Line count on the right */}
        {levels.map((level, li) => (
          <text
            key={`info-${li}`}
            x={labelWidth + padding + (maxX - minX) + padding + 8}
            y={levelY(li) + 4}
            fill={level.color}
            fontSize={9}
            textAnchor="start"
            dominantBaseline="middle"
            opacity={0.8}
          >
            {level.nLines > MAX_VISIBLE_NODES
              ? `~${level.nLines} (truncated)`
              : `${level.nLines} line${level.nLines !== 1 ? "s" : ""}`}
          </text>
        ))}

        {/* Legend at the bottom */}
        <g>
          <rect x={labelWidth / 2 - 90} y={totalHeight - 32} width={180} height={24} rx={5} fill="#111318" fillOpacity={0.85} stroke="#ffffff" strokeOpacity={0.06} strokeWidth={0.5} />
          <circle cx={labelWidth / 2 - 60} cy={totalHeight - 20} r={3.5} fill={groups[0]?.color ?? "#dbfcff"} fillOpacity={0.7} />
          <text x={labelWidth / 2 - 50} y={totalHeight - 16} fill="#849495" fontSize={9}>Metal</text>
          {groups.length > 1 && (
            <>
              <circle cx={labelWidth / 2 + 15} cy={totalHeight - 20} r={3.5} fill={groups.slice(1).find(g => g.color !== groups[0]?.color)?.color ?? "#e5ffba"} fillOpacity={0.7} />
              <text x={labelWidth / 2 + 25} y={totalHeight - 16} fill="#849495" fontSize={9}>Ligand</text>
            </>
          )}
        </g>

        {/* Total lines annotation at the bottom */}
        <text
          x={totalWidth / 2}
          y={totalHeight - 40}
          fill="#dbfcff"
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          Total: {totalLines.toLocaleString()} lines
        </text>
      </svg>
    </div>
  );
}
