import type { ReactNode } from "react";

// Drawings for the San Andreas cheats: HUD weapon icons, the Rhino tank, the
// Police Maverick and the shuriken. All decorative.

export type WeaponId = "pistol" | "shotgun" | "uzi";
export type HudIcon = WeaponId | "fist" | "tank" | "katana";

const ink = "#111";

export function WeaponIcon({ id, className = "" }: { id: HudIcon; className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
      <g fill="#e8e4d8" stroke={ink} strokeWidth="2.5" strokeLinejoin="round">
        {id === "fist" && (
          <path d="M18 14c0-3 2-5 5-5h17c3 0 5 2 5 5v4c3 0 5 2 5 5v4c0 4-3 7-7 7H25c-4 0-7-3-7-7z M24 9v8 M31 9v8 M38 9v8" />
        )}
        {id === "pistol" && <path d="M8 12h44v8H30l-3 4h-6l-3 12h-9l3-14H8z M28 24c0 3 2 4 4 4" />}
        {id === "shotgun" && <path d="M4 14h40l6-3h10v7H48l-6 2H28l-6 4-4 12H9l5-14H4z" />}
        {id === "uzi" && <path d="M10 10h38v9H36v18h-8V25l-4 2v9h-7V19H10z M48 13h8v3h-8" />}
        {id === "tank" && <path d="M6 26h52l-4 8H10z M14 18h30l6 8H10z M24 12h14v6H24z M38 14h22v3H38z" />}
        {id === "katana" && <path d="M6 33L44 9c4-2 8-3 12-3-1 4-3 7-6 9L14 37z M14 27l6 6 M9 30l5 5" />}
      </g>
    </svg>
  );
}

// --- Rhino -----------------------------------------------------------------
// The San Andreas Rhino: a sand-colored, Abrams-like tank with a wedge hull,
// a low angular turret and a long gun, flat-shaded like the low-poly model in
// the game. Side view, facing right, in a 340 x 150 box.

const SAND = { top: "#c4b089", side: "#a28f68", dark: "#7c6c4d", deep: "#5a4d37", line: "#3b3224" };

/** Road wheels along the track: [x, radius]. */
export const WHEELS: [number, number][] = [
  [54, 17],
  [94, 17],
  [134, 17],
  [174, 17],
  [214, 17],
  [254, 17],
  [294, 17],
];

export function Wheel({ r }: { r: number }) {
  return (
    <>
      <circle r={r} fill="#34312c" stroke="#1b1916" strokeWidth="2" />
      <circle r={r * 0.62} fill={SAND.dark} stroke={SAND.line} strokeWidth="1.5" />
      <circle r={r * 0.24} fill={SAND.deep} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={Math.cos((a * Math.PI) / 180) * r * 0.42}
          cy={Math.sin((a * Math.PI) / 180) * r * 0.42}
          r="1.6"
          fill={SAND.line}
        />
      ))}
    </>
  );
}

