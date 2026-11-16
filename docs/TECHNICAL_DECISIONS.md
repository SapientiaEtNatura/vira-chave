# TECHNICAL DECISIONS (ADRs) — VIRA CHAVE

> Este documento registra as decisões técnicas e arquiteturais relevantes do projeto VIRA CHAVE.  
> **Regra de governança:** Alterações de arquitetura exigem justificativa, análise de consequências, registro neste documento e aprovação do Tech Lead / responsável pelo projeto.

---

## Registro de Decisões

### ADR-001: Arquitetura Web Convencional e Contenção de Escopo do MVP
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** O VIRA CHAVE encontra-se em fase inicial de concepção e precisa validar sua proposta educacional (Descobrir, Aprender, Experimentar, Construir) com sustentabilidade técnica e baixo custo operacional.
- **Decisão:** Adotar uma arquitetura de aplicação web convencional, simples, funcional e escalável, evitando no MVP: microserviços, inteligência artificial integrada, marketplace, gamificação complexa e integrações externas desnecessárias.
- **Consequências:**
  - *Positivas:* Reduz custo de desenvolvimento, facilita manutenção por equipe enxuta e acelera a entrega de valor aos estudantes.
  - *Atenções:* Exige disciplina de escopo e modularização interna para não gerar acoplamento excessivo no futuro.

### ADR-002: Governança Multiagente Restrita ao Workspace
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** Necessidade de estruturar papéis especializados (PM, Arquiteto, Dev, QA, Code Reviewer, Security, Docs) sem substituir o agente principal e mantendo governança conservadora.
- **Decisão:** Configurar os 7 subagents exclusivamente no workspace em `.agents/agents/`, atuando sob coordenação do agente principal (Tech Lead), sem autoaprovação de trabalho e sem alterações não autorizadas de dependências ou dados.
- **Consequências:**
  - *Positivas:* Separação clara de responsabilidades, revisão independente e rastreabilidade documental.
  - *Atenções:* Requer orquestração disciplinada pelo Tech Lead.

### ADR-003: Stack Web Principal (Full-Stack TypeScript)
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** Necessidade de uma aplicação web convencional, simples, funcional e escalável que atenda landing page, plataforma do estudante e visão restrita do educador em um único projeto.
- **Decisão:** Adotar **Next.js (App Router) + TypeScript** como framework full-stack, **Tailwind CSS + shadcn/ui + Lucide Icons** para interface, **Zod** para validação de esquemas e **Recharts** para visualizações de evolução/talentos.
- **Consequências:**
  - *Positivas:* Base única em TypeScript, SSR/SEO nativo para páginas institucionais, Server Actions/API Routes integradas e desenvolvimento ágil mobile-first.
  - *Atenções:* Manter separação clara entre regras de domínio, validação e camada de apresentação.

### ADR-004: Banco de Dados e ORM
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** O domínio do VIRA CHAVE é relacional (estudantes, interesses, trilhas, cursos, desafios, projetos/evidências, educadores e permissões de privacidade).
- **Decisão:** Adotar **PostgreSQL** com **Prisma ORM**.
- **Consequências:**
  - *Positivas:* Tipagem forte end-to-end com TypeScript, migrações versionadas e compatibilidade tanto com execução local/self-hosted (Ubuntu Server) quanto em nuvem.
  - *Atenções:* Migrações destrutivas exigem autorização explícita conforme governança.

### ADR-005: Padrão de Commits (Conventional Commits)
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** Garantir histórico legível, rastreabilidade de entregas e compatibilidade com automações de CI/CD.
- **Decisão:** Todos os commits no repositório Git devem seguir a especificação **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `build:`, `style:`).
- **Consequências:**
  - *Positivas:* Histórico padronizado e claro para toda a equipe e agentes.
  - *Atenções:* Recomenda-se validação automática via hook (`commit-msg` / `commitlint`).

