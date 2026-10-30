"use client";

import { m, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { Content } from "@/content";
import { ArrowRight, ArrowUpRight, Download } from "../ui/icons";
import { FloatingPreview, Magnetic } from "../motion/kit";
import { Marquee } from "../motion/Marquee";
import { ParticleField, useShapeCycle } from "../particles/ParticleField";
import type { ShapeId } from "../particles/shapes";
import { useExperience } from "../shell/ExperienceProvider";
import { projectLabel } from "../serious/Experience";
import { Curtain } from "./Curtain";
import { Formation } from "./Formation";
import { Hobbies, NimbusCameo } from "./Hobbies";

const EASE = [0.16, 1, 0.3, 1] as const;
const HERO_SHAPES: ShapeId[] = ["cv", "network", "ball", "gamepad", "orb", "shuriken", "hat"];

// Creative mode: the same content as the serious mode, told with kinetic type,
// red cut-in curtains and particles, plus the hobbies the serious mode leaves out.
export default function CreativeMain({ content }: { content: Content }) {
  return (
    <div className="overflow-x-clip">
      <Hero content={content} />
      <Projects content={content} />
      <ExperienceSection content={content} />
      <Research content={content} />
      <About content={content} />
      <StackSection content={content} />
      <HobbiesSection content={content} />
      <Contact content={content} />
      <NimbusCameo />
    </div>
  );
}

function Hero({ content }: { content: Content }) {
  const { profile, ui } = content;
  const { reducedMotion } = useExperience();
  const [index, pick] = useShapeCycle(HERO_SHAPES.length, 3000, !reducedMotion);
  const labels = ui.creative.shapes;

  return (
    <section id="inicio" aria-labelledby="c-hero" className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
      <ParticleField
        shapes={HERO_SHAPES}
        index={index}
        layout="hero"
        label={ui.creative.particlesLabel}
        dot="rgba(244,242,236,0.92)"
        accent="#e23b2e"
        reducedMotion={reducedMotion}
        className="absolute inset-0"
      />
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-5 pb-6 pt-5 md:px-8">
        <div className="flex items-start justify-between gap-4 font-mono text-xs text-muted">
          <span>exp_001 · {profile.location}</span>
          <span className="text-accent-text">● running</span>
        </div>

        {/* Shape picker: makes the morphing obvious and lets people drive it. */}
        <div className="pointer-events-auto mt-3 flex flex-wrap gap-1.5 lg:absolute lg:right-8 lg:top-14 lg:mt-0 lg:max-w-md lg:justify-end">
          {HERO_SHAPES.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => pick(i)}
              aria-pressed={i === index}
              className={`h-8 border px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                i === index ? "border-accent bg-accent text-ink" : "border-line-strong bg-bg/50 text-muted hover:border-fg hover:text-fg"
              }`}
            >
              {labels[i]}
            </button>
          ))}
        </div>

        <h1 id="c-hero" className="mt-auto pt-[40vh] lg:pt-0" aria-label={profile.name}>
          {["CARLOS", "VALE."].map((word, row) => (
            <span key={word} className="block overflow-hidden whitespace-nowrap" aria-hidden="true">
              <span className="block whitespace-nowrap text-[clamp(4rem,15vw,11rem)] font-black leading-[0.8] tracking-[-0.065em] lg:text-[clamp(6rem,11vw,12rem)]">
                {[...word].map((ch, i) => (
                  <m.span
                    key={i}
                    className={`inline-block ${ch === "." ? "text-accent" : ""}`}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.15 + row * 0.12 + i * 0.035 }}
                  >
                    {ch}
                  </m.span>
                ))}
              </span>
            </span>
          ))}
        </h1>
        <m.p
          className="mt-5 max-w-xl text-lg font-semibold leading-snug tracking-tight sm:text-xl md:text-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
        >
          {profile.role}
        </m.p>
      </div>
      <Marquee
        className="relative z-10 border-t border-line bg-bg/60 pb-2 pt-1"
        size="text-[clamp(2rem,5.5vw,4.5rem)]"
        pauseLabel={ui.creative.pause}
        playLabel={ui.creative.play}
        rows={[
          { text: ui.creative.marquee[0], duration: 26 },
          { text: ui.creative.marquee[1], direction: "right", outline: true, duration: 30 },
        ]}
      />
    </section>
  );
}

