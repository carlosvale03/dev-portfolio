"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SECRETS } from "@/content";
import { fill } from "@/lib/storage";
import { Modal } from "../ui/Modal";
import { useExperience, type CheatId } from "../shell/ExperienceProvider";
import { CHEAT_CODES } from "./SecretKeys";

type LineKind = "in" | "out" | "err" | "accent" | "dim";
interface Line {
  kind: LineKind;
  text: string;
}

const COMMANDS = [
  "help",
  "whoami",
  "sobre",
  "projetos",
  "experiencia",
  "open",
  "pesquisa",
  "stack",
  "contato",
  "cv",
  "modo",
  "lang",
  "snake",
  "pong",
  "penalti",
  "segredos",
  "cheats",
  "manual",
  "github",
  "linkedin",
  "sudo",
  "date",
  "echo",
  "clear",
  "exit",
] as const;

const ALIASES: Record<string, string> = {
  about: "sobre",
  projects: "projetos",
  experience: "experiencia",
  research: "pesquisa",
  contact: "contato",
  mode: "modo",
  penalty: "penalti",
  secrets: "segredos",
  codigos: "manual",
  codes: "manual",
  cheatsheet: "manual",
  ls: "projetos",
  quit: "exit",
  resume: "cv",
};

export default function Terminal() {
  const exp = useExperience();
  const { content, setTerminalOpen } = exp;
  const { ui, profile, projects, publications, stack, experience, lang } = content;
  const pt = lang === "pt";
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => [
    ...ui.terminal.welcome.map((text) => ({ kind: "dim" as const, text })),
  ]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  const t = (ptText: string, enText: string) => (pt ? ptText : enText);

  const run = (raw: string): Line[] | "clear" | "exit" => {
    const [first = "", ...args] = raw.trim().split(/\s+/);
    const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
    const arg = args.join(" ").toLowerCase();
    const out = (...texts: string[]): Line[] => texts.map((text) => ({ kind: "out", text }));

    const cheat = CHEAT_CODES[first.toUpperCase()] as CheatId | undefined;
    if (cheat) {
      exp.runCheat(cheat);
      return [{ kind: "accent", text: `${ui.secrets.cheatActivated}: ${first.toUpperCase()}` }];
    }

    switch (name) {
      case "":
        return [];
      case "help":
        return [
          { kind: "accent", text: t("comandos disponíveis:", "available commands:") },
          ...out(
            `  whoami            ${t("quem é o Carlos", "who Carlos is")}`,
            `  sobre             ${t("um resumo sobre mim", "a short bio")}`,
            `  projetos | ls     ${t("lista os projetos", "list projects")}`,
            `  experiencia       ${t("onde já trabalhei", "where I've worked")}`,
            `  open <id>         ${t("abre um projeto, ex.: open paad", "open a project, e.g. open paad")}`,
            `  pesquisa          ${t("artigos publicados", "published papers")}`,
            `  stack             ${t("ferramentas que uso", "tools I use")}`,
            `  contato | cv      ${t("contatos e currículo", "contacts and résumé")}`,
            `  modo <serio|criativo>, lang <pt|en>`,
            `  snake | pong | penalti   ${t("jogos clássicos", "classic games")}`,
            `  segredos | cheats ${t("sua caça aos segredos", "your secret hunt")}`,
            `  manual            ${ui.secrets.manual.command}`,
            `  clear | exit`,
          ),
        ];
      case "whoami":
        return out(`${profile.fullName}`, profile.role, `${profile.location} · ${profile.status}`);
      case "sobre":
        return out(...profile.about);
      case "projetos":
        return [
          ...projects.map((p) => ({
            kind: "out" as const,
            text: `  ${p.id.padEnd(18)} ${p.title} · ${ui.projects.status[p.status]}`,
          })),
          { kind: "dim", text: t("use open <id> para ver detalhes", "use open <id> to see details") },
        ];
      case "experiencia":
        return experience.flatMap((job) => [
          { kind: "accent" as const, text: `${job.period} · ${job.company}` },
          { kind: "out" as const, text: `    ${job.role}${job.product ? ` · ${job.product}` : ""}` },
        ]);
      case "open": {
        const p = projects.find((x) => x.id === arg || x.title.toLowerCase() === arg);
        if (!p) return [{ kind: "err", text: t(`projeto não encontrado: ${arg || "?"}`, `project not found: ${arg || "?"}`) }];
        setTerminalOpen(false);
        exp.openProject(p.id);
        return [];
      }
      case "pesquisa":
        return publications.flatMap((p, i) => [
          { kind: "accent" as const, text: `[${i + 1}] ${p.year} · ${p.venueShort}` },
          { kind: "out" as const, text: `    ${p.title}` },
          { kind: "dim" as const, text: `    ${p.doi}` },
        ]);
      case "stack":
        return stack.map((g) => ({ kind: "out" as const, text: `  ${g.label.padEnd(22)} ${g.items.join(", ")}` }));
      case "contato":
        return profile.contacts.map((c) => ({ kind: "out" as const, text: `  ${c.label.padEnd(10)} ${c.value}` }));
      case "cv": {
        const a = document.createElement("a");
        a.href = profile.cv;
        a.download = "";
        a.click();
        return out(t("baixando currículo…", "downloading résumé…"));
      }
      case "modo": {
        const target = arg.startsWith("cri") || arg.startsWith("crea") ? "criativo" : arg.startsWith("s") ? "serio" : null;
        if (!target) return [{ kind: "err", text: t("uso: modo serio | modo criativo", "usage: mode serio | mode criativo") }];
        setTerminalOpen(false);
        exp.switchMode(target);
        return [];
      }
      case "lang": {
        if (arg !== "pt" && arg !== "en") return [{ kind: "err", text: "lang pt | lang en" }];
        router.push(`/${arg}${exp.mode === "criativo" ? "?modo=criativo" : ""}`);
        return out("ok");
      }
      case "snake":
      case "pong":
        exp.openGame(name);
        return [];
      case "penalti":
        exp.openGame("penalty");
        return [];
      case "segredos":
        return [
          { kind: "accent", text: `${ui.footer.secrets}: ${exp.found.length}/${SECRETS.length}` },
          ...SECRETS.map((id) => ({
            kind: (exp.found.includes(id) ? "out" : "dim") as LineKind,
            text: `  ${exp.found.includes(id) ? "■" : "□"} ${exp.found.includes(id) ? ui.secrets.names[id] : "???"}`,
          })),
        ];
      case "manual":
        exp.setManualOpen(true);
        return [];
      case "cheats":
        return out(
          t(
            "Dicas, sem spoiler completo:",
            "Hints, without full spoilers:",
          ),
          t(
            "  · Um certo jogo de 2004 em San Andreas tinha códigos para saúde, dinheiro e jetpack.",
            "  · A certain 2004 game set in San Andreas had codes for health, money and a jetpack.",
          ),
          t("  · Um FPS de 1993 tinha um modo deus de cinco letras.", "  · A 1993 FPS had a five-letter god mode."),
          t(
            "  · ↑ ↑ ↓ ↓ ← → ← → B A funciona fora do terminal, e combina com futebol.",
            "  · ↑ ↑ ↓ ↓ ← → ← → B A works outside the terminal, and it goes well with football.",
          ),
          t("  · A escalação do modo criativo também faz gols.", "  · The creative mode lineup scores goals too."),
        );
      case "github":
      case "linkedin": {
        const c = profile.contacts.find((x) => x.id === name)!;
        window.open(c.href, "_blank", "noopener");
        return out(c.href);
      }
      case "sudo":
        return arg.includes("hire")
          ? [
              { kind: "accent", text: t("[sudo] senha para recrutador: ********", "[sudo] password for recruiter: ********") },
              ...out(t("Permissão concedida. Abrindo contato…", "Permission granted. Opening contact…")),
            ]
          : [{ kind: "err", text: t("boa tentativa. tente: sudo hire carlos", "nice try. try: sudo hire carlos") }];
      case "date":
        return out(new Date().toLocaleString(pt ? "pt-BR" : "en-US", { timeZone: "America/Fortaleza" }));
      case "echo":
        return out(args.join(" "));
      case "xyzzy":
        return out(t("Nada acontece. (Colossal Cave mandou lembranças.)", "Nothing happens. (Colossal Cave says hi.)"));
      case "vim":
        return out(t("Você entrou no vim. Boa sorte para sair. (dica: Esc)", "You entered vim. Good luck getting out. (hint: Esc)"));
      case "rm":
        return [{ kind: "err", text: t("permissão negada: este portfólio é protegido por testes.", "permission denied: this portfolio is protected by tests.") }];
      case "clear":
        return "clear";
      case "exit":
        return "exit";
      default:
        return [{ kind: "err", text: fill(ui.terminal.notFound, { cmd: first }) }];
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const raw = value;
    setValue("");
    cursor.current = -1;
    if (raw.trim()) history.current.unshift(raw);
    const result = run(raw);
    if (result === "clear") return setLines([]);
    if (result === "exit") return setTerminalOpen(false);
    setLines((l) => [...l, { kind: "in", text: raw }, ...result]);
    if (raw.trim().toLowerCase().startsWith("sudo hire")) {
      window.setTimeout(() => {
        setTerminalOpen(false);
        document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
      }, 900);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      cursor.current = Math.max(-1, Math.min(history.current.length - 1, cursor.current + dir));
      setValue(cursor.current === -1 ? "" : history.current[cursor.current]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMANDS.find((c) => c.startsWith(value.toLowerCase()) && value.length > 0);
      if (match) setValue(`${match} `);
    }
  };

  const color: Record<LineKind, string> = {
    in: "text-paper",
    out: "text-paper/80",
    err: "text-[#ff6a5e]",
    accent: "text-amber",
    dim: "text-paper/45",
  };

  return (
    <Modal label={ui.terminal.title} closeLabel={ui.close} onClose={() => setTerminalOpen(false)} tone="ink" className="w-[min(94vw,760px)]">
      <div className="flex items-center gap-2 border-b border-paper/15 px-4 py-3">
        <span className="size-3 rounded-full bg-accent" />
        <span className="size-3 rounded-full bg-amber" />
        <span className="size-3 rounded-full bg-paper/30" />
        <span className="ml-3 font-mono text-xs text-paper/60">{ui.terminal.title}</span>
      </div>
      <div
        ref={scroller}
        className="h-[min(60dvh,440px)] overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
        onClick={() => input.current?.focus()}
      >
        <div role="log" aria-live="polite">
          {lines.map((line, i) => (
            <p key={i} className={`whitespace-pre-wrap break-words ${color[line.kind]}`}>
              {line.kind === "in" ? (
                <>
                  <span className="text-accent">❯</span> {line.text}
                </>
              ) : (
                line.text
              )}
            </p>
          ))}
        </div>
        <form onSubmit={submit} className="mt-1 flex items-center gap-2">
          <label htmlFor="terminal-input" className="text-accent">
            ❯<span className="sr-only">{ui.terminal.placeholder}</span>
          </label>
          <input
            id="terminal-input"
            ref={input}
            data-autofocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ui.terminal.placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-paper caret-accent outline-none placeholder:text-paper/35"
          />
        </form>
      </div>
    </Modal>
  );
}
