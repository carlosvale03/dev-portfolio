import type { Content, ExperienceItem, Lang, Localized, Project, Publication, StackGroup, Ui } from "./types";

// Bilingual source of truth. Every string that changes between languages is a
// { pt, en } pair; `resolve` walks the tree and picks the active language.
type Bi<T> = T extends string
  ? Localized | string
  : T extends (infer U)[]
    ? Bi<U>[]
    : T extends object
      ? { [K in keyof T]: Bi<T[K]> }
      : T;

const isLocalized = (v: unknown): v is Localized =>
  typeof v === "object" && v !== null && "pt" in v && "en" in v && Object.keys(v).length === 2;

function resolve<T>(value: Bi<T>, lang: Lang): T {
  if (isLocalized(value)) return value[lang] as T;
  if (Array.isArray(value)) return value.map((v) => resolve(v, lang)) as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolve(v as Bi<unknown>, lang)]),
    ) as T;
  }
  return value as T;
}

const profile: Bi<Content["profile"]> = {
  name: "Carlos Vale",
  fullName: "Carlos Henrique do Vale e Silva",
  role: {
    pt: "Desenvolvedor Full-Stack e Pesquisador",
    en: "Full-Stack Developer and Researcher",
  },
  location: "Picos, PI",
  status: { pt: "Disponível para vagas", en: "Open to work" },
  pitch: {
    pt: "Construo sistemas web escaláveis e aplico NLP e machine learning a problemas reais, do product discovery ao deploy.",
    en: "I build scalable web systems and apply NLP and machine learning to real problems, from product discovery to deploy.",
  },
  photoAlt: {
    pt: "Retrato de Carlos Vale de camisa preta e gravata azul",
    en: "Portrait of Carlos Vale in a black shirt and blue tie",
  },
  stats: [
    { value: "08", label: { pt: "projetos", en: "projects" } },
    { value: "03", label: { pt: "artigos publicados", en: "published papers" } },
    { value: "MSc", label: { pt: "em andamento, UFPI", en: "in progress, UFPI" } },
  ],
  about: [
    {
      pt: "Sou o Carlos Henrique do Vale e Silva, desenvolvedor movido pela interseção entre engenharia de software e inteligência artificial aplicada. Gosto de pegar problemas complexos e transformá-los em produtos simples de usar.",
      en: "I'm Carlos Henrique do Vale e Silva, a developer driven by the intersection of software engineering and applied artificial intelligence. I like taking complex problems and turning them into products that are simple to use.",
    },
    {
      pt: "Hoje desenvolvo o Gerencia SST e o Valida SST na ISESMT, produtos de Saúde e Segurança do Trabalho em produção. O Valida SST eu comecei como freelancer pela Overzone, e foi ele que me levou à ISESMT. Fora do trabalho, construo produtos próprios como o Azimute e o Carrinho Inteligente. Em paralelo, pesquiso aprendizado de máquina e PLN, com foco em extrair conhecimento de dados ruidosos de redes sociais.",
      en: "Today I build Gerencia SST and Valida SST at ISESMT, occupational health and safety products in production. I started Valida SST as a freelancer through Overzone, and it is what brought me to ISESMT. Outside work, I build my own products, like Azimute and Carrinho Inteligente. In parallel, I research machine learning and NLP, focused on extracting knowledge from noisy social media data.",
    },
    {
      pt: "Essa combinação de rigor acadêmico com ritmo de mercado me deu uma visão crítica de arquitetura e muita vontade de resolver problemas que importam.",
      en: "That mix of academic rigor and industry pace gave me a critical eye for architecture and a real drive to solve problems that matter.",
    },
  ],
  timeline: [
    {
      when: { pt: "Atual", en: "Now" },
      title: { pt: "Mestrado em Ciência da Computação", en: "MSc in Computer Science" },
      place: "UFPI",
    },
    {
      when: { pt: "Atual", en: "Now" },
      title: { pt: "Desenvolvedor Full-Stack", en: "Full-Stack Developer" },
      place: "ISESMT · Gerencia SST e Valida SST",
    },
    {
      when: "2024 — 2026",
      title: { pt: "Pesquisador em PLN e machine learning", en: "NLP and machine learning researcher" },
      place: "BraSNAM · WebMedia · ACM WebSci",
    },
    {
      when: { pt: "Graduação", en: "Undergrad" },
      title: { pt: "Bacharel em Sistemas de Informação", en: "BSc in Information Systems" },
      place: "UFPI",
    },
  ],
  contacts: [
    { id: "email", label: "Email", value: "dovalecarlos03@gmail.com", href: "mailto:dovalecarlos03@gmail.com" },
    { id: "linkedin", label: "LinkedIn", value: "in/carlosvale03", href: "https://www.linkedin.com/in/carlosvale03" },
    { id: "github", label: "GitHub", value: "carlosvale03", href: "https://github.com/carlosvale03" },
    {
      id: "whatsapp",
      label: "WhatsApp",
      value: "+55 89 99473-1880",
      href: "https://wa.me/5589994731880",
    },
  ],
  cv: "/curriculo/curriculo_carlos.pdf",
};

