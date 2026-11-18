# Inventário e Cobertura de Rotas — VIRA-CHAVE

**Total inventariado:** **22 páginas (App Router)** + **21 API Routes** + **0 Server Actions** (`"use server"` ausente em `src/`).

---

## 1. Páginas (Frontend / RSC) — 22 Rotas

| Rota | Arquivo | Auth / RBAC | Inspeção Estática | Cobertura de Testes (Unit / E2E) | Status / Achados |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `src/app/(public)/page.tsx` | Pública | Auditada | `landing-page-motion.spec.ts` (E2E não exec.) | OK |
| `/cadastro` | `src/app/(public)/cadastro/page.tsx` | Pública | Auditada | `auth-registration.test.ts` (serviço) | `SEC-03` (sem Turnstile) |
| `/login` | `src/app/(public)/login/page.tsx` | Pública | Auditada | `student-journey.spec.ts` (E2E não exec.) | `SEC-03` (sem Turnstile) |
| `/recuperar-senha` | `src/app/(public)/recuperar-senha/page.tsx` | Pública | Auditada | Sem teste dedicado | `QA-01` (sem e-mail prod) |
| `/privacidade` | `src/app/(public)/privacidade/page.tsx` | Pública | Inventariada | — | Estática |
| `/termos` | `src/app/(public)/termos/page.tsx` | Pública | Inventariada | — | Estática |
| `/p/[token]` | `src/app/(shared)/p/[token]/page.tsx` | Pública por token | Auditada | `portfolio-share.test.ts` (serviço) | `SEC-10` (não checa `student.status`) |
| `/app` | `src/app/(app)/app/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `student-journey.spec.ts` (E2E não exec.) | OK |
| `/app/descobrir` | `src/app/(app)/app/descobrir/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `discovery-scoring.test.ts` (scoring) | OK |
| `/app/aprender` | `src/app/(app)/app/aprender/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `aprender-progress.test.ts` (helper) | OK |
| `/app/aprender/[trilhaId]` | `src/app/(app)/app/aprender/[trilhaId]/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `aprender-progress.test.ts` (helper) | OK |
| `/app/experimentar` | `src/app/(app)/app/experimentar/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | — | OK |
| `/app/experimentar/[desafioId]` | `src/app/(app)/app/experimentar/[desafioId]/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | — | OK |
| `/app/portfolio` | `src/app/(app)/app/portfolio/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `portfolio-share.test.ts` | `QA-02` (criação sem maxLength) |
| `/app/conta` | `src/app/(app)/app/conta/page.tsx` | `STUDENT_PORTAL_ROLES` | Auditada | `lgpd-delete.test.ts` (serviço) | `QA-06` (UI delete visível a Admin) |
| `/educador` | `src/app/(educator)/educador/page.tsx` | `[EDUCADOR, ADMIN]` | Auditada | `educator-lgpd-isolation.spec.ts` (E2E não exec.) | OK |
| `/educador/turmas/[id]` | `src/app/(educator)/educador/turmas/[id]/page.tsx` | `[EDUCADOR, ADMIN]` | Auditada | `educator-privacy.test.ts` | `QA-05` (inclui suspensos) |
| `/admin` | `src/app/(admin)/admin/page.tsx` | `[ADMIN]` | Auditada | `admin-helpers.test.ts` | OK |
| `/admin/usuarios` | `src/app/(admin)/admin/usuarios/page.tsx` | `[ADMIN]` | Auditada | `admin-rbac.test.ts` | OK |
| `/admin/instituicoes` | `src/app/(admin)/admin/instituicoes/page.tsx` | `[ADMIN]` | Auditada | `admin-rbac.test.ts` | OK |
| `/admin/conteudo` | `src/app/(admin)/admin/conteudo/page.tsx` | `[ADMIN]` | Auditada | — | OK |
| `/admin/auditoria` | `src/app/(admin)/admin/auditoria/page.tsx` | `[ADMIN]` | Auditada | — | OK |

---

## 2. API Routes (Backend) — 21 Rotas

| Endpoint | Arquivo | Auth / RBAC | Validação / Ownership | Achados Associados |
| :--- | :--- | :--- | :--- | :--- |
| `GET/POST /api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth | Credentials + bcrypt | `SEC-01`, `SEC-03`, `SEC-06` |
| `POST /api/auth/register` | `src/app/api/auth/register/route.ts` | Pública | `registerSchema` (Zod) | `SEC-03`, `SEC-05`, `SEC-13` |
| `POST /api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` | Pública | Zod + SHA-256 token | `SEC-01`, `SEC-03`, `QA-01` |
| `POST /api/account/password` | `src/app/api/account/password/route.ts` | Autenticado | Verifica senha atual | `SEC-01`, `QA-04` |
| `DELETE /api/account/delete` | `src/app/api/account/delete/route.ts` | `[ESTUDANTE]` | Confirmação + LGPD delete | OK (UI `QA-06`) |
| `POST /api/discovery/submit` | `src/app/api/discovery/submit/route.ts` | `[ESTUDANTE, ADMIN]` | Zod + `studentId` sessão | Sem teste de rota dedicado |
| `POST /api/tracks/[courseItemId]/start` | `src/app/api/tracks/[courseItemId]/start/route.ts` | `[ESTUDANTE, ADMIN]` | `published: true` + sessão | Sem teste de rota dedicado |
| `POST /api/tracks/[courseItemId]/complete` | `src/app/api/tracks/[courseItemId]/complete/route.ts` | `[ESTUDANTE, ADMIN]` | `published: true` + sessão | Sem teste de rota dedicado |
| `POST /api/challenges/[desafioId]/submit` | `src/app/api/challenges/[desafioId]/submit/route.ts` | `[ESTUDANTE, ADMIN]` | Magic bytes + 5MB + sessão | Sem teste de rota dedicado |
| `GET/POST /api/portfolio/projects` | `src/app/api/portfolio/projects/route.ts` | `[ESTUDANTE, ADMIN]` | Ownership sessão | `SEC-04` (JSON `null`), `QA-02` (`maxLength`) |
| `PATCH/DELETE /api/portfolio/projects/[id]` | `src/app/api/portfolio/projects/[id]/route.ts` | `[ESTUDANTE, ADMIN]` | Zod + `studentId` sessão | OK (`api-patch-validation.test.ts`) |
| `GET/POST/DELETE /api/portfolio/share` | `src/app/api/portfolio/share/route.ts` | `[ESTUDANTE, ADMIN]` | SHA-256 + `studentId` | `SEC-10` (status no `/p/[token]`) |
| `GET /api/files/[fileId]` | `src/app/api/files/[fileId]/route.ts` | Sessão ou `shareToken` | `authorizeAndReadFile` | `SEC-08` (PDF inline), `SEC-10` |
| `GET/POST /api/educator/classrooms` | `src/app/api/educator/classrooms/route.ts` | `[EDUCADOR, ADMIN]` | `educatorId` sessão | `SEC-04` (JSON `null` / `throw`) |
| `GET/PATCH /api/educator/classrooms/[id]` | `src/app/api/educator/classrooms/[id]/route.ts` | `[EDUCADOR, ADMIN]` | `classroom.educatorId` | `QA-05` (métricas com suspensos) |
| `GET /api/admin/audit` | `src/app/api/admin/audit/route.ts` | `[ADMIN]` | `requireApiRole([ADMIN])` | Sem teste de rota dedicado |
| `GET /api/admin/classrooms` | `src/app/api/admin/classrooms/route.ts` | `[ADMIN]` | `requireApiRole([ADMIN])` | Sem teste de rota dedicado |
| `GET/POST/PATCH /api/admin/content` | `src/app/api/admin/content/route.ts` | `[ADMIN]` | Zod allowlist | `SEC-04` (`throw error`) |
| `POST /api/admin/content/check-links` | `src/app/api/admin/content/check-links/route.ts` | `[ADMIN]` | `isSafeExternalUrl` | `SEC-02` (SSRF redirect) |
| `GET/POST/PATCH /api/admin/institutions` | `src/app/api/admin/institutions/route.ts` | `[ADMIN]` | Zod allowlist | `SEC-01` (JWT após suspensão) |
| `GET/PATCH /api/admin/users` | `src/app/api/admin/users/route.ts` | `[ADMIN]` | Impede auto-suspensão | `SEC-01` (JWT após suspensão) |
