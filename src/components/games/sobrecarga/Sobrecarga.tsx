"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { readBest, saveBest } from "../shared";
import { readJSON, writeJSON } from "@/lib/storage";
import { Audio } from "./audio";
import type { Fighter, Intent } from "./fighter";
import { RANK_WORDS, render } from "./render";
import { MOVES } from "./moves";
import { STAGES } from "./roster";
import { POSES, SEGMENTS, fk, mixPose } from "./skeleton";
import { Game, RANKS, type StageStats } from "./world";

// SOBRECARGA: a stick-figure brawler hidden in the creative mode. Carlos
// fights his way through a tournament of bugs, from localhost to production.
// Full screen, keyboard first, with on-screen buttons on touch devices.

const BEST_KEY = "cv:sobrecarga:best";
const MUTE_KEY = "cv:sobrecarga:mute";
const BUFFER = 160;

type Action = "left" | "right" | "up" | "down" | "punch" | "kick" | "grab" | "block" | "sp1" | "sp2" | "sp3" | "overload";
type Screen = "title" | "play" | "paused" | "clear" | "over" | "victory";
type Summary = { stage: number; stageName: string; endless: boolean; stats: StageStats; score: number };

// Built so the hands never leave home: the right hand rests on the arrows,
// the left on A S D F (F has the bump), Q W E sit right above them and the
// thumb rests on the space bar.
const BIND: Record<string, Action> = {
  arrowleft: "left",
  arrowright: "right",
  arrowup: "up",
  arrowdown: "down",
  a: "punch",
  s: "kick",
  d: "grab",
  f: "block",
  q: "sp1",
  w: "sp2",
  e: "sp3",
  " ": "overload",
};

const T = {
  pt: {
    tagline: "Um torneio contra os bugs, de localhost até produção.",
    play: "Jogar",
    resume: "Continuar",
    restart: "Recomeçar rodada",
    quit: "Sair",
    next: "Próxima rodada",
    retry: "Tentar de novo",
    endless: "Modo sem fim",
    paused: "PAUSA",
    clear: "RODADA COMPLETA",
    over: "SISTEMA CAIU",
    victory: "PRODUÇÃO ESTÁVEL",
    victorySub: "O código legado caiu. Agora, ondas sem fim.",
    time: "Tempo",
    combo: "Maior combo",
    damage: "Dano recebido",
    rank: "Melhor nota",
    score: "Pontos",
    best: "Recorde",
    sound: "Som",
    on: "ligado",
    off: "desligado",
    keys: "Teclado recomendado",
    controls: [
      ["← →", "correr"],
      ["↑", "pular · no ar, pulo duplo"],
      ["↓", "esquiva com mortal · no ar, mergulho"],
      ["A", "soco · repita para combo"],
      ["S", "chute · repita para combo"],
      ["D", "agarrar · A joelhada · S ou D arremessa"],
      ["F", "defender (segure) · no tempo certo, contra-ataca"],
      ["Q W E", "especiais em câmera lenta: rajada, ciclone, choque"],
      ["Espaço", "sobrecarga, com a barra vermelha cheia"],
      ["G O K U K A M E", "com a bateria cheia: STACK OVERFLOW · errar no meio enfraquece ou estoura"],
      ["Esc / P", "pausa · M som"],
    ],
    tips: "Correndo, A, S e D viram investida, carrinho e agarrão voador · ↑ + A gancho · ↑ + S mortal · ↓ + S rasteira · no ar, Q W E mudam: tempestade, meteoro, raio · cada especial gasta uma carga da bateria · bata nas bolinhas roxas para devolver",
  },
  en: {
    tagline: "A tournament against bugs, from localhost to production.",
    play: "Play",
    resume: "Resume",
    restart: "Restart round",
    quit: "Quit",
    next: "Next round",
    retry: "Try again",
    endless: "Endless mode",
    paused: "PAUSED",
    clear: "ROUND CLEAR",
    over: "SYSTEM DOWN",
    victory: "PRODUCTION STABLE",
    victorySub: "The legacy code is down. Now, endless waves.",
    time: "Time",
    combo: "Best combo",
    damage: "Damage taken",
    rank: "Best rank",
    score: "Score",
    best: "Best",
    sound: "Sound",
    on: "on",
    off: "off",
    keys: "Keyboard recommended",
    controls: [
      ["← →", "run"],
      ["↑", "jump · double jump in the air"],
      ["↓", "flip dodge · in the air, dive"],
      ["A", "punch · repeat to combo"],
      ["S", "kick · repeat to combo"],
      ["D", "grab · A knee · S or D throws"],
      ["F", "guard (hold) · timed right, parries"],
      ["Q W E", "slow-motion specials: barrage, cyclone, shock"],
      ["Space", "overload, when the red bar is full"],
      ["G O K U K A M E", "with a full battery: STACK OVERFLOW · a slip weakens it or blows it up"],
      ["Esc / P", "pause · M sound"],
    ],
    tips: "While running, A, S and D become a dash punch, a slide and a flying tackle · ↑ + A uppercut · ↑ + S flip kick · ↓ + S sweep · in the air Q W E change: storm, meteor, bolt · each special spends one battery charge · hit the purple orbs to send them back",
  },
};

