import type { Fighter } from "./fighter";
import { MOVES, type MoveId } from "./moves";
import { FLOOR } from "./ragdoll";
import { BONES, SEGMENTS, type Joints, type Vec } from "./skeleton";
import { ARENA, PICKUPS, RANKS, type Game, type Pickup } from "./world";

// Draws a frame: the server-room arena, fighters as thick-lined stick
// figures with reflections and trails, effects, then the HUD.

const MOVE_START = Object.fromEntries(Object.entries(MOVES).map(([id, m]) => [id, m.active[0]])) as Record<MoveId, number>;
const INK = "#0e0e0e";
const PAPER = "#f4f2ec";
const RED = "#e23b2e";
const AMBER = "#f3b14e";
const RANK_COLORS = ["#8d8a82", "#b9b5aa", PAPER, AMBER, "#ff8a3d", RED, RED];
export const RANK_WORDS = {
  pt: ["Debug", "Compila", "Build", "Aprovado", "Sênior", "Staff", "SOBRECARGA!"],
  en: ["Debug", "Compiles", "Build", "Approved", "Senior", "Staff", "OVERLOAD!"],
};

export const TEXT = {
  pt: { round: "RODADA", wave: "ONDA", fight: "LUTE!", hits: "ACERTOS", best: "RECORDE", slow: "BATERIA", over: "SOBRECARGA", ready: "PRONTA · ESPAÇO", hp: "CARLOS", endless: "SEM FIM" },
  en: { round: "ROUND", wave: "WAVE", fight: "FIGHT!", hits: "HITS", best: "BEST", slow: "BATTERY", over: "OVERLOAD", ready: "READY · SPACE", hp: "CARLOS", endless: "ENDLESS" },
};

interface View {
  W: number;
  H: number;
  k: number;
  camX: number;
  floorY: number;
}

/** 0..1 through an enemy's wind-up, 0 otherwise. */
function windup(f: Fighter) {
  if (f.team !== 1 || f.state !== "attack" || !f.move) return 0;
  const start = MOVE_START[f.move] ?? 0;
  return start > 0 && f.moveT < start ? Math.min(1, f.moveT / start) * 0.55 : 0;
}

function lighten(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * k);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c * (1 - amount) + 14 * amount);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