### ADR-006: Hospedagem Self-Hosted em Ubuntu Server com Auto-Deploy
- **Status:** Aprovada (detalhes de rede/túnel em definição)
- **Data:** 2026-11-14
- **Contexto:** O projeto será hospedado em um notebook dedicado com Ubuntu Server, devendo atualizar automaticamente a cada atualização no repositório Git e ficar acessível a colaboradores externos fora da rede local.
- **Decisão:** Hospedar a aplicação e o PostgreSQL no Ubuntu Server, utilizando automação de deploy a partir do repositório Git e exposição externa segura sem abertura direta de portas inseguras.
- **Consequências:**
  - *Positivas:* Custo zero de infraestrutura em nuvem e controle total do ambiente.
  - *Atenções:* Exige cuidado com backups do PostgreSQL, HTTPS obrigatório (LGPD) e proteção das variáveis de ambiente.

### ADR-007: Autenticação, Autorização (RBAC) e Fluxo LGPD
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** O VIRA CHAVE possui perfis distintos (`ESTUDANTE`, `EDUCADOR`, `INSTITUICAO`) com isolamento estrito de dados de adolescentes (LGPD). Avaliou-se **Supabase Auth (Free)** vs. **Auth.js (NextAuth v5) + Prisma Adapter** no PostgreSQL local.
  - *Análise do Supabase Free:* oferece até 50.000 MAUs gratuitos, porém **pausa projetos automaticamente após 7 dias de inatividade**, impõe limites de egress (5 GB/mês) e mantém dados de identidade em serviço externo.
- **Decisão:** Adotar **Auth.js (NextAuth v5) + Prisma Adapter** integrado diretamente ao **PostgreSQL local**, com controle de acesso por papel (RBAC) no backend e registro explícito de consentimento/termos LGPD no banco.
- **Consequências:**
  - *Positivas:* Zero risco de pausa por inatividade, sem limite de usuários ativos, conformidade LGPD simplificada (dados ficam 100% no servidor próprio) e compatibilidade total com testes de carga locais (k6) sem rate-limit externo.
  - *Atenções:* Exige implementação cuidadosa de hash de senha (ex.: Argon2/bcrypt), proteção CSRF/sessão e fluxo de recuperação de senha (SMTP a definir quando necessário).

### ADR-008: Armazenamento de Evidências e Arquivos de Portfólio
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** Estudantes publicarão evidências práticas (imagens, documentos, arquivos de projetos) na etapa **Construir**. O servidor dedicado possui SSD de 256 GB.
- **Decisão:** Adotar **armazenamento local no servidor** em volume Docker persistente dedicado, com **acesso mediado exclusivamente por rotas autenticadas da aplicação** (validação de dono, papel e visibilidade LGPD antes de entregar o arquivo — nunca exposto como diretório público direto no Nginx).
- **Consequências:**
  - *Positivas:* Alta eficiência de leitura/escrita no SSD local, custo zero de object storage e controle rígido de privacidade por arquivo.
  - *Atenções:* Necessário definir limite máximo por upload, validação de tipo MIME real e rotina periódica de backup do volume junto ao banco.

### ADR-009: Infraestrutura Docker e Exposição Segura no Ubuntu Server
- **Status:** Aprovada (Fase inicial sem domínio próprio)
- **Data:** 2026-11-14
- **Contexto:** O projeto será hospedado em um notebook dedicado com Ubuntu Server (`100.90.185.32` via Tailscale), sem domínio próprio adquirido neste momento, exigindo acesso HTTPS externo para colaboradores sem abrir portas no roteador e sem expor o servidor ou o banco de dados.
- **Decisão:** Adotar **Docker + Docker Compose** em `/opt/virachave` com três serviços isolados: `db` (PostgreSQL 16 em rede interna sem porta exposta), `web` (Nginx em `127.0.0.1:3000` com proteção Basic Auth na frente da aplicação) e `tunnel` (Cloudflare Quick Tunnel `trycloudflare.com` com conexão apenas de saída). O firewall (`UFW`) bloqueia entradas externas, permitindo apenas SSH e Tailscale.
- **Consequências:**
  - *Positivas:* Custo zero, zero portas abertas no roteador/firewall, banco isolado, acesso protegido por usuário/senha para colaboradores e fácil migração futura para domínio próprio no Cloudflare Tunnel.
  - *Atenções:* A URL `*.trycloudflare.com` muda caso o container `tunnel` seja recriado/reiniciado.

