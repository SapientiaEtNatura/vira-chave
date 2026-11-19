import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  calculateProvenPractice,
  resolvePublicReadinessStatus,
  type PublicReadinessLabel,
} from "@/lib/discovery/readiness";
import { validateExternalUrlStructure } from "@/lib/link-checker";
import { hashShareToken } from "@/lib/portfolio/share-token";
import {
  deleteStoredFile,
  FileValidationError,
  MAX_STUDENT_EVIDENCE_FILES,
  saveEvidenceFile,
  type SavedEvidenceFile,
} from "@/lib/storage/local-files";

export const MIN_PROJECT_TITLE_LENGTH = 2;
export const MAX_PROJECT_TITLE_LENGTH = 150;
export const MAX_PROJECT_SUMMARY_LENGTH = 300;
export const MIN_PROJECT_REFLECTION_LENGTH = 10;
export const MAX_PROJECT_REFLECTION_LENGTH = 5000;
export const MAX_PROJECT_EXTERNAL_URL_LENGTH = 2048;

export const createPortfolioProjectSchema = z.object({
  title: z
    .string({ message: "Título inválido." })
    .trim()
    .min(
      MIN_PROJECT_TITLE_LENGTH,
      `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
    )
    .max(
      MAX_PROJECT_TITLE_LENGTH,
      `O título deve ter no máximo ${MAX_PROJECT_TITLE_LENGTH} caracteres.`,
    ),
  summary: z
    .string({ message: "Resumo inválido." })
    .trim()
    .max(
      MAX_PROJECT_SUMMARY_LENGTH,
      `O resumo deve ter no máximo ${MAX_PROJECT_SUMMARY_LENGTH} caracteres.`,
    )
    .optional(),
  reflection: z
    .string({ message: "Reflexão inválida." })
    .trim()
    .min(
      MIN_PROJECT_REFLECTION_LENGTH,
      `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
    )
    .max(
      MAX_PROJECT_REFLECTION_LENGTH,
      `A reflexão deve ter no máximo ${MAX_PROJECT_REFLECTION_LENGTH} caracteres.`,
    ),
  externalUrl: z
    .union([
      z
        .string({ message: "URL externa inválida." })
        .trim()
        .max(
          MAX_PROJECT_EXTERNAL_URL_LENGTH,
          `A URL externa deve ter no máximo ${MAX_PROJECT_EXTERNAL_URL_LENGTH} caracteres.`,
        ),
      z.null(),
    ])
    .optional(),
  isIncludedInShare: z
    .boolean({ message: "Valor de compartilhamento inválido." })
    .optional(),
});

export const updatePortfolioProjectSchema = z
  .object({
    title: z
      .string({ message: "Título inválido." })
      .trim()
      .min(
        MIN_PROJECT_TITLE_LENGTH,
        `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
      )
      .max(
        MAX_PROJECT_TITLE_LENGTH,
        `O título deve ter no máximo ${MAX_PROJECT_TITLE_LENGTH} caracteres.`,
      )
      .optional(),
    summary: z
      .string({ message: "Resumo inválido." })
      .trim()
      .max(
        MAX_PROJECT_SUMMARY_LENGTH,
        `O resumo deve ter no máximo ${MAX_PROJECT_SUMMARY_LENGTH} caracteres.`,
      )
      .optional(),
    reflection: z
      .string({ message: "Reflexão inválida." })
      .trim()
      .min(
        MIN_PROJECT_REFLECTION_LENGTH,
        `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
      )
      .max(
        MAX_PROJECT_REFLECTION_LENGTH,
        `A reflexão deve ter no máximo ${MAX_PROJECT_REFLECTION_LENGTH} caracteres.`,
      )
      .optional(),
    externalUrl: z
      .union([
        z
          .string({ message: "URL externa inválida." })
          .trim()
          .max(
            MAX_PROJECT_EXTERNAL_URL_LENGTH,
            `A URL externa deve ter no máximo ${MAX_PROJECT_EXTERNAL_URL_LENGTH} caracteres.`,
          ),
        z.null(),
      ])
      .optional(),
    isIncludedInShare: z
      .boolean({ message: "Valor de compartilhamento inválido." })
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.summary !== undefined ||
      data.reflection !== undefined ||
      data.externalUrl !== undefined ||
      data.isIncludedInShare !== undefined,
    { message: "Nenhuma alteração válida informada." },
  );

export class PortfolioServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PortfolioServiceError";
    this.status = status;
  }
}

