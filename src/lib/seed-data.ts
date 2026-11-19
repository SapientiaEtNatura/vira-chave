import {
  deriveQuestionAreaWeights,
  type DiscoveryQuestionOption,
} from "./discovery/types";

export interface SeedMacroArea {
  id: string;
  name: string;
  slug: string;
  description: string;
  entryRoles: string[];
}

export interface SeedQuestion {
  id: string;
  order: number;
  prompt: string;
  options: DiscoveryQuestionOption[];
  weightsByArea: Record<string, number>;
}

export interface SeedCourseItem {
  id: string;
  title: string;
  providerName: string;
  externalUrl: string;
  order: number;
}

export interface SeedTrack {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
  courses: SeedCourseItem[];
}

export interface SeedChallenge {
  id: string;
  macroAreaId: string;
  title: string;
  description: string;
  published: boolean;
}

export const LEGACY_SEED_QUESTION_IDS = [
  "q-11",
  "q-12",
  "q-13",
  "q-14",
  "q-15",
] as const;

export const SEED_MACRO_AREAS: SeedMacroArea[] = [
  {
    id: "area-tecnologia-dados",
    name: "Tecnologia e Dados",
    slug: "tecnologia-dados",
    description:
      "Lógica de programação, desenvolvimento web, análise de dados e automação de processos digitais.",
    entryRoles: [
      "Jovem Aprendiz em Suporte de TI",
      "Auxiliar de Dados e Planilhas",
      "Estagiário(a) de Desenvolvimento Web",
      "Assistente de Automação e Sistemas",
    ],
  },
  {
    id: "area-design-criacao",
    name: "Design e Criação Digital",
    slug: "design-criacao",
    description:
      "Design gráfico, experiência do usuário (UX/UI), prototipação e produção visual para produtos digitais.",
    entryRoles: [
      "Jovem Aprendiz em Design Gráfico",
      "Assistente de Criação Digital",
      "Estagiário(a) de UI/UX Design",
      "Auxiliar de Arte e Diagramação",
    ],
  },
  {
    id: "area-negocios-empreendedorismo",
    name: "Negócios e Empreendedorismo",
    slug: "negocios-empreendedorismo",
    description:
      "Planejamento financeiro, gestão de projetos, validação de ideias e liderança de iniciativas.",
    entryRoles: [
      "Jovem Aprendiz Administrativo",
      "Auxiliar de Controle Financeiro",
      "Assistente de Operações e Vendas",
      "Apoio em Gestão de Projetos",
    ],
  },
  {
    id: "area-comunicacao-conteudo",
    name: "Comunicação e Conteúdo",
    slug: "comunicacao-conteudo",
    description:
      "Redação, storytelling, produção multimídia, oratória e estratégias de comunicação digital.",
    entryRoles: [
      "Jovem Aprendiz em Comunicação",
      "Assistente de Mídias Sociais",
      "Auxiliar de Redação e Roteiro",
      "Atendimento e Relacionamento Digital",
    ],
  },
  {
    id: "area-sustentabilidade-impacto",
    name: "Sustentabilidade e Impacto Social",
    slug: "sustentabilidade-impacto",
    description:
      "Projetos comunitários, educação ambiental, cidadania ativa e soluções para desafios locais.",
    entryRoles: [
      "Jovem Aprendiz em Projetos Sociais",
      "Auxiliar de Educação Ambiental",
      "Assistente de Ações Comunitárias",
      "Apoio em Sustentabilidade Local",
    ],
  },
  {
    id: "area-saude-bem-estar",
    name: "Saúde, Ciência e Bem-Estar",
    slug: "saude-bem-estar",
    description:
      "Divulgação científica, promoção da saúde, hábitos saudáveis e investigação aplicada ao cotidiano.",
    entryRoles: [
      "Jovem Aprendiz em Promoção da Saúde",
      "Auxiliar Administrativo em Clínica ou UBS",
      "Assistente de Bem-Estar e Qualidade de Vida",
      "Apoio em Divulgação Científica",
    ],
  },
];

