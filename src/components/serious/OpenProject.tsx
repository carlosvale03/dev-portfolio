"use client";

import { ArrowRight } from "../ui/icons";
import { useExperience } from "../shell/ExperienceProvider";

const preloadDialog = () => void import("../shell/ProjectDialog");

// The whole card is clickable through the stretched ::after, while the button
// keeps a real, focusable target for keyboard users.
export function OpenProject({ id, label, title }: { id: string; label: string; title: string }) {
  const { openProject } = useExperience();
  return (
    <button
      type="button"
      onClick={() => openProject(id)}
      onPointerEnter={preloadDialog}
      onFocus={preloadDialog}
      aria-label={`${label}: ${title}`}
      className="mt-3 inline-flex items-center gap-2 self-start text-sm font-semibold after:absolute after:inset-0 after:content-['']"
    >
      <span className="underline decoration-line-strong decoration-2 underline-offset-4 transition-colors group-hover:decoration-accent">
        {label}
      </span>
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </button>
  );
}
