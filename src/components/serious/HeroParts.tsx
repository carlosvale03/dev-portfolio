"use client";

import Image from "next/image";
import { m } from "motion/react";
import { SplitReveal, Tilt } from "../motion/kit";

export function HeroName() {
  return (
    <h1
      id="hero-title"
      data-float
      className="mt-4 text-[clamp(4rem,13.5vw,11.5rem)] font-extrabold leading-[0.82] tracking-[-0.055em]"
      aria-label="Carlos Vale"
    >
      <span className="block" aria-hidden="true">
        <SplitReveal text="Carlos" delay={0.1} stagger={0.045} />
      </span>
      <span className="block" aria-hidden="true">
        <SplitReveal text="Vale" delay={0.32} stagger={0.045} />
        <m.span
          className="inline-block text-accent"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 12, delay: 0.62 }}
        >
          .
        </m.span>
      </span>
    </h1>
  );
}

// Portrait in a cut-in frame: the red block slides in, the photo tilts with
// the cursor and a stamp spins in the corner.
export function PhotoFrame({ alt, caption, status }: { alt: string; caption: string; status: string }) {
  return (
    <figure className="mx-auto w-full max-w-[22rem] md:max-w-none">
      <Tilt className="relative mb-3 mr-3" max={6}>
        <m.div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3 translate-y-3 bg-accent"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.77, 0, 0.18, 1], delay: 0.5 }}
        />
        <m.div
          className="relative aspect-[4/5] overflow-hidden border-2 border-fg bg-surface md:aspect-[3/4]"
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1, ease: [0.77, 0, 0.18, 1], delay: 0.2 }}
        >
          <Image
            src="/img/foto.webp"
            alt={alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1320px) 400px, (min-width: 768px) 40vw, 22rem"
            className="object-cover object-[50%_18%]"
          />
        </m.div>
        <Stamp text={status} />
      </Tilt>
      <figcaption className="mt-4 font-mono text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}

function Stamp({ text }: { text: string }) {
  // Repeat short labels so the ring is always full; textLength spreads them evenly.
  let label = `${text.toUpperCase()} • `;
  while (label.length < 28) label += `${text.toUpperCase()} • `;
  return (
    <m.div
      aria-hidden="true"
      className="absolute -bottom-6 -left-6 grid size-24 place-items-center rounded-full bg-bg sm:size-28"
      initial={{ scale: 0, rotate: -120 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 1 }}
    >
      <svg viewBox="0 0 100 100" className="size-full animate-[spin_16s_linear_infinite]">
        <defs>
          <path id="stamp-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-fg font-mono text-[9.5px] tracking-[0.12em]">
          <textPath href="#stamp-circle" textLength="236" lengthAdjust="spacing">
            {label}
          </textPath>
        </text>
      </svg>
      <span className="absolute size-3 rounded-full bg-[#1f8a4c] ring-4 ring-[#1f8a4c]/20" />
    </m.div>
  );
}
