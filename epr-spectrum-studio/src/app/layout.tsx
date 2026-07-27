import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPR Spectrum Studio",
  description: "dive deeper into d-orbital EPR — simulation and interpretation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@600;700&display=swap"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} h-full font-sans antialiased bg-background text-on-surface`}
      >
        {children}
      </body>
    </html>
  );
}
