# Roadmap de Remediação Priorizado — VIRA-CHAVE

**Regra:** Nenhuma correção foi aplicada na fase de auditoria. A execução abaixo aguarda aprovação do Tech Lead.

---

## Fase 1 — Prioridade Crítica / Alta (Pré-Produção Obrigatória)

| Ordem | ID | Ação de Remediação | Dependência | Validação Pós-Correção |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `SEC-01` / `QA-04` | **[CONCLUÍDO]** `tokenVersion` adicionado em `User`, incrementado em suspensão/role/troca/reset de senha, validado no callback `jwt`, e bloqueio de `newPassword === currentPassword`. | Migration / `db:push` | Teste de integração/E2E confirmando `401` ao reutilizar cookie após suspensão ou troca de senha. |
| **2** | `SEC-02` | **[CONCLUÍDO]** `redirect: "manual"` + revalidação de `Location` em `src/lib/link-checker.ts` (máx. 3 saltos). | Nenhuma | `tests/unit/security-phase1.test.ts` aprovado. |
| **3** | `QA-02` | **[CONCLUÍDO]** `createPortfolioProjectSchema` com limites máximos unificados em `src/lib/portfolio/portfolio-service.ts`. | Nenhuma | `tests/unit/security-phase1.test.ts` aprovado. |
| **4** | `QA-01` | **[ADIADO POR DECISÃO DO TECH LEAD]** Integrar envio de e-mail transacional em `POST /api/auth/reset-password` para `NODE_ENV === "production"` (mantido em backlog futuro). | Provedor SMTP/API | Teste com mock do provedor em `NODE_ENV=production` + E2E de fluxo completo. |

---

## Fase 2 — Prioridade Média (Hardening de Aplicação, LGPD & Borda)

| Ordem | ID | Ação de Remediação | Dependência | Validação Pós-Correção |
| :--- | :--- | :--- | :--- | :--- |
| **5** | `SEC-10` | **[CONCLUÍDO]** `student: { status: "ACTIVE" }` validado em `getSharedPortfolioByToken` e `authorizeAndReadFile`. | Nenhuma | `tests/unit/security-phase2.test.ts` aprovado. |
| **6** | `SEC-04` | **[CONCLUÍDO]** Guarda de objeto JSON (`null`/array -> `400`) em `portfolio/projects` e `educator/classrooms`, e retorno `500` seguro em `educator/classrooms` e `admin/content`. | Nenhuma | `tests/unit/security-phase2.test.ts` aprovado. |
| **7** | `SEC-05` | **[CONCLUÍDO]** `src/app/error.tsx` e `src/app/global-error.tsx` criados; `console.error` sanitizado em `api/auth/register/route.ts`. | Nenhuma | Revisão estática + TypeScript/ESLint. |
| **8** | `SEC-08` | **[CONCLUÍDO]** PDFs servidos com `Content-Disposition: attachment` e `Content-Security-Policy: sandbox` em `GET /api/files/[fileId]`. | Nenhuma | `tests/unit/security-phase2.test.ts` aprovado. |
| **9** | `SEC-03` & `SEC-06` | **[PARCIAL — CONFIG APLICADA]** `nginx.conf` atualizado com `set_real_ip_from` + `real_ip_header CF-Connecting-IP`, novos `limit_req` (`/api/challenges/`, `/api/portfolio/`, `/api/files/`, `/p/`) e restrição de `$forwarded_proto`. Pendente apenas Turnstile (requer chaves Cloudflare) e validação em staging. | Infra / Cloudflare | Validar `429` por IP e `Set-Cookie` em staging. |
| **10** | `SEC-07` | **[PARCIAL — MIDDLEWARE & HSTS APLICADOS]** `src/middleware.ts` criado para proteção de borda; `Strict-Transport-Security` adicionado em `next.config.ts` e `nginx.conf`. Migração de CSP `'unsafe-inline'` para `nonce` mantida para etapa futura. | Nenhuma | TypeScript/ESLint + validação de headers em produção. |
| **11** | `SEC-09` | **[PARCIAL — CLOUDFLARED & CI APLICADOS]** `cloudflared:2025.2.1` fixado no `docker-compose.yml` e `environment: production` adicionado no `ci-cd.yml`. Migração de `db push` para `prisma migrate deploy` + Named Tunnel dependem de inicialização de `prisma/migrations` e conta Cloudflare. | Infra / GitHub | `docker compose config` + staging. |
| **12** | `SEC-11` | **[PARCIAL — AUDIT NO CI]** `npm audit --omit=dev` adicionado no CI (`.github/workflows/ci-cd.yml`). Upgrades major (`next@16` / `prisma@7`) mantidos para janela planejada de regressão. | Regressão completa | `npm audit --omit=dev` + suíte completa após upgrade. |

---

## Fase 3 — Prioridade Baixa, Decisões de Produto/LGPD & Cobertura QA

| Ordem | ID | Ação de Remediação | Responsável |
| :--- | :--- | :--- | :--- |
| **13** | `SEC-12` | **[CONCLUÍDO]** `AUDIT_ACTIONS.AUTH_LOGIN_FAILED` integrado em `src/lib/auth.ts` para falhas de login (usuário inexistente/inativo ou senha incorreta). | Tech Lead / Dev |
| **14** | `SEC-13` | **[DECISÃO ARQUITETURAL / PRODUTO]** Validar se o contrato institucional escolar cobre o consentimento LGPD Art. 14 no piloto e se o `institutionCode` de educadores terá aprovação/rotação periódica. | Tech Lead / PM / Security |
| **15** | `QA-05` & `QA-06` | **[CONCLUÍDO]** `student: { status: "ACTIVE" }` filtrado em `classroom-analytics.ts`; exclusão de conta ocultada em `/app/conta` quando `role !== ESTUDANTE`. | Dev |
| **16** | `QA-07` & Cobertura | **[CONCLUÍDO]** `.agents/**` e `.github/**` ignorados em `eslint.config.mjs` (0 erros, 0 warnings); novos testes unitários adicionados em `security-phase1.test.ts`, `security-phase2.test.ts` e `security-phase3.test.ts`. | QA / Dev |
