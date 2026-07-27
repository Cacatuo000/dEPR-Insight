import { CommonLigand } from './types';

export const legantiLibreria: Record<string, [number, number, string]> = {
  "H-1 (Protium)": [0.5, 0.999885, "Hydrogen"],
  "D-2 (Deuterium)": [1.0, 0.000115, "Hydrogen"],
  "Li-6": [1.0, 0.0759, "Lithium"],
  "Li-7": [1.5, 0.9241, "Lithium"],
  "B-10": [3.0, 0.199, "Boron"],
  "B-11": [1.5, 0.801, "Boron"],
  "C-13": [0.5, 0.0107, "Carbon"],
  "N-14": [1.0, 0.996, "Nitrogen"],
  "N-15": [0.5, 0.00364, "Nitrogen"],
  "O-17": [2.5, 0.00038, "Oxygen"],
  "F-19": [0.5, 1.0, "Fluorine"],
  "Na-23": [1.5, 1.0, "Sodium"],
  "Mg-25": [2.5, 0.100, "Magnesium"],
  "Al-27": [2.5, 1.0, "Aluminium"],
  "Si-29": [0.5, 0.0467, "Silicon"],
  "P-31": [0.5, 1.0, "Phosphorus"],
  "S-33": [1.5, 0.0076, "Sulfur"],
  "Cl-35": [1.5, 0.7576, "Chlorine"],
  "Cl-37": [1.5, 0.2424, "Chlorine"],
  "K-39": [1.5, 0.9326, "Potassium"],
  "K-41": [1.5, 0.0673, "Potassium"],
  "Ca-43": [3.5, 0.00135, "Calcium"],
  "Se-77": [0.5, 0.0763, "Selenium"],
  "Br-79": [1.5, 0.5069, "Bromine"],
  "Br-81": [1.5, 0.4931, "Bromine"],
  "I-127": [2.5, 1.0, "Iodine"],
};

export const legantiOrdine: string[] = [
  "H-1 (Protium)", "D-2 (Deuterium)",
  "Li-6", "Li-7",
  "B-10", "B-11",
  "C-13",
  "N-14", "N-15",
  "O-17",
  "F-19",
  "Na-23",
  "Mg-25",
  "Al-27",
  "Si-29",
  "P-31",
  "S-33",
  "Cl-35", "Cl-37",
  "K-39", "K-41",
  "Ca-43",
  "Se-77",
  "Br-79", "Br-81",
  "I-127",
];