export function render(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number, best: number) {
  const k = (H / 600) * g.cam.zoom;
  const half = W / 2 / k;
  const camX = ARENA.right - ARENA.left < half * 2 ? 0 : Math.max(ARENA.left + half, Math.min(ARENA.right - half, g.cam.x));
  // The camera lifts with aerial specials: the floor sinks down the screen.
  const floorY = H * 0.84 - g.cam.y * k;
  const v: View = { W, H, k, camX, floorY };
  const shake = g.shake > 0 ? g.shake * (H / 720) : 0;

  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  if (g.cam.rot) {
    ctx.translate(W / 2, H / 2);
    ctx.rotate(g.cam.rot);
    ctx.scale(1.06, 1.06);
    ctx.translate(-W / 2, -H / 2);
  }
  background(ctx, g, v);
  // Specials dim the world so only the fighters stay lit.
  if (g.cineK > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${0.55 * g.cineK})`;
    ctx.fillRect(-W, -H, W * 3, H * 3);
  }

  const sx = (x: number) => W / 2 + (x - camX) * k;
  const sy = (y: number) => floorY + y * k;
  const S = (p: Vec) => ({ x: sx(p.x), y: sy(p.y) });

  // Fighters: the fallen first, the player last.
  const order = [...g.fighters].sort((a, b) => Number(a.alive) - Number(b.alive) || a.team - b.team);
  // Reflections on the polished floor.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, floorY, W, H - floorY);
  ctx.clip();
  ctx.globalAlpha = 0.1;
  for (const f of order) drawFigure(ctx, f, f.joints, (p) => ({ x: sx(p.x), y: floorY - p.y * k }), k, g, true);
  ctx.restore();

  for (const f of order) {
    const lift = Math.max(0, -Math.min(f.joints.footB.y, f.joints.footF.y, f.joints.hip.y + 60));
    const w = 34 * f.scale * k * Math.max(0.4, 1 - lift / 400);
    ctx.fillStyle = `rgba(0,0,0,${0.45 * (1 - f.dissolve)})`;
    ctx.beginPath();
    ctx.ellipse(sx(f.joints.hip.x), floorY + 2, w, w * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const it of g.pickups) drawPickup(ctx, it, S, k);
  powerAura(ctx, g, S, k);
  if (g.cineK > 0.01) speedLines(ctx, g, S(g.player.joints.hip), W, H);
  for (const f of order) smear(ctx, f, S, k, g);
  // The finisher splits the colour channels for a moment.
  if (g.now < g.chromaUntil) {
    const off = 6 * k * ((g.chromaUntil - g.now) / 320);
    for (const f of order) {
      if (!f.alive && f !== g.chainTarget) continue;
      ctx.globalAlpha = 0.55;
      drawFigure(ctx, f, f.joints, (p) => ({ x: sx(p.x) - off, y: sy(p.y) }), k, g, false, "#ff2b4a");
      drawFigure(ctx, f, f.joints, (p) => ({ x: sx(p.x) + off, y: sy(p.y) }), k, g, false, "#33e0ff");
      ctx.globalAlpha = 1;
    }
  }
  phantomFists(ctx, g, S, k);
  for (const f of order) {
    f.trail.forEach((t, i) => {
      ctx.globalAlpha = 0.16 * (1 - i / f.trail.length) * (1 - f.dissolve);
      drawFigure(ctx, f, t, S, k, g, false, f.team === 0 ? RED : f.color);
    });
    ctx.globalAlpha = 1 - f.dissolve;
    drawFigure(ctx, f, f.joints, S, k, g, false);
    ctx.globalAlpha = 1;
  }

  effects(ctx, g, S, k);
  for (const f of g.enemies) enemyBar(ctx, f, S, k, g);
  // Impact frame: two frames of white silhouettes on black.
  if (g.now - g.impactAt < 90) {
    ctx.fillStyle = "#000";
    ctx.fillRect(-W, -H, W * 3, H * 3);
    for (const f of order) silhouette(ctx, f, S, k, f.team === 0 ? "#f4f2ec" : "#e23b2e");
  }
  ctx.restore();

  overlays(ctx, g, W, H);
  hud(ctx, g, W, H, best);
}

/** A pickup: a glowing badge with its icon, bobbing; it blinks before it goes. */
function drawPickup(ctx: CanvasRenderingContext2D, it: Pickup, S: (p: Vec) => Vec, k: number) {
  if (it.life < 3 && Math.floor(it.life * 8) % 2 === 0) return;
  const info = PICKUPS[it.kind];
  const bob = it.y >= -19 ? Math.sin(it.t * 4) * 5 - 8 : 0;
  const c = S({ x: it.x, y: it.y + bob });
  const r = 17 * k;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.shadowColor = info.color;
  ctx.shadowBlur = 18 * k;
  ctx.fillStyle = INK;
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 3 * k;
  ctx.beginPath();
  ctx.roundRect(-r, -r, r * 2, r * 2, 6 * k);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = info.color;
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 2.5 * k;
  const u = k;
  ctx.beginPath();
  if (it.kind === "cafe") {
    // a cup with a handle and steam
    ctx.fillRect(-8 * u, -3 * u, 13 * u, 11 * u);
    ctx.arc(7 * u, 2 * u, 4 * u, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    for (const x of [-5, 1]) {
      ctx.moveTo(x * u, -6 * u);
      ctx.quadraticCurveTo((x + 3) * u, -9 * u, x * u, -13 * u);
    }
    ctx.stroke();
  } else if (it.kind === "bateria") {
    ctx.strokeRect(-10 * u, -6 * u, 18 * u, 12 * u);
    ctx.fillRect(8 * u, -3 * u, 3 * u, 6 * u);
    ctx.fillRect(-7 * u, -3 * u, 12 * u, 6 * u);
  } else if (it.kind === "carga") {
    ctx.moveTo(2 * u, -12 * u);
    ctx.lineTo(-7 * u, 2 * u);
    ctx.lineTo(0, 2 * u);
    ctx.lineTo(-3 * u, 12 * u);
    ctx.lineTo(7 * u, -3 * u);
    ctx.lineTo(0, -3 * u);
    ctx.closePath();
    ctx.fill();
  } else if (it.kind === "firewall") {
    ctx.moveTo(0, -11 * u);
    ctx.lineTo(9 * u, -7 * u);
    ctx.quadraticCurveTo(8 * u, 7 * u, 0, 12 * u);
    ctx.quadraticCurveTo(-8 * u, 7 * u, -9 * u, -7 * u);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(-1.5 * u, -6 * u, 3 * u, 12 * u);
  } else {
    // a chip with pins
    ctx.strokeRect(-7 * u, -7 * u, 14 * u, 14 * u);
    for (const d of [-4, 0, 4]) {
      ctx.fillRect(d * u - u, -11 * u, 2 * u, 4 * u);
      ctx.fillRect(d * u - u, 7 * u, 2 * u, 4 * u);
    }
    ctx.fillRect(-3 * u, -3 * u, 6 * u, 6 * u);
  }
  ctx.restore();
}

/** Firewall and overclock show on the player: a shield ring and a red heat. */
function powerAura(ctx: CanvasRenderingContext2D, g: Game, S: (p: Vec) => Vec, k: number) {
  const p = g.player;
  if (!p.alive) return;
  const c = S({ x: p.joints.hip.x, y: p.joints.hip.y - 20 });
  if (g.now < p.shieldUntil) {
    const fade = Math.min(1, (p.shieldUntil - g.now) / 1500);
    ctx.save();
    ctx.strokeStyle = `rgba(111,207,115,${0.55 * fade})`;
    ctx.lineWidth = 3 * k;
    ctx.setLineDash([10 * k, 6 * k]);
    ctx.lineDashOffset = -g.now / 20;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 62 * k, 96 * k, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (g.now < p.boostUntil) {
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const a = g.now / 140 + i;
      const y = ((g.now / 4 + i * 37) % 120) * k;
      ctx.fillStyle = `rgba(255,138,61,${0.5 - y / (240 * k)})`;
      ctx.fillRect(c.x + Math.sin(a) * 26 * k, c.y + 60 * k - y, 4 * k, 4 * k);
    }
    ctx.restore();
  }
}

/** Radial speed lines streaming away from the player during a special. */
function speedLines(ctx: CanvasRenderingContext2D, g: Game, c: Vec, W: number, H: number) {
  const n = 46;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 12.9898 + Math.floor(g.now / 60)) * 0.08;
    const r0 = H * (0.32 + ((i * 37) % 11) / 40) + ((g.now / 2 + i * 53) % (H * 0.3));
    const len = H * (0.12 + ((i * 17) % 7) / 30);
    ctx.strokeStyle = i % 5 === 0 ? `rgba(226,59,46,${0.35 * g.cineK})` : `rgba(244,242,236,${0.12 * g.cineK})`;
    ctx.lineWidth = i % 5 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x + Math.cos(a) * r0, c.y + Math.sin(a) * r0);
    ctx.lineTo(c.x + Math.cos(a) * (r0 + len), c.y + Math.sin(a) * (r0 + len));
    ctx.stroke();
  }
  ctx.restore();
  void W;
}

/** The barrage throws more fists than two arms could: afterimage punches. */
function phantomFists(ctx: CanvasRenderingContext2D, g: Game, S: (p: Vec) => Vec, k: number) {
  const p = g.player;
  if ((p.move !== "rajada" && p.move !== "rajadaAr") || p.moveT < 80 || p.moveT > 500) return;
  const sh = S(p.joints.shoulder);
  const reach = 56 * p.scale * k;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const seed = Math.sin(Math.floor(g.now / 45) * 7.13 + i * 3.7);
    const a = seed * 0.55;
    const len = reach * (0.75 + ((i * 29) % 10) / 30);
    const hx = sh.x + Math.cos(a) * len * p.facing;
    const hy = sh.y + Math.sin(a) * len;
    ctx.globalAlpha = 0.18 + (i % 3) * 0.08;
    ctx.strokeStyle = i % 2 ? "#e23b2e" : "#f4f2ec";
    ctx.lineWidth = 7 * p.scale * k;
    ctx.beginPath();
    ctx.moveTo(sh.x, sh.y);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(hx, hy, 6 * p.scale * k, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A flat, thick silhouette for impact frames. */
function silhouette(ctx: CanvasRenderingContext2D, f: Fighter, S: (p: Vec) => Vec, k: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = 10 * f.scale * k;
  for (const [a, b] of SEGMENTS) {
    const A = S(f.joints[a]);
    const B = S(f.joints[b]);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }
  const h = S(f.joints.head);
  ctx.beginPath();
  ctx.arc(h.x, h.y, (BONES.head + 2) * f.scale * k, 0, Math.PI * 2);
  ctx.fill();
}

/** The arc a strike leaves behind: a tapered ribbon along the limb's path. */
function smear(ctx: CanvasRenderingContext2D, f: Fighter, S: (p: Vec) => Vec, k: number, g: Game) {
  const pts = f.smear.map(S);
  if (pts.length < 3) return;
  const color = f.team === 0 ? (g.slowOn ? RED : PAPER) : f.color;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 1; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.08 + 0.32 * t;
    ctx.lineWidth = (2 + 14 * t) * f.scale * k;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  ctx.restore();
  // On contact the arc hardens into a solid wedge for the freeze frames.
  if (g.hitstop > 0 && f.moveHit && f.state === "attack" && pts.length >= 4) {
    const path = pts.slice(-6);
    const left: Vec[] = [];
    const right: Vec[] = [];
    path.forEach((q, i) => {
      const nxt = path[Math.min(path.length - 1, i + 1)];
      const prv = path[Math.max(0, i - 1)];
      const dx = nxt.x - prv.x;
      const dy = nxt.y - prv.y;
      const n = Math.hypot(dx, dy) || 1;
      const w = (i / (path.length - 1)) * 11 * f.scale * k;
      left.push({ x: q.x - (dy / n) * w, y: q.y + (dx / n) * w });
      right.push({ x: q.x + (dy / n) * w, y: q.y - (dx / n) * w });
    });
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (const q of left) ctx.lineTo(q.x, q.y);
    for (const q of right.reverse()) ctx.lineTo(q.x, q.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function background(ctx: CanvasRenderingContext2D, g: Game, v: View) {
  const { W, H, k, camX, floorY } = v;
  const grad = ctx.createLinearGradient(0, 0, 0, floorY);
  grad.addColorStop(0, "#0b0b0b");
  grad.addColorStop(1, "#171615");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, floorY);

  // Server racks along the back wall, with blinking lights.
  const par = 0.4;
  const rackW = 120 * k;
  const first = Math.floor((camX * par - W / 2 / k) / 130) - 1;
  for (let i = first; i < first + Math.ceil(W / (130 * k)) + 3; i++) {
    const x = W / 2 + (i * 130 - camX * par) * k;
    const h = (260 + ((i * 97) % 5) * 40) * k;
    const top = floorY - 60 * k - h;
    ctx.fillStyle = "#141413";
    ctx.fillRect(x, top, rackW, h);
    ctx.strokeStyle = "rgba(244,242,236,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, top + 0.5, rackW - 1, h - 1);
    for (let r = 0; r < h / (22 * k) - 1; r++) {
      const y = top + 12 * k + r * 22 * k;
      ctx.fillStyle = "rgba(244,242,236,0.035)";
      ctx.fillRect(x + 8 * k, y, rackW - 16 * k, 12 * k);
      const seed = Math.sin(i * 12.9 + r * 78.2) * 43758.5;
      const blink = Math.sin(g.now / (300 + (Math.abs(seed) % 900)) + seed) > 0.2;
      if (blink) {
        ctx.fillStyle = Math.abs(seed) % 7 < 1 ? RED : Math.abs(seed) % 7 < 3 ? AMBER : "#6fcf73";
        ctx.fillRect(x + rackW - 22 * k, y + 4 * k, 4 * k, 4 * k);
      }
    }
  }

  // The stage name, huge and faint, between the racks and the ring.
  ctx.save();
  ctx.font = `italic 900 ${Math.round(200 * k)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.strokeStyle = "rgba(244,242,236,0.07)";
  ctx.lineWidth = 2;
  ctx.strokeText(g.stageName.toUpperCase(), W / 2 - camX * 0.7 * k, floorY - 70 * k);
  ctx.restore();

  // Floor with a perspective grid.
  const fg = ctx.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0, "#1a1918");
  fg.addColorStop(1, "#0c0c0c");
  ctx.fillStyle = fg;
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.strokeStyle = "rgba(244,242,236,0.06)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    const y = floorY + (H - floorY) * Math.pow(i / 7, 1.8);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  const vp = { x: W / 2, y: floorY - (H - floorY) * 2.2 };
  for (let x = Math.floor((camX - W / k) / 100) * 100; x < camX + W / k; x += 100) {
    const top = W / 2 + (x - camX) * k;
    const t = (floorY - vp.y) / (H - vp.y);
    const bottom = vp.x + (top - vp.x) / t;
    ctx.beginPath();
    ctx.moveTo(top, floorY);
    ctx.lineTo(bottom, H);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(226,59,46,0.5)";
  ctx.fillRect(0, floorY - 1, W, 2);

  // Ring posts at both walls.
  for (const wx of [ARENA.left, ARENA.right]) {
    const x = W / 2 + (wx - camX) * k;
    if (x < -40 || x > W + 40) continue;
    ctx.fillStyle = "#1f1e1c";
    ctx.fillRect(x - 6 * k, floorY - 330 * k, 12 * k, 330 * k);
    ctx.fillStyle = RED;
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 2 * k, floorY - (80 + i * 70) * k, 4 * k, 30 * k);
  }
}

