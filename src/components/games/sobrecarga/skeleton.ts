// Stick-figure skeleton: poses are joint angles, turned into joint positions
// by forward kinematics. Angles are in radians; for limbs 0 points straight
// down and positive swings towards the way the fighter faces. The torso lean
// is measured from straight up, positive leaning forward.

export interface Vec {
  x: number;
  y: number;
}

export const JOINTS = ["head", "neck", "shoulder", "hip", "elbowB", "handB", "elbowF", "handF", "kneeB", "footB", "kneeF", "footF"] as const;
export type Joint = (typeof JOINTS)[number];
export type Joints = Record<Joint, Vec>;

export interface Pose {
  lean: number;
  neck: number;
  /** Upper arm, relative to the torso. B is the far limb, F the near one. */
  uaB: number;
  /** Forearm, relative to the upper arm (positive bends the elbow forward). */
  faB: number;
  uaF: number;
  faF: number;
  /** Thigh, absolute. */
  thB: number;
  /** Shin, relative to the thigh (negative bends the knee back). */
  shB: number;
  thF: number;
  shF: number;
}

export const BONES = { torso: 50, neck: 9, head: 11, ua: 27, fa: 27, th: 38, sh: 38 };

/** Segments drawn and used as hurtboxes, back limbs first. */
export const SEGMENTS: [Joint, Joint][] = [
  ["shoulder", "elbowB"],
  ["elbowB", "handB"],
  ["hip", "kneeB"],
  ["kneeB", "footB"],
  ["hip", "neck"],
  ["hip", "kneeF"],
  ["kneeF", "footF"],
  ["shoulder", "elbowF"],
  ["elbowF", "handF"],
];

const D = Math.PI / 180;

/** Pose from degrees, the way the poses below are written. */
export function deg(p: Partial<Record<keyof Pose, number>>): Pose {
  const base: Pose = { lean: 0, neck: 0, uaB: 0, faB: 0, uaF: 0, faF: 0, thB: 0, shB: 0, thF: 0, shF: 0 };
  for (const k of Object.keys(p) as (keyof Pose)[]) base[k] = (p[k] ?? 0) * D;
  return base;
}

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

const KEYS: (keyof Pose)[] = ["lean", "neck", "uaF", "faF", "uaB", "faB", "thF", "shF", "thB", "shB"];

/** A pose from the degree arrays in mocap.ts. */
export function poseOf(a: number[]): Pose {
  const out = {} as Pose;
  KEYS.forEach((k, i) => (out[k] = a[i] * D));
  return out;
}

/**
 * Catmull-Rom between b and c (a and d are the neighbours): the limbs travel
 * along smooth curves through the keyframes, with no corner at each key.
 */
export function splinePose(a: Pose, b: Pose, c: Pose, d: Pose, t: number): Pose {
  const t2 = t * t;
  const t3 = t2 * t;
  const out = {} as Pose;
  for (const k of KEYS) {
    out[k] = 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
  }
  return out;
}

/** Samples a pose track at a fractional index, smoothly; `loop` wraps around. */
export function sampleTrack(track: Pose[], s: number, loop = false): Pose {
  const n = track.length;
  const at = (i: number) => (loop ? track[((i % n) + n) % n] : track[Math.max(0, Math.min(n - 1, i))]);
  const i = Math.floor(s);
  return splinePose(at(i - 1), at(i), at(i + 1), at(i + 2), s - i);
}

const down = (len: number, a: number): Vec => ({ x: Math.sin(a) * len, y: Math.cos(a) * len });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

