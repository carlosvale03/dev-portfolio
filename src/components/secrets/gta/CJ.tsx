"use client";

import { m, useMotionValue, useMotionValueEvent, useTime, useTransform, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { WeaponId } from "./art";
import { GUNS, GunDefs, GunDrawing, MuzzleFlash } from "./Gun";

// CJ from behind, in the over-the-shoulder aiming pose of San Andreas, built
// like the PS2 model: flat-shaded low-poly facets, a white tank top, a buzz
// cut and both arms up holding the gun beside his head. Only the upper body
// shows, rising from the bottom edge of the screen. The pose is computed in
// screen space every frame and written straight to the SVG.

interface Point {
  x: number;
  y: number;
}

export interface Pose {
  u: number;
  bx: number;
  sy: number;
  head: Point;
  /** Head tilt, degrees. */
  tilt: number;
  hand: Point;
  shoulderL: Point;
  shoulderR: Point;
  elbowL: Point;
  elbowR: Point;
  /** -1..1, which side of the head the gun is held on. */
  side: number;
  /** Gun direction, radians. */
  aim: number;
  /** Torso lean, degrees. */
  lean: number;
  /** -1..1, how far the head turns towards the cursor. */
  turn: number;
  muzzle: Point;
  scale: number;
}

const lerp = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Where everything sits for a cursor at (cx, cy) and a body centered at bx.
 * `kick` is the recoil (0..1), `lower` drops the hands for a reload or a
 * weapon swap (0..1), `breath` is the idle rise and fall (-1..1).
 */
export function cjPose(cx: number, cy: number, bx: number, weapon: WeaponId, kick: number, lower: number, breath: number): Pose {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Before the pointer has moved, he aims at the middle of the screen.
  if (cx < 0) {
    cx = vw / 2;
    cy = vh * 0.35;
  }
  const u = Math.min(300, vw * 0.42) / 300;
  const recoil = kick * GUNS[weapon].kick;
  const sy = vh - 215 * u + recoil * 4 * u + breath * 2 * u;

  // Over the shoulder, as in the game: the gun sits beside the head, on the
  // right unless the cursor is well to his left, and rises with the cursor.
  const side = smooth(bx - 220 * u, bx - 20 * u, cx) * 2 - 1;
  const lift = clamp((sy - cy) / (vh * 0.7), 0, 1);
  const aimed = {
    x: bx + side * 108 * u + clamp((cx - bx) * 0.06, -20 * u, 20 * u) - side * 8 * u * recoil,
    y: sy - 66 * u - lift * 40 * u - 12 * u * recoil,
  };
  const hand = lerp(aimed, { x: bx + 30 * u, y: sy + 40 * u }, lower);

  const shoulderL = { x: bx - 124 * u, y: sy + 24 * u };
  const shoulderR = { x: bx + 124 * u, y: sy + 24 * u };
  // The gun arm's elbow flares out past the shoulder; the other one drops a
  // little and reaches across behind the back.
  const elbow = (s: Point, out: -1 | 1) => {
    const g = ((1 + side * out) / 2) * (1 - lower);
    return { x: s.x + out * (6 + 18 * g) * u, y: s.y + (16 - 24 * g) * u };
  };

  const aim = Math.atan2(cy - hand.y, cx - hand.x);
  const scale = 0.52 * u;
  const [mx, my] = GUNS[weapon].muzzle;
  // The drawing faces left, so it is turned by aim - PI (and mirrored when pointing right).
  const rot = aim - Math.PI;
  const flipY = Math.cos(aim) > 0 ? -1 : 1;
  const muzzle = {
    x: hand.x + scale * (mx * Math.cos(rot) - my * flipY * Math.sin(rot)),
    y: hand.y + scale * (mx * Math.sin(rot) + my * flipY * Math.cos(rot)),
  };

  const turn = clamp((cx - bx) / (vw * 0.45), -1, 1);
  return {
    u,
    bx,
    sy,
    head: { x: bx + turn * 8 * u, y: sy - 94 * u + recoil * 3 * u },
    // He leans his cheek towards the gun.
    tilt: side * 4 * (1 - lower) + turn * 3,
    hand,
    shoulderL,
    shoulderR,
    elbowL: elbow(shoulderL, -1),
    elbowR: elbow(shoulderR, 1),
    side,
    aim,
    lean: clamp(turn * 5, -5, 5),
    turn,
    muzzle,
    scale,
  };
}

// --- Low-poly model ----------------------------------------------------------
// Light comes from the upper left, so surfaces facing that way are a step
// lighter, like the baked shading on the game's textures.

const SKIN = { hi: "#80553b", lit: "#6c4630", mid: "#5a3926", dark: "#462b1c", deep: "#341f14" };
const SHIRT = { hi: "#fbfaf5", lit: "#efece4", mid: "#dedad0", dark: "#cbc7bc" };
const HAIR = { hi: "#2c221b", lit: "#241b15", mid: "#1d1612", dark: "#150f0c" };
const SKIN_RAMP = [SKIN.deep, SKIN.dark, SKIN.mid, SKIN.lit, SKIN.hi];
const LIGHT = { x: -0.6, y: -0.8 };

type Coord = [number, number | "bottom"];
type Facet = { key: string; fill: string; pts: (pz: Pose) => Point[] };

/** Body point at (kx, ky) shoulder units from the shoulder line; ky = "bottom" for the screen edge. */
const at = (pz: Pose, kx: number, ky: number | "bottom") => ({
  x: pz.bx + kx * pz.u,
  y: ky === "bottom" ? window.innerHeight + 24 : pz.sy + ky * pz.u,
});

/** A facet drawn on both sides: the left with `left`, the mirror with `right`. */
function pair(key: string, left: string, right: string, list: Coord[]): Facet[] {
  return [
    { key: `${key}L`, fill: left, pts: (pz) => list.map(([x, y]) => at(pz, x, y)) },
    { key: `${key}R`, fill: right, pts: (pz) => list.map(([x, y]) => at(pz, -x, y)) },
  ];
}

// Left half of the back's outline, from the base of the neck down to the
// screen edge: traps sloping into round shoulders, lats tapering to the waist.
const BACK: Coord[] = [
  [-36, -46],
  [-60, -38],
  [-86, -26],
  [-108, -14],
  [-124, -2],
  [-138, 12],
  [-148, 34],
  [-150, 60],
  [-146, 86],
  [-138, 120],
  [-132, 160],
  [-128, "bottom"],
];

const TORSO: Facet[] = [
  {
    key: "back",
    fill: SKIN.mid,
    pts: (pz) => [...BACK, ...BACK.map(([x, y]) => [-x, y] as Coord).reverse()].map(([x, y]) => at(pz, x, y)),
  },
  ...pair("upper", SKIN.lit, SKIN.mid, [
    [-36, -46],
    [-44, -24],
    [-36, -20],
    [-26, 0],
    [-12, 10],
    [0, 12],
    [0, -46],
  ]),
  ...pair("trap", SKIN.lit, SKIN.dark, [
    [-60, -38],
    [-86, -26],
    [-108, -14],
    [-124, -2],
    [-110, 8],
    [-84, 2],
    [-62, -8],
  ]),
  ...pair("lat", SKIN.dark, SKIN.deep, [
    [-140, 14],
    [-150, 52],
    [-148, 86],
    [-140, 120],
    [-130, 128],
    [-124, 96],
    [-110, 56],
    [-120, 26],
  ]),
  // A-shirt from behind: thin straps, deep armholes, a shallow scoop
  ...pair("shirt", SHIRT.lit, SHIRT.mid, [
    [-42, -40],
    [-62, -36],
    [-72, -12],
    [-86, 14],
    [-98, 46],
    [-120, 94],
    [-129, 124],
    [-131, 160],
    [-128, "bottom"],
    [0, "bottom"],
    [0, 12],
    [-12, 10],
    [-26, 0],
    [-36, -20],
  ]),
  ...pair("blade", SHIRT.hi, SHIRT.lit, [
    [-70, -12],
    [-94, 40],
    [-64, 72],
    [-26, 58],
    [-30, 8],
    [-40, -14],
  ]),
  // the cloth pulled from the armpits by the raised arms
  ...pair("fold", SHIRT.mid, SHIRT.dark, [
    [-118, 94],
    [-62, 124],
    [-58, 134],
    [-123, 110],
  ]),
  ...pair("side", SHIRT.mid, SHIRT.dark, [
    [-129, 124],
    [-131, 160],
    [-128, "bottom"],
    [-100, "bottom"],
    [-108, 150],
    [-118, 120],
  ]),
  ...pair("strap", SHIRT.mid, SHIRT.dark, [
    [-42, -40],
    [-62, -36],
    [-72, -12],
    [-56, -12],
    [-48, -26],
  ]),
];

/**
 * A low-poly dome (a deltoid, an elbow, a fist): a fan of facets around a
 * peak nudged towards the light. `a0` turns the rim.
 */
function dome(c: Point, rx: number, ry: number, n: number, a0: number): Point[][] {
  const peak = { x: c.x + LIGHT.x * rx * 0.3, y: c.y + LIGHT.y * ry * 0.3 };
  const rim = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i * 2 * Math.PI) / n;
    return { x: c.x + Math.cos(a) * rx, y: c.y + Math.sin(a) * ry };
  });
  return rim.map((q, i) => [peak, q, rim[(i + 1) % n]]);
}

