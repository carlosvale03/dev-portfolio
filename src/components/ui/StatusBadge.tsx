import type { ProjectStatus } from "@/content";

const DOT: Record<ProjectStatus, string> = {
  live: "bg-[#1f8a4c]",
  building: "bg-amber",
  private: "bg-royal",
  discontinued: "bg-muted",
};

// Status is carried by the text label; the dot only reinforces it.
export function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-fg">
      <span aria-hidden="true" className={`size-2 rounded-full ${DOT[status]}`} />
      {label}
    </span>
  );
}
