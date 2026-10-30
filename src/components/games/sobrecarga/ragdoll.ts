import { BONES, JOINTS, SEGMENTS, type Joint, type Joints, type Vec } from "./skeleton";

// Verlet ragdoll: a point per joint, kept together by distance constraints.
// A fighter switches to it when launched or knocked down, so every fall,
// bounce and juggle is simulated instead of canned.

export const GRAVITY = 2400;
export const FLOOR = 0;
/** Fixed simulation step, seconds. */
export const STEP = 1 / 120;

interface Stick {
  a: Joint;
  b: Joint;
  len: number;
}

export interface WallHit {
  side: -1 | 1;
  speed: number;
}

export class Ragdoll {
  p = {} as Record<Joint, Vec>;
  q = {} as Record<Joint, Vec>;
  sticks: Stick[] = [];
  /** Seconds the body has been still on the floor. */
  still = 0;
  bounced = false;
  groundBounce = false;
  wallBounce = 0;
  /** Time scale of the previous step, so slow motion keeps momentum. */
  private prevScale = 1;

  constructor(
    from: Joints,
    vel: Vec,
    public scale: number,
  ) {
    const dt = STEP;
    for (const k of JOINTS) {
      this.p[k] = { ...from[k] };
      this.q[k] = { x: from[k].x - vel.x * dt, y: from[k].y - vel.y * dt };
    }
    const s = scale;
    const link = (a: Joint, b: Joint, len?: number) => this.sticks.push({ a, b, len: len ?? Math.hypot(from[a].x - from[b].x, from[a].y - from[b].y) });
    for (const [a, b] of SEGMENTS) {
      const len =
        a === "hip" && b === "neck" ? BONES.torso * s : b.startsWith("elbow") ? BONES.ua * s : b.startsWith("hand") ? BONES.fa * s : b.startsWith("knee") ? BONES.th * s : BONES.sh * s;
      link(a, b, len);
    }
    link("neck", "head", (BONES.neck + BONES.head) * s);
    link("shoulder", "neck", BONES.torso * s * 0.06);
    link("shoulder", "hip", BONES.torso * s * 0.94);
    // A loose brace keeps the head from folding into the chest.
    link("head", "hip", (BONES.torso + BONES.neck + BONES.head) * s * 0.96);
  }

  /** Pushes the whole body (and the struck point a little more). */
  impulse(v: Vec, at?: Joint) {
    const dt = STEP * this.prevScale;
    for (const k of JOINTS) {
      const extra = k === at ? 1.4 : 1;
      this.q[k].x -= v.x * dt * extra;
      this.q[k].y -= v.y * dt * extra;
    }
    this.still = 0;
  }

  velocity(): Vec {
    const dt = STEP * this.prevScale;
    return { x: (this.p.hip.x - this.q.hip.x) / dt, y: (this.p.hip.y - this.q.hip.y) / dt };
  }

  /** One fixed step; returns a wall hit when the body slams into one. */
  step(dt: number, left: number, right: number, scale = 1): WallHit | null {
    const ratio = scale / this.prevScale;
    this.prevScale = scale;
    dt *= scale;
    const g = GRAVITY * dt * dt;
    let wall: WallHit | null = null;
    let floorContact = 0;
    let speed = 0;
    for (const k of JOINTS) {
      const p = this.p[k];
      const q = this.q[k];
      // Velocity is scaled by the step ratio so slow motion keeps momentum.
      let vx = (p.x - q.x) * 0.996 * ratio;
      const vy = (p.y - q.y) * 0.996 * ratio;
      const r = k === "head" ? BONES.head * this.scale : 3;
      if (p.y >= FLOOR - r - 1) {
        vx *= 0.86;
        floorContact++;
      }
      q.x = p.x;
      q.y = p.y;
      p.x += vx;
      p.y += vy + g;
      speed = Math.max(speed, Math.hypot(vx, vy) / dt);
    }
    for (let i = 0; i < 6; i++) {
      for (const s of this.sticks) {
        const a = this.p[s.a];
        const b = this.p[s.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - s.len) / d / 2;
        a.x += dx * diff;
        a.y += dy * diff;
        b.x -= dx * diff;
        b.y -= dy * diff;
      }
      for (const k of JOINTS) {
        const p = this.p[k];
        const q = this.q[k];
        const r = k === "head" ? BONES.head * this.scale : 3;
        if (p.y > FLOOR - r) {
          const vy = p.y - q.y;
          p.y = FLOOR - r;
          // A ground bounce (from a dive kick) throws the body back up once.
          if (this.groundBounce && vy > 4) {
            q.y = p.y + vy * 0.75;
            this.bounced = true;
          } else if (vy > 0) q.y = p.y + vy * 0.25;
        }
        if (p.x < left + r || p.x > right - r) {
          const side = p.x < left + r ? -1 : 1;
          const vx = p.x - q.x;
          p.x = side < 0 ? left + r : right - r;
          const restitution = this.wallBounce > 0 ? 0.9 : 0.35;
          q.x = p.x + vx * restitution;
          if (Math.abs(vx) / dt > 300) wall = { side, speed: Math.abs(vx) / dt };
        }
      }
    }
    if (this.bounced) {
      this.groundBounce = false;
      this.bounced = false;
    }
    if (wall && this.wallBounce > 0) this.wallBounce--;
    this.still = floorContact >= 3 && speed < 60 ? this.still + dt : 0;
    return wall;
  }

  joints(): Joints {
    const out = {} as Joints;
    for (const k of JOINTS) out[k] = { ...this.p[k] };
    return out;
  }
}