/** Joint positions relative to the hip, facing right, at the given scale. */
export function fk(p: Pose, s = 1): Joints {
  const hip = { x: 0, y: 0 };
  const neck = { x: Math.sin(p.lean) * BONES.torso * s, y: -Math.cos(p.lean) * BONES.torso * s };
  const ha = p.lean + p.neck;
  const head = add(neck, { x: Math.sin(ha) * (BONES.neck + BONES.head) * s, y: -Math.cos(ha) * (BONES.neck + BONES.head) * s });
  const shoulder = { x: neck.x * 0.94, y: neck.y * 0.94 };
  const arm = (ua: number, fa: number) => {
    const a = ua - p.lean;
    const elbow = add(shoulder, down(BONES.ua * s, a));
    return [elbow, add(elbow, down(BONES.fa * s, a + fa))];
  };
  const leg = (th: number, sh: number) => {
    const knee = add(hip, down(BONES.th * s, th));
    return [knee, add(knee, down(BONES.sh * s, th + sh))];
  };
  const [elbowB, handB] = arm(p.uaB, p.faB);
  const [elbowF, handF] = arm(p.uaF, p.faF);
  const [kneeB, footB] = leg(p.thB, p.shB);
  const [kneeF, footF] = leg(p.thF, p.shF);
  return { head, neck, shoulder, hip, elbowB, handB, elbowF, handF, kneeB, footB, kneeF, footF };
}

/** Places relative joints in the world: mirrored for facing, offset to (x, y). */
export function place(j: Joints, x: number, y: number, facing: number): Joints {
  const out = {} as Joints;
  for (const k of JOINTS) out[k] = { x: x + j[k].x * facing, y: y + j[k].y };
  return out;
}

export function mixJoints(a: Joints, b: Joints, t: number): Joints {
  const out = {} as Joints;
  for (const k of JOINTS) out[k] = { x: a[k].x + (b[k].x - a[k].x) * t, y: a[k].y + (b[k].y - a[k].y) * t };
  return out;
}

/** How far below the hip the lowest foot sits, to plant a pose on the floor. */
export function footDrop(j: Joints) {
  return Math.max(j.footB.y, j.footF.y, j.kneeB.y, j.kneeF.y);
}

// --- Pose library ------------------------------------------------------------
// The guard, punches and kicks follow CMU motion capture (mocap.cs.cmu.edu),
// converted to these joint angles.

