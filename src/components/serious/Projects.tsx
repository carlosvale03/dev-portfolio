"use client";

import Image from "next/image";
import { m, useMotionValue, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import type { Content, Project } from "@/content";
import { ArrowRight, ArrowUpRight } from "../ui/icons";
import { StatusBadge } from "../ui/StatusBadge";
import { FloatingPreview, Magnetic } from "../motion/kit";
import { useExperience } from "../shell/ExperienceProvider";

const EASE = [0.16, 1, 0.3, 1] as const;
const preloadDialog = () => void import("../shell/ProjectDialog");

// Serious-mode projects: big alternating case studies for the featured work,
// then an editorial index for everything else.
export function ProjectsShowcase({ content }: { content: Content }) {
  const featured = content.projects.filter((p) => p.featured);
  const others = content.projects.filter((p) => !p.featured);

  return (
    <>
      <p className="mt-12 font-mono text-xs uppercase tracking-wider text-muted">{content.ui.projects.featured}</p>
      <div className="mt-6 space-y-20 md:space-y-28">
        {featured.map((p, i) => (
          <FeaturedCase key={p.id} project={p} index={i} content={content} />
        ))}
      </div>
      <ProjectIndex projects={others} offset={featured.length} content={content} />
    </>
  );
}

function FeaturedCase({ project, index, content }: { project: Project; index: number; content: Content }) {
  const { ui } = content;
  const { openProject } = useExperience();
  const flip = index % 2 === 1;
  const primary = project.links[0];

  return (
    <article className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      <div className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
        <BrowserShot project={project} flip={flip} />
      </div>
      <m.div
        className="lg:col-span-5"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <div className="flex items-end justify-between gap-4">
          <span className="text-[clamp(4rem,9vw,7.5rem)] font-black leading-[0.8] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_var(--fg)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col items-end gap-1 pb-1">
            <StatusBadge status={project.status} label={ui.projects.status[project.status]} />
            <span className="font-mono text-xs text-muted">{project.year}</span>
          </div>
        </div>
        <h3 className="mt-5 text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.045em]">
          {project.title}
          <span className="text-accent">.</span>
        </h3>
        <p className="mt-2 text-muted">{project.kicker}</p>
        <p className="mt-5 text-lg leading-relaxed">{project.summary}</p>

        {project.highlights.length > 0 && (
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {project.highlights.slice(0, 3).map((h) => (
              <div key={h.label} className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5 text-sm">
                <dt className="font-semibold">{h.label}</dt>
                <dd className="text-muted">{h.text}</dd>
              </div>
            ))}
          </dl>
        )}

        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Stack">
          {project.stack.slice(0, 7).map((s, i) => (
            <m.li
              key={s}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.04, type: "spring", stiffness: 400, damping: 22 }}
              className="border border-line px-2 py-0.5 font-mono text-[11px]"
            >
              {s}
            </m.li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <Magnetic>
            <button
              type="button"
              onClick={() => openProject(project.id)}
              onPointerEnter={preloadDialog}
              onFocus={preloadDialog}
              className="group inline-flex h-12 items-center gap-2 bg-fg px-5 font-semibold text-bg transition-colors hover:bg-accent hover:text-ink"
            >
              {ui.projects.details}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </Magnetic>
          {primary && (
            <Magnetic>
              <a
                href={primary.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 border border-fg px-5 font-semibold transition-colors hover:bg-fg hover:text-bg"
              >
                {ui.projects.links[primary.kind]}
                <ArrowUpRight size={18} />
              </a>
            </Magnetic>
          )}
        </div>
      </m.div>
    </article>
  );
}

function BrowserShot({ project, flip }: { project: Project; flip: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  // Show a real address: the live demo when there is one, otherwise the repo.
  const host =
    (project.links.find((l) => l.kind === "demo" || l.kind === "site") ??
      project.links.find((l) => l.kind === "code") ??
      project.links[0])?.href ?? project.title;
  const url = host.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div ref={ref} className="relative">
      <m.div
        aria-hidden="true"
        className={`absolute inset-0 bg-accent ${flip ? "-translate-x-3" : "translate-x-3"} translate-y-3 md:translate-y-4 ${flip ? "md:-translate-x-4" : "md:translate-x-4"}`}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0% 0 0)" }}
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={{ duration: 0.9, ease: [0.77, 0, 0.18, 1], delay: 0.15 }}
      />
      <div className="group relative overflow-hidden border-2 border-fg bg-bg">
        <div className="flex items-center gap-2 border-b-2 border-fg px-3 py-2">
          <span className="size-2.5 rounded-full bg-accent" />
          <span className="size-2.5 rounded-full bg-amber" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="ml-2 min-w-0 flex-1 truncate border border-line px-2 py-0.5 font-mono text-[11px] text-muted">{url}</span>
        </div>
        <div className="relative aspect-[16/11] overflow-hidden bg-surface">
          {project.image && (
            <m.div className="absolute inset-[-8%_0]" style={{ y }}>
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                sizes="(min-width: 1024px) 760px, 94vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectIndex({ projects, offset, content }: { projects: Project[]; offset: number; content: Content }) {
  const { ui } = content;
  const { openProject } = useExperience();
  const [hovered, setHovered] = useState<Project | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <div className="mt-24 md:mt-32">
      <div className="flex items-end justify-between gap-4 border-b-2 border-fg pb-3">
        <h3 className="text-2xl font-extrabold tracking-[-0.03em] md:text-3xl">{ui.projects.others}</h3>
        <span className="font-mono text-xs text-muted">
          {String(projects.length).padStart(2, "0")} / {String(offset + projects.length).padStart(2, "0")}
        </span>
      </div>
      <div
        className="hidden grid-cols-[3rem_1.5fr_1.2fr_4rem_9.5rem_1.5rem] gap-4 border-b border-line py-2 font-mono text-[11px] uppercase tracking-wider text-muted md:grid"
        aria-hidden="true"
      >
        <span>Nº</span>
        <span>{ui.projects.columns.project}</span>
        <span>{ui.projects.columns.stack}</span>
        <span>{ui.projects.columns.year}</span>
        <span>{ui.projects.columns.status}</span>
        <span />
      </div>
      <ul
        onPointerMove={(e) => {
          x.set(e.clientX + 28);
          y.set(e.clientY - 110);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        {projects.map((p, i) => (
          <m.li
            key={p.id}
            className="border-b border-line"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
          >
            <button
              type="button"
              onClick={() => openProject(p.id)}
              onPointerEnter={(e) => {
                preloadDialog();
                if (e.pointerType === "mouse") setHovered(p);
              }}
              onFocus={preloadDialog}
              className="group relative grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 overflow-hidden py-4 text-left md:grid-cols-[3rem_1.5fr_1.2fr_4rem_9.5rem_1.5rem] md:gap-4 md:py-5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-fg transition-transform duration-500 ease-[cubic-bezier(.77,0,.18,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <span className="relative font-mono text-xs text-muted transition-colors group-hover:text-bg/60">
                {String(offset + i + 1).padStart(2, "0")}
              </span>
              <span className="relative min-w-0 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-2">
                <span className="block text-xl font-extrabold tracking-[-0.02em] transition-colors group-hover:text-bg md:text-2xl">
                  {p.title}
                </span>
                <span className="block truncate text-sm text-muted transition-colors group-hover:text-bg/70">{p.kicker}</span>
              </span>
              <span className="relative hidden truncate font-mono text-xs text-muted transition-colors group-hover:text-bg/70 md:block">
                {p.stack.slice(0, 3).join(" · ")}
              </span>
              <span className="relative hidden font-mono text-xs transition-colors group-hover:text-bg md:block">{p.year}</span>
              <span className="relative hidden transition-[filter] group-hover:invert md:block">
                <StatusBadge status={p.status} label={ui.projects.status[p.status]} />
              </span>
              <span className="relative flex items-center gap-3">
                {p.image && (
                  <span className="relative block h-12 w-16 overflow-hidden border border-line md:hidden">
                    <Image src={p.image.src} alt="" fill sizes="64px" className="object-cover object-top" />
                  </span>
                )}
                <ArrowUpRight
                  size={20}
                  className="hidden transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent md:block"
                />
              </span>
            </button>
          </m.li>
        ))}
      </ul>
      <FloatingPreview
        x={x}
        y={y}
        className="border-fg"
        image={hovered ? { key: hovered.id, src: hovered.image?.src, title: hovered.title } : null}
      />
    </div>
  );
}
