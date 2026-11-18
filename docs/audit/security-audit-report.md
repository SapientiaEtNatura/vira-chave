# Relatório Consolidado de Auditoria de Segurança e Qualidade — VIRA-CHAVE

**Data:** 2026-11-16  
**Escopo:** Auditoria integral somente leitura (Reconhecimento, Análise Estática, Testes Unitários/Lint/Audit e Análise Cruzada)  
**Agentes participantes:** `pentester` (Red Team), `security-engineer` (Blue Team), `qa-engineer` (QA / Test Engineering)  
**Restrição cumprida:** Nenhum arquivo de código-fonte, teste, migration, banco de dados ou configuração de infraestrutura foi modificado.

---

## 1. Parecer Geral e Sumário Executivo

- **Parecer de Segurança:** `Pendente de Mitigação` (`Riscos a Mitigar`)
- **Parecer de QA / Cobertura:** `Parcialmente Validado` — **61/61 testes unitários (Vitest) aprovados** e **0 erros no ESLint** (186 warnings em `.agents/**`), porém **suíte E2E (Playwright) não executada** por ausência de servidor/PostgreSQL ativos no ambiente de auditoria.
- **Resumo de Achados Consolidados (sem duplicidades):**
  - **CRÍTICO:** `0`
  - **ALTO:** `4` (`SEC-01`, `SEC-02`, `QA-01`, `QA-02`)
  - **MÉDIO:** `8` (`SEC-03`, `SEC-04`, `SEC-05`, `SEC-06`, `SEC-07`, `SEC-08`, `SEC-09`, `SEC-10`, `SEC-11` — 9 achados médios)
  - **BAIXO:** `3` (`SEC-12`, `SEC-13`, `QA-05`, `QA-06` — 4 achados baixos)
  - **INFORMATIVO:** `1` (`QA-07`)

### Pontos Fortes Confirmados
- **Isolamento Multi-Tenant e LGPD:** Queries de educador (`classroom-analytics.ts`), portfólio (`portfolio-service.ts`) e arquivos (`authorize-file.ts`) aplicam filtros estritos por `studentId`/`educatorId` da sessão, sem expor `reflection`, `notes`, e-mails ou respostas individuais no painel do educador.
- **Upload e Path Traversal (`local-files.ts`):** Validação de tamanho (5 MB), magic bytes (PDF/PNG/JPEG), correspondência de extensão, nomes `crypto.randomUUID()` e `resolveSafeStoragePath`.
- **SQL Injection & XSS em URLs:** Uso consistente de Prisma Client parametrizado (único `$queryRaw` é `SELECT 1`) e sanitização `http:`/`https:` para `externalUrl`.
- **Tokens e Exclusão LGPD:** `PasswordResetToken` e `PortfolioShareLink` armazenam hash SHA-256 (`tokenHash`); `delete-account.ts` anonimiza `ConsentRecord`, remove dados em `$transaction` e apaga evidências físicas.
- **Hardening Básico de Container:** `Dockerfile` roda como usuário `nextjs` (UID 1001), PostgreSQL sem porta exposta ao host e `no-new-privileges:true`.

---

## 2. Achados Consolidados (Análise Cruzada Red Team × Blue Team × QA)

### `SEC-01` — Sessão JWT Stateless sem Revogação após Suspensão, Alteração ou Reset de Senha
- **Severidade:** `ALTO`
- **Descoberto por:** `pentester` (`PT-01`), `security-engineer` (`SE-01`), `qa-engineer` (`QA-04`)
- **Arquivo / Rota afetada:** `src/lib/auth.ts` (L34, L85–100), `src/app/api/auth/reset-password/route.ts` (L64–76), `src/app/api/account/password/route.ts` (L70–75), `src/app/api/admin/users/route.ts` (L175–183), `src/app/api/admin/institutions/route.ts` (L281–284), `prisma/schema.prisma`
- **Descrição técnica:** O NextAuth v5 opera com `strategy: "jwt"` (`maxAge: 8 * 60 * 60`). O callback `jwt` só lê o usuário no login inicial (`if (user)`), sem validar `status === "ACTIVE"` nem um campo de versão de sessão (`tokenVersion`/`sessionVersion`) nas requisições subsequentes. Além disso, `POST /api/account/password` permite `newPassword === currentPassword`.
- **Cenário de exploração / reprodução:**
  1. Usuário (ou atacante com cookie capturado) autentica e obtém cookie JWT válido por 8h.
  2. Admin suspende a conta (`status = "SUSPENDED"`) ou o usuário redefine a senha em `/api/auth/reset-password` ou `/api/account/password`.
  3. O cookie JWT antigo continua aceito por `requireApiRole` / `requireRole` até expirar.
