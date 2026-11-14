# Design do MVP — VIRA CHAVE

> **Status:** Aprovado  
> **Data:** 2026-11-14  
> **Referências:** [PROJECT_BRIEF.md](file:///c:/Users/crodr/OneDrive/Área%20de%20Trabalho/ViraChave/docs/PROJECT_BRIEF.md), [ARCHITECTURE.md](file:///c:/Users/crodr/OneDrive/Área%20de%20Trabalho/ViraChave/docs/ARCHITECTURE.md), [TECHNICAL_DECISIONS.md](file:///c:/Users/crodr/OneDrive/Área%20de%20Trabalho/ViraChave/docs/TECHNICAL_DECISIONS.md)

---

## 1. Intenção e Porquê

O **VIRA CHAVE** é uma plataforma educacional gratuita para estudantes do Ensino Médio e jovens descobrirem seus talentos, desenvolverem habilidades, praticarem em desafios reais e organizarem um portfólio com evidências concretas.

O MVP existe para validar a jornada completa em **4 etapas** (**Descobrir → Aprender → Experimentar → Construir**) em ambiente piloto com **escolas e instituições parceiras**, garantindo conformidade estrita com a **LGPD** para dados de adolescentes (*Privacy by Design*).

---

## 2. Objetivos, Não-Objetivos e Anti-Objetivos

### Objetivos (Goals)
- Permitir que estudantes vinculados a uma escola/turma parceira percorram as 4 etapas de forma simples e mobile-first.
- Entregar um fluxo determinístico de descoberta de afinidades por macroáreas que conecte diretamente às trilhas de aprendizagem.
- Permitir registro de evidências práticas (texto, link ou arquivo) em um portfólio privado por padrão, compartilhável via link único revogável.
- Disponibilizar aos educadores uma **Visão Educacional** agregada da turma + resumo de etapa/interesses por aluno, sem expor dados privados ou respostas brutas.

### Não-Objetivos (Non-Goals — Pós-MVP)
- Cadastro aberto para menores sem vínculo de escola/turma parceira.
- Inteligência artificial generativa ou recomendações por ML.
- Gamificação complexa (rankings, moedas, ligas, avatares).
- Marketplace, integração com APIs de plataformas externas de cursos (LMS/SCORM) ou hospedagem de videoaulas próprias.
- Microserviços ou apps nativos mobile.

### Anti-Objetivos (Anti-Goals — O que seria falha mesmo funcionando)
- Expor dados pessoais, respostas íntimas do questionário ou arquivos de menores publicamente ou a educadores sem consentimento.
- Criar atrito de cadastro que impeça alunos de concluir a entrada em sala de aula.
- Transformar a Visão Educacional em ferramenta de vigilância ou avaliação punitiva (notas/provas).

---

## 3. Restrições e Stack Aprovada

Conforme [TECHNICAL_DECISIONS.md](file:///c:/Users/crodr/OneDrive/Área%20de%20Trabalho/ViraChave/docs/TECHNICAL_DECISIONS.md) (`ADR-001` a `ADR-011`):
- **Framework:** Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui + Lucide Icons, Zod, Recharts.
- **Banco e ORM:** PostgreSQL 16 + Prisma ORM.
- **Autenticação e RBAC:** Auth.js (NextAuth v5) + Prisma Adapter no PostgreSQL local (`ESTUDANTE`, `EDUCADOR`, `ADMIN`).
- **Armazenamento de arquivos (`ADR-008`):** Volume local persistente no servidor, servido **exclusivamente** por rotas autenticadas/autorizadas da aplicação (nunca diretório estático público no Nginx).
- **Hospedagem e Testes:** Docker Compose em Ubuntu Server (`ADR-009`), Vitest + Playwright + k6 (`ADR-010`).

---

## 4. Abordagens Consideradas e Decisão

1. **Monolito modular no Next.js (App Router) com Route Groups por perfil — ESCOLHIDA:**
   - Um único projeto Next.js organizado por *route groups* (`(public)`, `(app)`, `(educator)`, `(admin)`), com Server Actions / Route Handlers validados por Zod e RBAC no servidor.
   - *Por quê:* Alinha-se 100% às `ADR-001` e `ADR-003`, reduz custo operacional no Ubuntu Server e simplifica a proteção de rotas e arquivos LGPD.
2. **Frontend SPA separado + API REST dedicada — DESCARTADA:**
   - Duplica deploy, CORS, autenticação entre domínios e manutenção sem ganho no MVP.
3. **Microserviços por etapa (Descobrir, Aprender, Portfólio) — DESCARTADA:**
   - Viola explicitamente a `ADR-001`.

---

## 5. Regras de Produto, LGPD e Termos Decididos

1. **Cadastro, Vínculo Institucional e Consentimento Parental (LGPD):**
   - Entrada do **Estudante** mediada por **Código de Turma** (`inviteCode`) fornecido por escola/instituição parceira (que coleta previamente o termo dos responsáveis legais). No MVP, cada estudante vincula-se a uma turma no cadastro.
   - Entrada do **Educador** mediada por **Código Institucional** (`institutionCode`) gerado pelo Admin em `/admin/instituicoes`, vinculando o educador automaticamente à instituição no `/cadastro`.
   - No cadastro, o estudante aceita **Termos de Uso** e **Política de Privacidade** (linguagem clara para adolescentes), com registro de versão e timestamp no banco.
   - O **Educador** aceita o **Termo de Compromisso e Sigilo** antes de acessar a Visão Educacional.
   - Desativar uma turma ou instituição (`active = false`) bloqueia apenas **novos cadastros** com aquele código; usuários já vinculados mantêm acesso normal às suas contas e portfólios.
2. **Visão Educacional (Privacidade por Padrão):**
   - Educador visualiza apenas turmas às quais está vinculado: **gráficos agregados da turma** (distribuição de interesses/macroáreas e progresso nas 4 etapas) + **lista resumida por aluno** (nome, etapa atual e top macroáreas de interesse).
   - Educador **não** acessa respostas individuais do questionário nem projetos/evidências privadas do portfólio (a menos que o aluno envie um link de compartilhamento).
3. **Portfólio (Construir):**
   - **Privado por padrão.** O estudante pode gerar um **link único com token** (`/p/[token]`) em modo somente-leitura e revogá-lo/regenerá-lo a qualquer momento.
   - Arquivos anexados às evidências são servidos via endpoint autenticado (ou validado pelo token ativo do portfólio quando marcado como compartilhável nesse portfólio).
4. **Navegação entre Etapas e Descobrir (Determinístico):**
   - **Navegação livre** entre as 4 etapas desde o primeiro acesso (o dashboard `/app` recomenda começar pelo *Descobrir*, sem bloquear rotas).
   - Questionário situacional de **15 a 20 perguntas** em **escala uniforme de 1 a 5** (*Nada a ver comigo* a *Tudo a ver comigo*), multiplicada pelo mapa `weightsByArea` de cada pergunta para **macroáreas** (ex.: Tecnologia & Dados, Comunicação & Arte, Negócios & Empreendedorismo, Impacto Social & Educação, Saúde & Bem-estar, Maker & Ciências).
   - Gera **Mapa de Afinidades** (gráfico Recharts + top áreas/habilidades) e recomenda trilhas da etapa *Aprender*. O aluno pode refazer o questionário.
5. **Aprender (Trilhas Curadas — Progresso Semi-Automático):**
   - Trilhas organizadas por macroárea contendo módulos/cursos com **links externos gratuitos** (ex.: Sebrae, Fundação Bradesco, EV.G).
   - **Transição automática ao acessar:** ao clicar em *"Acessar curso"*, o status muda automaticamente de `NAO_INICIADO` para `EM_ANDAMENTO` (registrando `startedAt`).
   - **Conclusão com evidência:** para marcar `CONCLUIDO`, o estudante registra um **mini-resumo do que aprendeu** (obrigatório) e pode anexar o **certificado** (opcional), conteúdo que fica pronto para ser aproveitado no Portfólio.
6. **Experimentar (Desafios Práticos):**
   - Catálogo de desafios educativos vinculados às macroáreas/trilhas.
   - O estudante submete uma **atividade/evidência** (descrição, link externo e/ou arquivo), que pode ser promovida para o seu Portfólio.

---

## 6. Mapa Completo de Telas do MVP (15 Telas)

### Grupo `(public)` — Público e Acesso
1. **Landing Page (`/`):** Apresentação do VIRA CHAVE, as 4 etapas e botões de Entrar / Cadastrar.
2. **Login (`/login`) e Recuperação de Senha (`/recuperar-senha`):** Autenticação via Auth.js.
3. **Cadastro (`/cadastro`):** Escolha de perfil (Estudante com campo obrigatório de *Código de Turma*; Educador com solicitação/código institucional) + aceite obrigatório dos Termos/Privacidade.
4. **Termos e Privacidade (`/termos`, `/privacidade`):** Textos legais, política LGPD para adolescentes e Termo de Sigilo do Educador.

### Grupo `(app)` — Área do Estudante (RBAC: `ESTUDANTE`)
5. **Minha Jornada (`/app`):** Dashboard com resumo do progresso nas 4 etapas, macroáreas identificadas e atalhos para o próximo passo.
6. **Descobrir (`/app/descobrir`):** Fluxo do questionário situacional (15–20 perguntas) + tela de resultado (gráfico radar/barras de afinidades e trilhas recomendadas).
7. **Aprender — Catálogo e Detalhe (`/app/aprender`, `/app/aprender/[trilhaId]`):** Listagem de trilhas filtrável por macroárea + página da trilha com lista de cursos (botão *"Acessar curso"* que inicia `EM_ANDAMENTO` automaticamente) e fluxo de conclusão com mini-resumo obrigatório + anexo opcional de certificado.
8. **Experimentar — Desafios e Submissão (`/app/experimentar`, `/app/experimentar/[desafioId]`):** Catálogo de desafios práticos + formulário de entrega (texto reflexivo, URL e/ou upload de arquivo).
9. **Construir — Meu Portfólio (`/app/portfolio`):** Organização dos projetos e evidências (vindos de desafios ou adicionados diretamente), pré-visualização e controle do **link de compartilhamento** (gerar, copiar, revogar).
10. **Portfólio Compartilhado (`/p/[token]`):** Visualização pública somente-leitura acessível apenas por token ativo, exibindo projetos selecionados sem expor e-mail, turma ou dados sensíveis do menor.
11. **Minha Conta e Privacidade (`/app/conta`):** Dados básicos, histórico de consentimentos aceitos, alteração de senha e solicitação/execução de exclusão de conta (LGPD).

### Grupo `(educator)` — Área do Educador (RBAC: `EDUCADOR`)
12. **Minhas Turmas (`/educador`):** Listagem das turmas do educador, criação de nova turma e geração/cópia do **Código de Turma**.
13. **Visão Educacional da Turma (`/educador/turmas/[id]`):** Gráficos agregados (afinidades da turma, distribuição de progresso nas 4 etapas) + tabela resumida de alunos (nome, etapa atual, principais macroáreas).

### Grupo `(admin)` — Curadoria e Gestão Mínima (RBAC: `ADMIN`)
14. **Gestão de Conteúdo (`/admin/conteudo`):** CRUD simples de macroáreas, perguntas do *Descobrir*, trilhas, cursos externos e desafios práticos.
15. **Gestão de Instituições e Educadores (`/admin/instituicoes`):** Cadastro de escolas/instituições parceiras e aprovação/ativação de contas de educadores.

---

## 7. Modelo Conceitual de Dados (Esboço Prisma)

- **User:** `id`, `name`, `email`, `passwordHash`, `role` (`ESTUDANTE` | `EDUCADOR` | `ADMIN`), `institutionId?` (para `EDUCADOR`), `status`, `createdAt`.
- **ConsentRecord:** `id`, `userId?` (nulável após exclusão para prova legal anonimizada), `anonymizedRef?`, `type` (`TERMOS_USO` | `PRIVACIDADE` | `SIGILO_EDUCADOR` | `VINCULO_ESCOLAR` | `EXCLUSAO_CONTA`), `version`, `acceptedAt`.
- **Institution & Classroom:** `Institution` (`id`, `name`, `institutionCode`, `active`); `Classroom` (`id`, `institutionId`, `educatorId`, `name`, `inviteCode`, `active`); `ClassroomEnrollment` (`classroomId`, `studentId`, `enrolledAt`).
- **Descobrir:** `MacroArea` (`id`, `name`, `slug`, `description`), `DiscoveryQuestion` (`id`, `prompt`, `order`, `weightsByArea`), `DiscoveryResult` (`id`, `studentId`, `scoresJson`, `topAreas`, `completedAt`).
- **Aprender:** `Track` (`id`, `macroAreaId`, `title`, `description`, `published`), `CourseItem` (`id`, `trackId`, `title`, `providerName`, `externalUrl`, `order`), `CourseProgress` (`studentId`, `courseItemId`, `status`, `notes`, `certificateFileId`, `startedAt`, `completedAt`, `updatedAt`).
- **Experimentar & Construir:** `Challenge` (`id`, `macroAreaId`, `title`, `description`, `published`), `PortfolioProject` (`id`, `studentId`, `challengeId?`, `title`, `summary`, `reflection`, `externalUrl?`, `isIncludedInShare`, `createdAt`), `EvidenceFile` (`id`, `projectId`, `storageKey`, `originalName`, `mimeType`, `sizeBytes`), `PortfolioShareLink` (`id`, `studentId`, `tokenHash` ou `token`, `active`, `createdAt`, `revokedAt`).

---

## 8. Decisões Padronizadas (Calls Técnicos) e O que fica para o Construtor

### Decisões padronizadas após revisão técnica
- **Exclusão de conta LGPD (`/app/conta`):** Autoatendimento imediato pelo estudante. Remove PII do `User`, revoga/apaga `PortfolioShareLink`, apaga projetos e remove os arquivos `EvidenceFile` do disco imediatamente; mantém apenas `ConsentRecord` anonimizado (`userId = null`) como prova legal.
- **Cálculo de "etapa atual" na Visão Educacional:** Determinístico pelo marco mais avançado do aluno (`Construir`: ≥1 projeto no portfólio; `Experimentar`: ≥1 desafio submetido; `Aprender`: ≥1 curso `EM_ANDAMENTO` ou `CONCLUIDO`; caso contrário `Descobrir`).

### O que fica a cargo do Construtor (Builder Decisions)

- Estrutura interna de pastas/componentes dentro dos *route groups* do Next.js.
- Copy de interface, microinterações, design visual com Tailwind + shadcn/ui e responsividade mobile-first.
- Implementação de hash de senha (`Argon2` ou `bcryptjs`), validação de upload (limites de tamanho, whitelist de MIME types como PDF/PNG/JPG e verificação de magic bytes) e fluxo de reset de senha (token em banco + log/SMTP).
- Script de `prisma/seed.ts` com um conjunto inicial funcional de macroáreas, 15 perguntas do *Descobrir*, 3–4 trilhas com cursos gratuitos reais e 3–4 desafios práticos para o piloto.
- Detalhes dos testes automatizados (Vitest para regras de negócio/RBAC e Playwright para fluxos das 4 etapas e isolamento LGPD).
