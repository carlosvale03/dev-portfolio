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
    pt: "Construo e coordeno sistemas web em produção e aplico NLP e machine learning a problemas reais, do product discovery ao deploy.",
    en: "I build and coordinate web systems in production and apply NLP and machine learning to real problems, from product discovery to deploy.",
  },
  photoAlt: {
    pt: "Retrato de Carlos Vale de camisa preta e gravata azul",
    en: "Portrait of Carlos Vale in a black shirt and blue tie",
  },
  stats: [
    { value: "10+", label: { pt: "sistemas em produção", en: "systems in production" } },
    { value: "03", label: { pt: "artigos publicados", en: "published papers" } },
    { value: "MSc", label: { pt: "em andamento, UFPI", en: "in progress, UFPI" } },
  ],
  about: [
    {
      pt: "Sou o Carlos Henrique do Vale e Silva, desenvolvedor full-stack de Picos, no Piauí. Gosto de pegar problemas complexos e transformá-los em produtos simples de usar.",
      en: "I'm Carlos Henrique do Vale e Silva, a full-stack developer from Picos, in Piauí, Brazil. I like taking complex problems and turning them into products that are simple to use.",
    },
    {
      pt: "Na ISESMT, desenvolvo o Gerencia SST e o Valida SST, refiz o sistema de pagamentos da empresa, o ISESMT Checkout, e conduzo a parte técnica dos outros sistemas: combino prioridades com os donos, reviso o código do time e cuido para que o que vai ao ar seja seguro.",
      en: "At ISESMT, I build Gerencia SST and Valida SST, rebuilt the company's payment system, ISESMT Checkout, and lead the technical side of the other systems: I agree on priorities with the owners, review the team's code and make sure what ships is secure.",
    },
    {
      pt: "A pesquisa corre em paralelo: foram três anos de iniciação científica na UFPI treinando modelos BERT sobre comentários de redes sociais, que viraram três artigos, o mais recente na ACM Web Science, na Alemanha. Hoje sigo no mestrado em Ciência da Computação e, como bolsista de PD&I da RNP, construo uma ferramenta de coleta e curadoria de dados científicos.",
      en: "Research runs in parallel: three years of undergraduate research at UFPI training BERT models on social media comments, which became three papers, the latest at ACM Web Science, in Germany. Today I'm doing a master's in Computer Science and, as an RNP R&D fellow, I build a tool to collect and curate scientific data.",
    },
    {
      pt: "Meu jeito de trabalhar: especificação antes do código, testes automatizados, revisão em todo PR e IA como ferramenta do dia a dia. Fora do trabalho, construo produtos próprios, como o Azimute e o Carrinho Inteligente.",
      en: "How I work: spec before code, automated tests, review on every PR and AI as an everyday tool. Outside work, I build my own products, like Azimute and Carrinho Inteligente.",
    },
  ],
  timeline: [
    {
      when: { pt: "ago/2026 – atual", en: "Aug 2026 – present" },
      title: { pt: "Desenvolvedor Full-Stack", en: "Full-Stack Developer" },
      place: "ISESMT",
      kind: "work",
    },
    {
      when: { pt: "ago/2026 – atual", en: "Aug 2026 – present" },
      title: { pt: "Bolsista de PD&I", en: "R&D fellow" },
      place: { pt: "RNP · Panorama de Comunidades Acadêmicas em Cibersegurança", en: "RNP · Panorama of Academic Communities in Cybersecurity" },
      kind: "research",
    },
    {
      when: { pt: "mar/2026 – atual", en: "Mar 2026 – present" },
      title: { pt: "Mestrado em Ciência da Computação", en: "MSc in Computer Science" },
      place: "UFPI",
      kind: "study",
    },
    {
      when: { pt: "2022 – jul/2026", en: "2022 – Jul 2026" },
      title: { pt: "Desenvolvedor e pesquisador em PLN", en: "NLP developer and researcher" },
      place: "UFPI (PAAD · BraSNAM · WebMedia · ACM WebSci)",
      kind: "research",
    },
    {
      when: { pt: "ago/2021 – dez/2025", en: "Aug 2021 – Dec 2025" },
      title: { pt: "Bacharel em Sistemas de Informação", en: "BSc in Information Systems" },
      place: "UFPI",
      kind: "study",
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
    product: "Gerencia SST · Valida SST · ISESMT Checkout",
    projectIds: ["gerencia-sst", "isesmt-checkout", "valida-sst"],
    bullets: [
      {
        pt: "Mais de 500 cards entregues e mais de 650 PRs meus integrados, a maior parte no Gerencia SST, SaaS multi-tenant de Saúde e Segurança do Trabalho em produção, onde passo de 3,5 mil commits.",
        en: "More than 500 cards delivered and more than 650 of my PRs merged, most of them in Gerencia SST, a multi-tenant Occupational Health and Safety SaaS in production, where I have over 3,500 commits.",
      },
      {
        pt: "ISESMT Checkout: refiz em Next.js o sistema de pagamentos com Pagar.me (cartão, PIX, boleto e assinaturas), com mais de 500 commits e mais de 60 cards entregues.",
        en: "ISESMT Checkout: rebuilt the Pagar.me payment system in Next.js (card, PIX, boleto and subscriptions), with more than 500 commits and more than 60 cards delivered.",
      },
      {
        pt: "Liderança técnica dos sistemas da empresa, do Gerencia ao Avalia NR-01 e NR-17, Treinamentos, Localiza SST e ISESMT Cloud: prioridade e distribuição do trabalho, decisões com os donos, mais de 900 cards escritos e mais de 350 PRs de colegas revisados.",
        en: "Technical leadership of the company's systems, from Gerencia to Avalia NR-01 and NR-17, Training, Localiza SST and ISESMT Cloud: prioritizing and distributing work, decisions with the owners, more than 900 cards written and more than 350 teammates' PRs reviewed.",
      },
      {
        pt: "Segurança do Gerencia: corrigi mais de 30 falhas apontadas numa auditoria, de isolamento entre tenants e permissão por módulo a sessões, uploads e geração de PDF.",
        en: "Gerencia security: fixed more than 30 issues found in an audit, from tenant isolation and per-module permissions to sessions, uploads and PDF generation.",
      },
      {
        pt: "Valida SST: mais de 180 commits, com créditos por plano com expiração, auditoria e vários registros de CRM/CREA por estado.",
        en: "Valida SST: more than 180 commits, with plan-based credits with expiry, auditing and multiple CRM/CREA registrations per state.",
      },
      {
        pt: "Processo e infraestrutura: regra de prioridade, prazo e tamanho dos cards, painel de planejamento com dados do Jira, onboarding de devs novos e deploy em AWS, VPS Linux e Kubernetes (k3s).",
        en: "Process and infrastructure: rules for card priority, deadlines and size, a planning dashboard with Jira data, onboarding for new devs and deploys on AWS, Linux VPS and Kubernetes (k3s).",
      },
    ],
  },
  {
    id: "rnp",
    role: { pt: "Bolsista de Pesquisa, Desenvolvimento e Inovação", en: "Research, Development and Innovation Fellow" },
    company: "RNP",
    period: { pt: "ago/2026 – atual", en: "Aug 2026 – present" },
    current: true,
    product: { pt: "Panorama de Comunidades Acadêmicas em Cibersegurança", en: "Panorama of Academic Communities in Cybersecurity" },
    projectIds: ["coleta-studio"],
    bullets: [
      {
        pt: "Desenvolvo, em Python e Django, a ferramenta que coleta registros de quatro bases (CAPES, OpenAlex, SBC OpenLib e INPI), padroniza tudo em CSV e faz a curadoria com um LLM local (Ollama), registrando o motivo de cada decisão.",
        en: "I build, in Python and Django, the tool that collects records from four sources (CAPES, OpenAlex, SBC OpenLib and INPI), standardizes them as CSV and curates them with a local LLM (Ollama), recording the reason for each decision.",
      },
      {
        pt: "Coletas em segundo plano com fila de tarefas, progresso em tempo real e retomada a partir de checkpoints; tratei falhas reais de dados, como CSV lido com o separador errado e o limite de paginação da API do OpenAlex.",
        en: "Background collections with a task queue, live progress and checkpoint-based resume; I handled real data issues, such as CSV files read with the wrong separator and the OpenAlex API pagination limit.",
      },
    ],
  },
  {
    id: "ufpi",
    role: { pt: "Desenvolvedor e Pesquisador", en: "Developer and Researcher" },
    company: "UFPI",
    period: { pt: "set/2022 – jul/2026", en: "Sep 2022 – Jul 2026" },
    projectIds: ["paad", "crimes-monitor"],
    bullets: [
      {
        pt: "Desenvolvi o portal do Laboratório PAAD, do product discovery e protótipo no Figma ao full-stack com Next.js, Express, Prisma, PostgreSQL e autenticação com JWT e MFA, em Docker.",
        en: "Built the PAAD Lab portal, from product discovery and a Figma prototype to the full-stack build with Next.js, Express, Prisma, PostgreSQL and JWT and MFA authentication, in Docker.",
      },
      {
        pt: "Construí o Crimes Monitor (Angular 20, Chart.js), que aplica modelos BERT a comentários do YouTube e já analisou mais de 1 milhão de opiniões (2019–2024); na pesquisa, os modelos passaram de 87% de acurácia e as heurísticas de agrupamento chegaram a 0,90, superando o GPT-4.",
        en: "Built Crimes Monitor (Angular 20, Chart.js), which applies BERT models to YouTube comments and has analyzed more than 1 million opinions (2019–2024); in the research, the models went above 87% accuracy and the clustering heuristics reached 0.90, outperforming GPT-4.",
      },
      {
        pt: "Monitor de Banco de Dados II (2023, 4 meses): apoio aos alunos nas dúvidas e atividades práticas da disciplina, com SQL, PostgreSQL e otimização de consultas.",
        en: "Database Systems II teaching assistant (2023, 4 months): helped students with questions and hands-on work in the course, covering SQL, PostgreSQL and query optimization.",
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
        pt: "Fiz parte do time que construiu o Valida SST para a ISESMT, plataforma que recebe laudos de SST, distribui para médicos e engenheiros e coleta a assinatura digital, e desenvolvi boa parte do núcleo.",
        en: "I was part of the team that built Valida SST for ISESMT, a platform that takes in health and safety reports, assigns them to doctors and engineers and collects their digital signature, and I built much of its core.",
      },
      {
        pt: "Cadastro de empresas com validação e consulta do CNPJ na Receita, envio e atribuição automática ou manual dos documentos, com versões e histórico.",
        en: "Company records with CNPJ validation and lookup at the Federal Revenue Service, plus document upload and automatic or manual assignment, with versions and history.",
      },
      {
        pt: "Gestão dos certificados digitais A1 e assinatura PAdES com selo e validações, além de auditoria com prazo de retenção e notificações.",
        en: "A1 digital certificate management and PAdES signing with a seal and validations, plus auditing with retention periods and notifications.",
      },
      {
        pt: "Next.js, PostgreSQL com Drizzle, Clerk, AWS S3 e Redis. O trabalho me levou à ISESMT, onde sigo com o produto.",
        en: "Next.js, PostgreSQL with Drizzle, Clerk, AWS S3 and Redis. The work brought me to ISESMT, where I keep building the product.",
      },
    ],
  },
  {
    id: "ingresso-express",
    role: { pt: "Desenvolvedor Front-end", en: "Front-end Developer" },
    company: "Weber Technologies",
    period: { pt: "ago/2023 – dez/2023", en: "Aug 2023 – Dec 2023" },
    product: "Ingresso Express",
    bullets: [
      {
        pt: "Interfaces e APIs para o Ingresso Express, app de cupons de desconto, com React, TypeScript, Node.js e PostgreSQL.",
        en: "Interfaces and APIs for Ingresso Express, a discount coupon app, with React, TypeScript, Node.js and PostgreSQL.",
      },
      {
        pt: "Time ágil com Git, Gitflow e revisão de código.",
        en: "Agile team with Git, Gitflow and code review.",
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
      pt: "Plataforma SaaS multi-tenant de gestão de Saúde e Segurança do Trabalho para consultorias, empresas e clínicas. Reúne Medicina Ocupacional, CIPA, gestão de EPI, rede credenciada, financeiro, eSocial, PGR, LTCAT, assinatura digital com certificado A1 (ICP-Brasil), auditoria e geração de documentos e relatórios em PDF. Na segurança, fechei as falhas de uma auditoria completa, do isolamento entre tenants à permissão por módulo.",
      en: "A multi-tenant SaaS platform for occupational health and safety management, built for consultancies, companies and clinics. It brings together occupational medicine, CIPA, PPE management, an accredited network, finance, eSocial, PGR, LTCAT, digital signatures with A1 certificates (ICP-Brasil), auditing and PDF document and report generation. On security, I closed the issues from a full audit, from tenant isolation to per-module permissions.",
    },
    highlights: [
      {
        label: { pt: "Medicina", en: "Medicine" },
        text: { pt: "Atendimentos, sala de espera, agenda, ASO, PCMSO e exames.", en: "Appointments, waiting room, scheduling, ASO, PCMSO and exams." },
      },
      { label: "CIPA e EPI", text: { pt: "Eleição e gestão da CIPA e gestão de EPI.", en: "CIPA elections and management, plus PPE management." } },
      {
        label: { pt: "Segurança", en: "Security" },
        text: {
          pt: "Mais de 30 falhas de uma auditoria corrigidas: isolamento entre tenants, permissão por módulo e sessões.",
          en: "More than 30 issues from an audit fixed: tenant isolation, per-module permissions and sessions.",
        },
      },
      { label: { pt: "Credenciadas", en: "Network" }, text: { pt: "Rede credenciada com portal da credenciada.", en: "Accredited network with a portal for partners." } },
      { label: { pt: "Financeiro", en: "Finance" }, text: { pt: "Contas a pagar e a receber, faturamento e relatórios em PDF e Excel, integrado ao Conta Azul.", en: "Payables and receivables, billing and PDF and Excel reports, integrated with Conta Azul." } },
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
      { value: { pt: "3,5 mil+", en: "3.5k+" }, label: { pt: "commits meus", en: "of my commits" } },
      { value: "400+", label: { pt: "cards entregues", en: "cards delivered" } },
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
    id: "isesmt-checkout",
    title: "ISESMT Checkout",
    kicker: {
      pt: "Pagamentos com Pagar.me: checkout, assinaturas e painel de vendas",
      en: "Payments with Pagar.me: checkout, subscriptions and a sales dashboard",
    },
    year: "2026",
    status: "live",
    featured: false,
    image: {
      src: "/img/projetos/isesmt-checkout.webp",
      alt: {
        pt: "Página de pagamento do ISESMT Checkout para o plano mensal do Localiza SST, com cartão, PIX e boleto",
        en: "ISESMT Checkout payment page for the Localiza SST monthly plan, with card, PIX and boleto",
      },
      width: 1600,
      height: 2440,
    },
    summary: {
      pt: "O sistema de pagamentos da ISESMT: checkout transparente com cartão, PIX e boleto, assinaturas e painel de vendas, integrado ao Pagar.me. Refiz o sistema antigo, em Node puro, em Next.js e Prisma.",
      en: "ISESMT's payment system: an embedded checkout with card, PIX and boleto, subscriptions and a sales dashboard, integrated with Pagar.me. I rebuilt the old plain-Node system in Next.js and Prisma.",
    },
    overview: {
      pt: "É por onde a ISESMT vende o Gerencia, o Valida, o Localiza e os treinamentos. Migrei o sistema original (Node puro, com os dados num arquivo JSON) para Next.js, Prisma e PostgreSQL, mantendo telas, regras e endereços, e organizei com o time a revisão dos PRs pendentes. Hoje atende várias lojas, cada uma com a própria chave do Pagar.me guardada cifrada, e tem API pública com chaves e escopos, webhooks assinados com reenvio automático, coprodução com divisão do pagamento e um app Android de vendas.",
      en: "It is where ISESMT sells Gerencia, Valida, Localiza and its training courses. I migrated the original system (plain Node, with data in a JSON file) to Next.js, Prisma and PostgreSQL, keeping screens, rules and URLs, and reorganized the review of pending PRs with the team. It now serves several stores, each with its own encrypted Pagar.me key, and has a public API with scoped keys, signed webhooks with automatic retries, co-production with payment splits and an Android sales app.",
    },
    highlights: [
      {
        label: { pt: "Pagamento", en: "Payment" },
        text: { pt: "Cartão (até três), PIX e boleto, com parcelamento, cupons e ofertas extras.", en: "Card (up to three), PIX and boleto, with installments, coupons and add-on offers." },
      },
      {
        label: { pt: "Assinaturas", en: "Subscriptions" },
        text: { pt: "Renovação automática, nova cobrança de PIX antes do vencimento, MRR, churn e LTV.", en: "Automatic renewal, a new PIX charge before the due date, MRR, churn and LTV." },
      },
      {
        label: { pt: "Integrações", en: "Integrations" },
        text: { pt: "API pública com chaves e escopos, webhooks assinados (HMAC) e split de coprodução.", en: "Public API with scoped keys, signed webhooks (HMAC) and co-production splits." },
      },
      {
        label: { pt: "Segurança", en: "Security" },
        text: { pt: "Chave do Pagar.me cifrada por loja, senhas em hash e limite de tentativas no login.", en: "Per-store encrypted Pagar.me key, hashed passwords and login rate limiting." },
      },
    ],
    metrics: [
      { value: "500+", label: { pt: "commits meus", en: "of my commits" } },
      { value: "120+", label: { pt: "PRs integrados", en: "PRs merged" } },
      { value: "60+", label: { pt: "cards entregues", en: "cards delivered" } },
      { value: "130+", label: { pt: "arquivos de teste", en: "test files" } },
    ],
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "Prisma", "PostgreSQL", "Pagar.me", "Expo (Android)", "AWS", "Docker"],
    links: [{ kind: "site", href: "https://checkout.isesmt.com.br/c/LOCALIZASST" }],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "coleta-studio",
    title: "Coleta Studio",
    kicker: {
      pt: "Coleta e curadoria de produção científica e patentes, na RNP",
      en: "Collecting and curating scientific output and patents, at RNP",
    },
    year: "2026",
    status: "building",
    featured: false,
    image: {
      src: "/img/projetos/coleta-studio-rnp.webp",
      alt: {
        pt: "Detalhe de uma execução de exemplo no Coleta Studio: coleta, homogeneização e curadoria semântica, com os arquivos gerados",
        en: "A sample run in Coleta Studio: collection, standardization and semantic curation, with the generated files",
      },
      width: 1600,
      height: 1654,
    },
    summary: {
      pt: "Ferramenta do projeto Panorama de Comunidades Acadêmicas em Cibersegurança, da RNP: coleta registros de quatro bases, padroniza tudo e faz a curadoria com um LLM local.",
      en: "The tool behind RNP's Panorama of Academic Communities in Cybersecurity: it collects records from four sources, standardizes them and curates them with a local LLM.",
    },
    overview: {
      pt: "Desenvolvo, como bolsista de PD&I da RNP, a aplicação web que monta e executa coletas de produções científicas e patentes na CAPES, no OpenAlex, na SBC OpenLib e no INPI. Os registros saem padronizados em CSV, separados entre produção científica e patentes, e passam por uma curadoria semântica com um LLM local (Ollama), que decide incluir, excluir ou revisar e guarda a evidência de cada decisão. As coletas rodam em segundo plano, com progresso em tempo real e retomada de onde pararam.",
      en: "As an RNP research and development fellow, I build the web app that sets up and runs collections of scientific output and patents from CAPES, OpenAlex, SBC OpenLib and INPI. Records come out standardized as CSV, split between scientific output and patents, and go through semantic curation with a local LLM (Ollama), which decides to include, exclude or review and keeps the evidence for each decision. Collections run in the background, with live progress and resuming where they stopped.",
    },
    highlights: [
      {
        label: { pt: "Coleta", en: "Collection" },
        text: { pt: "Recorte por tema, período e termos em quatro bases, com limite de registros por fonte.", en: "Slices by topic, period and terms across four sources, with a per-source record limit." },
      },
      {
        label: { pt: "Curadoria", en: "Curation" },
        text: { pt: "LLM local classifica cada documento e registra o motivo da decisão.", en: "A local LLM classifies each document and records the reason for the decision." },
      },
      {
        label: { pt: "Resiliência", en: "Resilience" },
        text: { pt: "Fila em segundo plano, progresso em tempo real e retomada por checkpoints.", en: "Background queue, live progress and checkpoint-based resume." },
      },
      {
        label: { pt: "Qualidade", en: "Quality" },
        text: { pt: "Testes automatizados e decisões técnicas registradas em ADRs.", en: "Automated tests and technical decisions recorded as ADRs." },
      },
    ],
    stack: ["Python", "Django", "HTMX", "Alpine.js", "Ollama", "pandas", "Docker", "pytest"],
    links: [],
    codeNote: { pt: "Código em repositório interno da RNP.", en: "Code in an internal RNP repository." },
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
    links: [],
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
    metrics: [
      { value: { pt: "1 mi+", en: "1M+" }, label: { pt: "opiniões analisadas", en: "opinions analyzed" } },
      { value: "87%+", label: { pt: "acurácia dos modelos", en: "model accuracy" } },
      { value: { pt: "0,90", en: "0.90" }, label: { pt: "acurácia no agrupamento", en: "clustering accuracy" } },
    ],
    stack: ["Angular 20", "BERT", "NLP", "Chart.js", "PrimeNG", "Tailwind", "GitHub Actions"],
    links: [
      { kind: "demo", href: "https://c-monanalys.github.io/crimes_monitor/" },
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
    links: [],
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
      pt: "Fiz parte do time que construiu o Valida SST, como freelancer pela Overzone, e hoje sigo com ele na ISESMT. A plataforma recebe laudos PGR, PCMSO, LTCAT, LI e LP, distribui cada um para um profissional habilitado (CRM ou CREA), coleta a assinatura PAdES com certificado A1 e acompanha a validade. O consumo é cobrado em créditos, por plano recorrente ou compra avulsa.",
      en: "I was part of the team that built Valida SST, as a freelancer through Overzone, and I keep working on it at ISESMT. The platform takes in PGR, PCMSO, LTCAT, LI and LP reports, assigns each one to a licensed professional (CRM or CREA), collects a PAdES signature with an A1 certificate and tracks expiry. Usage is billed in credits, through recurring plans or one-off purchases.",
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
    id: "avalia-nr",
    title: { pt: "Avalia NR-01 e NR-17", en: "Avalia NR-01 and NR-17" },
    kicker: { pt: "Avaliação de riscos psicossociais e ergonômicos", en: "Psychosocial and ergonomic risk assessment" },
    year: "2026",
    status: "live",
    featured: false,
    group: "isesmt",
    badge: "assessment",
    summary: {
      pt: "Conduzi escopo, regras dos planos e pagamento, revisei os PRs e programei planos, ciclos e reativação de contas.",
      en: "I led scope, plan rules and payments, reviewed the PRs and built plans, billing cycles and account reactivation.",
    },
    overview: {
      pt: "Duas plataformas para as empresas atenderem a NR-01 (riscos psicossociais) e a NR-17 (ergonomia), com questionários, análise e relatórios. Conduzi a parte técnica: escopo e regras dos planos e da integração de pagamento, revisão dos PRs do time e a retirada de um webhook que aceitava chamadas sem autenticação. No código, fiz os planos e ofertas dos parceiros, os ciclos de assinatura e a reativação de contas no NR-17, e a consulta de CNPJ com cinco serviços de reserva no NR-01.",
      en: "Two platforms that help companies meet NR-01 (psychosocial risks) and NR-17 (ergonomics), with questionnaires, analysis and reports. I led the technical side: scope and rules for plans and the payment integration, reviews of the team's PRs and taking down a webhook that accepted unauthenticated calls. In the code, I built partner plans and offers, billing cycles and account reactivation in NR-17, and a CNPJ lookup with five fallback services in NR-01.",
    },
    highlights: [
      {
        label: { pt: "Liderança", en: "Leadership" },
        text: { pt: "Escopo e regras dos planos e do pagamento, revisão dos PRs e um webhook sem autenticação tirado do ar.", en: "Scope and rules for plans and payments, PR reviews and an unauthenticated webhook taken down." },
      },
      {
        label: { pt: "Código", en: "Code" },
        text: { pt: "Planos dos parceiros, ciclos de assinatura e reativação de contas; consulta de CNPJ com reserva.", en: "Partner plans, billing cycles and account reactivation; CNPJ lookup with fallbacks." },
      },
    ],
    metrics: [
      { value: "75+", label: { pt: "commits meus", en: "of my commits" } },
      { value: "30+", label: { pt: "cards escritos", en: "cards written" } },
    ],
    stack: ["React 19", "TypeScript", "Tailwind v4", "Recharts", "Zod", "Vitest", "Pagar.me"],
    links: [],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "plataforma-treinamentos",
    title: { pt: "Plataforma de Treinamentos", en: "Training Platform" },
    kicker: { pt: "Cursos de NR com vitrine, certificado e app", en: "Safety courses with a storefront, certificates and an app" },
    year: "2026",
    status: "live",
    featured: false,
    group: "isesmt",
    badge: "training",
    summary: {
      pt: "Fechei o escopo dos jogos da aula de NR-11, priorizei os problemas de certificado e programei o financeiro com o Checkout.",
      en: "I closed the scope of the NR-11 lesson games, prioritized the certificate issues and built the billing on top of Checkout.",
    },
    overview: {
      pt: "A plataforma de cursos de Normas Regulamentadoras da ISESMT: vitrine, aulas, provas, certificado e app do aluno. Na liderança, fechei o escopo dos jogos interativos da aula de NR-11, transformei em cards priorizados os problemas de certificado levantados pelo time e revisei os PRs. No código, levei as cobranças de taxas e licenças para o ISESMT Checkout, com o webhook conferindo a assinatura de cada cobrança, a baixa de estornos e a permissão para editar matrículas.",
      en: "ISESMT's course platform for Brazilian safety standards (NRs): storefront, lessons, exams, certificates and a student app. As lead, I closed the scope of the interactive NR-11 lesson games, turned the certificate issues raised by the team into prioritized cards and reviewed the PRs. In the code, I moved fee and license billing to ISESMT Checkout, with the webhook checking each charge's signature, refund settlement and permissions to edit enrollments.",
    },
    highlights: [
      {
        label: { pt: "Liderança", en: "Leadership" },
        text: { pt: "Escopo dos jogos da aula de NR-11, cards de certificado priorizados e revisão dos PRs.", en: "Scope of the NR-11 lesson games, prioritized certificate cards and PR reviews." },
      },
      {
        label: { pt: "Código", en: "Code" },
        text: { pt: "Cobranças pelo Checkout, webhook com assinatura conferida e estornos, em Django.", en: "Billing through Checkout, signature-checked webhooks and refunds, in Django." },
      },
    ],
    metrics: [
      { value: "40+", label: { pt: "commits meus", en: "of my commits" } },
      { value: "30", label: { pt: "cards escritos", en: "cards written" } },
    ],
    stack: ["Django 5", "Django REST", "Celery", "Next.js 14", "React Native", "AWS S3"],
    links: [],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "localiza-sst",
    title: "Localiza SST",
    kicker: { pt: "Diretório público de profissionais e empresas de SST", en: "Public directory of health and safety professionals" },
    year: "2026",
    status: "live",
    featured: false,
    group: "isesmt",
    badge: "map",
    summary: {
      pt: "Defini o contrato de API com o Gerencia e a regra para mudanças que o afetam, e programei a busca e os perfis.",
      en: "I defined the API contract with Gerencia and the rule for changes that affect it, and built the search and profiles.",
    },
    overview: {
      pt: "Diretório público onde empresas e consultorias de Saúde e Segurança do Trabalho aparecem no mapa, com serviços, contato e as cidades que atendem, integrado ao Gerencia SST. Defini o contrato de API entre os dois sistemas e a regra para mudanças que afetam o Gerencia. No código, fiz a busca com o mapa do Brasil e os perfis do profissional e da empresa dentro do Gerencia.",
      en: "A public directory where occupational health and safety companies and consultancies show up on a map, with services, contacts and the cities they cover, integrated with Gerencia SST. I defined the API contract between the two systems and the rule for changes that affect Gerencia. In the code, I built the search with the map of Brazil and the professional and company profiles inside Gerencia.",
    },
    highlights: [
      {
        label: { pt: "Liderança", en: "Leadership" },
        text: { pt: "Contrato de API com o Gerencia e a regra para mudanças que o afetam.", en: "API contract with Gerencia and the rule for changes that affect it." },
      },
      {
        label: { pt: "Código", en: "Code" },
        text: { pt: "Busca com o mapa do Brasil e perfis do profissional e da empresa.", en: "Search with the map of Brazil and professional and company profiles." },
      },
    ],
    metrics: [{ value: "20+", label: { pt: "cards escritos", en: "cards written" } }],
    stack: ["Next.js 16", "TypeScript", "Prisma", "PostgreSQL", { pt: "Integração com o Gerencia SST", en: "Gerencia SST integration" }],
    links: [],
    codeNote: { pt: "Código proprietário da ISESMT.", en: "Proprietary ISESMT code." },
  },
  {
    id: "isesmt-cloud",
    title: "ISESMT Cloud",
    kicker: { pt: "Observatório da AWS e das VPS da empresa", en: "An observatory for the company's AWS and VPSs" },
    year: "2026",
    status: "live",
    featured: false,
    group: "isesmt",
    badge: "cloud",
    summary: {
      pt: "Conduzi o escopo do observatório e programei a infraestrutura do Checkout e o painel de planejamento do time.",
      en: "I led the observatory's scope and built the Checkout infrastructure and the team's planning dashboard.",
    },
    overview: {
      pt: "Mostra o que existe na AWS e nas VPS, quanto cada serviço usa, quanto custa e o que mudou desde a última coleta. Coletor em Python, banco PostgreSQL, painel em Next.js e deploy automatizado pelo GitHub Actions. Conduzi o escopo e escrevi os cards; no código, fiz a infraestrutura do ISESMT Checkout em Terraform (e-mail pelo SES com DKIM, worker dos jobs e rotação da chave mestra) e o painel de planejamento do time, com os dados do Jira e a revisão cruzada com os PRs do GitHub.",
      en: "It shows what exists on AWS and the VPSs, how much each service uses, what it costs and what changed since the last collection. Python collector, PostgreSQL database, Next.js dashboard and automated deploys through GitHub Actions. I led the scope and wrote the cards; in the code, I built ISESMT Checkout's infrastructure in Terraform (SES email with DKIM, the jobs worker and master key rotation) and the team's planning dashboard, with Jira data cross-checked against GitHub PRs.",
    },
    highlights: [
      {
        label: { pt: "Liderança", en: "Leadership" },
        text: { pt: "Escopo do observatório e os cards do time para cada sistema.", en: "The observatory's scope and the team's cards for each system." },
      },
      {
        label: { pt: "Código", en: "Code" },
        text: { pt: "Infraestrutura do Checkout em Terraform e painel de planejamento com Jira e GitHub.", en: "Checkout infrastructure in Terraform and a planning dashboard with Jira and GitHub." },
      },
    ],
    metrics: [
      { value: "50+", label: { pt: "cards escritos", en: "cards written" } },
      { value: "40+", label: { pt: "commits meus", en: "of my commits" } },
    ],
    stack: ["Python", "PostgreSQL", "Next.js", "Terraform", "Docker", "GitHub Actions", "AWS"],
    links: [],
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
  {
    id: "web",
    label: "Web full-stack",
    items: ["Next.js", "React", "TypeScript", "Angular", "Tailwind", "Radix UI", "shadcn/ui", "Zod"],
  },
  {
    id: "backend",
    label: { pt: "Back-end e dados", en: "Back-end and data" },
    items: [
      "Node.js",
      "Express",
      "Python",
      "Django",
      "Django REST",
      "FastAPI",
      "PostgreSQL",
      "Prisma",
      "Drizzle",
      "Redis",
      { pt: "pg-boss (filas)", en: "pg-boss (queues)" },
      "Puppeteer",
      "ExcelJS",
      { pt: "Pagamentos (Pagar.me, PIX, boleto)", en: "Payments (Pagar.me, PIX, boleto)" },
    ],
  },
  {
    id: "infra",
    label: { pt: "Infra e segurança", en: "Infra and security" },
    items: [
      "Docker",
      "Kubernetes (k3s)",
      "AWS (ECS, S3, CloudFront, Amplify)",
      "Linux / VPS",
      "GitHub Actions",
      "Multi-tenancy",
      "MFA",
      { pt: "Assinatura digital ICP-Brasil (A1)", en: "ICP-Brasil digital signature (A1)" },
      { pt: "Integração com o eSocial", en: "eSocial integration" },
    ],
  },
  {
    id: "ai",
    label: { pt: "IA e pesquisa", en: "AI and research" },
    items: ["NLP", "BERT", "BERTimbau", "Transformers", "LLMs", "Ollama (LLM local)", "scikit-learn", "pandas", "Chart.js"],
  },
  {
    id: "product",
    label: { pt: "Produto, processo e liderança", en: "Product, process and leadership" },
    items: [
      "Figma",
      "UI/UX",
      "Product discovery",
      { pt: "Requisitos", en: "Requirements" },
      "MVP",
      { pt: "Desenvolvimento orientado a especificação", en: "Spec-driven development" },
      { pt: "Testes (Jest, Vitest, ponta a ponta)", en: "Testing (Jest, Vitest, end-to-end)" },
      "Code review",
      { pt: "Priorização e planejamento", en: "Prioritization and planning" },
      { pt: "Onboarding de devs", en: "Developer onboarding" },
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
      pt: "O caminho que repito em pesquisa e em produto, desenhado com partículas.",
      en: "The path I repeat in research and in product, drawn with particles.",
    },
    steps: [
      { label: { pt: "Dados", en: "Data" }, caption: { pt: "Comentários, vídeos e logs: ruído de verdade.", en: "Comments, videos and logs: real-world noise." } },
      { label: { pt: "Modelo", en: "Model" }, caption: { pt: "BERT, LLMs e heurísticas que extraem sinal.", en: "BERT, LLMs and heuristics that pull out signal." } },
      { label: "Insight", caption: { pt: "Métricas e gráficos que alguém entende.", en: "Metrics and charts someone can read." } },
      { label: { pt: "Código", en: "Code" }, caption: { pt: "APIs, front-end e infraestrutura para escalar.", en: "APIs, front-end and infrastructure to scale." } },
      { label: { pt: "Produto", en: "Product" }, caption: { pt: "Algo no ar, com o meu nome assinando.", en: "Something live, with my name on it." } },
    ],
    hint: { pt: "Escolha uma etapa", en: "Pick a step" },
    interact: {
      pointer: { pt: "Passe o mouse para bagunçar, clique para explodir.", en: "Hover to stir them, click to burst." },
      touch: { pt: "Toque no desenho para explodir.", en: "Tap the drawing to burst it." },
    },
  },
  projects: {
    title: { pt: "Projetos", en: "Projects" },
    lead: {
      pt: "Produtos que levei do problema ao deploy, entre empresa, laboratório e projetos próprios.",
      en: "Products I took from problem to deploy, across company, lab and personal projects.",
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
    isesmt: {
      kicker: { pt: "ISESMT · liderança técnica", en: "ISESMT · technical leadership" },
      title: { pt: "Também conduzo os outros sistemas", en: "I also lead the other systems" },
      lead: {
        pt: "Além do Gerencia, do Valida e do Checkout, sou quem conduz a parte técnica dos outros sistemas da empresa, e programo neles também.",
        en: "Beyond Gerencia, Valida and Checkout, I lead the technical side of the company's other systems, and I code in them too.",
      },
      stats: [
        { value: "140+", label: { pt: "cards escritos nesses sistemas", en: "cards written for these systems" } },
        { value: "160+", label: { pt: "commits meus nesses sistemas", en: "of my commits in these systems" } },
      ],
      method: [
        { label: "Cards", text: { pt: "Escrevo e priorizo o trabalho do time no Jira.", en: "I write and prioritize the team's work in Jira." } },
        { label: { pt: "Revisão", en: "Review" }, text: { pt: "Reviso os PRs antes de irem ao ar.", en: "I review PRs before they ship." } },
        { label: { pt: "Decisões", en: "Decisions" }, text: { pt: "Fecho escopo, regras e integrações com os donos.", en: "I settle scope, rules and integrations with the owners." } },
        { label: { pt: "Código", en: "Code" }, text: { pt: "Entro no código onde o sistema mais precisa.", en: "I step into the code where the system needs it most." } },
      ],
    },
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
  teaser: {
    kicker: { pt: "Modo criativo", en: "Creative mode" },
    before: { pt: "Até aqui, o currículo.", en: "So far, the résumé." },
    after: { pt: "No modo criativo, a prática.", en: "In creative mode, the practice." },
    sub: {
      pt: "O mesmo conteúdo, em outra experiência: partículas que reagem ao toque, a stack escalada como um time de futebol, um terminal de comandos e jogos escondidos pelo site. Tudo feito do zero.",
      en: "The same content, as another experience: particles that react to your touch, the stack lined up as a football team, a command terminal and games hidden across the site. All built from scratch.",
    },
    features: [
      { pt: "Partículas", en: "Particles" },
      { pt: "Escalação", en: "Lineup" },
      "Terminal",
      { pt: "Jogos", en: "Games" },
      { pt: "{n} segredos", en: "{n} secrets" },
    ],
    cta: { pt: "Ver na prática", en: "See it in practice" },
    marquee: [
      { pt: "PARTÍCULAS ✦ JOGOS ✦ SEGREDOS ✦ TERMINAL ✦ ESCALAÇÃO ✦", en: "PARTICLES ✦ GAMES ✦ SECRETS ✦ TERMINAL ✦ LINEUP ✦" },
    ],
  },
  experience: {
    title: { pt: "Experiência", en: "Experience" },
    lead: {
      pt: "Onde transformo especificação em produto: do SaaS em produção ao laboratório de pesquisa.",
      en: "Where I turn specs into product: from a SaaS in production to the research lab.",
    },
    current: { pt: "Atual", en: "Current" },
    viewProject: { pt: "Ver projeto", en: "See project" },
    more: { pt: "Ver mais {n}", en: "Show {n} more" },
    less: { pt: "Ver menos", en: "Show less" },
  },
  dock: {
    cv: { pt: "Currículo", en: "Résumé" },
    talk: { pt: "Vamos conversar", en: "Let's talk" },
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
      pt: "Partículas que viram as iniciais CH, uma rede neural, uma bola, um controle, uma esfera de quatro estrelas, uma shuriken e um chapéu de palha",
      en: "Particles turning into the initials CH, a neural network, a ball, a gamepad, a four-star orb, a shuriken and a straw hat",
    },
    shapes: [
      "CH",
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
        pt: "Quando o computador desliga: anime, games retrô e futebol de fim de semana. Foi daí que saiu a ideia deste modo.",
        en: "When the computer goes off: anime, retro games and weekend football. That is where the idea for this mode came from.",
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
    cheatOff: { pt: "CHEAT DESATIVADO", en: "CHEAT DEACTIVATED" },
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
      lxgiwyl: "LXGIWYL",
      aiwprton: "AIWPRTON",
      cpktnwt: "CPKTNWT",
      turnuptheheat: "TURNUPTHEHEAT",
      ninjatown: "NINJATOWN",
      sobrecarga: { pt: "Jogou Sobrecarga", en: "Played Sobrecarga" },
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
      lxgiwyl: {
        pt: "Kit de armas na mão. Clique para atirar, 1 2 3 trocam de arma. Digite de novo para guardar.",
        en: "Weapon set in hand. Click to shoot, 1 2 3 switch weapons. Type it again to holster.",
      },
      aiwprton: {
        pt: "Rhino na pista. Ele segue o mouse e o clique dispara. Digite de novo para estacionar.",
        en: "Rhino on the road. It follows the mouse and a click fires. Type it again to park it.",
      },
      cpktnwt: { pt: "Tudo pelos ares. A página se reconstrói em seguida.", en: "Everything blows up. The page rebuilds itself right after." },
      turnuptheheat: { pt: "+2 estrelas. Com 4 ou mais, o helicóptero da polícia aparece.", en: "+2 stars. At 4 or more, the police chopper shows up." },
      ninjatown: {
        pt: "Tema ninja. Clique para lançar shurikens e arraste para cortar com a katana.",
        en: "Ninja theme. Click to throw shurikens and drag to slash with the katana.",
      },
    },
    how: {
      terminal: { pt: "Aperte / ou use o atalho do rodapé", en: "Press / or use the footer shortcut" },
      konami: "↑ ↑ ↓ ↓ ← → ← → B A",
      hesoyam: "HESOYAM",
      aezakmi: "AEZAKMI",
      rocketman: "ROCKETMAN",
      snake: { pt: "No terminal: snake", en: "In the terminal: snake" },
      pong: { pt: "No terminal: pong", en: "In the terminal: pong" },
      hattrick: { pt: "Três gols na escalação do modo criativo", en: "Three goals in the creative mode lineup" },
      iddqd: "IDDQD",
      lxgiwyl: "LXGIWYL",
      aiwprton: "AIWPRTON",
      cpktnwt: "CPKTNWT",
      turnuptheheat: "TURNUPTHEHEAT",
      ninjatown: "NINJATOWN",
      sobrecarga: { pt: "Digite SOBRECARGA (ou OVERLOAD), ou no terminal: sobrecarga", en: "Type OVERLOAD (or SOBRECARGA), or in the terminal: sobrecarga" },
    },
    short: {
      terminal: { pt: "um terminal de verdade", en: "a real terminal" },
      konami: { pt: "pênaltis contra o goleiro Bug", en: "penalties against goalkeeper Bug" },
      hesoyam: { pt: "vida, colete e dinheiro", en: "health, armor and cash" },
      aezakmi: { pt: "zera as estrelas", en: "clears the stars" },
      rocketman: { pt: "jetpack", en: "jetpack" },
      snake: { pt: "a cobrinha clássica", en: "the classic snake" },
      pong: { pt: "o Pong de 1972", en: "the 1972 Pong" },
      hattrick: { pt: "três gols seguidos", en: "three goals in a row" },
      iddqd: { pt: "modo deus", en: "god mode" },
      lxgiwyl: { pt: "kit de armas", en: "weapon set" },
      aiwprton: { pt: "tanque Rhino", en: "Rhino tank" },
      cpktnwt: { pt: "explode tudo", en: "blows everything up" },
      turnuptheheat: { pt: "+2 estrelas de procurado", en: "+2 wanted stars" },
      ninjatown: { pt: "shurikens e katana", en: "shurikens and katana" },
      sobrecarga: { pt: "jogo de luta contra os bugs", en: "fighting game against the bugs" },
    },
    manual: {
      title: { pt: "Manual de segredos", en: "Secrets manual" },
      lead: {
        pt: "Todos os segredos do portfólio. Os códigos funcionam digitados em qualquer lugar da página, fora de campos de texto, ou aqui mesmo.",
        en: "Every secret in the portfolio. Codes work typed anywhere on the page, outside text fields, or right here.",
      },
      found: { pt: "achado", en: "found" },
      missing: { pt: "falta", en: "missing" },
      run: { pt: "Ativar", en: "Activate" },
      command: { pt: "revela todos os segredos", en: "reveals every secret" },
    },
  },
  gta: {
    hud: { pt: "HUD de San Andreas", en: "San Andreas HUD" },
    hide: { pt: "Desligar os cheats e esconder o HUD", en: "Turn the cheats off and hide the HUD" },
    clearWanted: { pt: "Despistar a polícia (AEZAKMI)", en: "Lose the cops (AEZAKMI)" },
    weapons: {
      pistol: { pt: "Pistola 9mm", en: "9mm pistol" },
      shotgun: { pt: "Escopeta serrada", en: "Sawn-off shotgun" },
      uzi: "Micro Uzi",
    },
    switchHint: { pt: "Trocar de arma (1, 2, 3)", en: "Switch weapon (1, 2, 3)" },
    reload: { pt: "Recarregando", en: "Reloading" },
    empty: { pt: "Sem munição", en: "Out of ammo" },
    chips: {
      guns: { pt: "Armas", en: "Weapons" },
      tank: "Rhino",
      ninja: "Ninja",
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
