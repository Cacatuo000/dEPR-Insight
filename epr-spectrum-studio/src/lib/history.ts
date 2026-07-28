import type { SimConfig } from "@/lib/engine/types";

export interface SavedSimulation {
  id: string;
  timestamp: number;
  config: SimConfig;
  gValues: Record<string, number>;
  hfValues: Record<string, { apar: number; aperp: number }>;
  stickCount: number;
  nOrientations: number;
}

const STORAGE_KEY = "epr_simulation_history";
const VISITED_KEY = "epr_dashboard_visited";

export function getVisited(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(VISITED_KEY) === "1";
}

export function markVisited(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VISITED_KEY, "1");
}

export function loadHistory(): SavedSimulation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSimulation[];
  } catch {
    return [];
  }
}

export function saveSimulation(sim: SavedSimulation): void {
  const history = loadHistory();
  history.unshift(sim);
  const trimmed = history.slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteSimulation(id: string): SavedSimulation[] {
  const history = loadHistory().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
