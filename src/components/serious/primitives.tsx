"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { DrawLine, Scramble, SplitReveal } from "../motion/kit";

export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-[1320px] px-5 md:px-8 ${className}`}>{children}</div>
);

// Fades content up once when it enters the viewport. MotionConfig
// reducedMotion="user" drops the movement for people who ask for less motion.
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </m.div>
  );
}

export function SectionHeader({ n, title, lead }: { n: string; title: string; lead?: string }) {
  return (
    <header>
      <DrawLine className="h-0.5 bg-fg" />
      <div className="grid gap-5 pt-6 md:grid-cols-12 md:gap-8 md:pt-8">
        <p className="font-mono text-xs uppercase tracking-wider text-muted md:col-span-2">
          <Scramble text={`§${n}`} />
        </p>
        <h2
          data-float
          className="text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em] md:col-span-6"
        >
          <SplitReveal text={title} inView />
          <m.span
            className="inline-block text-accent"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.35 }}
          >
            .
          </m.span>
        </h2>
        {lead && (
          <Reveal delay={0.2} className="md:col-span-4 md:self-end">
            <p className="max-w-md text-lg leading-relaxed text-muted">{lead}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
