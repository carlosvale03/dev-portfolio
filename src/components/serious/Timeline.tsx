"use client";

import { m, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import type { TimelineItem } from "@/content";

// The rail fills in red as the timeline scrolls through the viewport.
export function Timeline({ items, title }: { items: TimelineItem[]; title: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.5"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{title}</h3>
      <ol ref={ref} className="relative mt-4 border-l-2 border-line">
        <m.span aria-hidden="true" className="absolute -left-0.5 top-0 h-full w-0.5 origin-top bg-accent" style={{ scaleY }} />
        {items.map((t, i) => (
          <m.li
            key={t.title}
            className="relative pb-6 pl-6 last:pb-0"
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <span aria-hidden="true" className="absolute -left-[7px] top-1.5 size-3 border-2 border-bg bg-fg" />
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{t.when}</p>
            <p className="font-semibold leading-snug">{t.title}</p>
            <p className="text-sm text-muted">{t.place}</p>
          </m.li>
        ))}
      </ol>
    </div>
  );
}
