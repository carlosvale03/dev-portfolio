"use client";

import { m } from "motion/react";
import type { Content } from "@/content";
import { ArrowRight } from "../ui/icons";
import { useExperience } from "../shell/ExperienceProvider";

const EASE = [0.16, 1, 0.3, 1] as const;
const preloadDialog = () => void import("../shell/ProjectDialog");

// One linked project reads "See project"; several are told apart by title.
export function projectLabel(content: Content, ids: string[], id: string) {
  if (ids.length === 1) return content.ui.experience.viewProject;
  return content.projects.find((p) => p.id === id)?.title ?? id;
}

// Serious-mode experience: one row per role, in the same editorial rhythm as
// the research list (period on the left, role and bullets in the middle).
export function ExperienceList({ content }: { content: Content }) {
  const { experience, ui } = content;
  const { openProject } = useExperience();

  return (
    <ol className="mt-12 border-t border-line">
      {experience.map((job, i) => (
        <m.li
          key={job.id}
          className="group relative border-b border-line"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-y-100"
          />
          <article className="grid gap-5 py-8 transition-[padding] duration-500 group-hover:md:pl-4 md:grid-cols-12 md:gap-8 md:py-10">
            <div className="flex flex-wrap items-center gap-3 md:col-span-3 md:flex-col md:items-start md:gap-2">
              <span className="font-mono text-xs text-muted">[{String(i + 1).padStart(2, "0")}]</span>
              <span className="font-tabular text-lg font-extrabold tracking-[-0.02em] md:text-xl">{job.period}</span>
              {job.current && (
                <span className="inline-flex items-center gap-1.5 bg-fg px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-bg">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-[#1f8a4c]" />
                  {ui.experience.current}
                </span>
              )}
            </div>

            <div className="md:col-span-7">
              <h3 className="text-2xl font-extrabold leading-tight tracking-[-0.03em] md:text-3xl">{job.role}</h3>
              <p className="mt-1 text-lg font-semibold">
                <span className="underline decoration-accent decoration-2 underline-offset-4">{job.company}</span>
                {job.product && <span className="font-normal text-muted"> · {job.product}</span>}
              </p>
              <ul className="mt-4 space-y-2">
                {job.bullets.map((b) => (
                  <li key={b} className="flex gap-3 leading-relaxed">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-start gap-2 md:col-span-2 md:flex-col md:items-end">
              {job.projectIds?.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openProject(id)}
                  onPointerEnter={preloadDialog}
                  onFocus={preloadDialog}
                  className="group/b inline-flex h-11 items-center gap-2 whitespace-nowrap border border-fg px-4 text-sm font-semibold transition-colors hover:bg-fg hover:text-bg"
                >
                  {projectLabel(content, job.projectIds!, id)}
                  <ArrowRight size={16} className="transition-transform group-hover/b:translate-x-1" />
                </button>
              ))}
            </div>
          </article>
        </m.li>
      ))}
    </ol>
  );
}
