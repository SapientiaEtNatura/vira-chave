# ARCHITECTURE — VIRA CHAVE

> **Status do documento:** Inicial (pré-definição de stack)  
> **Última atualização:** 2026-11-14

---

## 1. Estado Atual do Workspace

Na análise realizada em `2026-11-14`:
- O repositório não possui código-fonte implementado.
- Não há stack tecnológica, framework, banco de dados, ORM ou dependências definidas no projeto.
- Apenas a estrutura de governança multiagente (`.agents/agents/`) e a documentação central (`docs/`) estão presentes.

---

## 2. Princípios Arquiteturais Confirmados

1. **Aplicação Web Convencional e Simples:** Priorizar arquitetura monolítica modular ou full-stack unificada, evitando complexidade operacional prematura.
2. **Sem Microserviços no MVP:** Fronteiras lógicas bem definidas em código antes de qualquer separação física.
3. **Sem IA Integrada ou Integrações Desnecessárias no MVP:** Funcionalidades centrais devem operar de forma determinística e simples.
4. **Privacy by Design (LGPD):** Proteção especial para dados de adolescentes desde a modelagem de dados e controle de acesso.
5. **Escalabilidade Incremental:** Estrutura que permita evoluir módulos sem reescrita estrutural precoce.

---

## 3. Componentes Conceituais Previstos

A arquitetura lógica deverá contemplar, após definição da stack:
- **Módulo de Identidade, Perfis e Privacidade (LGPD):** Autenticação, papéis distintos (estudante, educador, instituição/parceiro) e gestão de consentimentos.
- **Módulo Descobrir:** Questionários/mapeamento de interesses, afinidades e áreas profissionais.
- **Módulo Aprender:** Catálogo de trilhas e cursos acessíveis, com registro de progresso do estudante.
- **Módulo Experimentar:** Desafios educativos e submissão de atividades práticas.
- **Módulo Construir (Portfólio):** Consolidação de projetos, competências e evidências com controle de visibilidade.
- **Módulo Visão Educacional:** Painel restrito para educadores acompanharem o desenvolvimento dos estudantes com estrito respeito à privacidade e minimização de dados.

---

## 4. Stack Tecnológica Aprovada (`ADR-003`, `ADR-004`, `ADR-006`)

- **Framework Full-Stack / Linguagem:** Next.js (App Router) + TypeScript
- **UI e Estilização:** Tailwind CSS + shadcn/ui + Lucide Icons
- **Validação e Gráficos:** Zod + Recharts
- **Banco de Dados e ORM:** PostgreSQL + Prisma ORM
- **Ambiente de Hospedagem Alvo:** Ubuntu Server (self-hosted em notebook dedicado), com atualização contínua via Git e acesso externo seguro para colaboradores.

---

- **Autenticação, RBAC e LGPD (`ADR-007`):** Auth.js (NextAuth v5) + Prisma Adapter no PostgreSQL local.
- **Armazenamento de Evidências (`ADR-008`):** Local no servidor (SSD 256 GB em volume Docker persistente), servido apenas por rotas autenticadas com validação de permissão.
- **Infraestrutura e Exposição (`ADR-009`):** Docker + Docker Compose (`/opt/virachave`) com PostgreSQL isolado, Nginx com Basic Auth e Cloudflare Quick Tunnel (`trycloudflare.com`).
- **Testes e Carga (`ADR-010`):** Vitest (unitário/integração), Playwright (E2E) e Grafana k6 (testes de carga em larga escala).
- **Auto-Deploy (`ADR-011`):** GitHub Actions Self-Hosted Runner no Ubuntu Server (aguardando criação do repositório remoto).
