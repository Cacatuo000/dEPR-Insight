import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dEPR Insight — EPR Simulation Suite",
  description: "Simulation and interpretation of d-orbital EPR spectra for transition metal complexes",
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
      <body
        className={`${jetbrainsMono.className} h-full antialiased bg-background text-on-surface`}
      >
        {children}
      </body>
    </html>
  );
}