function drawFigure(ctx: CanvasRenderingContext2D, f: Fighter, j: Joints, S: (p: Vec) => Vec, k: number, g: Game, reflection: boolean, tint?: string) {
  const s = f.scale;
  const width = 7.5 * s * k;
  const base = tint ?? (f.flash > 0 && !reflection ? "#ffffff" : windup(f) > 0 && !reflection ? lighten(f.color, windup(f)) : f.color);
  const back = tint ?? shade(base.startsWith("#") ? base : "#ffffff", 0.38);
  const P = (n: keyof Joints) => S(j[n]);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const glow = f.team === 0 && f.meter >= 99 && !reflection && !tint;
  const line = (a: keyof Joints, b: keyof Joints, color: string, w: number) => {
    const A = P(a);
    const B = P(b);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  };
  if (!tint) {
    // Dark outline so overlapping figures stay readable.
    for (const [a, b] of SEGMENTS) line(a, b, INK, width + 4 * k);
    line("neck", "head", INK, width + 4 * k);
  }
  if (glow) {
    ctx.shadowColor = RED;
    ctx.shadowBlur = (10 + Math.sin(g.now / 90) * 6) * k;
  }
  for (const [a, b] of SEGMENTS) {
    const far = a.endsWith("B") || b.endsWith("B");
    line(a, b, far ? back : base, tint ? width * 0.6 : width);
  }
  line("neck", "head", base, width * 0.8);
  ctx.shadowBlur = 0;

  // The player's circuit: a red line down the spine, hands lit with charge.
  if (f.team === 0 && !tint) {
    const N = P("neck");
    const Hp = P("hip");
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.moveTo(N.x, N.y);
    ctx.lineTo((N.x + Hp.x) / 2 + 3 * k, (N.y + Hp.y) / 2);
    ctx.lineTo(Hp.x, Hp.y);
    ctx.stroke();
    if (f.meter >= 33 && !reflection) {
      for (const h of ["handF", "handB"] as const) {
        const p = P(h);
        ctx.fillStyle = RED;
        ctx.shadowColor = RED;
        ctx.shadowBlur = 8 * k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
  if (tint) return;
  drawHead(ctx, f, j, S, k, base);
}

function drawHead(ctx: CanvasRenderingContext2D, f: Fighter, j: Joints, S: (p: Vec) => Vec, k: number, color: string) {
  const h = S(j.head);
  const n = S(j.neck);
  const r = BONES.head * f.scale * k;
  const ang = Math.atan2(h.y - n.y, h.x - n.x) + Math.PI / 2;
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.rotate(ang);
  ctx.lineWidth = 3 * k;
  ctx.strokeStyle = INK;
  ctx.fillStyle = color;
  switch (f.head) {
    case "square":
      ctx.beginPath();
      ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.fillRect(-r * 0.25, -r * 0.1, r * 0.5, r * 0.55);
      break;
    case "ring":
      ctx.beginPath();
      ctx.arc(0, 0, r + 1.5 * k, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * k;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.moveTo(-r, r);
      ctx.lineTo(r, -r);
      ctx.stroke();
      break;
    case "crt": {
      ctx.beginPath();
      ctx.roundRect(-r * 1.3, -r * 1.05, r * 2.6, r * 2.1, r * 0.25);
      ctx.fillStyle = "#132513";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * k;
      ctx.stroke();
      ctx.fillStyle = color;
      for (let y = -r * 0.7; y < r * 0.8; y += r * 0.35) ctx.fillRect(-r, y, r * 2, r * 0.1);
      ctx.fillRect(-r * 0.6, -r * 0.3, r * 0.35, r * 0.35);
      ctx.fillRect(r * 0.25, -r * 0.3, r * 0.35, r * 0.35);
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (f.head === "antenna") {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * k;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(side * r * 0.4, -r * 0.9);
          ctx.lineTo(side * r * 0.9, -r * 1.9);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(side * r * 0.9, -r * 1.9, 2.2 * k, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
  }
  ctx.restore();
}

function effects(ctx: CanvasRenderingContext2D, g: Game, S: (p: Vec) => Vec, k: number) {
  for (const r of g.rings) {
    const c = S({ x: r.x, y: r.y });
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = Math.max(0, r.life / r.max);
    ctx.lineWidth = 4 * k;
    ctx.beginPath();
    if (r.y === FLOOR) ctx.ellipse(c.x, c.y, r.r * k, r.r * k * 0.18, 0, 0, Math.PI * 2);
    else ctx.arc(c.x, c.y, r.r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const s of g.sparks) {
    const p = S(s);
    const a = Math.max(0, s.life / s.max);
    ctx.globalAlpha = a;
    if (s.kind === "spark") {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size * k;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - s.vx * 0.03 * k, p.y - s.vy * 0.03 * k);
      ctx.stroke();
    } else if (s.kind === "dust") {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size * k, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = s.color;
      ctx.fillRect(p.x, p.y, s.size * k, s.size * k);
    }
  }
  ctx.globalAlpha = 1;
  // Lightning: a fresh jagged path every frame.
  ctx.lineCap = "round";
  for (const a of g.arcs) {
    const A = S(a.a);
    const B = S(a.b);
    for (const [color, w] of [
      [RED, 6],
      [PAPER, 2],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w * k;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      for (let i = 1; i < 8; i++) {
        const t = i / 8;
        ctx.lineTo(A.x + (B.x - A.x) * t + (Math.random() - 0.5) * 30 * k, A.y + (B.y - A.y) * t + (Math.random() - 0.5) * 30 * k);
      }
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }
  }
  for (const o of g.orbs) {
    const p = S(o);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(g.now / 120);
    ctx.shadowColor = o.team === 0 ? PAPER : "#a77bd6";
    ctx.shadowBlur = 14 * k;
    ctx.fillStyle = o.team === 0 ? PAPER : "#a77bd6";
    ctx.fillRect(-9 * k, -9 * k, 18 * k, 18 * k);
    ctx.fillStyle = INK;
    ctx.fillRect(-4 * k, -4 * k, 8 * k, 8 * k);
    ctx.restore();
  }
  for (const t of g.texts) {
    const p = S(t);
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.font = `italic 900 ${Math.round((t.big ? 34 : 20) * k)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 5 * k;
    ctx.strokeStyle = INK;
    ctx.strokeText(t.text, p.x, p.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

function enemyBar(ctx: CanvasRenderingContext2D, f: Fighter, S: (p: Vec) => Vec, k: number, g: Game) {
  // Heavy attacks flash a warning while they wind up, so they can be dodged.
  if (f.alive && f.state === "attack" && f.move && (f.move === "haymaker" || f.move === "stomp")) {
    const start = f.move === "haymaker" ? 360 : 440;
    if (f.moveT < start) {
      const h = S(f.joints.head);
      const pulse = 0.6 + Math.sin(g.now / 50) * 0.4;
      ctx.fillStyle = `rgba(226,59,46,${pulse})`;
      ctx.font = `italic 900 ${Math.round(30 * k)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("!", h.x, h.y - 26 * f.scale * k);
    }
  }
  if (!f.alive || f.kind === "legacy") return;
  const recent = g.now - f.lastHit < 2200;
  if (f.hp >= f.maxHp && !recent) return;
  const h = S(f.joints.head);
  const w = 64 * f.scale * k;
  const y = h.y - 30 * f.scale * k;
  ctx.fillStyle = "rgba(14,14,14,0.85)";
  ctx.fillRect(h.x - w / 2 - 2, y - 2, w + 4, 8 * k + 4);
  ctx.fillStyle = f.color;
  ctx.fillRect(h.x - w / 2, y, (w * f.hp) / f.maxHp, 8 * k);
  if (recent) {
    ctx.font = `600 ${Math.round(11 * k)}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(244,242,236,0.8)";
    ctx.fillText(f.arch!.name[g.lang].toUpperCase(), h.x, y - 6 * k);
  }
}

function overlays(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number) {
  const slow = g.slowOn || g.forced.ms > 0;
  if (slow) {
    ctx.fillStyle = g.slowOn ? "rgba(226,59,46,0.06)" : "rgba(244,242,236,0.05)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  }
  if (g.cineK > 0.01) {
    // Cinema bars slide in and out, with the special's name between them.
    const k = g.cineK;
    const bar = H * 0.09 * k;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.fillStyle = RED;
    ctx.fillRect(0, bar - 2, W, 2);
    ctx.fillRect(0, H - bar, W, 2);
    const u = Math.min(W / 1280, H / 720);
    // The title card slashes in from the side, holds, then fades with the bars.
    const t = Math.min(1, (g.now - g.cineAt) / 260);
    const slide = 1 - Math.pow(1 - t, 3);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(W * 0.5 + (1 - slide) * W * 0.6, H * 0.2);
    ctx.rotate(-0.06);
    ctx.fillStyle = RED;
    ctx.fillRect(-W * 0.36 * slide, -40 * u, W * 0.72 * slide, 80 * u);
    ctx.fillStyle = INK;
    ctx.fillRect(-W * 0.36 * slide, 36 * u, W * 0.72 * slide, 6 * u);
    ctx.transform(1, 0, -0.22, 1, 0, 0);
    ctx.font = `italic 900 ${Math.round(70 * u)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.fillText(g.cine.name, 0, 4 * u);
    ctx.restore();
  }
  const flash = Math.max(0, 1 - (g.now - g.flashAt) / 260);
  if (flash > 0) {
    ctx.fillStyle = `rgba(244,242,236,${0.55 * flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  const hurt = Math.max(0, 1 - (g.now - g.hurtAt) / 350);
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, hurt > 0 ? `rgba(226,59,46,${0.45 * hurt})` : slow ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function hud(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number, best: number) {
  const u = Math.min(W / 1280, H / 720);
  const T = TEXT[g.lang];
  const p = g.player;
  const pad = 24 * u;
  ctx.textBaseline = "alphabetic";

  // Health, time and overload, top left.
  ctx.font = `700 ${Math.round(12 * u)}px ui-monospace, monospace`;
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(244,242,236,0.7)";
  ctx.fillText(T.hp, pad, pad + 10 * u);
  const bw = 300 * u;
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const x = pad + i * (bw / segs);
    const fill = Math.max(0, Math.min(1, (p.hp / p.maxHp) * segs - i));
    ctx.fillStyle = "rgba(244,242,236,0.12)";
    ctx.fillRect(x, pad + 18 * u, bw / segs - 3 * u, 14 * u);
    const healed = Math.max(0, 1 - (g.now - g.healAt) / 900);
    ctx.fillStyle = healed > 0 ? AMBER : p.hp < p.maxHp * 0.3 ? RED : PAPER;
    ctx.fillRect(x, pad + 18 * u, (bw / segs - 3 * u) * fill, 14 * u);
  }
  const tired = Math.max(0, 1 - (g.now - g.tiredAt) / 500);
  ctx.fillStyle = tired > 0 ? `rgba(226,59,46,${0.6 + tired * 0.4})` : "rgba(244,242,236,0.6)";
  ctx.fillText(T.slow, pad, pad + 50 * u);
  for (let i = 0; i < 3; i++) {
    const x = pad + 64 * u + i * 52 * u;
    const fill = Math.max(0, Math.min(1, g.slowMeter / 0.34 - i));
    ctx.fillStyle = "rgba(159,195,255,0.14)";
    ctx.fillRect(x, pad + 41 * u, 46 * u, 9 * u);
    ctx.fillStyle = fill >= 1 ? "#9fc3ff" : "rgba(159,195,255,0.5)";
    ctx.fillRect(x, pad + 41 * u, 46 * u * fill, 9 * u);
    ctx.fillStyle = fill >= 1 ? INK : "rgba(244,242,236,0.5)";
    ctx.font = `800 ${Math.round(8 * u)}px ui-monospace, monospace`;
    ctx.fillText("QWE"[i], x + 3 * u, pad + 48.5 * u);
    ctx.font = `700 ${Math.round(12 * u)}px ui-monospace, monospace`;
  }
  for (let i = 0; i < 3; i++) {
    const x = pad + i * 58 * u;
    const fill = Math.max(0, Math.min(1, p.meter / 33 - i));
    ctx.fillStyle = "rgba(226,59,46,0.18)";
    ctx.fillRect(x, pad + 60 * u, 52 * u, 10 * u);
    ctx.fillStyle = RED;
    if (fill >= 1) {
      ctx.shadowColor = RED;
      ctx.shadowBlur = 10 * u;
    }
    ctx.fillRect(x, pad + 60 * u, 52 * u * fill, 10 * u);
    ctx.shadowBlur = 0;
  }
  // Active power-ups count down under the bars.
  let px = pad;
  for (const [kind, until, total] of [
    ["firewall", p.shieldUntil, 9000],
    ["overclock", p.boostUntil, 10000],
  ] as const) {
    if (g.now >= until) continue;
    const info = PICKUPS[kind];
    ctx.fillStyle = info.color;
    ctx.font = `800 ${Math.round(10 * u)}px ui-monospace, monospace`;
    ctx.fillText(info.name[g.lang], px, pad + 90 * u);
    ctx.fillStyle = "rgba(244,242,236,0.12)";
    ctx.fillRect(px, pad + 95 * u, 90 * u, 4 * u);
    ctx.fillStyle = info.color;
    ctx.fillRect(px, pad + 95 * u, 90 * u * Math.max(0, (until - g.now) / total), 4 * u);
    px += 110 * u;
  }
  ctx.font = `700 ${Math.round(12 * u)}px ui-monospace, monospace`;
  const ready = p.meter >= 99;
  ctx.fillStyle = ready ? (Math.sin(g.now / 120) > 0 ? RED : PAPER) : "rgba(226,59,46,0.85)";
  ctx.fillText(ready ? `${T.over} ${T.ready}` : T.over, pad + 180 * u, pad + 70 * u);

  // Stage and waves, top center.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(244,242,236,0.75)";
  ctx.font = `700 ${Math.round(12 * u)}px ui-monospace, monospace`;
  const label = g.endless >= 0 ? `${T.endless} · ${T.wave} ${g.endless + 1}` : `${T.round} ${g.stage + 1} · ${g.stageName}`;
  ctx.fillText(label.toUpperCase(), W / 2, pad + 10 * u);
  if (g.endless < 0) {
    for (let i = 0; i < g.waveCount; i++) {
      const x = W / 2 + (i - (g.waveCount - 1) / 2) * 18 * u;
      ctx.fillStyle = i < g.wave || (i === g.wave && g.phase === "clear") ? RED : i === g.wave ? PAPER : "rgba(244,242,236,0.2)";
      ctx.fillRect(x - 5 * u, pad + 20 * u, 10 * u, 4 * u);
    }
  }

  // Score, best, combo and style rank, top right.
  ctx.textAlign = "right";
  ctx.font = `italic 900 ${Math.round(34 * u)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = PAPER;
  ctx.fillText(String(g.score).padStart(7, "0"), W - pad, pad + 26 * u);
  ctx.font = `700 ${Math.round(11 * u)}px ui-monospace, monospace`;
  ctx.fillStyle = "rgba(244,242,236,0.5)";
  ctx.fillText(`${T.best} ${String(Math.max(best, g.score)).padStart(7, "0")}`, W - pad, pad + 44 * u);
  if (g.combo >= 2) {
    ctx.font = `italic 900 ${Math.round(56 * u)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = PAPER;
    ctx.fillText(String(g.combo), W - pad - 90 * u, pad + 106 * u);
    ctx.font = `700 ${Math.round(12 * u)}px ui-monospace, monospace`;
    ctx.fillStyle = "rgba(244,242,236,0.7)";
    ctx.fillText(T.hits, W - pad - 90 * u, pad + 122 * u);
  }
  if (g.style > 10) {
    const r = g.rank;
    ctx.font = `italic 900 ${Math.round(64 * u)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = RANK_COLORS[r];
    if (r >= 5) {
      ctx.shadowColor = RED;
      ctx.shadowBlur = 16 * u;
    }
    ctx.fillText(RANKS[r], W - pad, pad + 108 * u);
    ctx.shadowBlur = 0;
    ctx.font = `800 ${Math.round(12 * u)}px ui-monospace, monospace`;
    ctx.fillText(RANK_WORDS[g.lang][r].toUpperCase(), W - pad, pad + 124 * u);
  }

  // Boss bar.
  const boss = g.enemies.find((e) => e.kind === "legacy" && e.alive);
  if (boss) {
    const w = Math.min(720 * u, W - pad * 2);
    const y = H - pad - 14 * u;
    ctx.textAlign = "center";
    ctx.font = `italic 900 ${Math.round(18 * u)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = boss.color;
    ctx.fillText(boss.arch!.name[g.lang].toUpperCase(), W / 2, y - 10 * u);
    ctx.fillStyle = "rgba(244,242,236,0.12)";
    ctx.fillRect(W / 2 - w / 2, y, w, 12 * u);
    ctx.fillStyle = boss.hp < boss.maxHp * 0.5 ? RED : boss.color;
    ctx.fillRect(W / 2 - w / 2, y, (w * boss.hp) / boss.maxHp, 12 * u);
  }

  // Banners.
  ctx.textAlign = "center";
  if (g.phase === "intro") {
    const t = g.phaseT;
    const big = t < 1050 ? `${T.round} ${g.stage + 1}` : T.fight;
    if (g.endless >= 0 && t < 1050) banner(ctx, `${T.endless}`, W, H, u, t);
    else banner(ctx, big, W, H, u, t < 1050 ? t : t - 1050, t < 1050 ? g.stageName.toUpperCase() : undefined);
  } else if (g.phase === "wave") {
    banner(ctx, `${T.wave} ${g.endless >= 0 ? g.endless + 2 : g.wave + 2}${g.endless >= 0 ? "" : `/${g.waveCount}`}`, W, H, u, g.phaseT);
  }
}

function banner(ctx: CanvasRenderingContext2D, text: string, W: number, H: number, u: number, t: number, sub?: string) {
  const inK = Math.min(1, t / 180);
  ctx.save();
  ctx.globalAlpha = Math.min(1, inK * 1.4);
  ctx.translate(W / 2 + (1 - inK) * 200 * u, H * 0.42);
  ctx.transform(1, 0, -0.18, 1, 0, 0);
  ctx.fillStyle = RED;
  ctx.fillRect(-W, -46 * u, W * 2, 92 * u);
  ctx.font = `italic 900 ${Math.round(76 * u)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 4 * u);
  ctx.restore();
  if (sub) {
    ctx.font = `700 ${Math.round(16 * u)}px ui-monospace, monospace`;
    ctx.fillStyle = PAPER;
    ctx.globalAlpha = inK;
    ctx.fillText(sub, W / 2, H * 0.42 + 76 * u);
    ctx.globalAlpha = 1;
  }
}
