"use client";

import Image from "next/image";
import { Modal } from "../ui/Modal";
import { ArrowUpRight } from "../ui/icons";
import { StatusBadge } from "../ui/StatusBadge";
import { useExperience } from "./ExperienceProvider";

export default function ProjectDialog() {
  const { content, projectId, closeProject, mode } = useExperience();
  const { ui } = content;
  const index = content.projects.findIndex((p) => p.id === projectId);
  const project = content.projects[index];
  if (!project) return null;

  const src = mode === "criativo" && project.image?.srcDark ? project.image.srcDark : project.image?.src;

  return (
    <Modal label={project.title} closeLabel={ui.close} onClose={closeProject}>
      <article className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-56 overflow-hidden border-b border-line bg-surface md:border-b-0 md:border-r">
          {project.image && src ? (
            <Image
              src={src}
              alt={project.image.alt}
              fill
              sizes="(min-width: 768px) 520px, 94vw"
              className="object-cover object-top"
            />
          ) : (
            <Placeholder title={project.title} />
          )}
          <span className="absolute left-3 top-3 bg-fg px-2 py-1 font-mono text-[11px] text-bg">
            fig. 02.{index + 1}
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
            <StatusBadge status={project.status} label={ui.projects.status[project.status]} />
            <span>{project.year}</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">{project.title}</h2>
            <p className="mt-1 text-muted">{project.kicker}</p>
          </div>
          <p className="leading-relaxed">{project.overview}</p>

          {project.highlights.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{ui.projects.highlights}</h3>
              <dl className="mt-2 divide-y divide-line border-y border-line">
                {project.highlights.map((h) => (
                  <div key={h.label} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 text-sm">
                    <dt className="font-semibold">{h.label}</dt>
                    <dd className="text-muted">{h.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
            {project.stack.map((s) => (
              <li key={s} className="border border-line px-2 py-1 font-mono text-[11px]">
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {project.links.length > 0 ? (
              project.links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold transition-colors ${
                    i === 0
                      ? "bg-fg text-bg hover:bg-accent hover:text-ink"
                      : "border border-fg hover:bg-fg hover:text-bg"
                  }`}
                >
                  {ui.projects.links[l.kind]}
                  <ArrowUpRight size={16} />
                </a>
              ))
            ) : (
              <p className="text-sm text-muted">{ui.projects.privateNote}</p>
            )}
          </div>
        </div>
      </article>
    </Modal>
  );
}

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-ink p-6">
      <p className="text-center text-[clamp(2rem,6vw,4rem)] font-black uppercase leading-[0.85] tracking-[-0.04em] text-paper/90">
        {title}
        <span className="text-accent">.</span>
      </p>
    </div>
  );
}
