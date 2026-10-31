import { CARRIES, CHAIN_K, CHAIN_P, SPECIAL_CHAIN, hitAt, moveOf, type Ease, type HitSpec, type MoveId } from "./moves";
import { FLOOR, GRAVITY, Ragdoll } from "./ragdoll";
import { ROSTER, type Archetype, type Head, type Kind } from "./roster";
import { KICK_TRACKS } from "./mocap";
import { JOINTS, POSES, fk, footDrop, mixJoints, mixPose, place, poseOf, sampleTrack, splinePose, type Joints, type Pose, type PoseId, type Vec } from "./skeleton";

// One fighter, player or enemy: the same state machine runs both, driven by
// an Intent that comes from the keyboard or from the AI.

export type State = "idle" | "walk" | "run" | "crouch" | "air" | "attack" | "block" | "roll" | "hit" | "rag" | "getup" | "grab" | "held" | "dead" | "charge" | "brace";

export interface Intent {
  dx: number;
  /** Arrow up / down held. */
  up: boolean;
  down: boolean;
  block: boolean;
  /** Pressed this step: up jumps, down dodges (or dives, in the air). */
  jump: boolean;
  dodge: boolean;
  punch: boolean;
  kick: boolean;
  grab: boolean;
  /** Q, W, E: 1, 2, 3. */
  special: 0 | 1 | 2 | 3;
  overload: boolean;
}

export const NO_INTENT: Intent = { dx: 0, up: false, down: false, block: false, jump: false, dodge: false, punch: false, kick: false, grab: false, special: 0, overload: false };

export type Outcome = "none" | "hit" | "block" | "parry" | "armor" | "ko";

/** What the fighter needs from the world around it. */
export interface Host {
  left: number;
  right: number;
  /** Real milliseconds since the game started. */
  now: number;
  foe(f: Fighter): Fighter | null;
  orb(from: Fighter): void;
  /** Spends slow-motion battery for a special; false when there is not enough. */
  spend(f: Fighter, cost: number): boolean;
  event(name: "land" | "jump" | "whoosh" | "whooshHeavy" | "roll" | "stomp" | "wall" | "charge" | "bolt" | "overload" | "special" | "meteor" | "tired", f: Fighter, at?: Vec): void;
}

const ease = (t: number) => 1 - (1 - t) * (1 - t);
const EASES: Record<Ease, (t: number) => number> = {
  out: ease,
  lin: (t) => t,
  io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  // Overshoots a touch past the pose and settles: the snap of a strike.
  snap: (t) => 1 - Math.pow(1 - t, 4),
};
const WALK = 240;
const RUN = 520;
const JUMP = 900;
const SPECIAL_COST = 0.34;
const PARRY_WINDOW = 160;
let nextId = 1;

export class Fighter {
  id = nextId++;
  x: number;
  y = FLOOR;
  vx = 0;
  vy = 0;
  facing = 1;
  hp: number;
  maxHp: number;
  scale: number;
  color: string;
  head: Head;
  arch?: Archetype;
  kind?: Kind;

  state: State = "idle";
  t = 0;
  move: MoveId | null = null;
  moveT = 0;
  chain = 0;
  moveHit = false;
  hitSet = new Set<number>();
  startPose: Pose = POSES.stance;
  pose: Pose = POSES.stance;
  spin = 0;
  stun = 0;
  invuln = 0;
  flash = 0;
  phase = 0;
  jumps = 1;
  blockPressedAt = -9999;
  rollDir = 1;
  juggle = 0;
  holding: Fighter | null = null;
  heldBy: Fighter | null = null;
  holdT = 0;
  knees = 0;
  rag: Ragdoll | null = null;
  ragFrom: Joints | null = null;
  /** 0..1 dissolving into pixels after a KO. */
  dissolve = 0;
  joints: Joints;
  trail: Joints[] = [];
  /** Overload meter, 0..100: three charges of 33. */
  meter = 0;
  lastHit = -9999;
  /** How long the current run has lasted, ms (running attacks need a run-up). */
  runT = 0;
  /** Secondary motion: the head and chest snap back when hit, then settle. */
  jolt = 0;
  /** Recent positions of the striking limb, drawn as a motion arc. */
  smear: Vec[] = [];
  /** Real ms of the last landing, for a quick squash. */
  landAt = -9999;
  /** In the middle of a slow-motion special (and anything it chains into). */
  special = false;
  /** The body a chained special is chasing (the super kick follows it up). */
  homing: Fighter | null = null;
  /** Power-ups from pickups: world times (ms) until they wear off. */
  shieldUntil = -1;
  boostUntil = -1;
  /** Pose before smoothing, so state changes blend instead of popping. */
  private shown: Pose = POSES.stance;
  /** AI bookkeeping. */
  brain = { next: 0, plan: "idle" as string, chainLeft: 0, token: false, strafe: 1, wantMove: null as MoveId | null };

