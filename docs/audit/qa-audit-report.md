# Relatório de Auditoria de Qualidade e Testes (QA) — VIRA-CHAVE

**Responsável:** `qa-engineer` + execuções de verificação somente leitura (`vitest`, `eslint`)  
**Escopo:** Execução das suítes automatizadas disponíveis, inspeção dos arquivos de teste e revisão funcional/validação de fluxos.

---

## 1. Execução das Suítes Existentes

| Comando | Status | Resultado Exato Observado |
| :--- | :--- | :--- |
| `npm test` (`vitest run`) | **Aprovado** | **12 arquivos de teste aprovados (12), 61 testes aprovados (61)** em `2.11s`. *(Nota: `tests/unit/admin-rbac.test.ts` imprime `stderr` esperado de `audit.ts` ao testar mock sem `auditLog.create`.)* |
| `npm run lint` (`eslint .`) | **Aprovado com warnings** | **0 erros, 186 warnings**. Todos os warnings reportados originam-se em scripts internos de `.agents/skills/impeccable/scripts/` (`live-browser.js`, `modern-screenshot.umd.js`), que não estão ignorados em `eslint.config.mjs`. |
| `npm run test:e2e` (`playwright test`) | **Não executado (Limitação de Ambiente)** | `playwright.config.ts` aponta para `http://localhost:3000` sem `webServer` automático; exige servidor Next.js ativo e PostgreSQL populado, não iniciados nesta fase somente leitura. |

### Arquivos de Teste Existentes no Repositório
- **Unitários (`tests/unit/` — 12 arquivos, 61 testes):**
  `admin-helpers.test.ts` (21), `api-patch-validation.test.ts` (17), `admin-rbac.test.ts` (3), `aprender-progress.test.ts` (3), `auth-registration.test.ts` (3), `experimentar-files.test.ts` (3), `discovery-scoring.test.ts` (2), `educator-privacy.test.ts` (2), `lgpd-delete.test.ts` (2), `portfolio-share.test.ts` (2), `schema-seed.test.ts` (2), `gsap-config.test.ts` (1).
- **E2E (`tests/e2e/` — 3 arquivos, não executados nesta fase):**
  `educator-lgpd-isolation.spec.ts`, `landing-page-motion.spec.ts`, `student-journey.spec.ts`.

---

## 2. Achados Funcionais, de Validação e Qualidade

### `QA-01` — Recuperação de Senha (`/recuperar-senha`) sem Envio de E-mail em Produção
- **Severidade:** `ALTO`
- **Arquivo / Rota:** `src/app/api/auth/reset-password/route.ts` (L98–132), `src/app/(public)/recuperar-senha/page.tsx`
- **Descrição técnica:** Ao solicitar redefinição com `{ email }`, a API cria o `PasswordResetToken`, mas apenas registra o link via `console.info` quando `NODE_ENV !== "production"`. Em produção não há envio de e-mail.
- **Cenário de reprodução:** Submeter `/recuperar-senha` com `NODE_ENV=production`; a API retorna `200 OK`, mas nenhum e-mail é enviado.
- **Impacto real:** Usuários em produção não conseguem recuperar senhas esquecidas de forma autônoma.
- **Mitigação recomendada:** Integrar serviço de e-mail transacional (ou desabilitar/alertar claramente na UI até a integração).
- **Teste necessário:** Teste de integração cobrindo disparo de e-mail em produção (mock de provedor) e consumo único do token.
- **Agente:** `qa-engineer`

### `QA-02` — Validação de Tamanho Máximo Ausente na Criação de Projeto (`POST /api/portfolio/projects`)
- **Severidade:** `ALTO`
- **Arquivo / Rota:** `src/lib/portfolio/portfolio-service.ts` (`createPortfolioProject`, L320–353 vs `updatePortfolioProjectSchema`, L20–78)
- **Descrição técnica:** `PATCH /api/portfolio/projects/[id]` valida `MAX_PROJECT_TITLE_LENGTH` (150), `MAX_PROJECT_SUMMARY_LENGTH` (300) e `MAX_PROJECT_REFLECTION_LENGTH` (5000) via Zod, mas `createPortfolioProject` valida apenas comprimentos mínimos (`MIN_PROJECT_TITLE_LENGTH = 2`, `MIN_PROJECT_REFLECTION_LENGTH = 10`).
- **Cenário de reprodução:** Criar projeto via `POST /api/portfolio/projects` com `title` > 150 ou `reflection` > 5000 chars (`201 Created`); qualquer edição subsequente via `PATCH` falha com `400`.
- **Impacto real:** Inconsistência funcional `POST` vs `PATCH` e ausência de teto de payload de texto na criação.
- **Mitigação recomendada:** Aplicar schema Zod unificado com limites mínimo e máximo tanto em `createPortfolioProject` quanto no update.
- **Teste necessário:** Teste unitário rejeitando (`400`) `title`, `summary` e `reflection` acima do limite no `POST`.
- **Agente:** `qa-engineer`

