"use client";

import { m } from "motion/react";
import { ChalkboardTeacher, ClipboardText, Cloud, MapTrifold, type Icon } from "@phosphor-icons/react";
import type { Content, Project } from "@/content";
import { ArrowRight } from "../ui/icons";
import { IconBadge } from "../ui/IconBadge";
import { useExperience } from "../shell/ExperienceProvider";

export const BADGE_ICONS: Record<NonNullable<Project["badge"]>, Icon> = {
  assessment: ClipboardText,
  training: ChalkboardTeacher,
  map: MapTrifold,
  cloud: Cloud,
};

const preloadDialog = () => void import("../shell/ProjectDialog");

// The company systems where Carlos led more than he coded: no screenshots and
// no metrics, so each one is a card with what the system is and what he did,
// opening the same project dialog as the rest.
export function IsesmtSystems({ projects, content }: { projects: Project[]; content: Content }) {
  const { ui } = content;
  const { openProject } = useExperience();
  if (!projects.length) return null;

  return (
    <div className="mt-20 md:mt-28">
      <div className="flex items-end justify-between gap-4 border-b-2 border-fg pb-3">
        <h3 className="text-2xl font-extrabold tracking-[-0.03em] md:text-3xl">{ui.projects.isesmt.title}</h3>
        <span className="font-mono text-xs text-muted">ISESMT</span>
      </div>
      <p className="mt-3 max-w-2xl text-muted">{ui.projects.isesmt.lead}</p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {projects.map((p, i) => (
          <m.li
            key={p.id}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            className="h-full"
          >
            <button
              type="button"
              onClick={() => openProject(p.id)}
              onPointerEnter={preloadDialog}
              onFocus={preloadDialog}
              className="group flex h-full w-full flex-col border-2 border-fg bg-bg p-5 text-left transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[6px_6px_0_var(--accent)] focus-visible:shadow-[6px_6px_0_var(--accent)]"
            >
              <span className="flex items-start justify-between gap-3">
                {p.badge && <IconBadge icon={BADGE_ICONS[p.badge]} size="lg" />}
                <span className="font-mono text-xs text-muted">{p.year}</span>
              </span>
              <span className="mt-5 block text-xl font-extrabold leading-tight tracking-[-0.02em]">
                {p.title}
                <span className="text-accent">.</span>
              </span>
              <span className="mt-1 block text-sm text-muted">{p.kicker}</span>
              <span className="mt-4 block border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                {ui.projects.isesmt.role}
              </span>
              <span className="mt-1 block text-sm leading-relaxed">{p.summary}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
                {ui.projects.details}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </m.li>
        ))}
      </ul>
    </div>
  );
}