  constructor(
    public team: 0 | 1,
    x: number,
    kind?: Kind,
  ) {
    this.x = x;
    if (kind) {
      const a = ROSTER[kind];
      this.arch = a;
      this.kind = kind;
      this.hp = this.maxHp = a.hp;
      this.scale = a.scale;
      this.color = a.color;
      this.head = a.head;
    } else {
      this.hp = this.maxHp = 100;
      this.scale = 1;
      this.color = "#f4f2ec";
      this.head = "round";
    }
    this.joints = place(fk(POSES.stance, this.scale), x, FLOOR - 76, 1);
  }

  get alive() {
    return this.hp > 0;
  }
  get grounded() {
    return this.y >= FLOOR - 0.5;
  }
  get busy() {
    return this.state === "attack" || this.state === "hit" || this.state === "rag" || this.state === "getup" || this.state === "held" || this.state === "roll" || this.state === "dead" || this.state === "charge" || this.state === "brace";
  }
  /** Can be hit at all. */
  get hittable() {
    return this.invuln <= 0 && this.state !== "dead" && this.dissolve === 0;
  }

  private go(state: State) {
    this.state = state;
    this.t = 0;
  }

  startMove(id: MoveId, host: Host) {
    const m = moveOf(id);
    this.startPose = this.pose;
    this.move = id;
    this.moveT = 0;
    this.moveHit = false;
    this.hitSet.clear();
    this.go("attack");
    if (m.vel && !m.velAt) {
      this.vx = m.vel[0] * this.facing;
      if (m.vel[1]) this.vy = m.vel[1];
      if (m.vel[1] < 0) this.y = Math.min(this.y, FLOOR - 1);
    }
    if (m.invuln) this.invuln = m.invuln[1] - m.invuln[0];
    if (m.float) this.vy = 0;
    this.smear = [];
    if (m.special) this.special = true;
    else if (!SPECIAL_CHAIN.includes(id)) this.special = false;
    // Specials that dash in pick the nearest enemy within reach.
    if (m.homeIn) {
      const foe = host.foe(this);
      this.homing = foe && Math.abs(foe.x - this.x) < 460 ? foe : null;
      if (this.homing) this.facing = Math.sign(this.homing.x - this.x) || this.facing;
    }
    if (id === "overload") host.event("charge", this);
    if (m.special) host.event("special", this);
  }

  // --- Taking hits ------------------------------------------------------------

  takeHit(from: Fighter, spec: HitSpec, at: Vec, host: Host): Outcome {
    if (!this.hittable) return "none";
    const dir = Math.sign(this.x - from.x) || from.facing;
    const facingFoe = Math.sign(from.x - this.x) === this.facing;
    // Specials go through guards and parries: once they connect, they play out.
    if (this.state === "block" && facingFoe && !from.special && !(spec.level === "low" && !this.crouchBlock())) {
      if (host.now - this.blockPressedAt < PARRY_WINDOW) return "parry";
      this.vx = dir * spec.kb[0] * 0.55;
      this.stun = spec.stun * 0.55;
      return "block";
    }
    this.special = false;
    this.homing = null;
    // Knees from the one holding you land without breaking the hold.
    const kneed = this.heldBy === from && !spec.launch;
    if (this.heldBy && !kneed) this.release();
    if (this.holding) this.holding.release();

    const shielded = host.now < this.shieldUntil;
    this.hp = Math.max(0, this.hp - spec.dmg * (this.team === 0 ? 0.7 : 1) * (shielded ? 0.3 : 1));
    this.flash = 110;
    this.lastHit = host.now;
    this.meter = Math.min(100, this.meter + spec.dmg * 0.6);
    if (kneed) {
      this.jolt = Math.min(1.4, this.jolt + 1);
      if (this.alive) return "hit";
      this.release();
      return this.ko(dir, spec);
    }

    const armored = this.state === "attack" && this.move && moveOf(this.move).armor && this.alive;
    if (armored || (this.arch?.heavy && !spec.launch && this.alive && this.state !== "rag")) {
      if (!armored) {
        this.stun = spec.stun * 0.4;
        this.vx = dir * spec.kb[0] * 0.3;
        if (this.state !== "attack") {
          this.go("hit");
          this.pose = POSES.flinchHigh;
        }
      }
      return this.alive ? "armor" : this.ko(dir, spec);
    }
    if (!this.alive) return this.ko(dir, spec);

    const airborne = !this.grounded || this.state === "rag";
    if (spec.launch || airborne || spec.knockdown) {
      const decay = Math.max(0.35, 1 - this.juggle * 0.12);
      const heavy = this.arch?.heavy ? 0.6 : 1;
      const kb = { x: dir * Math.abs(spec.kb[0]) * heavy * (spec.kb[0] < 0 ? 1 : 1), y: spec.kb[1] * decay * heavy };
      if (spec.kb[0] < 0) kb.x = -from.facing * Math.abs(spec.kb[0]) * heavy;
      // Light hits in the air still keep the body up a little.
      if (!spec.launch && airborne) kb.y = Math.min(kb.y, -380 * decay);
      this.toRag(kb, spec);
      this.juggle++;
    } else {
      this.go("hit");
      this.move = null;
      this.stun = spec.stun;
      this.vx = dir * spec.kb[0];
      this.startPose = this.pose;
      this.pose = spec.level === "low" ? POSES.flinchLow : POSES.flinchHigh;
      this.jolt = Math.min(1.4, this.jolt + (spec.heavy ? 1.2 : 0.8));
    }
    void at;
    return "hit";
  }