export const POSES = {
  stance: deg({ lean: 7, neck: -4, uaF: 43, faF: 165, uaB: 21, faB: 132, thF: 31, shF: -39, thB: -27, shB: 0 }),
  stance2: deg({ lean: 5, neck: 2, uaF: 49, faF: 147, uaB: 36, faB: 110, thF: 37, shF: -43, thB: -32, shB: -4 }),
  walk1: deg({ lean: 10, neck: -6, uaF: 50, faF: 96, uaB: 30, faB: 108, thF: 32, shF: -14, thB: -28, shB: -22 }),
  walk2: deg({ lean: 10, neck: -6, uaF: 50, faF: 96, uaB: 30, faB: 108, thF: -6, shF: -40, thB: 10, shB: -6 }),
  run1: deg({ lean: 26, neck: -14, uaF: -40, faF: 100, uaB: 60, faB: 80, thF: 60, shF: -40, thB: -38, shB: -70 }),
  run2: deg({ lean: 26, neck: -14, uaF: 60, faF: 80, uaB: -40, faB: 100, thF: -30, shF: -80, thB: 54, shB: -30 }),
  crouch: deg({ lean: 18, neck: -10, uaF: 40, faF: 95, uaB: 26, faB: 112, thF: 75, shF: -125, thB: 30, shB: -120 }),
  jump: deg({ lean: 6, neck: -4, uaF: 70, faF: 70, uaB: -20, faB: 60, thF: 70, shF: -100, thB: 10, shB: -90 }),
  fall: deg({ lean: 4, neck: 0, uaF: 110, faF: 30, uaB: -60, faB: 40, thF: 30, shF: -40, thB: -10, shB: -30 }),
  flip: deg({ lean: 40, neck: -20, uaF: 40, faF: 120, uaB: 40, faB: 120, thF: 120, shF: -140, thB: 110, shB: -140 }),
  block: deg({ lean: 0, neck: -16, uaF: 70, faF: 120, uaB: 58, faB: 128, thF: 18, shF: -18, thB: -18, shB: -10 }),
  roll: deg({ lean: 90, neck: -40, uaF: 60, faF: 110, uaB: 50, faB: 110, thF: 120, shF: -150, thB: 110, shB: -150 }),
  // punches
  jabWind: deg({ lean: -2, neck: 8, uaF: -4, faF: 123, uaB: -18, faB: 105, thF: 26, shF: -42, thB: 16, shB: -42 }),
  jab: deg({ lean: -2, neck: 8, uaF: 78, faF: 16, uaB: -24, faB: 102, thF: 22, shF: -38, thB: 18, shB: -45 }),
  cross: deg({ lean: 11, neck: 0, uaF: 45, faF: 136, uaB: 82, faB: 10, thF: 41, shF: -44, thB: -25, shB: -14 }),
  hookWind: deg({ lean: -6, neck: -2, uaF: -30, faF: 70, uaB: 22, faB: 116, thF: 14, shF: -16, thB: -20, shB: -10 }),
  hook: deg({ lean: 28, neck: -12, uaF: 128, faF: 12, uaB: 30, faB: 112, thF: 34, shF: -24, thB: -26, shB: -4 }),
  upperWind: deg({ lean: 22, neck: -10, uaF: 12, faF: 60, uaB: 30, faB: 112, thF: 50, shF: -70, thB: -6, shB: -60 }),
  upper: deg({ lean: 0, neck: -8, uaF: 118, faF: 48, uaB: 24, faB: 118, thF: 12, shF: -6, thB: -12, shB: -4 }),
  dashPunch: deg({ lean: 34, neck: -22, uaF: 124, faF: 0, uaB: -24, faB: 50, thF: 44, shF: -50, thB: -54, shB: -40 }),
  lowPunch: deg({ lean: 40, neck: -30, uaF: 110, faF: 0, uaB: 40, faB: 100, thF: 80, shF: -120, thB: 20, shB: -110 }),
  airPunch: deg({ lean: 20, neck: -14, uaF: 120, faF: 0, uaB: 20, faB: 100, thF: 70, shF: -100, thB: 10, shB: -90 }),
  // kicks
  kickWind: deg({ lean: -9, neck: 20, uaF: -13, faF: 110, uaB: 14, faB: 56, thF: 131, shF: -88, thB: 17, shB: -48 }),
  frontKick: deg({ lean: -12, neck: 20, uaF: -4, faF: 108, uaB: 8, faB: 66, thF: 128, shF: -14, thB: 9, shB: -43 }),
  roundWind: deg({ lean: -26, neck: 24, uaF: -10, faF: 134, uaB: 12, faB: 130, thF: 147, shF: -53, thB: 11, shB: -30 }),
  roundhouse: deg({ lean: -26, neck: 24, uaF: -8, faF: 134, uaB: 8, faB: 130, thF: 129, shF: 3, thB: 12, shB: -30 }),
  spinWind: deg({ lean: 25, neck: -12, uaF: 20, faF: 100, uaB: 70, faB: 80, thF: 16, shF: -20, thB: -40, shB: -110 }),
  spinKick: deg({ lean: 55, neck: -22, uaF: 10, faF: 60, uaB: 100, faB: 20, thF: 12, shF: -10, thB: -110, shB: -2 }),
  sweep: deg({ lean: 50, neck: -30, uaF: 120, faF: 20, uaB: 70, faB: 50, thF: 86, shF: -2, thB: 40, shB: -150 }),
  flipKick: deg({ lean: -60, neck: 20, uaF: -60, faF: 30, uaB: -40, faB: 30, thF: 170, shF: -4, thB: 40, shB: -90 }),
  airKick: deg({ lean: -20, neck: -4, uaF: 60, faF: 80, uaB: -20, faB: 70, thF: 96, shF: -2, thB: 20, shB: -110 }),
  diveKick: deg({ lean: -36, neck: 6, uaF: 40, faF: 90, uaB: -30, faB: 60, thF: 50, shF: -2, thB: 80, shB: -120 }),
  slideKick: deg({ lean: -70, neck: 40, uaF: -30, faF: 20, uaB: -60, faB: 20, thF: 82, shF: 0, thB: 60, shB: -90 }),
  // grabs and throws
  grab: deg({ lean: 22, neck: -10, uaF: 98, faF: 10, uaB: 92, faB: 16, thF: 34, shF: -24, thB: -22, shB: -8 }),
  hold: deg({ lean: 14, neck: -8, uaF: 110, faF: 60, uaB: 104, faB: 66, thF: 20, shF: -18, thB: -18, shB: -10 }),
  knee: deg({ lean: 8, neck: -10, uaF: 80, faF: 70, uaB: 76, faB: 76, thF: 118, shF: -135, thB: -4, shB: -2 }),
  throwF: deg({ lean: 40, neck: -20, uaF: 150, faF: 10, uaB: 140, faB: 10, thF: 40, shF: -30, thB: -40, shB: -10 }),
  throwB: deg({ lean: -40, neck: 30, uaF: 200, faF: 10, uaB: 190, faB: 10, thF: 10, shF: -40, thB: -20, shB: -30 }),
  // special
  charge: deg({ lean: -10, neck: -20, uaF: 150, faF: 20, uaB: 150, faB: 20, thF: 34, shF: -40, thB: -34, shB: -20 }),
  burst: deg({ lean: 30, neck: -30, uaF: 100, faF: 0, uaB: 90, faB: 0, thF: 70, shF: -90, thB: -50, shB: -10 }),
  bolt: deg({ lean: 60, neck: -50, uaF: 110, faF: 0, uaB: -40, faB: 10, thF: 20, shF: -20, thB: -70, shB: -20 }),
  // follow-through, so strikes swing past the target instead of stopping dead
  jabBack: deg({ lean: -2, neck: 8, uaF: 66, faF: 57, uaB: -28, faB: 100, thF: 19, shF: -35, thB: 17, shB: -43 }),
  crossBack: deg({ lean: 12, neck: 0, uaF: 46, faF: 149, uaB: 44, faB: 89, thF: 37, shF: -40, thB: -23, shB: -12 }),
  hookFollow: deg({ lean: 30, neck: -14, uaF: 70, faF: 30, uaB: 32, faB: 110, thF: 32, shF: -26, thB: -24, shB: -6 }),
  roundFollow: deg({ lean: -23, neck: 24, uaF: -4, faF: 134, uaB: 5, faB: 130, thF: 139, shF: -45, thB: 13, shB: -32 }),
  spinFollow: deg({ lean: 22, neck: -10, uaF: 30, faF: 100, uaB: 40, faB: 110, thF: 26, shF: -36, thB: -26, shB: -60 }),
  slamDown: deg({ lean: 70, neck: -40, uaF: 150, faF: 0, uaB: 140, faB: 10, thF: 70, shF: -90, thB: -50, shB: -20 }),
  overhead: deg({ lean: -20, neck: 20, uaF: 190, faF: 0, uaB: 180, faB: 0, thF: 20, shF: -30, thB: -20, shB: -20 }),
  axeUp: deg({ lean: -10, neck: -10, uaF: 20, faF: 90, uaB: -30, faB: 60, thF: 175, shF: -2, thB: 20, shB: -100 }),
  tackle: deg({ lean: 60, neck: -40, uaF: 110, faF: 20, uaB: 100, faB: 30, thF: 40, shF: -50, thB: -70, shB: -30 }),
  highKick: deg({ lean: -30, neck: 24, uaF: -7, faF: 128, uaB: 13, faB: 130, thF: 160, shF: -6, thB: 8, shB: -23 }),
  spinTwist: deg({ lean: 8, neck: 0, uaF: 40, faF: 120, uaB: 40, faB: 120, thF: 10, shF: -30, thB: 4, shB: -30 }),
  lowWind: deg({ lean: 30, neck: -20, uaF: 80, faF: 60, uaB: 60, faB: 70, thF: 70, shF: -130, thB: 10, shB: -120 }),
  heldHunch: deg({ lean: 40, neck: -10, uaF: 30, faF: 20, uaB: 24, faB: 24, thF: 24, shF: -34, thB: -18, shB: -24 }),
  tossDip: deg({ lean: 30, neck: -14, uaF: 60, faF: 60, uaB: 55, faB: 70, thF: 70, shF: -110, thB: 0, shB: -90 }),
  superTuck: deg({ lean: 40, neck: -30, uaF: 60, faF: 120, uaB: 60, faB: 120, thF: 130, shF: -150, thB: 120, shB: -150 }),
  superKick: deg({ lean: -40, neck: 16, uaF: 20, faF: 60, uaB: -60, faB: 40, thF: 100, shF: -2, thB: -30, shB: -70 }),
  rajadaCharge: deg({ lean: -12, neck: -10, uaF: -62, faF: 110, uaB: 14, faB: 122, thF: 42, shF: -64, thB: -32, shB: -42 }),
  cicloneCoil: deg({ lean: 30, neck: -16, uaF: 60, faF: 130, uaB: 70, faB: 130, thF: 85, shF: -135, thB: 20, shB: -125 }),
  choqueCharge: deg({ lean: 18, neck: -12, uaF: 96, faF: 8, uaB: -30, faB: 40, thF: 36, shF: -50, thB: -36, shB: -26 }),
  jumpStretch: deg({ lean: 2, neck: -8, uaF: 120, faF: 40, uaB: 70, faB: 60, thF: 18, shF: -10, thB: -14, shB: -16 }),
  jumpTuck: deg({ lean: 14, neck: -10, uaF: 60, faF: 100, uaB: 40, faB: 110, thF: 100, shF: -130, thB: 70, shB: -120 }),
  jumpFall: deg({ lean: 4, neck: -4, uaF: 80, faF: 50, uaB: -20, faB: 50, thF: 30, shF: -30, thB: -10, shB: -40 }),
  beamWind: deg({ lean: 0, neck: 2, uaF: -20, faF: 70, uaB: -16, faB: 66, thF: 30, shF: -40, thB: -28, shB: -20 }),
  beamCharge: deg({ lean: -6, neck: 6, uaF: -41, faF: 45, uaB: -38, faB: 40, thF: 38, shF: -58, thB: -34, shB: -30 }),
  beamFire: deg({ lean: 14, neck: -4, uaF: 100, faF: 0, uaB: 96, faB: 6, thF: 50, shF: -48, thB: -48, shB: -6 }),
  beamFizzle: deg({ lean: 24, neck: -16, uaF: 30, faF: 20, uaB: 24, faB: 24, thF: 24, shF: -30, thB: -20, shB: -20 }),
  beamGuard: deg({ lean: 20, neck: -12, uaF: 104, faF: 96, uaB: 84, faB: 118, thF: 36, shF: -46, thB: -42, shB: -8 }),
  // getting hit
  flinchHigh: deg({ lean: -24, neck: 30, uaF: 20, faF: 60, uaB: -10, faB: 60, thF: 20, shF: -20, thB: -20, shB: -10 }),
  flinchLow: deg({ lean: 46, neck: -10, uaF: -10, faF: 20, uaB: -20, faB: 20, thF: 30, shF: -40, thB: -24, shB: -20 }),
  stagger: deg({ lean: -12, neck: 24, uaF: -50, faF: 30, uaB: -70, faB: 20, thF: 10, shF: -10, thB: -24, shB: -24 }),
  getup: deg({ lean: 50, neck: -20, uaF: 0, faF: 20, uaB: -10, faB: 20, thF: 90, shF: -130, thB: 30, shB: -120 }),
  taunt: deg({ lean: -6, neck: -12, uaF: 160, faF: 40, uaB: 20, faB: 140, thF: 14, shF: -6, thB: -14, shB: -4 }),
  dead: deg({ lean: -90, neck: 10, uaF: 140, faF: 20, uaB: 120, faB: 30, thF: -80, shF: -10, thB: -100, shB: -20 }),
} satisfies Record<string, Pose>;

export type PoseId = keyof typeof POSES;
