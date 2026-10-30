"use client";

import { m, type MotionValue } from "motion/react";
import type { WeaponId } from "./art";

// The weapons CJ holds, drawn after the San Andreas 9mm (a black M1911), the
// sawn-off double barrel and the Micro Uzi. Every drawing faces left with the
// grip at (0, 0) and the bore along the top, so one transform aims all three.

export const GUNS: Record<WeaponId, { muzzle: [number, number]; kick: number; slide: number }> = {
  pistol: { muzzle: [-204, -52], kick: 1, slide: 15 },
  shotgun: { muzzle: [-222, -60], kick: 1.8, slide: 0 },
  uzi: { muzzle: [-192, -58], kick: 0.45, slide: 7 },
};

export function GunDrawing({ weapon, slide }: { weapon: WeaponId; slide: MotionValue<number> }) {
  return (
    <>
      {weapon === "pistol" && <Pistol slide={slide} />}
      {weapon === "shotgun" && <SawnOff />}
      {weapon === "uzi" && <Uzi slide={slide} />}
    </>
  );
}

export function GunDefs() {
  return (
    <defs>
      <linearGradient id="gun-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5a5d63" />
        <stop offset="0.35" stopColor="#2b2d31" />
        <stop offset="1" stopColor="#151618" />
      </linearGradient>
      <linearGradient id="gun-blued" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3d4048" />
        <stop offset="1" stopColor="#101114" />
      </linearGradient>
      <linearGradient id="gun-wood" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a5530" />
        <stop offset="1" stopColor="#4a2a14" />
      </linearGradient>
      <linearGradient id="gun-skin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7a5038" />
        <stop offset="1" stopColor="#4a2e1e" />
      </linearGradient>
      <pattern id="gun-check" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0 V5" stroke="rgba(0,0,0,0.45)" strokeWidth="1.4" />
      </pattern>
      <radialGradient id="gun-flash">
        <stop offset="0" stopColor="#fffbe8" />
        <stop offset="0.4" stopColor="#ffd25a" />
        <stop offset="1" stopColor="rgba(255,120,20,0)" />
      </radialGradient>
    </defs>
  );
}

/** San Andreas 9mm: a black M1911 with a moving slide. */
function Pistol({ slide }: { slide: MotionValue<number> }) {
  return (
    <g>
      {/* frame, trigger guard and grip */}
      <path d="M-178 -42 H16 V-28 H-152 Q-164 -28 -170 -34 Z" fill="url(#gun-blued)" stroke="#060607" strokeWidth="2" />
      <path d="M-104 -28 Q-110 6 -80 8 H-48 Q-40 8 -40 -4 V-28" fill="none" stroke="#1d1e21" strokeWidth="7" />
      <path d="M-66 -26 Q-70 -12 -62 -4" stroke="#0d0d0e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M-42 -32 H16 Q22 -32 24 -24 L42 66 Q44 78 32 80 H-2 Q-12 80 -14 70 Z" fill="url(#gun-wood)" stroke="#060607" strokeWidth="2" />
      <path d="M-34 -22 H14 L30 64 H-4 Z" fill="url(#gun-check)" opacity="0.8" />
      <rect x="-8" y="78" width="40" height="7" rx="1" fill="#111" />
      <path d="M12 -60 L22 -72 L27 -67 L19 -56 Z" fill="#1c1c1e" stroke="#060607" strokeWidth="1.5" />
      {/* the slide racks back on every shot */}
      <m.g style={{ x: slide }}>
        <path d="M-200 -66 H8 Q14 -66 14 -60 V-42 H-200 Q-204 -42 -204 -46 V-62 Q-204 -66 -200 -66 Z" fill="url(#gun-metal)" stroke="#060607" strokeWidth="2" />
        <path d="M-200 -62.5 H8" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {[-16, -12, -8, -4, 0, 4].map((sx) => (
          <path key={sx} d={`M${sx} -62 V-46`} stroke="#0b0b0c" strokeWidth="1.6" />
        ))}
        <rect x="-74" y="-64" width="30" height="9" fill="#09090a" />
        <rect x="-196" y="-71" width="6" height="5" fill="#0d0d0e" />
        <rect x="-4" y="-72" width="12" height="6" fill="#0d0d0e" />
        <rect x="-206" y="-57" width="4" height="9" fill="#020202" />
      </m.g>
    </g>
  );
}

