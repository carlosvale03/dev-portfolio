"use client";

import Image from "next/image";
import {
  AnimatePresence,
  animate,
  m,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useExperience } from "../shell/ExperienceProvider";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Letters rise from behind a mask, one after another. */
export function SplitReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.035,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const play = !inView || seen;
  const words = text.split(" ");
  let n = 0;
  // Each word sits in a mask; side padding (cancelled by negative margins) keeps
  // glyph overhangs from the tight tracking from being clipped.
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true" className="-mx-[0.08em] inline-block overflow-hidden whitespace-nowrap px-[0.08em] pb-[0.08em] align-bottom">
          {[...word].map((ch) => {
            const i = n++;
            return (
              <m.span
                key={i}
                className="inline-block"
                initial={{ y: "105%" }}
                animate={play ? { y: "0%" } : undefined}
                transition={{ duration: 0.8, ease: EASE, delay: delay + i * stagger }}
              >
                {ch}
              </m.span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/** Counts up to a number when visible; non-numeric values get scrambled in. */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const { reducedMotion: reduced } = useExperience();

  useEffect(() => {
    const el = ref.current;
    if (!el || !seen || reduced) return;
    const target = Number(value);
    if (Number.isFinite(target)) {
      const pad = value.length;
      const controls = animate(0, target, {
        duration: 1.4,
        ease: EASE,
        onUpdate: (v) => (el.textContent = String(Math.round(v)).padStart(pad, "0")),
      });
      return () => controls.stop();
    }
    return scramble(el, value, 700);
  }, [seen, value, reduced]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789§#/<>*";

function scramble(el: HTMLElement, final: string, duration: number) {
  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / duration);
    const fixed = Math.floor(final.length * k);
    el.textContent = [...final]
      .map((ch, i) => (i < fixed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join("");
    if (k < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Decodes the text like a terminal when it scrolls into view. */
export function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const { reducedMotion: reduced } = useExperience();
  useEffect(() => {
    if (!seen || reduced || !ref.current) return;
    return scramble(ref.current, text, 650);
  }, [seen, text, reduced]);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/** Pulls its child toward the cursor a little, then springs back. */
export function Magnetic({ children, strength = 0.25, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  return (
    <m.span
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.span>
  );
}

/** Tilts in 3D following the pointer. */
export function Tilt({ children, className = "", max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  return (
    <m.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
    </m.div>
  );
}

/** A rule that draws itself from left to right when visible. */
export function DrawLine({ className = "" }: { className?: string }) {
  return (
    <m.div
      aria-hidden="true"
      className={`origin-left ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  );
}

/** Image card that trails the cursor while a list row is hovered (desktop). */
export function FloatingPreview({
  image,
  x,
  y,
  className = "",
}: {
  image: { key: string; src?: string; title: string } | null;
  x: MotionValue<number>;
  y: MotionValue<number>;
  className?: string;
}) {
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  return (
    <m.div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-30 hidden w-[320px] lg:block" style={{ x: sx, y: sy }}>
      <AnimatePresence mode="popLayout">
        {image && (
          <m.div
            key={image.key}
            initial={{ opacity: 0, scale: 0.85, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className={`relative aspect-[4/3] overflow-hidden border-2 bg-surface shadow-[10px_10px_0_var(--accent)] ${className}`}
          >
            {image.src ? (
              <Image src={image.src} alt="" fill sizes="320px" className="object-cover object-top" />
            ) : (
              <div className="grid size-full place-items-center bg-ink p-4">
                <span className="text-center text-3xl font-black uppercase leading-none text-paper">{image.title}</span>
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/**
 * Custom cursor for mouse users: a dot plus a ring that grows over anything
 * clickable. Hidden on touch devices and when motion is reduced.
 */
export function Cursor() {
  const { reducedMotion: reduced, gta, terminalOpen, game, projectId, manualOpen } = useExperience();
  // An armed San Andreas cheat draws its own sight instead.
  const armed = !!gta.armed && !terminalOpen && !game && !projectId && !manualOpen;
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 30, mass: 0.5 });
  const ry = useSpring(y, { stiffness: 380, damping: 30, mass: 0.5 });

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setEnabled(true);
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHover(!!t?.closest("a, button, [role='switch'], summary, label[for], input, textarea, canvas"));
    };
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onLeave = () => setEnabled(false);
    if (!fine.matches) return;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, x, y]);

  if (reduced || !enabled || armed) return null;
  return (
    <>
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] -ml-1 -mt-1 size-2 rounded-full bg-accent"
        style={{ x, y }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[200] rounded-full border border-accent mix-blend-difference"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hover ? 52 : 28, height: hover ? 52 : 28, opacity: down ? 0.5 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      />
    </>
  );
}
