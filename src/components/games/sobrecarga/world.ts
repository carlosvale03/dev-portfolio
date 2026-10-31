import { think } from "./ai";
import { Fighter, NO_INTENT, type Host, type Intent, type Outcome } from "./fighter";
import { hitAt, moveOf, type HitSpec, type MoveId } from "./moves";
import { FLOOR, STEP } from "./ragdoll";
import { ROSTER, STAGES, endlessWave, type Kind } from "./roster";
import { BONES, SEGMENTS, type Vec } from "./skeleton";

// The match: fighters, hits, waves, slow motion, camera, score and effects.
// Simulation runs in fixed steps; every visual effect lives here too, so the
// renderer only draws what it is given.

export const ARENA = { left: -1150, right: 1150 };
export const RANKS = ["D", "C", "B", "A", "S", "SS", "SSS"] as const;
const RANK_AT = [0, 90, 190, 300, 420, 540, 660];

export type Phase = "intro" | "fight" | "wave" | "clear" | "over" | "victory";
export type Sound =
  | "light" | "heavy" | "block" | "parry" | "whoosh" | "whooshHeavy" | "jump" | "land" | "ko" | "zap"
  | "wall" | "stomp" | "slowIn" | "slowOut" | "grab" | "orb" | "charge" | "round" | "fight" | "roll" | "reflect" | "special" | "tired" | "pickup";

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  kind: "spark" | "dust" | "pixel";
  size: number;
}
export interface Arc {
  a: Vec;
  b: Vec;
  life: number;
}
export interface Ring {
  x: number;
  y: number;
  r: number;
  grow: number;
  life: number;
  max: number;
  color: string;
}
export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  big?: boolean;
}
export interface Orb {
  x: number;
  y: number;
  vx: number;
  team: 0 | 1;
  life: number;
  owner: Fighter;
}

export type PickupKind = "cafe" | "bateria" | "carga" | "firewall" | "overclock";
export interface Pickup {
  kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds left before it vanishes (it blinks for the last three). */
  life: number;
  t: number;
}

/** What each pickup does, and how often it drops. */
export const PICKUPS: Record<PickupKind, { weight: number; color: string; name: { pt: string; en: string } }> = {
  cafe: { weight: 34, color: "#f3b14e", name: { pt: "CAFÉ +VIDA", en: "COFFEE +HEALTH" } },
  bateria: { weight: 24, color: "#9fc3ff", name: { pt: "BATERIA CHEIA", en: "FULL BATTERY" } },
  carga: { weight: 18, color: "#e23b2e", name: { pt: "+1 SOBRECARGA", en: "+1 OVERLOAD" } },
  firewall: { weight: 12, color: "#6fcf73", name: { pt: "FIREWALL", en: "FIREWALL" } },
  overclock: { weight: 12, color: "#ff8a3d", name: { pt: "OVERCLOCK", en: "OVERCLOCK" } },
};
const SHIELD_MS = 9000;
const BOOST_MS = 10000;

export interface StageStats {
  time: number;
  damage: number;
  maxCombo: number;
  bestRank: number;
}

const ORB_HIT: HitSpec = { joint: "hip", r: 18, dmg: 8, kb: [260, -120], stun: 320, level: "high", stop: 60, zap: true };
const ORB_BACK: HitSpec = { ...ORB_HIT, dmg: 14, kb: [520, -420], launch: true, heavy: true };
const METEOR_WAVE: HitSpec = { joint: "footF", r: 260, dmg: 8, kb: [520, -700], stun: 400, level: "low", stop: 60, launch: true, knockdown: true, heavy: true };