function Projects({ content }: { content: Content }) {
  const { projects, ui } = content;
  const { openProject } = useExperience();
  const [hovered, setHovered] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const project = hovered !== null ? projects[hovered] : null;

  return (
    <section id="projetos" aria-labelledby="c-projetos" className="pt-20 md:pt-28">
      <Curtain n="02" title={ui.projects.title} id="c-projetos" />
      <ul
        className="mx-auto max-w-[1320px] px-5 md:px-8"
        onPointerMove={(e) => {
          x.set(e.clientX + 24);
          y.set(e.clientY - 120);
        }}
        onPointerLeave={() => setHovered(null)}
      >
        {projects.map((p, i) => (
          <li key={p.id} className="border-b border-line">
            <button
              type="button"
              onClick={() => openProject(p.id)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHovered(i);
              }}
              onFocus={() => setHovered(null)}
              className="group relative grid w-full grid-cols-[2.25rem_1fr] items-baseline gap-3 overflow-hidden py-5 text-left sm:py-6 md:grid-cols-[4rem_1fr_auto] md:gap-6 md:py-8"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(.77,0,.18,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <span className="relative font-mono text-xs text-muted transition-colors group-hover:text-ink group-focus-visible:text-ink">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative block break-words text-[clamp(1.9rem,6.5vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.05em] transition-[transform,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-3 group-hover:text-ink group-focus-visible:translate-x-3 group-focus-visible:text-ink">
                {p.title}
              </span>
              <span className="relative col-start-2 flex flex-col gap-1 font-mono text-xs text-muted transition-colors group-hover:text-ink group-focus-visible:text-ink md:col-start-auto md:items-end md:text-right">
                <span>{p.kicker}</span>
                <span>
                  {p.year} · {ui.projects.status[p.status]}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <FloatingPreview
        x={x}
        y={y}
        className="border-paper"
        image={project ? { key: project.id, src: project.image?.srcDark ?? project.image?.src, title: project.title } : null}
      />
    </section>
  );
}

function ExperienceSection({ content }: { content: Content }) {
  const { experience, ui } = content;
  const { openProject } = useExperience();
  return (
    <section id="experiencia" aria-labelledby="c-experiencia" className="pt-20 md:pt-28">
      <Curtain n="03" title={ui.experience.title} id="c-experiencia" />
      <ol className="mx-auto max-w-[1320px] px-5 md:px-8">
        {experience.map((job, i) => (
          <m.li
            key={job.id}
            className="group grid gap-6 border-b border-line py-10 lg:grid-cols-12 lg:gap-10 lg:py-14"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.05 }}
          >
            <div className="lg:col-span-5">
              <p className="flex flex-wrap items-center gap-3 font-mono text-xs text-accent-text">
                <span>{job.period}</span>
                {job.current && (
                  <span className="inline-flex items-center gap-1.5 bg-accent px-2 py-0.5 uppercase tracking-wider text-ink">
                    <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-ink" />
                    {ui.experience.current}
                  </span>
                )}
              </p>
              <h3 className="mt-3 break-words text-[clamp(2.5rem,6vw,5.5rem)] font-black uppercase leading-[0.85] tracking-[-0.05em] text-transparent transition-colors duration-500 [-webkit-text-stroke:1.5px_var(--fg)] group-hover:text-fg">
                {job.company}
              </h3>
            </div>
            <div className="lg:col-span-7">
              <p className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">{job.role}</p>
              {job.product && <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">{job.product}</p>}
              <ul className="mt-5 space-y-2.5">
                {job.bullets.map((b, bi) => (
                  <m.li
                    key={b}
                    className="flex gap-3 leading-relaxed text-muted"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + bi * 0.06 }}
                  >
                    <span aria-hidden="true" className="mt-[0.7em] h-0.5 w-4 shrink-0 bg-accent" />
                    <span>{b}</span>
                  </m.li>
                ))}
              </ul>
              {job.projectIds && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {job.projectIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openProject(id)}
                      className="group/b inline-flex h-11 items-center gap-2 border border-line-strong px-4 text-sm font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-ink"
                    >
                      {projectLabel(content, job.projectIds!, id)}
                      <ArrowRight size={16} className="transition-transform group-hover/b:translate-x-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </m.li>
        ))}
      </ol>
    </section>
  );
}

function Research({ content }: { content: Content }) {
  const { publications, ui } = content;
  return (
    <section id="pesquisa" aria-labelledby="c-pesquisa" className="pt-20 md:pt-28">
      <Curtain n="04" title={ui.research.title} id="c-pesquisa" />
      <div className="mx-auto max-w-[1320px] px-5 pt-10 md:px-8">
        <ol className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
          {publications.map((pub, i) => (
            <m.li
              key={pub.id}
              className="group flex flex-col bg-bg p-6 transition-colors hover:bg-surface md:p-8 lg:min-h-[520px]"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
            >
              <p className="text-[clamp(4.5rem,10vw,8.5rem)] font-black leading-[0.8] tracking-[-0.06em] text-transparent transition-colors duration-500 [-webkit-text-stroke:1.5px_var(--accent)] group-hover:text-accent">
                {pub.year}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="bg-paper px-2.5 py-1 text-xs font-extrabold uppercase text-ink">{pub.venueShort}</span>
                {pub.note && <span className="font-mono text-[11px] text-muted">{pub.note}</span>}
              </div>
              <h3 className="mt-4 text-xl font-bold leading-snug tracking-[-0.015em]">{pub.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{pub.summary}</p>
              <a href={pub.doi} target="_blank" rel="noreferrer" className="group/l mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold">
                <span className="underline decoration-accent decoration-2 underline-offset-4">{ui.research.read}</span>
                <ArrowUpRight size={16} className="transition-transform group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" />
              </a>
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function About({ content }: { content: Content }) {
  const { profile, ui } = content;
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = profile.about[0].split(" ");

  return (
    <section id="sobre" aria-labelledby="c-sobre" className="pt-20 md:pt-28">
      <Curtain n="05" title={ui.about.title} id="c-sobre" />
      <div className="mx-auto max-w-[1320px] px-5 pt-12 md:px-8 md:pt-16">
        <p ref={ref} className="max-w-5xl text-[clamp(1.6rem,4.2vw,3.6rem)] font-bold leading-[1.08] tracking-[-0.03em]">
          {words.map((word, i) => (
            <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}
            </Word>
          ))}
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {profile.about.slice(1).map((para, i) => (
            <p key={i} className="text-lg leading-relaxed text-muted">
              {para}
            </p>
          ))}
        </div>
        <ol className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {profile.timeline.map((t, i) => (
            <m.li
              key={t.title}
              className="bg-bg p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <p className="font-mono text-[11px] uppercase tracking-wider text-accent-text">{t.when}</p>
              <p className="mt-2 font-semibold leading-snug">{t.title}</p>
              <p className="mt-1 text-sm text-muted">{t.place}</p>
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <>
      <m.span style={{ opacity }}>{children}</m.span>{" "}
    </>
  );
}

function StackSection({ content }: { content: Content }) {
  const { ui } = content;
  return (
    <section id="stack" aria-labelledby="c-stack" className="pt-20 md:pt-28">
      <Curtain n="06" title={ui.creative.formation.title} id="c-stack" />
      <div className="mx-auto max-w-[1320px] px-5 pt-10 md:px-8">
        <p className="mb-8 max-w-xl text-lg text-muted">{ui.creative.formation.lead}</p>
        <Formation content={content} />
      </div>
    </section>
  );
}

function HobbiesSection({ content }: { content: Content }) {
  return (
    <section id="hobbies" aria-labelledby="c-hobbies" className="pt-20 md:pt-28">
      <Curtain n="07" title={content.ui.creative.hobbies.title} id="c-hobbies" />
      <div className="mx-auto max-w-[1320px] px-5 pt-10 md:px-8">
        <Hobbies content={content} />
      </div>
    </section>
  );
}

function Contact({ content }: { content: Content }) {
  const { profile, ui } = content;
  const email = profile.contacts.find((c) => c.id === "email")!;

  return (
    <section id="contato" aria-labelledby="c-contato" className="pb-10 pt-20 md:pt-28">
      <Curtain n="08" title={ui.contact.title} id="c-contato" />
      <div className="mx-auto max-w-[1320px] px-5 pt-12 md:px-8">
        <p className="max-w-xl text-lg text-muted">{ui.contact.lead}</p>
        <Magnetic strength={0.12} className="mt-8 max-w-full">
          <a
            href={email.href}
            className="inline-block max-w-full break-all text-[clamp(1.5rem,6vw,5.5rem)] font-black leading-none tracking-[-0.04em] underline decoration-accent decoration-[0.08em] underline-offset-[0.12em] transition-colors hover:text-accent-text"
          >
            {email.value}
          </a>
        </Magnetic>
        <div className="mt-12 flex flex-wrap gap-3">
          {profile.contacts
            .filter((c) => c.id !== "email")
            .map((c) => (
              <a
                key={c.id}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-12 items-center gap-3 border border-line-strong px-4 transition-colors hover:border-accent hover:bg-accent hover:text-ink"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted group-hover:text-ink">{c.label}</span>
                <span className="font-semibold">{c.value}</span>
                <ArrowUpRight size={16} />
              </a>
            ))}
          <a
            href={profile.cv}
            download
            className="inline-flex h-12 items-center gap-2 bg-paper px-5 font-semibold text-ink transition-colors hover:bg-accent"
          >
            {ui.hero.ctaCv}
            <Download size={18} />
          </a>
        </div>
      </div>
      <Marquee
        className="mt-20"
        pauseLabel={ui.creative.pause}
        playLabel={ui.creative.play}
        rows={[{ text: `${profile.status} — ${ui.contact.title} —`, duration: 24, outline: true }]}
      />
    </section>
  );
}
