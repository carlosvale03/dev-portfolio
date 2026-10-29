export const LANGS = ["pt", "en"] as const;
export type Lang = (typeof LANGS)[number];
export type Localized<T = string> = Record<Lang, T>;

export const hasLang = (value: string): value is Lang =>
  (LANGS as readonly string[]).includes(value);

export type ProjectStatus = "live" | "building" | "private" | "discontinued";
export type LinkKind = "code" | "demo" | "design" | "front" | "back" | "site";

export interface ProjectImage {
  src: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  kicker: string;
  year: string;
  status: ProjectStatus;
  featured: boolean;
  image?: ProjectImage;
  summary: string;
  overview: string;
  highlights: { label: string; text: string }[];
  stack: string[];
  links: { kind: LinkKind; href: string }[];
}

export interface Publication {
  id: string;
  year: string;
  title: string;
  venue: string;
  venueShort: string;
  authors: string[];
  summary: string;
  tech: string[];
  doi: string;
  note?: string;
}

export interface StackGroup {
  id: string;
  label: string;
  items: string[];
}

export interface TimelineItem {
  when: string;
  title: string;
  place: string;
}

export interface ContactLink {
  id: "email" | "linkedin" | "github" | "whatsapp";
  label: string;
  value: string;
  href: string;
}

export interface Content {
  lang: Lang;
  profile: {
    name: string;
    fullName: string;
    role: string;
    location: string;
    status: string;
    pitch: string;
    photoAlt: string;
    stats: { value: string; label: string }[];
    about: string[];
    timeline: TimelineItem[];
    contacts: ContactLink[];
    cv: string;
  };
  projects: Project[];
  publications: Publication[];
  stack: StackGroup[];
  ui: Ui;
}

export interface Ui {
  skip: string;
  nav: { about: string; projects: string; research: string; stack: string; contact: string };
  menu: string;
  close: string;
  langSwitch: string;
  mode: {
    toCreative: string;
    toSerious: string;
    creativeName: string;
    seriousName: string;
    hint: string;
  };
  hero: { kicker: string; ctaProjects: string; ctaCv: string; photoCaption: string };
  figure: {
    kicker: string;
    title: string;
    lead: string;
    steps: { label: string; caption: string }[];
    hint: string;
  };
  projects: {
    title: string;
    lead: string;
    details: string;
    status: Record<ProjectStatus, string>;
    links: Record<LinkKind, string>;
    privateNote: string;
    highlights: string;
    featured: string;
    others: string;
    columns: { project: string; stack: string; year: string; status: string };
  };
  research: { title: string; lead: string; authors: string; venue: string; tech: string; read: string; more: string; less: string };
  about: { title: string; timeline: string };
  stack: { title: string; lead: string };
  contact: {
    title: string;
    lead: string;
    form: {
      name: string;
      email: string;
      subject: string;
      message: string;
      send: string;
      sending: string;
      sent: string;
      error: string;
      required: string;
      invalidEmail: string;
    };
  };
  footer: { rights: string; terminalHint: string; secrets: string; built: string };
  motion: { on: string; off: string };
  creative: {
    marquee: string[];
    goal: string; // "{n}" is replaced, singular
    goals: string; // plural
    pause: string;
    play: string;
    scroll: string;
    particlesLabel: string;
    shapes: string[];
    formation: {
      title: string;
      lead: string;
      kickoff: string;
      positions: Record<"gk" | "def" | "mid" | "att" | "coach" | "bench", string>;
      roles: Record<string, string>;
      inProjects: string; // "{n}" is replaced
      noProjects: string;
      pick: string;
    };
    hobbies: {
      title: string;
      lead: string;
      swap: string;
      power: string;
      credit: string;
      cards: Record<"db" | "naruto" | "op", { title: string; caption: string }>;
      games: { title: string; caption: string; cta: string };
      football: { title: string; caption: string; cta: string };
    };
  };
  secrets: {
    unlocked: string;
    cheatActivated: string;
    names: Record<SecretId, string>;
    messages: Partial<Record<SecretId, string>>;
  };
  terminal: { title: string; placeholder: string; welcome: string[]; notFound: string }; // "{cmd}" is replaced
  games: { close: string; score: string; best: string; restart: string; controls: Record<"snake" | "pong" | "penalty", string> };
}

export const SECRETS = [
  "terminal",
  "konami",
  "hesoyam",
  "aezakmi",
  "rocketman",
  "snake",
  "pong",
  "hattrick",
  "iddqd",
] as const;
export type SecretId = (typeof SECRETS)[number];
