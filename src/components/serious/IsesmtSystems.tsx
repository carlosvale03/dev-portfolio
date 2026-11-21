"use client";

import { m } from "motion/react";
import type { CSSProperties } from "react";
import {
  ChalkboardTeacher,
  ClipboardText,
  Cloud,
  Code,
  GitPullRequest,
  Kanban,
  MapTrifold,
  Scales,
  type Icon,
} from "@phosphor-icons/react";
import type { Content, Project } from "@/content";
import { ArrowRight } from "../ui/icons";
import { DUO, IconBadge } from "../ui/IconBadge";
import { CountUp } from "../motion/kit";
import { useExperience } from "../shell/ExperienceProvider";

export const BADGE_ICONS: Record<NonNullable<Project["badge"]>, Icon> = {
  assessment: ClipboardText,
  training: ChalkboardTeacher,
  map: MapTrifold,
  cloud: Cloud,
};

const METHOD_ICONS = [Kanban, GitPullRequest, Scales, Code];
const EASE = [0.16, 1, 0.3, 1] as const;
const preloadDialog = () => void import("../shell/ProjectDialog");

// The other company systems, where Carlos both leads and codes. A dark panel
// inside the projects section: how he leads (cards, reviews, decisions, code),
// the totals, then one card per system with its numbers, the leadership part
// and the code part. Each card opens the regular project dialog.
export function IsesmtSystems({ projects, content }: { projects: Project[]; content: Content }) {
  const { ui } = content;
  const t = ui.projects.isesmt;
  const { openProject } = useExperience();
  if (!projects.length) return null;

  return (
    <section
      aria-labelledby="isesmt-title"
      className="relative mt-24 overflow-hidden border-2 border-ink bg-ink text-paper md:mt-32"
      style={{ "--fg": "var(--paper)", "--bg": "var(--ink)", "--line": "rgb(244 242 236 / 0.16)" } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(244_242_236/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(244_242_236/0.05)_1px,transparent_1px)] bg-[size:36px_36px]"
      />
      <div className="relative p-5 sm:p-8 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-paper/60">
              <span className="size-2 bg-accent" />
              {t.kicker}
            </p>
            <h3 id="isesmt-title" className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
              {t.title}
              <span className="text-accent">.</span>
            </h3>
            <p className="mt-4 max-w-xl leading-relaxed text-paper/75">{t.lead}</p>
          </div>
          <dl className="grid grid-cols-2 border-t-2 border-paper lg:col-span-5">
            {t.stats.map((s) => (
              <div key={s.label} className="flex flex-col border-r border-paper/20 py-4 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4">
                <dt className="order-2 mt-1 font-mono text-[11px] uppercase leading-tight tracking-wider text-paper/60">{s.label}</dt>
                <dd className="font-tabular text-4xl font-extrabold tracking-[-0.04em] text-accent md:text-5xl">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="mt-10 grid gap-px border border-paper/20 bg-paper/20 sm:grid-cols-2 lg:grid-cols-4">
          {t.method.map((step, i) => {
            const Glyph = METHOD_ICONS[i];
            return (
              <m.li
                key={step.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                className="flex items-start gap-3 bg-ink p-4"
              >
                <span className={`${DUO} grid size-10 shrink-0 place-items-center border-2 border-paper text-paper`}>
                  <Glyph size={22} weight="duotone" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold">{step.label}</span>
                  <span className="block text-sm leading-snug text-paper/70">{step.text}</span>
                </span>
              </m.li>
            );
          })}
        </ul>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {projects.map((p, i) => (
            <m.li
              key={p.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
              className="h-full"
              style={{ "--fg": "var(--ink)", "--bg": "var(--paper)", "--line": "rgb(18 18 18 / 0.12)" } as CSSProperties}
            >
              <button
                type="button"
                onClick={() => openProject(p.id)}
                onPointerEnter={preloadDialog}
                onFocus={preloadDialog}
                className="group flex h-full w-full flex-col border-2 border-paper bg-paper p-5 text-left text-ink transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--accent)] focus-visible:shadow-[6px_6px_0_var(--accent)]"
              >
                <span className="flex items-start justify-between gap-3">
                  {p.badge && <IconBadge icon={BADGE_ICONS[p.badge]} size="lg" />}
                  <span className="font-mono text-xs text-ink/60">{p.year}</span>
                </span>
                <span className="mt-5 block text-xl font-extrabold leading-tight tracking-[-0.02em]">
                  {p.title}
                  <span className="text-accent">.</span>
                </span>
                <span className="mt-1 block text-sm text-ink/65">{p.kicker}</span>

                {p.metrics && p.metrics.length > 0 && (
                  <span className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y-2 border-ink py-3">
                    {p.metrics.map((mt) => (
                      <span key={mt.label} className="flex flex-col">
                        <span className="font-tabular text-2xl font-extrabold leading-none tracking-[-0.04em]">{mt.value}</span>
                        <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink/60">{mt.label}</span>
                      </span>
                    ))}
                  </span>
                )}

                <span className="mt-4 block space-y-3">
                  {p.highlights.slice(0, 2).map((h, k) => (
                    <span key={h.label} className="block">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <span aria-hidden="true" className={`size-2 ${k === 0 ? "bg-accent" : "bg-ink"}`} />
                        {h.label}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-ink/80">{h.text}</span>
                    </span>
                  ))}
                </span>

                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                  {ui.projects.details}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </m.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
