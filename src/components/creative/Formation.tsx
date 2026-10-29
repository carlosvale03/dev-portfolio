"use client";

import { AnimatePresence, m, useAnimate } from "motion/react";
import { useMemo, useState, type CSSProperties } from "react";
import type { Content } from "@/content";
import { fill } from "@/lib/storage";
import { useExperience } from "../shell/ExperienceProvider";

type Line = "gk" | "def" | "mid" | "att";
interface Player {
  label: string;
  n: number;
  line: Line;
  /** Position on a vertical pitch, attack at the top (percent). */
  vx: number;
  vy: number;
}

// The stack as a 4-3-3. Labels must match items in content.stack.
const LINEUP: { line: Line; y: number; players: [string, number][] }[] = [
  { line: "att", y: 17, players: [["LLMs", 7], ["BERT", 9], ["Python", 11]] },
  { line: "mid", y: 40, players: [["TypeScript", 5], ["Next.js", 10], ["React", 8]] },
  { line: "def", y: 64, players: [["Redis", 2], ["Node.js", 3], ["Docker", 4], ["Django", 6]] },
  { line: "gk", y: 87, players: [["PostgreSQL", 1]] },
];
const COACH = "Product discovery";

const PLAYERS: Player[] = LINEUP.flatMap(({ line, y, players }) =>
  players.map(([label, n], i) => ({ label, n, line, vy: y, vx: ((i + 1) / (players.length + 1)) * 100 })),
);

const LINE_STYLE: Record<Line, string> = {
  gk: "bg-amber text-ink",
  def: "bg-paper text-ink",
  mid: "bg-accent text-ink",
  att: "bg-royal text-paper",
};

const pos = (p: Pick<Player, "vx" | "vy">) =>
  ({ "--vx": `${p.vx}%`, "--vy": `${p.vy}%`, "--hx": `${100 - p.vy}%` }) as CSSProperties;

