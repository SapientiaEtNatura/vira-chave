# DEVELOPMENT GUIDELINES — VIRA CHAVE

> **Status do documento:** Ativo (regras de governança definidas; padrões específicos de stack pendentes de decisão)  
> **Última atualização:** 2026-11-14

---

## 1. Regras de Governança da Equipe Multiagente

1. **Orquestração:** O agente principal atua como **Tech Lead** e orquestrador do fluxo de trabalho.
2. **Separação de Aprovação:** Nenhum agente pode aprovar sozinho o próprio trabalho.
3. **Mudanças Arquiteturais:** Alterações de arquitetura exigem justificativa técnica, análise de impacto e registro em `docs/TECHNICAL_DECISIONS.md`.
4. **Fidelidade de Escopo:** O Developer não deve modificar funcionalidades ou arquivos fora do escopo aprovado.
5. **Evidências de QA:** O QA Engineer deve apresentar evidências objetivas dos testes executados (comandos, saídas, cenários verificados).
6. **Revisão Substantiva:** O Code Reviewer deve procurar problemas reais (bugs, falhas de lógica, segurança, acoplamento, escopo), evitando sugestões meramente estéticas.
7. **Segurança Contextualizada:** O Security Engineer deve priorizar vulnerabilidades relevantes ao contexto do VIRA CHAVE (especialmente LGPD, proteção de dados de adolescentes e controle de acesso entre perfis).
8. **Coerência Documental:** O Documentation Engineer deve manter a documentação estritamente coerente com o código e com as decisões aprovadas.
9. **Restrições Operacionais:** Nenhum agente pode introduzir dependências, executar migrações destrutivas ou alterar dados reais sem autorização explícita.
10. **Resolução de Divergências:** Divergências técnicas devem ser apresentadas ao Tech Lead com argumentos objetivos e consequências claras.

---

## 2. Princípios de Desenvolvimento e Privacidade (LGPD)

- **Minimização de Dados:** Coletar apenas os dados estritamente necessários para a jornada educacional.
- **Proteção de Adolescentes:** Tratar qualquer dado pessoal ou portfólio de estudante com controles explícitos de acesso e visibilidade.
- **Simplicidade:** Preferir soluções convencionais, legíveis e bem testadas em vez de abstrações prematuras.
- **Sem Suposições:** Não inventar requisitos de negócio, campos ou regras técnicas quando houver ambiguidade — escalar ao Tech Lead.

---

## 3. Padrão de Commits (Obrigatório — `ADR-005`)

Todos os commits do repositório Git **devem** seguir o padrão **Conventional Commits**:

```text
<tipo>[escopo opcional]: <descrição curta no imperativo>
```

**Tipos permitidos:**
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: alterações apenas em documentação
- `chore`: tarefas de manutenção, configuração ou build sem impacto em produção
- `refactor`: refatoração de código sem alterar comportamento nem corrigir bug
- `test`: adição ou ajuste de testes
- `ci`: alterações em pipelines de CI/CD ou scripts de deploy
- `build`: alterações em dependências ou sistema de build
- `style`: formatação/espaçamento sem alteração de lógica

**Exemplos válidos:**
- `feat(descobrir): adicionar questionário inicial de interesses`
- `fix(auth): corrigir validação de perfil de educador`
- `docs: registrar stack aprovada e padrão de commits`

---

## 4. Padrões Específicos de Código e Fluxo

- **Stack aprovada:** Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Zod, Recharts, PostgreSQL + Prisma ORM.
- **Guia de estilo e lint (ESLint/Prettier):** Pendente de configuração inicial do projeto Next.js.
- **Comandos oficiais de build e execução de testes:** Pendente de criação do `package.json`.
- **Estratégia de branches e proteção da `main`:** Pendente de decisão (recomendado: PRs para `main` acionando deploy automático no Ubuntu Server).
