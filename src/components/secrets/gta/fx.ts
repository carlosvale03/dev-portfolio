// Imperative effects for the San Andreas cheats: one full-screen canvas for
// particles, a document-space layer for decals (bullet holes, scorch marks,
// shurikens) and Web Animations "knocks" that push page elements around and
// let them settle back. Everything here is decorative.

type Kind = "spark" | "fire" | "smoke" | "debris" | "shell" | "ring";

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  rot: number;
  vr: number;
}

interface Slash {
  points: { x: number; y: number }[];
  life: number;
}

const GRAVITY = 1400;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

class Effects {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private slashes: Slash[] = [];
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  detach() {
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.particles = [];
    this.slashes = [];
    this.canvas = null;
    this.ctx = null;
  }

  private resize = () => {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private add(p: Omit<Particle, "life" | "rot" | "vr"> & Partial<Pick<Particle, "rot" | "vr">>) {
    if (!this.ctx) return;
    this.particles.push({ rot: 0, vr: 0, ...p, life: 0 });
    if (this.particles.length > 900) this.particles.splice(0, this.particles.length - 900);
    this.start();
  }

  private start() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  /** Muzzle flash: a hot core plus sparks thrown along `angle`. */
  muzzle(x: number, y: number, angle = -Math.PI / 2, spread = Math.PI * 2) {
    this.add({ kind: "fire", x, y, vx: 0, vy: 0, max: 0.09, size: 26 });
    for (let i = 0; i < 9; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(260, 620);
      this.add({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(0.12, 0.28), size: rand(1, 2) });
    }
  }

  /** Dust and chips where a bullet lands. */
  impact(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const a = rand(-Math.PI, 0);
      const v = rand(80, 260);
      this.add({ kind: "debris", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(0.35, 0.6), size: rand(1.5, 3), vr: rand(-12, 12) });
    }
    this.add({ kind: "smoke", x, y, vx: rand(-10, 10), vy: -30, max: 0.7, size: 10 });
  }

  /** A spent brass casing kicked out to the right, falling with gravity. */
  shell(x: number, y: number) {
    this.add({ kind: "shell", x: x + 8, y, vx: rand(140, 260), vy: rand(-420, -300), max: 1.6, size: 1, vr: rand(14, 24) });
  }

  /** Fireball, smoke, debris and a shockwave ring. `scale` 1 is a tank shell. */
  explosion(x: number, y: number, scale = 1) {
    this.add({ kind: "ring", x, y, vx: 0, vy: 0, max: 0.45, size: 160 * scale });
    for (let i = 0; i < 26 * scale; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(40, 260) * scale;
      this.add({ kind: "fire", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, max: rand(0.35, 0.75), size: rand(18, 42) * scale });
    }
    for (let i = 0; i < 14 * scale; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(20, 120) * scale;
      this.add({ kind: "smoke", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, max: rand(1, 1.8), size: rand(20, 40) * scale });
    }
    for (let i = 0; i < 22 * scale; i++) {
      const a = rand(-Math.PI, 0);
      const v = rand(300, 760) * scale;
      this.add({ kind: "debris", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(0.8, 1.4), size: rand(2, 5), vr: rand(-16, 16) });
    }
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(400, 900) * scale;
      this.add({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: rand(0.2, 0.45), size: 2 });
    }
  }

  /** A soft puff, used when a shuriken bites. */
  puff(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      const a = rand(0, Math.PI * 2);
      this.add({ kind: "smoke", x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, max: rand(0.5, 0.8), size: rand(8, 14) });
    }
  }

  /** Katana trail: a fading stroke through the given points. */
  slash(points: { x: number; y: number }[]) {
    if (!this.ctx || points.length < 2) return;
    this.slashes.push({ points: points.slice(-24), life: 0 });
    this.start();
  }

  private tick = (now: number) => {
    const ctx = this.ctx;
    if (!ctx) return;
    // rAF hands over the frame's start time, which can be a hair earlier than
    // the moment the first particle was added: never step backwards.
    const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000));
    this.last = now;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const s of this.slashes) {
      s.life += dt;
      const a = 1 - s.life / 0.35;
      if (a <= 0) continue;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 5 * a + 1;
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.restore();
    }
    this.slashes = this.slashes.filter((s) => s.life < 0.35);

    for (const p of this.particles) {
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) continue;
      if (p.kind === "debris" || p.kind === "shell" || p.kind === "spark") p.vy += GRAVITY * dt * (p.kind === "spark" ? 0.4 : 1);
      if (p.kind === "fire") {
        p.vx *= 0.92;
        p.vy = p.vy * 0.92 - 40 * dt;
      }
      if (p.kind === "smoke") {
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 30 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      this.draw(ctx, p, t);
    }
    this.particles = this.particles.filter((p) => p.life < p.max);

    if (this.particles.length || this.slashes.length) this.raf = requestAnimationFrame(this.tick);
    else this.raf = 0;
  };

  private draw(ctx: CanvasRenderingContext2D, p: Particle, t: number) {
    switch (p.kind) {
      case "spark": {
        ctx.strokeStyle = `rgba(255,${200 - t * 120},90,${1 - t})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
        break;
      }
      case "fire": {
        const r = p.size * (0.6 + t * 0.8);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(255,250,210,${1 - t})`);
        g.addColorStop(0.35, `rgba(255,170,40,${0.9 * (1 - t)})`);
        g.addColorStop(1, "rgba(200,40,10,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        break;
      }
      case "smoke": {
        const r = p.size * (0.6 + t * 1.6);
        ctx.fillStyle = `rgba(70,66,62,${0.35 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "debris": {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(40,34,30,${1 - t * t})`;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
        break;
      }
      case "shell": {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = "#d9a441";
        ctx.fillRect(-1.5, -4, 3, 8);
        ctx.fillStyle = "#8a5e1c";
        ctx.fillRect(-1.5, 3, 3, 1.5);
        ctx.restore();
        break;
      }
      case "ring": {
        ctx.strokeStyle = `rgba(255,236,200,${0.7 * (1 - t)})`;
        ctx.lineWidth = 6 * (1 - t) + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * t), 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
    }
  }
}