/** Deterministic random, so a run can be replayed while testing. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distance from p to the segment a-b. */
function segDist(p: Vec, a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

export class Game implements Host {
  left = ARENA.left;
  right = ARENA.right;
  now = 0;
  rand = mulberry(7);

  fighters: Fighter[] = [];
  player: Fighter;
  orbs: Orb[] = [];
  pickups: Pickup[] = [];
  /** Real time the player's health was last restored, for the HUD to glow. */
  healAt = -9999;
  sparks: Spark[] = [];
  arcs: Arc[] = [];
  rings: Ring[] = [];
  texts: FloatText[] = [];
  sounds: { name: Sound; at: number }[] = [];

  stage = 0;
  wave = 0;
  endless = -1;
  phase: Phase = "intro";
  phaseT = 0;
  stats: StageStats = { time: 0, damage: 0, maxCombo: 0, bestRank: 0 };

  /** Battery for the slow-motion specials (Q, W, E): 0..1, three charges. */
  slowMeter = 1;
  private slowIdle = 0;
  /** A special in progress: time crawls for everyone but the player. */
  cine = { ms: 0, max: 1, name: "" };
  /** 0..1, how far the cinema bars are in. */
  cineK = 0;
  /** The enemy caught in the player's special: it moves at the player's pace. */
  chainTarget: Fighter | null = null;
  /** Real time the battery last came up short, for the HUD to flash. */
  tiredAt = -9999;
  /** Forced slow motion (parries, final blows), real ms and scale. */
  forced = { ms: 0, scale: 1 };
  hitstop = 0;
  shake = 0;
  /**
   * Camera: x and zoom follow the fight; y lifts to follow aerial specials,
   * rot is a slight dutch tilt and punch a short zoom-in on big impacts.
   */
  cam = { x: 0, y: 0, zoom: 1, kick: 0, rot: 0, focus: null as Vec | null, punch: 0, punchAt: null as Vec | null };
  /** Real time of the last impact frame (a flash of white silhouettes on black). */
  impactAt = -9999;
  /** Real time until which the finisher's colour split lasts. */
  chromaUntil = -9999;
  /** Real time the current special started, for its title card. */
  cineAt = -9999;

  score = 0;
  combo = 0;
  comboTimer = 0;
  style = 0;
  private recent: MoveId[] = [];
  /** Real time of the last overload, for the white flash. */
  flashAt = -9999;
  private boltFrom = new Map<number, Vec>();
  /** Real time at which the player last got hit (for the red flash). */
  hurtAt = -9999;
  private acc = 0;
  private summoned = new Set<string>();

  constructor(
    public lang: "pt" | "en",
    stage = 0,
  ) {
    this.player = new Fighter(0, -300);
    this.fighters.push(this.player);
    this.startStage(stage);
  }

  // --- Flow -------------------------------------------------------------------

  get stageName() {
    return this.endless >= 0 ? (this.lang === "pt" ? "pós-deploy" : "post-deploy") : STAGES[this.stage].name;
  }
  get waveCount() {
    return this.endless >= 0 ? 0 : STAGES[this.stage].waves.length;
  }
  get rank() {
    let r = 0;
    for (let i = 0; i < RANK_AT.length; i++) if (this.style >= RANK_AT[i]) r = i;
    return r;
  }
  get enemies() {
    return this.fighters.filter((f) => f.team === 1);
  }

  startStage(stage: number) {
    this.stage = stage;
    this.wave = 0;
    this.stats = { time: 0, damage: 0, maxCombo: 0, bestRank: 0 };
    this.fighters = this.fighters.filter((f) => f.team === 0);
    this.orbs = [];
    this.pickups = [];
    // Every new round starts with full health.
    this.resetPlayer(true);
    this.setPhase("intro");
    this.sound("round");
  }

  startEndless() {
    this.endless = 0;
    this.wave = 0;
    this.fighters = this.fighters.filter((f) => f.team === 0);
    this.pickups = [];
    this.resetPlayer(true);
    this.setPhase("intro");
    this.sound("round");
  }

  private resetPlayer(full: boolean) {
    const p = this.player;
    p.rag = null;
    p.ragFrom = null;
    p.release();
    p.state = "idle";
    p.move = null;
    p.x = -300;
    p.y = FLOOR;
    p.vx = p.vy = 0;
    p.facing = 1;
    p.dissolve = 0;
    p.special = false;
    p.homing = null;
    if (full && p.hp < p.maxHp && this.score > 0) {
      this.healAt = this.now;
      this.float(p.x, -230, this.lang === "pt" ? "VIDA RESTAURADA" : "HEALTH RESTORED", "#f3b14e", true);
    }
    p.hp = full ? p.maxHp : Math.min(p.maxHp, Math.max(p.hp, 1) + p.maxHp * 0.45);
    p.shieldUntil = p.boostUntil = -1;
    this.slowMeter = 1;
    this.cine.ms = 0;
    this.combo = 0;
  }

  retry() {
    this.player.hp = this.player.maxHp;
    if (this.endless >= 0) {
      this.score = 0;
      this.startEndless();
    } else this.startStage(this.stage);
    this.player.hp = this.player.maxHp;
  }

  next() {
    if (this.phase === "victory") return this.startEndless();
    if (this.stage + 1 < STAGES.length) this.startStage(this.stage + 1);
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseT = 0;
  }

  private spawnWave() {
    const kinds: Kind[] = this.endless >= 0 ? endlessWave(this.endless) : STAGES[this.stage].waves[this.wave];
    kinds.forEach((k, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const x = Math.max(ARENA.left + 80, Math.min(ARENA.right - 80, this.player.x + side * (620 + i * 90)));
      const f = new Fighter(1, x, k);
      f.facing = -side;
      f.brain.next = this.now + 600 + i * 400;
      if (this.endless > 0) {
        f.maxHp = f.hp = Math.round(f.hp * (1 + this.endless * 0.08));
      }
      this.fighters.push(f);
    });
  }

  // --- Host -------------------------------------------------------------------

  foe(f: Fighter): Fighter | null {
    if (f.team === 1) return this.player.alive ? this.player : null;
    let best: Fighter | null = null;
    let d = Infinity;
    for (const e of this.fighters) {
      if (e.team !== 1 || !e.alive) continue;
      const dd = Math.abs(e.x - f.x);
      if (dd < d) {
        d = dd;
        best = e;
      }
    }
    return best;
  }

  get slowOn() {
    return this.cine.ms > 0;
  }

  spend(f: Fighter, cost: number) {
    if (f.team !== 0) return true;
    if (this.slowMeter < cost - 0.001) return false;
    this.slowMeter -= cost;
    this.slowIdle = 0;
    return true;
  }

  orb(from: Fighter) {
    const hand = from.joints.handF;
    this.orbs.push({ x: hand.x, y: hand.y, vx: from.facing * 560, team: from.team, life: 3, owner: from });
    this.sound("orb");
  }

  event(name: Parameters<Host["event"]>[0], f: Fighter, at?: Vec) {
    switch (name) {
      case "land":
        this.dust(f.x, 4, 0.6);
        this.sound("land");
        if (f.move === null && f.state === "idle" && f.vx === 0) break;
        break;
      case "jump":
        this.dust(f.x, 3, 0.4);
        this.sound("jump");
        break;
      case "whoosh":
      case "whooshHeavy":
        this.sound(name);
        break;
      case "roll":
        this.dust(f.x, 4, 0.5);
        this.sound("roll");
        break;
      case "stomp":
        this.rings.push({ x: f.x, y: FLOOR, r: 20, grow: 900, life: 0.35, max: 0.35, color: f.color });
        this.dust(f.x, 14, 1.4);
        this.shake = Math.max(this.shake, 10);
        this.sound("stomp");
        break;
      case "charge":
        this.sound("charge");
        break;
      case "special": {
        const m = moveOf(f.move!);
        if (f.team !== 0 || !m.special) break;
        if (this.cine.ms <= 0) {
          this.cineAt = this.now;
          this.hitstop = Math.max(this.hitstop, 140);
          this.rings.push({ x: f.joints.hip.x, y: f.joints.hip.y, r: 10, grow: 900, life: 0.3, max: 0.3, color: "#e23b2e" });
          this.burst(f.joints.hip.x, f.joints.hip.y, "#e23b2e", 18, 520);
          this.cam.kick = 0.14;
          this.cam.rot = 0.05 * f.facing;
        }
        this.cine = { ms: 200, max: 200, name: m.special[this.lang] };
        this.sound("special");
        this.addStyle(f.move!, 30);
        if (f.homing) this.chainTarget = f.homing;
        break;
      }
      case "meteor": {
        // The axe kick lands: a shockwave throws everyone nearby.
        this.rings.push({ x: f.x, y: FLOOR, r: 20, grow: 1100, life: 0.4, max: 0.4, color: "#e23b2e" });
        this.dust(f.x, 18, 1.6);
        this.shake = Math.max(this.shake, 14);
        this.sound("stomp");
        for (const t of this.fighters) {
          if (t.team === f.team || !t.hittable || Math.abs(t.x - f.x) > 260 || !t.grounded) continue;
          this.applyHit(f, t, METEOR_WAVE, { x: t.joints.hip.x, y: t.joints.hip.y }, "meteoro");
        }
        break;
      }
      case "tired":
        this.tiredAt = this.now;
        this.sound("tired");
        break;
      case "bolt":
        this.sound("zap");
        this.boltFrom.set(f.id, { ...f.joints.hip });
        break;
      case "overload": {
        const c = f.joints.hip;
        this.rings.push({ x: c.x, y: c.y, r: 30, grow: 1500, life: 0.45, max: 0.45, color: "#e23b2e" });
        this.rings.push({ x: c.x, y: c.y, r: 10, grow: 900, life: 0.5, max: 0.5, color: "#f4f2ec" });
        this.rings.push({ x: f.x, y: FLOOR, r: 30, grow: 1300, life: 0.5, max: 0.5, color: "#e23b2e" });
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + this.rand() * 0.4;
          const r = 260 + this.rand() * 200;
          this.zap(c, { x: c.x + Math.cos(a) * r, y: Math.min(FLOOR, c.y + Math.sin(a) * r * 0.6) });
        }
        this.burst(c.x, c.y, "#e23b2e", 30, 900);
        this.flashAt = this.now;
        this.shake = Math.max(this.shake, 16);
        this.sound("zap");
        this.sound("heavy");
        break;
      }
      case "wall":
        if (at) {
          this.burst(at.x, at.y, "#f4f2ec", 10, 420);
          this.dust(at.x, 6, 1);
        }
        this.shake = Math.max(this.shake, 9);
        this.sound("wall");
        if (f.team === 1) this.float(f.x, f.joints.head.y - 30, this.lang === "pt" ? "PAREDE!" : "WALL SPLAT!", "#f3b14e");
        this.addStyle("spinKick", 40);
        break;
    }
  }

  sound(name: Sound) {
    this.sounds.push({ name, at: this.now });
  }

  // --- Effects ----------------------------------------------------------------

  burst(x: number, y: number, color: string, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2;
      const v = speed * (0.4 + this.rand() * 0.8);
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.28, max: 0.28, color, kind: "spark", size: 2 + this.rand() * 2 });
    }
  }

  dust(x: number, n: number, k: number) {
    for (let i = 0; i < n; i++) {
      const dir = this.rand() < 0.5 ? -1 : 1;
      this.sparks.push({ x: x + dir * this.rand() * 20, y: FLOOR - 4, vx: dir * (60 + this.rand() * 220) * k, vy: -40 - this.rand() * 80, life: 0.5, max: 0.5, color: "rgba(244,242,236,0.35)", kind: "dust", size: 6 + this.rand() * 10 * k });
    }
  }

  float(x: number, y: number, text: string, color: string, big = false) {
    this.texts.push({ x, y, text, life: big ? 1.4 : 0.9, color, big });
  }

  private zap(a: Vec, b: Vec) {
    this.arcs.push({ a: { ...a }, b: { ...b }, life: 0.14 });
  }

  // --- Score and style --------------------------------------------------------

  private addStyle(id: MoveId, base: number) {
    const repeats = this.recent.filter((m) => m === id).length;
    this.style = Math.min(760, this.style + base / (1 + repeats * 0.8));
    this.recent.push(id);
    if (this.recent.length > 6) this.recent.shift();
    this.stats.bestRank = Math.max(this.stats.bestRank, this.rank);
  }

  private award(points: number) {
    this.score += Math.round(points * (1 + this.combo * 0.08) * (1 + this.rank * 0.25));
  }

  // --- Update -----------------------------------------------------------------

  /** Advances by real milliseconds; `input` builds the player's intent per step. */
  update(realMs: number, input: (f: Fighter) => Intent, used: (f: Fighter, before: { state: string; move: string | null; moveT: number; vy: number }) => void) {
    this.acc += Math.min(realMs, 100);
    while (this.acc >= STEP * 1000) {
      this.acc -= STEP * 1000;
      this.step(input, used);
    }
  }

  private timeScale(f: Fighter | null) {
    if (this.forced.ms > 0) return this.forced.scale;
    // During a special the player moves almost at full speed through a
    // world that has nearly stopped.
    if (this.cine.ms > 0) return f === this.player || f === this.chainTarget || f?.heldBy === this.player ? 0.85 : 0.2;
    return 1;
  }

  private step(input: (f: Fighter) => Intent, used: Parameters<Game["update"]>[2]) {
    const realMs = STEP * 1000;
    this.now += realMs;
    this.phaseT += realMs;
    this.forced.ms = Math.max(0, this.forced.ms - realMs);
    // Slow motion holds for as long as the special (and its chain) lasts.
    if (this.player.special && this.player.alive) this.cine.ms = Math.max(this.cine.ms, 140);
    if (this.cine.ms > 0) {
      this.cine.ms = Math.max(0, this.cine.ms - realMs);
      if (this.cine.ms === 0) {
        this.sound("slowOut");
        this.chainTarget = null;
      }
    }
    this.cineK += ((this.cine.ms > 0 ? 1 : 0) - this.cineK) * Math.min(1, STEP * 9);
    this.shake = Math.max(0, this.shake - STEP * 40);
    this.cam.kick = Math.max(0, this.cam.kick - STEP * 0.6);
    this.cam.punch = Math.max(0, this.cam.punch - STEP);
    this.cam.rot *= Math.exp(-STEP * 5);
    this.updateEffects(STEP);

    if (this.hitstop > 0) {
      this.hitstop -= realMs;
      return;
    }
    const world = this.timeScale(null);
    this.flow(realMs);
    if (this.phase === "fight" || this.phase === "wave") this.stats.time += realMs;

    // The battery recharges slowly on its own (and faster by landing hits).
    if (this.cine.ms <= 0) {
      this.slowIdle += STEP;
      if (this.slowIdle > 0.8) this.slowMeter = Math.min(1, this.slowMeter + STEP * 0.07);
    }

    const controllable = this.phase === "fight" || this.phase === "wave" || this.phase === "clear" || this.phase === "victory";
    for (const f of this.fighters) {
      const before = { state: f.state, move: f.move, moveT: f.moveT, vy: f.vy };
      let intent: Intent = NO_INTENT;
      if (controllable) intent = f.team === 0 ? input(f) : this.phase === "fight" ? think(f, this.foe(f), this, this.rand) : NO_INTENT;
      if (f.team === 0 && this.phase !== "fight") intent = { ...intent, special: 0, overload: false };
      f.update(STEP, this.timeScale(f), intent, this);
      if (f.team === 0) used(f, before);
      if (f.team === 0 && (before.move === "meteoro" || before.move === "ciclone") && f.move !== before.move && f.grounded) this.event("meteor", f);
      // The bolt leaves a lightning trail along the dash.
      const from = this.boltFrom.get(f.id);
      if (from && f.move === "bolt" && f.moveT >= 90 && f.moveT <= 320) {
        if (Math.abs(f.joints.hip.x - from.x) > 40) {
          this.arcs.push({ a: from, b: { ...f.joints.hip }, life: 0.35 });
          this.boltFrom.set(f.id, { ...f.joints.hip });
        }
      } else if (from && f.move !== "bolt") this.boltFrom.delete(f.id);
      if (this.slowOn || f.state === "roll" || (f.state === "attack" && f.team === 0) || f.move === "bolt" || f.state === "held") {
        if (Math.round(this.now / realMs) % (this.cine.ms > 0 && f.team === 0 ? 2 : 3) === 0) f.snapshot();
      } else if (f.trail.length) f.trail.pop();
    }
    this.separate();
    this.resolveHits();
    this.updateOrbs(STEP * world);
    this.updatePickups(STEP * world);
    this.tokens();
    this.bossSummons();
    this.fighters = this.fighters.filter((f) => f.dissolve < 1);

    // Combo and style decay in world time.
    if (this.combo > 0) {
      this.comboTimer -= STEP * world;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.style = Math.max(0, this.style - STEP * world * 26);
    this.updateCamera();
  }

  private flow(ms: number) {
    const alive = this.enemies.filter((e) => e.alive);
    switch (this.phase) {
      case "intro":
        if (this.phaseT > 1700) {
          this.setPhase("fight");
          this.spawnWave();
          this.sound("fight");
        }
        break;
      case "fight":
        if (!this.player.alive) {
          if (this.player.state === "dead" || this.phaseT > 0) {
            if (!this.forced.ms) {
              this.forced = { ms: 1400, scale: 0.25 };
            }
            this.setPhase("over");
          }
          break;
        }
        if (alive.length === 0 && this.enemies.every((e) => e.state === "dead" || e.dissolve > 0 || !e.alive)) {
          const last = this.endless < 0 && this.wave + 1 >= this.waveCount;
          this.setPhase(last ? (this.stage + 1 >= STAGES.length ? "victory" : "clear") : "wave");
        }
        break;
      case "wave":
        if (this.phaseT > 1500) {
          this.wave++;
          if (this.endless >= 0) this.endless++;
          this.spawnWave();
          this.setPhase("fight");
          this.sound("fight");
        }
        break;
    }
    void ms;
  }

  private tokens() {
    const max = this.endless >= 0 ? 2 : STAGES[this.stage].attackers;
    const ranked = this.enemies
      .filter((e) => e.alive && !e.arch?.ranged)
      .sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x));
    ranked.forEach((e, i) => (e.brain.token = i < max));
    for (const e of this.enemies) if (e.arch?.ranged) e.brain.token = Math.abs(e.x - this.player.x) < 140;
  }

  private bossSummons() {
    for (const e of this.enemies) {
      if (e.kind !== "legacy" || !e.alive) continue;
      for (const at of [0.66, 0.33]) {
        const key = `${e.id}:${at}`;
        if (e.hp < e.maxHp * at && !this.summoned.has(key)) {
          this.summoned.add(key);
          for (const side of [-1, 1]) {
            const f = new Fighter(1, Math.max(ARENA.left + 80, Math.min(ARENA.right - 80, this.player.x + side * 700)), at > 0.5 ? "bug" : "race");
            this.fighters.push(f);
          }
          this.float(e.x, e.joints.head.y - 50, this.lang === "pt" ? "DEPENDÊNCIAS!" : "DEPENDENCIES!", e.color, true);
          this.shake = Math.max(this.shake, 8);
        }
      }
    }
  }

  private separate() {
    const fs = this.fighters.filter((f) => f.alive && f.grounded && f.state !== "rag" && f.state !== "held" && f.state !== "roll" && f.state !== "getup");
    for (let i = 0; i < fs.length; i++)
      for (let j = i + 1; j < fs.length; j++) {
        const a = fs[i];
        const b = fs[j];
        const min = 30 * (a.scale + b.scale);
        const d = b.x - a.x;
        if (Math.abs(d) < min) {
          const push = (min - Math.abs(d)) / 2;
          const s = Math.sign(d) || 1;
          a.x -= s * push;
          b.x += s * push;
        }
      }
  }

  private hurtDistance(p: Vec, t: Fighter) {
    let d = Math.hypot(p.x - t.joints.head.x, p.y - t.joints.head.y) - BONES.head * t.scale;
    for (const [a, b] of SEGMENTS) d = Math.min(d, segDist(p, t.joints[a], t.joints[b]) - 5 * t.scale);
    return d;
  }

  private resolveHits() {
    for (const atk of this.fighters) {
      const point = atk.hitPoint();
      if (!point || !atk.move) continue;
      const m = moveOf(atk.move);
      for (const t of this.fighters) {
        if (t.team === atk.team || atk.hitSet.has(t.id) || !t.hittable) continue;
        if (m.grab) {
          if (t.state === "rag" || t.state === "held" || !t.grounded || t.state === "roll" || !t.alive) continue;
          if (this.hurtDistance(point, t) > 22 * atk.scale) continue;
          if (t.state === "block" && atk.team === 0) {
            // grabs beat a guard
          }
          atk.hitSet.add(t.id);
          atk.moveHit = true;
          const from = atk.move;
          t.grabbed(atk);
          this.sound("grab");
          // The shock dash and the tackle go straight into their throws.
          if (from === "choque") {
            atk.startMove("lancar", this);
            this.zap(atk.joints.hip, t.joints.head);
            this.chainTarget = t;
          } else if (from === "tackle") atk.startMove("throwF", this);
          break;
        }
        const spec = hitAt(m, atk.moveT);
        if (!spec) continue;
        if (atk.move === "knee" && t !== atk.holding) continue;
        if (atk.holding && atk.holding !== t && (atk.move === "throwF" || atk.move === "throwB" || atk.move === "lancar")) continue;
        if (spec.level === "low" && !t.grounded && t.state !== "rag") continue;
        const area = spec.joint === "hip" || atk.move === "stomp";
        const held = t === atk.holding;
        const dist = held ? 0 : area ? Math.abs(t.x - atk.x) + Math.abs(t.joints.hip.y - point.y) * 0.4 - 40 : this.hurtDistance(point, t);
        if (dist > spec.r * atk.scale) continue;
        atk.hitSet.add(t.id);
        const contact = area ? { x: t.joints.hip.x, y: t.joints.hip.y } : point;
        this.applyHit(atk, t, spec, contact, atk.move);
      }
    }
  }

  private applyHit(atk: Fighter, t: Fighter, spec: HitSpec, at: Vec, id: MoveId | "orb") {
    const wasLastAlive = t.team === 1 && this.enemies.filter((e) => e.alive).length === 1 && t.alive;
    if (atk === this.player && this.now < atk.boostUntil) spec = { ...spec, dmg: spec.dmg * 1.6, kb: [spec.kb[0] * 1.2, spec.kb[1] * 1.1] };
    const outcome: Outcome = t.takeHit(atk, spec, at, this);
    if (outcome === "none") return;
    if (outcome === "parry") {
      atk.stagger(900);
      t.meter = Math.min(100, t.meter + 12);
      this.forced = { ms: 420, scale: 0.18 };
      this.rings.push({ x: at.x, y: at.y, r: 10, grow: 520, life: 0.3, max: 0.3, color: "#f4f2ec" });
      this.burst(at.x, at.y, "#f4f2ec", 16, 520);
      this.sound("parry");
      if (t.team === 0) {
        this.float(t.x, t.joints.head.y - 40, this.lang === "pt" ? "CONTRA-ATAQUE!" : "PARRY!", "#f4f2ec", true);
        this.addStyle("jab", 120);
        this.slowMeter = Math.min(1, this.slowMeter + 0.15);
      }
      return;
    }
    if (outcome === "block") {
      this.hitstop = 40;
      this.burst(at.x, at.y, "#9fc3ff", 6, 260);
      this.sound("block");
      return;
    }
    atk.moveHit = true;
    if (id === "lancar") {
      atk.homing = t;
      this.chainTarget = t;
    }
    if (atk.team === 0 && atk.special && t.team === 1) this.chainTarget = t;
    this.hitstop = outcome === "armor" ? spec.stop * 0.5 : spec.stop;
    this.shake = Math.max(this.shake, spec.shake ?? (spec.heavy ? 5 : 2));
    if (spec.heavy) this.cam.kick = Math.max(this.cam.kick, 0.06);
    if (atk.team === 0 && atk.special) {
      this.cam.kick = Math.max(this.cam.kick, 0.05);
      this.cam.rot += (this.rand() - 0.5) * 0.05;
      if (spec.heavy && spec.stop >= 110) {
        // The finisher: freeze, flash, punch in on the impact, colour split.
        this.impactAt = this.now;
        this.chromaUntil = this.now + 320;
        this.hitstop = Math.max(this.hitstop, 230);
        this.cam.punch = 0.6;
        this.cam.punchAt = { x: at.x, y: at.y };
        this.rings.push({ x: at.x, y: at.y, r: 10, grow: 1400, life: 0.4, max: 0.4, color: "#f4f2ec" });
        this.rings.push({ x: at.x, y: at.y, r: 10, grow: 800, life: 0.5, max: 0.5, color: "#e23b2e" });
        this.burst(at.x, at.y, "#f4f2ec", 24, 900);
        this.shake = Math.max(this.shake, 16);
      }
    }
    const color = spec.zap ? "#e23b2e" : spec.heavy ? "#f3b14e" : "#f4f2ec";
    this.burst(at.x, at.y, color, spec.heavy ? 14 : 7, spec.heavy ? 560 : 360);
    if (spec.zap) for (let i = 0; i < 3; i++) this.zap(atk.joints.hip, t.joints[i === 0 ? "head" : i === 1 ? "hip" : "footF"]);
    this.sound(spec.zap ? "zap" : spec.heavy ? "heavy" : "light");

    if (atk.team === 0) {
      atk.meter = Math.min(100, atk.meter + spec.dmg * 0.9);
      this.slowMeter = Math.min(1, this.slowMeter + 0.012 + spec.dmg * 0.002);
      this.combo++;
      this.comboTimer = 1.8;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
      if (id !== "orb") this.addStyle(id, 16 + spec.dmg * 2.4 + (t.state === "rag" ? 14 : 0));
      else this.addStyle("cross", 60);
      this.award(spec.dmg * 10 + 5);
    } else if (t.team === 0) {
      this.combo = 0;
      this.style = Math.max(0, this.style - 140);
      this.stats.damage += spec.dmg;
      this.hurtAt = this.now;
    }
    if (outcome === "ko") {
      this.sound("ko");
      if (t.team === 1) {
        this.award(t.arch!.points);
        this.float(t.x, t.joints.head.y - 40, "K.O.", "#e23b2e", true);
        // The last enemy of a wave always drops something; the rest, sometimes.
        const drops = t.kind === "legacy" ? 3 : wasLastAlive || this.rand() < 0.4 ? 1 : 0;
        for (let i = 0; i < drops; i++) this.drop(t.joints.hip.x, t.joints.hip.y, i);
      }
      // The last blow of a wave (or the player's fall) plays in slow motion.
      if (wasLastAlive || t.team === 0) {
        this.forced = { ms: 1100, scale: 0.2 };
        this.cam.focus = { x: t.joints.hip.x, y: t.joints.hip.y };
        this.hitstop = 140;
      }
    }
  }

  private drop(x: number, y: number, i: number) {
    const total = Object.values(PICKUPS).reduce((s, p) => s + p.weight, 0);
    let r = this.rand() * total;
    let kind: PickupKind = "cafe";
    for (const [k, p] of Object.entries(PICKUPS) as [PickupKind, (typeof PICKUPS)[PickupKind]][]) {
      r -= p.weight;
      if (r <= 0) {
        kind = k;
        break;
      }
    }
    this.pickups.push({ kind, x, y: Math.min(FLOOR - 20, y), vx: (i - 1) * 140 + (this.rand() - 0.5) * 120, vy: -520 - this.rand() * 200, life: 12, t: 0 });
  }

  private updatePickups(dt: number) {
    const p = this.player;
    for (const it of this.pickups) {
      it.t += dt;
      it.life -= dt;
      it.vy += 1600 * dt;
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      if (it.y > FLOOR - 18) {
        it.y = FLOOR - 18;
        it.vy *= -0.35;
        it.vx *= 0.6;
      }
      it.x = Math.max(ARENA.left + 30, Math.min(ARENA.right - 30, it.x));
      if (!p.alive || it.t < 0.35) continue;
      if (Math.abs(p.joints.hip.x - it.x) < 46 && Math.abs(p.joints.hip.y - it.y) < 110) {
        it.life = 0;
        this.collect(it);
      }
    }
    this.pickups = this.pickups.filter((it) => it.life > 0);
  }

  private collect(it: Pickup) {
    const p = this.player;
    const info = PICKUPS[it.kind];
    if (it.kind === "cafe") {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35);
      this.healAt = this.now;
    } else if (it.kind === "bateria") this.slowMeter = 1;
    else if (it.kind === "carga") p.meter = Math.min(100, p.meter + 34);
    else if (it.kind === "firewall") p.shieldUntil = this.now + SHIELD_MS;
    else p.boostUntil = this.now + BOOST_MS;
    this.rings.push({ x: it.x, y: it.y, r: 8, grow: 420, life: 0.35, max: 0.35, color: info.color });
    this.burst(it.x, it.y, info.color, 14, 380);
    this.float(it.x, it.y - 40, info.name[this.lang], info.color, true);
    this.sound("pickup");
  }

  private updateOrbs(dt: number) {
    for (const o of this.orbs) {
      o.x += o.vx * dt;
      o.life -= dt;
      // Any of the player's attacks swats an orb back.
      const p = this.player.hitPoint();
      if (o.team === 1 && p && Math.hypot(p.x - o.x, p.y - o.y) < 40) {
        o.team = 0;
        o.vx = -o.vx * 1.7;
        o.life = 2;
        this.burst(o.x, o.y, "#a77bd6", 10, 380);
        this.sound("reflect");
        this.float(o.x, o.y - 30, this.lang === "pt" ? "DEVOLVIDO!" : "RETURNED!", "#a77bd6");
        continue;
      }
      for (const f of this.fighters) {
        if (f.team === o.team || !f.hittable || o.life <= 0) continue;
        if (this.hurtDistance(o, f) < 14) {
          o.life = 0;
          this.applyHit(o.owner === f ? this.player : o.owner, f, o.team === 0 ? ORB_BACK : ORB_HIT, { x: o.x, y: o.y }, "orb");
        }
      }
      if (this.rand() < 0.6) this.sparks.push({ x: o.x, y: o.y, vx: -o.vx * 0.1, vy: (this.rand() - 0.5) * 60, life: 0.3, max: 0.3, color: o.team === 0 ? "#f4f2ec" : "#a77bd6", kind: "pixel", size: 3 + this.rand() * 4 });
    }
    this.orbs = this.orbs.filter((o) => o.life > 0 && o.x > ARENA.left - 50 && o.x < ARENA.right + 50);
  }

  private updateEffects(dt: number) {
    const world = this.hitstop > 0 ? 0.15 : this.timeScale(null);
    const d = dt * world;
    for (const s of this.sparks) {
      s.life -= d;
      s.x += s.vx * d;
      s.y += s.vy * d;
      if (s.kind === "spark") s.vy += 1400 * d;
      if (s.kind === "dust") {
        s.vx *= 1 - d * 4;
        s.size += d * 20;
      }
      if (s.kind === "pixel") s.vy -= 60 * d;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0).slice(-700);
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter((a) => a.life > 0);
    for (const r of this.rings) {
      r.life -= d;
      r.r += r.grow * d;
    }
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 50 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    // Dissolving enemies shed pixels.
    for (const f of this.fighters) {
      if (f.dissolve > 0 && f.dissolve < 1 && this.rand() < 0.8) {
        const keys = Object.keys(f.joints) as (keyof typeof f.joints)[];
        const j = f.joints[keys[Math.floor(this.rand() * keys.length)]];
        this.sparks.push({ x: j.x, y: j.y, vx: (this.rand() - 0.5) * 80, vy: -60 - this.rand() * 120, life: 0.8, max: 0.8, color: f.color, kind: "pixel", size: 3 + this.rand() * 5 });
      }
    }
  }

  private updateCamera() {
    const p = this.player;
    let target = p.x;
    let spread = 0;
    const near = this.enemies.filter((e) => e.alive && Math.abs(e.x - p.x) < 700);
    if (near.length) {
      const avg = near.reduce((s, e) => s + e.x, 0) / near.length;
      target = p.x * 0.65 + avg * 0.35;
      spread = Math.max(...near.map((e) => Math.abs(e.x - p.x)));
    }
    let zoom = Math.max(0.86, Math.min(1.08, 1.12 - spread / 2600)) + this.cam.kick;
    if (this.forced.ms > 0 && this.cam.focus) {
      target = this.cam.focus.x;
      zoom = 1.3;
    } else this.cam.focus = null;
    // Specials push the camera in, lift it to follow the action in the air
    // and hold a slight dutch tilt; the finisher snaps in on the impact.
    let ty = 0;
    if (this.cine.ms > 0 && !this.cam.focus) {
      const t = this.chainTarget;
      target = t ? (p.x + t.x) / 2 : p.x * 0.8 + target * 0.2;
      zoom = Math.max(zoom, 1.28);
      const top = Math.min(p.joints.head.y, t ? t.joints.head.y : 0);
      ty = Math.max(-420, Math.min(0, top + 260));
      this.cam.rot += (0.03 * p.facing - this.cam.rot) * 0.02;
    }
    if (this.cam.punch > 0 && this.cam.punchAt) {
      target = this.cam.punchAt.x;
      zoom = 1.28 + this.cam.punch * 0.5;
      ty = Math.max(-420, Math.min(0, this.cam.punchAt.y + 260));
    }
    const snap = this.cam.punch > 0 ? 0.25 : 0.08;
    this.cam.x += (target - this.cam.x) * snap;
    this.cam.y += (ty - this.cam.y) * (this.cam.punch > 0 ? 0.25 : 0.06);
    this.cam.zoom += (zoom - this.cam.zoom) * (this.cam.punch > 0 ? 0.3 : 0.06);
  }
}

export { ROSTER };
