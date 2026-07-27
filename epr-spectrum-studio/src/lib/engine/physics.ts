import { metalli } from './metals';
import { legantiLibreria } from './ligands';
import type {
  SpectrumParams,
  SpectrumResult,
  IsotopeResult,
  OrientationResult,
  Transition,
  Symmetry,
} from './types';

export const NU_B = 714.486;
export const G_E = 2.0023;
export const D_CM1_TO_GAUSS = 2.1418;

export function intensitaGruppo(n: number, I: number): [number, number][] {
  const passi = Math.round(2 * I) + 1;
  const mIPossibili: number[] = [];
  for (let k = 0; k < passi; k++) {
    mIPossibili.push(I - k);
  }

  let spettro = new Map<number, number>();
  spettro.set(0.0, 1.0);

  for (let g = 0; g < n; g++) {
    const nuovo = new Map<number, number>();
    for (const [spost, inten] of spettro) {
      for (const m of mIPossibili) {
        const chiave = Math.round((spost + m) * 1e6) / 1e6;
        nuovo.set(chiave, (nuovo.get(chiave) ?? 0) + inten);
      }
    }
    spettro = nuovo;
  }

  return [...spettro.entries()].sort(([a], [b]) => a - b);
}

export function calcolaPattern(
  groups: [number, number, number][]
): Record<number, number> {
  let spettro = new Map<number, number>();
  spettro.set(0.0, 1.0);

  for (const [n, I, A] of groups) {
    const righe = intensitaGruppo(n, I);
    const nuovo = new Map<number, number>();
    for (const [spost, inten] of spettro) {
      for (const [msum, i2] of righe) {
        const chiave = Math.round((spost + A * msum) * 1e6) / 1e6;
        nuovo.set(chiave, (nuovo.get(chiave) ?? 0) + inten * i2);
      }
    }
    spettro = nuovo;
  }

  const result: Record<number, number> = {};
  for (const [k, v] of spettro) {
    result[k] = v;
  }
  return result;
}

export function lorentziana(B: number, Bc: number, gamma: number): number {
  return (gamma / 2.0) / (Math.PI * ((B - Bc) ** 2 + (gamma / 2.0) ** 2));
}

export function buildTransizioniFineStructure(
  S: number,
  D_eff: number
): Transition[] {
  if (S <= 0.5 || D_eff === 0.0) {
    return [{ ms_start: -0.5, shift_factor: 0.0, intensity: 1.0 }];
  }
  const transizioni: Transition[] = [];
  for (let k = 0; k < Math.round(2 * S); k++) {
    const ms = -S + k;
    const shift_factor = -(2 * ms + 1);
    const intensita = S * (S + 1) - ms * (ms + 1);
    transizioni.push({ ms_start: ms, shift_factor, intensity: intensita });
  }
  const maxInt = Math.max(...transizioni.map((t) => t.intensity));
  for (const t of transizioni) {
    t.intensity /= maxInt;
  }
  return transizioni;
}

export function A_iso_di(Apar: number, Aperp: number): number {
  return (Apar + 2 * Aperp) / 3.0;
}

function linspace(start: number, stop: number, num: number): number[] {
  if (num <= 1) return [start];
  const step = (stop - start) / (num - 1);
  return Array.from({ length: num }, (_, i) => start + i * step);
}

function gradient(arr: number[], dx: number): number[] {
  const n = arr.length;
  const result: number[] = new Array(n);
  if (n === 1) {
    result[0] = 0;
    return result;
  }
  result[0] = (arr[1] - arr[0]) / dx;
  for (let i = 1; i < n - 1; i++) {
    result[i] = (arr[i + 1] - arr[i - 1]) / (2 * dx);
  }
  result[n - 1] = (arr[n - 1] - arr[n - 2]) / dx;
  return result;
}

export function computeGValues(params: {
  symmetry: Symmetry;
  stato?: string;
  lambdaEff: number;
  Dc?: number;
  Dpar?: number;
  Dperp?: number;
  Dx?: number;
  Dy?: number;
  Dz?: number;
}): {
  gPar?: number;
  gPerp?: number;
  gIso?: number;
  gx?: number;
  gy?: number;
  gz?: number;
} {
  if (params.symmetry === 'Cubic / isotropic') {
    const Dc = params.Dc ?? 10000;
    const gIso = G_E - (8 / 3) * (params.lambdaEff / Dc);
    return { gIso };
  }
  if (params.symmetry === 'Axial (D4h / C4v / D3h)') {
    const stato = params.stato ?? '';
    const Dpar = params.Dpar ?? 15000;
    const Dperp = params.Dperp ?? 8000;
    if (stato.startsWith('d_x2') || stato.startsWith('d_xy')) {
      return {
        gPar: G_E - 8 * (params.lambdaEff / Dpar),
        gPerp: G_E - 2 * (params.lambdaEff / Dperp),
      };
    }
    return {
      gPar: G_E - 2 * (params.lambdaEff / Dperp),
      gPerp: G_E - 8 * (params.lambdaEff / Dpar),
    };
  }
  return {
    gx: G_E - 2 * (params.lambdaEff / (params.Dx ?? 8000)),
    gy: G_E - 2 * (params.lambdaEff / (params.Dy ?? 10000)),
    gz: G_E - 8 * (params.lambdaEff / (params.Dz ?? 15000)),
  };
}

