"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

export const INK = "#121212";
export const PAPER = "#f4f2ec";
export const RED = "#e23b2e";
export const AMBER = "#f3b14e";

/** Canvas that tracks its container width and keeps a fixed aspect ratio. */
export function useCanvasSize(aspect: number, max = 760) {
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      // Fit the viewport height too, so the dialog never needs to scroll, and
      // ignore 1-2px jitters that would otherwise restart the game loop.
      const byHeight = Math.max(240, window.innerHeight * 0.92 - 210) * aspect;
      const w = Math.floor(Math.min(max, entry.contentRect.width, byHeight));
      setSize((prev) => (Math.abs(prev.w - w) < 3 ? prev : { w, h: Math.floor(w / aspect) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, max]);
  return { wrap, size };
}

export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function readBest(key: string) {
  return readJSON<number>(key, 0);
}

export function saveBest(key: string, score: number) {
  if (score > readBest(key)) writeJSON(key, score);
}

export function Scoreboard({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="mb-3 flex gap-6 font-mono text-xs uppercase tracking-wider text-paper/60">
      {items.map((it) => (
        <p key={it.label}>
          {it.label} <span className="font-tabular text-base font-bold text-paper">{it.value}</span>
        </p>
      ))}
    </div>
  );
}