/**
 * Each dome facet shaded by how much it faces the light, kept within three
 * neighbouring tones so the facets read as one rounded form; `bias` darkens
 * the side in shadow.
 */
function domeTones(n: number, a0: number, bias = 0) {
  const ramp = bias < 0 ? SKIN_RAMP.slice(1, 4) : SKIN_RAMP.slice(2);
  return Array.from({ length: n }, (_, i) => {
    const a = a0 + ((i + 0.5) * 2 * Math.PI) / n;
    const b = clamp((Math.cos(a) * LIGHT.x + Math.sin(a) * LIGHT.y + 1) / 2, 0, 1);
    return ramp[Math.round(b * (ramp.length - 1))];
  });
}

const DOMES = {
  delt: { n: 10, a0: -Math.PI / 2 },
  elbow: { n: 6, a0: 0 },
  fist: { n: 6, a0: Math.PI / 6 },
};

/** A limb segment split along its length into a lit and a shaded half. */
function limb(a: Point, b: Point, wa: number, wb: number, side: -1 | 1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const n = Math.hypot(dx, dy) || 1;
  const nx = (-dy / n) * side;
  const ny = (dx / n) * side;
  const off = (o: Point, w: number) => ({ x: o.x + nx * w, y: o.y + ny * w });
  return {
    lit: [off(a, -wa / 2), a, b, off(b, -wb / 2)],
    shade: [a, off(a, wa / 2), off(b, wb / 2), b],
  };
}

