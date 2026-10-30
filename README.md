# Carlos Vale · Portfólio

Portfólio pessoal com **dois modos que mostram o mesmo conteúdo**:

- **Modo sério ("Cut-in")**: editorial, com cara de artigo científico. Papel `#F4F2EC`, tinta `#121212` e um único acento vermelho `#E23B2E`. Tem nome revelado letra a letra, foto com tilt 3D e selo giratório, números contando, ticker da stack, a figura de partículas "Do dado ao produto" (dados → modelo → insight → código → produto), casos em destaque com mockup em parallax e um índice editorial dos outros projetos com preview seguindo o cursor, e a seção de Experiência.
- **Modo criativo**: tipografia cinética, cortinas vermelhas nas viradas de seção e partículas no hero, com seletor de formas: CV, rede neural, bola, controle, esfera de 4 estrelas, shuriken e chapéu de palha. A stack vira "A escalação" (4-3-3 jogável, com card por jogador e pontapé inicial), e a seção "Fora do código" traz stickers chibi de Dragon Ball, Naruto e One Piece, games e futebol. O Goku na nuvem voadora cruza a tela de vez em quando.

A troca acontece pelo switch "Modo criativo" no topo, com uma transição de cut-in de anime. `Esc` volta ao modo sério, e `?modo=criativo` abre direto no criativo.

## Stack

- Next.js 16 (App Router, Cache Components, React Compiler) + React 19
- Tailwind CSS v4
- Motion (`motion/react`, com `LazyMotion` + `domAnimation`)
- Canvas 2D puro para partículas, física e jogos (sem WebGL, sem engine de física)

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000 → redireciona para /pt ou /en
npm run build && npm start
```

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Textos, projetos, artigos, stack (PT e EN) | `src/content/data.ts` |
| Cores, fontes e tokens | `src/app/globals.css` |
| Modo sério | `src/components/serious/` |
| Modo criativo | `src/components/creative/` |
| Topbar, rodapé, transição, toasts, estado global | `src/components/shell/` |
| Easter eggs e terminal | `src/components/secrets/` |
| Jogos | `src/components/games/` |

Todo texto que muda entre idiomas é um par `{ pt, en }` em `data.ts`. O resto do código só lê o conteúdo já resolvido.

## Animações e acessibilidade

As animações vêm ligadas por padrão, inclusive quando o sistema pede movimento reduzido. Quem preferir menos movimento usa o botão "Animações: ligadas/desligadas" no rodapé, e a escolha fica salva no `localStorage`.

## Performance

- `/pt` e `/en` são pré-renderizados como HTML estático.
- O modo criativo, o terminal, os jogos e o modal de projeto são chunks separados, carregados só quando usados. O chunk criativo é pré-carregado quando o mouse passa sobre o switch.
- Imagens em WebP redimensionadas (a foto caiu de ~1 MB para ~54 KB) e servidas pelo `next/image` em AVIF/WebP.
- Canvas pausam fora da tela e com a aba oculta. `prefers-reduced-motion` desliga as animações contínuas, e o marquee tem botão de pausa.

## Segredos (spoiler)

<details>
<summary>Lista completa dos 14 segredos</summary>

1. Abrir o terminal com `/` (ou pelo botão no rodapé)
2. Código Konami `↑ ↑ ↓ ↓ ← → ← → B A` → **Super Dev Soccer** (pênaltis contra o goleiro Bug)
3. `HESOYAM` (GTA San Andreas) → dinheiro, vida, colete e munição no HUD
4. `AEZAKMI` (GTA San Andreas) → zera as estrelas de procurado
5. `ROCKETMAN` (GTA San Andreas) → jetpack: os títulos flutuam e a gravidade do playground inverte
6. Jogar Snake (`snake` no terminal)
7. Jogar Pong (`pong` no terminal)
8. Hat-trick: 3 gols com o pontapé inicial da escalação no modo criativo
9. `IDDQD` (Doom) → modo deus, com o acento dourado por 10 segundos
10. `LXGIWYL` (GTA San Andreas) → kit de armas: o cursor vira mira, o clique atira (pistola, escopeta e Uzi com 1 2 3) e deixa marcas de bala
11. `AIWPRTON` (GTA San Andreas) → tanque Rhino que segue o mouse; o clique dispara e explode o que estiver perto
12. `CPKTNWT` (GTA San Andreas) → explode os elementos da tela, que se reconstroem em seguida
13. `TURNUPTHEHEAT` (GTA San Andreas) → +2 estrelas; com 4 ou mais, o helicóptero da polícia persegue o cursor com o holofote
14. `NINJATOWN` (GTA San Andreas) → o clique lança shurikens e arrastar corta com a katana

Os cheats funcionam digitados em qualquer lugar da página (fora de campos de formulário) ou como comandos no terminal. Os de San Andreas abrem um HUD no estilo do jogo, e digitar `LXGIWYL`, `AIWPRTON` ou `NINJATOWN` de novo desliga. O comando `manual` no terminal lista todos os segredos e ativa qualquer um com um clique. O progresso fica no `localStorage` e aparece no contador "segredos n/14" do rodapé.

</details>

## Créditos

Os stickers chibi são carregados direto do CDN do GIPHY (não ficam no repositório), com atribuição e link para cada original na seção "Fora do código". Os personagens pertencem aos seus autores e estúdios.

## Deploy

Pensado para a Vercel. Em produção, o `metadataBase` usa `VERCEL_PROJECT_PRODUCTION_URL`. O formulário de contato envia para o Formspree (`src/components/serious/ContactForm.tsx`).