/** Keyboard (and touch) state, turned into an Intent each simulation step. */
class Input {
  held = new Set<Action>();
  pressed = new Map<Action, number>();
  lastDir = 0;
  upAt = -9999;

  down(a: Action, now: number) {
    if (this.held.has(a)) return;
    this.held.add(a);
    this.pressed.set(a, now);
    if (a === "left" || a === "right") this.lastDir = a === "left" ? -1 : 1;
    if (a === "up") this.upAt = now;
    // An attack pressed with up held is an up-attack, not a jump.
    if ((a === "punch" || a === "kick") && this.held.has("up")) this.upAt = -9999;
  }

  up(a: Action) {
    this.held.delete(a);
  }

  clear() {
    this.held.clear();
    this.pressed.clear();
    this.upAt = -9999;
  }

  private fresh(a: Action, now: number) {
    const t = this.pressed.get(a);
    return t !== undefined && now - t < BUFFER;
  }

  intent(now: number): Intent {
    const l = this.held.has("left");
    const r = this.held.has("right");
    const dx = l && r ? this.lastDir : l ? -1 : r ? 1 : 0;
    return {
      dx,
      up: this.held.has("up"),
      down: this.held.has("down"),
      block: this.held.has("block"),
      // A short delay lets up + attack become an up-attack instead of a jump.
      jump: this.upAt > 0 && now - this.upAt >= 45 && now - this.upAt < BUFFER + 45,
      dodge: this.fresh("down", now),
      punch: this.fresh("punch", now),
      kick: this.fresh("kick", now),
      grab: this.fresh("grab", now),
      special: this.fresh("sp1", now) ? 1 : this.fresh("sp2", now) ? 2 : this.fresh("sp3", now) ? 3 : 0,
      overload: this.fresh("overload", now),
    };
  }

  /** Drops the presses a step just used. */
  consume(f: Fighter, before: { state: string; move: string | null; moveT: number; vy: number }) {
    const started = f.move !== null && (f.move !== before.move || f.moveT < before.moveT);
    if (started || (f.state === "grab" && before.state !== "grab")) {
      for (const a of ["punch", "kick", "grab", "sp1", "sp2", "sp3", "overload", "down"] as Action[]) this.pressed.delete(a);
      this.upAt = -9999;
    }
    if (f.vy < before.vy - 300) this.upAt = -9999;
    if (f.state === "roll" && before.state !== "roll") this.pressed.delete("down");
  }
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Sobrecarga({ lang, onClose, reducedMotion }: { lang: "pt" | "en"; onClose: () => void; reducedMotion: boolean }) {
  const t = T[lang];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const input = useRef(new Input());
  const audio = useRef<Audio | null>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [muted, setMuted] = useState(() => readJSON<boolean>(MUTE_KEY, false));
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  /** What the end screens show, captured when the round ends. */
  const [summary, setSummary] = useState<Summary | null>(null);

  const close = useEffectEvent(onClose);

  const start = () => {
    if (!audio.current) audio.current = new Audio();
    audio.current.setMuted(muted);
    audio.current.start();
    game.current = new Game(lang);
    // Lets the headless tests read and steer the match in development.
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as Record<string, unknown>;
      w.__sobrecarga = game.current;
      w.__sobrecargaDev = { POSES, MOVES, fk, mixPose, SEGMENTS };
    }
    input.current.clear();
    setScreen("play");
  };