const experience: Bi<ExperienceItem>[] = [
  {
    id: "isesmt",
    role: { pt: "Desenvolvedor Full-Stack", en: "Full-Stack Developer" },
    company: "ISESMT",
    period: { pt: "ago/2026 – atual", en: "Aug 2026 – present" },
    current: true,
    product: "Gerencia SST · Valida SST",
    projectIds: ["gerencia-sst", "valida-sst"],
    bullets: [
      {
        pt: "Desenvolvimento e manutenção do Gerencia SST, um SaaS multi-tenant de Saúde e Segurança do Trabalho em produção.",
        en: "Development and maintenance of Gerencia SST, a multi-tenant Occupational Health and Safety SaaS in production.",
      },
      {
        pt: "Evolução do Valida SST, que comecei como freelancer: créditos por plano com expiração, auditoria e vários registros de CRM/CREA por estado.",
        en: "Evolving Valida SST, which I started as a freelancer: plan-based credits with expiry, auditing and multiple CRM/CREA registrations per state.",
      },
      {
        pt: "Ciclo completo das entregas: levantamento com o cliente, especificação, design técnico, implementação, testes, documentação (Confluence) e deploy.",
        en: "End-to-end delivery: gathering requirements with the client, specification, technical design, implementation, testing, documentation (Confluence) and deploy.",
      },
      {
        pt: "Infraestrutura e entrega: VPS Linux, Kubernetes (k3s), AWS e otimização da esteira de deploy.",
        en: "Infrastructure and delivery: Linux VPS, Kubernetes (k3s), AWS and deploy pipeline optimization.",
      },
      {
        pt: "Segurança: auditorias de segurança, isolamento de dados entre tenants e controle de acesso por permissão.",
        en: "Security: security audits, data isolation between tenants and permission-based access control.",
      },
      {
        pt: "Gestão das demandas no Jira, com estimativas e relatório semanal de entregas.",
        en: "Managing work in Jira, with estimates and a weekly delivery report.",
      },
    ],
  },
  {
    id: "overzone",
    role: { pt: "Desenvolvedor Full-Stack · Freelancer", en: "Full-Stack Developer · Freelance" },
    company: "Overzone",
    period: { pt: "ago/2025 – mar/2026", en: "Aug 2025 – Mar 2026" },
    product: { pt: "Valida SST, para a ISESMT", en: "Valida SST, for ISESMT" },
    projectIds: ["valida-sst"],
    bullets: [
      {
        pt: "Iniciei o Valida SST para a ISESMT: plataforma que recebe laudos de SST, distribui para médicos e engenheiros e coleta a assinatura digital.",
        en: "I started Valida SST for ISESMT: a platform that takes in health and safety reports, assigns them to doctors and engineers and collects their digital signature.",
      },
      {
        pt: "Assinatura digital com certificado A1, armazenamento de arquivos na AWS S3 e cache com Upstash Redis.",
        en: "Digital signatures with A1 certificates, file storage on AWS S3 and caching with Upstash Redis.",
      },
      {
        pt: "Autenticação com Clerk e dados em PostgreSQL com Drizzle ORM.",
        en: "Authentication with Clerk and data in PostgreSQL with Drizzle ORM.",
      },
      {
        pt: "O trabalho no Valida SST me levou à ISESMT, onde sigo com o produto.",
        en: "The work on Valida SST brought me to ISESMT, where I keep building the product.",
      },
    ],
  },
  {
    id: "ingresso-express",
    role: { pt: "Desenvolvedor Front-end", en: "Front-end Developer" },
    company: "Ingresso Express",
    period: { pt: "ago/2023 – dez/2023", en: "Aug 2023 – Dec 2023" },
    projectIds: ["ingresso-express"],
    bullets: [
      {
        pt: "Construção de interfaces e APIs para uma aplicação de compra de cupons de desconto.",
        en: "Built interfaces and APIs for a discount coupon app.",
      },
      {
        pt: "Primeira vivência com métodos ágeis em equipe, com foco em experiência do usuário e boas práticas de código.",
        en: "First hands-on experience with agile teamwork, focused on user experience and good coding practices.",
      },
    ],
  },
  {
    id: "monitoria-bd2",
    role: { pt: "Monitor de Banco de Dados II", en: "Database Systems II Teaching Assistant" },
    company: "UFPI",
    period: { pt: "2023 · 4 meses", en: "2023 · 4 months" },
    bullets: [
      {
        pt: "Apoio aos alunos da disciplina, aprofundando PostgreSQL e otimização de dados.",
        en: "Supported students in the course, deepening PostgreSQL and data optimization.",
      },
    ],
  },
];