type LocalFacet = { fill: string; pts: [number, number][]; opacity?: number };

/** A head facet on both sides, mirrored around x = 0. */
const mirrored = (left: string, right: string, list: [number, number][]): LocalFacet[] => [
  { fill: left, pts: list },
  { fill: right, pts: list.map(([x, y]) => [-x, y]) },
];

/** The back of the head around (0, 0): a buzz cut in three bands, with a low fade. */
const HEAD: LocalFacet[] = [
  ...mirrored(HAIR.hi, HAIR.mid, [
    [0, -60],
    [-22, -57],
    [-38, -48],
    [-48, -32],
    [-24, -38],
    [0, -40],
  ]),
  ...mirrored(HAIR.lit, HAIR.dark, [
    [0, -40],
    [-24, -38],
    [-48, -32],
    [-52, -12],
    [-51, 8],
    [-26, 2],
    [0, 0],
  ]),
  ...mirrored(HAIR.mid, HAIR.dark, [
    [0, 0],
    [-26, 2],
    [-51, 8],
    [-46, 24],
    [-36, 34],
    [-20, 39],
    [0, 40],
  ]),
  {
    fill: SKIN.mid,
    opacity: 0.45,
    pts: [
      [-46, 24],
      [-36, 34],
      [-20, 39],
      [0, 40],
      [20, 39],
      [36, 34],
      [46, 24],
      [34, 29],
      [0, 32],
      [-34, 29],
    ],
  },
];

