"use client";

import { m } from "motion/react";
import { useExperience } from "./ExperienceProvider";

const EASE = [0.77, 0, 0.18, 1] as const;

// Anime "cut-in": a red panel with speed lines sweeps across the screen, the
// mode swaps while it covers everything, then it exits on the other side.
export function CutTransition() {
  const { cut, onCutCovered, onCutRevealed, content } = useExperience();
  if (!cut) return null;

  const covering = cut.phase === "cover";
  const label = cut.to === "criativo" ? content.ui.mode.creativeName : content.ui.mode.seriousName;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <m.div
        className="absolute inset-0 bg-ink"
        initial={{ x: "-101%" }}
        animate={{ x: covering ? "0%" : "101%" }}
        transition={{ duration: covering ? 0.5 : 0.45, ease: EASE, delay: covering ? 0 : 0.32 }}
      />
      <m.div
        className="absolute inset-0 flex items-center justify-center overflow-hidden bg-accent"
        initial={{ x: "-101%" }}
        animate={{ x: covering ? "0%" : "101%" }}
        transition={{ duration: covering ? 0.5 : 0.45, ease: EASE, delay: covering ? 0.08 : 0.22 }}
        onAnimationComplete={() => (covering ? onCutCovered() : onCutRevealed())}
      >
        <SpeedLines />
        <m.p
          className="relative px-6 text-center text-[clamp(2.5rem,10vw,9rem)] font-black italic leading-[0.85] tracking-[-0.04em] text-ink"
          initial={{ x: "-12%", skewX: -8 }}
          animate={{ x: "6%", skewX: -8 }}
          transition={{ duration: 1.2, ease: "linear" }}
        >
          {label}
        </m.p>
      </m.div>
    </div>
  );
}

function SpeedLines() {
  const lines = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    const w = i % 3 === 0 ? 1.6 : 0.6;
    return (
      <line
        key={i}
        x1={Math.cos(a) * 14}
        y1={Math.sin(a) * 14}
        x2={Math.cos(a) * 100}
        y2={Math.sin(a) * 100}
        stroke="#121212"
        strokeWidth={w}
      />
    );
  });
  return (
    <svg
      viewBox="-100 -100 200 200"
      className="absolute left-1/2 top-1/2 size-[180vmax] -translate-x-1/2 -translate-y-1/2 opacity-25"
    >
      {lines}
    </svg>
  );
}
