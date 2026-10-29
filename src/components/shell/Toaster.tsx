"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useEffectEvent } from "react";
import { Close } from "../ui/icons";
import { useExperience, type ToastItem } from "./ExperienceProvider";

export function Toaster() {
  const { toasts } = useExperience();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast }: { toast: ToastItem }) {
  const { dismissToast, content } = useExperience();

  const ttl = toast.action ? 14000 : 5200;
  const dismiss = useEffectEvent(() => dismissToast(toast.id));
  useEffect(() => {
    const id = window.setTimeout(dismiss, ttl);
    return () => window.clearTimeout(id);
  }, [ttl]);

  const cheat = toast.kind === "cheat";

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 border px-4 py-3 ${
        cheat
          ? "border-ink bg-ink text-paper shadow-[6px_6px_0_var(--amber)]"
          : "border-fg bg-bg text-fg shadow-[6px_6px_0_var(--accent)]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={
            cheat
              ? "text-xl font-black italic uppercase tracking-tight text-amber"
              : "font-mono text-xs uppercase tracking-wider text-accent-text"
          }
        >
          {toast.title}
        </p>
        {toast.body && <p className={`mt-1 text-sm ${cheat ? "text-paper/85" : "text-fg"}`}>{toast.body}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.run();
              dismissToast(toast.id);
            }}
            className="mt-3 inline-flex h-9 items-center bg-fg px-3 text-sm font-semibold text-bg transition-colors hover:bg-accent hover:text-ink"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label={content.ui.close}
        className="-m-1 grid size-8 shrink-0 place-items-center opacity-70 hover:opacity-100"
      >
        <Close size={16} />
      </button>
    </m.div>
  );
}
