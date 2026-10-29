"use client";

import { useEffect, useRef, useState } from "react";
import { SHAPES, type ShapeId } from "./shapes";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  accent: boolean;
}

export type ParticleLayout = "center" | "hero";

// Canvas 2D particle swarm that morphs between silhouettes. The parent owns
// which shape is active (`index`); this component only animates toward it.
export function ParticleField({
  shapes,
  index,
  label,
  dot,
  accent,
  layout = "center",
  reducedMotion,
  density = 1,
  className = "",
}: {
  shapes: ShapeId[];
  index: number;
  label: string;
  dot: string;
  accent: string;
  layout?: ParticleLayout;
  reducedMotion: boolean;
  density?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engine = useRef<{ show: (i: number) => void } | null>(null);
  const indexRef = useRef(index);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const font = getComputedStyle(document.body).fontFamily;
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let targets: [number, number][][] = [];
    let current = indexRef.current;
    let raf = 0;
    let visible = true;
    const pointer = { x: -1e4, y: -1e4 };

    const frame = () => {
      if (layout === "hero" && w >= 1024) {
        return { cx: w * 0.73, cy: h * 0.42, s: Math.min(h * 0.58, w * 0.36) };
      }
      if (layout === "hero") {
        return { cx: w * 0.5, cy: h * 0.27, s: Math.min(w * 0.74, h * 0.34) };
      }
      return { cx: w / 2, cy: h / 2, s: Math.min(w * 0.82, h * 0.86) };
    };

    const sample = (id: ShapeId, count: number) => {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.floor(w));
      off.height = Math.max(1, Math.floor(h));
      const c = off.getContext("2d", { willReadFrequently: true });
      if (!c) return [];
      c.fillStyle = "#000";
      c.strokeStyle = "#000";
      const { cx, cy, s } = frame();
      SHAPES[id](c, cx, cy, s, font);
      const data = c.getImageData(0, 0, off.width, off.height).data;
      let filled = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
      const step = Math.max(2, Math.round(Math.sqrt((filled * 4) / count)));
      const pts: [number, number][] = [];
      for (let y = 0; y < off.height; y += step)
        for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
      return pts;
    };

    const assign = () => {
      const t = targets[current];
      if (!t?.length) return;
      particles.forEach((p, i) => {
        const q = t[(i * 7919) % t.length];
        p.tx = q[0] + (Math.random() - 0.5) * 1.5;
        p.ty = q[1] + (Math.random() - 0.5) * 1.5;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.fillStyle = p.accent ? accent : dot;
        ctx.fillRect(p.x, p.y, 2, 2);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(1600, Math.max(600, ((w * h) / 760) * density)));
      targets = shapes.map((id) => sample(id, count));
      if (particles.length !== count) {
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          tx: 0,
          ty: 0,
          accent: Math.random() < 0.1,
        }));
      }
      assign();
      if (reducedMotion) {
        particles.forEach((p) => {
          p.x = p.tx;
          p.y = p.ty;
        });
        draw();
      }
    };

    const tick = () => {
      raf = 0;
      if (!visible) return;
      const r2 = 90 * 90;
      for (const p of particles) {
        p.vx += (p.tx - p.x) * 0.012;
        p.vy += (p.ty - p.y) * 0.012;
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d2 / r2) * 3.2;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && visible && !reducedMotion) raf = requestAnimationFrame(tick);
    };

    engine.current = {
      show: (i) => {
        current = i;
        assign();
        if (reducedMotion) {
          particles.forEach((p) => {
            p.x = p.tx;
            p.y = p.ty;
          });
          draw();
        }
        start();
      },
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -1e4;
    };
    // Clicking scatters everything, then the shape pulls itself back together.
    const onBurst = (e: PointerEvent) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const bx = e.clientX - rect.left;
      const by = e.clientY - rect.top;
      for (const p of particles) {
        const dx = p.x - bx;
        const dy = p.y - by;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(40, 4200 / (d + 40));
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      start();
    };

    resize();
    start();

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
      start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onBurst);

    return () => {
      engine.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onBurst);
    };
  }, [shapes, dot, accent, layout, reducedMotion, density]);

  useEffect(() => {
    indexRef.current = index;
    engine.current?.show(index);
  }, [index]);

  return <canvas ref={ref} role="img" aria-label={label} className={`size-full touch-pan-y ${className}`} />;
}

/** Cycles through `count` shapes every `ms`, pausing for a while after a manual pick. */
export function useShapeCycle(count: number, ms: number, enabled: boolean) {
  const [index, setIndexState] = useState(0);
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (document.hidden || Date.now() < pausedUntil.current) return;
      setIndexState((i) => (i + 1) % count);
    }, ms);
    return () => window.clearInterval(id);
  }, [count, ms, enabled, setIndexState]);

  const pick = (i: number) => {
    pausedUntil.current = Date.now() + 9000;
    setIndexState(i);
  };
  return [index, pick] as const;
}

