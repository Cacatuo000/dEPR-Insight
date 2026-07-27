import streamlit as st
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.lines import Line2D
import pandas as pd
import io

st.set_page_config(page_title="dEPR Insight", page_icon="⚛️", layout="wide")

# =====================================================================
# CUSTOM CSS — dark by default, switches to light when Streamlit
# sets data-theme="light" on the app container
# =====================================================================
COMBINED_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ── Dark theme (default) ── */
    :root {
        --card-bg: linear-gradient(135deg, rgba(26, 26, 46, 0.85) 0%, rgba(22, 33, 62, 0.85) 100%);
        --card-border: 1px solid rgba(79, 195, 247, 0.15);
        --card-shadow: 0 8px 32px rgba(0,0,0,0.25);
        --hero-bg: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #16213e 60%, #0f3460 100%);
        --hero-border: 1px solid rgba(79, 195, 247, 0.2);
        --hero-shadow: 0 4px 40px rgba(79, 195, 247, 0.08), inset 0 1px 0 rgba(255,255,255,0.05);
        --hero-title-grad: linear-gradient(135deg, #4fc3f7 0%, #81d4fa 50%, #b3e5fc 100%);
        --hero-sub-color: #9aa0b0;
        --badge-bg: rgba(79, 195, 247, 0.12);
        --badge-border: 1px solid rgba(79, 195, 247, 0.25);
        --badge-color: #81d4fa;
        --hero-desc-color: #c8ccd6;
        --expander-hover-bg: rgba(79, 195, 247, 0.06);
        --section-title-color: #4fc3f7;
        --section-title-border: rgba(79, 195, 247, 0.15);
        --section-title-orange: #ff8a65;
        --section-title-orange-border: rgba(255,138,101,0.15);
        --section-title-green: #81c784;
        --section-title-green-border: rgba(129,199,132,0.15);
        --section-title-purple: #ba68c8;
        --section-title-purple-border: rgba(186,104,200,0.15);
        --tab-list-bg: rgba(255,255,255,0.03);
        --tab-hover-bg: rgba(79, 195, 247, 0.08);
        --tab-active-bg: rgba(79, 195, 247, 0.15);
        --tab-active-shadow: 0 2px 12px rgba(79, 195, 247, 0.15);
        --btn-border: 1px solid rgba(79, 195, 247, 0.2);
        --btn-hover-shadow: 0 6px 20px rgba(79, 195, 247, 0.2);
        --btn-hover-border: rgba(79, 195, 247, 0.5);
        --btn-dl-hover-shadow: 0 6px 20px rgba(79, 195, 247, 0.2);
        --dataframe-border: 1px solid rgba(255,255,255,0.06);
        --hr-color: rgba(79, 195, 247, 0.1);
        --caption-color: #7a8294;
        --scrollbar-thumb: rgba(79, 195, 247, 0.3);
        --scrollbar-thumb-hover: rgba(79, 195, 247, 0.5);
        --input-border: 1px solid rgba(79, 195, 247, 0.15);
        --input-focus-border: #4fc3f7;
        --input-focus-shadow: 0 0 0 2px rgba(79, 195, 247, 0.15);
        --select-border: 1px solid rgba(79, 195, 247, 0.15);
        --metric-bg: rgba(79, 195, 247, 0.04);
        --metric-border: 1px solid rgba(79, 195, 247, 0.08);
        --footer-color: #5a6276;
        --footer-border: rgba(79, 195, 247, 0.08);
        --footer-accent: #4fc3f7;
        --h3-border: #4fc3f7;
        --img-bg: transparent;
        --img-shadow: none;
        --glossary-bg: rgba(79, 195, 247, 0.04);
        --glossary-border: #4fc3f7;
        --glossary-term-color: #4fc3f7;
        --glossary-def-color: #c8ccd6;
        --glossary-code-bg: rgba(79, 195, 247, 0.1);
        --glossary-code-color: #81d4fa;
        --qs-border: rgba(79,195,247,0.08);
        --qs-num-bg: rgba(79,195,247,0.12);
        --qs-num-color: #81d4fa;
        --qs-text-color: #c8ccd6;
        --qs-strong-color: #e0e0e0;
    }

    /* ── Light theme ── triggered by Streamlit's data-theme attribute ── */
    :root[data-theme="light"],
    :root:has([data-theme="light"]) {
        --card-bg: linear-gradient(135deg, rgba(247,250,252,0.85) 0%, rgba(255,255,255,0.85) 100%);
        --card-border: 1px solid rgba(79, 195, 247, 0.2);
        --card-shadow: 0 8px 32px rgba(0,0,0,0.06);
        --hero-bg: linear-gradient(135deg, #f0f4f8 0%, #e3edf5 30%, #e8f0f8 60%, #dce8f2 100%);
        --hero-border: 1px solid rgba(79, 195, 247, 0.25);
        --hero-shadow: 0 4px 40px rgba(79, 195, 247, 0.06), inset 0 1px 0 rgba(255,255,255,0.8);
        --hero-title-grad: linear-gradient(135deg, #0288d1 0%, #0277bd 50%, #01579b 100%);
        --hero-sub-color: #4a5568;
        --badge-bg: rgba(2, 136, 209, 0.1);
        --badge-border: 1px solid rgba(2, 136, 209, 0.25);
        --badge-color: #0277bd;
        --hero-desc-color: #2d3748;
        --expander-hover-bg: rgba(79, 195, 247, 0.08);
        --section-title-color: #0288d1;
        --section-title-border: rgba(2,136,209,0.15);
        --section-title-orange: #d84315;
        --section-title-orange-border: rgba(216,67,21,0.15);
        --section-title-green: #2e7d32;
        --section-title-green-border: rgba(46,125,50,0.15);
        --section-title-purple: #6a1b9a;
        --section-title-purple-border: rgba(106,27,154,0.15);
        --tab-list-bg: rgba(0,0,0,0.03);
        --tab-hover-bg: rgba(79, 195, 247, 0.1);
        --tab-active-bg: rgba(79, 195, 247, 0.2);
        --tab-active-shadow: 0 2px 12px rgba(79, 195, 247, 0.2);
        --btn-border: 1px solid rgba(79, 195, 247, 0.3);
        --btn-hover-shadow: 0 6px 20px rgba(79, 195, 247, 0.25);
        --btn-hover-border: rgba(79, 195, 247, 0.6);
        --btn-dl-hover-shadow: 0 6px 20px rgba(79, 195, 247, 0.25);
        --dataframe-border: 1px solid rgba(0,0,0,0.08);
        --hr-color: rgba(0,0,0,0.08);
        --caption-color: #718096;
        --scrollbar-thumb: rgba(79, 195, 247, 0.4);
        --scrollbar-thumb-hover: rgba(79, 195, 247, 0.6);
        --input-border: 1px solid rgba(0,0,0,0.15);
        --input-focus-border: #0288d1;
        --input-focus-shadow: 0 0 0 2px rgba(2,136,209,0.15);
        --select-border: 1px solid rgba(0,0,0,0.15);
        --metric-bg: rgba(79, 195, 247, 0.05);
        --metric-border: 1px solid rgba(79, 195, 247, 0.12);
        --footer-color: #718096;
        --footer-border: rgba(0,0,0,0.06);
        --footer-accent: #0288d1;
        --h3-border: #0288d1;
        --img-bg: #ffffff;
        --img-shadow: 0 1px 8px rgba(0,0,0,0.06);
        --glossary-bg: rgba(2, 136, 209, 0.04);
        --glossary-border: #0288d1;
        --glossary-term-color: #0288d1;
        --glossary-def-color: #2d3748;
        --glossary-code-bg: rgba(2, 136, 209, 0.1);
        --glossary-code-color: #0277bd;
        --qs-border: rgba(0,0,0,0.06);
        --qs-num-bg: rgba(2, 136, 209, 0.12);
        --qs-num-color: #0277bd;
        --qs-text-color: #2d3748;
        --qs-strong-color: #1a202c;
    }

    /* Invert matplotlib plots in light mode */
    :root[data-theme="light"] [data-testid="stImage"] img,
    :root[data-theme="light"] .stImage img,
    :root:has([data-theme="light"]) [data-testid="stImage"] img,
    :root:has([data-theme="light"]) .stImage img {
        filter: invert(1) hue-rotate(180deg);
    }

    /* --- Glassmorphic card --- */
    .glass-card {
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: var(--card-border);
        border-radius: 14px;
        padding: 20px 24px;
        margin-bottom: 16px;
        box-shadow: var(--card-shadow);
    }

    /* --- Hero banner --- */
    .hero-banner {
        background: var(--hero-bg);
        border: var(--hero-border);
        border-radius: 18px;
        padding: 28px 36px;
        margin-bottom: 24px;
        box-shadow: var(--hero-shadow);
    }
    .hero-banner h1 {
        font-size: 2.6rem;
        font-weight: 800;
        margin: 0 0 4px 0;
        background: var(--hero-title-grad);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.5px;
    }
    .hero-banner .hero-sub {
        color: var(--hero-sub-color);
        font-size: 1rem;
        font-weight: 400;
        margin: 0 0 8px 0;
    }
    .hero-banner .hero-badge {
        display: inline-block;
        background: var(--badge-bg);
        border: var(--badge-border);
        color: var(--badge-color);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 20px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .hero-desc {
        color: var(--hero-desc-color);
        font-size: 0.95rem;
        line-height: 1.6;
        margin-top: 12px;
    }

    /* --- Sidebar expanders --- */
    .streamlit-expanderHeader {
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        border-radius: 8px !important;
        transition: background 0.2s ease !important;
        border-left: 3px solid transparent !important;
    }
    .streamlit-expanderHeader[aria-expanded="false"]:nth-of-type(1) { border-left-color: #4fc3f7 !important; }
    .streamlit-expanderHeader[aria-expanded="false"]:nth-of-type(2) { border-left-color: #81c784 !important; }
    .streamlit-expanderHeader[aria-expanded="false"]:nth-of-type(3) { border-left-color: #ff8a65 !important; }
    .streamlit-expanderHeader[aria-expanded="false"]:nth-of-type(4) { border-left-color: #ba68c8 !important; }
    .streamlit-expanderHeader[aria-expanded="false"]:nth-of-type(5) { border-left-color: #f06292 !important; }
    .streamlit-expanderHeader:hover {
        background: var(--expander-hover-bg) !important;
    }
    .section-title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--section-title-color);
        margin: 12px 0 6px 0;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--section-title-border);
    }
    .section-title.orange { color: var(--section-title-orange); border-bottom-color: var(--section-title-orange-border); }
    .section-title.green  { color: var(--section-title-green); border-bottom-color: var(--section-title-green-border); }
    .section-title.purple { color: var(--section-title-purple); border-bottom-color: var(--section-title-purple-border); }

    /* --- Tabs --- */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background: var(--tab-list-bg);
        border-radius: 12px;
        padding: 4px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        border: none;
    }
    .stTabs [data-baseweb="tab"]:hover { background: var(--tab-hover-bg); }
    .stTabs [aria-selected="true"] {
        background: var(--tab-active-bg) !important;
        box-shadow: var(--tab-active-shadow);
    }

    /* --- Buttons --- */
    .stButton>button {
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: var(--btn-border);
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: var(--btn-hover-shadow);
        border-color: var(--btn-hover-border);
    }
    .stDownloadButton>button {
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stDownloadButton>button:hover {
        transform: translateY(-2px);
        box-shadow: var(--btn-dl-hover-shadow);
    }

    /* --- DataFrames --- */
    .stDataFrame { border-radius: 12px; overflow: hidden; border: var(--dataframe-border); }
    .stDataFrame [data-testid="StyledDataFrameDataCell"] { font-size: 0.8rem; }

    /* --- Dividers --- */
    hr { border-color: var(--hr-color) !important; margin: 24px 0 !important; }

    /* --- Captions --- */
    .stCaption { color: var(--caption-color) !important; font-size: 0.8rem !important; }

    /* --- Alerts --- */
    .stAlert { border-radius: 10px !important; border-left-width: 4px !important; }

    /* --- Scrollbar --- */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

    /* --- Number inputs --- */
    .stNumberInput input {
        border-radius: 8px !important;
        border: var(--input-border) !important;
        transition: border-color 0.2s ease !important;
    }
    .stNumberInput input:focus {
        border-color: var(--input-focus-border) !important;
        box-shadow: var(--input-focus-shadow) !important;
    }

    /* --- Select boxes --- */
    .stSelectbox [data-baseweb="select"]>div {
        border-radius: 8px !important;
        border: var(--select-border) !important;
    }

    /* --- Radio --- */
    .stRadio label { font-size: 0.85rem !important; }

    /* --- Metrics --- */
    .stMetric {
        background: var(--metric-bg);
        border-radius: 10px;
        padding: 8px 12px;
        border: var(--metric-border);
    }

    /* --- Footer --- */
    .footer-text {
        text-align: center;
        color: var(--footer-color);
        font-size: 0.8rem;
        padding: 16px 0 8px 0;
        border-top: 1px solid var(--footer-border);
    }
    .footer-text .foot-accent { color: var(--footer-accent); font-weight: 600; }

    h3 { border-left: 4px solid var(--h3-border); padding-left: 10px; }

    /* --- Plot image frames --- */
    [data-testid="stImage"] img, .stImage img {
        background: var(--img-bg);
        border-radius: 10px;
        box-shadow: var(--img-shadow);
    }
</style>
"""

st.markdown(COMBINED_CSS, unsafe_allow_html=True)

# =====================================================================
# MATPLOTLIB THEME — always dark; CSS inverts in light mode
# =====================================================================
plt.style.use({
    "axes.facecolor": "#0e1117",
    "figure.facecolor": "#0e1117",
    "axes.edgecolor": "#333",
    "axes.labelcolor": "#c8ccd6",
    "text.color": "#c8ccd6",
    "xtick.color": "#6b7280",
    "ytick.color": "#6b7280",
    "grid.color": "#1f2937",
    "grid.alpha": 0.6,
    "axes.grid": True,
    "grid.linestyle": "--",
    "grid.linewidth": 0.5,
    "font.size": 12,
    "axes.titlesize": 14,
    "axes.labelsize": 12,
    "axes.titleweight": "bold",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.spines.left": False,
    "axes.spines.bottom": False,
    "xtick.major.size": 0,
    "ytick.major.size": 0,
    "lines.linewidth": 1.8,
})

# Palette colori per isotope (ad alta visibilità su sfondo scuro)
COLORI_ISOTOPI = ["#4fc3f7", "#ff8a65", "#81c784", "#e57373", "#ba68c8", "#f06292", "#4dd0e1"]

# Inizializza session_state per i preset
if 'preset_attivo' not in st.session_state:
    st.session_state.preset_attivo = None
if 'preset_valori' not in st.session_state:
    st.session_state.preset_valori = {}
if 'S_attuale' not in st.session_state:
    st.session_state.S_attuale = 0.5
if 'D_zfs' not in st.session_state:
    st.session_state.D_zfs = 0.0

# =====================================================================
# DATABASE: METALS
# =====================================================================
metalli = {
    "Copper (Cu2+)": {
        "nome_completo": "Copper (Cu-II, 3d9, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Cu-63", 1.5, 0.6915), ("Cu-65", 1.5, 0.3085)],
        "A_par_default": {"Cu-63": 200.0, "Cu-65": 214.2},
        "A_perp_default": {"Cu-63": 25.0, "Cu-65": 26.8},
    },
    "Manganese (Mn2+)": {
        "nome_completo": "Manganese (Mn-II, 3d5, S = 5/2)",
        "S": 2.5,
        "isotopi": [("Mn-55", 2.5, 1.0)],
        "A_par_default": 90.0, "A_perp_default": 90.0,
    },
    "Cobalt (Co2+)": {
        "nome_completo": "Cobalt (Co-II, 3d7, S = 3/2)",
        "S": 1.5,
        "isotopi": [("Co-59", 3.5, 1.0)],
        "A_par_default": 100.0, "A_perp_default": 100.0,
    },
    "Vanadium (V4+)": {
        "nome_completo": "Vanadium (V-IV, 3d1, S = 1/2)",
        "S": 0.5,
        "isotopi": [("V-51", 3.5, 0.9975)],
        "A_par_default": 180.0, "A_perp_default": 60.0,
    },
    "Titanium (Ti3+)": {
        "nome_completo": "Titanium (Ti-III, 3d1, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Ti-47", 2.5, 0.073), ("Ti-49", 3.5, 0.051)],
        "A_par_default": 30.0, "A_perp_default": 18.0,
    },
    "Chromium (Cr3+/Cr5+)": {
        "nome_completo": "Chromium (Cr-III/Cr-V, S = 3/2 or 1/2)",
        "S": 1.5,
        "isotopi": [("Cr-53", 1.5, 0.0954)],
        "A_par_default": 20.0, "A_perp_default": 20.0,
    },
    "Iron (Fe3+)": {
        "nome_completo": "Iron (Fe-III, 3d5, S = 5/2)",
        "S": 2.5,
        "isotopi": [("Fe-57", 0.5, 0.0211)],
        "A_par_default": 10.0, "A_perp_default": 10.0,
    },
    "Nickel (Ni3+)": {
        "nome_completo": "Nickel (Ni-III, 3d7, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Ni-61", 1.5, 0.0114)],
        "A_par_default": 30.0, "A_perp_default": 15.0,
    },
    "Molybdenum (Mo5+)": {
        "nome_completo": "Molybdenum (Mo-V, 4d1, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Mo-95", 2.5, 0.157), ("Mo-97", 2.5, 0.0958)],
        "A_par_default": 50.0, "A_perp_default": 30.0,
    },
    "Tungsten (W5+)": {
        "nome_completo": "Tungsten (W-V, 5d1, S = 1/2)",
        "S": 0.5,
        "isotopi": [("W-183", 0.5, 0.143)],
        "A_par_default": 50.0, "A_perp_default": 30.0,
    },
    "Niobium (Nb4+)": {
        "nome_completo": "Niobium (Nb-IV, 4d1, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Nb-93", 4.5, 1.0)],
        "A_par_default": 150.0, "A_perp_default": 90.0,
    },
    "Ruthenium (Ru3+)": {
        "nome_completo": "Ruthenium (Ru-III, 4d5, S = 5/2)",
        "S": 2.5,
        "isotopi": [("Ru-99", 2.5, 0.1276), ("Ru-101", 2.5, 0.1706)],
        "A_par_default": 30.0, "A_perp_default": 30.0,
    },
    "Rhenium (Re)": {
        "nome_completo": "Rhenium (Re, 5d, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Re-185", 2.5, 0.374), ("Re-187", 2.5, 0.626)],
        "A_par_default": 100.0, "A_perp_default": 60.0,
    },
    "Iridium (Ir)": {
        "nome_completo": "Iridium (Ir, 5d, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Ir-191", 1.5, 0.373), ("Ir-193", 1.5, 0.627)],
        "A_par_default": 40.0, "A_perp_default": 25.0,
    },
    "Gold (Au2+)": {
        "nome_completo": "Gold (Au-II, 5d9, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Au-197", 1.5, 1.0)],
        "A_par_default": 60.0, "A_perp_default": 25.0,
    },
    "Silver (Ag2+)": {
        "nome_completo": "Silver (Ag-II, 4d9, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Ag-107", 0.5, 0.5182), ("Ag-109", 0.5, 0.4818)],
        "A_par_default": {"Ag-107": 45.0, "Ag-109": 52.0},
        "A_perp_default": {"Ag-107": 12.0, "Ag-109": 14.0},
    },
    "Platinum (Pt3+)": {
        "nome_completo": "Platinum (Pt-III, 5d7, S = 1/2, low-spin)",
        "S": 0.5,
        "isotopi": [("Pt-195", 0.5, 0.338)],
        "A_par_default": 80.0, "A_perp_default": 30.0,
    },
    "Nickel (Ni+)": {
        "nome_completo": "Nickel (Ni-I, 3d9, S = 1/2)",
        "S": 0.5,
        "isotopi": [("Ni-61", 1.5, 0.0114)],
        "A_par_default": 20.0, "A_perp_default": 10.0,
    },
}

# =====================================================================
# DATABASE: LIGAND ISOTOPES
# =====================================================================
leganti_libreria = {
    "H-1 (Protium)": (0.5, 0.999885, "Hydrogen"),
    "D-2 (Deuterium)": (1.0, 0.000115, "Hydrogen"),
    "Li-6": (1.0, 0.0759, "Lithium"),
    "Li-7": (1.5, 0.9241, "Lithium"),
    "B-10": (3.0, 0.199, "Boron"),
    "B-11": (1.5, 0.801, "Boron"),
    "C-13": (0.5, 0.0107, "Carbon"),
    "N-14": (1.0, 0.996, "Nitrogen"),
    "N-15": (0.5, 0.00364, "Nitrogen"),
    "O-17": (2.5, 0.00038, "Oxygen"),
    "F-19": (0.5, 1.0, "Fluorine"),
    "Na-23": (1.5, 1.0, "Sodium"),
    "Mg-25": (2.5, 0.100, "Magnesium"),
    "Al-27": (2.5, 1.0, "Aluminium"),
    "Si-29": (0.5, 0.0467, "Silicon"),
    "P-31": (0.5, 1.0, "Phosphorus"),
    "S-33": (1.5, 0.0076, "Sulfur"),
    "Cl-35": (1.5, 0.7576, "Chlorine"),
    "Cl-37": (1.5, 0.2424, "Chlorine"),
    "K-39": (1.5, 0.9326, "Potassium"),
    "K-41": (1.5, 0.0673, "Potassium"),
    "Ca-43": (3.5, 0.00135, "Calcium"),
    "Se-77": (0.5, 0.0763, "Selenium"),
    "Br-79": (1.5, 0.5069, "Bromine"),
    "Br-81": (1.5, 0.4931, "Bromine"),
    "I-127": (2.5, 1.0, "Iodine"),
}

# Ligand display order: grouped by element
leganti_ordine = [
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
]

# =====================================================================
# DATABASE: COMMON LIGANDS (for quick add)
# =====================================================================
# Ogni legante: (nome_breve, tipo_dentata, lista_nuclei_magnetici)
# Ogni nucleo: (isotopo, numero_per_legante, A_par_tipico_G, A_perp_tipico_G)
leganti_comuni = {
    # --- MONODENTATI ---
    "H₂O (water)": {
        "descrizione": "Oxygen donor, no magnetic nucleus",
        "nuclei": [],
        "distant_nuclei": [("H-1 (Protium)", 2, 8.0, 5.0)],
    },
    "NH₃ (ammonia)": {
        "descrizione": "Nitrogen donor, 1 N-14 coordinated",
        "nuclei": [("N-14", 1, 30.0, 25.0)],
        "distant_nuclei": [("H-1 (Protium)", 3, 8.0, 5.0)],
    },
    "Pyridine (py)": {
        "descrizione": "Nitrogen donor, 1 N-14 coordinated",
        "nuclei": [("N-14", 1, 20.0, 15.0)],
        "distant_nuclei": [("H-1 (Protium)", 5, 8.0, 5.0)],
    },
    "Cl⁻ (chloride)": {
        "descrizione": "Chlorine donor, Cl-35/37 (I=3/2)",
        "nuclei": [("Cl-35", 1, 10.0, 8.0)],
    },
    "CN⁻ (cyanide)": {
        "descrizione": "Carbon donor, C-13 (I=1/2, 1%) — rare",
        "nuclei": [],
    },
    "SCN⁻ (thiocyanate)": {
        "descrizione": "Nitrogen donor (N-bonding), 1 N-14",
        "nuclei": [("N-14", 1, 18.0, 12.0)],
    },
    "PH₃ (phosphine)": {
        "descrizione": "Phosphorus donor, P-31 (I=1/2, 100%)",
        "nuclei": [("P-31", 1, 250.0, 180.0)],
    },
    "PPh₃ (triphenylphosphine)": {
        "descrizione": "Phosphorus donor, P-31 coordinated",
        "nuclei": [("P-31", 1, 300.0, 200.0)],
        "distant_nuclei": [("H-1 (Protium)", 15, 5.0, 3.0)],
    },
    "CO (carbonyl)": {
        "descrizione": "Carbon donor, no magnetic nucleus",
        "nuclei": [],
    },
    "F⁻ (fluoride)": {
        "descrizione": "Fluorine donor, F-19 (I=1/2, 100%) — strong σ-donor",
        "nuclei": [("F-19", 1, 100.0, 60.0)],
    },
    "Br⁻ (bromide)": {
        "descrizione": "Bromine donor, Br-79/81 (I=3/2) — heavy halogen",
        "nuclei": [("Br-79", 1, 60.0, 40.0)],
    },
    "I⁻ (iodide)": {
        "descrizione": "Iodine donor, I-127 (I=5/2, 100%) — very heavy halogen",
        "nuclei": [("I-127", 1, 80.0, 50.0)],
    },
    "OH⁻ (hydroxide)": {
        "descrizione": "Oxygen donor, no magnetic nucleus",
        "nuclei": [],
        "distant_nuclei": [("H-1 (Protium)", 1, 8.0, 5.0)],
    },
    "CH₃CN (acetonitrile)": {
        "descrizione": "Nitrile N-donor, 1 N-14 (I=1) — common solvent",
        "nuclei": [("N-14", 1, 18.0, 13.0)],
        "distant_nuclei": [("H-1 (Protium)", 3, 5.0, 3.5)],
    },
    "Imidazole (imH)": {
        "descrizione": "N-heterocyclic donor, 2 N-14 coordinated",
        "nuclei": [("N-14", 2, 20.0, 15.0)],
        "distant_nuclei": [("H-1 (Protium)", 3, 7.0, 4.0)],
    },
    "N₃⁻ (azide)": {
        "descrizione": "N-donor (terminal), 1 N-14 (I=1)",
        "nuclei": [("N-14", 1, 18.0, 13.0)],
    },
    "NO₂⁻ (nitrite)": {
        "descrizione": "N-donor (nitro), 1 N-14 (I=1)",
        "nuclei": [("N-14", 1, 16.0, 11.0)],
    },
    "DMSO (dimethyl sulfoxide)": {
        "descrizione": "O/S donor, no magnetic nucleus — common solvent",
        "nuclei": [],
        "distant_nuclei": [("H-1 (Protium)", 6, 5.0, 3.5)],
    },
    # --- BIDENTATI ---
    "acac (acetylacetonate)": {
        "descrizione": "O,O-donor bidentate, O has no magnetic isotope",
        "nuclei": [],
        "distant_nuclei": [("H-1 (Protium)", 3, 8.0, 5.0)],
    },
    "en (ethylenediamine)": {
        "descrizione": "N,N-donor bidentate, 2 N-14 coordinated",
        "nuclei": [("N-14", 2, 25.0, 20.0)],
        "distant_nuclei": [("H-1 (Protium)", 4, 10.0, 7.0)],
    },
    "ox (oxalate)": {
        "descrizione": "O,O-donor bidentate, no magnetic nucleus",
        "nuclei": [],
    },
    "gly (glycinate)": {
        "descrizione": "N,O-donor bidentate, 1 N-14 coordinated",
        "nuclei": [("N-14", 1, 22.0, 18.0)],
        "distant_nuclei": [("H-1 (Protium)", 2, 10.0, 7.0)],
    },
    "bipy (bipyridine)": {
        "descrizione": "N,N-donor bidentate, 2 N-14 coordinated",
        "nuclei": [("N-14", 2, 18.0, 13.0)],
        "distant_nuclei": [("H-1 (Protium)", 8, 6.0, 4.0)],
    },
    "phen (phenanthroline)": {
        "descrizione": "N,N-donor bidentate, 2 N-14 coordinated",
        "nuclei": [("N-14", 2, 20.0, 15.0)],
        "distant_nuclei": [("H-1 (Protium)", 10, 7.0, 4.5)],
    },
    "8-OH-qin (oxinate)": {
        "descrizione": "N,O-donor bidentate, 1 N-14 coordinated",
        "nuclei": [("N-14", 1, 15.0, 12.0)],
        "distant_nuclei": [("H-1 (Protium)", 6, 8.0, 5.0)],
    },
    # --- POLIDENTATI ---
    "tren (tris(2-aminoethyl)amine)": {
        "descrizione": "N₄ tetradentate, 4 N-14 coordinated",
        "nuclei": [("N-14", 4, 25.0, 20.0)],
        "distant_nuclei": [("H-1 (Protium)", 8, 8.0, 5.0)],
    },
    "EDTA": {
        "descrizione": "N₂O₄ hexadentate, 2 N-14 coordinated",
        "nuclei": [("N-14", 2, 20.0, 15.0)],
        "distant_nuclei": [("H-1 (Protium)", 4, 6.0, 4.0)],
    },
    "porphyrin (TPP)": {
        "descrizione": "N₄ macrocyclic, 4 N-14 coordinated",
        "nuclei": [("N-14", 4, 15.0, 12.0)],
        "distant_nuclei": [("H-1 (Protium)", 8, 5.0, 3.5)],
    },
    "cyclam ([14]aneN₄)": {
        "descrizione": "N₄ macrocyclic, 4 N-14 coordinated",
        "nuclei": [("N-14", 4, 22.0, 17.0)],
        "distant_nuclei": [("H-1 (Protium)", 4, 8.0, 5.0)],
    },
}

# Display order for common ligands
leganti_comuni_ordine = list(leganti_comuni.keys())

# =====================================================================
# PRESET
# =====================================================================
preset_database = {
    "Cu(II)-tetraammine [Cu(NH3)4]2+ (D4h)": {
        "metallo": "Copper (Cu2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Cu-63": 200, "Cu-65": 214},
        "A_perp": {"Cu-63": 25, "Cu-65": 27},
        "leganti": [{"isotopo": "N-14", "n": 4, "A_par": 15.0, "A_perp": 15.0}],
        "distant_nuclei": [("H-1 (Protium)", 12, 8.0, 5.0)],
    },
    "Cu(II)-water [Cu(H2O)6]2+ (D4h)": {
        "metallo": "Copper (Cu2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Cu-63": 140, "Cu-65": 150},
        "A_perp": {"Cu-63": 20, "Cu-65": 21},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 12, 8.0, 5.0)],
    },
    "Mn(II)-water [Mn(H2O)6]2+ (Oh)": {
        "metallo": "Manganese (Mn2+)",
        "simmetria": "Cubic / isotropic",
        "A_par": {"Mn-55": 90},
        "A_perp": {"Mn-55": 90},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 12, 8.0, 5.0)],
    },
    "VO(II)-water [VO(H2O)5]2+ (C4v)": {
        "metallo": "Vanadium (V4+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, square pyramidal (C4v)",
        "A_par": {"V-51": 500},
        "A_perp": {"V-51": 170},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 10, 8.0, 5.0)],
    },
    "Cu(II)-acac₂ [Cu(acac)₂] (D2h)": {
        "metallo": "Copper (Cu2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Cu-63": 160, "Cu-65": 171},
        "A_perp": {"Cu-63": 25, "Cu-65": 27},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 6, 8.0, 5.0)],
    },
    "Cu(II)-en₂ [Cu(en)₂]²⁺ (D4h)": {
        "metallo": "Copper (Cu2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Cu-63": 190, "Cu-65": 203},
        "A_perp": {"Cu-63": 30, "Cu-65": 32},
        "leganti": [{"isotopo": "N-14", "n": 4, "A_par": 25.0, "A_perp": 20.0}],
        "distant_nuclei": [("H-1 (Protium)", 8, 10.0, 7.0)],
    },
    "Cu(II)-bipy₂ [Cu(bipy)₂]²⁺ (D2)": {
        "metallo": "Copper (Cu2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Cu-63": 170, "Cu-65": 182},
        "A_perp": {"Cu-63": 25, "Cu-65": 27},
        "leganti": [{"isotopo": "N-14", "n": 4, "A_par": 15.0, "A_perp": 12.0}],
        "distant_nuclei": [("H-1 (Protium)", 16, 5.0, 3.5)],
    },
    "VO(II)-acac₂ [VO(acac)₂] (C4v)": {
        "metallo": "Vanadium (V4+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, square pyramidal (C4v)",
        "A_par": {"V-51": 500},
        "A_perp": {"V-51": 170},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 6, 7.0, 4.5)],
    },
    "Cr(III)-acac₃ [Cr(acac)₃] (D3)": {
        "metallo": "Chromium (Cr3+/Cr5+)",
        "simmetria": "Cubic / isotropic",
        "A_par": {"Cr-53": 20},
        "A_perp": {"Cr-53": 20},
        "leganti": [],
        "distant_nuclei": [("H-1 (Protium)", 9, 5.0, 3.5)],
    },
    "Au(II)-chloride [AuCl₄]²⁻ (D4h)": {
        "metallo": "Gold (Au2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, square planar (D4h)",
        "A_par": {"Au-197": 60},
        "A_perp": {"Au-197": 25},
        "leganti": [{"isotopo": "Cl-35", "n": 4, "A_par": 12.0, "A_perp": 8.0}],
    },
    "Au(II)-doped K₂PtCl₆ (Oh)": {
        "metallo": "Gold (Au2+)",
        "simmetria": "Cubic / isotropic",
        "A_par": {"Au-197": 35},
        "A_perp": {"Au-197": 35},
        "leganti": [],
    },
    "Ag(II)-doped NaCl (Oh)": {
        "metallo": "Silver (Ag2+)",
        "simmetria": "Cubic / isotropic",
        "A_par": {"Ag-107": 40, "Ag-109": 46},
        "A_perp": {"Ag-107": 40, "Ag-109": 46},
        "leganti": [],
    },
    "Ag(II)-water [Ag(H₂O)₆]²⁺ (D4h)": {
        "metallo": "Silver (Ag2+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, elongated octahedral (D4h)",
        "A_par": {"Ag-107": 45, "Ag-109": 52},
        "A_perp": {"Ag-107": 12, "Ag-109": 14},
        "leganti": [{"isotopo": "O-17", "n": 6, "A_par": 8.0, "A_perp": 5.0}],
        "distant_nuclei": [("H-1 (Protium)", 12, 8.0, 5.0)],
    },
    "Pt(III)-chloride [PtCl₆]³⁻ (Oh)": {
        "metallo": "Platinum (Pt3+)",
        "simmetria": "Cubic / isotropic",
        "A_par": {"Pt-195": 80},
        "A_perp": {"Pt-195": 80},
        "leganti": [],
    },
    "Ni(I)-cyanide [Ni(CN)₄]³⁻ (D4h)": {
        "metallo": "Nickel (Ni+)",
        "simmetria": "Axial (D4h / C4v / D3h)",
        "stato": "d_x2-y2, square planar (D4h)",
        "A_par": {"Ni-61": 20},
        "A_perp": {"Ni-61": 10},
        "leganti": [],
    },
}

# =====================================================================
# PUSH PRESET VALUES INTO st.session_state
# =====================================================================
preset = st.session_state.preset_valori
if preset and st.session_state.preset_attivo:
    ps = st.session_state.preset_attivo
    if "metallo" in preset:
        st.session_state[f"metallo_{ps}"] = preset["metallo"]
    if "simmetria" in preset:
        st.session_state[f"simmetria_{ps}"] = preset["simmetria"]
    if "stato" in preset:
        st.session_state[f"stato_{ps}"] = preset["stato"]
    metallo_data = metalli.get(preset["metallo"], metalli[list(metalli.keys())[0]])
    for (etichetta, I, abb) in metallo_data["isotopi"]:
        if "A_par" in preset and etichetta in preset["A_par"]:
            st.session_state[f"Apar_{etichetta}_{ps}"] = float(preset["A_par"][etichetta])
        if "A_perp" in preset and etichetta in preset["A_perp"]:
            st.session_state[f"Aperp_{etichetta}_{ps}"] = float(preset["A_perp"][etichetta])
    if "D" in preset:
        st.session_state[f"D_zfs"] = float(preset["D"])
    if "leganti" in preset:
        n_leg = len(preset["leganti"])
        st.session_state[f"num_gruppi_{ps}"] = n_leg
        for i, leg in enumerate(preset["leganti"]):
            st.session_state[f"legiso_{i}_{ps}"] = leg["isotopo"]
            st.session_state[f"legn_{i}_{ps}"] = int(leg["n"])
            st.session_state[f"legAp_{i}_{ps}"] = float(leg["A_par"])
            st.session_state[f"legAe_{i}_{ps}"] = float(leg["A_perp"])
    else:
        st.session_state[f"num_gruppi_{ps}"] = 0

# =====================================================================
# HERO BANNER
# =====================================================================
st.markdown("""
<div class="hero-banner">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 16px;">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- d-orbital lobes (subtle background) -->
                <g opacity="0.06">
                    <ellipse cx="28" cy="28" rx="26" ry="10" fill="#4fc3f7" transform="rotate(45 28 28)"/>
                    <ellipse cx="28" cy="28" rx="26" ry="10" fill="#4fc3f7" transform="rotate(-45 28 28)"/>
                </g>
                <!-- Outer ring -->
                <circle cx="28" cy="28" r="25" stroke="#4fc3f7" stroke-width="1" opacity="0.15" fill="none"/>
                <!-- EPR 1st derivative: symmetric around center, positive lobe above, zero at center, negative below -->
                <path d="M 6 28 Q 14 28 20 14 Q 25 10 28 28 Q 31 46 36 46 Q 42 28 50 28"
                      stroke="#4fc3f7" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
                <!-- Zero line -->
                <line x1="6" y1="28" x2="50" y2="28" stroke="#4fc3f7" stroke-width="0.5" opacity="0.12"/>
            </svg>
            <div>
                <h1>dEPR Insight</h1>
                <p class="hero-sub">dive deeper into d-orbital EPR — simulation and interpretation</p>
            </div>
        </div>
        <span class="hero-badge">v1.0 &nbsp;·&nbsp; Crystal Field Theory</span>
    </div>
    <p class="hero-desc">
        Simulate <strong>hyperfine patterns</strong> and <strong>powder EPR spectra</strong> of paramagnetic
        transition metal complexes. The calculation includes <strong>g-factors</strong> (from d-orbital configurations),
        <strong>hyperfine coupling A</strong> (metal isotopes and ligands), and <strong>line shape profiles</strong>
        with optional tumbling. Select your metal and ligands, tweak the parameters — the spectrum updates in real time.
    </p>
</div>
""", unsafe_allow_html=True)

# =====================================================================
# QUICK START GUIDE
# =====================================================================
with st.expander("🚀 Quick start — simulate your first EPR spectrum in 30 seconds", expanded=False):
    st.markdown("""
    <style>
    .qs-step {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 8px 0; border-bottom: 1px solid rgba(79,195,247,0.08);
    }
    .qs-step:last-child { border-bottom: none; }
    .qs-num {
        background: rgba(79,195,247,0.12);
        color: #81d4fa; font-weight: 800; font-size: 1.1rem;
        width: 32px; height: 32px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
    }
    .qs-text { color: #c8ccd6; font-size: 0.92rem; line-height: 1.5; }
    .qs-text strong { color: #e0e0e0; }
    </style>

    <div class="qs-step">
        <div class="qs-num">1</div>
        <div class="qs-text"><strong>Pick a preset</strong> — In the sidebar, open <strong>⚡ Quick presets</strong> and choose e.g. <em>Cu(II)-tetraammine</em>. All parameters are set automatically.</div>
    </div>
    <div class="qs-step">
        <div class="qs-num">2</div>
        <div class="qs-text"><strong>Explore the tabs</strong> — <strong>📋 Parameters</strong> shows the numbers (g, A, total lines). <strong>📊 Spectra</strong> has the actual plots. <strong>🔬 Splitting</strong> shows how each nucleus splits the lines.</div>
    </div>
    <div class="qs-step">
        <div class="qs-num">3</div>
        <div class="qs-text"><strong>Tweak parameters</strong> — Change geometry (<strong>🧬 Complex</strong>), add ligands, adjust <strong>📡 Spectrum</strong> (frequency, linewidth, tumbling).</div>
    </div>
    <div class="qs-step">
        <div class="qs-num">4</div>
        <div class="qs-text"><strong>Understand g-factors</strong> — Open <strong>⚙️ Electronic parameters</strong>. The d-electron count and crystal field (Δ‖, Δ⊥) set the g-values automatically.</div>
    </div>
    <div class="qs-step">
        <div class="qs-num">5</div>
        <div class="qs-text"><strong>Export</strong> — In <strong>💾 Export</strong>, download the spectrum as PNG or CSV data for your publication.</div>
    </div>
    """, unsafe_allow_html=True)

# =====================================================================
# FUNZIONI
# =====================================================================
def intensita_gruppo(n, I):
    passi = int(round(2 * I)) + 1
    mI_possibili = [I - k for k in range(passi)]
    spettro = {0.0: 1.0}
    for _ in range(n):
        nuovo = {}
        for spost, inten in spettro.items():
            for m in mI_possibili:
                chiave = round(spost + m, 6)
                nuovo[chiave] = nuovo.get(chiave, 0.0) + inten
        spettro = nuovo
    return sorted(spettro.items())


def calcola_pattern(gruppi):
    spettro = {0.0: 1.0}
    for (n, I, A) in gruppi:
        righe = intensita_gruppo(n, I)
        nuovo = {}
        for spost, inten in spettro.items():
            for msum, i2 in righe:
                chiave = round(spost + A * msum, 6)
                nuovo[chiave] = nuovo.get(chiave, 0.0) + inten * i2
        spettro = nuovo
    return spettro


def lorentziana(B, Bc, gamma):
    return (gamma / 2.0) / (np.pi * ((B - Bc) ** 2 + (gamma / 2.0) ** 2))

NU_B = 714.486
G_E = 2.0023

# Conversion: 1 cm⁻¹ = 2.1418 × 10⁴ Gauss / g ≈ 21418 / g
# D(10⁻⁴ cm⁻¹) → D_eff(Gauss) = 2.1418 × D_val / g
D_CM1_TO_GAUSS = 2.1418

def build_transizioni_fine_structure(S, D_eff):
    """Return list of e⁻ transitions (shift_factor, intensity) for ZFS."""
    if S <= 0.5 or D_eff == 0.0:
        return [{"ms_start": -0.5, "shift_factor": 0.0, "intensity": 1.0}]
    transizioni = []
    for k in range(int(2 * S)):
        ms = -S + k
        shift_factor = -(2 * ms + 1)
        intensita = S * (S + 1) - ms * (ms + 1)
        transizioni.append({"ms_start": ms, "shift_factor": shift_factor, "intensity": intensita})
    max_int = max(t["intensity"] for t in transizioni)
    for t in transizioni:
        t["intensity"] /= max_int
    return transizioni

# =====================================================================
# SIDEBAR — INPUT CONTROLLI (tutti i parametri)
# =====================================================================

# --- SECTION 1: PRESETS ------------------------------------------------
def _on_preset_change():
    val = st.session_state.preset_selector
    if val != "None (manual)":
        st.session_state.preset_attivo = val
        st.session_state.preset_valori = preset_database[val]
        st.toast(f"Preset '{val}' loaded!", icon="✅")
    else:
        if st.session_state.preset_attivo is not None:
            st.toast("Manual parameters active.", icon="🔧")
        st.session_state.preset_attivo = None
        st.session_state.preset_valori = {}

_etichetta_expander = f"⚡ Quick presets — {st.session_state.preset_attivo}" if st.session_state.preset_attivo else "⚡ Quick presets"
with st.sidebar.expander(_etichetta_expander, expanded=st.session_state.preset_attivo is not None):
    if st.session_state.preset_attivo:
        if st.button("Reset to manual", key="reset_preset"):
            st.session_state.preset_attivo = None
            st.session_state.preset_valori = {}
            st.session_state["preset_selector"] = "None (manual)"
            st.toast("Parameters reset to manual values.", icon="🔄")
            st.rerun()
    preset_scelto = st.selectbox("Choose a preset:", ["None (manual)"] + list(preset_database.keys()), key="preset_selector", on_change=_on_preset_change)

# --- SECTION 2: COMPLEX (metal + geometry) ---------------------------
with st.sidebar.expander("🧬 Complex", expanded=True):
    preset = st.session_state.preset_valori
    if preset and "metallo" in preset:
        idx_metallo = list(metalli.keys()).index(preset["metallo"])
    else:
        idx_metallo = 0
    preset_scelto = st.session_state.preset_attivo or "None (manual)"
    metallo_nome = st.selectbox("Metal center:", options=list(metalli.keys()),
                                index=idx_metallo, key=f"metallo_{preset_scelto}")
    st.session_state.metallo_nome = metallo_nome
    metallo = metalli[metallo_nome]
    S = metallo["S"]
    st.session_state.S_attuale = S
    st.caption(metallo["nome_completo"])

    if preset and "simmetria" in preset:
        idx_simmetria = ["Cubic / isotropic", "Axial (D4h / C4v / D3h)", "Rhombic"].index(preset["simmetria"])
    else:
        idx_simmetria = 1
    simmetria = st.radio("Symmetry:", ["Cubic / isotropic", "Axial (D4h / C4v / D3h)", "Rhombic"],
                          index=idx_simmetria, key=f"simmetria_{preset_scelto}")

    st.divider()
    st.markdown("**Ligands**")
    st.markdown("**Quick add**")
    leg_scelto = st.selectbox("Common ligand:", ["—"] + leganti_comuni_ordine, key=f"leg_comune_{preset_scelto}")
    n_comuni = st.number_input("How many?", min_value=1, max_value=16, value=1, step=1, key=f"n_comuni_{preset_scelto}")
    if leg_scelto != "—":
        info = leganti_comuni[leg_scelto]
        st.caption(info["descrizione"])
        if info["nuclei"]:
            for (iso, n_per_leg, a_par, a_perp) in info["nuclei"]:
                n_tot = n_per_leg * n_comuni
                a_iso = round((a_par + 2*a_perp) / 3.0, 1)
                st.markdown(f"- {n_tot}×{iso} (A‖={a_par} G, A_iso={a_iso} G)")
        if info.get("distant_nuclei"):
            for (iso, n_per_leg, a_par, a_perp) in info["distant_nuclei"]:
                n_tot = n_per_leg * n_comuni
                st.caption(f"ℹ️ Also contains {n_tot}×{iso} (distant from metal, negligible — not added)")
    if st.button("➕ Add", key=f"btn_add_leg_{preset_scelto}", disabled=(leg_scelto == "—")):
        if "leganti_da_aggiungere" not in st.session_state:
            st.session_state.leganti_da_aggiungere = []
        info = leganti_comuni[leg_scelto]
        for (iso, n_per_leg, a_par, a_perp) in info["nuclei"]:
            st.session_state.leganti_da_aggiungere.append({
                "isotopo": iso, "n": n_per_leg * n_comuni,
                "A_par": a_par, "A_perp": a_perp,
            })
        st.toast(f"Added: {n_comuni} × {leg_scelto}", icon="➕")
        st.rerun()

    st.markdown("**Custom groups**")
    num_leganti_preset = len(preset.get("leganti", [])) if preset and "leganti" in preset else 0
    num_gruppi = st.number_input("Ligand groups:", min_value=0, max_value=8,
                                  value=num_leganti_preset, step=1, key=f"num_gruppi_{preset_scelto}")
    for i in range(int(num_gruppi)):
        st.markdown(f"**Group {i+1}**")
        if preset and "leganti" in preset and i < len(preset["leganti"]):
            leg_p = preset["leganti"][i]
            iso_nome = leg_p["isotopo"]
            # Match full library key if stored as short name (e.g. "H-1" → "H-1 (Protium)")
            if iso_nome not in leganti_libreria:
                for k in leganti_libreria:
                    if k.startswith(iso_nome):
                        iso_nome = k
                        break
            idx_iso = list(leganti_libreria.keys()).index(iso_nome) if iso_nome in leganti_libreria else 0
            n_def = leg_p["n"]; a_par_def = leg_p["A_par"]; a_perp_def = leg_p["A_perp"]
        else:
            idx_iso = 0; n_def = 2; a_par_def = 15.0; a_perp_def = 15.0
        st.selectbox("Isotope", options=leganti_ordine, index=idx_iso, key=f"legiso_{i}_{preset_scelto}", label_visibility="collapsed")
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("n", 1, 16, n_def, 1, key=f"legn_{i}_{preset_scelto}", label_visibility="collapsed")
        with c2:
            st.number_input("A‖", 0.0, 2000.0, a_par_def, 0.5, key=f"legAp_{i}_{preset_scelto}", label_visibility="collapsed")
        with c3:
            st.number_input("A⊥", 0.0, 2000.0, a_perp_def, 0.5, key=f"legAe_{i}_{preset_scelto}", label_visibility="collapsed")

# --- SECTION 3: ELECTRONIC PARAMETERS (λ + Δ + g) ---------------------
with st.sidebar.expander("⚙️ Electronic parameters", expanded=False):
    with st.expander("λ spin-orbit", expanded=False):
        d_count = st.number_input("d electrons (1-9)", min_value=1, max_value=9, value=9, step=1)
        segno_scelto = st.radio("λ sign:", ["Auto", "Positive (+)", "Negative (−)"])
        lambda_mod = st.number_input("|λ| (cm⁻¹)", min_value=0.0, max_value=3000.0, value=800.0, step=10.0)
        if segno_scelto == "Positive (+)":
            segno_lambda = 1.0
        elif segno_scelto == "Negative (−)":
            segno_lambda = -1.0
        else:
            segno_lambda = 1.0 if d_count < 5 else (-1.0 if d_count > 5 else 0.0)
        lambda_eff = segno_lambda * lambda_mod
        if segno_lambda > 0:
            st.info("λ > 0 (d < 5): g < g_e")
        elif segno_lambda < 0:
            st.info("λ < 0 (d > 5): g > g_e")
        else:
            st.info("λ ≈ 0 (d = 5): g ≈ g_e")

    with st.expander("Δ crystal field (cm⁻¹)", expanded=True):
        if simmetria == "Cubic / isotropic":
            Dc = st.number_input("Δ cubic", min_value=100.0, max_value=40000.0, value=10000.0, step=100.0)
        elif simmetria.startswith("Axial"):
            lista_stati = ["d_x2-y2, elongated octahedral (D4h)", "d_z2, compressed octahedral (D4h)",
                           "d_xy, square planar (D4h)", "d_x2-y2, square planar (D4h)",
                           "d_x2-y2, square pyramidal (C4v)",
                           "d_z2, apical pyramid (C4v)", "d_z2, trigonal bipyramidal (D3h)",
                           "d_x2-y2, equatorial bipyramidal (D3h)"]
            if preset and "stato" in preset:
                idx_stato = lista_stati.index(preset["stato"]) if preset["stato"] in lista_stati else 0
            else:
                idx_stato = 0
            stato = st.selectbox("Ground state:", lista_stati, index=idx_stato, key=f"stato_{preset_scelto}")
            if stato.startswith("d_x2") or stato.startswith("d_xy"):
                Dpar_def, Dperp_def = 15000.0, 8000.0
            else:
                Dpar_def, Dperp_def = 8000.0, 15000.0
            if "pyramid" in stato:
                Dpar_def, Dperp_def = 12000.0, 6000.0
            elif "bipyramidal" in stato:
                Dpar_def, Dperp_def = 8000.0, 12000.0
            Dpar = st.number_input("Δ‖ (parallel)", min_value=100.0, max_value=40000.0, value=Dpar_def, step=100.0)
            Dperp = st.number_input("Δ⊥ (perp.)", min_value=100.0, max_value=40000.0, value=Dperp_def, step=100.0)
        else:
            Dx = st.number_input("Δx", min_value=100.0, max_value=40000.0, value=8000.0, step=100.0)
            Dy = st.number_input("Δy", min_value=100.0, max_value=40000.0, value=10000.0, step=100.0)
            Dz = st.number_input("Δz", min_value=100.0, max_value=40000.0, value=15000.0, step=100.0)

    with st.expander("g-values", expanded=False):
        manual_g = st.checkbox("Enter g-values manually", value=False)
        if simmetria == "Cubic / isotropic":
            g_iso = G_E - (8.0/3.0) * lambda_eff / Dc
            if manual_g:
                g_iso = st.number_input("g (isotropic)", value=float(round(g_iso,4)), step=0.001)
            st.caption(f"g calculated = {g_iso:.4f}")
        elif simmetria.startswith("Axial"):
            if stato.startswith("d_x2") or stato.startswith("d_xy"):
                g_par_calc = G_E - 8.0 * lambda_eff / Dpar
                g_perp_calc = G_E - 2.0 * lambda_eff / Dperp
            else:
                g_par_calc = G_E - 2.0 * lambda_eff / Dperp
                g_perp_calc = G_E - 8.0 * lambda_eff / Dpar
            if manual_g:
                g_par = st.number_input("g‖", value=float(round(g_par_calc,4)), step=0.001)
                g_perp = st.number_input("g⊥", value=float(round(g_perp_calc,4)), step=0.001)
            else:
                g_par, g_perp = g_par_calc, g_perp_calc
            st.caption(f"g‖ = {g_par_calc:.4f}  g⊥ = {g_perp_calc:.4f}")
        else:
            gx_calc = G_E - 2.0 * lambda_eff / Dx
            gy_calc = G_E - 2.0 * lambda_eff / Dy
            gz_calc = G_E - 8.0 * lambda_eff / Dz
            if manual_g:
                gx = st.number_input("gx", value=float(round(gx_calc,4)), step=0.001)
                gy = st.number_input("gy", value=float(round(gy_calc,4)), step=0.001)
                gz = st.number_input("gz", value=float(round(gz_calc,4)), step=0.001)
            else:
                gx, gy, gz = gx_calc, gy_calc, gz_calc
            st.caption(f"gx = {gx_calc:.4f}  gy = {gy_calc:.4f}  gz = {gz_calc:.4f}")

# --- SECTION 4: SPECTRUM ----------------------------------------------
with st.sidebar.expander("📡 Spectrum", expanded=True):
    nu_GHz = st.number_input("ν (GHz)", min_value=1.0, max_value=400.0, value=9.5, step=0.1,
                              help="X-band ≈ 9.5 GHz. Sets the center of the spectrum.")
    gamma_val = st.number_input("γ (Gauss, FWHM)", min_value=0.1, max_value=500.0, value=8.0, step=0.5)
    spettro_modalita = st.radio("Display:", ["Absorption only", "Derivative only", "Both"],
                                index=0, key="spettro_modalita")
    st.markdown("**Molecular tumbling**")
    tumbling_label = st.radio("Tumbling:", ["Rigid", "Slow", "Intermediate", "Fast", "Isotropic"],
                              index=0, key="tumbling_choice")
    mappa_tumbling = {"Rigid": 0.0, "Slow": 0.2, "Intermediate": 0.5, "Fast": 0.8, "Isotropic": 1.0}
    mobilita = mappa_tumbling[tumbling_label]

    st.markdown("**Field range**")
    B_min_val = st.number_input("B min (G)", min_value=100, max_value=10000, value=1000, step=100)
    B_max_val = st.number_input("B max (G)", min_value=500, max_value=15000, value=6000, step=100)

    st.markdown("**Resolution**")
    n_punti = st.slider("Points in spectrum", min_value=500, max_value=20000, value=6000, step=500,
                        help="More points = sharper features but slower calculation. 6000 is a good balance.",
                        key="n_punti_slider")

    st.markdown("**Experimental data**")
    exp_file = st.file_uploader("Upload CSV (Field,Signal)", type=["csv", "txt"],
                                help="CSV with header: field in Gauss, signal intensity. Overlaid as white dashed line.")
    if exp_file is not None:
        st.success(f"Loaded: {exp_file.name}")

# --- SECTION 5: ZFS ---------------------------------------------------
_preset_key = st.session_state.get("preset_attivo", None) or "None (manual)"
_metal_key = f"metallo_{_preset_key}"
if _metal_key in st.session_state:
    _nome_metallo = st.session_state[_metal_key]
    st.session_state.S_attuale = metalli[_nome_metallo]["S"] if _nome_metallo in metalli else 0.5
D_default_per_metallo = {
    "Manganese (Mn2+)": 90.0, "Cobalt (Co2+)": 250.0,
    "Iron (Fe3+)": 50.0, "Ruthenium (Ru3+)": 80.0,
}
with st.sidebar.expander("🧲 Zero-Field Splitting (ZFS)", expanded=True):
    S_zfs = st.session_state.S_attuale
    if S_zfs > 0.5:
        metallo_corrente = st.session_state.get("metallo_nome", "")
        D_default = D_default_per_metallo.get(metallo_corrente, 100.0) if metallo_corrente else 100.0
        _metallo_prec = st.session_state.get("_zfs_metallo_prec", "")
        if metallo_corrente != _metallo_prec:
            st.session_state["D_zfs"] = D_default
            st.session_state["_zfs_metallo_prec"] = metallo_corrente
        st.number_input("D (×10⁻⁴ cm⁻¹)", min_value=0.0, max_value=10000.0,
                        value=D_default, step=5.0, key="D_zfs",
                        help="Set to 0 to disable. Typical: Mn²⁺=50-200, Co²⁺=100-500.")
        D_zfs_val = st.session_state.get("D_zfs", 0.0)
        D_eff_calc = D_CM1_TO_GAUSS * D_zfs_val
        n_trans = int(2 * S_zfs)
        st.caption(f"D_eff ≈ {D_eff_calc:.1f} G/g  |  {n_trans} transitions")
        with st.expander("ℹ️ What changes?", expanded=False):
            if D_zfs_val > 0:
                st.markdown(f"**S = {S_zfs}**: {n_trans} transitions Δmₛ=±1:")
                for k in range(int(2 * S_zfs)):
                    ms = -S_zfs + k
                    shift = -(2*ms+1) * D_eff_calc
                    rel_int = S_zfs*(S_zfs+1) - ms*(ms+1)
                    st.markdown(f"- mₛ={ms:.1f}→{ms+1:.1f}: ΔB={shift:+.0f} G/g")
            else:
                st.caption("ZFS off → single e⁻ transition.")
    else:
        st.caption("S = 1/2, ZFS not applicable.")

# =====================================================================
# SHARED COMPUTATIONS (before tabs)
# =====================================================================
# Read metal, S, symmetry, etc. from sidebar (already in session)
preset = st.session_state.preset_valori
preset_scelto = st.session_state.preset_attivo or "None (manual)"
metallo_nome = st.session_state.get("metallo_nome", list(metalli.keys())[0])
metallo = metalli[metallo_nome]
S = metallo["S"]
st.session_state.S_attuale = S

# Valori A dai widget (key dinamiche legate al preset)
valori_A_par = {}
valori_A_perp = {}
for (etichetta, I, abb) in metallo["isotopi"]:
    if preset and "A_par" in preset and etichetta in preset["A_par"]:
        def_par = preset["A_par"][etichetta]
    elif isinstance(metallo["A_par_default"], dict):
        def_par = metallo["A_par_default"][etichetta]
    else:
        def_par = metallo["A_par_default"]
    
    if preset and "A_perp" in preset and etichetta in preset["A_perp"]:
        def_perp = preset["A_perp"][etichetta]
    elif isinstance(metallo["A_perp_default"], dict):
        def_perp = metallo["A_perp_default"][etichetta]
    else:
        def_perp = metallo["A_perp_default"]
    
    valori_A_par[etichetta] = def_par
    valori_A_perp[etichetta] = def_perp

# --- Flush queued ligands BEFORE spectrum computation -----------------
if "leganti_da_aggiungere" in st.session_state and st.session_state.leganti_da_aggiungere:
    num_leganti_preset_tmp = len(preset.get("leganti", [])) if preset and "leganti" in preset else 0
    n_attuale = st.session_state.get(f"num_gruppi_{preset_scelto}", num_leganti_preset_tmp)
    while st.session_state.leganti_da_aggiungere:
        nuovi = st.session_state.leganti_da_aggiungere.pop(0)
        nuovo_idx = int(n_attuale)
        st.session_state[f"num_gruppi_{preset_scelto}"] = n_attuale + 1
        iso_nome_leg = nuovi["isotopo"]
        if iso_nome_leg not in leganti_ordine:
            for k in leganti_ordine:
                if k.startswith(iso_nome_leg):
                    iso_nome_leg = k
                    break
        idx_iso = leganti_ordine.index(iso_nome_leg) if iso_nome_leg in leganti_ordine else 0
        st.session_state[f"legiso_{nuovo_idx}_{preset_scelto}"] = nuovi["isotopo"]
        st.session_state[f"legn_{nuovo_idx}_{preset_scelto}"] = nuovi["n"]
        st.session_state[f"legAp_{nuovo_idx}_{preset_scelto}"] = nuovi["A_par"]
        st.session_state[f"legAe_{nuovo_idx}_{preset_scelto}"] = nuovi["A_perp"]
        n_attuale += 1

# Ligands — read from st.session_state (values from previous run's widgets)
num_leganti_preset = len(preset.get("leganti", [])) if preset and "leganti" in preset else 0
num_gruppi_val = st.session_state.get(f"num_gruppi_{preset_scelto}", num_leganti_preset)

leganti_sceltti = []
for i in range(int(num_gruppi_val)):
    iso_leg = st.session_state.get(f"legiso_{i}_{preset_scelto}", "N-14")
    n_leg = st.session_state.get(f"legn_{i}_{preset_scelto}", 2)
    A_par_leg = st.session_state.get(f"legAp_{i}_{preset_scelto}", 15.0)
    A_perp_leg = st.session_state.get(f"legAe_{i}_{preset_scelto}", 15.0)
    if iso_leg in leganti_libreria:
        I_leg, abb_leg, nome_leg = leganti_libreria[iso_leg]
        leganti_sceltti.append({"etichetta": iso_leg, "I": I_leg, "n": int(n_leg),
                                "A_par": float(A_par_leg), "A_perp": float(A_perp_leg)})

# Pattern groups from leganti
gruppi_leg_par = [(leg["n"], leg["I"], leg["A_par"]) for leg in leganti_sceltti]
gruppi_leg_perp = [(leg["n"], leg["I"], leg["A_perp"]) for leg in leganti_sceltti]
gruppi_leg_iso = [(leg["n"], leg["I"], (leg["A_par"] + 2*leg["A_perp"])/3.0) for leg in leganti_sceltti]

def A_iso_di(iso_Apar, iso_Aperp):
    return (iso_Apar + 2*iso_Aperp) / 3.0

risultati = []
with st.spinner("🧮 Computing hyperfine patterns..."):
    for (etichetta, I, abb) in metallo["isotopi"]:
        Ap = valori_A_par[etichetta]; Ae = valori_A_perp[etichetta]
        pat_par = calcola_pattern([(1, I, Ap)] + gruppi_leg_par)
        pat_perp = calcola_pattern([(1, I, Ae)] + gruppi_leg_perp)
        pat_iso = calcola_pattern([(1, I, A_iso_di(Ap, Ae))] + gruppi_leg_iso)
        tot_p = sum(pat_par.values()); tot_e = sum(pat_perp.values()); tot_i = sum(pat_iso.values())
        risultati.append({
            "isotopo": etichetta, "abbondanza": abb,
            "pattern_par": {k: v / tot_p * abb for k, v in pat_par.items()},
            "pattern_perp": {k: v / tot_e * abb for k, v in pat_perp.items()},
            "pattern_iso": {k: v / tot_i * abb for k, v in pat_iso.items()},
            "n_linee": sum(1 for v in pat_par.values() if v > 1e-6),
        })

# Transizioni fine-struttura (ZFS)
D_val = st.session_state.get("D_zfs", 0.0) if S > 0.5 else 0.0
D_eff = D_CM1_TO_GAUSS * D_val if S > 0.5 else 0.0
transizioni = build_transizioni_fine_structure(S, D_eff)

# Orientations
orientazioni = []
if simmetria == "Cubic / isotropic":
    orientazioni = [("Isotropic (g)", "pattern_iso", g_iso)]
elif simmetria.startswith("Axial"):
    orientazioni = [("‖ (g‖)", "pattern_par", g_par), ("⊥ (g⊥)", "pattern_perp", g_perp)]
else:
    orientazioni = [("x (gx)", "pattern_perp", gx), ("y (gy)", "pattern_perp", gy), ("z (gz)", "pattern_par", gz)]
    st.caption("Note: in this simplified simulation, x and y directions share the same hyperfine coupling.")

colori = COLORI_ISOTOPI

# Matplotlib colors (always dark; CSS inverts in light mode)
C_FIG_BG = "#0e1117"
C_AX_BG = "#121520"
C_TEXT = "#e0e0e0"
C_LABEL = "#9aa0b0"
C_TICK = "#6b7280"
C_LEGEND_BG = "#1a1a2e"
C_LEGEND_TEXT = "#e0e0e0"
C_MIXED_LINE = "#e0e0e0"
C_EXP = "#ffffff"

# Magnetic field range (from sidebar)
# Stick spectrum
n_pann = len(orientazioni)
fig1, assi = plt.subplots(1, n_pann, figsize=((8.0, 3.0) if n_pann == 1 else (6.5*n_pann, 4.5)), facecolor=C_FIG_BG)
if n_pann == 1:
    assi = [assi]
if n_pann == 1:
    fig1.subplots_adjust(top=0.78)

fig1.suptitle("Stick Spectrum", fontweight="bold", fontsize=15, color=C_TEXT, y=0.96 if n_pann == 1 else 1.0)

for ax, (label, chiave, gval) in zip(assi, orientazioni):
    ax.set_facecolor(C_AX_BG)
    base = NU_B * nu_GHz / gval
    for trans in transizioni:
        shift_zfs = trans["shift_factor"] * D_eff / gval
        w_trans = trans["intensity"]
        base_trans = base + shift_zfs
        for idx, r in enumerate(risultati):
            colore = colori[idx % len(colori)]
            for spost, inten in r[chiave].items():
                if inten > 1e-6:
                    B = base_trans - spost / gval
                    ax.vlines(B, 0, inten * w_trans, color=colore, linewidth=2.8, alpha=0.9)
    ax.set_title(label, fontweight="bold", fontsize=13, color=C_TEXT, pad=10)
    ax.set_xlabel("Magnetic field (Gauss)", color=C_LABEL)
    ax.set_ylabel("Relative intensity", color=C_LABEL)
    ax.set_ylim(0, 1.15)
    ax.tick_params(colors=C_TICK)

proxy = [Line2D([0], [0], color=colori[i % len(colori)], lw=3.5,
                label=f"{r['isotopo']} ({r['abbondanza']*100:.0f}%)") for i, r in enumerate(risultati)]
assi[0].legend(handles=proxy, loc="upper right", ncol=1, frameon=True, facecolor=C_LEGEND_BG,
               edgecolor="none", labelcolor=C_LEGEND_TEXT, fontsize=9,
               handlelength=1.5, handletextpad=0.8)

# Powder EPR spectrum — validate field range
if B_min_val >= B_max_val:
    st.error("⚠️ The minimum field must be lower than the maximum. Check your values.")
    B_min_val, B_max_val = 1000, 6000

pesi = {}
if simmetria.startswith("Axial"):
    pesi = {"‖ (g‖)": 1.0, "⊥ (g⊥)": 2.0}
else:
    pesi = {label: 1.0 for label, _, _ in orientazioni}

B_arr = np.linspace(B_min_val, B_max_val, n_punti)
assorb = np.zeros_like(B_arr)
for (label, chiave, gval) in orientazioni:
    base = NU_B * nu_GHz / gval
    w_orient = pesi.get(label, 1.0)
    for trans in transizioni:
        shift_zfs = trans["shift_factor"] * D_eff / gval
        w_trans = trans["intensity"]
        base_trans = base + shift_zfs
        for r in risultati:
            for spost, inten in r[chiave].items():
                Bc = base_trans - spost / gval
                assorb += inten * w_orient * w_trans * lorentziana(B_arr, Bc, gamma_val)

if assorb.max() > 0:
    assorb = assorb / assorb.max()

# --- Isotropic spectrum (solution) ---
assorb_iso = np.zeros_like(B_arr)
if simmetria == "Cubic / isotropic":
    g_iso_spettro = g_iso
elif simmetria.startswith("Axial"):
    g_iso_spettro = (g_par + 2*g_perp) / 3.0
else:
    g_iso_spettro = (gx + gy + gz) / 3.0

base_iso = NU_B * nu_GHz / g_iso_spettro
for r in risultati:
    for spost, inten in r["pattern_iso"].items():
        Bc = base_iso - spost / g_iso_spettro
        assorb_iso += inten * lorentziana(B_arr, Bc, gamma_val)
if assorb_iso.max() > 0:
    assorb_iso = assorb_iso / assorb_iso.max()

# --- Powder + isotropic mixture based on tumbling ---
assorb_mixed = (1.0 - mobilita) * assorb + mobilita * assorb_iso

fig2, ax2 = plt.subplots(figsize=(12, 4.5), facecolor=C_FIG_BG)
ax2.set_facecolor(C_AX_BG)

# Tumbling indicator badge
if mobilita == 0.0:
    badge_style = "Rigid"
    colore_spettro = "#4fc3f7"
elif mobilita == 1.0:
    badge_style = "Isotropic"
    colore_spettro = "#81c784"
else:
    badge_style = f"Mixed ({tumbling_label})"
    colore_spettro = C_MIXED_LINE

deriv = np.gradient(assorb_mixed, B_arr)
if deriv.max() > 0:
    deriv = deriv / deriv.max()

if spettro_modalita in ["Absorption only", "Both"]:
    ax2.fill_between(B_arr, assorb_mixed, color=colore_spettro, alpha=0.12)
    ax2.plot(B_arr, assorb_mixed, color=colore_spettro, linewidth=2.0,
             label=f"Absorption — {badge_style}")
if spettro_modalita in ["Derivative only", "Both"]:
    ax2.plot(B_arr, deriv, color="#ff8a65", linewidth=1.5, alpha=0.85,
             label="1st derivative",
             linestyle="--" if spettro_modalita == "Both" else "-")
ax2.set_xlabel("Magnetic field (Gauss)", color=C_LABEL, fontsize=12)
ax2.set_ylabel("Signal (normalized)", color=C_LABEL, fontsize=12)
ax2.set_title(f"Predicted EPR Spectrum — {metallo_nome}",
              fontweight="bold", fontsize=15, color=C_TEXT, pad=12)
ax2.legend(loc="upper right", facecolor=C_LEGEND_BG, edgecolor="none",
           labelcolor=C_LEGEND_TEXT, fontsize=10)
ax2.tick_params(colors=C_TICK)

# --- Experimental data overlay ---
exp_data = None
if exp_file is not None:
    try:
        df_exp = pd.read_csv(exp_file)
        col_exp_field = df_exp.columns[0]
        col_exp_sig = df_exp.columns[1]
        B_exp = df_exp[col_exp_field].values.astype(float)
        sig_exp = df_exp[col_exp_sig].values.astype(float)
        sig_exp = sig_exp - sig_exp.min()
        if sig_exp.max() > 0:
            sig_exp = sig_exp / sig_exp.max()
        ax2.plot(B_exp, sig_exp, color=C_EXP, linewidth=1.2, alpha=0.7,
                 linestyle="--", label="Experimental", zorder=5)
        ax2.legend(loc="upper right", facecolor=C_LEGEND_BG, edgecolor="none",
                   labelcolor=C_LEGEND_TEXT, fontsize=10)
        exp_data = (B_exp, sig_exp)
    except Exception as e:
        st.sidebar.warning(f"Could not load experimental data: {e}")

# =====================================================================
# TABS PRINCIPALI
# =====================================================================
tab_parametri, tab_spettri, tab_split, tab_export = st.tabs(
    ["📋 Parameters", "📊 Spectra", "🔬 Splitting", "💾 Export"]
)

# =====================================================================
# TAB 1: PARAMETRI
# =====================================================================
with tab_parametri:
    st.markdown(f"""
    <div class="glass-card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div>
                <span style="color: #4fc3f7; font-weight: 700; font-size: 1.1rem;">🧪 {metallo_nome}</span>
                <span style="color: #5a6276; margin: 0 10px;">|</span>
                <span style="color: #e0e0e0;">{simmetria}</span>
                <span style="color: #5a6276; margin: 0 10px;">|</span>
                <span style="color: #e0e0e0;">ν = {nu_GHz} GHz</span>
                <span style="color: #5a6276; margin: 0 10px;">|</span>
                <span style="color: #e0e0e0;">{len(leganti_sceltti)} ligands</span>
            </div>
            <span style="background: rgba(79, 195, 247, 0.1); color: #81d4fa; font-size: 0.75rem;
                  font-weight: 600; padding: 4px 14px; border-radius: 20px;
                  border: 1px solid rgba(79, 195, 247, 0.2);">
                {"S = " + str(S) if S else "S = ½"}
            </span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("**Metal isotopes — hyperfine coupling A:**")
    for (etichetta, I, abb) in metallo["isotopi"]:
        st.markdown(f"- **{etichetta}**: I = {I}, ab. {abb*100:.1f}%")
        c1, c2 = st.columns(2)
        with c1:
            if preset and "A_par" in preset and etichetta in preset["A_par"]:
                def_par = preset["A_par"][etichetta]
            elif isinstance(metallo["A_par_default"], dict):
                def_par = metallo["A_par_default"][etichetta]
            else:
                def_par = metallo["A_par_default"]
            st.number_input(f"A‖ {etichetta} (G)", 0.0, 5000.0, float(def_par), 1.0,
                            key=f"Apar_{etichetta}_{preset_scelto}")
        with c2:
            if preset and "A_perp" in preset and etichetta in preset["A_perp"]:
                def_perp = preset["A_perp"][etichetta]
            elif isinstance(metallo["A_perp_default"], dict):
                def_perp = metallo["A_perp_default"][etichetta]
            else:
                def_perp = metallo["A_perp_default"]
            st.number_input(f"A⊥ {etichetta} (G)", 0.0, 5000.0, float(def_perp), 1.0,
                            key=f"Aperp_{etichetta}_{preset_scelto}")

    st.divider()

    st.markdown("**Calculated g-factors:**")
    if simmetria == "Cubic / isotropic":
        st.success(f"g = **{g_iso:.4f}** (g_e = {G_E})")
    elif simmetria.startswith("Axial"):
        maggiore = "g‖ > g⊥" if g_par > g_perp else "g⊥ > g‖"
        st.info(f"g‖ = **{g_par:.4f}**  |  g⊥ = **{g_perp:.4f}**  → {maggiore}")
        if stato.startswith("d_x2") or stato.startswith("d_xy"):
            st.caption("d_x2−y2 / d_xy ground state: g‖ > g⊥ typical.")
        else:
            st.caption("d_z2 ground state: g⊥ > g‖ typical.")
    else:
        st.info(f"gx = **{gx:.4f}**  |  gy = **{gy:.4f}**  |  gz = **{gz:.4f}**")

    st.divider()

    st.markdown(f"**Electron spin:** S = {S}")
    if len(transizioni) > 1:
        st.info(f"**ZFS active:** D = {D_val} × 10⁻⁴ cm⁻¹ → {len(transizioni)} fine-structure transitions")
    else:
        st.caption("ZFS not active (S = 1/2 or D = 0).")

    n_linee_totali = sum(r["n_linee"] for r in risultati)
    st.markdown(f"**Total hyperfine lines:** {n_linee_totali} per orientation, {n_linee_totali * len(orientazioni)} across all orientations")

# =====================================================================
# TAB 2: SPETTRI
# =====================================================================
with tab_spettri:
    st.pyplot(fig1)
    st.markdown("""
    <div style="background: rgba(79, 195, 247, 0.05); border: 1px solid rgba(79, 195, 247, 0.1);
                border-radius: 10px; padding: 8px 16px; margin-bottom: 16px;">
        <span style="color: #81d4fa; font-weight: 500;">📌 Stick spectrum</span>
        <span style="color: #7a8294;"> — each vertical line is a transition, height = relative intensity.</span>
    </div>
    """, unsafe_allow_html=True)

    buf_stick = io.BytesIO()
    fig1.savefig(buf_stick, format="png", dpi=150, bbox_inches="tight")
    buf_stick.seek(0)
    if st.download_button("📥 Stick spectrum (PNG)", data=buf_stick,
                          file_name=f"EPR_stick_{metallo_nome}.png", mime="image/png"):
        st.toast("Stick spectrum downloaded!", icon="📥")

    st.markdown("**Line list:**")
    zfs_attivo = len(transizioni) > 1
    if zfs_attivo:
        colonne_tab = {"Isotope": [], "Transition": [], "Orientation": [], "Field (G)": [], "Intensity": []}
    else:
        colonne_tab = {"Isotope": [], "Orientation": [], "Field (G)": [], "Intensity": []}
    for (label, chiave, gval) in orientazioni:
        base = NU_B * nu_GHz / gval
        for trans in transizioni:
            shift_zfs = trans["shift_factor"] * D_eff / gval
            w_trans = trans["intensity"]
            base_trans = base + shift_zfs
            if zfs_attivo:
                trans_label = f"Δmₛ={trans['ms_start']:.1f}→{trans['ms_start']+1:.1f}"
            for r in risultati:
                for spost, inten in sorted(r[chiave].items()):
                    if inten > 1e-4:
                        colonne_tab["Isotope"].append(r["isotopo"])
                        if zfs_attivo:
                            colonne_tab["Transition"].append(trans_label)
                        colonne_tab["Orientation"].append(label)
                        colonne_tab["Field (G)"].append(round(base_trans - spost/gval, 2))
                        colonne_tab["Intensity"].append(round(inten * w_trans, 4))
    df_righe = pd.DataFrame(colonne_tab)
    st.dataframe(df_righe, use_container_width=True, hide_index=True,
                 column_config={
                     "Field (G)": st.column_config.NumberColumn("Field (G)", format="%.2f"),
                     "Intensity": st.column_config.NumberColumn("Intensity", format="%.4f"),
                 })

    st.divider()

    st.pyplot(fig2)
    st.markdown("""
    <div style="background: rgba(129, 199, 132, 0.05); border: 1px solid rgba(129, 199, 132, 0.1);
                border-radius: 10px; padding: 8px 16px; margin-bottom: 8px;">
        <span style="color: #a5d6a7; font-weight: 500;">📌 Powder spectrum</span>
        <span style="color: #7a8294;"> — the perpendicular contribution is stronger due to orientational degeneracy.</span>
    </div>
    <div style="background: rgba(255, 138, 101, 0.05); border: 1px solid rgba(255, 138, 101, 0.1);
                border-radius: 10px; padding: 8px 16px;">
        <span style="color: #ff8a65; font-weight: 500;">💡</span>
        <span style="color: #e0e0e0;"> The axis is inverted. The peak at <strong>lower field</strong> corresponds to the larger g.</span>
    </div>
    """, unsafe_allow_html=True)

# =====================================================================
# TAB 3: SPLITTING IPERFINE
# =====================================================================
with tab_split:
    st.markdown("""
    <div class="glass-card" style="padding: 12px 18px;">
        <span style="color: #81d4fa; font-weight: 500;">🔬 Hyperfine Splitting Tree</span>
        <span style="color: #7a8294;"> — Each nucleus splits each line into sub-lines. The table shows the effect of each equivalent-nucleus group.</span>
    </div>
    """, unsafe_allow_html=True)

    if len(transizioni) > 1:
        st.info(f"**ZFS active:** S = {S} → {len(transizioni)} fine-structure transitions. "
                f"The table shows the hyperfine splitting of **one** of them.")

    if simmetria == "Cubic / isotropic":
        chiave_ref = "pattern_iso"
        label_ref = "isotropic"
    else:
        chiave_ref = "pattern_par"
        label_ref = "parallel"

    gruppi_per_isotopo = {}
    for r in risultati:
        iso = r["isotopo"]
        for (etichetta, I_m, abb) in metalli[metallo_nome]["isotopi"]:
            if etichetta == iso:
                if simmetria == "Cubic / isotropic":
                    A_m = (valori_A_par[iso] + 2*valori_A_perp[iso]) / 3.0
                else:
                    A_m = valori_A_par[iso]
                break
        gruppi = [(f"Metal ({iso})", 1, I_m, A_m)]
        for leg in leganti_sceltti:
            if simmetria == "Cubic / isotropic":
                A_l = (leg["A_par"] + 2*leg["A_perp"]) / 3.0
            else:
                A_l = leg["A_par"]
            gruppi.append((f"{leg['etichetta']}", leg["n"], leg["I"], A_l))
        gruppi_per_isotopo[iso] = gruppi

    if len(risultati) > 1:
        iso_scelto = st.selectbox("Isotope:", [r["isotopo"] for r in risultati], key="tree_iso")
    else:
        iso_scelto = risultati[0]["isotopo"]

    gruppi = gruppi_per_isotopo[iso_scelto]

    tabella_splitting = {"Step": [], "Nucleus": [], "I": [], "n": [], "2nI+1": [], "A (G)": [], "Total lines": []}
    n_tot = 1
    for idx, (nome, n, I, A) in enumerate(gruppi):
        n_righe = int(round(2 * n * I)) + 1
        n_prec = n_tot
        n_tot *= n_righe
        tabella_splitting["Step"].append(f"{idx+1}")
        tabella_splitting["Nucleus"].append(nome)
        tabella_splitting["I"].append(f"{I}")
        tabella_splitting["n"].append(f"{n}")
        tabella_splitting["2nI+1"].append(f"{n_righe}")
        tabella_splitting["A (G)"].append(f"{A:.1f}")
        tabella_splitting["Total lines"].append(f"{n_prec} → {n_tot}")

    df_split = pd.DataFrame(tabella_splitting)
    st.dataframe(df_split, use_container_width=True, hide_index=True)

    formula = " x ".join([str(int(round(2 * n * I)) + 1) for (_, n, I, _) in gruppi])
    st.success(f"**Formula:** {formula} = **{n_tot} lines** for {iso_scelto} ({label_ref})")

    if preset and preset.get("distant_nuclei"):
        for (iso, n, a_par, a_perp) in preset["distant_nuclei"]:
            st.caption(f"ℹ️ This complex also contains {n}×{iso} (distant from metal, negligible — not simulated)")

    with st.expander("Physical explanation", expanded=False):
        st.markdown(f"""
        Each nucleus with spin **I** splits each line into **2I+1** sub-lines.
        With **n** equivalent nuclei, the total number of lines is **2nI+1**.
        """)
        for (nome, n, I, A) in gruppi:
            n_righe = int(round(2 * n * I)) + 1
            st.markdown(f"- **{nome}**: {n} nuclei with I={I} → {n_righe} lines (A = {A:.1f} G)")
        st.markdown(f"\n**Result:** {n_tot} total lines for {iso_scelto}")

# =====================================================================
# TAB 4: ESPORTAZIONE
# =====================================================================
with tab_export:
    st.markdown("""
    <div class="glass-card" style="padding: 12px 18px; margin-bottom: 20px;">
        <span style="color: #81d4fa; font-weight: 500;">💾 Export</span>
        <span style="color: #7a8294;"> — Download the spectrum as PNG or the raw data as CSV.</span>
    </div>
    """, unsafe_allow_html=True)

    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        st.subheader("Spectrum (PNG)")
        buf = io.BytesIO()
        fig2.savefig(buf, format="png", dpi=150, bbox_inches="tight")
        buf.seek(0)
        if st.download_button(label="📥 Download PNG", data=buf,
                              file_name=f"EPR_spectrum_{metallo_nome}.png", mime="image/png"):
            st.toast("PNG downloaded!", icon="📥")
    with col_exp2:
        st.subheader("Data (CSV)")
        csv_data = "Field (G),Absorption"
        if spettro_modalita in ["Derivative only", "Both"]:
            csv_data += ",Derivative"
        csv_data += "\n"
        for i, B in enumerate(B_arr):
            csv_data += f"{B:.2f},{assorb_mixed[i]:.6f}"
            if spettro_modalita in ["Derivative only", "Both"]:
                csv_data += f",{deriv[i]:.6f}"
            csv_data += "\n"
        if st.download_button(label="📥 Download CSV", data=csv_data,
                              file_name=f"EPR_data_{metallo_nome}.csv", mime="text/csv"):
            st.toast("CSV downloaded!", icon="📥")

    st.divider()
    with st.expander("📝 Cite this tool", expanded=False):
        st.markdown("""
        If you use **dEPR Insight** in your research, please cite it as:

        ```
        dEPR Insight: dive deeper into d-orbital EPR — simulation and interpretation
        https://deprinsight.streamlit.app
        Version 1.0 — Crystal Field Theory
        ```

        **BibTeX:**
        ```bibtex
        @software{dEPRInsight2025,
          title = {dEPR Insight: dive deeper into d-orbital EPR — simulation and interpretation},
          url = {https://deprinsight.streamlit.app},
          version = {1.0},
          year = {2025},
        }
        ```
        """)

    st.divider()
    with st.expander("📖 EPR Glossary", expanded=False):
        st.markdown("""
        <style>
        .glossary-term {
            background: rgba(79, 195, 247, 0.04);
            border-left: 3px solid #4fc3f7;
            border-radius: 8px;
            padding: 10px 16px;
            margin-bottom: 10px;
        }
        .glossary-term .term {
            color: #4fc3f7;
            font-weight: 700;
            font-size: 1rem;
        }
        .glossary-term .def {
            color: #c8ccd6;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-top: 4px;
        }
        .glossary-term .def code {
            background: rgba(79, 195, 247, 0.1);
            color: #81d4fa;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 0.85rem;
        }
        </style>

        <div class="glossary-term">
            <div class="term">g-factor</div>
            <div class="def">Ratio of magnetic moment to angular momentum. Free electron: <code>gₑ = 2.0023</code>. Deviations arise from spin–orbit coupling.</div>
        </div>

        <div class="glossary-term">
            <div class="term">A (hyperfine coupling)</div>
            <div class="def">Interaction between electron spin and nuclear spin (<code>I</code>). Splits each line into <code>2I+1</code> sub-lines. Measured in Gauss (G).</div>
        </div>

        <div class="glossary-term">
            <div class="term">A‖, A⊥</div>
            <div class="def">Parallel and perpendicular components of the hyperfine tensor. Their ratio reflects the symmetry of the spin density.</div>
        </div>

        <div class="glossary-term">
            <div class="term">γ (FWHM linewidth)</div>
            <div class="def">Full width at half maximum of each Lorentzian line. Determines resolution: narrower γ → sharper features.</div>
        </div>

        <div class="glossary-term">
            <div class="term">λ (spin–orbit coupling constant)</div>
            <div class="def">
                Couples spin and orbital angular momenta.<br>
                d¹–⁴ (less than half-filled): <code>λ > 0</code> → <code>g < gₑ</code><br>
                d⁶–⁹ (more than half-filled): <code>λ < 0</code> → <code>g > gₑ</code><br>
                d⁵ (half-filled): <code>λ ≈ 0</code> → <code>g ≈ gₑ</code>
            </div>
        </div>

        <div class="glossary-term">
            <div class="term">Δ (crystal field splitting)</div>
            <div class="def">Energy separation between d-orbitals. Larger Δ → smaller g-shift. Axial systems have <code>Δ‖</code> and <code>Δ⊥</code>.</div>
        </div>

        <div class="glossary-term">
            <div class="term">ZFS (Zero-Field Splitting)</div>
            <div class="def">Splitting of electron spin levels without applied field. Only for <code>S > ½</code> (Mn²⁺, Co²⁺, Fe³⁺, Cr³⁺). Parameter <strong>D</strong> quantifies the axial component.</div>
        </div>

        <div class="glossary-term">
            <div class="term">Stick spectrum</div>
            <div class="def">Simplified representation where each transition is a vertical line. Line height = relative intensity; position = resonance field.</div>
        </div>

        <div class="glossary-term">
            <div class="term">Powder spectrum</div>
            <div class="def">Sum of all orientations in a polycrystalline sample. Perpendicular orientations (<code>g⊥</code>) contribute twice as much as parallel (<code>g‖</code>) in axial symmetry.</div>
        </div>

        <div class="glossary-term">
            <div class="term">Tumbling / mobility</div>
            <div class="def">Molecular motion in solution. Rigid → powder-like. Fast/Isotropic → averaged spectrum (single g, single A).</div>
        </div>
        """, unsafe_allow_html=True)

# =====================================================================
# FOOTER
# =====================================================================
st.markdown("""
<div class="footer-text">
    <span class="foot-accent">dEPR Insight</span> &nbsp;—&nbsp; dive deeper into d-orbital EPR
    &nbsp;·&nbsp; Built for the spectroscopy community
    &nbsp;·&nbsp; Based on crystal field theory
    <br><br>
    If you use this tool, please cite:
    <span class="foot-accent">dEPR Insight v1.0</span> —
    <a href="https://deprinsight.streamlit.app" target="_blank" style="color:#4fc3f7;">deprinsight.streamlit.app</a>
</div>
""", unsafe_allow_html=True)
