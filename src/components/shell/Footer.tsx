"use client";

import { SECRETS } from "@/content";
import { Lock, Spark, Terminal } from "../ui/icons";
import { useExperience } from "./ExperienceProvider";

export function Footer() {
  const { content, setTerminalOpen, found, total, reducedMotion, setMotionPref } = useExperience();
  const { ui, profile } = content;

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-10 md:grid-cols-[1fr_auto] md:items-end md:px-8">
        <div>
          <p className="text-[clamp(3rem,9vw,6rem)] font-black leading-none tracking-[-0.05em]">
            CV<span className="text-accent">.</span>
          </p>
          <p className="mt-3 text-sm text-muted">
            © 2026 {profile.fullName}. {ui.footer.rights} {ui.footer.built}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTerminalOpen(true)}
            className="inline-flex h-10 items-center gap-2 border border-line px-3 font-mono text-xs text-muted transition-colors hover:border-fg hover:text-fg"
          >
            <Terminal size={16} />
            <kbd className="border border-line-strong px-1.5 text-fg">/</kbd>
            {ui.footer.terminalHint}
          </button>

          <button
            type="button"
            onClick={() => setMotionPref(reducedMotion ? "on" : "off")}
            aria-pressed={!reducedMotion}
            className="inline-flex h-10 items-center gap-2 border border-line px-3 font-mono text-xs text-muted transition-colors hover:border-fg hover:text-fg"
          >
            <span aria-hidden="true" className={`size-2 rounded-full ${reducedMotion ? "bg-muted" : "bg-accent"}`} />
            {reducedMotion ? ui.motion.off : ui.motion.on}
          </button>

          <button
            type="button"
            popoverTarget="segredos"
            className="inline-flex h-10 items-center gap-2 border border-line px-3 font-mono text-xs text-muted transition-colors hover:border-fg hover:text-fg"
          >
            <Spark size={16} />
            {ui.footer.secrets}
            <span className="font-tabular text-fg">
              {found.length}/{total}
            </span>
          </button>
          <div
            id="segredos"
            popover="auto"
            className="m-auto w-[min(92vw,420px)] border border-fg bg-bg p-0 text-fg shadow-[8px_8px_0_var(--accent)] backdrop:bg-ink/30"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-mono text-xs uppercase tracking-wider">
                {ui.footer.secrets} · {found.length}/{total}
              </p>
              <button type="button" popoverTarget="segredos" popoverTargetAction="hide" className="text-sm underline">
                {ui.close}
              </button>
            </div>
            <ul className="divide-y divide-line">
              {SECRETS.map((id, i) => {
                const unlocked = found.includes(id);
                return (
                  <li key={id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="w-6 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                    {unlocked ? (
                      <span className="font-semibold">{ui.secrets.names[id]}</span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted">
                        <Lock size={14} /> ???
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              {content.lang === "pt"
                ? "Dica: comece pelo terminal e digite cheats. Alguns códigos de jogos clássicos também funcionam fora dele."
                : "Hint: start in the terminal and type cheats. Some classic game codes also work outside it."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