export const legantiComuni: Record<string, CommonLigand> = {
  "H₂O (water)": {
    description: "Oxygen donor, no magnetic nucleus",
    nuclei: [],
    distant_nuclei: [["H-1 (Protium)", 2, 8.0, 5.0]],
  },
  "NH₃ (ammonia)": {
    description: "Nitrogen donor, 1 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 30.0, A_perp: 25.0 }],
    distant_nuclei: [["H-1 (Protium)", 3, 8.0, 5.0]],
  },
  "Pyridine (py)": {
    description: "Nitrogen donor, 1 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 20.0, A_perp: 15.0 }],
    distant_nuclei: [["H-1 (Protium)", 5, 8.0, 5.0]],
  },
  "Cl⁻ (chloride)": {
    description: "Chlorine donor, Cl-35/37 (I=3/2)",
    nuclei: [{ isotope: "Cl-35", n: 1, A_par: 10.0, A_perp: 8.0 }],
  },
  "CN⁻ (cyanide)": {
    description: "Carbon donor, C-13 (I=1/2, 1%) — rare",
    nuclei: [],
  },
  "SCN⁻ (thiocyanate)": {
    description: "Nitrogen donor (N-bonding), 1 N-14",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 18.0, A_perp: 12.0 }],
  },
  "PH₃ (phosphine)": {
    description: "Phosphorus donor, P-31 (I=1/2, 100%)",
    nuclei: [{ isotope: "P-31", n: 1, A_par: 250.0, A_perp: 180.0 }],
  },
  "PPh₃ (triphenylphosphine)": {
    description: "Phosphorus donor, P-31 coordinated",
    nuclei: [{ isotope: "P-31", n: 1, A_par: 300.0, A_perp: 200.0 }],
    distant_nuclei: [["H-1 (Protium)", 15, 5.0, 3.0]],
  },
  "CO (carbonyl)": {
    description: "Carbon donor, no magnetic nucleus",
    nuclei: [],
  },
  "F⁻ (fluoride)": {
    description: "Fluorine donor, F-19 (I=1/2, 100%) — strong σ-donor",
    nuclei: [{ isotope: "F-19", n: 1, A_par: 100.0, A_perp: 60.0 }],
  },
  "Br⁻ (bromide)": {
    description: "Bromine donor, Br-79/81 (I=3/2) — heavy halogen",
    nuclei: [{ isotope: "Br-79", n: 1, A_par: 60.0, A_perp: 40.0 }],
  },
  "I⁻ (iodide)": {
    description: "Iodine donor, I-127 (I=5/2, 100%) — very heavy halogen",
    nuclei: [{ isotope: "I-127", n: 1, A_par: 80.0, A_perp: 50.0 }],
  },
  "OH⁻ (hydroxide)": {
    description: "Oxygen donor, no magnetic nucleus",
    nuclei: [],
    distant_nuclei: [["H-1 (Protium)", 1, 8.0, 5.0]],
  },
  "CH₃CN (acetonitrile)": {
    description: "Nitrile N-donor, 1 N-14 (I=1) — common solvent",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 18.0, A_perp: 13.0 }],
    distant_nuclei: [["H-1 (Protium)", 3, 5.0, 3.5]],
  },
  "Imidazole (imH)": {
    description: "N-heterocyclic donor, 2 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 2, A_par: 20.0, A_perp: 15.0 }],
    distant_nuclei: [["H-1 (Protium)", 3, 7.0, 4.0]],
  },
  "N₃⁻ (azide)": {
    description: "N-donor (terminal), 1 N-14 (I=1)",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 18.0, A_perp: 13.0 }],
  },
  "NO₂⁻ (nitrite)": {
    description: "N-donor (nitro), 1 N-14 (I=1)",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 16.0, A_perp: 11.0 }],
  },
  "DMSO (dimethyl sulfoxide)": {
    description: "O/S donor, no magnetic nucleus — common solvent",
    nuclei: [],
    distant_nuclei: [["H-1 (Protium)", 6, 5.0, 3.5]],
  },
  "acac (acetylacetonate)": {
    description: "O,O-donor bidentate, O has no magnetic isotope",
    nuclei: [],
    distant_nuclei: [["H-1 (Protium)", 3, 8.0, 5.0]],
  },
  "en (ethylenediamine)": {
    description: "N,N-donor bidentate, 2 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 2, A_par: 25.0, A_perp: 20.0 }],
    distant_nuclei: [["H-1 (Protium)", 4, 10.0, 7.0]],
  },
  "ox (oxalate)": {
    description: "O,O-donor bidentate, no magnetic nucleus",
    nuclei: [],
  },
  "gly (glycinate)": {
    description: "N,O-donor bidentate, 1 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 22.0, A_perp: 18.0 }],
    distant_nuclei: [["H-1 (Protium)", 2, 10.0, 7.0]],
  },
  "bipy (bipyridine)": {
    description: "N,N-donor bidentate, 2 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 2, A_par: 18.0, A_perp: 13.0 }],
    distant_nuclei: [["H-1 (Protium)", 8, 6.0, 4.0]],
  },
  "phen (phenanthroline)": {
    description: "N,N-donor bidentate, 2 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 2, A_par: 20.0, A_perp: 15.0 }],
    distant_nuclei: [["H-1 (Protium)", 10, 7.0, 4.5]],
  },
  "8-OH-qin (oxinate)": {
    description: "N,O-donor bidentate, 1 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 1, A_par: 15.0, A_perp: 12.0 }],
    distant_nuclei: [["H-1 (Protium)", 6, 8.0, 5.0]],
  },
  "tren (tris(2-aminoethyl)amine)": {
    description: "N₄ tetradentate, 4 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 4, A_par: 25.0, A_perp: 20.0 }],
    distant_nuclei: [["H-1 (Protium)", 8, 8.0, 5.0]],
  },
  "EDTA": {
    description: "N₂O₄ hexadentate, 2 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 2, A_par: 20.0, A_perp: 15.0 }],
    distant_nuclei: [["H-1 (Protium)", 4, 6.0, 4.0]],
  },
  "porphyrin (TPP)": {
    description: "N₄ macrocyclic, 4 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 4, A_par: 15.0, A_perp: 12.0 }],
    distant_nuclei: [["H-1 (Protium)", 8, 5.0, 3.5]],
  },
  "cyclam ([14]aneN₄)": {
    description: "N₄ macrocyclic, 4 N-14 coordinated",
    nuclei: [{ isotope: "N-14", n: 4, A_par: 22.0, A_perp: 17.0 }],
    distant_nuclei: [["H-1 (Protium)", 4, 8.0, 5.0]],
  },
};

export const legantiComuniOrdine: string[] = Object.keys(legantiComuni);