const EARS: LocalFacet[] = [
  ...mirrored(SKIN.lit, SKIN.dark, [
    [-49, -10],
    [-58, -6],
    [-60, 8],
    [-55, 20],
    [-47, 22],
  ]),
  ...mirrored(SKIN.dark, SKIN.deep, [
    [-52, -4],
    [-57, -2],
    [-57, 12],
    [-52, 16],
  ]),
];

const pts = (list: Point[]) => list.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
const local = (list: [number, number][]) => list.map(([x, y]) => `${x},${y}`).join(" ");

export function CJ({
  weapon,
  px,
  py,
  bx,
  kick,
  lower,
  flash,
}: {
  weapon: WeaponId;
  px: MotionValue<number>;
  py: MotionValue<number>;
  bx: MotionValue<number>;
  kick: MotionValue<number>;
  lower: MotionValue<number>;
  flash: MotionValue<number>;
}) {
  const time = useTime();
  const breath = useTransform(time, (t) => Math.sin(t / 650));
  // The pose reads the weapon from a motion value, so a swap reaches it.
  const held = useMotionValue(weapon);
  useEffect(() => held.set(weapon), [held, weapon]);
  const pose = useTransform(() => cjPose(px.get(), py.get(), bx.get(), held.get(), kick.get(), lower.get(), breath.get()));

  const ref = useRef<SVGSVGElement>(null);
  const draw = (pz: Pose) => {
    const svg = ref.current;
    if (!svg) return;
    const q = (id: string) => svg.querySelector<SVGElement>(`[data-cj="${id}"]`);
    const setDome = (id: string, faces: Point[][]) => faces.forEach((f, i) => q(`${id}${i}`)?.setAttribute("points", pts(f)));
    const { u, hand } = pz;
    q("body")?.setAttribute("transform", `rotate(${pz.lean.toFixed(2)} ${pz.bx.toFixed(1)} ${window.innerHeight})`);

    for (const side of [-1, 1] as const) {
      const id = side < 0 ? "L" : "R";
      const sh = side < 0 ? pz.shoulderL : pz.shoulderR;
      const el = side < 0 ? pz.elbowL : pz.elbowR;
      const up = limb(sh, el, 46 * u, 36 * u, side);
      const fore = limb(el, hand, 34 * u, 24 * u, side);
      q(`up${id}-lit`)?.setAttribute("points", pts(up.lit));
      q(`up${id}-shade`)?.setAttribute("points", pts(up.shade));
      q(`fore${id}-lit`)?.setAttribute("points", pts(fore.lit));
      q(`fore${id}-shade`)?.setAttribute("points", pts(fore.shade));
      setDome(`elbow${id}`, dome(el, 18 * u, 17 * u, DOMES.elbow.n, DOMES.elbow.a0));
      setDome(`delt${id}`, dome({ x: sh.x + side * 4 * u, y: sh.y + 4 * u }, 26 * u, 38 * u, DOMES.delt.n, DOMES.delt.a0));
    }
    // The support hand cups the gun hand from the side nearer the body.
    setDome("fistB", dome({ x: hand.x - pz.side * 11 * u, y: hand.y + 8 * u }, 15 * u, 13 * u, DOMES.fist.n, DOMES.fist.a0));
    setDome("fistA", dome(hand, 16 * u, 14 * u, DOMES.fist.n, DOMES.fist.a0));

    for (const f of TORSO) q(f.key)?.setAttribute("points", pts(f.pts(pz)));

    const flipY = Math.cos(pz.aim) > 0 ? -1 : 1;
    const deg = ((pz.aim - Math.PI) * 180) / Math.PI;
    q("gun")?.setAttribute("transform", `translate(${hand.x.toFixed(1)} ${hand.y.toFixed(1)}) rotate(${deg.toFixed(2)}) scale(${pz.scale.toFixed(3)} ${(pz.scale * flipY).toFixed(3)})`);

    // A short, thick neck from the traps into the fade.
    const hs = u * 1.05;
    const top = { x: pz.head.x, y: pz.head.y + 30 * hs };
    q("neckL")?.setAttribute("points", pts([{ x: top.x - 34 * hs, y: top.y }, top, at(pz, 0, -44), at(pz, -40, -44)]));
    q("neckR")?.setAttribute("points", pts([{ x: top.x + 34 * hs, y: top.y }, top, at(pz, 0, -44), at(pz, 40, -44)]));
    q("head")?.setAttribute(
      "transform",
      `translate(${pz.head.x.toFixed(1)} ${pz.head.y.toFixed(1)}) rotate(${pz.tilt.toFixed(2)}) scale(${hs.toFixed(3)})`,
    );
    q("ears")?.setAttribute("transform", `translate(${(-pz.turn * 5).toFixed(1)} 0)`);
  };
  useMotionValueEvent(pose, "change", draw);
  useLayoutEffect(() => draw(pose.get()));

  const facet = (key: string, fill: string) => <polygon key={key} data-cj={key} fill={fill} stroke={fill} strokeWidth="0.8" strokeLinejoin="round" />;
  const domeFacets = (id: string, tones: string[]) => tones.map((tone, i) => facet(`${id}${i}`, tone));
  const localFacet = (f: LocalFacet, i: number) => (
    <polygon key={i} points={local(f.pts)} fill={f.fill} stroke={f.opacity ? "none" : f.fill} strokeWidth="0.8" strokeLinejoin="round" opacity={f.opacity} />
  );

  return (
    <m.svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[94] size-full overflow-visible"
      initial={{ y: 320 }}
      animate={{ y: 0 }}
      exit={{ y: 360 }}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
    >
      <defs>
        <GunDefs />
      </defs>
      <g data-cj="body">
        {/* The arms reach away from the camera, so they sit behind the back and head. */}
        <g data-cj="gun">
          <Weapon key={weapon} weapon={weapon} kick={kick} flash={flash} />
        </g>
        {(["L", "R"] as const).map((id) => (
          <g key={id}>
            {facet(`up${id}-lit`, id === "L" ? SKIN.hi : SKIN.lit)}
            {facet(`up${id}-shade`, id === "L" ? SKIN.mid : SKIN.dark)}
            {facet(`fore${id}-lit`, id === "L" ? SKIN.lit : SKIN.mid)}
            {facet(`fore${id}-shade`, id === "L" ? SKIN.dark : SKIN.deep)}
            {domeFacets(`elbow${id}`, domeTones(DOMES.elbow.n, DOMES.elbow.a0, id === "L" ? 0 : -0.25))}
          </g>
        ))}
        {domeFacets("fistB", domeTones(DOMES.fist.n, DOMES.fist.a0, -0.2))}
        {domeFacets("fistA", domeTones(DOMES.fist.n, DOMES.fist.a0))}

        {TORSO.map((f) => facet(f.key, f.fill))}
        {domeFacets("deltL", domeTones(DOMES.delt.n, DOMES.delt.a0))}
        {domeFacets("deltR", domeTones(DOMES.delt.n, DOMES.delt.a0, -0.25))}
        {facet("neckL", SKIN.lit)}
        {facet("neckR", SKIN.dark)}

        <g data-cj="head">
          <g data-cj="ears">{EARS.map(localFacet)}</g>
          {HEAD.map(localFacet)}
        </g>
      </g>
    </m.svg>
  );
}

/** The gun in CJ's hands. Keyed by weapon, so each one gets its own slide travel. */
function Weapon({ weapon, kick, flash }: { weapon: WeaponId; kick: MotionValue<number>; flash: MotionValue<number> }) {
  const slide = useTransform(kick, (k) => Math.min(1, k * 1.6) * GUNS[weapon].slide);
  return (
    <>
      <GunDrawing weapon={weapon} slide={slide} />
      <m.g style={{ opacity: flash }}>
        <MuzzleFlash at={GUNS[weapon].muzzle} big={weapon === "shotgun"} />
      </m.g>
    </>
  );
}
