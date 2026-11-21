"use client";

import { m, useScroll, useTransform } from "motion/react";
import { useRef, type CSSProperties } from "react";
import type { Ui } from "@/content";
import { ArrowRight } from "../ui/icons";
import { Magnetic, Scramble, SplitReveal } from "../motion/kit";
import { Marquee } from "../motion/Marquee";
import { ParticleField, useShapeCycle } from "../particles/ParticleField";
import type { ShapeId } from "../particles/shapes";
import { loadCreative } from "../creative/load";
import { useExperience } from "../shell/ExperienceProvider";

const SHAPES: ShapeId[] = ["mark", "gamepad", "ball", "shuriken", "hat", "orb"];
// Position of each shape in ui.creative.shapes, which follows the creative hero order.
const HERO_ORDER: ShapeId[] = ["mark", "network", "ball", "gamepad", "orb", "shuriken", "hat"];

// The serious page's door to the creative mode, placed right before Contact so
// visitors meet the full résumé first. It is itself a small taste of that mode:
// a fast particle swarm, kinetic type and a magnetic call to action.
export function CreativeTeaser({ ui }: { ui: Ui }) {
  const { reducedMotion, switchMode, cut } = useExperience();
  const [index, pick] = useShapeCycle(SHAPES.length, 1700, !reducedMotion);
  const t = ui.teaser;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const tilt = useTransform(scrollYProgress, [0, 1], [-4, 4]);
  const drift = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  const enter = () => switchMode("criativo");

  return (
    <section
      ref={ref}
      id="criativo"
      aria-labelledby="teaser-title"
      className="relative overflow-hidden bg-ink text-paper"
      style={{ "--fg": "var(--paper)", "--bg": "var(--ink)", "--line-strong": "rgb(244 242 236 / 0.3)" } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(244_242_236/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(244_242_236/0.06)_1px,transparent_1px)] bg-[size:36px_36px]"
      />
      <m.span
        aria-hidden="true"
        style={{ x: drift }}
        className="pointer-events-none absolute -right-10 top-6 select-none text-[clamp(7rem,30vw,22rem)] font-black leading-none tracking-[-0.06em] text-paper/[0.04]"
      >
        C.
      </m.span>

      <div className="relative mx-auto grid max-w-[1320px] gap-8 px-5 py-14 md:px-8 md:py-24 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-paper/60">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <Scramble text={t.kicker} />
          </p>
          <h2 id="teaser-title" className="mt-5 text-[clamp(2.4rem,7vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
            <span className="block text-paper/45">
              <SplitReveal text={t.before} inView stagger={0.025} />
            </span>{" "}
            <span className="mt-1 block">
              <SplitReveal text={t.after} inView delay={0.35} stagger={0.03} />
            </span>
          </h2>
          <p className="mt-5 max-w-md font-mono text-sm text-paper/70">{t.sub}</p>

          <Magnetic strength={0.35} className="mt-8">
            <button
              type="button"
              disabled={!!cut}
              onPointerEnter={() => void loadCreative()}
              onFocus={() => void loadCreative()}
              onClick={enter}
              className="group relative inline-flex h-14 items-center gap-3 overflow-hidden bg-accent px-6 text-lg font-bold text-ink"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-paper transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
              <span className="relative">{t.cta}</span>
              <ArrowRight size={20} className="relative transition-transform group-hover:translate-x-1.5" />
              {!reducedMotion && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-[teaser-glint_2.8s_ease-in-out_infinite] bg-[linear-gradient(100deg,transparent_30%,rgb(255_255_255/0.55)_50%,transparent_70%)]" />
              )}
            </button>
          </Magnetic>
        </div>

        <m.div style={{ rotate: tilt }} className="lg:col-span-6">
          <button
            type="button"
            onClick={() => pick((index + 1) % SHAPES.length)}
            aria-label={ui.creative.particlesLabel}
            className="relative block aspect-square w-full overflow-hidden border border-paper/25 sm:aspect-[5/4]"
          >
            <ParticleField
              shapes={SHAPES}
              index={index}
              label={ui.creative.particlesLabel}
              dot="rgba(244,242,236,0.9)"
              accent="#e23b2e"
              reducedMotion={reducedMotion}
              density={1.2}
              className="absolute inset-0"
            />
            <span className="pointer-events-none absolute left-3 top-3 bg-paper px-2 py-1 font-mono text-[11px] text-ink">
              {String(index + 1).padStart(2, "0")} / {String(SHAPES.length).padStart(2, "0")}
            </span>
            <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[11px] uppercase tracking-wider text-paper/60">
              {ui.creative.shapes[HERO_ORDER.indexOf(SHAPES[index])]}
            </span>
          </button>
        </m.div>
      </div>

      <div className="relative border-t border-paper/20 py-3">
        <Marquee
          size="text-[clamp(1.25rem,3vw,2.25rem)]"
          pauseLabel={ui.creative.pause}
          playLabel={ui.creative.play}
          rows={t.marquee.map((text, i) => ({ text, duration: 28, outline: i % 2 === 0, direction: "left" as const }))}
        />
      </div>
    </section>
  );
}
