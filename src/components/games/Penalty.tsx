"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang, Ui } from "@/content";
import { AMBER, INK, PAPER, RED, setupCanvas, useCanvasSize } from "./shared";

// "Super Dev Soccer": a penalty shootout unlocked by the Konami code, a nod to
// the classic Konami football games. Five shots against goalkeeper Bug.
const SHOTS = 5;
type Result = "goal" | "save" | "miss";
type Phase = "aim" | "shot" | "over";

const TEXT = {
  pt: { goal: "GOL!", save: "DEFENDEU!", miss: "PRA FORA!", start: "Espaço ou toque para chutar", verdict: ["Bug fechou o gol.", "Dá pra melhorar.", "Bom aproveitamento.", "Craque de pênalti!"] },
  en: { goal: "GOAL!", save: "SAVED!", miss: "MISSED!", start: "Space or tap to shoot", verdict: ["Bug locked the goal.", "Room to improve.", "Solid finishing.", "Penalty master!"] },
};

export function Penalty({ ui, lang }: { ui: Ui; lang: Lang }) {
  const text = TEXT[lang];
  const { wrap, size } = useCanvasSize(16 / 10, 760);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [phase, setPhase] = useState<Phase>("aim");
  const api = useRef({ shoot: () => {}, restart: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const W = size.w;
    const H = size.h;
    const ctx = setupCanvas(canvas, W, H);
    const GW = W * 0.6;
    const GX = (W - GW) / 2;
    const GY = H * 0.17;
    const GH = H * 0.44;
    const GROUND = GY + GH;
    const spot = { x: W / 2, y: H * 0.9 };
    const BR = W * 0.022;
    const crowd = Array.from({ length: 140 }, () => ({
      x: Math.random() * W,
      y: Math.random() * GY * 0.9,
      c: [PAPER, RED, AMBER, "#2b4bff"][Math.floor(Math.random() * 4)],
    }));

    let raf = 0;
    let t = 0;
    let state: "aim" | "flying" | "result" | "over" = "aim";
    let shotStart = 0;
    let target = { x: 0, y: 0 };
    let dive = { x: W / 2, y: 0, side: 0 };
    let outcome: Result = "goal";
    let outcomeAt = 0;
    let list: Result[] = [];

    const reticle = () => ({
      x: W / 2 + Math.sin(t * 2.4) * GW * 0.52,
      y: GY + GH * (0.5 + Math.sin(t * 1.55 + 1) * 0.5),
    });

    const drawKeeper = (x: number, lift: number, lean: number) => {
      ctx.save();
      ctx.translate(x, GROUND - lift);
      ctx.rotate(lean);
      const bw = W * 0.05;
      const bh = GH * 0.5;
      ctx.fillStyle = AMBER;
      ctx.fillRect(-bw / 2, -bh, bw, bh * 0.62);
      ctx.fillStyle = INK;
      ctx.fillRect(-bw / 2, -bh * 0.38, bw, bh * 0.38);
      ctx.fillStyle = "#e8b48a";
      ctx.beginPath();
      ctx.arc(0, -bh - bw * 0.36, bw * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = bw * 0.28;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-bw / 2, -bh * 0.9);
      ctx.lineTo(-bw * 1.25, -bh * 1.18);
      ctx.moveTo(bw / 2, -bh * 0.9);
      ctx.lineTo(bw * 1.25, -bh * 1.18);
      ctx.stroke();
      ctx.fillStyle = PAPER;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * bw * 1.3, -bh * 1.22, bw * 0.24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = INK;
      ctx.font = `800 ${Math.max(9, bw * 0.3)}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("BUG", 0, -bh * 0.66);
      ctx.restore();
    };

    const draw = (now: number) => {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);
      for (const p of crowd) {
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#1f6b3a" : "#237a42";
        ctx.fillRect(0, GROUND + ((H - GROUND) / 8) * i, W, (H - GROUND) / 8 + 1);
      }
      // Net.
      ctx.strokeStyle = "rgba(244,242,236,0.22)";
      ctx.lineWidth = 1;
      for (let x = GX; x <= GX + GW; x += GW / 24) {
        ctx.beginPath();
        ctx.moveTo(x, GY);
        ctx.lineTo(x, GROUND);
        ctx.stroke();
      }
      for (let y = GY; y <= GROUND; y += GH / 12) {
        ctx.beginPath();
        ctx.moveTo(GX, y);
        ctx.lineTo(GX + GW, y);
        ctx.stroke();
      }
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = Math.max(4, W * 0.008);
      ctx.beginPath();
      ctx.moveTo(GX, GROUND);
      ctx.lineTo(GX, GY);
      ctx.lineTo(GX + GW, GY);
      ctx.lineTo(GX + GW, GROUND);
      ctx.stroke();
      ctx.fillStyle = "rgba(244,242,236,0.6)";
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y + BR * 0.6, BR * 1.4, BR * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Keeper: idles side to side, then dives once the shot is taken.
      const idleX = W / 2 + Math.sin(t * 1.3) * GW * 0.08;
      let kx = idleX;
      let lift = 0;
      let lean = 0;
      if (state !== "aim") {
        const k = Math.min(1, (now - shotStart) / 380);
        const e = 1 - Math.pow(1 - k, 3);
        kx = idleX + (dive.x - idleX) * e;
        lift = dive.y * Math.sin(e * Math.PI * 0.5);
        lean = dive.side * 1.05 * e;
      }
      drawKeeper(kx, lift, lean);

      // Ball.
      let bx = spot.x;
      let by = spot.y;
      let br = BR;
      if (state === "flying" || state === "result") {
        const k = Math.min(1, (now - shotStart) / 460);
        const e = 1 - Math.pow(1 - k, 2);
        bx = spot.x + (target.x - spot.x) * e;
        by = spot.y + (target.y - spot.y) * e - Math.sin(e * Math.PI) * H * 0.06;
        br = BR * (1 - 0.45 * e);
        if (k >= 1 && state === "flying") {
          state = "result";
          outcomeAt = now;
          list = [...list, outcome];
          setResults(list);
        }
      }
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(bx, by, br * 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (state === "aim") {
        const r = reticle();
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, W * 0.02, 0, Math.PI * 2);
        ctx.moveTo(r.x - W * 0.035, r.y);
        ctx.lineTo(r.x + W * 0.035, r.y);
        ctx.moveTo(r.x, r.y - W * 0.035);
        ctx.lineTo(r.x, r.y + W * 0.035);
        ctx.stroke();
      }

      if (state === "result") {
        const label = text[outcome];
        ctx.save();
        ctx.translate(W / 2, H * 0.48);
        ctx.rotate(-0.06);
        ctx.font = `900 italic ${Math.min(120, W * 0.14)}px ${getComputedStyle(document.body).fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = INK;
        ctx.fillText(label, 5, 5);
        ctx.fillStyle = outcome === "goal" ? RED : PAPER;
        ctx.fillText(label, 0, 0);
        ctx.restore();
        if (now - outcomeAt > 1300) {
          if (list.length >= SHOTS) {
            state = "over";
            setPhase("over");
          } else {
            state = "aim";
            setPhase("aim");
          }
        }
      }
    };

    const frame = (now: number) => {
      t = now / 1000;
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    api.current.shoot = () => {
      if (state !== "aim") return;
      target = reticle();
      shotStart = performance.now();
      state = "flying";
      setPhase("shot");
      const zone = target.x < W / 2 - GW / 6 ? -1 : target.x > W / 2 + GW / 6 ? 1 : 0;
      const guess = Math.random() < 0.42 ? zone : [-1, 0, 1][Math.floor(Math.random() * 3)];
      const high = target.y < GY + GH * 0.4;
      dive = { x: W / 2 + guess * GW * 0.3, y: high ? GH * 0.22 : 0, side: guess };
      const out = target.x < GX || target.x > GX + GW || target.y < GY;
      const reachY = GROUND - GH * 0.55 - dive.y;
      const dist = Math.hypot(dive.x - target.x, (reachY - target.y) * 0.55);
      outcome = out ? "miss" : dist < GW * 0.17 ? "save" : "goal";
    };

    api.current.restart = () => {
      list = [];
      setResults([]);
      state = "aim";
      setPhase("aim");
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        api.current.shoot();
      }
    };
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [size.w, size.h, text]);

  const goals = results.filter((r) => r === "goal").length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-tabular text-2xl font-black italic tracking-tight text-paper">
          CVL <span className="text-accent">{goals}</span> <span className="text-paper/40">×</span> BUG
        </p>
        <ol className="flex gap-1.5" aria-label={ui.games.score}>
          {Array.from({ length: SHOTS }, (_, i) => (
            <li
              key={i}
              className={`size-3.5 rounded-full border border-paper/40 ${
                results[i] === "goal" ? "bg-accent" : results[i] ? "bg-paper/25" : ""
              }`}
              aria-label={results[i] ?? "—"}
            />
          ))}
        </ol>
      </div>
      <div ref={wrap} className="relative w-full">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          data-autofocus
          aria-label="Super Dev Soccer"
          className="mx-auto block cursor-crosshair touch-none border border-paper/20"
          onPointerDown={() => api.current.shoot()}
        />
        {phase === "aim" && results.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-xs text-paper/80">
            {text.start}
          </p>
        )}
        {phase === "over" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/75">
            <div className="text-center">
              <p className="text-5xl font-black italic text-paper">
                {goals}/{SHOTS}
                <span className="text-accent">.</span>
              </p>
              <p className="mt-2 text-paper/80">{text.verdict[Math.min(3, Math.floor(goals / 1.5))]}</p>
              <button
                type="button"
                onClick={() => api.current.restart()}
                className="mt-4 h-11 bg-accent px-5 text-sm font-semibold text-ink"
              >
                {ui.games.restart}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