export function computeSpectrum(params: SpectrumParams): SpectrumResult {
  const metal = metalli[params.metalName];
  if (!metal) {
    throw new Error(`Unknown metal: ${params.metalName}`);
  }

  const S = metal.S;

  const resolvedLigands = params.ligands.map((lg) => {
    const lib = legantiLibreria[lg.isotope];
    if (!lib) {
      throw new Error(`Unknown ligand isotope: ${lg.isotope}`);
    }
    return { ...lg, I: lib[0] };
  });

  const gruppiLegPar: [number, number, number][] = resolvedLigands.map(
    (l) => [l.n, l.I, l.A_par] as [number, number, number]
  );
  const gruppiLegPerp: [number, number, number][] = resolvedLigands.map(
    (l) => [l.n, l.I, l.A_perp] as [number, number, number]
  );
  const gruppiLegIso: [number, number, number][] = resolvedLigands.map(
    (l) =>
      [l.n, l.I, A_iso_di(l.A_par, l.A_perp)] as [number, number, number]
  );

  let g_par: number | undefined;
  let g_perp: number | undefined;
  let g_iso: number | undefined;
  let gx: number | undefined;
  let gy: number | undefined;
  let gz: number | undefined;

  if (params.manualG) {
    g_par = params.gPar;
    g_perp = params.gPerp;
    g_iso = params.gIso;
    gx = params.gx;
    gy = params.gy;
    gz = params.gz;
  } else {
    const computed = computeGValues({
      symmetry: params.symmetry,
      stato: params.stato,
      lambdaEff: params.lambdaEff,
      Dc: params.Dc,
      Dpar: params.Dpar,
      Dperp: params.Dperp,
      Dx: params.Dx,
      Dy: params.Dy,
      Dz: params.Dz,
    });
    g_par = computed.gPar;
    g_perp = computed.gPerp;
    g_iso = computed.gIso;
    gx = computed.gx;
    gy = computed.gy;
    gz = computed.gz;
  }

  const risultati: IsotopeResult[] = [];
  for (const iso of metal.isotopes) {
    const Ap =
      params.A_par[iso.label] ??
      (typeof metal.A_par_default === 'number'
        ? metal.A_par_default
        : metal.A_par_default[iso.label] ?? 0);
    const Ae =
      params.A_perp[iso.label] ??
      (typeof metal.A_perp_default === 'number'
        ? metal.A_perp_default
        : metal.A_perp_default[iso.label] ?? 0);

    const patPar = calcolaPattern([[1, iso.I, Ap], ...gruppiLegPar]);
    const patPerp = calcolaPattern([[1, iso.I, Ae], ...gruppiLegPerp]);
    const patIso = calcolaPattern([
      [1, iso.I, A_iso_di(Ap, Ae)],
      ...gruppiLegIso,
    ]);

    const totPar = Object.values(patPar).reduce((a, b) => a + b, 0);
    const totPerp = Object.values(patPerp).reduce((a, b) => a + b, 0);
    const totIso = Object.values(patIso).reduce((a, b) => a + b, 0);

    const normPar: Record<number, number> = {};
    const normPerp: Record<number, number> = {};
    const normIso: Record<number, number> = {};

    for (const [k, v] of Object.entries(patPar)) {
      normPar[Number(k)] = (v / totPar) * iso.abundance;
    }
    for (const [k, v] of Object.entries(patPerp)) {
      normPerp[Number(k)] = (v / totPerp) * iso.abundance;
    }
    for (const [k, v] of Object.entries(patIso)) {
      normIso[Number(k)] = (v / totIso) * iso.abundance;
    }

    risultati.push({
      isotope: iso.label,
      abundance: iso.abundance,
      pattern_par: normPar,
      pattern_perp: normPerp,
      pattern_iso: normIso,
      n_lines: Object.values(patPar).filter((v) => v > 1e-6).length,
    });
  }

  const D_eff = S > 0.5 ? D_CM1_TO_GAUSS * params.D_zfs : 0;
  const transitions = buildTransizioniFineStructure(S, D_eff);

  const orientations: OrientationResult[] = [];
  if (params.symmetry === 'Cubic / isotropic') {
    orientations.push({
      label: 'Isotropic (g)',
      patternKey: 'pattern_iso',
      g: g_iso ?? G_E,
    });
  } else if (params.symmetry === 'Axial (D4h / C4v / D3h)') {
    orientations.push({
      label: '\u2016 (g\u2016)',
      patternKey: 'pattern_par',
      g: g_par ?? G_E,
    });
    orientations.push({
      label: '\u22A5 (g\u22A5)',
      patternKey: 'pattern_perp',
      g: g_perp ?? G_E,
    });
  } else {
    orientations.push({
      label: 'x (gx)',
      patternKey: 'pattern_perp',
      g: gx ?? G_E,
    });
    orientations.push({
      label: 'y (gy)',
      patternKey: 'pattern_perp',
      g: gy ?? G_E,
    });
    orientations.push({
      label: 'z (gz)',
      patternKey: 'pattern_par',
      g: gz ?? G_E,
    });
  }

  const fieldAxis = linspace(params.BMin, params.BMax, params.nPoints);
  const step = (params.BMax - params.BMin) / (params.nPoints - 1);

  const weights: Record<string, number> = {};
  if (params.symmetry === 'Axial (D4h / C4v / D3h)') {
    weights['\u2016 (g\u2016)'] = 1.0;
    weights['\u22A5 (g\u22A5)'] = 2.0;
  } else {
    for (const o of orientations) {
      weights[o.label] = 1.0;
    }
  }

  const absorption = new Array(params.nPoints).fill(0);
  for (const orient of orientations) {
    const base = (NU_B * params.frequency) / orient.g;
    const wOrient = weights[orient.label] ?? 1.0;
    for (const trans of transitions) {
      const shiftZfs = (trans.shift_factor * D_eff) / orient.g;
      const wTrans = trans.intensity;
      const baseTrans = base + shiftZfs;
      for (const r of risultati) {
        const pattern = r[orient.patternKey];
        for (const [spostStr, inten] of Object.entries(pattern)) {
          const spost = Number(spostStr);
          const Bc = baseTrans - spost / orient.g;
          const contrib = inten * wOrient * wTrans;
          for (let i = 0; i < fieldAxis.length; i++) {
            absorption[i] += contrib * lorentziana(fieldAxis[i], Bc, params.gamma);
          }
        }
      }
    }
  }

  const maxAbs = Math.max(...absorption);
  if (maxAbs > 0) {
    for (let i = 0; i < absorption.length; i++) {
      absorption[i] /= maxAbs;
    }
  }

  let gIsoSpectrum: number;
  if (params.symmetry === 'Cubic / isotropic') {
    gIsoSpectrum = g_iso ?? G_E;
  } else if (params.symmetry === 'Axial (D4h / C4v / D3h)') {
    gIsoSpectrum = ((g_par ?? G_E) + 2 * (g_perp ?? G_E)) / 3;
  } else {
    gIsoSpectrum = ((gx ?? G_E) + (gy ?? G_E) + (gz ?? G_E)) / 3;
  }

  const absorptionIso = new Array(params.nPoints).fill(0);
  const baseIso = (NU_B * params.frequency) / gIsoSpectrum;
  for (const r of risultati) {
    for (const [spostStr, inten] of Object.entries(r.pattern_iso)) {
      const spost = Number(spostStr);
      const Bc = baseIso - spost / gIsoSpectrum;
      for (let i = 0; i < fieldAxis.length; i++) {
        absorptionIso[i] += inten * lorentziana(fieldAxis[i], Bc, params.gamma);
      }
    }
  }

  const maxIso = Math.max(...absorptionIso);
  if (maxIso > 0) {
    for (let i = 0; i < absorptionIso.length; i++) {
      absorptionIso[i] /= maxIso;
    }
  }

  const mixed = new Array(params.nPoints);
  for (let i = 0; i < params.nPoints; i++) {
    mixed[i] =
      (1 - params.tumbling) * absorption[i] +
      params.tumbling * absorptionIso[i];
  }

  const deriv = gradient(mixed, step);
  const maxDeriv = Math.max(...deriv);
  if (maxDeriv > 0) {
    for (let i = 0; i < deriv.length; i++) {
      deriv[i] /= maxDeriv;
    }
  }

  return {
    stickData: risultati,
    orientations,
    transitions,
    absorption: mixed,
    derivative: deriv,
    fieldAxis,
  };
}