  const resume = () => {
    input.current.clear();
    setScreen("play");
  };

  const finish = () => {
    const g = game.current;
    if (g) {
      saveBest(BEST_KEY, g.score);
      setBest(readBest(BEST_KEY));
    }
  };

  const end = (s: "clear" | "over" | "victory") => {
    const g = game.current!;
    finish();
    setSummary({ stage: g.stage, stageName: g.stageName, endless: g.endless >= 0, stats: { ...g.stats }, score: g.score });
    setScreen(s);
  };

  const next = () => {
    const g = game.current;
    if (!g) return;
    finish();
    g.next();
    input.current.clear();
    setScreen("play");
  };
  const retry = () => {
    const g = game.current;
    if (!g) return;
    finish();
    g.retry();
    input.current.clear();
    setScreen("play");
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      writeJSON(MUTE_KEY, next);
      audio.current?.setMuted(next);
      return next;
    });
  };

  // The dialog: modal, full screen. Esc pauses instead of closing.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const opener = document.activeElement as HTMLElement | null;
    d.showModal();
    canvasRef.current?.focus();
    const cancel = (e: Event) => e.preventDefault();
    d.addEventListener("cancel", cancel);
    return () => {
      d.removeEventListener("cancel", cancel);
      audio.current?.stop();
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKey = useEffectEvent((e: KeyboardEvent, isDown: boolean) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    const sc = screen;
    if (isDown && (key === "escape" || key === "p")) {
      e.preventDefault();
      if (sc === "play") setScreen("paused");
      else if (sc === "paused") resume();
      else if (key === "escape") close();
      return;
    }
    // While the blast charges, every letter goes to its code, even A, E and M.
    if (isDown && screen === "play" && game.current?.charge && /^[a-z]$/.test(key)) {
      e.preventDefault();
      if (!e.repeat) game.current.beamKey(key.toUpperCase());
      return;
    }
    if (isDown && key === "m") return toggleMute();
    if (isDown && key === "enter" && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (sc === "title") start();
      else if (sc === "paused") resume();
      else if (sc === "clear") next();
      else if (sc === "over") retry();
      else if (sc === "victory") next();
      return;
    }
    const a = BIND[key];
    // Free letters feed the energy blast's key sequence.
    if (!a && isDown && !e.repeat && screen === "play" && /^[a-z]$/.test(key)) {
      e.preventDefault();
      game.current?.beamKey(key.toUpperCase());
      return;
    }
    if (!a) return;
    e.preventDefault();
    const g = game.current;
    if (isDown) input.current.down(a, g?.now ?? 0);
    else input.current.up(a);
  });

  const onBlur = useEffectEvent(() => {
    input.current.clear();
    if (screen === "play") setScreen("paused");
  });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    const blur = () => onBlur();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const restart = () => retry();

  const frame = useEffectEvent((ms: number, ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const g = game.current;
    if (!g) {
      ctx.fillStyle = "#0e0e0e";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (screen === "play") {
      g.update(
        ms,
        () => input.current.intent(g.now),
        (f, before) => input.current.consume(f, before),
      );
      const a = audio.current;
      if (a) {
        for (const s of g.sounds) a.play(s.name);
        a.setSlow(g.slowOn || g.forced.ms > 0);
        a.tick(g.phase === "fight" || g.phase === "wave");
      }
      g.sounds.length = 0;
      // End screens wait for the slow-motion finish.
      if (g.phase === "over" && g.phaseT > 1800) end("over");
      else if (g.phase === "clear" && g.phaseT > 1400) end("clear");
      else if (g.phase === "victory" && g.phaseT > 1600) end("victory");
    }
    if (reducedMotion) g.shake = 0;
    render(ctx, g, W, H, best);
  });

  // Canvas size and the animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx = canvas.getContext("2d")!;
    let W = 0;
    let H = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const ms = Math.min(100, now - last);
      last = now;
      frame(ms, ctx, W, H);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  const stats = summary?.stats;
  const btn = "h-11 px-5 text-sm font-semibold transition-colors";
  const primary = `${btn} bg-accent text-ink hover:bg-paper`;
  const ghost = `${btn} border border-paper/30 text-paper hover:border-paper`;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Sobrecarga"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-ink p-0 text-paper backdrop:bg-ink"
    >
      <canvas ref={canvasRef} tabIndex={0} aria-label="Sobrecarga" className="block size-full touch-none outline-none" />

      {screen === "play" && (
        <button type="button" onClick={() => setScreen("paused")} aria-label={t.paused} className="absolute bottom-4 right-4 grid size-10 place-items-center border border-paper/25 font-mono text-xs text-paper/70 hover:border-paper">
          II
        </button>
      )}

      {screen === "play" && touch && <TouchPad input={input} game={game} />}

      {screen !== "play" && (
        <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl">
            {screen === "title" && (
              <div>
                <Logo />
                <p className="mt-3 text-base text-paper/75 sm:text-lg">{t.tagline}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" autoFocus onClick={start} className={primary}>
                    {t.play} <span className="ml-1 font-mono text-xs opacity-60">Enter</span>
                  </button>
                  <button type="button" onClick={toggleMute} className={ghost}>
                    {t.sound}: {muted ? t.off : t.on}
                  </button>
                  <button type="button" onClick={onClose} className={ghost}>
                    {t.quit}
                  </button>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-wider text-paper/50">
                  {t.best} <span className="text-paper">{String(best).padStart(7, "0")}</span> · {t.keys}
                </p>
                <Controls lang={lang} />
              </div>
            )}

            {screen === "paused" && (
              <div>
                <h2 className="text-5xl font-black italic tracking-[-0.04em] sm:text-6xl">
                  {t.paused}
                  <span className="text-accent">.</span>
                </h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" autoFocus onClick={resume} className={primary}>
                    {t.resume}
                  </button>
                  <button type="button" onClick={restart} className={ghost}>
                    {t.restart}
                  </button>
                  <button type="button" onClick={toggleMute} className={ghost}>
                    {t.sound}: {muted ? t.off : t.on}
                  </button>
                  <button type="button" onClick={onClose} className={ghost}>
                    {t.quit}
                  </button>
                </div>
                <Controls lang={lang} />
              </div>
            )}

            {(screen === "clear" || screen === "over" || screen === "victory") && summary && stats && (
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-paper/60">
                  {summary.endless ? "∞" : `${summary.stage + 1}/${STAGES.length}`} · {summary.stageName}
                </p>
                <h2 className={`mt-1 text-5xl font-black italic tracking-[-0.04em] sm:text-7xl ${screen === "over" ? "text-accent" : ""}`}>
                  {screen === "clear" ? t.clear : screen === "over" ? t.over : t.victory}
                  <span className="text-accent">.</span>
                </h2>
                {screen === "victory" && <p className="mt-2 text-paper/75">{t.victorySub}</p>}
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
                  {[
                    [t.time, fmtTime(stats.time)],
                    [t.combo, String(stats.maxCombo)],
                    [t.damage, String(Math.round(stats.damage))],
                    [t.rank, `${RANKS[stats.bestRank]} · ${RANK_WORDS[lang][stats.bestRank]}`],
                    [t.score, String(summary.score).padStart(7, "0")],
                  ].map(([k, v]) => (
                    <div key={k} className="border-t border-paper/20 pt-2">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-paper/55">{k}</dt>
                      <dd className="mt-1 text-xl font-black italic">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-7 flex flex-wrap gap-3">
                  {screen === "clear" && (
                    <button type="button" autoFocus onClick={next} className={primary}>
                      {t.next} <span className="ml-1 font-mono text-xs opacity-60">Enter</span>
                    </button>
                  )}
                  {screen === "over" && (
                    <button type="button" autoFocus onClick={retry} className={primary}>
                      {t.retry} <span className="ml-1 font-mono text-xs opacity-60">Enter</span>
                    </button>
                  )}
                  {screen === "victory" && (
                    <button type="button" autoFocus onClick={next} className={primary}>
                      {t.endless} <span className="ml-1 font-mono text-xs opacity-60">Enter</span>
                    </button>
                  )}
                  <button type="button" onClick={onClose} className={ghost}>
                    {t.quit}
                  </button>
                </div>
                <p className="mt-4 font-mono text-xs uppercase tracking-wider text-paper/50">
                  {t.best} <span className="text-paper">{String(Math.max(best, summary.score)).padStart(7, "0")}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function Logo() {
  return (
    <h2 className="relative select-none text-[clamp(3rem,11vw,7.5rem)] font-black italic leading-[0.85] tracking-[-0.06em]">
      <span className="text-paper">SOBRE</span>
      <span className="text-accent [text-shadow:0_0_24px_rgba(226,59,46,0.55)]">CARGA</span>
      <svg aria-hidden="true" viewBox="0 0 60 100" className="absolute -top-3 left-[46%] h-[0.9em] text-accent opacity-90">
        <path d="M34 0 L8 56 H28 L18 100 L54 36 H32 L44 0 Z" fill="currentColor" />
      </svg>
    </h2>
  );
}

function Controls({ lang }: { lang: "pt" | "en" }) {
  const t = T[lang];
  return (
    <div className="mt-6 border-t border-paper/15 pt-4">
      <dl className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {t.controls.map(([k, v]) => (
          <div key={k} className="flex gap-3 text-sm">
            <dt className="w-24 shrink-0 font-mono text-xs leading-5 text-accent">{k}</dt>
            <dd className="text-paper/75">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-paper/50">{t.tips}</p>
    </div>
  );
}

/** On-screen buttons for touch screens. */
function TouchPad({ input, game }: { input: RefObject<Input>; game: RefObject<Game | null> }) {
  const hold = (a: Action) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      input.current.down(a, game.current?.now ?? 0);
    },
    onPointerUp: () => input.current.up(a),
    onPointerCancel: () => input.current.up(a),
  });
  const key = "grid size-14 place-items-center rounded-full border border-paper/30 bg-ink/50 font-mono text-xs text-paper active:bg-accent active:text-ink";
  return (
    <>
      <div className="absolute bottom-6 left-4 grid grid-cols-3 gap-2">
        <span />
        <button type="button" className={key} {...hold("up")}>↑</button>
        <span />
        <button type="button" className={key} {...hold("left")}>←</button>
        <button type="button" className={key} {...hold("down")}>↓</button>
        <button type="button" className={key} {...hold("right")}>→</button>
      </div>
      <div className="absolute bottom-6 right-16 grid grid-cols-4 gap-2">
        <button type="button" className={key} {...hold("sp1")}>Q</button>
        <button type="button" className={key} {...hold("sp2")}>W</button>
        <button type="button" className={key} {...hold("sp3")}>E</button>
        <button type="button" className={key} {...hold("overload")}>⚡</button>
        <button type="button" className={key} {...hold("punch")}>A</button>
        <button type="button" className={key} {...hold("kick")}>S</button>
        <button type="button" className={key} {...hold("grab")}>D</button>
        <button type="button" className={key} {...hold("block")}>F</button>
      </div>
    </>
  );
}
