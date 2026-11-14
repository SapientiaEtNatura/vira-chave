# VIRA CHAVE MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o MVP completo do VIRA CHAVE — plataforma educacional gratuita com jornada em 4 etapas (Descobrir, Aprender, Experimentar, Construir), Visão Educacional com privacidade por padrão e conformidade LGPD para adolescentes.

**Architecture:** Monolito modular em Next.js (App Router) + TypeScript organizado em *route groups* (`(public)`, `(app)`, `(educator)`, `(admin)`), com autenticação e RBAC via Auth.js v5 + Prisma ORM no PostgreSQL, validação via Zod e armazenamento local de evidências servido exclusivamente por rotas autenticadas/autorizadas (`ADR-008`).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Zod, Recharts, Prisma ORM, PostgreSQL 16, Auth.js (NextAuth v5), Vitest, Playwright.

**Spec:** [2026-11-14-mvp-design.md](file:///c:/Users/crodr/OneDrive/Área%20de%20Trabalho/ViraChave/docs/superpowers/specs/2026-11-14-mvp-design.md)

## Global Constraints

- Stack estrita conforme `ADR-001` a `ADR-010`: sem IA, sem marketplace, sem gamificação complexa, sem microserviços, sem integrações externas de LMS.
- Todos os commits devem seguir Conventional Commits (`ADR-005`).
- Arquivos de evidência (`EvidenceFile`) nunca são expostos em diretório público; são servidos apenas por `/api/files/[fileId]` após validação de sessão/RBAC ou token de portfólio ativo (`ADR-008`).
- Educação/Privacidade (LGPD): portfólio privado por padrão; educador nunca acessa respostas brutas do *Descobrir* nem projetos privados.
- Desativar instituição/turma (`active = false`) bloqueia apenas novos cadastros, sem suspender usuários já vinculados.

## Review Focus

- **Código de turma/instituição inválido ou inativo no `/cadastro`:** deve rejeitar o cadastro com erro claro sem criar `User` órfão no banco.
- **Upload de arquivo malicioso ou acima do limite:** deve validar tamanho máximo (5 MB) e assinatura real (*magic bytes* para PDF/PNG/JPG) no servidor, nunca confiando apenas no `Content-Type` do cliente.
- **Acesso cruzado entre perfis (IDOR / RBAC):** estudante A não pode ler/editar projeto ou arquivo de estudante B; educador não pode acessar turma de outro educador nem `/api/files/[fileId]` de portfólio privado.
- **Portfólio compartilhado após revogação (`/p/[token]`):** após revogar o link, `/p/[token]` e `/api/files/[fileId]?shareToken=...` devem retornar `404` imediatamente.
- **Exclusão de conta LGPD (`/app/conta`):** deve remover PII, arquivos do disco, projetos e links em transação/rotina atômica, mantendo `ConsentRecord` anonimizado (`userId = null`) e invalidando a sessão atual.

---

### Task 1: Scaffolding Next.js, Prisma Schema e Seed Inicial

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- Create: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`
- Test: `tests/unit/schema-seed.test.ts`

**Interfaces:**
- Produces: `prisma` singleton em `src/lib/db.ts` (`export const prisma: PrismaClient`), enums `Role`, `ProgressStatus`, `ConsentType` e modelos definidos na Seção 7 da Spec.

- [ ] **Step 1: Inicializar projeto Next.js + TypeScript + Tailwind + shadcn/ui + dependências**
  Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias` (ou equivalente preservando `docs/`, `infra/`, `.agents/`) e instalar `prisma @prisma/client next-auth@beta @auth/prisma-adapter zod recharts lucide-react bcryptjs` + devDeps `vitest @vitejs/plugin-react playwright @playwright/test @types/bcryptjs`.
- [ ] **Step 2: Escrever o teste de integridade do schema/seed**
  Em `tests/unit/schema-seed.test.ts`: `test_seed_creates_macroareas_questions_tracks_challenges` verificando que `prisma/seed.ts` é idempotente e cria ≥6 `MacroArea`, ≥15 `DiscoveryQuestion`, ≥3 `Track` e ≥3 `Challenge`.
- [ ] **Step 3: Rodar teste para verificar falha inicial**
  Run: `npx vitest run tests/unit/schema-seed.test.ts` — Expected: FAIL (schema/seed ausentes).
- [ ] **Step 4: Implementar `prisma/schema.prisma`, `src/lib/db.ts` e `prisma/seed.ts`**
  Modelar todas as entidades da Seção 7 da Spec com `onDelete: Cascade` adequado (exceto `ConsentRecord.userId` que usa `onDelete: SetNull` para retenção anonimizada pós-exclusão LGPD) e rodar `npx prisma migrate dev --name init` + `npx prisma db seed`.
- [ ] **Step 5: Rodar teste e verificar sucesso**
  Run: `npx vitest run tests/unit/schema-seed.test.ts` — Expected: PASS.
- [ ] **Step 6: Commit**
  `git add . && git commit -m "chore: initialize Next.js app, Prisma schema, and pilot seed"`

---

### Task 2: Auth.js v5, RBAC Guards, Cadastro (Turma/Instituição) e Termos LGPD

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/rbac.ts`, `src/lib/validations/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/reset-password/route.ts`
- Create: `src/app/(public)/login/page.tsx`, `src/app/(public)/cadastro/page.tsx`, `src/app/(public)/recuperar-senha/page.tsx`, `src/app/(public)/termos/page.tsx`, `src/app/(public)/privacidade/page.tsx`
- Test: `tests/unit/auth-registration.test.ts`

**Interfaces:**
- Consumes: `prisma` (`src/lib/db.ts`).
- Produces: `auth()` (`src/lib/auth.ts`), `requireRole(allowedRoles: Role[])` (`src/lib/rbac.ts` retornando `{ userId, role, institutionId? }` ou lançando redirect/401/403), `registerSchema` (`src/lib/validations/auth.ts`).

- [ ] **Step 1: Escrever testes unitários/integração de cadastro e RBAC**
  Em `tests/unit/auth-registration.test.ts`:
  - `test_student_signup_requires_active_classroom_invite_code` (rejeita código inexistente ou `active = false`).
  - `test_educator_signup_requires_active_institution_code_and_sigilo_consent` (vincula `institutionId` e grava `ConsentRecord` `SIGILO_EDUCADOR`).
  - `test_require_role_blocks_unauthorized_profile` (estudante tentando acessar rota de `EDUCADOR` ou `ADMIN` é bloqueado).
- [ ] **Step 2: Rodar testes para verificar falha**
  Run: `npx vitest run tests/unit/auth-registration.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `src/lib/auth.ts`, `src/lib/rbac.ts`, `src/lib/validations/auth.ts` e endpoints**
  Configurar Auth.js v5 (`Credentials` provider com `bcryptjs`, callbacks incluindo `id`, `role`, `institutionId` na sessão), validação de `inviteCode` ativo para `ESTUDANTE` e `institutionCode` ativo para `EDUCADOR`, registro de `ConsentRecord` (`TERMOS_USO`, `PRIVACIDADE`, `VINCULO_ESCOLAR`/`SIGILO_EDUCADOR`) e fluxo de reset de senha com token em banco.
- [ ] **Step 4: Implementar telas públicas (`/login`, `/cadastro`, `/recuperar-senha`, `/termos`, `/privacidade`)**
- [ ] **Step 5: Rodar testes para verificar sucesso**
  Run: `npx vitest run tests/unit/auth-registration.test.ts` — Expected: PASS.
- [ ] **Step 6: Commit**
  `git add . && git commit -m "feat(auth): add Auth.js v5, RBAC guards, signup codes, and LGPD consent"`

---

### Task 3: Landing Page (`/`) e Conta/Exclusão LGPD (`/app/conta`)

**Files:**
- Create: `src/app/(public)/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/app/conta/page.tsx`
- Create: `src/app/api/account/delete/route.ts`, `src/lib/lgpd/delete-account.ts`
- Test: `tests/unit/lgpd-delete.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`.
- Produces: `deleteStudentAccount(userId: string)` (`src/lib/lgpd/delete-account.ts`) que remove PII, projetos, share links e arquivos do disco mantendo `ConsentRecord` com `userId = null` e inserindo registro `EXCLUSAO_CONTA`.

- [ ] **Step 1: Escrever teste de exclusão LGPD**
  Em `tests/unit/lgpd-delete.test.ts`: `test_delete_account_purges_user_and_files_keeping_anonymized_consent` — verifica remoção de `User`, `PortfolioProject`, `PortfolioShareLink`, arquivo no disco, e retenção de `ConsentRecord` com `userId === null` e `type === 'EXCLUSAO_CONTA'`.
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/lgpd-delete.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `deleteStudentAccount`, `/api/account/delete`, layout `(app)` e telas `/` e `/app/conta`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/lgpd-delete.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(lgpd): add landing page and self-service account deletion"`

---

### Task 4: Jornada do Estudante — Minha Jornada (`/app`) e Descobrir (`/app/descobrir`)

**Files:**
- Create: `src/lib/discovery/scoring.ts`, `src/lib/student/stage.ts`
- Create: `src/app/api/discovery/submit/route.ts`
- Create: `src/app/(app)/app/page.tsx`, `src/app/(app)/app/descobrir/page.tsx`, `src/components/discovery/AffinityChart.tsx`
- Test: `tests/unit/discovery-scoring.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`.
- Produces: `calculateAffinityScores(answers: Record<string, number>, questions: DiscoveryQuestionWithWeights[])` (`src/lib/discovery/scoring.ts`), `computeStudentStage(studentId: string)` (`src/lib/student/stage.ts` retornando `'CONSTRUIR' | 'EXPERIMENTAR' | 'APRENDER' | 'DESCOBRIR'`).

- [ ] **Step 1: Escrever testes do motor de pontuação e cálculo de etapa**
  Em `tests/unit/discovery-scoring.test.ts`:
  - `test_scoring_engine_aggregates_likert_1_to_5_weights_deterministically`
  - `test_compute_student_stage_follows_highest_milestone`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/discovery-scoring.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `scoring.ts`, `stage.ts`, `/api/discovery/submit`, `AffinityChart.tsx` (Recharts), `/app` e `/app/descobrir`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/discovery-scoring.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(descobrir): add deterministic affinity quiz, chart, and student dashboard"`

---

### Task 5: Etapa Aprender — Trilhas e Progresso Semi-Automático (`/app/aprender`)

**Files:**
- Create: `src/app/api/tracks/[courseItemId]/start/route.ts`, `src/app/api/tracks/[courseItemId]/complete/route.ts`
- Create: `src/app/(app)/app/aprender/page.tsx`, `src/app/(app)/app/aprender/[trilhaId]/page.tsx`
- Test: `tests/unit/aprender-progress.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `saveEvidenceFile` (ou helper compartilhado de upload em `src/lib/storage/local-files.ts` — criar o helper já nesta task para reuso na Task 6).
- Produces: `saveEvidenceFile(file: File, ownerId: string)` e `deleteStoredFile(storageKey: string)` em `src/lib/storage/local-files.ts` (validando limite 5 MB e magic bytes PDF/PNG/JPG).

- [ ] **Step 1: Escrever testes de progresso semi-automático e validação de arquivo**
  Em `tests/unit/aprender-progress.test.ts`:
  - `test_start_course_transitions_to_em_andamento_with_started_at`
  - `test_complete_course_requires_non_empty_summary`
  - `test_upload_rejects_invalid_magic_bytes_or_oversized_file`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/aprender-progress.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `src/lib/storage/local-files.ts`, endpoints `/start` e `/complete`, e telas `/app/aprender` + `/app/aprender/[trilhaId]`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/aprender-progress.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(aprender): add curated tracks, semi-automatic progress, and safe file helper"`

---

### Task 6: Etapa Experimentar e Endpoint Protegido de Arquivos (`/app/experimentar` & `/api/files/[fileId]`)

**Files:**
- Create: `src/app/api/challenges/[desafioId]/submit/route.ts`, `src/app/api/files/[fileId]/route.ts`
- Create: `src/app/(app)/app/experimentar/page.tsx`, `src/app/(app)/app/experimentar/[desafioId]/page.tsx`
- Test: `tests/unit/experimentar-files.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `saveEvidenceFile` (`src/lib/storage/local-files.ts`).
- Produces: rota `GET /api/files/[fileId]` verificando se o usuário autenticado é o dono do arquivo OU se há `?shareToken=` válido e ativo vinculado a um projeto marcado como `isIncludedInShare = true`.

- [ ] **Step 1: Escrever testes de submissão de desafio e proteção de `/api/files/[fileId]`**
  Em `tests/unit/experimentar-files.test.ts`:
  - `test_submit_challenge_creates_portfolio_project_and_evidence_file`
  - `test_file_route_denies_other_student_and_educator_without_active_share_token`
  - `test_file_route_allows_owner_and_active_share_token_for_shared_project`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/experimentar-files.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `/api/challenges/[desafioId]/submit`, `/api/files/[fileId]` e telas `/app/experimentar` + `/app/experimentar/[desafioId]`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/experimentar-files.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(experimentar): add practical challenges and protected file serving route"`

---

### Task 7: Etapa Construir — Meu Portfólio (`/app/portfolio`) e Link Compartilhável (`/p/[token]`)

**Files:**
- Create: `src/app/api/portfolio/projects/route.ts`, `src/app/api/portfolio/projects/[id]/route.ts`, `src/app/api/portfolio/share/route.ts`
- Create: `src/app/(app)/app/portfolio/page.tsx`, `src/app/(public)/p/[token]/page.tsx`
- Test: `tests/unit/portfolio-share.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `saveEvidenceFile`, `deleteStoredFile`.
- Produces: gerenciamento de `PortfolioProject` (incluindo `isIncludedInShare`) e `PortfolioShareLink` (gerar/revogar token único criptográfico).

- [ ] **Step 1: Escrever testes de portfólio e revogação de link**
  Em `tests/unit/portfolio-share.test.ts`:
  - `test_portfolio_share_link_shows_only_included_projects_and_no_pii` (não expõe `email` nem `classroom`).
  - `test_revoked_share_link_returns_not_found`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/portfolio-share.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar APIs de portfólio/share e telas `/app/portfolio` + `/p/[token]`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/portfolio-share.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(construir): add private portfolio management and revocable share link"`

---

### Task 8: Área do Educador — Turmas e Visão Educacional (`/educador` & `/educador/turmas/[id]`)

**Files:**
- Create: `src/lib/educator/classroom-analytics.ts`
- Create: `src/app/api/educator/classrooms/route.ts`, `src/app/api/educator/classrooms/[id]/route.ts`
- Create: `src/app/(educator)/layout.tsx`, `src/app/(educator)/educador/page.tsx`, `src/app/(educator)/educador/turmas/[id]/page.tsx`
- Test: `tests/unit/educator-privacy.test.ts`

**Interfaces:**
- Consumes: `requireRole`, `prisma`, `computeStudentStage`.
- Produces: `getClassroomEducationalView(classroomId: string, educatorId: string)` retornando apenas agregados da turma + `{ studentId, name, currentStage, topMacroAreas }` por aluno (nunca respostas brutas nem projetos).

- [ ] **Step 1: Escrever testes da Visão Educacional e isolamento de turmas**
  Em `tests/unit/educator-privacy.test.ts`:
  - `test_educator_cannot_view_other_educator_classroom`
  - `test_educational_view_excludes_raw_answers_and_private_projects`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/educator-privacy.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar `classroom-analytics.ts`, endpoints `/api/educator/classrooms*`, layout `(educator)` e telas `/educador` + `/educador/turmas/[id]`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/educator-privacy.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(educador): add classroom management and privacy-preserving educational view"`

---

### Task 9: Área Admin — Curadoria e Instituições (`/admin/conteudo` & `/admin/instituicoes`)

**Files:**
- Create: `src/app/api/admin/content/route.ts`, `src/app/api/admin/institutions/route.ts`
- Create: `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/conteudo/page.tsx`, `src/app/(admin)/admin/instituicoes/page.tsx`
- Test: `tests/unit/admin-rbac.test.ts`

**Interfaces:**
- Consumes: `requireRole(['ADMIN'])`, `prisma`.
- Produces: CRUD mínimo de `MacroArea`, `DiscoveryQuestion`, `Track`, `CourseItem`, `Challenge`, `Institution` (com `institutionCode` e toggle `active`).

- [ ] **Step 1: Escrever teste de RBAC e desativação de instituição**
  Em `tests/unit/admin-rbac.test.ts`:
  - `test_non_admin_cannot_access_admin_endpoints`
  - `test_deactivating_institution_blocks_new_signups_only`
- [ ] **Step 2: Rodar teste para verificar falha**
  Run: `npx vitest run tests/unit/admin-rbac.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implementar endpoints `/api/admin/*`, layout `(admin)` e telas `/admin/conteudo` + `/admin/instituicoes`**
- [ ] **Step 4: Rodar teste para verificar sucesso**
  Run: `npx vitest run tests/unit/admin-rbac.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit**
  `git add . && git commit -m "feat(admin): add content curation and institution management screens"`

---

### Task 10: Suíte E2E (Playwright) e Verificação Completa do MVP

**Files:**
- Create: `tests/e2e/student-journey.spec.ts`, `tests/e2e/educator-lgpd-isolation.spec.ts`

**Interfaces:**
- Consumes: todas as 15 telas e APIs das Tasks 1–9.

- [ ] **Step 1: Escrever testes E2E Playwright**
  - `student-journey.spec.ts`: cadastro com código de turma → Descobrir → Aprender (clicar acessar + concluir com resumo) → Experimentar (submeter desafio) → Construir (gerar link `/p/[token]`, abrir em contexto anônimo, revogar e validar 404).
  - `educator-lgpd-isolation.spec.ts`: educador cria turma → vê visão agregada sem dados privados → estudante exclui conta em `/app/conta` → login falha após exclusão.
- [ ] **Step 2: Rodar suíte completa (Vitest + Playwright + Build + Lint)**
  Run: `npm run lint && npm run build && npx vitest run && npx playwright test` — Expected: ALL PASS.
- [ ] **Step 3: Commit**
  `git add . && git commit -m "test(e2e): add Playwright end-to-end journey and LGPD isolation tests"`
