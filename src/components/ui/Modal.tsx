"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";
import { Close } from "./icons";

// Native <dialog> modal: focus trap, Esc and inert background come for free.
// It opens on mount; the parent unmounts it from `onClose`.
export function Modal({
  label,
  closeLabel,
  onClose,
  children,
  className = "",
  tone = "default",
}: {
  label: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  tone?: "default" | "ink";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // showModal() focuses the first focusable (the close button); prefer the
    // element the content marks as its starting point, e.g. the terminal input.
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const handleClose = () => close();
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className={`m-auto max-h-[92dvh] w-[min(94vw,980px)] overflow-visible p-0 backdrop:bg-ink/55 backdrop:backdrop-blur-[2px] open:animate-[dialog-in_0.32s_var(--ease-out)] ${
        tone === "ink" ? "bg-ink text-paper" : "bg-bg text-fg"
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => ref.current?.close()}
        aria-label={closeLabel}
        className="absolute -top-3 right-3 z-10 grid size-11 place-items-center border border-fg bg-bg text-fg transition-colors hover:bg-accent sm:-right-3"
      >
        <Close size={20} />
      </button>
      <div className="max-h-[92dvh] overflow-y-auto [scrollbar-gutter:stable]">{children}</div>
    </dialog>
  );
}