/** Hull and tracks. The road wheels come in through `wheels` so they can spin. */
export function RhinoHull({ wheels }: { wheels: ReactNode }) {
  return (
    <svg viewBox="0 0 340 150" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="rhino-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SAND.side} />
          <stop offset="1" stopColor={SAND.dark} />
        </linearGradient>
      </defs>
      {/* track run with links */}
      <path d="M26 100 H316 Q338 102 338 120 Q338 142 316 146 H34 Q10 142 10 120 Q10 102 26 100 Z" fill="#2a2722" stroke="#14120f" strokeWidth="2" />
      <path d="M32 145 H318" stroke="#4b463d" strokeWidth="4" strokeDasharray="5 4" />
      <path d="M30 101 H316" stroke="#4b463d" strokeWidth="3" strokeDasharray="5 4" />
      <g transform="translate(24 116)">
        <circle r="13" fill="#34312c" stroke="#1b1916" strokeWidth="2" />
        <circle r="7" fill={SAND.dark} />
      </g>
      <g transform="translate(322 114)">
        <circle r="11" fill="#34312c" stroke="#1b1916" strokeWidth="2" />
        <circle r="6" fill={SAND.dark} />
      </g>
      {wheels}
      {/* fender skirt */}
      <path d="M8 88 H332 L340 98 H4 Z" fill={SAND.deep} stroke={SAND.line} strokeWidth="1.5" />
      {/* hull side, deck and the sloped glacis */}
      <path d="M16 58 H296 L334 88 H8 Z" fill="url(#rhino-side)" stroke={SAND.line} strokeWidth="1.5" />
      <path d="M24 49 H284 L296 58 H16 Z" fill={SAND.top} stroke={SAND.line} strokeWidth="1.5" />
      <path d="M284 49 L296 58 L334 88 L326 88 Z" fill={SAND.top} opacity="0.55" />
      <path d="M16 58 L8 88" stroke={SAND.line} strokeWidth="2" />
      {/* stowage boxes, rear grille, headlight */}
      <rect x="62" y="64" width="46" height="13" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.2" />
      <rect x="118" y="64" width="38" height="13" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.2" />
      <path d="M24 64 V82 M30 64 V82 M36 64 V82 M42 64 V82" stroke={SAND.line} strokeWidth="1.5" />
      <rect x="318" y="76" width="9" height="6" rx="1" fill="#e9e2c4" stroke={SAND.line} />
      <path d="M170 82 H250" stroke={SAND.line} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

/** Turret around its ring at (0, 0), in a -120..120 x -130..10 box. The gun is separate. */
export function RhinoTurret() {
  return (
    <svg viewBox="-120 -130 240 140" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <path d="M-88 -30 L-95 -128" stroke="#2a251c" strokeWidth="1.6" />
      <path d="M-112 -22 H-98 V-4 H-112 Z M-112 -14 H-98" fill="none" stroke={SAND.line} strokeWidth="2" />
      <path d="M-98 0 L-102 -22 L-62 -31 H50 L84 -15 L90 0 Z" fill={SAND.side} stroke={SAND.line} strokeWidth="1.5" />
      <path d="M-102 -22 L-62 -31 H50 L84 -15 L78 -13 L48 -26 H-60 L-98 -18 Z" fill={SAND.top} stroke={SAND.line} strokeWidth="1" />
      <path d="M-98 0 L-102 -22" stroke={SAND.line} strokeWidth="2" />
      <path d="M-60 -10 H40" stroke={SAND.line} strokeWidth="1" opacity="0.5" />
      {/* commander cupola with its machine gun, loader hatch */}
      <path d="M-44 -31 V-42 H-14 V-31" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.5" />
      <path d="M-40 -42 V-46 H-18 V-42" fill={SAND.side} stroke={SAND.line} strokeWidth="1.2" />
      <path d="M-30 -45 H8" stroke="#2a251c" strokeWidth="3" />
      <rect x="4" y="-36" width="24" height="5" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.2" />
      {/* smoke grenade launchers */}
      {[58, 66, 74].map((x) => (
        <circle key={x} cx={x} cy={-20 + (x - 58) * 0.25} r="3" fill={SAND.deep} stroke={SAND.line} strokeWidth="1" />
      ))}
      {/* gun mantlet */}
      <path d="M78 -22 L96 -20 V-5 L80 -3 Z" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.5" />
    </svg>
  );
}

/** The long gun, drawn from its trunnion at the left edge, pointing right (186 x 18). */
export function RhinoGun() {
  return (
    <svg viewBox="0 -9 186 18" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <path d="M0 -4.5 H176 V4.5 H0 Z" fill={SAND.side} stroke={SAND.line} strokeWidth="1.2" />
      <path d="M0 -4.5 H176" stroke={SAND.top} strokeWidth="1.4" />
      <rect x="98" y="-7" width="24" height="14" rx="2" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.2" />
      <rect x="172" y="-6" width="12" height="12" rx="1" fill={SAND.dark} stroke={SAND.line} strokeWidth="1.2" />
    </svg>
  );
}

// --- Police Maverick -------------------------------------------------------
// The SAPD helicopter: a JetRanger-style Maverick, black body with a cream
// roof line, tinted glass, skids and a nose searchlight. Side view facing
// right, in a 360 x 170 box.

export function Maverick() {
  return (
    <svg viewBox="0 0 360 170" className="size-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="mav-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ded6bb" />
          <stop offset="0.42" stopColor="#cfc6a8" />
          <stop offset="0.43" stopColor="#1b1c1f" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id="mav-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7f9bb2" />
          <stop offset="1" stopColor="#1f2c38" />
        </linearGradient>
      </defs>
      {/* main rotor: a faint disc and two blades flicking past */}
      <ellipse cx="190" cy="28" rx="170" ry="5" fill="rgba(25,25,28,0.16)" />
      <path className="gta-blade" d="M22 28 H358" stroke="#18181a" strokeWidth="3.5" strokeLinecap="round" />
      <path className="gta-blade gta-blade-b" d="M22 28 H358" stroke="#18181a" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="185" y="28" width="10" height="20" fill="#1b1c1f" />
      <rect x="176" y="24" width="28" height="7" rx="3" fill="#2b2c30" />
      {/* tail boom, fin, stabilizer and tail rotor */}
      <path d="M186 66 L40 74 L40 82 L186 92 Z" fill="#141416" />
      <path d="M186 66 L40 74 L40 76.5 L186 71 Z" fill="#cfc6a8" />
      <path d="M26 38 H44 L54 78 L34 82 Z" fill="#141416" />
      <path d="M62 80 H88 L86 85 H60 Z" fill="#141416" />
      <g transform="translate(38 58)">
        <circle r="17" fill="rgba(25,25,28,0.18)" />
        <path className="gta-rotor-tail" d="M0 -17 V17" stroke="#18181a" strokeWidth="3" strokeLinecap="round" />
        <circle r="3" fill="#2b2c30" />
      </g>
      {/* engine cowling */}
      <path d="M190 62 Q196 42 236 42 L268 48 L268 60 Z" fill="#d8cfb3" stroke="#151517" strokeWidth="1.5" />
      <rect x="214" y="47" width="22" height="6" rx="2" fill="#2a2b2e" />
      {/* cabin */}
      <path
        d="M182 104 L186 62 Q210 50 262 52 Q300 56 318 86 Q324 100 306 108 L214 114 Q190 114 182 104 Z"
        fill="url(#mav-body)"
        stroke="#0a0a0b"
        strokeWidth="2"
      />
      {/* windshield and side windows */}
      <path d="M266 56 Q298 60 314 86 L298 92 Q284 74 262 72 Z" fill="url(#mav-glass)" stroke="#0a0a0b" strokeWidth="1.5" />
      <path d="M272 62 Q290 66 302 80" stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none" />
      <rect x="206" y="60" width="24" height="22" rx="5" fill="url(#mav-glass)" stroke="#0a0a0b" strokeWidth="1.5" />
      <rect x="236" y="58" width="24" height="26" rx="5" fill="url(#mav-glass)" stroke="#0a0a0b" strokeWidth="1.5" />
      <path d="M233 58 V110 M204 86 H262" stroke="#050506" strokeWidth="1.2" />
      {/* SAPD livery */}
      <text x="196" y="103" fontSize="12" fontWeight="900" fill="#f2efe6" letterSpacing="1.5" fontFamily="Arial, sans-serif">
        SAPD
      </text>
      <circle cx="252" cy="98" r="7" fill="#c9a443" stroke="#0a0a0b" strokeWidth="1" />
      <path d="M252 93 l1.5 3.2 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3.1 1.7.7-3.4-2.5-2.3 3.4-.4z" fill="#0a0a0b" />
      {/* searchlight */}
      <rect x="282" y="108" width="14" height="8" rx="2" fill="#2a2b2e" />
      <circle cx="292" cy="116" r="4.5" fill="#fffbe6" />
      {/* skids */}
      <path d="M204 112 L198 134 M266 110 L272 134" stroke="#1c1c1f" strokeWidth="4" strokeLinecap="round" />
      <path d="M178 135 H292 Q304 135 308 126" stroke="#1c1c1f" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Where the searchlight sits inside the Maverick box (facing right). */
export const SEARCHLIGHT = { x: 292, y: 117 };
export const MAVERICK = { w: 360, h: 170 };

export function Shuriken({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-20 -20 40 40" className={className} aria-hidden="true">
      <path
        d="M0 -19 L5 -5 L19 0 L5 5 L0 19 L-5 5 L-19 0 L-5 -5 Z"
        fill="#c9ccd1"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle r="4" fill={ink} />
    </svg>
  );
}