  private crouchBlock() {
    return this.pose === POSES.crouch;
  }

  private ko(dir: number, spec: HitSpec): Outcome {
    const kb = { x: dir * Math.max(420, Math.abs(spec.kb[0]) * 1.3), y: Math.min(-520, spec.kb[1] * 1.2) };
    this.toRag(kb, spec);
    this.state = "rag";
    return "ko";
  }

  toRag(kb: Vec, spec?: HitSpec) {
    this.move = null;
    if (this.rag) {
      const v = this.rag.velocity();
      this.rag.impulse({ x: kb.x - v.x * 0.6, y: kb.y - Math.min(0, v.y) * 0.6 });
    } else {
      this.rag = new Ragdoll(this.joints, { x: this.vx + kb.x, y: this.vy + kb.y }, this.scale);
      this.rag.impulse({ x: 0, y: 0 });
    }
    if (spec?.wallBounce) this.rag.wallBounce = 1;
    if (spec?.groundBounce) this.rag.groundBounce = true;
    this.go("rag");
  }

  release() {
    const other = this.holding ?? this.heldBy;
    this.holding = null;
    this.heldBy = null;
    if (this.state === "grab" || this.state === "held") this.go("idle");
    if (other) {
      other.holding = null;
      other.heldBy = null;
      if (other.state === "grab" || other.state === "held") other.go("idle");
    }
  }

  /** 0..1 how much energy the blast has gathered (drives the trembling). */
  charge = 0;

  /** Plants the feet and starts gathering the energy blast. */
  startCharge() {
    this.move = null;
    this.vx = 0;
    this.charge = 0;
    this.special = true;
    this.invuln = 60000;
    this.go("charge");
  }

  /** Ends the charge: the blast goes out, falls apart, or blows up in the hands. */
  endCharge(host: Host, how: "fire" | "fizzle" | "explode") {
    this.invuln = how === "fire" ? 1500 : 0;
    this.charge = 0;
    if (how === "fire") this.startMove("beamFire", host);
    else if (how === "fizzle") {
      this.startMove("beamFizzle", host);
      this.special = false;
    } else this.special = false;
  }

  /** Crosses the arms and digs in against the energy blast, pushed back by it. */
  brace(towards: number) {
    this.move = null;
    this.release();
    this.facing = Math.sign(towards) || this.facing;
    this.invuln = 0;
    this.go("brace");
  }

  /** Lets go of the guard once the blast is over. */
  unbrace() {
    if (this.state === "brace") this.go("idle");
  }

  /** Dodge: a roll forward, or a backflip away. */
  roll(dir: number, host: Host) {
    if ((this.busy && this.state !== "block") || !this.grounded) return;
    this.rollDir = Math.sign(dir) || -this.facing;
    this.go("roll");
    this.invuln = 320;
    host.event("roll", this);
  }

  /** Thrown off balance by a parry. */
  stagger(ms: number) {
    this.move = null;
    this.spin = 0;
    this.stun = ms;
    this.vx = -this.facing * 160;
    this.startPose = this.pose;
    this.pose = POSES.stagger;
    this.go("hit");
  }

  grabbed(by: Fighter) {
    this.release();
    this.move = null;
    this.heldBy = by;
    by.holding = this;
    by.holdT = 0;
    by.knees = 0;
    by.move = null;
    by.state = "grab";
    by.t = 0;
    this.go("held");
    this.vx = 0;
  }

  // --- Update -----------------------------------------------------------------

