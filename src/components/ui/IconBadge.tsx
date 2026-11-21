import type { Icon } from "@phosphor-icons/react";

// Phosphor duotone icons in the site's poster style: ink outline, the duotone
// layer painted red (see .icon-duo in globals.css), inside a box with the same
// offset shadow the buttons use. Parents with the `group` class make it lift
// on hover.
const SIZES = {
  sm: { box: "size-8 shadow-[2px_2px_0_var(--fg)]", icon: 18 },
  md: { box: "size-10 shadow-[3px_3px_0_var(--fg)]", icon: 22 },
  lg: { box: "size-12 shadow-[4px_4px_0_var(--fg)]", icon: 26 },
};

export function IconBadge({
  icon: Glyph,
  size = "md",
  className = "",
}: {
  icon: Icon;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={`icon-duo grid shrink-0 place-items-center border-2 border-fg bg-bg text-fg transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 ${s.box} ${className}`}
    >
      <Glyph size={s.icon} weight="duotone" />
    </span>
  );
}
