"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePicosTime, useStoredFlag } from "@/lib/external";
import { Close, Menu } from "../ui/icons";
import { loadCreative } from "../creative/load";
import { useExperience } from "./ExperienceProvider";

export function useNavItems() {
  const { content, mode } = useExperience();
  const { ui } = content;
  const creative = mode === "criativo";
  return [
    { id: "projetos", n: "02", label: ui.nav.projects },
    { id: "pesquisa", n: "03", label: ui.nav.research },
    { id: "sobre", n: "04", label: ui.nav.about },
    { id: "stack", n: "05", label: ui.nav.stack },
    ...(creative ? [{ id: "hobbies", n: "06", label: "Hobbies" }] : []),
    { id: "contato", n: creative ? "07" : "06", label: ui.nav.contact },
  ];
}

export function TopBar() {
  const { content, mode } = useExperience();
  const nav = useNavItems();
  const other = content.lang === "pt" ? "en" : "pt";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 md:px-8">
        <a href="#inicio" className="flex items-center gap-3 font-extrabold tracking-tight" aria-label="Carlos Vale">
          <span className="grid size-9 place-items-center bg-fg text-[13px] text-bg">CV</span>
          <span className="hidden whitespace-nowrap text-lg sm:inline">
            Carlos Vale<span className="text-accent">.</span>
          </span>
        </a>

        <nav aria-label="Principal" className="hidden items-center lg:flex">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="group relative whitespace-nowrap px-2.5 py-2 text-sm font-medium xl:px-3"
            >
              <span className="mr-1.5 font-mono text-[11px] text-muted">{item.n}</span>
              {item.label}
              <span className="absolute inset-x-2.5 bottom-1 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Clock />
          <Link
            href={`/${other}${mode === "criativo" ? "?modo=criativo" : ""}`}
            hrefLang={other === "pt" ? "pt-BR" : "en"}
            className="grid h-10 min-w-10 place-items-center px-2 font-mono text-xs font-medium uppercase tracking-wider hover:text-accent-text"
            aria-label={content.ui.langSwitch}
            title={content.ui.langSwitch}
          >
            {other}
          </Link>
          <ModeSwitch />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function Clock() {
  const { profile } = useExperience().content;
  const time = usePicosTime();
  return (
    <p className="hidden items-center gap-2 whitespace-nowrap font-mono text-xs text-muted 2xl:flex">
      <span>{profile.location}</span>
      <span aria-hidden="true">·</span>
      <time className="font-tabular">{time}</time>
      <span aria-hidden="true">·</span>
      <span className="flex items-center gap-1.5 text-fg">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1f8a4c] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#1f8a4c]" />
        </span>
        {profile.status}
      </span>
    </p>
  );
}

export function ModeSwitch({ className = "" }: { className?: string }) {
  const { mode, switchMode, content, cut } = useExperience();
  const [seen, setSeen] = useStoredFlag("cv:mode-seen");
  const on = mode === "criativo";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={!!cut}
      title={content.ui.mode.hint}
      onPointerEnter={() => void loadCreative()}
      onFocus={() => void loadCreative()}
      onClick={() => {
        setSeen(true);
        switchMode();
      }}
      className={`group relative inline-flex h-10 items-center gap-2.5 whitespace-nowrap border border-fg px-3 text-sm font-semibold transition-colors hover:bg-fg hover:text-bg ${className}`}
    >
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full border border-current transition-colors"
      >
        <span
          className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full transition-all duration-300 ease-out ${
            on ? "left-[18px] bg-accent" : "left-[2px] bg-current"
          }`}
        />
      </span>
      <span className="hidden sm:inline">{content.ui.mode.toCreative}</span>
      <span className="sm:hidden">{content.lang === "pt" ? "Criativo" : "Creative"}</span>
      {!seen && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>
      )}
    </button>
  );
}

function MobileMenu() {
  const { content } = useExperience();
  const nav = useNavItems();
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="grid size-10 place-items-center lg:hidden"
        aria-label={content.ui.menu}
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <Menu size={22} />
      </button>
      <dialog
        ref={ref}
        aria-label={content.ui.menu}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-fg backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) ref.current?.close();
        }}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">{content.ui.menu}</span>
          <button
            type="button"
            className="grid size-10 place-items-center"
            aria-label={content.ui.close}
            onClick={() => ref.current?.close()}
          >
            <Close size={22} />
          </button>
        </div>
        <nav aria-label="Principal" className="flex flex-col px-5 py-6">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-baseline gap-4 border-b border-line py-4 text-4xl font-extrabold tracking-tight"
            >
              <span className="font-mono text-xs font-normal text-muted">{item.n}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </dialog>
    </>
  );
}