  update(dtReal: number, scale: number, intent: Intent, host: Host) {
    const dt = dtReal * scale;
    const ms = dt * 1000;
    this.t += ms;
    this.invuln = Math.max(0, this.invuln - ms);
    this.flash = Math.max(0, this.flash - dtReal * 1000);
    this.stun = Math.max(0, this.stun - ms);

    if (this.state === "rag" || (this.state === "dead" && this.rag)) {
      this.updateRag(dtReal, scale, host);
      // Still down; otherwise it just started getting up and poses below.
      if (this.rag) {
        this.joints = this.rag.joints();
        return;
      }
    }

    const foe = host.foe(this);
    const face = () => {
      if (this.team === 1 && foe) this.facing = Math.sign(foe.x - this.x) || this.facing;
      else if (intent.dx) this.facing = Math.sign(intent.dx);
    };

    switch (this.state) {
      case "idle":
      case "walk":
      case "run":
      case "crouch": {
        face();
        if (intent.block) {
          this.go("block");
          this.blockPressedAt = host.now;
          this.vx = 0;
          break;
        }
        if (this.tryAttack(intent, host)) break;
        if (intent.dodge) {
          this.roll(intent.dx || -this.facing, host);
          break;
        }
        if (intent.jump) {
          this.vy = -JUMP * (this.arch?.heavy ? 0.82 : 1);
          this.y = FLOOR - 1;
          this.jumps = 1;
          this.go("air");
          host.event("jump", this);
          break;
        }
        // The player always runs; enemies walk, and run when dx is beyond 1.
        const fast = this.team === 0 || Math.abs(intent.dx) > 1;
        const speed = this.team === 0 ? RUN : (this.arch?.walk ?? WALK) * (fast ? 1.6 : 1);
        const target = intent.dx ? Math.sign(intent.dx) * speed : 0;
        this.vx += (target - this.vx) * Math.min(1, dt * (target ? 12 : 16));
        this.runT = intent.dx ? this.runT + ms : 0;
        const next: State = intent.dx ? (fast ? "run" : "walk") : "idle";
        if (next !== this.state) this.state = next;
        break;
      }
      case "air": {
        if (intent.dx) this.vx += (intent.dx * RUN * 0.8 - this.vx) * Math.min(1, dt * 3);
        if (intent.jump && this.jumps > 0) {
          this.jumps = 0;
          this.vy = -JUMP * 0.86;
          this.spin = 0;
          this.t = 0;
          host.event("jump", this);
        }
        this.tryAttack(intent, host);
        break;
      }
      case "attack":
        this.updateAttack(dt, ms, intent, host);
        break;
      case "block": {
        this.vx *= Math.max(0, 1 - dt * 10);
        if (intent.dodge && this.stun <= 0) {
          this.state = "idle";
          this.roll(intent.dx || -this.facing, host);
          break;
        }
        if (!intent.block && this.stun <= 0) this.go("idle");
        else if (this.stun <= 0 && this.tryAttack(intent, host)) break;
        break;
      }
      case "roll": {
        this.vx = this.rollDir * 620 * (1 - this.t / 400);
        if (this.t > 400) {
          this.go("idle");
          face();
        }
        break;
      }
      case "hit": {
        this.vx *= Math.max(0, 1 - dt * 7);
        if (this.stun <= 0) this.go("idle");
        break;
      }
      case "charge":
        this.vx *= Math.max(0, 1 - dt * 12);
        break;
      case "brace":
        // Shoved back a little at a time, heels dragging.
        this.vx = -this.facing * 70;
        break;
      case "getup": {
        this.vx = 0;
        if (this.t > 520) {
          this.ragFrom = null;
          this.go("idle");
          face();
        }
        break;
      }
      case "grab": {
        const held = this.holding;
        this.holdT += ms;
        this.vx = 0;
        if (!held) {
          this.go("idle");
          break;
        }
        held.x = this.x + this.facing * 42 * this.scale;
        held.y = FLOOR;
        held.facing = -this.facing;
        if (intent.punch && this.knees < 3) {
          this.knees++;
          this.startMove("knee", host);
          this.state = "attack";
        } else if (intent.kick || intent.grab) {
          const back = intent.dx && Math.sign(intent.dx) !== this.facing;
          this.startMove(back ? "throwB" : "throwF", host);
        } else if (this.holdT > 1600) this.release();
        break;
      }
      case "held": {
        this.vx = 0;
        // Mashing breaks free sooner.
        this.vy = 0;
        const holder = this.heldBy;
        if (holder && (intent.punch || intent.kick || intent.jump || intent.grab)) holder.holdT += 160;
        if (!holder) {
          this.go("idle");
          break;
        }
        // Throws carry the body along an arc before letting go.
        if (holder.state === "attack" && holder.move && CARRIES.includes(holder.move)) this.carry(holder);
        this.computePose(dt, host);
        return;
      }
    }

    this.physics(dt, host);
    this.computePose(dt, host);
  }

  private tryAttack(intent: Intent, host: Host): boolean {
    let id: MoveId | null = null;
    const air = this.state === "air" || (this.state === "attack" && !this.grounded);
    // Running into an attack turns it into a running move.
    const running = this.state === "run" && this.runT > 200 && Math.abs(this.vx) > 300;
    if (intent.overload && this.meter >= 99) {
      id = "overload";
      this.meter -= 99;
    } else if (intent.special) {
      const sp: MoveId[][] = [[], ["rajada", "rajadaAr"], ["ciclone", "meteoro"], ["choque", "bolt"]];
      if (host.spend(this, SPECIAL_COST)) id = sp[intent.special][air ? 1 : 0];
      else {
        host.event("tired", this);
        const normal: (MoveId | null)[] = [null, air ? "airPunch" : this.chainNext(CHAIN_P), air ? "airKick" : this.chainNext(CHAIN_K), air ? null : "grab"];
        id = normal[intent.special];
      }
    } else if (intent.dodge && air) id = "diveKick";
    else if (intent.punch) {
      if (air) id = "airPunch";
      else if (intent.up) id = "uppercut";
      else if (running) id = "dashPunch";
      else id = this.chainNext(CHAIN_P);
    } else if (intent.kick) {
      if (air) id = intent.down ? "diveKick" : "airKick";
      else if (intent.up) id = "highKick";
      else if (running) id = "slideKick";
      else if (intent.down) id = "sweep";
      else id = this.chainNext(CHAIN_K);
    } else if (intent.grab && !air) id = running ? "tackle" : "grab";
    if (!id) return false;
    // Enemies only use the moves they know.
    if (this.arch && !this.arch.moves.includes(id) && id !== "airPunch") {
      const fallback = this.arch.moves.find((m) => m === "jab" || m === "cross") ?? this.arch.moves[0];
      id = fallback;
    }
    if (CHAIN_P.includes(id) || CHAIN_K.includes(id)) {
      const idx = Math.max(CHAIN_P.indexOf(id), CHAIN_K.indexOf(id));
      this.chain = idx + 1;
    } else this.chain = 0;
    this.runT = 0;
    this.startMove(id, host);
    return true;
  }

