import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://depr-insight.pages.dev"),
  title: {
    default: "dEPR Insight — EPR Simulation Suite",
    template: "%s — dEPR Insight",
  },
  description:
    "Free online EPR simulation suite for transition metal complexes. Compute g-factors, hyperfine splitting, zero-field splitting, and powder spectra for d-orbital systems. Axial, rhombic, and isotropic symmetry supported.",
  keywords: [
    "EPR simulation",
    "electron paramagnetic resonance",
    "g-factor calculation",
    "hyperfine coupling",
    "zero-field splitting",
    "transition metal complexes",
    "powder spectrum",
    "d-orbital",
    "spin Hamiltonian",
    "spectroscopy",
    "inorganic chemistry",
  ],
  authors: [{ name: "Sharon Bernardi" }],
  creator: "Sharon Bernardi",
  publisher: "Sharon Bernardi",
  robots: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://depr-insight.pages.dev",
    siteName: "dEPR Insight",
    title: "dEPR Insight — EPR Simulation Suite for Transition Metal Complexes",
    description:
      "Simulation and interpretation of d-orbital EPR spectra. Compute g-factors, hyperfine splitting, and powder spectra for paramagnetic metal complexes.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "dEPR Insight — EPR Simulation Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "dEPR Insight — EPR Simulation Suite",
    description:
      "Free online simulation and interpretation of EPR spectra for transition metal complexes.",
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: "https://depr-insight.pages.dev",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <JsonLd />
      </head>
      <body
        className={`${jetbrainsMono.className} h-full antialiased bg-background text-on-surface`}
      >
        <noscript>
          <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#cbd5e1", background: "#0f172a", minHeight: "100vh", textAlign: "center" }}>
            <h1 style={{ color: "#dbfcff", fontSize: "2rem", marginBottom: "1rem" }}>dEPR Insight</h1>
            <p style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
              EPR Simulation Suite for transition metal complexes.
              Compute g-factors, hyperfine splitting, zero-field splitting, and powder spectra
              for d-orbital systems with axial, rhombic, or isotropic symmetry.
            </p>
            <p style={{ marginTop: "2rem", color: "#64748b" }}>
              This application requires JavaScript to run simulations.
              Please enable JavaScript in your browser settings.
            </p>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
