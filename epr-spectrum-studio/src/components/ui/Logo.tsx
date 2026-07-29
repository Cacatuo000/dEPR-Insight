import type React from "react";

interface LogoProps {
  size?: number;
  iconSize?: number;
  className?: string;
}

export function Logo({ size = 36, iconSize = 20, className = "" }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-surface-container-lowest to-surface-container border border-outline-variant text-primary-fixed-dim rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 56 56" fill="none" aria-hidden="true">
        {/* Baseline */}
        <line x1="4" y1="28" x2="52" y2="28" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        {/* Tick marks on baseline */}
        <line x1="17" y1="26" x2="17" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        <line x1="28" y1="26" x2="28" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        <line x1="39" y1="26" x2="39" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
        {/* Absorption envelope (faint behind) */}
        <path
          d="M 4 28 C 8 28, 14 22, 17 22 C 21 22, 24 28, 28 28 C 32 28, 35 34, 39 34 C 42 34, 48 28, 52 28"
          stroke="currentColor" strokeWidth="0.8" opacity="0.2" fill="none" strokeLinecap="round"
        />
        {/* First-derivative EPR signal */}
        <path
          d="M 4 28 C 9 28, 13 7, 17 7 C 22 7, 25 28, 28 28 C 31 28, 34 49, 39 49 C 43 49, 47 28, 52 28"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
        />
        {/* Data points at extrema */}
        <circle cx="17" cy="7" r="2.2" fill="currentColor" />
        <circle cx="39" cy="49" r="2.2" fill="currentColor" />
      </svg>
    </div>
  );
}
