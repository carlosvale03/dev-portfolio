"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Project, ProjectImage } from "@/content";
import { Modal } from "../ui/Modal";
import { ArrowUpRight } from "../ui/icons";
import { StatusBadge } from "../ui/StatusBadge";
import { useExperience } from "./ExperienceProvider";

export default function ProjectDialog() {
  const { content, projectId, closeProject, mode } = useExperience();
  const { ui } = content;
  const [zoomed, setZoomed] = useState(false);
  const index = content.projects.findIndex((p) => p.id === projectId);
  const project = content.projects[index];
  if (!project) return null;

  const src = mode === "criativo" && project.image?.srcDark ? project.image.srcDark : project.image?.src;

  return (
    <Modal label={project.title} closeLabel={ui.close} onClose={closeProject} className="w-[min(94vw,1120px)]">
      <article className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="relative h-64 border-b border-line bg-ink sm:h-80 md:h-auto md:min-h-[32rem] md:border-b-0 md:border-r">
          {project.image && src ? (
            <Shot image={project.image} src={src} hint={ui.projects.panHint} />
          ) : (
            <Placeholder title={project.title} />
          )}
          <span className="pointer-events-none absolute left-3 top-3 z-10 bg-fg px-2 py-1 font-mono text-[11px] text-bg">
            fig. 02.{index + 1}
          </span>
          {project.image && src && (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="absolute bottom-3 right-3 z-10 inline-flex h-9 items-center gap-1.5 border border-paper/40 bg-ink/80 px-3 font-mono text-[11px] uppercase tracking-wider text-paper backdrop-blur transition-colors hover:border-accent hover:bg-accent hover:text-ink"
            >
              <ArrowUpRight size={14} className="-rotate-45" /> {ui.projects.zoom}
            </button>
          )}
        </div>

        <ProjectInfo project={project} />
      </article>

      {zoomed && project.image && src && (
        <Modal label={project.image.alt} closeLabel={ui.close} onClose={() => setZoomed(false)} tone="ink" className="w-[min(96vw,1400px)]">
          <Image
            src={src}
            alt={project.image.alt}
            width={project.image.width}
            height={project.image.height}
            sizes="96vw"
            className="h-auto w-full"
          />
        </Modal>
      )}
    </Modal>
  );
}

// Screenshot shown at the column's full width, never cropped on the sides.
// Tall pages pan slowly to the bottom on hover, like scrolling the real screen;
// short ones sit centered on a dark backdrop.
function Shot({ image, src, hint }: { image: ProjectImage; src: string; hint: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setOverflow(Math.max(0, Math.round((width * image.height) / image.width - height)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [image.width, image.height]);

  const pans = overflow > 24;
  const style = {
    "--pan": `-${overflow}px`,
    transitionDuration: `${Math.min(9, 2 + overflow / 220)}s`,
  } as CSSProperties;

  return (
    <div ref={box} className="group absolute inset-0 overflow-hidden">
      <div className={pans ? "absolute inset-x-0 top-0" : "absolute inset-0 flex items-center"}>
        <Image
          src={src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 600px, 94vw"
          style={style}
          className={`h-auto w-full transition-transform ease-in-out ${pans ? "group-hover:[transform:translateY(var(--pan))]" : ""}`}
        />
      </div>
      {pans && (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 hidden bg-ink/80 px-2 py-1 font-mono text-[11px] text-paper/80 transition-opacity group-hover:opacity-0 md:block">
          {hint} ↓
        </span>
      )}
    </div>
  );
}

function ProjectInfo({ project }: { project: Project }) {
  const { content } = useExperience();
  const { ui } = content;
  return (
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

      {project.metrics && project.metrics.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{ui.projects.metrics}</h3>
          <dl className="mt-2 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {project.metrics.map((m) => (
              <div key={m.label} className="flex flex-col bg-bg px-3 py-2.5">
                <dt className="order-2 text-[11px] leading-tight text-muted">{m.label}</dt>
                <dd className="font-tabular text-xl font-extrabold tracking-tight">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

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
                i === 0 ? "bg-fg text-bg hover:bg-accent hover:text-ink" : "border border-fg hover:bg-fg hover:text-bg"
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