  private chainNext(list: MoveId[]): MoveId {
    const inChain = this.state === "attack" && this.move && (CHAIN_P.includes(this.move) || CHAIN_K.includes(this.move));
    const step = inChain ? Math.min(this.chain, list.length - 1) : 0;
    return list[step];
  }

  private updateAttack(dt: number, ms: number, intent: Intent, host: Host) {
    const id = this.move!;
    const m = moveOf(id);
    const before = this.moveT;
    this.moveT += ms;
    const [a, b] = m.active;
    if (m.lunge && this.moveT >= a - 40 && this.moveT <= b) this.vx = this.facing * m.lunge;
    else if (this.grounded && !m.air) this.vx *= Math.max(0, 1 - dt * 9);
    else if (m.float) this.vx *= Math.max(0, 1 - dt * 6);
    if (m.rehit) for (const t of m.rehit) if (before < t && this.moveT >= t) this.hitSet.clear();
    if (m.spins) this.spin = Math.PI * 2 * m.spins * EASES.io(Math.min(1, this.moveT / (m.spinEnd ?? m.active[1])));
    if (m.homeIn && this.homing && this.moveT < m.homeIn[0]) {
      // Close the gap before the first strike lands.
      const tx = this.homing.x - this.facing * m.homeIn[1] * this.scale;
      this.vx = Math.max(-1600, Math.min(1600, (tx - this.x) * 14));
    } else if (m.homeIn && this.moveT < m.homeIn[0] + 40) this.vx *= 0.5;
    if (m.dive && before < m.dive[0] && this.moveT >= m.dive[0]) this.vy = m.dive[1];
    if (m.vel && m.velAt && before < m.velAt && this.moveT >= m.velAt) {
      // Launch only once the dash-in has closed the gap.
      this.vx = m.vel[0] * this.facing;
      this.vy = m.vel[1];
      this.y = Math.min(this.y, FLOOR - 1);
    }
    if (id === "superChute" && this.homing && this.moveT < a + 60) {
      // Leap after the body that was thrown up, to meet it at the top.
      const t = this.homing.joints.hip;
      const tx = t.x - this.facing * 58 * this.scale;
      const ty = t.y + 70 * this.scale;
      this.vx = Math.max(-1100, Math.min(1100, (tx - this.x) * 9));
      this.vy = this.moveT < 70 ? 0 : Math.max(-1500, Math.min(700, (ty - this.y) * 9));
      this.y = Math.min(this.y, FLOOR - 1);
    }
    // The striking limb leaves an arc through the active frames.
    const hit = hitAt(m, this.moveT);
    if (hit && hit.joint !== "hip" && this.moveT >= a - 50 && this.moveT <= b + 40) {
      this.smear.push({ ...this.joints[hit.joint] });
      if (this.smear.length > 9) this.smear.shift();
    } else if (this.smear.length) this.smear.shift();
    if (before < a && this.moveT >= a) {
      if (m.whoosh) host.event(m.whoosh === "heavy" ? "whooshHeavy" : "whoosh", this);
      if (id === "throwOrb") host.orb(this);
      if (id === "stomp") host.event("stomp", this);
      if (id === "bolt") host.event("bolt", this);
      if (id === "overload") host.event("overload", this);
    }
    // Cancels: chain strings, launchers into a jump, anything into a special.
    if (m.cancel && this.moveT >= m.cancel) {
      if ((intent.punch || intent.kick) && (CHAIN_P.includes(id) || CHAIN_K.includes(id)) && this.chain < 3) {
        if (this.tryAttack(intent, host)) return;
      }
      if ((intent.special || intent.overload) && !m.special && this.tryAttack({ ...intent, punch: false, kick: false, grab: false }, host)) return;
      if (intent.jump && this.moveHit && this.grounded) {
        this.move = null;
        this.vy = -JUMP;
        this.y = FLOOR - 1;
        this.jumps = 1;
        this.go("air");
        host.event("jump", this);
        return;
      }
      if ((intent.punch || intent.kick) && !this.grounded && m.air) {
        if (this.tryAttack(intent, host)) return;
      }
    }
    if (m.untilLand) {
      if (this.grounded && this.moveT > 120) this.endMove(host, true);
      return;
    }
    if (this.moveT >= m.total) this.endMove(host, false);
  }

  private endMove(host: Host, landed: boolean) {
    const id = this.move;
    if (id === "lancar" && this.homing) {
      this.release();
      this.startMove("superChute", host);
      return;
    }
    if (id === "superChute" || (id && moveOf(id).homeIn)) this.homing = null;
    this.move = null;
    this.spin = 0;
    if (landed) host.event("land", this);
    if (this.holding && (id === "knee")) {
      this.state = "grab";
      return;
    }
    if (this.holding && id && CARRIES.includes(id)) this.release();
    if (this.grounded) this.special = false;
    this.go(this.grounded ? "idle" : "air");
  }

