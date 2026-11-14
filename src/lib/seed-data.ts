export interface SeedMacroArea {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface SeedQuestion {
  id: string;
  order: number;
  prompt: string;
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

export const SEED_MACRO_AREAS: SeedMacroArea[] = [
  {
    id: "area-tecnologia-dados",
    name: "Tecnologia e Dados",
    slug: "tecnologia-dados",
    description:
      "Lógica de programação, desenvolvimento web, análise de dados e automação de processos digitais.",
  },
  {
    id: "area-design-criacao",
    name: "Design e Criação Digital",
    slug: "design-criacao",
    description:
      "Design gráfico, experiência do usuário (UX/UI), prototipação e produção visual para produtos digitais.",
  },
  {
    id: "area-negocios-empreendedorismo",
    name: "Negócios e Empreendedorismo",
    slug: "negocios-empreendedorismo",
    description:
      "Planejamento financeiro, gestão de projetos, validação de ideias e liderança de iniciativas.",
  },
  {
    id: "area-comunicacao-conteudo",
    name: "Comunicação e Conteúdo",
    slug: "comunicacao-conteudo",
    description:
      "Redação, storytelling, produção multimídia, oratória e estratégias de comunicação digital.",
  },
  {
    id: "area-sustentabilidade-impacto",
    name: "Sustentabilidade e Impacto Social",
    slug: "sustentabilidade-impacto",
    description:
      "Projetos comunitários, educação ambiental, cidadania ativa e soluções para desafios locais.",
  },
  {
    id: "area-saude-bem-estar",
    name: "Saúde, Ciência e Bem-Estar",
    slug: "saude-bem-estar",
    description:
      "Divulgação científica, promoção da saúde, hábitos saudáveis e investigação aplicada ao cotidiano.",
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    id: "q-01",
    order: 1,
    prompt: "Gosto de resolver quebra-cabeças lógicos ou entender como aplicativos e sites funcionam por trás das telas.",
    weightsByArea: { "tecnologia-dados": 3, "design-criacao": 1 },
  },
  {
    id: "q-02",
    order: 2,
    prompt: "Presto atenção em cores, tipografia e na organização visual de cartazes, apresentações ou aplicativos.",
    weightsByArea: { "design-criacao": 3, "comunicacao-conteudo": 1 },
  },
  {
    id: "q-03",
    order: 3,
    prompt: "Tenho facilidade para organizar tarefas em grupo, definir metas e acompanhar o que cada pessoa precisa fazer.",
    weightsByArea: { "negocios-empreendedorismo": 3, "sustentabilidade-impacto": 1 },
  },
  {
    id: "q-04",
    order: 4,
    prompt: "Gosto de escrever textos, gravar vídeos, criar roteiros ou explicar ideias de forma clara para outras pessoas.",
    weightsByArea: { "comunicacao-conteudo": 3, "design-criacao": 1 },
  },
  {
    id: "q-05",
    order: 5,
    prompt: "Me incomodo com problemas do meu bairro ou escola e penso em ações práticas para melhorar a comunidade.",
    weightsByArea: { "sustentabilidade-impacto": 3, "negocios-empreendedorismo": 1 },
  },
  {
    id: "q-06",
    order: 6,
    prompt: "Tenho curiosidade sobre como o corpo humano, a alimentação ou a ciência explicam hábitos do dia a dia.",
    weightsByArea: { "saude-bem-estar": 3, "sustentabilidade-impacto": 1 },
  },
  {
    id: "q-07",
    order: 7,
    prompt: "Sinto satisfação em usar planilhas, gráficos ou dados numéricos para descobrir padrões e tomar decisões.",
    weightsByArea: { "tecnologia-dados": 2, "negocios-empreendedorismo": 2 },
  },
  {
    id: "q-08",
    order: 8,
    prompt: "Prefiro criar protótipos, desenhos ou maquetes visuais antes de partir para a execução final de um trabalho.",
    weightsByArea: { "design-criacao": 3, "tecnologia-dados": 1 },
  },
  {
    id: "q-09",
    order: 9,
    prompt: "Gosto de pesquisar preços, pensar em formas de gerar renda ou transformar uma ideia simples em um pequeno negócio.",
    weightsByArea: { "negocios-empreendedorismo": 3, "comunicacao-conteudo": 1 },
  },
  {
    id: "q-10",
    order: 10,
    prompt: "Costumo ajudar colegas traduzindo assuntos difíceis em exemplos simples, resumos ou apresentações.",
    weightsByArea: { "comunicacao-conteudo": 2, "saude-bem-estar": 1, "sustentabilidade-impacto": 1 },
  },
  {
    id: "q-11",
    order: 11,
    prompt: "Tenho interesse em temas como reciclagem, consumo consciente, energia limpa e preservação ambiental.",
    weightsByArea: { "sustentabilidade-impacto": 3, "saude-bem-estar": 1 },
  },
  {
    id: "q-12",
    order: 12,
    prompt: "Gosto de investigar causas de problemas de saúde ou bem-estar mental e compartilhar orientações confiáveis.",
    weightsByArea: { "saude-bem-estar": 3, "comunicacao-conteudo": 1 },
  },
  {
    id: "q-13",
    order: 13,
    prompt: "Quando surge um problema repetitivo no computador ou celular, procuro atalhos ou ferramentas para automatizar.",
    weightsByArea: { "tecnologia-dados": 3, "negocios-empreendedorismo": 1 },
  },
  {
    id: "q-14",
    order: 14,
    prompt: "Me sinto motivado(a) quando um projeto combina estética agradável com utilidade real para quem vai usar.",
    weightsByArea: { "design-criacao": 2, "tecnologia-dados": 1, "negocios-empreendedorismo": 1 },
  },
  {
    id: "q-15",
    order: 15,
    prompt: "Prefiro atividades em que posso testar uma hipótese na prática, observar resultados e ajustar o caminho.",
    weightsByArea: { "saude-bem-estar": 2, "tecnologia-dados": 1, "sustentabilidade-impacto": 1 },
  },
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
    id: "challenge-guia-sustentavel",
    macroAreaId: "area-sustentabilidade-impacto",
    title: "Mapeamento de Desafio Ambiental na Escola",
    description:
      "Observe um ponto de melhoria ambiental na sua escola ou bairro (descarte de resíduos, economia de água ou energia), registre evidências e proponha um plano de ação viável.",
    published: true,
  },
];
