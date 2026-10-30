"use client";

import { AnimatePresence, animate, m, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useRef } from "react";
import type { Ui } from "@/content";
import { usePicosTime } from "@/lib/external";
import type { Armed, GtaState } from "../../shell/ExperienceProvider";
import { WeaponIcon, type HudIcon, type WeaponId } from "./art";

export interface Ammo {
  clip: number;
  total: number;
}

// San Andreas HUD, top right: weapon slot, clock, armor and health bars,
// money with leading zeros and the six wanted stars.
export function Hud({
  ui,
  gta,
  weapon,
  ammo,
  reloading,
  full,
  onCycle,
  onDisarm,
  onClearWanted,
  onClose,
}: {
  ui: Ui;
  gta: GtaState;
  weapon: WeaponId;
  ammo: Ammo;
  reloading: boolean;
  /** HESOYAM refills both bars. */
  full: boolean;
  onCycle: () => void;
  onDisarm: () => void;
  onClearWanted: () => void;
  onClose: () => void;
}) {
  const time = usePicosTime();
  const icon: HudIcon = gta.armed === "guns" ? weapon : gta.armed === "tank" ? "tank" : gta.armed === "ninja" ? "katana" : "fist";

  return (
    <m.div
      data-gta-ui
      role="group"
      aria-label={ui.gta.hud}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="gta-hud pointer-events-none fixed right-3 top-[76px] z-[85] flex select-none flex-col items-end gap-2 sm:right-6 [&_button]:pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={gta.armed === "guns" ? onCycle : undefined}
          title={gta.armed === "guns" ? `${ui.gta.weapons[weapon]} · ${ui.gta.switchHint}` : undefined}
          aria-label={gta.armed === "guns" ? `${ui.gta.weapons[weapon]}. ${ui.gta.switchHint}` : ui.gta.hud}
          className="relative grid size-[68px] place-items-center rounded-full border-[3px] border-[#111] bg-[radial-gradient(circle_at_35%_30%,#5c5a52,#22211d)] shadow-[0_2px_0_#111]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={icon}
              initial={{ scale: 0.4, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, rotate: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="block w-[50px]"
            >
              <WeaponIcon id={icon} />
            </m.span>
          </AnimatePresence>
          {gta.armed === "guns" && (
            <span className="gta-outline absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-tabular text-[13px] font-black text-[#e8e4d8]">
              {reloading ? "· · ·" : `${ammo.total}-${ammo.clip}`}
            </span>
          )}
        </button>

        <div className="flex flex-col items-end gap-1">
          <span className="gta-outline font-tabular text-[26px] font-black leading-none text-[#e8e4d8]">{time}</span>
          <Bar color="#d9d6cc" value={full ? 1 : 0} />
          <Bar color="#b4191d" value={full ? 1 : 0.72} />
        </div>
      </div>

      <Money value={gta.money} />
      <Stars wanted={gta.wanted} label={ui.gta.clearWanted} onClear={onClearWanted} />

      <div className="flex items-center gap-1.5">
        {gta.armed && (
          <button
            type="button"
            onClick={onDisarm}
            className="inline-flex h-7 items-center gap-1.5 border-2 border-[#111] bg-[#e8e4d8] px-2 font-mono text-[11px] font-bold uppercase text-[#111] hover:bg-[#d9a630]"
          >
            {ui.gta.chips[gta.armed as Exclude<Armed, null>]} <span aria-hidden="true">×</span>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.gta.hide}
          title={ui.gta.hide}
          className="grid size-7 place-items-center border-2 border-[#111] bg-[#111] font-mono text-xs font-bold text-[#e8e4d8] hover:bg-[#b4191d]"
        >
          ×
        </button>
      </div>
    </m.div>
  );
}

function Bar({ color, value }: { color: string; value: number }) {
  return (
    <span className="block h-[11px] w-[104px] border-2 border-[#111] bg-[#111]/60">
      <m.span
        className="block h-full"
        style={{ background: color }}
        initial={false}
        animate={{ width: `${Math.max(0.04, value) * 100}%` }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  );
}

function Money({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useMotionValue(0);
  useMotionValueEvent(shown, "change", (v) => {
    if (ref.current) ref.current.textContent = `$${String(Math.round(v)).padStart(8, "0")}`;
  });
  useEffect(() => {
    const controls = animate(shown, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [shown, value]);

  return (
    <span ref={ref} className="gta-outline font-tabular text-[30px] font-black leading-none tracking-tight text-[#3fa34d]">
      $00000000
    </span>
  );
}

function Stars({ wanted, label, onClear }: { wanted: number; label: string; onClear: () => void }) {
  return (
    <button type="button" onClick={wanted ? onClear : undefined} title={wanted ? label : undefined} aria-label={`${wanted}/6. ${label}`} className="flex gap-0.5">
      {Array.from({ length: 6 }, (_, i) => {
        const on = i < wanted;
        return (
          <m.svg
            key={i}
            viewBox="0 0 24 24"
            className="size-[26px]"
            initial={false}
            // New stars blink for a moment, like the game does.
            animate={on ? { opacity: [1, 0.15, 1, 0.15, 1, 0.15, 1], scale: [1.35, 1] } : { opacity: 0.8, scale: 1 }}
            transition={on ? { duration: 1.6, scale: { type: "spring", stiffness: 500, damping: 14 } } : { duration: 0.3 }}
            aria-hidden="true"
          >
            <path
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
              fill={on ? "#d9a630" : "rgba(17,17,17,0.45)"}
              stroke={on ? "#111" : "rgba(232,228,216,0.4)"}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </m.svg>
        );
      })}
    </button>
  );
}