  private physics(dt: number, host: Host) {
    const airborne = !this.grounded || this.vy < 0;
    if (airborne) {
      const m = this.move ? moveOf(this.move) : null;
      const floating = this.state === "attack" && ((m?.float && this.moveT < m.active[1]) || (this.move === "superChute" && this.homing && this.moveT < m!.active[0] + 60));
      // Air attacks hang a little after they connect.
      const low = this.state === "attack" && m?.lowGravity && this.moveT < (m.dive?.[0] ?? m.active[1]) ? m.lowGravity : 1;
      const hang = floating ? 0 : this.state === "attack" && m?.air && this.moveHit && !m.untilLand ? Math.min(0.45, low) : low;
      // Floating specials hold still; the super kick keeps its chase velocity.
      if (floating && m?.float) this.vy = 0;
      this.vy += GRAVITY * dt * hang;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= FLOOR) {
      if (airborne && this.vy > 0) {
        this.y = FLOOR;
        this.vy = 0;
        this.jumps = 1;
        this.landAt = host.now;
        if (this.state !== "attack") this.special = false;
        if (this.state === "air") {
          this.go("idle");
          host.event("land", this);
        }
      }
      this.y = FLOOR;
    } else if (this.state !== "attack" && this.state !== "air" && this.state !== "held") this.state = "air";
    const pad = 18 * this.scale;
    this.x = Math.max(host.left + pad, Math.min(host.right - pad, this.x));
  }

  private updateRag(dtReal: number, scale: number, host: Host) {
    const rag = this.rag!;
    const wall = rag.step(dtReal, host.left, host.right, scale);
    if (wall) host.event("wall", this, rag.p.hip);
    this.x = rag.p.hip.x;
    this.y = FLOOR;
    if (rag.still > 0.35 && this.state === "rag") {
      if (this.alive) {
        this.ragFrom = rag.joints();
        this.rag = null;
        this.juggle = 0;
        this.vx = 0;
        this.vy = 0;
        this.invuln = 600;
        this.spin = 0;
        const foe = host.foe(this);
        if (foe) this.facing = Math.sign(foe.x - this.x) || this.facing;
        this.go("getup");
      } else this.go("dead");
    }
    if (this.state === "dead" && rag.still > 0.9) this.dissolve = Math.min(1, this.dissolve + dtReal * 0.9);
  }

  // --- Pose -------------------------------------------------------------------

