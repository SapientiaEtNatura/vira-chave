# DESIGN.md — VIRA CHAVE

Sistema visual oficial da plataforma educacional **VIRA CHAVE** (fonte de verdade: `src/app/globals.css`).

---

## 1. Direção Estética

- **Mundo visual:** Percurso guiado de aprendizagem escolar — papel claro (`#F6F8FB`), tinta escura nítida (`#101828`), petróleo institucional (`#0F5C6E` / `#123F4A`) e destaque âmbar (`#F59E0B`).
- **Tom:** Acolhedor, claro, educativo e direto — nunca corporativo nem infantilizado.
- **Modos de superfície:**
  - **Persuade (`/`):** Landing editorial com prévia viva do Mapa de Afinidades e Portfólio de demonstração.
  - **Operate (`/app/*`, `/educador/*`, `/admin/*`):** Alta legibilidade, hierarquia direta, uma ação primária clara por tela e feedback imediato.
  - **Read (`/privacidade`, `/termos`, `/p/[token]`):** Leitura confortável (largura 65–75ch), sem ruído visual.

---

## 2. Tipografia

Fontes self-hosted via `next/font/google` em `src/app/layout.tsx` (compatíveis com CSP restritiva `font-src 'self' data:`):

| Papel | Família | Variável CSS | Pesos | Uso |
|---|---|---|---|---|
| Display / Títulos | **Outfit** | `--font-outfit` (`--font-display`) | 600, 700 | `h1`, `h2`, `h3`, marcas e números de destaque (`letter-spacing: -0.02em`) |
| Corpo / UI | **Plus Jakarta Sans** | `--font-jakarta` (`--font-sans`) | 400, 500, 600, 700 | Parágrafos, botões, formulários, tabelas e labels |
| Dados / Códigos | **JetBrains Mono** | `--font-jetbrains` (`--font-mono`) | 500, 600 | Códigos de turma (`VC-...`), percentuais (`tabular-nums`), referências de erro |

---

## 3. Paleta & Tokens Semânticos

### Superfícies & Texto
- `--bg-canvas`: `#F6F8FB` (fundo global; textura `.bg-notebook-dots` apenas em heróis/aberturas)
- `--bg-surface`: `#FFFFFF` (cards e painéis principais)
- `--bg-surface-subtle`: `#EEF2F7` (blocos internos, hover suave, barras)
- `--border-subtle`: `#DCE3EC` | `--border-strong`: `#B8C4D4`
- `--ink-primary`: `#101828` | `--ink-secondary`: `#344054` | `--ink-muted`: `#475467`

### Marca
- `--brand-primary`: `#0F5C6E` | hover `#0B4654` | deep `#123F4A`
- `--brand-primary-soft`: `#E6F4F6` | border `#B6DFE6` | ink on dark `#CDE7ED`
- `--brand-accent`: `#F59E0B` | soft `#FEF3C7` | ink `#92400E`

### 4 Etapas do Percurso
| Etapa | Background | Ink (≥4.5:1) | Border |
|---|---|---|---|
| **Descobrir** | `#F3E8FF` | `#6D28D9` | `#DDD6FE` |
| **Aprender** | `#E0F2FE` | `#0369A1` | `#BAE6FD` |
| **Experimentar** | `#FEF3C7` | `#B45309` | `#FDE68A` |
| **Construir** | `#D1FAE5` | `#047857` | `#A7F3D0` |

### Status Semânticos
- **Sucesso:** bg `#ECFDF5` / ink `#065F46` / border `#A7F3D0` / dot `#10B981`
- **Aviso:** bg `#FFFBEB` / ink `#92400E` / border `#FDE68A` / dot `#F59E0B`
- **Perigo:** bg `#FEF2F2` / ink `#B91C1C` / border `#FECACA` / solid `#DC2626`
- **Info:** bg `#E6F4F6` / ink `#0F5C6E` / border `#B6DFE6`

---

## 4. Regras de Componentes & Acessibilidade

- **Alvos de toque:** mínimo `min-h-11` (44px) em controles interativos móveis.
- **Contraste:** mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande e elementos gráficos). Nunca aplicar `opacity` em texto colorido sobre fundo pastel quando comprometer 4.5:1.
- **Foco visível:** `:focus-visible` com outline `2px solid var(--brand-primary)` e suporte a `forced-colors` em inputs.
- **Modais e Drawers:** foco preso (focus trap), fechamento por `Escape`, bloqueio de scroll no `body`, `role="alertdialog"` em confirmações destrutivas (`ConfirmDialog variant="danger"`) e proteção de alterações não salvas (`isDirty` no `Drawer`).
- **Primitivos únicos:** usar exclusivamente os componentes de `@/components/ui` (todos baseados nos tokens acima; proibido usar classes Tailwind de paleta crua como `bg-emerald-500` ou hex inline).

---

## 5. Movimento & Performance

- **GSAP modular:** `src/lib/gsap.ts` registra apenas `useGSAP`. `ScrollTrigger` e `SplitText` são importados apenas nos componentes que os utilizam (`SplitTextReveal`, `StaggerGroup`).
- **ScrollTrigger seguro:** `start: "top 88%"` com `once: true` e `clearProps: "transform,opacity"` para nunca prender elementos finais invisíveis.
- **`prefers-reduced-motion`:** todos os componentes animados respeitam `gsap.matchMedia()` / `matchMedia`; no CSS, animações espaciais são desativadas mantendo transições sutis de cor/opacidade para feedback de estado.
- **Transição de rota:** barra discreta no topo (`NavigationTransitionOverlay`) em CSS puro, sem bloquear cliques e ignorando alterações de filtro na mesma rota.