export interface SharedPortfolioEvidenceFile {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SharedPortfolioProject {
  id: string;
  title: string;
  summary: string;
  reflection: string;
  externalUrl: string | null;
  challengeTitle: string | null;
  evidenceFiles: SharedPortfolioEvidenceFile[];
}

export interface SharedPortfolioReadinessArea {
  slug: string;
  name: string;
  affinityScore: number | null;
  provenScore: number;
  publicStatusLabel: PublicReadinessLabel;
  entryRoles: string[];
}

export interface SharedPortfolioReadinessSummary {
  completedCoursesCount: number;
  completedChallengesCount: number;
  totalProjectsCount: number;
  topAreas: SharedPortfolioReadinessArea[];
}

export interface SharedPortfolioView {
  studentDisplayName: string;
  projects: SharedPortfolioProject[];
  readinessSummary?: SharedPortfolioReadinessSummary | null;
}

export interface GenerateShareLinkResult {
  rawToken: string;
  createdAt: Date;
  includeReadiness: boolean;
}

type ShareReadPrismaClient = Pick<
  PrismaClient,
  "portfolioShareLink" | "portfolioProject"
> &
  Partial<
    Pick<PrismaClient, "discoveryResult" | "courseProgress" | "macroArea">
  >;

function parseScoresRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const parsed: Record<string, number> = {};
  for (const [slug, value] of Object.entries(raw)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      parsed[slug] = value;
    }
  }
  return parsed;
}

