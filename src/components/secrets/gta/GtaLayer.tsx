"use client";

import {
  AnimatePresence,
  animate,
  m,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { useExperience } from "../../shell/ExperienceProvider";
import { MAVERICK, Maverick, RhinoGun, RhinoHull, RhinoTurret, SEARCHLIGHT, Shuriken, WHEELS, Wheel, type WeaponId } from "./art";
import { CJ, cjPose } from "./CJ";
import { Hud, type Ammo } from "./Hud";
import { blowAway, clearDecals, decal, fx, knock, shake, targetAt, targetsNear, visibleTargets } from "./fx";

const WEAPONS: Record<WeaponId, { clip: number; total: number; pellets: number; spread: number; rate: number; push: number }> = {
  pistol: { clip: 17, total: 170, pellets: 1, spread: 0, rate: 0, push: 9 },
  shotgun: { clip: 4, total: 40, pellets: 6, spread: 34, rate: 0, push: 16 },
  uzi: { clip: 50, total: 500, pellets: 1, spread: 10, rate: 75, push: 6 },
};
const ORDER: WeaponId[] = ["pistol", "shotgun", "uzi"];
const FULL_AMMO = () => Object.fromEntries(ORDER.map((w) => [w, { clip: WEAPONS[w].clip, total: WEAPONS[w].total }])) as Record<WeaponId, Ammo>;

const TANK_W = 340;
const TANK_H = 150;
// Turret ring inside the tank box, the gun trunnion relative to it, and the
// gun length from the trunnion.
const RING = { x: 170, y: 50 };
const TRUNNION = { x: 88, y: -12 };
const GUN_LEN = 184;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Everything the San Andreas cheats draw on screen. Loaded on demand the first
// time one of them runs.
export default function GtaLayer() {
  const exp = useExperience();
  const { gta, content, cheat, reducedMotion, mode, terminalOpen, game, projectId, manualOpen } = exp;
  const ui = content.ui;

  const [weapon, setWeapon] = useState<WeaponId>("pistol");
  const [ammo, setAmmo] = useState(FULL_AMMO);
  const [reloading, setReloading] = useState(false);
  const [firing, setFiring] = useState(false);
  const shots = useRef(0);
  const busy = useRef(false);
  const lastTank = useRef(0);
  const drag = useRef<{ x: number; y: number }[] | null>(null);

  const px = useMotionValue(-200);
  const py = useMotionValue(-200);
  const recoil = useMotionValue(1);
  const kick = useMotionValue(0);
  const flash = useMotionValue(0);
  const lower = useMotionValue(0);

  // CJ stands at the bottom of the screen and drifts towards the cursor, like
  // the camera following him while he aims.
  const bodyX = useSpring(
    useTransform(() => {
      const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
      const half = Math.min(170, vw * 0.24);
      // Until the pointer moves (px is still off screen) he stays centered.
      const x = px.get() < 0 ? vw / 2 : px.get();
      return Math.min(vw - half, Math.max(half, vw / 2 + (x - vw / 2) * 0.5));
    }),
    { stiffness: 70, damping: 18, mass: 1.2 },
  );
  const pose = () => cjPose(px.get(), py.get(), bodyX.get(), weapon, 0, lower.get(), 0);

  const blocked = terminalOpen || !!game || !!projectId || manualOpen;
  const live = !!gta.armed && !blocked;

  // The fx canvas is attached by <FxCanvas>; decals belong to the page they hit.
  useEffect(() => clearDecals, []);
  useEffect(() => clearDecals(), [mode]);

  useEffect(() => {
    const root = document.documentElement;
    if (live && gta.armed) root.dataset.armed = gta.armed;
    else delete root.dataset.armed;
    return () => {
      delete root.dataset.armed;
    };
  }, [live, gta.armed]);

  // --- guns ------------------------------------------------------------------
  const heat = (every: number) => {
    shots.current += 1;
    if (shots.current % every === 0) exp.addWanted(1);
  };

  const reload = (w: WeaponId) => {
    if (busy.current) return;
    busy.current = true;
    setReloading(true);
    // CJ drops the gun to his chest to reload, then brings it back up.
    animate(lower, [0, 1, 1, 0], { duration: 0.9, times: [0, 0.25, 0.7, 1], ease: "easeInOut" });
    if (w === "shotgun" && !reducedMotion) {
      const { hand } = pose();
      fx.shell(hand.x, hand.y);
      fx.shell(hand.x - 6, hand.y + 4);
    }
    window.setTimeout(() => {
      busy.current = false;
      setAmmo((a) => {
        // Out of spare ammo: the weapon comes back with what it started with.
        if (a[w].total <= 0) return { ...a, [w]: FULL_AMMO()[w] };
        const take = Math.min(WEAPONS[w].clip, a[w].total);
        return { ...a, [w]: { clip: take, total: a[w].total - take } };
      });
      setReloading(false);
    }, 900);
  };

  const shoot = (x: number, y: number) => {
    if (busy.current) return;
    const spec = WEAPONS[weapon];
    const current = ammo[weapon];
    if (current.clip <= 0) {
      reload(weapon);
      return;
    }
    const clip = current.clip - 1;
    setAmmo((a) => ({ ...a, [weapon]: { ...a[weapon], clip } }));
    if (clip === 0) window.setTimeout(() => reload(weapon), 140);

    animate(recoil, [1.7, 1], { type: "spring", stiffness: 700, damping: 18 });
    animate(kick, [0, 1, 0], { duration: weapon === "shotgun" ? 0.42 : 0.2, times: [0, 0.12, 1], ease: ["easeOut", "easeInOut"] });
    animate(flash, [1, 0], { duration: weapon === "shotgun" ? 0.12 : 0.07 });
    if (!reducedMotion) {
      const { muzzle, hand, aim } = pose();
      fx.muzzle(muzzle.x, muzzle.y, aim, 0.9);
      if (weapon !== "shotgun") fx.shell(hand.x, hand.y - 10);
    }
    // Bullets only leave a mark on solid page content; empty space eats them.
    for (let i = 0; i < spec.pellets; i++) {
      const hx = x + (spec.spread ? rand(-spec.spread, spec.spread) : 0);
      const hy = y + (spec.spread ? rand(-spec.spread, spec.spread) : 0);
      const el = targetAt(hx, hy);
      if (!el) continue;
      decal("hole", el, hx, hy, rand(0, 360));
      if (reducedMotion) continue;
      fx.impact(hx, hy);
      const r = el.getBoundingClientRect();
      const dx = Math.sign(r.left + r.width / 2 - hx) || 1;
      knock(el, dx * spec.push * 0.6, -spec.push * 0.4, dx * rand(0.5, 2.5), 360);
    }
    heat(15);
  };

  // The Uzi keeps firing while the button is held.
  const autoShot = useEffectEvent(() => shoot(px.get(), py.get()));
  useEffect(() => {
    const rate = WEAPONS[weapon].rate;
    if (!firing || !rate || !live) return;
    const id = window.setInterval(() => autoShot(), rate);
    return () => window.clearInterval(id);
  }, [firing, weapon, live]);
  const stopAuto = () => setFiring(false);

  // Swapping weapons: the hands dip out of sight and come back with the new one.
  const swap = (next: WeaponId) => {
    stopAuto();
    if (next === weapon) return;
    animate(lower, [0, 1, 0], { duration: 0.45, ease: "easeInOut" });
    window.setTimeout(() => setWeapon(next), 200);
  };
  const cycle = (dir = 1) => swap(ORDER[(ORDER.indexOf(weapon) + dir + ORDER.length) % ORDER.length]);

  // --- tank ------------------------------------------------------------------
  const tankX = useSpring(px, { stiffness: 38, damping: 16, mass: 2.4 });
  const tankKick = useMotionValue(0);
  // The turret turns to whichever side the cursor is on; the gun elevates.
  const trunnion = (facing: number) => ({
    x: clampTank(tankX.get()) - TANK_W / 2 + RING.x + facing * TRUNNION.x,
    y: window.innerHeight - TANK_H - 8 + RING.y + TRUNNION.y,
  });
  const facing = useTransform((): number => (px.get() >= clampTank(tankX.get()) - TANK_W / 2 + RING.x ? 1 : -1));
  const elevation = useTransform(() => {
    const f = facing.get();
    const t = trunnion(f);
    const e = Math.atan2(t.y - py.get(), Math.abs(px.get() - t.x));
    return Math.min(1.45, Math.max(-0.05, e));
  });

  const fireTank = (x: number, y: number, now: number) => {
    if (now - lastTank.current < 650) return;
    lastTank.current = now;
    const f = facing.get();
    const e = elevation.get();
    const t = trunnion(f);
    const tip = { x: t.x + f * Math.cos(e) * GUN_LEN, y: t.y - Math.sin(e) * GUN_LEN };
    animate(tankKick, [-16 * f, 0], { type: "spring", stiffness: 300, damping: 12 });
    if (reducedMotion) {
      boom(x, y);
      return;
    }
    fx.muzzle(tip.x, tip.y, Math.atan2(y - tip.y, x - tip.x), 0.7);
    fx.explosion(tip.x, tip.y, 0.25);
    shell(tip, { x, y }, 240, () => boom(x, y));
    heat(2);
  };

  const boom = (x: number, y: number) => {
    const hit = targetAt(x, y);
    if (hit) decal("scorch", hit, x, y, rand(0, 360));
    if (reducedMotion) return;
    fx.explosion(x, y, 1);
    shake(12);
    for (const { el, dx, dy, d } of targetsNear(x, y, 260)) {
      const f = (1 - d / 260) * 130 + 20;
      const n = d || 1;
      knock(el, (dx / n) * f, (dy / n) * f - 30, rand(-12, 12), 900);
    }
  };

  // --- ninja -----------------------------------------------------------------
  const throwStar = (x: number, y: number) => {
    if (reducedMotion) {
      const el = targetAt(x, y);
      if (el) decal("shuriken", el, x, y, rand(0, 360));
      return;
    }
    const fromLeft = x > window.innerWidth / 2;
    const start = { x: fromLeft ? -30 : window.innerWidth + 30, y: window.innerHeight * rand(0.55, 0.9) };
    // A shuriken that misses flies on and out of the screen.
    const el = targetAt(x, y);
    const end = el ? { x, y } : { x: x + (x - start.x) * 0.8, y: y + (y - start.y) * 0.8 };
    flyStar(start, end, () => {
      if (!el) return;
      decal("shuriken", el, x, y, rand(0, 360));
      fx.puff(x, y);
      knock(el, fromLeft ? 7 : -7, 2, fromLeft ? 1.5 : -1.5, 300);
    });
  };

  const onDrag = useEffectEvent((x: number, y: number) => {
    const path = drag.current;
    if (!path || gta.armed !== "ninja" || !live) return;
    path.push({ x, y });
    if (path.length > 2 && !reducedMotion) fx.slash(path);
    const prev = path[path.length - 2];
    if (prev && Math.hypot(x - prev.x, y - prev.y) > 6 && path.length % 4 === 0) {
      const el = targetAt(x, y);
      if (el) knock(el, (y - prev.y) * 0.6, -(x - prev.x) * 0.6, rand(-3, 3), 320);
    }
  });

  // --- pointer tracking ----------------------------------------------------
  useEffect(() => {
    const move = (e: PointerEvent) => {
      px.set(e.clientX);
      py.set(e.clientY);
      onDrag(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, [px, py]);

  // --- shared trigger --------------------------------------------------------
  const onDown = useEffectEvent((x: number, y: number, now: number) => {
    if (gta.armed === "guns") {
      shoot(x, y);
      setFiring(true);
    } else if (gta.armed === "tank") fireTank(x, y, now);
    else if (gta.armed === "ninja") drag.current = [{ x, y }];
  });
  const onUp = useEffectEvent((x: number, y: number) => {
    stopAuto();
    const path = drag.current;
    drag.current = null;
    if (gta.armed !== "ninja" || !path) return;
    const moved = Math.hypot(x - path[0].x, y - path[0].y);
    if (moved < 24) throwStar(x, y);
  });
  const onTap = useEffectEvent((x: number, y: number, now: number) => {
    if (gta.armed === "guns") shoot(x, y);
    else if (gta.armed === "tank") fireTank(x, y, now);
    else if (gta.armed === "ninja") throwStar(x, y);
  });
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (gta.armed !== "guns" || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as Element | null)?.closest?.("input, textarea, select, [contenteditable='true']")) return;
    const n = ["1", "2", "3"].indexOf(e.key);
    if (n >= 0) swap(ORDER[n]);
    if (e.key.toLowerCase() === "r" && ammo[weapon].clip < WEAPONS[weapon].clip) reload(weapon);
  });

  useEffect(() => {
    if (!live) return;
    const ui = (e: Event) => !!(e.target as Element | null)?.closest?.("[data-gta-ui], dialog");
    const down = (e: PointerEvent) => {
      if (ui(e) || e.button !== 0 || e.pointerType !== "mouse") return;
      e.preventDefault();
      onDown(e.clientX, e.clientY, e.timeStamp);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType === "mouse") onUp(e.clientX, e.clientY);
    };
    const click = (e: MouseEvent) => {
      // Keyboard activation (detail 0) still works, so links stay reachable.
      if (ui(e) || e.detail === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const type = (e as PointerEvent).pointerType;
      if (type && type !== "mouse") onTap(e.clientX, e.clientY, e.timeStamp);
    };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("click", click, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("click", click, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [live]);

  // --- one-shot cheats -------------------------------------------------------
  // HESOYAM also refills every weapon. Adjusting state while rendering, when
  // the cheat changes, avoids a second pass through an effect.
  const [seenCheat, setSeenCheat] = useState(0);
  if (cheat && cheat.key !== seenCheat) {
    setSeenCheat(cheat.key);
    if (cheat.id === "hesoyam") setAmmo(FULL_AMMO());
  }

  const blowEverything = () => {
    const targets = visibleTargets(14);
    if (reducedMotion) {
      targets.forEach(({ el }) => {
        const r = el.getBoundingClientRect();
        decal("scorch", el, r.left + r.width / 2, r.top + r.height / 2);
      });
      return;
    }
    targets.forEach(({ el }, i) => {
      window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        fx.explosion(x, y, 0.85);
        decal("scorch", el, x, y, rand(0, 360));
        shake(9);
        blowAway(el, 0);
      }, i * 110);
    });
  };


  // CPKTNWT touches the DOM, so it runs from an effect. A cheat typed just
  // before this layer loaded still plays.
  const handled = useRef(0);
  const runBlast = useEffectEvent(() => {
    if (!cheat || cheat.id !== "cpktnwt" || cheat.key === handled.current || Date.now() - cheat.key > 4000) return;
    handled.current = cheat.key;
    blowEverything();
  });
  useEffect(() => runBlast(), [cheat]);

  return (
    <>
      <FxCanvas />
      <AnimatePresence>
        {gta.wanted > 0 && <Siren key="siren" wanted={gta.wanted} />}
        {gta.wanted >= 4 && <Chase key="chase" px={px} py={py} wanted={gta.wanted} reduced={reducedMotion} />}
        {live && gta.armed === "guns" && (
          <CJ key="cj" weapon={weapon} px={px} py={py} bx={bodyX} kick={kick} lower={lower} flash={flash} />
        )}
        {gta.armed === "tank" && (
          <Tank key="tank" x={tankX} facing={facing} elevation={elevation} kick={tankKick} reduced={reducedMotion} />
        )}
        {gta.hud && (
          <Hud
            key="hud"
            ui={ui}
            gta={gta}
            weapon={weapon}
            ammo={ammo[weapon]}
            reloading={reloading}
            full={gta.money > 0}
            onCycle={() => cycle(1)}
            onDisarm={() => exp.setArmed(null)}
            onClearWanted={() => exp.runCheat("aezakmi")}
            onClose={() => {
              exp.closeGta();
              clearDecals();
            }}
          />
        )}
      </AnimatePresence>
      {live && gta.armed === "guns" && <Crosshair x={px} y={py} scale={recoil} reloading={reloading} />}
      {live && gta.armed === "ninja" && <StarCursor x={px} y={py} />}
      {live && gta.armed === "tank" && <TankSight x={px} y={py} />}
    </>
  );
}

function clampTank(x: number) {
  if (typeof window === "undefined") return x;
  return Math.min(window.innerWidth - TANK_W / 2 + 40, Math.max(TANK_W / 2 - 40, x));
}

/** A glowing tank shell from the barrel to the target, then a callback. */
function shell(from: { x: number; y: number }, to: { x: number; y: number }, ms: number, done: () => void) {
  const el = document.createElement("span");
  el.className = "gta-shell";
  document.body.appendChild(el);
  const a = el.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px)` },
      { transform: `translate(${to.x}px, ${to.y}px)` },
    ],
    { duration: ms, easing: "cubic-bezier(.3,0,.9,.6)" },
  );
  a.onfinish = () => {
    el.remove();
    done();
  };
}

/** A spinning shuriken thrown from a screen edge. */
function flyStar(from: { x: number; y: number }, to: { x: number; y: number }, done: () => void) {
  const el = document.createElement("span");
  el.className = "gta-flying-star";
  document.body.appendChild(el);
  const midY = Math.min(from.y, to.y) - 80;
  const a = el.animate(
    [
      { transform: `translate(${from.x}px, ${from.y}px) rotate(0deg)` },
      { transform: `translate(${(from.x + to.x) / 2}px, ${midY}px) rotate(540deg)`, offset: 0.5 },
      { transform: `translate(${to.x}px, ${to.y}px) rotate(1080deg)` },
    ],
    { duration: 420, easing: "cubic-bezier(.4,.1,.6,1)" },
  );
  a.onfinish = () => {
    el.remove();
    done();
  };
}

function FxCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    fx.attach(ref.current);
    return () => fx.detach();
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[81] size-full" />;
}

function Crosshair({ x, y, scale, reloading }: { x: MotionValue<number>; y: MotionValue<number>; scale: MotionValue<number>; reloading: boolean }) {
  return (
    <m.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[95]" style={{ x, y }}>
      <m.svg
        viewBox="-20 -20 40 40"
        className="-ml-5 -mt-5 size-10 overflow-visible"
        style={{ scale }}
        animate={reloading ? { rotate: 360 } : { rotate: 0 }}
        transition={reloading ? { duration: 0.9, ease: "linear" } : { duration: 0 }}
      >
        <g fill="none" strokeLinecap="round">
          <circle r="12" stroke="#111" strokeWidth="5" strokeDasharray={reloading ? "6 6" : undefined} />
          <circle r="12" stroke="#f4f2ec" strokeWidth="2.5" strokeDasharray={reloading ? "6 6" : undefined} />
          <path d="M0 -19 V-14 M0 14 V19 M-19 0 H-14 M14 0 H19" stroke="#111" strokeWidth="5" />
          <path d="M0 -19 V-14 M0 14 V19 M-19 0 H-14 M14 0 H19" stroke="#f4f2ec" strokeWidth="2.5" />
        </g>
        <circle r="2.2" fill="#e23b2e" stroke="#111" strokeWidth="1" />
      </m.svg>
    </m.div>
  );
}

function TankSight({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  return (
    <m.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[95]" style={{ x, y }}>
      <svg viewBox="-24 -24 48 48" className="-ml-6 -mt-6 size-12 animate-[spin_6s_linear_infinite] overflow-visible">
        <g fill="none" stroke="#e23b2e" strokeWidth="2.5">
          <path d="M-20 -8 V-20 H-8 M8 -20 H20 V-8 M20 8 V20 H8 M-8 20 H-20 V8" />
        </g>
        <circle r="3" fill="#e23b2e" />
      </svg>
    </m.div>
  );
}

function StarCursor({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  return (
    <m.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[95]" style={{ x, y }}>
      <Shuriken className="-ml-4 -mt-4 size-8 animate-[spin_1.2s_linear_infinite]" />
    </m.div>
  );
}

function Tank({
  x,
  facing,
  elevation,
  kick,
  reduced,
}: {
  x: MotionValue<number>;
  facing: MotionValue<number>;
  elevation: MotionValue<number>;
  kick: MotionValue<number>;
  reduced: boolean;
}) {
  const left = useTransform(() => clampTank(x.get()) - TANK_W / 2 + kick.get());
  const velocity = useVelocity(x);
  const tilt = useTransform(velocity, [-1500, 0, 1500], [1.6, 0, -1.6], { clamp: true });
  // Wheels roll with the distance travelled.
  const spin = useTransform(x, (v) => (v / 17) * (180 / Math.PI));
  // Swinging the turret round squashes it through zero, which reads as a turn.
  const turn = useSpring(facing, { stiffness: 140, damping: 18 });
  const gun = useTransform(elevation, (e) => `${(-e * 180) / Math.PI}deg`);

  return (
    <m.div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 left-0 z-[79] drop-shadow-[0_10px_8px_rgba(0,0,0,0.35)] max-sm:origin-bottom-left max-sm:scale-75"
      style={{ x: left, rotate: reduced ? 0 : tilt, width: TANK_W, height: TANK_H }}
      initial={{ y: 200 }}
      animate={{ y: 0 }}
      exit={{ y: 220 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <RhinoHull
        wheels={WHEELS.map(([cx, r]) => (
          <g key={cx} transform={`translate(${cx} 124)`}>
            <m.g style={{ rotate: spin }}>
              <Wheel r={r} />
            </m.g>
          </g>
        ))}
      />
      <m.div
        className="absolute"
        style={{ left: RING.x - 120, top: RING.y - 130, width: 240, height: 140, scaleX: turn, transformOrigin: "120px 130px" }}
      >
        <m.div
          className="absolute"
          style={{ left: 120 + TRUNNION.x, top: 130 + TRUNNION.y - 9, width: 186, height: 18, rotate: gun, transformOrigin: "0px 9px" }}
        >
          <RhinoGun />
        </m.div>
        <RhinoTurret />
      </m.div>
    </m.div>
  );
}

function Siren({ wanted }: { wanted: number }) {
  return (
    <m.div
      aria-hidden="true"
      className="gta-siren pointer-events-none fixed inset-0 z-[78]"
      style={{ "--siren": `${12 + wanted * 10}px` } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: Math.min(1, 0.35 + wanted * 0.12) }}
      exit={{ opacity: 0 }}
    />
  );
}

function Chase({ px, py, wanted, reduced }: { px: MotionValue<number>; py: MotionValue<number>; wanted: number; reduced: boolean }) {
  // The Maverick lags behind the cursor and keeps its searchlight on it.
  const hx = useSpring(px, { stiffness: 22, damping: 12, mass: 1.6 });
  const hy = useSpring(py, { stiffness: 22, damping: 12, mass: 1.6 });
  const velocity = useVelocity(hx);
  // Nose towards the direction of travel, with some hysteresis.
  const heading = useMotionValue(1);
  useMotionValueEvent(velocity, "change", (v) => {
    if (v > 60) heading.set(1);
    else if (v < -60) heading.set(-1);
  });
  const flip = useSpring(heading, { stiffness: 90, damping: 16 });
  const pitch = useTransform(velocity, [-900, 900], [-9, 9], { clamp: true });

  const lightX = useTransform(() => hx.get() - flip.get() * 130);
  // High enough to read as overhead, low enough to stay clear of the top bar.
  const lightY = useTransform(() => Math.max(190, hy.get() - 280));
  const boxX = useTransform(() => lightX.get() - flip.get() * (SEARCHLIGHT.x - MAVERICK.w / 2) - MAVERICK.w / 2);
  const boxY = useTransform(() => lightY.get() - SEARCHLIGHT.y);
  const beam = useTransform(() => `${lightX.get()},${lightY.get()} ${hx.get() - 105},${hy.get()} ${hx.get() + 105},${hy.get()}`);

  const dark = wanted >= 6 ? 0.72 : 0.38;
  const night = useMotionTemplate`radial-gradient(ellipse 150px 110px at ${hx}px ${hy}px, transparent 0 60%, rgba(4,6,14,${dark}) 100%)`;

  return (
    <>
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[78]"
        style={{ background: night }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
      <m.svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[79] size-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <defs>
          <linearGradient id="gta-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,250,220,0.42)" />
            <stop offset="1" stopColor="rgba(255,250,220,0.1)" />
          </linearGradient>
          <radialGradient id="gta-spot">
            <stop offset="0" stopColor="rgba(255,252,230,0.4)" />
            <stop offset="1" stopColor="rgba(255,252,230,0)" />
          </radialGradient>
        </defs>
        <m.polygon points={beam} fill="url(#gta-beam)" />
        <m.ellipse cx={hx} cy={hy} rx="115" ry="38" fill="url(#gta-spot)" />
      </m.svg>
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] drop-shadow-[0_30px_18px_rgba(0,0,0,0.35)]"
        style={{ x: boxX, y: boxY, width: MAVERICK.w, height: MAVERICK.h, rotate: reduced ? 0 : pitch }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.7 }}
      >
        <m.div className="size-full" style={{ scaleX: flip }}>
          <Maverick />
        </m.div>
      </m.div>
    </>
  );
}
