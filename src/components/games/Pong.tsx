"use client";

import { useEffect, useRef, useState } from "react";
import type { Ui } from "@/content";
import { INK, PAPER, RED, Scoreboard, setupCanvas, useCanvasSize } from "./shared";

const WIN = 5;
type Phase = "ready" | "playing" | "won" | "lost";

export function Pong({ ui }: { ui: Ui }) {
  const { wrap, size } = useCanvasSize(16 / 10, 760);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [phase, setPhase] = useState<Phase>("ready");
  const api = useRef({ start: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const W = size.w;
    const H = size.h;
    const ctx = setupCanvas(canvas, W, H);
    const PH = H * 0.2;
    const PW = Math.max(8, W * 0.014);
    const R = Math.max(5, W * 0.011);

    let player = H / 2;
    let ai = H / 2;
    let target = H / 2;
    let bx = W / 2;
    let by = H / 2;
    let vx = 0;
    let vy = 0;
    let pts: [number, number] = [0, 0];
    let raf = 0;
    let last = 0;
    const keys = { up: false, down: false };

    const serve = (toward: 1 | -1) => {
      bx = W / 2;
      by = H / 2;
      const speed = W * 0.0075;
      const angle = (Math.random() - 0.5) * 0.9;
      vx = Math.cos(angle) * speed * toward;
      vy = Math.sin(angle) * speed;
    };

    const draw = () => {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(244,242,236,0.18)";
      for (let y = 8; y < H; y += 22) ctx.fillRect(W / 2 - 1.5, y, 3, 12);
      ctx.fillStyle = PAPER;
      ctx.fillRect(18, player - PH / 2, PW, PH);
      ctx.fillStyle = RED;
      ctx.fillRect(W - 18 - PW, ai - PH / 2, PW, PH);
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(bx, by, R, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      const dt = Math.min(2, (now - (last || now)) / 16.67);
      last = now;
      if (keys.up) target -= H * 0.022 * dt;
      if (keys.down) target += H * 0.022 * dt;
      target = Math.max(PH / 2, Math.min(H - PH / 2, target));
      player += (target - player) * 0.35 * dt;

      // The AI tracks the ball with a capped speed, so it can be beaten.
      const aim = vx > 0 ? by : H / 2;
      ai += Math.max(-H * 0.0105 * dt, Math.min(H * 0.0105 * dt, aim - ai));

      bx += vx * dt;
      by += vy * dt;
      if (by < R || by > H - R) {
        vy *= -1;
        by = Math.max(R, Math.min(H - R, by));
      }
      const hit = (py: number, side: 1 | -1) => {
        const offset = (by - py) / (PH / 2);
        const speed = Math.min(W * 0.02, Math.hypot(vx, vy) * 1.06);
        const angle = offset * 0.85;
        vx = Math.cos(angle) * speed * side;
        vy = Math.sin(angle) * speed;
      };
      if (vx < 0 && bx - R < 18 + PW && bx > 18 && Math.abs(by - player) < PH / 2 + R) hit(player, 1);
      if (vx > 0 && bx + R > W - 18 - PW && bx < W - 18 && Math.abs(by - ai) < PH / 2 + R) hit(ai, -1);

      if (bx < -R || bx > W + R) {
        pts = bx < 0 ? [pts[0], pts[1] + 1] : [pts[0] + 1, pts[1]];
        setScore(pts);
        if (pts[0] >= WIN || pts[1] >= WIN) {
          setPhase(pts[0] >= WIN ? "won" : "lost");
          draw();
          raf = 0;
          return;
        }
        serve(bx < 0 ? 1 : -1);
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    api.current.start = () => {
      pts = [0, 0];
      setScore(pts);
      setPhase("playing");
      serve(Math.random() < 0.5 ? 1 : -1);
      last = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target = e.clientY - rect.top;
    };
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keys.up = down;
      else if (k === "arrowdown" || k === "s") keys.down = down;
      else if ((k === " " || k === "enter") && down && !raf) api.current.start();
      else return;
      e.preventDefault();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [size.w, size.h]);

  return (
    <div>
      <Scoreboard
        items={[
          { label: "CARLOS", value: score[0] },
          { label: "CPU", value: score[1] },
        ]}
      />
      <div ref={wrap} className="relative w-full">
        <canvas ref={canvasRef}
          tabIndex={0}
          data-autofocus
          aria-label="Pong" className="mx-auto block touch-none border border-paper/20" />
        {phase !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/70">
            <div className="text-center">
              <p className="text-3xl font-black italic text-paper">
                {phase === "won" ? "YOU WIN" : phase === "lost" ? "GAME OVER" : "PONG"}
                <span className="text-accent">.</span>
              </p>
              <button
                type="button"
                onClick={() => api.current.start()}
                className="mt-4 h-11 bg-accent px-5 text-sm font-semibold text-ink"
              >
                {phase === "ready" ? "PRESS START" : ui.games.restart}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