async function buildSharedReadinessSummary(
  studentId: string,
  sharedChallengeSlugs: string[],
  sharedProjectsCount: number,
  prismaClient: ShareReadPrismaClient,
): Promise<SharedPortfolioReadinessSummary | null> {
  const [latestDiscovery, completedCourses, macroAreas] = await Promise.all([
    prismaClient.discoveryResult
      ? prismaClient.discoveryResult.findFirst({
          where: { studentId },
          orderBy: { completedAt: "desc" },
          select: {
            scoresJson: true,
            topAreas: true,
          },
        })
      : Promise.resolve(null),
    prismaClient.courseProgress
      ? prismaClient.courseProgress.findMany({
          where: {
            studentId,
            status: "CONCLUIDO",
          },
          select: {
            courseItem: {
              select: {
                track: {
                  select: {
                    macroArea: {
                      select: {
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    prismaClient.macroArea
      ? prismaClient.macroArea.findMany({
          select: {
            slug: true,
            name: true,
            entryRoles: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const completedCourseSlugs = completedCourses
    .map((item) => item.courseItem?.track?.macroArea?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);

  const areaBySlug = new Map(macroAreas.map((area) => [area.slug, area]));
  const provenPractice = calculateProvenPractice({
    completedCourseAreaSlugs: completedCourseSlugs,
    challengeProjectAreaSlugs: sharedChallengeSlugs,
    totalProjects: sharedProjectsCount,
    knownAreaSlugs: macroAreas.map((area) => area.slug),
  });

  if (latestDiscovery) {
    const scores = parseScoresRecord(latestDiscovery.scoresJson);
    const topAreas: SharedPortfolioReadinessArea[] = latestDiscovery.topAreas
      .slice(0, 3)
      .map((slug) => {
        const area = areaBySlug.get(slug);
        const provenScore = provenPractice.byArea[slug]?.score ?? 0;
        return {
          slug,
          name: area?.name ?? slug,
          affinityScore: typeof scores[slug] === "number" ? scores[slug] : null,
          provenScore,
          publicStatusLabel: resolvePublicReadinessStatus(provenScore),
          entryRoles: area?.entryRoles ?? [],
        };
      });

    return {
      completedCoursesCount: provenPractice.totalCompletedCourses,
      completedChallengesCount: provenPractice.totalChallengeProjects,
      totalProjectsCount: provenPractice.totalProjects,
      topAreas,
    };
  }

  const provenTopEntries = Object.entries(provenPractice.byArea)
    .filter(([, metrics]) => metrics.score > 0)
    .sort((a, b) => {
      const diff = b[1].score - a[1].score;
      return diff !== 0 ? diff : a[0].localeCompare(b[0]);
    })
    .slice(0, 3);

  if (provenTopEntries.length === 0) {
    return null;
  }

  const topAreas: SharedPortfolioReadinessArea[] = provenTopEntries.map(
    ([slug, metrics]) => {
      const area = areaBySlug.get(slug);
      return {
        slug,
        name: area?.name ?? slug,
        affinityScore: null,
        provenScore: metrics.score,
        publicStatusLabel: resolvePublicReadinessStatus(metrics.score),
        entryRoles: area?.entryRoles ?? [],
      };
    },
  );

  return {
    completedCoursesCount: provenPractice.totalCompletedCourses,
    completedChallengesCount: provenPractice.totalChallengeProjects,
    totalProjectsCount: provenPractice.totalProjects,
    topAreas,
  };
}

function normalizeOptionalExternalUrl(rawUrl?: string | null): string | null {
  const trimmed = (rawUrl ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_PROJECT_EXTERNAL_URL_LENGTH) {
    throw new PortfolioServiceError(
      `A URL externa deve ter no máximo ${MAX_PROJECT_EXTERNAL_URL_LENGTH} caracteres.`,
      400,
    );
  }

  const check = validateExternalUrlStructure(trimmed);
  if (!check.safe || !check.parsed) {
    throw new PortfolioServiceError(
      check.reason ?? "Informe uma URL externa válida (ex.: https://...).",
      400,
    );
  }

  return check.parsed.toString();
}

function buildSummaryFromReflection(reflection: string): string {
  const singleLine = reflection.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 160) {
    return singleLine;
  }
  return `${singleLine.slice(0, 157)}...`;
}

/**
 * Revoga todos os links de compartilhamento ativos de um estudante.
 */
export async function revokeShareLinks(
  studentId: string,
  prismaClient: Pick<PrismaClient, "portfolioShareLink"> = prisma,
) {
  return prismaClient.portfolioShareLink.updateMany({
    where: {
      studentId,
      active: true,
    },
    data: {
      active: false,
      revokedAt: new Date(),
    },
  });
}

/**
 * Atualiza a preferência de exibição do Cartão de Prontidão no link ativo
 * sem alterar ou revogar o `tokenHash`.
 */
export async function updateShareLinkPreferences(
  studentId: string,
  includeReadiness: boolean,
  prismaClient: Pick<PrismaClient, "portfolioShareLink"> = prisma,
): Promise<{ updated: boolean; includeReadiness: boolean }> {
  const result = await prismaClient.portfolioShareLink.updateMany({
    where: {
      studentId,
      active: true,
      revokedAt: null,
    },
    data: {
      includeReadiness,
    },
  });

  return {
    updated: result.count > 0,
    includeReadiness,
  };
}

/**
 * Revoga links ativos anteriores do estudante e gera um novo link de compartilhamento,
 * armazenando apenas o hash SHA-256 do token no banco.
 */
export async function generateShareLink(
  studentId: string,
  prismaClient: Pick<
    PrismaClient,
    "portfolioShareLink" | "$transaction"
  > = prisma,
  options?: { includeReadiness?: boolean },
): Promise<GenerateShareLinkResult> {
  const rawToken = crypto.randomBytes(24).toString("base64url");
  const tokenHash = hashShareToken(rawToken);
  const now = new Date();
  const includeReadiness = Boolean(options?.includeReadiness);

  const created = await prismaClient.$transaction(async (tx) => {
    await tx.portfolioShareLink.updateMany({
      where: {
        studentId,
        active: true,
      },
      data: {
        active: false,
        revokedAt: now,
      },
    });

    return tx.portfolioShareLink.create({
      data: {
        studentId,
        tokenHash,
        active: true,
        includeReadiness,
      },
      select: {
        createdAt: true,
        includeReadiness: true,
      },
    });
  });

  return {
    rawToken,
    createdAt: created.createdAt,
    includeReadiness: created.includeReadiness ?? includeReadiness,
  };
}

/**
 * Retorna a visão pública somente-leitura do portfólio para um token ativo,
 * contendo apenas projetos com `isIncludedInShare: true` e zero dados pessoais (PII).
 */
export async function getSharedPortfolioByToken(
  rawToken: string,
  prismaClient: ShareReadPrismaClient = prisma,
): Promise<SharedPortfolioView | null> {
  const trimmedToken = rawToken?.trim();
  if (!trimmedToken) {
    return null;
  }

  const tokenHash = hashShareToken(trimmedToken);
  const shareLink = await prismaClient.portfolioShareLink.findUnique({
    where: { tokenHash },
    select: {
      studentId: true,
      active: true,
      revokedAt: true,
      includeReadiness: true,
      student: {
        select: {
          name: true,
          status: true,
        },
      },
    },
  });

  if (
    !shareLink ||
    !shareLink.active ||
    shareLink.revokedAt !== null ||
    shareLink.student?.status !== "ACTIVE"
  ) {
    return null;
  }

  const projects = await prismaClient.portfolioProject.findMany({
    where: {
      studentId: shareLink.studentId,
      isIncludedInShare: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      reflection: true,
      externalUrl: true,
      challenge: {
        select: {
          title: true,
          macroArea: {
            select: {
              slug: true,
            },
          },
        },
      },
      evidenceFiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });

  const mappedProjects: SharedPortfolioProject[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    summary: project.summary,
    reflection: project.reflection,
    externalUrl: project.externalUrl,
    challengeTitle: project.challenge?.title ?? null,
    evidenceFiles: project.evidenceFiles.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
  }));

  if (shareLink.includeReadiness !== true) {
    return {
      studentDisplayName: shareLink.student.name,
      projects: mappedProjects,
      readinessSummary: null,
    };
  }

  const sharedChallengeSlugs = projects
    .map((project) => project.challenge?.macroArea?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);

  const readinessSummary = await buildSharedReadinessSummary(
    shareLink.studentId,
    sharedChallengeSlugs,
    projects.length,
    prismaClient,
  );

  return {
    studentDisplayName: shareLink.student.name,
    projects: mappedProjects,
    readinessSummary,
  };
}

export interface CreatePortfolioProjectInput {
  studentId: string;
  title: string;
  summary?: string | null;
  reflection: string;
  externalUrl?: string | null;
  isIncludedInShare?: boolean;
  file?: File | null;
}

export async function createPortfolioProject(
  input: CreatePortfolioProjectInput,
  deps: {
    prismaClient?: PrismaClient;
    saveFile?: (file: File, ownerId: string) => Promise<SavedEvidenceFile>;
    deleteFile?: (storageKey: string) => Promise<void>;
  } = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const saveFile = deps.saveFile ?? saveEvidenceFile;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const parsed = createPortfolioProjectSchema.safeParse({
    title: input.title,
    summary: input.summary,
    reflection: input.reflection,
    externalUrl: input.externalUrl,
    isIncludedInShare: input.isIncludedInShare,
  });

  if (!parsed.success) {
    throw new PortfolioServiceError(
      parsed.error.issues[0]?.message ?? "Dados do projeto inválidos.",
      400,
    );
  }

  const trimmedTitle = parsed.data.title;
  const trimmedReflection = parsed.data.reflection;
  const trimmedSummary = parsed.data.summary ?? "";
  const projectSummary =
    trimmedSummary || buildSummaryFromReflection(trimmedReflection);
  const normalizedUrl = normalizeOptionalExternalUrl(parsed.data.externalUrl);
  const isIncludedInShare = parsed.data.isIncludedInShare ?? true;

  let savedFile: SavedEvidenceFile | null = null;
  if (input.file && input.file.size > 0) {
    if (typeof prismaClient.evidenceFile?.count === "function") {
      const existingFileCount = await prismaClient.evidenceFile.count({
        where: { project: { studentId: input.studentId } },
      });
      if (existingFileCount >= MAX_STUDENT_EVIDENCE_FILES) {
        throw new PortfolioServiceError(
          "Limite máximo de arquivos atingido na conta.",
          400,
        );
      }
    }

    try {
      savedFile = await saveFile(input.file, input.studentId);
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw new PortfolioServiceError(error.message, error.status);
      }
      throw error;
    }
  }

  try {
    return await prismaClient.$transaction(async (tx) => {
      const project = await tx.portfolioProject.create({
        data: {
          studentId: input.studentId,
          title: trimmedTitle,
          summary: projectSummary,
          reflection: trimmedReflection,
          externalUrl: normalizedUrl,
          isIncludedInShare,
        },
        include: {
          challenge: {
            select: { title: true },
          },
          evidenceFiles: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
        },
      });

      if (savedFile) {
        const evidence = await tx.evidenceFile.create({
          data: {
            projectId: project.id,
            storageKey: savedFile.storageKey,
            originalName: savedFile.originalName,
            mimeType: savedFile.mimeType,
            sizeBytes: savedFile.sizeBytes,
          },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        });
        project.evidenceFiles.push(evidence);
      }

      return project;
    });
  } catch (error) {
    if (savedFile) {
      await deleteFile(savedFile.storageKey).catch(() => undefined);
    }
    throw error;
  }
}

export interface UpdatePortfolioProjectInput {
  title?: string;
  summary?: string;
  reflection?: string;
  externalUrl?: string | null;
  isIncludedInShare?: boolean;
}

export async function updatePortfolioProject(
  studentId: string,
  projectId: string,
  input: UpdatePortfolioProjectInput,
  prismaClient: PrismaClient = prisma,
) {
  const existing = await prismaClient.portfolioProject.findFirst({
    where: {
      id: projectId,
      studentId,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      reflection: true,
      externalUrl: true,
      isIncludedInShare: true,
    },
  });

  if (!existing) {
    throw new PortfolioServiceError("Projeto não encontrado.", 404);
  }

  const nextData: {
    title?: string;
    summary?: string;
    reflection?: string;
    externalUrl?: string | null;
    isIncludedInShare?: boolean;
  } = {};

  if (input.title !== undefined) {
    const trimmedTitle = input.title.trim();
    if (trimmedTitle.length < MIN_PROJECT_TITLE_LENGTH) {
      throw new PortfolioServiceError(
        `Informe um título com pelo menos ${MIN_PROJECT_TITLE_LENGTH} caracteres.`,
        400,
      );
    }
    if (trimmedTitle.length > MAX_PROJECT_TITLE_LENGTH) {
      throw new PortfolioServiceError(
        `O título deve ter no máximo ${MAX_PROJECT_TITLE_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.title = trimmedTitle;
  }

  if (input.reflection !== undefined) {
    const trimmedReflection = input.reflection.trim();
    if (trimmedReflection.length < MIN_PROJECT_REFLECTION_LENGTH) {
      throw new PortfolioServiceError(
        `Descreva sua reflexão com pelo menos ${MIN_PROJECT_REFLECTION_LENGTH} caracteres.`,
        400,
      );
    }
    if (trimmedReflection.length > MAX_PROJECT_REFLECTION_LENGTH) {
      throw new PortfolioServiceError(
        `A reflexão deve ter no máximo ${MAX_PROJECT_REFLECTION_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.reflection = trimmedReflection;
  }

  if (input.summary !== undefined) {
    const trimmedSummary = input.summary.trim();
    if (trimmedSummary.length > MAX_PROJECT_SUMMARY_LENGTH) {
      throw new PortfolioServiceError(
        `O resumo deve ter no máximo ${MAX_PROJECT_SUMMARY_LENGTH} caracteres.`,
        400,
      );
    }
    nextData.summary =
      trimmedSummary ||
      buildSummaryFromReflection(nextData.reflection ?? existing.reflection);
  }

  if (input.externalUrl !== undefined) {
    nextData.externalUrl = normalizeOptionalExternalUrl(input.externalUrl);
  }

  if (input.isIncludedInShare !== undefined) {
    nextData.isIncludedInShare = Boolean(input.isIncludedInShare);
  }

  if (Object.keys(nextData).length === 0) {
    throw new PortfolioServiceError("Nenhuma alteração válida informada.", 400);
  }

  return prismaClient.portfolioProject.update({
    where: { id: existing.id },
    data: nextData,
    include: {
      challenge: {
        select: { title: true },
      },
      evidenceFiles: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });
}

export async function deletePortfolioProject(
  studentId: string,
  projectId: string,
  deps: {
    prismaClient?: PrismaClient;
    deleteFile?: (storageKey: string) => Promise<void>;
  } = {},
) {
  const prismaClient = deps.prismaClient ?? prisma;
  const deleteFile = deps.deleteFile ?? deleteStoredFile;

  const existing = await prismaClient.portfolioProject.findFirst({
    where: {
      id: projectId,
      studentId,
    },
    select: {
      id: true,
      evidenceFiles: {
        select: {
          storageKey: true,
        },
      },
    },
  });

  if (!existing) {
    throw new PortfolioServiceError("Projeto não encontrado.", 404);
  }

  await prismaClient.portfolioProject.delete({
    where: { id: existing.id },
  });

  await Promise.all(
    existing.evidenceFiles.map((file) =>
      deleteFile(file.storageKey).catch(() => undefined),
    ),
  );
}