/** Sawn-off double barrel with a pistol grip, as in the game. */
function SawnOff() {
  return (
    <g stroke="#060607" strokeWidth="2" strokeLinejoin="round">
      <path d="M-218 -76 H-36 V-60 H-218 Z" fill="url(#gun-metal)" />
      <path d="M-218 -60 H-36 V-44 H-218 Z" fill="url(#gun-blued)" />
      <path d="M-218 -72.5 H-40" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <rect x="-224" y="-75" width="7" height="14" rx="1" fill="#020202" />
      <rect x="-224" y="-59" width="7" height="14" rx="1" fill="#020202" />
      <path d="M-156 -44 H-58 Q-56 -34 -64 -32 H-150 Q-158 -34 -156 -44 Z" fill="url(#gun-wood)" />
      <path d="M-42 -78 H22 Q28 -78 28 -70 V-38 H-42 Z" fill="url(#gun-metal)" />
      <path d="M-30 -66 q8 -6 16 0 t16 0" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
      <circle cx="-34" cy="-46" r="4" fill="#3a3c40" />
      <path d="M-26 -38 Q-30 -12 -8 -10 H2" fill="none" stroke="#1d1e21" strokeWidth="6" />
      <path d="M-6 -42 H28 Q36 -40 38 -30 L54 62 Q56 74 44 76 H14 Q4 76 2 66 Z" fill="url(#gun-wood)" />
      <path d="M2 -30 H28 L42 58 H14 Z" fill="url(#gun-check)" opacity="0.6" stroke="none" />
    </g>
  );
}

/** Micro Uzi: boxy receiver, magazine through the grip, a cocking knob on top. */
function Uzi({ slide }: { slide: MotionValue<number> }) {
  return (
    <g stroke="#060607" strokeWidth="2" strokeLinejoin="round">
      <path d="M-196 -64 H-152 V-52 H-196 Z" fill="url(#gun-metal)" />
      <rect x="-198" y="-62" width="4" height="8" fill="#020202" />
      <rect x="-158" y="-70" width="10" height="24" rx="2" fill="#2b2d31" />
      <path d="M-152 -80 H30 Q36 -80 36 -74 V-40 H-152 Z" fill="url(#gun-blued)" />
      <path d="M-148 -76.5 H30" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <path d="M-140 -84 V-80 M-130 -84 V-80" stroke="#0b0b0c" strokeWidth="2" />
      <rect x="-56" y="-76" width="30" height="8" fill="#08080a" />
      <m.g style={{ x: slide }}>
        <rect x="-86" y="-90" width="14" height="11" rx="3" fill="#3a3c40" />
      </m.g>
      <path d="M-50 -40 Q-54 -12 -28 -10 H-14" fill="none" stroke="#1d1e21" strokeWidth="6" />
      <path d="M-16 -42 H24 L38 54 H2 Z" fill="#1c1d20" />
      <path d="M-10 -34 H20 L32 46 H6 Z" fill="url(#gun-check)" opacity="0.7" stroke="none" />
      <path d="M4 54 H36 L42 112 H12 Z" fill="#2a2b2f" />
    </g>
  );
}

export function MuzzleFlash({ at: [x, y], big }: { at: [number, number]; big: boolean }) {
  const s = big ? 1.7 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="26" fill="url(#gun-flash)" />
      <path d="M0 -6 L-46 -3 L-10 0 L-46 3 L0 6 L-6 18 L4 4 L-6 -18 Z" fill="#ffe9a6" />
      <path d="M-4 -3 L-30 0 L-4 3 Z" fill="#ffffff" />
    </g>
  );
}
