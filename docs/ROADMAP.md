# ROADMAP — VIRA CHAVE

> **Status do documento:** Rascunho inicial de macrofases do MVP  
> **Última atualização:** 2026-11-14  
> **Nota:** Prazos, datas e metas quantitativas estão **pendentes de decisão**.

---

## Fase 0 — Fundação e Definições Iniciais (Atual)
- [x] Estruturação da equipe multiagente de governança (`.agents/agents/`).
- [x] Criação da documentação central inicial (`docs/`).
- [x] Definição e aprovação da stack tecnológica e banco de dados (`ADR-003`, `ADR-004`).
- [x] Definição do padrão de commits Conventional Commits (`ADR-005`) e diretriz de hospedagem no Ubuntu Server (`ADR-006`).
- [ ] Inicialização do repositório Git, hook de Conventional Commits e projeto Next.js + Prisma.
- [ ] Configuração do ambiente Ubuntu Server (PostgreSQL, serviço da aplicação, túnel público HTTPS e auto-deploy).
- [ ] Definição dos requisitos detalhados do MVP e modelo de consentimento LGPD (`Product Manager` + `Security Engineer`).

## Fase 1 — Núcleo de Acesso, Perfis e Privacidade (LGPD)
- [ ] Cadastro e autenticação de estudantes e educadores.
- [ ] Fluxo de privacidade, termos e proteção especial para dados de adolescentes.
- [ ] Controle de acesso (isolamento entre contas de estudantes e restrições da visão educacional).

## Fase 2 — Jornada do Estudante (4 Etapas)
- [ ] **Descobrir:** fluxo de exploração de interesses, talentos e possibilidades profissionais.
- [ ] **Aprender:** listagem/trilhas de cursos gratuitos e registro de progresso.
- [ ] **Experimentar:** catálogo de desafios práticos e envio de atividades.
- [ ] **Construir:** geração e organização do portfólio pessoal com evidências de habilidades.

## Fase 3 — Visão Educacional de Talentos
- [ ] Painel restrito para educadores e instituições acompanharem interesses e habilidades em desenvolvimento, respeitando regras de privacidade.

## Fase 4 — Endurecimento, QA e Piloto
- [ ] Auditoria de segurança e conformidade LGPD (`Security Engineer`).
- [ ] Bateria completa de testes funcionais e de regressão com evidências (`QA Engineer`).
- [ ] Revisão documental final (`Documentation Engineer`) e preparação para ambiente piloto.

---

## Itens Explicitamente Postergados (Pós-MVP)
- Integração com inteligência artificial.
- Funcionalidades de marketplace.
- Gamificação complexa.
- Arquitetura distribuída / microserviços.
- Integrações externas não essenciais ao MVP.