export const fx = new Effects();

// --- Decals ----------------------------------------------------------------
// A decal sticks to the page element it hit: its position is stored as a
// fraction of that element's box and re-read every frame, so holes ride along
// with knocks, parallax and scrolling, and vanish with the element.

const DECAL_LIMIT = 90;

interface Decal {
  node: HTMLSpanElement;
  el: Element;
  fx: number;
  fy: number;
}

let decals: Decal[] = [];
let followRaf = 0;

function decalLayer() {
  let layer = document.getElementById("gta-decals");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "gta-decals";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function follow() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Read every box first, then write, to keep layout work to one pass.
  const boxes = decals.map((d) => (d.el.isConnected ? d.el.getBoundingClientRect() : null));
  decals = decals.filter((d, i) => {
    const r = boxes[i];
    if (!r || !d.node.isConnected) {
      d.node.remove();
      return false;
    }
    const x = r.left + d.fx * r.width;
    const y = r.top + d.fy * r.height;
    const off = x < -60 || y < -60 || x > vw + 60 || y > vh + 60 || r.width === 0;
    d.node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    d.node.style.visibility = off ? "hidden" : "";
    return true;
  });
  followRaf = decals.length ? requestAnimationFrame(follow) : 0;
}

/** Leaves a mark on `el` at the viewport point (x, y). */
export function decal(kind: "hole" | "scorch" | "shuriken", el: Element, x: number, y: number, rotation = 0) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const node = document.createElement("span");
  node.className = `gta-decal gta-${kind}`;
  node.style.setProperty("--r", `${rotation}deg`);
  const inner = document.createElement("span");
  node.appendChild(inner);
  decalLayer().appendChild(node);
  decals.push({ node, el, fx: (x - r.left) / r.width, fy: (y - r.top) / r.height });
  while (decals.length > DECAL_LIMIT) decals.shift()?.node.remove();
  inner.addEventListener("animationend", () => node.remove());
  if (!followRaf) followRaf = requestAnimationFrame(follow);
}

export function clearDecals() {
  cancelAnimationFrame(followRaf);
  followRaf = 0;
  decals = [];
  document.getElementById("gta-decals")?.remove();
}

// --- Targets and knocks ------------------------------------------------------
// Only solid page content takes hits: titles, text, cards, images. Empty
// background, fixed bars and moving decoration (marquees, particles, the
// floating stickers) let shots pass.

const TARGETS = "article, figure, img, li, h1, h2, h3, h4, p, blockquote, dt, dd, button, [data-float]";
const BIG_TARGETS = "article, figure, img, li, h1, h2, h3, button, [data-float]";

const tooBig = (r: DOMRect) => r.width * r.height > window.innerWidth * window.innerHeight * 0.35;
const outside = (el: Element) => !!el.closest("[data-gta-ui], #gta-decals, dialog, [data-gta-skip], canvas");

