"use client";

import { m, useInView } from "motion/react";
import { useRef } from "react";

const EASE = [0.77, 0, 0.18, 1] as const;

// Section opener: a red curtain sweeps across, and the giant title is already
// there when it pulls away, the same cut-in beat as the mode transition.
export function Curtain({ n, title, id }: { n: string; title: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -25% 0px" });

  return (
    <div ref={ref} className="relative overflow-hidden border-y border-line">
      <m.div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-accent"
        initial={{ scaleX: 0, originX: 0 }}
        animate={inView ? { scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] } : undefined}
        transition={{ duration: 1.15, times: [0, 0.42, 0.58, 1], ease: EASE }}
      />
      <m.div
        className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-5 py-6 md:px-8 md:py-10"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: [0, 0, 1] } : undefined}
        transition={{ duration: 0.6, times: [0, 0.8, 1] }}
      >
        <h2
          id={id}
          data-float
          className="text-[clamp(3.25rem,12.5vw,12rem)] font-black uppercase leading-[0.8] tracking-[-0.055em]"
        >
          {title}
        </h2>
        <span className="mb-2 shrink-0 font-mono text-sm text-accent-text md:text-base">§{n}</span>
      </m.div>
    </div>
  );
}
