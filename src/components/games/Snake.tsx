"use client";

import { useEffect, useRef, useState } from "react";
import type { Ui } from "@/content";
import { INK, PAPER, RED, Scoreboard, readBest, saveBest, setupCanvas, useCanvasSize } from "./shared";

const N = 20;
const BEST_KEY = "cv:best:snake";
type Phase = "ready" | "playing" | "over";

const KEYS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

export function Snake({ ui }: { ui: Ui }) {
  const { wrap, size } = useCanvasSize(1, 520);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBest(BEST_KEY));
  const [phase, setPhase] = useState<Phase>("ready");
  const api = useRef<{ turn: (dx: number, dy: number) => void; restart: () => void }>({
    turn: () => {},
    restart: () => {},
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = setupCanvas(canvas, size.w, size.w);
    const cell = size.w / N;

    let snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ];
    let dir: [number, number] = [1, 0];
    let queue: [number, number][] = [];
    let food = { x: 14, y: 10 };
    let points = 0;
    let delay = 130;
    let timer = 0;
    let running = false;

    const place = () => {
      do {
        food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      } while (snake.some((s) => s.x === food.x && s.y === food.y));
    };

    const draw = () => {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, size.w, size.w);
      ctx.strokeStyle = "rgba(244,242,236,0.05)";
      for (let i = 1; i < N; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size.w);
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size.w, i * cell);
        ctx.stroke();
      }
      ctx.fillStyle = RED;
      ctx.fillRect(food.x * cell + cell * 0.18, food.y * cell + cell * 0.18, cell * 0.64, cell * 0.64);
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? PAPER : "rgba(244,242,236,0.78)";
        ctx.fillRect(s.x * cell + 1, s.y * cell + 1, cell - 2, cell - 2);
      });
    };

    const tick = () => {
      if (queue.length) dir = queue.shift()!;
      const head = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };
      const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
      if (hitWall || hitSelf) {
        running = false;
        saveBest(BEST_KEY, points);
        setBest(readBest(BEST_KEY));
        setPhase("over");
        return;
      }
      snake = [head, ...snake];
      if (head.x === food.x && head.y === food.y) {
        points += 1;
        setScore(points);
        delay = Math.max(62, delay - 4);
        place();
      } else {
        snake.pop();
      }
      draw();
      timer = window.setTimeout(tick, delay);
    };

    const start = () => {
      if (running) return;
      running = true;
      setPhase("playing");
      timer = window.setTimeout(tick, delay);
    };

    api.current.turn = (dx, dy) => {
      const last = queue[queue.length - 1] ?? dir;
      if ((dx === -last[0] && dy === -last[1]) || (dx === last[0] && dy === last[1])) {
        if (!running) start();
        return;
      }
      if (queue.length < 3) queue.push([dx, dy]);
      if (!running) start();
    };

    api.current.restart = () => {
      window.clearTimeout(timer);
      snake = [
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 },
      ];
      dir = [1, 0];
      queue = [];
      points = 0;
      delay = 130;
      running = false;
      setScore(0);
      place();
      draw();
      start();
    };

    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key.toLowerCase()];
      if (!d) return;
      e.preventDefault();
      api.current.turn(d[0], d[1]);
    };
    window.addEventListener("keydown", onKey);
    draw();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [size.w]);

  // Swipe support on touch screens.
  const swipe = useRef<{ x: number; y: number } | null>(null);

  return (
    <div>
      <Scoreboard
        items={[
          { label: ui.games.score, value: score },
          { label: ui.games.best, value: best },
        ]}
      />
      <div ref={wrap} className="relative mx-auto w-full max-w-[520px]">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          data-autofocus
          aria-label="Snake"
          className="mx-auto block touch-none border border-paper/20"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            if (!swipe.current) return;
            const dx = e.clientX - swipe.current.x;
            const dy = e.clientY - swipe.current.y;
            swipe.current = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
            if (Math.abs(dx) > Math.abs(dy)) api.current.turn(Math.sign(dx), 0);
            else api.current.turn(0, Math.sign(dy));
          }}
        />
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/70">
            <div className="text-center">
              <p className="text-3xl font-black italic text-paper">
                {phase === "over" ? "GAME OVER" : "PRESS START"}
                <span className="text-accent">.</span>
              </p>
              {phase === "over" ? (
                <button
                  type="button"
                  onClick={() => api.current.restart()}
                  className="mt-4 h-11 bg-accent px-5 text-sm font-semibold text-ink"
                >
                  {ui.games.restart}
                </button>
              ) : (
                <p className="mt-2 font-mono text-xs text-paper/70">← ↑ → ↓</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto mt-4 grid w-40 grid-cols-3 gap-1.5 sm:hidden" aria-label="D-pad">
        {(
          [
            ["↑", 0, -1, "col-start-2"],
            ["←", -1, 0, "col-start-1 row-start-2"],
            ["→", 1, 0, "col-start-3 row-start-2"],
            ["↓", 0, 1, "col-start-2 row-start-3"],
          ] as const
        ).map(([label, dx, dy, pos]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => api.current.turn(dx, dy)}
            className={`grid size-12 place-items-center border border-paper/30 text-lg text-paper active:bg-accent active:text-ink ${pos}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