function pinned(el: Element) {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const pos = getComputedStyle(n).position;
    if (pos === "fixed" || pos === "sticky") return true;
  }
  return false;
}

/** The solid page element under a point, or null when the shot hits nothing. */
export function targetAt(x: number, y: number): HTMLElement | null {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el || outside(el) || pinned(el)) return null;
  while (el && el !== document.body) {
    if (el.matches(TARGETS) && !tooBig(el.getBoundingClientRect())) return el;
    el = el.parentElement;
  }
  return null;
}

/** Visible elements around a point, outermost first, nearest first. */
export function targetsNear(x: number, y: number, radius: number, limit = 12) {
  const picked: { el: HTMLElement; dx: number; dy: number; d: number }[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(BIG_TARGETS)) {
    if (outside(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    if (pinned(el)) continue;
    if (r.bottom < 0 || r.top > window.innerHeight || r.width < 8 || tooBig(r)) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(cx - x, cy - y);
    if (d < radius) picked.push({ el, dx: cx - x, dy: cy - y, d });
  }
  // Skip elements whose ancestor already moves, so nothing flies twice as far.
  const chosen = picked.filter((p) => !picked.some((o) => o !== p && o.el.contains(p.el)));
  return chosen.sort((a, b) => a.d - b.d).slice(0, limit);
}

/** Every visible card-like element, for the "blow up everything" cheat. */
export function visibleTargets(limit = 14) {
  return targetsNear(window.innerWidth / 2, window.innerHeight / 2, Math.hypot(window.innerWidth, window.innerHeight), 60)
    .filter(({ el }) => {
      const r = el.getBoundingClientRect();
      return r.width * r.height > 1800 && r.top > 60;
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

/**
 * Pushes an element by (dx, dy) and lets it spring back. `composite: "add"`
 * stacks the push on top of whatever transform the element already has.
 */
export function knock(el: Element, dx: number, dy: number, rotate = 0, duration = 520) {
  el.animate(
    [
      { transform: "translate(0px, 0px) rotate(0deg)" },
      { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`, offset: 0.22 },
      { transform: `translate(${-dx * 0.18}px, ${-dy * 0.18}px) rotate(${-rotate * 0.25}deg)`, offset: 0.62 },
      { transform: `translate(${dx * 0.05}px, ${dy * 0.05}px) rotate(0deg)`, offset: 0.85 },
      { transform: "translate(0px, 0px) rotate(0deg)" },
    ],
    { duration, easing: "cubic-bezier(.2,.8,.3,1)", composite: "add" },
  );
}

/** Thrown into the air, falls, then flies back into place. */
export function blowAway(el: Element, delay: number) {
  const dir = Math.random() < 0.5 ? -1 : 1;
  const dx = dir * rand(60, 220);
  const up = -rand(160, 380);
  const rot = dir * rand(25, 160);
  el.animate(
    [
      { transform: "translate(0px, 0px) rotate(0deg)", offset: 0 },
      { transform: `translate(${dx * 0.6}px, ${up}px) rotate(${rot * 0.6}deg)`, offset: 0.18 },
      { transform: `translate(${dx}px, ${up * 0.2 + 140}px) rotate(${rot}deg)`, offset: 0.42 },
      { transform: `translate(${dx}px, ${up * 0.2 + 140}px) rotate(${rot}deg)`, offset: 0.62 },
      { transform: `translate(${-dx * 0.06}px, -8px) rotate(${-rot * 0.04}deg)`, offset: 0.86 },
      { transform: "translate(0px, 0px) rotate(0deg)", offset: 1 },
    ],
    { duration: 3200, delay, easing: "cubic-bezier(.25,.8,.3,1)", composite: "add", fill: "backwards" },
  );
}

/** A short shake of the page content (not the fixed overlays). */
export function shake(power = 10) {
  document.getElementById("conteudo")?.animate(
    [
      { transform: "translate(0,0)" },
      { transform: `translate(${-power}px, ${power * 0.6}px)` },
      { transform: `translate(${power * 0.8}px, ${-power * 0.5}px)` },
      { transform: `translate(${-power * 0.5}px, ${-power * 0.3}px)` },
      { transform: `translate(${power * 0.3}px, ${power * 0.2}px)` },
      { transform: "translate(0,0)" },
    ],
    { duration: 380, easing: "ease-out", composite: "add" },
  );
}
