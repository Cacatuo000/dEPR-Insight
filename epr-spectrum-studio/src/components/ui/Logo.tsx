import { useId } from "react";

interface LogoProps {
  /** Chip size in px (width = height) */
  size?: number;
  /** Size of the SVG drawing inside the chip */
  iconSize?: number;
  className?: string;
}

/**
 * dEPR Insight logo: a d_z2 orbital (lobes along z = + phase, torus in the
 * xy-plane = − phase) nuanced in the background, with the unpaired electron
 * (spin-up) in the upper lobe and the classic EPR first-derivative
 * lineshape in front.
 */
export function Logo({ size = 36, iconSize = 20, className = "" }: LogoProps) {
  // Unique id per instance (the component is used twice on the page)
  const lobeId = useId().replace(/:/g, "");

  return (
    <div
      className={`logo-chip flex items-center justify-center border border-primary/30 text-primary ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <defs>
          {/* Single teardrop lobe pointing up, reused for top and bottom.
              The base stays slightly wide so the lobes merge into the torus. */}
          <path
            id={lobeId}
            d="M 24 28 C 22 24 21 19 21 15 C 21 10 24 7 28 7 C 32 7 35 10 35 15 C 35 19 34 24 32 28 Z"
          />
        </defs>

        {/* d_z2 orbital (nuanced background) */}
        <g opacity="0.3">
          {/* negative phase: torus in the xy-plane (filled lens behind the lobes) */}
          <ellipse cx="28" cy="28" rx="12" ry="4" fill="#ffafd3" />
          {/* positive phase: two lobes along the z axis, emerging from the torus */}
          <g fill="#8ed5ff">
            <use href={`#${lobeId}`} />
            <use href={`#${lobeId}`} transform="rotate(180 28 28)" />
          </g>
        </g>

        {/* Unpaired electron (spin-up) in the upper lobe — subtle */}
        <g opacity="0.8">
          <circle cx="28" cy="15" r="4" fill="#ffffff" opacity="0.12" />
          <circle cx="28" cy="15" r="1.9" fill="#ffffff" />
          <path
            d="M 28 13 L 28 9 M 26.3 10.7 L 28 8.8 L 29.7 10.7"
            stroke="#ffffff"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* EPR first-derivative signal */}
        <path
          d="M 6 28 C 10 28 12 12 18 12 C 24 12 22 28 28 28 C 34 28 32 44 38 44 C 44 44 46 28 50 28"
          stroke="#dae2fd"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
