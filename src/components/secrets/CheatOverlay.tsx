"use client";

import { AnimatePresence, animate, m } from "motion/react";
import { useEffect, useRef } from "react";
import { useExperience } from "../shell/ExperienceProvider";

// Visual feedback for the GTA cheats. Decorative only: the toast announces it.
export function CheatOverlay() {
  const { cheat, content } = useExperience();
  return (
    <div aria-hidden="true" className="pointer-events-none fixed right-4 top-20 z-[80] sm:right-8">
      <AnimatePresence>
        {cheat?.id === "hesoyam" && <Money key={cheat.key} currency={content.lang === "pt" ? "R$" : "$"} />}
        {cheat?.id === "aezakmi" && <Wanted key={cheat.key} />}
      </AnimatePresence>
    </div>
  );
}

const moneyFormat = new Intl.NumberFormat("pt-BR");

function Money({ currency }: { currency: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, 250000, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${currency} ${moneyFormat.format(Math.round(v))}`;
      },
    });
    return () => controls.stop();
  }, [currency]);

  return (
    <m.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: [0, 1, 1, 0], y: 0 }}
      transition={{ duration: 3.2, times: [0, 0.08, 0.8, 1] }}
      className="flex flex-col items-end gap-2"
    >
      <span ref={ref} className="font-tabular text-4xl font-black tracking-tight text-[#2fbf5b] [text-shadow:2px_2px_0_#121212] sm:text-5xl">
        {currency} 0
      </span>
      <div className="flex gap-2">
        <Bar label="HP" color="#e23b2e" />
        <Bar label="ARMOR" color="#f4f2ec" />
      </div>
    </m.div>
  );
}

function Bar({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-ink/80 px-2 py-1">
      <span className="font-mono text-[10px] text-paper">{label}</span>
      <div className="h-2 w-20 bg-paper/20">
        <m.div
          className="h-full"
          style={{ background: color }}
          initial={{ width: "15%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function Wanted() {
  return (
    <m.div
      className="flex gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3, times: [0, 0.1, 0.85, 1] }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <m.svg
          key={i}
          viewBox="0 0 24 24"
          className="size-8 sm:size-10"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 1.25, 0.6], opacity: [1, 1, 0.15] }}
          transition={{ duration: 0.5, delay: 0.6 + (5 - i) * 0.22 }}
        >
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            fill="#f3b14e"
            stroke="#121212"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </m.svg>
      ))}
    </m.div>
  );
}
