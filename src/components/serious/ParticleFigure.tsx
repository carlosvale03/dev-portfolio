"use client";

import { AnimatePresence, m } from "motion/react";
import type { Ui } from "@/content";
import { ParticleField, useShapeCycle } from "../particles/ParticleField";
import type { ShapeId } from "../particles/shapes";
import { Scramble, SplitReveal } from "../motion/kit";
import { useExperience } from "../shell/ExperienceProvider";

const SHAPES: ShapeId[] = ["database", "network", "chart", "code", "cv"];
const STEP_MS = 3600;

// "fig. 1": the data → model → insight → code → product story, told by a
// particle swarm that reshapes itself at each step.
export function ParticleFigure({ ui }: { ui: Ui }) {
  const { reducedMotion } = useExperience();
  const [index, pick] = useShapeCycle(SHAPES.length, STEP_MS, !reducedMotion);
  const steps = ui.figure.steps;

  return (
    <section aria-labelledby="fig-title" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="grid gap-8 border-t-2 border-fg pt-6 md:pt-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col lg:col-span-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              <Scramble text={ui.figure.kicker} />
            </p>
            <h2 id="fig-title" className="mt-4 text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
              <SplitReveal text={ui.figure.title} inView />
              <span className="text-accent">.</span>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">{ui.figure.lead}</p>

            <ol className="mt-6 grid grid-cols-5 gap-1.5 lg:mt-8 lg:grid-cols-1" aria-label={ui.figure.hint}>
              {steps.map((step, i) => {
                const active = i === index;
                return (
                  <li key={step.label}>
                    <button
                      type="button"
                      onClick={() => pick(i)}
                      aria-pressed={active}
                      className={`group relative flex w-full flex-col items-start gap-0.5 overflow-hidden border px-2.5 py-2 text-left transition-colors lg:flex-row lg:items-center lg:gap-3 lg:px-4 lg:py-3 ${
                        active ? "border-fg bg-fg text-bg" : "border-line hover:border-fg"
                      }`}
                    >
                      <span className={`font-mono text-[11px] ${active ? "text-bg/70" : "text-muted"}`}>
                        0{i + 1}
                      </span>
                      <span className="text-sm font-semibold lg:text-base">{step.label}</span>
                      {active && !reducedMotion && (
                        <m.span
                          key={`bar-${index}`}
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="relative mt-4 min-h-12" aria-live="polite">
              <AnimatePresence mode="wait">
                <m.p
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm leading-relaxed"
                >
                  <span className="font-semibold">{steps[index].label}.</span> {steps[index].caption}
                </m.p>
              </AnimatePresence>
            </div>
          </div>

          <figure className="relative lg:col-span-8">
            <div className="relative aspect-[4/3] overflow-hidden border border-fg bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-[size:40px_40px] sm:aspect-[16/10]">
              <ParticleField
                shapes={SHAPES}
                index={index}
                label={`${ui.figure.title}: ${steps.map((s) => s.label).join(", ")}`}
                dot="rgba(18,18,18,0.85)"
                accent="#e23b2e"
                reducedMotion={reducedMotion}
                density={1.35}
                className="absolute inset-0"
              />
              <span className="pointer-events-none absolute left-3 top-3 bg-fg px-2 py-1 font-mono text-[11px] text-bg">
                fig. 1.{index + 1}
              </span>
              <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                {steps[index].label}
              </span>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
