export interface MetalIsotope {
  label: string;
  I: number;
  abundance: number;
}

export interface MetalCenter {
  name: string;
  fullName: string;
  S: number;
  dCount: number;
  isotopes: MetalIsotope[];
  A_par_default: Record<string, number> | number;
  A_perp_default: Record<string, number> | number;
}

export interface LigandIsotope {
  label: string;
  I: number;
  abundance: number;
  element: string;
}

export interface LigandGroup {
  isotope: string;
  n: number;
  A_par: number;
  A_perp: number;
  A_x?: number;
  A_y?: number;
  A_z?: number;
}

export interface CommonLigand {
  description: string;
  nuclei: { isotope: string; n: number; A_par: number; A_perp: number }[];
  distant_nuclei?: [string, number, number, number][];
}

export interface Preset {
  metal: string;
  symmetry: string;
  stato?: string;
  A_par: Record<string, number>;
  A_perp: Record<string, number>;
  ligands: LigandGroup[];
  distant_nuclei?: [string, number, number, number][];
  D_zfs?: number;
}

export interface OrientationResult {
  label: string;
  patternKey: 'pattern_par' | 'pattern_perp' | 'pattern_iso' | 'pattern_x' | 'pattern_y' | 'pattern_z';
  g: number;
}

export interface IsotopeResult {
  isotope: string;
  abundance: number;
  pattern_par: Record<number, number>;
  pattern_perp: Record<number, number>;
  pattern_iso: Record<number, number>;
  pattern_x?: Record<number, number>;
  pattern_y?: Record<number, number>;
  pattern_z?: Record<number, number>;
  n_lines: number;
}

export interface Transition {
  ms_start: number;
  shift_factor: number;
  intensity: number;
}

export type Symmetry = 'Cubic / isotropic' | 'Axial (D4h / C4v / D3h)' | 'Rhombic';

export type Tumbling = 'Rigid' | 'Slow' | 'Intermediate' | 'Fast' | 'Isotropic';

export type DisplayMode = 'Absorption only' | 'Derivative only' | 'Both';

export interface SpectrumParams {
  metalName: string;
  symmetry: Symmetry;
  stato?: string;
  lambdaEff: number;
  dCount: number;
  Dc?: number;
  Dpar?: number;
  Dperp?: number;
  Dx?: number;
  Dy?: number;
  Dz?: number;
  manualG: boolean;
  gPar?: number;
  gPerp?: number;
  gIso?: number;
  gx?: number;
  gy?: number;
  gz?: number;
  A_par: Record<string, number>;
  A_perp: Record<string, number>;
  ligands: LigandGroup[];
  D_zfs: number;
  frequency: number;
  gamma: number;
  tumbling: number;
  BMin: number;
  BMax: number;
  nPoints: number;
  displayMode: DisplayMode;
}

export interface SpectrumResult {
  stickData: IsotopeResult[];
  orientations: OrientationResult[];
  transitions: Transition[];
  absorption: number[];
  derivative: number[];
  fieldAxis: number[];
}

export interface SimConfig {
  complexName?: string;
  metalName: string;
  symmetry: Symmetry;
  stato: string;
  lambdaMod: number;
  lambdaSign: "Auto" | "Positive (+)" | "Negative (−)";
  dCount: number;
  Dc: number;
  Dpar: number;
  Dperp: number;
  Dx: number;
  Dy: number;
  Dz: number;
  manualG: boolean;
  gPar: number;
  gPerp: number;
  gIso: number;
  gx: number;
  gy: number;
  gz: number;
  frequency: number;
  gamma: number;
  tumbling: string;
  BMin: number;
  BMax: number;
  nPoints: number;
  displayMode: DisplayMode;
  D_zfs: number;
  ligandGroups: LigandGroup[];
}

export const PLACEHOLDER_METAL = "— Select a metal —";

export const DEFAULT_CONFIG: SimConfig = {
  complexName: undefined,
  metalName: PLACEHOLDER_METAL,
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