- **Evidências:** `src/lib/auth.ts:34,85-100`; `prisma/schema.prisma` (`model User`) não possui `tokenVersion`.
- **Impacto real:** Manutenção de acesso indevido a dados pessoais, reflexões e evidências de adolescentes (LGPD Art. 14) por até 8 horas após revogação ou comprometimento de senha.
- **Causa provável:** JWT stateless sem versionamento de credencial/sessão.
- **Mitigação recomendada:** Adicionar `tokenVersion Int @default(1)` em `User`, incrementá-lo em suspensão, mudança de `role`, troca e reset de senha; validar `status === "ACTIVE"` e `tokenVersion` no callback `jwt`. Impedir `newPassword === currentPassword` em `/api/account/password`.
- **Teste necessário:** Teste de integração/E2E: autenticar -> suspender ou trocar senha -> reutilizar cookie anterior esperando `401`/redirect.

---

### `SEC-02` — Bypass de Proteção SSRF via Redirecionamento HTTP (`redirect: "follow"`) e DNS Rebinding no Link Checker
- **Severidade:** `ALTO`
- **Descoberto por:** `pentester` (`PT-02`), `security-engineer` (`SE-04`)
- **Arquivo / Rota afetada:** `src/lib/link-checker.ts` (L145–185), `src/app/api/admin/content/check-links/route.ts` (L44–97)
- **Descrição técnica:** `isSafeExternalUrl` valida protocolo, hostnames locais e resolve DNS verificando `isPrivateOrReservedIp`, mas `checkExternalLink` executa `fetch(rawUrl, { method: "HEAD", redirect: "follow" })` (e fallback `GET` com `redirect: "follow"`). Um servidor externo pode responder `302` com `Location` para `127.0.0.1`, rede Docker ou `169.254.169.254`, sem revalidação, além da janela TOCTOU entre `dns.lookup` e o `fetch`.
- **Cenário de exploração / reprodução:** Um `CourseItem` aponta para domínio externo que responde `302 Found` -> `http://127.0.0.1:5432/` ou `http://169.254.169.254/latest/meta-data/`. Ao acionar `POST /api/admin/content/check-links`, o servidor segue o redirecionamento e grava `lastCheckStatus` / `lastCheckOk`.
- **Evidências:** `src/lib/link-checker.ts:172-184` (`redirect: "follow"`).
- **Impacto real:** SSRF parcial/blind contra serviços internos da rede Docker/host (atenuado por exigir role `ADMIN`).
- **Causa provável:** Uso de `redirect: "follow"` sem validação manual de saltos `3xx`.
- **Mitigação recomendada:** Usar `redirect: "manual"`, revalidar cada `Location` com `isSafeExternalUrl` (máximo 3 saltos) e considerar pinning do IP validado na conexão.
- **Teste necessário:** Teste unitário Vitest mockando `302 Location: http://127.0.0.1/` esperando `ok: false`.

---