function createSeedQuestion(
  id: string,
  order: number,
  prompt: string,
  options: DiscoveryQuestionOption[],
): SeedQuestion {
  return {
    id,
    order,
    prompt,
    options,
    weightsByArea: deriveQuestionAreaWeights(options),
  };
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  createSeedQuestion(
    "q-01",
    1,
    "A escola vai lançar um evento aberto ao bairro e pediu ajuda dos estudantes. Qual missão você puxa primeiro?",
    [
      {
        id: "a",
        label: "Montar o formulário digital de inscrições e organizar a lista de presença em planilha.",
        weightsByArea: { "tecnologia-dados": 3, "negocios-empreendedorismo": 1 },
      },
      {
        id: "b",
        label: "Criar os cartazes, a paleta de cores e o layout dos convites para ficar fácil de entender.",
        weightsByArea: { "design-criacao": 3, "comunicacao-conteudo": 1 },
      },
      {
        id: "c",
        label: "Definir o orçamento, dividir tarefas da equipe e combinar horários com os parceiros.",
        weightsByArea: { "negocios-empreendedorismo": 3 },
      },
      {
        id: "d",
        label: "Escrever os textos de divulgação, gravar um vídeo curto e apresentar o evento nos grupos.",
        weightsByArea: { "comunicacao-conteudo": 3, "design-criacao": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-02",
    2,
    "Um pequeno comércio da sua rua quer melhorar o atendimento e o impacto no bairro. Como você prefere ajudar?",
    [
      {
        id: "a",
        label: "Configurar um catálogo online simples ou automatizar pedidos pelo celular.",
        weightsByArea: { "tecnologia-dados": 3, "negocios-empreendedorismo": 1 },
      },
      {
        id: "b",
        label: "Redesenhando o cardápio e a sinalização da loja para chamar atenção com clareza.",
        weightsByArea: { "design-criacao": 3 },
      },
      {
        id: "c",
        label: "Sugerir embalagens reutilizáveis e pontos de coleta para reduzir lixo na rua.",
        weightsByArea: { "sustentabilidade-impacto": 3, "negocios-empreendedorismo": 1 },
      },
      {
        id: "d",
        label: "Orientar sobre higiene, rotulagem clara de ingredientes e cuidados com quem consome.",
        weightsByArea: { "saude-bem-estar": 3, "comunicacao-conteudo": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-03",
    3,
    "Em um projeto em grupo sobre problemas reais da sua cidade, qual parte faz mais sentido para você?",
    [
      {
        id: "a",
        label: "Calcular custos, viabilidade e como manter a iniciativa funcionando ao longo do tempo.",
        weightsByArea: { "negocios-empreendedorismo": 3 },
      },
      {
        id: "b",
        label: "Entrevistar moradores e transformar as histórias em uma apresentação envolvente.",
        weightsByArea: { "comunicacao-conteudo": 3, "sustentabilidade-impacto": 1 },
      },
      {
        id: "c",
        label: "Mapear áreas afetadas no bairro e propor mutirões ou ações práticas na comunidade.",
        weightsByArea: { "sustentabilidade-impacto": 3 },
      },
      {
        id: "d",
        label: "Investigar como o problema afeta o bem-estar físico ou emocional das pessoas.",
        weightsByArea: { "saude-bem-estar": 3, "sustentabilidade-impacto": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-04",
    4,
    "Você ganhou duas horas livres no laboratório de informática para explorar um tema novo. O que escolhe fazer?",
    [
      {
        id: "a",
        label: "Testar lógica de programação, criar uma página web ou explorar gráficos em planilhas.",
        weightsByArea: { "tecnologia-dados": 3 },
      },
      {
        id: "b",
        label: "Pesquisar ideias de renda extra, comparar preços e montar um plano de negócio simples.",
        weightsByArea: { "negocios-empreendedorismo": 3, "tecnologia-dados": 1 },
      },
      {
        id: "c",
        label: "Escrever um roteiro de podcast ou produzir uma série de posts educativos.",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
      {
        id: "d",
        label: "Levantar projetos ambientais de outras cidades que poderiam ser adaptados na escola.",
        weightsByArea: { "sustentabilidade-impacto": 3, "comunicacao-conteudo": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-05",
    5,
    "No seu primeiro emprego como Jovem Aprendiz, qual atividade do dia a dia você sentiria mais vontade de assumir?",
    [
      {
        id: "a",
        label: "Preparar apresentações bonitas, ícones e materiais visuais para a equipe usar.",
        weightsByArea: { "design-criacao": 3 },
      },
      {
        id: "b",
        label: "Acompanhar metas, prazos, notas e organização das demandas do setor.",
        weightsByArea: { "negocios-empreendedorismo": 3, "tecnologia-dados": 1 },
      },
      {
        id: "c",
        label: "Responder dúvidas de clientes ou colegas com textos claros e atendimento acolhedor.",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
      {
        id: "d",
        label: "Organizar ações internas de qualidade de vida, ergonomia e prevenção no trabalho.",
        weightsByArea: { "saude-bem-estar": 3, "sustentabilidade-impacto": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-06",
    6,
    "Um aplicativo usado pelos estudantes está confuso e ninguém consegue terminar o cadastro. Qual é a sua reação imediata?",
    [
      {
        id: "a",
        label: "Testar os erros passo a passo para descobrir onde o sistema trava e registrar o bug.",
        weightsByArea: { "tecnologia-dados": 3 },
      },
      {
        id: "b",
        label: "Esboçar novas telas com botões maiores, ordem lógica e visual mais agradável.",
        weightsByArea: { "design-criacao": 3, "tecnologia-dados": 1 },
      },
      {
        id: "c",
        label: "Medir quantas pessoas desistiram e priorizar as mudanças que dão mais resultado.",
        weightsByArea: { "negocios-empreendedorismo": 3, "tecnologia-dados": 1 },
      },
      {
        id: "d",
        label: "Garantir que o app funcione também em celulares simples e para quem tem pouca internet.",
        weightsByArea: { "sustentabilidade-impacto": 3, "design-criacao": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-07",
    7,
    "Sua turma decidiu criar um canal informativo semanal para estudantes e famílias. Onde você mais se destaca?",
    [
      {
        id: "a",
        label: "Configurando a ferramenta de publicação, links e métricas de acesso do canal.",
        weightsByArea: { "tecnologia-dados": 3, "comunicacao-conteudo": 1 },
      },
      {
        id: "b",
        label: "Criando a identidade visual, capa e modelos de postagens para manter padrão.",
        weightsByArea: { "design-criacao": 3 },
      },
      {
        id: "c",
        label: "Entrevistando convidados, editando falas e escrevendo chamadas fáceis de ler.",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
      {
        id: "d",
        label: "Checando fontes científicas e trazendo dicas práticas de sono, alimentação e estudo.",
        weightsByArea: { "saude-bem-estar": 3, "comunicacao-conteudo": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-08",
    8,
    "Surgiu um desafio na escola: reduzir o desperdício de energia, água e papel ao longo do mês. Como você colabora?",
    [
      {
        id: "a",
        label: "Registrando as leituras semanais em tabela e criando gráficos para acompanhar a queda.",
        weightsByArea: { "tecnologia-dados": 3, "sustentabilidade-impacto": 1 },
      },
      {
        id: "b",
        label: "Negociando metas entre as salas e organizando um cronograma de recompensas.",
        weightsByArea: { "negocios-empreendedorismo": 3 },
      },
      {
        id: "c",
        label: "Mapeando os pontos críticos do prédio e coordenando os times de fiscalização.",
        weightsByArea: { "sustentabilidade-impacto": 3 },
      },
      {
        id: "d",
        label: "Avaliando como ventilação, iluminação e água limpa impactam o conforto e a saúde na aula.",
        weightsByArea: { "saude-bem-estar": 3, "sustentabilidade-impacto": 1 },
      },
    ],
  ),
  createSeedQuestion(
    "q-09",
    9,
    "Uma ONG do bairro pediu apoio para uma campanha de conscientização no sábado. Que papel combina mais com você?",
    [
      {
        id: "a",
        label: "Produzir faixas, folhetos e cards visuais que chamem atenção de longe.",
        weightsByArea: { "design-criacao": 3, "comunicacao-conteudo": 1 },
      },
      {
        id: "b",
        label: "Acolher os visitantes, explicar os objetivos da campanha e registrar depoimentos.",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
      {
        id: "c",
        label: "Articular moradores e voluntários para cuidar de praças e coleta seletiva.",
        weightsByArea: { "sustentabilidade-impacto": 3 },
      },
      {
        id: "d",
        label: "Apoiar a tenda de orientação sobre prevenção, hidratação e hábitos saudáveis.",
        weightsByArea: { "saude-bem-estar": 3 },
      },
    ],
  ),
  createSeedQuestion(
    "q-10",
    10,
    "Pensando no resultado do seu próximo trabalho escolar ou projeto pessoal, o que mais te deixa orgulhoso(a)?",
    [
      {
        id: "a",
        label: "Ver algo técnico funcionando sem falhas — um código, planilha automática ou sistema.",
        weightsByArea: { "tecnologia-dados": 3 },
      },
      {
        id: "b",
        label: "Olhar para a entrega final bem acabada, harmônica e agradável para quem usa.",
        weightsByArea: { "design-criacao": 3 },
      },
      {
        id: "c",
        label: "Perceber que a ideia saiu do papel no prazo, dentro do orçamento e gerou valor real.",
        weightsByArea: { "negocios-empreendedorismo": 3 },
      },
      {
        id: "d",
        label: "Ouvir que a explicação ficou tão clara que ajudou outras pessoas a agir.",
        weightsByArea: { "comunicacao-conteudo": 3 },
      },
    ],
  ),
];

export const SEED_TRACKS: SeedTrack[] = [
  {
    id: "track-tech-fundamentos",
    macroAreaId: "area-tecnologia-dados",
    title: "Primeiros Passos em Programação e Web",
    description:
      "Base gratuita de lógica de programação, HTML/CSS e versionamento para construir seus primeiros projetos digitais.",
    published: true,
    courses: [
      {
        id: "course-tech-1",
        title: "Algoritmos e Lógica de Programação",
        providerName: "Curso em Vídeo",
        externalUrl: "https://www.cursoemvideo.com/curso/curso-de-algoritmo/",
        order: 1,
      },
      {
        id: "course-tech-2",
        title: "HTML5 e CSS3: Módulo 1",
        providerName: "Curso em Vídeo",
        externalUrl: "https://www.cursoemvideo.com/curso/html5-css3-modulo1/",
        order: 2,
      },
      {
        id: "course-tech-3",
        title: "Fundamentos de Lógica de Programação",
        providerName: "Fundação Bradesco",
        externalUrl: "https://www.ev.org.br/cursos/fundamentos-de-logica-de-programacao",
        order: 3,
      },
    ],
  },
  {
    id: "track-design-digital",
    macroAreaId: "area-design-criacao",
    title: "Design Visual e Prototipação Digital",
    description:
      "Fundamentos de composição, identidade visual e criação de interfaces acessíveis com ferramentas gratuitas.",
    published: true,
    courses: [
      {
        id: "course-design-1",
        title: "Design Gráfico na Prática",
        providerName: "Fundação Bradesco",
        externalUrl: "https://www.ev.org.br/cursos",
        order: 1,
      },
      {
        id: "course-design-2",
        title: "Introdução ao UX Design e Prototipação",
        providerName: "SEBRAE",
        externalUrl: "https://sebrae.com.br/sites/PortalSebrae/cursosonline",
        order: 2,
      },
    ],
  },
  {
    id: "track-negocios-jovem",
    macroAreaId: "area-negocios-empreendedorismo",
    title: "Empreendedorismo e Planejamento Financeiro",
    description:
      "Como tirar ideias do papel, organizar finanças pessoais e estruturar pequenos projetos com impacto.",
    published: true,
    courses: [
      {
        id: "course-negocios-1",
        title: "Aprender a Empreender",
        providerName: "SEBRAE",
        externalUrl: "https://sebrae.com.br/sites/PortalSebrae/cursosonline/aprender-a-empreender,b070b8a6a28bb610VgnVCM1000004c00210aRCRD",
        order: 1,
      },
      {
        id: "course-negocios-2",
        title: "Educação Financeira para Jovens",
        providerName: "FGV Educação Executiva",
        externalUrl: "https://educacao-executiva.fgv.br/cursos/gratuitos",
        order: 2,
      },
    ],
  },
  {
    id: "track-comunicacao-impacto",
    macroAreaId: "area-comunicacao-conteudo",
    title: "Comunicação Clara e Produção de Conteúdo",
    description:
      "Técnicas de escrita, apresentação de ideias e criação de narrativas digitais para projetos escolares e sociais.",
    published: true,
    courses: [
      {
        id: "course-com-1",
        title: "Comunicação Escrita e Oratória",
        providerName: "Fundação Bradesco",
        externalUrl: "https://www.ev.org.br/cursos/comunicacao-escrita",
        order: 1,
      },
      {
        id: "course-com-2",
        title: "Produção de Conteúdo Digital",
        providerName: "SEBRAE",
        externalUrl: "https://sebrae.com.br/sites/PortalSebrae/cursosonline",
        order: 2,
      },
    ],
  },
  {
    id: "track-sustentabilidade-impacto",
    macroAreaId: "area-sustentabilidade-impacto",
    title: "Sustentabilidade e Projetos de Impacto Local",
    description:
      "Fundamentos de economia circular, gestão ambiental e elaboração de ações comunitárias gratuitas para escola e bairro.",
    published: true,
    courses: [
      {
        id: "course-sust-1",
        title: "Sustentabilidade e Responsabilidade Socioambiental",
        providerName: "SEBRAE",
        externalUrl: "https://sebrae.com.br/sites/PortalSebrae/cursosonline",
        order: 1,
      },
      {
        id: "course-sust-2",
        title: "Gestão Ambiental e Impacto Social",
        providerName: "EV.G (Escola Virtual de Governo)",
        externalUrl: "https://www.escolavirtual.gov.br/catalogo",
        order: 2,
      },
    ],
  },
  {
    id: "track-saude-bem-estar",
    macroAreaId: "area-saude-bem-estar",
    title: "Promoção da Saúde, Ciência e Bem-Estar",
    description:
      "Bases gratuitas de prevenção, saúde coletiva, divulgação científica e hábitos saudáveis aplicados ao cotidiano.",
    published: true,
    courses: [
      {
        id: "course-saude-1",
        title: "Promoção da Saúde e Hábitos Saudáveis",
        providerName: "UNA-SUS",
        externalUrl: "https://www.unasus.gov.br/cursos",
        order: 1,
      },
      {
        id: "course-saude-2",
        title: "Postura Profissional e Qualidade de Vida",
        providerName: "Fundação Bradesco",
        externalUrl: "https://www.ev.org.br/cursos",
        order: 2,
      },
    ],
  },
];

export const SEED_CHALLENGES: SeedChallenge[] = [
  {
    id: "challenge-landing-comunidade",
    macroAreaId: "area-tecnologia-dados",
    title: "Página de Apresentação para um Projeto Escolar ou Local",
    description:
      "Crie uma página simples (em HTML/CSS ou protótipo navegável) apresentando um clube, iniciativa da escola ou pequeno comércio do bairro, explicando o problema que resolve e como entrar em contato.",
    published: true,
  },
  {
    id: "challenge-identidade-visual",
    macroAreaId: "area-design-criacao",
    title: "Kit Visual de Campanha Educativa",
    description:
      "Desenvolva um conjunto de 3 peças visuais (cartaz, card para redes sociais e folheto) sobre um tema relevante para estudantes, documentando escolha de cores, fontes e público-alvo.",
    published: true,
  },
  {
    id: "challenge-orcamento-projeto",
    macroAreaId: "area-negocios-empreendedorismo",
    title: "Plano Simples de Microprojeto ou Evento Escolar",
    description:
      "Estruture um plano de 1 página com objetivo, público, lista de recursos necessários, estimativa de custos e cronograma para um evento ou iniciativa estudantil.",
    published: true,
  },
  {
    id: "challenge-roteiro-campanha",
    macroAreaId: "area-comunicacao-conteudo",
    title: "Roteiro e Guia Informativo para Comunidade Escolar",
    description:
      "Escreva um texto claro e um roteiro de vídeo ou áudio de 1 minuto apresentando um projeto, serviço útil ou oportunidade para colegas e famílias do bairro.",
    published: true,
  },
  {
    id: "challenge-guia-sustentavel",
    macroAreaId: "area-sustentabilidade-impacto",
    title: "Mapeamento de Desafio Ambiental na Escola",
    description:
      "Observe um ponto de melhoria ambiental na sua escola ou bairro (descarte de resíduos, economia de água ou energia), registre evidências e proponha um plano de ação viável.",
    published: true,
  },
  {
    id: "challenge-jornal-bem-estar",
    macroAreaId: "area-saude-bem-estar",
    title: "Cartilha Prática de Saúde e Bem-Estar no Cotidiano",
    description:
      "Pesquise fontes científicas confiáveis e monte um guia simples com 5 hábitos de sono, alimentação ou bem-estar emocional aplicáveis à rotina de estudo e trabalho.",
    published: true,
  },
];