export function Formation({ content }: { content: Content }) {
  const { ui, stack, projects, publications } = content;
  const t = ui.creative.formation;
  const { openProject, scoreGoal } = useExperience();
  const [selected, setSelected] = useState<string>("Next.js");
  const [goals, setGoals] = useState(0);
  const [flash, setFlash] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scope, animate] = useAnimate();

  const starters = new Set([...PLAYERS.map((p) => p.label), COACH]);
  const bench = stack.flatMap((g) => g.items).filter((item) => !starters.has(item));

  const appearances = useMemo(() => {
    const match = (label: string, entries: string[]) =>
      entries.some((e) => e.toLowerCase().startsWith(label.toLowerCase()));
    return (label: string) => ({
      projects: projects.filter((p) => match(label, p.stack)),
      papers: publications.filter((p) => match(label, p.tech)),
    });
  }, [projects, publications]);

  const player = PLAYERS.find((p) => p.label === selected);
  const where = appearances(selected);
  const count = where.projects.length + where.papers.length;
  const position = player ? t.positions[player.line] : selected === COACH ? t.positions.coach : t.positions.bench;

  // Pontapé inicial: the ball passes from the keeper up to the strikers and
  // into the goal, following whichever orientation the pitch has right now.
  const kickoff = async () => {
    if (playing) return;
    setPlaying(true);
    const pick = (line: Line) => {
      const options = PLAYERS.filter((p) => p.line === line);
      return options[Math.floor(Math.random() * options.length)];
    };
    const route = [pick("gk"), pick("def"), PLAYERS.find((p) => p.n === 10)!, pick("att"), { vx: 50, vy: 2 }];
    const horizontal = window.matchMedia("(min-width: 1024px)").matches;
    const left = route.map((p) => `${horizontal ? 100 - p.vy : p.vx}%`);
    const top = route.map((p) => `${horizontal ? p.vx : p.vy}%`);
    await animate("[data-ball]", { left, top, opacity: [1, 1, 1, 1, 1] }, { duration: 2.4, ease: "easeInOut" });
    setGoals((g) => g + 1);
    setFlash((f) => f + 1);
    scoreGoal();
    await animate("[data-ball]", { opacity: 0 }, { duration: 0.2, delay: 0.6 });
    setPlaying(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-8">
        <div
          ref={scope}
          className="relative mx-auto aspect-[3/4] max-h-[78vh] w-full overflow-hidden border-2 border-paper/80 bg-[#1d5c35] sm:aspect-[4/5] lg:aspect-[16/10] lg:max-h-none"
        >
          <Pitch />
          {PLAYERS.map((p, i) => {
            const active = p.label === selected;
            return (
              <m.button
                key={p.label}
                type="button"
                onClick={() => setSelected(p.label)}
                aria-pressed={active}
                aria-label={`${p.n} · ${p.label} · ${t.positions[p.line]}`}
                style={pos(p)}
                className="absolute left-[var(--vx)] top-[var(--vy)] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 lg:left-[var(--hx)] lg:top-[var(--vx)]"
                initial={{ opacity: 0, scale: 0.3, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
              >
                <span
                  className={`relative grid size-10 place-items-center rounded-full border-2 border-ink font-black shadow-[3px_3px_0_#121212] transition-transform sm:size-12 md:size-14 md:text-lg ${LINE_STYLE[p.line]} ${
                    active ? "scale-110 ring-4 ring-amber" : ""
                  }`}
                >
                  {p.n}
                  {active && (
                    <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border-2 border-amber" />
                  )}
                </span>
                <span className="whitespace-nowrap bg-ink/85 px-1.5 py-0.5 font-mono text-[10px] text-paper sm:text-[11px]">
                  {p.label}
                </span>
              </m.button>
            );
          })}
          <span
            data-ball
            aria-hidden="true"
            className="absolute z-20 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-paper opacity-0 shadow-[2px_2px_0_#121212] sm:size-5"
            style={{ left: "50%", top: "87%" }}
          />
          <AnimatePresence>
            {flash > 0 && (
              <m.p
                key={flash}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 grid place-items-center text-[clamp(4rem,16vw,10rem)] font-black italic tracking-[-0.05em] text-accent [text-shadow:6px_6px_0_#121212]"
                initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                animate={{ scale: [0.4, 1.15, 1], opacity: [0, 1, 0], rotate: -6 }}
                transition={{ duration: 1.4, times: [0, 0.3, 1] }}
              >
                GOL!
              </m.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={kickoff}
            disabled={playing}
            className="inline-flex h-11 items-center bg-accent px-5 text-sm font-semibold text-ink transition-transform active:scale-95 disabled:opacity-60"
          >
            {t.kickoff} ⚽
          </button>
          <span className="font-tabular font-mono text-sm text-accent-text" aria-live="polite">
            {fill(goals === 1 ? ui.creative.goal : ui.creative.goals, { n: goals })}
          </span>
        </div>

        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{t.positions.bench}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {[COACH, ...bench].map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  aria-pressed={selected === item}
                  className={`border px-2.5 py-1 font-mono text-xs transition-colors ${
                    selected === item ? "border-accent bg-accent text-ink" : "border-line-strong hover:border-fg"
                  }`}
                >
                  {item === COACH ? `${t.positions.coach}: ${item}` : item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-4" aria-live="polite">
        <AnimatePresence mode="wait">
          <m.article
            key={selected}
            initial={{ opacity: 0, rotateY: -70 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 70, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ transformPerspective: 900 }}
            className="relative overflow-hidden border-2 border-paper bg-surface p-6 shadow-[10px_10px_0_var(--accent)] lg:sticky lg:top-24"
          >
            <span
              aria-hidden="true"
              className="absolute -right-4 -top-8 text-[9rem] font-black leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_var(--line-strong)]"
            >
              {player?.n ?? "—"}
            </span>
            <p className="relative font-mono text-xs uppercase tracking-wider text-accent-text">{position}</p>
            <h3 className="relative mt-2 text-4xl font-black tracking-[-0.04em]">{selected}</h3>
            <p className="relative mt-3 leading-relaxed text-muted">
              {t.roles[selected] ?? (count > 0 ? fill(t.inProjects, { n: count }) : t.noProjects)}
            </p>
            {count > 0 && (
              <>
                <p className="relative mt-5 font-mono text-[11px] uppercase tracking-wider text-muted">
                  {fill(t.inProjects, { n: count })}
                </p>
                <ul className="relative mt-2 flex flex-wrap gap-1.5">
                  {where.projects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => openProject(p.id)}
                        className="border border-line-strong px-2.5 py-1 text-sm font-semibold transition-colors hover:border-accent hover:bg-accent hover:text-ink"
                      >
                        {p.title}
                      </button>
                    </li>
                  ))}
                  {where.papers.map((p) => (
                    <li key={p.id} className="border border-dashed border-line-strong px-2.5 py-1 font-mono text-xs">
                      {p.venueShort} {p.year}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {!player && selected !== COACH && <p className="relative mt-5 text-sm text-muted">{t.noProjects}</p>}
          </m.article>
        </AnimatePresence>
        <p className="mt-4 font-mono text-xs text-muted">{t.pick}</p>
      </div>
    </div>
  );
}

function Pitch() {
  const line = "rgba(244,242,236,0.55)";
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#1d5c35_0_10%,#216a3d_10%_20%)] lg:bg-[repeating-linear-gradient(90deg,#1d5c35_0_6.25%,#216a3d_6.25%_12.5%)]"
      />
      <svg aria-hidden="true" viewBox="0 0 100 133" preserveAspectRatio="none" className="absolute inset-0 size-full lg:hidden">
        <g fill="none" stroke={line} strokeWidth="0.5" vectorEffect="non-scaling-stroke">
          <rect x="4" y="3" width="92" height="127" />
          <line x1="4" y1="66.5" x2="96" y2="66.5" />
          <ellipse cx="50" cy="66.5" rx="12" ry="9" />
          <rect x="25" y="3" width="50" height="18" />
          <rect x="38" y="3" width="24" height="7" />
          <rect x="25" y="112" width="50" height="18" />
          <rect x="38" y="123" width="24" height="7" />
        </g>
      </svg>
      <svg aria-hidden="true" viewBox="0 0 160 100" preserveAspectRatio="none" className="absolute inset-0 hidden size-full lg:block">
        <g fill="none" stroke={line} strokeWidth="0.5" vectorEffect="non-scaling-stroke">
          <rect x="3" y="4" width="154" height="92" />
          <line x1="80" y1="4" x2="80" y2="96" />
          <ellipse cx="80" cy="50" rx="11" ry="14" />
          <rect x="3" y="25" width="22" height="50" />
          <rect x="3" y="38" width="8" height="24" />
          <rect x="135" y="25" width="22" height="50" />
          <rect x="149" y="38" width="8" height="24" />
        </g>
      </svg>
    </>
  );
}
