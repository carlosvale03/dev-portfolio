"use client";

import { m } from "motion/react";
import { SECRETS, type SecretId } from "@/content";
import { Modal } from "../ui/Modal";
import { useExperience, type CheatId } from "../shell/ExperienceProvider";

const CHEATS = new Set<SecretId>(["konami", "hesoyam", "aezakmi", "rocketman", "iddqd", "lxgiwyl", "aiwprton", "cpktnwt", "turnuptheheat", "ninjatown"]);

// The "manual" terminal command: every secret, found or not, with how to
// trigger it. Cheats and games can be started straight from the list, which
// is also the way in on phones, where typing codes is awkward.
export default function Manual() {
  const exp = useExperience();
  const { ui } = exp.content;
  const t = ui.secrets.manual;

  const run = (id: SecretId) => {
    exp.setManualOpen(false);
    if (CHEATS.has(id)) exp.runCheat(id as CheatId);
    else if (id === "snake" || id === "pong") exp.openGame(id);
    else if (id === "terminal") exp.setTerminalOpen(true);
  };

  return (
    <Modal label={t.title} closeLabel={ui.close} onClose={() => exp.setManualOpen(false)} className="w-[min(94vw,720px)]">
      <div className="border-b border-line px-6 pb-5 pt-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {ui.footer.secrets} · {exp.found.length}/{exp.total}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] md:text-4xl">
          {t.title}
          <span className="text-accent">.</span>
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t.lead}</p>
      </div>
      <ol className="max-h-[60vh] divide-y divide-line overflow-y-auto">
        {SECRETS.map((id, i) => {
          const found = exp.found.includes(id);
          const runnable = CHEATS.has(id) || id === "snake" || id === "pong" || id === "terminal";
          return (
            <m.li
              key={id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025, duration: 0.3 }}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-6 py-3 md:px-8"
            >
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {ui.secrets.names[id]}
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${found ? "text-[#1f8a4c]" : "text-muted"}`}
                  >
                    {found ? `■ ${t.found}` : `□ ${t.missing}`}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {/* For cheats the name already is the code, so only the description follows it. */}
                  {ui.secrets.how[id] !== ui.secrets.names[id] && (
                    <>
                      <span className="font-mono">{ui.secrets.how[id]}</span>
                      <span aria-hidden="true"> · </span>
                    </>
                  )}
                  {ui.secrets.short[id]}
                </p>
              </div>
              {runnable && (
                <button
                  type="button"
                  onClick={() => run(id)}
                  className="inline-flex h-9 items-center border border-fg px-3 text-xs font-semibold transition-colors hover:bg-fg hover:text-bg"
                >
                  {t.run}
                </button>
              )}
            </m.li>
          );
        })}
      </ol>
    </Modal>
  );
}
