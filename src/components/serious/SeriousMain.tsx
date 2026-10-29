import type { CSSProperties } from "react";
import type { Content } from "@/content";
import { ArrowRight, ArrowUpRight, Download } from "../ui/icons";
import { CountUp, Magnetic, SplitReveal } from "../motion/kit";
import { Marquee } from "../motion/Marquee";
import { Container, Reveal, SectionHeader } from "./primitives";
import { ContactForm } from "./ContactForm";
import { ExperienceList } from "./Experience";
import { ParticleFigure } from "./ParticleFigure";
import { ProjectsShowcase } from "./Projects";
import { Timeline } from "./Timeline";
import { HeroName, PhotoFrame } from "./HeroParts";

// Serious mode, "Cut-in": an editorial layout that reads like a paper, with
// playful motion. Rendered on the server so recruiters and crawlers get the
// full content.
export function SeriousMain({ content }: { content: Content }) {
  return (
    <>
      <Hero content={content} />
      <StackTicker content={content} />
      <ParticleFigure ui={content.ui} />
      <Projects content={content} />
      <Experience content={content} />
      <Research content={content} />
      <About content={content} />
      <Stack content={content} />
      <Contact content={content} />
    </>
  );
}

function Hero({ content }: { content: Content }) {
  const { profile, ui } = content;
  return (
    <section id="inicio" aria-labelledby="hero-title">
      <Container className="pb-14 pt-8 md:pb-20 md:pt-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="flex flex-col md:col-span-7 lg:col-span-8">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-wider text-muted">{ui.hero.kicker}</p>
            </Reveal>
            <HeroName />
            <Reveal delay={0.45}>
              <p className="mt-7 max-w-2xl text-[1.6rem] font-semibold leading-tight tracking-[-0.02em] md:text-[2rem]">
                {profile.role}
              </p>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{profile.pitch}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Magnetic>
                  <a
                    href="#projetos"
                    className="group inline-flex h-12 items-center gap-2 bg-fg px-5 font-semibold text-bg transition-colors hover:bg-accent hover:text-ink"
                  >
                    {ui.hero.ctaProjects}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a
                    href={profile.cv}
                    download
                    className="group inline-flex h-12 items-center gap-2 border border-fg px-5 font-semibold transition-colors hover:bg-fg hover:text-bg"
                  >
                    {ui.hero.ctaCv}
                    <Download size={18} className="transition-transform group-hover:translate-y-0.5" />
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-5 lg:col-span-4">
            <PhotoFrame alt={profile.photoAlt} caption={ui.hero.photoCaption} status={profile.status} />
          </div>
        </div>

        <Reveal delay={0.2}>
          <dl className="mt-12 grid grid-cols-3 border-t-2 border-fg md:mt-16">
            {profile.stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col border-r border-line py-5 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4 md:pl-6 md:first:pl-0"
              >
                <dt className="order-2 mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">{s.label}</dt>
                <dd className="font-tabular text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl md:text-6xl">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}

function StackTicker({ content }: { content: Content }) {
  const items = content.stack.flatMap((g) => g.items);
  const half = Math.ceil(items.length / 2);
  return (
    <div
      className="border-y-2 border-ink bg-ink py-3"
      style={{ "--fg": "var(--paper)", "--bg": "var(--ink)", "--line-strong": "rgb(244 242 236 / 0.3)" } as CSSProperties}
    >
      <Marquee
        size="text-[clamp(1.5rem,3.5vw,2.75rem)]"
        pauseLabel={content.ui.creative.pause}
        playLabel={content.ui.creative.play}
        rows={[
          { text: `${items.slice(0, half).join(" ✦ ")} ✦`, duration: 55 },
          { text: `${items.slice(half).join(" ✦ ")} ✦`, duration: 60, direction: "right", outline: true },
        ]}
      />
    </div>
  );
}

function Projects({ content }: { content: Content }) {
  const { ui } = content;
  return (
    <section id="projetos" aria-label={ui.projects.title} className="py-16 md:py-24">
      <Container>
        <SectionHeader n="02" title={ui.projects.title} lead={ui.projects.lead} />
        <ProjectsShowcase content={content} />
      </Container>
    </section>
  );
}

function Experience({ content }: { content: Content }) {
  const { ui } = content;
  return (
    <section id="experiencia" aria-label={ui.experience.title} className="py-16 md:py-24">
      <Container>
        <SectionHeader n="03" title={ui.experience.title} lead={ui.experience.lead} />
        <ExperienceList content={content} />
      </Container>
    </section>
  );
}

function Research({ content }: { content: Content }) {
  const { publications, ui, profile } = content;
  return (
    <section id="pesquisa" aria-label={ui.research.title} className="py-16 md:py-24">
      <Container>
        <SectionHeader n="04" title={ui.research.title} lead={ui.research.lead} />
        <ol className="mt-12 border-t border-line">
          {publications.map((pub, i) => (
            <li key={pub.id} className="group relative border-b border-line">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-accent transition-transform duration-500 ease-out group-hover:scale-y-100"
              />
              <Reveal>
                <article className="grid gap-5 py-8 transition-[padding] duration-500 group-hover:md:pl-4 md:grid-cols-12 md:gap-8 md:py-10">
                  <div className="flex items-baseline gap-4 md:col-span-2 md:flex-col md:gap-1">
                    <span className="font-mono text-xs text-muted">[{i + 1}]</span>
                    <span className="font-tabular text-5xl font-extrabold tracking-[-0.05em] transition-colors group-hover:text-accent-text">
                      {pub.year}
                    </span>
                  </div>
                  <div className="md:col-span-7">
                    <h3 className="text-xl font-bold leading-snug tracking-[-0.015em] md:text-2xl">{pub.title}</h3>
                    <p className="mt-3 text-sm text-muted">
                      <span className="sr-only">{ui.research.authors}: </span>
                      {pub.authors.map((a, j) => (
                        <span key={a}>
                          {a === profile.fullName ? (
                            <strong className="font-semibold text-fg underline decoration-accent decoration-2 underline-offset-4">
                              {a}
                            </strong>
                          ) : (
                            a
                          )}
                          {j < pub.authors.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                    <p className="mt-2 text-sm italic text-muted">
                      {ui.research.venue} {pub.venue}
                    </p>
                    <details className="group/d mt-4">
                      <summary className="inline-flex list-none items-center gap-2 text-sm font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-accent [&::-webkit-details-marker]:hidden">
                        <span className="group-open/d:hidden">{ui.research.more}</span>
                        <span className="hidden group-open/d:inline">{ui.research.less}</span>
                      </summary>
                      <p className="mt-3 max-w-2xl leading-relaxed">{pub.summary}</p>
                    </details>
                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={ui.research.tech}>
                      {pub.tech.map((t) => (
                        <li key={t} className="border border-line px-2 py-0.5 font-mono text-[11px]">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:col-span-3 md:items-end md:text-right">
                    <span className="bg-fg px-3 py-1.5 text-sm font-extrabold uppercase tracking-tight text-bg transition-transform duration-300 group-hover:-rotate-3">
                      {pub.venueShort}
                    </span>
                    {pub.note && <p className="font-mono text-xs text-muted">{pub.note}</p>}
                    <a
                      href={pub.doi}
                      target="_blank"
                      rel="noreferrer"
                      className="group/l inline-flex h-11 items-center gap-2 border border-fg px-4 text-sm font-semibold transition-colors hover:bg-fg hover:text-bg"
                    >
                      {ui.research.read}
                      <ArrowUpRight size={16} className="transition-transform group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" />
                    </a>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function About({ content }: { content: Content }) {
  const { profile, ui } = content;
  return (
    <section id="sobre" aria-label={ui.about.title} className="py-16 md:py-24">
      <Container>
        <SectionHeader n="05" title={ui.about.title} />
        <div className="mt-12 grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="space-y-5 md:col-span-7 lg:col-start-3">
            {profile.about.map((para, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p
                  className={
                    i === 0
                      ? "text-2xl font-semibold leading-snug tracking-[-0.015em] md:text-[1.75rem]"
                      : "text-lg leading-relaxed text-muted"
                  }
                >
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
          <div className="md:col-span-5 lg:col-span-3">
            <Timeline items={profile.timeline} title={ui.about.timeline} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stack({ content }: { content: Content }) {
  const { stack, ui } = content;
  return (
    <section id="stack" aria-label={ui.stack.title} className="py-16 md:py-24">
      <Container>
        <SectionHeader n="06" title={ui.stack.title} lead={ui.stack.lead} />
        <div className="mt-12 grid gap-px border border-fg bg-fg sm:grid-cols-2 lg:grid-cols-5">
          {stack.map((group, i) => (
            <Reveal
              key={group.id}
              delay={i * 0.06}
              className="group bg-bg p-6 transition-colors duration-300 last:sm:col-span-2 hover:bg-surface lg:last:col-span-1"
            >
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-xs text-muted">06.{i + 1}</p>
                <p className="font-tabular font-mono text-xs text-muted">{String(group.items.length).padStart(2, "0")}</p>
              </div>
              <h3 className="mt-1 text-lg font-extrabold tracking-tight">{group.label}</h3>
              <ul className="mt-5 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="group/i flex items-center gap-2 text-[15px] transition-transform duration-300 hover:translate-x-1.5">
                    <span aria-hidden="true" className="h-px w-3 bg-accent transition-[width] duration-300 group-hover/i:w-6" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Contact({ content }: { content: Content }) {
  const { profile, ui } = content;
  return (
    <section id="contato" aria-label={ui.nav.contact} className="py-16 md:py-24">
      <Container>
        <header className="border-t-2 border-fg pt-6 md:pt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">§07</p>
          <h2
            data-float
            className="mt-4 text-[clamp(3rem,10.5vw,9.5rem)] font-extrabold leading-[0.88] tracking-[-0.055em]"
          >
            <SplitReveal text={ui.contact.title} inView stagger={0.03} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl text-lg text-muted">{ui.contact.lead}</p>
          </Reveal>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <ul className="border-t border-fg">
              {profile.contacts.map((c) => (
                <li key={c.id} className="border-b border-fg">
                  <a
                    href={c.href}
                    target={c.id === "email" ? undefined : "_blank"}
                    rel="noreferrer"
                    className="group relative flex items-center justify-between gap-4 overflow-hidden px-1 py-4"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 origin-bottom scale-y-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-y-100"
                    />
                    <span className="relative min-w-0">
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-muted group-hover:text-ink">
                        {c.label}
                      </span>
                      <span className="block truncate text-lg font-semibold tracking-tight group-hover:text-ink md:text-xl">
                        {c.value}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={22}
                      className="relative shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </a>
                </li>
              ))}
            </ul>
            <Magnetic className="mt-6">
              <a
                href={profile.cv}
                download
                className="inline-flex h-12 items-center gap-2 bg-fg px-5 font-semibold text-bg transition-colors hover:bg-accent hover:text-ink"
              >
                {ui.hero.ctaCv}
                <Download size={18} />
              </a>
            </Magnetic>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm ui={ui} />
          </div>
        </div>
      </Container>
    </section>
  );
}