### `SEC-03` — Rate Limit do Nginx por `$binary_remote_addr` Atrás do `cloudflared`, Cobertura Parcial e Ausência de Anti-Bot
- **Severidade:** `MÉDIO`
- **Descoberto por:** `pentester` (`PT-04`), `security-engineer` (`SE-04`)
- **Arquivo / Rota afetada:** `infra/server/nginx.conf` (L6–7, L21–31), `infra/server/docker-compose.yml` (L48–56), `src/app/api/auth/register/route.ts`, `src/lib/auth/register.ts` (L51–57)
- **Descrição técnica:** O Nginx aplica `limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=15r/m;` apenas em `/api/auth/(register|reset-password|callback)`. Como o tráfego passa pelo container `cloudflared`, `$binary_remote_addr` é o IP interno do túnel para todos os usuários. Rotas como `/api/files/*`, `/api/challenges/*/submit`, `/api/portfolio/*` e `/p/[token]` não têm rate limit, não há proteção anti-bot (ex.: Turnstile) e `registerUser` retorna `409 EMAIL_IN_USE` (enumeração de e-mails).
- **Evidências:** `infra/server/nginx.conf:6,21`; `src/lib/auth/register.ts:51-57`.
- **Impacto real:** Possível DoS global de autenticação com 15 req/min no túnel e enumeração de contas no cadastro.
- **Causa provável:** Falta de `set_real_ip_from` + `real_ip_header CF-Connecting-IP` no Nginx e ausência de rate limit/anti-bot na app.
- **Mitigação recomendada:** Configurar `real_ip_header CF-Connecting-IP` restrito à sub-rede Docker do túnel; ampliar `limit_req` para uploads, `/api/files/*` e `/p/*`; adicionar Cloudflare Turnstile em `/cadastro` e `/login`.
- **Teste necessário:** Teste com múltiplos `CF-Connecting-IP` atrás do túnel validando `429` isolado por IP cliente.

---

### `SEC-04` — Exceção Não Tratada (HTTP 500) com Payload JSON `null` e Relançamento de Erros
- **Severidade:** `MÉDIO`
- **Descoberto por:** `security-engineer` (`SE-02`)
- **Arquivo / Rota afetada:** `src/app/api/portfolio/projects/route.ts` (L67–81), `src/app/api/educator/classrooms/route.ts` (L52–62, L134), `src/app/api/admin/content/route.ts` (L270, L392, L449)
- **Descrição técnica:** `POST /api/portfolio/projects` (JSON) e `POST /api/educator/classrooms` acessam propriedades de `body` sem checar `!body || typeof body !== "object" || Array.isArray(body)` após `request.json()`. Enviar JSON `null` gera `TypeError` (HTTP 500, OWASP A10:2025). Há também `throw error` para erros não mapeados.
- **Evidências:** `src/app/api/portfolio/projects/route.ts:69-77`; `src/app/api/educator/classrooms/route.ts:54-62`.
- **Mitigação recomendada:** Validar objeto JSON não-nulo com Zod `safeParse` retornando `400` e tratar exceções inesperadas com resposta `500` genérica.
- **Teste necessário:** Teste Vitest enviando corpo `"null"` (`application/json`) esperando `400`.

---

### `SEC-05` — Ausência de `error.tsx` / `global-error.tsx` na Raiz e Log de Objeto `error` Bruto no Cadastro
- **Severidade:** `MÉDIO`
- **Descoberto por:** `security-engineer` (`SE-03`)
- **Arquivo / Rota afetada:** `src/app/error.tsx` (inexistente), `src/app/global-error.tsx` (inexistente), `src/app/api/auth/register/route.ts` (L42)
- **Descrição técnica:** Embora `(app)`, `(educator)` e `(admin)` tenham `error.tsx`, não há `src/app/error.tsx` nem `src/app/global-error.tsx`. Em `register/route.ts:42`, `console.error("Erro inesperado no cadastro:", error)` registra o objeto bruto.
- **Mitigação recomendada:** Criar `src/app/error.tsx` e `src/app/global-error.tsx` seguros e sanitizar logs em `register/route.ts` (logar apenas `error.message` sem PII/stack).
- **Teste necessário:** Teste unitário garantindo ausência de PII/stack nos logs em falha simulada de `register`.

---