### ADR-010: Estratégia de Testes Automatizados e Testes de Carga
- **Status:** Aprovada
- **Data:** 2026-11-14
- **Contexto:** Necessidade de validar regras de negócio, isolamento de acesso entre perfis (LGPD) e verificar se o notebook servidor suporta alta demanda simultânea de usuários.
- **Decisão:** Adotar três camadas de verificação:
  1. **Vitest:** testes unitários e de integração (regras de domínio, validações Zod, permissões).
  2. **Playwright:** testes End-to-End (fluxos das 4 etapas e isolamento entre estudante/educador).
  3. **Grafana k6:** testes de carga e estresse em larga escala para medir latência, gargalos e capacidade máxima do servidor Ubuntu.
- **Consequências:**
  - *Positivas:* Cobertura completa (lógica, fluxo real no navegador e capacidade de infraestrutura).
  - *Atenções:* Testes pesados de k6 devem ser executados contra o ambiente local/staging de forma controlada para não degradar sessões ativas.

### ADR-011: Auto-Deploy Contínuo (CD) no Ubuntu Server
- **Status:** Aprovada (aguardando criação do repositório GitHub)
- **Data:** 2026-11-14
- **Contexto:** O servidor precisa atualizar automaticamente sempre que o repositório receber alterações na branch principal, sem expor porta SSH pública para a internet.
- **Decisão:** Adotar **GitHub Actions Self-Hosted Runner** instalado no próprio Ubuntu Server (executando como usuário `user`, com acesso ao Docker), acionado por `push` na branch `main` após aprovação dos checks de CI (lint, typecheck, testes).
- **Consequências:**
  - *Positivas:* Conexão apenas de saída para o GitHub (sem expor SSH), deploy automatizado com `docker compose up -d --build` e `npx prisma migrate deploy`.
  - *Atenções:* Migrações destrutivas continuam exigindo autorização explícita conforme governança.

### ADR-012: Otimização de Consultas Prisma e Adiamento de Cache
- **Status:** Aprovada
- **Data:** 2026-11-16
- **Contexto:** Medições com `EXPLAIN (ANALYZE, BUFFERS)` (1.000 estudantes, 4.000 progressos) mostraram queries críticas abaixo de `3 ms`, e teste de carga `k6` (50 VUs, 5.368 requisições, 0% erro) apontou `/app/aprender` (`p95 = 698.1 ms`), `/app/experimentar` (`p95 = 687.2 ms`) e `/app` (`p95 = 658.6 ms`) como os maiores `p95` do portal do estudante devido a queries redundantes (`computeStudentStage` duplicando contagens já feitas em `/app`) e `include` sem `select` mínimo (`description`/`scoresJson`).
- **Decisão:** Otimizar diretamente as consultas Prisma nas rotas do estudante (`resolveStageFromMilestones` com reuso das contagens e `select` mínimo em `/app`, `/app/aprender` e `/app/experimentar`) e **adiar** qualquer camada de cache (Next.js ou Redis).
- **Gatilho de reavaliação:** Reavaliar cache nativo do Next.js (`unstable_cache` com `revalidateTag`) **exclusivamente para catálogo público** (`MacroArea`, `Track`, `Challenge`) se `p95 SSR > 300 ms` com `> 5.000` usuários ativos ou `> 500` itens de catálogo após as otimizações de consulta. Cache externo (Redis) somente se `p95` de banco ultrapassar `500 ms` com pool saturado.
- **Consequências:**
  - *Positivas:* Redução imediata de queries por requisição sem risco de stale cache na curadoria nem complexidade operacional adicional no Ubuntu Server.
  - *Impacto LGPD:* Risco zero de vazamento de dados de estudantes/menores em cache compartilhado.

---

> **Todas as decisões arquiteturais iniciais (`ADR-001` a `ADR-012`) estão formalizadas.** Novas alterações estruturais devem ser registradas como novas ADRs neste arquivo.
