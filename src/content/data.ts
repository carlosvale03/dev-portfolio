import type { Content, Lang, Localized, Project, Publication, StackGroup, Ui } from "./types";

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
    pt: "Engenheiro de software full-stack e pesquisador em IA",
    en: "Full-stack software engineer and AI researcher",
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
    { value: "07", label: { pt: "projetos", en: "projects" } },
    { value: "03", label: { pt: "artigos publicados", en: "published papers" } },
    { value: "MSc", label: { pt: "em andamento, UFPI", en: "in progress, UFPI" } },
  ],
  about: [
    {
      pt: "Sou o Carlos Henrique do Vale e Silva, desenvolvedor movido pela interseção entre engenharia de software e inteligência artificial aplicada. Gosto de pegar problemas complexos e transformá-los em produtos simples de usar.",
      en: "I'm Carlos Henrique do Vale e Silva, a developer driven by the intersection of software engineering and applied artificial intelligence. I like taking complex problems and turning them into products that are simple to use.",
    },
    {
      pt: "Na prática, construí ecossistemas SaaS como o Valida SST e o Fluxar com Next.js, Python/Django e Docker. Em paralelo, pesquiso aprendizado de máquina e PLN, com foco em extrair conhecimento de dados ruidosos de redes sociais.",
      en: "In practice, I've built SaaS ecosystems like Valida SST and Fluxar with Next.js, Python/Django and Docker. In parallel, I research machine learning and NLP, focused on extracting knowledge from noisy social media data.",
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
      title: { pt: "Desenvolvedor full-stack", en: "Full-stack developer" },
      place: "Overzone · Valida SST",
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
    {
      when: { pt: "Graduação", en: "Undergrad" },
      title: { pt: "Monitor de Banco de Dados II", en: "Database Systems II teaching assistant" },
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

const projects: Bi<Project>[] = [
  {
    id: "paad",
    title: "Site PAAD",
    kicker: { pt: "Portal oficial do Laboratório PAAD", en: "Official PAAD Lab portal" },
    year: "2025",
    status: "live",
    featured: true,
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
    id: "valida-sst",
    title: "Valida SST",
    kicker: { pt: "Gestão de documentos de saúde e segurança do trabalho", en: "Occupational health and safety document management" },
    year: "2025",
    status: "private",
    featured: false,
    image: {
      src: "/img/projetos/valida-sst.webp",
      alt: { pt: "Tela inicial do Valida SST", en: "Valida SST landing screen" },
      width: 1600,
      height: 829,
    },
    summary: {
      pt: "Plataforma SaaS para centralizar e validar documentos de SST, com upload, dashboard, relatórios e assinatura digital com certificado A1.",
      en: "A SaaS platform to centralize and validate health and safety documents, with uploads, dashboards, reports and A1 certificate digital signatures.",
    },
    overview: {
      pt: "Desenvolvido na Overzone, o Valida SST automatiza a validação de documentos técnicos obrigatórios para empresas que precisam manter a conformidade legal em segurança do trabalho.",
      en: "Built at Overzone, Valida SST automates the validation of mandatory technical documents for companies that need to stay compliant with occupational safety law.",
    },
    highlights: [
      { label: { pt: "Assinatura", en: "Signatures" }, text: { pt: "Assinatura digital segura com certificados A1.", en: "Secure digital signatures with A1 certificates." } },
      { label: { pt: "Arquivos", en: "Files" }, text: { pt: "AWS S3 com políticas de acesso restrito.", en: "AWS S3 with restricted access policies." } },
      { label: "Dashboard", text: { pt: "Métricas de conformidade e alertas de vencimento.", en: "Compliance metrics and expiration alerts." } },
      { label: "Performance", text: { pt: "Cache com Upstash Redis para dados frequentes.", en: "Upstash Redis caching for hot data." } },
    ],
    stack: ["Next.js 15", "TypeScript", "React 19", "Tailwind v4", "Radix UI", "Clerk", "PostgreSQL", "Drizzle", "AWS S3", "Redis"],
    links: [{ kind: "site", href: "https://overzone.dev/" }],
  },
  {
    id: "fluxar",
    title: "Fluxar",
    kicker: { pt: "SaaS de finanças pessoais", en: "Personal finance SaaS" },
    year: "2025",
    status: "private",
    featured: false,
    image: {
      src: "/img/projetos/fluxar.webp",
      alt: { pt: "Dashboard financeiro do Fluxar", en: "Fluxar finance dashboard" },
      width: 1600,
      height: 989,
    },
    summary: {
      pt: "Ecossistema para controlar patrimônio, fluxo de caixa e metas, com vários bancos, cartões de crédito e relatórios avançados.",
      en: "An ecosystem to track net worth, cash flow and goals, with multiple banks, credit cards and advanced reports.",
    },
    overview: {
      pt: "O Fluxar foi pensado para ser o centro financeiro do usuário: patrimônio líquido em tempo real e projeção de metas de longo prazo, com front em Next.js e back-end em Django REST Framework.",
      en: "Fluxar is designed to be the user's financial hub: real-time net worth and long-term goal projections, with a Next.js front-end and a Django REST Framework back-end.",
    },
    highlights: [
      { label: { pt: "Multicontas", en: "Multi-account" }, text: { pt: "Bancos e cartões centralizados.", en: "Banks and cards in one place." } },
      { label: { pt: "Relatórios", en: "Reports" }, text: { pt: "Gastos por categoria e balanço mensal.", en: "Spending by category and monthly balance." } },
      { label: { pt: "Metas", en: "Goals" }, text: { pt: "Acompanhamento de aportes e objetivos.", en: "Contribution and goal tracking." } },
    ],
    stack: ["Next.js 15", "Django REST", "PostgreSQL", "Docker", "TypeScript", "Tailwind v4", "Radix UI"],
    links: [],
  },
  {
    id: "imogoat",
    title: "ImoGOAT",
    kicker: { pt: "Proptech regional", en: "Regional proptech" },
    year: "2025",
    status: "building",
    featured: false,
    image: {
      src: "/img/projetos/imogoat.webp",
      alt: { pt: "Listagem de imóveis do ImoGOAT", en: "ImoGOAT property listing" },
      width: 1366,
      height: 1565,
    },
    summary: {
      pt: "Plataforma de aluguel de imóveis em Picos e região, conectando locatários e proprietários com busca geo-otimizada.",
      en: "A rental platform for Picos and the surrounding region, connecting tenants and owners with geo-optimized search.",
    },
    overview: {
      pt: "O ImoGOAT resolve lacunas de divulgação e transparência no mercado imobiliário local, com interface mobile-first focada em conversão.",
      en: "ImoGOAT closes gaps in listing visibility and transparency in the local real estate market, with a mobile-first, conversion-focused interface.",
    },
    highlights: [
      { label: { pt: "Busca", en: "Search" }, text: { pt: "Filtros por localização, preço e características.", en: "Filters by location, price and features." } },
      { label: { pt: "Proprietários", en: "Owners" }, text: { pt: "Painel para anúncios e controle de leads.", en: "A panel for listings and lead tracking." } },
    ],
    stack: ["Next.js", "TypeScript", "Tailwind", "Docker"],
    links: [{ kind: "code", href: "https://github.com/imogoat/projeto-front-end" }],
  },
  {
    id: "gestao-conteudo",
    title: { pt: "Sistema de gestão de conteúdo", en: "Content management system" },
    kicker: { pt: "Sob acordo de confidencialidade", en: "Under NDA" },
    year: "2026",
    status: "building",
    featured: false,
    image: {
      src: "/img/projetos/gestao-noticias.webp",
      alt: { pt: "Painel do sistema de gestão de conteúdo", en: "Content management system panel" },
      width: 1366,
      height: 1533,
    },
    summary: {
      pt: "Sistema web completo para gestão de conteúdo, com arquitetura moderna focada em performance e segurança.",
      en: "A complete web system for content management, with a modern architecture focused on performance and security.",
    },
    overview: {
      pt: "Projeto em andamento sob acordo de confidencialidade, com front-end em Next.js e API em FastAPI.",
      en: "An ongoing project under NDA, with a Next.js front-end and a FastAPI API.",
    },
    highlights: [],
    stack: ["Next.js", "TypeScript", "Tailwind", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker"],
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
  { id: "web", label: "Web full-stack", items: ["Next.js", "React", "TypeScript", "Angular", "Tailwind", "Radix UI"] },
  { id: "backend", label: { pt: "Back-end e infra", en: "Back-end and infra" }, items: ["Node.js", "Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Prisma", "Drizzle", "Docker", "GitHub Actions"] },
  { id: "ai", label: { pt: "IA e pesquisa", en: "AI and research" }, items: ["NLP", "BERT", "Transformers", "LLMs", "scikit-learn", "Chart.js"] },
  { id: "product", label: { pt: "Design e produto", en: "Design and product" }, items: ["Figma", "UI/UX", "Product discovery", { pt: "Requisitos", en: "Requirements" }, "MVP", "MFA"] },
];

const ui: Bi<Ui> = {
  skip: { pt: "Pular para o conteúdo", en: "Skip to content" },
  nav: {
    about: { pt: "Sobre", en: "About" },
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
      site: "Overzone",
    },
    privateNote: {
      pt: "Código e demo privados. Posso mostrar numa conversa.",
      en: "Private code and demo. Happy to walk you through it on a call.",
    },
    highlights: { pt: "Destaques", en: "Highlights" },
    featured: { pt: "Casos em destaque", en: "Featured cases" },
    others: { pt: "Outros projetos", en: "More projects" },
    columns: {
      project: { pt: "Projeto", en: "Project" },
      stack: "Stack",
      year: { pt: "Ano", en: "Year" },
      status: "Status",
    },
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
    projects: resolve<Project[]>(projects, lang),
    publications: resolve<Publication[]>(publications, lang),
    stack: resolve<StackGroup[]>(stack, lang),
    ui: resolve<Ui>(ui, lang),
  };
}