### `SEC-06` — `AUTH_TRUST_HOST="true"` e Passthrough Irrestrito de `X-Forwarded-Proto`
- **Severidade:** `MÉDIO`
- **Descoberto por:** `pentester` (`PT-03`)
- **Arquivo / Rota afetada:** `infra/server/docker-compose.yml` (L28), `infra/server/nginx.conf` (L1–4, L28, L39)
- **Descrição técnica:** `nginx.conf` repassa `$http_x_forwarded_proto` enviado pelo cliente sem restringir a proxies confiáveis, e `AUTH_TRUST_HOST="true"` faz o NextAuth confiar nesses headers sem `AUTH_URL` explícito.
- **Mitigação recomendada:** Definir `AUTH_URL` explícito com `https://` em produção e forçar/restringir `X-Forwarded-Proto` no Nginx apenas a partir de `real_ip` confiável.
- **Teste necessário:** Verificar `Set-Cookie` em staging com `Secure; HttpOnly; SameSite=Lax`.

---

### `SEC-07` — Ausência de `middleware.ts`, CSP com `'unsafe-inline'` em Produção e Ausência de HSTS
- **Severidade:** `MÉDIO`
- **Descoberto por:** `pentester` (`PT-05`), `security-engineer` (`SE-04`)
- **Arquivo / Rota afetada:** `src/middleware.ts` (ausente), `next.config.ts` (L23–38), `infra/server/nginx.conf`
- **Descrição técnica:** Não há `middleware.ts` para defesa em profundidade nos prefixos protegidos; `next.config.ts` usa `script-src 'self' 'unsafe-inline'` em produção e não há cabeçalho `Strict-Transport-Security` (HSTS).
- **Mitigação recomendada:** Implementar `src/middleware.ts` para barreira inicial de sessão; adotar CSP com `nonce` removendo `'unsafe-inline'`; habilitar HSTS sob HTTPS.
- **Teste necessário:** Teste verificando `401`/redirect em rotas privadas sem cookie e presença de `Strict-Transport-Security`.

---

### `SEC-08` — Entrega de PDFs com `Content-Disposition: inline` no Mesmo Origin
- **Severidade:** `MÉDIO`
- **Descoberto por:** `pentester` (`PT-06`)
- **Arquivo / Rota afetada:** `src/app/api/files/[fileId]/route.ts` (L39–47)
- **Descrição técnica:** Arquivos PDF válidos nos magic bytes (`%PDF-`) são servidos com `Content-Disposition: inline`, permitindo renderização no visualizador nativo do navegador no mesmo origin.
- **Mitigação recomendada:** Servir PDFs com `Content-Disposition: attachment` e adicionar `Content-Security-Policy: sandbox` na resposta de `/api/files/[fileId]`.
- **Teste necessário:** Teste de rota validando os headers `Content-Disposition: attachment` e `Content-Security-Policy: sandbox` para PDFs.

---

### `SEC-09` — Hardening de Deploy: `cloudflared:latest` Efêmero, `prisma db push` em Produção e Runner `self-hosted` sem Aprovação
- **Severidade:** `MÉDIO`
- **Descoberto por:** `pentester` (`PT-07`), `security-engineer` (`SE-04`)
- **Arquivo / Rota afetada:** `infra/server/docker-compose.yml` (L49, L54), `infra/server/deploy.sh` (L29–43), `.github/workflows/ci-cd.yml` (L28–38)
- **Descrição técnica:** Uso de `cloudflare/cloudflared:latest` com `--url http://web:80` (URL efêmera), `prisma db push --skip-generate` em produção no `deploy.sh`, e job `deploy` em `self-hosted` sem `environment: production` com aprovação manual.
- **Mitigação recomendada:** Fixar versão do `cloudflared` com Named Tunnel; usar `prisma migrate deploy`; exigir `environment: production` no GitHub Actions.
- **Teste necessário:** Validar `docker compose config`, `prisma migrate deploy` em staging e proteção de branch/environment.

---

### `SEC-10` — Portfólio Compartilhado (`/p/[token]`) e Anexos Acessíveis para Estudantes Suspensos
- **Severidade:** `MÉDIO`
- **Descoberto por:** `qa-engineer` (`QA-03`)
- **Arquivo / Rota afetada:** `src/lib/portfolio/portfolio-service.ts` (L231–260), `src/lib/files/authorize-file.ts` (L105–126)
- **Descrição técnica:** `getSharedPortfolioByToken` e `authorizeAndReadFile` verificam `shareLink.active`, mas não verificam `student.status === "ACTIVE"`. Contas suspensas pelo Admin continuam com portfólio e anexos acessíveis via link público.
- **Mitigação recomendada:** Selecionar `student.status` e retornar `null`/404 caso `status !== "ACTIVE"`.
- **Teste necessário:** Teste unitário/integração validando `404` em `/p/[token]` e `/api/files/[fileId]?shareToken=...` para estudante suspenso.