const projects: Bi<Project>[] = [
  {
    id: "gerencia-sst",
    title: "Gerencia SST",
    kicker: { pt: "SaaS multi-tenant de Saúde e Segurança do Trabalho", en: "Multi-tenant Occupational Health and Safety SaaS" },
    year: "2026",
    status: "live",
    featured: true,
    image: {
      src: "/img/projetos/gerencia-sst.webp",
      alt: {
        pt: "Tela de Atendimentos da Medicina Ocupacional do Gerencia SST, com um tenant de demonstração",
        en: "Gerencia SST occupational medicine appointments screen, with a demo tenant",
      },
      width: 1600,
      height: 1396,
    },
    summary: {
      pt: "Plataforma SaaS multi-tenant de gestão de Saúde e Segurança do Trabalho para consultorias, empresas e clínicas.",
      en: "A multi-tenant SaaS platform for occupational health and safety management, built for consultancies, companies and clinics.",
    },
    overview: {
      pt: "Plataforma SaaS multi-tenant de gestão de Saúde e Segurança do Trabalho para consultorias, empresas e clínicas. Reúne Medicina Ocupacional, CIPA, gestão de EPI, rede credenciada, financeiro, eSocial, PGR, LTCAT, assinatura digital com certificado A1 (ICP-Brasil), auditoria e geração de documentos e relatórios em PDF.",
      en: "A multi-tenant SaaS platform for occupational health and safety management, built for consultancies, companies and clinics. It brings together occupational medicine, CIPA, PPE management, an accredited network, finance, eSocial, PGR, LTCAT, digital signatures with A1 certificates (ICP-Brasil), auditing and PDF document and report generation.",
    },
    highlights: [
      {
        label: { pt: "Medicina", en: "Medicine" },
        text: { pt: "Atendimentos, sala de espera, agenda, ASO, PCMSO e exames.", en: "Appointments, waiting room, scheduling, ASO, PCMSO and exams." },
      },
      { label: "CIPA e EPI", text: { pt: "Eleição e gestão da CIPA e gestão de EPI.", en: "CIPA elections and management, plus PPE management." } },
      { label: { pt: "Credenciadas", en: "Network" }, text: { pt: "Rede credenciada com portal da credenciada.", en: "Accredited network with a portal for partners." } },
      { label: { pt: "Financeiro", en: "Finance" }, text: { pt: "Financeiro e faturamento.", en: "Finance and billing." } },
      { label: { pt: "Conformidade", en: "Compliance" }, text: { pt: "eSocial, PGR e LTCAT.", en: "eSocial, PGR and LTCAT." } },
      {
        label: { pt: "Documentos", en: "Documents" },
        text: {
          pt: "Assinatura digital com certificado A1 (ICP-Brasil), auditoria e relatórios em PDF.",
          en: "Digital signatures with A1 certificates (ICP-Brasil), auditing and PDF reports.",
        },
      },
    ],
    metrics: [
      { value: { pt: "~3 mil", en: "~3k" }, label: { pt: "commits meus", en: "of my commits" } },
      { value: "160+", label: { pt: "cards entregues", en: "cards delivered" } },
      { value: "~250", label: { pt: "tabelas", en: "tables" } },
      { value: "~50", label: { pt: "módulos", en: "modules" } },
    ],
    stack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind v4",
      "Radix UI",
      "Prisma",
      "PostgreSQL",
      { pt: "pg-boss (filas)", en: "pg-boss (queues)" },
      "Zod",
      "Puppeteer",
      "ExcelJS",
      "node-forge",
      "AWS S3",
      "Docker",
      "Kubernetes (k3s)",
    ],
    links: [{ kind: "site", href: "https://gerenciasst.com.br/" }],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "azimute",
    title: "Azimute",
    kicker: { pt: "Finanças pessoais, antigo Fluxar", en: "Personal finance, formerly Fluxar" },
    year: "2026",
    status: "live",
    featured: true,
    image: {
      src: "/img/projetos/azimute.webp",
      alt: { pt: "Ponte de Comando do Azimute com dados de demonstração", en: "Azimute command dashboard with demo data" },
      width: 1600,
      height: 2302,
    },
    summary: {
      pt: "Controle financeiro pessoal com metáfora de navegação: onde você está, para onde quer ir e quanto saiu do curso.",
      en: "Personal finance tracking built on a navigation metaphor: where you are, where you want to go and how far off course you are.",
    },
    overview: {
      pt: "O Azimute (antigo Fluxar) mostra a Posição (saldo de todas as contas), os Destinos (metas), as Rotas (limites de gasto por categoria) e o Desvio de cada uma, em porcentagem. Tem contas, cartões com faturas e parcelas, importação de extratos OFX e planilhas, divisão do salário e relatórios. Front em Next.js e API em Django REST Framework, ambos meus.",
      en: "Azimute (formerly Fluxar) shows your Position (the balance across all accounts), Destinations (goals), Routes (spending limits per category) and each one's Deviation, as a percentage. It covers accounts, credit cards with invoices and installments, OFX and spreadsheet import, salary splitting and reports. Next.js front-end and Django REST Framework API, both mine.",
    },
    highlights: [
      {
        label: { pt: "Painel", en: "Dashboard" },
        text: { pt: "Posição, fluxo diário, evolução do saldo e alertas de rotas acima do limite.", en: "Position, daily cash flow, balance trend and alerts for routes over their limit." },
      },
      {
        label: { pt: "Cartões", en: "Cards" },
        text: { pt: "Faturas por mês, compras parceladas e pagamento de fatura.", en: "Monthly invoices, installment purchases and invoice payments." },
      },
      {
        label: { pt: "Dados", en: "Data" },
        text: { pt: "Importação de OFX e planilhas, exportação em PDF e XLS.", en: "OFX and spreadsheet import, PDF and XLS export." },
      },
      {
        label: { pt: "Privacidade", en: "Privacy" },
        text: { pt: "Campos sensíveis criptografados, exportação e exclusão de dados (LGPD).", en: "Encrypted sensitive fields, plus data export and deletion (LGPD)." },
      },
    ],
    metrics: [
      { value: "850+", label: { pt: "commits meus", en: "of my commits" } },
      { value: "8", label: { pt: "módulos da API", en: "API modules" } },
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Radix UI", "Recharts", "Django 5", "Django REST", "PostgreSQL", "pandas", "Docker"],
    links: [
      { kind: "front", href: "https://github.com/carlosvale03/fluxar-frontend" },
      { kind: "back", href: "https://github.com/carlosvale03/fluxar-backend" },
    ],
  },
  {
    id: "crimes-monitor",
    title: "Crimes Monitor",
    kicker: { pt: "Inteligência em segurança pública com IA", en: "AI-powered public security intelligence" },
    year: "2025",
    status: "live",
    featured: true,
    image: {
      src: "/img/projetos/crimes-monitor.webp",
      alt: { pt: "Dashboard do Crimes Monitor com gráficos de sentimento", en: "Crimes Monitor dashboard with sentiment charts" },
      width: 1600,
      height: 1300,
    },
    summary: {
      pt: "Plataforma que usa BERT para analisar o sentimento social e detectar operações policiais em comentários do YouTube. Nasceu das minhas pesquisas publicadas.",
      en: "A platform that uses BERT to analyze public sentiment and detect police operations in YouTube comments. It grew out of my published research.",
    },
    overview: {
      pt: "O Crimes Monitor materializa anos de pesquisa acadêmica sobre monitoramento de opinião pública e generalização de modelos de linguagem em cenários de segurança, com base nos artigos da BraSNAM (2024), WebMedia (2025) e ACM WebSci (2026).",
      en: "Crimes Monitor turns years of academic research on public opinion monitoring and language model generalization in security scenarios into a product, based on the BraSNAM (2024), WebMedia (2025) and ACM WebSci (2026) papers.",
    },
    highlights: [
      { label: { pt: "Eventos", en: "Events" }, text: { pt: "Agrupamento que detecta operações policiais em fluxos massivos de dados.", en: "Clustering that detects police operations in massive data streams." } },
      { label: { pt: "Sentimento", en: "Sentiment" }, text: { pt: "Modelos BERT ajustados para o português classificam a aprovação social.", en: "BERT models fine-tuned for Portuguese classify public approval." } },
      { label: { pt: "Tempo", en: "Timeline" }, text: { pt: "Dashboards mostram picos e tendências ao longo das semanas.", en: "Dashboards show spikes and trends over the weeks." } },
      { label: { pt: "Front-end", en: "Front-end" }, text: { pt: "Angular 20 com design system em PrimeNG e Tailwind.", en: "Angular 20 with a PrimeNG and Tailwind design system." } },
    ],
    stack: ["Angular 20", "BERT", "NLP", "Chart.js", "PrimeNG", "Tailwind", "GitHub Actions"],
    links: [
      { kind: "demo", href: "https://c-monanalys.github.io/crimes_monitor/" },
      { kind: "code", href: "https://github.com/C-MonAnalys/crimes_monitor" },
    ],
  },
  {
    id: "paad",
    title: "Site PAAD",
    kicker: { pt: "Portal oficial do Laboratório PAAD", en: "Official PAAD Lab portal" },
    year: "2025",
    status: "live",
    featured: false,
    image: {
      src: "/img/projetos/site-paad-light.webp",
      srcDark: "/img/projetos/site-paad-dark.webp",
      alt: { pt: "Página inicial do portal do Laboratório PAAD", en: "PAAD Lab portal home page" },
      width: 1600,
      height: 1736,
    },
    summary: {
      pt: "MVP completo do Laboratório PAAD: do product discovery e protótipo no Figma até o full-stack com painel administrativo e MFA.",
      en: "Full MVP for the PAAD Lab: from product discovery and a Figma prototype to the full-stack build with an admin panel and MFA.",
    },
    overview: {
      pt: "O portal é o núcleo de divulgação científica do laboratório e integra três pilares: divulgação institucional, gestão de conteúdo e um painel administrativo de alta segurança. Conduzi as reuniões de alinhamento, escrevi o documento de requisitos e desenhei o protótipo de alta fidelidade antes de implementar.",
      en: "The portal is the lab's science outreach hub and combines three pillars: institutional outreach, content management and a high-security admin panel. I ran the alignment meetings, wrote the requirements document and designed the high-fidelity prototype before building it.",
    },
    highlights: [
      { label: "Front-end", text: { pt: "Next.js 16, React 19 e Tailwind CSS v4.", en: "Next.js 16, React 19 and Tailwind CSS v4." } },
      { label: "Back-end", text: { pt: "Node.js 20 com Express 5 em arquitetura escalável.", en: "Node.js 20 with Express 5 in a scalable architecture." } },
      { label: { pt: "Dados", en: "Data" }, text: { pt: "PostgreSQL com Prisma ORM.", en: "PostgreSQL with Prisma ORM." } },
      { label: { pt: "Segurança", en: "Security" }, text: { pt: "JWT e segundo fator (MFA/2FA) com apps autenticadores.", en: "JWT and second factor (MFA/2FA) with authenticator apps." } },
      { label: "Infra", text: { pt: "Ambiente todo containerizado com Docker Compose.", en: "Fully containerized with Docker Compose." } },
    ],
    stack: ["Next.js 16", "React 19", "Tailwind v4", "Prisma", "PostgreSQL", "Express 5", "Docker", "JWT", "MFA"],
    links: [
      { kind: "design", href: "https://www.figma.com/design/w0QxVuTvprO13JugtS0nrm/PAAD---site?node-id=26-915" },
      { kind: "code", href: "https://github.com/carlosvale03/site-paad-production" },
      { kind: "front", href: "https://github.com/LABPAAD/site_paad_frontend" },
      { kind: "back", href: "https://github.com/LABPAAD/site_paad_backend" },
    ],
  },
  {
    id: "valida-sst",
    title: "Valida SST",
    kicker: { pt: "Validação e assinatura digital de laudos de SST", en: "Validation and digital signing of health and safety reports" },
    year: "2025",
    status: "live",
    featured: false,
    image: {
      src: "/img/projetos/valida-sst-dashboard.webp",
      alt: { pt: "Dashboard do Valida SST com dados de demonstração", en: "Valida SST dashboard with demo data" },
      width: 1600,
      height: 1000,
    },
    summary: {
      pt: "Plataforma da ISESMT para laudos de SST: upload do PDF, distribuição para médicos e engenheiros, assinatura digital com certificado A1 e controle de validade.",
      en: "ISESMT's platform for health and safety reports: PDF upload, assignment to doctors and engineers, digital signing with A1 certificates and expiry tracking.",
    },
    overview: {
      pt: "Comecei o Valida SST como freelancer pela Overzone e hoje sigo com ele na ISESMT. A plataforma recebe laudos PGR, PCMSO, LTCAT, LI e LP, distribui cada um para um profissional habilitado (CRM ou CREA), coleta a assinatura PAdES com certificado A1 e acompanha a validade. O consumo é cobrado em créditos, por plano recorrente ou compra avulsa.",
      en: "I started Valida SST as a freelancer through Overzone and keep building it at ISESMT. The platform takes in PGR, PCMSO, LTCAT, LI and LP reports, assigns each one to a licensed professional (CRM or CREA), collects a PAdES signature with an A1 certificate and tracks expiry. Usage is billed in credits, through recurring plans or one-off purchases.",
    },
    highlights: [
      {
        label: { pt: "Fluxo", en: "Workflow" },
        text: { pt: "Upload, atribuição, aprovação ou recusa e acompanhamento de cada laudo.", en: "Upload, assignment, approval or rejection and tracking for every report." },
      },
      {
        label: { pt: "Assinatura", en: "Signatures" },
        text: { pt: "PAdES com certificado A1, com escolha da área de assinatura no PDF.", en: "PAdES with A1 certificates, with a chosen signature area on the PDF." },
      },
      {
        label: { pt: "Créditos", en: "Credits" },
        text: { pt: "Planos recorrentes e avulsos, validade configurável e expiração automática.", en: "Recurring and one-off plans, configurable validity and automatic expiry." },
      },
      {
        label: { pt: "Gestão", en: "Management" },
        text: { pt: "Dashboard, relatórios de laudos e financeiro, auditoria e vários CRM/CREA por estado.", en: "Dashboard, report and finance reports, auditing and multiple CRM/CREA per state." },
      },
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind v4", "Radix UI", "Clerk", "PostgreSQL", "Drizzle", "AWS S3", "Redis", "pdf-lib", "node-forge", "Recharts", "Jest"],
    links: [{ kind: "site", href: "https://validasst.com.br/" }],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "carrinho-inteligente",
    title: "Carrinho Inteligente",
    kicker: { pt: "PWA para compras de supermercado", en: "Grocery shopping PWA" },
    year: "2026",
    status: "private",
    featured: false,
    image: {
      src: "/img/projetos/carrinho-inteligente.webp",
      alt: { pt: "Visão geral do Carrinho Inteligente no tema escuro", en: "Carrinho Inteligente overview in the dark theme" },
      width: 1600,
      height: 1360,
    },
    summary: {
      pt: "App pessoal que registra as idas ao mercado e mostra para onde vai o dinheiro, quais preços subiram e o que comprar no próximo mês.",
      en: "A personal app that logs grocery trips and shows where the money goes, which prices went up and what to buy next month.",
    },
    overview: {
      pt: "Troquei o dashboard do Google Sheets por um app próprio, mantendo a planilha como banco de dados. No celular, a tela Mercado acompanha a compra ao vivo: puxa a lista do planejamento, soma o carrinho, avisa de preço fora do normal e funciona offline durante a ida. No notebook ficam as análises de preço, consumo e gasto por impulso. Feito com desenvolvimento orientado a especificação, do PRD às validações de cada feature.",
      en: "I replaced the Google Sheets dashboard with an app of my own, keeping the spreadsheet as the database. On the phone, the Market screen follows the trip live: it pulls the planned list, totals the cart, flags unusual prices and works offline during the trip. The laptop holds the price, consumption and impulse-spending analysis. Built with spec-driven development, from the PRD to each feature's validation.",
    },
    highlights: [
      {
        label: { pt: "Mercado", en: "Market" },
        text: { pt: "Compra ao vivo no celular, com total, alertas de preço e cadastro em dois toques.", en: "Live shopping on the phone, with a running total, price alerts and two-tap logging." },
      },
      {
        label: { pt: "Análise", en: "Analysis" },
        text: { pt: "Gasto por mês, categoria e mercado, histórico de preços e gasto dispensável.", en: "Spending by month, category and market, price history and impulse spending." },
      },
      {
        label: { pt: "Planejamento", en: "Planning" },
        text: { pt: "Lista do próximo mês sugerida a partir dos últimos três meses.", en: "Next month's list, suggested from the last three months." },
      },
      {
        label: { pt: "Qualidade", en: "Quality" },
        text: { pt: "Vitest e Testing Library, com specs, design e tarefas por feature.", en: "Vitest and Testing Library, with specs, design and tasks for each feature." },
      },
    ],
    metrics: [
      { value: "223", label: { pt: "commits", en: "commits" } },
      { value: "11", label: { pt: "PRs", en: "PRs" } },
      { value: "82", label: { pt: "arquivos de teste", en: "test files" } },
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "Recharts", "SWR", "Zod", "Google Sheets API", "Vitest", "PWA"],
    links: [],
  },
  {
    id: "imogoat",
    title: "ImoGOAT",
    kicker: { pt: "Imóveis e vagas em Picos e região", en: "Homes and rooms in Picos and the region" },
    year: "2026",
    status: "building",
    featured: false,
    image: {
      src: "/img/projetos/imogoat-home.webp",
      alt: { pt: "Home do ImoGOAT com anúncios de demonstração", en: "ImoGOAT home with demo listings" },
      width: 1600,
      height: 3236,
    },
    summary: {
      pt: "Plataforma para anunciar e encontrar imóveis para alugar ou comprar e vagas em casas compartilhadas, com busca por tipo, cidade e bairro.",
      en: "A platform to list and find homes to rent or buy and rooms in shared houses, with search by type, city and neighborhood.",
    },
    overview: {
      pt: "O ImoGOAT resolve lacunas de divulgação e transparência no mercado imobiliário local. Além de imóveis, tem vagas em repúblicas, com tipo de quarto, perfil da casa e preferência de gênero. Cuido do front-end web e da API em equipe, com app mobile em Flutter feito por outro integrante.",
      en: "ImoGOAT closes gaps in listing visibility and transparency in the local real estate market. Besides homes, it lists rooms in shared houses, with room type, house atmosphere and gender preference. I work on the web front-end and the API as part of a team, with a Flutter mobile app built by a teammate.",
    },
    highlights: [
      { label: { pt: "Busca", en: "Search" }, text: { pt: "Imóveis e vagas separados, com filtros por tipo, cidade e bairro.", en: "Homes and rooms kept apart, with filters by type, city and neighborhood." } },
      { label: { pt: "Anúncios", en: "Listings" }, text: { pt: "Cadastro em etapas, com fotos, vídeo e destaque de anúncio.", en: "Step-by-step listing form with photos, video and featured listings." } },
      { label: { pt: "Contato", en: "Contact" }, text: { pt: "Chat em tempo real entre interessado e proprietário, com Socket.io.", en: "Real-time chat between the interested person and the owner, with Socket.io." } },
      { label: { pt: "Conta", en: "Account" }, text: { pt: "Favoritos, avaliações e recuperação de senha por e-mail.", en: "Favorites, reviews and password recovery by email." } },
    ],
    stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind", "Express", "Prisma", "PostgreSQL", "Socket.io", "Zod", "Cloudinary", "Vitest", "Docker"],
    links: [],
  },
  {
    id: "ingresso-express",
    title: "Ingresso Express",
    kicker: { pt: "Estudo de caso de front-end", en: "Front-end case study" },
    year: "2023",
    status: "discontinued",
    featured: false,
    summary: {
      pt: "Interfaces e APIs para uma aplicação de compra de cupons de desconto. Minha primeira vivência com métodos ágeis em equipe.",
      en: "Interfaces and APIs for a discount coupon app. My first hands-on experience with agile teamwork.",
    },
    overview: {
      pt: "Atuei como desenvolvedor front-end, com foco na experiência do usuário e em boas práticas de código.",
      en: "I worked as a front-end developer, focused on user experience and good coding practices.",
    },
    highlights: [],
    stack: ["React", "TypeScript", "Tailwind", "Node.js", "PostgreSQL"],
    links: [],
  },
];

const coauthors = {
  saul: "Saul Sousa da Rocha",
  carlos: "Carlos Henrique do Vale e Silva",
  mateus: "Mateus José da Silva",
  jose: "Jose Rodrigues Torres Neto",
  ferreira: "Carlos H. G. Ferreira",
  glauber: "Glauber Dias Gonçalves",
  jussara: "Jussara Marques de Almeida",
};

const publications: Bi<Publication>[] = [
  {
    id: "websci26",
    year: "2026",
    title:
      "Socio-Technical Constraints and Cross-Platform Model Generalization: Text Classification in Brazilian Public Security",
    venue: "Proceedings of the 18th ACM Web Science Conference (WebSci '26)",
    venueShort: "ACM WebSci",
    authors: [coauthors.saul, coauthors.carlos, coauthors.mateus, coauthors.jose, coauthors.ferreira, coauthors.glauber],
    summary: {
      pt: "Mostra como a arquitetura socio-técnica das plataformas afeta a eficácia da IA em contextos reais. Focando na segurança pública brasileira, revela como o design das interfaces molda a generalização de modelos entre X (Twitter) e YouTube, com uma estratégia de anotação híbrida.",
      en: "Shows how platforms' socio-technical architecture affects AI effectiveness in real contexts. Focusing on Brazilian public security, it reveals how interface design shapes model generalization between X (Twitter) and YouTube, using a hybrid annotation strategy.",
    },
    tech: ["Python", "Stance Detection", "BERTimbau", "LLMs"],
    doi: "https://doi.org/10.1145/3795766.3799777",
    note: { pt: "Alemanha · taxa de aceitação de 32,1%", en: "Germany · 32.1% acceptance rate" },
  },
  {
    id: "webmedia25",
    year: "2025",
    title: "Uso de Características Temporais e Semânticas para Detectar Eventos em Vídeos de Violência Urbana",
    venue: "Proceedings of the 31st Brazilian Symposium on Multimedia and the Web (WebMedia)",
    venueShort: "WebMedia",
    authors: [coauthors.saul, coauthors.carlos, coauthors.mateus, coauthors.jose, coauthors.ferreira, coauthors.glauber],
    summary: {
      pt: "Propõe heurísticas não supervisionadas para agrupar vídeos do YouTube sobre violência urbana, usando características temporais, NER e grafos de similaridade. Supera modelos genéricos como o GPT-4 em agrupamento em larga escala, com acurácia de até 0,90.",
      en: "Proposes unsupervised heuristics to cluster YouTube videos about urban violence using temporal features, NER and similarity graphs. It outperforms generic models like GPT-4 at large-scale clustering, reaching up to 0.90 accuracy.",
    },
    tech: ["Python", "NER", { pt: "Grafos de similaridade", en: "Similarity graphs" }, "GPT-4"],
    doi: "https://doi.org/10.5753/webmedia.2025.16150",
  },
  {
    id: "brasnam24",
    year: "2024",
    title: "Monitorando a Opinião Pública sobre Operações Policiais no Brasil via Comentários de Vídeos no YouTube",
    venue: "Brazilian Workshop on Social Network Analysis and Mining (BraSNAM), SBC",
    venueShort: "BraSNAM",
    authors: [coauthors.saul, coauthors.carlos, coauthors.ferreira, coauthors.glauber, coauthors.jussara],
    summary: {
      pt: "Sistema para monitorar a percepção pública sobre operações policiais no Brasil a partir de comentários do YouTube. Os melhores modelos passam de 87% de acurácia e F1-macro e generalizam bem para o Twitter/X.",
      en: "A system that monitors public perception of police operations in Brazil from YouTube comments. The best models exceed 87% accuracy and macro-F1 and generalize well to Twitter/X.",
    },
    tech: ["Python", "BERT", "BERTimbau", "GPT", "Random Forest", "SVM"],
    doi: "https://doi.org/10.5753/brasnam.2024.3101",
  },
];

const stack: Bi<StackGroup>[] = [
  { id: "web", label: "Web full-stack", items: ["Next.js", "React", "TypeScript", "Angular", "Tailwind", "Radix UI", "Zod"] },
  {
    id: "backend",
    label: { pt: "Back-end e dados", en: "Back-end and data" },
    items: [
      "Node.js",
      "Python",
      "Django",
      "FastAPI",
      "PostgreSQL",
      "Prisma",
      "Drizzle",
      "Redis",
      { pt: "pg-boss (filas)", en: "pg-boss (queues)" },
      "Puppeteer",
      "ExcelJS",
    ],
  },
  {
    id: "infra",
    label: { pt: "Infra e segurança", en: "Infra and security" },
    items: [
      "Docker",
      "Kubernetes (k3s)",
      "AWS",
      "Linux / VPS",
      "GitHub Actions",
      "Multi-tenancy",
      "MFA",
      { pt: "Assinatura digital ICP-Brasil (A1)", en: "ICP-Brasil digital signature (A1)" },
      { pt: "Integração com o eSocial", en: "eSocial integration" },
    ],
  },
  { id: "ai", label: { pt: "IA e pesquisa", en: "AI and research" }, items: ["NLP", "BERT", "Transformers", "LLMs", "scikit-learn", "Chart.js"] },
  {
    id: "product",
    label: { pt: "Produto e processo", en: "Product and process" },
    items: [
      "Figma",
      "UI/UX",
      "Product discovery",
      { pt: "Requisitos", en: "Requirements" },
      "MVP",
      { pt: "Desenvolvimento orientado a especificação", en: "Spec-driven development" },
      { pt: "Testes ponta a ponta", en: "End-to-end testing" },
      "Jira",
      "Confluence",
    ],
  },
];

const ui: Bi<Ui> = {
  skip: { pt: "Pular para o conteúdo", en: "Skip to content" },
  nav: {
    about: { pt: "Sobre", en: "About" },
    experience: { pt: "Experiência", en: "Experience" },
    projects: { pt: "Projetos", en: "Projects" },
    research: { pt: "Pesquisa", en: "Research" },
    stack: "Stack",
    contact: { pt: "Contato", en: "Contact" },
  },
  menu: "Menu",
  close: { pt: "Fechar", en: "Close" },
  langSwitch: { pt: "Read in English", en: "Ler em português" },
  mode: {
    toCreative: { pt: "Modo criativo", en: "Creative mode" },
    toSerious: { pt: "Modo sério", en: "Serious mode" },
    creativeName: { pt: "MODO CRIATIVO", en: "CREATIVE MODE" },
    seriousName: { pt: "MODO SÉRIO", en: "SERIOUS MODE" },
    hint: { pt: "Mesmo conteúdo, outra experiência", en: "Same content, another experience" },
  },
  hero: {
    kicker: { pt: "§01 · Olá, eu sou", en: "§01 · Hi, I'm" },
    ctaProjects: { pt: "Ver projetos", en: "See projects" },
    ctaCv: { pt: "Baixar currículo", en: "Download résumé" },
    photoCaption: { pt: "fig. 0 · Carlos em Picos, PI", en: "fig. 0 · Carlos in Picos, Brazil" },
  },
  figure: {
    kicker: { pt: "fig. 1 · método", en: "fig. 1 · method" },
    title: { pt: "Do dado ao produto", en: "From data to product" },
    lead: {
      pt: "O caminho que repito em pesquisa e em produto, desenhado com partículas. Passe o mouse para bagunçar, clique para explodir.",
      en: "The path I repeat in research and in product, drawn with particles. Hover to stir them, click to burst.",
    },
    steps: [
      { label: { pt: "Dados", en: "Data" }, caption: { pt: "Comentários, vídeos e logs: ruído de verdade.", en: "Comments, videos and logs: real-world noise." } },
      { label: { pt: "Modelo", en: "Model" }, caption: { pt: "BERT, LLMs e heurísticas que extraem sinal.", en: "BERT, LLMs and heuristics that pull out signal." } },
      { label: "Insight", caption: { pt: "Métricas e gráficos que alguém entende.", en: "Metrics and charts someone can read." } },
      { label: { pt: "Código", en: "Code" }, caption: { pt: "APIs, front-end e infraestrutura para escalar.", en: "APIs, front-end and infrastructure to scale." } },
      { label: { pt: "Produto", en: "Product" }, caption: { pt: "Algo no ar, com o meu nome assinando.", en: "Something live, with my name on it." } },
    ],
    hint: { pt: "Escolha uma etapa", en: "Pick a step" },
  },
  projects: {
    title: { pt: "Projetos", en: "Projects" },
    lead: {
      pt: "Produtos que levei do problema ao deploy, entre laboratório, startup e pesquisa.",
      en: "Products I took from problem to deploy, across lab, startup and research work.",
    },
    details: { pt: "Ver detalhes", en: "See details" },
    status: {
      live: { pt: "No ar", en: "Live" },
      building: { pt: "Em desenvolvimento", en: "In progress" },
      private: { pt: "Privado", en: "Private" },
      discontinued: { pt: "Descontinuado", en: "Discontinued" },
    },
    links: {
      code: { pt: "Código", en: "Code" },
      demo: "Demo",
      design: { pt: "Protótipo no Figma", en: "Figma prototype" },
      front: "Front-end",
      back: "Back-end",
      site: "Site",
    },
    privateNote: {
      pt: "Código privado. Posso mostrar numa conversa.",
      en: "Private code. Happy to walk you through it on a call.",
    },
    highlights: { pt: "Destaques", en: "Highlights" },
    featured: { pt: "Casos em destaque", en: "Featured cases" },
    others: { pt: "Outros projetos", en: "More projects" },
    metrics: { pt: "Em números", en: "By the numbers" },
    zoom: { pt: "Ampliar imagem", en: "Expand image" },
    panHint: { pt: "Passe o mouse para rolar a tela", en: "Hover to scroll the screen" },
    columns: {
      project: { pt: "Projeto", en: "Project" },
      stack: "Stack",
      year: { pt: "Ano", en: "Year" },
      status: "Status",
    },
  },
  experience: {
    title: { pt: "Experiência", en: "Experience" },
    lead: {
      pt: "Onde transformo especificação em produto: do SaaS em produção à sala de aula.",
      en: "Where I turn specs into product: from a SaaS in production to the classroom.",
    },
    current: { pt: "Atual", en: "Current" },
    viewProject: { pt: "Ver projeto", en: "See project" },
  },
  research: {
    title: { pt: "Pesquisa", en: "Research" },
    lead: {
      pt: "Artigos revisados por pares sobre NLP, opinião pública e segurança, com o mesmo grupo de pesquisa.",
      en: "Peer-reviewed papers on NLP, public opinion and security, with the same research group.",
    },
    authors: { pt: "Autores", en: "Authors" },
    venue: { pt: "Publicado em", en: "Published in" },
    tech: { pt: "Técnicas", en: "Techniques" },
    read: { pt: "Ler artigo (DOI)", en: "Read paper (DOI)" },
    more: { pt: "Ler resumo", en: "Read abstract" },
    less: { pt: "Recolher resumo", en: "Hide abstract" },
  },
  about: {
    title: { pt: "Sobre", en: "About" },
    timeline: { pt: "Trajetória", en: "Path" },
  },
  stack: {
    title: "Stack",
    lead: {
      pt: "Ferramentas que uso no dia a dia, do protótipo ao modelo em produção.",
      en: "Tools I use day to day, from prototype to model in production.",
    },
  },
  contact: {
    title: { pt: "Vamos conversar?", en: "Let's talk?" },
    lead: {
      pt: "Aberto a vagas, colaborações em pesquisa e projetos. Respondo rápido.",
      en: "Open to jobs, research collaborations and projects. I reply fast.",
    },
    form: {
      name: { pt: "Nome", en: "Name" },
      email: "Email",
      subject: { pt: "Assunto", en: "Subject" },
      message: { pt: "Mensagem", en: "Message" },
      send: { pt: "Enviar mensagem", en: "Send message" },
      sending: { pt: "Enviando…", en: "Sending…" },
      sent: { pt: "Mensagem enviada. Respondo em breve.", en: "Message sent. I'll get back to you soon." },
      error: {
        pt: "Não consegui enviar agora. Tente de novo ou mande um email direto.",
        en: "Couldn't send right now. Try again or email me directly.",
      },
      required: { pt: "Preencha este campo", en: "Fill in this field" },
      invalidEmail: { pt: "Digite um email válido, como nome@empresa.com", en: "Enter a valid email, like name@company.com" },
    },
  },
  footer: {
    rights: { pt: "Todos os direitos reservados.", en: "All rights reserved." },
    terminalHint: { pt: "pressione / para abrir o terminal", en: "press / to open the terminal" },
    secrets: { pt: "segredos", en: "secrets" },
    built: { pt: "Feito com Next.js e muito café", en: "Built with Next.js and lots of coffee" },
  },
  motion: {
    on: { pt: "Animações: ligadas", en: "Animations: on" },
    off: { pt: "Animações: desligadas", en: "Animations: off" },
  },
  creative: {
    marquee: [
      { pt: "CARLOS VALE — FULL-STACK — IA —", en: "CARLOS VALE — FULL-STACK — AI —" },
      "NEXT.JS · PYTHON · NLP · BERT ·",
      { pt: "PESQUISA — PRODUTO — CÓDIGO —", en: "RESEARCH — PRODUCT — CODE —" },
    ],
    goal: { pt: "{n} gol", en: "{n} goal" },
    goals: { pt: "{n} gols", en: "{n} goals" },
    pause: { pt: "Pausar animação", en: "Pause animation" },
    play: { pt: "Retomar animação", en: "Resume animation" },
    scroll: { pt: "role para descer", en: "scroll down" },
    particlesLabel: {
      pt: "Partículas que viram as iniciais CV, uma rede neural, uma bola, um controle, uma esfera de quatro estrelas, uma shuriken e um chapéu de palha",
      en: "Particles turning into the initials CV, a neural network, a ball, a gamepad, a four-star orb, a shuriken and a straw hat",
    },
    shapes: [
      "CV",
      { pt: "Rede neural", en: "Neural net" },
      { pt: "Bola", en: "Ball" },
      { pt: "Controle", en: "Gamepad" },
      { pt: "Esfera", en: "Orb" },
      "Shuriken",
      { pt: "Chapéu de palha", en: "Straw hat" },
    ],
    formation: {
      title: { pt: "A escalação", en: "The lineup" },
      lead: {
        pt: "Minha stack em campo, num 4-3-3. Toque num jogador para ver a função e em quais projetos ele jogou.",
        en: "My stack on the pitch, in a 4-3-3. Tap a player to see their role and which projects they played in.",
      },
      kickoff: { pt: "Dar o pontapé inicial", en: "Kick off" },
      positions: {
        gk: { pt: "Goleiro", en: "Goalkeeper" },
        def: { pt: "Defesa", en: "Defense" },
        mid: { pt: "Meio-campo", en: "Midfield" },
        att: { pt: "Ataque", en: "Attack" },
        coach: { pt: "Técnico", en: "Coach" },
        bench: { pt: "Banco de reservas", en: "Bench" },
      },
      roles: {
        PostgreSQL: { pt: "Paredão. Nenhum dado passa sem consistência.", en: "The wall. No data gets past without consistency." },
        Docker: { pt: "Zagueiro que leva o time inteiro para qualquer estádio.", en: "Center-back who takes the whole team to any stadium." },
        "Node.js": { pt: "Zagueiro rápido, sai jogando pelas APIs.", en: "Quick center-back who plays out through the APIs." },
        Django: { pt: "Lateral clássico: organizado, com tudo no lugar.", en: "Classic full-back: organized, everything in place." },
        Redis: { pt: "Lateral veloz, cobre o campo antes de todo mundo.", en: "Speedy full-back, covers the pitch before anyone." },
        TypeScript: { pt: "Volante que corta os erros antes de virarem gol.", en: "Holding midfielder who cuts errors before they become goals." },
        React: { pt: "Meia que distribui o jogo entre os componentes.", en: "Midfielder who spreads play across components." },
        "Next.js": { pt: "O camisa 10. Arma tudo, do servidor à tela.", en: "The number 10. Builds everything, from server to screen." },
        Python: { pt: "Ponta que resolve qualquer jogada, dos dados ao back-end.", en: "Winger who solves any play, from data to back-end." },
        BERT: { pt: "Centroavante. Lê o sentimento da torcida e finaliza.", en: "Striker. Reads the crowd's sentiment and finishes." },
        LLMs: { pt: "Ponta imprevisível, cria jogadas do nada.", en: "Unpredictable winger, creates plays out of nothing." },
        "Product discovery": { pt: "Define a tática antes de a bola rolar.", en: "Sets the tactics before the ball rolls." },
      },
      inProjects: { pt: "Em campo em {n} projetos ou artigos", en: "On the pitch in {n} projects or papers" },
      noProjects: { pt: "Reserva de luxo: pronto para entrar.", en: "Star sub: ready to come on." },
      pick: { pt: "Escolha um jogador", en: "Pick a player" },
    },
    hobbies: {
      title: { pt: "Fora do código", en: "Off the clock" },
      lead: {
        pt: "O que não entra no modo sério: anime, games antigos e futebol de fim de semana.",
        en: "What doesn't make it into serious mode: anime, old games and weekend football.",
      },
      swap: { pt: "Trocar personagem", en: "Swap character" },
      power: { pt: "Nível de poder", en: "Power level" },
      credit: { pt: "Stickers chibi via GIPHY", en: "Chibi stickers via GIPHY" },
      cards: {
        db: {
          title: "Dragon Ball",
          caption: { pt: "Treinar até o próximo nível, igual deploy que só sai depois de mais um commit.", en: "Training for the next level, like a deploy that ships after one more commit." },
        },
        naruto: {
          title: "Naruto",
          caption: { pt: "Nunca desistir do próprio caminho. E ramen como combustível de madrugada.", en: "Never giving up on your own path. And ramen as late-night fuel." },
        },
        op: {
          title: "One Piece",
          caption: { pt: "Montar a tripulação certa e ir atrás do sonho, por mais longe que esteja.", en: "Building the right crew and chasing the dream, however far it is." },
        },
      },
      games: {
        title: { pt: "Games antigos", en: "Old games" },
        caption: { pt: "Cresci com cartucho e código de trapaça. Alguns estão escondidos por aqui.", en: "I grew up on cartridges and cheat codes. Some are hidden around here." },
        cta: { pt: "Jogar Snake", en: "Play Snake" },
      },
      football: {
        title: { pt: "Futebol", en: "Football" },
        caption: { pt: "Atleta amador nas horas vagas. Dizem que um certo código antigo libera os pênaltis.", en: "Amateur athlete in my spare time. Word is an old code unlocks the penalties." },
        cta: { pt: "Abrir o terminal", en: "Open the terminal" },
      },
    },
  },
  secrets: {
    unlocked: { pt: "Segredo desbloqueado", en: "Secret unlocked" },
    cheatActivated: { pt: "CHEAT ATIVADO", en: "CHEAT ACTIVATED" },
    names: {
      terminal: { pt: "Abriu o terminal", en: "Opened the terminal" },
      konami: { pt: "Código Konami", en: "Konami code" },
      hesoyam: "HESOYAM",
      aezakmi: "AEZAKMI",
      rocketman: "ROCKETMAN",
      snake: { pt: "Jogou Snake", en: "Played Snake" },
      pong: { pt: "Jogou Pong", en: "Played Pong" },
      hattrick: { pt: "Hat-trick na escalação", en: "Lineup hat-trick" },
      iddqd: { pt: "Modo deus", en: "God mode" },
    },
    messages: {
      konami: { pt: "Super Dev Soccer liberado. Hora dos pênaltis.", en: "Super Dev Soccer unlocked. Penalty time." },
      hesoyam: {
        pt: "Saúde 100%, colete 100%, +R$ 250.000 e café recarregado.",
        en: "Health 100%, armor 100%, +$250,000 and coffee refilled.",
      },
      aezakmi: { pt: "Nível de procurado zerado. Os bugs perderam seu rastro.", en: "Wanted level cleared. The bugs lost your trail." },
      rocketman: { pt: "Jetpack equipado. Digite de novo para pousar.", en: "Jetpack equipped. Type it again to land." },
      hattrick: { pt: "Três gols! O goleiro Bug pede substituição.", en: "Three goals! Goalkeeper Bug asks to be subbed." },
      iddqd: { pt: "Modo deus: nenhum deploy de sexta-feira pode te atingir.", en: "God mode: no Friday deploy can hurt you." },
    },
  },
  terminal: {
    title: "carlos@portfolio: ~",
    placeholder: { pt: "digite help e Enter", en: "type help and Enter" },
    welcome: [
      { pt: "Bem-vindo ao terminal do Carlos.", en: "Welcome to Carlos's terminal." },
      { pt: "Digite help para ver os comandos. Esc fecha.", en: "Type help to see the commands. Esc closes." },
    ],
    notFound: { pt: "comando não encontrado: {cmd}. Tente help.", en: "command not found: {cmd}. Try help." },
  },
  games: {
    close: { pt: "Fechar jogo", en: "Close game" },
    score: { pt: "Pontos", en: "Score" },
    best: { pt: "Recorde", en: "Best" },
    restart: { pt: "Jogar de novo", en: "Play again" },
    controls: {
      snake: { pt: "Setas ou WASD para mover · toque nas setas no celular", en: "Arrow keys or WASD to move · tap the arrows on mobile" },
      pong: { pt: "Mouse, toque ou setas ↑ ↓ · primeiro a 5 vence", en: "Mouse, touch or ↑ ↓ keys · first to 5 wins" },
      penalty: { pt: "Espaço ou toque para chutar quando a mira estiver no canto", en: "Space or tap to shoot when the aim is in the corner" },
    },
  },
};

export function getContent(lang: Lang): Content {
  return {
    lang,
    profile: resolve<Content["profile"]>(profile, lang),
    experience: resolve<ExperienceItem[]>(experience, lang),
    projects: resolve<Project[]>(projects, lang),
    publications: resolve<Publication[]>(publications, lang),
    stack: resolve<StackGroup[]>(stack, lang),
    ui: resolve<Ui>(ui, lang),
  };
}
