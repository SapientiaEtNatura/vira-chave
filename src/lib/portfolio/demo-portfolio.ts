import type { SharedPortfolioView } from "@/lib/portfolio/portfolio-service";

export const DEMO_PORTFOLIO_TOKEN = "exemplo";

export const DEMO_PORTFOLIO: SharedPortfolioView = {
  studentDisplayName: "Marina Oliveira",
  projects: [
    {
      id: "demo-projeto-01",
      title: "Guia digital para feira de profissões da escola",
      summary:
        "Mapeamento de áreas profissionais com entrevistas curtas e roteiro interativo para estudantes do 1º ano.",
      reflection:
        "Organizar o guia me ajudou a comparar carreiras que eu nem conhecia e apresentar ideias com clareza para minha turma.",
      externalUrl: null,
      challengeTitle: "Feira de Profissões",
      evidenceFiles: [
        {
          id: "demo-file-01",
          originalName: "guia-profissoes.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1_240_000,
        },
      ],
    },
    {
      id: "demo-projeto-02",
      title: "Mapa de pontos de reciclagem do bairro",
      summary:
        "Levantamento de ecopontos próximos à escola com orientações sobre descarte correto de eletrônicos e papel.",
      reflection:
        "Entrevistar moradores e cruzar os endereços me mostrou como dados simples podem resolver um problema real da comunidade.",
      externalUrl: null,
      challengeTitle: "Sustentabilidade Local",
      evidenceFiles: [
        {
          id: "demo-file-02",
          originalName: "roteiro-coleta.png",
          mimeType: "image/png",
          sizeBytes: 480_000,
        },
      ],
    },
  ],
};
