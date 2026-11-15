# VIRA CHAVE

> *Descubra possibilidades. Desenvolva habilidades. Construa seu caminho.*

O **VIRA CHAVE** é uma plataforma educacional gratuita de descoberta profissional e desenvolvimento de habilidades, voltada para estudantes do Ensino Médio e jovens em busca de orientação para o mundo do trabalho.

---

## As 4 Etapas da Jornada

1. **Descobrir** — Questionário situacional determinístico que gera um mapa de afinidades por macroárea e recomenda trilhas de aprendizagem.
2. **Aprender** — Trilhas temáticas com curadoria de cursos gratuitos externos, transição automática para *Em andamento* ao acessar e conclusão mediante registro de resumo (com anexo opcional de certificado).
3. **Experimentar** — Catálogo de desafios práticos com submissão de reflexões, links e arquivos de evidência.
4. **Construir** — Portfólio pessoal **privado por padrão**, com geração e revogação de link único compartilhável (`/p/[token]`).

Além da jornada do estudante, a plataforma oferece:
- **Visão Educacional (`/educador`):** painel restrito por turma com gráficos agregados e resumo de etapa/interesses por estudante, sem expor respostas brutas nem projetos privados.
- **Painel Administrativo (`/admin`):** curadoria de macroáreas, perguntas, trilhas, cursos, desafios e gestão de instituições parceiras.
- **Privacidade por Padrão (LGPD):** proteção de dados de adolescentes desde a concepção, registro versionado de consentimentos, arquivos servidos exclusivamente via rota autenticada/autorizada (`/api/files/[fileId]`) e exclusão imediata de conta em autoatendimento (`/app/conta`).

---

## Stack Tecnológica

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Interface & Gráficos:** Tailwind CSS, Lucide Icons, Recharts
- **Validação & Autenticação:** Zod, Auth.js (NextAuth v5) + bcryptjs + RBAC (`ESTUDANTE`, `EDUCADOR`, `ADMIN`)
- **Banco de Dados & ORM:** PostgreSQL 16 + Prisma ORM
- **Testes:** Vitest (unitário/integração) e Playwright (E2E)
- **Containerização:** Docker (multi-stage build com `output: "standalone"`)

---

## Estrutura do Projeto

```text
├── prisma/
│   ├── schema.prisma        # Modelos, enums e relações PostgreSQL
│   └── seed.ts              # Dados iniciais idempotentes (macroáreas, perguntas, trilhas, desafios)
├── src/
│   ├── app/
│   │   ├── (public)/        # Landing (/), /login, /cadastro, /recuperar-senha, /termos, /privacidade, /p/[token]
│   │   ├── (app)/           # Área do Estudante (/app, /app/descobrir, /app/aprender, /app/experimentar, /app/portfolio, /app/conta)
│   │   ├── (educator)/      # Área do Educador (/educador, /educador/turmas/[id])
│   │   ├── (admin)/         # Curadoria e Instituições (/admin/conteudo, /admin/instituicoes)
│   │   └── api/             # Route Handlers protegidos por RBAC e validação Zod
│   ├── components/          # Componentes client/server por módulo
│   ├── lib/                 # Regras de domínio, Auth.js, RBAC, storage local seguro e LGPD
│   └── types/
├── tests/
│   ├── unit/                # Suíte Vitest
│   └── e2e/                 # Suíte Playwright
├── docs/                    # Visão de produto, arquitetura, ADRs, roadmap e diretrizes
└── Dockerfile               # Build multi-stage de produção
```

---

## Executando Localmente

### Pré-requisitos
- Node.js 22+
- PostgreSQL 16

### Variáveis de Ambiente (`.env`)
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/virachave?schema=public"
AUTH_SECRET="gere-uma-chave-segura-aleatoria"
UPLOAD_DIR="./uploads"
```

### Instalação e Banco de Dados
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

---

## Scripts e Verificação

```bash
npm run lint           # ESLint
npx tsc --noEmit       # Verificação de tipos TypeScript
npx vitest run         # Testes unitários e de integração
npm run build          # Build de produção Next.js (standalone)
npx playwright test    # Testes E2E (requer servidor e PostgreSQL ativos)
```

---

## Documentação Adicional

- [PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) — Visão de produto e escopo do MVP
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Princípios arquiteturais e componentes
- [TECHNICAL_DECISIONS.md](docs/TECHNICAL_DECISIONS.md) — Registro de Decisões Arquiteturais (ADRs)
- [ROADMAP.md](docs/ROADMAP.md) — Macrofases do projeto
- [DEVELOPMENT_GUIDELINES.md](docs/DEVELOPMENT_GUIDELINES.md) — Governança e padrão Conventional Commits