  private computePose(dt: number, host: Host) {
    let p: Pose;
    const T = this.t;
    switch (this.state) {
      case "idle":
        // A light bounce on the balls of the feet.
        p = mixPose(POSES.stance, POSES.stance2, (Math.sin(host.now / 170 + this.id) + 1) / 2);
        break;
      case "walk": {
        this.phase += (dt * Math.abs(this.vx)) / 34;
        const k = (Math.sin(this.phase) + 1) / 2;
        p = mixPose(POSES.walk1, POSES.walk2, Math.sign(this.vx) === this.facing ? k : 1 - k);
        break;
      }
      case "run": {
        // The captured cycle advances with the ground covered, so feet don't slide.
        // The cycle advances with the ground covered, so the planted foot stays put.
        this.phase = (this.phase + (dt * Math.abs(this.vx) * RUN_RATE) / this.scale) % 1;
        p = runPose(this.phase, Math.min(1, Math.abs(this.vx) / RUN));
        break;
      }
      case "crouch":
        p = POSES.crouch;
        break;
      case "air":
        // Stretch on the way up, tuck at the top, reach for the floor coming down.
        p =
          this.vy < -380
            ? mixPose(POSES.jumpTuck, POSES.jumpStretch, Math.min(1, (-this.vy - 380) / 300))
            : this.vy < 380
              ? POSES.jumpTuck
              : mixPose(POSES.jumpTuck, POSES.jumpFall, Math.min(1, (this.vy - 380) / 400));
        if (this.jumps === 0) {
          p = POSES.flip;
          this.spin = Math.PI * 2 * ease(Math.min(1, T / 460));
          if (T > 460) p = POSES.fall;
        } else this.spin = 0;
        break;
      case "block":
        p = POSES.block;
        break;
      case "roll": {
        // Away from where it faces: a backflip; towards it: a forward roll.
        const back = this.rollDir !== this.facing;
        p = back ? POSES.flip : POSES.roll;
        this.spin = (back ? -1 : 1) * Math.PI * 2 * EASES.io(Math.min(1, T / 400));
        break;
      }
      case "hit":
        p = mixPose(this.pose, POSES.stance, Math.max(0, 1 - this.stun / 260) * 0.2);
        break;
      case "getup":
        p = mixPose(POSES.getup, POSES.stance, ease(Math.min(1, T / 520)));
        break;
      case "brace": {
        // Into the guard fast, then strain against the push.
        p = mixPose(POSES.stance, POSES.beamGuard, EASES.out(Math.min(1, T / 160)));
        const q = 0.03;
        p = { ...p, lean: p.lean + Math.sin(host.now / 21) * q, neck: p.neck + Math.sin(host.now / 27) * q };
        break;
      }
      case "charge": {
        // Swing the hands back, sink into the stance, then shake with the power.
        p = T < 260 ? mixPose(POSES.stance, POSES.beamWind, EASES.io(T / 260)) : mixPose(POSES.beamWind, POSES.beamCharge, EASES.io(Math.min(1, (T - 260) / 240)));
        const q = this.charge * 0.035;
        p = { ...p, lean: p.lean + Math.sin(host.now / 23) * q, neck: p.neck + Math.sin(host.now / 31) * q, thF: p.thF + Math.sin(host.now / 19) * q };
        break;
      }
      case "grab":
        p = POSES.hold;
        break;
      case "held":
        p = this.heldBy?.state === "attack" && this.heldBy.move && CARRIES.includes(this.heldBy.move) ? POSES.fall : POSES.heldHunch;
        break;
      case "attack":
        p = this.movePose();
        break;
      default:
        p = POSES.stance;
    }
    if (this.state !== "air" && this.state !== "roll" && this.state !== "attack" && this.state !== "held") this.spin = 0;
    // Landing squash and the hit jolt ride on top of whatever pose is showing.
    const squash = Math.max(0, 1 - (host.now - this.landAt) / 140);
    if (squash > 0 && this.grounded && this.state !== "attack") p = mixPose(p, POSES.crouch, squash * 0.45);
    if (this.jolt > 0.01) {
      p = { ...p, lean: p.lean - this.jolt * 0.35, neck: p.neck + this.jolt * 0.5 };
      this.jolt *= Math.exp(-dt * 7);
    }
    // Blend towards the new pose so state changes never pop. Attacks follow
    // their keyframes closely; everything else eases in.
    const rate = this.state === "attack" ? 60 : this.state === "hit" ? 30 : 20;
    this.shown = mixPose(this.shown, p, 1 - Math.exp(-dt * rate));
    p = this.shown;
    this.pose = p;

    let rel = fk(p, this.scale);
    if (this.spin) {
      const c = Math.cos(this.spin * this.facing);
      const s = Math.sin(this.spin * this.facing);
      const cy = -40 * this.scale;
      for (const k of JOINTS) {
        const j = rel[k];
        const y = j.y - cy;
        rel[k] = { x: j.x * c - y * s, y: j.x * s + y * c + cy };
      }
      void rel;
    }
    const grounded = this.grounded && this.state !== "air" && this.state !== "held";
    // Grounded poses plant the lowest foot; running adds the flight between steps.
    const drop =
      this.state === "run"
        ? footDrop(rel) + runLift(this.phase, Math.min(1, Math.abs(this.vx) / RUN)) * this.scale
        : grounded || this.state === "roll"
          ? footDrop(rel)
          : 76 * this.scale;
    const m = this.state === "attack" && this.move ? moveOf(this.move) : null;
    const turned = m?.turn && this.moveT >= m.turn[0] && this.moveT < m.turn[1];
    let j = place(rel, this.x, this.y - drop, turned ? -this.facing : this.facing);
    if (this.state === "getup" && this.ragFrom) j = mixJoints(this.ragFrom, j, ease(Math.min(1, T / 340)));
    this.joints = j;
    rel = j;
  }

  private movePose(): Pose {
    const m = moveOf(this.move!);
    if (m.track) return this.trackPose(m);
    // Keyframes joined by a spline, each segment timed by its ease.
    const keys: Pose[] = [this.startPose, ...m.frames.map(([id]) => POSES[id as PoseId])];
    const times = [0, ...m.frames.map(([, t]) => t)];
    for (let i = 1; i < keys.length; i++) {
      if (this.moveT <= times[i]) {
        const span = times[i] - times[i - 1];
        const k = span > 0 ? (this.moveT - times[i - 1]) / span : 1;
        const u = EASES[m.frames[i - 1][2] ?? "out"](Math.max(0, Math.min(1, k)));
        const a = keys[Math.max(0, i - 2)];
        const d = keys[Math.min(keys.length - 1, i + 1)];
        return splinePose(a, keys[i - 1], keys[i], d, u);
      }
    }
    return keys[keys.length - 1];
  }

  /** A captured kick, retimed so its peak lands on the move's strike. */
  private trackPose(m: ReturnType<typeof moveOf>): Pose {
    const { name, peakAt } = m.track!;
    const track = KICK_POSES[name];
    const peak = KICK_TRACKS[name].peak;
    const last = track.length - 1;
    const t = this.moveT;
    const s = t < peakAt ? peak * Math.pow(t / peakAt, 0.8) : peak + (last - peak) * Math.min(1, (t - peakAt) / (m.total - peakAt));
    let p = sampleTrack(track, s);
    // Snap the leg straight around the peak so the strike reads clearly.
    const near = Math.exp(-(((s - peak) / 3) ** 2));
    p = { ...p, shF: p.shF * (1 - 0.75 * near) };
    // Ease in from whatever pose the move started from.
    const blend = Math.min(1, t / 60);
    return blend < 1 ? mixPose(this.startPose, p, blend) : p;
  }