### `QA-03` — Portfólio Compartilhado (`/p/[token]`) e Anexos Acessíveis para Estudantes Suspensos
- **Severidade:** `MÉDIO` (também consolidado como `SEC-10`)
- **Arquivo / Rota:** `src/lib/portfolio/portfolio-service.ts` (L231–260), `src/lib/files/authorize-file.ts` (L105–126)
- **Descrição técnica:** `getSharedPortfolioByToken` e `authorizeAndReadFile` não verificam `student.status === "ACTIVE"`.
- **Mitigação recomendada:** Selecionar `status` do estudante e retornar `null`/`404` quando `status !== "ACTIVE"`.
- **Teste necessário:** Teste unitário garantindo `404` para conta suspensa com link de compartilhamento ativo.
- **Agente:** `qa-engineer`

### `QA-04` — Troca/Redefinição de Senha não Invalida JWT Ativo e Aceita Mesma Senha
- **Severidade:** `MÉDIO` (consolidado com `SEC-01`)
- **Arquivo / Rota:** `src/app/api/account/password/route.ts` (L70–76), `src/lib/auth.ts` (L34, L84–101)
- **Descrição técnica:** Sessões JWT existentes continuam válidas até 8h e `POST /api/account/password` aceita `newPassword === currentPassword`.
- **Mitigação recomendada:** Implementar `tokenVersion` no `User` e bloquear `newPassword === currentPassword`.
- **Teste necessário:** Teste validando rejeição da nova senha igual à atual e invalidação do cookie anterior.
- **Agente:** `qa-engineer`

### `QA-05` — Visão do Educador (`/educador/turmas/[id]`) Inclui Estudantes Suspensos nas Métricas
- **Severidade:** `BAIXO`
- **Arquivo / Rota:** `src/lib/educator/classroom-analytics.ts` (L84–114)
- **Descrição técnica:** Query de `enrollments` não filtra `student: { status: "ACTIVE" }`.
- **Mitigação recomendada:** Filtrar `enrollments` por `student: { status: "ACTIVE" }` (ou exibir indicador explícito).
- **Teste necessário:** Teste unitário em `educator-privacy.test.ts` com estudante `SUSPENDED`.
- **Agente:** `qa-engineer`

### `QA-06` — UI de `/app/conta` Exibe Exclusão de Conta para `ADMIN` em Modo Preview
- **Severidade:** `BAIXO`
- **Arquivo / Rota:** `src/app/(app)/app/conta/page.tsx` (L23), `src/app/(app)/app/conta/AccountControls.tsx`, `src/app/api/account/delete/route.ts` (L19)
- **Descrição técnica:** Página aceita `ADMIN` via `STUDENT_PORTAL_ROLES`, exibindo o bloco de exclusão permanente, enquanto a API exige estritamente `ESTUDANTE` (`403` para `ADMIN`).
- **Mitigação recomendada:** Passar `canDelete={authUser.role === Role.ESTUDANTE}` para `AccountControls`.
- **Teste necessário:** Teste de componente verificando ocultação/desabilitação do botão para `ADMIN`.
- **Agente:** `qa-engineer`

### `QA-07` — 186 Warnings do ESLint em `.agents/skills/impeccable/scripts/*`
- **Severidade:** `INFORMATIVO`
- **Arquivo / Rota:** `eslint.config.mjs`
- **Descrição técnica:** `npm run lint` executa sem erros no código de produto (`src/`), mas reporta 186 warnings em scripts de skills dentro de `.agents/`.
- **Mitigação recomendada:** Avaliar inclusão de `.agents/**` em `ignores` no `eslint.config.mjs`.
- **Agente:** `qa-engineer`

---

## 3. Lacunas de Cobertura de Testes Automatizados Identificadas
- **Rotas sem testes unitários/API dedicados:** `/api/auth/reset-password`, `/api/account/password`, `/api/discovery/submit`, `/api/tracks/[courseItemId]/start` & `complete`, `/api/challenges/[desafioId]/submit` (upload completo end-to-end da rota), `/api/educator/classrooms` (`GET`/`POST`/`PATCH`), `/api/admin/content/check-links` (SSRF redirect), `/api/admin/audit`, `/api/admin/users`, `/api/admin/classrooms`.
- **Fluxos sem teste de regressão de segurança:** Invalidação de JWT após suspensão/troca de senha (`SEC-01`), payload JSON `null` (`SEC-04`), e E2E de `/educador`, `/admin`, `/recuperar-senha` e `/p/[token]` (atualmente apenas 3 specs E2E existem e não foram executados nesta fase).
