"use client";

import Image from "next/image";
import { AnimatePresence, animate, m, useInView } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Content } from "@/content";
import { useExperience } from "../shell/ExperienceProvider";
import { ANIME, NIMBUS, giphyPage, giphySrc, type Sticker } from "./anime";

type AnimeKey = keyof typeof ANIME;
const ORDER: AnimeKey[] = ["db", "naruto", "op"];

// "Off the clock": anime, old games and football, the things that stay out of
// the serious mode. Chibi stickers float, swap with a pop and a speed-line burst.
export function Hobbies({ content }: { content: Content }) {
  const h = content.ui.creative.hobbies;
  const { openGame, setTerminalOpen } = useExperience();

  return (
    <div>
      <p className="max-w-xl text-lg text-muted">{h.lead}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {ORDER.map((key, i) => (
          <AnimeCard key={key} id={key} index={i} content={content} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <SideCard
          title={h.games.title}
          caption={h.games.caption}
          cta={h.games.cta}
          onClick={() => openGame("snake")}
          art={<PixelPad />}
        />
        <SideCard
          title={h.football.title}
          caption={h.football.caption}
          cta={h.football.cta}
          onClick={() => setTerminalOpen(true)}
          art={<Ball />}
        />
      </div>

      <p className="mt-6 font-mono text-[11px] text-muted">
        {h.credit}:{" "}
        {[...ORDER.flatMap((k) => ANIME[k].stickers), NIMBUS].map((s, i, all) => (
          <span key={`${s.id}-${i}`}>
            <a href={giphyPage(s.id)} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
              {s.name}
            </a>
            {i < all.length - 1 ? ", " : ""}
          </span>
        ))}
        . Dragon Ball © Bird Studio/Shueisha, Toei Animation · Naruto © Masashi Kishimoto/Shueisha · One Piece © Eiichiro Oda/Shueisha, Toei Animation.
      </p>
    </div>
  );
}

function AnimeCard({ id, index, content }: { id: AnimeKey; index: number; content: Content }) {
  const h = content.ui.creative.hobbies;
  const anime = ANIME[id];
  const card = h.cards[id];
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const sticker: Sticker = anime.stickers[i];

  return (
    <m.article
      className="group relative flex min-h-[460px] flex-col overflow-hidden border-2 border-paper p-5 sm:p-6"
      style={{ background: anime.color, color: anime.ink } as CSSProperties}
      initial={{ opacity: 0, y: 60, rotate: index % 2 ? 2 : -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ type: "spring", stiffness: 160, damping: 20, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
    >
      <SpeedLines color={anime.ink} burst={burst} />
      <div className="relative flex items-start justify-between gap-3">
        <h3 className="text-[clamp(2rem,4vw,3rem)] font-black uppercase italic leading-[0.85] tracking-[-0.04em]">{card.title}</h3>
        <span className="font-mono text-xs opacity-70">
          {String(i + 1).padStart(2, "0")}/{String(anime.stickers.length).padStart(2, "0")}
        </span>
      </div>

      <div className="relative my-4 grid flex-1 place-items-center">
        <AnimatePresence mode="popLayout">
          <m.div
            key={sticker.id}
            className="relative h-48 w-full sm:h-56"
            initial={{ scale: 0.2, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.2, rotate: 25, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
          >
            <m.div
              className="size-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src={giphySrc(sticker.id)}
                alt={sticker.name}
                fill
                unoptimized
                sizes="(min-width: 768px) 30vw, 80vw"
                className={`object-contain drop-shadow-[4px_6px_0_rgba(0,0,0,0.25)] ${sticker.pixel ? "[image-rendering:pixelated]" : ""}`}
              />
            </m.div>
          </m.div>
        </AnimatePresence>
      </div>

      {id === "db" && <PowerLevel label={h.power} />}
      <p className="relative text-sm leading-relaxed opacity-90">{card.caption}</p>
      <button
        type="button"
        onClick={() => {
          setI((n) => (n + 1) % anime.stickers.length);
          setBurst((b) => b + 1);
        }}
        className="relative mt-4 inline-flex h-11 items-center justify-center gap-2 border-2 border-current px-4 text-sm font-bold uppercase tracking-tight transition-colors hover:bg-ink hover:text-paper active:scale-95"
      >
        {h.swap}
      </button>
    </m.article>
  );
}

function SpeedLines({ color, burst }: { color: string; burst: number }) {
  const lines = Array.from({ length: 48 }, (_, k) => {
    const a = (k / 48) * Math.PI * 2;
    return (
      <line
        key={k}
        x1={Math.cos(a) * 18}
        y1={Math.sin(a) * 18}
        x2={Math.cos(a) * 100}
        y2={Math.sin(a) * 100}
        stroke={color}
        strokeWidth={k % 3 === 0 ? 1.4 : 0.5}
      />
    );
  });
  return (
    <m.svg
      key={burst}
      aria-hidden="true"
      viewBox="-100 -100 200 200"
      className="pointer-events-none absolute left-1/2 top-[45%] size-[170%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-500 group-hover:opacity-20"
      initial={burst ? { opacity: 0.45, scale: 0.6 } : false}
      animate={burst ? { opacity: 0, scale: 1.2 } : undefined}
      transition={{ duration: 0.7 }}
    >
      {lines}
    </m.svg>
  );
}

// A scouter reading that climbs past 8000, as the meme demands.
function PowerLevel({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (!seen || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, 9001, {
      duration: 2.2,
      ease: [0.6, 0, 0.2, 1],
      onUpdate: (v) => (el.textContent = Math.round(v).toLocaleString("pt-BR")),
      onComplete: () => setOver(true),
    });
    return () => controls.stop();
  }, [seen]);
  return (
    <p className="relative mb-3 flex items-baseline gap-2 font-mono text-xs uppercase">
      <span className="opacity-70">{label}</span>
      <span ref={ref} className="font-tabular text-xl font-black">
        0
      </span>
      {over && (
        <m.span
          className="bg-ink px-1.5 py-0.5 text-[10px] font-bold text-amber"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: -6 }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
        >
          &gt; 8000!
        </m.span>
      )}
    </p>
  );
}

function SideCard({
  title,
  caption,
  cta,
  onClick,
  art,
}: {
  title: string;
  caption: string;
  cta: string;
  onClick: () => void;
  art: ReactNode;
}) {
  return (
    <m.article
      className="group flex items-center gap-5 border-2 border-line-strong p-5 transition-colors hover:border-paper sm:p-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="shrink-0 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">{art}</div>
      <div className="min-w-0">
        <h3 className="text-2xl font-black uppercase italic tracking-[-0.03em]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{caption}</p>
        <button
          type="button"
          onClick={onClick}
          className="mt-3 inline-flex h-10 items-center border border-paper px-3 text-sm font-semibold transition-colors hover:bg-paper hover:text-ink"
        >
          {cta}
        </button>
      </div>
    </m.article>
  );
}

function PixelPad() {
  // 12×7 pixel gamepad.
  const rows = ["..XXXXXXXX..", ".XXXXXXXXXX.", "XX.XXXXXX.XX", "X...XXXX.X.X", "XX.XXXXXX.XX", ".XXXXXXXXXX.", "..XX....XX.."];
  return (
    <svg viewBox="0 0 12 7" className="h-12 w-20" aria-hidden="true" shapeRendering="crispEdges">
      {rows.flatMap((r, y) =>
        [...r].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--accent)" /> : null)),
      )}
    </svg>
  );
}

function Ball() {
  return (
    <svg viewBox="-50 -50 100 100" className="size-16 animate-[spin_6s_linear_infinite]" aria-hidden="true">
      <circle r="46" fill="#f4f2ec" stroke="#121212" strokeWidth="4" />
      <polygon points="0,-16 15,-5 9,13 -9,13 -15,-5" fill="#121212" />
      {[0, 72, 144, 216, 288].map((a) => (
        <polygon key={a} points="0,-46 9,-38 6,-30 -6,-30 -9,-38" fill="#121212" transform={`rotate(${a})`} />
      ))}
    </svg>
  );
}

/** Goku crosses the screen on the flying nimbus, right to left, every now and then. */
export function NimbusCameo() {
  const { reducedMotion } = useExperience();
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reducedMotion) return;
    const first = window.setTimeout(() => setRun(1), 6000);
    const id = window.setInterval(() => setRun((r) => r + 1), 32000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [reducedMotion]);
  if (!run) return null;
  return (
    <m.div
      key={run}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[18vh] left-0 z-20 w-24 sm:w-32"
      initial={{ x: "110vw", y: 0, rotate: -6 }}
      animate={{ x: "-25vw", y: [0, -40, 10, -30, 0], rotate: [-6, 4, -6, 2, -6] }}
      transition={{ duration: 7, ease: "linear" }}
    >
      <Image src={giphySrc(NIMBUS.id)} alt="" width={NIMBUS.width} height={NIMBUS.height} unoptimized className="h-auto w-full" />
    </m.div>
  );
}
