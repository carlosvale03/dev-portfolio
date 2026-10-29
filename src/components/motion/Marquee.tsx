"use client";

import { useState, type CSSProperties } from "react";
import { Pause, Play } from "../ui/icons";

export interface MarqueeRow {
  text: string;
  direction?: "left" | "right";
  outline?: boolean;
  duration?: number;
}

// Infinite kinetic type. The text is rendered twice per track so the -50% loop
// is seamless; screen readers get each line once through the sr-only list.
export function Marquee({
  rows,
  pauseLabel,
  playLabel,
  className = "",
  size = "text-[clamp(2.75rem,8vw,7rem)]",
}: {
  rows: MarqueeRow[];
  pauseLabel: string;
  playLabel: string;
  className?: string;
  size?: string;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div className={`relative ${className}`} data-paused={paused}>
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.text}>{r.text}</li>
        ))}
      </ul>
      <div aria-hidden="true" className="overflow-hidden">
        {rows.map((r, i) => (
          <div key={i} className="overflow-hidden whitespace-nowrap py-1">
            <div
              className="marquee-track"
              data-direction={r.direction ?? "left"}
              style={{ "--marquee-duration": `${r.duration ?? 22}s` } as CSSProperties}
            >
              {[0, 1].map((copy) => (
                <span
                  key={copy}
                  className={`${size} pr-[0.3em] font-black uppercase leading-[0.95] tracking-[-0.045em] ${
                    r.outline ? "text-transparent [-webkit-text-stroke:1.5px_var(--accent)]" : "text-fg"
                  }`}
                >
                  {r.text} {r.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? playLabel : pauseLabel}
        aria-pressed={paused}
        className="absolute bottom-2 right-5 grid size-10 place-items-center border border-line-strong bg-bg/70 text-fg backdrop-blur transition-colors hover:border-fg md:right-8"
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </div>
  );
}