---

### `SEC-11` — Vulnerabilidades em Dependências (`npm audit --omit=dev`) e `next-auth: "beta"`
- **Severidade:** `MÉDIO`
- **Descoberto por:** `security-engineer` (`SE-07`) + verificado via `npm.cmd audit --omit=dev`
- **Arquivo / Rota afetada:** `package.json` (L28–30), `package-lock.json`
- **Evidências:** Execução direta de `npm.cmd audit --omit=dev` retornou **5 vulnerabilidades (1 moderada, 4 altas)**: `deepmerge-ts <8.0.0` (High, GHSA-ggr8-5vv4-36mx via `prisma@6.19.0`) e `postcss <=8.5.22` (High/Moderate, GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 via `next@15.5.0`). Além disso, `next-auth` está como `"beta"`.
- **Mitigação recomendada:** Planejar atualização controlada de `next` e `prisma` (com regressão completa), adicionar step de `npm audit` no CI e monitorar versão estável do `next-auth`.
- **Teste necessário:** `npm audit --omit=dev` + regressão Vitest/Playwright após upgrade.

---

### `QA-01`, `QA-02`, `SEC-12`, `SEC-13`, `QA-05`, `QA-06`, `QA-07`
- **`QA-01` (ALTO):** Fluxo `/recuperar-senha` (`src/app/api/auth/reset-password/route.ts:121-125`) não possui envio de e-mail em `NODE_ENV === "production"` (apenas loga link em não-produção).
- **`QA-02` (ALTO):** `POST /api/portfolio/projects` (`createPortfolioProject` em `portfolio-service.ts:320-353`) não valida tamanhos máximos (`MAX_PROJECT_TITLE_LENGTH=150`, `MAX_PROJECT_SUMMARY_LENGTH=300`, `MAX_PROJECT_REFLECTION_LENGTH=5000`), diferente do `PATCH`.
- **`SEC-12` (BAIXO):** Política de senha exige apenas `min(8)` e `AUDIT_ACTIONS.AUTH_LOGIN_FAILED` (`audit.ts:14`) não é chamado em `auth.ts`.
- **`SEC-13` (BAIXO / Decisão LGPD):** Autoaceite de consentimento para menores (`register.ts:95-166`) e auto-cadastro imediato de `EDUCADOR` via `institutionCode` (avaliar aprovação/rotação de código e consentimento parental Art. 14).
- **`QA-05` (BAIXO):** `classroom-analytics.ts:84-114` inclui estudantes `SUSPENDED` nas métricas da turma.
- **`QA-06` (BAIXO):** `/app/conta` renderiza UI de exclusão de conta para `ADMIN` em preview, mas `DELETE /api/account/delete` bloqueia com `403`.
- **`QA-07` (INFORMATIVO):** `npm run lint` passou com `0` erros, mas `186` warnings provenientes de `.agents/skills/impeccable/scripts/*` (não ignorado no `eslint.config.mjs`).

---

## 3. Limitações Encontradas na Auditoria

1. **Suíte E2E (Playwright) não executada:** `playwright.config.ts` requer servidor ativo em `http://localhost:3000` e PostgreSQL populado; conforme restrições desta fase, nenhum servidor/banco foi alterado ou iniciado.
2. **Testes dinâmicos de Nginx / Cloudflare Tunnel em produção:** Não há ambiente de staging ativo acessível nesta sessão para validar flags reais de cookie (`Set-Cookie`) atrás do proxy nem comportamento ao vivo do `limit_req`.
3. **Varredura de histórico Git por conteúdo de commits:** Foi verificada a ausência de arquivos sensíveis (`.env`, `.pem`, `.htpasswd`) no histórico via `git log --all --name-only`, mas ferramenta dedicada como `gitleaks` não está instalada no ambiente.
