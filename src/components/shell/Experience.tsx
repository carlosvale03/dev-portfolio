"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { Content } from "@/content";
import { ExperienceProvider, useExperience } from "./ExperienceProvider";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { CutTransition } from "./CutTransition";
import { Toaster } from "./Toaster";
import { SecretKeys } from "../secrets/SecretKeys";
import { CheatOverlay } from "../secrets/CheatOverlay";
import { loadCreative } from "../creative/load";
import { Cursor } from "../motion/kit";

const CreativeMain = dynamic(loadCreative, {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-bg" />,
});
const Terminal = dynamic(() => import("../secrets/Terminal"), { ssr: false });
const GameHost = dynamic(() => import("../games/GameHost"), { ssr: false });
const ProjectDialog = dynamic(() => import("./ProjectDialog"), { ssr: false });

export function Experience({ content, children }: { content: Content; children: ReactNode }) {
  return (
    <ExperienceProvider content={content}>
      <LazyMotion features={domAnimation} strict>
        <MotionRoot>
        <a
          href="#conteudo"
          className="fixed left-4 top-3 z-[60] -translate-y-20 bg-fg px-4 py-2 text-sm font-semibold text-bg transition-transform focus:translate-y-0"
        >
          {content.ui.skip}
        </a>
        <TopBar />
        <Stage serious={children} />
        <Footer />
        <Overlays />
        <CutTransition />
        <CheatOverlay />
        <Toaster />
        <SecretKeys />
        <Cursor />
        </MotionRoot>
      </LazyMotion>
    </ExperienceProvider>
  );
}

function MotionRoot({ children }: { children: ReactNode }) {
  const { reducedMotion } = useExperience();
  return <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>{children}</MotionConfig>;
}

function Stage({ serious }: { serious: ReactNode }) {
  const { mode, content } = useExperience();
  return (
    <main id="conteudo" tabIndex={-1} className="outline-none">
      {mode === "criativo" ? <CreativeMain content={content} /> : serious}
    </main>
  );
}

function Overlays() {
  const { terminalOpen, game, projectId } = useExperience();
  return (
    <>
      {terminalOpen && <Terminal />}
      {game && <GameHost />}
      {projectId && <ProjectDialog />}
    </>
  );
}
