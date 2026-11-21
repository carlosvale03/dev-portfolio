"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, Download } from "../ui/icons";
import { useExperience } from "./ExperienceProvider";

// Phones only: once the hero scrolls away, a small bar keeps the résumé and the
// contact one tap away. It steps aside while the contact section is on screen
// and whenever an overlay (project, terminal, game) is open.
export function MobileDock() {
  const { content, mode, projectId, terminalOpen, game, manualOpen } = useExperience();
  const [past, setPast] = useState(false);
  const [atContact, setAtContact] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const target = document.getElementById("contato");
    const io = target
      ? new IntersectionObserver(([e]) => setAtContact(e.isIntersecting), { rootMargin: "0px 0px -20% 0px" })
      : null;
    if (target) io!.observe(target);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [mode]);

  const show = mode === "serio" && past && !atContact && !projectId && !terminalOpen && !game && !manualOpen;

  return (
    <AnimatePresence>
      {show && (
        <m.nav
          aria-label={content.ui.nav.contact}
          initial={{ y: "140%" }}
          animate={{ y: 0 }}
          exit={{ y: "140%" }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-[auto_1fr] gap-2 md:hidden"
        >
          <a
            href={content.profile.cv}
            download
            className="inline-flex h-12 items-center gap-2 border-2 border-fg bg-bg px-4 text-sm font-semibold shadow-[4px_4px_0_var(--fg)]"
          >
            <Download size={16} />
            {content.ui.dock.cv}
          </a>
          <a
            href="#contato"
            className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden border-2 border-fg bg-accent px-4 text-sm font-bold text-ink shadow-[4px_4px_0_var(--fg)]"
          >
            {content.ui.dock.talk}
            <ArrowRight size={16} className="animate-[dock-nudge_1.6s_ease-in-out_infinite]" />
          </a>
        </m.nav>
      )}
    </AnimatePresence>
  );
}