  /** The point a move hits from, in world space. */
  hitPoint(): Vec | null {
    if (this.state !== "attack" || !this.move) return null;
    const m = moveOf(this.move);
    const spec = hitAt(m, this.moveT);
    if (!spec && !m.grab) return null;
    if (this.moveT < m.active[0] || this.moveT > m.active[1]) return null;
    return this.joints[spec?.joint ?? "handF"];
  }

  /** Puts a held body where the holder's throw has it right now. */
  private carry(holder: Fighter) {
    const m = moveOf(holder.move!);
    const k = Math.min(1, holder.moveT / m.active[0]);
    const f = holder.facing;
    const s = holder.scale;
    let x: number;
    let lift: number;
    let spin: number;
    if (holder.move === "throwF") {
      // Pulled in, hoisted onto the hip, heaved forward.
      x = 42 - 14 * Math.sin(k * Math.PI) + 30 * k * k;
      lift = 70 * Math.sin((k * Math.PI) / 2);
      spin = -0.9 * k;
    } else if (holder.move === "throwB") {
      // Swung up and over the head.
      const a = k * Math.PI;
      x = 46 * Math.cos(a);
      lift = 30 + 110 * Math.sin(a);
      spin = Math.PI * k;
    } else {
      // Toss: dipped low, then pressed up overhead before it lets go.
      const dip = Math.sin(Math.min(1, k / 0.45) * Math.PI) * 0.25;
      const up = Math.max(0, (k - 0.35) / 0.65);
      x = 42 - 26 * up;
      lift = 20 - 30 * dip + 130 * up * up;
      spin = -0.4 * up;
    }
    this.x = holder.x + f * x * s;
    this.y = FLOOR - lift * s;
    this.spin = spin;
    this.facing = -f;
  }

  snapshot() {
    this.trail.unshift(this.joints);
    if (this.trail.length > (this.special ? 10 : 6)) this.trail.pop();
  }
}

const D = Math.PI / 180;
const KICK_POSES = Object.fromEntries(Object.entries(KICK_TRACKS).map(([k, v]) => [k, v.poses.map(poseOf)])) as Record<string, Pose[]>;

/**
 * One leg through a sprint, as [phase, thigh, shin] in degrees; phase 0 is
 * the foot striking the ground. Contact, the knee giving under the weight,
 * the push-off behind, the heel snapping up to the hip, the knee driving
 * high, the shin reaching out for the next strike.
 */
const STRIDE: [number, number, number][] = [
  [0, 26, -14],
  [0.1, 8, -32],
  [0.24, -26, -18],
  [0.34, -36, -62],
  [0.48, -14, -124],
  [0.6, 40, -122],
  [0.74, 70, -92],
  [0.88, 48, -34],
];
/** The foot leaves the ground here; until the other foot lands, both are up. */
const TOE_OFF = 0.34;

function legAt(ph: number): [number, number] {
  ph = ((ph % 1) + 1) % 1;
  const n = STRIDE.length;
  let i = n - 1;
  while (i > 0 && STRIDE[i][0] > ph) i--;
  const k = (o: number) => STRIDE[(((i + o) % n) + n) % n];
  const t0 = k(0)[0];
  const t1 = i + 1 < n ? k(1)[0] : 1;
  const u = (ph - t0) / (t1 - t0);
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(k(-1)[1], k(0)[1], k(1)[1], k(2)[1]), cr(k(-1)[2], k(0)[2], k(1)[2], k(2)[2])];
}

/**
 * Phase per world unit: while one foot is planted (phase 0 to toe-off) the
 * body travels exactly as far as that foot moves back under the hip.
 */
const RUN_RATE = (() => {
  const footX = (ph: number) => {
    const [th, sh] = legAt(ph);
    return Math.sin(th * D) * 38 + Math.sin((th + sh) * D) * 38;
  };
  return TOE_OFF / (footX(0) - footX(TOE_OFF));
})();

/**
 * A sprinter at phase `ph` (0..1); `k` is how close to full speed. The body
 * leans into the run, the arms pump opposite the legs with the elbows bent
 * near 90 degrees, hands driving from the hip up to the chin.
 */
function runPose(ph: number, k: number): Pose {
  const amp = 0.55 + 0.45 * k;
  const [thF, shF] = legAt(ph);
  const [thB, shB] = legAt(ph + 0.5);
  // Each arm swings with the opposite leg: forward as that knee drives up.
  const arm = (legPh: number) => Math.cos(2 * Math.PI * (legPh - 0.74));
  const aF = arm(ph + 0.5) * amp;
  const aB = arm(ph) * amp;
  return {
    lean: (10 + 14 * k + 2 * Math.sin(4 * Math.PI * ph)) * D,
    neck: (-12 - 4 * k) * D,
    uaF: (6 + 62 * aF) * D,
    faF: (90 - 24 * aF) * D,
    uaB: (6 + 62 * aB) * D,
    faB: (90 - 24 * aB) * D,
    thF: thF * amp * D,
    shF: shF * D,
    thB: thB * amp * D,
    shB: shB * D,
  };
}

/** Height gained in the flight between one foot leaving and the other landing. */
function runLift(ph: number, k: number) {
  const u = ((ph % 0.5) - TOE_OFF) / (0.5 - TOE_OFF);
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) * 9 * k : 0;
}
