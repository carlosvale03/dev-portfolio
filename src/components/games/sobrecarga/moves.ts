import type { Joint, PoseId } from "./skeleton";

// Every attack is data: keyframed poses, when it can hit, what it does on
// contact and which moves it can be cancelled into. Times are milliseconds.

export type HitLevel = "high" | "mid" | "low";
/** How a keyframe is reached: snap overshoots a little, like a real strike. */
export type Ease = "snap" | "out" | "io" | "lin";

export interface HitSpec {
  joint: Joint;
  /** Hitbox radius, world units (scaled by the fighter). */
  r: number;
  dmg: number;
  /** Knockback: forward and up (negative y is up), units/s. */
  kb: [number, number];
  /** Hitstun on a grounded opponent, ms. */
  stun: number;
  level: HitLevel;
  /** Sends the opponent into the ragdoll (juggle or knockdown). */
  launch?: boolean;
  knockdown?: boolean;
  wallBounce?: boolean;
  groundBounce?: boolean;
  /** Freeze frames on contact, ms. */
  stop: number;
  heavy?: boolean;
  shake?: number;
  /** Electric hit: sparks are red arcs. */
  zap?: boolean;
}

export interface Move {
  frames: [PoseId, number, Ease?][];
  /** Total length, ms. */
  total: number;
  active: [number, number];
  hit?: HitSpec;
  /** From this time on, the move hits with this instead (a finisher). */
  final?: [number, HitSpec];
  /** Times at which the same target can be hit again (multi-hit strings). */
  rehit?: number[];
  /** Velocity set at the start: forward, up. */
  vel?: [number, number];
  /** Forward speed during the active frames. */
  lunge?: number;
  /** After this time the next move in a chain can start. */
  cancel?: number;
  air?: boolean;
  /** Hangs in the air (no gravity) while it lasts. */
  float?: boolean;
  /** Gravity scale through the active frames: a slow, floating rise. */
  lowGravity?: number;
  /** At this time, drive straight down at this speed (an axe-kick finish). */
  dive?: [number, number];
  /** Dash to (and stay on) the nearest enemy until this time, this far from it. */
  homeIn?: [number, number];
  /** When `vel` kicks in, ms (default: at the start). */
  velAt?: number;
  /** Lands the move when the fighter touches the floor. */
  untilLand?: boolean;
  grab?: boolean;
  armor?: boolean;
  invuln?: [number, number];
  whoosh?: "light" | "heavy";
  /** Full turns the body spins through during the move (negative: backwards). */
  spins?: number;
  /** When the spin completes, ms (defaults to the end of the active frames). */
  spinEnd?: number;
  /** Window in which the body is turned away from the target: a spinning move. */
  turn?: [number, number];
  /**
   * Plays a captured motion (mocap.ts) instead of the keyframes: its peak
   * lands at `peakAt` ms, and the leg straightens a little there.
   */
  track?: { name: "frontKick" | "roundhouse" | "highKick"; peakAt: number };
  /** Slow-motion special: its name shows on screen while time crawls. */
  special?: { pt: string; en: string };
}

const flurry = (from: number, count: number, gap: number): [PoseId, number, Ease][] =>
  Array.from({ length: count }, (_, i) => [i % 2 ? "cross" : "jab", from + gap * (i + 1), "snap"] as [PoseId, number, Ease]);
const beats = (from: number, count: number, gap: number) => Array.from({ length: count }, (_, i) => from + gap * i);

