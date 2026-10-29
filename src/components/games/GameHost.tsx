"use client";

import { Modal } from "../ui/Modal";
import { useExperience } from "../shell/ExperienceProvider";
import { Snake } from "./Snake";
import { Pong } from "./Pong";
import { Penalty } from "./Penalty";

const TITLES = { snake: "SNAKE", pong: "PONG", penalty: "SUPER DEV SOCCER" } as const;

export default function GameHost() {
  const { game, closeGame, content } = useExperience();
  if (!game) return null;
  const { ui } = content;

  return (
    <Modal label={TITLES[game]} closeLabel={ui.games.close} onClose={closeGame} tone="ink" className="w-[min(96vw,820px)]">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 pr-10">
          <h2 className="text-3xl font-black italic tracking-[-0.04em] text-paper sm:text-4xl">
            {TITLES[game]}
            <span className="text-accent">.</span>
          </h2>
          <p className="font-mono text-xs text-paper/60">{ui.games.controls[game]}</p>
        </div>
        {game === "snake" && <Snake ui={ui} />}
        {game === "pong" && <Pong ui={ui} />}
        {game === "penalty" && <Penalty ui={ui} lang={content.lang} />}
      </div>
    </Modal>
  );
}
