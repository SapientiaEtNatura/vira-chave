# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Público principal:** Estudantes do Ensino Médio e jovens em busca de orientação profissional, desenvolvimento de habilidades e preparação prática para o mundo do trabalho (uso 100% gratuito, sem anúncios).
- **Público secundário:** Educadores, escolas e instituições de ensino que organizam turmas por código de convite e acompanham interesses e evolução de forma agregada, respeitando a privacidade individual dos alunos.

## Product Purpose

Diminuir a distância entre a escola e o mundo profissional conectando autoconhecimento, estudo prático, experimentação e evidências reais em portfólio. O sucesso significa o estudante sair da dúvida para a ação concreta em quatro etapas progressivas: **Descobrir** (mapa de afinidades), **Aprender** (trilhas curtas e gratuitas), **Experimentar** (desafios práticos) e **Construir** (portfólio público compartilhável).

## Positioning

Diferente de testes vocacionais isolados ou plataformas corporativas de currículo, o VIRA CHAVE une descoberta de afinidades, trilhas de estudo, desafios práticos e portfólio com link compartilhável sob controle do estudante — com proteção especial de dados de adolescentes (LGPD *Privacy by Design*) e visão agregada para educadores sem expor respostas individuais.

## Operating Context

- Fluxo em 4 etapas contínuas (`Descobrir → Aprender → Experimentar → Construir`) na área do estudante (`/app`).
- Uso escolar e pessoal em notebooks/Chromebooks modestos e celulares, além de telas de apresentação.
- Área do educador (`/educador`) com gestão de turmas e gráficos agregados por área/etapa.
- Portfólio compartilhável via link público (`/p/[token]`) gerenciado pelo estudante.

## Capabilities and Constraints

- **Stack existente:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, GSAP (`useGSAP`, `ScrollTrigger`, `SplitText`), Recharts, Prisma + PostgreSQL.
- **Fora do escopo do MVP:** IA integrada, marketplace, gamificação complexa (pontos/streaks/confetes), microserviços.
- **Pendências de produto:** Curadoria final de parcerias externas de cursos, fluxo formal de consentimento parental LGPD e métricas avançadas de educadores.
- **Restrição técnica:** Manter animações GSAP acessíveis (`gsap.matchMedia()` para `prefers-reduced-motion`) e `src/app/(public)/page.tsx` como Server Component com ilhas `"use client"`.

## Brand Commitments

- **Nome:** VIRA CHAVE
- **Paleta institucional:** Manter a identidade teal (`#0F5C6E` / `#123F4A`) e âmbar (`#F59E0B`) da área logada (`/app`) para continuidade visual entre landing page e plataforma.
- **Tom:** Acolhedor, claro, educativo e direto — nunca corporativo nem infantilizado.

## Evidence on Hand

- Demonstração viva do Mapa de Afinidades (`AffinityPreviewCard` com 6 macroáreas reais e atualização sincronizada).
- Portfólio público real de demonstração em `/p/exemplo` (`DEMO_PORTFOLIO` com 2 projetos completos da estudante fictícia Marina Oliveira).
- **Ausências:** Nenhum número de alunos impactados, depoimento de escola ou parceiro externo confirmado para exibição pública; proibido inventar métricas ou testemunhos.

## Product Principles

1. **Clareza pedagógica antes de marketing:** explicar o percurso real das 4 etapas sem jargões corporativos.
2. **Aprender fazendo:** evidenciar que o estudo gera entregas práticas e portfólio real.
3. **Privacidade por concepção (LGPD):** proteção explícita de adolescentes; educadores veem tendências da turma, nunca respostas privadas.
4. **Acessibilidade e leveza:** funcionar bem em dispositivos escolares modestos e respeitar `prefers-reduced-motion`.