export const MOVES = {
  jab: {
    frames: [["jabWind", 30, "io"], ["jab", 80, "snap"], ["jab", 140, "lin"], ["jabBack", 190, "io"], ["stance", 240, "io"]],
    total: 240, active: [60, 140], cancel: 125, lunge: 140, whoosh: "light",
    hit: { joint: "handF", r: 15, dmg: 5, kb: [180, 0], stun: 260, level: "high", stop: 50 },
  },
  cross: {
    frames: [["jabWind", 35, "io"], ["cross", 90, "snap"], ["cross", 155, "lin"], ["crossBack", 210, "io"], ["stance", 265, "io"]],
    total: 265, active: [70, 155], cancel: 145, lunge: 180, whoosh: "light",
    hit: { joint: "handB", r: 16, dmg: 7, kb: [240, 0], stun: 300, level: "high", stop: 60 },
  },
  hook: {
    frames: [["hookWind", 100, "io"], ["hook", 165, "snap"], ["hook", 225, "lin"], ["hookFollow", 290, "io"], ["stance", 390, "io"]],
    total: 390, active: [130, 225], cancel: 260, lunge: 200, whoosh: "heavy",
    hit: { joint: "handF", r: 18, dmg: 11, kb: [520, -320], stun: 420, level: "high", stop: 90, launch: true, heavy: true, shake: 6 },
  },
  uppercut: {
    frames: [["upperWind", 100, "io"], ["upper", 165, "snap"], ["upper", 250, "lin"], ["stance", 390, "io"]],
    total: 390, active: [125, 240], cancel: 270, lunge: 90, vel: [60, -80], whoosh: "heavy",
    hit: { joint: "handF", r: 20, dmg: 10, kb: [120, -980], stun: 400, level: "mid", stop: 90, launch: true, heavy: true, shake: 6 },
  },
  dashPunch: {
    frames: [["jabWind", 60, "io"], ["dashPunch", 150, "snap"], ["dashPunch", 300, "lin"], ["jabBack", 380, "io"], ["stance", 440, "io"]],
    total: 440, active: [100, 300], lunge: 620, vel: [200, -120], whoosh: "heavy",
    hit: { joint: "handF", r: 19, dmg: 13, kb: [760, -260], stun: 420, level: "high", stop: 100, launch: true, wallBounce: true, heavy: true, shake: 8 },
  },
  airPunch: {
    frames: [["jump", 40, "io"], ["airPunch", 90, "snap"], ["airPunch", 220, "lin"], ["fall", 320, "io"]],
    total: 320, active: [60, 220], air: true, cancel: 200, whoosh: "light",
    hit: { joint: "handF", r: 16, dmg: 6, kb: [260, -260], stun: 300, level: "high", stop: 60 },
  },
  frontKick: {
    frames: [["kickWind", 75, "io"], ["frontKick", 125, "snap"], ["frontKick", 190, "lin"], ["kickWind", 245, "io"], ["stance", 315, "io"]],
    total: 315, active: [100, 190], cancel: 180, lunge: 110, whoosh: "light", track: { name: "frontKick", peakAt: 128 },
    hit: { joint: "footF", r: 18, dmg: 7, kb: [320, 0], stun: 340, level: "mid", stop: 60 },
  },
  roundhouse: {
    frames: [["roundWind", 90, "io"], ["roundhouse", 145, "snap"], ["roundhouse", 215, "lin"], ["roundFollow", 285, "io"], ["stance", 370, "io"]],
    total: 370, active: [120, 215], cancel: 235, lunge: 130, whoosh: "heavy", track: { name: "roundhouse", peakAt: 150 },
    hit: { joint: "footF", r: 20, dmg: 10, kb: [420, -160], stun: 400, level: "high", stop: 80, heavy: true, shake: 4 },
  },
  spinKick: {
    frames: [["spinTwist", 70, "io"], ["spinWind", 140, "io"], ["spinKick", 195, "snap"], ["spinKick", 280, "lin"], ["spinTwist", 335, "io"], ["stance", 450, "io"]],
    total: 450, active: [170, 280], lunge: 170, turn: [55, 325], whoosh: "heavy",
    hit: { joint: "footB", r: 22, dmg: 15, kb: [900, -300], stun: 500, level: "mid", stop: 130, launch: true, wallBounce: true, heavy: true, shake: 10 },
  },
  sweep: {
    frames: [["lowWind", 70, "io"], ["sweep", 150, "snap"], ["sweep", 230, "lin"], ["lowWind", 320, "io"], ["stance", 420, "io"]],
    total: 420, active: [105, 230], lunge: 90, whoosh: "light",
    hit: { joint: "footF", r: 22, dmg: 8, kb: [180, -420], stun: 400, level: "low", stop: 70, launch: true, knockdown: true },
  },
  /** Up + kick: a kick to the head that pops them up for a juggle. */
  highKick: {
    frames: [["roundWind", 85, "io"], ["highKick", 145, "snap"], ["highKick", 215, "lin"], ["roundFollow", 290, "io"], ["stance", 390, "io"]],
    total: 390, active: [120, 215], cancel: 270, lunge: 100, whoosh: "heavy", track: { name: "highKick", peakAt: 150 },
    hit: { joint: "footF", r: 21, dmg: 10, kb: [180, -780], stun: 420, level: "high", stop: 90, launch: true, heavy: true, shake: 6 },
  },
  flipKick: {
    frames: [["crouch", 60, "io"], ["flipKick", 170, "snap"], ["flip", 360, "out"], ["fall", 480, "io"]],
    total: 480, active: [80, 260], vel: [80, -760], air: true, spins: -1, whoosh: "heavy",
    hit: { joint: "footF", r: 20, dmg: 11, kb: [120, -900], stun: 400, level: "mid", stop: 90, launch: true, heavy: true, shake: 6 },
  },
  airKick: {
    frames: [["jump", 40, "io"], ["airKick", 100, "snap"], ["airKick", 360, "lin"], ["fall", 440, "io"]],
    total: 440, active: [70, 360], air: true, whoosh: "light",
    hit: { joint: "footF", r: 19, dmg: 9, kb: [420, -160], stun: 340, level: "high", stop: 70, launch: true },
  },
  diveKick: {
    frames: [["jump", 50, "io"], ["diveKick", 120, "snap"], ["diveKick", 900, "lin"]],
    total: 900, active: [80, 900], vel: [560, 900], air: true, untilLand: true, whoosh: "heavy",
    hit: { joint: "footF", r: 21, dmg: 12, kb: [260, 620], stun: 400, level: "high", stop: 100, launch: true, groundBounce: true, heavy: true, shake: 8 },
  },
  slideKick: {
    frames: [["crouch", 50, "io"], ["slideKick", 120, "snap"], ["slideKick", 380, "lin"], ["crouch", 460, "io"], ["stance", 540, "io"]],
    total: 540, active: [90, 380], lunge: 640, whoosh: "heavy",
    hit: { joint: "footF", r: 20, dmg: 10, kb: [300, -520], stun: 420, level: "low", stop: 80, launch: true, knockdown: true },
  },
  grab: {
    frames: [["stance", 30, "io"], ["grab", 110, "snap"], ["grab", 190, "lin"], ["stance", 330, "io"]],
    total: 330, active: [80, 190], grab: true, lunge: 110,
  },
  /** Running grab: a tackle straight into a throw. */
  tackle: {
    frames: [["grab", 60, "io"], ["tackle", 140, "snap"], ["tackle", 320, "lin"], ["stance", 460, "io"]],
    total: 460, active: [70, 320], grab: true, lunge: 640, whoosh: "heavy",
  },
  knee: {
    frames: [["hold", 40, "io"], ["knee", 105, "snap"], ["hold", 230, "io"]],
    total: 230, active: [80, 140],
    hit: { joint: "kneeF", r: 24, dmg: 6, kb: [0, 0], stun: 900, level: "mid", stop: 70 },
  },
  throwF: {
    frames: [["hold", 80, "io"], ["grab", 160, "io"], ["throwF", 230, "snap"], ["throwF", 320, "lin"], ["stance", 480, "io"]],
    total: 480, active: [210, 240], whoosh: "heavy",
    hit: { joint: "handF", r: 40, dmg: 12, kb: [980, -620], stun: 400, level: "mid", stop: 90, launch: true, wallBounce: true, heavy: true, shake: 8 },
  },
  throwB: {
    frames: [["hold", 60, "io"], ["overhead", 200, "io"], ["throwB", 260, "snap"], ["throwB", 340, "lin"], ["stance", 500, "io"]],
    total: 500, active: [240, 270], whoosh: "heavy",
    hit: { joint: "handF", r: 60, dmg: 14, kb: [-900, -760], stun: 400, level: "mid", stop: 100, launch: true, wallBounce: true, heavy: true, shake: 10 },
  },
  overload: {
    frames: [["charge", 520, "io"], ["burst", 600, "snap"], ["burst", 820, "lin"], ["stance", 1000, "io"]],
    total: 1000, active: [560, 620], invuln: [0, 700], armor: true,
    hit: { joint: "hip", r: 460, dmg: 34, kb: [1100, -900], stun: 600, level: "mid", stop: 160, launch: true, wallBounce: true, heavy: true, shake: 18, zap: true },
  },

  // --- Slow-motion specials (Q, W, E) ------------------------------------------
  /** Q: a storm of punches that ends in a launching uppercut. */
  /**
   * Q: dash in, a storm of punches, a beat to wind back, then one straight
   * punch that sends them across the arena.
   */
  rajada: {
    frames: [["rajadaCharge", 150, "io"], ...flurry(150, 8, 45), ["rajadaCharge", 610, "io"], ["dashPunch", 680, "snap"], ["dashPunch", 820, "lin"], ["jabBack", 900, "io"], ["stance", 1020, "io"]],
    total: 1020, active: [170, 760], homeIn: [630, 60], rehit: [...beats(195, 8, 45), 640],
    hit: { joint: "handF", r: 26, dmg: 3, kb: [40, -40], stun: 520, level: "high", stop: 28, zap: true },
    final: [630, { joint: "handF", r: 44, dmg: 14, kb: [1500, -220], stun: 500, level: "mid", stop: 140, launch: true, wallBounce: true, heavy: true, shake: 14, zap: true }],
    special: { pt: "RAJADA", en: "BARRAGE" },
  },
  /** Q in the air: hangs there punching, then smashes down. */
  rajadaAr: {
    frames: [["airPunch", 70, "io"], ...flurry(70, 6, 55), ["overhead", 480, "io"], ["slamDown", 560, "snap"], ["fall", 760, "io"]],
    total: 760, active: [90, 600], float: true, air: true, rehit: [...beats(130, 6, 55), 520],
    hit: { joint: "handF", r: 24, dmg: 3, kb: [80, -140], stun: 500, level: "high", stop: 30, zap: true },
    final: [500, { joint: "handF", r: 30, dmg: 12, kb: [160, 900], stun: 500, level: "high", stop: 120, launch: true, groundBounce: true, heavy: true, shake: 12, zap: true }],
    special: { pt: "TEMPESTADE", en: "STORM" },
  },
  /** W: a rising cyclone of kicks. */
  /**
   * W: dash in, spin up carrying them with kicks, raise the leg at the top
   * and drive them into the floor with an axe kick.
   */
  ciclone: {
    frames: [["cicloneCoil", 110, "io"], ["roundhouse", 180, "snap"], ["spinKick", 260, "snap"], ["roundhouse", 340, "snap"], ["spinKick", 420, "snap"], ["axeUp", 520, "io"], ["diveKick", 580, "snap"], ["diveKick", 1400, "lin"]],
    total: 1400, active: [120, 1400], homeIn: [110, 46], velAt: 110, vel: [130, -640], lowGravity: 0.3, air: true, spins: 3, spinEnd: 470, untilLand: true, dive: [560, 1300], rehit: beats(190, 4, 80).concat([560]),
    hit: { joint: "footF", r: 36, dmg: 4, kb: [110, -560], stun: 500, level: "mid", stop: 35, launch: true },
    final: [540, { joint: "footF", r: 42, dmg: 13, kb: [160, 1150], stun: 500, level: "high", stop: 140, launch: true, groundBounce: true, heavy: true, shake: 14 }],
    special: { pt: "CICLONE", en: "CYCLONE" },
  },
  /** W in the air: an axe kick that crashes down and shakes the floor. */
  meteoro: {
    frames: [["axeUp", 140, "io"], ["diveKick", 220, "snap"], ["diveKick", 1200, "lin"]],
    total: 1200, active: [140, 1200], vel: [160, 1300], air: true, untilLand: true, whoosh: "heavy",
    hit: { joint: "footF", r: 26, dmg: 14, kb: [200, 800], stun: 500, level: "high", stop: 120, launch: true, groundBounce: true, heavy: true, shake: 12 },
    special: { pt: "METEORO", en: "METEOR" },
  },
  /** E: an electric dash that grabs and slams. */
  /** E: an electric dash that grabs, tosses them up and finishes with a flying kick. */
  choque: {
    frames: [["choqueCharge", 110, "io"], ["bolt", 160, "snap"], ["grab", 300, "lin"], ["stance", 460, "io"]],
    total: 460, active: [110, 290], lunge: 1500, grab: true, invuln: [0, 300], whoosh: "heavy",
    special: { pt: "CHOQUE", en: "SHOCK" },
  },
  /** E, part two: hoisted overhead and thrown straight up. */
  lancar: {
    frames: [["hold", 60, "io"], ["tossDip", 160, "io"], ["overhead", 250, "snap"], ["overhead", 330, "lin"], ["tossDip", 420, "io"]],
    total: 420, active: [240, 262], invuln: [0, 420],
    hit: { joint: "handF", r: 80, dmg: 6, kb: [20, -780], stun: 500, level: "mid", stop: 60, launch: true, zap: true },
  },
  /** E, part three: a leap after them and a spinning kick at the top. */
  superChute: {
    frames: [["tossDip", 70, "io"], ["superTuck", 200, "out"], ["superKick", 320, "snap"], ["superKick", 440, "lin"], ["fall", 680, "io"]],
    total: 680, active: [300, 460], air: true, spins: 1, spinEnd: 300, invuln: [0, 680], whoosh: "heavy",
    hit: { joint: "footF", r: 46, dmg: 24, kb: [1400, -260], stun: 600, level: "high", stop: 200, launch: true, wallBounce: true, heavy: true, shake: 20, zap: true },
  },
  /** E in the air: a bolt of lightning straight through them. */
  bolt: {
    frames: [["charge", 70, "io"], ["bolt", 120, "snap"], ["bolt", 300, "lin"], ["fall", 460, "io"]],
    total: 460, active: [90, 300], lunge: 1700, float: true, air: true, invuln: [0, 320], whoosh: "heavy",
    hit: { joint: "hip", r: 70, dmg: 16, kb: [700, -700], stun: 500, level: "mid", stop: 70, launch: true, wallBounce: true, heavy: true, shake: 10, zap: true },
    special: { pt: "RAIO", en: "BOLT" },
  },

  // --- Enemy-only heavy moves ----------------------------------------------------
  stomp: {
    frames: [["charge", 360, "io"], ["burst", 460, "snap"], ["burst", 640, "lin"], ["stance", 820, "io"]],
    total: 820, active: [440, 500], armor: true,
    hit: { joint: "footF", r: 260, dmg: 14, kb: [520, -620], stun: 400, level: "low", stop: 110, launch: true, knockdown: true, heavy: true, shake: 14 },
  },
  haymaker: {
    frames: [["hookWind", 300, "io"], ["hook", 400, "snap"], ["hookFollow", 500, "out"], ["stance", 680, "io"]],
    total: 680, active: [360, 460], lunge: 220, armor: true, whoosh: "heavy",
    hit: { joint: "handF", r: 24, dmg: 18, kb: [980, -420], stun: 500, level: "high", stop: 130, launch: true, wallBounce: true, heavy: true, shake: 12 },
  },
  throwOrb: {
    frames: [["jabWind", 220, "io"], ["jab", 300, "snap"], ["jab", 380, "lin"], ["stance", 520, "io"]],
    total: 520, active: [280, 300],
  },
} satisfies Record<string, Move>;

export type MoveId = keyof typeof MOVES;

/** Chained strings: the n-th press continues with the n-th entry of either list. */
export const CHAIN_P: MoveId[] = ["jab", "cross", "hook"];
export const CHAIN_K: MoveId[] = ["frontKick", "roundhouse", "spinKick"];
/** Holds and throws carry the one being held along with them. */
export const CARRIES: MoveId[] = ["throwF", "throwB", "lancar"];
/** Moves that continue a special and keep its slow motion going. */
export const SPECIAL_CHAIN: MoveId[] = ["lancar", "superChute"];

export function moveOf(id: MoveId): Move {
  return MOVES[id] as Move;
}

/** The hit a move lands right now (finishers take over late in a string). */
export function hitAt(m: Move, t: number): HitSpec | undefined {
  return m.final && t >= m.final[0] ? m.final[1] : m.hit;
}
